import 'server-only';
import {createHash} from 'node:crypto';
import type {Db} from 'mongodb';
import {runMigration} from '../db/setup';
import {DatabaseError} from '../db/config';
import type {CollectionDefinition} from '../db/schema';
const hash={bsonType:'string',pattern:'^[a-f0-9]{64}$'},date={bsonType:'date'};
export const deletionDefinitions:CollectionDefinition[]=[
 {name:'instagramDeletions',validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:['_id','eventHash','subjectHash','appId','state','reason','requestedAt','createdAt','updatedAt'],properties:{_id:hash,eventHash:hash,subjectHash:hash,appId:{bsonType:'string',pattern:'^\\d{1,100}$'},profileId:{bsonType:'string',pattern:'^\\d{1,100}$'},state:{enum:['needs_review','completed']},reason:{enum:['unmapped','newer_consent','publication_unknown','history_scope','completed']},requestedAt:date,createdAt:date,updatedAt:date,completedAt:date,reviewedAt:date}}},indexes:[{name:'deletion_event',key:{eventHash:1},unique:true},{name:'deletion_subject',key:{subjectHash:1,state:1}},{name:'deletion_account',key:{appId:1,profileId:1,state:1}}]},
 {name:'instagramPublicationTombstones',validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:['_id','createdAt'],properties:{_id:hash,createdAt:date}}},indexes:[]},
];
const id='mig_igdelete00000001',checksum=createHash('sha256').update(JSON.stringify(deletionDefinitions)).digest('hex');
export async function setupInstagramDeletion(db:Db){return runMigration(db,'021-instagram-deletion',id,checksum,deletionDefinitions);}
export async function assertInstagramDeletionReady(db:Db){if(!await db.collection('schemaMigrations').findOne({_id:id as never,checksum,state:'completed'}))throw new DatabaseError('INSTAGRAM_DELETION_SETUP_REQUIRED','Run db:setup before enabling deletion.');}
