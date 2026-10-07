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
// Keep 015's definitions/checksum immutable: deployed databases already recorded them.
export const facebookDefinitions:CollectionDefinition[]=instagramDefinitions.slice(0,2).map(definition=>{
 const next=structuredClone(definition);
 const schema=next.validator.$jsonSchema as {properties:Record<string,unknown>;allOf?:unknown[]};
 const provider={enum:['instagram','facebook']},numeric={bsonType:'string',pattern:'^\\d{1,100}$'};
 if(next.name==='instagramConnections'){
  Object.assign(schema.properties,{provider,providerAppId:numeric,tokenKind:{enum:['instagram_user','facebook_page']},pageId:numeric,pageName:text,accountType:{enum:['BUSINESS','CREATOR','PROFESSIONAL']}});
  schema.allOf=[{oneOf:[
   {not:{anyOf:['provider','providerAppId','tokenKind','pageId','pageName'].map(key=>({required:[key]}))}},
   {required:['provider','providerAppId','tokenKind'],properties:{provider:{enum:['instagram']},tokenKind:{enum:['instagram_user']}},not:{anyOf:[{required:['pageId']},{required:['pageName']}] }},
   {required:['provider','providerAppId','tokenKind','pageId','pageName'],properties:{provider:{enum:['facebook']},tokenKind:{enum:['facebook_page']}}},
  ]}];
 }else{
  Object.assign(schema.properties,{provider,providerAppId:numeric,pageId:numeric});
  schema.allOf=[{oneOf:[
   {not:{anyOf:['provider','providerAppId','pageId'].map(key=>({required:[key]}))}},
   {required:['provider','providerAppId'],properties:{provider:{enum:['instagram']}},not:{required:['pageId']}},
   {required:['provider','providerAppId','pageId'],properties:{provider:{enum:['facebook']}}},
  ]}];
 }
 return next;
});
const facebookId='mig_instagramfb00001',facebookChecksum=createHash('sha256').update(JSON.stringify(facebookDefinitions)).digest('hex');
export async function setupInstagram(db:Db){
 await runMigration(db,'015-instagram',id,checksum,instagramDefinitions,{successors:Object.fromEntries(facebookDefinitions.map(d=>[d.name,d.validator]))});
 return runMigration(db,'016-instagram-facebook',facebookId,facebookChecksum,facebookDefinitions,{upgradeFrom:Object.fromEntries(instagramDefinitions.slice(0,2).map(d=>[d.name,d.validator]))});
}
export async function assertInstagramReady(db:Db){if(!await db.collection('schemaMigrations').findOne({_id:facebookId as never,checksum:facebookChecksum,state:'completed'}))throw new DatabaseError('INSTAGRAM_SETUP_REQUIRED','Run db:setup before connecting Instagram.');}
