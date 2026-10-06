import {z} from 'zod';
import {generationRequest,cancelRequest,jobView,type JobView} from '../../src/jobs/contracts';
const pendingSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('create'),key:z.string().uuid(),body:generationRequest}).strict(),
 z.object({action:z.literal('cancel'),key:z.string().uuid(),jobId:z.string(),body:cancelRequest}).strict(),
]);
type Pending=z.infer<typeof pendingSchema>;
export type GenerationState={job:JobView|null;pending:Pending|null;busy:boolean;error:string|null;ready:boolean};
export function generationStore(storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>,userId:string,projectId:string){const key=`generation:v1:${userId}:${projectId}`;return {read:()=>{const value=storage.getItem(key);return value?pendingSchema.parse(JSON.parse(value)):null;},write:(value:Pending)=>storage.setItem(key,JSON.stringify(value)),clear:()=>storage.removeItem(key)};}
export function createGenerationController(projectId:string,store:ReturnType<typeof generationStore>,call:(url:string,init?:RequestInit)=>Promise<any>,notify:(state:GenerationState)=>void){
 let state:GenerationState={job:null,pending:null,busy:false,error:null,ready:false},disposed=false;
 const emit=()=>{if(!disposed)notify({...state});};
 try{state.pending=store.read();}catch{state.error='RECOVERY_STORAGE';}
 async function run(work:()=>Promise<void>){if(disposed||state.busy)return;state.busy=true;emit();try{await work();}catch(e){if(!disposed)state.error=(e as {code?:string}).code??'CONNECTION';}finally{if(!disposed){state.busy=false;emit();}}}
 async function read(){const r=await call(`/api/projects/${projectId}/generations`);const job=r.data===null?null:jobView.parse(r.data);if(job&&job.projectId!==projectId)throw {code:'CONNECTION'};if(!disposed){state.job=job;state.ready=true;if(!state.pending&&state.error!=='RECOVERY_STORAGE')state.error=null;}}
 async function send(){const pending=state.pending;if(!pending)return;
  try{const r=await call(pending.action==='create'?`/api/projects/${projectId}/generations`:`/api/jobs/${pending.jobId}/cancel`,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':pending.key},body:JSON.stringify(pending.body)});const job=jobView.parse(r.data);if(job.projectId!==projectId||(pending.action==='cancel'?job.id!==pending.jobId:job.storyboardId!==pending.body.storyboardId))throw {code:'CONNECTION'};if(disposed)return;store.clear();state.pending=null;state.job=job;state.error=null;await read();
  }catch(e){if(disposed)return;const status=(e as {status?:number}).status;if(status&&[400,404,409,413,415,422].includes(status)){store.clear();state.pending=null;}throw e;}
 }
 return {snapshot:()=>({...state}),dispose:()=>{disposed=true;},load:()=>run(async()=>{await read();}),recover:()=>run(send),
  create:(body:z.infer<typeof generationRequest>)=>run(async()=>{if(state.pending||state.error==='RECOVERY_STORAGE')return;const pending:Pending={action:'create',key:crypto.randomUUID(),body:generationRequest.parse(body)};try{store.write(pending);}catch{throw {code:'RECOVERY_STORAGE'};}state.pending=pending;await send();}),
  cancel:()=>run(async()=>{if(state.pending||!state.job?.actions.cancel||state.error==='RECOVERY_STORAGE')return;const pending:Pending={action:'cancel',key:crypto.randomUUID(),jobId:state.job.id,body:{expectedRevision:state.job.revision}};try{store.write(pending);}catch{throw {code:'RECOVERY_STORAGE'};}state.pending=pending;await send();}),
 };
}
export async function generationTransport(url:string,init?:RequestInit){const r=await fetch(url,{...init,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)});const body=await r.json();if(!r.ok)throw {code:body.error?.code??'CONNECTION',status:r.status};return body;}
