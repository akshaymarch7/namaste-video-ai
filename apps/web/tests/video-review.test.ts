import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVideoCommands,type Attempt} from '../components/video/commands';
import type {Video} from '../src/videos/contracts';
const project='prj_'+'a'.repeat(32),id='vid_'+'b'.repeat(32),hash='c'.repeat(64);
const video={id,projectId:project,outputHash:hash,renderSpecHash:hash} as Video;
const response={id:'apr_'+'d'.repeat(32),projectId:project,kind:'video',subjectId:id,subjectHash:hash,outputHash:hash,renderSpecHash:hash,approvedAt:new Date().toISOString()};
function store(){let value:Attempt|null=null;return {read:()=>value,write:(v:Attempt)=>{value=v;},clear:()=>{value=null;}};}
test('unknown approval survives reload; recovery uses identical key and hashes',async()=>{const s=store(),sent:Attempt[]=[];const first=createVideoCommands(project,s,async a=>{sent.push(a);throw Error();},()=>{});first.load();await first.submit('approve',video,1);assert.ok(first.snapshot().pending);first.dispose();const second=createVideoCommands(project,s,async a=>{sent.push(a);return response;},()=>{});second.load();assert.equal(sent.length,1);await second.recover();assert.deepEqual(sent[0],sent[1]);assert.equal(second.snapshot().pending,null);});
test('storage failure prevents mutation; foreign responses stay unresolved',async()=>{let calls=0;const s=store(),c=createVideoCommands(project,{...s,write(){throw Error();}},async()=>{calls++;return response;},()=>{});c.load();await c.submit('approve',video,1);assert.equal(calls,0);const d=createVideoCommands(project,store(),async()=>({...response,subjectId:'vid_'+'e'.repeat(32)}),()=>{});d.load();await d.submit('approve',video,1);assert.ok(d.snapshot().pending);});
test('selection conflict clears receipt; disposed completion preserves recovery',async()=>{const c=createVideoCommands(project,store(),async()=>{throw {code:'REVISION_CONFLICT'};},()=>{});c.load();await c.submit('select',video,1);assert.equal(c.snapshot().pending,null);const s=store();let release!:(v:unknown)=>void;const d=createVideoCommands(project,s,()=>new Promise(r=>release=r),()=>{});d.load();const p=d.submit('approve',video,1);d.dispose();release(response);await p;assert.ok(s.read());});
