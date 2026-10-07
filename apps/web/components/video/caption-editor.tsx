'use client';
import {useEffect,useState} from 'react';
import {z} from 'zod';
import {captionView} from '../../src/videos/caption-contracts';
import {normalizeCaption,captionDisplayText,type CaptionOverride} from '../../../../src/plan-v2/caption-edits';
import type {Video} from '../../src/videos/contracts';
import {Button} from '../ui';
import {signInLocation} from '../../src/auth/navigation';
const draftSchema=z.object({hash:z.string(),values:z.record(z.string(),z.string().max(200))}).strict();
export function CaptionEditor({video,userId,blocked,onSubmit}:{video:Video;userId:string;blocked:boolean;onSubmit:(action:'captions'|'regenerate',overrides?:CaptionOverride[])=>void}){
 const [data,setData]=useState<z.infer<typeof captionView>|null>(null),[values,setValues]=useState<Record<string,string>>({}),[error,setError]=useState(''),[busy,setBusy]=useState(false),[confirm,setConfirm]=useState<'captions'|'regenerate'|null>(null),[storageFailed,setStorageFailed]=useState(false);
 const storageKey=`nv:caption-draft:${encodeURIComponent(userId)}:${video.projectId}:${video.id}`;
 useEffect(()=>{setConfirm(null);},[blocked]);
 async function load(){if(busy)return;setBusy(true);setError('');try{
  const r=await fetch(`/api/videos/${video.id}/captions`,{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(20000)}),body=await r.json();if(!r.ok)throw {code:body.error?.code};
  const next=captionView.parse(body.data);if(next.videoId!==video.id||next.renderSpecHash!==video.renderSpecHash)throw Error();
  let saved:Record<string,string>={};try{const raw=sessionStorage.getItem(storageKey);if(raw){const draft=draftSchema.parse(JSON.parse(raw));if(draft.hash===video.renderSpecHash)saved=draft.values;}}catch{setStorageFailed(true);setError('Caption draft storage is unavailable. Enable browser storage and reload before editing.');}
  setData(next);setValues(Object.fromEntries(next.scenes.flatMap(s=>s.captions.map(c=>[c.id,saved[c.id]??c.text]))));
 }catch(e){const code=(e as {code?:string}).code;if(code==='UNAUTHENTICATED')window.location.replace(signInLocation('expired'));else if(code==='ACCESS_DISABLED')window.location.replace('/access-help?state=disabled');setError('Saved caption timing or narration could not be loaded. No speech was regenerated.');}finally{setBusy(false);}}
 function change(id:string,text:string){const next={...values,[id]:text};setValues(next);setConfirm(null);try{sessionStorage.setItem(storageKey,JSON.stringify({hash:video.renderSpecHash,values:next}));setStorageFailed(false);setError('');}catch{setStorageFailed(true);setError('Your edit could not be saved in this tab. Enable browser storage before rendering.');}}
 const entries=data?.scenes.flatMap(s=>s.captions.map(c=>({scene:s,caption:c,text:values[c.id]??c.text})))??[];
 const invalid=entries.some(e=>normalizeCaption(e.text)!==normalizeCaption(e.caption.originalText));
 const changed=entries.some(e=>captionDisplayText(e.text)!==e.caption.text);
 const edits:CaptionOverride[]=entries.filter(e=>captionDisplayText(e.text)!==e.caption.originalText).map(e=>({sceneId:e.scene.sceneId,speechFingerprint:e.scene.speechFingerprint,sourceStart:e.caption.sourceStart,sourceEnd:e.caption.sourceEnd,displayText:e.text}));
 return <section className="panel caption-editor" aria-label="Revise video"><p className="eyebrow">REFINE YOUR CUT</p><h2>Make the final adjustments.</h2><p>Caption capitalization and spacing can change without new narration. For different words or punctuation, revise the storyboard and approve the new narration.</p><div className="actions"><Button variant="secondary" disabled={blocked||busy} onClick={()=>void load()}>{data?'Reload caption timing':'Edit captions'}</Button><Button variant="secondary" disabled={blocked||busy} onClick={()=>setConfirm('regenerate')}>Render again with saved narration</Button><a href={`/projects/${video.projectId}/storyboard`}>Revise narration or visuals →</a></div>
 {error&&<p role="alert">{error}</p>}{busy&&<p role="status">Loading saved captions…</p>}
 {data&&<><p className="muted">Draft edits are saved in this tab. Interior spaces are preserved; line breaks become spaces. Timing stays tied to the original audio.</p>{data.scenes.map(scene=><details key={scene.sceneId} open><summary>{scene.title}</summary>{scene.captions.map(c=><label className="caption-edit-field" key={c.id}><span>{(c.startFrame/30).toFixed(1)}–{(c.endFrame/30).toFixed(1)}s in scene</span><textarea maxLength={200} rows={2} value={values[c.id]??c.text} disabled={blocked||busy} onChange={e=>change(c.id,e.target.value)}/><small>Original: {c.originalText}</small></label>)}</details>)}
 {edits.length>100&&<p role="alert">A version supports up to 100 edited caption groups. Restore some groups before rendering.</p>}
 {invalid&&<p role="alert">This changes words or punctuation. Use “Revise narration or visuals” so the spoken audio can be updated too.</p>}
 <Button disabled={blocked||busy||storageFailed||invalid||edits.length>100||!changed} onClick={()=>setConfirm('captions')}>Render caption changes</Button></>}
 {confirm&&<div className="notice" role="group" aria-label="Confirm video revision"><h3>Create a new version?</h3><p>We will reuse verified saved narration. If it is unavailable, this request stops without another speech call. Your earlier video stays available, and the new version needs its own approval.</p><Button disabled={blocked||busy||(confirm==='captions'&&(invalid||storageFailed||edits.length>100||!changed))} onClick={()=>{onSubmit(confirm,confirm==='captions'?edits:undefined);setConfirm(null);}}>Confirm new version</Button><Button variant="secondary" disabled={blocked} onClick={()=>setConfirm(null)}>Keep editing</Button></div>}
 </section>;
}
