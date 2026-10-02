import {queuedReceiptDefinition} from './queue-schema';
import 'server-only';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Db, Document } from 'mongodb';
import { runMigration } from '../db/setup';
import { assertIdeasReady } from '../ideas/setup';
import { DatabaseError } from '../db/config';
import type { CollectionDefinition } from '../db/schema';
import { storyboardSchema } from './contracts';
// Convert this bounded JSON Schema subset to Mongo's draft-4 BSON dialect.
function bson(schema: any): Document {
  const result: Document = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === '$schema') continue;
    if (key === 'type') result.bsonType = value === 'integer' ? 'int' : value === 'number' ? ['double','int'] : value;
    else if (key === 'const') result.enum = [value];
    else if (key === 'properties') result.properties = Object.fromEntries(Object.entries(value as object).map(([k,v]) => [k,bson(v)]));
    else if (key === 'items') result.items = bson(value);
    else if (['anyOf','oneOf','allOf'].includes(key)) result[key] = (value as object[]).map(bson);
    else result[key] = value;
  }
  return result;
}
const text = (maxLength: number) => ({ bsonType: 'string', minLength: 1, maxLength });
const object = (properties: Document) => ({ bsonType: 'object', additionalProperties: false, required: Object.keys(properties), properties });
const hash = { bsonType: 'string', pattern: '^[a-f0-9]{64}$' };
const int = { bsonType: 'int', minimum: 1, maximum: 2147483647 };
const date = { bsonType: 'date' };
const base = { schemaVersion: { bsonType: 'int', enum: [1] }, ownerId: text(256), projectId: text(80), sourceDraftRevision: int, createdAt: date, updatedAt: date };
const receiptFields = { ...base, _id: { bsonType: 'string', pattern: '^job_[a-f0-9]{32}$' }, keyHash: hash, requestHash: hash,
  model: text(100), state: { enum: ['running','completed','failed','unknown'] }, errorCode: { bsonType: ['string','null'], maxLength: 100 },
  storyboardId: { bsonType: ['string','null'], pattern: '^stb_[a-f0-9]{32}$' }, deadline: date };
const candidateFields = { ...base, _id: { bsonType: 'string', pattern: '^stb_[a-f0-9]{32}$' },
  content: bson(z.toJSONSchema(storyboardSchema)), contentHash: hash, storyHash: hash, canonicalizationVersion: { enum: [1] }, state: { enum: ['review_ready'] },
  estimatedDurationSeconds: { bsonType: ['double','int'], minimum: 60, maximum: 90 }, wordCount: { bsonType: 'int', minimum: 150, maximum: 225 },
  plannerConfig: object({ provider: { enum: ['gemini'] }, model: text(100), promptVersion: text(100) }),
  createdByJobId: { bsonType: 'string', pattern: '^job_[a-f0-9]{32}$' } };
export const storyboardDefinitions: CollectionDefinition[] = [
  { name: 'storyboardRequests', validator: { $jsonSchema: object(receiptFields) }, indexes: [
    { name: 'storyboard_request_key', key: { ownerId: 1, projectId: 1, keyHash: 1 }, unique: true },
    { name: 'storyboard_request_latest', key: { ownerId: 1, projectId: 1, createdAt: -1, _id: -1 } },
  ] },
  { name: 'storyboards', validator: { $jsonSchema: object(candidateFields) }, indexes: [
    { name: 'storyboard_history', key: { ownerId: 1, projectId: 1, createdAt: -1, _id: -1 } },
    { name: 'storyboard_request_result', key: { createdByJobId: 1 }, unique: true },
  ] },
];
export const storyboardMigrationId = 'mig_storyboards000001';
export const storyboardChecksum = createHash('sha256').update(JSON.stringify(storyboardDefinitions)).digest('hex');
export async function setupStoryboards(db: Db) { await assertIdeasReady(db); return runMigration(db, '005-storyboard-candidates', storyboardMigrationId, storyboardChecksum, storyboardDefinitions, {successors:{storyboardRequests:queuedReceiptDefinition(storyboardDefinitions[0]).validator}}); }
export async function assertStoryboardsReady(db: Db) {
  if (!await db.collection('schemaMigrations').findOne({ _id: storyboardMigrationId as never, checksum: storyboardChecksum, state: 'completed' })) throw new DatabaseError('STORYBOARD_SETUP_REQUIRED', 'Run db:setup before storyboard generation.');
  for (const definition of storyboardDefinitions) {
    const indexes = await db.collection(definition.name).indexes();
    for (const index of definition.indexes) if (!indexes.some(i => i.name === index.name && JSON.stringify(i.key) === JSON.stringify(index.key) && Boolean(i.unique) === Boolean(index.unique))) throw new DatabaseError('STORYBOARD_SETUP_REQUIRED', 'Storyboard indexes are missing.');
  }
}
