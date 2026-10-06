'use client';
import {useEffect,useRef,useState} from 'react';
import {Button} from '../ui';
import {signInLocation} from '../../src/auth/navigation';
import {approvalEligible,approvalStore,approvalTransport,createApproval,type ApprovalState,type ApprovalContext} from './approval-controller';
const errors:Record<string,string>={
 REVIEW_CHANGED:'The version or saved draft changed during review. Refresh, then review it again.',
 REVISION_CONFLICT:'Your saved draft changed. Refresh and review the current version before approving.',
 HASH_MISMATCH:'The saved draft changed. Refresh before reviewing approval again.',
 SOURCE_CHANGED:'This version no longer matches your saved work. Save edited changes as a version, or generate a current storyboard.',
 INVALID_DRAFT:'This storyboard did not pass validation. Resolve the issues and review a new saved version.',
 PROJECT_BUSY:'Another request is running for this project. Wait for it to finish, then review approval again.',
 RECOVERY_STORAGE:'Browser recovery storage is unavailable. Enable session storage and reload. No new approval can be submitted until recovery is available.',
 VALIDATION_FAILED:'Approval details could not be validated. Refresh and review the saved version.',
 NOT_FOUND:'This storyboard or project is no longer available.',
};
export function ApprovalPanel({projectId,userId,context,onLocked,onApproved}:{projectId:string;userId:string;context:ApprovalContext;onLocked:(value:boolean)=>void;onApproved:(id:string)=>void}){
 const [state,setState]=useState<ApprovalState|null>(null);
 const controller=useRef<ReturnType<typeof createApproval>|null>(null);
 const callbacks=useRef({onLocked,onApproved});callbacks.current={onLocked,onApproved};
 const current=useRef(context);current.current=context;
 const focus=useRef<HTMLHeadingElement>(null),trigger=useRef<HTMLButtonElement>(null),statusFocus=useRef<HTMLDivElement>(null);
 const hadConfirmation=useRef(false);
 useEffect(()=>{
  const storage={getItem:(k:string)=>window.sessionStorage.getItem(k),setItem:(k:string,v:string)=>window.sessionStorage.setItem(k,v),removeItem:(k:string)=>window.sessionStorage.removeItem(k)} as Storage;
  let lastResult:string|null=null;
  const instance=createApproval(projectId,approvalTransport(projectId),approvalStore(storage,userId,projectId),value=>{
   setState(value);callbacks.current.onLocked(!value.ready||value.busy||!!value.pending||!!value.confirmation);
   if(value.error==='UNAUTHENTICATED')window.location.replace(signInLocation('expired'));
   if(value.error==='ACCESS_DISABLED')window.location.replace('/access-help?state=disabled');
   if(value.result&&lastResult!==value.result.id){lastResult=value.result.id;callbacks.current.onApproved(value.result.subjectId);}
  });controller.current=instance;instance.load();
  return()=>{instance.dispose();controller.current=null;};
 },[projectId,userId]);
 useEffect(()=>{if(state?.confirmation)focus.current?.focus();else if(hadConfirmation.current&&!state?.pending)trigger.current?.focus();hadConfirmation.current=!!state?.confirmation;},[state?.confirmation,state?.pending]);
 useEffect(()=>{if(state?.pending||state?.result)statusFocus.current?.focus();},[state?.pending,state?.result]);
 const candidate=context.candidate;
 function cancel(){controller.current?.cancel();}
 return <section className="story-approval" aria-label="Storyboard approval" data-private-focus-scope>
  <p className="eyebrow">READY FOR YOUR SIGN-OFF</p><h2>Approve this storyboard</h2>
  <p>Review the script, facts, visuals, pronunciation and motion cues. Approval belongs only to the selected saved version. Rendering and publishing are separate steps.</p>
  {candidate?.approvalId&&<p className="notice" role="status">This saved version is approved. Later working-copy edits and other versions are not covered.{candidate.stale?' Your draft has changed since this version was created.':''}</p>}
  {state?.result&&<div ref={statusFocus} tabIndex={-1} role="status">Approval confirmed for saved version {state.result.subjectId.slice(-8)} on {new Date(state.result.approvedAt).toLocaleString('en-IN')}. No video generation was started.{candidate?.id!==state.result.subjectId?' Open that version in history to review it.':''}</div>}
  {state?.pending?<div ref={statusFocus} tabIndex={-1} className="notice" role="status"><strong>{state.busy?'Checking approval…':'Approval outcome unconfirmed'}</strong><p>Saved version {state.pending.body.storyboardId.slice(-8)} · reviewed draft {state.pending.body.expectedDraftRevision}. Recover the original request, even if your draft changed. This will not approve another version.</p><Button disabled={state.busy} onClick={()=>void controller.current?.recover()}>Recover approval</Button></div>:state?.confirmation?<div className="notice story-approval-confirm" role="region" aria-labelledby="approval-confirm-title" onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();cancel();}}}>
   <h3 id="approval-confirm-title" ref={focus} tabIndex={-1}>Approve “{state.confirmation.candidate.title}”?</h3>
   <p>Saved version {state.confirmation.candidate.id.slice(-8)} · {state.confirmation.candidate.content.scenes.length} scenes · ~{state.confirmation.candidate.estimatedDurationSeconds}s · English · Daniel test voice</p>
   <p>I have reviewed this version’s script, visuals, pronunciation and motion cues. My approval does not cover future changes.</p>
   <Button disabled={state.busy||context.blocked} onClick={()=>void controller.current?.confirm(current.current)}>Confirm storyboard approval</Button><Button variant="secondary" onClick={cancel}>Cancel</Button>
  </div>:<><button className="button button--primary" type="button" ref={trigger} disabled={!state?.ready||state.busy||!approvalEligible(context)} onClick={()=>controller.current?.begin(current.current)}>Review approval</button>{!candidate?<p className="hint">Select a saved storyboard to review.</p>:!candidate.approvalId&&(context.blocked?<p className="hint">Finish the current request and save or resolve working-copy changes first.</p>:!approvalEligible(context)?<p className="hint">Save and validate your edits, then choose Save edited version before approving. If your idea changed, generate a current storyboard.</p>:null)}</>}
  {state?.error&&<p role="alert" className="notice notice--error">{errors[state.error]??'We couldn’t confirm approval. Recover the saved request; your storyboard is preserved.'}</p>}
 </section>;
}
