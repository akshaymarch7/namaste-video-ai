import {test} from 'node:test';
import assert from 'node:assert/strict';
import {commandStore,createVideoCommands,type Attempt} from '../components/video/commands';
import type {Video} from '../src/videos/contracts';
const project='prj_'+'a'.repeat(32),id='vid_'+'b'.repeat(32),hash='c'.repeat(64);
const video={id,projectId:project,outputHash:hash,renderSpecHash:hash} as Video;
const response={id:'apr_'+'d'.repeat(32),projectId:project,kind:'video',subjectId:id,subjectHash:hash,outputHash:hash,renderSpecHash:hash,approvedAt:new Date().toISOString()};
function store(){let value:Attempt|null=null;return {read:()=>value,write:(v:Attempt)=>{value=v;},clear:()=>{value=null;}};}
test('unknown approval survives reload; recovery uses identical key and hashes',async()=>{const s=store(),sent:Attempt[]=[];const first=createVideoCommands(project,s,async a=>{sent.push(a);throw Error();},()=>{});first.load();await first.submit('approve',video,1);assert.ok(first.snapshot().pending);first.dispose();const second=createVideoCommands(project,s,async a=>{sent.push(a);return response;},()=>{});second.load();assert.equal(sent.length,1);await second.recover();assert.deepEqual(sent[0],sent[1]);assert.equal(second.snapshot().pending,null);});
test('storage failure prevents mutation; foreign responses stay unresolved',async()=>{let calls=0;const s=store(),c=createVideoCommands(project,{...s,write(){throw Error();}},async()=>{calls++;return response;},()=>{});c.load();await c.submit('approve',video,1);assert.equal(calls,0);const d=createVideoCommands(project,store(),async()=>({...response,subjectId:'vid_'+'e'.repeat(32)}),()=>{});d.load();await d.submit('approve',video,1);assert.ok(d.snapshot().pending);});
test('selection conflict clears receipt; disposed completion preserves recovery',async()=>{const c=createVideoCommands(project,store(),async()=>{throw {code:'REVISION_CONFLICT'};},()=>{});c.load();await c.submit('select',video,1);assert.equal(c.snapshot().pending,null);const s=store();let release!:(v:unknown)=>void;const d=createVideoCommands(project,s,()=>new Promise(r=>release=r),()=>{});d.load();const p=d.submit('approve',video,1);d.dispose();release(response);await p;assert.ok(s.read());});


function sharedStorage():Storage{
 const values=new Map<string,string>();return {get length(){return values.size;},key(i){return [...values.keys()][i]??null;},getItem(k){return values.get(k)??null;},setItem(k,v){values.set(k,v);},removeItem(k){values.delete(k);},clear(){values.clear();}};
}
test('two pre-opened tabs cannot overwrite or clear each other; reload recovers exact lost command',async()=>{
 const storage=sharedStorage(),aStore=commandStore(storage,'owner',project),bStore=commandStore(storage,'owner',project);
 let finish!:(v:unknown)=>void;const sent:Attempt[]=[];
 const a=createVideoCommands(project,aStore,async attempt=>{sent.push(attempt);throw Error('lost response');},()=>{});
 const b=createVideoCommands(project,bStore,()=>new Promise(resolve=>finish=resolve),()=>{});
 a.load();b.load();await a.submit('approve',video,1);
 const lost=structuredClone(a.snapshot().pending!);
 const successful=b.submit('select',video,1);assert.equal(storage.length,2);
 finish({projectId:project,videoId:id,projectRevision:2});await successful;
 assert.equal(storage.length,1);assert.deepEqual(aStore.read(),lost);a.dispose();b.dispose();
 const reloaded=createVideoCommands(project,commandStore(storage,'owner',project),async attempt=>{sent.push(attempt);return response;},()=>{});
 reloaded.load();assert.deepEqual(reloaded.snapshot().pending,lost);assert.equal(sent.length,1);
 await reloaded.recover();assert.deepEqual(sent[1],lost);assert.equal(storage.length,0);
});
test('definitive rejection clears only its command, preserving another tab and other identities',async()=>{
 const storage=sharedStorage(),s=commandStore(storage,'owner',project),other=commandStore(storage,'other',project);
 const receipt:Attempt={action:'approve',key:crypto.randomUUID(),videoId:id,body:{expectedOutputHash:hash,expectedRenderSpecHash:hash,approve:true}};
 let reject!:(reason:unknown)=>void;const c=createVideoCommands(project,s,()=>new Promise((_,r)=>reject=r),()=>{});c.load();
 const work=c.submit('select',video,1);s.write(receipt);other.write({...receipt,key:crypto.randomUUID()});
 reject({code:'REVISION_CONFLICT'});await work;assert.deepEqual(s.read(),receipt);assert.equal(storage.length,2);assert.deepEqual(c.snapshot().pending,receipt);
});
test('legacy receipts remain recoverable; collision and mismatched cleanup cannot destroy another receipt',()=>{
 const storage=sharedStorage(),s=commandStore(storage,'owner',project),legacy=`nv:video-command:owner:${project}`;
 const a:Attempt={action:'select',key:crypto.randomUUID(),videoId:id,body:{expectedProjectRevision:1}},b={...a,key:crypto.randomUUID()};
 storage.setItem(legacy,JSON.stringify(a));s.write(b);assert.deepEqual(s.read(),a);
 s.clear(b);assert.deepEqual(s.read(),a);s.clear(a);assert.equal(s.read(),null);
 s.write(a);assert.throws(()=>s.write({...a,body:{expectedProjectRevision:2}}));assert.throws(()=>s.clear({...a,body:{expectedProjectRevision:2}}));assert.deepEqual(s.read(),a);
});

test('caption revision recovery retains source hash and exact edit spans',async()=>{
 const s=store(),sent:Attempt[]=[],source={...video,renderSpecHash:hash};let succeed=false;
 const result={sourceVideoId:id,sourceRenderSpecHash:hash,job:{id:'job_'+'a'.repeat(32),projectId:project,storyboardId:'stb_'+'b'.repeat(32),state:'queued',stage:'queued',revision:1,attempt:0,errorCode:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),finishedAt:null,actions:{cancel:true}}};
 const send=async(a:Attempt)=>{sent.push(a);if(!succeed)throw Error('lost');return result;};const c=createVideoCommands(project,s,send,()=>{});c.load();
 const overrides=[{sceneId:'scene-1',speechFingerprint:hash,sourceStart:0,sourceEnd:3,displayText:'RAM'}];await c.submit('captions',source,1,overrides);assert.ok(c.snapshot().pending);c.dispose();succeed=true;
 const recovered=createVideoCommands(project,s,send,()=>{});recovered.load();await recovered.recover();assert.deepEqual(sent[0],sent[1]);assert.equal(recovered.snapshot().pending,null);
});

test('oversized caption edits fail before persistence or dispatch',async()=>{
 const s=store();let calls=0;const c=createVideoCommands(project,s,async()=>{calls++;return {};},()=>{});c.load();
 await c.submit('captions',video,1,Array.from({length:101},(_,i)=>({sceneId:'scene-1',speechFingerprint:hash,sourceStart:i,sourceEnd:i+1,displayText:'A'})));
 assert.equal(c.snapshot().error,'VALIDATION_FAILED');assert.equal(s.read(),null);assert.equal(calls,0);
});
