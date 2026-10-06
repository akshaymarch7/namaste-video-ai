import 'server-only';
import {createHash} from 'node:crypto';
import type {Db} from 'mongodb';
import {runMigration} from '../db/setup';
import {DatabaseError} from '../db/config';
import type {CollectionDefinition} from '../db/schema';
import {assertStoryboardQueueReady} from './queue-setup';
const text=(maxLength:number)=>({bsonType:'string',minLength:1,maxLength});
const fields={_id:{bsonType:'string',pattern:'^job_[a-f0-9]{32}$'},ownerId:text(256),projectId:text(80),
 sourceStoryboardId:{bsonType:'string',pattern:'^stb_[a-f0-9]{32}$'},sourceContentHash:{bsonType:'string',pattern:'^[a-f0-9]{64}$'},
 instruction:text(4000),sceneId:{bsonType:['string','null'],pattern:'^[a-z][a-z0-9-]{0,49}$'},createdAt:{bsonType:'date'}};
export const revisionDefinition:CollectionDefinition={name:'storyboardRevisions',validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:Object.keys(fields),properties:fields}},indexes:[{name:'revision_project_history',key:{ownerId:1,projectId:1,createdAt:-1,_id:-1}}]};
const id='mig_storyboardrevisions001',checksum=createHash('sha256').update(JSON.stringify(revisionDefinition)).digest('hex');
export async function setupStoryboardRevisions(db:Db){await assertStoryboardQueueReady(db);return runMigration(db,'008-storyboard-revisions',id,checksum,[revisionDefinition]);}
export async function assertStoryboardRevisionsReady(db:Db){
 await assertStoryboardQueueReady(db);
 if(!await db.collection('schemaMigrations').findOne({_id:id as never,checksum,state:'completed'}))throw new DatabaseError('REVISION_SETUP_REQUIRED','Run db:setup before storyboard revisions.');
 const indexes=await db.collection(revisionDefinition.name).indexes();
 for(const index of revisionDefinition.indexes)if(!indexes.some(i=>i.name===index.name&&JSON.stringify(i.key)===JSON.stringify(index.key)))throw new DatabaseError('REVISION_SETUP_REQUIRED','Revision indexes are missing.');
}
