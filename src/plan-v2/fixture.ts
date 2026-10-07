import type {Storyboard} from '../../apps/web/src/storyboards/contracts';
import {syntheticSpeech} from '../pipeline/timing';
import {compileV2,spokenText} from './compiler';

// Authored test content, never presented as generated narration or an approval.
export const renderFixture:Storyboard={schemaVersion:2,title:'RAM and storage',audience:'Curious learners',learningObjective:'Distinguish working memory from persistent storage.',language:'en',voicePreset:'daniel-test',sources:[],scenes:[
  {id:'intro',title:'Two kinds of memory',kicker:'THE BIG IDEA',narration:'Your computer uses RAM and storage for different jobs. Imagine a desk and a filing cabinet. The desk holds work you need right now, while the cabinet keeps things for later. This simple picture helps explain why a computer needs both.',pronunciation:[{phrase:'RAM',occurrence:1,spokenAs:'ram'}],visual:{component:'title',version:1,data:{labels:['RAM','Storage']}},events:[
    {id:'ram',targetId:'label-1',action:'reveal',cue:{phrase:'RAM',occurrence:1,offsetMs:0},durationMs:500},
    {id:'storage',targetId:'label-2',action:'reveal',cue:{phrase:'storage',occurrence:1,offsetMs:0},durationMs:500},
  ],sourceIds:[]},
  {id:'flow',title:'From storage to work',kicker:'FOLLOW THE DATA',narration:'When you open an application, the computer loads needed data from storage into working memory. The processor can then use that data to do useful work. This is a simplified view: real systems move and reuse data in many smaller steps.',pronunciation:[],visual:{component:'flow',version:1,data:{steps:[{id:'disk',label:'Storage'},{id:'memory',label:'Working memory'},{id:'cpu',label:'Processor'}],edges:[{id:'load',from:'disk',to:'memory'},{id:'use',from:'memory',to:'cpu'}]}},events:[
    {id:'disk-show',targetId:'disk',action:'reveal',cue:{phrase:'storage',occurrence:1,offsetMs:0},durationMs:500},
    {id:'memory-show',targetId:'memory',action:'reveal',cue:{phrase:'working memory',occurrence:1,offsetMs:0},durationMs:500},
    {id:'load-show',targetId:'load',action:'connect',cue:{phrase:'working memory',occurrence:1,offsetMs:0},durationMs:500},
    {id:'cpu-show',targetId:'cpu',action:'reveal',cue:{phrase:'processor',occurrence:1,offsetMs:0},durationMs:500},
    {id:'use-show',targetId:'use',action:'connect',cue:{phrase:'processor',occurrence:1,offsetMs:0},durationMs:500},
  ],sourceIds:[]},
  {id:'comparison',title:'What survives power off?',kicker:'SIDE BY SIDE',narration:'RAM normally loses its contents when power is removed. Storage is designed to retain data without continuous power. Saving a document writes it to storage, so you can reopen it later. Neither replaces sensible backups, because devices and software can still fail.',pronunciation:[{phrase:'RAM',occurrence:1,spokenAs:'ram'}],visual:{component:'comparison',version:1,data:{left:{heading:'RAM',points:['Active working data','Usually volatile']},right:{heading:'Storage',points:['Saved files and apps','Retains data without power']}}},events:[
    {id:'compare-left',targetId:'left',action:'compare',cue:{phrase:'loses its contents',occurrence:1,offsetMs:0},durationMs:1800},
    {id:'compare-right',targetId:'right',action:'compare',cue:{phrase:'retain data',occurrence:1,offsetMs:0},durationMs:1800},
  ],sourceIds:[]},
  {id:'takeaway',title:'A desk. A cabinet.',kicker:'TAKE THIS WITH YOU',narration:'Think of RAM as the working desk and storage as the filing cabinet. More working space can help with several tasks, while more storage gives you room for files. They solve different problems, and the right balance depends on what you do.',pronunciation:[{phrase:'RAM',occurrence:1,spokenAs:'ram'}],visual:{component:'takeaway',version:1,data:{labels:['RAM: working space','Storage: saved files']}},events:[
    {id:'desk',targetId:'label-1',action:'emphasize',cue:{phrase:'working desk',occurrence:1,offsetMs:0},durationMs:1500},
    {id:'cabinet',targetId:'label-2',action:'emphasize',cue:{phrase:'filing cabinet',occurrence:1,offsetMs:0},durationMs:1500},
  ],sourceIds:[]},
]};
export const fixtureSpeech=()=>Object.fromEntries(renderFixture.scenes.map(s=>[s.id,syntheticSpeech(spokenText(s).text,17.7)]));
export const fixtureTimeline=()=>compileV2(renderFixture,{notes:'',voicePreset:'daniel-test'},fixtureSpeech(),true);

export function layoutStressFixture():Storyboard{
  const plan=structuredClone(renderFixture);
  for(const scene of plan.scenes){
    scene.kicker='W'.repeat(35);
    const v=scene.visual;
    if(v.component==='flow')v.data.steps.forEach(s=>{s.label='Reliable distributed systems';});
    else if(v.component==='comparison')for(const side of [v.data.left,v.data.right]){
      side.heading='Cloud storage cost';
      side.points=Array(3).fill('Retains data without power');
    }
    else v.data.labels=Array(4).fill('Reliable distributed systems');
  }
  return plan;
}
