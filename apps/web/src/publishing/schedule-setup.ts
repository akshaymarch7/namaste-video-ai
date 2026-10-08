import 'server-only';
import {createHash} from 'node:crypto';
import type {Db} from 'mongodb';
import {runMigration} from '../db/setup';
import {DatabaseError} from '../db/config';
import {publishingDefinitions} from './setup';
import {schedulingDefinition} from './schedule-schema';
const intent=schedulingDefinition(publishingDefinitions[0]);
// Immutable revision snapshots preserve all fields that the user explicitly approved.
const properties=(intent.validator as any).$jsonSchema.properties;
const names=['ownerId','projectId','videoId','videoTitle','videoApprovalId','assetId','assetHash','renderSpecHash','connectionId','instagramUserId','destinationEpoch','usernameAtApproval','caption','mode','schedule','retryDeadlineAt'];
const definitions=[intent,{name:'publishRevisions',validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:['_id','intentId','revision','approvedAt',...names],properties:{_id:{bsonType:'string'},intentId:{bsonType:'string'},revision:{bsonType:'int',minimum:1},approvedAt:{bsonType:'date'},...Object.fromEntries(names.map(n=>[n,properties[n]]))}}},indexes:[{name:'publication_revision',key:{intentId:1,revision:1},unique:true}]}];
const id='mig_schedule00000001',checksum=createHash('sha256').update(JSON.stringify(definitions)).digest('hex');
export async function setupScheduling(db:Db){return runMigration(db,'019-scheduling',id,checksum,definitions,{upgradeFrom:{publishIntents:publishingDefinitions[0].validator}});}
export async function assertSchedulingReady(db:Db){if(!await db.collection('schemaMigrations').findOne({_id:id as never,checksum,state:'completed'}))throw new DatabaseError('SCHEDULE_SETUP_REQUIRED','Run db:setup before publishing.');}
export const revisionFields=names;
