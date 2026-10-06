'use client';
import {useState} from 'react';
import {Button} from '../ui';
import {canReviseCandidate,type ReviewState} from './controller';
export function RevisionPanel({state,editingBlocked,revise}:{state:ReviewState;editingBlocked:boolean;revise:(instruction:string,sceneId?:string)=>void}){
 const [instruction,setInstruction]=useState(''),[scope,setScope]=useState('');
 const candidate=state.candidate;if(!candidate)return null;
 const pending=!!state.pending||state.receipt?.state==='running';
 const eligible=!!state.draft&&canReviseCandidate(candidate,state.draft);
 const invalid=instruction.trim().length===0||instruction.trim().length>4000;
 return <section className="story-revision" aria-label="Revise selected candidate">
  <div><p className="eyebrow">REFINE YOUR STORY</p><h2>What would you change?</h2><p>Revise “{candidate.title}”. You’ll review a new candidate before replacing your working copy.</p></div>
  <div className="idea-field"><label htmlFor="revision-scope">Change scope</label><select id="revision-scope" value={scope} disabled={pending||state.busy} onChange={e=>setScope(e.target.value)}><option value="">Whole storyboard</option>{candidate.content.scenes.map((scene,i)=><option key={scene.id} value={scene.id}>Scene {i+1} · {scene.title}</option>)}</select></div>
  <div className="idea-field"><label htmlFor="revision-instruction">Your revision request</label><textarea id="revision-instruction" rows={4} value={instruction} disabled={pending||state.busy} aria-describedby="revision-help revision-count" aria-invalid={instruction.trim().length>4000} placeholder="Make the opening easier to understand. Use a familiar example." onChange={e=>setInstruction(e.target.value)}/><p id="revision-count" className="idea-count">{instruction.trim().length} / 4,000</p></div>
  <p id="revision-help">Scene-specific requests preserve every other scene. Scene order/count, language and voice stay unchanged. Requests are saved privately for recovery.</p>
  {editingBlocked?<p role="status">Save or resolve your working-copy edits before requesting a revision.</p>:!eligible?<p role="status">This candidate differs from the current draft. Revisions of manual edits are not available yet. Your edits remain saved; don’t replace them unless you intend to discard them.</p>:null}
  <Button disabled={invalid||pending||state.busy||editingBlocked||!eligible||!state.ready} onClick={()=>revise(instruction,scope||undefined)}>{pending?'Request in progress…':'Create revised candidate'}</Button>
  {state.pending?.revision&&<p role="status">Recovering the saved request: “{state.pending.revision.instruction}”. Use Check request above; it won’t submit a second job.</p>}
 </section>;
}
