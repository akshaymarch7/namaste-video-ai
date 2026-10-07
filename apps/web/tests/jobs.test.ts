import {setupVideos} from '../src/videos/setup';
import type {ExecutionAdapters} from '../src/jobs/execution';
import {syntheticSpeech} from '../../../src/pipeline/timing';
import {setupJobs,assertJobsReady} from '../src/jobs/setup';
import {generationService,runGenerationJob} from '../src/jobs/service';
import {dispatchJobs} from '../src/jobs/dispatch';
import {handleJobs} from '../src/jobs/http';
import {approveStoryboard} from '../src/storyboards/approval-service';
import {storyboardService} from '../src/storyboards/service';
import {draftService} from '../src/drafts/service';
import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {randomBytes,randomUUID} from 'node:crypto';
import {MongoClient} from 'mongodb';
import {MongoMemoryReplSet} from 'mongodb-memory-server';
import {setupDatabase} from '../src/db/setup';
import {setupProjects} from '../src/projects/setup';
import {setupDrafts} from '../src/drafts/setup';
import {setupIdeas} from '../src/ideas/setup';
import {setupStoryboards} from '../src/storyboards/setup';
import {setupStoryboardQueue} from '../src/storyboards/queue-setup';
import {setupEditableDrafts} from '../src/drafts/edit-setup';
import {setupStoryboardRevisions} from '../src/storyboards/revision-setup';
import {setupStoryboardSnapshots} from '../src/storyboards/snapshot-setup';
import {setupStoryboardApprovals} from '../src/storyboards/approval-setup';
import {setupStorage} from '../src/storage/setup';
import {setupAuth} from '../src/auth/setup';
import {createAuth} from '../src/auth/engine';
import {provisionUser} from '../src/auth/operator';
import {projectService} from '../src/projects/service';
let replica:MongoMemoryReplSet,client:MongoClient,db:ReturnType<MongoClient['db']>,deps:Awaited<ReturnType<typeof import('../src/auth/runtime').dependencies>>;
let owner:string,other:string,cookie:string,otherCookie:string;
const config={origin:'http://127.0.0.1:3002',secure:false,secret:randomBytes(48).toString('base64url')};
before(async()=>{
 replica=await MongoMemoryReplSet.create({binary:{version:'8.0.17'},replSet:{count:1,ip:'127.0.0.1',storageEngine:'wiredTiger'}});client=await new MongoClient(replica.getUri(),{promoteLongs:false}).connect();db=client.db('storage_test');
 for(const setup of [setupDatabase,setupProjects,setupDrafts,setupIdeas,setupStoryboards,setupStoryboardQueue,setupEditableDrafts,setupStoryboardRevisions,setupStoryboardSnapshots,setupStoryboardApprovals,setupStorage,setupJobs,setupVideos])await setup(db);
 await setupAuth(db,client,config);const auth=createAuth(db,client,config);deps={db,client,auth,config};const users=[];
 for(const email of ['owner@example.test','other@example.test']){const input={name:'Media QA',email,password:'Media-fixture-only-4829!'};const user=await provisionUser(db,client,config,input);const r=await auth.api.signInEmail({body:input,asResponse:true});users.push({id:user.userId,cookie:r.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ')});}
 [owner,other]=users.map(u=>u.id);[cookie,otherCookie]=users.map(u=>u.cookie);
},{timeout:180000});
after(async()=>{await client?.close();await replica?.stop();});
const sentence='Water moves through our world in a repeating cycle. The sun warms the surface and turns some liquid into invisible vapor. As this vapor rises and cools it condenses into tiny droplets. These droplets gather in clouds before returning to the ground as rain and collecting in rivers and lakes.';
function fixture(){return {schemaVersion:2,title:'The water cycle',audience:'School students',learningObjective:'Understand the journey of water.',language:'en',voicePreset:'daniel-test',sources:[],scenes:Array.from({length:3},(_,i)=>({id:`scene-${i}`,title:'A journey',kicker:'WATER',narration:sentence,pronunciation:[],visual:{component:i===2?'takeaway':'title',version:1,data:{labels:['Water']}},events:[{id:'reveal',targetId:'label-1',action:'reveal',cue:{phrase:'Water',occurrence:1,offsetMs:0},durationMs:400}],sourceIds:[]}))};}

async function seed(){const project=(await projectService(db,client,config.secret).create(owner,randomUUID(),{title:'Generation fixture'})).data!;const drafts=draftService(db,client);await drafts.save(owner,project.id,{expectedRevision:1,changes:{topic:'Water cycle'}});const svc=storyboardService(db,client,config.secret,()=>({model:'fixture',run:async()=>({content:fixture()})}));await svc.create(owner,project.id,randomUUID(),{expectedDraftRevision:2});const source=(await svc.list(owner,project.id,{limit:20})).data[0];const draft=await drafts.get(owner,project.id);const approval=(await approveStoryboard(db,client,owner,project.id,randomUUID(),{storyboardId:source.id,expectedDraftRevision:draft.revision,expectedDraftHash:draft.contentHash,expectedContentHash:source.contentHash,approve:true})).data;return {project,input:{storyboardId:source.id,approvalId:approval.id,expectedDraftRevision:draft.revision,expectedDraftHash:draft.contentHash,expectedContentHash:source.contentHash,confirm:true as const}};}
const service=()=>generationService(db,client);
const fail=(p:Promise<unknown>,code:string)=>assert.rejects(p,e=>(e as {code?:string}).code===code);
const request=(action:'create'|'latest'|'read'|'cancel',id:string,body?:unknown,headers:Record<string,string>={})=>handleJobs(new Request(config.origin+'/api/test',{method:body?'POST':'GET',headers:{Cookie:cookie,Origin:config.origin,'Content-Type':'application/json','Idempotency-Key':randomUUID(),...headers},...(body?{body:JSON.stringify(body)}:{})}),action,id,async()=>deps);
test('strict migration and readiness',async()=>{await setupJobs(db);await assertJobsReady(db);await assert.rejects(db.collection('generationJobs').insertOne({untrusted:1}));await fail(assertJobsReady(client.db('none')),'JOBS_SETUP_REQUIRED');});
test('admission freezes input, commands replay and one active project slot',async()=>{const s=await seed(),key=randomUUID();const [a,b]=await Promise.all([service().create(owner,s.project.id,key,s.input),service().create(owner,s.project.id,key,s.input)]);assert.equal(a.data.id,b.data.id);assert.equal(await db.collection('generationJobs').countDocuments({projectId:s.project.id}),1);assert.equal(await db.collection('generationOutbox').countDocuments({jobId:a.data.id}),1);await fail(service().create(owner,s.project.id,randomUUID(),s.input),'PROJECT_BUSY');await fail(service().create(owner,s.project.id,key,{...s.input,expectedDraftRevision:3}),'IDEMPOTENCY_KEY_REUSED');const row=await db.collection('generationJobs').findOne({_id:a.data.id as never});assert.deepEqual(row!.inputSnapshot.plan,fixture());});
test('HTTP owner/auth/origin/schema boundaries',async()=>{const s=await seed();assert.equal((await request('create',s.project.id,s.input,{Cookie:''})).status,401);assert.equal((await request('create',s.project.id,s.input,{Cookie:otherCookie})).status,404);assert.equal((await request('create',s.project.id,s.input,{Origin:'https://other.test'})).status,403);assert.equal((await request('create',s.project.id,{...s.input,confirm:false})).status,422);const r=await request('create',s.project.id,s.input);assert.equal(r.status,202);const id=(await r.json()).data.id;assert.equal((await request('read',id,undefined,{Cookie:otherCookie})).status,404);assert.equal((await request('read',id)).headers.get('cache-control'),'private, no-store');});
test('stale content and missing approval reject without creating job',async()=>{const s=await seed();await fail(service().create(owner,s.project.id,randomUUID(),{...s.input,approvalId:'apr_'+'0'.repeat(32)}),'APPROVAL_REQUIRED');await fail(service().create(owner,s.project.id,randomUUID(),{...s.input,expectedDraftHash:'0'.repeat(64)}),'HASH_MISMATCH');await draftService(db,client).save(owner,s.project.id,{expectedRevision:2,changes:{topic:'Changed'}});await fail(service().create(owner,s.project.id,randomUUID(),s.input),'REVISION_CONFLICT');assert.equal(await db.collection('generationJobs').countDocuments({projectId:s.project.id}),0);});
test('queued cancellation replays and releases only its own slot',async()=>{const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data,key=randomUUID();const result=await service().cancel(owner,j.id,key,{expectedRevision:1});assert.equal(result.data.state,'cancelled');assert.equal((await service().cancel(owner,j.id,key,{expectedRevision:1})).replayed,true);assert.equal(await runGenerationJob(db,client,j.id),false);const next=await service().create(owner,s.project.id,randomUUID(),s.input);await runGenerationJob(db,client,j.id);assert.equal((await db.collection('projects').findOne({_id:s.project.id as never}))!.activeJobId,next.data.id);});
test('cancel while running prevents completion and duplicate delivery does not claim live lease',async()=>{const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data;let release!:()=>void,entered!:()=>void;const started=new Promise<void>(r=>entered=r),wait=new Promise<void>(r=>release=r);const work=runGenerationJob(db,client,j.id,undefined,async()=>{entered();await wait;});await started;assert.equal(await runGenerationJob(db,client,j.id),false);const running=await service().get(owner,j.id);assert.equal(running.state,'running');await service().cancel(owner,j.id,randomUUID(),{expectedRevision:running.revision});release();await work;assert.equal((await service().get(owner,j.id)).state,'cancelled');});
test('preflight stops honestly with renderer dependency and no output/provider call',async()=>{const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data;await runGenerationJob(db,client,j.id);const done=await service().get(owner,j.id);assert.equal(done.state,'needs_input');assert.equal(done.errorCode,'RENDERER_NOT_CONNECTED');assert.equal((await db.collection('projects').findOne({_id:s.project.id as never}))!.activeJobId,undefined);assert.equal(await db.collection('assets').countDocuments({projectId:s.project.id}),0);});
test('deadline expiration is fenced and distinguishes queued expiration',async()=>{const s=await seed();let date=new Date();const svc=generationService(db,client,()=>date),j=(await svc.create(owner,s.project.id,randomUUID(),s.input)).data;date=new Date(date.getTime()+16*60000);assert.equal((await svc.get(owner,j.id)).errorCode,'QUEUE_EXPIRED');assert.equal(await runGenerationJob(db,client,j.id,()=>date),false);});
test('lease takeover fences late workers',async()=>{const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data;let release!:()=>void,entered!:()=>void;let date=new Date();const started=new Promise<void>(r=>entered=r),wait=new Promise<void>(r=>release=r);const first=runGenerationJob(db,client,j.id,()=>date,async()=>{entered();await wait;});await started;date=new Date(date.getTime()+91000);await runGenerationJob(db,client,j.id,()=>date);const second=await service().get(owner,j.id);assert.equal(second.attempt,2);release();await first;assert.equal((await service().get(owner,j.id)).revision,second.revision);});
test('outbox send failure remains recoverable and payload excludes content',async()=>{const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data;await db.collection('generationOutbox').updateMany({jobId:{$ne:j.id}},{$set:{state:'sent',availableAt:new Date(Date.now()+3600000)}});let date=new Date();await dispatchJobs(db,client,async()=>{throw Error('network');},()=>date);assert.equal((await db.collection('generationOutbox').findOne({jobId:j.id}))!.state,'pending');date=new Date(date.getTime()+16000);const events:any[]=[];await dispatchJobs(db,client,async e=>{events.push(e);},()=>date);assert.equal(events.length,1);assert.deepEqual(events[0].data,{jobId:j.id});await runGenerationJob(db,client,events[0].data.jobId);assert.equal((await service().get(owner,j.id)).state,'needs_input');});
test('disabled owner fails admission at worker and frees slot',async()=>{const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data;await db.collection('internalAccess').updateOne({provisionedUserId:owner},{$set:{enabled:false}});try{assert.equal((await request('read',j.id)).status,403);await runGenerationJob(db,client,j.id);assert.equal((await service().get(owner,j.id)).errorCode,'ACCESS_UNAVAILABLE');}finally{await db.collection('internalAccess').updateOne({provisionedUserId:owner},{$set:{enabled:true}});}});
test('job admission transaction rolls back slot and job when outbox insertion fails',async()=>{const s=await seed();const original=(await db.listCollections({name:'generationOutbox'},{nameOnly:false}).toArray())[0].options!.validator;await db.command({collMod:'generationOutbox',validator:{$and:[original,{jobId:{$exists:false}}]}});try{await assert.rejects(service().create(owner,s.project.id,randomUUID(),s.input));}finally{await db.command({collMod:'generationOutbox',validator:original});}assert.equal(await db.collection('generationJobs').countDocuments({projectId:s.project.id}),0);assert.equal((await db.collection('projects').findOne({_id:s.project.id as never}))!.activeJobId,undefined);});
test('deleted parent and corrupted frozen input cannot progress',async()=>{const a=await seed(),b=await seed(),ja=(await service().create(owner,a.project.id,randomUUID(),a.input)).data,jb=(await service().create(owner,b.project.id,randomUUID(),b.input)).data;await db.collection('projects').updateOne({_id:a.project.id as never},{$set:{deletedAt:new Date()}});await fail(service().get(owner,ja.id),'NOT_FOUND');await runGenerationJob(db,client,ja.id);assert.equal((await db.collection('generationJobs').findOne({_id:ja.id as never}))!.errorCode,'ACCESS_UNAVAILABLE');await db.collection('generationJobs').updateOne({_id:jb.id as never},{$set:{inputHash:'0'.repeat(64)}});await runGenerationJob(db,client,jb.id);assert.equal((await service().get(owner,jb.id)).errorCode,'INPUT_INVALID');});
test('signed Inngest route fails closed without configuration or signature',async()=>{const {NextRequest}=await import('next/server');const route=await import('../app/api/inngest/route');const saved=process.env.INNGEST_SIGNING_KEY,dev=process.env.INNGEST_DEV;try{delete process.env.INNGEST_DEV;delete process.env.INNGEST_SIGNING_KEY;assert.equal((await route.POST(new NextRequest('https://app.example.test/api/inngest',{method:'POST',body:'{}'}),{})).status,503);process.env.INNGEST_SIGNING_KEY='signkey-test-'+'0'.repeat(64);const response=await route.POST(new NextRequest('https://app.example.test/api/inngest',{method:'POST',body:'{}',headers:{'Content-Type':'application/json'}}),{});assert.ok([400,401,403].includes(response.status));}finally{if(saved===undefined)delete process.env.INNGEST_SIGNING_KEY;else process.env.INNGEST_SIGNING_KEY=saved;if(dev===undefined)delete process.env.INNGEST_DEV;else process.env.INNGEST_DEV=dev;}});

// Labelled in-memory media doubles test orchestration, not codec/provider quality.
function executionDouble(){
 const objects=new Map<string,{body:Uint8Array;hash:string;type:string}>();let speechCalls=0,renderCalls=0;
 const adapters:ExecutionAdapters={
  store:{async put(key,body,type,hash){const old=objects.get(key);if(old&&old.hash!==hash)throw Error('immutable conflict');objects.set(key,{body:Uint8Array.from(body),hash,type});},async verify(key,bytes,hash,type){const o=objects.get(key);assert.equal(o?.body.length,bytes);assert.equal(o?.hash,hash);assert.equal(o?.type,type);},async read(key,bytes,hash,type){await adapters.store.verify(key,bytes,hash,type);return objects.get(key)!.body;}},
  async speech(text){speechCalls++;const s=syntheticSpeech(text,20.7);return {audio:Buffer.from('labelled test audio').toString('base64'),alignment:s.alignment,duration:s.duration};},
  async render(){renderCalls++;return {video:Buffer.from('labelled test video'),captions:Buffer.from('WEBVTT\n'),duration:63};},
 };
 return {adapters,objects,calls:()=>({speechCalls,renderCalls})};
}
test('render execution freezes config and atomically exposes output; duplicate delivery spends nothing',async()=>{
 const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data,d=executionDouble();
 const frozen=await db.collection('generationJobs').findOne({_id:j.id as never});assert.equal(frozen!.inputSnapshot.renderConfig.voiceId,'onwK4e9ZLuTAKqWW03F9');
 await runGenerationJob(db,client,j.id,undefined,undefined,d.adapters);
 assert.equal((await service().get(owner,j.id)).state,'succeeded');assert.equal((await service().get(owner,j.id)).stage,'complete');
 assert.equal(await db.collection('assets').countDocuments({projectId:s.project.id,state:'ready'}),2);assert.equal(await db.collection('renderOutputs').countDocuments({jobId:j.id}),1);
 assert.deepEqual(d.calls(),{speechCalls:3,renderCalls:1});await runGenerationJob(db,client,j.id,undefined,undefined,d.adapters);assert.equal(d.calls().speechCalls,3);
 await fail(service().create(owner,s.project.id,randomUUID(),s.input),'REPEAT_ACK_REQUIRED');
 const next=(await service().create(owner,s.project.id,randomUUID(),{...s.input,acknowledgePossibleRepeat:true})).data;
 await service().cancel(owner,next.id,randomUUID(),{expectedRevision:1});assert.equal(await db.collection('assets').countDocuments({projectId:s.project.id,state:'ready'}),2);
});
test('ambiguous speech is journaled before dispatch and never automatically repeated',async()=>{
 const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data,d=executionDouble();let calls=0;
 d.adapters.speech=async()=>{calls++;assert.equal(await db.collection('speechStages').countDocuments({jobId:j.id,state:'request_started'}),1);throw Error('lost response');};
 await runGenerationJob(db,client,j.id,undefined,undefined,d.adapters);assert.equal((await service().get(owner,j.id)).errorCode,'PROVIDER_OUTCOME_UNKNOWN');
 await runGenerationJob(db,client,j.id,undefined,undefined,d.adapters);assert.equal(calls,1);assert.equal(await db.collection('assets').countDocuments({projectId:s.project.id}),0);
});
test('expired speech lease stops on ambiguous request and fences a late provider response',async()=>{
 const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data,d=executionDouble();let date=new Date(),release!:()=>void,entered!:()=>void;
 const started=new Promise<void>(r=>entered=r),waiting=new Promise<void>(r=>release=r),synthesize=d.adapters.speech;
 d.adapters.speech=async(...args)=>{entered();await waiting;return synthesize(...args);};
 const first=runGenerationJob(db,client,j.id,()=>date,undefined,d.adapters);await started;
 date=new Date(date.getTime()+91000);await runGenerationJob(db,client,j.id,()=>date,undefined,d.adapters);
 assert.equal((await service().get(owner,j.id)).errorCode,'PROVIDER_OUTCOME_UNKNOWN');release();await first;
 assert.equal(d.calls().speechCalls,1);assert.equal(await db.collection('renderOutputs').countDocuments({jobId:j.id}),0);
});
test('lease takeover reuses verified stored speech without spending for completed scenes',async()=>{
 const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data,d=executionDouble();let date=new Date(),release!:()=>void,entered!:()=>void;
 const started=new Promise<void>(r=>entered=r),waiting=new Promise<void>(r=>release=r),render=d.adapters.render;let renderAttempts=0;
 d.adapters.render=async(...args)=>{renderAttempts++;if(renderAttempts===1){entered();await waiting;}return render(...args);};
 const first=runGenerationJob(db,client,j.id,()=>date,undefined,d.adapters);await started;
 date=new Date(date.getTime()+91000);await runGenerationJob(db,client,j.id,()=>date,undefined,d.adapters);
 assert.equal((await service().get(owner,j.id)).state,'succeeded');assert.equal(d.calls().speechCalls,3);release();await first;
 assert.equal(await db.collection('renderOutputs').countDocuments({jobId:j.id}),1);
});
test('cancellation during render prevents asset promotion and keeps earlier output',async()=>{
 const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data,d=executionDouble(),render=d.adapters.render;
 d.adapters.render=async(...args)=>{const current=await service().get(owner,j.id);await service().cancel(owner,j.id,randomUUID(),{expectedRevision:current.revision});return render(...args);};
 await runGenerationJob(db,client,j.id,undefined,undefined,d.adapters);
 assert.equal((await service().get(owner,j.id)).state,'cancelled');assert.equal(await db.collection('assets').countDocuments({projectId:s.project.id}),0);assert.equal(await db.collection('renderOutputs').countDocuments({jobId:j.id}),0);
});
test('upload failure cannot expose a partial ready output',async()=>{
 const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data,d=executionDouble(),put=d.adapters.store.put;
 d.adapters.store.put=async(...args)=>{if(args[2]==='text/vtt')throw Error('storage failure');await put(...args);};
 await runGenerationJob(db,client,j.id,undefined,undefined,d.adapters);assert.equal((await service().get(owner,j.id)).state,'needs_input');
 assert.equal(await db.collection('assets').countDocuments({projectId:s.project.id}),0);assert.equal(await db.collection('renderOutputs').countDocuments({jobId:j.id}),0);
});
test('measured timing failure stops before renderer invocation',async()=>{
 const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data,d=executionDouble();
 d.adapters.speech=async text=>{const s=syntheticSpeech(text,5);return {audio:'dGVzdA==',alignment:s.alignment,duration:s.duration};};
 await runGenerationJob(db,client,j.id,undefined,undefined,d.adapters);assert.equal((await service().get(owner,j.id)).errorCode,'SPEECH_TIMING_INVALID');assert.equal(d.calls().renderCalls,0);
});
test('lost speech upload acknowledgement recovers exact stored bytes without repeating TTS',async()=>{
 const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data,d=executionDouble(),put=d.adapters.store.put;
 d.adapters.store.put=async(...args)=>{await put(...args);if(args[2]==='application/json')throw Error('lost acknowledgement');};
 await runGenerationJob(db,client,j.id,undefined,undefined,d.adapters);assert.equal((await service().get(owner,j.id)).state,'succeeded');assert.equal(d.calls().speechCalls,3);
});
test('same owner cannot start another leased generation in a different project',async()=>{
 const a=await seed(),b=await seed(),ja=(await service().create(owner,a.project.id,randomUUID(),a.input)).data,jb=(await service().create(owner,b.project.id,randomUUID(),b.input)).data,d=executionDouble();
 let release!:()=>void,entered!:()=>void;const started=new Promise<void>(r=>entered=r),wait=new Promise<void>(r=>release=r);
 const first=runGenerationJob(db,client,ja.id,undefined,async()=>{entered();await wait;},d.adapters);await started;
 assert.equal(await runGenerationJob(db,client,jb.id,undefined,undefined,d.adapters),false);assert.equal((await service().get(owner,jb.id)).state,'queued');
 release();await first;await runGenerationJob(db,client,jb.id,undefined,undefined,d.adapters);assert.equal((await service().get(owner,jb.id)).state,'succeeded');
});
test('failed final transaction exposes neither assets nor output; replay resumes verified speech',async()=>{
 const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data,d=executionDouble();
 const original=(await db.listCollections({name:'renderOutputs'},{nameOnly:false}).toArray())[0].options!.validator;
 await db.command({collMod:'renderOutputs',validator:{$and:[original,{jobId:{$exists:false}}]}});
 try{await assert.rejects(runGenerationJob(db,client,j.id,undefined,undefined,d.adapters));}finally{await db.command({collMod:'renderOutputs',validator:original});}
 assert.equal(await db.collection('assets').countDocuments({projectId:s.project.id}),0);
 const later=new Date(Date.now()+91000);await runGenerationJob(db,client,j.id,()=>later,undefined,d.adapters);
 assert.equal((await service().get(owner,j.id)).state,'succeeded');assert.equal(d.calls().speechCalls,3);
});

test('library filters follow generation outcomes and preserve earlier ready output',async()=>{
 const s=await seed(),projects=projectService(db,client,config.secret),d=executionDouble();
 const listed=async(filter:'ready'|'needs_attention',actor=owner)=>(await projects.list(actor,{filter,limit:100})).data.some(p=>p.id===s.project.id);
 const create=async()=> (await service().create(owner,s.project.id,randomUUID(),{...s.input,acknowledgePossibleRepeat:true})).data;
 let j=await create();await runGenerationJob(db,client,j.id,undefined,undefined,d.adapters);
 assert.equal(await listed('ready'),true);assert.equal(await listed('needs_attention'),false);assert.equal(await listed('ready',other),false);
 j=await create();const broken=executionDouble();broken.adapters.speech=async()=>{throw Error('labelled failure');};
 await runGenerationJob(db,client,j.id,undefined,undefined,broken.adapters);
 assert.equal(await listed('ready'),true);assert.equal(await listed('needs_attention'),true);assert.equal(await listed('needs_attention',other),false);
 j=await create();assert.equal(await listed('needs_attention'),false);
 await service().cancel(owner,j.id,randomUUID(),{expectedRevision:1});
 assert.equal(await listed('ready'),true);assert.equal(await listed('needs_attention'),false);
 j=await create();await runGenerationJob(db,client,j.id,undefined,undefined,executionDouble().adapters);
 assert.equal(await listed('ready'),true);assert.equal(await listed('needs_attention'),false);
});

test('queue expiration projects attention; repair restores old outcomes idempotently',async()=>{
 const {repairGenerationProjectFlags}=await import('../src/jobs/repair-project-flags');
 const s=await seed(),projects=projectService(db,client,config.secret),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data;
 const future=()=>new Date(Date.now()+16*60000);
 assert.equal((await generationService(db,client,future).get(owner,j.id)).errorCode,'QUEUE_EXPIRED');
 assert.equal((await projects.get(owner,s.project.id)).flags.needsAttention,true);
 assert.equal((await projects.get(owner,s.project.id)).flags.ready,false);
 const success=await seed(),job=(await service().create(owner,success.project.id,randomUUID(),success.input)).data;
 await runGenerationJob(db,client,job.id,undefined,undefined,executionDouble().adapters);
 await db.collection('projects').updateOne({_id:s.project.id as never},{$set:{'flags.needsAttention':false}});
 await db.collection('projects').updateOne({_id:success.project.id as never},{$set:{'flags.ready':false}});
 await repairGenerationProjectFlags(db,client);
 assert.equal((await projects.get(owner,s.project.id)).flags.needsAttention,true);
 assert.equal((await projects.get(owner,success.project.id)).flags.ready,true);
 assert.equal((await repairGenerationProjectFlags(db,client)).generationProjectFlagsRepaired,0);
});

test('video versions are atomic, paginated, selected with CAS and approved by exact bytes',async()=>{
 const {videoService}=await import('../src/videos/service'),{videoHash}=await import('../src/videos/materialize');
 const s=await seed(),svc=videoService(db,client),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data;
 await runGenerationJob(db,client,j.id,undefined,undefined,executionDouble().adapters);
 const first=(await svc.list(owner,s.project.id,1)).data[0];assert.equal(first.approval,null);
 const body={expectedOutputHash:first.outputHash,expectedRenderSpecHash:first.renderSpecHash,approve:true};
 await fail(svc.mutate(owner,first.id,'approve',randomUUID(),{...body,expectedOutputHash:'0'.repeat(64)}),'HASH_MISMATCH');
 await fail(svc.get(other,first.id),'NOT_FOUND');await fail(svc.list(other,s.project.id,20),'NOT_FOUND');
 const key=randomUUID(),a=await svc.mutate(owner,first.id,'approve',key,body);
 assert.equal(a.data.subjectHash,videoHash({outputHash:first.outputHash,renderSpecHash:first.renderSpecHash}));
 assert.equal((await svc.mutate(owner,first.id,'approve',key,body)).replayed,true);
 await fail(svc.mutate(owner,first.id,'approve',key,{...body,expectedOutputHash:'0'.repeat(64)}),'IDEMPOTENCY_KEY_REUSED');
 const next=(await service().create(owner,s.project.id,randomUUID(),{...s.input,acknowledgePossibleRepeat:true})).data;
 await runGenerationJob(db,client,next.id,undefined,undefined,executionDouble().adapters);
 const page=await svc.list(owner,s.project.id,1),second=page.data[0];assert.notEqual(second.id,first.id);assert.equal(second.approval,null);assert.equal(page.project.selectedVideoId,first.id);assert.equal(page.project.latestReadyVideoId,second.id);
 assert.equal((await svc.list(owner,s.project.id,1,page.page.nextCursor!)).data[0].id,first.id);
 const selectionKey=randomUUID();await svc.mutate(owner,second.id,'select',selectionKey,{expectedProjectRevision:page.project.revision});
 assert.equal((await svc.mutate(owner,second.id,'select',selectionKey,{expectedProjectRevision:page.project.revision})).replayed,true);
 await fail(svc.mutate(owner,first.id,'select',randomUUID(),{expectedProjectRevision:page.project.revision}),'REVISION_CONFLICT');
 assert.equal((await svc.get(owner,first.id)).approval!.id,a.data.id);
});

test('video HTTP rejects unauthenticated, foreign, CSRF and extra fields; approval replay stays private',async()=>{
 const {handleVideos}=await import('../src/videos/http');const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data;
 await runGenerationJob(db,client,j.id,undefined,undefined,executionDouble().adapters);
 const call=(action:'list'|'read'|'approve',id:string,headers:Record<string,string>,body?:unknown,query='')=>handleVideos(new Request(config.origin+'/api/test'+query,{method:body?'POST':'GET',headers,...(body?{body:JSON.stringify(body)}:{})}),action,id,async()=>deps);
 assert.equal((await call('list',s.project.id,{})).status,401);
 assert.equal((await call('list',s.project.id,{Cookie:otherCookie})).status,404);
 assert.equal((await call('list',s.project.id,{Cookie:cookie},undefined,'?limit=1&limit=2')).status,422);
 const response=await call('list',s.project.id,{Cookie:cookie});assert.equal(response.headers.get('cache-control'),'private, no-store');const v=(await response.json()).data[0];
 const body={expectedOutputHash:v.outputHash,expectedRenderSpecHash:v.renderSpecHash,approve:true},headers={Cookie:cookie,Origin:config.origin,'Content-Type':'application/json','Idempotency-Key':randomUUID()};
 assert.equal((await call('approve',v.id,{...headers,Origin:'https://foreign.test'},body)).status,403);
 assert.equal((await call('approve',v.id,headers,{...body,ownerId:other})).status,422);
 assert.equal((await call('approve',v.id,headers,body)).status,200);
 assert.equal((await call('approve',v.id,headers,body)).headers.get('Idempotency-Replayed'),'true');
 // Tombstone in the DB to exercise lifecycle denial even for recorded commands.
 await db.collection('projects').updateOne({_id:s.project.id as never},{$set:{deletedAt:new Date()}});
 assert.equal((await call('approve',v.id,headers,body)).status,404);assert.equal((await call('read',v.id,headers)).status,404);
});

test('legacy outputs backfill once without approving or overriding a user selection',async()=>{
 const {backfillVideos}=await import('../src/videos/materialize'),{videoService}=await import('../src/videos/service');
 const s=await seed(),j=(await service().create(owner,s.project.id,randomUUID(),s.input)).data;await runGenerationJob(db,client,j.id,undefined,undefined,executionDouble().adapters);
 const v=(await videoService(db,client).list(owner,s.project.id,20)).data[0];await db.collection('videos').deleteOne({_id:v.id as never});
 assert.equal((await backfillVideos(db,client)).videosBackfilled,1);assert.equal((await backfillVideos(db,client)).videosBackfilled,0);
 assert.equal((await videoService(db,client).get(owner,v.id)).approval,null);
});
