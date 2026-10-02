import type {CollectionDefinition} from '../db/schema';
import {queuedReceiptDefinition} from './queue-schema';
import 'server-only';
import {createHash} from 'node:crypto';
import type {Db} from 'mongodb';
import {runMigration} from '../db/setup';
import {DatabaseError} from '../db/config';
import {assertStoryboardsReady,storyboardDefinitions} from './setup';
const text=(maxLength:number)=>({bsonType:'string',maxLength});
const receipts=queuedReceiptDefinition(storyboardDefinitions[0]);
const fields={_id:{bsonType:'string',pattern:'^job_[a-f0-9]{32}$'},ownerId:text(256),projectId:text(80),model:text(100),
  state:{enum:['queued','running','done']},createdAt:{bsonType:'date'},deadline:{bsonType:'date'},
  draft:{anyOf:[{bsonType:'null'},{bsonType:'object',additionalProperties:false,required:['topic','audience','notes','voicePreset'],properties:{topic:text(2000),audience:text(200),notes:text(20000),voicePreset:text(64)}}]}};
export const queueDefinition:CollectionDefinition={name:'storyboardQueue',validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:Object.keys(fields),properties:fields}},indexes:[{name:'storyboard_queue_work',key:{state:1 as const,createdAt:1 as const}},{name:'storyboard_queue_deadline',key:{state:1 as const,deadline:1 as const}}]};
const id='mig_storyboardqueue001',checksum=createHash('sha256').update(JSON.stringify([receipts,queueDefinition])).digest('hex');
export async function setupStoryboardQueue(db:Db){await assertStoryboardsReady(db);return runMigration(db,'006-storyboard-queue',id,checksum,[receipts,queueDefinition],{upgradeFrom:{storyboardRequests:storyboardDefinitions[0].validator}});}
export async function assertStoryboardQueueReady(db:Db){
  await assertStoryboardsReady(db);
  if(!await db.collection('schemaMigrations').findOne({_id:id as never,checksum,state:'completed'}))throw new DatabaseError('STORYBOARD_QUEUE_SETUP_REQUIRED','Run db:setup before background generation.');
  const indexes=await db.collection(queueDefinition.name).indexes();
  for(const index of queueDefinition.indexes)if(!indexes.some(i=>i.name===index.name&&JSON.stringify(i.key)===JSON.stringify(index.key)))throw new DatabaseError('STORYBOARD_QUEUE_SETUP_REQUIRED','Queue indexes are missing.');
}
