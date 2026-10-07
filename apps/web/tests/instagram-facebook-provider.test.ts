import assert from 'node:assert/strict';
import {test} from 'node:test';
import {authorizationUrl,instagramProvider} from '../src/instagram/provider';
import {readInstagramConfig,type InstagramConfig} from '../src/instagram/config';
import {facebookInstagramScopes} from '../src/instagram/facebook-provider';

const config:InstagramConfig={provider:'facebook',facebookConfigId:'789',appId:'123456',appSecret:'fixture-app-secret',redirectUri:'https://app.example.test/api/instagram/callback',version:'v26.0',activeKey:'unused',keys:{}};
const pageId='111',igId='222';
const permissions={data:facebookInstagramScopes.map(permission=>({permission,status:'granted'}))};
const page={id:pageId,name:'Fixture Page',access_token:'fixture-page-token',instagram_business_account:{id:igId}};
const debug={data:{app_id:config.appId,type:'PAGE',is_valid:true,expires_at:0,data_access_expires_at:0,profile_id:pageId,scopes:[...facebookInstagramScopes]}};
const profile={id:igId,username:'fixture_creator'};
function responses(){return [{access_token:'fixture-short-token',expires_in:3600},{access_token:'fixture-long-token',expires_in:5184000},permissions,page,debug,profile];}
function fixture(queue:unknown[]=responses()){
 const requests:{url:URL;init:RequestInit}[]=[];
 const provider=instagramProvider(config,(async(url,init)=>{
  requests.push({url:new URL(String(url)),init:init!});
  assert.ok(queue.length,'unexpected provider call');
  return Response.json(queue.shift());
 }) as typeof fetch);
 return {provider,requests};
}
const rejects=(pending:Promise<unknown>,code:string)=>assert.rejects(pending,(error:unknown)=>{
 assert.equal((error as {code:string}).code,code);
 for(const secret of ['fixture-app-secret','fixture-short-token','fixture-long-token','fixture-page-token','fixture-code','fixture_creator'])assert.ok(!String(error).includes(secret));
 return true;
});

test('Facebook configuration is explicit; legacy direct Instagram config remains compatible',()=>{
 const env={INSTAGRAM_APP_ID:config.appId,INSTAGRAM_APP_SECRET:config.appSecret,INSTAGRAM_REDIRECT_URI:config.redirectUri,INSTAGRAM_GRAPH_VERSION:config.version,INSTAGRAM_TOKEN_KEY_ID:'k1',INSTAGRAM_TOKEN_KEYS:JSON.stringify({k1:Buffer.alloc(32,1).toString('base64')}),BETTER_AUTH_URL:'https://app.example.test'};
 assert.equal(readInstagramConfig(env)?.provider,undefined);
 assert.equal(readInstagramConfig({...env,INSTAGRAM_LOGIN_PROVIDER:'instagram'})?.provider,undefined);
 assert.deepEqual(readInstagramConfig({...env,INSTAGRAM_LOGIN_PROVIDER:'facebook',INSTAGRAM_FACEBOOK_CONFIG_ID:'789'}),{...readInstagramConfig(env),provider:'facebook',facebookConfigId:'789'});
 for(const value of ['', 'facebook ', 'Facebook', 'unknown'])assert.equal(readInstagramConfig({...env,INSTAGRAM_LOGIN_PROVIDER:value}),null);
 for(const value of [undefined,'','bad-id','https://facebook.com/123','1'.repeat(101)])assert.equal(readInstagramConfig({...env,INSTAGRAM_LOGIN_PROVIDER:'facebook',INSTAGRAM_FACEBOOK_CONFIG_ID:value}),null);
 assert.equal(readInstagramConfig({...env,INSTAGRAM_LOGIN_PROVIDER:'facebook',INSTAGRAM_FACEBOOK_CONFIG_ID:'789',INSTAGRAM_REDIRECT_URI:'https://evil.example/api/instagram/callback'}),null);
});

test('Facebook Login for Business uses config_id and authorization-code flow without extra scopes',()=>{
 const url=new URL(authorizationUrl(config,'fixture-state'));
 assert.equal(url.origin,'https://www.facebook.com');assert.equal(url.pathname,'/v26.0/dialog/oauth');
 assert.deepEqual(Object.fromEntries(url.searchParams),{client_id:config.appId,config_id:'789',redirect_uri:config.redirectUri,response_type:'code',override_default_response_type:'true',state:'fixture-state'});
 assert.equal(url.searchParams.has('scope'),false);
});

test('known-Page authorization returns only the verified Page token and linked professional profile',async()=>{
 const {provider,requests}=fixture();
 assert.deepEqual(await provider.exchange('fixture-code',pageId),{token:page.access_token,expiresIn:null,account:{id:igId,username:profile.username,type:'PROFESSIONAL'},scopes:[...facebookInstagramScopes],provider:'facebook',tokenKind:'facebook_page',page:{id:pageId,name:page.name}});
 assert.equal(requests.length,6);
 assert.equal(requests[0].url.pathname,'/v26.0/oauth/access_token');
 assert.deepEqual(Object.fromEntries(requests[0].url.searchParams),{client_id:config.appId,client_secret:config.appSecret,redirect_uri:config.redirectUri,code:'fixture-code'});
 assert.deepEqual(Object.fromEntries(requests[1].url.searchParams),{grant_type:'fb_exchange_token',client_id:config.appId,client_secret:config.appSecret,fb_exchange_token:'fixture-short-token'});
 assert.equal(requests[2].url.pathname,'/v26.0/me/permissions');
 assert.equal(requests[3].url.pathname,`/v26.0/${pageId}`);
 assert.equal(requests[3].url.searchParams.get('fields'),'id,name,access_token,instagram_business_account');
 assert.equal(requests[4].url.pathname,'/v26.0/debug_token');
 assert.deepEqual(Object.fromEntries(requests[4].url.searchParams),{input_token:page.access_token});
 assert.equal(new Headers(requests[4].init.headers).get('Authorization'),`Bearer ${config.appId}|${config.appSecret}`);
 assert.equal(requests[5].url.pathname,`/v26.0/${igId}`);
 assert.equal(requests[5].url.searchParams.get('fields'),'id,username');
 assert.equal(new Headers(requests[5].init.headers).get('Authorization'),`Bearer ${page.access_token}`);
 for(const index of [2,3])assert.equal(new Headers(requests[index].init.headers).get('Authorization'),'Bearer fixture-long-token');
 for(const {url,init} of requests){assert.equal(url.origin,'https://graph.facebook.com');assert.equal(init.method,'GET');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');assert.ok(init.signal);assert.equal(url.searchParams.has('access_token'),false);assert.ok(!url.pathname.includes('accounts'));}
});

test('explicit numeric Page choice is required before any provider request',async()=>{
 for(const chosen of [undefined,'','11/22','-1','https://evil.example','1'.repeat(101)]){
  const {provider,requests}=fixture();await rejects(provider.exchange('fixture-code',chosen),'INSTAGRAM_PAGE_REQUIRED');assert.equal(requests.length,0);
 }
});

test('missing, declined and expired grants stop before Page lookup',async()=>{
 for(const scope of facebookInstagramScopes)for(const status of ['missing','declined','expired']){
  const body={data:permissions.data.filter(row=>status!=='missing'||row.permission!==scope).map(row=>row.permission===scope?{...row,status}:row)};
  const {provider,requests}=fixture([...responses().slice(0,2),body]);
  await rejects(provider.exchange('fixture-code',pageId),'INSTAGRAM_PERMISSIONS_REQUIRED');assert.equal(requests.length,3);
 }
});

test('permission pagination uses a bounded fixed endpoint and rejects duplicate or cycling results',async()=>{
 const first={data:permissions.data.slice(0,2),paging:{next:'https://evil.example/leak',cursors:{after:'fixture-cursor'}}};
 const second={data:permissions.data.slice(2)};
 const {provider,requests}=fixture([...responses().slice(0,2),first,second,...responses().slice(3)]);
 await provider.exchange('fixture-code',pageId);assert.equal(requests.length,7);
 assert.equal(requests[3].url.origin,'https://graph.facebook.com');assert.equal(requests[3].url.pathname,'/v26.0/me/permissions');assert.equal(requests[3].url.searchParams.get('after'),'fixture-cursor');
 for(const body of [{data:[permissions.data[0],permissions.data[0]]},{data:[],paging:{next:'https://evil.example'}},{data:[],paging:{next:'https://evil.example',cursors:{after:''}}}]){
  const current=fixture([...responses().slice(0,2),body]);await rejects(current.provider.exchange('fixture-code',pageId),'INSTAGRAM_RESPONSE_INVALID');assert.equal(current.requests.length,3);
 }
 const cycle=fixture([...responses().slice(0,2),{...first,data:[]},{...first,data:[]}]);await rejects(cycle.provider.exchange('fixture-code',pageId),'INSTAGRAM_RESPONSE_INVALID');assert.equal(cycle.requests.length,4);
 const endless=fixture([...responses().slice(0,2),...Array.from({length:5},(_,i)=>({data:[],paging:{next:'https://evil.example',cursors:{after:`cursor-${i}`}}}))]);await rejects(endless.provider.exchange('fixture-code',pageId),'INSTAGRAM_RESPONSE_INVALID');assert.equal(endless.requests.length,7);
});

test('wrong, inaccessible and unlinked Pages cannot create a connection',async()=>{
 for(const body of [{...page,id:'999'},{...page,access_token:undefined},{...page,instagram_business_account:undefined},{...page,instagram_business_account:null}]){
  const {provider,requests}=fixture([...responses().slice(0,3),body]);await rejects(provider.exchange('fixture-code',pageId),'INSTAGRAM_PAGE_UNAVAILABLE');assert.equal(requests.length,4);
 }
 const {provider,requests}=fixture([...responses().slice(0,5),{...profile,id:'999'}]);await rejects(provider.exchange('fixture-code',pageId),'INSTAGRAM_RESPONSE_INVALID');assert.equal(requests.length,6);
});

test('Page introspection verifies the app, token kind, validity and optional Page identity',async()=>{
 for(const changes of [{app_id:'999'},{type:'USER'},{type:'page'},{is_valid:false},{profile_id:'999'}]){
  const {provider,requests}=fixture([...responses().slice(0,4),{data:{...debug.data,...changes}}]);await rejects(provider.exchange('fixture-code',pageId),'INSTAGRAM_AUTH_REJECTED');assert.equal(requests.length,5);
 }
});

test('Page-token permissions are independently verified without requiring Page-list access',async()=>{
 const relevant=['pages_read_engagement','instagram_basic','instagram_content_publish'];
 const accepted=fixture([...responses().slice(0,4),{data:{...debug.data,scopes:relevant}},profile]);
 assert.equal((await accepted.provider.exchange('fixture-code',pageId)).tokenKind,'facebook_page');
 for(const scope of relevant){
  const {provider,requests}=fixture([...responses().slice(0,4),{data:{...debug.data,scopes:relevant.filter(value=>value!==scope)}}]);
  await rejects(provider.exchange('fixture-code',pageId),'INSTAGRAM_PERMISSIONS_REQUIRED');assert.equal(requests.length,5);
 }
 const absent=fixture([...responses().slice(0,4),{data:{...debug.data,scopes:undefined}}]);await rejects(absent.provider.exchange('fixture-code',pageId),'INSTAGRAM_RESPONSE_INVALID');
});

test('Page expiry uses the earliest known positive bound, preserves zero/zero and rejects expired or unknown values',async()=>{
 const now=Math.floor(Date.now()/1000);
 for(const [expiresAt,dataExpiresAt,expected] of [[0,0,null],[now+3600,0,3600],[0,now+3600,3600],[now+7200,now+3600,3600]] as const){
  const {provider}=fixture([...responses().slice(0,4),{data:{...debug.data,expires_at:expiresAt,data_access_expires_at:dataExpiresAt}},profile]);
  const result=await provider.exchange('fixture-code',pageId);
  if(expected===null)assert.equal(result.expiresIn,null);else assert.ok(result.expiresIn!==null&&result.expiresIn<=expected&&result.expiresIn>=expected-2);
 }
 for(const changes of [{expires_at:now-1},{data_access_expires_at:now-1}]){
  const {provider}=fixture([...responses().slice(0,4),{data:{...debug.data,...changes}}]);await rejects(provider.exchange('fixture-code',pageId),'INSTAGRAM_AUTH_REJECTED');
 }
 for(const changes of [{expires_at:undefined},{data_access_expires_at:undefined},{expires_at:-1},{expires_at:'0'},{data_access_expires_at:0.5}]){
  const {provider}=fixture([...responses().slice(0,4),{data:{...debug.data,...changes}}]);await rejects(provider.exchange('fixture-code',pageId),'INSTAGRAM_RESPONSE_INVALID');
 }
});

test('Facebook Page refresh requires reconnection and never calls Instagram refresh',async()=>{
 const {provider,requests}=fixture();await rejects(provider.refresh(page.access_token),'INSTAGRAM_RECONNECT_REQUIRED');assert.equal(requests.length,0);
});

test('authorization that expires while loading the linked profile is not returned as usable',async(context)=>{
 let now=Date.now();context.mock.method(Date,'now',()=>now);
 const queue:unknown[]=[...responses().slice(0,4),{data:{...debug.data,expires_at:Math.floor(now/1000)+5}},profile];let calls=0;
 const provider=instagramProvider(config,(async()=>{if(++calls===6)now+=10000;return Response.json(queue.shift());}) as typeof fetch);
 await rejects(provider.exchange('fixture-code',pageId),'INSTAGRAM_AUTH_REJECTED');assert.equal(calls,6);
});

test('provider failures and malformed payloads never expose codes, credentials or raw response data',async()=>{
 for(const status of [400,401,403,429,503]){
  let calls=0;const provider=instagramProvider(config,(async()=>{calls++;return new Response('fixture-app-secret fixture-code',{status});}) as typeof fetch);
  await rejects(provider.exchange('fixture-code',pageId),status===401||status===403?'INSTAGRAM_AUTH_REJECTED':'INSTAGRAM_UNAVAILABLE');assert.equal(calls,1);
 }
 for(const body of [null,{}, {access_token:'fixture-short-token',expires_in:-1}]){const {provider}=fixture([body]);await rejects(provider.exchange('fixture-code',pageId),'INSTAGRAM_RESPONSE_INVALID');}
 const thrown=instagramProvider(config,(async(url)=>{throw new Error(`request failed ${url}`);}) as typeof fetch);await rejects(thrown.exchange('fixture-code',pageId),'INSTAGRAM_UNAVAILABLE');
 const malformed=instagramProvider(config,(async()=>new Response('fixture-app-secret')) as typeof fetch);await rejects(malformed.exchange('fixture-code',pageId),'INSTAGRAM_RESPONSE_INVALID');
 const oversized=instagramProvider(config,(async()=>new Response('x'.repeat(65537))) as typeof fetch);await rejects(oversized.exchange('fixture-code',pageId),'INSTAGRAM_RESPONSE_INVALID');
});

test('Graph error codes classify expired authorization and permission failures without raw diagnostics',async()=>{
 for(const [graphCode,errorCode] of [[190,'INSTAGRAM_AUTH_REJECTED'],[10,'INSTAGRAM_PERMISSIONS_REQUIRED'],[200,'INSTAGRAM_PERMISSIONS_REQUIRED'],[100,'INSTAGRAM_UNAVAILABLE']] as const){
  for(const status of [400,200]){
   let calls=0;const provider=instagramProvider(config,(async()=>{calls++;return Response.json({error:{code:graphCode,message:'fixture-app-secret fixture-code fixture-page-token'}},{status});}) as typeof fetch);
   await rejects(provider.exchange('fixture-code',pageId),errorCode);assert.equal(calls,1);
  }
 }
});
