import {z} from 'zod';
import {applyStoryboard,editableStoryboardSchema,type EditableStoryboard} from '../../src/storyboards/editable-contract';
import type {DraftView} from '../../src/drafts/contracts';
const pendingSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('apply'),key:z.string().uuid(),body:applyStoryboard}).strict(),
 z.object({kind:z.literal('save'),expectedRevision:z.number().int().min(1),plan:editableStoryboardSchema,sourceStoryboardId:z.string()}).strict(),
]);
export type EditPending=z.infer<typeof pendingSchema>;
export type EditStore={read():EditPending|null;write(v:EditPending):void;clear():void};
export type EditTransport={read():Promise<DraftView>;apply(p:Extract<EditPending,{kind:'apply'}>):Promise<unknown>;save(p:Extract<EditPending,{kind:'save'}>):Promise<DraftView>};
export type EditorState={saved:DraftView|null;local:EditableStoryboard|null;remote:DraftView|null;pending:EditPending|null;busy:boolean;error:string};
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
export const editorDirty=(s:EditorState)=>!!s.pending||!equal(s.local,s.saved?.editablePlan??null);
export function editStore(storage:Storage,userId:string,projectId:string):EditStore{
 const key=`nv:storyboard-edit:${encodeURIComponent(userId)}:${projectId}`;
 return {read:()=>{const raw=storage.getItem(key);return raw?pendingSchema.parse(JSON.parse(raw)):null;},write:p=>storage.setItem(key,JSON.stringify(pendingSchema.parse(p))),clear:()=>storage.removeItem(key)};
}
export function createEditor(transport:EditTransport,store:EditStore,publish:(s:EditorState)=>void){
 let disposed=false,state:EditorState={saved:null,local:null,remote:null,pending:null,busy:false,error:''};
 const emit=(patch:Partial<EditorState>)=>{if(!disposed){state={...state,...patch};publish(state);}};
 const clear=()=>{if(disposed)return;store.clear();emit({pending:null});};
 const accept=(draft:DraftView)=>{if(disposed)return;clear();emit({saved:draft,local:structuredClone(draft.editablePlan),remote:null,error:''});};
 async function run(fn:()=>Promise<void>){if(disposed||state.busy)return;emit({busy:true,error:''});try{await fn();}catch(e){emit({error:(e as {code?:string})?.code??'CONNECTION'});}finally{emit({busy:false});}}
 async function recover(){
  const pending=state.pending;if(!pending)return;
  try{
   if(pending.kind==='apply'){await transport.apply(pending);if(disposed)return;accept(await transport.read());}
   else accept(await transport.save(pending));
  }catch(e){
   if(disposed)return;
   const code=(e as {code?:string}).code;
   if(code==='REVISION_CONFLICT'){
    // A newer revision fences out the old uncertain PATCH. An unchanged read alone never settles it.
    const remote=await transport.read();if(disposed)return;
    if(pending.kind==='save'&&remote.revision>pending.expectedRevision&&remote.sourceStoryboardId===pending.sourceStoryboardId&&equal(remote.editablePlan,pending.plan)){accept(remote);return;}
    clear();emit({remote,error:'REVISION_CONFLICT'});return;
   }
   if(['VALIDATION_FAILED','STORYBOARD_REQUIRED','HASH_MISMATCH','IDEMPOTENCY_KEY_REUSED','VOICE_UNAVAILABLE','NOT_FOUND'].includes(code??''))clear();
   throw e;
  }
 }
 function persist(p:EditPending){try{store.write(p);}catch{throw {code:'RECOVERY_STORAGE'};}emit({pending:p});}
 return {
  snapshot:()=>state,
  load:()=>run(async()=>{let pending:EditPending|null;try{pending=store.read();}catch{throw {code:'RECOVERY_STORAGE'};}const draft=await transport.read();if(disposed)return;emit({saved:pending?.kind==='save'?{...draft,sourceStoryboardId:pending.sourceStoryboardId}:draft,local:structuredClone(pending?.kind==='save'?pending.plan:draft.editablePlan),pending});if(pending)await recover();}),
  edit:(plan:EditableStoryboard)=>{if(!state.busy&&!state.pending&&!state.remote&&state.saved)emit({local:plan,error:''});},
  apply:(id:string,hash:string)=>run(async()=>{if(!state.saved||state.pending||editorDirty(state)||state.remote)throw {code:'UNSAVED'};persist({kind:'apply',key:crypto.randomUUID(),body:{expectedDraftRevision:state.saved.revision,storyboardId:id,expectedContentHash:hash}});await recover();}),
  save:()=>run(async()=>{if(!state.saved?.sourceStoryboardId||!state.local||state.pending||state.remote)return;if(!editableStoryboardSchema.safeParse(state.local).success)throw {code:'VALIDATION_FAILED'};persist({kind:'save',expectedRevision:state.saved.revision,plan:structuredClone(state.local),sourceStoryboardId:state.saved.sourceStoryboardId});await recover();}),
  recover:()=>run(recover),
  refresh:()=>run(async()=>{if(state.pending){await recover();return;}const remote=await transport.read();if(disposed)return;if(editorDirty(state)){emit({remote,error:'REVISION_CONFLICT'});}else accept(remote);}),
  useRemote:()=>{if(state.remote&&!state.busy&&!state.pending)accept(state.remote);},
  keepLocal:()=>run(async()=>{if(!state.remote||!state.local||!state.saved||state.remote.sourceStoryboardId!==state.saved.sourceStoryboardId)throw {code:'SOURCE_CHANGED'};const remote=state.remote;emit({saved:remote,remote:null});if(!editableStoryboardSchema.safeParse(state.local).success)throw {code:'VALIDATION_FAILED'};persist({kind:'save',expectedRevision:remote.revision,plan:structuredClone(state.local),sourceStoryboardId:remote.sourceStoryboardId!});await recover();}),
  dispose:()=>{disposed=true;},
 };
}
export function editorTransport(projectId:string,request=fetch):EditTransport{
 const path=`/api/projects/${projectId}/draft`;
 async function call(url:string,method='GET',body?:unknown,key?:string){
  const response=await request(url,{method,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000),headers:{...(body?{'Content-Type':'application/json'}:{}),...(key?{'Idempotency-Key':key}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const json=await response.json();if(!response.ok)throw {code:json.error?.code??'SERVICE_UNAVAILABLE'};return json.data;
 }
 return {read:()=>call(path),apply:p=>call(`${path}/apply`,'POST',p.body,p.key),save:p=>call(path,'PATCH',{expectedRevision:p.expectedRevision,changes:{editablePlan:p.plan}})};
}
