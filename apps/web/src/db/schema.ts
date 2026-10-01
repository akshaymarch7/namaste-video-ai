import type { Document, IndexDescription } from 'mongodb';

const id = { bsonType: 'string', pattern: '^[a-z]{2,8}_[A-Za-z0-9_-]{16,64}$' };
const user = { bsonType: 'string', minLength: 1, maxLength: 256 };
const text = (maxLength: number, minLength = 1) => ({ bsonType: 'string', minLength, maxLength });
const int = { bsonType: 'int', minimum: 1, maximum: 2147483647 };
const long = { bsonType: 'long', minimum: 1 };
const date = { bsonType: 'date' };
const base = { _id: id, schemaVersion: { bsonType: 'int', enum: [1] }, createdAt: date, updatedAt: date };
function object(properties: Document, required = Object.keys(properties)): Document {
  return { bsonType: 'object', required, additionalProperties: false, properties };
}
export type CollectionDefinition = { name: string; validator: Document; indexes: IndexDescription[] };
function collection(name: string, fields: Document, optional: Document, indexes: IndexDescription[]): CollectionDefinition {
  return {
    name, indexes,
    validator: { $jsonSchema: object({ ...base, ...fields, ...optional }, [...Object.keys(base), ...Object.keys(fields)]) },
  };
}
export const projectFlags = ['drafts', 'ready', 'scheduled', 'published', 'needsAttention'] as const;

export const migrationDefinition = collection('schemaMigrations', {
  migrationName: text(100), checksum: { bsonType: 'string', pattern: '^[a-f0-9]{64}$' },
  state: { enum: ['running', 'completed', 'failed'] },
}, {
  checkpoint: object({ collection: text(100) }),
  lease: object({ holder: id, until: date, fence: long }),
  errorCode: text(80),
}, [{ name: 'migration_name', key: { migrationName: 1 }, unique: true }]);

export const foundationDefinitions: CollectionDefinition[] = [
  collection('internalAccess', {
    normalizedEmail: { ...text(254), pattern: '^[^\\sA-Z]+@[^\\sA-Z]+$' },
    enabled: { bsonType: 'bool' }, provisioningState: { enum: ['pending', 'active', 'disabled'] }, operatorRef: text(256),
  }, { provisionedUserId: user }, [
    { name: 'access_email', key: { normalizedEmail: 1 }, unique: true },
    { name: 'access_user', key: { provisionedUserId: 1 }, unique: true, partialFilterExpression: { provisionedUserId: { $type: 'string' } } },
  ]),
  collection('preferences', { ownerId: user, revision: int, timezone: text(100), defaultVoicePreset: text(64) }, {}, [
    { name: 'preference_owner', key: { ownerId: 1 }, unique: true },
  ]),
  collection('projects', {
    ownerId: user, title: { ...text(100), pattern: '\\S' }, revision: int, draftRevision: int,
    conversationId: id, deletedAt: { bsonType: ['date', 'null'] }, contentRevision: long,
    flags: object(Object.fromEntries(projectFlags.map(flag => [flag, { bsonType: 'bool' }]))),
  }, { currentStoryboardId: id, latestReadyVideoId: id, selectedVideoId: id, activeJobId: id }, [
    { name: 'project_list', key: { ownerId: 1, deletedAt: 1, updatedAt: -1, _id: -1 } },
    ...projectFlags.map(flag => ({ name: `project_flag_${flag}`, key: { ownerId: 1, deletedAt: 1, [`flags.${flag}`]: 1, updatedAt: -1, _id: -1 } } as IndexDescription)),
  ]),
  collection('conversations', { ownerId: user, projectId: id, kind: { enum: ['project'] }, nextSequence: long }, {}, [
    { name: 'conversation_project', key: { ownerId: 1, projectId: 1, kind: 1 }, unique: true },
  ]),
];
