import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleRefreshTick} from '../src/instagram/refresh';
import {instagramProvider} from '../src/instagram/provider';
import {ProjectError} from '../src/projects/contracts';
const key='fixture-maintenance-key-'.repeat(2),env={INSTAGRAM_REFRESH_ENABLED:'1',INSTAGRAM_REFRESH_SCHEDULER_SECRET:key};
const req=(options:RequestInit={},query='')=>new Request(`https://app.example.test/api/internal/instagram-refresh${query}`,{method:'POST',headers:{Authorization:`Bearer ${key}`},...options});
test('maintenance endpoint fails closed before touching dependencies and rejects unexpected payloads',async()=>{
 let calls=0;const run=async()=>{calls++;return {result:'skipped'};};
 assert.equal((await handleRefreshTick(req(),run,{})).status,503);assert.equal((await handleRefreshTick(req(),run,{...env,INSTAGRAM_REFRESH_ENABLED:'true'})).status,503);
 assert.equal((await handleRefreshTick(req({headers:{Authorization:'Bearer wrong'}}),run,env)).status,401);assert.equal((await handleRefreshTick(req(),run,{...env,INSTAGRAM_REFRESH_SCHEDULER_SECRET:'short'})).status,401);
 for(const r of [req({},'?owner=foreign'),req({body:'{}'}),req({method:'GET'})])assert.equal((await handleRefreshTick(r,run,env)).status,400);
 assert.equal(calls,0);const ok=await handleRefreshTick(req(),run,env);assert.equal(ok.status,200);assert.equal(ok.headers.get('cache-control'),'private, no-store');assert.deepEqual(await ok.json(),{data:{result:'skipped'}});assert.equal(calls,1);
 const failed=await handleRefreshTick(req(),async()=>{throw Error('private-secret');},env);assert.equal(failed.status,503);assert.ok(!(await failed.text()).includes('private-secret'));
});
test('maintenance endpoint bounds stalled body reads',async()=>{
 let cancelled=false,calls=0;const request=req({body:new ReadableStream({cancel(){cancelled=true;}}),duplex:'half'} as RequestInit);
 const start=Date.now(),result=await handleRefreshTick(request,async()=>{calls++;},env);assert.equal(result.status,400);assert.equal(calls,0);assert.ok(Date.now()-start<5000);assert.equal(cancelled,true);
});
test('provider distinguishes definitive auth rejection from transient and non-auth errors',async()=>{
 const config={appId:'123456',appSecret:'fixture-secret',redirectUri:'https://app.example.test/api/instagram/callback',version:'v26.0',activeKey:'unused',keys:{}};
 for(const [status,body,code] of [[400,{error:{code:190,message:'private-token'}},'INSTAGRAM_AUTH_REJECTED'],[400,{error:{code:100}},'INSTAGRAM_UNAVAILABLE'],[401,{},'INSTAGRAM_AUTH_REJECTED'],[429,{},'INSTAGRAM_UNAVAILABLE'],[503,{},'INSTAGRAM_UNAVAILABLE']] as const){
  let calls=0;const p=instagramProvider(config,(async()=>{calls++;return Response.json(body,{status});}) as typeof fetch);
  await assert.rejects(p.refresh('private-token'),(e:unknown)=>e instanceof ProjectError&&e.code===code&&!e.message.includes('private-token'));assert.equal(calls,1);
 }
});
