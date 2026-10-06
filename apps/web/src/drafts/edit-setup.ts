import 'server-only';
import {createHash} from 'node:crypto';
import type {Db} from 'mongodb';
import {runMigration} from '../db/setup';
import {DatabaseError} from '../db/config';
import {assertStoryboardsReady} from '../storyboards/setup';
import {draftDefinition} from './schema';
import {editableDraftDefinition,draftCommandDefinition} from './edit-schema';
const definitions=[editableDraftDefinition,draftCommandDefinition],id='mig_editableplan00001',checksum=createHash('sha256').update(JSON.stringify(definitions)).digest('hex');
export async function setupEditableDrafts(db:Db){await assertStoryboardsReady(db);return runMigration(db,'007-editable-storyboard',id,checksum,definitions,{upgradeFrom:{drafts:draftDefinition.validator}});}
export async function assertEditableDraftsReady(db:Db){if(!await db.collection('schemaMigrations').findOne({_id:id as never,checksum,state:'completed'}))throw new DatabaseError('EDITABLE_DRAFT_SETUP_REQUIRED','Run db:setup before editing storyboards.');}
