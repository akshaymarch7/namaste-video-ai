import 'server-only';
import {z} from 'zod';
import {ProjectError} from '../projects/contracts';
import {scopes} from './contracts';
import type {InstagramConfig} from './config';
export type Grant={token:string;expiresIn:number;account:{id:string;username:string;type:'BUSINESS'|'CREATOR'};scopes:string[]};
export type InstagramProvider={exchange(code:string):Promise<Grant>;refresh(token:string):Promise<{token:string;expiresIn:number}>};
const tokenSchema=z.object({access_token:z.string().min(1).max(8192),expires_in:z.number().int().positive().max(366*86400)});
export function authorizationUrl(config:InstagramConfig,state:string){
 const u=new URL('https://www.instagram.com/oauth/authorize');
 u.search=new URLSearchParams({client_id:config.appId,redirect_uri:config.redirectUri,response_type:'code',scope:scopes.join(','),state,enable_fb_login:'0',force_authentication:'1'}).toString();return u.toString();
}
export function instagramProvider(config:InstagramConfig,fetcher:typeof fetch=fetch):InstagramProvider{
 async function request(url:URL|string,init:RequestInit,signal:AbortSignal){
  try{
   const response=await fetcher(url,{...init,signal,redirect:'error',cache:'no-store'});
   if(!response.ok)throw new ProjectError(502,response.status===401||response.status===403?'INSTAGRAM_AUTH_REJECTED':'INSTAGRAM_UNAVAILABLE','Instagram could not complete authorization. Please reconnect.');
   const body=await response.text();if(body.length>65536)throw Error();return JSON.parse(body);
  }catch(e){if(e instanceof ProjectError)throw e;throw new ProjectError(502,'INSTAGRAM_UNAVAILABLE','Instagram could not complete authorization. Please reconnect.');}
 }
 async function longToken(path:string,params:Record<string,string>,signal:AbortSignal){
  const u=new URL(`https://graph.instagram.com/${path}`);u.search=new URLSearchParams(params).toString();
  const t=tokenSchema.parse(await request(u,{},signal));return {token:t.access_token,expiresIn:t.expires_in};
 }
 return {
  async exchange(code){
   const signal=AbortSignal.timeout(25000);
   const short=z.object({access_token:z.string().min(1).max(8192),permissions:z.union([z.string(),z.array(z.string())])}).parse(await request('https://api.instagram.com/oauth/access_token',{method:'POST',body:new URLSearchParams({client_id:config.appId,client_secret:config.appSecret,grant_type:'authorization_code',redirect_uri:config.redirectUri,code})},signal));
   const granted=typeof short.permissions==='string'?short.permissions.split(',').map(v=>v.trim()):short.permissions;
   if(!scopes.every(s=>granted.includes(s)))throw new ProjectError(422,'INSTAGRAM_PERMISSIONS_REQUIRED','Approve profile access and publishing permission to connect.');
   const token=await longToken('access_token',{grant_type:'ig_exchange_token',client_secret:config.appSecret,access_token:short.access_token},signal);
   const u=new URL(`https://graph.instagram.com/${config.version}/me`);u.searchParams.set('fields','user_id,username,account_type');
   const account=z.object({user_id:z.string().regex(/^\d{1,100}$/),username:z.string().min(1).max(100),account_type:z.string()}).parse(await request(u,{headers:{Authorization:`Bearer ${token.token}`}},signal));
   const type=account.account_type==='MEDIA_CREATOR'?'CREATOR':account.account_type;
   if(type!=='CREATOR'&&type!=='BUSINESS')throw new ProjectError(422,'INSTAGRAM_PROFESSIONAL_REQUIRED','Connect an Instagram Creator or Business account.');
   return {...token,account:{id:account.user_id,username:account.username,type},scopes:[...scopes]};
  },
  refresh(token){return longToken('refresh_access_token',{grant_type:'ig_refresh_token',access_token:token},AbortSignal.timeout(25000));},
 };
}
