import {captionOverrides,validateCaptionDisplay,type CaptionOverride} from './caption-edits';
import {validateStoryboard, type Storyboard} from '../../apps/web/src/storyboards/contracts';
import {FPS, cueOffset, type Alignment, type Caption} from '../contracts';
import {makeCaptions, validateAlignment} from '../pipeline/timing';

export type SceneV2 = Storyboard['scenes'][number];
export type MeasuredSpeech = {alignment: Alignment; duration: number};
export type MotionEvent = {id: string; targetId: string; action: SceneV2['events'][number]['action']; start: number; frames: number};
export type RenderScene = {id: string; title: string; kicker: string; visual: SceneV2['visual']; start: number; frames: number; events: MotionEvent[]; captions: (Caption & {sourceStart:number;sourceEnd:number;originalText:string})[]};
export type RenderTimeline = {schemaVersion: 2; rendererVersion: 'plan-v2-2'; title: string; fps: 30; frames: number; fixture: boolean; scenes: RenderScene[]};

// Maps approved UTF-16 boundaries to spoken UTF-16 boundaries. Inside a
// pronunciation replacement the mapping is proportional, not forced alignment.
// This keeps original spelling on screen while the provider says spokenAs.
export function spokenText(scene: Pick<SceneV2, 'narration'|'pronunciation'>) {
  const replacements = scene.pronunciation.map(p => {
    const start = cueOffset(scene.narration, p.phrase, p.occurrence);
    return {start, end: start+p.phrase.length, text: p.spokenAs};
  }).sort((a,b) => a.start-b.start);
  for(let i=1;i<replacements.length;i++) if(replacements[i].start<replacements[i-1].end) throw Error('OVERLAPPING_PRONUNCIATION');
  const boundaries: number[] = []; let source=0, text='';
  const unchanged=(end:number)=>{while(source<end){boundaries[source]=text.length;text+=scene.narration[source++];}};
  for(const r of replacements){
    unchanged(r.start);
    for(let i=r.start;i<r.end;i++) boundaries[i]=text.length+(i-r.start)/(r.end-r.start)*r.text.length;
    text+=r.text;source=r.end;
  }
  unchanged(scene.narration.length);boundaries[source]=text.length;
  return {text,boundaries};
}

function speechClock(a:Alignment) {
  const starts: number[]=[], ends: number[]=[];
  a.characters.forEach((c,i)=>{for(let j=0;j<c.length;j++){
    starts.push(a.character_start_times_seconds[i]+j/c.length*(a.character_end_times_seconds[i]-a.character_start_times_seconds[i]));
    ends.push(a.character_start_times_seconds[i]+(j+1)/c.length*(a.character_end_times_seconds[i]-a.character_start_times_seconds[i]));
  }});
  return (offset:number,end=false)=>{
    if(offset===starts.length)return ends.at(-1)!;
    if(end&&Number.isInteger(offset)&&offset>0)return ends[offset-1];
    const i=Math.floor(offset),fraction=offset-i;
    return starts[i]+fraction*(ends[i]-starts[i]);
  };
}

export function compileV2(raw:unknown, context:{notes:string;voicePreset:string}, speech:Record<string,MeasuredSpeech>, fixture=false,overrides:CaptionOverride[]=[]):RenderTimeline {
  const plan=validateStoryboard(raw,context).content;
  if(Object.keys(speech).length!==plan.scenes.length)throw Error('SPEECH_SCENE_MISMATCH');
  const edits=captionOverrides.parse(overrides);const used=new Set<CaptionOverride>();
  let cursor=0;
  const scenes=plan.scenes.map(scene=>{
    const measured=speech[scene.id];if(!measured)throw Error('SPEECH_MISSING');
    validateAlignment(measured.alignment,measured.duration);
    const spoken=spokenText(scene);
    if(measured.alignment.characters.join('')!==spoken.text)throw Error('ALIGNMENT_TEXT_MISMATCH');
    const clock=speechClock(measured.alignment);
    const frames=Math.ceil((measured.duration+0.3)*FPS);
    const events=scene.events.map(e=>{
      const offset=cueOffset(scene.narration,e.cue.phrase,e.cue.occurrence);
      const seconds=clock(spoken.boundaries[offset])+e.cue.offsetMs/1000;
      const start=Math.floor(seconds*FPS),eventFrames=Math.ceil(e.durationMs/1000*FPS);
      if(start<0||start>=frames||start+eventFrames>frames)throw Error('MOTION_OUT_OF_BOUNDS');
      return {id:e.id,targetId:e.targetId,action:e.action,start,frames:eventFrames};
    });
    const characters=Array.from(scene.narration);let offset=0;
    const captionAlignment:Alignment={characters,character_start_times_seconds:[],character_end_times_seconds:[]};
    for(const character of characters){
      captionAlignment.character_start_times_seconds.push(clock(spoken.boundaries[offset]));offset+=character.length;
      captionAlignment.character_end_times_seconds.push(clock(spoken.boundaries[offset],true));
    }
    const words=[...scene.narration.matchAll(/\S+/gu)];let wordIndex=0;
    const captions=makeCaptions(captionAlignment).map(c=>{
      const count=c.text.split(/\s+/u).length,first=words[wordIndex],last=words[wordIndex+count-1];wordIndex+=count;
      const sourceStart=Array.from(scene.narration.slice(0,first.index)).length,sourceEnd=Array.from(scene.narration.slice(0,last.index!+last[0].length)).length;
      const matches=edits.filter(e=>e.sceneId===scene.id&&e.sourceStart===sourceStart&&e.sourceEnd===sourceEnd);
      if(matches.length>1)throw Error('INVALID_SPAN');
      const edit=matches[0];if(edit){validateCaptionDisplay(c.text,edit.displayText);used.add(edit);}
      return {...c,originalText:c.text,sourceStart,sourceEnd,text:edit?edit.displayText.trim().replace(/\s+/gu,' '):c.text};
    });
    if(captions.some(c=>c.start<0||c.end<=c.start||c.end>frames))throw Error('CAPTION_OUT_OF_BOUNDS');
    const result={id:scene.id,title:scene.title,kicker:scene.kicker,visual:scene.visual,start:cursor,frames,events,captions};
    cursor+=frames;return result;
  });
  if(used.size!==edits.length)throw Error('INVALID_SPAN');
  if(cursor<1800||cursor>2700)throw Error('MEASURED_DURATION_OUT_OF_RANGE');
  return {schemaVersion:2,rendererVersion:'plan-v2-2',title:plan.title,fps:30,frames:cursor,fixture,scenes};
}

// Reveal/connect establish visibility; emphasize/compare add a temporary accent.
// Elements without a reveal remain visible so a sparse event list is meaningful.
export function motionAt(events:MotionEvent[],targetId:string,frame:number){
  const target=events.filter(e=>e.targetId===targetId);
  const reveals=target.filter(e=>e.action==='reveal'||e.action==='connect');
  const visibility=reveals.length?Math.max(...reveals.map(e=>frame<e.start?0:e.frames===0?1:Math.min(1,(frame-e.start)/e.frames))):1;
  const accent=Math.max(0,...target.filter(e=>e.action==='emphasize'||e.action==='compare').map(e=>{
    const elapsed=frame-e.start,duration=Math.max(1,e.frames);
    return elapsed<0||elapsed>=duration?0:e.frames===0?1:Math.sin(Math.PI*(elapsed+0.5)/duration);
  }));
  return {visibility,accent};
}

export function captionsVtt(timeline:RenderTimeline){
  const stamp=(frame:number)=>{const ms=Math.round(frame/30*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`;};
  const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  return 'WEBVTT\n\n'+timeline.scenes.flatMap(s=>s.captions.map(c=>`${stamp(s.start+c.start)} --> ${stamp(s.start+c.end)}\n${escape(c.text)}\n`)).join('\n');
}
