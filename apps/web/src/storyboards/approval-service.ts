import 'server-only';
import {createHash,randomUUID} from 'node:crypto';
import {Long,type Db,type MongoClient,type Document} from 'mongodb';
import {inTransaction} from '../db/client';
import {canonical} from '../projects/service';
import {ProjectError} from '../projects/contracts';
import {liveProject} from '../generation/live-project';
import {validateStoryboard} from './contracts';
import {storyboardHashes} from './service';
import {approvalRequest,approvalView} from './api-contracts';
import {assertStoryboardApprovalsReady} from './approval-setup';
import type {z} from 'zod';
type Doc=Document&{_id:string};
const hash=(value:unknown)=>createHash('sha256').update(canonical(value)).digest('hex');
function view(doc:Doc){return approvalView.parse({id:doc._id,projectId:doc.projectId,kind:doc.kind,subjectId:doc.subjectId,subjectHash:doc.subjectHash,contentHash:doc.contentHash,canonicalizationVersion:doc.canonicalizationVersion,approvedBy:doc.approvedBy,approvedAt:doc.approvedAt.toISOString(),reason:doc.reason,reviewedDraftRevision:doc.reviewedDraftRevision,reviewedDraftHash:doc.reviewedDraftHash});}
export async function approveStoryboard(db:Db,client:MongoClient,ownerId:string,projectId:string,key:string,raw:z.infer<typeof approvalRequest>){
 const input=approvalRequest.parse(raw);
 await assertStoryboardApprovalsReady(db);
 return inTransaction(client,async session=>{
  const parent=await liveProject(db,ownerId,projectId,session,new Date());
  const commands=db.collection<Doc>('storyboardApprovalCommands'),approvals=db.collection<Doc>('approvals');
  const keyHash=hash(key),requestHash=hash({method:'POST',path:`/api/projects/${projectId}/storyboard-approvals`,body:input});
  const old=await commands.findOne({ownerId,projectId,keyHash},{session});
  if(old){
   if(old.requestHash!==requestHash)throw new ProjectError(409,'IDEMPOTENCY_KEY_REUSED','Use a new key for different input.');
   const saved=await approvals.findOne({_id:old.approvalId,ownerId,projectId},{session});
   if(!saved)throw new ProjectError(503,'SERVICE_UNAVAILABLE','Approval could not be verified. Recover with the same key.');
   return {data:view(saved),replayed:true};
  }
  if(parent.draftRevision!==input.expectedDraftRevision)throw new ProjectError(409,'REVISION_CONFLICT','Reload and review before approving.');
  if(parent.activeJobId)throw new ProjectError(409,'PROJECT_BUSY','Wait for the current request to finish.');
  const draft=await db.collection<Doc>('drafts').findOne({ownerId,projectId,revision:input.expectedDraftRevision},{session});
  if(!draft)throw new ProjectError(409,'REVISION_CONFLICT','Reload your working copy.');
  if(draft.contentHash!==input.expectedDraftHash)throw new ProjectError(409,'HASH_MISMATCH','Reload the saved draft before approving.');
  const source=await db.collection<Doc>('storyboards').findOne({_id:input.storyboardId,ownerId,projectId},{session});
  if(!source)throw new ProjectError(404,'NOT_FOUND','Storyboard not found.');
  const hashes=storyboardHashes(source.content);
  if(source.canonicalizationVersion!==1||source.contentHash!==input.expectedContentHash||hashes.contentHash!==input.expectedContentHash||source.storyHash!==hashes.storyHash)throw new ProjectError(409,'SOURCE_CHANGED','Reload the exact storyboard before approving.');
  // A fresh generated/revised candidate may replace an older working copy.
  // Otherwise only its exact, non-stale applied copy remains eligible.
  const applied=!draft.planStale&&draft.sourceStoryboardId===source._id&&draft.editablePlan&&hash(draft.editablePlan)===source.contentHash;
  if(source.sourceDraftRevision!==draft.revision&&!applied)throw new ProjectError(409,'SOURCE_CHANGED','The saved idea or storyboard changed. Review a current version.');
  try{validateStoryboard(source.content,{notes:draft.notes,voicePreset:draft.voicePreset});}catch{throw new ProjectError(422,'INVALID_DRAFT','Resolve storyboard validation issues before approval.');}
  // Serialize with autosave, job admission and other approvals before inserts.
  // A retry must recheck every precondition against the current parent/draft.
  const fence=await db.collection<Doc>('projects').updateOne({_id:projectId,ownerId,draftRevision:draft.revision,deletedAt:null},{$inc:{contentRevision:Long.ONE}},{session});
  if(!fence.matchedCount)throw new ProjectError(409,'REVISION_CONFLICT','The draft changed. Review it again.');
  let approval=await approvals.findOne({ownerId,projectId,kind:'story',subjectId:source._id,contentHash:source.contentHash},{session});
  const date=new Date();
  if(!approval){
   approval={_id:`apr_${randomUUID().replaceAll('-','')}`,ownerId,projectId,kind:'story',subjectId:source._id,subjectHash:source.storyHash,contentHash:source.contentHash,canonicalizationVersion:1,approvedBy:ownerId,approvedAt:date,reason:'explicit',reviewedDraftRevision:draft.revision,reviewedDraftHash:draft.contentHash};
   await approvals.insertOne(approval,{session});
  }
  await commands.insertOne({_id:`cmd_${randomUUID().replaceAll('-','')}`,ownerId,projectId,keyHash,requestHash,approvalId:approval._id,createdAt:date},{session});
  return {data:view(approval),replayed:false};
 });
}
