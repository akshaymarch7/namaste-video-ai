'use client';
import {useEffect,useRef,useState} from 'react';
import {Button} from '../ui';
import {signInLocation} from '@/src/auth/navigation';
import {attemptStore,createReview,reviewTransport,type ReviewState} from './controller';
import {SceneVisual} from './scene-visual';
const messages:Record<string,string>={
  CONNECTION:'We couldn’t confirm the result. Check the request to recover it without starting another generation.',
  SERVICE_UNAVAILABLE:'The result could not be confirmed. Check the request again shortly.',
  RECOVERY_STORAGE:'Your browser could not retain request recovery information. Enable session storage and reload before generating.',
  REVISION_CONFLICT:'Your idea changed in another tab. Refresh to review the saved topic before generating.',
  PROJECT_BUSY:'This project has another request in progress. Check its status, or return to Idea to finish brainstorming.',
  INVALID_DRAFT:'Save a topic on the Idea page before generating a storyboard.',
  VOICE_UNAVAILABLE:'Choose the available narrator on the Idea page first.',
  AI_NOT_CONFIGURED:'The AI service needs server configuration. Your idea is saved.',
  PROVIDER_AUTHORIZATION:'The AI service needs an administrator to check its key permissions.',
  PROVIDER_CONFIGURATION:'The AI service needs an administrator to check its model configuration.',
  PROVIDER_LIMIT:'The AI service has reached its request or credit limit. Try a new request later.',
  PROVIDER_UNAVAILABLE:'The AI service is unavailable. Your saved candidates are still here.',
  STORYBOARD_INVALID:'The AI couldn’t produce a valid storyboard this time. You can try a new generation.',
  PROVIDER_RESPONSE_INVALID:'The AI returned an incomplete response. You can try a new generation.',
  PLANNING_DEADLINE:'Planning reached its three-minute limit. Your idea and earlier candidates are saved.',
  PROVIDER_OUTCOME_UNKNOWN:'The previous outcome is unknown. A new generation may use provider credits again.',
  NOT_FOUND:'This project or storyboard is no longer available in your workspace.',
  INVALID_CURSOR:'This history page has expired. Refresh the list to continue.',
};
export function StoryboardReview({projectId,userId,name}:{projectId:string;userId:string;name:string}){
  const [state,setState]=useState<ReviewState|null>(null),[sceneIndex,setSceneIndex]=useState(0),[tab,setTab]=useState<'scenes'|'script'>('scenes');
  const controller=useRef<ReturnType<typeof createReview>|null>(null);
  useEffect(()=>{
    let active=true;
    try{
      const instance=createReview(reviewTransport(projectId),attemptStore(window.sessionStorage,userId,projectId),value=>{
        if(!active)return;setState(value);
        if(value.error==='UNAUTHENTICATED')window.location.replace(signInLocation('expired'));
        if(value.error==='ACCESS_DISABLED')window.location.replace('/access-help?state=disabled');
      });controller.current=instance;setState(instance.snapshot());void instance.load();
      return()=>{active=false;instance.dispose();controller.current=null;};
    }catch{setState({busy:false,ready:false,error:'RECOVERY_STORAGE',draft:null,title:'',receipt:null,candidate:null,history:[],cursor:null,pending:null});}
    return()=>{active=false;};
  },[projectId,userId]);
  useEffect(()=>{setSceneIndex(0);},[state?.candidate?.id]);
  useEffect(()=>{
    if(state?.receipt?.state!=='running'&&!state?.pending)return;
    const timer=setInterval(()=>{if(document.visibilityState==='visible')void controller.current?.refresh();},2500);
    return()=>clearInterval(timer);
  },[state?.receipt?.state,Boolean(state?.pending)]);
  const progress=state?.receipt?.stage;
  const progressText=progress==='queued'?'Your storyboard is queued…':progress==='repairing'?(state?.receipt?.issueCodes?.includes('DURATION_ESTIMATE_OUT_OF_RANGE')?'Adjusting narration length…':'Refining the scenes and motion cues…'):progress==='retrying'?'The AI service is busy. Retrying shortly…':progress==='checking'?'Checking your storyboard…':'Planning your scenes and narration…';
  const candidate=state?.candidate, scene=candidate?.content.scenes[Math.min(sceneIndex,(candidate?.content.scenes.length??1)-1)];
  const pending=Boolean(state?.pending||state?.receipt?.state==='running');
  const blocked=!state?.ready||state.busy||pending||!state.draft?.topic.trim()||state.error==='NOT_FOUND'||state.error==='RECOVERY_STORAGE';
  const stale=candidate&&(candidate.stale||candidate.sourceDraftRevision!==state?.draft?.revision);
  return <div className="idea-shell" data-private-focus-scope>
    <header className="idea-header"><a className="brand" href="/" aria-label="NamasteVideo home"><span className="brand-mark" aria-hidden="true">▶</span><span>NamasteVideo<span className="accent">.ai</span></span></a><a className="idea-back" href="/projects">← My videos</a><span className="idea-account">{name}</span></header>
    <main id="main" className="story-main"><div className="idea-context"><p className="idea-project">{state?.title||'Your project'}</p><ol className="idea-steps" aria-label="Video workflow"><li><a href={`/projects/${projectId}/idea`}><span>01</span> Idea</a></li><li aria-current="step"><span>02</span> Storyboard</li><li><span>03</span> Video</li><li><span>04</span> Publish</li></ol></div>
      <div className="story-heading"><div><p className="eyebrow">THE STORY BEFORE THE SCREEN</p><h1>Give your idea <span className="accent">a shape.</span></h1><p>See the scenes. Read the script. Find the story you want to tell.</p></div><a className="button button--secondary" href={`/projects/${projectId}/idea`}>← Edit idea</a></div>
      <section className="story-command" aria-label="Generate storyboard"><div><span className="eyebrow">SAVED TOPIC</span><p>{state?.draft?.topic||'Start by saving a topic on the Idea page.'}</p><small>English · Daniel test voice · 60–90 seconds estimated</small></div><div className="story-command-actions"><Button disabled={blocked} onClick={()=>void controller.current?.generate()}>{state?.busy&&state.pending?'Creating storyboard…':candidate?'Generate another':'Create storyboard'}</Button><Button variant="secondary" disabled={!state||state.busy} onClick={()=>void controller.current?.refresh()}>{state?.busy?'Checking…':pending?'Check request':'Refresh'}</Button></div></section>
      <div aria-live="polite" className="story-status">{pending?<p>{progressText} We’ll check progress automatically. Up to four attempts, within three minutes.</p>:state?.busy?<p>Loading your saved storyboard…</p>:null}</div>
      {state?.error&&<div role="alert" className="notice notice--error"><p>{messages[state.error]??'Couldn’t complete this action. Refresh to check your saved work.'}</p>{state.error==='RECOVERY_STORAGE'&&<a href={`/projects/${projectId}/storyboard`}>Reload page</a>}</div>}
      {state?.receipt&&['failed','unknown'].includes(state.receipt.state)&&<div className="notice notice--error" role="status"><p>{state.receipt.errorCode==='STORYBOARD_INVALID'?(state.receipt.issueCodes?.includes('DURATION_ESTIMATE_OUT_OF_RANGE')?'We couldn’t get the narration within the target length after four attempts. Your idea and earlier candidates are saved. Try again or edit the topic.':'We couldn’t validate the scene structure or motion cues after four attempts. Your idea and earlier candidates are saved. Try again or edit the topic.'):messages[state.receipt.errorCode??'']??'Generation did not complete. Your saved candidates have not changed.'}</p></div>}
      {stale&&<div className="story-stale" role="status">Earlier idea version · Your saved idea has changed since this storyboard was created. Review it as an earlier candidate, or generate from your current topic.</div>}
      {candidate&&scene?<div className="story-layout"><section className="story-workbench" aria-label="Storyboard candidate"><div className="story-title"><div><p className="eyebrow">STORYBOARD CANDIDATE · NOT APPROVED</p><h2>{candidate.title}</h2></div><span className="story-duration">~{candidate.estimatedDurationSeconds}s <small>estimated</small></span></div><p className="story-objective">{candidate.content.learningObjective}</p><div className="story-view-tabs" aria-label="Review view"><Button variant="secondary" aria-pressed={tab==='scenes'} onClick={()=>setTab('scenes')}>Scene by scene</Button><Button variant="secondary" aria-pressed={tab==='script'} onClick={()=>setTab('script')}>Full script</Button><span>{candidate.content.scenes.length} scenes · {candidate.wordCount} words</span></div>
        {tab==='scenes'?<><nav className="scene-selector" aria-label="Select scene">{candidate.content.scenes.map((item,index)=><button key={item.id} aria-pressed={sceneIndex===index} onClick={()=>setSceneIndex(index)}><span>{String(index+1).padStart(2,'0')}</span>{item.title}</button>)}</nav><article className="scene-detail" key={`${candidate.id}-${scene.id}`}><div className="scene-preview"><div className="scene-preview-top"><span>SCENE {String(sceneIndex+1).padStart(2,'0')}</span><span>Storyboard schematic</span></div><p className="scene-kicker">{scene.kicker}</p><h3>{scene.title}</h3><SceneVisual visual={scene.visual}/><p className="scene-preview-foot">Layout concept · not a rendered video</p></div><div className="scene-narration"><p className="eyebrow">NARRATION · DANIEL</p><h3>What your audience hears</h3><p className="spoken-text">{scene.narration}</p><details><summary>Motion cues · {scene.events.length}</summary><ul>{scene.events.map(event=><li key={event.id}><strong>{event.action}</strong> at “{event.cue.phrase}”{event.cue.occurrence>1?` (occurrence ${event.cue.occurrence})`:''}</li>)}</ul><p className="hint">Cues follow narration. Final timing will be measured when audio is generated.</p></details>{scene.pronunciation.length>0&&<details><summary>Pronunciation notes</summary><ul>{scene.pronunciation.map((p,i)=><li key={i}>“{p.phrase}” → “{p.spokenAs}” (occurrence {p.occurrence})</li>)}</ul></details>}</div></article></>:<div className="story-script">{candidate.content.scenes.map((item,index)=><article key={item.id}><h3><span>{String(index+1).padStart(2,'0')}</span>{item.title}</h3><p>{item.narration}</p></article>)}</div>}
        <footer className="story-review-note"><strong>A first draft, ready for your eye.</strong><p>Check the facts, wording and visual logic. These are schematic scenes and estimated timings. Text editing and approval will be added in the next stages.</p>{candidate.content.sources.length>0&&<details><summary>Source notes · {candidate.content.sources.length}</summary>{candidate.content.sources.map(source=><div key={source.id}><strong>{source.kind==='provided_notes'?'From your supplied notes':'Illustrative · not evidence'}</strong><p>{source.text}</p></div>)}</details>}</footer></section>
        <aside className="story-history"><History state={state!} select={id=>void controller.current?.select(id)} more={()=>void controller.current?.more()}/></aside></div>:state?.ready&&!state.busy?<section className="story-empty"><span aria-hidden="true">▤</span><h2>Your story starts with a scene.</h2><p>Create a storyboard from your saved idea. Your script and visual plan will appear together here.</p><p className="hint">Each generation saves a separate candidate. Your idea stays unchanged.</p></section>:null}
    </main><footer className="idea-footer">Your storyboards stay in your personal workspace.</footer>
  </div>;
}
function History({state,select,more}:{state:ReviewState;select:(id:string)=>void;more:()=>void}){
 return <section aria-label="Saved candidates"><p className="eyebrow">EXPLORE YOUR VERSIONS</p><h2>Saved candidates</h2><p>Compare your earlier directions. Opening one doesn’t apply or approve it.</p><ul>{state.history.map(item=><li key={item.id}><button disabled={state.busy} aria-pressed={item.id===state.candidate?.id} onClick={()=>select(item.id)}><strong>{item.title}</strong><span>{new Date(item.createdAt).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})} · ~{item.estimatedDurationSeconds}s</span><small>{item.sourceDraftRevision!==state.draft?.revision?'Earlier idea version':'Current idea version'}</small></button></li>)}</ul>{state.cursor&&<Button variant="secondary" disabled={state.busy} onClick={more}>Load older candidates</Button>}</section>;
}
