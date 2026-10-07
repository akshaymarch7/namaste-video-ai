import 'server-only';
import {createHash} from 'node:crypto';
import {Long,type Db} from 'mongodb';
import type {CollectionDefinition} from '../db/schema';
import {runMigration} from '../db/setup';
import {DatabaseError} from '../db/config';
import {jobDefinitions} from './setup';
export function renderJobDefinition(){
 const d=structuredClone(jobDefinitions[0]);
 d.validator.$jsonSchema.properties.state.enum.push('succeeded');
 d.validator.$jsonSchema.properties.stage.enum.push('speech','rendering','uploading','complete');
 return d;
}
const text={bsonType:'string',minLength:1,maxLength:256},date={bsonType:'date'};
const def=(name:string,properties:Record<string,unknown>,indexes:CollectionDefinition['indexes']):CollectionDefinition=>({name,validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:Object.keys(properties),properties}},indexes});
export function renderDefinitions(){return [renderJobDefinition(),
 def('renderScheduler',{_id:{enum:['global']},revision:{bsonType:'long',minimum:0}},[]),
 def('speechStages',{_id:text,jobId:text,ownerId:text,projectId:text,sceneId:text,fingerprint:text,objectKey:text,state:{enum:['request_started','stored']},result:{bsonType:['object','null']},createdAt:date,updatedAt:date},[{name:'speech_scene',key:{jobId:1,sceneId:1},unique:true},{name:'speech_project',key:{ownerId:1,projectId:1,_id:1}}]),
 def('renderOutputs',{_id:text,jobId:text,ownerId:text,projectId:text,inputHash:text,videoAssetId:text,captionsAssetId:text,duration:{bsonType:['int','double'],minimum:60,maximum:90},createdAt:date},[{name:'render_job',key:{jobId:1},unique:true},{name:'render_project',key:{ownerId:1,projectId:1,createdAt:-1,_id:-1}}]),
];}
const id='mig_renderexecution001';
const checksum=()=>createHash('sha256').update(JSON.stringify(renderDefinitions())).digest('hex');
export async function setupRendering(db:Db){
 const result=await runMigration(db,'013-render-execution',id,checksum(),renderDefinitions(),{upgradeFrom:{generationJobs:jobDefinitions[0].validator}});
 await db.collection('renderScheduler').updateOne({_id:'global' as never},{$setOnInsert:{revision:Long.ZERO}},{upsert:true});return result;
}
export async function assertRenderingReady(db:Db){if(!await db.collection('schemaMigrations').findOne({_id:id as never,checksum:checksum(),state:'completed'}))throw new DatabaseError('RENDER_SETUP_REQUIRED','Run db:setup before video generation.');}
