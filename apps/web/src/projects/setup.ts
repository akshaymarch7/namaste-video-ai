import 'server-only';
import { draftDefinition } from '../drafts/schema';
import { createHash } from 'node:crypto';
import type { Db } from 'mongodb';
import { DatabaseError } from '../db/config';
import { runMigration, migrationId as foundationId, migrationChecksum as foundationChecksum } from '../db/setup';
import type { CollectionDefinition } from '../db/schema';
const id = { bsonType: 'string', pattern: '^[a-z]{2,8}_[A-Za-z0-9_-]{16,64}$' };
const text = (maxLength: number, minLength = 0) => ({ bsonType: 'string', minLength, maxLength });
const obj = (properties: Record<string, unknown>) => ({ bsonType: 'object', additionalProperties: false, required: Object.keys(properties), properties });
const base = { _id: id, schemaVersion: { bsonType: 'int', enum: [1] }, ownerId: text(256, 1), projectId: id, createdAt: { bsonType: 'date' }, updatedAt: { bsonType: 'date' } };
// This additive migration only admits blank drafts. F07 must add a new reviewed migration for editing.
export const definitions: CollectionDefinition[] = [
  { name: 'drafts', validator: { $jsonSchema: obj({ ...base, revision: { bsonType: 'int', enum: [1] },
    topic: { enum: [''] }, audience: { enum: [''] }, notes: { enum: [''] }, voicePreset: text(64, 1),
    editablePlan: { bsonType: 'null' }, planStale: { enum: [false] }, contentHash: { bsonType: 'string', pattern: '^[a-f0-9]{64}$' },
    canonicalizationVersion: { bsonType: 'int', enum: [1] }, validationIssues: { bsonType: 'array', maxItems: 0 },
  }) }, indexes: [{ name: 'draft_owner_project', key: { ownerId: 1, projectId: 1 }, unique: true }] },
  { name: 'projectCommands', validator: { $jsonSchema: obj({ ...base, method: { enum: ['POST', 'DELETE'] },
    path: text(256, 1), keyHash: text(64, 64), requestHash: text(64, 64), status: { enum: [201, 204] },
    response: { bsonType: ['object', 'null'] },
  }) }, indexes: [
    { name: 'project_command_key', key: { ownerId: 1, method: 1, path: 1, keyHash: 1 }, unique: true },
    { name: 'project_command_parent', key: { ownerId: 1, projectId: 1 } },
  ] },
];
export const projectMigrationId = 'mig_projects0000000001';
export const checksum = createHash('sha256').update(JSON.stringify(definitions)).digest('hex');
export async function setupProjects(db: Db) {
  if (!await db.collection('schemaMigrations').findOne({ _id: foundationId as never, checksum: foundationChecksum, state: 'completed' })) throw new DatabaseError('DB_SETUP_REQUIRED', 'Run foundation setup first.');
  return runMigration(db, '002-projects', projectMigrationId, checksum, definitions, { successors: { drafts: draftDefinition.validator } });
}
export async function assertProjectsReady(db: Db) {
  if (!await db.collection('schemaMigrations').findOne({ _id: projectMigrationId as never, checksum, state: 'completed' })) throw new DatabaseError('PROJECT_SETUP_REQUIRED', 'Run db:setup before project operations.');
  // Runtime credentials never administer schemas/indexes.
  for (const definition of definitions) {
    const indexes = await db.collection(definition.name).indexes();
    for (const required of definition.indexes) if (!indexes.some(index => index.name === required.name && JSON.stringify(index.key) === JSON.stringify(required.key) && Boolean(index.unique) === Boolean(required.unique))) throw new DatabaseError('PROJECT_SETUP_REQUIRED', 'Project indexes are missing.');
  }
}
