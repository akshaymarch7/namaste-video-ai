import assert from 'node:assert/strict';
import {test} from 'node:test';
import {authorizationUrl,instagramProvider} from '../src/instagram/provider';
import type {InstagramConfig} from '../src/instagram/config';
import {scopes} from '../src/instagram/contracts';

const config:InstagramConfig={appId:'123456',appSecret:'fixture-app-secret',redirectUri:'https://app.example.test/api/instagram/callback',version:'v26.0',activeKey:'unused',keys:{}};
const short={access_token:'fixture-short-token',user_id:'123',permissions:scopes.join(',')};
const long={access_token:'fixture-long-token',expires_in:5184000,token_type:'bearer'};
const account={user_id:'123',username:'fixture_creator',account_type:'Media_Creator'};
const envelope=(value:unknown)=>({data:[value]});
function fixture(responses:unknown[]){
 const requests:{url:string;init:RequestInit}[]=[];
 const provider=instagramProvider(config,(async(url,init)=>{
  requests.push({url:String(url),init:init!});
  assert.ok(responses.length,'unexpected provider call');
  return Response.json(responses.shift());
 }) as typeof fetch);
 return {provider,requests};
}
const rejects=(pending:Promise<unknown>,code:string)=>assert.rejects(pending,(error:unknown)=>{
 assert.equal((error as {code:string}).code,code);
 assert.ok(!String(error).includes('fixture-short-token'));
 assert.ok(!String(error).includes('fixture_creator'));
 return true;
});

test('authorization uses documented reauthentication parameter and exact redirect/scopes/state',()=>{
 const url=new URL(authorizationUrl(config,'fixture-state'));
 assert.equal(url.origin,'https://www.instagram.com');
 assert.equal(url.pathname,'/oauth/authorize');
 assert.deepEqual(Object.fromEntries(url.searchParams),{client_id:config.appId,redirect_uri:config.redirectUri,response_type:'code',scope:scopes.join(','),state:'fixture-state',enable_fb_login:'false',force_reauth:'false'});
 assert.equal(url.searchParams.has('force_authentication'),false);
});

for(const shortWrapped of [false,true])for(const accountWrapped of [false,true]){
 test(`exchange accepts ${shortWrapped?'documented enveloped':'flat'} token and ${accountWrapped?'documented enveloped':'flat'} account`,async()=>{
  const {provider,requests}=fixture([shortWrapped?envelope(short):short,long,accountWrapped?envelope(account):account]);
  assert.deepEqual(await provider.exchange('fixture-code'),{oauthUserId:'123',token:long.access_token,expiresIn:long.expires_in,account:{id:'123',username:account.username,type:'CREATOR'},scopes:[...scopes],provider:'instagram',tokenKind:'instagram_user'});
  assert.equal(requests.length,3);
  assert.equal(requests[0].url,'https://api.instagram.com/oauth/access_token');
  assert.equal(requests[0].init.method,'POST');
  assert.deepEqual(Object.fromEntries(requests[0].init.body as URLSearchParams),{client_id:config.appId,client_secret:config.appSecret,grant_type:'authorization_code',redirect_uri:config.redirectUri,code:'fixture-code'});
  const exchange=new URL(requests[1].url);
  assert.equal(exchange.origin,'https://graph.instagram.com');
  assert.equal(exchange.pathname,'/access_token');
  assert.equal(exchange.searchParams.get('access_token'),short.access_token);
  const profile=new URL(requests[2].url);
  assert.equal(profile.pathname,'/v26.0/me');
  assert.equal(profile.searchParams.get('fields'),'user_id,username,account_type');
  assert.equal(new Headers(requests[2].init.headers).get('Authorization'),`Bearer ${long.access_token}`);
  assert.equal(profile.searchParams.has('access_token'),false);
  for(const {init} of requests){assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');assert.ok(init.signal);}
 });
}

test('documented and previous account-type spellings map explicitly; unsupported variants fail closed',async()=>{
 for(const [accountType,expected] of [['Business','BUSINESS'],['Media_Creator','CREATOR'],['BUSINESS','BUSINESS'],['MEDIA_CREATOR','CREATOR'],['CREATOR','CREATOR']] as const){
  const {provider}=fixture([short,long,envelope({...account,account_type:accountType})]);
  assert.equal((await provider.exchange('fixture-code')).account.type,expected);
 }
 for(const accountType of ['PERSONAL','personal','business','media_creator','Media_creator','Business ','toString']){
  const {provider,requests}=fixture([short,long,envelope({...account,account_type:accountType})]);
  await rejects(provider.exchange('fixture-code'),'INSTAGRAM_PROFESSIONAL_REQUIRED');
  assert.equal(requests.length,3);
 }
});

test('enveloped tokens still require both publishing and profile permissions',async()=>{
 for(const permissions of [scopes.join(', '),[...scopes]]){
  const {provider}=fixture([envelope({...short,permissions}),long,account]);
  assert.deepEqual((await provider.exchange('fixture-code')).scopes,[...scopes]);
 }
 for(const permissions of ['',[],['instagram_business_basic'],'instagram_business_content_publish','business_basic,business_content_publish']){
  const {provider,requests}=fixture([envelope({...short,permissions})]);
  await rejects(provider.exchange('fixture-code'),'INSTAGRAM_PERMISSIONS_REQUIRED');
  assert.equal(requests.length,1,'must not exchange a token lacking the required grant');
 }
});

test('short-token envelopes reject missing, malformed, mixed and multiple results before another call',async()=>{
 const invalid=[null,[],[short],{},envelope(null),envelope({access_token:short.access_token}),envelope({...short,access_token:''}),envelope({...short,permissions:42}),{data:[]},{data:[short,short]},{data:short},{data:{0:short,length:1}},{data:[envelope(short)]},{...short,data:[short]},{...short,data:null}];
 for(const body of invalid){
  const {provider,requests}=fixture([body]);
  await rejects(provider.exchange('fixture-code'),'INSTAGRAM_RESPONSE_INVALID');
  assert.equal(requests.length,1);
 }
});

test('profile envelopes reject missing, malformed, mixed and multiple accounts without selecting one',async()=>{
 const invalid=[null,[],[account],{},envelope(null),envelope({user_id:'123',username:account.username}),envelope({...account,user_id:123}),envelope({...account,user_id:'not-an-id'}),envelope({...account,username:''}),envelope({...account,account_type:null}),{data:[]},{data:[account,{...account,user_id:'456'}]},{data:account},{data:[envelope(account)]},{...account,data:[account]},{...account,data:null}];
 for(const body of invalid){
  const {provider,requests}=fixture([short,long,body]);
  await rejects(provider.exchange('fixture-code'),'INSTAGRAM_RESPONSE_INVALID');
  assert.equal(requests.length,3);
 }
});

test('long-lived refresh retains the documented flat token contract',async()=>{
 const {provider,requests}=fixture([long]);
 assert.deepEqual(await provider.refresh('fixture-existing-token'),{token:long.access_token,expiresIn:long.expires_in});
 const url=new URL(requests[0].url);
 assert.equal(url.origin,'https://graph.instagram.com');
 assert.equal(url.pathname,'/refresh_access_token');
 assert.equal(url.searchParams.get('grant_type'),'ig_refresh_token');
 assert.equal(url.searchParams.get('access_token'),'fixture-existing-token');
 assert.equal(requests.length,1);
});


test('invalid long-lived token and refresh responses are sanitized without another provider call',async()=>{
 for(const malformed of [{...long,expires_in:0},{...long,expires_in:'5184000'},{...long,access_token:42},{data:[long]},null]){
  const exchange=fixture([short,malformed]);await rejects(exchange.provider.exchange('fixture-code'),'INSTAGRAM_RESPONSE_INVALID');assert.equal(exchange.requests.length,2);
  const refresh=fixture([malformed]);await rejects(refresh.provider.refresh('fixture-existing-token'),'INSTAGRAM_RESPONSE_INVALID');assert.equal(refresh.requests.length,1);
 }
});

test('exchange preserves app-scoped OAuth subject independently of the profile publishing ID',async()=>{
 const {provider}=fixture([{...short,user_id:'456'},long,account]);const result=await provider.exchange('code');assert.equal(result.oauthUserId,'456');assert.equal(result.account.id,'123');
});
