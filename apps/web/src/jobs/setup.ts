import {measureStage} from '../diagnostics/timing';
import 'server-only';
import {createHash} from 'node:crypto';
import type {Db} from 'mongodb';
import {runMigration} from '../db/setup';
import {DatabaseError} from '../db/config';
import {assertStorageReady} from '../storage/setup';
import type {CollectionDefinition} from '../db/schema';
import {renderJobDefinition,setupRendering} from './render-setup';
const text=(maxLength=256)=>({bsonType:'string',minLength:1,maxLength});
const date={bsonType:'date'},nullableDate={bsonType:['date','null']},integer={bsonType:'int',minimum:0},hash={bsonType:'string',pattern:'^[a-f0-9]{64}$'};
function definition(name:string,properties:Record<string,unknown>,indexes:CollectionDefinition['indexes']):CollectionDefinition{return {name,validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:Object.keys(properties),properties}},indexes};}
export const jobDefinitions:CollectionDefinition[]=[
 definition('generationJobs',{_id:{bsonType:'string',pattern:'^job_[a-f0-9]{32}$'},ownerId:text(),projectId:text(80),storyboardId:text(80),approvalId:text(80),inputHash:hash,inputSnapshot:{bsonType:'object'},state:{enum:['queued','running','cancel_requested','cancelled','needs_input','failed']},stage:{enum:['queued','checking','stopped']},revision:{bsonType:'int',minimum:1},attempt:integer,fence:integer,leaseUntil:nullableDate,deadlineAt:date,errorCode:{bsonType:['string','null']},createdAt:date,updatedAt:date,finishedAt:nullableDate},[{name:'generation_project',key:{ownerId:1,projectId:1,createdAt:-1,_id:-1}},{name:'generation_reconcile',key:{state:1,deadlineAt:1}},{name:'generation_lease',key:{state:1,leaseUntil:1}}]),
 definition('generationCommands',{_id:text(80),ownerId:text(),projectId:text(80),route:text(160),keyHash:hash,requestHash:hash,jobId:text(80),response:{bsonType:'object'},createdAt:date},[{name:'generation_command',key:{ownerId:1,projectId:1,route:1,keyHash:1},unique:true}]),
 definition('generationOutbox',{_id:text(80),jobId:text(80),state:{enum:['pending','leased','sent']},leaseToken:{bsonType:['string','null']},leaseUntil:nullableDate,availableAt:date,createdAt:date},[{name:'generation_event',key:{jobId:1},unique:true},{name:'generation_dispatch',key:{state:1,availableAt:1,leaseUntil:1}}]),
];
const id='mig_generationjobs001',checksum=createHash('sha256').update(JSON.stringify(jobDefinitions)).digest('hex');
export async function setupJobs(db:Db){await assertStorageReady(db);await runMigration(db,'012-generation-jobs',id,checksum,jobDefinitions,{successors:{generationJobs:renderJobDefinition().validator}});return setupRendering(db);}
async function assertJobsReadyImpl(db:Db){
 if(!await db.collection('schemaMigrations').findOne({_id:id as never,checksum,state:'completed'}))throw new DatabaseError('JOBS_SETUP_REQUIRED','Run db:setup before using generation jobs.');
 for(const d of jobDefinitions){const indexes=await db.collection(d.name).indexes();for(const i of d.indexes)if(!indexes.some(x=>x.name===i.name&&JSON.stringify(x.key)===JSON.stringify(i.key)&&Boolean(x.unique)===Boolean(i.unique)))throw new DatabaseError('JOBS_SETUP_REQUIRED','Generation indexes are missing.');}
}

export function assertJobsReady(db:Db){return measureStage('readiness',()=>assertJobsReadyImpl(db));}
