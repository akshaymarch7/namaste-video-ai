import 'server-only';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {Long,type Db,type MongoClient,type Document} from 'mongodb';
import {z} from 'zod';
import {inTransaction} from '../db/client';
import {ProjectError,projectId as projectIdSchema} from '../projects/contracts';
import {isAdmitted} from '../auth/engine';
import {assetId,assetView,kinds,kindSchema,sha256,MAX_ASSET_BYTES,mediaAuthRequest} from './contracts';
import {assertStorageReady} from './setup';
import type {ObjectStore} from './r2';
type Doc=Document&{_id:string};
export const digest=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
const missing=()=>new ProjectError(404,'NOT_FOUND','Media not found.');
export function storageService(db:Db,client:MongoClient,now=()=>new Date()){
 const assets=db.collection<Doc>('assets'),grants=db.collection<Doc>('mediaGrants');
 async function parent(ownerId:string,projectId:string,session?:import('mongodb').ClientSession){const p=await db.collection<Doc>('projects').findOne({_id:projectId,ownerId,deletedAt:null},{session});if(!p)throw missing();return p;}
 async function owned(ownerId:string,id:string,session?:import('mongodb').ClientSession){const a=await assets.findOne({_id:id,ownerId},{session});if(!a)throw missing();await parent(ownerId,a.projectId,session);return a;}
 return {
  // Server producer boundary only. Callers retain assetId to retry a staging upload.
  async upload(ownerId:string,raw:{id:string;projectId:string;kind:z.infer<typeof kindSchema>;producerFingerprint:string},body:Uint8Array,store:ObjectStore){
   await assertStorageReady(db);if(!await isAdmitted(db,ownerId))throw new ProjectError(403,'ACCESS_DISABLED','Account access is disabled.');
   const input=z.object({id:assetId,projectId:projectIdSchema,kind:kindSchema,producerFingerprint:sha256}).strict().parse(raw);
   if(!body.byteLength||body.byteLength>MAX_ASSET_BYTES)throw new ProjectError(422,'INVALID_ASSET','Asset must be between 1 byte and 64 MiB.');
   // Freeze caller memory so hash and transmitted bytes cannot diverge across awaits.
   const bytes=Uint8Array.from(body),hash=digest(bytes),type=kinds[input.kind].type;
   const key=`owners/${digest(ownerId)}/projects/${input.projectId}/assets/${input.id}.${kinds[input.kind].ext}`;
   await inTransaction(client,async session=>{
    await parent(ownerId,input.projectId,session);
    await db.collection<Doc>('projects').updateOne({_id:input.projectId,ownerId,deletedAt:null},{$inc:{contentRevision:Long.ONE}},{session});
    const old=await assets.findOne({_id:input.id},{session});
    if(old){if(old.ownerId!==ownerId||old.projectId!==input.projectId||old.sha256!==hash||old.contentType!==type||old.kind!==input.kind||old.producerFingerprint!==input.producerFingerprint||!['staging','ready'].includes(old.state))throw new ProjectError(409,'ASSET_CONFLICT','Use a new asset ID for different content.');return;}
    await assets.insertOne({_id:input.id,ownerId,projectId:input.projectId,kind:input.kind,state:'staging',objectKey:key,sha256:hash,bytes:bytes.byteLength,contentType:type,producerFingerprint:input.producerFingerprint,createdAt:now(),readyAt:null},{session});
   });
   await store.put(key,bytes,type,hash);await store.verify(key,bytes.byteLength,hash,type);
   return inTransaction(client,async session=>{
    await parent(ownerId,input.projectId,session);
    await db.collection<Doc>('projects').updateOne({_id:input.projectId,ownerId,deletedAt:null},{$inc:{contentRevision:Long.ONE}},{session});
    const saved=await assets.findOneAndUpdate({_id:input.id,ownerId,projectId:input.projectId,sha256:hash,state:{$in:['staging','ready']}},{$set:{state:'ready',readyAt:now()}},{session,returnDocument:'after'});
    if(!saved)throw missing();return assetView.parse({id:saved._id,projectId:saved.projectId,kind:saved.kind,state:saved.state,contentType:saved.contentType,bytes:saved.bytes,createdAt:saved.createdAt.toISOString()});
   });
  },
  async list(ownerId:string,projectId:string,limit:number,after?:string){
   await assertStorageReady(db);return inTransaction(client,async session=>{await parent(ownerId,projectId,session);const rows=await assets.find({ownerId,projectId,state:{$ne:'deleted'},...(after?{_id:{$gt:after}}:{})},{session}).sort({_id:1}).limit(limit+1).toArray();const items=rows.slice(0,limit);return {data:items.map(a=>assetView.parse({id:a._id,projectId:a.projectId,kind:a.kind,state:a.state,contentType:a.contentType,bytes:a.bytes,createdAt:a.createdAt.toISOString()})),page:{hasMore:rows.length>limit,nextCursor:rows.length>limit?items.at(-1)!._id:null}};});
  },
  async access(ownerId:string,id:string,purpose:'preview'|'download',origin:string){
   await assertStorageReady(db);return inTransaction(client,async session=>{
    const a=await owned(ownerId,id,session);if(a.state!=='ready')throw new ProjectError(409,'ASSET_NOT_READY','This media is not ready.');
    if(!['video','preview','audio','thumbnail','captions'].includes(a.kind))throw missing();
    if(purpose==='preview'&&!['video','preview','audio','thumbnail'].includes(a.kind))throw new ProjectError(422,'PREVIEW_UNAVAILABLE','This asset supports download only.');
    const token=randomBytes(32).toString('base64url'),expiresAt=new Date(now().getTime()+600000);
    await grants.insertOne({_id:`grt_${randomUUID().replaceAll('-','')}`,ownerId,projectId:a.projectId,assetId:id,tokenHash:digest(token),purpose,expiresAt,revokedAt:null},{session});
    return {url:`${origin}/media/${token}`,expiresAt:expiresAt.toISOString(),contentType:a.contentType,bytes:a.bytes as number};
   });
  },
  async revoke(ownerId:string,id:string){await assertStorageReady(db);return inTransaction(client,async session=>{await owned(ownerId,id,session);await grants.updateMany({ownerId,assetId:id,revokedAt:null},{$set:{revokedAt:now()}},{session});});},
  async authorize(raw:z.infer<typeof mediaAuthRequest>){
   await assertStorageReady(db);const input=mediaAuthRequest.parse(raw);
   return inTransaction(client,async session=>{
    let grant=await grants.findOne({tokenHash:digest(input.token),revokedAt:null,expiresAt:{$gt:now()}},{session});
    if(!grant){const ingest=await db.collection<Doc>('publishMediaGrants').findOne({tokenHash:digest(input.token),expiresAt:{$gt:now()}},{session});
     if(ingest&&await db.collection('publishIntents').findOne({_id:ingest.intentId,ownerId:ingest.ownerId,projectId:ingest.projectId,assetId:ingest.assetId,assetHash:ingest.assetHash,attempt:ingest.attempt,state:{$in:['preparing','processing','submitting','outcome_unknown']}},{session}))grant=ingest;
    }
    if(!grant||!await isAdmitted(db,grant.ownerId))throw missing();
    const a=await owned(grant.ownerId,grant.assetId,session);if(a.projectId!==grant.projectId||a.state!=='ready'||grant.assetHash&&a.sha256!==grant.assetHash)throw missing();
    return {objectKey:a.objectKey as string,contentType:a.contentType as string,bytes:a.bytes as number,sha256:a.sha256 as string,disposition:`${grant.purpose==='download'?'attachment':'inline'}; filename="namastevideo-${a._id}.${kinds[a.kind as keyof typeof kinds].ext}"`};
   });
  },
 };
}
