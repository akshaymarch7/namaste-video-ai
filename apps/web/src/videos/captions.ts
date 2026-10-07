import 'server-only';
import {randomUUID} from 'node:crypto';
import {Long,type Db,type MongoClient,type Document} from 'mongodb';
import {z} from 'zod';
import {inTransaction} from '../db/client';
import {ProjectError} from '../projects/contracts';
import {liveProject} from '../generation/live-project';
import {assertVideosReady} from './setup';
import {videoHash} from './materialize';
import {compileV2,spokenText} from '../../../../src/plan-v2/compiler';
import {captionOverrides,type CaptionOverride} from '../../../../src/plan-v2/caption-edits';
import {speechResult,type SpeechResult} from '../jobs/speech-result';
import {jobView} from '../jobs/contracts';
import {r2Store,type ReadableObjectStore} from '../storage/r2';
import {captionRequest,regenerateRequest,revisionView} from './caption-contracts';
type Doc=Document&{_id:string};
const uid=(prefix:string)=>`${prefix}_${randomUUID().replaceAll('-','')}`;
const fail=(code:string,message:string,status=409)=>new ProjectError(status,code,message);
export function captionService(db:Db,client:MongoClient,store:()=>ReadableObjectStore=r2Store){
 async function owned(ownerId:string,id:string){
  await assertVideosReady(db);const video=await db.collection<Doc>('videos').findOne({_id:id,ownerId});
  if(!video||!await db.collection<Doc>('projects').findOne({_id:video.projectId,ownerId,deletedAt:null}))throw fail('NOT_FOUND','Video not found.',404);
  if(videoHash(video.renderSpec)!==video.renderSpecHash)throw fail('SOURCE_CHANGED','Reload the saved video.');return video;
 }
 async function measured(v:Doc){
  const speech:Record<string,SpeechResult>={},fingerprints:Record<string,string>={},storage=store();
  for(const scene of v.renderSpec.plan.scenes){
   const expected=videoHash({text:spokenText(scene).text,config:v.renderSpec.renderConfig});
   const stage=await db.collection<Doc>('speechStages').findOne({jobId:v.jobId,ownerId:v.ownerId,projectId:v.projectId,sceneId:scene.id,state:'stored',fingerprint:expected});
   if(!stage?.result)throw fail('SPEECH_RECOVERY_REQUIRED','Saved narration is unavailable. No speech will be regenerated.',503);
   try{speech[scene.id]=speechResult.parse(JSON.parse(Buffer.from(await storage.read(stage.objectKey,stage.result.bytes,stage.result.sha256,'application/json')).toString('utf8')));}
   catch{throw fail('SPEECH_RECOVERY_REQUIRED','Saved narration could not be verified. No speech will be regenerated.',503);}
   fingerprints[scene.id]=expected;
  }
  return {speech,fingerprints};
 }
 function timeline(v:Doc,speech:Record<string,SpeechResult>,overrides:CaptionOverride[]){
  try{return compileV2(v.renderSpec.plan,{notes:v.renderSpec.notes,voicePreset:v.renderSpec.voicePreset},speech,false,overrides);}
  catch(e){const code=(e as Error).message;throw fail(['CAPTION_MEANING_CHANGE','INVALID_SPAN'].includes(code)?code:'CAPTION_TIMING_INVALID',code==='CAPTION_MEANING_CHANGE'?'Change spoken words or punctuation in the storyboard, then approve new narration.':'Check the original caption spans and saved timing.',422);}
 }
 return {
  async get(ownerId:string,id:string){
   const v=await owned(ownerId,id),{speech,fingerprints}=await measured(v),compiled=timeline(v,speech,v.renderSpec.captionRevision?.overrides??[]);
   await owned(ownerId,id);
   return {videoId:id,renderSpecHash:v.renderSpecHash,scenes:compiled.scenes.map(scene=>({sceneId:scene.id,title:scene.title,speechFingerprint:fingerprints[scene.id],captions:scene.captions.map(c=>({id:`${scene.id}:${c.sourceStart}:${c.sourceEnd}`,sourceStart:c.sourceStart,sourceEnd:c.sourceEnd,text:c.text,originalText:c.originalText,startFrame:c.start,endFrame:c.end}))}))};
  },
  async revise(ownerId:string,id:string,key:string,raw:unknown,action:'captions'|'regenerate'='captions'){
   const input=action==='captions'?captionRequest.parse(raw):regenerateRequest.parse(raw),v=await owned(ownerId,id);
   const scope={ownerId,projectId:v.projectId,route:`${action}/${id}`,keyHash:videoHash(key)},requestHash=videoHash(input);
   async function receipt(session?:import('mongodb').ClientSession){const old=await db.collection<Doc>('generationCommands').findOne(scope,{session});if(old&&old.requestHash!==requestHash)throw fail('IDEMPOTENCY_KEY_REUSED','Recover the original request.');return old;}
   const old=await receipt();if(old)return {data:revisionView.parse(old.response),replayed:true};
   if(input.expectedRenderSpecHash!==v.renderSpecHash)throw fail('SOURCE_CHANGED','Refresh captions before editing.');
   const overrides=captionOverrides.parse('overrides'in input?input.overrides:v.renderSpec.captionRevision?.overrides??[]),{speech,fingerprints}=await measured(v);
   for(const edit of overrides)if(fingerprints[edit.sceneId]!==edit.speechFingerprint)throw fail('INVALID_SPAN','Caption speech fingerprint changed.',422);
   timeline(v,speech,overrides);
   if(action==='captions'&&videoHash(overrides)===videoHash(v.renderSpec.captionRevision?.overrides??[]))throw fail('NO_CHANGES','Edit a caption before rendering.');
   return inTransaction(client,async session=>{
    const date=new Date(),parent=await liveProject(db,ownerId,v.projectId,session,date),existing=await receipt(session);
    if(existing)return {data:revisionView.parse(existing.response),replayed:true};
    if(parent.activeJobId)throw fail('PROJECT_BUSY','Wait for the active project request to finish.');
    const inputSnapshot={...v.renderSpec,captionRevision:{version:1,rendererVersion:'plan-v2-2',parentVideoId:id,speechSourceJobId:v.jobId,overrides}};
    const job:Doc={_id:uid('job'),ownerId,projectId:v.projectId,storyboardId:v.storyboardId,approvalId:v.storyApprovalId,inputSnapshot,inputHash:videoHash(inputSnapshot),state:'queued',stage:'queued',revision:1,attempt:0,fence:0,leaseUntil:null,deadlineAt:new Date(date.getTime()+15*60000),errorCode:null,createdAt:date,updatedAt:date,finishedAt:null};
    await db.collection<Doc>('generationJobs').insertOne(job,{session});
    await db.collection<Doc>('generationOutbox').insertOne({_id:uid('evt'),jobId:job._id,state:'pending',leaseToken:null,leaseUntil:null,availableAt:date,createdAt:date},{session});
    await db.collection<Doc>('projects').updateOne({_id:parent._id,ownerId,deletedAt:null},{$set:{activeJobId:job._id,'flags.needsAttention':false,updatedAt:date},$inc:{contentRevision:Long.ONE}},{session});
    const jobData=jobView.parse({id:job._id,projectId:job.projectId,storyboardId:job.storyboardId,state:job.state,stage:job.stage,revision:1,attempt:0,errorCode:null,createdAt:date.toISOString(),updatedAt:date.toISOString(),finishedAt:null,actions:{cancel:true}});
    const data=revisionView.parse({sourceVideoId:id,sourceRenderSpecHash:v.renderSpecHash,job:jobData});
    await db.collection<Doc>('generationCommands').insertOne({_id:uid('cmd'),...scope,requestHash,jobId:job._id,response:data,createdAt:date},{session});return {data,replayed:false};
   });
  },
 };
}
