import 'server-only';
import {randomUUID,createHash} from 'node:crypto';
import {Long,type Db,type MongoClient,type Document,type ClientSession} from 'mongodb';
import {inTransaction} from '../db/client';
import {liveProject} from '../generation/live-project';
import {isAdmitted} from '../auth/engine';
import {canonical} from '../projects/service';
import {ProjectError} from '../projects/contracts';
import {validateStoryboard} from '../storyboards/contracts';
import {storyboardHashes} from '../storyboards/service';
import {generationRequest,cancelRequest,jobView,activeStates} from './contracts';
import {assertJobsReady} from './setup';
import type {z} from 'zod';
import {renderConfig} from './render-config';
import {assertRenderingReady} from './render-setup';
import {executeGeneration,ExecutionError,type ExecutionAdapters,type RenderCompletion} from './execution';
type Doc=Document&{_id:string};
const hash=(v:unknown)=>createHash('sha256').update(canonical(v)).digest('hex');
const uid=(prefix:string)=>`${prefix}_${randomUUID().replaceAll('-','')}`;
const fail=(code:string,message:string,status=409)=>new ProjectError(status,code,message);
export function view(doc:Doc){return jobView.parse({id:doc._id,projectId:doc.projectId,storyboardId:doc.storyboardId,state:doc.state,stage:doc.stage,revision:doc.revision,attempt:doc.attempt,errorCode:doc.errorCode,createdAt:doc.createdAt.toISOString(),updatedAt:doc.updatedAt.toISOString(),finishedAt:doc.finishedAt?.toISOString()??null,actions:{cancel:['queued','running'].includes(doc.state)}});}
export function generationService(db:Db,client:MongoClient,now=()=>new Date()){
 const jobs=db.collection<Doc>('generationJobs'),commands=db.collection<Doc>('generationCommands');
 async function owned(ownerId:string,id:string,session:ClientSession){const job=await jobs.findOne({_id:id,ownerId},{session});if(!job)throw fail('NOT_FOUND','Job not found.',404);await liveProject(db,ownerId,job.projectId,session,now());return (await jobs.findOne({_id:id,ownerId},{session}))!;}
 async function command(ownerId:string,projectId:string,route:string,key:string,input:unknown,session:ClientSession){const keyHash=hash(key),requestHash=hash(input),scope={ownerId,projectId,route,keyHash};const old=await commands.findOne(scope,{session});if(old&&old.requestHash!==requestHash)throw fail('IDEMPOTENCY_KEY_REUSED','Recover the original request with its original inputs.');return {scope,requestHash,old};}
 return {
  async create(ownerId:string,projectId:string,key:string,raw:z.infer<typeof generationRequest>){
   await assertJobsReady(db);await assertRenderingReady(db);const input=generationRequest.parse(raw);
   return inTransaction(client,async session=>{
    const parent=await liveProject(db,ownerId,projectId,session,now());const cmd=await command(ownerId,projectId,'create',key,input,session);
    if(cmd.old)return {data:jobView.parse(cmd.old.response),replayed:true};
    if(parent.activeJobId)throw fail('PROJECT_BUSY','Wait for the current request.');
    const previousSpeech=await db.collection('speechStages').findOne({ownerId,projectId},{session});
    if(previousSpeech&&!input.acknowledgePossibleRepeat)throw fail('REPEAT_ACK_REQUIRED','Generating again can use speech credits again. Confirm before continuing.');
    const draft=await db.collection<Doc>('drafts').findOne({ownerId,projectId},{session});
    if(!draft||draft.revision!==input.expectedDraftRevision||parent.draftRevision!==input.expectedDraftRevision)throw fail('REVISION_CONFLICT','Review the latest saved draft.');
    if(draft.contentHash!==input.expectedDraftHash)throw fail('HASH_MISMATCH','Review the latest saved draft.');
    const source=await db.collection<Doc>('storyboards').findOne({_id:input.storyboardId,ownerId,projectId},{session});
    const approval=await db.collection<Doc>('approvals').findOne({_id:input.approvalId,ownerId,projectId,kind:'story',subjectId:input.storyboardId,contentHash:input.expectedContentHash},{session});
    if(!source||!approval)throw fail('APPROVAL_REQUIRED','Approve this exact storyboard first.');
    const hashes=storyboardHashes(source.content);
    if(source.canonicalizationVersion!==1||approval.canonicalizationVersion!==1||source.contentHash!==input.expectedContentHash||hashes.contentHash!==source.contentHash||source.storyHash!==hashes.storyHash||approval.subjectHash!==hashes.storyHash)throw fail('SOURCE_CHANGED','Review the saved storyboard again.');
    const applied=!draft.planStale&&draft.sourceStoryboardId===source._id&&draft.editablePlan&&hash(draft.editablePlan)===source.contentHash;
    if(source.sourceDraftRevision!==draft.revision&&!applied)throw fail('SOURCE_CHANGED','Review and approve a current storyboard.');
    try{validateStoryboard(source.content,{notes:draft.notes,voicePreset:draft.voicePreset});}catch{throw fail('INVALID_DRAFT','Resolve storyboard validation issues first.',422);}
    const date=now(),id=uid('job');
    const inputSnapshot={plan:source.content,notes:draft.notes,voicePreset:draft.voicePreset,contentHash:source.contentHash,storyHash:source.storyHash,canonicalizationVersion:1,renderConfig};
    const job:Doc={_id:id,ownerId,projectId,storyboardId:source._id,approvalId:approval._id,inputSnapshot,inputHash:hash(inputSnapshot),state:'queued',stage:'queued',revision:1,attempt:0,fence:0,leaseUntil:null,deadlineAt:new Date(date.getTime()+15*60000),errorCode:null,createdAt:date,updatedAt:date,finishedAt:null};
    await db.collection<Doc>('projects').updateOne({_id:projectId,ownerId,deletedAt:null},{$set:{activeJobId:id,'flags.needsAttention':false,updatedAt:date},$inc:{contentRevision:Long.ONE}},{session});
    await jobs.insertOne(job,{session});
    await db.collection('generationOutbox').insertOne({_id:uid('evt') as never,jobId:id,state:'pending',leaseToken:null,leaseUntil:null,availableAt:date,createdAt:date},{session});
    const data=view(job);await commands.insertOne({_id:uid('cmd'),...cmd.scope,requestHash:cmd.requestHash,jobId:id,response:data,createdAt:date},{session});return {data,replayed:false};
   });
  },
  async get(ownerId:string,id:string){await assertJobsReady(db);return inTransaction(client,async s=>view(await owned(ownerId,id,s)));},
  async latest(ownerId:string,projectId:string){await assertJobsReady(db);return inTransaction(client,async session=>{await liveProject(db,ownerId,projectId,session,now());const job=await jobs.findOne({ownerId,projectId},{session,sort:{createdAt:-1,_id:-1}});return job?view(job):null;});},
  async cancel(ownerId:string,id:string,key:string,raw:z.infer<typeof cancelRequest>){await assertJobsReady(db);const input=cancelRequest.parse(raw);return inTransaction(client,async session=>{
   const job=await owned(ownerId,id,session),cmd=await command(ownerId,job.projectId,`cancel/${id}`,key,input,session);if(cmd.old)return {data:jobView.parse(cmd.old.response),replayed:true};
   if(!activeStates.includes(job.state))throw fail('JOB_TERMINAL','This job already stopped.');
   if(job.revision!==input.expectedRevision)throw fail('REVISION_CONFLICT','Refresh job progress before cancelling.');
   const date=now(),terminal=job.state==='queued';
   const changed=await jobs.findOneAndUpdate({_id:id,ownerId,revision:job.revision},{$set:{state:terminal?'cancelled':'cancel_requested',stage:terminal?'stopped':job.stage,updatedAt:date,finishedAt:terminal?date:null},$inc:{revision:1}},{session,returnDocument:'after'});
   // All job mutations serialize through this parent; old jobs never release newer slots.
   await db.collection<Doc>('projects').updateOne({_id:job.projectId,ownerId,activeJobId:id},{$inc:{contentRevision:Long.ONE},...(terminal?{$unset:{activeJobId:''},$set:{'flags.needsAttention':false,updatedAt:date}}:{})},{session});
   const data=view(changed!);await commands.insertOne({_id:uid('cmd'),...cmd.scope,requestHash:cmd.requestHash,jobId:id,response:data,createdAt:date},{session});return {data,replayed:false};
  });},
 };
}
// A missing adapter retains the legacy pure-preflight behavior for local contract tests.
// Production execution is only dispatched by the explicit local worker with adapters.
export async function runGenerationJob(db:Db,client:MongoClient,id:string,now=()=>new Date(),beforeFinish?:()=>Promise<void>,adapters?:ExecutionAdapters){
 await assertJobsReady(db);const jobs=db.collection<Doc>('generationJobs');
 const claimed=await inTransaction(client,async session=>{
  const job=await jobs.findOne({_id:id},{session});if(!job||!activeStates.includes(job.state))return null;
  let parent;try{parent=await liveProject(db,job.ownerId,job.projectId,session,now());}catch(e){if((e as {code?:string}).code!=='NOT_FOUND')throw e;}
  const fresh=await jobs.findOne({_id:id},{session});if(!fresh||!activeStates.includes(fresh.state))return null;
  if(!parent||parent.activeJobId!==id||!await isAdmitted(db,job.ownerId)){await jobs.updateOne({_id:id},{$set:{state:'failed',stage:'stopped',errorCode:'ACCESS_UNAVAILABLE',updatedAt:now(),finishedAt:now(),leaseUntil:null},$inc:{revision:1}},{session});await db.collection<Doc>('projects').updateOne({_id:job.projectId,activeJobId:id},{$unset:{activeJobId:''},$set:{'flags.needsAttention':true,updatedAt:now()},$inc:{contentRevision:Long.ONE}},{session});return null;}
  if(fresh.state==='running'&&fresh.leaseUntil>now())return null;
  if(adapters){
   const scheduler=await db.collection('renderScheduler').updateOne({_id:'global' as never},{$inc:{revision:Long.ONE}},{session});
   if(!scheduler.matchedCount)throw fail('RENDER_SETUP_REQUIRED','Run db:setup.',503);
   const leased={_id:{$ne:id},state:{$in:['running','cancel_requested']},leaseUntil:{$gt:now()}};
   if(await jobs.countDocuments({...leased,ownerId:job.ownerId},{session})||await jobs.countDocuments(leased,{session})>=2)return null;
  }
  // External speech is protected by its durable request-start journal on takeover.
  return jobs.findOneAndUpdate({_id:id,revision:fresh.revision},{$set:{state:fresh.state==='cancel_requested'?'cancel_requested':'running',stage:'checking',leaseUntil:new Date(now().getTime()+90000),updatedAt:now()},$inc:{revision:1,attempt:1,fence:1}},{session,returnDocument:'after'});
 });
 if(!claimed)return false;
 await beforeFinish?.();
 let errorCode='RENDERER_NOT_CONNECTED';let completion:RenderCompletion|undefined;
 try{if(hash(claimed.inputSnapshot)!==claimed.inputHash)throw Error();validateStoryboard(claimed.inputSnapshot.plan,{notes:claimed.inputSnapshot.notes,voicePreset:claimed.inputSnapshot.voicePreset});}catch{errorCode='INPUT_INVALID';}
 if(errorCode!=='INPUT_INVALID'&&adapters&&claimed.state!=='cancel_requested'){
  try{completion=await executeGeneration(db,client,claimed,adapters,now);errorCode='';}
  catch(e){errorCode=e instanceof ExecutionError?e.code:'RENDER_FAILED';}
 }
 await inTransaction(client,async session=>{
  const job=await jobs.findOne({_id:id,fence:claimed.fence,state:{$in:['running','cancel_requested']}},{session});if(!job)return;
  const parent=await db.collection<Doc>('projects').findOne({_id:job.projectId,ownerId:job.ownerId,deletedAt:null,activeJobId:id},{session});
  const cancel=job.state==='cancel_requested';const unavailable=!parent||!await isAdmitted(db,job.ownerId);const expired=job.deadlineAt<=now()||job.leaseUntil<=now();
  const state=cancel?'cancelled':unavailable||expired||errorCode==='INPUT_INVALID'?'failed':completion?'succeeded':'needs_input';
  if(state==='succeeded'&&completion){await db.collection<Doc>('assets').insertMany(completion.assets,{session});await db.collection<Doc>('renderOutputs').insertOne(completion.output,{session});}
  await jobs.updateOne({_id:id,fence:claimed.fence},{$set:{state,stage:state==='succeeded'?'complete':'stopped',errorCode:cancel||state==='succeeded'?null:unavailable?'ACCESS_UNAVAILABLE':expired?'JOB_DEADLINE':errorCode,updatedAt:now(),finishedAt:now(),leaseUntil:null},$inc:{revision:1}},{session});
  await db.collection<Doc>('projects').updateOne({_id:job.projectId,ownerId:job.ownerId,activeJobId:id},{$unset:{activeJobId:''},$set:{'flags.needsAttention':['failed','needs_input'].includes(state),...(state==='succeeded'?{'flags.ready':true}:{}),updatedAt:now()},$inc:{contentRevision:Long.ONE}},{session});
 });return true;
}
