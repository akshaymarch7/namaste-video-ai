'use client';
import {useEffect,useRef,useState} from 'react';
import {Button} from '../ui';
import {generationStore,createGenerationController,generationTransport,type GenerationState} from './generation-controller';
import type {generationRequest} from '../../src/jobs/contracts';
import type {z} from 'zod';
import {signInLocation} from '../../src/auth/navigation';
export function GenerationPanel({projectId,userId,input,blocked}:{projectId:string;userId:string;input:z.infer<typeof generationRequest>|null;blocked:boolean}){
 const [state,setState]=useState<GenerationState|null>(null),[confirm,setConfirm]=useState(false);const controller=useRef<ReturnType<typeof createGenerationController>|null>(null);
 const identity=JSON.stringify(input);
 useEffect(()=>{setConfirm(false);},[identity,blocked]);
 useEffect(()=>{let storage:Storage;try{storage=window.sessionStorage;}catch{setState({job:null,pending:null,busy:false,ready:false,error:'RECOVERY_STORAGE'});return;}const instance=createGenerationController(projectId,generationStore(storage,userId,projectId),generationTransport,s=>{setState(s);if(s.error==='UNAUTHENTICATED')window.location.replace(signInLocation('expired'));if(s.error==='ACCESS_DISABLED')window.location.replace('/access-help?state=disabled');});controller.current=instance;setState(instance.snapshot());void instance.load();const timer=setInterval(()=>{if(document.visibilityState==='visible')void instance.load();},3000);return()=>{clearInterval(timer);instance.dispose();controller.current=null;};},[projectId,userId]);
 const active=state?.job&&['queued','running','cancel_requested'].includes(state.job.state);
 return <section className="panel generation-panel" aria-label="Video job preparation"><p className="eyebrow">NEXT · VIDEO</p><h2>Prepare your generation job.</h2><p>Save an approved storyboard into a durable job. Video rendering is not connected yet: this checks the saved input, then stops with “Renderer not connected”. It does not create audio or video.</p>
 {state?.job&&<div role="status"><strong>{state.job.state==='needs_input'?'Renderer not connected':state.job.state==='queued'?'Waiting for the generation worker':state.job.state==='running'?'Checking approved input':state.job.state==='cancel_requested'?'Cancellation requested':state.job.state==='cancelled'?'Job cancelled':'Job stopped'}</strong><p>Job {state.job.id.slice(-8)} · attempt {state.job.attempt} · revision {state.job.revision}</p>{state.job.errorCode&&state.job.errorCode!=='RENDERER_NOT_CONNECTED'&&<p>{state.job.errorCode==='QUEUE_EXPIRED'?'The job expired before it started.':'The job stopped safely. Refresh before preparing another job.'}</p>}</div>}
 {state?.error&&<p role="alert">{state.error==='RECOVERY_STORAGE'?'Recovery storage is unavailable. Reload after enabling browser storage.':state.error==='PROJECT_BUSY'?'Another request is running in this project.':'The request could not be completed or confirmed. Your storyboard is saved. Refresh or recover the pending request.'}</p>}
 {state?.pending?<><p>A request needs recovery. Recovering uses the original inputs and does not create a duplicate job.</p><Button disabled={state.busy} onClick={()=>void controller.current?.recover()}>Recover job request</Button></>:<>
 <Button disabled={blocked||!input||!state?.ready||state.busy||!!active||state.error==='RECOVERY_STORAGE'} onClick={()=>setConfirm(true)}>Prepare approved storyboard</Button>
 {confirm&&input&&!blocked&&<div className="notice" role="group" aria-label="Confirm job preparation"><p>Prepare approved version {input.storyboardId.slice(-8)}? Its saved content is frozen for this job. No video will be rendered in this release.</p><Button disabled={state?.busy} onClick={()=>{setConfirm(false);void controller.current?.create(input);}}>Confirm preparation</Button><Button variant="secondary" onClick={()=>setConfirm(false)}>Keep reviewing</Button></div>}
 {state?.job?.actions.cancel&&<Button disabled={state.busy} variant="secondary" onClick={()=>void controller.current?.cancel()}>Cancel job</Button>}</>}
 <Button disabled={state?.busy} variant="secondary" onClick={()=>void controller.current?.load()}>Refresh job</Button>
 </section>;
}
