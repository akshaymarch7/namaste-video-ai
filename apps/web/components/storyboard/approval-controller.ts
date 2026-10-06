import {z} from 'zod';
import {approvalRequest,approvalView} from '../../src/storyboards/api-contracts';
import {canReviseCandidate,type Candidate} from './controller';
import type {DraftView} from '../../src/drafts/contracts';
const attemptSchema=z.object({key:z.string().uuid(),body:approvalRequest,storyHash:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export type ApprovalAttempt=z.infer<typeof attemptSchema>;
export type Approval=z.infer<typeof approvalView>;
export type ApprovalContext={candidate:Candidate|null;draft:DraftView|null;blocked:boolean};
export type ApprovalState={ready:boolean;busy:boolean;error:string;confirmation:{candidate:Candidate;attempt:ApprovalAttempt}|null;pending:ApprovalAttempt|null;result:Approval|null};
export type ApprovalStore={read():ApprovalAttempt|null;write(value:ApprovalAttempt):void;clear():void};
export function approvalStore(storage:Storage,userId:string,projectId:string):ApprovalStore{
 const key=`nv:storyboard-approval:${encodeURIComponent(userId)}:${projectId}`;
 return {read(){const raw=storage.getItem(key);return raw?attemptSchema.parse(JSON.parse(raw)):null;},write(value){storage.setItem(key,JSON.stringify(attemptSchema.parse(value)));},clear(){storage.removeItem(key);}};
}
export function approvalEligible({candidate,draft,blocked}:ApprovalContext){return !blocked&&!!candidate&&!candidate.approvalId&&!!draft&&canReviseCandidate(candidate,draft);}
export function createApproval(projectId:string,send:(attempt:ApprovalAttempt)=>Promise<Approval>,store:ApprovalStore,publish:(state:ApprovalState)=>void){
 let disposed=false;
 let state:ApprovalState={ready:false,busy:false,error:'',confirmation:null,pending:null,result:null};
 const emit=(patch:Partial<ApprovalState>)=>{if(!disposed){state={...state,...patch};publish(state);}};
 const code=(error:unknown)=>(error as {code?:string})?.code??'CONNECTION';
 async function dispatch(attempt:ApprovalAttempt){
  emit({busy:true,error:''});
  try{
   const result=approvalView.parse(await send(attempt));
   if(result.projectId!==projectId||result.subjectId!==attempt.body.storyboardId||result.contentHash!==attempt.body.expectedContentHash||result.subjectHash!==attempt.storyHash)throw {code:'UNCONFIRMED'};
   if(disposed)return;
   try{store.clear();}catch{throw {code:'RECOVERY_STORAGE'};}
   emit({pending:null,result});
  }catch(error){
   if(disposed)return;
   const failure=code(error);
   if(['REVISION_CONFLICT','HASH_MISMATCH','SOURCE_CHANGED','PROJECT_BUSY','INVALID_DRAFT','VALIDATION_FAILED','NOT_FOUND','INVALID_ORIGIN'].includes(failure)){
    try{store.clear();emit({pending:null});}catch{emit({error:'RECOVERY_STORAGE'});return;}
   }
   emit({error:failure});
  }finally{emit({busy:false});}
 }
 return {
  snapshot:()=>state,
  load(){if(disposed||state.busy)return;try{emit({pending:store.read(),ready:true,error:''});}catch{emit({ready:false,error:'RECOVERY_STORAGE'});}},
  begin(context:ApprovalContext){
   if(disposed||!state.ready||state.busy||state.pending||!approvalEligible(context))return;
   const candidate=structuredClone(context.candidate!);const draft=context.draft!;
   const attempt=attemptSchema.parse({key:crypto.randomUUID(),body:{storyboardId:candidate.id,expectedContentHash:candidate.contentHash,expectedDraftRevision:draft.revision,expectedDraftHash:draft.contentHash,approve:true},storyHash:candidate.storyHash});
   emit({confirmation:{candidate,attempt},error:'',result:null});
  },
  cancel(){if(!disposed&&!state.busy)emit({confirmation:null});},
  async confirm(context:ApprovalContext){
   if(disposed||state.busy||state.pending||!state.confirmation)return;
   const {attempt}=state.confirmation;
   if(!approvalEligible(context)||context.candidate!.id!==attempt.body.storyboardId||context.candidate!.contentHash!==attempt.body.expectedContentHash||context.draft!.revision!==attempt.body.expectedDraftRevision||context.draft!.contentHash!==attempt.body.expectedDraftHash){emit({confirmation:null,error:'REVIEW_CHANGED'});return;}
   try{store.write(attempt);}catch{emit({error:'RECOVERY_STORAGE'});return;}
   emit({pending:attempt,confirmation:null});await dispatch(attempt);
  },
  async recover(){if(!disposed&&state.ready&&!state.busy&&state.pending)await dispatch(state.pending);},
  dispose(){disposed=true;},
 };
}
export function approvalTransport(projectId:string,request=fetch){
 return async(attempt:ApprovalAttempt)=>{
  const response=await request(`/api/projects/${projectId}/storyboard-approvals`,{method:'POST',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json','Idempotency-Key':attempt.key},body:JSON.stringify(approvalRequest.parse(attempt.body))});
  const body=await response.json();if(!response.ok)throw {code:body.error?.code??'SERVICE_UNAVAILABLE'};
  return approvalView.parse(body.data);
 };
}
