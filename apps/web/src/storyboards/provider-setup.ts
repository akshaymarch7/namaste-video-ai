import 'server-only';
import {createHash} from 'node:crypto';
import type {Db} from 'mongodb';
import {runMigration} from '../db/setup';
import {registryDefinitions,setupVisualRegistry} from './registry-setup';
import {providerCandidateDefinition} from './provider-schema';
export const providerDefinition=providerCandidateDefinition(registryDefinitions[0]);
const id='mig_storyboardproviders01',checksum=createHash('sha256').update(JSON.stringify([providerDefinition])).digest('hex');
export async function setupStoryboardProviders(db:Db){
 await setupVisualRegistry(db);
 return runMigration(db,'025-storyboard-providers',id,checksum,[providerDefinition],{upgradeFrom:{storyboards:registryDefinitions[0].validator}});
}
