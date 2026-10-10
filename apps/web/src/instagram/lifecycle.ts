import 'server-only';
import {parseInstagramJson} from './json';
import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {MongoServerError,type Db,type MongoClient,type ClientSession,type Document} from 'mongodb';
import {z} from 'zod';
import {inTransaction} from '../db/client';
import {ProjectError} from '../projects/contracts';
import {publishFlags} from '../publishing/service';
import {assertInstagramLifecycleReady} from './lifecycle-setup';
import type {InstagramConfig} from './config';
type Row=Document&{_id:string};
export const lifecycleEnabled=(env:Record<string,string|undefined>=process.env)=>env.INSTAGRAM_LIFECYCLE_ENABLED==='1';
export const lifecycleSubject=(app:string,user:string)=>createHash('sha256').update(JSON.stringify(['instagram',app,user])).digest('hex');
const invalid=()=>new ProjectError(400,'INVALID_SIGNED_REQUEST','Invalid lifecycle callback.');
const payload=z.object({algorithm:z.literal('HMAC-SHA256'),user_id:z.string().regex(/^\d{1,100}$/),issued_at:z.number().int().positive().max(8640000000000)});
export function verifyDeauthorization(value:string,secret:string,now=Date.now()){
 if(!secret||value.length>16384)throw invalid();
 const parts=value.split('.');if(parts.length!==2||parts.some(p=>!p||!/^[A-Za-z0-9_-]+$/.test(p)))throw invalid();
 const [sig,encoded]=parts,signature=Buffer.from(sig,'base64url'),expected=createHmac('sha256',secret).update(encoded).digest();
 if(signature.length!==32||signature.toString('base64url')!==sig||!timingSafeEqual(signature,expected))throw invalid();
 try{
  const decoded=Buffer.from(encoded,'base64url');if(decoded.toString('base64url')!==encoded)throw invalid();
  const data=payload.parse(parseInstagramJson(decoded.toString('utf8')));
  if(data.issued_at*1000>now+300000)throw invalid();
  return {userId:data.user_id,issuedAt:new Date(data.issued_at*1000)};
 }catch{throw invalid();}
}
// Shared transactional write serializes initial authorization with a concurrent revocation,
// including when no connection row exists yet. Never expire the replay watermark.
export async function fenceAuthorization(db:Db,config:InstagramConfig,userId:string|undefined,instagramUserId:string,startedAt:Date,session:ClientSession){
 if(!userId||!/^\d{1,100}$/.test(userId))throw new ProjectError(502,'INSTAGRAM_RESPONSE_INVALID','Instagram did not return a lifecycle identity. Reconnect.');
 await assertInstagramLifecycleReady(db);
 const rows=db.collection<Row>('instagramLifecycle'),_id=lifecycleSubject(config.appId,userId);
 const row=await rows.findOne({_id},{session});
 if(await db.collection('instagramDeletions').findOne({subjectHash:_id,state:'needs_review'},{session}))throw new ProjectError(409,'INSTAGRAM_DELETION_PENDING','An Instagram deletion request is still under review.');
 if(row&&row.revokedAt.getTime()>=Math.floor(startedAt.getTime()/1000)*1000)throw new ProjectError(409,'INSTAGRAM_STATE_INVALID','Authorization was revoked. Start again.');
 await rows.updateOne({_id},{$set:{updatedAt:new Date(),instagramUserId},$max:{authorizedAt:startedAt},$setOnInsert:{revokedAt:new Date(0)}},{upsert:true,session});
}
export async function deauthorizeInstagram(db:Db,client:MongoClient,config:InstagramConfig,event:{userId:string;issuedAt:Date}){
 if(config.provider==='facebook')throw Error('DIRECT_INSTAGRAM_REQUIRED');
 await assertInstagramLifecycleReady(db);
 const work=()=>inTransaction(client,async session=>{
  const records=db.collection<Row>('instagramLifecycle'),_id=lifecycleSubject(config.appId,event.userId);
  const prior=await records.findOne({_id},{session});
  if(prior&&prior.revokedAt>=event.issuedAt)return;
  const now=new Date();
  await records.updateOne({_id},{$set:{revokedAt:event.issuedAt,updatedAt:now},$setOnInsert:{authorizedAt:new Date(0)}},{upsert:true,session});
  // A delayed event cannot revoke a newer, explicitly started authorization.
  if(prior&&Math.floor(prior.authorizedAt.getTime()/1000)*1000>event.issuedAt.getTime())return;
  // Callback IDs are app-scoped OAuth subjects, not inferred from profile/user IDs.
  // Existing connections must reconnect once after activation to establish this mapping.
  if(!prior?.instagramUserId)return;
  const match={provider:'instagram',providerAppId:config.appId,instagramUserId:prior.instagramUserId};
  const connection=await db.collection<Row>('instagramConnections').findOne(match,{session});
  if(connection){
   await db.collection<Row>('instagramConnections').updateOne({_id:connection._id},{$set:{state:'reconnect_required',scopes:[],updatedAt:now},$inc:{revision:1,tokenRevision:1,oauthEpoch:1},$unset:{encryptedToken:'',refreshLeaseUntil:''}},{session});
   await db.collection('oauthStates').updateMany({connectionId:connection._id,state:{$in:['pending','exchanging']}},{$set:{state:'failed',updatedAt:now}},{session});
  }
  // Match the provider account, not only the current workspace: older destination intents
  // can survive account switches. Preserve unknown outcomes; never label them cancelled.
  const intents=db.collection<Row>('publishIntents');
  for(const row of await intents.find(match,{session}).toArray()){
   const state=['scheduled','queued','preparing','processing','paused_auth'].includes(row.state)?'paused_auth':
    ['submitting','outcome_unknown','needs_attention'].includes(row.state)?'needs_attention':row.state;
   await intents.updateOne({_id:row._id},{$set:{state,leaseUntil:null,updatedAt:now,...(state==='paused_auth'||state==='needs_attention'?{errorCode:'INSTAGRAM_ACCESS_REVOKED'}:{})},$inc:{revision:1},$unset:{encryptedToken:'',ingestToken:''}},{session});
   await db.collection('publishMediaGrants').deleteMany({intentId:row._id},{session});
   await publishFlags(db,row.projectId,session);
  }
 });
 try{await work();}catch(e){if(e instanceof MongoServerError&&e.code===11000)await work();else throw e;}
}
export async function handleSignedLifecycle(request:Request,config:InstagramConfig|null,run:(event:{userId:string;issuedAt:Date})=>Promise<unknown>,enabled=lifecycleEnabled()){
 const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'};
 if(!enabled||!config||config.provider==='facebook')return new Response(null,{status:503,headers});
 let reader:ReadableStreamDefaultReader<Uint8Array>|undefined,timer:ReturnType<typeof setTimeout>|undefined;
 try{
  if(request.method!=='POST'||new URL(request.url).search)throw invalid();
  if(request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()!=='application/x-www-form-urlencoded')return new Response(null,{status:415,headers});
  reader=request.body?.getReader();if(!reader)throw invalid();
  const body=await Promise.race([(async()=>{const chunks:Uint8Array[]=[];let size=0;for(;;){const part=await reader!.read();if(part.done)break;size+=part.value.length;if(size>20000)throw new ProjectError(413,'PAYLOAD_TOO_LARGE','Callback too large.');chunks.push(part.value);}return Buffer.concat(chunks).toString('utf8');})(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(invalid()),2000);})]);
  const form=new URLSearchParams(body);if([...form.keys()].length!==1||!form.has('signed_request'))throw invalid();
  const event=verifyDeauthorization(form.get('signed_request')!,config.appSecret);
  return Response.json(await run(event),{headers});
 }catch(e){return Response.json({error:{code:e instanceof ProjectError?e.code:'LIFECYCLE_UNAVAILABLE'}},{status:e instanceof ProjectError?e.status:503,headers});}
 finally{clearTimeout(timer);void reader?.cancel().catch(()=>undefined);}
}

export async function handleDeauthorization(request:Request,config:InstagramConfig|null,run:(event:{userId:string;issuedAt:Date})=>Promise<void>,enabled=lifecycleEnabled()){return handleSignedLifecycle(request,config,async event=>{await run(event);return {success:true};},enabled);}
