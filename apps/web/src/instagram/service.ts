import 'server-only';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {MongoServerError,type Db,type Document,type MongoClient,type ClientSession} from 'mongodb';
import {inTransaction} from '../db/client';
import {ProjectError,idempotencyKey} from '../projects/contracts';
import {connectInput,disconnectInput,connectionView} from './contracts';
import {encryptToken,decryptToken,type InstagramConfig} from './config';
import {authorizationUrl,type InstagramProvider} from './provider';
type Row=Document&{_id:string};
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const id=(prefix:string)=>`${prefix}_${randomUUID().replaceAll('-','')}`;
const fail=(code:string,message:string,status=409)=>new ProjectError(status,code,message);
export function instagramService(db:Db,client:MongoClient,config:InstagramConfig|null,provider:InstagramProvider|null){
 const rows=db.collection<Row>('instagramConnections'),states=db.collection<Row>('oauthStates'),commands=db.collection<Row>('instagramCommands');
 const configured=()=>{if(!config||!provider)throw fail('INSTAGRAM_NOT_CONFIGURED','Instagram connection is not configured yet.',503);return {config,provider};};
 // F19/F20 must replace this conservative guard with transactional pause/reconciliation.
 async function guardIntents(ownerId:string,session:ClientSession){if(await db.collection('publishIntents').findOne({ownerId,state:{$nin:['published','cancelled','failed']}},{session}))throw fail('CONNECTION_RECONCILIATION_PENDING','Resolve pending publication before changing this connection.');}
 function view(r:Row|null){if(!r)return null;const expired=!r.expiresAt||r.expiresAt.getTime()<=Date.now();return connectionView.parse({id:r._id,revision:r.revision,state:r.state==='connected'?(expired?'reconnect_required':r.expiresAt.getTime()<Date.now()+7*86400000?'expiring':'connected'):r.state,account:r.instagramUserId?{id:r.instagramUserId,username:r.username,type:r.accountType}:null,destinationEpoch:r.destinationEpoch,expiresAt:r.expiresAt?.toISOString()??null,publishingAvailable:false,pendingIntentCount:0});}
 return {
  async get(ownerId:string){const r=await rows.findOne({ownerId});const result=view(r);if(result)result.pendingIntentCount=await db.collection('publishIntents').countDocuments({ownerId,state:{$nin:['published','cancelled','failed']}});return result;},
  async connect(ownerId:string,sessionId:string,raw:unknown){
   const {config}=configured(),input=connectInput.parse(raw),state=randomBytes(32).toString('base64url'),now=new Date(),expiresAt=new Date(now.getTime()+600000);
   const work=()=>inTransaction(client,async session=>{
    if(input.returnProjectId&&!await db.collection('projects').findOne({_id:input.returnProjectId as never,ownerId,deletedAt:null},{session}))throw fail('NOT_FOUND','Project not found.',404);
    await guardIntents(ownerId,session);
    let row=await rows.findOne({ownerId},{session});
    if(!row){row={_id:id('igc'),ownerId,revision:1,state:'disconnected',tokenRevision:0,destinationEpoch:1,oauthEpoch:0,scopes:[],createdAt:now,updatedAt:now};await rows.insertOne(row,{session});}
    const next=row.oauthEpoch+1;
    await rows.updateOne({_id:row._id},{$set:{oauthEpoch:next,updatedAt:now}},{session});
    await states.insertOne({_id:id('oas'),ownerId,stateHash:hash(state),initiatingSessionHash:hash(sessionId),connectionId:row._id,oauthEpoch:next,state:'pending',expiresAt,createdAt:now,updatedAt:now,...input},{session});
   });
   try{await work();}catch(e){if(e instanceof MongoServerError&&e.code===11000)await work();else throw e;}
   return {authorizationUrl:authorizationUrl(config,state),expiresAt:expiresAt.toISOString()};
  },
  async callback(ownerId:string,sessionId:string,state:string,code:string|null,denied:boolean){
   const {config,provider}=configured();
   if(!/^[A-Za-z0-9_-]{43}$/.test(state))throw fail('INSTAGRAM_STATE_INVALID','Authorization expired or does not match this session.');
   const receipt=await states.findOneAndUpdate({ownerId,stateHash:hash(state),initiatingSessionHash:hash(sessionId),state:'pending',expiresAt:{$gt:new Date()}},{$set:{state:'exchanging',updatedAt:new Date()}},{returnDocument:'after'});
   if(!receipt)throw fail('INSTAGRAM_STATE_INVALID','Authorization expired or was already used.');
   const returnPath='/settings/instagram'+(receipt.returnProjectId?`?project=${encodeURIComponent(receipt.returnProjectId)}`:'');
   const result=(outcome:string)=>`${returnPath}${returnPath.includes('?')?'&':'?'}outcome=${outcome}`;
   try{
    if(denied){await states.updateOne({_id:receipt._id},{$set:{state:'failed',updatedAt:new Date()}});return result('cancelled');}
    if(!code||code.length>4096)throw fail('INSTAGRAM_STATE_INVALID','Missing authorization code.');
    const grant=await provider.exchange(code);
    await inTransaction(client,async session=>{
     await guardIntents(ownerId,session);
     const current=await rows.findOne({_id:receipt.connectionId,ownerId,oauthEpoch:receipt.oauthEpoch},{session});
     if(!current)throw fail('INSTAGRAM_STATE_INVALID','A newer connection action replaced this authorization.');
     const switched=!!current.instagramUserId&&current.instagramUserId!==grant.account.id;
     const now=new Date();
     await rows.updateOne({_id:current._id},{$set:{state:'connected',instagramUserId:grant.account.id,username:grant.account.username,accountType:grant.account.type,scopes:grant.scopes,encryptedToken:encryptToken(grant.token,config,ownerId,current._id),expiresAt:new Date(now.getTime()+grant.expiresIn*1000),tokenIssuedAt:now,updatedAt:now},$inc:{revision:1,tokenRevision:1,destinationEpoch:switched?1:0},$unset:{refreshLeaseUntil:''}},{session});
     const consumed=await states.updateOne({_id:receipt._id,state:'exchanging',expiresAt:{$gt:now}},{$set:{state:'consumed',updatedAt:now}},{session});
     if(!consumed.matchedCount)throw fail('INSTAGRAM_STATE_INVALID','Authorization expired. Start again.');
    });
    return result('connected');
   }catch(e){
    await states.updateOne({_id:receipt._id,state:'exchanging'},{$set:{state:'failed',updatedAt:new Date()}}).catch(()=>undefined);
    if(e instanceof MongoServerError&&e.code===11000)return result('account_unavailable');
    const outcomes:Record<string,string>={INSTAGRAM_PERMISSIONS_REQUIRED:'permissions',INSTAGRAM_PROFESSIONAL_REQUIRED:'professional_required',INSTAGRAM_STATE_INVALID:'expired',CONNECTION_RECONCILIATION_PENDING:'pending_publication'};
    return result(e instanceof ProjectError?(outcomes[e.code]??'provider_error'):'provider_error');
   }
  },
  async disconnect(ownerId:string,key:string,raw:unknown){
   idempotencyKey.parse(key);const input=disconnectInput.parse(raw),keyHash=hash(key),requestHash=hash(JSON.stringify(input));
   const work=()=>inTransaction(client,async session=>{
    const previous=await commands.findOne({ownerId,keyHash},{session});if(previous){if(previous.requestHash!==requestHash)throw fail('IDEMPOTENCY_KEY_REUSED','Use the original disconnect request.');return previous.response;}
    await guardIntents(ownerId,session);
    const current=await rows.findOne({ownerId,revision:input.expectedRevision},{session});if(!current)throw fail('REVISION_CONFLICT','Connection changed. Reload and review the current account.');
    const now=new Date();
    const next=await rows.findOneAndUpdate({_id:current._id,revision:current.revision},{$set:{state:'disconnected',scopes:[],updatedAt:now},$inc:{revision:1,tokenRevision:1,oauthEpoch:1,destinationEpoch:1},$unset:{encryptedToken:'',instagramUserId:'',username:'',accountType:'',expiresAt:'',tokenIssuedAt:'',refreshLeaseUntil:''}},{session,returnDocument:'after'});
    const response={connection:view(next),pausedIntentCount:0,reconciliationPending:false};
    await commands.insertOne({_id:id('igcmd'),ownerId,keyHash,requestHash,response,createdAt:now,updatedAt:now},{session});return response;
   });
   try{return await work();}catch(e){if(e instanceof MongoServerError&&e.code===11000)return work();throw e;}
  },
  async refresh(ownerId:string){
   const {config,provider}=configured(),now=new Date();
   const row=await rows.findOneAndUpdate({ownerId,state:'connected',expiresAt:{$gt:now,$lt:new Date(now.getTime()+7*86400000)},tokenIssuedAt:{$lte:new Date(now.getTime()-86400000)},$or:[{refreshLeaseUntil:{$exists:false}},{refreshLeaseUntil:{$lte:now}}]},{$set:{refreshLeaseUntil:new Date(now.getTime()+60000)}},{returnDocument:'after'});
   if(!row)return 'skipped';
   const filter={_id:row._id,tokenRevision:row.tokenRevision,refreshLeaseUntil:row.refreshLeaseUntil};
   try{
    const result=await provider.refresh(decryptToken(row.encryptedToken,config,ownerId,row._id)),date=new Date();
    const saved=await rows.updateOne({...filter,refreshLeaseUntil:{$eq:row.refreshLeaseUntil,$gt:date}},{$set:{encryptedToken:encryptToken(result.token,config,ownerId,row._id),expiresAt:new Date(date.getTime()+result.expiresIn*1000),tokenIssuedAt:date,updatedAt:date},$inc:{tokenRevision:1,revision:1},$unset:{refreshLeaseUntil:''}});
    return saved.matchedCount?'refreshed':'superseded';
   }catch{
    await rows.updateOne(filter,{$set:{state:'reconnect_required',updatedAt:new Date()},$inc:{revision:1},$unset:{refreshLeaseUntil:''}});return 'reconnect_required';
   }
  },
 };
}
