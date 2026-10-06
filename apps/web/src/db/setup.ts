import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { Long, MongoServerError, type Db, type Document } from 'mongodb';
import { DatabaseError } from './config';
import { foundationDefinitions, migrationDefinition, type CollectionDefinition } from './schema';

export const migrationName = '001-foundation';
export const migrationId = 'mig_foundation00000001';
export const migrationChecksum = createHash('sha256')
  .update(JSON.stringify([migrationDefinition, ...foundationDefinitions])).digest('hex');

type MigrationOptions = { upgradeFrom?: Record<string, object>; successors?: Record<string, object | object[]> };
async function ensureCollection(db: Db, definition: CollectionDefinition, optionsForMigration: MigrationOptions = {}) {
  const options = { validator: definition.validator, validationLevel: 'strict' as const, validationAction: 'error' as const };
  try {
    await db.createCollection(definition.name, options);
  } catch (error) {
    if (!(error instanceof MongoServerError) || error.code !== 48) throw error;
  }
  const existing = await db.listCollections({ name: definition.name }, { nameOnly: false }).next();
  const current = existing?.options?.validator;
  const predecessor = optionsForMigration.upgradeFrom?.[definition.name];
  if (existing && predecessor && isDeepStrictEqual(current, predecessor)
    && existing.options?.validationLevel === 'strict' && existing.options?.validationAction === 'error') {
    // Only an explicitly reviewed predecessor may be upgraded. Replaying after collMod is safe.
    await db.command({ collMod: definition.name, ...options });
    existing.options.validator = options.validator;
  }
  if (!existing || !(isDeepStrictEqual(existing.options?.validator, options.validator)
    || (optionsForMigration.successors?.[definition.name] && [optionsForMigration.successors[definition.name]].flat().some(successor=>isDeepStrictEqual(existing.options?.validator, successor))))
    || existing.options?.validationLevel !== 'strict' || existing.options?.validationAction !== 'error') {
    throw new DatabaseError('DB_SCHEMA_DRIFT', `Schema differs for ${definition.name}; use a new reviewed migration.`);
  }
  await db.collection(definition.name).createIndexes(definition.indexes);
}

export async function setupDatabase(db: Db) {
  return runMigration(db, migrationName, migrationId, migrationChecksum, foundationDefinitions);
}

export async function runMigration(db: Db, migrationName: string, migrationId: string, migrationChecksum: string, definitions: CollectionDefinition[], options: MigrationOptions = {}) {
  const topology = await db.admin().command({ hello: 1 });
  if (!topology.setName && topology.msg !== 'isdbgrid') {
    throw new DatabaseError('DB_REPLICA_SET_REQUIRED', 'Database setup requires a replica set or transaction-capable sharded deployment.');
  }
  await ensureCollection(db, migrationDefinition);
  const migrations = db.collection<Document & { _id: string }>('schemaMigrations');
  const now = new Date();
  try {
    await migrations.updateOne({ _id: migrationId }, { $setOnInsert: {
      migrationName, checksum: migrationChecksum, state: 'failed', schemaVersion: 1,
      createdAt: now, updatedAt: now,
    } }, { upsert: true });
  } catch (error) {
    if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
  }
  const previous = await migrations.findOne({ _id: migrationId });
  if (previous?.checksum !== migrationChecksum) {
    throw new DatabaseError('DB_MIGRATION_CHANGED', 'Migration checksum differs. Do not edit an applied migration.');
  }
  const holder = `run_${randomUUID().replaceAll('-', '')}`;
  const claimed = await migrations.findOneAndUpdate({
    _id: migrationId, checksum: migrationChecksum,
    $or: [{ lease: { $exists: false } }, { 'lease.until': { $lte: now } }],
  }, {
    $set: { state: 'running', updatedAt: now, 'lease.holder': holder, 'lease.until': new Date(now.getTime() + 300_000) },
    $inc: { 'lease.fence': Long.ONE }, $unset: { errorCode: '' },
  }, { returnDocument: 'after' });
  if (!claimed) throw new DatabaseError('DB_SETUP_BUSY', 'Another database setup holds the migration lease. Retry after it finishes or the lease expires.');
  const owned = { _id: migrationId, 'lease.holder': holder, 'lease.fence': claimed.lease.fence };
  try {
    // Replay reviewed DDL on resume; checkpoint is progress evidence, not permission to skip validation.
    for (const definition of definitions) {
      const renewed = await migrations.updateOne({ ...owned, 'lease.until': { $gt: new Date() } }, {
        $set: { 'lease.until': new Date(Date.now() + 300_000), updatedAt: new Date() },
      });
      if (!renewed.matchedCount) throw new DatabaseError('DB_SETUP_LEASE_LOST', 'Database setup lease expired; rerun setup.');
      await ensureCollection(db, definition, options);
      const progress = await migrations.updateOne(owned, { $set: { checkpoint: { collection: definition.name }, updatedAt: new Date() } });
      if (!progress.matchedCount) throw new DatabaseError('DB_SETUP_LEASE_LOST', 'Database setup lease was replaced; rerun setup.');
    }
    const result = await migrations.updateOne({ ...owned, 'lease.until': { $gt: new Date() } }, {
      $set: { state: 'completed', updatedAt: new Date(), 'lease.until': new Date(0) },
    });
    if (!result.matchedCount) throw new DatabaseError('DB_SETUP_LEASE_LOST', 'Database setup lease expired; rerun setup.');
    return { migration: migrationName, collections: definitions.map(item => item.name) };
  } catch (error) {
    await migrations.updateOne(owned, {
      $set: { state: 'failed', updatedAt: new Date(), 'lease.until': new Date(0), errorCode: error instanceof DatabaseError ? error.code : 'DB_SETUP_FAILED' },
    }).catch(() => undefined);
    throw error;
  }
}
