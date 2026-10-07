import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {MongoClient} from 'mongodb';
import {MongoMemoryReplSet} from 'mongodb-memory-server';
import {setupInstagram,assertInstagramReady} from '../src/instagram/setup';
import {instagramService} from '../src/instagram/service';
import {readInstagramConfig,encryptToken,decryptToken,type InstagramConfig} from '../src/instagram/config';
import {instagramProvider,authorizationUrl,type InstagramProvider,type Grant} from '../src/instagram/provider';
import {handleInstagram} from '../src/instagram/http';
import {setupDatabase} from '../src/db/setup';
import {setupAuth} from '../src/auth/setup';
import {createAuth} from '../src/auth/engine';
import {provisionUser} from '../src/auth/operator';
const config:InstagramConfig={appId:'123456',appSecret:'fixture-app-secret',redirectUri:'https://app.example.test/api/instagram/callback',version:'v25.0',activeKey:'k1',keys:{k1:randomBytes(32).toString('base64')}};
const grant=(account='123'):Grant=>({token:'fixture-token-never-client',expiresIn:5184000,account:{id:account,username:'fixture_creator',type:'CREATOR'},scopes:['instagram_business_basic','instagram_business_content_publish']});
let replica:MongoMemoryReplSet,client:MongoClient,db:ReturnType<MongoClient['db']>;
let calls=0,account='123',service:ReturnType<typeof instagramService>;
const provider:InstagramProvider={exchange:async()=>{calls++;return grant(account);},refresh:async()=>({token:'fixture-refreshed',expiresIn:5184000})};
const stateOf=(r:{authorizationUrl:string})=>new URL(r.authorizationUrl).searchParams.get('state')!;
const rejects=(p:Promise<unknown>,code:string)=>assert.rejects(p,(e:unknown)=>(e as {code:string}).code===code);
before(async()=>{replica=await MongoMemoryReplSet.create({binary:{version:'8.0.17'},replSet:{count:1,ip:'127.0.0.1',storageEngine:'wiredTiger'}});client=await new MongoClient(replica.getUri()).connect();db=client.db('instagram_test');await setupInstagram(db);service=instagramService(db,client,config,provider);},{timeout:180000});
after(async()=>{await client?.close();await replica?.stop();});
test('configuration is fail-closed; keys and callback origins are validated',()=>{
 const env={INSTAGRAM_APP_ID:config.appId,INSTAGRAM_APP_SECRET:config.appSecret,INSTAGRAM_REDIRECT_URI:config.redirectUri,INSTAGRAM_GRAPH_VERSION:config.version,INSTAGRAM_TOKEN_KEY_ID:'k1',INSTAGRAM_TOKEN_KEYS:JSON.stringify(config.keys),BETTER_AUTH_URL:'https://app.example.test'};
 assert.deepEqual(readInstagramConfig(env),config);assert.equal(readInstagramConfig({...env,INSTAGRAM_REDIRECT_URI:'https://evil.example/api/instagram/callback'}),null);assert.equal(readInstagramConfig({...env,INSTAGRAM_GRAPH_VERSION:'latest'}),null);assert.equal(readInstagramConfig({...env,INSTAGRAM_TOKEN_KEYS:'{}'}),null);assert.equal(readInstagramConfig({...env,INSTAGRAM_REDIRECT_URI:'http://app.example.test/api/instagram/callback'}),null);
});
test('AES-GCM uses random nonces, authenticates owner/row and supports old keys',()=>{
 const a=encryptToken('fixture',config,'owner','row'),b=encryptToken('fixture',config,'owner','row');assert.notEqual(a.nonce,b.nonce);assert.equal(decryptToken(a,config,'owner','row'),'fixture');assert.throws(()=>decryptToken(a,config,'other','row'));assert.throws(()=>decryptToken({...a,tag:b.tag},config,'owner','row'));
 assert.equal(decryptToken(a,{...config,activeKey:'k2',keys:{...config.keys,k2:randomBytes(32).toString('base64')}},'owner','row'),'fixture');
});
test('migration replays; readiness and strict validators reject missing/invalid storage',async()=>{await setupInstagram(db);await assertInstagramReady(db);await rejects(assertInstagramReady(client.db('missing_instagram')),'INSTAGRAM_SETUP_REQUIRED');await assert.rejects(db.collection('instagramConnections').insertOne({ownerId:'invalid',plaintextToken:'no'}));});
test('connection is session-bound and single-use, stores ciphertext and exposes no secret',async()=>{
 const state=stateOf(await service.connect('owner','session',{}));await rejects(service.callback('other','session',state,'code',false),'INSTAGRAM_STATE_INVALID');await rejects(service.callback('owner','other',state,'code',false),'INSTAGRAM_STATE_INVALID');
 const n=calls;assert.match(await service.callback('owner','session',state,'code',false),/outcome=connected/);await rejects(service.callback('owner','session',state,'code',false),'INSTAGRAM_STATE_INVALID');assert.equal(calls,n+1);
 const row=await db.collection('instagramConnections').findOne({ownerId:'owner'});assert.ok(row?.encryptedToken);assert.ok(!JSON.stringify(row).includes('fixture-token-never-client'));const view=await service.get('owner');assert.equal(view?.account?.id,'123');assert.equal(view?.publishingAvailable,false);assert.ok(!JSON.stringify(view).includes('encryptedToken'));assert.equal(await service.get('unrelated'),null);
});
test('cancellation and expired states cannot modify an existing destination',async()=>{
 const before=await service.get('owner'),state=stateOf(await service.connect('owner','session',{}));assert.match(await service.callback('owner','session',state,null,true),/cancelled/);assert.deepEqual(await service.get('owner'),before);
 const expired=stateOf(await service.connect('owner','session',{}));await db.collection('oauthStates').updateMany({ownerId:'owner',state:'pending'},{$set:{expiresAt:new Date(0)}});await rejects(service.callback('owner','session',expired,'code',false),'INSTAGRAM_STATE_INVALID');
});
test('a provider account cannot be attached to another workspace',async()=>{
 const state=stateOf(await service.connect('other','session',{}));assert.match(await service.callback('other','session',state,'code',false),/account_unavailable/);assert.equal((await service.get('other'))?.account,null);assert.equal((await service.get('owner'))?.account?.id,'123');
});
test('new authorization supersedes old callbacks; same account keeps destination epoch, switch increments it',async()=>{
 const old=stateOf(await service.connect('owner','session',{})),latest=stateOf(await service.connect('owner','session',{}));const before=(await service.get('owner'))!;
 assert.match(await service.callback('owner','session',old,'code',false),/expired/);assert.match(await service.callback('owner','session',latest,'code',false),/connected/);assert.equal((await service.get('owner'))!.destinationEpoch,before.destinationEpoch);
 account='456';await service.callback('owner','session',stateOf(await service.connect('owner','session',{})),'code',false);assert.equal((await service.get('owner'))!.destinationEpoch,before.destinationEpoch+1);
});
test('disconnect invalidates an in-flight callback; receipt replay cannot disconnect a later reconnection',async()=>{
 let release!:(g:Grant)=>void;const slow=instagramService(db,client,config,{...provider,exchange:()=>new Promise(r=>release=r)});
 const state=stateOf(await slow.connect('owner','session',{})),pending=slow.callback('owner','session',state,'code',false);while(!release)await new Promise(r=>setTimeout(r,5));
 const before=(await service.get('owner'))!,key=randomUUID(),body={expectedRevision:before.revision,confirmPausePending:true};const response=await service.disconnect('owner',key,body);release(grant('456'));assert.match(await pending,/expired/);assert.equal(response.connection.state,'disconnected');
 const row=await db.collection('instagramConnections').findOne({ownerId:'owner'});assert.equal(row?.encryptedToken,undefined);
 await service.callback('owner','session',stateOf(await service.connect('owner','session',{})),'code',false);assert.deepEqual(await service.disconnect('owner',key,body),response);assert.equal((await service.get('owner'))?.state,'connected');await rejects(service.disconnect('owner',key,{...body,expectedRevision:999}),'IDEMPOTENCY_KEY_REUSED');await rejects(service.disconnect('owner',randomUUID(),body),'REVISION_CONFLICT');
});
test('unconfigured connect fails; return project cannot be cross-owner; future active publishing fails closed',async()=>{
 await rejects(instagramService(db,client,null,null).connect('owner','s',{}),'INSTAGRAM_NOT_CONFIGURED');await rejects(service.connect('owner','s',{returnProjectId:'prj_abcdefghijklmnop'}),'NOT_FOUND');
 await db.collection('publishIntents').insertOne({ownerId:'owner',state:'outcome_unknown'});const before=(await service.get('owner'))!;assert.equal(before.pendingIntentCount,1);await rejects(service.disconnect('owner',randomUUID(),{expectedRevision:before.revision,confirmPausePending:true}),'CONNECTION_RECONCILIATION_PENDING');await db.collection('publishIntents').deleteMany({});
});
test('refresh is leased and fenced against disconnect and respects token age/expiry',async()=>{
 assert.equal(await service.refresh('owner'),'skipped');await db.collection('instagramConnections').updateOne({ownerId:'owner'},{$set:{expiresAt:new Date(Date.now()+86400000),tokenIssuedAt:new Date(Date.now()-2*86400000)}});
 let release!:(g:{token:string;expiresIn:number})=>void;const slow=instagramService(db,client,config,{...provider,refresh:()=>new Promise(r=>release=r)}),pending=slow.refresh('owner');while(!release)await new Promise(r=>setTimeout(r,5));assert.equal(await service.refresh('owner'),'skipped');
 await service.disconnect('owner',randomUUID(),{expectedRevision:(await service.get('owner'))!.revision,confirmPausePending:true});release({token:'late-token',expiresIn:5184000});assert.equal(await pending,'superseded');assert.equal((await db.collection('instagramConnections').findOne({ownerId:'owner'}))?.encryptedToken,undefined);
});
test('HTTP enforces auth/origin, safe redirects and no-store configuration state',async()=>{
 await setupDatabase(db);const authConfig={origin:'https://app.example.test',secure:true,secret:randomBytes(48).toString('base64url')};await setupAuth(db,client,authConfig);const auth=createAuth(db,client,authConfig);const input={name:'Fixture',email:'instagram@example.test',password:'Fixture-only-password-927!'};await provisionUser(db,client,authConfig,input);const signed=await auth.api.signInEmail({body:input,asResponse:true}),cookie=signed.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');const deps=async()=>({db,client,auth,config:authConfig}),integration={config:null,provider:null};
 const call=(method:string,action:'read'|'connect'|'callback',headers:Record<string,string>={},query='')=>handleInstagram(new Request(`https://app.example.test/api/instagram/connection${query}`,{method,headers,...(method==='POST'?{body:'{}'}:{})}),action,deps,integration);
 assert.equal((await call('GET','read')).status,401);assert.equal((await call('POST','connect',{cookie,Origin:'https://evil.example','Content-Type':'application/json'})).status,403);const read=await call('GET','read',{cookie});assert.equal(read.status,200);assert.equal(read.headers.get('X-Instagram-Configured'),'false');assert.match(read.headers.get('Cache-Control')!,/no-store/);assert.equal((await call('GET','callback',{},'?code=private-code&state=private-state')).headers.get('Location'),'/settings/instagram?outcome=sign_in_required');
});
test('successful refresh rotates encrypted token; failures require reconnection and expired tokens are never sent',async()=>{
 account='789';await service.callback('refresh-owner','s',stateOf(await service.connect('refresh-owner','s',{})),'code',false);
 const age=()=>db.collection('instagramConnections').updateOne({ownerId:'refresh-owner'},{$set:{expiresAt:new Date(Date.now()+86400000),tokenIssuedAt:new Date(Date.now()-2*86400000)}});
 await age();assert.equal(await service.refresh('refresh-owner'),'refreshed');const row=await db.collection('instagramConnections').findOne({ownerId:'refresh-owner'});assert.equal(decryptToken(row!.encryptedToken,config,'refresh-owner',String(row!._id)),'fixture-refreshed');
 await age();const failing=instagramService(db,client,config,{...provider,refresh:async()=>{throw Error('secret provider message');}});assert.equal(await failing.refresh('refresh-owner'),'reconnect_required');assert.equal((await service.get('refresh-owner'))?.state,'reconnect_required');
 await db.collection('instagramConnections').updateOne({ownerId:'refresh-owner'},{$set:{state:'connected',expiresAt:new Date(0)}});assert.equal(await service.refresh('refresh-owner'),'skipped');assert.equal((await service.get('refresh-owner'))?.state,'reconnect_required');
});
test('concurrent duplicate disconnects commit once and return identical receipts',async()=>{
 const current=(await service.get('refresh-owner'))!,key=randomUUID(),body={expectedRevision:current.revision,confirmPausePending:true};const results=await Promise.all([service.disconnect('refresh-owner',key,body),service.disconnect('refresh-owner',key,body)]);assert.deepEqual(results[0],results[1]);assert.equal((await service.get('refresh-owner'))?.revision,current.revision+1);
});
test('provider uses official hosts, required scopes and sanitized errors without retries',async()=>{
 const requests:{url:string;init:RequestInit}[]=[];const responses=[{access_token:'short-secret',permissions:grant().scopes},{access_token:'long-secret',expires_in:5184000},{user_id:'123',username:'fixture',account_type:'MEDIA_CREATOR'}];
 const p=instagramProvider(config,(async(url,init)=>{requests.push({url:String(url),init:init!});return Response.json(responses.shift());}) as typeof fetch);
 const result=await p.exchange('code');assert.equal(result.account.type,'CREATOR');assert.equal(requests.length,3);assert.match(requests[0].url,/^https:\/\/api.instagram.com\/oauth\/access_token$/);assert.equal(requests[0].init.redirect,'error');assert.equal(new Headers(requests[2].init.headers).get('Authorization'),'Bearer long-secret');assert.ok(!requests[2].url.includes('long-secret'));assert.equal(new URL(authorizationUrl(config,'state')).origin,'https://www.instagram.com');
 await rejects(instagramProvider(config,(async()=>Response.json({access_token:'secret',permissions:[]})) as typeof fetch).exchange('code'),'INSTAGRAM_PERMISSIONS_REQUIRED');
 await assert.rejects(instagramProvider(config,(async()=>new Response('secret diagnostic',{status:401})) as typeof fetch).exchange('code'),e=>e instanceof Error&&!e.message.includes('secret diagnostic'));
});
