import {z} from 'zod';
import {videoId,approveRequest,selectRequest,approvalView,selectionView,type Video} from '../../src/videos/contracts';
export const attemptSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('approve'),videoId,key:z.string().uuid(),body:approveRequest}).strict(),
 z.object({action:z.literal('select'),videoId,key:z.string().uuid(),body:selectRequest}).strict(),
]);
export type Attempt=z.infer<typeof attemptSchema>;
export type CommandState={ready:boolean;busy:boolean;pending:Attempt|null;error:string;completed:number};
export function commandStore(storage:Storage,owner:string,project:string){const key=`nv:video-command:${encodeURIComponent(owner)}:${project}`;return {read(){const raw=storage.getItem(key);return raw?attemptSchema.parse(JSON.parse(raw)):null;},write(a:Attempt){storage.setItem(key,JSON.stringify(a));},clear(){storage.removeItem(key);}};}
export function createVideoCommands(project:string,store:ReturnType<typeof commandStore>,send:(a:Attempt)=>Promise<unknown>,publish:(s:CommandState)=>void){
 let disposed=false,state:CommandState={ready:false,busy:false,pending:null,error:'',completed:0};
 const emit=(patch:Partial<CommandState>)=>{if(!disposed){state={...state,...patch};publish(state);}};
 async function dispatch(a:Attempt){emit({busy:true,error:''});try{
  const r=a.action==='approve'?approvalView.parse(await send(a)):selectionView.parse(await send(a));
  if(r.projectId!==project||(a.action==='approve'? !('subjectId'in r)||r.subjectId!==a.videoId||r.outputHash!==a.body.expectedOutputHash||r.renderSpecHash!==a.body.expectedRenderSpecHash:!('videoId'in r)||r.videoId!==a.videoId))throw {code:'UNCONFIRMED'};
  if(disposed)return;store.clear();emit({pending:null,completed:state.completed+1});
 }catch(e){if(disposed)return;const code=(e as {code?:string}).code??'UNCONFIRMED';
  if(['NOT_FOUND','VIDEO_NOT_READY','HASH_MISMATCH','REVISION_CONFLICT','VALIDATION_FAILED','INVALID_ORIGIN'].includes(code)){try{store.clear();emit({pending:null});}catch{emit({error:'RECOVERY_STORAGE'});return;}}
  emit({error:code});
 }finally{emit({busy:false});}}
 return {load(){try{emit({ready:true,pending:store.read()});}catch{emit({error:'RECOVERY_STORAGE'});}},snapshot:()=>state,
  async submit(action:'approve'|'select',video:Video,revision:number){if(disposed||!state.ready||state.busy||state.pending)return;
   const a=attemptSchema.parse({action,videoId:video.id,key:crypto.randomUUID(),body:action==='approve'?{expectedOutputHash:video.outputHash,expectedRenderSpecHash:video.renderSpecHash,approve:true}:{expectedProjectRevision:revision}});
   try{store.write(a);}catch{emit({error:'RECOVERY_STORAGE'});return;}emit({pending:a});await dispatch(a);
  },async recover(){if(!disposed&&!state.busy&&state.pending)await dispatch(state.pending);},dispose(){disposed=true;}};
}
export async function sendVideoCommand(a:Attempt){const r=await fetch(`/api/videos/${a.videoId}/${a.action}`,{method:'POST',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json','Idempotency-Key':a.key},body:JSON.stringify(a.body)});const body=await r.json();if(!r.ok)throw {code:body.error?.code??'SERVICE_UNAVAILABLE'};return body.data;}
