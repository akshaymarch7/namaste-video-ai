'use client';
import {CaptionEditor} from './caption-editor';
import {RevisionProgress} from './revision-progress';
import {useEffect,useRef,useState} from 'react';
import {z} from 'zod';
import {videoView,type Video} from '../../src/videos/contracts';
import {accessView} from '../../src/storage/contracts';
import {Button} from '../ui';
import {signInLocation} from '../../src/auth/navigation';
import {commandStore,createVideoCommands,sendVideoCommand,type CommandState} from './commands';
const listSchema=z.object({data:z.array(videoView),page:z.object({nextCursor:z.string().nullable()}),project:z.object({id:z.string(),title:z.string(),revision:z.number(),selectedVideoId:z.string().nullable(),latestReadyVideoId:z.string().nullable()})});
type Grant=z.infer<typeof accessView>;
const initial:CommandState={ready:false,busy:false,pending:null,error:'',completed:0};
export function VideoReview({projectId,userId}:{projectId:string;userId:string}){
 const [rows,setRows]=useState<Video[]>([]),[project,setProject]=useState<z.infer<typeof listSchema>['project']|null>(null),[cursor,setCursor]=useState<string|null>(null),[selected,setSelected]=useState<Video|null>(null),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [commands,setCommands]=useState(initial),[confirm,setConfirm]=useState<Video|null>(null),[reviewed,setReviewed]=useState(false);
 const [preview,setPreview]=useState<{videoId:string;grant:Grant}|null>(null),[download,setDownload]=useState<{label:string;grant:Grant}|null>(null),[expired,setExpired]=useState(false),[playable,setPlayable]=useState(false);
 const active=useRef(false),lock=useRef(false),epoch=useRef(0),player=useRef<HTMLVideoElement|null>(null),seek=useRef(0),controller=useRef<ReturnType<typeof createVideoCommands>|null>(null);
 async function call(url:string,body?:unknown){const r=await fetch(url,{method:body?'POST':'GET',cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(15000),...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const b=await r.json();if(!r.ok)throw {code:b.error?.code??'SERVICE_UNAVAILABLE'};return b;}
 function handleError(e:unknown){const code=(e as {code?:string}).code;if(code==='UNAUTHENTICATED')window.location.replace(signInLocation('expired'));else if(code==='ACCESS_DISABLED')window.location.replace('/access-help?state=disabled');setError(code==='CAPTION_MEANING_CHANGE'?'Revise spoken words or punctuation in the storyboard.':code==='PROJECT_BUSY'?'Another request is running. Wait for it or cancel the current job.':code==='SPEECH_RECOVERY_REQUIRED'?'Saved narration is unavailable. It was not regenerated. Check storage before retrying.':code==='STORAGE_NOT_CONFIGURED'?'Private playback needs administrator configuration. Your video is saved.':code==='NOT_FOUND'?'This project or video is unavailable.':code==='REVISION_CONFLICT'?'Another tab changed the selected version. Refresh and choose again.':'Could not confirm this action. Refresh or recover the pending request.');}
 async function run(work:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await work();}catch(e){if(active.current)handleError(e);}finally{lock.current=false;if(active.current)setBusy(false);}}
 function choose(v:Video){epoch.current++;player.current?.pause();setSelected(v);setPreview(null);setDownload(null);setPlayable(false);setExpired(false);setReviewed(false);setConfirm(null);seek.current=0;}
 async function load(more=false){await run(async()=>{const generation=epoch.current;const data=listSchema.parse(await call(`/api/projects/${projectId}/videos?limit=20${more&&cursor?`&cursor=${cursor}`:''}`));if(!active.current||generation!==epoch.current)return;
  let current=selected;if(!current){const id=data.project.selectedVideoId??data.project.latestReadyVideoId;current=data.data.find(v=>v.id===id)??(id?videoView.parse((await call(`/api/videos/${id}`)).data):data.data[0]??null);}
  if(!active.current||generation!==epoch.current)return;setRows(old=>more?[...new Map([...old,...data.data].map(v=>[v.id,v])).values()]:data.data);setProject(data.project);setCursor(data.page.nextCursor);setLoaded(true);
  if(current){const updated=data.data.find(v=>v.id===current!.id)??videoView.parse((await call(`/api/videos/${current.id}`)).data);if(active.current&&generation===epoch.current)setSelected(updated);}
 });}
 async function access(kind:'preview'|'video'|'captions'){
  const v=selected;if(!v)return;const generation=epoch.current;
  await run(async()=>{const grant=accessView.parse((await call(`/api/assets/${kind==='captions'?v.captionsAssetId:v.outputAssetId}/access`,{purpose:kind==='preview'?'preview':'download'})).data);if(!active.current||generation!==epoch.current)return;
   if(kind==='preview'){seek.current=player.current?.currentTime??seek.current;setPreview({videoId:v.id,grant});setExpired(false);setPlayable(false);}else setDownload({label:kind==='video'?'Download MP4':'Download captions (.vtt)',grant});
  });
 }
 useEffect(()=>{active.current=true;const c=createVideoCommands(projectId,commandStore(localStorage,userId,projectId),sendVideoCommand,setCommands);controller.current=c;c.load();void load();return()=>{active.current=false;c.dispose();};},[projectId,userId]);
 useEffect(()=>{if(commands.completed)void load();},[commands.completed]);
 useEffect(()=>{if(commands.error)handleError({code:commands.error});},[commands.error]);
 useEffect(()=>{if(!preview)return;const timer=setTimeout(()=>{seek.current=player.current?.currentTime??0;setExpired(true);setPlayable(false);setReviewed(false);},Math.max(0,Date.parse(preview.grant.expiresAt)-Date.now()));return()=>clearTimeout(timer);},[preview]);
 useEffect(()=>{if(!download)return;const timer=setTimeout(()=>setDownload(null),Math.max(0,Date.parse(download.grant.expiresAt)-Date.now()));return()=>clearTimeout(timer);},[download]);
 const blocked=busy||commands.busy||!commands.ready||!!commands.pending;
 return <main id="main" className="container foundation video-review" data-private-focus-scope><nav className="actions" aria-label="Project steps"><a href="/projects">← My videos</a><a href={`/projects/${projectId}/storyboard`}>Storyboard</a><span aria-current="step">03 · Video</span></nav><p className="eyebrow">THE FINAL CUT</p><h1>Your story, in motion.</h1><p>{project?.title??'Review your finished video, listen to the narration and check the captions.'}</p>
 {error&&<p role="alert" className="notice notice--error">{error}</p>}
 {commands.busy&&<p role="status">Saving your request…</p>}
 {commands.pending&&!commands.busy&&<section className="notice"><p>A {commands.pending.action==='approve'?'video approval':commands.pending.action==='select'?'version selection':'video revision'} is unconfirmed. Recover the same request before making another change.</p><Button disabled={commands.busy} onClick={()=>void controller.current?.recover()}>Recover request</Button></section>}
 <Button variant="secondary" disabled={busy||commands.busy} onClick={()=>void load()}>Refresh versions</Button>
 <RevisionProgress projectId={projectId} userId={userId} refreshKey={commands.completed} onReady={()=>void load()}/>
 {!loaded?<p role="status">{busy?'Loading video versions…':'Refresh to load your videos.'}</p>:!selected?<section className="panel"><h2>Your first cut starts here.</h2><p>Approve a storyboard and generate a video. Completed versions will appear here.</p><a className="button button--primary" href={`/projects/${projectId}/storyboard`}>Open storyboard</a></section>:<div className="video-review-grid"><section className="panel"><p className="eyebrow">{selected.approval?'APPROVED VERSION':'READY FOR YOUR REVIEW'}</p><h2>{selected.title}</h2><p>{Math.round(selected.duration)} seconds · Daniel test voice · Captions included</p><p>Version {selected.id.slice(-8)} · {new Date(selected.createdAt).toLocaleString()}</p>
 <div className="video-review-player">{preview&&preview.videoId===selected.id&&!expired?<video aria-label="Video preview" key={preview.grant.url} ref={player} controls playsInline preload="metadata" src={preview.grant.url} onLoadedMetadata={()=>{if(player.current)player.current.currentTime=seek.current;setPlayable(true);}} onError={()=>{setExpired(true);setPlayable(false);setReviewed(false);}}/>:<div><h3>{expired?'Preview access needs refreshing.':'Ready when you are.'}</h3><p>{expired?'Your saved video is unchanged. Refresh access to continue.':'Open the private preview to review this version.'}</p></div>}</div>
 <div className="actions"><Button disabled={blocked} onClick={()=>void access('preview')}>{expired?'Refresh preview':'Open preview'}</Button><Button disabled={blocked} variant="secondary" onClick={()=>void access('video')}>Export MP4</Button><Button disabled={blocked} variant="secondary" onClick={()=>void access('captions')}>Export captions</Button></div>
 {download&&<p><a className="button button--secondary" href={download.grant.url} referrerPolicy="no-referrer">{download.label}</a></p>}
 {project?.selectedVideoId===selected.id?<p>Selected for this project</p>:<Button disabled={blocked} variant="secondary" onClick={()=>void controller.current?.submit('select',selected,project!.revision)}>Use this version</Button>}
 {selected.approval?<p className="notice" role="status">Approved on {new Date(selected.approval.approvedAt).toLocaleString()}. This approval belongs only to this version.</p>:<><label className="video-review-check"><input type="checkbox" checked={reviewed} disabled={blocked||!playable} onChange={e=>setReviewed(e.target.checked)}/> I reviewed the visuals, narration and captions.</label><Button disabled={blocked||!reviewed||!playable} onClick={()=>setConfirm(selected)}>Approve this video</Button></>}
 <p className="muted">Approval saves your review. Instagram publishing is coming in a later milestone.</p>
 {confirm&&<section className="notice" aria-label="Confirm video approval"><h3>Approve version {confirm.id.slice(-8)}?</h3><p>This approves this exact export. Later renders will need their own review. Nothing will be posted.</p><div className="actions"><Button disabled={blocked} onClick={()=>{if(selected.id===confirm.id&&reviewed&&playable){void controller.current?.submit('approve',confirm,project!.revision);setConfirm(null);}}}>Confirm approval</Button><Button variant="secondary" disabled={commands.busy} onClick={()=>setConfirm(null)}>Keep reviewing</Button></div></section>}
 </section><aside className="panel"><p className="eyebrow">YOUR CUTS</p><h2>Video versions</h2><p>Earlier exports stay available when you generate again.</p><ul className="video-version-list">{rows.map(v=><li key={v.id}><Button variant="secondary" disabled={blocked} aria-pressed={v.id===selected.id} onClick={()=>choose(v)}>{v.title} · {v.id.slice(-8)}</Button><p>{v.approval?'Approved':'Needs review'}{v.id===project?.selectedVideoId?' · Selected':''}</p></li>)}</ul>{cursor&&<Button disabled={blocked} variant="secondary" onClick={()=>void load(true)}>Load older versions</Button>}</aside></div>}
 {selected&&<CaptionEditor key={selected.id} video={selected} userId={userId} blocked={blocked} onSubmit={(action,overrides)=>void controller.current?.submit(action,selected,project!.revision,overrides)}/>}
 </main>;
}
