import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { MongoClient, Long } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { setupDatabase } from '../src/db/setup';
import { setupProjects } from '../src/projects/setup';
import { setupDrafts, assertDraftsReady } from '../src/drafts/setup';
import { setupIdeas, assertIdeasReady } from '../src/ideas/setup';
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
  await setupDatabase(db); await setupProjects(db); await setupDrafts(db); await setupIdeas(db); await setupAuth(db, client, config);
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
const make = async () => (await projects.create(owner, randomUUID(), { title: 'Draft test' })).data!;
const rejects = (promise: Promise<unknown>, code: string) => assert.rejects(promise, (error: unknown) => (error as { code: string }).code === code);
const suggestions = Array.from({length:3}, (_,i)=>({title:`Idea ${i}`,topic:`Explain concept ${i}`,angle:'Use a visual analogy'}));
let calls=0;
const provider = () => ({model:'fixture-model',run:async()=>{calls++;return suggestions;}});
const req = (id: string, body?: unknown, overrides: Record<string,string> = {}, key: string=randomUUID()) => handleIdeas(new Request(`${config.origin}/api/projects/${id}/idea-suggestions`, {
  method:body===undefined?'GET':'POST',headers:{Cookie:cookie,Origin:config.origin,'Content-Type':'application/json','Idempotency-Key':key,...overrides},
  ...(body===undefined?{}:{body:JSON.stringify(body)}),
}),body===undefined?'read':'create',id,async()=>deps,provider);
test('migration replays, strict schema rejects drift, and runtime requires setup', async()=>{
  await setupIdeas(db);await assertIdeasReady(db);
  await rejects(assertIdeasReady(client.db('missing_ideas')),'IDEA_SETUP_REQUIRED');
  await assert.rejects(db.collection('ideaRequests').insertOne({unexpected: true}));
  const indexes=await db.collection('ideaRequests').indexes();assert.ok(indexes.some(i=>i.name==='idea_key'&&i.unique));
});
test('suggestions persist without editing draft and same-key replay makes no second provider call',async()=>{
  const item=await make(),key=randomUUID(),input={expectedDraftRevision:1,prompt:'Ideas please'}; const before=calls;
  const response=await req(item.id,input,{},key);assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'private, no-store');
  const data=(await response.json()).data;assert.equal(data.state,'completed');assert.equal(data.suggestions.length,3);assert.equal(data.ownerId,undefined);
  assert.equal((await req(item.id,input,{},key)).status,200);assert.equal(calls,before+1);
  assert.equal((await drafts.get(owner,item.id)).revision,1);assert.equal((await projects.get(owner,item.id)).activeJobId,null);
  assert.equal((await (await req(item.id)).json()).data.id,data.id);
  assert.equal((await req(item.id,{...input,prompt:'Different'},{},key)).status,409);
  await rejects(projects.remove(owner,item.id,randomUUID(),{expectedRevision:1,confirm:true}),'PROJECT_DELETE_UNAVAILABLE');
});
test('auth, foreign IDs, origin, unknown fields and stale revisions never call the provider',async()=>{
  const item=await make(),input={expectedDraftRevision:1,prompt:'Ideas please'},before=calls;
  assert.equal((await req(item.id,input,{Cookie:''})).status,401);
  assert.equal((await req(item.id,input,{Cookie:otherCookie})).status,404);
  assert.equal((await req(item.id,undefined,{Cookie:otherCookie})).status,404);
  assert.equal((await req(item.id,input,{Origin:'https://evil.example'})).status,403);
  for(const body of [{...input,ownerId:'x'},{...input,prompt:''},{prompt:'Missing revision'}]) assert.equal((await req(item.id,body)).status,422);
  assert.equal((await req(item.id,input,{},'')).status,422);
  await drafts.save(owner,item.id,{expectedRevision:1,changes:{topic:'changed'}});
  assert.equal((await req(item.id,input)).status,409);assert.equal(calls,before);
});
test('running replay and competing request share a single slot; changing draft does not overwrite it on completion',async()=>{
  const item=await make();let release!:(value:typeof suggestions)=>void;let entered!:()=>void;
  const started=new Promise<void>(r=>{entered=r});let count=0;
  const svc=ideaService(db,client,()=>({model:'test',run:async()=>{count++;entered();return new Promise(r=>{release=r});}}));
  const key=randomUUID(),input={expectedDraftRevision:1,prompt:'Ideas'};
  const first=svc.create(owner,item.id,key,input);await started;
  const replay=await svc.create(owner,item.id,key,input);assert.equal(replay.state,'running');assert.equal(count,1);
  await rejects(svc.create(owner,item.id,randomUUID(),input),'PROJECT_BUSY');
  await rejects(projects.remove(owner,item.id,randomUUID(),{expectedRevision:1,confirm:true}),'PROJECT_DELETE_UNAVAILABLE');
  await drafts.save(owner,item.id,{expectedRevision:1,changes:{topic:'New local work'}});
  release(suggestions);const result=await first;assert.equal(result.sourceDraftRevision,1);
  assert.equal((await drafts.get(owner,item.id)).topic,'New local work');
});
test('deadline fences late completion and allows only explicit new request after unknown outcome',async()=>{
  const item=await make();let date=new Date(),release!:(value:typeof suggestions)=>void,entered!:()=>void;
  const started=new Promise<void>(r=>{entered=r});
  const svc=ideaService(db,client,()=>({model:'test',run:async()=>{entered();return new Promise(r=>{release=r});}}),()=>date);
  const first=svc.create(owner,item.id,randomUUID(),{expectedDraftRevision:1,prompt:'Ideas'});await started;
  date=new Date(date.getTime()+46000);assert.equal((await svc.latest(owner,item.id))?.state,'unknown');
  const newer=await ideaService(db,client,provider,()=>date).create(owner,item.id,randomUUID(),{expectedDraftRevision:1,prompt:'New request'});
  release(suggestions);assert.equal((await first).state,'unknown');
  assert.equal((await svc.latest(owner,item.id))?.id,newer.id);assert.equal((await projects.get(owner,item.id)).activeJobId,null);
});
test('provider failures store safe outcomes and never retry on replay',async()=>{
  const item=await make();let count=0;const svc=ideaService(db,client,()=>({model:'test',run:async()=>{count++;throw new ProviderError('PROVIDER_OUTCOME_UNKNOWN');}}));
  const key=randomUUID(),input={expectedDraftRevision:1,prompt:'Ideas'};
  assert.equal((await svc.create(owner,item.id,key,input)).state,'unknown');
  assert.equal((await svc.create(owner,item.id,key,input)).state,'unknown');assert.equal(count,1);
});
test('deleted parent refuses new work; voice endpoints require authentication and return binary sample safely',async()=>{
  const item=await make();await projects.remove(owner,item.id,randomUUID(),{expectedRevision:1,confirm:true});
  assert.equal((await req(item.id,{expectedDraftRevision:1,prompt:'Ideas'})).status,404);
  for(const action of ['voices','preview'] as const){
    const anonymous=await handleIdeas(new Request(`${config.origin}/api/voices`),action,undefined,async()=>deps);assert.equal(anonymous.status,401);
    const response=await handleIdeas(new Request(`${config.origin}/api/voices`,{headers:{Cookie:cookie}}),action,undefined,async()=>deps,provider,async()=>Buffer.from('ID3'));
    assert.equal(response.status,200);
    if(action==='preview'){assert.equal(response.headers.get('Content-Type'),'audio/mpeg');assert.equal(await response.text(),'ID3');}
    else assert.equal((await response.json()).data.voices[0].preset,'daniel-test');
  }
});
