'use client';
import {useEffect,useRef,useState} from 'react';
import {Button} from '../ui';
import {SceneVisual} from './scene-visual';
import {planText} from './plan-comparison';
import {createEditor,editorTransport,editStore,editorDirty,type EditorState} from './editor-controller';
import {inspectEditablePlan} from '../../src/storyboards/editable-contract';
import {signInLocation} from '../../src/auth/navigation';
import type {Candidate} from './controller';
function issueText(issue:{path:string;code:string}){
 const match=/^scenes\.(\d+)/.exec(issue.path),where=match?`Scene ${Number(match[1])+1}: `:'';
 const messages:Record<string,string>={MISSING_CUE:'a motion cue no longer matches the narration. Update its phrase or occurrence.',DURATION_ESTIMATE_OUT_OF_RANGE:'aim for 150–225 spoken words across the storyboard (about 60–90 seconds).',PLAN_STALE:'the idea changed; generate and apply a current storyboard before approval.',MISSING_PHRASE:'a pronunciation phrase no longer matches the narration.',UNSUPPORTED_SOURCE:'a source excerpt no longer matches the saved notes.'};
 if(messages[issue.code])return where+messages[issue.code];
 const field=issue.path.includes('narration')?'narration':issue.path.includes('visual')?'on-screen text':issue.path.includes('title')?'title':issue.path.includes('kicker')?'kicker':'text or motion settings';
 return `${where}Check the ${field} for missing content or values outside the allowed limits.`;
}
const errors:Record<string,string>={INVALID_DRAFT:'Resolve the storyboard validation issues before saving an edited version.',PLAN_STALE:'Your idea changed. Generate and review a current storyboard first.',PROJECT_BUSY:'Wait for the active request before saving an edited version.',REVISION_CONFLICT:'The saved draft changed. Compare both versions before choosing what to keep.',SOURCE_CHANGED:'A different candidate is now the working copy. Keep a copy of your text before loading the saved version.',VALIDATION_FAILED:'Some fields exceed their limits or have invalid values. Your input is still here.',RECOVERY_STORAGE:'Browser recovery storage is unavailable. Enable session storage before saving.',NOT_FOUND:'This project is no longer available.',HASH_MISMATCH:'Saved content changed. Check the saved version before retrying.',UNSAVED:'Save or resolve your working copy before replacing it.'};
export function TextEditor({projectId,userId,candidate,onSaved,onEditingChange,onSnapshot,snapshotBlocked=false}:{projectId:string;userId:string;candidate:Candidate|null;onSaved:()=>void;onEditingChange?:(blocked:boolean)=>void;onSnapshot?:(id:string)=>void;snapshotBlocked?:boolean}){
 const [state,setState]=useState<EditorState|null>(null),[index,setIndex]=useState(0),[confirm,setConfirm]=useState<{id:string;hash:string;title:string}|null>(null);
 const snapshotNotify=useRef(onSnapshot);snapshotNotify.current=onSnapshot;
 useEffect(()=>{if(state?.snapshotId)snapshotNotify.current?.(state.snapshotId);},[state?.snapshotId]);
 const notify=useRef(onSaved);notify.current=onSaved;
 const editingNotify=useRef(onEditingChange);editingNotify.current=onEditingChange;
 useEffect(()=>{editingNotify.current?.(!state?.saved||state.busy||editorDirty(state)||!!state.remote);},[state]);
 const ref=useRef<ReturnType<typeof createEditor>|null>(null);
 useEffect(()=>{
  const controller=createEditor(editorTransport(projectId),editStore({getItem:k=>window.sessionStorage.getItem(k),setItem:(k,v)=>window.sessionStorage.setItem(k,v),removeItem:k=>window.sessionStorage.removeItem(k)} as Storage,userId,projectId),s=>{setState(s);if(s.error==='UNAUTHENTICATED')window.location.replace(signInLocation('expired'));if(s.error==='ACCESS_DISABLED')window.location.replace('/access-help?state=disabled');});ref.current=controller;void controller.load();
  const guard=(e:BeforeUnloadEvent)=>{if(editorDirty(controller.snapshot())){e.preventDefault();e.returnValue='';}};
  window.addEventListener('beforeunload',guard);
  return()=>{controller.dispose();ref.current=null;window.removeEventListener('beforeunload',guard);};
 },[projectId,userId]);
 useEffect(()=>{if(state?.saved)notify.current();},[state?.saved?.revision]);
 useEffect(()=>{setIndex(0);},[state?.saved?.sourceStoryboardId]);
 const plan=state?.local,scene=plan?.scenes[Math.min(index,plan.scenes.length-1)],dirty=state?editorDirty(state):false;
 const locked=!state?.saved||state.busy||!!state.pending||!!state.remote||state.error==='NOT_FOUND';
 const validation=plan&&state?.saved?inspectEditablePlan(plan,state.saved,state.saved.planStale):null;
 function change(path:(string|number)[],value:string|number){if(!plan)return;const next=structuredClone(plan);let node:any=next;for(const key of path.slice(0,-1))node=node[key];node[path.at(-1)!]=value;ref.current?.edit(next);}
 function field(label:string,path:(string|number)[],value:string,max:number,rows=1){const id=`edit-${path.join('-')}`;return <div className="idea-field" key={id}><label htmlFor={id}>{label}</label><textarea id={id} rows={rows} value={value} disabled={locked} aria-invalid={value.length>max} aria-describedby={`${id}-limit`} onChange={e=>change(path,e.target.value)}/><p id={`${id}-limit`} className={value.length>max?'idea-count idea-invalid':'idea-count'}>{value.length} / {max}{value.length>max?' · Shorten to save':''}</p></div>;}
 const base=['scenes',Math.min(index,(plan?.scenes.length??1)-1)] as (string|number)[];
 return <section className="story-editor" aria-label="Working storyboard" data-private-focus-scope>
  <div className="story-editor-heading"><div><p className="eyebrow">MAKE IT YOURS</p><h2>Working storyboard</h2><p>Edit your script and on-screen text. Your generated candidates stay unchanged.</p></div><span role="status">{state?.busy?'Saving or checking…':state?.pending?'Save outcome unconfirmed':state?.remote?'Review saved version':dirty?'Unsaved changes':state?.saved?'All changes saved':'Loading…'}</span></div>
  <div className="story-editor-actions"><Button disabled={!candidate||locked||dirty} onClick={()=>candidate&&setConfirm({id:candidate.id,hash:candidate.contentHash,title:candidate.title})}>{plan?'Replace from selected candidate':'Edit selected candidate'}</Button><Button variant="secondary" disabled={state?.busy} onClick={()=>void (state?.saved?ref.current?.refresh():ref.current?.load())}>{state?.pending?'Recover pending save':'Check saved version'}</Button></div>
  {confirm&&<div className="notice story-replace" role="region" aria-label="Confirm working copy replacement"><h3>{plan?'Replace your working copy?':'Start editing this candidate?'}</h3><p>“{confirm.title}” will become your working copy.{plan?' This replaces the saved edits in your current working copy.':''} Generated candidates remain available.</p><Button disabled={locked||dirty} onClick={()=>{setConfirm(null);void ref.current?.apply(confirm.id,confirm.hash);}}>Confirm {plan?'replacement':'editable copy'}</Button><Button variant="secondary" onClick={()=>setConfirm(null)}>Cancel</Button></div>}
  {state?.error&&<div role="alert" className="notice notice--error"><p>{errors[state.error]??'Couldn’t confirm this action. Your input is retained; recover the pending save or check the saved version.'}</p></div>}
  {state?.remote&&<section className="notice" aria-label="Compare storyboard versions"><h3>Choose what to keep</h3><p>Keeping your text replaces the saved working plan, while preserving the latest idea fields.</p><div className="idea-compare-columns"><div><strong>Your working copy</strong><pre>{planText(state.local)}</pre></div><div><strong>Saved working copy · revision {state.remote.revision}</strong><pre>{planText(state.remote.editablePlan)}</pre></div></div>{state.remote.sourceStoryboardId!==state.saved?.sourceStoryboardId&&<p>A different candidate was selected elsewhere. Copy any local text you need before loading that version.</p>}<Button disabled={state.busy||!plan||state.remote.sourceStoryboardId!==state.saved?.sourceStoryboardId} onClick={()=>void ref.current?.keepLocal()}>Keep my text & save</Button><Button variant="secondary" disabled={state.busy} onClick={()=>ref.current?.useRemote()}>Use saved version</Button></section>}
  {plan&&scene?<>
   {state?.saved?.planStale&&<p className="story-stale">Your saved idea changed. These edits are preserved, but you’ll need a current storyboard before approval.</p>}
   <div className="story-editor-meta">{field('Storyboard title',['title'],plan.title,100)}{field('Learning objective',['learningObjective'],plan.learningObjective,500,2)}</div>
   <nav className="scene-selector" aria-label="Edit scene">{plan.scenes.map((s,i)=><button key={s.id} aria-pressed={i===index} onClick={()=>setIndex(i)}><span>{String(i+1).padStart(2,'0')}</span>{s.title||'Untitled scene'}</button>)}</nav>
   <div className="story-editor-grid"><div>
    {field('Scene title',[...base,'title'],scene.title,65)}{field('Scene kicker',[...base,'kicker'],scene.kicker,35)}{field('Narration',[...base,'narration'],scene.narration,1400,7)}
    <h3>On-screen text</h3>
    {scene.visual.component==='flow'?scene.visual.data.steps.map((s,i)=>field(`Step ${i+1}`,[...base,'visual','data','steps',i,'label'],s.label,30)):scene.visual.component==='comparison'?(['left','right'] as const).map(side=>{const v=scene.visual;if(v.component!=='comparison')return null;return <div key={side}>{field(`${side} heading`,[...base,'visual','data',side,'heading'],v.data[side].heading,18)}{v.data[side].points.map((p,i)=>field(`${side} point ${i+1}`,[...base,'visual','data',side,'points',i],p,26))}</div>;}):scene.visual.data.labels.map((v,i)=>field(`Label ${i+1}`,[...base,'visual','data','labels',i],v,30))}
    <details className="story-editor-cues"><summary>Align motion cues with your narration</summary><p>After rewriting narration, each cue must still match its spoken text exactly.</p>{scene.events.map((event,i)=><div key={event.id}>{field(`Cue ${i+1} phrase`,[...base,'events',i,'cue','phrase'],event.cue.phrase,150)}<label>Occurrence (1–20)<input type="number" min={1} max={20} value={Number.isFinite(event.cue.occurrence)?event.cue.occurrence:''} disabled={locked} onChange={e=>change([...base,'events',i,'cue','occurrence'],e.target.valueAsNumber)}/></label></div>)}{scene.pronunciation.map((p,i)=><div key={i}>{field(`Pronunciation ${i+1} phrase`,[...base,'pronunciation',i,'phrase'],p.phrase,150)}{field(`Pronunciation ${i+1} spoken as`,[...base,'pronunciation',i,'spokenAs'],p.spokenAs,150)}<label>Pronunciation occurrence (1–20)<input type="number" min={1} max={20} value={Number.isFinite(p.occurrence)?p.occurrence:''} disabled={locked} onChange={e=>change([...base,'pronunciation',i,'occurrence'],e.target.valueAsNumber)}/></label></div>)}</details>
   </div><aside><div className="scene-preview"><p className="scene-kicker">{scene.kicker}</p><h3>{scene.title||'Untitled scene'}</h3><SceneVisual visual={scene.visual}/><p className="scene-preview-foot">Working layout · not a rendered video</p></div></aside></div>
   <div className="story-edit-validation" role="status">{validation?.valid?<p>Draft checks passed. Review facts and wording; this is not approval.</p>:<><h3>Saved edits can still need attention</h3><ul>{[...new Set(validation?.issues.map(issueText))].map((message,i)=><li key={i}>{message}</li>)}</ul></>}</div>
   <div className="story-editor-save"><div><strong>Keep these edits as a version</strong><p>Save a reviewed copy for AI revisions. Your working text and earlier candidates stay intact.</p></div><Button variant="secondary" disabled={locked||dirty||snapshotBlocked||!validation?.valid} onClick={()=>void ref.current?.saveVersion()}>Save edited version</Button></div>
   <div className="story-editor-save"><p>Save when ready. Incomplete text can be saved with validation feedback.</p><Button disabled={locked||!dirty} onClick={()=>void ref.current?.save()}>Save storyboard edits</Button></div>
  </>:<p className="hint">Select a saved candidate below, then choose Edit selected candidate to begin.</p>}
 </section>;
}
