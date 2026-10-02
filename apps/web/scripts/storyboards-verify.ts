import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { ask } from './auth-input';
import { storyboardReceipt, storyboardView } from '../src/storyboards/api-contracts';
const origin='http://127.0.0.1:3001';let cookie='';
try {
  console.log('Live storyboard API checkpoint. Start auth:local -- --providers first. This consumes Gemini quota and creates one disposable project; it does not generate audio/video.');
  const email=(await ask('Test email: ')).trim(),password=await ask('Test password (hidden): ',true);
  const call=(path:string,method='GET',body?:unknown,key=randomUUID())=>fetch(`${origin}${path}`,{method,headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json','Idempotency-Key':key},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(95000)});
  const login=await call('/api/session/sign-in','POST',{email,password});assert.equal(login.status,200);
  cookie=login.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');
  const created=await call('/api/projects','POST',{title:'Storyboard API checkpoint'});assert.equal(created.status,201);const project=(await created.json()).data;
  const saved=await call(`/api/projects/${project.id}/draft`,'PATCH',{expectedRevision:1,changes:{topic:'Explain the difference between RAM and storage to a beginner.',audience:'Beginners'}});assert.equal(saved.status,200);const draft=(await saved.json()).data;
  const key=randomUUID(),body={expectedDraftRevision:draft.revision},path=`/api/projects/${project.id}/storyboards`;
  console.log(`Generating candidate for ${project.id}.`);
  let result;
  try { const response=await call(path,'POST',body,key);assert.ok([200,202].includes(response.status));result=storyboardReceipt.parse((await response.json()).data); }
  catch { console.log('Response not confirmed; replaying the same key to recover, without repeating provider work.');const response=await call(path,'POST',body,key);assert.ok([200,202].includes(response.status));result=storyboardReceipt.parse((await response.json()).data); }
  if(result.state!=='completed')throw Error(`RECEIPT_${result.state}:${result.errorCode??'PENDING'}`);
  const read=await call(`/api/storyboards/${result.storyboardId}`);assert.equal(read.status,200);const candidate=storyboardView.parse((await read.json()).data);
  const history=await call(path);assert.equal(history.status,200);assert.equal((await history.json()).data[0].id,candidate.id);
  const replay=await call(path,'POST',body,key);assert.equal(replay.headers.get('Idempotency-Replayed'),'true');assert.equal((await replay.json()).data.storyboardId,candidate.id);
  const latest=await call(`/api/projects/${project.id}/storyboard-requests/latest`);assert.equal((await latest.json()).data.id,result.id);
  assert.deepEqual((await (await call(`/api/projects/${project.id}/draft`)).json()).data,draft);
  await call(`/api/projects/${project.id}/draft`,'PATCH',{expectedRevision:draft.revision,changes:{topic:'A new idea saved after generation'}});
  assert.equal((await (await call(`/api/storyboards/${candidate.id}`)).json()).data.stale,true);
  console.log(`PASS: candidate ${candidate.id}; ${candidate.content.scenes.length} scenes; ${candidate.wordCount} words; ${candidate.estimatedDurationSeconds}s estimate. History, replay, receipt recovery, draft preservation and stale detection passed. Review UI and rendering are not implemented in this slice.`);
} catch(error) {
  console.error(error instanceof Error&&/^RECEIPT_[a-z]+:[A-Z_]+$/.test(error.message)?error.message:'CHECKPOINT_FAILED: Check the local launcher, credentials and sanitized provider diagnostics.');process.exitCode=1;
} finally {
  if(cookie)await fetch(`${origin}/api/session/sign-out`,{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(10000)}).catch(()=>undefined);
}
