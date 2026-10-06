import 'server-only';
import {createHash} from 'node:crypto';
import type {Db} from 'mongodb';
import {runMigration} from '../db/setup';
import {DatabaseError} from '../db/config';
import type {CollectionDefinition} from '../db/schema';
import {assertStoryboardApprovalsReady} from '../storyboards/approval-setup';
import {MAX_ASSET_BYTES} from './contracts';
const text=(maxLength:number)=>({bsonType:'string',minLength:1,maxLength});
const hash={bsonType:'string',pattern:'^[a-f0-9]{64}$'},date={bsonType:'date'},asset={bsonType:'string',pattern:'^ast_[a-f0-9]{32}$'};
const common={ownerId:text(256),projectId:text(80)};
function def(name:string,properties:Record<string,unknown>,indexes:CollectionDefinition['indexes']):CollectionDefinition{return {name,validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:Object.keys(properties),properties}},indexes};}
export const storageDefinitions:CollectionDefinition[]=[
 def('assets',{_id:asset,...common,kind:{enum:['video','preview','audio','thumbnail','alignment','timeline','captions','qa']},state:{enum:['staging','ready','deleting','deleted']},objectKey:text(1024),sha256:hash,bytes:{bsonType:'int',minimum:1,maximum:MAX_ASSET_BYTES},contentType:{enum:['video/mp4','audio/mpeg','image/png','application/json','text/vtt']},producerFingerprint:hash,createdAt:date,readyAt:{bsonType:['date','null']}},[{name:'asset_key',key:{objectKey:1},unique:true},{name:'asset_project',key:{ownerId:1,projectId:1,_id:1}},{name:'asset_reuse',key:{ownerId:1,projectId:1,kind:1,producerFingerprint:1,state:1}},{name:'asset_cleanup',key:{ownerId:1,projectId:1,state:1}}]),
 def('mediaGrants',{_id:text(80),...common,assetId:asset,tokenHash:hash,purpose:{enum:['preview','download']},expiresAt:date,revokedAt:{bsonType:['date','null']}},[{name:'grant_token',key:{tokenHash:1},unique:true},{name:'grant_expiry',key:{expiresAt:1},expireAfterSeconds:0},{name:'grant_revoke',key:{ownerId:1,projectId:1,assetId:1}}]),
 def('mediaServiceNonces',{_id:text(80),expiresAt:date},[{name:'media_nonce_expiry',key:{expiresAt:1},expireAfterSeconds:0}]),
];
const id='mig_privatestorage001',checksum=createHash('sha256').update(JSON.stringify(storageDefinitions)).digest('hex');
export async function setupStorage(db:Db){await assertStoryboardApprovalsReady(db);return runMigration(db,'011-private-storage',id,checksum,storageDefinitions);}
export async function assertStorageReady(db:Db){
 if(!await db.collection('schemaMigrations').findOne({_id:id as never,checksum,state:'completed'}))throw new DatabaseError('STORAGE_SETUP_REQUIRED','Run db:setup before using media.');
 for(const definition of storageDefinitions){const indexes=await db.collection(definition.name).indexes();for(const index of definition.indexes)if(!indexes.some(i=>i.name===index.name&&JSON.stringify(i.key)===JSON.stringify(index.key)&&Boolean(i.unique)===Boolean(index.unique)&&i.expireAfterSeconds===index.expireAfterSeconds))throw new DatabaseError('STORAGE_SETUP_REQUIRED','Media indexes are missing.');}
}
