import {editableDraftDefinition} from './edit-schema';
import 'server-only';
import { createHash } from 'node:crypto';
import type { Db } from 'mongodb';
import { DatabaseError } from '../db/config';
import { runMigration } from '../db/setup';
import { assertProjectsReady, definitions } from '../projects/setup';
import { draftDefinition } from './schema';
export const draftMigrationId = 'mig_drafts00000000001';
export const draftChecksum = createHash('sha256').update(JSON.stringify({ from: definitions[0].validator, to: draftDefinition })).digest('hex');
export async function setupDrafts(db: Db) {
  await assertProjectsReady(db);
  return runMigration(db, '003-idea-drafts', draftMigrationId, draftChecksum, [draftDefinition], { upgradeFrom: { drafts: definitions[0].validator }, successors:{drafts:editableDraftDefinition.validator} });
}
export async function assertDraftsReady(db: Db) {
  if (!await db.collection('schemaMigrations').findOne({ _id: draftMigrationId as never, checksum: draftChecksum, state: 'completed' })) {
    throw new DatabaseError('DRAFT_SETUP_REQUIRED', 'Run db:setup before draft operations.');
  }
}
