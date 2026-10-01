import 'server-only';
import { getSchema } from 'better-auth/db';
import type { Db, MongoClient } from 'mongodb';
import { isDeepStrictEqual } from 'node:util';
import { DatabaseError } from '../db/config';
import { authOptions } from './engine';
import type { AuthConfig } from './config';
import { migrationId, migrationChecksum } from '../db/setup';

async function requireFoundation(db: Db) {
  if (!await db.collection<{ _id: string; checksum: string; state: string }>('schemaMigrations').findOne({ _id: migrationId, checksum: migrationChecksum, state: 'completed' })) {
    throw new DatabaseError('AUTH_SETUP_REQUIRED', 'Run db:setup before authentication setup.');
  }
}

export async function assertAuthReady(db: Db) {
  await requireFoundation(db);
  for (const [name, key, unique] of [['user', 'email', true], ['session', 'token', true], ['session', 'userId', false], ['account', 'userId', false], ['verification', 'identifier', false]] as const) {
    const indexes = await db.collection(name).indexes();
    if (!indexes.some(index => isDeepStrictEqual(index.key, { [key]: 1 }) && Boolean(index.unique) === unique)) {
      throw new DatabaseError('AUTH_SETUP_REQUIRED', 'Run auth:operator -- setup before using authentication.');
    }
  }
  const indexes = await db.collection('rateLimitBuckets').indexes();
  if (!indexes.some(index => index.name === 'rate_bucket' && index.unique)
    || !indexes.some(index => index.name === 'rate_expiry' && index.expireAfterSeconds === 0)) {
    throw new DatabaseError('AUTH_SETUP_REQUIRED', 'Authentication rate-limit indexes are missing.');
  }
}

// Auth model fields/indexes belong to the pinned adapter, not our application schema catalog.
export async function setupAuth(db: Db, client: MongoClient, config: AuthConfig) {
  await requireFoundation(db);
  const tables = getSchema(authOptions(db, client, config, true));
  for (const [name, table] of Object.entries(tables)) {
    if (!await db.listCollections({ name }, { nameOnly: true }).hasNext()) await db.createCollection(name);
    // getSchema exposes legacy field indexes separately from table-level indexes.
    // In 1.7.7 the Mongo adapter only installs the latter automatically.
    for (const [fieldName, field] of Object.entries(table.fields)) {
      if (field.unique || field.index) await db.collection(name).createIndex({ [fieldName]: 1 }, {
        name: `${name}_${fieldName}_${field.unique ? 'uidx' : 'idx'}`, unique: field.unique ?? false,
      });
    }
    for (const index of table.indexes ?? []) {
      await db.collection(name).createIndex(Object.fromEntries(index.columns.map(column => [column === 'id' ? '_id' : column, 1])), {
        name: index.name, unique: index.unique ?? false,
      });
    }
  }
  const validator = { $jsonSchema: {
    bsonType: 'object', additionalProperties: false,
    required: ['_id', 'schemaVersion', 'createdAt', 'updatedAt', 'subjectHash', 'action', 'windowStart', 'count', 'expiresAt'],
    properties: {
      _id: { bsonType: 'string', pattern: '^lim_[a-f0-9]{64}$' }, schemaVersion: { bsonType: 'int', enum: [1] },
      createdAt: { bsonType: 'date' }, updatedAt: { bsonType: 'date' }, windowStart: { bsonType: 'date' }, expiresAt: { bsonType: 'date' },
      subjectHash: { bsonType: 'string', pattern: '^[a-f0-9]{64}$' }, action: { bsonType: 'string', maxLength: 80 }, count: { bsonType: 'int', minimum: 0 },
    },
  } };
  const name = 'rateLimitBuckets';
  if (!await db.listCollections({ name }, { nameOnly: true }).hasNext()) {
    await db.createCollection(name, { validator, validationAction: 'error', validationLevel: 'strict' });
  }
  const existing = await db.listCollections({ name }, { nameOnly: false }).next();
  if (!isDeepStrictEqual(existing?.options?.validator, validator) || existing?.options?.validationLevel !== 'strict' || existing?.options?.validationAction !== 'error') {
    throw new DatabaseError('DB_SCHEMA_DRIFT', 'Rate-limit schema differs; use a reviewed migration.');
  }
  await db.collection(name).createIndex({ subjectHash: 1, action: 1, windowStart: 1 }, { name: 'rate_bucket', unique: true });
  await db.collection(name).createIndex({ expiresAt: 1 }, { name: 'rate_expiry', expireAfterSeconds: 0 });
}
