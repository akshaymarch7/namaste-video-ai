import 'server-only';
import {randomBytes} from 'node:crypto';
import type {Db,MongoClient,ClientSession} from 'mongodb';
import {inTransaction} from '../db/client';
import {decryptToken,encryptToken,type InstagramConfig} from '../instagram/config';
import {digest} from '../storage/service';
import {publishFlags,uid,validatePublication,deliveryDeadline,type PublishRow} from './service';
import {PublishProviderError,type PublishProvider} from './provider';
import {assertSchedulingReady as assertPublishingReady} from './schedule-setup';
export function publishWorker(db:Db,client:MongoClient,config:InstagramConfig,provider:PublishProvider,mediaOrigin:string,now=()=>new Date()){
 const rows=db.collection<PublishRow>('publishIntents');
 const input=(r:PublishRow)=>({projectId:r.projectId,mode:'now' as const,confirm:true as const,payload:{videoId:r.videoId,videoApprovalId:r.videoApprovalId,expectedOutputHash:r.assetHash,caption:r.caption,destination:{connectionId:r.connectionId,instagramUserId:r.instagramUserId,destinationEpoch:r.destinationEpoch}}});
 async function write(r:PublishRow,values:Record<string,unknown>,session:ClientSession,clear=false){const result=await rows.findOneAndUpdate({_id:r._id,revision:r.revision,attempt:r.attempt},{$set:{...values,updatedAt:now()},$inc:{revision:1},...(clear?{$unset:{encryptedToken:'',ingestToken:''}}:{})},{session,returnDocument:'after'});if(result)await publishFlags(db,r.projectId,session);return result;}
 async function settle(r:PublishRow,state:string,errorCode:string|null,extra:Record<string,unknown>={}){return inTransaction(client,async session=>write(r,{state,errorCode,leaseUntil:null,nextRunAt:new Date(now().getTime()+60000),...extra},session,['published','failed_safe','cancelled','paused_auth'].includes(state)));}
 async function eligible(r:PublishRow,session:ClientSession){
  const admitted=await db.collection('internalAccess').findOneAndUpdate({provisionedUserId:r.ownerId,enabled:true,provisioningState:'active'},{$set:{updatedAt:now()}},{session});if(!admitted)throw Error('ACCESS_UNAVAILABLE');
  return validatePublication(db,r.ownerId,input(r),config,session);
 }
 return {async tick(ownerId?:string){
  await assertPublishingReady(db);
  // Each call performs at most one provider operation, or a publish plus permalink read.
  const candidate=await rows.find({...(ownerId?{ownerId}:{}),state:{$in:['scheduled','queued','preparing','processing','submitting','outcome_unknown']},nextRunAt:{$lte:now()},$or:[{leaseUntil:null},{leaseUntil:{$lte:now()}}]}).sort({nextRunAt:1,_id:1}).limit(1).next();if(!candidate)return {worked:false};
  const r=await inTransaction(client,async session=>{
   const current=await rows.findOne({_id:candidate._id,revision:candidate.revision},{session});if(!current)return null;
   if(!['submitting','outcome_unknown'].includes(current.state)&&deliveryDeadline(current)<=now())return write(current,{state:'failed_safe',errorCode:'DELIVERY_WINDOW_EXPIRED',leaseUntil:null},session,true).then(()=>null);
   if(current.state==='preparing')return write(current,{state:'failed_safe',errorCode:'CONTAINER_UNCONFIRMED',leaseUntil:null},session,true).then(()=>null);
   if(current.state==='submitting')return write(current,{state:'outcome_unknown',errorCode:'PUBLISH_OUTCOME_UNKNOWN',leaseUntil:null,nextRunAt:now()},session).then(()=>null);
   if(current.state==='outcome_unknown'){
    if(current.polls>=15||current.providerAppId!==config.appId||current.provider!==(config.provider??'instagram'))return write(current,{state:'needs_attention',errorCode:'PUBLISH_OUTCOME_UNKNOWN',leaseUntil:null},session).then(()=>null);
    return write(current,{leaseUntil:new Date(now().getTime()+60000),nextRunAt:new Date(now().getTime()+60000),polls:current.polls+1},session);
   }
   try{await eligible(current,session);}catch{return write(current,{state:'paused_auth',errorCode:'PUBLICATION_REVALIDATION_REQUIRED',leaseUntil:null},session,true).then(()=>null);}
   if(current.state==='queued'||current.state==='scheduled'){
    const token=randomBytes(32).toString('base64url'),expiresAt=new Date(now().getTime()+3600000);
    await db.collection('publishMediaGrants').insertOne({_id:uid('pgr') as never,ownerId:current.ownerId,projectId:current.projectId,intentId:current._id,assetId:current.assetId,assetHash:current.assetHash,attempt:current.attempt,tokenHash:digest(token),expiresAt},{session});
    return write(current,{state:'preparing',ingestToken:encryptToken(token,config,current.ownerId,current._id),expiresAt,leaseUntil:new Date(now().getTime()+60000),nextRunAt:new Date(now().getTime()+60000)},session);
   }
   if(current.polls>=5||current.expiresAt<=now())return write(current,{state:'failed_safe',errorCode:'PROCESSING_TIMEOUT',leaseUntil:null},session,true).then(()=>null);
   return write(current,{leaseUntil:new Date(now().getTime()+60000),nextRunAt:new Date(now().getTime()+60000),polls:current.polls+1},session);
  });
  if(!r)return {worked:true};
  let token:string;try{token=decryptToken(r.encryptedToken,config,r.ownerId,r._id);}catch{await settle(r,r.state==='outcome_unknown'?'needs_attention':'paused_auth','RECONNECT_REQUIRED');return {worked:true};}
  if(r.state==='preparing'){
   try{const containerId=await provider.create(r.instagramUserId,token,`${mediaOrigin}/media/${decryptToken(r.ingestToken,config,r.ownerId,r._id)}`,r.caption);await settle(r,'processing',null,{containerId});}
   catch(e){await settle(r,e instanceof PublishProviderError&&e.code==='RECONNECT_REQUIRED'?'paused_auth':'failed_safe',e instanceof PublishProviderError?e.code:'CONTAINER_UNCONFIRMED');}
   return {worked:true};
  }
  let status:Awaited<ReturnType<PublishProvider['status']>>;
  try{status=await provider.status(r.containerId,token);}catch(e){await settle(r,r.state==='outcome_unknown'?'outcome_unknown':e instanceof PublishProviderError&&e.code==='RECONNECT_REQUIRED'?'paused_auth':'processing',e instanceof PublishProviderError?e.code:'PROVIDER_UNAVAILABLE');return {worked:true};}
  if(status==='PUBLISHED'){await settle(r,'published',null,{publishedAt:now()});return {worked:true};}
  if(r.state==='outcome_unknown'){await settle(r,'outcome_unknown','PUBLISH_OUTCOME_UNKNOWN');return {worked:true};}
  if(status==='ERROR'||status==='EXPIRED'){await settle(r,'failed_safe',`CONTAINER_${status}`);return {worked:true};}
  if(status!=='FINISHED'){await settle(r,'processing',null);return {worked:true};}
  // Persist the point of no automatic retry before making the publication POST.
  const submitting=await inTransaction(client,async session=>{
   const current=await rows.findOne({_id:r._id,revision:r.revision,state:'processing'},{session});if(!current)return null;
   if(deliveryDeadline(current)<=now())return write(current,{state:'failed_safe',errorCode:'DELIVERY_WINDOW_EXPIRED',leaseUntil:null},session,true).then(()=>null);
   try{await eligible(current,session);}catch{return write(current,{state:'paused_auth',errorCode:'PUBLICATION_REVALIDATION_REQUIRED',leaseUntil:null},session,true).then(()=>null);}
   return write(current,{state:'submitting',polls:0,leaseUntil:new Date(now().getTime()+60000),nextRunAt:new Date(now().getTime()+60000)},session);
  });if(!submitting)return {worked:true};
  try{
   const providerMediaId=await provider.publish(r.instagramUserId,token,r.containerId);let permalink:string|null=null;try{permalink=await provider.permalink(providerMediaId,token);}catch{/* Publication ID is authoritative even if the optional link lookup fails. */}
   await settle(submitting,'published',null,{providerMediaId,permalink,publishedAt:now()});
  }catch{await settle(submitting,'outcome_unknown','PUBLISH_OUTCOME_UNKNOWN');}
  return {worked:true};
 }};
}
