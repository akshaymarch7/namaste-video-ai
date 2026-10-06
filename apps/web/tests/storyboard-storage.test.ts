import {setupStoryboardRevisions,assertStoryboardRevisionsReady} from '../src/storyboards/revision-setup';
import {revisionRequest} from '../src/storyboards/api-contracts';
import {setupEditableDrafts} from '../src/drafts/edit-setup';
import {runStoryboardJob} from '../src/storyboards/worker';
import { setupStoryboardQueue } from '../src/storyboards/queue-setup';
import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { MongoClient, Long } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { setupDatabase } from '../src/db/setup';
import { setupProjects } from '../src/projects/setup';
import { setupDrafts, assertDraftsReady } from '../src/drafts/setup';
import { setupIdeas, assertIdeasReady } from '../src/ideas/setup';
import { setupStoryboards, assertStoryboardsReady } from '../src/storyboards/setup';
import { storyboardService, storyboardHashes, type StoryboardProvider } from '../src/storyboards/service';
import { handleStoryboards } from '../src/storyboards/http';
import { validateStoryboard } from '../src/storyboards/contracts';
import { storyboardView, storyboardReceipt } from '../src/storyboards/api-contracts';
import { ideaService } from '../src/ideas/service';
import { handleIdeas } from '../src/ideas/http';
import { ProviderError } from '../src/ideas/providers';
import { draftService } from '../src/drafts/service';
import { projectService, canonical } from '../src/projects/service';
import { handleProjects } from '../src/projects/http';
import { setupAuth } from '../src/auth/setup';
import { createAuth } from '../src/auth/engine';
import { provisionUser } from '../src/auth/operator';
let replica: MongoMemoryReplSet, client: MongoClient;
let db: ReturnType<MongoClient['db']>, drafts: ReturnType<typeof draftService>, projects: ReturnType<typeof projectService>;
let deps: Awaited<ReturnType<typeof import('../src/auth/runtime').dependencies>>;
let owner: string, other: string, cookie: string, otherCookie: string;
const config = { origin: 'http://127.0.0.1:3002', secure: false, secret: randomBytes(48).toString('base64url') };
before(async () => {
  replica = await MongoMemoryReplSet.create({ binary: { version: '8.0.17' }, replSet: { count: 1, ip: '127.0.0.1', storageEngine: 'wiredTiger' } });
  client = await new MongoClient(replica.getUri(), { promoteLongs: false }).connect(); db = client.db('drafts_test');
  await setupDatabase(db); await setupProjects(db); await setupDrafts(db); await setupIdeas(db); await setupStoryboards(db); await setupStoryboardQueue(db); await setupEditableDrafts(db); await setupStoryboardRevisions(db); await setupAuth(db, client, config);
  const auth = createAuth(db, client, config); deps = { db, client, config, auth };
  drafts = draftService(db, client); projects = projectService(db, client, config.secret);
  const identities = [];
  for (const email of ['owner@example.test', 'other@example.test']) {
    const input = { name: 'Draft Tester', email, password: 'Draft-fixture-only-987!' };
    const user = await provisionUser(db, client, config, input);
    const response = await auth.api.signInEmail({ body: input, asResponse: true });
    identities.push({ id: user.userId, cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') });
  }
  [owner, other] = identities.map(value => value.id); [cookie, otherCookie] = identities.map(value => value.cookie);
}, { timeout: 180000 });
after(async () => { await client?.close(); await replica?.stop(); });
const sentence='Water moves through our world in a repeating cycle. The sun warms the surface and turns some liquid into invisible vapor. As this vapor rises and cools it condenses into tiny droplets. These droplets gather in clouds before returning to the ground as rain and collecting in rivers and lakes.';
function fixture(){return {schemaVersion:2,title:'The water cycle',audience:'School students',learningObjective:'Understand the journey of water.',language:'en',voicePreset:'daniel-test',sources:[],scenes:Array.from({length:3},(_,i)=>({id:`scene-${i}`,title:'A journey',kicker:'WATER',narration:sentence,pronunciation:[],visual:{component:i===2?'takeaway':'title',version:1,data:{labels:['Water']}},events:[{id:'reveal',targetId:'label-1',action:'reveal',cue:{phrase:'Water',occurrence:1,offsetMs:0},durationMs:400}],sourceIds:[]}))};}
const rejects = (promise: Promise<unknown>, code: string) => assert.rejects(promise, (error: unknown) => (error as {code:string}).code === code);
const make = async (user=owner) => {
  const item=(await projects.create(user,randomUUID(),{title:'Storyboard test'})).data!;
  await drafts.save(user,item.id,{expectedRevision:1,changes:{topic:'How the water cycle works'}});return item;
};
let calls=0;
const provider=():StoryboardProvider=>({model:'fixture-model',run:async()=>{calls++;return {content:fixture()};}});
const service=(clock?:()=>Date,p=provider)=>storyboardService(db,client,config.secret,p,clock);
const input={expectedDraftRevision:2};
const req=(id:string,action:'create'|'read'|'list'|'latest',body?:unknown,headers:Record<string,string>={},query='')=>handleStoryboards(new Request(`${config.origin}/api/test${query}`,{method:action==='create'?'POST':'GET',headers:{Cookie:cookie,Origin:config.origin,'Content-Type':'application/json','Idempotency-Key':randomUUID(),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}),action,id,async()=>deps,provider);
function deferredProvider(){let release!:(value:{content:unknown})=>void,enter!:()=>void;const started=new Promise<void>(r=>{enter=r});const factory=():StoryboardProvider=>({model:'fixture-model',run:async()=>{enter();return new Promise(r=>{release=r});}});return {factory,started,finish:()=>release({content:fixture()})};}
test('migration replays, enforces nested schema and unique receipt/result indexes',async()=>{
 await setupStoryboards(db); await setupStoryboardQueue(db);await assertStoryboardsReady(db);await rejects(assertStoryboardsReady(client.db('no_storyboards')),'STORYBOARD_SETUP_REQUIRED');
 await assert.rejects(db.collection('storyboards').insertOne({unexpected:true}));
 const item=await make(),result=await service().create(owner,item.id,randomUUID(),input);
 const doc=await db.collection('storyboards').findOne({_id:result.data.storyboardId as never});assert.ok(doc);
 const bad=structuredClone(doc);bad._id='stb_'+randomBytes(16).toString('hex') as never;bad.createdByJobId='job_'+randomBytes(16).toString('hex');bad.content.scenes[0].visual.data.script='alert(1)';
 await assert.rejects(db.collection('storyboards').insertOne(bad));
 await assert.rejects(db.collection('storyboards').insertOne({...doc,_id:'stb_'+randomBytes(16).toString('hex') as never}));
});
test('valid candidate persists atomically, has canonical hashes and never edits or selects the draft',async()=>{
 const item=await make(),saved=await drafts.get(owner,item.id),key=randomUUID(),before=calls;
 const response=await req(item.id,'create',input,{'Idempotency-Key':key});assert.equal(response.status,202);assert.equal(response.headers.get('Cache-Control'),'private, no-store');
 const queued=storyboardReceipt.parse((await response.json()).data);assert.equal(queued.state,'running');assert.equal(queued.stage,'queued');assert.equal(calls,before);await runStoryboardJob(db,client,provider);const data=(await service().latest(owner,item.id))!;assert.equal(data.state,'completed');assert.ok(data.storyboardId);
 const read=await req(data.storyboardId!,'read');assert.equal(read.status,200);const candidate=storyboardView.parse((await read.json()).data);
 assert.deepEqual(candidate.content,fixture());assert.equal(candidate.stale,false);assert.equal(candidate.estimatedDurationSeconds,60);assert.equal(candidate.contentHash,storyboardHashes(candidate.content).contentHash);
 assert.deepEqual(await drafts.get(owner,item.id),saved);assert.equal((await projects.get(owner,item.id)).currentStoryboardId,null);assert.equal((await projects.get(owner,item.id)).activeJobId,null);
 const replay=await req(item.id,'create',input,{'Idempotency-Key':key});assert.equal(replay.headers.get('Idempotency-Replayed'),'true');assert.equal((await replay.json()).data.id,data.id);assert.equal(calls,before+1);
 assert.equal((await (await req(item.id,'latest')).json()).data.id,data.id);
 assert.equal((await req(item.id,'create',{expectedDraftRevision:1},{'Idempotency-Key':key})).status,409);
 await rejects(projects.remove(owner,item.id,randomUUID(),{expectedRevision:1,confirm:true}),'PROJECT_DELETE_UNAVAILABLE');
});
test('auth, ownership, origin, query and strict bodies reject before provider work',async()=>{
 const item=await make(),before=calls;
 assert.equal((await req(item.id,'create',input,{Cookie:''})).status,401);
 for(const action of ['create','latest','list'] as const) assert.equal((await req(item.id,action,action==='create'?input:undefined,{Cookie:otherCookie})).status,404);
 assert.equal((await req(item.id,'create',input,{Origin:'https://evil.example'})).status,403);
 for(const body of [{},{...input,ownerId:'x'},{expectedDraftRevision:0}])assert.equal((await req(item.id,'create',body)).status,422);
 assert.equal((await req(item.id,'create',input,{'Idempotency-Key':''})).status,422);
 for(const query of ['?limit=0','?limit=51','?limit=1&limit=2','?unknown=1']) assert.equal((await req(item.id,'list',undefined,{},query)).status,422);
 assert.equal((await req(item.id,'latest',undefined,{},'?x=1')).status,422);
 assert.equal((await req(item.id,'create',{expectedDraftRevision:1})).status,409);
 const blank=(await projects.create(owner,randomUUID(),{title:'Blank'})).data!;assert.equal((await req(blank.id,'create',{expectedDraftRevision:1})).status,422);
 assert.equal(calls,before);
 const result=await service().create(owner,item.id,randomUUID(),input);
 assert.equal((await req(result.data.storyboardId!,'read',undefined,{Cookie:otherCookie})).status,404);
 await db.collection('internalAccess').updateOne({userId:owner},{$set:{enabled:false}});
 // Disable by normalized email, as admission records are email-keyed.
 await db.collection('internalAccess').updateOne({normalizedEmail:'owner@example.test'},{$set:{enabled:false}});
 assert.equal((await req(item.id,'list')).status,403);
 await db.collection('internalAccess').updateOne({normalizedEmail:'owner@example.test'},{$set:{enabled:true}});
});
test('same-key running replay, shared slot and edits during generation retain the source snapshot',async()=>{
 const item=await make(),deferred=deferredProvider(),svc=service(undefined,deferred.factory),key=randomUUID();
 const first=svc.create(owner,item.id,key,input);await deferred.started;
 assert.equal((await svc.create(owner,item.id,key,input)).data.state,'running');
 assert.equal((await req(item.id,'latest')).status,202);
 await rejects(svc.create(owner,item.id,randomUUID(),input),'PROJECT_BUSY');
 await rejects(ideaService(db,client,()=>({model:'fixture',run:async()=>[]})).create(owner,item.id,randomUUID(),{...input,prompt:'Ideas'}),'PROJECT_BUSY');
 await drafts.save(owner,item.id,{expectedRevision:2,changes:{topic:'Binary search'}});
 deferred.finish();const result=await first,candidate=await svc.get(owner,result.data.storyboardId!);assert.equal(candidate.stale,true);assert.equal(candidate.sourceDraftRevision,2);
 assert.equal((await drafts.get(owner,item.id)).topic,'Binary search');assert.equal((await projects.get(owner,item.id)).currentStoryboardId,null);
});
test('deadline expires through brainstorming and late storyboard completion cannot release a newer slot',async()=>{
 const item=await make();let date=new Date();const old=deferredProvider(),svc=service(()=>date,old.factory);
 const key=randomUUID(),first=svc.create(owner,item.id,key,input);await old.started;date=new Date(date.getTime()+181000);
 let release!:()=>void,entered!:()=>void;const started=new Promise<void>(r=>{entered=r});
 const ideas=ideaService(db,client,()=>({model:'fixture',run:async()=>{entered();await new Promise<void>(r=>{release=r});return Array.from({length:3},()=>({title:'Water',topic:'Water cycle',angle:'Journey'}));}}),()=>date);
 const newer=ideas.create(owner,item.id,randomUUID(),{...input,prompt:'Ideas'});await started;
 const slot=(await projects.get(owner,item.id)).activeJobId;
 old.finish();assert.equal((await first).data.state,'unknown');assert.equal((await projects.get(owner,item.id)).activeJobId,slot);
 assert.equal((await svc.create(owner,item.id,key,input)).data.state,'unknown');assert.equal(await db.collection('storyboards').countDocuments({projectId:item.id}),0);
 release();await newer;
});
test('storyboard admission expires an abandoned idea receipt',async()=>{
 const item=await make();let date=new Date(),release!:(v:any)=>void,entered!:()=>void;const started=new Promise<void>(r=>{entered=r});
 const ideas=ideaService(db,client,()=>({model:'fixture',run:async()=>{entered();return new Promise(r=>{release=r});}}),()=>date);
 const old=ideas.create(owner,item.id,randomUUID(),{...input,prompt:'Ideas'});await started;date=new Date(date.getTime()+46000);
 assert.equal((await service(()=>date).create(owner,item.id,randomUUID(),input)).data.state,'completed');
 release([]);assert.equal((await old).state,'unknown');
});
test('invalid and unknown provider outcomes persist safely and replay never regenerates',async()=>{
 const item=await make();
 for(const failure of ['invalid','unknown','auth']){
  let count=0;const svc=service(undefined,()=>({model:'fixture',run:async()=>{count++;if(failure==='invalid')return {content:{private:'secret'}};throw failure==='auth'?new ProviderError('PROVIDER_AUTHORIZATION'):Error('private secret');}}));
  const key=randomUUID(),result=await svc.create(owner,item.id,key,input);
  assert.equal(result.data.state,failure==='unknown'?'unknown':'failed');assert.equal(result.data.storyboardId,null);assert.equal(JSON.stringify(result).includes('secret'),false);
  await svc.create(owner,item.id,key,input);assert.equal(count,1);
 }
 assert.equal(await db.collection('storyboards').countDocuments({projectId:item.id}),0);
});
test('history pagination binds owner/project, rejects tampering and expires; reads refuse deleted parents',async()=>{
 const item=await make(),another=await make();let date=new Date();const svc=service(()=>date);
 for(let i=0;i<3;i++)await svc.create(owner,item.id,randomUUID(),input);
 const first=await svc.list(owner,item.id,{limit:2});assert.equal(first.page.hasMore,true);assert.equal('content' in first.data[0],false);
 const cursor=first.page.nextCursor!;const second=await svc.list(owner,item.id,{limit:2,cursor});assert.equal(second.page.hasMore,false);assert.equal(new Set([...first.data,...second.data].map(x=>x.id)).size,3);
 await rejects(svc.list(owner,another.id,{limit:2,cursor}),'INVALID_CURSOR');await rejects(svc.list(owner,item.id,{limit:2,cursor:cursor+'x'}),'INVALID_CURSOR');
 date=new Date(date.getTime()+86400001);await rejects(svc.list(owner,item.id,{limit:2,cursor}),'INVALID_CURSOR');
 await db.collection('projects').updateOne({_id:item.id as never},{$set:{deletedAt:new Date()}});
 for(const call of [()=>svc.get(owner,first.data[0].id),()=>svc.list(owner,item.id,{limit:2}),()=>svc.latest(owner,item.id),()=>svc.create(owner,item.id,randomUUID(),input)])await rejects(call(),'NOT_FOUND');
});
test('hash policy ignores event timing but includes spoken substitutions and semantic labels',()=>{
 const plan=validateStoryboard(fixture(),{notes:'',voicePreset:'daniel-test'}).content,original=storyboardHashes(plan);
 plan.scenes[0].events[0].durationMs=500;assert.notEqual(storyboardHashes(plan).contentHash,original.contentHash);assert.equal(storyboardHashes(plan).storyHash,original.storyHash);
 plan.scenes[0].narration+=' Extra.';assert.notEqual(storyboardHashes(plan).storyHash,original.storyHash);
});
test('simultaneous identical commands call the planner only once',async()=>{
 const item=await make(),key=randomUUID(),before=calls;
 const results=await Promise.all(Array.from({length:4},()=>service().create(owner,item.id,key,input)));
 assert.equal(new Set(results.map(x=>x.data.id)).size,1);assert.equal(calls,before+1);
 assert.equal(await db.collection('storyboards').countDocuments({projectId:item.id}),1);
});
test('failed candidate insert rolls back completion; recovery expires without another provider call',async()=>{
 const item=await make(),deferred=deferredProvider();let date=new Date();const svc=service(()=>date,deferred.factory),key=randomUUID();
 const pending=svc.create(owner,item.id,key,input);await deferred.started;
 // Reject only this project's insert, exercising the real transaction rollback.
 const info=(await db.listCollections({name:'storyboards'},{nameOnly:false}).toArray())[0];
 await db.command({collMod:'storyboards',validator:{$and:[info.options!.validator,{projectId:{$ne:item.id}}]}});
 try { deferred.finish();await assert.rejects(pending); } finally {await db.command({collMod:'storyboards',validator:info.options!.validator});}
 assert.equal((await svc.latest(owner,item.id))?.state,'running');assert.equal(await db.collection('storyboards').countDocuments({projectId:item.id}),0);
 assert.equal((await svc.create(owner,item.id,key,input)).data.state,'running');
 date=new Date(date.getTime()+181000);assert.equal((await svc.latest(owner,item.id))?.state,'unknown');assert.equal((await projects.get(owner,item.id)).activeJobId,null);
});

test('queued work survives the response, uses its saved snapshot, and two workers claim it once',async()=>{
 const item=await make(),key=randomUUID(),deferred=deferredProvider();
 const svc=storyboardService(db,client,config.secret,provider,undefined,true);
 const queued=await svc.create(owner,item.id,key,input);assert.equal(queued.data.stage,'queued');
 await drafts.save(owner,item.id,{expectedRevision:2,changes:{topic:'Changed after enqueue'}});
 let seen='';const factory=()=>{const adapter=deferred.factory();return {...adapter,run:async(draft:Parameters<StoryboardProvider['run']>[0],context:Parameters<StoryboardProvider['run']>[1])=>{seen=draft.topic;await context.progress({stage:'repairing',attempt:2,issueCodes:['MISSING_CUE']});return adapter.run(draft,context);}};};
 const running=runStoryboardJob(db,client,factory);await deferred.started;
 assert.equal(await runStoryboardJob(db,client,factory),false);
 const replay=await svc.create(owner,item.id,key,input);assert.equal(replay.data.attempt,2);assert.deepEqual(replay.data.issueCodes,['MISSING_CUE']);
 assert.equal(seen,'How the water cycle works');deferred.finish();await running;
 const done=(await svc.latest(owner,item.id))!;assert.equal(done.stage,'ready');assert.equal((await svc.get(owner,done.storyboardId!)).stale,true);
 const job=await db.collection('storyboardQueue').findOne({_id:queued.data.id as never});assert.equal(job?.state,'done');assert.equal(job?.draft,null);
 assert.equal(await runStoryboardJob(db,client,factory),false);
});
test('expired queued work and abandoned running work never dispatch or replay provider calls',async()=>{
 for(const queueState of ['queued','running'])for(const expiryVia of ['worker','read']){
 const item=await make();let date=new Date();const svc=storyboardService(db,client,config.secret,provider,()=>date,true);
 const key=randomUUID(),result=await svc.create(owner,item.id,key,input);
 await db.collection('storyboardQueue').updateOne({_id:result.data.id as never},{$set:{state:queueState}});
 date=new Date(date.getTime()+181000);let invoked=0;
 if(expiryVia==='read')await svc.latest(owner,item.id);
 assert.equal(await runStoryboardJob(db,client,()=>({model:'fixture',run:async()=>{invoked++;return {content:fixture()};}}),()=>date),false);
 assert.equal(invoked,0);const receipt=(await svc.latest(owner,item.id))!;
 assert.equal(receipt.state,queueState==='queued'?'failed':'unknown');
 assert.equal(receipt.errorCode,queueState==='queued'?'QUEUE_EXPIRED':'PROVIDER_OUTCOME_UNKNOWN');
 assert.equal(receipt.stage,'stopped');assert.equal(receipt.attempt,0);
 assert.deepEqual((await svc.create(owner,item.id,key,input)).data,receipt);
 assert.equal((await projects.get(owner,item.id)).activeJobId,null);
 assert.equal((await db.collection('storyboardQueue').findOne({_id:result.data.id as never}))?.draft,null);
 }
});
test('worker rechecks admission before dispatch and refuses invalid queue records',async()=>{
 const item=await make(),svc=storyboardService(db,client,config.secret,provider,undefined,true);
 await svc.create(owner,item.id,randomUUID(),input);const before=calls;
 await db.collection('internalAccess').updateOne({normalizedEmail:'owner@example.test'},{$set:{enabled:false}});
 try{await runStoryboardJob(db,client,provider);}finally{await db.collection('internalAccess').updateOne({normalizedEmail:'owner@example.test'},{$set:{enabled:true}});}
 assert.equal(calls,before);assert.equal((await svc.latest(owner,item.id))?.errorCode,'ACCESS_DISABLED');assert.equal((await projects.get(owner,item.id)).activeJobId,null);
 await assert.rejects(db.collection('storyboardQueue').insertOne({unexpected:true}));
});

const applyReq=(id:string,body:unknown,key=randomUUID(),headers:Record<string,string>={})=>handleProjects(new Request(`${config.origin}/api/projects/${id}/draft/apply`,{method:'POST',headers:{Cookie:cookie,Origin:config.origin,'Content-Type':'application/json','Idempotency-Key':key,...headers},body:JSON.stringify(body)}),'draft-apply',id,async()=>deps);
const editReq=(id:string,body:unknown,headers:Record<string,string>={})=>handleProjects(new Request(`${config.origin}/api/projects/${id}/draft`,{method:'PATCH',headers:{Cookie:cookie,Origin:config.origin,'Content-Type':'application/json',...headers},body:JSON.stringify(body)}),'draft-save',id,async()=>deps);
async function editableFixture(){const project=await make(),result=await service().create(owner,project.id,randomUUID(),input),candidate=await service().get(owner,result.data.storyboardId!);return {project,candidate,body:{expectedDraftRevision:2,storyboardId:candidate.id,expectedContentHash:candidate.contentHash}};}
test('apply is owner-scoped, revision/hash checked, atomic and exactly replayable after later edits',async()=>{
 const {project,candidate,body}=await editableFixture(),key=randomUUID();
 assert.equal((await applyReq(project.id,body,key,{Cookie:''})).status,401);
 assert.equal((await applyReq(project.id,body,key,{Cookie:otherCookie})).status,404);
 assert.equal((await applyReq(project.id,body,key,{Origin:'https://evil.example'})).status,403);
 assert.equal((await applyReq(project.id,{...body,expectedContentHash:'0'.repeat(64)})).status,409);
 assert.equal((await applyReq(project.id,{...body,expectedDraftRevision:1})).status,409);
 const otherProject=await make();assert.equal((await applyReq(otherProject.id,body)).status,404);
 const response=await applyReq(project.id,body,key);assert.equal(response.status,200);const applied=(await response.json()).data;
 assert.equal(applied.revision,3);assert.equal(applied.sourceStoryboardId,candidate.id);assert.equal(applied.planStale,false);assert.equal(applied.validation.valid,true);
 assert.equal((await projects.get(owner,project.id)).currentStoryboardId,candidate.id);
 const content=structuredClone(applied.editablePlan);content.scenes[0].title='Edited title';
 const saved=await editReq(project.id,{expectedRevision:3,changes:{editablePlan:content}});assert.equal(saved.status,200);assert.equal((await saved.json()).data.revision,4);
 const replay=await applyReq(project.id,body,key);assert.equal(replay.headers.get('Idempotency-Replayed'),'true');assert.deepEqual((await replay.json()).data,applied);
 assert.equal((await drafts.get(owner,project.id)).editablePlan?.scenes[0].title,'Edited title');
 assert.equal((await applyReq(project.id,{...body,expectedDraftRevision:4},key)).status,409);
 assert.deepEqual((await service().get(owner,candidate.id)).content,candidate.content);
});
test('incomplete narration and labels persist with validation; unsafe structures do not save',async()=>{
 const {project,body}=await editableFixture();const applied=(await (await applyReq(project.id,body)).json()).data;
 const plan=structuredClone(applied.editablePlan);plan.scenes[0].narration='';plan.scenes[0].visual.data.labels[0]='';
 const response=await editReq(project.id,{expectedRevision:3,changes:{editablePlan:plan}});assert.equal(response.status,200);const saved=(await response.json()).data;assert.equal(saved.validation.valid,false);assert.ok(saved.validation.issues.some((x:any)=>x.path.includes('narration')));
 assert.deepEqual((await drafts.get(owner,project.id)).editablePlan,plan);
 for(const bad of [{...plan,script:'unsafe'},{...plan,scenes:[]},{...plan,scenes:[{...plan.scenes[0],id:'../bad'},...plan.scenes.slice(1)]}])assert.equal((await editReq(project.id,{expectedRevision:4,changes:{editablePlan:bad}})).status,422);
 assert.equal((await drafts.get(owner,project.id)).revision,4);
 const brokenCue=structuredClone(applied.editablePlan);brokenCue.scenes[0].narration=brokenCue.scenes[0].narration.replace('Water','Liquid');
 const checked=(await (await editReq(project.id,{expectedRevision:4,changes:{editablePlan:brokenCue}})).json()).data;assert.equal(checked.validation.valid,false);assert.ok(checked.validation.issues.some((x:any)=>x.code==='MISSING_CUE'));
});
test('idea saves retain the working plan, mark it stale, and share one conflict fence',async()=>{
 const {project,body}=await editableFixture();const applied=(await (await applyReq(project.id,body)).json()).data;
 const changed=await drafts.save(owner,project.id,{expectedRevision:3,changes:{topic:'Another topic'}});
 assert.deepEqual(changed.editablePlan,applied.editablePlan);assert.equal(changed.planStale,true);assert.equal(changed.validation.valid,false);
 assert.equal((await editReq(project.id,{expectedRevision:3,changes:{editablePlan:applied.editablePlan}})).status,409);
 const cleared=await drafts.save(owner,project.id,{expectedRevision:4,changes:{editablePlan:null}});assert.equal(cleared.sourceStoryboardId,null);assert.equal(cleared.planStale,false);assert.equal((await projects.get(owner,project.id)).currentStoryboardId,null);
 assert.equal((await editReq(project.id,{expectedRevision:5,changes:{editablePlan:applied.editablePlan}})).status,409);
});
test('simultaneous apply replays once; migration replays preserve the edited copy and strict schema',async()=>{
 const {project,body}=await editableFixture(),key=randomUUID();const responses=await Promise.all(Array.from({length:3},()=>applyReq(project.id,body,key)));
 for(const response of responses)assert.equal(response.status,200);
 const saved=await drafts.get(owner,project.id);assert.equal(saved.revision,3);
 await setupProjects(db);await setupDrafts(db);await setupIdeas(db);await setupStoryboards(db);await setupStoryboardQueue(db);await setupEditableDrafts(db);
 assert.deepEqual(await drafts.get(owner,project.id),saved);
 await assert.rejects(db.collection('drafts').updateOne({projectId:project.id},{$set:{'editablePlan.scenes.0.visual.data.script':'unsafe'}}));
 const stale=await drafts.save(owner,project.id,{expectedRevision:3,changes:{notes:'Changed context'}});
 const replaced=(await (await applyReq(project.id,{...body,expectedDraftRevision:stale.revision})).json()).data;assert.equal(replaced.planStale,true);
});

test('apply receipt failure rolls back draft and parent; clearing or editing cannot cross ownership',async()=>{
 const {project,body}=await editableFixture(),before=await drafts.get(owner,project.id),key=randomUUID();
 const definition=(await db.listCollections({name:'draftCommands'},{nameOnly:false}).toArray())[0];
 await db.command({collMod:'draftCommands',validator:{$and:[definition.options!.validator,{projectId:{$ne:project.id}}]}});
 try{assert.equal((await applyReq(project.id,body,key)).status,503);}finally{await db.command({collMod:'draftCommands',validator:definition.options!.validator});}
 assert.deepEqual(await drafts.get(owner,project.id),before);assert.equal((await projects.get(owner,project.id)).currentStoryboardId,null);
 assert.equal((await applyReq(project.id,body,key)).status,200);
 assert.equal((await editReq(project.id,{expectedRevision:3,changes:{editablePlan:null}},{Cookie:otherCookie})).status,404);
 assert.equal((await editReq(project.id,{expectedRevision:3,changes:{editablePlan:null}},{Origin:'https://evil.example'})).status,403);
 assert.equal((await drafts.get(owner,project.id)).revision,3);
 await db.collection('projects').updateOne({_id:project.id as never},{$set:{deletedAt:new Date()}});
 assert.equal((await applyReq(project.id,body,key)).status,404);
 await rejects(drafts.get(owner,project.id),'NOT_FOUND');
});

const revisionSeed=async()=>{
 const item=await make();const generated=await service().create(owner,item.id,randomUUID(),input);
 const candidate=await service().get(owner,generated.data.storyboardId!);
 const body=revisionRequest.parse({expectedDraftRevision:2,source:{kind:'storyboard',id:candidate.id,hash:candidate.contentHash},instruction:'Clarify the opening title',sceneId:candidate.content.scenes[0].id});
 return {item,candidate,body};
};
const revise=(id:string,body:unknown,key=randomUUID(),headers:Record<string,string>={})=>handleStoryboards(new Request(`${config.origin}/api/projects/${id}/revisions`,{method:'POST',headers:{Cookie:cookie,Origin:config.origin,'Content-Type':'application/json','Idempotency-Key':key,...headers},body:JSON.stringify(body)}),'revise',id,async()=>deps,provider);
const revisionProvider=(onRun:()=>void=()=>{}):StoryboardProvider=>({model:'fixture-model',run:async(_idea,context)=>{
 onRun();assert.ok(context.revision);const content=structuredClone(context.revision.source);content.scenes[0].title='A clearer opening';return {content};
}});
test('revision migration replays with strict bounded command documents',async()=>{
 await setupStoryboardRevisions(db);await assertStoryboardRevisionsReady(db);
 await rejects(assertStoryboardRevisionsReady(client.db('missing_revision_setup')),'STORYBOARD_SETUP_REQUIRED');
 await assert.rejects(db.collection('storyboardRevisions').insertOne({unexpected:true}));
});
test('revision admission is idempotent and worker preserves source/draft with trusted lineage',async()=>{
 const {item,candidate,body}=await revisionSeed(),key=randomUUID(),before=await drafts.get(owner,item.id);
 const responses=await Promise.all([revise(item.id,body,key),revise(item.id,body,key)]);
 assert.deepEqual(responses.map(r=>r.status),[202,202]);const receipts=await Promise.all(responses.map(r=>r.json()));
 assert.equal(receipts[0].data.id,receipts[1].data.id);let count=0;
 await Promise.all([runStoryboardJob(db,client,()=>revisionProvider(()=>{count++;})),runStoryboardJob(db,client,()=>revisionProvider(()=>{count++;}))]);
 assert.equal(count,1);const completed=(await service().latest(owner,item.id))!;
 const result=storyboardView.parse(await service().get(owner,completed.storyboardId!));
 assert.equal(result.parentId,candidate.id);assert.deepEqual(result.changedSceneIds,[body.sceneId]);assert.match(result.changeSummary!,/Updated 1 scene/);
 assert.equal(result.approvalId,null);assert.equal(result.stale,false);
 assert.deepEqual((await service().get(owner,candidate.id)).content,candidate.content);assert.deepEqual(await drafts.get(owner,item.id),before);
 const replay=await revise(item.id,body,key);assert.equal(replay.status,200);assert.equal(replay.headers.get('Idempotency-Replayed'),'true');assert.equal((await replay.json()).data.storyboardId,result.id);
 assert.equal((await revise(item.id,{...body,instruction:'Different'},key)).status,409);
 const history=await service().list(owner,item.id,{limit:20});assert.equal(history.data.find(x=>x.id===result.id)?.parentId,candidate.id);
 const queue=await db.collection('storyboardQueue').findOne({_id:completed.id as never});assert.equal(queue?.draft,null);
});
test('revision auth/origin/source/revision/scope checks reject before queueing',async()=>{
 const {item,body}=await revisionSeed();
 for(const [headers,status] of [[{Cookie:''},401],[{Cookie:otherCookie},404],[{Origin:'https://wrong.test'},403]] as const)assert.equal((await revise(item.id,body,randomUUID(),headers)).status,status);
 for(const [patch,status] of [[{expectedDraftRevision:1},409],[{source:{...body.source,hash:'0'.repeat(64)}},409],[{sceneId:'absent'},422],[{instruction:' '},422],[{source:{...body.source,kind:'video'}},422],[{extra:true},422]] as const)assert.equal((await revise(item.id,{...body,...patch})).status,status);
 const foreign=await make(other);assert.equal((await revise(foreign.id,body)).status,404);
 assert.equal(await db.collection('storyboardRevisions').countDocuments({projectId:item.id}),0);assert.equal((await projects.get(owner,item.id)).activeJobId,null);
});
test('applied fresh source is allowed; edited working copy and stale source are rejected',async()=>{
 const {item,candidate,body}=await revisionSeed();
 const applied=await drafts.apply(owner,item.id,randomUUID(),{expectedDraftRevision:2,storyboardId:candidate.id,expectedContentHash:candidate.contentHash});
 const revision=applied.data.revision;assert.equal((await revise(item.id,{...body,expectedDraftRevision:revision})).status,202);
 await runStoryboardJob(db,client,()=>revisionProvider());
 const plan=structuredClone(candidate.content);plan.scenes[0].title='Manual edit';
 const saved=await drafts.save(owner,item.id,{expectedRevision:revision,changes:{editablePlan:plan}});
 assert.equal((await revise(item.id,{...body,expectedDraftRevision:saved.revision})).status,409);
});
test('edits during queued revision retain snapshot and make result stale without overwriting draft',async()=>{
 const {item,body}=await revisionSeed();assert.equal((await revise(item.id,body)).status,202);
 await drafts.save(owner,item.id,{expectedRevision:2,changes:{topic:'Another topic'}});
 const before=await drafts.get(owner,item.id);await runStoryboardJob(db,client,()=>revisionProvider());
 const result=await service().get(owner,(await service().latest(owner,item.id))!.storyboardId!);
 assert.equal(result.stale,true);assert.deepEqual(await drafts.get(owner,item.id),before);
});
test('revision results are revalidated independently of provider and preserve prior candidate on failure',async()=>{
 const {item,candidate,body}=await revisionSeed();await revise(item.id,body);
 await runStoryboardJob(db,client,()=>({model:'fixture-model',run:async(_input,context)=>{const content=structuredClone(context.revision!.source);content.scenes[1].title='Out of scope';return {content};}}));
 const failed=(await service().latest(owner,item.id))!;assert.equal(failed.state,'failed');assert.equal(failed.errorCode,'STORYBOARD_INVALID');
 assert.equal((await service().list(owner,item.id,{limit:20})).data.length,1);assert.deepEqual((await service().get(owner,candidate.id)).content,candidate.content);
});
test('revision command insertion failure rolls back receipt, queue and project slot',async()=>{
 const {item,body}=await revisionSeed(),key=randomUUID();
 const definition=(await db.listCollections({name:'storyboardRevisions'},{nameOnly:false}).toArray())[0];
 await db.command({collMod:'storyboardRevisions',validator:{$and:[definition.options!.validator,{projectId:{$ne:item.id}}]}});
 try{assert.equal((await revise(item.id,body,key)).status,503);}finally{await db.command({collMod:'storyboardRevisions',validator:definition.options!.validator});}
 assert.equal(await db.collection('storyboardQueue').countDocuments({projectId:item.id}),0);
 assert.equal(await db.collection('storyboardRequests').countDocuments({projectId:item.id}),1);
 assert.equal((await projects.get(owner,item.id)).activeJobId,null);
 assert.equal((await revise(item.id,body,key)).status,202);await runStoryboardJob(db,client,()=>revisionProvider());
});
test('revision queue expiry makes no provider call and retains replay and source history',async()=>{
 const {item,body,candidate}=await revisionSeed();let date=new Date();const key=randomUUID();
 const svc=storyboardService(db,client,config.secret,provider,()=>date,true);
 const queued=await svc.create(owner,item.id,key,body);
 await rejects(svc.create(owner,item.id,randomUUID(),body),'PROJECT_BUSY');
 await rejects(svc.create(owner,item.id,randomUUID(),input),'PROJECT_BUSY');
 date=new Date(date.getTime()+180001);let count=0;await runStoryboardJob(db,client,()=>revisionProvider(()=>{count++;}),()=>date);
 const replay=await svc.create(owner,item.id,key,body);assert.equal(replay.data.id,queued.data.id);assert.equal(replay.data.errorCode,'QUEUE_EXPIRED');assert.equal(count,0);
 assert.deepEqual((await svc.get(owner,candidate.id)).content,candidate.content);
});
test('ambiguous revision result is not re-executed on replay',async()=>{
 const {item,body}=await revisionSeed(),key=randomUUID();await revise(item.id,body,key);let count=0;
 await runStoryboardJob(db,client,()=>({model:'fixture-model',run:async()=>{count++;throw new ProviderError('PROVIDER_OUTCOME_UNKNOWN');}}));
 const replay=await revise(item.id,body,key);assert.equal((await replay.json()).data.state,'unknown');
 assert.equal(await runStoryboardJob(db,client,()=>revisionProvider(()=>{count++;})),false);assert.equal(count,1);
});
test('missing revision metadata cannot turn accepted revision into fresh generation',async()=>{
 const {item,body}=await revisionSeed();const response=await revise(item.id,body),receipt=(await response.json()).data;
 const command=await db.collection('storyboardRevisions').findOne({_id:receipt.id as never});assert.ok(command);
 await db.collection('storyboardRevisions').deleteOne({_id:receipt.id as never});let count=0;
 await runStoryboardJob(db,client,()=>revisionProvider(()=>{count++;}));
 assert.equal(count,0);assert.equal((await service().latest(owner,item.id))?.errorCode,'SOURCE_CHANGED');
});
