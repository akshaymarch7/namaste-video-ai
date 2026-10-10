import {endpoint,sever,json} from './helpers/provider-endpoint';
import {requestInstagramDeletion,completeReviewedDeletion,deletionStatus} from '../src/instagram/deletion';
import {setupInstagramDeletion} from '../src/instagram/deletion-setup';
import {inTransaction} from '../src/db/client';
import {deauthorizeInstagram,fenceAuthorization} from '../src/instagram/lifecycle';
import {setupInstagramLifecycle} from '../src/instagram/lifecycle-setup';
import {setupScheduling} from '../src/publishing/schedule-setup';
import {videoHash} from '../src/videos/materialize';
import {setupProjects} from '../src/projects/setup';
import {setupDrafts} from '../src/drafts/setup';
import {setupIdeas} from '../src/ideas/setup';
import {setupStoryboards} from '../src/storyboards/setup';
import {setupStoryboardQueue} from '../src/storyboards/queue-setup';
import {setupEditableDrafts} from '../src/drafts/edit-setup';
import {setupStoryboardRevisions} from '../src/storyboards/revision-setup';
import {setupStoryboardSnapshots} from '../src/storyboards/snapshot-setup';
import {setupStoryboardApprovals} from '../src/storyboards/approval-setup';
import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {randomBytes,randomUUID} from 'node:crypto';
import {MongoClient,Long} from 'mongodb';
import {MongoMemoryReplSet} from 'mongodb-memory-server';
import {setupDatabase} from '../src/db/setup';
import {setupPublishing,assertPublishingReady} from '../src/publishing/setup';
import {setupInstagram} from '../src/instagram/setup';
import {setupVideos} from '../src/videos/setup';
import {setupStorage} from '../src/storage/setup';
import {encryptToken,type InstagramConfig} from '../src/instagram/config';
import {instagramService} from '../src/instagram/service';
import {publishingService,uid} from '../src/publishing/service';
import {publishWorker} from '../src/publishing/worker';
import {publishProvider,type PublishProvider} from '../src/publishing/provider';
import {storageService,digest} from '../src/storage/service';
import {handlePublishing,handlePublishTick} from '../src/publishing/http';
const cfg:InstagramConfig={appId:'123',appSecret:'fixture',redirectUri:'https://app.test/api/instagram/callback',version:'v26.0',activeKey:'one',keys:{one:randomBytes(32).toString('base64')}};
let replica:MongoMemoryReplSet,client:MongoClient,db:ReturnType<MongoClient['db']>;let serial=100;
const fail=(p:Promise<unknown>,code:string)=>assert.rejects(p,e=>(e as {code:string}).code===code);
before(async()=>{replica=await MongoMemoryReplSet.create({binary:{version:'8.0.17'},replSet:{count:1,ip:'127.0.0.1',storageEngine:'wiredTiger'}});client=await new MongoClient(replica.getUri(),{promoteLongs:false}).connect();db=client.db('publish_test');for(const setup of [setupDatabase,setupProjects,setupDrafts,setupIdeas,setupStoryboards,setupStoryboardQueue,setupEditableDrafts,setupStoryboardRevisions,setupStoryboardSnapshots,setupStoryboardApprovals,setupInstagram,setupVideos,setupStorage,setupPublishing,setupScheduling])await setup(db);},{timeout:180000});
after(async()=>{await client?.close();await replica?.stop();});
async function fixture(){
 const owner=uid('user'),project=uid('prj'),video=uid('vid'),approval=uid('apr'),connection=uid('igc'),asset=uid('ast'),account=String(++serial),now=new Date(),hash='a'.repeat(64),renderHash=videoHash({});
 await db.collection('internalAccess').insertOne({_id:uid('acc') as never,schemaVersion:1,normalizedEmail:`${owner}@example.test`,enabled:true,provisioningState:'active',provisionedUserId:owner,operatorRef:'fixture',createdAt:now,updatedAt:now});
 await db.collection('projects').insertOne({_id:project as never,schemaVersion:1,ownerId:owner,title:'Publish fixture',revision:1,draftRevision:1,conversationId:uid('con'),deletedAt:null,contentRevision:Long.ONE,flags:{drafts:true,ready:true,scheduled:false,published:false,needsAttention:false},createdAt:now,updatedAt:now});
 await db.collection('assets').insertOne({_id:asset as never,ownerId:owner,projectId:project,kind:'video',state:'ready',objectKey:`owners/${digest(owner)}/projects/${project}/assets/${asset}.mp4`,sha256:hash,bytes:100,contentType:'video/mp4',producerFingerprint:hash,createdAt:now,readyAt:now});
 await db.collection('videos').insertOne({_id:video as never,ownerId:owner,projectId:project,jobId:uid('job'),storyboardId:uid('stb'),storyApprovalId:uid('apr'),title:'Approved fixture',renderSpec:{},renderSpecHash:renderHash,outputHash:hash,outputAssetId:asset,captionsAssetId:uid('ast'),duration:72,createdAt:now});
 await db.collection('videoApprovals').insertOne({_id:approval as never,ownerId:owner,projectId:project,kind:'video',subjectId:video,subjectHash:hash,outputHash:hash,renderSpecHash:renderHash,approvedBy:owner,approvedAt:now});
 await db.collection('instagramConnections').insertOne({_id:connection as never,ownerId:owner,revision:1,state:'connected',tokenRevision:1,destinationEpoch:1,oauthEpoch:0,scopes:['instagram_business_basic','instagram_business_content_publish'],provider:'instagram',providerAppId:cfg.appId,tokenKind:'instagram_user',instagramUserId:account,username:'fixture_creator',accountType:'CREATOR',encryptedToken:encryptToken('private-fixture-token',cfg,owner,connection),expiresAt:new Date(Date.now()+86400000),tokenIssuedAt:now,createdAt:now,updatedAt:now});
 const input={projectId:project,payload:{videoId:video,videoApprovalId:approval,expectedOutputHash:hash,destination:{connectionId:connection,instagramUserId:account,destinationEpoch:1},caption:'Our water cycle'},mode:'now' as const,confirm:true as const};
 const service=publishingService(db,client,cfg,true);let time=Date.now()+1000,creates=0,publishes=0,status:'IN_PROGRESS'|'FINISHED'|'PUBLISHED'|'ERROR'='FINISHED',url='';
 const provider:PublishProvider={async create(_account,token,u){assert.equal(token,'private-fixture-token');creates++;url=u;return '100001';},async status(){return status;},async publish(){publishes++;return '200001';},async permalink(){return 'https://www.instagram.com/reel/fixture/';}};
 return {owner,project,video,approval,connection,asset,input,service,provider,worker:()=>publishWorker(db,client,cfg,provider,'https://media.test',()=>new Date(time)),advance(){time+=61000;},counts:()=>({creates,publishes}),setStatus(s:typeof status){status=s;},url:()=>url};
}
test('publishing migration replays and rejects unstructured state / plaintext credentials',async()=>{await setupPublishing(db);await assertPublishingReady(db);await assert.rejects(db.collection('publishIntents').insertOne({state:'anything',token:'secret'}));});
test('exact approval/destination and enabled flag are required',async()=>{const f=await fixture();await fail(publishingService(db,client,cfg,false).create(f.owner,randomUUID(),f.input),'PUBLISHING_DISABLED');await fail(f.service.create(f.owner,randomUUID(),{...f.input,payload:{...f.input.payload,videoApprovalId:uid('apr')}}),'VIDEO_NOT_APPROVED');await fail(f.service.create(f.owner,randomUUID(),{...f.input,payload:{...f.input.payload,destination:{...f.input.payload.destination,destinationEpoch:2}}}),'DESTINATION_CHANGED');await fail(f.service.create('other',randomUUID(),f.input),'NOT_FOUND');});
test('concurrent same command replays; different keys cannot double-post the same version',async()=>{const f=await fixture(),key=randomUUID();const [a,b]=await Promise.all([f.service.create(f.owner,key,f.input),f.service.create(f.owner,key,f.input)]);assert.equal(a.data.id,b.data.id);assert.equal(await db.collection('publishIntents').countDocuments({ownerId:f.owner}),1);await fail(f.service.create(f.owner,randomUUID(),f.input),'PUBLICATION_EXISTS');await fail(f.service.create(f.owner,key,{...f.input,payload:{...f.input.payload,caption:'different'}}),'IDEMPOTENCY_KEY_REUSED');assert.equal(JSON.stringify(a).includes('encryptedToken'),false);});
test('happy path creates one container, publishes once, stores confirmed link and library flag',async()=>{const f=await fixture();const {data}=await f.service.create(f.owner,randomUUID(),f.input);await Promise.all([f.worker().tick(f.owner),f.worker().tick(f.owner)]);assert.equal((await f.service.get(f.owner,data.id)).state,'processing');f.advance();await Promise.all([f.worker().tick(f.owner),f.worker().tick(f.owner)]);const r=await f.service.get(f.owner,data.id);assert.equal(r.state,'published');assert.match(r.permalink!,/instagram.com/);assert.deepEqual(f.counts(),{creates:1,publishes:1});assert.equal((await db.collection('projects').findOne({_id:f.project as never}))?.flags.published,true);assert.equal((await db.collection('publishIntents').findOne({_id:data.id as never}))?.encryptedToken,undefined);});
test('owner scoped history, read and cursor reject other owners',async()=>{const f=await fixture();const {data}=await f.service.create(f.owner,randomUUID(),f.input);await fail(f.service.get('other',data.id),'NOT_FOUND');await fail(f.service.list('other',f.project,20),'NOT_FOUND');await fail(f.service.list(f.owner,f.project,20,uid('pub')),'INVALID_CURSOR');assert.equal((await f.service.list(f.owner,f.project,20)).data.length,1);});
test('cancel is revision checked and fences a late container response',async()=>{const f=await fixture();const {data}=await f.service.create(f.owner,randomUUID(),f.input);let release!:(s:string)=>void,entered!:()=>void;const started=new Promise<void>(r=>entered=r);f.provider.create=async()=>{entered();return new Promise(r=>release=r);};const work=f.worker().tick(f.owner);await started;const current=await f.service.get(f.owner,data.id);await fail(f.service.action(f.owner,data.id,randomUUID(),'cancel',{expectedRevision:1,confirm:true}),'REVISION_CONFLICT');await f.service.action(f.owner,data.id,randomUUID(),'cancel',{expectedRevision:current.revision,confirm:true});release('999');await work;assert.equal((await f.service.get(f.owner,data.id)).state,'cancelled');f.advance();await f.worker().tick(f.owner);assert.equal(f.counts().publishes,0);});
test('lost container response is safely retryable, never a publication',async()=>{const f=await fixture();const {data}=await f.service.create(f.owner,randomUUID(),f.input);f.provider.create=async()=>{throw Error('timeout');};await f.worker().tick(f.owner);const r=await f.service.get(f.owner,data.id);assert.equal(r.state,'failed_safe');assert.equal(r.actions.retry,true);assert.equal(f.counts().publishes,0);});
test('lost publish response only reconciles; FINISHED cannot authorize a second POST',async()=>{const f=await fixture();const {data}=await f.service.create(f.owner,randomUUID(),f.input);let calls=0;f.provider.publish=async()=>{calls++;throw Error('lost response after provider commit');};await f.worker().tick(f.owner);f.advance();await f.worker().tick(f.owner);for(let n=0;n<3;n++){f.advance();await f.worker().tick(f.owner);}const r=await f.service.get(f.owner,data.id);assert.equal(r.state,'outcome_unknown');assert.equal(calls,1);await fail(f.service.action(f.owner,data.id,randomUUID(),'retry',{expectedRevision:r.revision,confirm:true}),'OUTCOME_UNKNOWN');f.setStatus('PUBLISHED');f.advance();await f.worker().tick(f.owner);assert.equal((await f.service.get(f.owner,data.id)).state,'published');assert.equal(calls,1);});
test('stale submitting lease becomes unknown without replaying publication',async()=>{const f=await fixture();const {data}=await f.service.create(f.owner,randomUUID(),f.input);await db.collection('publishIntents').updateOne({_id:data.id as never},{$set:{state:'submitting',containerId:'100001',leaseUntil:new Date(0)}});await f.worker().tick(f.owner);assert.equal((await f.service.get(f.owner,data.id)).state,'outcome_unknown');assert.equal(f.counts().publishes,0);});
test('stale preparing lease fails safely instead of duplicating a container',async()=>{const f=await fixture();const {data}=await f.service.create(f.owner,randomUUID(),f.input);await db.collection('publishIntents').updateOne({_id:data.id as never},{$set:{state:'preparing',leaseUntil:new Date(0)}});await f.worker().tick(f.owner);assert.equal((await f.service.get(f.owner,data.id)).state,'failed_safe');assert.equal(f.counts().creates,0);});
test('processing is bounded; expiry never submits',async()=>{const f=await fixture();const {data}=await f.service.create(f.owner,randomUUID(),f.input);f.setStatus('IN_PROGRESS');await f.worker().tick(f.owner);for(let i=0;i<6;i++){f.advance();await f.worker().tick(f.owner);}assert.equal((await f.service.get(f.owner,data.id)).state,'failed_safe');assert.equal(f.counts().publishes,0);});
test('ingest grant is tied to immutable asset and attempt; cancellation invalidates it',async()=>{const f=await fixture();const {data}=await f.service.create(f.owner,randomUUID(),f.input);await f.worker().tick(f.owner);const token=f.url().split('/').at(-1)!;const media=storageService(db,client);assert.equal((await media.authorize({token,method:'GET'})).sha256,f.input.payload.expectedOutputHash);const r=await f.service.get(f.owner,data.id);await f.service.action(f.owner,data.id,randomUUID(),'cancel',{expectedRevision:r.revision,confirm:true});await fail(media.authorize({token,method:'HEAD'}),'NOT_FOUND');});
test('disconnect pauses pre-submit work and invalidates ingest, retaining submitted recovery credentials',async()=>{const f=await fixture();const {data}=await f.service.create(f.owner,randomUUID(),f.input);await f.worker().tick(f.owner);const ig=instagramService(db,client,cfg,null);const result=await ig.disconnect(f.owner,randomUUID(),{expectedRevision:1,confirmPausePending:true});assert.equal(result.pausedIntentCount,1);assert.equal((await f.service.get(f.owner,data.id)).state,'paused_auth');f.advance();await f.worker().tick(f.owner);assert.equal(f.counts().publishes,0);
 const g=await fixture();const next=await g.service.create(g.owner,randomUUID(),g.input);await db.collection('publishIntents').updateOne({_id:next.data.id as never},{$set:{state:'outcome_unknown',containerId:'100001'}});const out=await instagramService(db,client,cfg,null).disconnect(g.owner,randomUUID(),{expectedRevision:1,confirmPausePending:true});assert.equal(out.reconciliationPending,true);assert.ok((await db.collection('publishIntents').findOne({_id:next.data.id as never}))?.encryptedToken);g.setStatus('PUBLISHED');await g.worker().tick(g.owner);assert.equal((await g.service.get(g.owner,next.data.id)).state,'published');});
test('destination change and disabled access stop queued provider work',async()=>{for(const mode of ['destination','access']){const f=await fixture();const {data}=await f.service.create(f.owner,randomUUID(),f.input);if(mode==='destination')await db.collection('instagramConnections').updateOne({_id:f.connection as never},{$inc:{destinationEpoch:1}});else await db.collection('internalAccess').updateOne({provisionedUserId:f.owner},{$set:{enabled:false}});await f.worker().tick(f.owner);assert.equal((await f.service.get(f.owner,data.id)).state,'paused_auth');assert.equal(f.counts().creates,0);}});
test('HTTP boundary denies missing sessions/origin and scheduler payloads',async()=>{
 assert.equal((await handlePublishing(new Request('https://app.test/api/publish-intents'), 'create')).status,401);
 const f=await fixture(),deps=async()=>({db,client,auth:{api:{getSession:async()=>({user:{id:f.owner}})}},config:{origin:'https://app.test'}} as any);
 const r=await handlePublishing(new Request('https://app.test/api/publish-intents',{method:'POST',headers:{cookie:'fixture','content-type':'application/json'},body:JSON.stringify(f.input)}),'create','',deps,{config:cfg,enabled:true});assert.equal(r.status,403);
 let calls=0;const run=async()=>{calls++;return {worked:true};},env={INSTAGRAM_PUBLISH_ENABLED:'1',INSTAGRAM_PUBLISH_SCHEDULER_SECRET:'x'.repeat(40)};
 assert.equal((await handlePublishTick(new Request('https://app.test/api/internal/publish-tick',{method:'POST'}),run,env)).status,401);
 assert.equal((await handlePublishTick(new Request('https://app.test/api/internal/publish-tick',{method:'POST',headers:{Authorization:'Bearer '+'x'.repeat(40)},body:'{}'}),run,env)).status,400);
 assert.equal((await handlePublishTick(new Request('https://app.test/api/internal/publish-tick',{method:'POST',headers:{Authorization:'Bearer '+'x'.repeat(40)}}),run,env)).status,200);assert.equal(calls,1);
});
test('concurrent distinct command keys admit only one intent and disabled rollout still recovers accepted receipt',async()=>{const f=await fixture(),key=randomUUID();const results=await Promise.allSettled([f.service.create(f.owner,key,f.input),f.service.create(f.owner,randomUUID(),f.input)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(await db.collection('publishIntents').countDocuments({ownerId:f.owner}),1);if(results[0].status==='fulfilled'){const replay=await publishingService(db,client,cfg,false).create(f.owner,key,f.input);assert.equal(replay.data.id,results[0].value.data.id);}});
test('cancelled intent can explicitly retry frozen caption; stale grants and revisions cannot return',async()=>{const f=await fixture();const {data}=await f.service.create(f.owner,randomUUID(),f.input);const cancelled=(await f.service.action(f.owner,data.id,randomUUID(),'cancel',{expectedRevision:data.revision,confirm:true})).data;const retry=(await f.service.action(f.owner,data.id,randomUUID(),'retry',{expectedRevision:cancelled.revision,confirm:true})).data;assert.equal(retry.state,'queued');assert.equal(retry.caption,f.input.payload.caption);assert.equal((await db.collection('publishIntents').findOne({_id:data.id as never}))?.attempt,2);f.advance();await f.worker().tick(f.owner);f.advance();await f.worker().tick(f.owner);assert.equal((await f.service.get(f.owner,data.id)).state,'published');});
test('disconnect while status lookup is in flight prevents final submit',async()=>{const f=await fixture();const {data}=await f.service.create(f.owner,randomUUID(),f.input);await f.worker().tick(f.owner);let release!:(s:'FINISHED')=>void,entered!:()=>void;const started=new Promise<void>(r=>entered=r);f.provider.status=async()=>{entered();return new Promise(r=>release=r);};f.advance();const work=f.worker().tick(f.owner);await started;await instagramService(db,client,cfg,null).disconnect(f.owner,randomUUID(),{expectedRevision:1,confirmPausePending:true});release('FINISHED');await work;assert.equal((await f.service.get(f.owner,data.id)).state,'paused_auth');assert.equal(f.counts().publishes,0);});
test('confirmed media ID stays published when optional permalink read fails',async()=>{const f=await fixture();const {data}=await f.service.create(f.owner,randomUUID(),f.input);f.provider.permalink=async()=>{throw Error('unavailable');};await f.worker().tick(f.owner);f.advance();await f.worker().tick(f.owner);const r=await f.service.get(f.owner,data.id);assert.equal(r.state,'published');assert.equal(r.providerMediaId,'200001');assert.equal(r.permalink,null);assert.equal(r.actions.retry,false);});
const later=(minutes=10)=>({localTime:new Date(Date.now()+minutes*60000).toISOString().slice(0,16),timezone:'UTC',utcOffset:'+00:00'});
test('scheduled intent survives reread, cannot run early, and appears in library schedule filter',async()=>{
 const f=await fixture(),input={...f.input,mode:'schedule',schedule:later()};const {data}=await f.service.create(f.owner,randomUUID(),input);
 assert.equal(data.state,'scheduled');assert.equal(data.schedule?.localTime,input.schedule.localTime);assert.equal((await f.worker().tick(f.owner)).worked,false);assert.deepEqual(f.counts(),{creates:0,publishes:0});
 assert.equal((await db.collection('projects').findOne({_id:f.project as never}))?.flags.scheduled,true);
 const {projectService}=await import('../src/projects/service');const list=await projectService(db,client,'fixture-secret').list(f.owner,{filter:'scheduled',limit:20});assert.equal(list.data[0].nextSchedule?.videoId,f.video);
 for(let i=0;i<10;i++)f.advance();await f.worker().tick(f.owner);f.advance();await f.worker().tick(f.owner);assert.equal((await f.service.get(f.owner,data.id)).state,'published');assert.equal((await db.collection('projects').findOne({_id:f.project as never}))?.flags.scheduled,false);
});
test('rescheduling is revision checked, replayable and snapshots the exact new payload',async()=>{
 const f=await fixture(),createKey=randomUUID(),created=await f.service.create(f.owner,createKey,{...f.input,mode:'schedule',schedule:later()}),key=randomUUID();
 const input={...f.input,mode:'schedule',schedule:later(20),payload:{...f.input.payload,caption:'Changed caption'},expectedRevision:created.data.revision};
 const edited=await f.service.replace(f.owner,created.data.id,key,input);assert.equal(edited.data.caption,'Changed caption');assert.equal(edited.data.revision,2);
 assert.equal((await f.service.replace(f.owner,created.data.id,key,input)).data.id,created.data.id);
 assert.equal(await db.collection('publishRevisions').countDocuments({intentId:created.data.id}),2);
 await fail(f.service.replace(f.owner,created.data.id,randomUUID(),input),'REVISION_CONFLICT');await fail(f.service.replace('other',created.data.id,randomUUID(),input),'NOT_FOUND');
 assert.equal((await f.service.create(f.owner,createKey,{...f.input,mode:'schedule',schedule:created.data.schedule&&{localTime:created.data.schedule.localTime,timezone:'UTC',utcOffset:'+00:00'}})).data.caption,'Changed caption');
});
test('late delivery makes zero provider calls and requires new explicit time',async()=>{
 const f=await fixture(),created=await f.service.create(f.owner,randomUUID(),{...f.input,mode:'schedule',schedule:later()});for(let i=0;i<26;i++)f.advance();await f.worker().tick(f.owner);const expired=await f.service.get(f.owner,created.data.id);assert.equal(expired.errorCode,'DELIVERY_WINDOW_EXPIRED');assert.deepEqual(f.counts(),{creates:0,publishes:0});
 const futureService=publishingService(db,client,cfg,true,()=>new Date(Date.now()+26*61000));await fail(futureService.action(f.owner,expired.id,randomUUID(),'retry',{expectedRevision:expired.revision,confirm:true}),'RETRY_WINDOW_EXPIRED');
 const replaced=await futureService.replace(f.owner,expired.id,randomUUID(),{...f.input,expectedRevision:expired.revision});assert.equal(replaced.data.state,'queued');
});
test('claim fences edits, and cancellation/rescheduling race cannot overwrite claimed work',async()=>{
 const f=await fixture(),{data}=await f.service.create(f.owner,randomUUID(),f.input);await f.worker().tick(f.owner);const processing=await f.service.get(f.owner,data.id);
 await fail(f.service.replace(f.owner,data.id,randomUUID(),{...f.input,expectedRevision:processing.revision}),'INTENT_ALREADY_CLAIMED');
 const g=await fixture(),scheduled=await g.service.create(g.owner,randomUUID(),{...g.input,mode:'schedule',schedule:later()});const results=await Promise.allSettled([g.service.replace(g.owner,scheduled.data.id,randomUUID(),{...g.input,expectedRevision:1}),g.service.action(g.owner,scheduled.data.id,randomUUID(),'cancel',{expectedRevision:1,confirm:true})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
});
test('disconnect pauses future schedules, explicit retry keeps original date and epoch fence',async()=>{
 const f=await fixture(),{data}=await f.service.create(f.owner,randomUUID(),{...f.input,mode:'schedule',schedule:later()});await instagramService(db,client,cfg,null).disconnect(f.owner,randomUUID(),{expectedRevision:1,confirmPausePending:true});const paused=await f.service.get(f.owner,data.id);assert.equal(paused.state,'paused_auth');assert.equal(paused.schedule?.utc,data.schedule?.utc);assert.equal((await db.collection('projects').findOne({_id:f.project as never}))?.flags.scheduled,false);assert.equal(f.counts().creates,0);
});
test('deadline checked again after provider processing, but uncertain submitted outcomes reconcile beyond window',async()=>{
 const f=await fixture(),{data}=await f.service.create(f.owner,randomUUID(),f.input);await f.worker().tick(f.owner);f.provider.status=async()=>{for(let i=0;i<16;i++)f.advance();return 'FINISHED';};f.advance();await f.worker().tick(f.owner);assert.equal((await f.service.get(f.owner,data.id)).errorCode,'DELIVERY_WINDOW_EXPIRED');assert.equal(f.counts().publishes,0);
 const g=await fixture(),created=await g.service.create(g.owner,randomUUID(),g.input);g.provider.publish=async()=>{throw Error('lost');};await g.worker().tick(g.owner);g.advance();await g.worker().tick(g.owner);for(let i=0;i<20;i++)g.advance();g.setStatus('PUBLISHED');await g.worker().tick(g.owner);assert.equal((await g.service.get(g.owner,created.data.id)).state,'published');
});
test('replacement pins a newly approved version and preserves old snapshot',async()=>{
 const f=await fixture(),{data}=await f.service.create(f.owner,randomUUID(),{...f.input,mode:'schedule',schedule:later()}),old=await db.collection('videos').findOne({_id:f.video as never}),video=uid('vid'),approval=uid('apr');
 await db.collection('videos').insertOne({...old,_id:video as never,jobId:uid('job'),title:'New approved version'});
 const a=await db.collection('videoApprovals').findOne({_id:f.approval as never});await db.collection('videoApprovals').insertOne({...a,_id:approval as never,subjectId:video});
 const replaced=await f.service.replace(f.owner,data.id,randomUUID(),{...f.input,mode:'schedule',schedule:later(30),expectedRevision:data.revision,payload:{...f.input.payload,videoId:video,videoApprovalId:approval}});assert.equal(replaced.data.videoId,video);
 const snapshots=await db.collection('publishRevisions').find({intentId:data.id}).sort({revision:1}).toArray();assert.deepEqual(snapshots.map(r=>r.videoId),[f.video,video]);
});
test('legacy queued records also expire safely after upgrade',async()=>{
 const f=await fixture(),{data}=await f.service.create(f.owner,randomUUID(),f.input);await db.collection('publishIntents').updateOne({_id:data.id as never},{$unset:{mode:'',schedule:'',retryDeadlineAt:''},$set:{createdAt:new Date(Date.now()-3600000)}});await f.worker().tick(f.owner);assert.equal((await f.service.get(f.owner,data.id)).errorCode,'DELIVERY_WINDOW_EXPIRED');assert.equal(f.counts().creates,0);
});
test('reconnected retry preserves future due time and cannot publish early',async()=>{
 const f=await fixture(),{data}=await f.service.create(f.owner,randomUUID(),{...f.input,mode:'schedule',schedule:later()});const cancelled=(await f.service.action(f.owner,data.id,randomUUID(),'cancel',{expectedRevision:1,confirm:true})).data;
 const retry=(await f.service.action(f.owner,data.id,randomUUID(),'retry',{expectedRevision:cancelled.revision,confirm:true})).data;assert.equal(retry.state,'scheduled');assert.equal(retry.schedule?.utc,data.schedule?.utc);assert.equal((await f.worker().tick(f.owner)).worked,false);assert.equal(f.counts().creates,0);
});
test('PATCH boundary validates origin, approved replacement and same-key recovery',async()=>{
 const f=await fixture(),{data}=await f.service.create(f.owner,randomUUID(),{...f.input,mode:'schedule',schedule:later()}),key=randomUUID(),deps=async()=>({db,client,auth:{api:{getSession:async()=>({user:{id:f.owner}})}},config:{origin:'https://app.test'}} as any),body={...f.input,mode:'schedule',schedule:later(20),expectedRevision:1};
 const request=(origin:string)=>new Request(`https://app.test/api/publish-intents/${data.id}`,{method:'PATCH',headers:{cookie:'fixture',origin,'content-type':'application/json','idempotency-key':key},body:JSON.stringify(body)});
 assert.equal((await handlePublishing(request('https://other.test'),'replace',data.id,deps,{config:cfg,enabled:true})).status,403);
 assert.equal((await handlePublishing(request('https://app.test'),'replace',data.id,deps,{config:cfg,enabled:true})).status,200);
 const replay=await handlePublishing(request('https://app.test'),'replace',data.id,deps,{config:cfg,enabled:false});assert.equal(replay.status,200);assert.equal(replay.headers.get('Idempotency-Replayed'),'true');assert.equal(await db.collection('publishRevisions').countDocuments({intentId:data.id}),2);
});

test('switching from Facebook configuration to direct Instagram pauses unsent work without provider calls',async()=>{
 const f=await fixture(),legacy:InstagramConfig={...cfg,appId:'456',provider:'facebook',facebookConfigId:'789'};
 await db.collection('instagramConnections').updateOne({_id:f.connection as never},{$set:{provider:'facebook',providerAppId:legacy.appId,tokenKind:'facebook_page',pageId:'321',pageName:'Legacy fixture Page',scopes:['instagram_basic','instagram_content_publish'],encryptedToken:encryptToken('private-fixture-token',legacy,f.owner,f.connection)}});
 const legacyService=publishingService(db,client,legacy,true),{data}=await legacyService.create(f.owner,randomUUID(),f.input);
 let calls=0;const unexpected=async()=>{calls++;throw Error('No legacy token may reach the direct provider');};
 await publishWorker(db,client,cfg,{create:unexpected,status:unexpected,publish:unexpected,permalink:unexpected},'https://media.test').tick(f.owner);
 const current=await f.service.get(f.owner,data.id);assert.equal(current.state,'paused_auth');assert.equal(current.errorCode,'PUBLICATION_REVALIDATION_REQUIRED');assert.equal(calls,0);
 const stored=await db.collection('publishIntents').findOne({_id:data.id as never});assert.equal(stored?.encryptedToken,undefined);assert.equal(stored?.provider,'facebook');assert.equal(stored?.providerAppId,legacy.appId);
});

test('legacy uncertain publication retains recovery evidence after direct-login configuration change',async()=>{
 const f=await fixture(),legacy:InstagramConfig={...cfg,appId:'456',provider:'facebook',facebookConfigId:'789'};
 await db.collection('instagramConnections').updateOne({_id:f.connection as never},{$set:{provider:'facebook',providerAppId:legacy.appId,tokenKind:'facebook_page',pageId:'321',pageName:'Legacy fixture Page',scopes:['instagram_basic','instagram_content_publish'],encryptedToken:encryptToken('private-fixture-token',legacy,f.owner,f.connection)}});
 const {data}=await publishingService(db,client,legacy,true).create(f.owner,randomUUID(),f.input);
 await db.collection('publishIntents').updateOne({_id:data.id as never},{$set:{state:'outcome_unknown',containerId:'100001'}});
 const before=await db.collection('publishIntents').findOne({_id:data.id as never});let calls=0;const unexpected=async()=>{calls++;throw Error('No legacy token may reach the direct provider');};
 await publishWorker(db,client,cfg,{create:unexpected,status:unexpected,publish:unexpected,permalink:unexpected},'https://media.test').tick(f.owner);
 assert.equal((await f.service.get(f.owner,data.id)).state,'needs_attention');assert.equal(calls,0);
 const after=await db.collection('publishIntents').findOne({_id:data.id as never});assert.deepEqual(after?.encryptedToken,before?.encryptedToken);assert.equal(after?.containerId,before?.containerId);assert.equal(after?.provider,'facebook');assert.equal(after?.providerAppId,legacy.appId);
 await fail(f.service.action(f.owner,data.id,randomUUID(),'retry',{expectedRevision:after!.revision,confirm:true}),'OUTCOME_UNKNOWN');
});


test('Meta deauthorization fences in-flight publish completion and removes every saved credential',async()=>{
 await setupInstagramLifecycle(db);const f=await fixture();await registerLifecycle(f);const {data}=await f.service.create(f.owner,randomUUID(),f.input);
 await f.worker().tick(f.owner);f.advance();let release!:(id:string)=>void;let calls=0;
 f.provider.publish=async()=>{calls++;return new Promise(r=>release=r);};const flight=f.worker().tick(f.owner);while(!release)await new Promise(r=>setTimeout(r,5));
 await deauthorizeInstagram(db,client,cfg,{userId:f.input.payload.destination.instagramUserId,issuedAt:new Date()});
 release('999');await flight;
 const row=await db.collection('publishIntents').findOne({_id:data.id as never});assert.equal(row?.state,'needs_attention');assert.equal(row?.encryptedToken,undefined);assert.equal(row?.ingestToken,undefined);assert.equal(await db.collection('publishMediaGrants').countDocuments({intentId:data.id}),0);
 f.advance();await f.worker().tick(f.owner);assert.equal(calls,1);assert.equal((await db.collection('projects').findOne({_id:f.project as never}))?.flags.needsAttention,true);
});
test('revocation pauses queued publication, preserves published history and does not affect another account',async()=>{
 const f=await fixture(),other=await fixture();await registerLifecycle(f);const {data}=await f.service.create(f.owner,randomUUID(),f.input);await other.service.create(other.owner,randomUUID(),other.input);
 await deauthorizeInstagram(db,client,cfg,{userId:f.input.payload.destination.instagramUserId,issuedAt:new Date()});assert.equal((await f.service.get(f.owner,data.id)).state,'paused_auth');await f.worker().tick(f.owner);assert.equal(f.counts().creates,0);assert.equal((await db.collection('instagramConnections').findOne({_id:other.connection as never}))?.state,'connected');
 const published=await fixture();await registerLifecycle(published);const done=await published.service.create(published.owner,randomUUID(),published.input);await published.worker().tick(published.owner);published.advance();await published.worker().tick(published.owner);
 await deauthorizeInstagram(db,client,cfg,{userId:published.input.payload.destination.instagramUserId,issuedAt:new Date()});assert.equal((await published.service.get(published.owner,done.data.id)).state,'published');assert.ok((await published.service.get(published.owner,done.data.id)).permalink);
});

async function registerLifecycle(f:Awaited<ReturnType<typeof fixture>>){const account=f.input.payload.destination.instagramUserId;await inTransaction(client,session=>fenceAuthorization(db,cfg,account,account,new Date(Date.now()-10000),session));}

test('deletion removes mapped details, retains local media and prevents reposting after reconnection',async()=>{
 await setupInstagramDeletion(db);const f=await fixture(),other=await fixture();await registerLifecycle(f);await f.service.create(f.owner,randomUUID(),f.input);await other.service.create(other.owner,randomUUID(),other.input);
 const original=await db.collection('instagramConnections').findOne({_id:f.connection as never});const event={userId:f.input.payload.destination.instagramUserId,issuedAt:new Date()};
 const result=await requestInstagramDeletion(db,client,cfg,event);assert.match(result.confirmation_code,/^[a-f0-9]{64}$/);assert.ok(result.url.endsWith(result.confirmation_code));assert.equal((await deletionStatus(db,result.confirmation_code))?.state,'completed');
 for(const collection of ['publishIntents','publishRevisions'])assert.equal(await db.collection(collection).countDocuments({ownerId:f.owner}),0);
 assert.equal((await db.collection('instagramConnections').findOne({_id:f.connection as never}))?.instagramUserId,undefined);assert.ok(await db.collection('videos').findOne({_id:f.video as never}));assert.ok(await db.collection('assets').findOne({_id:f.asset as never}));assert.equal(await db.collection('publishIntents').countDocuments({ownerId:other.owner}),1);
 assert.deepEqual(await requestInstagramDeletion(db,client,cfg,event),result);
 await db.collection('instagramConnections').updateOne({_id:f.connection as never},{$set:{state:'connected',instagramUserId:original!.instagramUserId,username:original!.username,accountType:original!.accountType,provider:'instagram',providerAppId:cfg.appId,tokenKind:'instagram_user',encryptedToken:original!.encryptedToken,scopes:original!.scopes}});
 const current=await db.collection('instagramConnections').findOne({_id:f.connection as never});await fail(f.service.create(f.owner,randomUUID(),{...f.input,payload:{...f.input.payload,destination:{...f.input.payload.destination,destinationEpoch:current!.destinationEpoch}}}),'PUBLICATION_HISTORY_REMOVED');
});
test('uncertain submission stays in review until explicit operator completion',async()=>{
 const f=await fixture();await registerLifecycle(f);const {data}=await f.service.create(f.owner,randomUUID(),f.input);await db.collection('publishIntents').updateOne({_id:data.id as never},{$set:{state:'submitting'}});
 const result=await requestInstagramDeletion(db,client,cfg,{userId:f.input.payload.destination.instagramUserId,issuedAt:new Date()});assert.equal((await deletionStatus(db,result.confirmation_code))?.state,'needs_review');const pending=await db.collection('publishIntents').findOne({_id:data.id as never});assert.equal(pending?.state,'needs_attention');assert.equal(pending?.encryptedToken,undefined);
 await f.worker().tick(f.owner);assert.equal(f.counts().publishes,0);await completeReviewedDeletion(db,client,result.confirmation_code);assert.equal((await deletionStatus(db,result.confirmation_code))?.state,'completed');assert.equal(await db.collection('publishIntents').countDocuments({ownerId:f.owner}),0);await completeReviewedDeletion(db,client,result.confirmation_code);
});
test('concurrent callback replay uses one receipt and unmapped identities cannot falsely complete',async()=>{
 const f=await fixture();await registerLifecycle(f);const event={userId:f.input.payload.destination.instagramUserId,issuedAt:new Date()};const [a,b]=await Promise.all([requestInstagramDeletion(db,client,cfg,event),requestInstagramDeletion(db,client,cfg,event)]);assert.deepEqual(a,b);
 const unknown=await requestInstagramDeletion(db,client,cfg,{userId:'999999999999',issuedAt:new Date()});assert.equal((await deletionStatus(db,unknown.confirmation_code))?.state,'needs_review');await fail(completeReviewedDeletion(db,client,unknown.confirmation_code),'IDENTITY_REVIEW_REQUIRED');assert.equal(await deletionStatus(db,'x'),null);assert.equal(await deletionStatus(db,'0'.repeat(64)),null);assert.deepEqual(Object.keys((await deletionStatus(db,unknown.confirmation_code))!).sort(),['state','updatedAt']);
});
test('deletion during publication fences late success and prevents another provider POST',async()=>{
 const f=await fixture();await registerLifecycle(f);await f.service.create(f.owner,randomUUID(),f.input);await f.worker().tick(f.owner);f.advance();let release!:(id:string)=>void;let calls=0;f.provider.publish=async()=>{calls++;return new Promise(r=>release=r);};const flight=f.worker().tick(f.owner);while(!release)await new Promise(r=>setTimeout(r,5));
 const result=await requestInstagramDeletion(db,client,cfg,{userId:f.input.payload.destination.instagramUserId,issuedAt:new Date()});release('900');await flight;assert.equal((await deletionStatus(db,result.confirmation_code))?.state,'needs_review');await completeReviewedDeletion(db,client,result.confirmation_code);f.advance();await f.worker().tick(f.owner);assert.equal(calls,1);
});
test('newer consent and unscoped historical snapshots remain in review',async()=>{
 const f=await fixture();await registerLifecycle(f);const result=await requestInstagramDeletion(db,client,cfg,{userId:f.input.payload.destination.instagramUserId,issuedAt:new Date(Date.now()-60000)});assert.equal((await deletionStatus(db,result.confirmation_code))?.state,'needs_review');
 const g=await fixture();await registerLifecycle(g);await g.service.create(g.owner,randomUUID(),g.input);await db.collection('publishIntents').deleteMany({ownerId:g.owner});await db.collection('instagramConnections').updateOne({_id:g.connection as never},{$set:{instagramUserId:'88888888888'}});
 const ambiguous=await requestInstagramDeletion(db,client,cfg,{userId:g.input.payload.destination.instagramUserId,issuedAt:new Date()});assert.equal((await deletionStatus(db,ambiguous.confirmation_code))?.state,'needs_review');await fail(completeReviewedDeletion(db,client,ambiguous.confirmation_code),'HISTORY_SCOPE_REVIEW_REQUIRED');
});
test('database failure during deletion rolls back receipt, credential removal and deleted history',async()=>{
 const f=await fixture();await registerLifecycle(f);await f.service.create(f.owner,randomUUID(),f.input);const before=await db.collection('instagramConnections').findOne({_id:f.connection as never});const count=await db.collection('instagramDeletions').countDocuments();
 const faulty=new Proxy(db,{get(target,key){if(key==='collection')return (name:string)=>{const collection=target.collection(name);if(name!=='publishRevisions')return collection;return new Proxy(collection,{get(t,k){if(k==='deleteMany')return ()=>{throw Error('injected cleanup failure');};const value=Reflect.get(t,k);return typeof value==='function'?value.bind(t):value;}});};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});
 await assert.rejects(requestInstagramDeletion(faulty,client,cfg,{userId:f.input.payload.destination.instagramUserId,issuedAt:new Date()}));assert.deepEqual(await db.collection('instagramConnections').findOne({_id:f.connection as never}),before);assert.equal(await db.collection('publishIntents').countDocuments({ownerId:f.owner}),1);assert.equal(await db.collection('instagramDeletions').countDocuments(),count);
});


test('real lost Meta publish response persists uncertainty and recovers by status without reposting',async()=>{
 await endpoint(async h=>{
  const f=await fixture(),adapter=publishProvider(cfg,h.request);
  const {data}=await f.service.create(f.owner,randomUUID(),f.input);
  await f.worker().tick(f.owner); // Existing synthetic container; only publication transport is under test.
  f.provider.publish=adapter.publish;
  h.set(sever);f.advance();await f.worker().tick(f.owner);
  assert.equal((await f.service.get(f.owner,data.id)).state,'outcome_unknown');assert.equal(h.count(),1);
  for(let i=0;i<2;i++){f.advance();await f.worker().tick(f.owner);}
  assert.equal(h.count(),1);
  const pending=await f.service.get(f.owner,data.id);
  await fail(f.service.action(f.owner,data.id,randomUUID(),'retry',{expectedRevision:pending.revision,confirm:true}),'OUTCOME_UNKNOWN');
  f.provider.status=adapter.status;h.set(json({status_code:'PUBLISHED'}));f.advance();await f.worker().tick(f.owner);
  assert.equal((await f.service.get(f.owner,data.id)).state,'published');assert.equal(h.count(),2);
  assert.equal(await db.collection('publishIntents').countDocuments({ownerId:f.owner}),1);
 });
});
