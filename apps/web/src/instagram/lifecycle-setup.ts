import 'server-only';
import {createHash} from 'node:crypto';
import type {Db} from 'mongodb';
import {runMigration} from '../db/setup';
import {DatabaseError} from '../db/config';
import type {CollectionDefinition} from '../db/schema';
export const lifecycleDefinitions:CollectionDefinition[]=[{
 name:'instagramLifecycle',
 validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:['_id','revokedAt','authorizedAt','updatedAt'],properties:{
  _id:{bsonType:'string',pattern:'^[a-f0-9]{64}$'},instagramUserId:{bsonType:'string',pattern:'^\\d{1,100}$'},revokedAt:{bsonType:'date'},authorizedAt:{bsonType:'date'},updatedAt:{bsonType:'date'},
 }}},indexes:[],
}];
const id='mig_iglife0000000001',checksum=createHash('sha256').update(JSON.stringify(lifecycleDefinitions)).digest('hex');
const aliasDefinition=structuredClone(lifecycleDefinitions[0]);
(aliasDefinition.validator as any).$jsonSchema.properties.appId={bsonType:'string',pattern:'^\\d{1,100}$'};
aliasDefinition.indexes=[{name:'lifecycle_app_profile',key:{appId:1,instagramUserId:1}}];
const aliasId='mig_igaliases00000001',aliasChecksum=createHash('sha256').update(JSON.stringify(aliasDefinition)).digest('hex');
export async function setupInstagramLifecycle(db:Db){
 await runMigration(db,'020-instagram-lifecycle',id,checksum,lifecycleDefinitions,{successors:{instagramLifecycle:aliasDefinition.validator}});
 return runMigration(db,'022-instagram-lifecycle-aliases',aliasId,aliasChecksum,[aliasDefinition],{upgradeFrom:{instagramLifecycle:lifecycleDefinitions[0].validator}});
}
export async function assertInstagramLifecycleReady(db:Db){if(!await db.collection('schemaMigrations').findOne({_id:id as never,checksum,state:'completed'})||!await db.collection('schemaMigrations').findOne({_id:aliasId as never,checksum:aliasChecksum,state:'completed'}))throw new DatabaseError('INSTAGRAM_LIFECYCLE_SETUP_REQUIRED','Run db:setup before enabling Instagram lifecycle callbacks.');}
