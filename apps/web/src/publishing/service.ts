import 'server-only';
import {randomUUID} from 'node:crypto';
import {Long,MongoServerError,type Db,type MongoClient,type Document,type ClientSession} from 'mongodb';
import {inTransaction} from '../db/client';
import {ProjectError,idempotencyKey} from '../projects/contracts';
import {encryptToken,decryptToken,type InstagramConfig} from '../instagram/config';
import {videoHash} from '../videos/materialize';
import {publishInput,actionInput,intentView,type PublishInput} from './contracts';
import {assertPublishingReady} from './setup';
export type PublishRow=Document&{_id:string};
export const uid=(prefix:string)=>`${prefix}_${randomUUID().replaceAll('-','')}`;
export const issue=(code:string,message:string,status=409)=>new ProjectError(status,code,message);
export const beforeSubmit=['queued','preparing','processing','paused_auth','failed_safe'];
export const publishingEnabled=(env:Record<string,string|undefined>=process.env)=>env.INSTAGRAM_PUBLISH_ENABLED==='1';
export function publishView(r:PublishRow){return intentView.parse({id:r._id,projectId:r.projectId,revision:r.revision,state:r.state,videoId:r.videoId,videoTitle:r.videoTitle,assetHash:r.assetHash,destination:{connectionId:r.connectionId,instagramUserId:r.instagramUserId,destinationEpoch:r.destinationEpoch,usernameAtApproval:r.usernameAtApproval},caption:r.caption,createdAt:r.createdAt.toISOString(),updatedAt:r.updatedAt.toISOString(),publishedAt:r.publishedAt?.toISOString()??null,providerMediaId:r.providerMediaId,permalink:r.permalink,errorCode:r.errorCode,actions:{cancel:beforeSubmit.includes(r.state),retry:['failed_safe','paused_auth','cancelled'].includes(r.state)}});}
export async function publishFlags(db:Db,projectId:string,session:ClientSession){
 const p=await db.collection<PublishRow>('projects').findOne({_id:projectId,deletedAt:null},{session});if(!p)return;
 const published=!!await db.collection('publishIntents').findOne({projectId,state:'published'},{session});
 const attention=!!await db.collection('publishIntents').findOne({projectId,state:{$in:['paused_auth','failed_safe','outcome_unknown','needs_attention']}},{session});
 const latest=await db.collection('generationJobs').find({projectId},{session}).sort({createdAt:-1,_id:-1}).limit(1).next();
 await db.collection<PublishRow>('projects').updateOne({_id:projectId},{$set:{'flags.published':published,'flags.needsAttention':attention||!!latest&&['failed','needs_input'].includes(latest.state),updatedAt:new Date()},$inc:{contentRevision:Long.ONE}},{session});
}
export async function validatePublication(db:Db,ownerId:string,input:PublishInput,config:InstagramConfig,session:ClientSession){
 const p=await db.collection<PublishRow>('projects').findOne({_id:input.projectId,ownerId,deletedAt:null},{session});if(!p)throw issue('NOT_FOUND','Project not found.',404);
 const v=await db.collection<PublishRow>('videos').findOne({_id:input.payload.videoId,ownerId,projectId:p._id},{session});
 if(!v||v.outputHash!==input.payload.expectedOutputHash||videoHash(v.renderSpec)!==v.renderSpecHash)throw issue('VIDEO_NOT_READY','Review the exact saved video.');
 const a=await db.collection('videoApprovals').findOne({_id:input.payload.videoApprovalId as never,ownerId,projectId:p._id,subjectId:v._id,outputHash:v.outputHash,renderSpecHash:v.renderSpecHash},{session});
 if(!a)throw issue('VIDEO_NOT_APPROVED','Approve this video version before publishing.');
 if(!await db.collection('assets').findOne({_id:v.outputAssetId,ownerId,projectId:p._id,kind:'video',state:'ready',sha256:v.outputHash},{session}))throw issue('VIDEO_NOT_READY','The approved video is unavailable.');
 const d=input.payload.destination,c=await db.collection<PublishRow>('instagramConnections').findOne({_id:d.connectionId,ownerId},{session});
 if(!c||c.instagramUserId!==d.instagramUserId||c.destinationEpoch!==d.destinationEpoch)throw issue('DESTINATION_CHANGED','Review the current Instagram destination.');
 if(c.state!=='connected'||!c.encryptedToken||(c.expiresAt&&c.expiresAt<=new Date())||c.providerAppId!==config.appId||(c.provider??'instagram')!==(config.provider??'instagram'))throw issue('RECONNECT_REQUIRED','Reconnect this Instagram account before publishing.');
 const required=config.provider==='facebook'?'instagram_content_publish':'instagram_business_content_publish';if(!c.scopes.includes(required))throw issue('RECONNECT_REQUIRED','Grant publishing permission when reconnecting.');
 // Write fences serialize destination/project changes against accepting or submitting this payload.
 await db.collection<PublishRow>('instagramConnections').updateOne({_id:c._id},{$set:{updatedAt:new Date()}},{session});
 await db.collection<PublishRow>('projects').updateOne({_id:p._id},{$inc:{contentRevision:Long.ONE}},{session});
 return {v,c};
}
export function publishingService(db:Db,client:MongoClient,config:InstagramConfig|null,enabled:boolean){
 const rows=db.collection<PublishRow>('publishIntents'),commands=db.collection<PublishRow>('publishCommands');
 const settings=()=>{if(!config||!enabled)throw issue('PUBLISHING_DISABLED','Instagram publishing is awaiting administrator activation.',503);return config;};
 async function parent(ownerId:string,projectId:string,session?:ClientSession){if(!await db.collection<PublishRow>('projects').findOne({_id:projectId,ownerId,deletedAt:null},{session}))throw issue('NOT_FOUND','Project not found.',404);}
 async function owned(ownerId:string,id:string,session?:ClientSession){const r=await rows.findOne({_id:id,ownerId},{session});if(!r)throw issue('NOT_FOUND','Publication not found.',404);await parent(ownerId,r.projectId,session);return r;}
 async function command(ownerId:string,key:string,request:unknown,work:(session:ClientSession)=>Promise<PublishRow>){
  idempotencyKey.parse(key);await assertPublishingReady(db);const keyHash=videoHash(key),requestHash=videoHash(request);
  const perform=()=>inTransaction(client,async session=>{const old=await commands.findOne({ownerId,keyHash},{session});if(old){if(old.requestHash!==requestHash)throw issue('IDEMPOTENCY_KEY_REUSED','Recover the original request.');return {data:publishView(await owned(ownerId,old.intentId,session)),replayed:true};}
   const row=await work(session);await commands.insertOne({_id:uid('pcmd'),ownerId,keyHash,requestHash,intentId:row._id,createdAt:new Date()},{session});await publishFlags(db,row.projectId,session);return {data:publishView(row),replayed:false};});
  try{return await perform();}catch(e){if(e instanceof MongoServerError&&e.code===11000)return perform();throw e;}
 }
 return {
  async list(ownerId:string,projectId:string,limit:number,cursor?:string){await assertPublishingReady(db);await parent(ownerId,projectId);let after={};if(cursor){const r=await rows.findOne({_id:cursor,ownerId,projectId});if(!r)throw issue('INVALID_CURSOR','Refresh publication history.',400);after={$or:[{createdAt:{$lt:r.createdAt}},{createdAt:r.createdAt,_id:{$lt:cursor}}]};}const result=await rows.find({ownerId,projectId,...after}).sort({createdAt:-1,_id:-1}).limit(limit+1).toArray();return {data:result.slice(0,limit).map(publishView),page:{hasMore:result.length>limit,nextCursor:result.length>limit?result[limit-1]._id:null},enabled:!!config&&enabled};},
  async get(ownerId:string,id:string){await assertPublishingReady(db);return publishView(await owned(ownerId,id));},
  async create(ownerId:string,key:string,raw:unknown){const input=publishInput.parse(raw);return command(ownerId,key,{action:'create',input},async session=>{
   const cfg=settings(),existing=await rows.findOne({ownerId,videoId:input.payload.videoId,instagramUserId:input.payload.destination.instagramUserId},{session});
   if(existing)throw issue('PUBLICATION_EXISTS','This video already has a publication for that account. Review its history; do not create a duplicate.');
   const {v,c}=await validatePublication(db,ownerId,input,cfg,session),now=new Date(),id=uid('pub');
   const row:PublishRow={_id:id,ownerId,projectId:input.projectId,revision:1,state:'queued',videoId:v._id,videoTitle:v.title,videoApprovalId:input.payload.videoApprovalId,assetId:v.outputAssetId,assetHash:v.outputHash,renderSpecHash:v.renderSpecHash,connectionId:c._id,instagramUserId:c.instagramUserId,destinationEpoch:c.destinationEpoch,usernameAtApproval:c.username,caption:input.payload.caption,provider:cfg.provider??'instagram',providerAppId:cfg.appId,encryptedToken:encryptToken(decryptToken(c.encryptedToken,cfg,ownerId,c._id),cfg,ownerId,id),createdAt:now,updatedAt:now,nextRunAt:now,leaseUntil:null,attempt:1,polls:0,containerId:null,providerMediaId:null,permalink:null,publishedAt:null,errorCode:null};await rows.insertOne(row,{session});return row;
  });},
  async action(ownerId:string,id:string,key:string,action:'cancel'|'retry',raw:unknown){const input=actionInput.parse(raw);return command(ownerId,key,{id,action,input},async session=>{
   const row=await owned(ownerId,id,session);if(row.revision!==input.expectedRevision)throw issue('REVISION_CONFLICT','Publication changed. Refresh and review its status.');
   if(action==='cancel'){
    if(!beforeSubmit.includes(row.state))throw issue('PUBLICATION_COMMITTED','Submission may have started. Check the outcome before taking further action.');
    await rows.updateOne({_id:id},{$set:{state:'cancelled',updatedAt:new Date(),leaseUntil:null},$inc:{revision:1},$unset:{encryptedToken:'',ingestToken:''}},{session});
   }else{
    if(!['failed_safe','paused_auth','cancelled'].includes(row.state))throw issue('OUTCOME_UNKNOWN','This publication cannot safely be retried.');
    const cfg=settings(),c=await db.collection<PublishRow>('instagramConnections').findOne({_id:row.connectionId,ownerId},{session});
    if(!c||c.instagramUserId!==row.instagramUserId)throw issue('DESTINATION_CHANGED','Reconnect the original Instagram account.');
    const {c:current}=await validatePublication(db,ownerId,{projectId:row.projectId,mode:'now',confirm:true,payload:{videoId:row.videoId,videoApprovalId:row.videoApprovalId,expectedOutputHash:row.assetHash,caption:row.caption,destination:{connectionId:c._id,instagramUserId:c.instagramUserId,destinationEpoch:c.destinationEpoch}}},cfg,session);
    await rows.updateOne({_id:id},{$set:{state:'queued',destinationEpoch:current.destinationEpoch,usernameAtApproval:current.username,provider:cfg.provider??'instagram',providerAppId:cfg.appId,encryptedToken:encryptToken(decryptToken(current.encryptedToken,cfg,ownerId,current._id),cfg,ownerId,id),containerId:null,errorCode:null,leaseUntil:null,polls:0,nextRunAt:new Date(),updatedAt:new Date()},$inc:{revision:1,attempt:1},$unset:{ingestToken:'',expiresAt:''}},{session});
   }
   await db.collection('publishMediaGrants').deleteMany({intentId:id},{session});return (await rows.findOne({_id:id},{session}))!;
  });},
 };
}
