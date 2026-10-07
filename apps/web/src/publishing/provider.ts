import 'server-only';
import type {InstagramConfig} from '../instagram/config';
export class PublishProviderError extends Error {constructor(public code:string){super(code);}}
export type PublishProvider={create(account:string,token:string,videoUrl:string,caption:string):Promise<string>;status(container:string,token:string):Promise<'IN_PROGRESS'|'FINISHED'|'PUBLISHED'|'ERROR'|'EXPIRED'>;publish(account:string,token:string,container:string):Promise<string>;permalink(media:string,token:string):Promise<string>};
export function publishProvider(config:InstagramConfig,call:typeof fetch=fetch):PublishProvider{
 const origin=config.provider==='facebook'?'https://graph.facebook.com':'https://graph.instagram.com';
 const numeric=(s:string)=>{if(!/^\d{1,100}$/.test(s))throw new PublishProviderError('PROVIDER_RESPONSE_INVALID');return s;};
 async function request(path:string,token:string,fields?:Record<string,string>){
  let response:Response;try{response=await call(`${origin}/${config.version}/${path}`,{method:fields?'POST':'GET',redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Authorization:`Bearer ${token}`,...(fields?{'Content-Type':'application/x-www-form-urlencoded'}:{})},...(fields?{body:new URLSearchParams(fields)}:{})});}catch{throw new PublishProviderError('PROVIDER_OUTCOME_UNCONFIRMED');}
  // Never expose Meta bodies, bearer tokens, ingest URLs or raw exceptions.
  let body:any;try{const reader=response.body?.getReader();if(!reader)throw Error();let length=0,parts:Uint8Array[]=[];for(;;){const p=await reader.read();if(p.done)break;length+=p.value.length;if(length>65536){await reader.cancel();throw Error();}parts.push(p.value);}body=JSON.parse(Buffer.concat(parts).toString());}catch{throw new PublishProviderError('PROVIDER_RESPONSE_INVALID');}
  if(!response.ok){const code=body?.error?.code;throw new PublishProviderError(code===190||code===10||code===200?'RECONNECT_REQUIRED':response.status===429||code===4||code===32||code===613?'PROVIDER_RATE_LIMITED':'PROVIDER_REJECTED');}return body;
 }
 return {
  async create(account,token,videoUrl,caption){return numeric((await request(`${numeric(account)}/media`,token,{media_type:'REELS',video_url:videoUrl,caption,share_to_feed:'true'})).id);},
  async status(container,token){const s=(await request(`${numeric(container)}?fields=status_code`,token)).status_code;if(!['IN_PROGRESS','FINISHED','PUBLISHED','ERROR','EXPIRED'].includes(s))throw new PublishProviderError('PROVIDER_RESPONSE_INVALID');return s;},
  async publish(account,token,container){return numeric((await request(`${numeric(account)}/media_publish`,token,{creation_id:numeric(container)})).id);},
  async permalink(media,token){const link=(await request(`${numeric(media)}?fields=permalink`,token)).permalink;let url:URL;try{url=new URL(link);}catch{throw new PublishProviderError('PROVIDER_RESPONSE_INVALID');}if(url.protocol!=='https:'||!['www.instagram.com','instagram.com'].includes(url.hostname)||url.username||url.password)throw new PublishProviderError('PROVIDER_RESPONSE_INVALID');return url.href;},
 };
}
