import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { projectsOpenApi } from '../src/projects/openapi';
import { before, after, test } from 'node:test';
import { randomBytes, randomUUID, createHmac } from 'node:crypto';
import { MongoClient, Long } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { setupDatabase } from '../src/db/setup';
import { setupProjects, assertProjectsReady } from '../src/projects/setup';
import { projectService } from '../src/projects/service';
import { handleProjects, type ProjectAction } from '../src/projects/http';
import { setupAuth } from '../src/auth/setup';
import { createAuth } from '../src/auth/engine';
import { provisionUser } from '../src/auth/operator';
let replica: MongoMemoryReplSet, client: MongoClient;
let db: ReturnType<MongoClient['db']>, service: ReturnType<typeof projectService>;
let deps: Awaited<ReturnType<typeof import('../src/auth/runtime').dependencies>>;
let owner: string, other: string, cookie: string, otherCookie: string;
const config = { origin: 'http://127.0.0.1:3002', secure: false, secret: randomBytes(48).toString('base64url') };
before(async () => {
  replica = await MongoMemoryReplSet.create({ binary: { version: '8.0.17' }, replSet: { count: 1, ip: '127.0.0.1', storageEngine: 'wiredTiger' } });
  client = await new MongoClient(replica.getUri(), { promoteLongs: false }).connect(); db = client.db('projects_test');
  await setupDatabase(db); await setupProjects(db); await setupAuth(db, client, config);
  const auth = createAuth(db, client, config); deps = { db, client, config, auth }; service = projectService(db, client, config.secret);
  const identities = [];
  for (const email of ['owner@example.test', 'other@example.test']) {
    const input = { name: 'Test Creator', email, password: 'Project-fixture-only-987!' };
    const user = await provisionUser(db, client, config, input);
    const response = await auth.api.signInEmail({ body: input, asResponse: true });
    identities.push({ id: user.userId, cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') });
  }
  [owner, other] = identities.map(value => value.id); [cookie, otherCookie] = identities.map(value => value.cookie);
}, { timeout: 180000 });
after(async () => { await client?.close(); await replica?.stop(); });
const make = async (title = 'Example', user = owner, key = randomUUID()) => (await service.create(user, key, { title })).data!;
const rejects = (promise: Promise<unknown>, code: string) => assert.rejects(promise, (error: unknown) => (error as { code: string }).code === code);
const req = (action: ProjectAction, body?: unknown, target?: string, options: { cookie?: string; origin?: string; query?: string; key?: string } = {}) => {
  const method = ({ list: 'GET', read: 'GET', create: 'POST', rename: 'PATCH', delete: 'DELETE' } as const)[action];
  return handleProjects(new Request(`${config.origin}/api/projects${target ? `/${target}` : ''}${options.query ?? ''}`, {
    method, headers: { Cookie: options.cookie ?? cookie, Origin: options.origin ?? config.origin, 'Content-Type': 'application/json', 'Idempotency-Key': options.key ?? randomUUID() },
    ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
  }), action, target, async () => deps);
};
test('additive migration replays, enforces blank-draft schema and requires setup', async () => {
  await setupProjects(db); await assertProjectsReady(db);
  const item = await make(); const draft = await db.collection('drafts').findOne({ projectId: item.id });
  assert.equal(draft?.voicePreset, 'daniel-test'); assert.equal(draft?.editablePlan, null);
  await assert.rejects(db.collection('drafts').updateOne({ projectId: item.id }, { $set: { topic: 'Editing belongs to F07' } }), (error: unknown) => (error as {code: number}).code === 121);
  assert.equal(await db.collection('conversations').countDocuments({ projectId: item.id, ownerId: owner }), 1);
  assert.ok(Long.ONE.equals((await db.collection('projects').findOne({ _id: item.id as never }))!.contentRevision));
  const empty = client.db('projects_missing_setup'); await rejects(assertProjectsReady(empty), 'PROJECT_SETUP_REQUIRED');
});
test('create snapshots saved preferences and concurrent same-key requests create only one aggregate', async () => {
  await db.collection('preferences').insertOne({ _id: `pref_${randomUUID().replaceAll('-', '')}` as never, schemaVersion: 1, ownerId: other, revision: 1, timezone: 'Asia/Kolkata', defaultVoicePreset: 'test-preset', createdAt: new Date(), updatedAt: new Date() });
  const key = randomUUID(); const results = await Promise.all(Array.from({ length: 4 }, () => service.create(other, key, { title: 'One project' })));
  assert.equal(new Set(results.map(value => value.data!.id)).size, 1);
  assert.equal(await db.collection('drafts').countDocuments({ projectId: results[0].data!.id }), 1);
  assert.equal((await db.collection('drafts').findOne({ projectId: results[0].data!.id }))?.voicePreset, 'test-preset');
  await rejects(service.create(other, key, { title: 'Different' }), 'IDEMPOTENCY_KEY_REUSED');
});
test('failed aggregate creation rolls back project, conversation and receipt', async () => {
  // Force a child uniqueness failure without changing the production service or validators.
  await db.collection('drafts').createIndex({ ownerId: 1 }, { unique: true, partialFilterExpression: { ownerId: 'rollback-user' }, name: 'fixture_rollback' });
  await make('first', 'rollback-user');
  await assert.rejects(service.create('rollback-user', randomUUID(), { title: 'Must roll back' }));
  assert.equal(await db.collection('projects').countDocuments({ ownerId: 'rollback-user' }), 1);
  assert.equal(await db.collection('conversations').countDocuments({ ownerId: 'rollback-user' }), 1);
  assert.equal(await db.collection('projectCommands').countDocuments({ ownerId: 'rollback-user' }), 1);
  await db.collection('drafts').dropIndex('fixture_rollback');
});
test('foreign reads, rename and delete return not found without changing data', async () => {
  const item = await make();
  await rejects(service.get(other, item.id), 'NOT_FOUND');
  await rejects(service.rename(other, item.id, { expectedRevision: 1, title: 'Stolen' }), 'NOT_FOUND');
  await rejects(service.remove(other, item.id, randomUUID(), { expectedRevision: 1, confirm: true }), 'NOT_FOUND');
  assert.equal((await service.get(owner, item.id)).title, item.title);
});
test('concurrent renames have one winner; metadata changes preserve draft revision', async () => {
  const item = await make();
  const results = await Promise.allSettled(['A', 'B'].map(title => service.rename(owner, item.id, { expectedRevision: 1, title })));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  const failed = results.find(result => result.status === 'rejected') as PromiseRejectedResult;
  assert.equal(failed.reason.code, 'REVISION_CONFLICT'); assert.equal(failed.reason.details.currentRevision, 2);
  assert.equal((await service.get(owner, item.id)).draftRevision, 1);
});
test('signed tuple pagination handles ties without duplicates and binds owner/filter/expiry', async () => {
  const user = 'pagination-owner'; const items = await Promise.all(Array.from({ length: 5 }, (_, i) => make(`Page ${i}`, user)));
  await db.collection('projects').updateMany({ ownerId: user }, { $set: { updatedAt: new Date('2026-01-01T00:00:00.000Z') } });
  const first = await service.list(user, { limit: 2, filter: 'all' }); assert.equal(first.page.hasMore, true);
  const second = await service.list(user, { limit: 2, filter: 'all', cursor: first.page.nextCursor! });
  const third = await service.list(user, { limit: 2, filter: 'all', cursor: second.page.nextCursor! });
  assert.equal(third.page.nextCursor, null);
  assert.deepEqual([...first.data, ...second.data, ...third.data].map(item => item.id), items.map(item => item.id).sort().reverse());
  for (const input of [{ filter: 'drafts' as const, cursor: first.page.nextCursor! }, { filter: 'all' as const, cursor: first.page.nextCursor! + 'x' }]) await rejects(service.list(user, { limit: 2, ...input }), 'INVALID_CURSOR');
  await rejects(service.list(other, { limit: 2, filter: 'all', cursor: first.page.nextCursor! }), 'INVALID_CURSOR');
  const expired = JSON.parse(Buffer.from(first.page.nextCursor!.split('.')[0], 'base64url').toString()); expired.expires = Date.now() - 1;
  const payload = Buffer.from(JSON.stringify(expired)).toString('base64url');
  const signed = createHmac('sha256', config.secret).update(`projects-cursor-v1:${payload}`).digest('base64url');
  await rejects(service.list(user, { limit: 2, filter: 'all', cursor: `${payload}.${signed}` }), 'INVALID_CURSOR');
  assert.equal((await service.list(user, { limit: 20, filter: 'ready' })).data.length, 0);
  assert.equal((await service.list(user, { limit: 20, filter: 'drafts' })).data.length, 5);
});
test('deletion is atomic, replayable and scrubs content; create replay cannot expose deleted data', async () => {
  const createKey = randomUUID(), item = await make('Private title', owner, createKey), key = randomUUID();
  const input = { expectedRevision: 1, confirm: true as const };
  const results = await Promise.all([service.remove(owner, item.id, key, input), service.remove(owner, item.id, key, input)]);
  assert.deepEqual(results.map(value => value.status), [204, 204]);
  await rejects(service.get(owner, item.id), 'NOT_FOUND');
  await rejects(service.create(owner, createKey, { title: 'Private title' }), 'NOT_FOUND');
  await rejects(service.remove(owner, item.id, randomUUID(), input), 'NOT_FOUND');
  await rejects(service.remove(other, item.id, key, input), 'NOT_FOUND');
  assert.equal(await db.collection('drafts').countDocuments({ projectId: item.id }), 0);
  assert.equal(await db.collection('conversations').countDocuments({ projectId: item.id }), 0);
  assert.equal((await db.collection('projects').findOne({ _id: item.id as never }))?.title, 'Deleted project');
  assert.equal((await db.collection('projectCommands').findOne({ projectId: item.id, method: 'POST' }))?.response, null);
  assert.equal((await service.list(owner, { limit: 50, filter: 'all' })).data.some(value => value.id === item.id), false);
});
test('delete refuses stale revisions and future content requiring asynchronous cleanup', async () => {
  const item = await make(); await service.rename(owner, item.id, { expectedRevision: 1, title: 'Updated' });
  await rejects(service.remove(owner, item.id, randomUUID(), { expectedRevision: 1, confirm: true }), 'REVISION_CONFLICT');
  await db.collection('projects').updateOne({ _id: item.id as never }, { $set: { activeJobId: `job_${randomUUID().replaceAll('-', '')}` } });
  await rejects(service.remove(owner, item.id, randomUUID(), { expectedRevision: 2, confirm: true }), 'PROJECT_DELETE_UNAVAILABLE');
  assert.equal((await service.get(owner, item.id)).title, 'Updated');
});
test('HTTP envelopes, default/Unicode titles, CAS, replay and 204 semantics', async () => {
  const key = randomUUID(), created = await req('create', {}, undefined, { key }); assert.equal(created.status, 201);
  const body = await created.json(), item = body.data; assert.equal(item.title, 'Untitled video');
  assert.equal(created.headers.get('Location'), `/api/projects/${item.id}`); assert.equal(body.meta.requestId, created.headers.get('X-Request-Id'));
  assert.equal(created.headers.get('Cache-Control'), 'private, no-store'); assert.equal(item.ownerId, undefined);
  const replay = await req('create', {}, undefined, { key }); assert.equal(replay.headers.get('Idempotency-Replayed'), 'true');
  assert.equal((await replay.json()).data.id, item.id);
  assert.equal((await req('rename', { expectedRevision: 1, title: '😀'.repeat(100) }, item.id)).status, 200);
  const conflict = await req('rename', { expectedRevision: 1, title: 'Conflict' }, item.id); assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).error.details.currentRevision, 2);
  const result = await req('delete', { expectedRevision: 2, confirm: true }, item.id); assert.equal(result.status, 204); assert.equal(await result.text(), '');
});
test('HTTP rejects unauthenticated/disabled/foreign access and unsafe origin', async () => {
  assert.equal((await req('list', undefined, undefined, { cookie: '' })).status, 401);
  assert.equal((await req('create', {}, undefined, { origin: 'https://evil.example' })).status, 403);
  const item = await make(); assert.equal((await req('read', undefined, item.id, { cookie: otherCookie })).status, 404);
  await db.collection('internalAccess').updateOne({ provisionedUserId: other }, { $set: { enabled: false } });
  assert.equal((await req('list', undefined, undefined, { cookie: otherCookie })).status, 403);
  await db.collection('internalAccess').updateOne({ provisionedUserId: other }, { $set: { enabled: true } });
});
test('HTTP validation rejects unknown fields, missing keys/preconditions and bad pagination', async () => {
  for (const body of [{ title: '  ' }, { title: '😀'.repeat(101) }, { ownerId: other }, { selectedVideoId: 'anything' }]) assert.equal((await req('create', body)).status, 422);
  assert.equal((await req('create', {}, undefined, { key: '' })).status, 422);
  const item = await make(); assert.equal((await req('rename', { title: 'Missing revision' }, item.id)).status, 422);
  assert.equal((await req('delete', { expectedRevision: 1, confirm: false }, item.id)).status, 422);
  for (const query of ['?limit=0', '?limit=51', '?limit=2&limit=3', '?filter=invalid', '?ownerId=foreign']) assert.equal((await req('list', undefined, undefined, { query })).status, 422);
  assert.equal((await req('list', undefined, undefined, { query: '?cursor=bad' })).status, 400);
  const request = new Request(`${config.origin}/api/projects`, { method: 'POST', headers: { Cookie: cookie, Origin: config.origin, 'Content-Type': 'application/json' }, body: 'x'.repeat(256 * 1024 + 1) });
  assert.equal((await handleProjects(request, 'create', undefined, async () => deps)).status, 413);
});

test('checked-in OpenAPI matches the shared request schemas', async () => {
  const stored = JSON.parse(await readFile(new URL('../../../design/projects.openapi.json', import.meta.url), 'utf8'));
  assert.deepEqual(stored, projectsOpenApi());
});

test('rename/delete race has one winner and no resurrection', async () => {
  const item = await make();
  const results = await Promise.allSettled([
    service.rename(owner, item.id, { expectedRevision: 1, title: 'Raced' }),
    service.remove(owner, item.id, randomUUID(), { expectedRevision: 1, confirm: true }),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  if (results[1].status === 'fulfilled') {
    await rejects(service.get(owner, item.id), 'NOT_FOUND');
    assert.equal(await db.collection('drafts').countDocuments({ projectId: item.id }), 0);
  } else {
    assert.equal(results[1].reason.code, 'REVISION_CONFLICT');
    assert.equal((await service.get(owner, item.id)).revision, 2);
    assert.equal(await db.collection('drafts').countDocuments({ projectId: item.id }), 1);
  }
});

test('project migration refuses changed checksums without touching existing data', async () => {
  const local = client.db('projects_migration_drift');
  await setupDatabase(local); await setupProjects(local);
  await local.collection('schemaMigrations').updateOne({ migrationName: '002-projects' }, { $set: { checksum: '0'.repeat(64) } });
  await rejects(setupProjects(local), 'DB_MIGRATION_CHANGED');
  await rejects(assertProjectsReady(local), 'PROJECT_SETUP_REQUIRED');
});
