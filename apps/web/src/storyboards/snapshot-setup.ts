import 'server-only';
import {createHash} from 'node:crypto';
import type {Db} from 'mongodb';
import {runMigration} from '../db/setup';
import {DatabaseError} from '../db/config';
import type {CollectionDefinition} from '../db/schema';
import {storyboardDefinitions} from './setup';
import {assertStoryboardRevisionsReady} from './revision-setup';
import {snapshotCandidateDefinition} from './snapshot-schema';
const text=(maxLength:number)=>({bsonType:'string',minLength:1,maxLength});
const hash={bsonType:'string',pattern:'^[a-f0-9]{64}$'};
const storyboardId={bsonType:'string',pattern:'^stb_[a-f0-9]{32}$'};
const fields={_id:{bsonType:'string',pattern:'^job_[a-f0-9]{32}$'},ownerId:text(256),projectId:text(80),keyHash:hash,requestHash:hash,
 storyboardId,sourceStoryboardId:storyboardId,sourceContentHash:hash,createdAt:{bsonType:'date'}};
export const snapshotDefinition:CollectionDefinition={name:'storyboardSnapshots',validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:Object.keys(fields),properties:fields}},indexes:[{name:'storyboard_snapshot_key',key:{ownerId:1,projectId:1,keyHash:1},unique:true}]};
const candidate=snapshotCandidateDefinition(storyboardDefinitions[1]);
const id='mig_storyboardsnapshots001',checksum=createHash('sha256').update(JSON.stringify([candidate,snapshotDefinition])).digest('hex');
export async function setupStoryboardSnapshots(db:Db){await assertStoryboardRevisionsReady(db);return runMigration(db,'009-storyboard-snapshots',id,checksum,[candidate,snapshotDefinition],{upgradeFrom:{storyboards:storyboardDefinitions[1].validator}});}
export async function assertStoryboardSnapshotsReady(db:Db){
 await assertStoryboardRevisionsReady(db);
 if(!await db.collection('schemaMigrations').findOne({_id:id as never,checksum,state:'completed'}))throw new DatabaseError('SNAPSHOT_SETUP_REQUIRED','Run db:setup before saving edited versions.');
 const indexes=await db.collection(snapshotDefinition.name).indexes();
 for(const index of snapshotDefinition.indexes)if(!indexes.some(i=>i.name===index.name&&JSON.stringify(i.key)===JSON.stringify(index.key)&&Boolean(i.unique)===Boolean(index.unique)))throw new DatabaseError('SNAPSHOT_SETUP_REQUIRED','Snapshot indexes are missing.');
}
