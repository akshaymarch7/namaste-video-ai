import assert from 'node:assert/strict';
import type {ServerResponse} from 'node:http';
import {endpoint,json,sever,partial,stall} from './helpers/provider-endpoint';
import {test} from 'node:test';
import {suggest, type IdeaDiagnostic} from '../src/ideas/providers';
import {planStoryboard} from '../src/storyboards/planner';
import {requestSpeech} from '../src/jobs/speech-provider';
import {renderConfig} from '../src/jobs/render-config';
import {publishProvider} from '../src/publishing/provider';
import type {InstagramConfig} from '../src/instagram/config';

const secret='synthetic-private-key';
const input={topic:'Water cycle',audience:'School students',notes:'',voicePreset:'daniel-test'};
const config:InstagramConfig={appId:'123',appSecret:'synthetic',redirectUri:'https://app.test/api/instagram/callback',version:'v26.0',activeKey:'a',keys:{a:Buffer.alloc(32,1).toString('base64')}};
const suggestions=Array.from({length:3},(_,i)=>({title:`Idea ${i}`,topic:`Explain water cycle step ${i}`,angle:'Use a visual analogy'}));
const gemini={candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({suggestions})}]}}]};
const speech={audio_base64:'c3ludGhldGlj',alignment:{characters:['a'],character_start_times_seconds:[0],character_end_times_seconds:[1]}};
const sentence='Water moves through our world in a repeating cycle. The sun warms the surface and turns some liquid into invisible vapor. As this vapor rises and cools it condenses into tiny droplets. These droplets gather in clouds before returning to the ground as rain and collecting in rivers and lakes.';
const plan={schemaVersion:2,title:'The water cycle',audience:input.audience,learningObjective:'Understand the journey of water.',language:'en',voicePreset:input.voicePreset,sources:[],scenes:Array.from({length:3},(_,i)=>({id:`scene-${i}`,title:'A journey',kicker:'WATER',narration:sentence,pronunciation:[],visual:{component:i===2?'takeaway':'title',version:1,dataJson:JSON.stringify({labels:['Water']})},events:[{id:'reveal',targetId:'label-1',action:'reveal',cue:{phrase:'Water',occurrence:1,offsetMs:0},durationMs:400}],sourceIds:[]}))};
const planned={candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(plan)}]}}]};
async function rejectsCode(p:Promise<unknown>,code:string){
 await assert.rejects(p,(error:unknown)=>{assert.equal((error as {code:string}).code,code);assert.equal(String(error).includes(secret),false);return true;});
}

test('Gemini real HTTP 503, lost connection and truncated body stay safe; explicit next request recovers',async()=>{
 await endpoint(async h=>{
  const diagnostics:IdeaDiagnostic[]=[];
  for(const [behavior,code] of [[json({error:secret},503),'PROVIDER_UNAVAILABLE'],[sever,'PROVIDER_OUTCOME_UNKNOWN'],[partial,'PROVIDER_OUTCOME_UNKNOWN']] as const){
   h.set(behavior);const before=h.count();
   await rejectsCode(suggest({prompt:'Explain water',draft:input},{key:secret,model:'test'},h.request,e=>diagnostics.push(e)),code);
   assert.equal(h.count()-before,1);
  }
  h.set(json(gemini));assert.deepEqual(await suggest({prompt:'Explain water',draft:input},{key:secret,model:'test'},h.request),suggestions);
  assert.equal(JSON.stringify(diagnostics).includes(secret),false);
 });
});

test('storyboard retries explicit HTTP unavailability within four attempts and recovers a validated plan',async()=>{
 await endpoint(async h=>{
  h.set((res,n)=>json(n<3?{error:secret}:planned,n<3?503:200)(res,n));
  const delays:number[]=[];
  const result=await planStoryboard(input,{key:secret,model:'test'},h.request,undefined,{sleep:async ms=>{delays.push(ms);}});
  assert.equal(result.attempts,3);assert.equal(result.content.scenes.length,3);assert.deepEqual(delays,[1000,2000]);assert.equal(h.count(),3);
  h.set(json({error:secret},503));const before=h.count();
  await rejectsCode(planStoryboard(input,{key:secret,model:'test'},h.request,undefined,{sleep:async()=>{}}),'PROVIDER_UNAVAILABLE');
  assert.equal(h.count()-before,4);
 });
});

test('storyboard socket loss and stalled body stop without retries; deadline remains bounded',async()=>{
 await endpoint(async h=>{
  for(const behavior of [sever,partial,stall]){
   h.set(behavior);const before=h.count(),started=performance.now();
   await rejectsCode(planStoryboard(input,{key:secret,model:'test'},h.request,undefined,{deadline:Date.now()+200}),'PROVIDER_OUTCOME_UNKNOWN');
   assert.equal(h.count()-before,1);assert.ok(performance.now()-started<3000);
  }
 });
});

test('speech real 401/429/503, lost/truncated/malformed bodies remain sanitized with one request',async()=>{
 await endpoint(async h=>{
  for(const [behavior,code] of [[json({error:secret},401),'SPEECH_ACCESS_DENIED'],[json({error:secret},429),'SPEECH_QUOTA_LIMIT'],[json({error:secret},503),'PROVIDER_OUTCOME_UNKNOWN'],[sever,'PROVIDER_OUTCOME_UNKNOWN'],[partial,'PROVIDER_OUTCOME_UNKNOWN'],[json(null),'PROVIDER_OUTCOME_UNKNOWN'],[(res:ServerResponse)=>res.end(secret),'PROVIDER_OUTCOME_UNKNOWN']] as const){
   h.set(behavior);const before=h.count();await rejectsCode(requestSpeech('Synthetic narration',renderConfig,secret,AbortSignal.timeout(3000),h.request),code);assert.equal(h.count()-before,1);
  }
  h.set(json(speech));assert.deepEqual(await requestSpeech('Synthetic narration',renderConfig,secret,AbortSignal.timeout(3000),h.request),speech);
 });
});

test('speech cancellation aborts a stalled body and redirects cannot forward the API key',async()=>{
 await endpoint(async h=>{
  h.set(stall);const started=performance.now();
  await rejectsCode(requestSpeech('Synthetic narration',renderConfig,secret,AbortSignal.timeout(150),h.request),'PROVIDER_OUTCOME_UNKNOWN');
  assert.ok(performance.now()-started<3000);assert.equal(h.count(),1);
  h.set(res=>{res.writeHead(307,{Location:'/unexpected-target'});res.end();});
  await rejectsCode(requestSpeech('Synthetic narration',renderConfig,secret,AbortSignal.timeout(3000),h.request),'PROVIDER_OUTCOME_UNKNOWN');
  assert.equal(h.count(),2);
 });
});

test('Meta real HTTP failures never repeat a publish POST; subsequent read can reconcile',async()=>{
 await endpoint(async h=>{
  const p=publishProvider(config,h.request);
  for(const [behavior,code] of [[json({error:{message:secret}},503),'PROVIDER_REJECTED'],[json({error:{code:4,message:secret}},429),'PROVIDER_RATE_LIMITED'],[json({error:{code:190,message:secret}},400),'RECONNECT_REQUIRED'],[sever,'PROVIDER_OUTCOME_UNCONFIRMED'],[partial,'PROVIDER_RESPONSE_INVALID']] as const){
   h.set(behavior);const before=h.count();await rejectsCode(p.publish('123',secret,'456'),code);assert.equal(h.count()-before,1);
  }
  h.set(json({status_code:'PUBLISHED'}));assert.equal(await p.status('456',secret),'PUBLISHED');
 });
});

test('Meta production twelve-second timeout includes response body consumption',async()=>{
 await endpoint(async h=>{
  h.set(stall);const started=performance.now();
  await rejectsCode(publishProvider(config,h.request).publish('123',secret,'456'),'PROVIDER_RESPONSE_INVALID');
  const elapsed=performance.now()-started;assert.ok(elapsed>=11000&&elapsed<16000,`Elapsed ${elapsed}`);assert.equal(h.count(),1);
 });
});
