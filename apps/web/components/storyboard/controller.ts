import { z } from 'zod';
import { storyboardReceipt, storyboardSummary, storyboardView, storyboardRequest, revisionRequest } from '../../src/storyboards/api-contracts';
import type { DraftView } from '../../src/drafts/contracts';
export type Candidate = z.infer<typeof storyboardView>;
export type Summary = z.infer<typeof storyboardSummary>;
export type Receipt = z.infer<typeof storyboardReceipt>;
const attemptSchema = z.object({key:z.string().uuid(),expectedDraftRevision:z.number().int().min(1),revision:revisionRequest.omit({expectedDraftRevision:true}).optional()}).strict();
export type Attempt = z.infer<typeof attemptSchema>;
export type ReviewState = {busy:boolean; ready:boolean; error:string; draft:DraftView|null; title:string; receipt:Receipt|null; candidate:Candidate|null; history:Summary[]; cursor:string|null; pending:Attempt|null};
export type ReviewTransport = {
  context():Promise<{title:string;draft:DraftView}>;
  latest():Promise<Receipt|null>;
  history(cursor?:string):Promise<{data:Summary[];cursor:string|null}>;
  get(id:string):Promise<Candidate>;
  create(attempt:Attempt):Promise<Receipt>;
};
export type AttemptStore = {read():Attempt|null;write(attempt:Attempt):void;clear():void};
export function attemptStore(storage:Storage, userId:string, projectId:string):AttemptStore {
  const key=`nv:storyboard-request:${encodeURIComponent(userId)}:${projectId}`;
  return {
    read(){const raw=storage.getItem(key);if(!raw)return null;return attemptSchema.parse(JSON.parse(raw));},
    write(value){storage.setItem(key,JSON.stringify(attemptSchema.parse(value)));},clear(){storage.removeItem(key);},
  };
}
function canonical(value:unknown):string{
 if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
 if(value&&typeof value==='object')return `{${Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>`${JSON.stringify(key)}:${canonical(v)}`).join(',')}}`;
 return JSON.stringify(value);
}
export function canReviseCandidate(candidate:Candidate,draft:DraftView){
 return candidate.sourceDraftRevision===draft.revision||(!draft.planStale&&draft.sourceStoryboardId===candidate.id&&canonical(draft.editablePlan)===canonical(candidate.content));
}
export function createReview(transport:ReviewTransport, store:AttemptStore, publish:(state:ReviewState)=>void) {
  let disposed=false;
  let state:ReviewState={busy:false,ready:false,error:'',draft:null,title:'',receipt:null,candidate:null,history:[],cursor:null,pending:null};
  const emit=(patch:Partial<ReviewState>)=>{if(!disposed){state={...state,...patch};publish(state);}};
  const code=(error:unknown)=>(error as {code?:string})?.code??'CONNECTION';
  async function run(operation:()=>Promise<void>){
    if(disposed||state.busy)return;
    emit({busy:true,error:''});
    try{await operation();}catch(error){emit({error:code(error)});}finally{emit({busy:false});}
  }
  async function accept(receipt:Receipt){
    if(disposed)return;
    emit({receipt});
    if(receipt.state!=='running' && state.pending){store.clear();emit({pending:null});}
  }
  async function context(){const result=await transport.context();emit({draft:result.draft,title:result.title});}
  async function history(){const result=await transport.history();emit({history:result.data,cursor:result.cursor});}
  async function select(id:string){const candidate=await transport.get(id);emit({candidate});}
  async function send(attempt:Attempt){
    try{return await transport.create(attempt);}catch(error){
      if(!disposed && ['REVISION_CONFLICT','PROJECT_BUSY','INVALID_DRAFT','VOICE_UNAVAILABLE','AI_NOT_CONFIGURED','VALIDATION_FAILED','NOT_FOUND','INVALID_ORIGIN','IDEMPOTENCY_KEY_REUSED','SOURCE_CHANGED','INVALID_SCENE'].includes(code(error))){store.clear();emit({pending:null});}
      throw error;
    }
  }
  async function refresh(){
    await context();
    if(disposed)return;
    const receipt=state.pending?await send(state.pending):await transport.latest();
    const justCompleted=state.receipt?.state==='running'&&receipt?.state==='completed';
    if(receipt)await accept(receipt);else emit({receipt:null});
    await history();
    const target=(justCompleted?receipt?.storyboardId:null)??state.candidate?.id??(receipt?.state==='completed'?receipt.storyboardId:null)??state.history[0]?.id;
    if(target)await select(target);
    emit({ready:true});
  }
  return {
    snapshot:()=>state,
    load:()=>run(async()=>{try{emit({pending:store.read()});}catch{throw {code:'RECOVERY_STORAGE'};}await refresh();}),
    refresh:()=>run(refresh),
    select:(id:string)=>run(()=>select(id)),
    more:()=>run(async()=>{if(!state.cursor)return;const next=await transport.history(state.cursor);const map=new Map(state.history.map(x=>[x.id,x]));for(const item of next.data)map.set(item.id,item);emit({history:[...map.values()],cursor:next.cursor});}),
    generate:()=>run(async()=>{
      if(!state.ready||state.pending||state.receipt?.state==='running'||!state.draft?.topic.trim())throw {code:'INVALID_DRAFT'};
      // Use the revision the user reviewed. A concurrent save must conflict, not silently change the generation input.
      const pending={key:crypto.randomUUID(),expectedDraftRevision:state.draft.revision};
      try{store.write(pending);}catch{throw {code:'RECOVERY_STORAGE'};}
      emit({pending});
      const receipt=await send(pending);
      await accept(receipt);await context();await history();
      if(receipt.state==='completed'&&receipt.storyboardId)await select(receipt.storyboardId);
    }),
    revise:(instruction:string,sceneId?:string)=>run(async()=>{
      if(!state.ready||state.pending||state.receipt?.state==='running'||!state.draft||!state.candidate)throw {code:'INVALID_DRAFT'};
      if(!canReviseCandidate(state.candidate,state.draft))throw {code:'SOURCE_CHANGED'};
      const body=revisionRequest.safeParse({expectedDraftRevision:state.draft.revision,source:{kind:'storyboard',id:state.candidate.id,hash:state.candidate.contentHash},instruction,...(sceneId?{sceneId}:{})});
      if(!body.success)throw {code:'VALIDATION_FAILED'};
      if(sceneId&&!state.candidate.content.scenes.some(scene=>scene.id===sceneId))throw {code:'INVALID_SCENE'};
      const {expectedDraftRevision,...revision}=body.data;
      const pending={key:crypto.randomUUID(),expectedDraftRevision,revision};
      try{store.write(pending);}catch{throw {code:'RECOVERY_STORAGE'};}
      emit({pending});const receipt=await send(pending);await accept(receipt);await context();await history();
      if(receipt.state==='completed'&&receipt.storyboardId)await select(receipt.storyboardId);
    }),
    dispose(){disposed=true;},
  };
}
export function reviewTransport(projectId:string, request=fetch):ReviewTransport {
  const base=`/api/projects/${projectId}`;
  async function call(path:string, attempt?:Attempt){
    const response=await request(path,{method:attempt?'POST':'GET',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(attempt?85000:15000),
      ...(attempt?{headers:{'Content-Type':'application/json','Idempotency-Key':attempt.key},body:JSON.stringify(attempt.revision?revisionRequest.parse({...attempt.revision,expectedDraftRevision:attempt.expectedDraftRevision}):storyboardRequest.parse({expectedDraftRevision:attempt.expectedDraftRevision}))}:{})});
    const body=await response.json();if(!response.ok)throw {code:body.error?.code??'SERVICE_UNAVAILABLE'};return body;
  }
  return {
    async context(){const [project,draft]=await Promise.all([call(base),call(`${base}/draft`)]);return {title:project.data.title,draft:draft.data};},
    async latest(){return storyboardReceipt.nullable().parse((await call(`${base}/storyboard-requests/latest`)).data);},
    async create(attempt){return storyboardReceipt.parse((await call(`${base}/${attempt.revision?'revisions':'storyboards'}`,attempt)).data);},
    async history(cursor){const body=await call(`${base}/storyboards?limit=10${cursor?`&cursor=${encodeURIComponent(cursor)}`:''}`);return {data:z.array(storyboardSummary).parse(body.data),cursor:z.string().nullable().parse(body.page.nextCursor)};},
    async get(id){const value=storyboardView.parse((await call(`/api/storyboards/${id}`)).data);if(value.projectId!==projectId)throw {code:'NOT_FOUND'};return value;},
  };
}
