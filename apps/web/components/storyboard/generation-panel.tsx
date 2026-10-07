'use client';
import {useEffect,useRef,useState} from 'react';
import {Button} from '../ui';
import {generationError} from '../../src/jobs/messages';
import {generationStore,createGenerationController,generationTransport,type GenerationState} from './generation-controller';
import type {generationRequest} from '../../src/jobs/contracts';
import type {z} from 'zod';
import Link from 'next/link';
import {signInLocation} from '../../src/auth/navigation';
export function GenerationPanel({projectId,userId,input,blocked}:{projectId:string;userId:string;input:z.infer<typeof generationRequest>|null;blocked:boolean}){
 const [state,setState]=useState<GenerationState|null>(null),[confirm,setConfirm]=useState(false);const controller=useRef<ReturnType<typeof createGenerationController>|null>(null);
 const identity=JSON.stringify(input);
 useEffect(()=>{setConfirm(false);},[identity,blocked]);
 useEffect(()=>{let storage:Storage;try{storage=window.sessionStorage;}catch{setState({job:null,pending:null,busy:false,ready:false,error:'RECOVERY_STORAGE'});return;}const instance=createGenerationController(projectId,generationStore(storage,userId,projectId),generationTransport,s=>{setState(s);if(s.error==='UNAUTHENTICATED')window.location.replace(signInLocation('expired'));if(s.error==='ACCESS_DISABLED')window.location.replace('/access-help?state=disabled');});controller.current=instance;setState(instance.snapshot());void instance.load();const timer=setInterval(()=>{if(document.visibilityState==='visible')void instance.load();},3000);return()=>{clearInterval(timer);instance.dispose();controller.current=null;};},[projectId,userId]);
 const active=state?.job&&['queued','running','cancel_requested'].includes(state.job.state);
 return <section className="panel generation-panel" aria-label="Video generation"><p className="eyebrow">NEXT · VIDEO</p><h2>Bring your storyboard to life.</h2><p>Generate Daniel’s narration, synchronized motion graphics and captions from your approved version. Earlier videos stay available.</p>
 {state?.job&&<div role="status"><strong>{state.job.state==='succeeded'?'Video ready':state.job.state==='needs_input'?'Generation needs attention':state.job.state==='queued'?'Queued for generation':state.job.state==='running'?(stageLabels[state.job.stage]??'Processing'):state.job.state==='cancel_requested'?'Cancellation requested':state.job.state==='cancelled'?'Job cancelled':'Job stopped'}</strong><p>Job {state.job.id.slice(-8)} · attempt {state.job.attempt} · revision {state.job.revision}</p>{state.job.errorCode&&<p>{generationError(state.job.errorCode)}</p>}{state.job.state==='succeeded'&&<Link href={`/projects/${projectId}/video`}>Review video</Link>}</div>}
 {state?.error&&<p role="alert">{state.error==='RECOVERY_STORAGE'?'Recovery storage is unavailable. Reload after enabling browser storage.':state.error==='PROJECT_BUSY'?'Another request is running in this project.':'The request could not be completed or confirmed. Your storyboard is saved. Refresh or recover the pending request.'}</p>}
 {state?.pending?<><p>A request needs recovery. Recovering uses the original inputs and does not create a duplicate job.</p><Button disabled={state.busy} onClick={()=>void controller.current?.recover()}>Recover job request</Button></>:<>
 <Button disabled={blocked||!input||!state?.ready||state.busy||!!active||state.error==='RECOVERY_STORAGE'} onClick={()=>setConfirm(true)}>Generate video</Button>
 {confirm&&input&&!blocked&&<div className="notice" role="group" aria-label="Confirm video generation"><p>Generate approved version {input.storyboardId.slice(-8)}? Its saved content is frozen for this job. This uses ElevenLabs credits. Generating again creates new narration and may repeat charges, including after an unconfirmed earlier request.</p><Button disabled={state?.busy} onClick={()=>{setConfirm(false);void controller.current?.create({...input,acknowledgePossibleRepeat:true});}}>Confirm generation</Button><Button variant="secondary" onClick={()=>setConfirm(false)}>Keep reviewing</Button></div>}
 {state?.job?.actions.cancel&&<Button disabled={state.busy} variant="secondary" onClick={()=>void controller.current?.cancel()}>Cancel job</Button>}</>}
 <Button disabled={state?.busy} variant="secondary" onClick={()=>void controller.current?.load()}>Refresh job</Button>
 </section>;
}


const stageLabels:Record<string,string>={speech:'Creating narration',rendering:'Rendering your video',uploading:'Saving private video',checking:'Checking approved input'};
