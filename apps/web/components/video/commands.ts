import {captionRequest,regenerateRequest,revisionView} from '../../src/videos/caption-contracts';
import type {CaptionOverride} from '../../../../src/plan-v2/caption-edits';
import {z} from 'zod';
import {videoId,approveRequest,selectRequest,approvalView,selectionView,type Video} from '../../src/videos/contracts';
export const attemptSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('captions'),videoId,key:z.string().uuid(),body:captionRequest}).strict(),
 z.object({action:z.literal('regenerate'),videoId,key:z.string().uuid(),body:regenerateRequest}).strict(),
 z.object({action:z.literal('approve'),videoId,key:z.string().uuid(),body:approveRequest}).strict(),
 z.object({action:z.literal('select'),videoId,key:z.string().uuid(),body:selectRequest}).strict(),
]);
export type Attempt=z.infer<typeof attemptSchema>;
export type CommandState={ready:boolean;busy:boolean;pending:Attempt|null;error:string;completed:number};
export function commandStore(storage:Storage,owner:string,project:string){
 const legacyKey=`nv:video-command:${encodeURIComponent(owner)}:${project}`,prefix=`${legacyKey}:`;
 const decode=(raw:string)=>attemptSchema.parse(JSON.parse(raw));
 const same=(a:Attempt,b:Attempt)=>a.key===b.key&&a.action===b.action&&a.videoId===b.videoId&&JSON.stringify(a.body)===JSON.stringify(b.body);
 return {
  read(){
   // Read old single-record receipts too; never overwrite them with a new command.
   const legacy=storage.getItem(legacyKey);if(legacy)return decode(legacy);
   const keys:string[]=[];
   for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(prefix))keys.push(key);}
   for(const key of keys.sort()){
    const raw=storage.getItem(key);if(!raw)continue;
    const a=decode(raw);if(key!==prefix+a.key)throw Error('RECOVERY_STORAGE');return a;
   }
   return null;
  },
  write(value:Attempt){
   const a=attemptSchema.parse(value),key=prefix+a.key,old=storage.getItem(key);
   if(old&&!same(decode(old),a))throw Error('RECOVERY_STORAGE');
   storage.setItem(key,JSON.stringify(a));
  },
  clear(a:Attempt){
   // Command UUIDs are immutable identities: another tab's command has another key.
   const key=prefix+a.key,raw=storage.getItem(key);
   if(raw){if(!same(decode(raw),a))throw Error('RECOVERY_STORAGE');storage.removeItem(key);}
   const legacy=storage.getItem(legacyKey);
   if(legacy&&same(decode(legacy),a))storage.removeItem(legacyKey);
  },
 };
}
export function createVideoCommands(project:string,store:ReturnType<typeof commandStore>,send:(a:Attempt)=>Promise<unknown>,publish:(s:CommandState)=>void){
 let disposed=false,state:CommandState={ready:false,busy:false,pending:null,error:'',completed:0};
 const emit=(patch:Partial<CommandState>)=>{if(!disposed){state={...state,...patch};publish(state);}};
 async function dispatch(a:Attempt){emit({busy:true,error:''});try{
  const raw=await send(a);
  if(a.action==='approve'){
   const r=approvalView.parse(raw);if(r.projectId!==project||r.subjectId!==a.videoId||r.outputHash!==a.body.expectedOutputHash||r.renderSpecHash!==a.body.expectedRenderSpecHash)throw {code:'UNCONFIRMED'};
  }else if(a.action==='select'){
   const r=selectionView.parse(raw);if(r.projectId!==project||r.videoId!==a.videoId)throw {code:'UNCONFIRMED'};
  }else{
   const r=revisionView.parse(raw);if(r.job.projectId!==project||r.sourceVideoId!==a.videoId||r.sourceRenderSpecHash!==a.body.expectedRenderSpecHash)throw {code:'UNCONFIRMED'};
  }
  if(disposed)return;store.clear(a);emit({pending:store.read(),completed:state.completed+1});
 }catch(e){if(disposed)return;const code=(e as {code?:string}).code??'UNCONFIRMED';
  if(['NOT_FOUND','VIDEO_NOT_READY','HASH_MISMATCH','REVISION_CONFLICT','VALIDATION_FAILED','INVALID_ORIGIN','SOURCE_CHANGED','PROJECT_BUSY','CAPTION_MEANING_CHANGE','INVALID_SPAN','NO_CHANGES','CAPTION_TIMING_INVALID'].includes(code)){try{store.clear(a);emit({pending:store.read()});}catch{emit({error:'RECOVERY_STORAGE'});return;}}
  emit({error:code});
 }finally{emit({busy:false});}}
 return {load(){try{emit({ready:true,pending:store.read()});}catch{emit({error:'RECOVERY_STORAGE'});}},snapshot:()=>state,
  async submit(action:'approve'|'select'|'captions'|'regenerate',video:Video,revision:number,overrides:CaptionOverride[]=[]){if(disposed||!state.ready||state.busy||state.pending)return;
   const parsed=attemptSchema.safeParse({action,videoId:video.id,key:crypto.randomUUID(),body:action==='approve'?{expectedOutputHash:video.outputHash,expectedRenderSpecHash:video.renderSpecHash,approve:true}:action==='select'?{expectedProjectRevision:revision}:action==='captions'?{expectedRenderSpecHash:video.renderSpecHash,overrides}:{expectedRenderSpecHash:video.renderSpecHash}});
   if(!parsed.success){emit({error:'VALIDATION_FAILED'});return;}const a=parsed.data;
   try{store.write(a);}catch{emit({error:'RECOVERY_STORAGE'});return;}emit({pending:a});await dispatch(a);
  },async recover(){if(!disposed&&!state.busy&&state.pending)await dispatch(state.pending);},dispose(){disposed=true;}};
}
export async function sendVideoCommand(a:Attempt){const r=await fetch(`/api/videos/${a.videoId}/${a.action}`,{method:a.action==='captions'?'PATCH':'POST',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json','Idempotency-Key':a.key},body:JSON.stringify(a.body)});const body=await r.json();if(!r.ok)throw {code:body.error?.code??'SERVICE_UNAVAILABLE'};return body.data;}
