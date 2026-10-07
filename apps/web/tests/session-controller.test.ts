import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sessionController,type SessionResult} from '../components/session-controller';
const expiry=()=>new Date(Date.now()+600000).toISOString();
const good=():SessionResult=>({status:200,userId:'one',expiresAt:expiry()});
function deferred(){let resolve!:(value:SessionResult)=>void;const promise=new Promise<SessionResult>(r=>resolve=r);return {promise,resolve};}
function setup(t:any){let read=()=>Promise.resolve(good()),hidden=0;const redirects:string[]=[];
 const c=sessionController({userId:'one',expiresAt:expiry(),read:()=>read(),onChange:()=>{},conceal:()=>hidden++,redirect:url=>redirects.push(url)});
 t.after(()=>c.dispose());return {c,redirects,setRead:(fn:()=>Promise<SessionResult>)=>read=fn,hidden:()=>hidden};}
test('initial validation gates content, background refresh stays visible and deduplicates',async t=>{
 const h=setup(t),first=deferred();h.setRead(()=>first.promise);
 const start=h.c.guard();assert.equal(h.c.snapshot().visible,false);first.resolve(good());await start;
 const next=deferred();h.setRead(()=>next.promise);const count=h.hidden();const a=h.c.check(),b=h.c.check();
 assert.equal(a,b);assert.equal(h.c.snapshot().visible,true);assert.equal(h.hidden(),count);
 next.resolve(good());await a;assert.deepEqual(h.c.snapshot(),{visible:true,checking:false,offline:false});
});
test('background failure preserves confirmed content; retry clears banner',async t=>{
 const h=setup(t);await h.c.guard();h.setRead(async()=>{throw Error('offline');});await h.c.check();
 assert.deepEqual(h.c.snapshot(),{visible:true,checking:false,offline:true});h.setRead(async()=>good());await h.c.check();assert.equal(h.c.snapshot().offline,false);
});
test('failed initial/history validation cannot reveal content',async t=>{
 const h=setup(t);h.setRead(async()=>({status:503}));await h.c.guard();assert.equal(h.c.snapshot().visible,false);
 h.setRead(async()=>good());await h.c.check();assert.equal(h.c.snapshot().visible,true);
 h.setRead(async()=>({status:503}));await h.c.guard();assert.equal(h.c.snapshot().visible,false);
});
test('history or cross-tab invalidation rejects an older successful response',async t=>{
 const h=setup(t);await h.c.guard();const old=deferred();h.setRead(()=>old.promise);const p=h.c.check();await Promise.resolve();
 const fresh=deferred();h.setRead(()=>fresh.promise);const q=h.c.guard();old.resolve(good());await p;
 assert.equal(h.c.snapshot().visible,false);fresh.resolve({status:401});await q;assert.equal(h.redirects.length,1);
});
for(const [result,destination] of [[{status:401},'expired'],[{status:403},'/access-help?state=disabled'],[{status:200,userId:'other',expiresAt:expiry()},'/projects']] as const){
 test(`confirmed invalidation ${destination} hides immediately`,async t=>{const h=setup(t);await h.c.guard();h.setRead(async()=>result);await h.c.check();assert.equal(h.c.snapshot().visible,false);assert.ok(h.redirects[0].includes(destination));});
}
test('ten-second timeout preserves visible page and retries automatically',async t=>{
 t.mock.timers.enable({apis:['setTimeout','Date']});const h=setup(t);await h.c.guard();h.setRead(()=>new Promise(()=>{}));const p=h.c.check();
 t.mock.timers.tick(10000);await p;assert.equal(h.c.snapshot().visible,true);assert.equal(h.c.snapshot().offline,true);
 h.setRead(async()=>good());t.mock.timers.tick(15000);await h.c.check();assert.equal(h.c.snapshot().offline,false);
});
test('known expiry hides even when provider never responds',async t=>{
 t.mock.timers.enable({apis:['setTimeout','Date']});const h=setup(t);await h.c.guard();h.setRead(()=>new Promise(()=>{}));const p=h.c.check();
 t.mock.timers.tick(600001);await p;assert.equal(h.c.snapshot().visible,false);assert.equal(h.redirects.length,1);
});
test('suspension and disposal ignore late successful results',async t=>{
 const h=setup(t);await h.c.guard();const d=deferred();h.setRead(()=>d.promise);const p=h.c.check();await Promise.resolve();h.c.suspend();d.resolve(good());await p;assert.equal(h.c.snapshot().visible,false);
 const e=deferred();h.setRead(()=>e.promise);const q=h.c.guard();await Promise.resolve();h.c.dispose();e.resolve(good());await q;assert.equal(h.c.snapshot().visible,false);
});
