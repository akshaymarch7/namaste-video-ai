import {dispatchCloud} from '../src/cloud/dispatch';
import {setupCloudDispatch,assertCloudDispatchReady} from '../src/cloud/setup';
import {type CloudConfig,jobName} from '../src/cloud/config';
import type {CloudProvider} from '../src/cloud/provider';
import {setupVideos} from '../src/videos/setup';
import {setupJobs} from '../src/jobs/setup';
import {generationService} from '../src/jobs/service';
import {approveStoryboard} from '../src/storyboards/approval-service';
import {storyboardService} from '../src/storyboards/service';
import {draftService} from '../src/drafts/service';
import assert from 'node:assert/strict';
import {test,before,after,beforeEach} from 'node:test';
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
import {provisionUser} from '../src/auth/operator';
import {projectService} from '../src/projects/service';
let replica:MongoMemoryReplSet,client:MongoClient,db:ReturnType<MongoClient['db']>;
let owner:string,other:string;
const config={origin:'http://127.0.0.1:3002',secure:false,secret:randomBytes(48).toString('base64url')};
before(async()=>{
 replica=await MongoMemoryReplSet.create({binary:{version:'8.0.17'},replSet:{count:1,ip:'127.0.0.1',storageEngine:'wiredTiger'}});client=await new MongoClient(replica.getUri(),{promoteLongs:false}).connect();db=client.db('cloud_test');
 for(const setup of [setupDatabase,setupProjects,setupDrafts,setupIdeas,setupStoryboards,setupStoryboardQueue,setupEditableDrafts,setupStoryboardRevisions,setupStoryboardSnapshots,setupStoryboardApprovals,setupStorage,setupJobs,setupVideos,setupCloudDispatch])await setup(db);
 await setupAuth(db,client,config);const users=[];
 for(const email of ['owner@example.test','other@example.test']){const input={name:'Media QA',email,password:'Media-fixture-only-4829!'};const user=await provisionUser(db,client,config,input);users.push(user.userId);}
 [owner,other]=users;
},{timeout:180000});
after(async()=>{await client?.close();await replica?.stop();});
const sentence='Water moves through our world in a repeating cycle. The sun warms the surface and turns some liquid into invisible vapor. As this vapor rises and cools it condenses into tiny droplets. These droplets gather in clouds before returning to the ground as rain and collecting in rivers and lakes.';
function fixture(){return {schemaVersion:2,title:'The water cycle',audience:'School students',learningObjective:'Understand the journey of water.',language:'en',voicePreset:'daniel-test',sources:[],scenes:Array.from({length:3},(_,i)=>({id:`scene-${i}`,title:'A journey',kicker:'WATER',narration:sentence,pronunciation:[],visual:{component:i===2?'takeaway':'title',version:1,data:{labels:['Water']}},events:[{id:'reveal',targetId:'label-1',action:'reveal',cue:{phrase:'Water',occurrence:1,offsetMs:0},durationMs:400}],sourceIds:[]}))};}

async function seed(){const project=(await projectService(db,client,config.secret).create(owner,randomUUID(),{title:'Generation fixture'})).data!;const drafts=draftService(db,client);await drafts.save(owner,project.id,{expectedRevision:1,changes:{topic:'Water cycle'}});const svc=storyboardService(db,client,config.secret,()=>({model:'fixture',run:async()=>({content:fixture()})}));await svc.create(owner,project.id,randomUUID(),{expectedDraftRevision:2});const source=(await svc.list(owner,project.id,{limit:20})).data[0];const draft=await drafts.get(owner,project.id);const approval=(await approveStoryboard(db,client,owner,project.id,randomUUID(),{storyboardId:source.id,expectedDraftRevision:draft.revision,expectedDraftHash:draft.contentHash,expectedContentHash:source.contentHash,approve:true})).data;return {project,input:{storyboardId:source.id,approvalId:approval.id,expectedDraftRevision:draft.revision,expectedDraftHash:draft.contentHash,expectedContentHash:source.contentHash,confirm:true as const}};}
const cloud:CloudConfig={project:'test-project',number:'123456789',region:'us-east1',pool:'vercel',provider:'vercel',serviceAccount:'namastevideo-dispatch@test-project.iam.gserviceaccount.com',image:'fixture-image',notBefore:new Date(0),dailyLimit:10};
beforeEach(async()=>{for(const name of ['cloudDispatches','generationJobs','storyboardQueue'])await db.collection(name).deleteMany({});await db.collection('internalAccess').updateMany({},{$set:{enabled:true}});});
async function queued(){const s=await seed();return (await generationService(db,client).create(owner,s.project.id,randomUUID(),s.input)).data;}
function fake(){let calls=0;const provider:CloudProvider={prepare:async()=> 'etag',launch:async()=>{calls++;return {state:'submitted',operation:'operation-fixture'};},observe:async()=>({terminal:false,execution:null})};return {provider,calls:()=>calls};}
const tick=(provider:CloudProvider,c=cloud,now=()=>new Date())=>dispatchCloud(db,client,c,provider,now);
const row=(id:string)=>db.collection('cloudDispatches').findOne({_id:id as never});

test('new migration is replayable and rejects malformed dispatch records',async()=>{await setupCloudDispatch(db);await assertCloudDispatchReady(db);await assert.rejects(db.collection('cloudDispatches').insertOne({state:'pending'}));await assert.rejects(assertCloudDispatchReady(client.db('missing')));});
test('concurrent ticks launch a persisted job only once',async()=>{const j=await queued(),f=fake();await Promise.all([tick(f.provider),tick(f.provider),tick(f.provider)]);assert.equal(f.calls(),1);assert.equal((await row(j.id))!.state,'submitted');await tick(f.provider);assert.equal(f.calls(),1);});
test('lost run response and request recovery never launch again; observation recovers completion',async()=>{const j=await queued(),f=fake();let calls=0;f.provider.launch=async()=>{calls++;throw Error('labelled network failure');};await tick(f.provider);assert.equal((await row(j.id))!.state,'unknown');await tick(f.provider,cloud,()=>new Date(Date.now()+31000));assert.equal(calls,1);f.provider.observe=async()=>({terminal:true,execution:'execution-fixture'});await tick(f.provider,cloud,()=>new Date(Date.now()+62000));assert.equal(calls,1);assert.equal((await row(j.id))!.state,'finished');assert.equal((await generationService(db,client).get(owner,j.id)).errorCode,'WORKER_STOPPED');});
test('crash after durable reservation before a POST cannot redispatch or release its cost slot',async()=>{const j=await queued(),date=new Date();await db.collection('cloudDispatches').insertOne({_id:j.id as never,ownerId:owner,projectId:j.projectId,role:'generation',target:jobName(cloud,'generation'),image:cloud.image,state:'submitting',operation:null,execution:null,code:null,createdAt:date,updatedAt:date,checkAt:date});const next=await queued(),f=fake();await tick(f.provider);assert.equal(f.calls(),0);assert.equal((await row(j.id))!.state,'unknown');assert.equal(await row(next.id),null);});
test('definite launch rejection stops only the matching queued job and keeps saved storyboard',async()=>{const j=await queued(),f=fake();f.provider.launch=async()=>({state:'rejected',code:'HTTP_403'});await tick(f.provider);assert.equal((await row(j.id))!.state,'rejected');const failed=await generationService(db,client).get(owner,j.id);assert.equal(failed.state,'failed');assert.equal(failed.errorCode,'WORKER_UNAVAILABLE');assert.ok(await db.collection('storyboards').findOne({_id:j.storyboardId as never}));await tick(f.provider);assert.equal((await row(j.id))!.state,'rejected');});
test('one owner cannot reserve two executions; two owners consume the global two slots',async()=>{await queued();await queued();const first=owner;owner=other;await queued();await queued();owner=first;const f=fake();await Promise.all([tick(f.provider),tick(f.provider)]);assert.equal(f.calls(),2);assert.equal(await db.collection('cloudDispatches').countDocuments({ownerId:first}),1);assert.equal(await db.collection('cloudDispatches').countDocuments({ownerId:other}),1);});
test('daily pilot limit rejects another request without another cloud launch',async()=>{const j=await queued(),f=fake();await tick(f.provider,{...cloud,dailyLimit:1});await db.collection('cloudDispatches').updateOne({_id:j.id as never},{$set:{state:'finished'}});const next=await queued();await tick(f.provider,{...cloud,dailyLimit:1});assert.equal(f.calls(),1);assert.equal((await generationService(db,client).get(owner,next.id)).errorCode,'PILOT_DAILY_LIMIT');});
test('cancelled, pre-activation and disabled-owner work never launches',async()=>{const a=await queued();await generationService(db,client).cancel(owner,a.id,randomUUID(),{expectedRevision:1});const b=await queued(),f=fake();await tick(f.provider,{...cloud,notBefore:new Date(Date.now()+1000)});assert.equal(f.calls(),0);await db.collection('internalAccess').updateOne({provisionedUserId:owner},{$set:{enabled:false}});await tick(f.provider);assert.equal(f.calls(),0);assert.equal((await db.collection('generationJobs').findOne({_id:b.id as never}))!.errorCode,'ACCESS_UNAVAILABLE');});
test('job configuration/authentication failure happens before reservation or launch',async()=>{const j=await queued(),f=fake();f.provider.prepare=async()=>{throw Error('secret labelled fixture');};const counts=await tick(f.provider);assert.equal(counts.unavailable,1);assert.equal(await row(j.id),null);assert.equal(f.calls(),0);});
test('deadline reconciliation works without a browser and does not free unknown cloud capacity',async()=>{const j=await queued(),f=fake();f.provider.launch=async()=>({state:'unknown',code:'LAUNCH_UNCONFIRMED'});await tick(f.provider);await tick(f.provider,cloud,()=>new Date(Date.now()+16*60000));assert.equal((await db.collection('generationJobs').findOne({_id:j.id as never}))!.errorCode,'QUEUE_EXPIRED');assert.equal((await row(j.id))!.state,'unknown');});
test('a new region/image cannot reinterpret an older outstanding execution',async()=>{const j=await queued(),f=fake();await tick(f.provider);let observed=0;f.provider.observe=async()=>{observed++;return {terminal:true,execution:'wrong-region'};};await tick(f.provider,{...cloud,region:'us-central1'},()=>new Date(Date.now()+31000));assert.equal(observed,0);assert.equal((await row(j.id))!.state,'submitted');});
test('expiry of a deleted parent cannot block the bounded reconciliation scan',async()=>{const j=await queued(),f=fake();await db.collection('projects').updateOne({_id:j.projectId as never},{$set:{deletedAt:new Date()}});await tick(f.provider,cloud,()=>new Date(Date.now()+16*60000));assert.equal(f.calls(),0);assert.equal((await db.collection('generationJobs').findOne({_id:j.id as never}))!.state,'failed');});
test('cancellation racing job-template verification prevents reservation and cloud launch',async()=>{const j=await queued(),f=fake();f.provider.prepare=async()=>{await generationService(db,client).cancel(owner,j.id,randomUUID(),{expectedRevision:1});return 'etag';};await tick(f.provider);assert.equal(f.calls(),0);assert.equal(await row(j.id),null);});
test('background storyboard queue uses the same dispatch and explicit rejection recovery',async()=>{const p=(await projectService(db,client,config.secret).create(owner,randomUUID(),{title:'Queued storyboard'})).data!;await draftService(db,client).save(owner,p.id,{expectedRevision:1,changes:{topic:'Water cycle'}});const svc=storyboardService(db,client,config.secret,()=>({model:'fixture',run:async()=>({content:fixture()})}),undefined,true);await svc.create(owner,p.id,randomUUID(),{expectedDraftRevision:2});const receipt=await db.collection('storyboardQueue').findOne({projectId:p.id});assert.ok(receipt);const f=fake();f.provider.launch=async(role,id)=>{assert.equal(role,'storyboard');assert.equal(id,receipt._id);return {state:'rejected',code:'HTTP_429'};};await tick(f.provider);assert.equal((await db.collection('storyboardRequests').findOne({_id:receipt._id}))!.errorCode,'WORKER_UNAVAILABLE');assert.equal((await db.collection('projects').findOne({_id:p.id as never}))!.activeJobId,undefined);});
