import 'server-only';
import {z} from 'zod';
import {ProjectError} from '../projects/contracts';
import {scopes} from './contracts';
import type {InstagramConfig} from './config';
import {facebookAuthorizationUrl,facebookInstagramProvider} from './facebook-provider';
export type Grant={token:string;expiresIn:number|null;account:{id:string;username:string;type:'BUSINESS'|'CREATOR'|'PROFESSIONAL'};scopes:string[];provider?:'instagram'|'facebook';tokenKind?:'instagram_user'|'facebook_page';page?:{id:string;name:string}};
export type InstagramProvider={exchange(code:string,pageId?:string):Promise<Grant>;refresh(token:string):Promise<{token:string;expiresIn:number}>};
const tokenSchema=z.object({access_token:z.string().min(1).max(8192),expires_in:z.number().int().positive().max(366*86400)});
const shortTokenSchema=z.object({access_token:z.string().min(1).max(8192),permissions:z.union([z.string(),z.array(z.string())])});
const accountSchema=z.object({user_id:z.string().regex(/^\d{1,100}$/),username:z.string().min(1).max(100),account_type:z.string()});
function singleResult<T>(schema:z.ZodType<T>,body:unknown):T{
 // Meta documents a one-item data envelope; retain the previously supported flat response.
 // Never choose one account/token from multiple results or prefer a conflicting flat payload.
 const wrapped=typeof body==='object'&&body!==null&&Object.hasOwn(body,'data');
 const parsed=wrapped?z.object({data:z.tuple([schema])}).strict().safeParse(body):schema.safeParse(body);
 if(!parsed.success)throw new ProjectError(502,'INSTAGRAM_RESPONSE_INVALID','Instagram returned an invalid authorization response. Please reconnect.');
 return wrapped?(parsed.data as {data:[T]}).data[0]:parsed.data as T;
}
export function authorizationUrl(config:InstagramConfig,state:string){
 if(config.provider==='facebook')return facebookAuthorizationUrl(config,state);
 const u=new URL('https://www.instagram.com/oauth/authorize');
 u.search=new URLSearchParams({client_id:config.appId,redirect_uri:config.redirectUri,response_type:'code',scope:scopes.join(','),state,enable_fb_login:'false',force_reauth:'false'}).toString();return u.toString();
}
export function instagramProvider(config:InstagramConfig,fetcher:typeof fetch=fetch):InstagramProvider{
 if(config.provider==='facebook')return facebookInstagramProvider(config,fetcher);
 async function request(url:URL|string,init:RequestInit,signal:AbortSignal){
  try{
   const response=await fetcher(url,{...init,signal,redirect:'error',cache:'no-store'});
   const body=await response.text();if(body.length>65536)throw Error();
   let data:unknown;try{data=JSON.parse(body);}catch{if(response.ok)throw Error();data=null;}
   if(!response.ok){
    // Meta may report an invalid/expired OAuth token as HTTP 400 with code 190.
    const auth=response.status===401||response.status===403||(response.status===400&&z.object({error:z.object({code:z.literal(190)})}).safeParse(data).success);
    throw new ProjectError(502,auth?'INSTAGRAM_AUTH_REJECTED':'INSTAGRAM_UNAVAILABLE','Instagram could not complete the request.');
   }
   return data;
  }catch(e){if(e instanceof ProjectError)throw e;throw new ProjectError(502,'INSTAGRAM_UNAVAILABLE','Instagram could not complete authorization. Please reconnect.');}
 }
 async function longToken(path:string,params:Record<string,string>,signal:AbortSignal){
  const u=new URL(`https://graph.instagram.com/${path}`);u.search=new URLSearchParams(params).toString();
  const parsed=tokenSchema.safeParse(await request(u,{},signal));
  if(!parsed.success)throw new ProjectError(502,'INSTAGRAM_RESPONSE_INVALID','Instagram returned an invalid authorization response. Please reconnect.');
  return {token:parsed.data.access_token,expiresIn:parsed.data.expires_in};
 }
 return {
  async exchange(code){
   const signal=AbortSignal.timeout(25000);
   const short=singleResult(shortTokenSchema,await request('https://api.instagram.com/oauth/access_token',{method:'POST',body:new URLSearchParams({client_id:config.appId,client_secret:config.appSecret,grant_type:'authorization_code',redirect_uri:config.redirectUri,code})},signal));
   const granted=typeof short.permissions==='string'?short.permissions.split(',').map(v=>v.trim()):short.permissions;
   if(!scopes.every(s=>granted.includes(s)))throw new ProjectError(422,'INSTAGRAM_PERMISSIONS_REQUIRED','Approve profile access and publishing permission to connect.');
   const token=await longToken('access_token',{grant_type:'ig_exchange_token',client_secret:config.appSecret,access_token:short.access_token},signal);
   const u=new URL(`https://graph.instagram.com/${config.version}/me`);u.searchParams.set('fields','user_id,username,account_type');
   const account=singleResult(accountSchema,await request(u,{headers:{Authorization:`Bearer ${token.token}`}},signal));
   const type=account.account_type==='MEDIA_CREATOR'||account.account_type==='Media_Creator'?'CREATOR':account.account_type==='Business'?'BUSINESS':account.account_type;
   if(type!=='CREATOR'&&type!=='BUSINESS')throw new ProjectError(422,'INSTAGRAM_PROFESSIONAL_REQUIRED','Connect an Instagram Creator or Business account.');
   return {...token,account:{id:account.user_id,username:account.username,type},scopes:[...scopes],provider:'instagram',tokenKind:'instagram_user'};
  },
  refresh(token){return longToken('refresh_access_token',{grant_type:'ig_refresh_token',access_token:token},AbortSignal.timeout(25000));},
 };
}
