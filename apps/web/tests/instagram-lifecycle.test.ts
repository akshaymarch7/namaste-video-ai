import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,randomBytes} from 'node:crypto';
import {MongoClient} from 'mongodb';
import {MongoMemoryReplSet} from 'mongodb-memory-server';
import {setupInstagramLifecycle,assertInstagramLifecycleReady} from '../src/instagram/lifecycle-setup';
import {verifyDeauthorization,handleDeauthorization,deauthorizeInstagram} from '../src/instagram/lifecycle';
import {setupInstagram} from '../src/instagram/setup';
import {instagramService} from '../src/instagram/service';
import type {InstagramConfig} from '../src/instagram/config';
import type {Grant} from '../src/instagram/provider';
const config:InstagramConfig={appId:'123',appSecret:'fixture-secret',redirectUri:'https://app.test/api/instagram/callback',version:'v26.0',activeKey:'k',keys:{k:randomBytes(32).toString('base64')}};
const issued=Math.floor(Date.now()/1000)-10;
const signed=(data:unknown,secret=config.appSecret)=>{const p=Buffer.from(JSON.stringify(data)).toString('base64url');return createHmac('sha256',secret).update(p).digest('base64url')+'.'+p;};
const value=()=>signed({algorithm:'HMAC-SHA256',user_id:'987',issued_at:issued});
test('signature verifies before identity parsing; rejects forged, duplicate separators, invalid algorithm and future time',()=>{
 assert.equal(verifyDeauthorization(value(),config.appSecret).userId,'987');
 for(const v of [value()+'=',value()+'.x',value().slice(1),signed({algorithm:'SHA256',user_id:'987',issued_at:issued}),signed({algorithm:'HMAC-SHA256',user_id:987,issued_at:issued}),signed({algorithm:'HMAC-SHA256',user_id:'987',issued_at:issued+1000}),signed({algorithm:'HMAC-SHA256',user_id:'987',issued_at:issued},'other')])assert.throws(()=>verifyDeauthorization(v,config.appSecret));
 // Old legitimate deliveries are accepted: the durable watermark, not a short time cutoff, handles replay.
 assert.equal(verifyDeauthorization(signed({algorithm:'HMAC-SHA256',user_id:'987',issued_at:1}),config.appSecret).issuedAt.getTime(),1000);
});
test('HTTP rejects unsupported, oversized and unsigned bodies before database work; no raw errors',async()=>{
 let calls=0;const run=async()=>{calls++;},body=new URLSearchParams({signed_request:value()}).toString();
 const req=(b=body,type='application/x-www-form-urlencoded',url='https://app.test/api/instagram/deauthorize')=>new Request(url,{method:'POST',headers:{'content-type':type},body:b});
 assert.equal((await handleDeauthorization(req(),config,run,false)).status,503);
 assert.equal((await handleDeauthorization(req(),null,run,true)).status,503);
 assert.equal((await handleDeauthorization(req(body,'application/json'),config,run,true)).status,415);
 assert.equal((await handleDeauthorization(req('x'.repeat(20001)),config,run,true)).status,413);
 for(const b of ['',body+'&signed_request=x',body+'&extra=1','signed_request=bad'])assert.equal((await handleDeauthorization(req(b),config,run,true)).status,400);
 assert.equal((await handleDeauthorization(req(body,undefined,'https://app.test/api/instagram/deauthorize?x=1'),config,run,true)).status,400);
 assert.equal(calls,0);const response=await handleDeauthorization(req(),config,run,true);assert.equal(response.status,200);assert.equal(calls,1);assert.match(response.headers.get('cache-control')!,/no-store/);assert.deepEqual(await response.json(),{success:true});
 const failed=await handleDeauthorization(req(),config,async()=>{throw Error('private token');},true);assert.equal(failed.status,503);assert.ok(!(await failed.text()).includes('private token'));
});
test('stalled body is cancelled without invoking database work',async()=>{
 let cancelled=false;const request=new Request('https://app.test/api/instagram/deauthorize',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new ReadableStream({cancel(){cancelled=true;}}),duplex:'half'} as RequestInit);
 assert.equal((await handleDeauthorization(request,config,async()=>assert.fail(),true)).status,400);assert.equal(cancelled,true);
});
let replica:MongoMemoryReplSet,client:MongoClient,db:ReturnType<MongoClient['db']>;
before(async()=>{replica=await MongoMemoryReplSet.create({binary:{version:'8.0.17'},replSet:{count:1,ip:'127.0.0.1'}});client=await new MongoClient(replica.getUri()).connect();db=client.db('lifecycle');await setupInstagram(db);await setupInstagramLifecycle(db);process.env.INSTAGRAM_LIFECYCLE_ENABLED='1';},{timeout:180000});
after(async()=>{delete process.env.INSTAGRAM_LIFECYCLE_ENABLED;await client?.close();await replica?.stop();});
const grant=(id:string):Grant=>({oauthUserId:id,token:'fixture-token',expiresIn:5184000,account:{id,username:'fixture',type:'CREATOR'},scopes:['instagram_business_basic','instagram_business_content_publish']});
const event=(userId:string,time=issued)=>({userId,issuedAt:new Date(time*1000)});
const state=(r:{authorizationUrl:string})=>new URL(r.authorizationUrl).searchParams.get('state')!;
test('migration replay and readiness enforce strict minimal watermark schema',async()=>{
 await setupInstagramLifecycle(db);await assertInstagramLifecycleReady(db);await assert.rejects(assertInstagramLifecycleReady(client.db('absent')));await assert.rejects(db.collection('instagramLifecycle').insertOne({userId:'private'}));
});
test('revocation is app scoped, replay safe, strips credentials and allows a genuinely newer authorization',async()=>{
 const svc=instagramService(db,client,config,{exchange:async()=>grant('111'),refresh:async()=>({token:'x',expiresIn:86400})});
 await svc.callback('owner','session',state(await svc.connect('owner','session',{})),'code',false);
 // Event after authorization start, in same second, is conservatively a revocation.
 const now=Math.floor(Date.now()/1000);await deauthorizeInstagram(db,client,config,event('111',now));
 const row=await db.collection('instagramConnections').findOne({ownerId:'owner'});assert.equal(row?.state,'reconnect_required');assert.equal(row?.encryptedToken,undefined);
 await Promise.all([deauthorizeInstagram(db,client,config,event('111',now)),deauthorizeInstagram(db,client,config,event('111',now-1))]);assert.equal((await svc.get('owner'))?.revision,row?.revision);
 // Test time fixtures: a consent started strictly after the event is not invalidated by late delivery.
 await db.collection('instagramLifecycle').updateMany({},{$set:{authorizedAt:new Date((now+10)*1000)}});
 await deauthorizeInstagram(db,client,config,event('111',now+1));assert.equal((await svc.get('owner'))?.revision,row?.revision);
 const before=await db.collection('instagramConnections').findOne({ownerId:'owner'});await deauthorizeInstagram(db,client,{...config,appId:'999'},event('111',now+20));assert.deepEqual(await db.collection('instagramConnections').findOne({ownerId:'owner'}),before);
});
test('revocation arriving during first OAuth exchange prevents resurrection without a preexisting account mapping',async()=>{
 let release!:(g:Grant)=>void;const svc=instagramService(db,client,config,{exchange:()=>new Promise(r=>release=r),refresh:async()=>({token:'x',expiresIn:86400})});
 const pending=svc.callback('new-owner','session',state(await svc.connect('new-owner','session',{})),'code',false);while(!release)await new Promise(r=>setTimeout(r,5));
 await deauthorizeInstagram(db,client,config,event('222',Math.floor(Date.now()/1000)));release(grant('222'));assert.match(await pending,/expired/);assert.equal((await svc.get('new-owner'))?.state,'disconnected');
});
test('app-scoped callback ID maps to profile identity rather than assuming both IDs match',async()=>{
 const svc=instagramService(db,client,config,{exchange:async()=>({...grant('333'),oauthUserId:'444'}),refresh:async()=>({token:'x',expiresIn:86400})});
 await svc.callback('mapped-owner','session',state(await svc.connect('mapped-owner','session',{})),'code',false);
 await deauthorizeInstagram(db,client,config,event('333',Math.floor(Date.now()/1000)));assert.equal((await svc.get('mapped-owner'))?.state,'connected');
 await deauthorizeInstagram(db,client,config,event('444',Math.floor(Date.now()/1000)));assert.equal((await svc.get('mapped-owner'))?.state,'reconnect_required');
});
test('a new consent after revocation reconnects; replay cannot remove its new token',async()=>{
 const svc=instagramService(db,client,config,{exchange:async()=>grant('555'),refresh:async()=>({token:'x',expiresIn:86400})});
 const old=event('555',issued);await deauthorizeInstagram(db,client,config,old);
 assert.match(await svc.callback('reauth-owner','session',state(await svc.connect('reauth-owner','session',{})),'code',false),/connected/);
 const before=await db.collection('instagramConnections').findOne({ownerId:'reauth-owner'});await deauthorizeInstagram(db,client,config,old);assert.deepEqual(await db.collection('instagramConnections').findOne({ownerId:'reauth-owner'}),before);
});
test('enabled lifecycle rejects missing migration or app-scoped grant identity',async()=>{
 const provider={exchange:async()=>grant('777'),refresh:async()=>({token:'x',expiresIn:86400})};
 await assert.rejects(instagramService(client.db('no_lifecycle'),client,config,provider).connect('owner','session',{}),e=>(e as {code:string}).code==='INSTAGRAM_LIFECYCLE_SETUP_REQUIRED');
 const svc=instagramService(db,client,config,{...provider,exchange:async()=>{const {oauthUserId,...rest}=grant('777');return rest;}});
 assert.match(await svc.callback('missing-subject','session',state(await svc.connect('missing-subject','session',{})),'code',false),/provider_error/);
 assert.equal((await svc.get('missing-subject'))?.state,'disconnected');
});
