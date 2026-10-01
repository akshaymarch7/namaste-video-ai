import type { CollectionDefinition } from '../db/schema';
const text = (maxLength: number, minLength = 0) => ({ bsonType: 'string', minLength, maxLength });
const id = { bsonType: 'string', pattern: '^[a-z]{2,8}_[A-Za-z0-9_-]{16,64}$' };
const properties = {
  _id: id, schemaVersion: { bsonType: 'int', enum: [1] }, ownerId: text(256, 1), projectId: id,
  createdAt: { bsonType: 'date' }, updatedAt: { bsonType: 'date' }, revision: { bsonType: 'int', minimum: 1, maximum: 2147483647 },
  topic: text(2000), audience: text(200), notes: text(20000), voicePreset: text(64, 1),
  // Structured storyboard editing is introduced with its own reviewed migration in F09/F10.
  editablePlan: { bsonType: 'null' }, planStale: { enum: [false] },
  contentHash: { bsonType: 'string', pattern: '^[a-f0-9]{64}$' }, canonicalizationVersion: { bsonType: 'int', enum: [1] },
  validationIssues: { bsonType: 'array', maxItems: 0 },
};
export const draftDefinition: CollectionDefinition = {
  name: 'drafts', validator: { $jsonSchema: { bsonType: 'object', additionalProperties: false, required: Object.keys(properties), properties } },
  indexes: [{ name: 'draft_owner_project', key: { ownerId: 1, projectId: 1 }, unique: true }],
};
