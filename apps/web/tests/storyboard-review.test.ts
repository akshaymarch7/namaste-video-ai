import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createReview,attemptStore,reviewTransport,type ReviewTransport,type Candidate,type Receipt,type Attempt,type Summary} from '../components/storyboard/controller';
const projectId='prj_'+'a'.repeat(32), candidateId='stb_'+'b'.repeat(32);
const receipt:Receipt={id:'job_'+'c'.repeat(32),projectId,state:'completed',sourceDraftRevision:2,model:'fixture',storyboardId:candidateId,errorCode:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),deadline:new Date().toISOString()};
const candidate={id:candidateId,projectId,sourceDraftRevision:2,stale:false} as Candidate;
function harness(){
 let stored:Attempt|null=null,calls:Attempt[]=[],latest:Receipt|null=null,revision=2;
 const transport:ReviewTransport={context:async()=>({title:'Water',draft:{revision,topic:'Water'} as any}),latest:async()=>latest,history:async()=>({data:latest?.state==='completed'?[candidate as Summary]:[],cursor:null}),get:async()=>candidate,create:async a=>{calls.push(a);latest=receipt;return receipt;}};
 const store={read:()=>stored,write:(a:Attempt)=>{stored=a;},clear:()=>{stored=null;}};
 return {transport,store,calls,setLatest:(r:Receipt)=>{latest=r;},rev:(r:number)=>{revision=r;},stored:()=>stored};
}
test('mount is read-only; explicit generation saves its key before POST and opens result',async()=>{
 const h=harness(),review=createReview(h.transport,h.store,()=>{});await review.load();assert.equal(h.calls.length,0);
 const original=h.transport.create;h.transport.create=async a=>{assert.deepEqual(h.stored(),a);return original(a);};
 await review.generate();assert.equal(h.calls.length,1);assert.equal(review.snapshot().candidate?.id,candidateId);assert.equal(h.stored(),null);
});
test('lost response survives controller disposal/reload and replays exact key and source revision',async()=>{
 const h=harness();h.transport.create=async a=>{h.calls.push(a);throw {code:'CONNECTION'};};
 const first=createReview(h.transport,h.store,()=>{});await first.load();await first.generate();assert.equal(first.snapshot().error,'CONNECTION');const pending=h.stored();assert.ok(pending);first.dispose();h.rev(3);
 h.transport.create=async a=>{h.calls.push(a);return receipt;};const next=createReview(h.transport,h.store,()=>{});await next.load();
 assert.deepEqual(h.calls,[pending,pending]);assert.equal(next.snapshot().candidate?.sourceDraftRevision,2);assert.equal(next.snapshot().draft?.revision,3);assert.equal(h.stored(),null);
});
test('concurrent clicks and running receipt cannot launch another generation',async()=>{
 const h=harness();let release!:(r:Receipt)=>void;h.transport.create=async a=>{h.calls.push(a);return new Promise(r=>{release=r;});};const review=createReview(h.transport,h.store,()=>{});await review.load();
 const pending=review.generate();await review.generate();assert.equal(h.calls.length,1);release({...receipt,state:'running',storyboardId:null});await pending;await review.generate();assert.equal(h.calls.length,1);assert.ok(h.stored());
});
test('definitive admission rejection clears pending, including replay after reload',async()=>{
 for(const code of ['REVISION_CONFLICT','PROJECT_BUSY','AI_NOT_CONFIGURED']){
 const h=harness();h.store.write({key:crypto.randomUUID(),expectedDraftRevision:1});h.transport.create=async()=>{throw {code};};const review=createReview(h.transport,h.store,()=>{});await review.load();assert.equal(review.snapshot().error,code);assert.equal(h.stored(),null);
 }
});
test('failed/unknown receipt keeps existing candidate and permits only an explicit new generation',async()=>{
 for(const state of ['failed','unknown'] as const){const h=harness();h.setLatest(receipt);const review=createReview(h.transport,h.store,()=>{});await review.load();h.transport.create=async()=>({...receipt,state,storyboardId:null,errorCode:'PROVIDER_OUTCOME_UNKNOWN'});await review.generate();assert.equal(review.snapshot().candidate?.id,candidateId);assert.equal(review.snapshot().pending,null);}
});
test('storage failure prevents provider dispatch and no updates occur after disposal',async()=>{
 const h=harness();const review=createReview(h.transport,{...h.store,write:()=>{throw Error();}},()=>{});await review.load();await review.generate();assert.equal(h.calls.length,0);assert.equal(review.snapshot().error,'RECOVERY_STORAGE');
 let release!:()=>void,count=0;h.transport.context=async()=>{await new Promise<void>(r=>{release=r});return {title:'Water',draft:{} as any};};const other=createReview(h.transport,h.store,()=>{count++;});const load=other.load();other.dispose();const before=count;release();await load;assert.equal(count,before);
});
test('history selection retains previous result on failure and refresh does not silently select a newer version',async()=>{
 const h=harness();h.setLatest(receipt);const review=createReview(h.transport,h.store,()=>{});await review.load();h.transport.get=async id=>{if(id==='older')throw {code:'CONNECTION'};return candidate;};await review.select('older');assert.equal(review.snapshot().candidate?.id,candidateId);assert.equal(review.snapshot().error,'CONNECTION');
 h.setLatest({...receipt,storyboardId:'newer'});await review.refresh();assert.equal(review.snapshot().candidate?.id,candidateId);
});
test('session storage is scoped to identity and project, storing no draft content',()=>{
 const map=new Map<string,string>();const storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>map.set(k,v),removeItem:(k:string)=>map.delete(k)} as unknown as Storage;
 const a=attemptStore(storage,'user-a',projectId),b=attemptStore(storage,'user-b',projectId),c=attemptStore(storage,'user-a','other');const pending={key:crypto.randomUUID(),expectedDraftRevision:2};a.write(pending);assert.deepEqual(a.read(),pending);assert.equal(b.read(),null);assert.equal(c.read(),null);assert.deepEqual(Object.keys(JSON.parse([...map.values()][0])).sort(),['expectedDraftRevision','key']);a.clear();assert.equal(a.read(),null);
});
test('transport sends private same-key requests and propagates auth errors without provider content',async()=>{
 let options:RequestInit|undefined;const transport=reviewTransport(projectId,(async(_url,o)=>{options=o;return Response.json({data:receipt});}) as typeof fetch);const pending={key:crypto.randomUUID(),expectedDraftRevision:2};await transport.create(pending);assert.equal(options?.cache,'no-store');assert.equal(options?.credentials,'same-origin');assert.equal(new Headers(options?.headers).get('Idempotency-Key'),pending.key);assert.deepEqual(JSON.parse(options?.body as string),{expectedDraftRevision:2});
 const denied=reviewTransport(projectId,(async()=>Response.json({error:{code:'UNAUTHENTICATED'}},{status:401})) as typeof fetch);await assert.rejects(denied.latest(),e=>(e as any).code==='UNAUTHENTICATED');
});
test('disposed request rejection cannot erase a newer mounted controller recovery key',async()=>{
 const h=harness();let reject!:(e:unknown)=>void;h.transport.create=async()=>new Promise((_resolve,r)=>{reject=r;});
 const review=createReview(h.transport,h.store,()=>{});await review.load();const request=review.generate();review.dispose();
 const newer={key:crypto.randomUUID(),expectedDraftRevision:3};h.store.write(newer);reject({code:'REVISION_CONFLICT'});await request;assert.deepEqual(h.stored(),newer);
});
test('history pagination deduplicates shared boundary rows and preserves results on cursor failure',async()=>{
 const h=harness();h.setLatest(receipt);const older={...candidate,id:'stb_'+'d'.repeat(32)} as Summary;
 h.transport.history=async cursor=>cursor?{data:[candidate as Summary,older],cursor:null}:{data:[candidate as Summary],cursor:'cursor'};
 const review=createReview(h.transport,h.store,()=>{});await review.load();await review.more();assert.equal(review.snapshot().history.length,2);assert.equal(review.snapshot().cursor,null);
 await review.refresh();h.transport.history=async()=>{throw {code:'INVALID_CURSOR'};};await review.more();assert.equal(review.snapshot().history.length,1);assert.equal(review.snapshot().error,'INVALID_CURSOR');
});

test('polling an active background request automatically opens its completed candidate',async()=>{
 const h=harness();h.setLatest(receipt);const review=createReview(h.transport,h.store,()=>{});await review.load();
 const running={...receipt,id:'job_'+'d'.repeat(32),state:'running' as const,storyboardId:null,stage:'queued' as const,attempt:0,issueCodes:[]};
 h.transport.create=async()=>running;await review.generate();assert.equal(review.snapshot().candidate?.id,candidateId);
 const newer={...candidate,id:'stb_'+'e'.repeat(32)};h.setLatest({...running,state:'completed',stage:'ready',storyboardId:newer.id});h.transport.get=async()=>newer;
 // Refresh recovers the stored command with the same key, rather than creating a new one.
 h.transport.create=async()=>({...running,state:'completed',stage:'ready',storyboardId:newer.id});
 await review.refresh();assert.equal(review.snapshot().candidate?.id,newer.id);assert.equal(h.stored(),null);
});

function revisionHarness(){
 const h=harness();const source={...candidate,contentHash:'d'.repeat(64),content:{scenes:[{id:'scene-1',title:'Opening'}]}} as Candidate;
 h.transport.get=async()=>source;h.setLatest(receipt);return {...h,source};
}
test('revision pins source, instruction, scope and reviewed draft before dispatch',async()=>{
 const h=revisionHarness(),r=createReview(h.transport,h.store,()=>{});await r.load();
 const send=h.transport.create;h.transport.create=async a=>{assert.deepEqual(h.stored(),a);return send(a);};
 await r.revise('  Clarify the opening  ','scene-1');assert.equal(h.calls.length,1);
 assert.deepEqual(h.calls[0].revision,{source:{kind:'storyboard',id:candidateId,hash:'d'.repeat(64)},instruction:'Clarify the opening',sceneId:'scene-1'});
 assert.equal(h.calls[0].expectedDraftRevision,2);assert.equal(h.stored(),null);
});
test('lost revision response replays exact payload after reload even after the draft changes',async()=>{
 const h=revisionHarness();h.transport.create=async a=>{h.calls.push(a);throw {code:'CONNECTION'};};
 const first=createReview(h.transport,h.store,()=>{});await first.load();await first.revise('Make it clearer','scene-1');const pending=structuredClone(h.stored());first.dispose();h.rev(3);
 h.transport.create=async a=>{h.calls.push(a);return receipt;};const second=createReview(h.transport,h.store,()=>{});await second.load();
 assert.deepEqual(h.calls,[pending,pending]);assert.equal(second.snapshot().draft?.revision,3);assert.equal(h.stored(),null);
});
test('revision validation and storage failure cannot dispatch requests',async()=>{
 const h=revisionHarness(),r=createReview(h.transport,h.store,()=>{});await r.load();
 for(const text of ['',' ','x'.repeat(4001)])await r.revise(text);
 await r.revise('Change it','absent');assert.equal(r.snapshot().error,'INVALID_SCENE');assert.equal(h.calls.length,0);
 h.store.write=()=>{throw Error('unavailable');};await r.revise('Change it');assert.equal(r.snapshot().error,'RECOVERY_STORAGE');assert.equal(h.calls.length,0);
});
test('definitive revision source/scope rejection clears pending and retains candidate',async()=>{
 for(const code of ['SOURCE_CHANGED','INVALID_SCENE']){
 const h=revisionHarness(),r=createReview(h.transport,h.store,()=>{});await r.load();h.transport.create=async()=>{throw {code};};await r.revise('Change it');
 assert.equal(r.snapshot().error,code);assert.equal(h.stored(),null);assert.equal(r.snapshot().candidate?.id,candidateId);
 }
});
test('revision and generation share duplicate-dispatch protection',async()=>{
 const h=revisionHarness();let release!:(v:Receipt)=>void;h.transport.create=async a=>{h.calls.push(a);return new Promise(resolve=>{release=resolve;});};
 const r=createReview(h.transport,h.store,()=>{});await r.load();const pending=r.revise('Clarify');await r.revise('Again');await r.generate();assert.equal(h.calls.length,1);
 release({...receipt,state:'running',storyboardId:null});await pending;await r.revise('Again');assert.equal(h.calls.length,1);
});
test('transport routes saved revision attempts to the revision endpoint with exact body and key',async()=>{
 const attempt:Attempt={key:crypto.randomUUID(),expectedDraftRevision:2,revision:{source:{kind:'storyboard',id:candidateId,hash:'d'.repeat(64)},instruction:'Clarify',sceneId:'scene-1'}};
 const transport=reviewTransport(projectId,(async(url,options)=>{assert.equal(url,`/api/projects/${projectId}/revisions`);assert.equal(new Headers(options!.headers).get('Idempotency-Key'),attempt.key);assert.deepEqual(JSON.parse(options!.body as string),{...attempt.revision,expectedDraftRevision:2});return Response.json({data:receipt});}) as typeof fetch);
 await transport.create(attempt);
});
import {canReviseCandidate} from '../components/storyboard/controller';
test('eligibility distinguishes unchanged applied source from manual edits and stale copies',()=>{
 const h=revisionHarness();const draft={revision:3,sourceStoryboardId:candidateId,planStale:false,editablePlan:structuredClone(h.source.content)} as any;
 assert.equal(canReviseCandidate(h.source,draft),true);draft.editablePlan.scenes[0].title='Manual edit';assert.equal(canReviseCandidate(h.source,draft),false);
 draft.editablePlan=h.source.content;draft.planStale=true;assert.equal(canReviseCandidate(h.source,draft),false);
});
