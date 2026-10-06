import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createEditor,editStore,editorDirty,type EditPending,type EditTransport} from '../components/storyboard/editor-controller';
import type {DraftView} from '../src/drafts/contracts';
function fixture():DraftView{return {projectId:'prj_a',revision:3,sourceStoryboardId:'stb_'+'a'.repeat(32),editablePlan:{schemaVersion:2,title:'Water',audience:'Students',learningObjective:'Learn water',language:'en',voicePreset:'daniel-test',sources:[],scenes:Array.from({length:3},(_,i)=>({id:`scene-${i}`,title:'Water',kicker:'Cycle',narration:'Water flows through rivers and lakes.',pronunciation:[],sourceIds:[],visual:{component:'title',version:1,data:{labels:['Water']}},events:[{id:'reveal',targetId:'label-1',action:'reveal',cue:{phrase:'Water',occurrence:1,offsetMs:0},durationMs:400}]}))},topic:'Water',audience:'Students',notes:'',voicePreset:'daniel-test',planStale:false,conversationId:'cnv_a',contentHash:'a'.repeat(64),validation:{valid:false,issues:[]},updatedAt:new Date().toISOString()};}
function harness(){let remote=fixture(),pending:EditPending|null=null,calls=0;const store={read:()=>pending,write:(p:EditPending)=>{pending=structuredClone(p);},clear:()=>{pending=null;}};const transport:EditTransport={read:async()=>structuredClone(remote),apply:async()=>{},save:async p=>{calls++;if(p.expectedRevision!==remote.revision)throw {code:'REVISION_CONFLICT'};remote={...remote,revision:remote.revision+1,editablePlan:structuredClone(p.plan)};return structuredClone(remote);}};return {store,transport,remote:()=>remote,setRemote:(v:DraftView)=>{remote=v;},calls:()=>calls};}
test('editing is local until save; persisted result survives reload and candidate application is explicit',async()=>{const h=harness(),e=createEditor(h.transport,h.store,()=>{});await e.load();const p=structuredClone(e.snapshot().local!);p.scenes[0].narration='';e.edit(p);assert.equal(h.calls(),0);assert.ok(editorDirty(e.snapshot()));await e.save();assert.equal(e.snapshot().saved?.revision,4);assert.equal(editorDirty(e.snapshot()),false);e.dispose();const next=createEditor(h.transport,h.store,()=>{});await next.load();assert.equal(next.snapshot().local?.scenes[0].narration,'');});
test('uncertain PATCH is replayed with original revision after reload; old reads cannot mark it saved',async()=>{const h=harness();h.transport.save=async()=>{throw {code:'CONNECTION'};};const e=createEditor(h.transport,h.store,()=>{});await e.load();const p=structuredClone(e.snapshot().local!);p.title='Changed';e.edit(p);await e.save();assert.ok(h.store.read());e.dispose();let seen=0;h.transport.save=async attempt=>{seen++;assert.equal(attempt.expectedRevision,3);h.setRemote({...h.remote(),revision:4,editablePlan:attempt.plan});throw {code:'REVISION_CONFLICT'};};const next=createEditor(h.transport,h.store,()=>{});await next.load();assert.equal(seen,1);assert.equal(editorDirty(next.snapshot()),false);assert.equal(next.snapshot().saved?.revision,4);});
test('conflict keeps local input; keep-local uses latest revision and preserves latest idea fields',async()=>{const h=harness(),e=createEditor(h.transport,h.store,()=>{});await e.load();const p=structuredClone(e.snapshot().local!);p.title='Mine';e.edit(p);h.setRemote({...h.remote(),revision:4,topic:'New idea'});await e.save();assert.ok(e.snapshot().remote);assert.equal(e.snapshot().local?.title,'Mine');await e.keepLocal();assert.equal(e.snapshot().saved?.revision,5);assert.equal(e.snapshot().saved?.topic,'New idea');assert.equal(e.snapshot().local?.title,'Mine');});
test('a changed source after unknown-save reload cannot be overwritten using keep-local',async()=>{const h=harness();h.store.write({kind:'save',expectedRevision:3,sourceStoryboardId:h.remote().sourceStoryboardId!,plan:h.remote().editablePlan!});h.setRemote({...h.remote(),revision:4,sourceStoryboardId:'stb_'+'b'.repeat(32)});const e=createEditor(h.transport,h.store,()=>{});await e.load();await e.keepLocal();assert.equal(e.snapshot().error,'SOURCE_CHANGED');e.useRemote();assert.equal(e.snapshot().saved?.sourceStoryboardId,h.remote().sourceStoryboardId);});
test('apply recovery ignores old replay snapshot and reads the current draft',async()=>{const h=harness();const p:EditPending={kind:'apply',key:crypto.randomUUID(),body:{expectedDraftRevision:2,storyboardId:'stb_'+'a'.repeat(32),expectedContentHash:'a'.repeat(64)}};h.store.write(p);h.setRemote({...h.remote(),revision:9});h.transport.apply=async actual=>{assert.deepEqual(actual,p);return fixture();};const e=createEditor(h.transport,h.store,()=>{});await e.load();assert.equal(e.snapshot().saved?.revision,9);assert.equal(h.store.read(),null);});
test('bounds and storage failures prevent writes',async()=>{const h=harness(),e=createEditor(h.transport,h.store,()=>{});await e.load();const p=structuredClone(e.snapshot().local!);p.title='x'.repeat(101);e.edit(p);await e.save();assert.equal(h.calls(),0);assert.equal(e.snapshot().error,'VALIDATION_FAILED');p.title='Okay';e.edit(p);h.store.write=()=>{throw Error();};await e.save();assert.equal(e.snapshot().error,'RECOVERY_STORAGE');assert.equal(h.calls(),0);});
test('disposed responses cannot clear another mounted controller pending request',async()=>{const h=harness();let done!:(d:DraftView)=>void;h.transport.save=async()=>new Promise(r=>{done=r;});const e=createEditor(h.transport,h.store,()=>{});await e.load();const p=structuredClone(e.snapshot().local!);p.title='New';e.edit(p);const saving=e.save();e.dispose();const newer={kind:'save' as const,expectedRevision:7,plan:p,sourceStoryboardId:'new-source'};h.store.write(newer);done(h.remote());await saving;assert.deepEqual(h.store.read(),newer);});
test('recovery storage isolates user and project',()=>{const map=new Map<string,string>(),storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>map.set(k,v),removeItem:(k:string)=>map.delete(k)} as unknown as Storage;const a=editStore(storage,'a','p'),b=editStore(storage,'b','p');a.write({kind:'save',expectedRevision:3,plan:fixture().editablePlan!,sourceStoryboardId:fixture().sourceStoryboardId!});assert.equal(b.read(),null);assert.ok(a.read());a.clear();assert.equal(a.read(),null);});

test('concurrent saves dispatch only once and remain dirty until acknowledged',async()=>{const h=harness();let finish!:(d:DraftView)=>void,calls=0;h.transport.save=async()=>{calls++;return new Promise(r=>{finish=r;});};const e=createEditor(h.transport,h.store,()=>{});await e.load();const p=structuredClone(e.snapshot().local!);p.title='Pending';e.edit(p);const first=e.save();await e.save();assert.equal(calls,1);assert.ok(editorDirty(e.snapshot()));finish({...h.remote(),revision:4,editablePlan:p});await first;assert.equal(editorDirty(e.snapshot()),false);});

// Exercise the formatter used by both conflict columns with differences confined
// to settings: the rest of the visible script must be identical in this case.
import {planText} from '../components/storyboard/plan-comparison';
test('cue-only conflicts expose both phrases and occurrence numbers',async()=>{
 const h=harness(),e=createEditor(h.transport,h.store,()=>{});await e.load();
 const local=structuredClone(e.snapshot().local!),remote=structuredClone(local);
 local.scenes[0].events[0].cue.phrase='rivers';
 remote.scenes[0].events[0].cue.phrase='lakes';remote.scenes[0].events[0].cue.occurrence=2;
 e.edit(local);h.setRemote({...h.remote(),revision:4,editablePlan:remote});await e.save();
 assert.ok(e.snapshot().remote);
 const mine=planText(e.snapshot().local),saved=planText(e.snapshot().remote!.editablePlan);
 assert.match(mine,/Cue 1.*phrase "rivers"; occurrence 1/);
 assert.match(saved,/Cue 1.*phrase "lakes"; occurrence 2/);
 assert.notEqual(mine,saved);
});
test('each editable pronunciation or cue setting changes the comparison independently',()=>{
 const base=fixture().editablePlan!;
 base.scenes[0].pronunciation=[{phrase:'Water',spokenAs:'water',occurrence:1}];
 const original=planText(base);
 for(const [field,value] of [['phrase','rivers'],['occurrence',2]] as const){
  const changed=structuredClone(base);Object.assign(changed.scenes[0].events[0].cue,{[field]:value});
  assert.notEqual(planText(changed),original,`cue ${field} must be visible`);
 }
 for(const [field,value] of [['phrase','rivers'],['spokenAs','riv ers'],['occurrence',2]] as const){
  const changed=structuredClone(base);Object.assign(changed.scenes[0].pronunciation[0],{[field]:value});
  assert.notEqual(planText(changed),original,`pronunciation ${field} must be visible`);
 }
 assert.match(original,/Pronunciation 1: phrase "Water"; spoken as "water"; occurrence 1/);
 const empty=structuredClone(base);empty.scenes[0].pronunciation=[];
 assert.match(planText(empty),/Pronunciation:\n  None/);
 assert.equal(planText(null),'No working copy');
});

test('snapshot recovery replays original revision/hash/key after reload without discarding newer draft',async()=>{
 const h=harness();const id='stb_'+'f'.repeat(32);let calls:unknown[]=[];
 h.transport.snapshot=async p=>{calls.push(p);throw {code:'CONNECTION'};};
 const first=createEditor(h.transport,h.store,()=>{});await first.load();await first.saveVersion();const pending=structuredClone(h.store.read());assert.equal(pending?.kind,'snapshot');first.dispose();
 h.setRemote({...h.remote(),revision:5,editablePlan:{...h.remote().editablePlan!,title:'Newer text'}});
 h.transport.snapshot=async p=>{calls.push(p);return {storyboardId:id};};
 const second=createEditor(h.transport,h.store,()=>{});await second.load();assert.deepEqual(calls,[pending,pending]);assert.equal(second.snapshot().snapshotId,id);assert.equal(second.snapshot().local?.title,'Newer text');assert.equal(h.store.read(),null);
});
test('unsaved edits cannot be snapshotted; definitive validation rejection permits correction',async()=>{
 const h=harness();let calls=0;h.transport.snapshot=async()=>{calls++;throw {code:'INVALID_DRAFT'};};
 const e=createEditor(h.transport,h.store,()=>{});await e.load();e.edit({...e.snapshot().local!,title:'Local'});await e.saveVersion();assert.equal(calls,0);assert.equal(e.snapshot().error,'UNSAVED');
 await e.save();await e.saveVersion();assert.equal(calls,1);assert.equal(e.snapshot().error,'INVALID_DRAFT');assert.equal(h.store.read(),null);assert.equal(e.snapshot().local?.title,'Local');
});
