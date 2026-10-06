import assert from 'node:assert/strict';
import {test} from 'node:test';
import {reviseStoryboard,validateRevision,revisionDiff,revisionPromptVersion} from '../src/storyboards/revisions';
import {validateStoryboard,StoryboardInvalid,type Storyboard} from '../src/storyboards/contracts';
import type {PlanningDiagnostic} from '../src/storyboards/planner';
const idea={topic:'Water cycle',audience:'Students',notes:'',voicePreset:'daniel-test'};
const narration='Water moves through our world in a repeating cycle. The sun warms the surface and turns some liquid into invisible vapor. As this vapor rises and cools it condenses into tiny droplets. These droplets gather in clouds before returning to the ground as rain and collecting in rivers and lakes.';
function source():Storyboard{return validateStoryboard({schemaVersion:2,title:'Water',audience:'Students',learningObjective:'Understand the water cycle',language:'en',voicePreset:'daniel-test',sources:[],scenes:Array.from({length:3},(_,i)=>({id:`stable-${i}`,title:'Water',kicker:'CYCLE',narration,pronunciation:[],sourceIds:[],visual:{component:'title',version:1,data:{labels:['Water']}},events:[{id:'stable-reveal',targetId:'label-1',action:'reveal',cue:{phrase:'Water',occurrence:1,offsetMs:0},durationMs:400}]}))},idea).content;}
const config={key:'fixture-only',model:'test'};
const input=()=>({idea,source:source(),planStale:false,request:{instruction:'Make the opening label clearer',sceneId:'stable-0'}});
function changed(){const p=source();p.scenes[0].visual={component:'title',version:1,data:{labels:['Water cycle']}};return p;}
function response(plan:Storyboard){return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({...plan,scenes:plan.scenes.map(s=>({...s,visual:{component:s.visual.component,version:1,dataJson:JSON.stringify(s.visual.data)}}))})}]}}]});}
const fails=(promise:Promise<unknown>,code:string)=>assert.rejects(promise,(e:unknown)=>(e as {code?:string}).code===code);

test('scene revision supplies frozen source/instruction, preserves identities and reports trusted changes',async()=>{
 const command=input(),before=structuredClone(command);let calls=0;
 const result=await reviseStoryboard(command,config,(async(_url,options)=>{
  calls++;const body=JSON.parse(options!.body as string),payload=JSON.parse(body.contents[0].parts[0].text);
  assert.deepEqual(payload.sourceStoryboard,before.source);assert.deepEqual(payload.revision,before.request);
  assert.match(body.systemInstruction.parts[0].text,/Only edit scene stable-0/);
  assert.equal(body.systemInstruction.parts[0].text.includes('Create exactly six scenes'),false);
  command.source.scenes[1].title='Mutated caller input';
  return response(changed());
 }) as typeof fetch);
 assert.equal(calls,1);assert.deepEqual(result.changedSceneIds,['stable-0']);assert.deepEqual(result.changedFields,[]);
 assert.equal(result.requiresApproval,true);assert.equal(result.plannerConfig.promptVersion,revisionPromptVersion);
 assert.deepEqual(result.content.scenes.slice(1),before.source.scenes.slice(1));
 assert.equal(result.content.scenes[0].events[0].id,'stable-reveal');
});
test('out-of-scope edits are repaired against original snapshot without silently accepting them',async()=>{
 let calls=0;const events:PlanningDiagnostic[]=[];
 const result=await reviseStoryboard(input(),config,(async(_url,options)=>{
  calls++;if(calls===1){const p=changed();p.scenes[1].title='Unrequested';return response(p);}
  const payload=JSON.parse(JSON.parse(options!.body as string).contents[0].parts[0].text);
  assert.ok(payload.repair.issues.some((i:{code:string})=>i.code==='REVISION_OUTSIDE_SCOPE'));
  assert.equal(payload.sourceStoryboard.scenes[1].title,'Water');return response(changed());
 }) as typeof fetch,event=>events.push(event));
 assert.equal(result.attempts,2);assert.equal(result.content.scenes[1].title,'Water');
 assert.ok(events[0].issueCodes.includes('REVISION_OUTSIDE_SCOPE'));
});
test('whole-story revision permits multiple scene and metadata changes with trusted diff',async()=>{
 const p=changed();p.scenes[2].title='A takeaway';p.learningObjective='Trace the complete cycle';
 const result=await reviseStoryboard({...input(),request:{instruction:'Clarify the opening and takeaway'}},config,(async()=>response(p)) as typeof fetch);
 assert.deepEqual(result.changedSceneIds,['stable-0','stable-2']);assert.deepEqual(result.changedFields,['learningObjective']);assert.equal(result.requiresApproval,true);
});
test('scene identity/order, fixed metadata and scoped root edits cannot slip through validation',()=>{
 for(const mutate of [(p:Storyboard)=>{p.scenes.reverse();},(p:Storyboard)=>{p.scenes[0].id='new-id';},(p:Storyboard)=>{p.audience='Someone else';},(p:Storyboard)=>{p.title='Changed root';}]){
  const p=changed();mutate(p);assert.throws(()=>validateRevision(p,source(),idea,'stable-0'),StoryboardInvalid);
 }
});
test('four invalid revisions exhaust without mutating the source or returning a candidate',async()=>{
 const command=input(),before=structuredClone(command);let calls=0;
 await fails(reviseStoryboard(command,config,(async()=>{calls++;const p=changed();p.scenes[1].title='Outside scope';return response(p);}) as typeof fetch),'STORYBOARD_INVALID');
 assert.equal(calls,4);assert.deepEqual(command,before);
});
test('no-op revisions, invalid cues and model-added approval fields are rejected',()=>{
 assert.throws(()=>validateRevision(source(),source(),idea),e=>e instanceof StoryboardInvalid&&e.issues.some(i=>i.code==='REVISION_NO_CHANGES'));
 const p=changed();p.scenes[0].events[0].cue.phrase='Not in narration';assert.throws(()=>validateRevision(p,source(),idea),StoryboardInvalid);
 assert.throws(()=>validateRevision({...changed(),approved:true},source(),idea),StoryboardInvalid);
});
test('stale/invalid sources, nonexistent scenes and invalid commands dispatch no request',async()=>{
 let calls=0;const request=(async()=>{calls++;return response(changed());}) as typeof fetch;
 await fails(reviseStoryboard({...input(),planStale:true},config,request),'PLAN_STALE');
 await fails(reviseStoryboard({...input(),request:{instruction:'Change it',sceneId:'missing'}},config,request),'INVALID_SCENE');
 for(const instruction of ['', ' ', 'x'.repeat(4001)])await fails(reviseStoryboard({...input(),request:{instruction}},config,request),'INVALID_DRAFT');
 const p=source();p.scenes[0].narration='';await assert.rejects(reviseStoryboard({...input(),source:p},config,request),StoryboardInvalid);
 assert.equal(calls,0);
});
test('authorization, ambiguous timeouts and expired deadlines do not retry',async()=>{
 for(const failure of ['auth','timeout','deadline']){
  let calls=0;await fails(reviseStoryboard(input(),config,(async()=>{calls++;if(failure==='timeout')throw Object.assign(Error('private payload'),{name:'TimeoutError'});return new Response('',{status:401});}) as typeof fetch,()=>{},{deadline:Date.now()+(failure==='deadline'?-1:180000)}),failure==='auth'?'PROVIDER_AUTHORIZATION':failure==='timeout'?'PROVIDER_OUTCOME_UNKNOWN':'PLANNING_DEADLINE');
  assert.equal(calls,failure==='deadline'?0:1);
 }
});
test('transient provider failures use shared retry budget and diagnostics contain no source text',async()=>{
 let calls=0;const waits:number[]=[],events:PlanningDiagnostic[]=[];
 const result=await reviseStoryboard(input(),config,(async()=>{calls++;return calls<3?new Response('',{status:503}):response(changed());}) as typeof fetch,e=>events.push(e),{sleep:async ms=>{waits.push(ms);}});
 assert.equal(result.attempts,3);assert.deepEqual(waits,[1000,2000]);
 assert.equal(JSON.stringify(events).includes(narration),false);assert.equal(JSON.stringify(events).includes('fixture-only'),false);
});
test('cue and pronunciation differences are structural changes, never inherited approval',()=>{
 const p=source();p.scenes[0].events[0].cue.offsetMs=50;p.scenes[1].pronunciation=[{phrase:'Water',spokenAs:'Water',occurrence:1}];
 assert.deepEqual(revisionDiff(source(),p),{changedSceneIds:['stable-0','stable-1'],changedFields:[],requiresApproval:true});
});
