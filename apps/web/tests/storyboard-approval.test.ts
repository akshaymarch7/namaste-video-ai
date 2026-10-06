import assert from 'node:assert/strict';
import {test} from 'node:test';
import {approvalStore,approvalTransport,createApproval,type Approval,type ApprovalAttempt,type ApprovalContext} from '../components/storyboard/approval-controller';
const projectId='prj_'+'a'.repeat(32),id='stb_'+'b'.repeat(32),contentHash='c'.repeat(64),draftHash='d'.repeat(64),storyHash='e'.repeat(64);
const context=()=>({candidate:{id,projectId,contentHash,storyHash,sourceDraftRevision:2,approvalId:null,content:{title:'Fixture'}},draft:{revision:2,contentHash:draftHash},blocked:false}) as ApprovalContext;
const approval:Approval={id:'apr_'+'f'.repeat(32),projectId,kind:'story',subjectId:id,subjectHash:storyHash,contentHash,canonicalizationVersion:1,approvedBy:'owner',approvedAt:new Date().toISOString(),reason:'explicit',reviewedDraftRevision:2,reviewedDraftHash:draftHash};
function harness(){
 let stored:ApprovalAttempt|null=null;const calls:ApprovalAttempt[]=[];
 const store={read:()=>stored,write:(a:ApprovalAttempt)=>{stored=structuredClone(a);},clear:()=>{stored=null;}};
 const send=async(a:ApprovalAttempt)=>{calls.push(structuredClone(a));assert.deepEqual(stored,a);return approval;};
 return {store,send,calls,stored:()=>stored};
}
test('load and confirmation are read-only; explicit confirm persists exact request before dispatch',async()=>{
 const h=harness(),c=createApproval(projectId,h.send,h.store,()=>{});c.load();c.begin(context());assert.equal(h.calls.length,0);assert.equal(h.stored(),null);c.cancel();assert.equal(h.calls.length,0);
 c.begin(context());await c.confirm(context());assert.equal(h.calls.length,1);assert.deepEqual(h.calls[0].body,{storyboardId:id,expectedContentHash:contentHash,expectedDraftRevision:2,expectedDraftHash:draftHash,approve:true});assert.equal(c.snapshot().result?.id,approval.id);assert.equal(h.stored(),null);
});
test('changes while reviewing invalidate confirmation without granting approval',async()=>{
 for(const modify of [(x:ApprovalContext)=>{x.blocked=true;},(x:ApprovalContext)=>{x.draft!.revision++;},(x:ApprovalContext)=>{x.draft!.contentHash='0'.repeat(64);},(x:ApprovalContext)=>{x.candidate!.id='stb_'+'1'.repeat(32);},(x:ApprovalContext)=>{x.candidate!.contentHash='0'.repeat(64);}]){
 const h=harness(),c=createApproval(projectId,h.send,h.store,()=>{});c.load();c.begin(context());const changed=context();modify(changed);await c.confirm(changed);assert.equal(c.snapshot().error,'REVIEW_CHANGED');assert.equal(h.calls.length,0);assert.equal(c.snapshot().confirmation,null);
 }
});
test('reload retains uncertain command; explicit recovery replays exact request independently of current draft',async()=>{
 const h=harness();const first=createApproval(projectId,async a=>{h.calls.push(a);throw Error('lost');},h.store,()=>{});first.load();first.begin(context());await first.confirm(context());const original=h.stored();assert.ok(original);first.dispose();
 const next=createApproval(projectId,h.send,h.store,()=>{});next.load();assert.equal(h.calls.length,1);next.begin(context());assert.equal(next.snapshot().confirmation,null);await next.recover();assert.deepEqual(h.calls,[original,original]);assert.equal(next.snapshot().result?.id,approval.id);assert.equal(h.stored(),null);
});
test('duplicate confirmation/recovery clicks cannot dispatch concurrent commands',async()=>{
 const h=harness();let release!:(a:Approval)=>void;const c=createApproval(projectId,async a=>{h.calls.push(a);return new Promise(r=>{release=r;});},h.store,()=>{});c.load();c.begin(context());const first=c.confirm(context());await c.confirm(context());await c.recover();assert.equal(h.calls.length,1);release(approval);await first;
});
test('storage failures prevent new dispatch and keep uncertain recovery locked',async()=>{
 const h=harness();const c=createApproval(projectId,h.send,{...h.store,write(){throw Error();}},()=>{});c.load();c.begin(context());await c.confirm(context());assert.equal(c.snapshot().error,'RECOVERY_STORAGE');assert.equal(h.calls.length,0);
 const broken=createApproval(projectId,h.send,{...h.store,read(){throw Error();}},()=>{});broken.load();broken.begin(context());assert.equal(broken.snapshot().ready,false);assert.equal(broken.snapshot().confirmation,null);
 const clear=createApproval(projectId,h.send,{...h.store,clear(){throw Error();}},()=>{});clear.load();clear.begin(context());await clear.confirm(context());assert.ok(clear.snapshot().pending);assert.equal(clear.snapshot().result,null);
});
test('definitive failures require fresh review; ambiguous and auth failures preserve original command',async()=>{
 for(const code of ['REVISION_CONFLICT','HASH_MISMATCH','SOURCE_CHANGED','PROJECT_BUSY','INVALID_DRAFT','NOT_FOUND','VALIDATION_FAILED','INVALID_ORIGIN','CONNECTION','SERVICE_UNAVAILABLE','UNAUTHENTICATED','ACCESS_DISABLED','IDEMPOTENCY_KEY_REUSED']){
 const h=harness(),c=createApproval(projectId,async()=>{throw {code};},h.store,()=>{});c.load();c.begin(context());await c.confirm(context());const retain=['CONNECTION','SERVICE_UNAVAILABLE','UNAUTHENTICATED','ACCESS_DISABLED','IDEMPOTENCY_KEY_REUSED'].includes(code);assert.equal(!!c.snapshot().pending,retain,code);assert.equal(!!h.stored(),retain,code);assert.equal(c.snapshot().result,null);
 }
});
test('mismatched or malformed success cannot clear pending approval',async()=>{
 for(const change of [{projectId:'other'},{subjectId:'stb_'+'0'.repeat(32)},{contentHash:'0'.repeat(64)},{subjectHash:'0'.repeat(64)},{id:'bad'}]){
 const h=harness(),c=createApproval(projectId,async()=>({...approval,...change}),h.store,()=>{});c.load();c.begin(context());await c.confirm(context());assert.ok(c.snapshot().pending);assert.equal(c.snapshot().result,null);
 }
});
test('late disposed success/failure never erases newer recovery state',async()=>{
 for(const fail of [true,false]){
 const h=harness();let finish!:(v:Approval)=>void,reject!:(e:unknown)=>void;const c=createApproval(projectId,()=>new Promise((yes,no)=>{finish=yes;reject=no;}),h.store,()=>{});c.load();c.begin(context());const request=c.confirm(context());c.dispose();const newer={...h.stored()!,key:crypto.randomUUID()};h.store.write(newer);if(fail)reject({code:'REVISION_CONFLICT'});else finish(approval);await request;assert.deepEqual(h.stored(),newer);
 }
});
test('pending store is identity/project scoped, strict and contains no storyboard text',()=>{
 const map=new Map<string,string>();const storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>map.set(k,v),removeItem:(k:string)=>map.delete(k)} as unknown as Storage;
 const h=harness(),c=createApproval(projectId,h.send,h.store,()=>{});c.load();c.begin(context());const attempt=c.snapshot().confirmation!.attempt;
 const a=approvalStore(storage,'one',projectId);a.write(attempt);assert.deepEqual(a.read(),attempt);assert.equal(approvalStore(storage,'two',projectId).read(),null);assert.equal(approvalStore(storage,'one','another').read(),null);assert.equal([...map.values()][0].includes('Fixture'),false);map.set([...map.keys()][0],'{}');assert.throws(()=>a.read());
});
test('transport uses approval endpoint, exact consent/key, private credentials and propagates auth failures',async()=>{
 const h=harness(),c=createApproval(projectId,h.send,h.store,()=>{});c.load();c.begin(context());const attempt=c.snapshot().confirmation!.attempt;
 let url:unknown,options:RequestInit|undefined;const transport=approvalTransport(projectId,(async(u,o)=>{url=u;options=o;return Response.json({data:approval});}) as typeof fetch);assert.deepEqual(await transport(attempt),approval);assert.equal(url,`/api/projects/${projectId}/storyboard-approvals`);assert.equal(options?.credentials,'same-origin');assert.equal(options?.cache,'no-store');assert.equal(new Headers(options?.headers).get('Idempotency-Key'),attempt.key);assert.deepEqual(JSON.parse(options?.body as string),attempt.body);
 await assert.rejects(approvalTransport(projectId,(async()=>Response.json({error:{code:'UNAUTHENTICATED'}},{status:401})) as typeof fetch)(attempt),e=>(e as any).code==='UNAUTHENTICATED');
});
