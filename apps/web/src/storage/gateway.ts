import {mediaAuthView} from './contracts';
import {authPath,serviceSignature} from './wire';
type R2Object={size:number;customMetadata?:Record<string,string>;httpMetadata?:{contentType?:string};body?:ReadableStream<Uint8Array>};
export type Bucket={head(key:string):Promise<R2Object|null>;get(key:string,options?:{range:{offset:number;length:number}}):Promise<R2Object|null>};
export type GatewayEnv={MEDIA_BUCKET:Bucket;APP_ORIGIN:string;MEDIA_SERVICE_SECRET:string};
export function byteRange(raw:string|null,size:number){
 if(!raw)return null;const match=/^bytes=(\d*)-(\d*)$/.exec(raw);if(!match||(!match[1]&&!match[2]))throw Error('range');
 const first=match[1]?Number(match[1]):null,last=match[2]?Number(match[2]):null;
 if((first!==null&&!Number.isSafeInteger(first))||(last!==null&&!Number.isSafeInteger(last)))throw Error('range');
 if(first===null){if(!last||last<1)throw Error('range');return {offset:Math.max(0,size-last),length:Math.min(size,last)};}
 if(first>=size||last!==null&&last<first)throw Error('range');return {offset:first,length:Math.min(last??size-1,size-1)-first+1};
}
export async function gateway(request:Request,env:GatewayEnv,call=fetch){
 const headers=new Headers({'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Vary':'Origin'});
 const fail=(status:number)=>new Response(null,{status,headers});
 let stage='configuration';
 try{
  const app=new URL(env.APP_ORIGIN);if(app.origin!==env.APP_ORIGIN||!(app.protocol==='https:'||(app.protocol==='http:'&&['127.0.0.1','localhost'].includes(app.hostname)))||env.MEDIA_SERVICE_SECRET.length<32)return fail(503);
  const origin=request.headers.get('origin');if(origin&&origin!==env.APP_ORIGIN)return fail(403);
  if(origin){headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Expose-Headers','Content-Length, Content-Range, Accept-Ranges, Content-Disposition');}
  if(request.method==='OPTIONS'){headers.set('Access-Control-Allow-Methods','GET, HEAD');headers.set('Access-Control-Allow-Headers','Range, If-Range');return fail(204);}
  if(!['GET','HEAD'].includes(request.method)){headers.set('Allow','GET, HEAD, OPTIONS');return fail(405);}
  const url=new URL(request.url),match=/^\/media\/([A-Za-z0-9_-]{43})$/.exec(url.pathname);if(!match||url.search)return fail(404);
  const rawRange=request.headers.get('range');if(rawRange&&rawRange.length>128)return fail(416);
  const body=JSON.stringify({token:match[1],method:request.method,...(rawRange?{range:rawRange}:{})}),timestamp=Date.now().toString(),nonce=crypto.randomUUID();
  stage='signature';
  const signature=await serviceSignature(env.MEDIA_SERVICE_SECRET,body,timestamp,nonce);
  stage='authorization';
  // Workers rejects redirect: 'error'. Manual mode exposes redirects for rejection below,
  // without forwarding the signed authorization request to another destination.
  const authorized=await call(`${env.APP_ORIGIN}${authPath}`,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json','x-media-time':timestamp,'x-media-nonce':nonce,'x-media-signature':signature},body});
  if(!authorized.ok){if(authorized.status!==404)headers.set('X-Media-Failure',`authorization-http-${authorized.status}`);return fail(authorized.status===404?404:503);}
  stage='authorization-response';
  const asset=mediaAuthView.parse((await authorized.json()).data);
  if(!/^owners\/[a-f0-9]{64}\/projects\/prj_[a-f0-9]{32}\/assets\/ast_[a-f0-9]{32}\.(mp4|mp3|png|vtt)$/.test(asset.objectKey))return fail(404);
  let range=null;
  try{range=byteRange(request.headers.has('if-range')&&request.headers.get('if-range')!==`"${asset.sha256}"`?null:rawRange,asset.bytes);}catch{headers.set('Content-Range',`bytes */${asset.bytes}`);return fail(416);}
  stage='storage';
  const object=request.method==='HEAD'?await env.MEDIA_BUCKET.head(asset.objectKey):await env.MEDIA_BUCKET.get(asset.objectKey,range?{range}:undefined);
  if(!object)return fail(404);
  if(object.size!==asset.bytes||object.customMetadata?.sha256!==asset.sha256||object.httpMetadata?.contentType!==asset.contentType){await object.body?.cancel();return fail(503);}
  if(request.method==='GET'&&!object.body)return fail(503);
  headers.set('Content-Type',asset.contentType);headers.set('Content-Disposition',asset.disposition);headers.set('Accept-Ranges','bytes');headers.set('ETag',`"${asset.sha256}"`);headers.set('Content-Length',String(range?.length??asset.bytes));
  if(range)headers.set('Content-Range',`bytes ${range.offset}-${range.offset+range.length-1}/${asset.bytes}`);
  return new Response(request.method==='HEAD'?null:object.body,{status:range?206:200,headers});
 }catch(error){const reason=error instanceof Error&&/illegal invocation/i.test(error.message)?'illegal-invocation':error instanceof Error&&error.name==='TimeoutError'?'timeout':error instanceof Error&&error.name==='TypeError'?'type-error':error instanceof Error&&error.name==='ReferenceError'?'reference-error':error instanceof Error&&error.name==='AbortError'?'abort':'exception';headers.set('X-Media-Failure',`${stage}-${reason}`);return fail(503);}
}
export default {fetch(request:Request,env:GatewayEnv){return gateway(request,env);}};
