import 'server-only';
import {createHash} from 'node:crypto';
import type {Db} from 'mongodb';
import {runMigration} from '../db/setup';
import {DatabaseError} from '../db/config';
import type {CollectionDefinition} from '../db/schema';
import {states} from './contracts';
const text={bsonType:'string',minLength:1,maxLength:256},hash={bsonType:'string',pattern:'^[a-f0-9]{64}$'},date={bsonType:'date'},nullableDate={bsonType:['date','null']},nullableText={bsonType:['string','null'],maxLength:256};
const secret={bsonType:'object',additionalProperties:false,required:['keyId','nonce','ciphertext','tag'],properties:{keyId:text,nonce:text,ciphertext:{bsonType:'string',maxLength:12000},tag:text}};
const def=(name:string,required:Record<string,unknown>,optional:Record<string,unknown>,indexes:CollectionDefinition['indexes']):CollectionDefinition=>({name,validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:Object.keys(required),properties:{...required,...optional}}},indexes});
export const publishingDefinitions=[
 def('publishIntents',{_id:text,ownerId:text,projectId:text,revision:{bsonType:'int',minimum:1},state:{enum:states},videoId:text,videoTitle:text,videoApprovalId:text,assetId:text,assetHash:hash,renderSpecHash:hash,connectionId:text,instagramUserId:text,destinationEpoch:{bsonType:'int',minimum:1},usernameAtApproval:text,caption:{bsonType:'string',maxLength:4400},provider:{enum:['facebook','instagram']},providerAppId:text,createdAt:date,updatedAt:date,nextRunAt:date,leaseUntil:nullableDate,attempt:{bsonType:'int',minimum:1},polls:{bsonType:'int',minimum:0},containerId:nullableText,providerMediaId:nullableText,permalink:{bsonType:['string','null'],maxLength:2048},publishedAt:nullableDate,errorCode:nullableText},
 {encryptedToken:secret,ingestToken:secret,expiresAt:date},
 [{name:'publish_video_destination',key:{ownerId:1,videoId:1,instagramUserId:1},unique:true},{name:'publish_owner_history',key:{ownerId:1,projectId:1,createdAt:-1,_id:-1}},{name:'publish_due',key:{state:1,nextRunAt:1}},{name:'publish_connection',key:{ownerId:1,connectionId:1,state:1}}]),
 def('publishCommands',{_id:text,ownerId:text,keyHash:hash,requestHash:hash,intentId:text,createdAt:date},{},[{name:'publish_command_key',key:{ownerId:1,keyHash:1},unique:true}]),
 def('publishMediaGrants',{_id:text,ownerId:text,projectId:text,intentId:text,assetId:text,assetHash:hash,attempt:{bsonType:'int',minimum:1},tokenHash:hash,expiresAt:date},{},[{name:'publish_media_token',key:{tokenHash:1},unique:true},{name:'publish_media_expiry',key:{expiresAt:1},expireAfterSeconds:0}]),
];
const id='mig_publish000000001',checksum=createHash('sha256').update(JSON.stringify(publishingDefinitions)).digest('hex');
export async function setupPublishing(db:Db){return runMigration(db,'018-publishing',id,checksum,publishingDefinitions);}
export async function assertPublishingReady(db:Db){if(!await db.collection('schemaMigrations').findOne({_id:id as never,checksum,state:'completed'}))throw new DatabaseError('PUBLISH_SETUP_REQUIRED','Run db:setup before publishing.');}
