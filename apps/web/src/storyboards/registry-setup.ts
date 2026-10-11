import 'server-only';
import {createHash} from 'node:crypto';
import type {Db} from 'mongodb';
import {runMigration} from '../db/setup';
import {storyboardDefinitions} from './setup';
import {snapshotCandidateDefinition} from './snapshot-schema';
import {editableDraftDefinition} from '../drafts/edit-schema';
import {chartCandidateDefinition,chartDraftDefinition} from './registry-schema';
import {assertStoryboardSnapshotsReady} from './snapshot-setup';
const oldCandidate=snapshotCandidateDefinition(storyboardDefinitions[1]);
export const registryDefinitions=[chartCandidateDefinition(oldCandidate),chartDraftDefinition(editableDraftDefinition)];
const id='mig_visualregistry00001',checksum=createHash('sha256').update(JSON.stringify(registryDefinitions)).digest('hex');
export async function setupVisualRegistry(db:Db){await assertStoryboardSnapshotsReady(db);return runMigration(db,'023-proportional-charts',id,checksum,registryDefinitions,{upgradeFrom:{storyboards:oldCandidate.validator,drafts:editableDraftDefinition.validator}});}
