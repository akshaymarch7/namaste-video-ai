import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { MongoClient } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { setupDatabase } from '../src/db/setup';
import { readAuthConfig } from '../src/auth/config';
import { createAuth } from '../src/auth/engine';
import { assertAuthReady, setupAuth } from '../src/auth/setup';
import { provisionUser, disableUser } from '../src/auth/operator';
import { handleSession, type SessionAction } from '../src/auth/http';
import { LoginLimited, reserveLogin } from '../src/auth/throttle';

let replica: MongoMemoryReplSet;
let client: MongoClient;
let dependencies: Parameters<typeof handleSession>[2];
let web: ChildProcess | undefined;
const config = { origin: 'http://127.0.0.1:3002', secure: false, secret: randomBytes(48).toString('base64url') };
const account = { email: 'tester@example.test', name: 'Local Tester', password: 'Fixture-only-password-937!' };
const dbName = 'namastevideo_auth_test';
before(async () => {
  replica = await MongoMemoryReplSet.create({ binary: { version: '8.0.17' }, replSet: { count: 1, ip: '127.0.0.1', storageEngine: 'wiredTiger' } });
  client = await new MongoClient(replica.getUri(), { promoteLongs: false, monitorCommands: true }).connect();
  const db = client.db(dbName);
  await setupDatabase(db);
  await setupAuth(db, client, config);
  await provisionUser(db, client, config, account);
  const auth = createAuth(db, client, config);
  dependencies = async () => ({ db, config, auth });
}, { timeout: 180_000 });
async function stopWeb() {
  if (web && web.exitCode === null) {
    const finished = new Promise<void>(resolve => web!.once('exit', () => resolve()));
    web.kill('SIGTERM'); await finished;
  }
}
after(async () => { await stopWeb(); await client?.close(); await replica?.stop(); });

function request(action: SessionAction, body: unknown = {}, cookie = '', origin: string | null = config.origin) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (origin !== null) headers.set('Origin', origin);
  if (cookie) headers.set('Cookie', cookie);
  return new Request(`${config.origin}/api/session${action === 'read' ? '' : `/${action}`}`, {
    method: action === 'read' ? 'GET' : 'POST', headers, ...(action === 'read' ? {} : { body: JSON.stringify(body) }),
  });
}
const call = (action: SessionAction, body: unknown = {}, cookie = '', origin: string | null = config.origin) => handleSession(request(action, body, cookie, origin), action, dependencies);
const cookies = (response: Response) => response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');

test('production requires HTTPS and a strong configured secret', () => {
  assert.throws(() => readAuthConfig({ BETTER_AUTH_SECRET: 'short' }));
  assert.throws(() => readAuthConfig({ BETTER_AUTH_SECRET: config.secret, BETTER_AUTH_URL: config.origin, NODE_ENV: 'production' }));
  assert.equal(readAuthConfig({ BETTER_AUTH_SECRET: config.secret, BETTER_AUTH_URL: 'https://video.example.test', NODE_ENV: 'production' }).secure, true);
});

test('provisioning is idempotent, does not log in, and links only the actual stored account', async () => {
  const { db } = await dependencies();
  const first = await provisionUser(db, client, config, account);
  const second = await provisionUser(db, client, config, { ...account, email: ' TESTER@example.test ' });
  assert.equal(first.userId, second.userId);
  assert.equal(await db.collection('user').countDocuments({ email: account.email }), 1);
  assert.equal(await db.collection('session').countDocuments(), 0);
  assert.equal(typeof (await db.collection('user').findOne({ email: account.email }))?._id, 'string');
  assert.ok((await db.collection('user').indexes()).some(index => index.unique && index.key.email === 1));
  const stored = await db.collection('user').findOne({ email: account.email });
  await assert.rejects(db.collection('user').insertOne({ ...stored, _id: 'another-string-user-id' } as never), (error: unknown) => (error as { code?: number }).code === 11000);
  await setupAuth(db, client, config);
});

test('public auth engine rejects signup, even through its native handler', async () => {
  const { auth } = await dependencies();
  const response = await auth.handler(new Request(`${config.origin}/api/auth/sign-up/email`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: config.origin },
    body: JSON.stringify({ ...account, email: 'intruder@example.test' }),
  }));
  assert.notEqual(response.status, 200);
});

test('sign-in/session/sign-out uses HttpOnly cookies and returns only the safe session view', async () => {
  assert.equal((await call('read')).status, 401);
  const login = await call('sign-in', { email: account.email, password: account.password });
  assert.equal(login.status, 200, await login.clone().text());
  assert.match(login.headers.get('set-cookie') ?? '', /httponly/i);
  assert.match(login.headers.get('set-cookie') ?? '', /samesite=lax/i);
  assert.equal(login.headers.get('cache-control'), 'private, no-store');
  const view = await login.json();
  assert.deepEqual(Object.keys(view.data).sort(), ['capabilities', 'expiresAt', 'user', 'workspaceId']);
  assert.deepEqual(Object.keys(view.data.user).sort(), ['email', 'id', 'name']);
  assert.equal(view.data.workspaceId, view.data.user.id);
  assert.equal(view.data.capabilities.generation, false);
  assert.equal((await call('read', {}, cookies(login))).status, 200);
  const logout = await call('sign-out', {}, cookies(login));
  assert.equal(logout.status, 204);
  assert.match(logout.headers.get('set-cookie') ?? '', /max-age=0/i);
  assert.equal((await call('read', {}, cookies(login))).status, 401);
  assert.equal((await call('sign-out')).status, 204);
});

test('unknown user and bad password have the same generic error', async () => {
  const a = await call('sign-in', { email: account.email, password: 'wrong' });
  const b = await call('sign-in', { email: 'unknown@example.test', password: 'wrong' });
  assert.equal(a.status, 401); assert.equal(b.status, 401);
  assert.deepEqual((await a.json()).error, (await b.json()).error);
});

test('missing/cross-site origin, extra fields, malformed and oversized bodies are rejected', async () => {
  for (const origin of [null, 'https://attacker.example.test']) assert.equal((await call('sign-in', account, '', origin)).status, 403);
  assert.equal((await call('sign-in', { email: account.email, password: account.password, ownerId: 'forged' })).status, 422);
  const malformed = new Request(`${config.origin}/api/session/sign-in`, { method: 'POST', headers: { Origin: config.origin, 'Content-Type': 'application/json' }, body: '{' });
  assert.equal((await handleSession(malformed, 'sign-in', dependencies)).status, 400);
  assert.equal((await call('sign-in', { email: account.email, password: 'x'.repeat(270000) })).status, 413);
});

test('email throttling persists across engine instances; hashed keys do not store raw email/IP', async () => {
  const input = { email: 'limited@example.test', password: 'wrong' };
  for (let i = 0; i < 5; i++) assert.equal((await call('sign-in', input)).status, 401);
  const { db } = await dependencies();
  const response = await handleSession(request('sign-in', input), 'sign-in', async () => ({ db, config, auth: createAuth(db, client, config) }));
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get('retry-after')) > 0);
  assert.equal(JSON.stringify(await db.collection('rateLimitBuckets').find().toArray()).includes(input.email), false);
});

test('disabled access is checked on existing sessions and operator disable revokes them', async () => {
  const { db } = await dependencies();
  const login = await call('sign-in', { email: account.email, password: account.password });
  assert.equal(login.status, 200);
  await db.collection('internalAccess').updateOne({ normalizedEmail: account.email }, { $set: { enabled: false } });
  assert.equal((await call('read', {}, cookies(login))).status, 403);
  const denied = await call('sign-in', { email: account.email, password: account.password });
  assert.equal(denied.status, 401, await denied.clone().text());
  await disableUser(db, account.email);
  assert.equal((await call('read', {}, cookies(login))).status, 401);
  await assert.rejects(provisionUser(db, client, config, account));
  // Restore this disposable fixture only, so independent subsequent checks can use it.
  await db.collection('internalAccess').updateOne({ normalizedEmail: account.email }, { $set: { enabled: true, provisioningState: 'active' } });
});

test('expired and tampered cookies are denied; seven-day absolute expiry is not renewed', async () => {
  const { db } = await dependencies();
  const login = await call('sign-in', { email: account.email, password: account.password });
  assert.equal(login.status, 200);
  const userId = (await login.json()).data.user.id;
  const session = await db.collection('session').findOne({ userId });
  assert.ok(session);
  assert.ok(session.expiresAt.getTime() - session.createdAt.getTime() <= 7 * 86400_000 + 1000);
  await db.collection('session').updateMany({ userId }, { $set: { expiresAt: new Date(0) } });
  assert.equal((await call('read', {}, cookies(login))).status, 401);
  assert.equal((await call('read', {}, 'better-auth.session_token=forged')).status, 401);
});

test('production cookie has Secure attribute', async () => {
  const { db } = await dependencies();
  const secure = { ...config, origin: 'https://video.example.test', secure: true };
  const response = await handleSession(new Request(`${secure.origin}/api/session/sign-in`, {
    method: 'POST', headers: { Origin: secure.origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: account.email, password: account.password }),
  }), 'sign-in', async () => ({ db, config: secure, auth: createAuth(db, client, secure) }));
  assert.equal(response.status, 200, await response.clone().text());
  assert.match(response.headers.get('set-cookie') ?? '', /; secure/i);
});

test('runtime sign-in does not request schema/index administration', async () => {
  const commands: string[] = [];
  const observe = (event: { commandName: string }) => commands.push(event.commandName);
  client.on('commandStarted', observe);
  try {
    assert.equal((await call('sign-in', { email: account.email, password: account.password })).status, 200);
    assert.equal(commands.some(command => ['create', 'createIndexes', 'collMod', 'drop'].includes(command)), false);
  } finally { client.off('commandStarted', observe); }
});

test('IP throttling spans emails and untrusted forwarded headers cannot evade it', async () => {
  const db = client.db('namastevideo_auth_limits');
  await setupDatabase(db);
  await setupAuth(db, client, config);
  for (let i = 0; i < 30; i++) await reserveLogin(db, config, `person${i}@example.test`, new Headers({ 'x-forwarded-for': `192.0.2.${i}` }));
  await assert.rejects(reserveLogin(db, config, 'another@example.test', new Headers({ 'x-forwarded-for': '198.51.100.1' })), LoginLimited);
  assert.equal(await db.collection('rateLimitBuckets').countDocuments({ action: 'auth-login-ip' }), 1);
});

test('missing operator setup fails closed without creating an unvalidated allowlist', async () => {
  const db = client.db('namastevideo_auth_unconfigured');
  await assert.rejects(setupAuth(db, client, config));
  await assert.rejects(provisionUser(db, client, config, account));
  assert.equal(await db.listCollections().hasNext(), false);
  await setupDatabase(db);
  await assert.rejects(assertAuthReady(db));
  await setupAuth(db, client, config);
  await assertAuthReady(db);
});

test('actual Next.js routes allow the full session round trip and expose no native auth endpoints', { timeout: 90_000 }, async () => {
  const port = await new Promise<number>(resolve => {
    const server = createServer(); server.listen(0, '127.0.0.1', () => { const address = server.address(); const value = typeof address === 'object' && address ? address.port : 0; server.close(() => resolve(value)); });
  });
  const origin = `http://127.0.0.1:${port}`;
  web = spawn(process.execPath, [createRequire(import.meta.url).resolve('next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', String(port)], {
    env: { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR, NODE_ENV: 'development',
      MONGODB_URI: replica.getUri(), MONGODB_DATABASE: dbName, BETTER_AUTH_SECRET: config.secret, BETTER_AUTH_URL: origin,
      NEXT_TELEMETRY_DISABLED: '1', AUTH_CLIENT_IP_HEADER: '' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let ready = false;
  web.stdout?.on('data', data => { if (String(data).includes('Ready in')) ready = true; });
  web.stderr?.resume();
  for (let i = 0; i < 120 && !ready && web.exitCode === null; i++) await new Promise(resolve => setTimeout(resolve, 250));
  assert.ok(ready, 'Next.js test server failed to start');
  try {
    assert.equal((await fetch(`${origin}/api/session`)).status, 401);
    assert.equal((await fetch(`${origin}/api/auth/get-session`)).status, 404);
    const login = await fetch(`${origin}/api/session/sign-in`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: account.email, password: account.password }) });
    assert.equal(login.status, 200, await login.clone().text());
    assert.equal((await fetch(`${origin}/api/session`, { headers: { Cookie: cookies(login) } })).status, 200);
    assert.equal((await fetch(`${origin}/api/session/sign-out`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookies(login) }, body: '{}' })).status, 204);
    assert.equal((await fetch(`${origin}/api/session`, { headers: { Cookie: cookies(login) } })).status, 401);
  } finally { await stopWeb(); }
});
