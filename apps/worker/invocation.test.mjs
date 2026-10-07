import {test} from 'node:test';
import assert from 'node:assert/strict';
import {workerInvocation} from './invocation.mjs';
const id='job_'+'a'.repeat(32);
test('bounded invocation passes exactly one ID and explicit role',()=>{for(const role of ['storyboard','generation'])assert.deepEqual(workerInvocation([role,'--job',id]),{role,script:'cloud-job.ts',args:[role,id]});});
test('unconfigured image default, extra args and malformed IDs cannot start a poller',()=>{for(const args of [[],['generation','--job','required'],['generation','--job',id,'extra'],['generation','--once'],['generation','--job','../bad'],['bad']])assert.throws(()=>workerInvocation(args));});
test('explicit long-running commands preserve the local worker path',()=>{assert.equal(workerInvocation(['generation']).script,'generations-worker.ts');assert.equal(workerInvocation(['storyboard']).script,'storyboards-worker.ts');});
