import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { after, before, test } from 'node:test';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Int32, Long, MongoClient, MongoServerError, type Db } from 'mongodb';
import { createDatabaseConnection, inTransaction } from '../src/db/client';
import { DatabaseError, readDatabaseConfig } from '../src/db/config';
import { migrationChecksum, migrationId, setupDatabase } from '../src/db/setup';

let replica: MongoMemoryReplSet;
let client: MongoClient;
let db: Db;
before(async () => {
  // Dedicated ephemeral localhost instance: never read MONGODB_URI or touch hosted data.
  replica = await MongoMemoryReplSet.create({
    binary: { version: '8.0.17' }, replSet: { count: 1, storageEngine: 'wiredTiger', ip: '127.0.0.1' },
  });
  client = new MongoClient(replica.getUri(), { promoteLongs: false });
  await client.connect();
  db = client.db('namastevideo_test');
  await setupDatabase(db);
}, { timeout: 180_000 });
after(async () => { await client?.close(); await replica?.stop(); });

const base = (id: string) => ({ _id: id, schemaVersion: new Int32(1), createdAt: new Date(), updatedAt: new Date() });
const access = (suffix: string, email: string) => ({ ...base(`acc_${suffix.padEnd(16, '0')}`), normalizedEmail: email,
  enabled: false, provisioningState: 'pending', operatorRef: 'test-operator' });
const collection = (name: string) => db.collection<Record<string, unknown> & { _id: string }>(name);
function mongoCode(code: number) {
  return (error: unknown) => error instanceof MongoServerError && error.code === code;
}
function appCode(code: string) {
  return (error: unknown) => error instanceof DatabaseError && error.code === code;
}

test('configuration fails explicitly and never echoes supplied secrets', () => {
  assert.throws(() => readDatabaseConfig({}), appCode('DB_CONFIG_MISSING'));
  assert.throws(() => readDatabaseConfig({ MONGODB_URI: 'secret-value', MONGODB_DATABASE: 'app_dev' }), error =>
    error instanceof DatabaseError && !error.message.includes('secret-value'));
  assert.throws(() => readDatabaseConfig({ MONGODB_URI: 'mongodb://localhost', MONGODB_DATABASE: 'admin' }), appCode('DB_CONFIG_INVALID'));
  assert.throws(() => readDatabaseConfig({ MONGODB_URI: 'mongodb://localhost', MONGODB_DATABASE: 'app_dev' }, 'setup'), appCode('DB_CONFIG_MISSING'));
});

test('operator command exits nonzero with a safe actionable error when unconfigured', () => {
  const result = spawnSync(process.execPath, ['--conditions=react-server', '--import', 'tsx', 'scripts/db-setup.ts'], {
    env: { ...process.env, MONGODB_URI: '', MONGODB_MIGRATION_URI: '', MONGODB_DATABASE: '' }, encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stderr).code, 'DB_CONFIG_MISSING');
  assert.equal(result.stdout, '');
});

test('concurrent connection callers share one pool; closing allows reconnect', async () => {
  const connection = createDatabaseConnection({ uri: replica.getUri(), database: 'namastevideo_test' });
  try {
    const [a, b] = await Promise.all([connection.get(), connection.get()]);
    assert.equal(a.client, b.client);
    await connection.close();
    const c = await connection.get();
    assert.notEqual(c.client, a.client);
    assert.equal(await c.db.command({ ping: 1 }).then(r => r.ok), 1);
  } finally { await connection.close(); }
});

test('invalid connection diagnostics are sanitized and failure can be retried', async () => {
  const connection = createDatabaseConnection({ uri: 'mongodb://user:secret@%', database: 'app_dev' });
  for (let i = 0; i < 2; i++) await assert.rejects(connection.get(), error =>
    error instanceof DatabaseError && error.code === 'DB_UNAVAILABLE' && !String(error).includes('secret'));
  await connection.close();
});

test('setup reruns idempotently and preserves records with exact initial indexes', async () => {
  await collection('internalAccess').insertOne(access('existing', 'existing@example.test'));
  await setupDatabase(db);
  assert.equal(await collection('internalAccess').countDocuments(), 1);
  assert.deepEqual((await db.collection('projects').indexes()).map(i => i.name).sort(), [
    '_id_', 'project_list', 'project_flag_drafts', 'project_flag_ready', 'project_flag_scheduled', 'project_flag_published', 'project_flag_needsAttention',
  ].sort());
  const migration = await collection('schemaMigrations').findOne({ _id: migrationId });
  assert.equal(migration?.state, 'completed');
  assert.equal(migration?.checksum, migrationChecksum);
});

test('strict validation rejects unknown fields, bad enums and wrong BSON types', async () => {
  const records = collection('internalAccess');
  await assert.rejects(records.insertOne({ ...access('extra', 'extra@example.test'), password: 'not-allowed' }), mongoCode(121));
  await assert.rejects(records.insertOne({ ...access('enum', 'enum@example.test'), provisioningState: 'invalid' }), mongoCode(121));
  await assert.rejects(records.insertOne({ ...access('date', 'date@example.test'), createdAt: new Date().toISOString() }), mongoCode(121));
  await assert.rejects(records.insertOne({ ...access('email', 'UPPER@example.test') }), mongoCode(121));
});

test('email and linked-user uniqueness; multiple unlinked users allowed', async () => {
  const records = collection('internalAccess');
  await records.insertOne(access('one', 'one@example.test'));
  await records.insertOne(access('two', 'two@example.test'));
  await assert.rejects(records.insertOne(access('duplicate', 'one@example.test')), mongoCode(11000));
  await records.insertOne({ ...access('linked', 'linked@example.test'), provisionedUserId: 'auth-user-1' });
  await assert.rejects(records.insertOne({ ...access('linkedAgain', 'linkedagain@example.test'), provisionedUserId: 'auth-user-1' }), mongoCode(11000));
});

test('project BSON longs remain longs; blank titles and extra flag fields fail', async () => {
  const project = { ...base('prj_testproject0000001'), ownerId: 'auth-user-1', title: 'Test', revision: new Int32(1),
    draftRevision: new Int32(1), contentRevision: Long.ONE, conversationId: 'cnv_testconversation01', deletedAt: null,
    flags: { drafts: true, ready: false, scheduled: false, published: false, needsAttention: false } };
  await collection('projects').insertOne(project);
  assert.ok(Long.isLong((await collection('projects').findOne({ _id: project._id }))?.contentRevision));
  await assert.rejects(collection('projects').updateOne({ _id: project._id }, { $set: { title: '  ' } }), mongoCode(121));
  await assert.rejects(collection('projects').updateOne({ _id: project._id }, { $set: { 'flags.unexpected': true } }), mongoCode(121));
  await assert.rejects(collection('projects').updateOne({ _id: project._id }, { $set: { contentRevision: new Int32(1) } }), mongoCode(121));
});

test('transaction commits related writes and rolls back on failure', async () => {
  await inTransaction(client, async session => {
    await collection('internalAccess').insertOne(access('txnOk', 'txn-ok@example.test'), { session });
    await collection('preferences').insertOne({ ...base('prf_transaction000001'), ownerId: 'txn-user', revision: new Int32(1), timezone: 'Asia/Kolkata', defaultVoicePreset: 'test' }, { session });
  });
  assert.equal(await collection('preferences').countDocuments({ ownerId: 'txn-user' }), 1);
  await assert.rejects(inTransaction(client, async session => {
    await collection('internalAccess').insertOne(access('txnFail', 'txn-fail@example.test'), { session });
    await collection('preferences').insertOne({ ...base('prf_transaction000002'), ownerId: 'txn-user', revision: new Int32(1), timezone: 'Asia/Kolkata', defaultVoicePreset: 'test' }, { session });
  }), mongoCode(11000));
  assert.equal(await collection('internalAccess').countDocuments({ normalizedEmail: 'txn-fail@example.test' }), 0);
});

test('schema drift fails without rewriting existing validator', async () => {
  const isolated = client.db('namastevideo_drift');
  await isolated.createCollection('internalAccess');
  await assert.rejects(setupDatabase(isolated), appCode('DB_SCHEMA_DRIFT'));
  assert.equal((await isolated.listCollections({ name: 'internalAccess' }, { nameOnly: false }).next())?.options?.validator, undefined);
});

test('changed checksum is rejected and a held lease prevents concurrent setup', async () => {
  const isolated = client.db('namastevideo_migrations');
  await setupDatabase(isolated);
  const records = isolated.collection<Record<string, unknown> & { _id: string }>('schemaMigrations');
  await records.updateOne({ _id: migrationId }, { $set: { checksum: '0'.repeat(64) } });
  await assert.rejects(setupDatabase(isolated), appCode('DB_MIGRATION_CHANGED'));
  await records.updateOne({ _id: migrationId }, { $set: { checksum: migrationChecksum, state: 'running', lease: {
    holder: 'run_testholder00000001', until: new Date(Date.now() + 60_000), fence: Long.ONE,
  } } });
  await assert.rejects(setupDatabase(isolated), appCode('DB_SETUP_BUSY'));
  await records.updateOne({ _id: migrationId }, { $set: { 'lease.until': new Date(0) } });
  await setupDatabase(isolated);
  assert.equal((await records.findOne({ _id: migrationId }))?.state, 'completed');
});
