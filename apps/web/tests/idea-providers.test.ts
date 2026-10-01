import assert from 'node:assert/strict';
import { test } from 'node:test';
import { suggest, voicePreview, danielVoiceId, allowedPreview, geminiConfig, boundedBytes } from '../src/ideas/providers';
const suggestions = Array.from({length:3}, (_,i)=>({title:`Idea ${i}`,topic:`Explain concept ${i}`,angle:'Use a visual analogy'}));
const input = { prompt: 'Explain sorting', draft: {topic:'Sorting',audience:'Beginners',notes:'',voicePreset:'daniel-test'} };
const reject = (promise: Promise<unknown>, code: string) => assert.rejects(promise, (e: unknown) => (e as {code: string}).code===code);
test('Gemini uses a fixed HTTPS endpoint, exact model, structured output, header key and no retries', async () => {
  let calls=0;
  const mock = (async (url: string, options: RequestInit) => {
    calls++; assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent');
    assert.equal(new Headers(options.headers).get('x-goog-api-key'),'test-key'); assert.equal(options.redirect,'error');
    const body=JSON.parse(options.body as string); assert.equal(body.generationConfig.responseMimeType,'application/json');
    assert.ok(body.generationConfig.responseJsonSchema); assert.ok(body.systemInstruction);
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'not output'},{text:JSON.stringify({suggestions})}]}}]});
  }) as typeof fetch;
  assert.deepEqual(await suggest(input,{key:'test-key',model:'test-model'},mock),suggestions); assert.equal(calls,1);
});
test('Gemini rejects malformed, partial, blocked and oversized responses without exposing raw provider data', async () => {
  for (const body of [{candidates:[{finishReason:'MAX_TOKENS'}]}, {candidates:[{finishReason:'STOP',content:{parts:[{text:'bad JSON'}]}}]}, {candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({suggestions:[]})}]}}]}]) {
    await reject(suggest(input,{key:'key',model:'test'},(async()=>Response.json(body)) as typeof fetch),'PROVIDER_RESPONSE_INVALID');
  }
  await reject(boundedBytes(new Response('x'.repeat(101)),100),'PROVIDER_RESPONSE_INVALID');
});
test('provider failures are bounded and never automatically retry', async () => {
  let calls=0;
  await reject(suggest(input,{key:'key',model:'test'},(async()=>{calls++;throw new Error('private raw diagnostics');}) as typeof fetch),'PROVIDER_OUTCOME_UNKNOWN');
  assert.equal(calls,1);
  await reject(suggest(input,{key:'key',model:'test'},(async()=>new Response('secret echoed body',{status:429})) as typeof fetch),'PROVIDER_LIMIT');
  assert.throws(()=>geminiConfig({GEMINI_API_KEY:'key',GEMINI_MODEL:'../../anything'}),/AI_NOT_CONFIGURED/);
});
test('voice preview accepts only the fixed voice and allowlisted MP3 storage, without forwarding its key', async () => {
  const calls: string[]=[];
  const mock = (async(url:string,options:RequestInit)=>{
    calls.push(url); assert.equal(options.redirect,'error');
    if(calls.length===1){assert.equal(new Headers(options.headers).get('xi-api-key'),'key');return Response.json({voice_id:danielVoiceId,preview_url:'https://storage.googleapis.com/eleven-public-prod/sample.mp3'});}
    assert.equal(options.headers,undefined);return new Response(new Uint8Array([73,68,51]),{headers:{'Content-Type':'audio/mpeg'}});
  }) as typeof fetch;
  assert.equal((await voicePreview({ELEVENLABS_API_KEY:'key'},mock)).length,3); assert.equal(calls.length,2);
});
test('preview rejects SSRF, redirects, incorrect voice, missing configuration and bad media', async () => {
  for(const url of ['http://static.elevenlabs.io/a.mp3','https://localhost/a.mp3','https://storage.googleapis.com/private/a.mp3','https://static.elevenlabs.io.evil.example/a.mp3','https://user:pass@static.elevenlabs.io/a.mp3','https://static.elevenlabs.io/a.mp3?token=secret']) assert.throws(()=>allowedPreview(url));
  await reject(voicePreview({}),'VOICE_NOT_CONFIGURED');
  await reject(voicePreview({ELEVENLABS_API_KEY:'key'},(async()=>Response.json({voice_id:'other',preview_url:'https://static.elevenlabs.io/a.mp3'})) as typeof fetch),'VOICE_UNAVAILABLE');
  let calls=0;
  await reject(voicePreview({ELEVENLABS_API_KEY:'key'},(async()=>++calls===1?Response.json({voice_id:danielVoiceId,preview_url:'https://static.elevenlabs.io/a.mp3'}):new Response('<html>bad</html>',{headers:{'Content-Type':'text/html'}})) as typeof fetch),'VOICE_UNAVAILABLE');
});
