import assert from 'node:assert/strict';
import {test} from 'node:test';
import {validateStoryboard, StoryboardInvalid} from '../src/storyboards/contracts';
import {planStoryboard, decodePlannerCandidate, plannerResponseSchema, type PlanningDiagnostic} from '../src/storyboards/planner';
const input={topic:'How the water cycle works',audience:'School students',notes:'Water evaporates and condenses.',voicePreset:'daniel-test'};
const sentence='Water moves through our world in a repeating cycle. The sun warms the surface and turns some liquid into invisible vapor. As this vapor rises and cools it condenses into tiny droplets. These droplets gather in clouds before returning to the ground as rain and collecting in rivers and lakes.';
function fixture(){return {schemaVersion:2,title:'The water cycle',audience:'School students',learningObjective:'Understand the journey of water.',language:'en',voicePreset:'daniel-test',sources:[],scenes:Array.from({length:3},(_,i)=>({id:`scene-${i}`,title:'A journey',kicker:'WATER',narration:sentence,pronunciation:[],visual:{component:i===2?'takeaway':'title',version:1,data:{labels:['Water']}},events:[{id:'reveal',targetId:'label-1',action:'reveal',cue:{phrase:'Water',occurrence:1,offsetMs:0},durationMs:400}],sourceIds:[]}))};}
const bad=(raw:unknown,code:string)=>assert.throws(()=>validateStoryboard(raw,input),(e:unknown)=>e instanceof StoryboardInvalid&&e.issues.some(i=>i.code===code));
const wire=(raw:any)=>raw.scenes?{...raw,scenes:raw.scenes.map((scene:any)=>({...scene,visual:{component:scene.visual.component,version:scene.visual.version,dataJson:JSON.stringify(scene.visual.data)}}))}:raw;
const response=(raw:unknown)=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(wire(raw))}]}}]});
const rejects=(promise:Promise<unknown>,code:string)=>assert.rejects(promise,(e:unknown)=>(e as {code:string}).code===code);
test('valid bounded plan has a transparent duration estimate and preserves narration',()=>{
 const result=validateStoryboard(fixture(),input);assert.equal(result.content.schemaVersion,2);assert.equal(result.wordCount,150);assert.equal(result.estimatedDurationSeconds,60);assert.equal(result.content.scenes[0].narration,sentence);
});
test('duplicate IDs, missing cues, unsupported targets and actions are rejected',()=>{
 let p=fixture();p.scenes[1].id=p.scenes[0].id;bad(p,'DUPLICATE_ID');
 p=fixture();p.scenes[0].events[0].cue.phrase='absent phrase';bad(p,'MISSING_CUE');
 p=fixture();p.scenes[0].events[0].cue.occurrence=2;bad(p,'MISSING_CUE');
 p=fixture();p.scenes[0].events[0].targetId='wrong';bad(p,'INVALID_TARGET_ACTION');
 p=fixture();p.scenes[0].events[0].action='connect';bad(p,'INVALID_TARGET_ACTION');
});
test('strict registry rejects arbitrary visual code, versions and unknown fields',()=>{
 const p=fixture();assert.throws(()=>validateStoryboard({...p,script:'alert(1)'},input));
 p.scenes[0].visual.version=2;assert.throws(()=>validateStoryboard(p,input));
 const q=fixture();q.scenes[0].visual.component='chart';assert.throws(()=>validateStoryboard(q,input));
});
test('flow endpoints, target uniqueness and connections are checked',()=>{
 const p:any=fixture();p.scenes[0].visual={component:'flow',version:1,data:{steps:[{id:'a',label:'Warm'},{id:'b',label:'Rise'}],edges:[{id:'edge',from:'a',to:'b'}]}};p.scenes[0].events[0].targetId='edge';p.scenes[0].events[0].action='connect';validateStoryboard(p,input);
 p.scenes[0].visual.data.edges[0].to='unknown';bad(p,'INVALID_EDGE');p.scenes[0].visual.data.edges[0].to='b';p.scenes[0].visual.data.edges[0].id='a';bad(p,'DUPLICATE_ID');
});
test('comparison side targets are bounded to known panels',()=>{
 const p:any=fixture();p.scenes[0].visual={component:'comparison',version:1,data:{left:{heading:'Warm',points:['Evaporation']},right:{heading:'Cool',points:['Condensation']}}};p.scenes[0].events[0].targetId='left';p.scenes[0].events[0].action='compare';validateStoryboard(p,input);
 p.scenes[0].events[0].targetId='third';bad(p,'INVALID_TARGET_ACTION');
});
test('sources must be declared and supplied note excerpts cannot be invented',()=>{
 const p:any=fixture();p.sources=[{id:'notes',kind:'provided_notes',text:'Water evaporates'}];p.scenes[0].sourceIds=['notes'];validateStoryboard(p,input);
 p.sources[0].text='Invented evidence';bad(p,'UNSUPPORTED_SOURCE');p.sources=[];bad(p,'UNKNOWN_SOURCE');
});
test('pronunciation matches, overlap, narration length and voice are validated',()=>{
 const p:any=fixture();p.scenes[0].pronunciation=[{phrase:'Water',occurrence:1,spokenAs:'Water'}];validateStoryboard(p,input);
 p.scenes[0].pronunciation.push({...p.scenes[0].pronunciation[0]});bad(p,'OVERLAPPING_PRONUNCIATION');
 p.scenes[0].pronunciation=[{phrase:'absent',occurrence:1,spokenAs:'anything'}];bad(p,'MISSING_PHRASE');
 const short=fixture();short.scenes.forEach(s=>s.narration='Water moves through our world.');bad(short,'DURATION_ESTIMATE_OUT_OF_RANGE');
 try{validateStoryboard(short,input);}catch(e){assert.ok((e as StoryboardInvalid).issues.some(i=>i.code==='DURATION_ESTIMATE_OUT_OF_RANGE'&&i.actual===15&&i.minimum===150&&i.maximum===225));}
 assert.throws(()=>validateStoryboard(fixture(),{...input,voicePreset:'other'}));
});
test('planner calls fixed provider once with structured output and exact saved input',async()=>{
 let calls=0;const events:PlanningDiagnostic[]=[];
 const mock=(async(url:string,options:RequestInit)=>{calls++;assert.match(url,/models\/gemini-3.5-flash-lite:generateContent$/);assert.equal(options.redirect,'error');assert.equal(new Headers(options.headers).get('x-goog-api-key'),'fixture-key');const body=JSON.parse(options.body as string);assert.deepEqual(JSON.parse(body.contents[0].parts[0].text).savedIdea,input);assert.equal(body.generationConfig.responseMimeType,'application/json');assert.match(body.systemInstruction.parts[0].text,/Wire-format exception/);return response(fixture());}) as typeof fetch;
 const result=await planStoryboard(input,{key:'fixture-key',model:'gemini-3.5-flash-lite'},mock,e=>events.push(e));assert.equal(calls,1);assert.equal(result.attempts,1);assert.equal(events[0].category,'OK');
});
test('one completed invalid candidate receives one bounded repair with safe issue codes',async()=>{
 let calls=0;const invalid=fixture();invalid.scenes[0].events[0].cue.phrase='absent';
 const result=await planStoryboard(input,{key:'key',model:'test'},(async(_url:string,options:RequestInit)=>{calls++;if(calls===1)return response(invalid);const repair=JSON.parse(JSON.parse(options.body as string).contents[0].parts[0].text).repair;assert.ok(repair.issues.some((x:any)=>x.code==='MISSING_CUE'));return response(fixture());}) as typeof fetch);
 assert.equal(calls,2);assert.equal(result.attempts,2);
});
test('repair exhaustion stops; provider failures, timeouts and truncation never retry',async()=>{
 let calls=0;await rejects(planStoryboard(input,{key:'key',model:'test'},(async()=>{calls++;return response({});}) as typeof fetch),'STORYBOARD_INVALID');assert.equal(calls,2);
 for(const value of ['timeout','503','truncated']){calls=0;await rejects(planStoryboard(input,{key:'key',model:'test'},(async()=>{calls++;if(value==='timeout')throw Object.assign(new Error('private'),{name:'TimeoutError'});return value==='503'?new Response('private',{status:503}):Response.json({candidates:[{finishReason:'MAX_TOKENS'}]});}) as typeof fetch),value==='timeout'?'PROVIDER_OUTCOME_UNKNOWN':value==='503'?'PROVIDER_UNAVAILABLE':'PROVIDER_RESPONSE_INVALID');assert.equal(calls,1);}
});
test('invalid inputs make no provider call; diagnostics omit content and tolerate broken loggers',async()=>{
 let calls=0;const mock=(async()=>{calls++;return response(fixture());}) as typeof fetch;
 await rejects(planStoryboard({...input,topic:' '},{key:'key',model:'test'},mock),'INVALID_DRAFT');assert.equal(calls,0);
 const events:PlanningDiagnostic[]=[];await planStoryboard(input,{key:'key',model:'test'},mock,e=>events.push(e));assert.deepEqual(Object.keys(events[0]).sort(),['attempt','category','durationMs','httpStatus']);
 await planStoryboard(input,{key:'key',model:'test'},mock,()=>{throw Error('logger unavailable');});
});

test('wire JSON decodes into the strict registry and rejects arbitrary or oversized payloads',()=>{
 const raw=wire(fixture());assert.deepEqual(validateStoryboard(decodePlannerCandidate(raw),input).content,fixture());
 raw.scenes[0].visual.dataJson='{"labels":["Water"],"script":"alert(1)"}';assert.throws(()=>validateStoryboard(decodePlannerCandidate(raw),input));
 raw.scenes[0].visual.dataJson='x'.repeat(4001);assert.throws(()=>decodePlannerCandidate(raw));
});

test('provider grammar omits unsupported complexity while runtime bounds remain strict',()=>{
 const schema=JSON.stringify(plannerResponseSchema());assert.equal(schema.includes('maxItems'),false);assert.equal(schema.includes('pattern'),false);assert.ok(schema.includes('dataJson'));
 const p=fixture();p.scenes[0].title='x'.repeat(66);assert.throws(()=>validateStoryboard(p,input));
});
