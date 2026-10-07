import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {MongoClient} from 'mongodb';
import {MongoMemoryReplSet} from 'mongodb-memory-server';
import {setupInstagram,assertInstagramReady,instagramDefinitions} from '../src/instagram/setup';
import {instagramService} from '../src/instagram/service';
import {readInstagramConfig,encryptToken,decryptToken,type InstagramConfig} from '../src/instagram/config';
import {instagramProvider,authorizationUrl,type InstagramProvider,type Grant} from '../src/instagram/provider';
import {handleInstagram} from '../src/instagram/http';
import {setupDatabase,runMigration} from '../src/db/setup';
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
 await db.collection('publishIntents').insertOne({ownerId:'owner',state:'legacy_unknown'});const before=(await service.get('owner'))!;assert.equal(before.pendingIntentCount,1);await rejects(service.disconnect('owner',randomUUID(),{expectedRevision:before.revision,confirmPausePending:true}),'CONNECTION_RECONCILIATION_PENDING');await db.collection('publishIntents').deleteMany({});
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


const facebookConfig:InstagramConfig={...config,appId:'654321',provider:'facebook',facebookConfigId:'998877'};
const facebookGrant=(accountId:string,pageId='778899',expiresIn:number|null=null):Grant=>({token:'fixture-page-token-never-client',expiresIn,account:{id:accountId,username:'fixture_professional',type:'PROFESSIONAL'},scopes:['pages_show_list','pages_read_engagement','instagram_basic','instagram_content_publish'],provider:'facebook',tokenKind:'facebook_page',page:{id:pageId,name:'Fixture Facebook Page'}});
const facebookService=(exchange:InstagramProvider['exchange'],selectedConfig:InstagramConfig=facebookConfig,refresh:InstagramProvider['refresh']=async()=>{throw Error('Facebook tokens must not refresh');})=>instagramService(db,client,selectedConfig,{exchange,refresh});

test('Facebook requires a valid explicit Page before creating state; direct Instagram forbids Page selection',async()=>{
 const owner='fb-page-validation',fb=facebookService(async()=>facebookGrant('810001'));
 await rejects(fb.connect(owner,'s',{}),'INSTAGRAM_PAGE_REQUIRED');
 for(const pageId of ['', 'page-name','123x','123 ','1'.repeat(101)])await assert.rejects(fb.connect(owner,'s',{pageId}));
 await rejects(service.connect(owner,'s',{pageId:'778899'}),'VALIDATION_FAILED');
 assert.equal(await db.collection('oauthStates').countDocuments({ownerId:owner}),0);
 assert.equal(await db.collection('instagramConnections').countDocuments({ownerId:owner}),0);
});
test('Facebook OAuth state pins the selected Page, provider and app; changed configuration rejects before exchange',async()=>{
 let exchanges=0;const fb=facebookService(async(_code,pageId)=>{exchanges++;assert.equal(pageId,'778899');return facebookGrant('810002',pageId);});
 const owner='fb-state-binding',state=stateOf(await fb.connect(owner,'s',{pageId:'778899'}));
 const receipt=await db.collection('oauthStates').findOne({ownerId:owner});
 assert.equal(receipt?.pageId,'778899');assert.equal(receipt?.provider,'facebook');assert.equal(receipt?.providerAppId,facebookConfig.appId);
 assert.match(await fb.callback(owner,'s',state,'fixture-code',false),/outcome=connected/);assert.equal(exchanges,1);
 for(const [suffix,changedConfig] of [['app',{...facebookConfig,appId:'654322'}],['provider',{...config,appId:facebookConfig.appId}]] as const){
  const changedOwner=`fb-state-${suffix}`,changedState=stateOf(await fb.connect(changedOwner,'s',{pageId:'778899'}));
  const changed=facebookService(async()=>{exchanges++;return facebookGrant('810002');},changedConfig);
  assert.match(await changed.callback(changedOwner,'s',changedState,'fixture-code',false),/outcome=expired/);
  assert.equal(exchanges,1);assert.equal((await changed.get(changedOwner))?.account,null);
 }
});
test('Facebook persists encrypted Page metadata, removes stale expiry for no-expiry tokens and exposes safe identity',async()=>{
 const owner='fb-persistence';let expiresIn:number|null=3600;
 const fb=facebookService(async()=>facebookGrant('810003','778899',expiresIn));
 const authorize=async()=>fb.callback(owner,'s',stateOf(await fb.connect(owner,'s',{pageId:'778899'})),'fixture-code',false);
 assert.match(await authorize(),/outcome=connected/);
 const initial=(await fb.get(owner))!;assert.equal(initial.state,'expiring');assert.ok(initial.expiresAt);assert.equal(initial.account?.type,'PROFESSIONAL');
 expiresIn=null;assert.match(await authorize(),/outcome=connected/);
 const row=(await db.collection('instagramConnections').findOne({ownerId:owner}))!;
 assert.equal(row.provider,'facebook');assert.equal(row.providerAppId,facebookConfig.appId);assert.equal(row.tokenKind,'facebook_page');assert.equal(row.pageId,'778899');assert.equal(row.pageName,'Fixture Facebook Page');assert.equal(row.expiresAt,undefined);
 assert.equal(decryptToken(row.encryptedToken,facebookConfig,owner,String(row._id)),'fixture-page-token-never-client');assert.ok(!JSON.stringify(row).includes('fixture-page-token-never-client'));
 const view=(await fb.get(owner))!;assert.equal(view.state,'connected');assert.equal(view.expiresAt,null);assert.equal(view.provider,'facebook');assert.deepEqual(view.page,{id:'778899',name:'Fixture Facebook Page'});assert.equal(view.destinationEpoch,initial.destinationEpoch);
 for(const secretField of ['encryptedToken','tokenKind','providerAppId'])assert.ok(!Object.hasOwn(view,secretField));
 await db.collection('instagramConnections').updateOne({ownerId:owner},{$set:{expiresAt:new Date(0)}});assert.equal((await fb.get(owner))?.state,'reconnect_required');
});
test('Facebook and different-app direct tokens never enter the direct Instagram refresh path',async()=>{
 let refreshes=0;const refresh=async()=>{refreshes++;return {token:'unexpected-refresh',expiresIn:86400};};
 const fbOwner='fb-refresh-guard',fb=facebookService(async()=>facebookGrant('810004','778899',86400),facebookConfig,refresh);
 await fb.callback(fbOwner,'s',stateOf(await fb.connect(fbOwner,'s',{pageId:'778899'})),'code',false);
 await db.collection('instagramConnections').updateOne({ownerId:fbOwner},{$set:{tokenIssuedAt:new Date(Date.now()-2*86400000)}});
 const before=await db.collection('instagramConnections').findOne({ownerId:fbOwner});
 assert.equal(await fb.refresh(fbOwner),'skipped');
 const direct=instagramService(db,client,{...config,appId:facebookConfig.appId},{exchange:async()=>grant('810005'),refresh});
 assert.equal(await direct.refresh(fbOwner),'skipped');assert.deepEqual(await db.collection('instagramConnections').findOne({ownerId:fbOwner}),before);
 const directOwner='fb-different-app-refresh';await direct.callback(directOwner,'s',stateOf(await direct.connect(directOwner,'s',{})),'code',false);
 await db.collection('instagramConnections').updateOne({ownerId:directOwner},{$set:{expiresAt:new Date(Date.now()+86400000),tokenIssuedAt:new Date(Date.now()-2*86400000)}});
 const otherApp=instagramService(db,client,config,{exchange:async()=>grant('810005'),refresh});assert.equal(await otherApp.refresh(directOwner),'skipped');assert.equal((await otherApp.get(directOwner))?.state,'reconnect_required');assert.equal(refreshes,0);
});
test('same Facebook destination keeps epoch; changing Page, provider or app invalidates destination identity',async()=>{
 const owner='fb-destination-epochs',fb=facebookService(async(_code,pageId)=>facebookGrant('810006',pageId));
 const authorize=async(target:ReturnType<typeof instagramService>,pageId?:string)=>{assert.match(await target.callback(owner,'s',stateOf(await target.connect(owner,'s',pageId?{pageId}:{})),'code',false),/outcome=connected/);return (await target.get(owner))!.destinationEpoch;};
 const initial=await authorize(fb,'778899');assert.equal(await authorize(fb,'778899'),initial);assert.equal(await authorize(fb,'778898'),initial+1);
 const otherApp=facebookService(async(_code,pageId)=>facebookGrant('810006',pageId),{...facebookConfig,appId:'654322'});assert.equal(await authorize(otherApp,'778898'),initial+2);
 const direct=instagramService(db,client,{...config,appId:'654322'},{exchange:async()=>grant('810006'),refresh:provider.refresh});assert.equal(await authorize(direct),initial+3);
 const row=(await db.collection('instagramConnections').findOne({ownerId:owner}))!;assert.equal(row.provider,'instagram');assert.equal(row.tokenKind,'instagram_user');assert.equal(row.pageId,undefined);assert.equal(row.pageName,undefined);assert.ok(row.expiresAt instanceof Date);
});
test('disconnect fences delayed Facebook callbacks and removes Page/provider token metadata',async()=>{
 const owner='fb-disconnect-race',fb=facebookService(async()=>facebookGrant('810007'));
 await fb.callback(owner,'s',stateOf(await fb.connect(owner,'s',{pageId:'778899'})),'code',false);
 let release!:(value:Grant)=>void,started!:()=>void;const exchanging=new Promise<void>(resolve=>{started=resolve;});
 const slow=facebookService(()=>new Promise(resolve=>{release=resolve;started();}));
 const pending=slow.callback(owner,'s',stateOf(await slow.connect(owner,'s',{pageId:'778899'})),'code',false);await exchanging;
 const previous=(await fb.get(owner))!,key=randomUUID(),body={expectedRevision:previous.revision,confirmPausePending:true};const disconnected=await fb.disconnect(owner,key,body);
 release(facebookGrant('810007'));assert.match(await pending,/outcome=expired/);
 const row=(await db.collection('instagramConnections').findOne({ownerId:owner}))!;assert.equal(row.state,'disconnected');
 for(const key of ['encryptedToken','instagramUserId','provider','providerAppId','tokenKind','pageId','pageName','expiresAt','tokenIssuedAt'])assert.equal(row[key],undefined,key);
 assert.equal(row.revision,disconnected.connection.revision);assert.deepEqual(await fb.disconnect(owner,key,body),disconnected);
});
test('malformed Facebook grants cannot replace an existing authorized destination',async()=>{
 const owner='fb-invalid-grant';let selectedGrant=facebookGrant('810008');const fb=facebookService(async()=>selectedGrant);
 const authorize=()=>fb.connect(owner,'s',{pageId:'778899'}).then(value=>fb.callback(owner,'s',stateOf(value),'code',false));
 assert.match(await authorize(),/outcome=connected/);const previous=(await fb.get(owner))!;
 const mutations:Partial<Grant>[]=[{provider:'instagram'},{tokenKind:'instagram_user'},{page:undefined},{page:{id:'111111',name:'Wrong Page'}},{expiresIn:0},{expiresIn:-1},{expiresIn:Number.NaN},{expiresIn:Number.POSITIVE_INFINITY}];
 for(const mutation of mutations){selectedGrant={...facebookGrant('810008'),...mutation};assert.match(await authorize(),/outcome=provider_error/);assert.deepEqual(await fb.get(owner),previous);}
 const direct=instagramService(db,client,config,{exchange:async()=>({...grant('810008'),expiresIn:null}),refresh:provider.refresh});
 assert.match(await direct.callback(owner,'s',stateOf(await direct.connect(owner,'s',{})),'code',false),/outcome=provider_error/);assert.deepEqual(await fb.get(owner),previous);
});
test('migration 016 upgrades applied 015 without changing its checksum or existing data and rejects invalid provider metadata',async()=>{
 const legacy=client.db('instagram_migration_legacy'),checksum=createHash('sha256').update(JSON.stringify(instagramDefinitions)).digest('hex');
 await runMigration(legacy,'015-instagram','mig_instagram0000001',checksum,instagramDefinitions);
 const now=new Date(),row={_id:'igc_legacy',ownerId:'legacy-owner',revision:2,state:'connected',tokenRevision:1,destinationEpoch:1,oauthEpoch:1,scopes:['instagram_business_basic','instagram_business_content_publish'],instagramUserId:'910001',username:'legacy_fixture',accountType:'CREATOR',encryptedToken:encryptToken('legacy-fixture-token',config,'legacy-owner','igc_legacy'),expiresAt:new Date(Date.now()+86400000),tokenIssuedAt:now,createdAt:now,updatedAt:now};
 const states=legacy.collection<{_id:string;[key:string]:unknown}>('oauthStates'),connections=legacy.collection<typeof row>('instagramConnections');
 await connections.insertOne(row);await states.insertOne({_id:'oas_legacy',ownerId:'legacy-owner',stateHash:createHash('sha256').update('a'.repeat(43)).digest('hex'),initiatingSessionHash:createHash('sha256').update('legacy-session').digest('hex'),connectionId:row._id,oauthEpoch:1,state:'pending',expiresAt:new Date(Date.now()+600000),createdAt:now,updatedAt:now});
 const priorRow=await connections.findOne({_id:row._id}),priorState=await states.findOne({_id:'oas_legacy'});
 await setupInstagram(legacy);await setupInstagram(legacy);await assertInstagramReady(legacy);
 assert.deepEqual(await connections.findOne({_id:row._id}),priorRow);assert.deepEqual(await states.findOne({_id:'oas_legacy'}),priorState);
 assert.equal((await legacy.collection('schemaMigrations').findOne({migrationName:'015-instagram'}))?.checksum,checksum);assert.equal(await legacy.collection('schemaMigrations').countDocuments({state:'completed'}),2);
 for(const patch of [
  {provider:'facebook',providerAppId:'654321',tokenKind:'instagram_user',pageId:'778899',pageName:'Wrong kind'},
  {provider:'facebook',providerAppId:'654321',tokenKind:'facebook_page'},
  {provider:'instagram',providerAppId:'654321',tokenKind:'instagram_user',pageId:'778899',pageName:'Unexpected Page'},
  {provider:'facebook',providerAppId:'654321',tokenKind:'facebook_page',pageId:'not-numeric',pageName:'Invalid ID'},
  {providerAppId:'654321'},
 ])await assert.rejects(connections.updateOne({_id:row._id},{$set:patch}),error=>(error as {code?:number}).code===121);
 await assert.rejects(states.updateOne({_id:'oas_legacy'},{$set:{provider:'facebook',providerAppId:'654321'}}),error=>(error as {code?:number}).code===121);
 assert.deepEqual(await connections.findOne({_id:row._id}),priorRow);assert.equal((await instagramService(legacy,client,config,provider).get('legacy-owner'))?.state,'reconnect_required');
 const providerCallsBefore=calls;assert.match(await instagramService(legacy,client,config,provider).callback('legacy-owner','legacy-session','a'.repeat(43),'code',false),/outcome=expired/);assert.equal(calls,providerCallsBefore);
 await legacy.dropDatabase();
});
