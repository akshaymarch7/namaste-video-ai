import 'server-only';
import {timingSafeEqual} from 'node:crypto';
import type {Db, MongoClient} from 'mongodb';
import {instagramService} from './service';
import {assertInstagramReady} from './setup';
import {directInstagramLoginConfigured,type InstagramConfig} from './config';
import type {InstagramProvider} from './provider';

export const refreshEnabled=(env:Record<string,string|undefined>=process.env)=>env.INSTAGRAM_REFRESH_ENABLED==='1';

// One provider request per invocation. Existing leases fence concurrent schedulers and CLI runs.
export async function refreshOne(db:Db,client:MongoClient,config:InstagramConfig,provider:InstagramProvider){
 if(!directInstagramLoginConfigured(config))throw Error('DIRECT_INSTAGRAM_REQUIRED');
 await assertInstagramReady(db);
 const now=new Date();
 const [row]=await db.collection('instagramConnections').aggregate<{ownerId:string}>([
  {$match:{provider:'instagram',providerAppId:config.appId,tokenKind:'instagram_user',state:'connected',
   expiresAt:{$gt:now,$lt:new Date(now.getTime()+7*86400000)},tokenIssuedAt:{$lte:new Date(now.getTime()-86400000)},
   $or:[{refreshLeaseUntil:{$exists:false}},{refreshLeaseUntil:{$lte:now}}]}},
  {$sort:{expiresAt:1,_id:1}},
  {$lookup:{from:'internalAccess',let:{owner:'$ownerId'},pipeline:[{$match:{$expr:{$eq:['$provisionedUserId','$$owner']},enabled:true,provisioningState:'active'}},{$limit:1},{$project:{_id:1}}],as:'admission'}},
  {$match:{'admission.0':{$exists:true}}},{$limit:1},{$project:{_id:0,ownerId:1}},
 ],{maxTimeMS:5000}).toArray();
 return {result:row?await instagramService(db,client,config,provider).refresh(row.ownerId):'skipped'};
}

export async function handleRefreshTick(request:Request,run:()=>Promise<unknown>,env:Record<string,string|undefined>=process.env){
 const headers={'Cache-Control':'private, no-store'};
 if(!refreshEnabled(env))return new Response(null,{status:503,headers});
 const key=env.INSTAGRAM_REFRESH_SCHEDULER_SECRET??'',expected=Buffer.from(`Bearer ${key}`),actual=Buffer.from(request.headers.get('authorization')??'');
 if(key.length<32||actual.length!==expected.length||!timingSafeEqual(actual,expected))return new Response(null,{status:401,headers});
 if(request.method!=='POST'||new URL(request.url).search)return new Response(null,{status:400,headers});
 const reader=request.body?.getReader();let timer:ReturnType<typeof setTimeout>|undefined;
 try{
  if(reader){
   const empty=await Promise.race([(async()=>{for(;;){const part=await reader.read();if(part.done)return true;if(part.value.length)return false;}})(),new Promise<boolean>(resolve=>{timer=setTimeout(()=>resolve(false),1000);})]);
   if(!empty)return new Response(null,{status:400,headers});
  }
  return Response.json({data:await run()},{headers});
 }catch{return Response.json({error:{code:'INSTAGRAM_REFRESH_UNAVAILABLE'}},{status:503,headers});}
 finally{clearTimeout(timer);void reader?.cancel().catch(()=>undefined);}
}
