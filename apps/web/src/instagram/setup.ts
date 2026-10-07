import 'server-only';
import {createHash} from 'node:crypto';
import type {Db} from 'mongodb';
import {runMigration} from '../db/setup';
import {DatabaseError} from '../db/config';
import type {CollectionDefinition} from '../db/schema';
const text={bsonType:'string',minLength:1,maxLength:256},hash={bsonType:'string',pattern:'^[a-f0-9]{64}$'},date={bsonType:'date'},int={bsonType:'int',minimum:0};
const base={_id:text,ownerId:text,createdAt:date,updatedAt:date};
const def=(name:string,required:Record<string,unknown>,optional:Record<string,unknown>,indexes:CollectionDefinition['indexes']):CollectionDefinition=>({name,validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:Object.keys({...base,...required}),properties:{...base,...required,...optional}}},indexes});
export const instagramDefinitions=[
 def('instagramConnections',{revision:{...int,minimum:1},state:{enum:['connected','reconnect_required','disconnected']},tokenRevision:int,destinationEpoch:{...int,minimum:1},oauthEpoch:int,scopes:{bsonType:'array',maxItems:20,items:text}},
 {instagramUserId:text,username:text,accountType:{enum:['BUSINESS','CREATOR']},encryptedToken:{bsonType:'object',additionalProperties:false,required:['keyId','nonce','ciphertext','tag'],properties:{keyId:text,nonce:text,ciphertext:{bsonType:'string',maxLength:12000},tag:text}},expiresAt:date,tokenIssuedAt:date,refreshLeaseUntil:date},
 [{name:'connection_owner',key:{ownerId:1},unique:true},{name:'connection_account',key:{instagramUserId:1},unique:true,partialFilterExpression:{instagramUserId:{$type:'string'}}},{name:'connection_refresh',key:{state:1,expiresAt:1}}]),
 def('oauthStates',{stateHash:hash,initiatingSessionHash:hash,connectionId:text,oauthEpoch:int,state:{enum:['pending','exchanging','consumed','failed']},expiresAt:date},{returnProjectId:text},[{name:'oauth_state',key:{stateHash:1},unique:true},{name:'oauth_expiry',key:{expiresAt:1},expireAfterSeconds:0}]),
 def('instagramCommands',{keyHash:hash,requestHash:hash,response:{bsonType:'object'}},{},[{name:'instagram_command',key:{ownerId:1,keyHash:1},unique:true}]),
];
const id='mig_instagram0000001',checksum=createHash('sha256').update(JSON.stringify(instagramDefinitions)).digest('hex');
export async function setupInstagram(db:Db){return runMigration(db,'015-instagram',id,checksum,instagramDefinitions);}
export async function assertInstagramReady(db:Db){if(!await db.collection('schemaMigrations').findOne({_id:id as never,checksum,state:'completed'}))throw new DatabaseError('INSTAGRAM_SETUP_REQUIRED','Run db:setup before connecting Instagram.');}
