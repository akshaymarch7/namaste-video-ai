import 'server-only';
import {createHash,randomUUID} from 'node:crypto';
import {Long,type Db,type MongoClient,type Document} from 'mongodb';
import {inTransaction} from '../db/client';
import {canonical} from '../projects/service';
import {ProjectError} from '../projects/contracts';
import {liveProject} from '../generation/live-project';
import {validateStoryboard} from './contracts';
import {storyboardHashes} from './service';
import {assertStoryboardSnapshotsReady} from './snapshot-setup';
type Doc=Document&{_id:string};
const hash=(value:unknown)=>createHash('sha256').update(canonical(value)).digest('hex');
export async function saveStoryboardSnapshot(db:Db,client:MongoClient,ownerId:string,projectId:string,key:string,input:{expectedDraftRevision:number;expectedContentHash:string}){
 await assertStoryboardSnapshotsReady(db);
 return inTransaction(client,async session=>{
  const parent=await liveProject(db,ownerId,projectId,session,new Date());
  const commands=db.collection<Doc>('storyboardSnapshots'),candidates=db.collection<Doc>('storyboards');
  const keyHash=hash(key),requestHash=hash({method:'POST',path:`/api/projects/${projectId}/storyboard-snapshots`,body:input});
  const old=await commands.findOne({ownerId,projectId,keyHash},{session});
  if(old){if(old.requestHash!==requestHash)throw new ProjectError(409,'IDEMPOTENCY_KEY_REUSED','Use a new key for different input.');return {data:{storyboardId:old.storyboardId as string},replayed:true};}
  if(parent.draftRevision!==input.expectedDraftRevision)throw new ProjectError(409,'REVISION_CONFLICT','Save and reload before saving a version.');
  if(parent.activeJobId)throw new ProjectError(409,'PROJECT_BUSY','Wait for the current request to finish.');
  const draft=await db.collection<Doc>('drafts').findOne({ownerId,projectId,revision:input.expectedDraftRevision},{session});
  if(!draft)throw new ProjectError(409,'REVISION_CONFLICT','Reload your working copy.');
  if(draft.contentHash!==input.expectedContentHash)throw new ProjectError(409,'HASH_MISMATCH','Reload the saved draft.');
  if(draft.planStale)throw new ProjectError(422,'PLAN_STALE','The saved idea changed. Generate and review a current storyboard first.');
  const source=await candidates.findOne({_id:draft.sourceStoryboardId,ownerId,projectId},{session});
  if(!source||!draft.editablePlan)throw new ProjectError(422,'STORYBOARD_REQUIRED','Apply a storyboard before saving an edited version.');
  let result:ReturnType<typeof validateStoryboard>;
  try{result=validateStoryboard(draft.editablePlan,{notes:draft.notes,voicePreset:draft.voicePreset});}catch{throw new ProjectError(422,'INVALID_DRAFT','Resolve storyboard validation issues before saving an edited version.');}
  const date=new Date(),id=`stb_${randomUUID().replaceAll('-','')}`,commandId=`job_${randomUUID().replaceAll('-','')}`;
  await candidates.insertOne({_id:id,schemaVersion:1,ownerId,projectId,sourceDraftRevision:draft.revision,...result,...storyboardHashes(result.content),canonicalizationVersion:1,state:'review_ready',plannerConfig:{provider:'manual',model:'none',promptVersion:'manual-snapshot-v1'},createdByJobId:commandId,createdAt:date,updatedAt:date},{session});
  await commands.insertOne({_id:commandId,ownerId,projectId,keyHash,requestHash,storyboardId:id,sourceStoryboardId:source._id,sourceContentHash:source.contentHash,createdAt:date},{session});
  // Write the same parent as autosave: a concurrent draft mutation must retry
  // this transaction and fail its revision precondition, never freeze stale text.
  const fence=await db.collection<Doc>('projects').updateOne({_id:projectId,ownerId,draftRevision:draft.revision,deletedAt:null},{$inc:{contentRevision:Long.ONE}},{session});
  if(!fence.matchedCount)throw new ProjectError(409,'REVISION_CONFLICT','The draft changed. Reload before saving a version.');
  return {data:{storyboardId:id},replayed:false};
 });
}
