'use client';
import {useEffect,useRef,useState} from 'react';
import {createGenerationController,generationStore,generationTransport,type GenerationState} from '../storyboard/generation-controller';
import {Button} from '../ui';
import {signInLocation} from '../../src/auth/navigation';
export function RevisionProgress({projectId,userId,refreshKey,onReady}:{projectId:string;userId:string;refreshKey:number;onReady:()=>void}){
 const [state,setState]=useState<GenerationState|null>(null),controller=useRef<ReturnType<typeof createGenerationController>|null>(null),notify=useRef(onReady),seen=useRef('');notify.current=onReady;
 useEffect(()=>{let c:ReturnType<typeof createGenerationController>;try{c=createGenerationController(projectId,generationStore(sessionStorage,userId,projectId),generationTransport,s=>{setState(s);if(s.error==='UNAUTHENTICATED')window.location.replace(signInLocation('expired'));if(s.error==='ACCESS_DISABLED')window.location.replace('/access-help?state=disabled');if(s.job?.state==='succeeded'&&seen.current!==s.job.id){seen.current=s.job.id;notify.current();}});}catch{return;}
  controller.current=c;void c.load();const timer=setInterval(()=>{if(document.visibilityState==='visible')void c.load();},3000);return()=>{clearInterval(timer);c.dispose();};
 },[projectId,userId]);
 useEffect(()=>{void controller.current?.load();},[refreshKey]);
 if(!state?.job&&!state?.pending)return null;
 return <section className="notice" aria-label="Latest video job"><h2>Latest video job</h2><p role="status">{state?.job?.state==='succeeded'?'New version ready. Choose it from Video versions to review.':state?.job?.state==='queued'?'Waiting for the local worker.':state?.job?.state==='running'?'Preparing your next video version…':state?.job?.state==='cancelled'?'Job cancelled. Earlier versions are unchanged.':state?.job?.state==='cancel_requested'?'Cancellation requested.':'This job needs attention. Earlier versions are unchanged.'}</p>{state?.job?.errorCode&&<p>Generation stopped. For a caption revision, saved narration is required and is never automatically regenerated. Check the saved media before trying again.</p>}{state?.error&&<p role="alert">The latest job request could not be confirmed. Refresh or recover it.</p>}{state?.pending?<Button disabled={state.busy} onClick={()=>void controller.current?.recover()}>Recover job request</Button>:state?.job?.actions.cancel&&<Button variant="secondary" disabled={state.busy} onClick={()=>void controller.current?.cancel()}>Cancel job</Button>}<Button variant="secondary" disabled={state?.busy} onClick={()=>{void controller.current?.load();notify.current();}}>Refresh progress and versions</Button></section>;
}
