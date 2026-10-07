import {test} from 'node:test';
import assert from 'node:assert/strict';
import {instagramController} from '../components/instagram/controller';
const view={id:'igc_fixture',revision:2,state:'connected' as const,account:{id:'123',username:'fixture',type:'CREATOR' as const},destinationEpoch:1,expiresAt:null,publishingAvailable:false,pendingIntentCount:0};
function store():Storage{const m=new Map<string,string>();return {get length(){return m.size;},key:i=>[...m.keys()][i]??null,getItem:k=>m.get(k)??null,setItem:(k,v)=>{m.set(k,v);},removeItem:k=>{m.delete(k);},clear:()=>m.clear()};}
const base={get:async()=>({connection:view,configured:true}),connect:async()=>({authorizationUrl:'https://www.instagram.com/oauth/authorize?state=fixture'}),disconnect:async()=>({connection:{...view,revision:3,state:'disconnected' as const,account:null}})};
test('lost disconnect survives reload and replays exact key/body; reads cannot settle it',async()=>{
 const storage=store();let sent:unknown;const c=instagramController(storage,'one',{...base,disconnect:async p=>{sent=p;throw Error();}},()=>{});await c.load();await c.disconnect();assert.ok(c.snapshot().pending);c.dispose();
 const d=instagramController(storage,'one',{...base,disconnect:async p=>{assert.deepEqual(p,sent);return base.disconnect();}},()=>{});await d.load();assert.ok(d.snapshot().pending);assert.equal(await d.connect(),null);await d.recover();assert.equal(d.snapshot().pending,null);assert.equal(storage.length,0);
});
test('conflict clears rejection and requires reload before any new action',async()=>{const c=instagramController(store(),'one',{...base,disconnect:async()=>{throw {code:'REVISION_CONFLICT'};}},()=>{});await c.load();await c.disconnect();assert.equal(c.snapshot().pending,null);assert.equal(c.snapshot().ready,false);assert.equal(await c.connect(),null);await c.load();assert.equal(c.snapshot().ready,true);});
test('storage errors block disconnect; separate tab stores and owners do not clear one another',async()=>{
 const s=store();s.setItem=()=>{throw Error();};let calls=0;const c=instagramController(s,'one',{...base,disconnect:async()=>{calls++;return base.disconnect();}},()=>{});await c.load();await c.disconnect();assert.equal(calls,0);assert.equal(c.snapshot().error,'RECOVERY_STORAGE');
 const shared=store(),a=instagramController(shared,'a',{...base,disconnect:async()=>{throw Error();}},()=>{}),b=instagramController(shared,'b',base,()=>{});await a.load();await a.disconnect();await b.load();await b.disconnect();assert.equal(shared.length,1);
});
test('unconfigured status disables authorization, unexpected redirect hosts are rejected',async()=>{const c=instagramController(store(),'a',{...base,get:async()=>({connection:view,configured:false})},()=>{});await c.load();assert.equal(await c.connect(),null);const d=instagramController(store(),'b',{...base,connect:async()=>({authorizationUrl:'https://evil.example'})},()=>{});await d.load();assert.equal(await d.connect(),null);assert.equal(d.snapshot().error,'OUTCOME_UNKNOWN');});
test('disposed response and malformed success preserve recovery receipt',async()=>{const s=store();let release!:(value:Awaited<ReturnType<typeof base.disconnect>>)=>void;const c=instagramController(s,'a',{...base,disconnect:()=>new Promise(r=>release=r)},()=>{});await c.load();const pending=c.disconnect();c.dispose();release(await base.disconnect());await pending;assert.equal(s.length,1);const d=instagramController(s,'a',{...base,disconnect:async()=>({connection:null as never})},()=>{});await d.load();await d.recover();assert.ok(d.snapshot().pending);assert.equal(s.length,1);});

test('Facebook authorization requires an explicit numeric Page ID and preserves the selected destination',async()=>{
 let calls=0,submitted:unknown;
 const c=instagramController(store(),'facebook',{...base,get:async()=>({connection:null,configured:true,provider:'facebook'}),connect:async(project,pageId)=>{calls++;submitted={project,pageId};return {authorizationUrl:'https://www.facebook.com/v26.0/dialog/oauth?state=fixture'};}},()=>{});
 await c.load();assert.equal(c.snapshot().provider,'facebook');
 for(const pageId of [undefined,'','page name','123abc',' 123','123 ','-1','1.5','1'.repeat(101)]){
  assert.equal(await c.connect(undefined,pageId),null);assert.equal(c.snapshot().error,'PAGE_REQUIRED');
 }
 assert.equal(calls,0);
 assert.equal(await c.connect('prj_test','123456'), 'https://www.facebook.com/v26.0/dialog/oauth?state=fixture');
 assert.equal(calls,1);assert.deepEqual(submitted,{project:'prj_test',pageId:'123456'});assert.equal(c.snapshot().error,'');
});
test('legacy direct Instagram authorization rejects Page selection without submitting',async()=>{
 let calls=0;const c=instagramController(store(),'direct',{...base,connect:async()=>{calls++;return base.connect();}},()=>{});
 await c.load();assert.equal(c.snapshot().provider,'instagram');
 assert.equal(await c.connect(undefined,'123'),null);assert.equal(c.snapshot().error,'VALIDATION_FAILED');assert.equal(calls,0);
 assert.equal(await c.connect(),'https://www.instagram.com/oauth/authorize?state=fixture');assert.equal(calls,1);
});
test('authorization redirects are limited to the configured provider and exact secure route',async()=>{
 for(const selectedProvider of ['facebook','instagram'] as const){
  const host=selectedProvider==='facebook'?'www.facebook.com':'www.instagram.com';
  const path=selectedProvider==='facebook'?'/v26.0/dialog/oauth':'/oauth/authorize';
  const invalid=[
   `http://${host}${path}`,`https://${host}:443${path}`,`https://${host}:444${path}`,
   `https://user:secret@${host}${path}`,`https://user@${host}${path}`,
   `https://${host}${path}#fragment`,`https://${host}${path}#`,
   `https://${host}.evil.example${path}`,`https://${host}${path}/other`,
   `https://${host}/other/..${path}`,`https://${host}${path.replace('oauth','login')}`,
   selectedProvider==='facebook'?'https://www.instagram.com/oauth/authorize':'https://www.facebook.com/v26.0/dialog/oauth',
   'javascript:alert(1)','not a URL'
  ];
  for(const authorizationUrl of invalid){
   const c=instagramController(store(),'allowlist',{...base,get:async()=>({connection:view,configured:true,provider:selectedProvider}),connect:async()=>({authorizationUrl})},()=>{});
   await c.load();assert.equal(await c.connect(undefined,selectedProvider==='facebook'?'123':undefined),null,authorizationUrl);assert.equal(c.snapshot().error,'OUTCOME_UNKNOWN');
  }
 }
});
test('Facebook connection read retains Page identity and professional type across disconnect recovery',async()=>{
 const facebookView={...view,provider:'facebook' as const,page:{id:'123456',name:'Test Page'},account:{...view.account,type:'PROFESSIONAL' as const}};
 const c=instagramController(store(),'facebook',{...base,get:async()=>({connection:facebookView,configured:true,provider:'facebook'})},()=>{});
 await c.load();assert.deepEqual(c.snapshot().connection,facebookView);await c.disconnect();assert.equal(c.snapshot().provider,'facebook');assert.deepEqual(c.snapshot().connection?.page,facebookView.page);assert.equal(c.snapshot().pending,null);
});
test('unknown provider prevents readiness and disposed connect responses do not navigate',async()=>{
 const c=instagramController(store(),'bad-provider',{...base,get:async()=>({connection:view,configured:true,provider:'unexpected' as never})},()=>{});
 await c.load();assert.equal(c.snapshot().ready,false);assert.equal(await c.connect(),null);
 let release!:(result:{authorizationUrl:string})=>void;
 const d=instagramController(store(),'disposed',{...base,connect:()=>new Promise(r=>release=r)},()=>{});
 await d.load();const pending=d.connect();d.dispose();release(await base.connect());assert.equal(await pending,null);
});
test('transport parses provider headers strictly with legacy fallback and sends only supplied Page/project fields',async t=>{
 const {instagramTransport}=await import('../components/instagram/controller');
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});
 let header:string|null='facebook',lastBody:unknown;
 globalThis.fetch=async(_input,init)=>{
  if(init?.method==='POST'){lastBody=JSON.parse(String(init.body));return Response.json({data:{authorizationUrl:'https://www.facebook.com/v26.0/dialog/oauth'}});}
  return Response.json({data:view},{headers:{'X-Instagram-Configured':'true',...(header===null?{}:{'X-Instagram-Provider':header})}});
 };
 assert.equal((await instagramTransport.get()).provider,'facebook');header='instagram';assert.equal((await instagramTransport.get()).provider,'instagram');header=null;assert.equal((await instagramTransport.get()).provider,'instagram');
 for(header of ['unexpected','','Facebook','facebook,instagram'])await assert.rejects(instagramTransport.get());
 await instagramTransport.connect('prj_test','9876');assert.deepEqual(lastBody,{returnProjectId:'prj_test',pageId:'9876'});
 await instagramTransport.connect(undefined,'9876');assert.deepEqual(lastBody,{pageId:'9876'});
 await instagramTransport.connect('prj_test');assert.deepEqual(lastBody,{returnProjectId:'prj_test'});
 await instagramTransport.connect();assert.deepEqual(lastBody,{});
});
