import {z} from 'zod';
import {connectionView,disconnectInput,type ConnectionView} from '../../src/instagram/contracts';

const receipt=z.object({key:z.string().uuid(),body:disconnectInput}).strict();
const provider=z.enum(['instagram','facebook']);
export type InstagramProvider=z.infer<typeof provider>;
type DisconnectReceipt=z.infer<typeof receipt>;
export type InstagramTransport={
 get:()=>Promise<{connection:unknown;configured:boolean;provider?:InstagramProvider}>;
 connect:(project?:string)=>Promise<{authorizationUrl:string}>;
 disconnect:(pending:DisconnectReceipt)=>Promise<{connection:ConnectionView}>;
};
export type InstagramState={connection:ConnectionView|null;configured:boolean;provider:InstagramProvider;ready:boolean;busy:boolean;pending:DisconnectReceipt|null;error:string};
export const initialInstagramState:InstagramState={connection:null,configured:false,provider:'instagram',ready:false,busy:false,pending:null,error:''};

function authorizationLocation(value:string){
 const route=/^https:\/\/www\.instagram\.com\/oauth\/authorize(?:\?|$)/;
 // Match the original authority too: URL parsing normalizes explicit default ports.
 if(!route.test(value)||value.includes('#'))throw Error();
 const url=new URL(value);
 if(url.username||url.password||url.port)throw Error();
 return url.toString();
}
export function instagramController(storage:Storage,owner:string,transport:InstagramTransport,onChange:(s:InstagramState)=>void){
 const slot=`namaste:instagram-disconnect:${owner}`;let state={...initialInstagramState},disposed=false;
 const update=(patch:Partial<InstagramState>)=>{if(!disposed){state={...state,...patch};onChange(state);}};
 const clear=()=>{if(storage.getItem(slot)===JSON.stringify(state.pending))storage.removeItem(slot);};
 const error=(e:unknown)=>e&&typeof e==='object'&&'code'in e?String(e.code):'OUTCOME_UNKNOWN';
 const read=(result:Awaited<ReturnType<InstagramTransport['get']>>)=>{
  const selectedProvider=provider.parse(result.provider??'instagram');
  return {connection:connectionView.nullable().parse(result.connection),configured:result.configured&&selectedProvider==='instagram',provider:selectedProvider,ready:true};
 };
 async function load(){
  if(state.busy||disposed)return;
  update({busy:true,error:''});
  try{const saved=storage.getItem(slot),pending=saved?receipt.parse(JSON.parse(saved)):null;update({pending});update(read(await transport.get()));}
  catch(e){update({error:error(e),ready:false});}
  finally{update({busy:false});}
 }
 async function recover(){
  if(!state.pending||state.busy||disposed)return;
  update({busy:true,error:''});
  try{const result=await transport.disconnect(state.pending);connectionView.parse(result.connection);if(disposed)return;clear();update({pending:null});update(read(await transport.get()));}
  catch(e){const code=error(e);if(['REVISION_CONFLICT','IDEMPOTENCY_KEY_REUSED','VALIDATION_FAILED','CONNECTION_RECONCILIATION_PENDING'].includes(code)){clear();update({pending:null,ready:false});}update({error:code});}
  finally{update({busy:false});}
 }
 return {
  snapshot:()=>state,load,recover,dispose:()=>{disposed=true;},
  async disconnect(){
   if(!state.ready||!state.connection||state.pending||state.busy)return;
   const pending={key:crypto.randomUUID(),body:{expectedRevision:state.connection.revision,confirmPausePending:true as const}};
   try{storage.setItem(slot,JSON.stringify(pending));update({pending});}catch{update({error:'RECOVERY_STORAGE'});return;}
   await recover();
  },
  async connect(project?:string){
   if(!state.ready||!state.configured||state.busy||state.pending)return null;
   update({busy:true,error:''});
   try{const result=await transport.connect(project);if(disposed)return null;return authorizationLocation(result.authorizationUrl);}
   catch(e){update({error:error(e)});return null;}
   finally{update({busy:false});}
  }
 };
}
async function request(path:string,init:RequestInit={}){
 const r=await fetch(`/api/instagram/${path}`,{...init,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json',...init.headers},signal:AbortSignal.timeout(15000)});
 const body=await r.json();if(!r.ok)throw body.error;
 return {data:body.data,configured:r.headers.get('X-Instagram-Configured')==='true',provider:r.headers.get('X-Instagram-Provider')};
}
export const instagramTransport:InstagramTransport={
 get:async()=>{const r=await request('connection');return {connection:r.data,configured:r.configured,provider:provider.parse(r.provider??'instagram')};},
 connect:async(project?:string)=>(await request('connect',{method:'POST',body:JSON.stringify(project?{returnProjectId:project}:{})})).data as {authorizationUrl:string},
 disconnect:async(p:DisconnectReceipt)=>(await request('connection',{method:'DELETE',headers:{'Idempotency-Key':p.key},body:JSON.stringify(p.body)})).data as {connection:ConnectionView}
};
