import 'server-only';
import {createHash} from 'node:crypto';
import {Long, type Db} from 'mongodb';
import {runMigration} from '../db/setup';
import {DatabaseError} from '../db/config';
import type {CollectionDefinition} from '../db/schema';
const text={bsonType:'string',minLength:1,maxLength:1024},date={bsonType:'date'};
const fields={_id:{...text,pattern:'^job_[a-f0-9]{32}$'},ownerId:text,projectId:text,role:{enum:['storyboard','generation']},target:text,image:text,
  state:{enum:['submitting','submitted','unknown','finished','rejected']},operation:{bsonType:['string','null'],maxLength:1024},execution:{bsonType:['string','null'],maxLength:1024},code:{bsonType:['string','null'],maxLength:100},createdAt:date,updatedAt:date,checkAt:date};
export const cloudDefinitions:CollectionDefinition[]=[
  {name:'cloudDispatches',validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:Object.keys(fields),properties:fields}},indexes:[
    {name:'cloud_reconcile',key:{state:1,checkAt:1}}, {name:'cloud_owner',key:{ownerId:1,state:1}}, {name:'cloud_daily',key:{createdAt:1}},
  ]},
  {name:'cloudDispatchControl',validator:{$jsonSchema:{bsonType:'object',additionalProperties:false,required:['_id','revision'],properties:{_id:{enum:['global']},revision:{bsonType:'long',minimum:0}}}},indexes:[]},
];
const id='mig_clouddispatch001',checksum=createHash('sha256').update(JSON.stringify(cloudDefinitions)).digest('hex');
export async function setupCloudDispatch(db:Db){
  const result=await runMigration(db,'017-cloud-dispatch',id,checksum,cloudDefinitions);
  await db.collection('cloudDispatchControl').updateOne({_id:'global' as never},{$setOnInsert:{revision:Long.ZERO}},{upsert:true});
  return result;
}
export async function assertCloudDispatchReady(db:Db){
  if(!await db.collection('schemaMigrations').findOne({_id:id as never,checksum,state:'completed'}))throw new DatabaseError('CLOUD_SETUP_REQUIRED','Run db:setup before enabling cloud dispatch.');
  for(const d of cloudDefinitions){const indexes=await db.collection(d.name).indexes();for(const i of d.indexes)if(!indexes.some(x=>x.name===i.name&&JSON.stringify(x.key)===JSON.stringify(i.key)))throw new DatabaseError('CLOUD_SETUP_REQUIRED','Cloud dispatch indexes are missing.');}
}
