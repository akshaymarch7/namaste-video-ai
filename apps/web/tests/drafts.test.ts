import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { MongoClient, Long } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { setupDatabase } from '../src/db/setup';
import { setupProjects } from '../src/projects/setup';
import { setupDrafts, assertDraftsReady } from '../src/drafts/setup';
import { draftService } from '../src/drafts/service';
import { projectService, canonical } from '../src/projects/service';
import { handleProjects } from '../src/projects/http';
import { setupAuth } from '../src/auth/setup';
import { createAuth } from '../src/auth/engine';
import { provisionUser } from '../src/auth/operator';
let replica: MongoMemoryReplSet, client: MongoClient;
let db: ReturnType<MongoClient['db']>, drafts: ReturnType<typeof draftService>, projects: ReturnType<typeof projectService>;
let deps: Awaited<ReturnType<typeof import('../src/auth/runtime').dependencies>>;
let owner: string, other: string, cookie: string, otherCookie: string;
const config = { origin: 'http://127.0.0.1:3002', secure: false, secret: randomBytes(48).toString('base64url') };
before(async () => {
  replica = await MongoMemoryReplSet.create({ binary: { version: '8.0.17' }, replSet: { count: 1, ip: '127.0.0.1', storageEngine: 'wiredTiger' } });
  client = await new MongoClient(replica.getUri(), { promoteLongs: false }).connect(); db = client.db('drafts_test');
  await setupDatabase(db); await setupProjects(db); await setupDrafts(db); await setupAuth(db, client, config);
  const auth = createAuth(db, client, config); deps = { db, client, config, auth };
  drafts = draftService(db, client); projects = projectService(db, client, config.secret);
  const identities = [];
  for (const email of ['owner@example.test', 'other@example.test']) {
    const input = { name: 'Draft Tester', email, password: 'Draft-fixture-only-987!' };
    const user = await provisionUser(db, client, config, input);
    const response = await auth.api.signInEmail({ body: input, asResponse: true });
    identities.push({ id: user.userId, cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') });
  }
  [owner, other] = identities.map(value => value.id); [cookie, otherCookie] = identities.map(value => value.cookie);
}, { timeout: 180000 });
after(async () => { await client?.close(); await replica?.stop(); });
const make = async () => (await projects.create(owner, randomUUID(), { title: 'Draft test' })).data!;
const rejects = (promise: Promise<unknown>, code: string) => assert.rejects(promise, (error: unknown) => (error as { code: string }).code === code);
const req = (id: string, body?: unknown, overrides: Record<string, string> = {}) => handleProjects(new Request(`${config.origin}/api/projects/${id}/draft`, {
  method: body === undefined ? 'GET' : 'PATCH', headers: { Cookie: cookie, Origin: config.origin, 'Content-Type': 'application/json', ...overrides },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
}), body === undefined ? 'draft-read' : 'draft-save', id, async () => deps);
test('migration upgrades old blank drafts, replays both migrations, preserves edited data and index', async () => {
  const local = client.db('draft_upgrade'); await setupDatabase(local); await setupProjects(local);
  const p = projectService(local, client, config.secret), item = (await p.create(owner, randomUUID(), { title: 'Old' })).data!;
  await rejects(assertDraftsReady(local), 'DRAFT_SETUP_REQUIRED');
  await setupDrafts(local);
  await draftService(local, client).save(owner, item.id, { expectedRevision: 1, changes: { topic: 'Preserve me' } });
  await setupProjects(local); await setupDrafts(local); await assertDraftsReady(local);
  assert.equal((await draftService(local, client).get(owner, item.id)).topic, 'Preserve me');
  assert.ok((await local.collection('drafts').indexes()).some(index => index.name === 'draft_owner_project' && index.unique));
  for (const update of [{ notes: 'x'.repeat(20001) }, { unexpected: true }, { revision: 0 }, { editablePlan: {} }]) {
    await assert.rejects(local.collection('drafts').updateOne({ projectId: item.id }, { $set: update }), (e: unknown) => (e as {code: number}).code === 121);
  }
});
test('migration refuses schema drift and changed checksum', async () => {
  const local = client.db('draft_drift'); await setupDatabase(local); await setupProjects(local);
  await local.command({ collMod: 'drafts', validator: {} });
  await rejects(setupDrafts(local), 'DB_SCHEMA_DRIFT');
  const changed = client.db('draft_checksum'); await setupDatabase(changed); await setupProjects(changed); await setupDrafts(changed);
  await changed.collection('schemaMigrations').updateOne({ migrationName: '003-idea-drafts' }, { $set: { checksum: '0'.repeat(64) } });
  await rejects(setupDrafts(changed), 'DB_MIGRATION_CHANGED'); await rejects(assertDraftsReady(changed), 'DRAFT_SETUP_REQUIRED');
});
test('GET and PATCH preserve whitespace, Unicode, fields, canonical hash and separate metadata revision', async () => {
  const item = await make(); const initial = await drafts.get(owner, item.id);
  assert.equal(initial.voicePreset, 'daniel-test'); assert.equal(initial.validation.valid, false);
  const response = await req(item.id, { expectedRevision: 1, changes: { topic: '  नमस्ते 😀 ', notes: 'line 1\nline 2', audience: 'Students' } });
  assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  const { data, meta } = await response.json(); assert.equal(data.revision, 2); assert.equal(data.topic, '  नमस्ते 😀 ');
  assert.equal(data.ownerId, undefined); assert.equal(meta.requestId, response.headers.get('X-Request-Id'));
  const content = { topic: data.topic, audience: data.audience, notes: data.notes, voicePreset: data.voicePreset, editablePlan: null };
  assert.equal(data.contentHash, createHash('sha256').update(canonical(content)).digest('hex'));
  const parent = await projects.get(owner, item.id); assert.equal(parent.draftRevision, 2); assert.equal(parent.revision, 1);
  assert.ok(Long.fromNumber(2).equals((await db.collection('projects').findOne({ _id: item.id as never }))!.contentRevision));
  const cleared = await drafts.save(owner, item.id, { expectedRevision: 2, changes: { topic: '' } });
  assert.equal(cleared.topic, ''); assert.equal(cleared.notes, data.notes);
  assert.equal((await req(item.id, { expectedRevision: 3, changes: { topic: '😀'.repeat(2000) } })).status, 200);
});
test('HTTP authentication, foreign ownership, Origin and input validation', async () => {
  const item = await make(), input = { expectedRevision: 1, changes: { topic: 'Hello' } };
  assert.equal((await req(item.id, undefined, { Cookie: '' })).status, 401);
  for (const body of [undefined, input]) assert.equal((await req(item.id, body, { Cookie: otherCookie })).status, 404);
  assert.equal((await req(item.id, input, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await req('bad-id')).status, 404);
  await db.collection('internalAccess').updateOne({ provisionedUserId: other }, { $set: { enabled: false } });
  assert.equal((await req(item.id, undefined, { Cookie: otherCookie })).status, 403);
  await db.collection('internalAccess').updateOne({ provisionedUserId: other }, { $set: { enabled: true } });
  for (const body of [{ changes: { topic: 'x' } }, { expectedRevision: 1, changes: {} }, { ...input, ownerId: other },
    { expectedRevision: 1, changes: { editablePlan: {} } }, { expectedRevision: 1, changes: { notes: 'x'.repeat(20001) } },
    { expectedRevision: 1, changes: { topic: '😀'.repeat(2001) } }, { expectedRevision: 1, changes: { audience: 'x'.repeat(201) } },
    { expectedRevision: 1, changes: { voicePreset: 'unknown' } }]) assert.equal((await req(item.id, body)).status, 422);
  assert.equal((await drafts.get(owner, item.id)).revision, 1);
});
test('two simultaneous saves have one winner and lost-response retry reports conflict', async () => {
  const item = await make();
  const results = await Promise.all(['A', 'B'].map(topic => req(item.id, { expectedRevision: 1, changes: { topic } })));
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  const conflict = await results.find(r => r.status === 409)!.json(); assert.equal(conflict.error.details.currentRevision, 2);
  assert.equal(conflict.error.details.reloadUrl, `/api/projects/${item.id}/draft`);
  const saved = await drafts.get(owner, item.id);
  const retry = await req(item.id, { expectedRevision: 1, changes: { topic: saved.topic } }); assert.equal(retry.status, 409);
  assert.equal((await drafts.get(owner, item.id)).revision, 2);
});
test('save/delete races cannot resurrect children; edited project deletion remains guarded', async () => {
  const item = await make();
  const results = await Promise.allSettled([
    drafts.save(owner, item.id, { expectedRevision: 1, changes: { notes: 'Private draft' } }),
    projects.remove(owner, item.id, randomUUID(), { expectedRevision: 1, confirm: true }),
  ]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  if (results[1].status === 'fulfilled') {
    await rejects(drafts.get(owner, item.id), 'NOT_FOUND');
    await rejects(drafts.save(owner, item.id, { expectedRevision: 1, changes: { notes: 'Resurrect' } }), 'NOT_FOUND');
    assert.equal(await db.collection('drafts').countDocuments({ projectId: item.id }), 0);
  } else { assert.equal(results[1].reason.code, 'PROJECT_DELETE_UNAVAILABLE'); assert.equal((await drafts.get(owner, item.id)).notes, 'Private draft'); }
});
test('child write failure rolls back parent revision and summary', async () => {
  const item = await make();
  // Service receives an invalid oversized field to force a DB child-validation failure after the parent write.
  await assert.rejects(drafts.save(owner, item.id, { expectedRevision: 1, changes: { notes: 'x'.repeat(20001) } }));
  assert.equal((await projects.get(owner, item.id)).draftRevision, 1); assert.equal((await drafts.get(owner, item.id)).revision, 1);
});
