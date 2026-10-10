import {test} from 'node:test';
import assert from 'node:assert/strict';
import {measureStage,observeHandler} from '../src/diagnostics/timing';

test('timings preserve response, cookies, body and exactly one mutation',async()=>{
 let calls=0;const reports:unknown[]=[];
 const handler=observeHandler('videos',async()=>{calls++;await measureStage('transaction',async()=>true);return new Response('saved',{status:202,headers:{'Set-Cookie':'session=private; HttpOnly','Idempotency-Replayed':'true'}});},s=>reports.push(s));
 const response=await handler();assert.equal(calls,1);assert.equal(response.status,202);assert.equal(await response.text(),'saved');assert.equal(response.headers.get('set-cookie'),'session=private; HttpOnly');assert.equal(response.headers.get('idempotency-replayed'),'true');assert.match(response.headers.get('server-timing')!,/app;dur=.+transaction;dur=/);assert.deepEqual(reports,[]);
});
test('failed outcomes remain failures and telemetry excludes request content',async()=>{
 const reports:unknown[]=[];const input={secret:'do-not-log',url:'https://private/?token=secret'};
 const response=await observeHandler('publishing',async(_input:unknown)=>new Response('unknown secret body',{status:503,headers:{'X-Request-Id':'req_'+'a'.repeat(32)}}),s=>reports.push(s))(input);
 assert.equal(response.status,503);assert.equal(await response.text(),'unknown secret body');assert.equal(reports.length,1);const text=JSON.stringify(reports);assert.ok(!text.includes('secret'));assert.ok(!text.includes('private'));assert.match(text,/req_aaaaaaaa/);
});
test('overlapping requests isolate stage measurements',async()=>{
 let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 const first=observeHandler('videos',async()=>{await measureStage('transaction',()=>gate);return new Response();})();
 const second=await observeHandler('session',async()=>{await measureStage('session',async()=>true);return new Response();})();
 release();const response=await first;
 assert.ok(!second.headers.get('server-timing')!.includes('transaction'));
 assert.ok(!response.headers.get('server-timing')!.includes('session;'));
 assert.ok(response.headers.get('server-timing')!.includes('transaction'));
});
test('thrown outcomes and logger failures never retry or replace an operation',async()=>{
 const failure=Error('private driver error');let calls=0;
 await assert.rejects(observeHandler('jobs',async()=>{calls++;await measureStage('transaction',async()=>{throw failure;});return new Response();},()=>{throw Error('logger failed');})(),error=>error===failure);
 assert.equal(calls,1);
 const response=await observeHandler('jobs',async()=>new Response(null,{status:503}),()=>{throw Error();})();assert.equal(response.status,503);
});
test('untrusted request ids are omitted and out-of-request stages work',async()=>{
 const reports:any[]=[];
 await observeHandler('projects',async()=>new Response(null,{status:503,headers:{'x-request-id':'private-token'}}),s=>reports.push(s))();assert.equal(reports[0].requestId,null);
 assert.equal(await measureStage('admission',async()=>42),42);
});
test('slow successful requests produce a bounded timing record',async t=>{
 let now=0;t.mock.method(performance,'now',()=>now);const reports:any[]=[];
 const response=await observeHandler('projects',async()=>{await measureStage('readiness',async()=>{now=5100;});return new Response(null,{status:200});},s=>reports.push(s))();
 assert.equal(response.status,200);assert.equal(reports.length,1);assert.equal(reports[0].durationMs,5100);assert.equal(reports[0].stages.readiness,5100);
});
