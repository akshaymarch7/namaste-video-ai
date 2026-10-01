import 'server-only';
import { createHash } from 'node:crypto';
import type { Db } from 'mongodb';
import { runMigration } from '../db/setup';
import { assertDraftsReady } from '../drafts/setup';
import { DatabaseError } from '../db/config';
import type { CollectionDefinition } from '../db/schema';
const text = (maxLength: number) => ({ bsonType: 'string', maxLength });
const fields = { _id: { bsonType: 'string', pattern: '^job_[a-f0-9]{32}$' }, schemaVersion: { bsonType: 'int', enum: [1] },
  ownerId: text(256), projectId: text(80), keyHash: text(64), requestHash: text(64), model: text(100), sourceDraftRevision: { bsonType: 'int', minimum: 1 },
  state: { enum: ['running','completed','failed','unknown'] }, errorCode: { bsonType: ['string','null'] },
  suggestions: { bsonType: 'array', maxItems: 5, items: { bsonType: 'object', additionalProperties: false, required: ['title','topic','angle'], properties: { title: text(100), topic: text(2000), angle: text(300) } } },
  createdAt: { bsonType: 'date' }, updatedAt: { bsonType: 'date' }, deadline: { bsonType: 'date' } };
export const ideaDefinition: CollectionDefinition = { name: 'ideaRequests', validator: { $jsonSchema: { bsonType: 'object', additionalProperties: false, required: Object.keys(fields), properties: fields } }, indexes: [
  { name: 'idea_key', key: { ownerId: 1, projectId: 1, keyHash: 1 }, unique: true },
  { name: 'idea_latest', key: { ownerId: 1, projectId: 1, createdAt: -1, _id: -1 } },
] };
export const ideaMigrationId = 'mig_ideas000000000001';
export const ideaChecksum = createHash('sha256').update(JSON.stringify(ideaDefinition)).digest('hex');
export async function setupIdeas(db: Db) { await assertDraftsReady(db); return runMigration(db, '004-idea-requests', ideaMigrationId, ideaChecksum, [ideaDefinition]); }
export async function assertIdeasReady(db: Db) {
  if (!await db.collection('schemaMigrations').findOne({ _id: ideaMigrationId as never, checksum: ideaChecksum, state: 'completed' })) throw new DatabaseError('IDEA_SETUP_REQUIRED', 'Run db:setup before AI suggestions.');
  const indexes = await db.collection('ideaRequests').indexes();
  for (const index of ideaDefinition.indexes) if (!indexes.some(i => i.name === index.name && JSON.stringify(i.key) === JSON.stringify(index.key) && Boolean(i.unique) === Boolean(index.unique))) throw new DatabaseError('IDEA_SETUP_REQUIRED', 'Idea request indexes are missing.');
}
