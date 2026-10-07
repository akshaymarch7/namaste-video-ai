import 'server-only';
import {z} from 'zod';
import {ProjectError} from '../projects/contracts';
import type {InstagramConfig} from './config';
import type {InstagramProvider} from './provider';

type FacebookConfig=Extract<InstagramConfig,{provider:'facebook'}>;
export const facebookInstagramScopes=['pages_show_list','pages_read_engagement','instagram_basic','instagram_content_publish'] as const;
const pageScopes=['pages_read_engagement','instagram_basic','instagram_content_publish'] as const;
const id=z.string().regex(/^\d{1,100}$/);
const accessToken=z.string().min(1).max(8192);
const userToken=z.object({access_token:accessToken,expires_in:z.number().int().positive().max(366*86400)});
const pageResult=z.object({id,name:z.string().min(1).max(256),access_token:accessToken.optional(),instagram_business_account:z.object({id}).nullable().optional()});
const profileResult=z.object({id,username:z.string().min(1).max(100)});
const permissionResult=z.object({data:z.array(z.object({permission:z.string().min(1).max(100),status:z.enum(['granted','declined','expired'])})).max(100),paging:z.object({next:z.string().optional(),cursors:z.object({after:z.string().min(1).max(4096).optional()}).optional()}).optional()});
const timestamp=z.number().int().min(0).max(8640000000000);
const debugResult=z.object({data:z.object({app_id:id,type:z.string(),is_valid:z.boolean(),expires_at:timestamp,data_access_expires_at:timestamp,profile_id:id.optional(),scopes:z.array(z.string()).max(100)})});
const invalid=()=>new ProjectError(502,'INSTAGRAM_RESPONSE_INVALID','Facebook returned an invalid authorization response. Please reconnect.');
function parse<T>(schema:z.ZodType<T>,body:unknown):T{const result=schema.safeParse(body);if(!result.success)throw invalid();return result.data;}
function providerFailure(status:number,body:unknown){
 const parsed=z.object({error:z.object({code:z.number().int()})}).safeParse(body),code=parsed.success?parsed.data.error.code:undefined;
 if(code===190) return new ProjectError(502,'INSTAGRAM_AUTH_REJECTED','Facebook authorization is invalid or expired. Please reconnect.');
 if(code===10||code===200)return new ProjectError(422,'INSTAGRAM_PERMISSIONS_REQUIRED','Approve the Facebook Page and Instagram profile/publishing permissions to connect.');
 return new ProjectError(502,status===401||status===403?'INSTAGRAM_AUTH_REJECTED':'INSTAGRAM_UNAVAILABLE','Facebook could not complete authorization. Please reconnect.');
}

export function facebookAuthorizationUrl(config:FacebookConfig,state:string){
 const url=new URL(`https://www.facebook.com/${config.version}/dialog/oauth`);
 url.search=new URLSearchParams({client_id:config.appId,config_id:config.facebookConfigId,redirect_uri:config.redirectUri,response_type:'code',override_default_response_type:'true',state}).toString();
 return url.toString();
}

export function facebookInstagramProvider(config:FacebookConfig,fetcher:typeof fetch=fetch):InstagramProvider{
 async function request(path:string,params:Record<string,string>,signal:AbortSignal,token?:string){
  // Meta documents GET for token exchange/introspection. Keep their query strings out of errors/logs.
  const url=new URL(`https://graph.facebook.com/${config.version}/${path}`);
  url.search=new URLSearchParams(params).toString();
  try{
   const response=await fetcher(url,{method:'GET',signal,redirect:'error',cache:'no-store',...(token?{headers:{Authorization:`Bearer ${token}`}}:{})});
   const reader=response.body?.getReader();if(!reader){if(!response.ok)throw providerFailure(response.status,null);throw invalid();}
   const chunks:Uint8Array[]=[];let size=0;
   try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();throw invalid();}chunks.push(value);}}finally{reader.releaseLock();}
   let body:unknown;
   try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{if(!response.ok)throw providerFailure(response.status,null);throw invalid();}
   if(!response.ok||typeof body==='object'&&body!==null&&Object.hasOwn(body,'error'))throw providerFailure(response.status,body);
   return body;
  }catch(error){if(error instanceof ProjectError)throw error;throw new ProjectError(502,'INSTAGRAM_UNAVAILABLE','Facebook could not complete authorization. Please reconnect.');}
 }
 return {
  async exchange(code,pageId){
   const chosen=id.safeParse(pageId);if(!chosen.success)throw new ProjectError(422,'INSTAGRAM_PAGE_REQUIRED','Enter the Facebook Page ID linked to your Instagram professional account.');
   const signal=AbortSignal.timeout(25000);
   const short=parse(userToken,await request('oauth/access_token',{client_id:config.appId,client_secret:config.appSecret,redirect_uri:config.redirectUri,code},signal));
   const long=parse(userToken,await request('oauth/access_token',{grant_type:'fb_exchange_token',client_id:config.appId,client_secret:config.appSecret,fb_exchange_token:short.access_token},signal));
   const grants=new Map<string,string>();let after:string|undefined;const cursors=new Set<string>();
   for(let attempt=0;attempt<5;attempt++){
    const result=parse(permissionResult,await request('me/permissions',{limit:'100',...(after?{after}:{})},signal,long.access_token));
    for(const grant of result.data){if(grants.has(grant.permission))throw invalid();grants.set(grant.permission,grant.status);}
    if(!result.paging?.next){after=undefined;break;}
    after=result.paging.cursors?.after;if(!after||cursors.has(after))throw invalid();cursors.add(after);
   }
   if(after)throw invalid();
   if(!facebookInstagramScopes.every(scope=>grants.get(scope)==='granted'))throw new ProjectError(422,'INSTAGRAM_PERMISSIONS_REQUIRED','Approve the Facebook Page and Instagram profile/publishing permissions to connect.');
   const page=parse(pageResult,await request(chosen.data,{fields:'id,name,access_token,instagram_business_account'},signal,long.access_token));
   if(page.id!==chosen.data||!page.access_token||!page.instagram_business_account)throw new ProjectError(422,'INSTAGRAM_PAGE_UNAVAILABLE','The chosen Facebook Page is unavailable or is not linked to an Instagram professional account.');
   const debug=parse(debugResult,await request('debug_token',{input_token:page.access_token},signal,`${config.appId}|${config.appSecret}`)).data;
   if(!debug.is_valid||debug.app_id!==config.appId||debug.type!=='PAGE'||(debug.profile_id&&debug.profile_id!==page.id))throw new ProjectError(502,'INSTAGRAM_AUTH_REJECTED','Facebook could not verify this Page authorization. Please reconnect.');
   if(!pageScopes.every(scope=>debug.scopes.includes(scope)))throw new ProjectError(422,'INSTAGRAM_PERMISSIONS_REQUIRED','Approve the Facebook Page and Instagram profile/publishing permissions to connect.');
   // Zero means no scheduled expiry. Missing timestamps are not silently treated as zero.
   const expirations=[debug.expires_at,debug.data_access_expires_at].filter(value=>value>0);
   const expiresAt=expirations.length?Math.min(...expirations):null;
   if(expiresAt!==null&&expiresAt<=Date.now()/1000)throw new ProjectError(502,'INSTAGRAM_AUTH_REJECTED','Facebook authorization expired. Please reconnect.');
   const profile=parse(profileResult,await request(page.instagram_business_account.id,{fields:'id,username'},signal,page.access_token));
   if(profile.id!==page.instagram_business_account.id)throw invalid();
   const expiresIn=expiresAt===null?null:Math.floor(expiresAt-Date.now()/1000);
   if(expiresIn!==null&&expiresIn<=0)throw new ProjectError(502,'INSTAGRAM_AUTH_REJECTED','Facebook authorization expired. Please reconnect.');
   return {token:page.access_token,expiresIn,account:{id:profile.id,username:profile.username,type:'PROFESSIONAL'},scopes:[...facebookInstagramScopes],provider:'facebook',tokenKind:'facebook_page',page:{id:page.id,name:page.name}};
  },
  async refresh(){throw new ProjectError(422,'INSTAGRAM_RECONNECT_REQUIRED','Reconnect through Facebook to renew Page authorization.');},
 };
}
