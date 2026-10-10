import 'server-only';
import {createHash} from 'node:crypto';
import {Long,type Db,type MongoClient,type Document,type ClientSession} from 'mongodb';
import {speechResult,type SpeechResult} from './speech-result';
import type {CaptionOverride} from '../../../../src/plan-v2/caption-edits';
import {inTransaction} from '../db/client';
import {isAdmitted} from '../auth/engine';
import {canonical} from '../projects/service';
import {renderConfigSchema,type RenderConfig} from './render-config';
import {assertRenderingReady} from './render-setup';
import type {ReadableObjectStore} from '../storage/r2';
import {compileV2,MeasuredDurationError,spokenText,type MeasuredSpeech} from '../../../../src/plan-v2/compiler';
import {validateStoryboard,type Storyboard} from '../storyboards/contracts';
import {MAX_ASSET_BYTES} from '../storage/contracts';
type Doc=Document&{_id:string};
const digest=(v:Uint8Array|string)=>createHash('sha256').update(v).digest('hex');
export class ExecutionError extends Error {constructor(public code:string){super(code);}}
export type {SpeechResult} from './speech-result';
export type ExecutionAdapters={store:ReadableObjectStore;speech(text:string,config:RenderConfig,signal:AbortSignal):Promise<SpeechResult>;render(plan:Storyboard,notes:string,speech:Record<string,SpeechResult>,signal:AbortSignal,overrides?:CaptionOverride[]):Promise<{video:Uint8Array;captions:Uint8Array;duration:number}>};
export type RenderCompletion={assets:Doc[];output:Doc};

// Every external stage passes through the current fence/lease and live parent.
// The request-start journal is committed before speech; takeover never repeats it.
export async function executeGeneration(db:Db,client:MongoClient,job:Doc,adapters:ExecutionAdapters,now=()=>new Date()):Promise<RenderCompletion>{
 await assertRenderingReady(db);
 const config=renderConfigSchema.parse(job.inputSnapshot.renderConfig);
 if(job.inputSnapshot.captionRevision?job.inputSnapshot.captionRevision.rendererVersion!=='plan-v2-2':config.renderer!=='plan-v2-2')throw new ExecutionError('RENDER_CONFIG_CHANGED');
 const plan=validateStoryboard(job.inputSnapshot.plan,{notes:job.inputSnapshot.notes,voicePreset:job.inputSnapshot.voicePreset}).content;
 const jobs=db.collection<Doc>('generationJobs'),stages=db.collection<Doc>('speechStages');
 const abort=new AbortController();let heartbeat:ReturnType<typeof setTimeout>|undefined;let stopped=false;
 async function guard<T>(work?:(session:ClientSession)=>Promise<T>,stage?:string){
  return inTransaction(client,async session=>{
   const date=now();
   const current=await jobs.findOne({_id:job._id,fence:job.fence,state:'running',leaseUntil:{$gt:date},deadlineAt:{$gt:date}},{session});
   const parent=await db.collection<Doc>('projects').findOne({_id:job.projectId,ownerId:job.ownerId,activeJobId:job._id,deletedAt:null},{session});
   if(!current||!parent||!await isAdmitted(db,job.ownerId))throw new ExecutionError('EXECUTION_STOPPED');
   await jobs.updateOne({_id:job._id,fence:job.fence},{$set:{leaseUntil:new Date(date.getTime()+90000),updatedAt:date,...(stage?{stage}:{})},...(stage&&current.stage!==stage?{$inc:{revision:1}}:{})},{session});
   await db.collection<Doc>('projects').updateOne({_id:job.projectId,activeJobId:job._id},{$inc:{contentRevision:Long.ONE}},{session});
   return work?.(session);
  });
 }
 const pulse=async()=>{try{await guard();}catch{abort.abort();}finally{if(!stopped&&!abort.signal.aborted)heartbeat=setTimeout(pulse,20000);}};
 heartbeat=setTimeout(pulse,20000);
 try{
  await guard(undefined,'speech');
  const speech:Record<string,SpeechResult>={};
  for(const scene of plan.scenes){
   const text=spokenText(scene).text;
   const fingerprint=digest(canonical({text,config}));
   if(job.inputSnapshot.captionRevision?.overrides.some((e:CaptionOverride)=>e.sceneId===scene.id&&e.speechFingerprint!==fingerprint))throw new ExecutionError('INPUT_INVALID');
   const id=`${job._id}:${scene.id}`;
   const key=`owners/${digest(job.ownerId)}/speech/${job._id}/${scene.id}.json`;
   const claim=await guard(async session=>{
    const old=await stages.findOne({_id:id},{session});
    if(old){if(old.fingerprint!==fingerprint)throw new ExecutionError('INPUT_INVALID');return {fresh:false,row:old};}
    if(job.inputSnapshot.captionRevision){
     const source=await stages.findOne({jobId:job.inputSnapshot.captionRevision.speechSourceJobId,ownerId:job.ownerId,projectId:job.projectId,sceneId:scene.id,state:'stored',fingerprint},{session});
     if(!source?.result)throw new ExecutionError('SPEECH_RECOVERY_REQUIRED');
     const row:Doc={...source,_id:id,jobId:job._id,createdAt:now(),updatedAt:now()};await stages.insertOne(row,{session});return {fresh:false,row};
    }
    const row:Doc={_id:id,ownerId:job.ownerId,projectId:job.projectId,jobId:job._id,sceneId:scene.id,fingerprint,objectKey:key,state:'request_started',result:null,createdAt:now(),updatedAt:now()};
    await stages.insertOne(row,{session});return {fresh:true,row};
   });
   if(!claim)throw new ExecutionError('EXECUTION_STOPPED');
   if(!claim.fresh){
    if(!claim.row.result)throw new ExecutionError('PROVIDER_OUTCOME_UNKNOWN');
    try{
     const r=claim.row.result;const bytes=await adapters.store.read(claim.row.objectKey,r.bytes,r.sha256,'application/json');
     speech[scene.id]=speechResult.parse(JSON.parse(Buffer.from(bytes).toString('utf8')));
     await guard(async session=>{await stages.updateOne({_id:id},{$set:{state:'stored',updatedAt:now()}},{session});});
    }catch(e){if(e instanceof ExecutionError)throw e;throw new ExecutionError('SPEECH_RECOVERY_REQUIRED');}
    continue;
   }
   let result:SpeechResult;
   try{result=speechResult.parse(await adapters.speech(text,config,abort.signal));}
   catch(e){if(e instanceof ExecutionError)throw e;throw new ExecutionError('PROVIDER_OUTCOME_UNKNOWN');}
   const bytes=Buffer.from(JSON.stringify(result)),sha256=digest(bytes);
   // Save expected metadata first: a lost upload response can be read back safely.
   await guard(async session=>{await stages.updateOne({_id:id},{$set:{result:{bytes:bytes.length,sha256},updatedAt:now()}},{session});});
   try{await adapters.store.put(key,bytes,'application/json',sha256);await adapters.store.verify(key,bytes.length,sha256,'application/json');}
   catch{
    // An upload may have committed despite a lost response. Read the exact bytes;
    // never synthesize again to recover a storage acknowledgement.
    try{await adapters.store.read(key,bytes.length,sha256,'application/json');}
    catch{throw new ExecutionError('SPEECH_RECOVERY_REQUIRED');}
   }
   await guard(async session=>{await stages.updateOne({_id:id},{$set:{state:'stored',updatedAt:now()}},{session});});
   speech[scene.id]=result;
  }
  await guard(undefined,'rendering');
  let duration:number;
  try{duration=compileV2(plan,{notes:job.inputSnapshot.notes,voicePreset:plan.voicePreset},speech as Record<string,MeasuredSpeech>,false,job.inputSnapshot.captionRevision?.overrides).frames/30;}
  catch(error){
   if(error instanceof MeasuredDurationError)throw new ExecutionError(error.frames>2700?'SPEECH_TOO_LONG':'SPEECH_TOO_SHORT');
   throw new ExecutionError('SPEECH_TIMING_INVALID');
  }
  const rendered=await adapters.render(plan,job.inputSnapshot.notes,speech,abort.signal,job.inputSnapshot.captionRevision?.overrides);
  if(Math.abs(rendered.duration-duration)>0.1)throw new ExecutionError('RENDER_INVALID');
  await guard(undefined,'uploading');
  const assets:Doc[]=[];
  for(const [kind,bytes,type,ext] of [['video',rendered.video,'video/mp4','mp4'],['captions',rendered.captions,'text/vtt','vtt']] as const){
   if(!bytes.byteLength||bytes.byteLength>MAX_ASSET_BYTES)throw new ExecutionError('RENDER_INVALID');
   const id=`ast_${digest(`${job._id}:${job.fence}:${kind}`).slice(0,32)}`;
   const objectKey=`owners/${digest(job.ownerId)}/projects/${job.projectId}/assets/${id}.${ext}`,sha256=digest(bytes);
   await guard();await adapters.store.put(objectKey,bytes,type,sha256);await adapters.store.verify(objectKey,bytes.length,sha256,type);
   assets.push({_id:id,ownerId:job.ownerId,projectId:job.projectId,kind,state:'ready',objectKey,sha256,bytes:bytes.byteLength,contentType:type,producerFingerprint:job.inputHash,createdAt:now(),readyAt:now()});
  }
  await guard();
  return {assets,output:{_id:job._id,jobId:job._id,ownerId:job.ownerId,projectId:job.projectId,inputHash:job.inputHash,videoAssetId:assets[0]._id,captionsAssetId:assets[1]._id,duration,createdAt:now()}};
 }finally{stopped=true;if(heartbeat)clearTimeout(heartbeat);abort.abort();}
}
