import {publicationTombstone} from './deletion-guard';
import 'server-only';
import {createHash,randomBytes} from 'node:crypto';
import {MongoServerError,type Db,type MongoClient,type ClientSession,type Document} from 'mongodb';
import {inTransaction} from '../db/client';
import {ProjectError} from '../projects/contracts';
import {publishFlags} from '../publishing/service';
import {lifecycleSubject,lifecycleEnabled} from './lifecycle';
import {assertInstagramLifecycleReady} from './lifecycle-setup';
import {assertInstagramDeletionReady} from './deletion-setup';
import type {InstagramConfig} from './config';
type Row=Document&{_id:string};
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');

export const deletionEnabled=(env:Record<string,string|undefined>=process.env)=>lifecycleEnabled(env)&&env.INSTAGRAM_DELETION_ENABLED==='1';
const fail=(code:string)=>new ProjectError(409,code,'Deletion needs operator review.');
const uncertain=['submitting','outcome_unknown','needs_attention'];
async function cleanup(db:Db,request:Row,session:ClientSession){
 const match={provider:'instagram',providerAppId:request.appId,instagramUserId:request.profileId};
 const intents=await db.collection<Row>('publishIntents').find(match,{session}).toArray();
 const connections=await db.collection<Row>('instagramConnections').find(match,{session}).toArray();
 const owners=[...new Set([...intents,...connections].map(r=>r.ownerId))];
 // Snapshots can refer to an older destination/video even after the intent was edited.
 if(await db.collection('publishRevisions').findOne({ownerId:{$nin:owners},instagramUserId:request.profileId},{session}))throw fail('HISTORY_SCOPE_REVIEW_REQUIRED');
 const revisions=await db.collection<Row>('publishRevisions').find({ownerId:{$in:owners},instagramUserId:request.profileId},{session}).toArray();
 for(const row of [...intents,...revisions])await db.collection<Row>('instagramPublicationTombstones').updateOne({_id:publicationTombstone(row.ownerId,row.videoId,row.instagramUserId)},{$setOnInsert:{createdAt:new Date()}},{upsert:true,session});
 for(const row of intents){
  await db.collection('publishMediaGrants').deleteMany({intentId:row._id},{session});
  await db.collection<Row>('publishIntents').deleteOne({_id:row._id},{session});
  // Command hashes/intent references remain to reject old command replay, without account details.
 }
 await db.collection('publishRevisions').deleteMany({ownerId:{$in:owners},instagramUserId:request.profileId},{session});
 for(const row of connections){
  await db.collection<Row>('instagramConnections').updateOne({_id:row._id},{$set:{state:'disconnected',scopes:[],updatedAt:new Date()},$inc:{revision:1,tokenRevision:1,oauthEpoch:1,destinationEpoch:1},$unset:Object.fromEntries(['instagramUserId','username','accountType','encryptedToken','expiresAt','tokenIssuedAt','refreshLeaseUntil','provider','providerAppId','tokenKind','pageId','pageName'].map(k=>[k,'']))},{session});
  await db.collection('oauthStates').deleteMany({connectionId:row._id},{session});
  await db.collection('instagramCommands').deleteMany({ownerId:row.ownerId},{session});
 }
 // Keep only the replay watermark, not the provider profile mapping.
 await db.collection<Row>('instagramLifecycle').updateOne({_id:request.subjectHash},{$unset:{instagramUserId:''},$set:{updatedAt:new Date()}},{session});
 for(const project of new Set(intents.map(r=>r.projectId)))await publishFlags(db,project,session);
 await db.collection<Row>('instagramDeletions').updateOne({_id:request._id},{$set:{state:'completed',reason:'completed',completedAt:new Date(),updatedAt:new Date()},$unset:{profileId:''}},{session});
}
async function freeze(db:Db,appId:string,profileId:string,session:ClientSession){
 const match={provider:'instagram',providerAppId:appId,instagramUserId:profileId},now=new Date();
 for(const row of await db.collection<Row>('instagramConnections').find(match,{session}).toArray()){
  await db.collection<Row>('instagramConnections').updateOne({_id:row._id},{$set:{state:'reconnect_required',scopes:[],updatedAt:now},$inc:{revision:1,tokenRevision:1,oauthEpoch:1},$unset:{encryptedToken:'',refreshLeaseUntil:''}},{session});
  await db.collection('oauthStates').updateMany({connectionId:row._id,state:{$in:['pending','exchanging']}},{$set:{state:'failed',updatedAt:now}},{session});
 }
 for(const row of await db.collection<Row>('publishIntents').find(match,{session}).toArray()){
  const state=uncertain.includes(row.state)?'needs_attention':['scheduled','queued','preparing','processing','paused_auth'].includes(row.state)?'paused_auth':row.state;
  await db.collection<Row>('publishIntents').updateOne({_id:row._id},{$set:{state,leaseUntil:null,updatedAt:now,...(['needs_attention','paused_auth'].includes(state)?{errorCode:'INSTAGRAM_DELETION_PENDING'}:{})},$inc:{revision:1},$unset:{encryptedToken:'',ingestToken:''}},{session});
  await db.collection('publishMediaGrants').deleteMany({intentId:row._id},{session});await publishFlags(db,row.projectId,session);
 }
}
export async function requestInstagramDeletion(db:Db,client:MongoClient,config:InstagramConfig,event:{userId:string;issuedAt:Date}){
 if(config.provider==='facebook')throw fail('DIRECT_INSTAGRAM_REQUIRED');
 await assertInstagramLifecycleReady(db);await assertInstagramDeletionReady(db);
 const subjectHash=lifecycleSubject(config.appId,event.userId),eventHash=hash([subjectHash,event.issuedAt.toISOString()]);
 const work=()=>inTransaction(client,async session=>{
  const requests=db.collection<Row>('instagramDeletions'),previous=await requests.findOne({eventHash},{session});if(previous)return previous._id;
  const ledger=await db.collection<Row>('instagramLifecycle').findOne({_id:subjectHash},{session});
  const now=new Date(),newer=!!ledger&&Math.floor(ledger.authorizedAt.getTime()/1000)*1000>event.issuedAt.getTime();
  const row:Row={_id:randomBytes(32).toString('hex'),eventHash,subjectHash,appId:config.appId,state:'needs_review',reason:!ledger?.instagramUserId?'unmapped':newer?'newer_consent':'publication_unknown',requestedAt:event.issuedAt,createdAt:now,updatedAt:now,...(ledger?.instagramUserId?{profileId:ledger.instagramUserId}:{})};
  await requests.insertOne(row,{session});
  // This write shares the OAuth fence, even for an unmapped first-login race.
  await db.collection<Row>('instagramLifecycle').updateOne({_id:subjectHash},{$max:{revokedAt:event.issuedAt},$set:{updatedAt:now},$setOnInsert:{authorizedAt:new Date(0)}},{upsert:true,session});
  if(!row.profileId)return row._id;
  await freeze(db,config.appId,row.profileId,session);
  const unknown=await db.collection('publishIntents').findOne({provider:'instagram',providerAppId:config.appId,instagramUserId:row.profileId,state:{$in:uncertain}},{session});
  const owners=await db.collection('publishIntents').distinct('ownerId',{provider:'instagram',providerAppId:config.appId,instagramUserId:row.profileId},{session});
  const connectionOwners=await db.collection('instagramConnections').distinct('ownerId',{provider:'instagram',providerAppId:config.appId,instagramUserId:row.profileId},{session});
  const ambiguous=await db.collection('publishRevisions').findOne({instagramUserId:row.profileId,ownerId:{$nin:[...owners,...connectionOwners]}},{session});
  if(ambiguous)await requests.updateOne({_id:row._id},{$set:{reason:'history_scope'}},{session});
  if(!newer&&!unknown&&!ambiguous)await cleanup(db,row,session);
  return row._id;
 });
 let code:string;try{code=await work();}catch(e){if(e instanceof MongoServerError&&e.code===11000)code=await work();else throw e;}
 return {url:`${new URL(config.redirectUri).origin}/instagram/deletion/${code}`,confirmation_code:code};
}
export async function completeReviewedDeletion(db:Db,client:MongoClient,code:string){
 if(!/^[a-f0-9]{64}$/.test(code))throw fail('INVALID_CONFIRMATION_CODE');await assertInstagramDeletionReady(db);
 return inTransaction(client,async session=>{
  const row=await db.collection<Row>('instagramDeletions').findOne({_id:code},{session});if(!row)throw fail('DELETION_NOT_FOUND');if(row.state==='completed')return;
  if(!row.profileId)throw fail('IDENTITY_REVIEW_REQUIRED');
  await db.collection<Row>('instagramLifecycle').updateOne({_id:row.subjectHash},{$set:{updatedAt:new Date()}},{session});
  await db.collection<Row>('instagramDeletions').updateOne({_id:code},{$set:{reviewedAt:new Date()}},{session});
  await cleanup(db,row,session);
 });
}
export async function deletionStatus(db:Db,code:string){
 if(!/^[a-f0-9]{64}$/.test(code))return null;
 await assertInstagramDeletionReady(db);
 const row=await db.collection<Row>('instagramDeletions').findOne({_id:code});
 return row?{state:row.state as 'completed'|'needs_review',updatedAt:row.updatedAt.toISOString()}:null;
}
