import 'server-only';
import {createHash} from 'node:crypto';
import type {Db} from 'mongodb';
import {runMigration} from '../db/setup';
import {DatabaseError} from '../db/config';
import type {CollectionDefinition} from '../db/schema';
import {assertStoryboardSnapshotsReady} from './snapshot-setup';
const text=(maxLength:number)=>({bsonType:'string',minLength:1,maxLength});
const hash={bsonType:'string',pattern:'^[a-f0-9]{64}$'};
const approvalId={bsonType:'string',pattern:'^apr_[a-f0-9]{32}$'};
const fields={_id:approvalId,ownerId:text(256),projectId:text(80),kind:{enum:['story']},subjectId:{bsonType:'string',pattern:'^stb_[a-f0-9]{32}$'},subjectHash:hash,contentHash:hash,canonicalizationVersion:{enum:[1]},approvedBy:text(256),approvedAt:{bsonType:'date'},reason:{enum:['explicit']},reviewedDraftRevision:{bsonType:'int',minimum:1},reviewedDraftHash:hash};
const commandFields={_id:{bsonType:'string',pattern:'^cmd_[a-f0-9]{32}$'},ownerId:text(256),projectId:text(80),keyHash:hash,requestHash:hash,approvalId,createdAt:{bsonType:'date'}};
const validator=(properties:Record<string,unknown>)=>({$jsonSchema:{bsonType:'object',additionalProperties:false,required:Object.keys(properties),properties}});
export const approvalDefinitions:CollectionDefinition[]=[
 {name:'approvals',validator:validator(fields),indexes:[{name:'story_approval_subject',key:{ownerId:1,projectId:1,kind:1,subjectId:1,contentHash:1},unique:true},{name:'approval_project',key:{ownerId:1,projectId:1,_id:1}}]},
 {name:'storyboardApprovalCommands',validator:validator(commandFields),indexes:[{name:'story_approval_key',key:{ownerId:1,projectId:1,keyHash:1},unique:true}]},
];
const id='mig_storyboardapprovals001',checksum=createHash('sha256').update(JSON.stringify(approvalDefinitions)).digest('hex');
export async function setupStoryboardApprovals(db:Db){await assertStoryboardSnapshotsReady(db);return runMigration(db,'010-storyboard-approvals',id,checksum,approvalDefinitions);}
export async function assertStoryboardApprovalsReady(db:Db){
 await assertStoryboardSnapshotsReady(db);
 if(!await db.collection('schemaMigrations').findOne({_id:id as never,checksum,state:'completed'}))throw new DatabaseError('APPROVAL_SETUP_REQUIRED','Run db:setup before approving storyboards.');
 for(const definition of approvalDefinitions){
  const indexes=await db.collection(definition.name).indexes();
  for(const index of definition.indexes)if(!indexes.some(i=>i.name===index.name&&JSON.stringify(i.key)===JSON.stringify(index.key)&&Boolean(i.unique)===Boolean(index.unique)))throw new DatabaseError('APPROVAL_SETUP_REQUIRED','Approval indexes are missing.');
 }
}
