import assert from 'node:assert/strict';
import { test } from 'node:test';
import { suggest, voicePreview, danielVoiceId, allowedPreview, geminiConfig, boundedBytes, ideaThinking, type IdeaDiagnostic } from '../src/ideas/providers';
const suggestions = Array.from({length:3}, (_,i)=>({title:`Idea ${i}`,topic:`Explain concept ${i}`,angle:'Use a visual analogy'}));
const input = { prompt: 'Explain sorting', draft: {topic:'Sorting',audience:'Beginners',notes:'',voicePreset:'daniel-test'} };
const reject = (promise: Promise<unknown>, code: string) => assert.rejects(promise, (e: unknown) => (e as {code: string}).code===code);
test('Gemini uses a fixed HTTPS endpoint, exact model, structured output, header key and no retries', async () => {
  let calls=0;
  const mock = (async (url: string, options: RequestInit) => {
    calls++; assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
    assert.equal(new Headers(options.headers).get('x-goog-api-key'),'test-key'); assert.equal(options.redirect,'error');
    const body=JSON.parse(options.body as string); assert.equal(body.generationConfig.responseMimeType,'application/json');
    assert.deepEqual(body.generationConfig.thinkingConfig,{thinkingLevel:'minimal'});
    assert.ok(body.generationConfig.responseJsonSchema); assert.ok(body.systemInstruction);
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'not output'},{text:JSON.stringify({suggestions})}]}}]});
  }) as typeof fetch;
  assert.deepEqual(await suggest(input,{key:'test-key',model:'gemini-3.5-flash-lite'},mock),suggestions); assert.equal(calls,1);
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

test('signed API preview permits only Daniel endpoint and never forwards the API key', async () => {
  const sample = `https://api.us.elevenlabs.io/v1/voices/${danielVoiceId}/previews/audio?token=fixture`;
  assert.equal(allowedPreview(sample), sample);
  for (const url of [sample.replace(danielVoiceId, 'another-voice'), sample.replace('/previews/audio', '/settings'), sample.replace('api.us.elevenlabs.io', 'api.us.elevenlabs.io.evil.example'), `${sample}#fragment`, sample.replace('https:', 'http:')]) assert.throws(() => allowedPreview(url));
  let calls = 0;
  const mock = (async (url: string, options: RequestInit) => {
    if (++calls === 1) return Response.json({voice_id: danielVoiceId, preview_url: sample});
    assert.equal(url, sample); assert.equal(options.headers, undefined); assert.equal(options.redirect, 'error');
    return new Response(new Uint8Array([73, 68, 51]), {headers: {'Content-Type': 'audio/mpeg'}});
  }) as typeof fetch;
  assert.equal((await voicePreview({ELEVENLABS_API_KEY: 'key'}, mock)).length, 3);
  assert.equal(calls, 2);
});

test('brainstorming sets minimal thinking only for verified compatible models', () => {
  assert.deepEqual(ideaThinking('gemini-3.5-flash-lite'), {thinkingConfig: {thinkingLevel: 'minimal'}});
  assert.deepEqual(ideaThinking('gemini-3.5-flash'), {thinkingConfig: {thinkingLevel: 'minimal'}});
  assert.deepEqual(ideaThinking('other-model'), {});
});
test('diagnostics classify HTTP failures without logging response bodies or credentials', async () => {
  for (const [status, category, code] of [[400,'CONFIGURATION','PROVIDER_CONFIGURATION'],[401,'AUTHORIZATION','PROVIDER_AUTHORIZATION'],[403,'AUTHORIZATION','PROVIDER_AUTHORIZATION'],[404,'CONFIGURATION','PROVIDER_CONFIGURATION'],[429,'RATE_LIMIT','PROVIDER_LIMIT'],[503,'UNAVAILABLE','PROVIDER_UNAVAILABLE']] as const) {
    const events: IdeaDiagnostic[] = []; let calls = 0;
    await reject(suggest(input, {key:'private-key',model:'test'}, (async () => {
      calls++; return new Response('private response with prompt and key', {status});
    }) as typeof fetch, event => events.push(event)), code);
    assert.equal(calls,1); assert.equal(events.length,1);
    assert.equal(events[0].httpStatus,status); assert.equal(events[0].category,category);
    assert.ok(events[0].durationMs >= 0);
    assert.deepEqual(Object.keys(events[0]).sort(), ['category','durationMs','httpStatus']);
    assert.equal(JSON.stringify(events).includes('private'),false);
  }
});
test('timeout, network and malformed success remain distinct without retries', async () => {
  for (const [name, category] of [['TimeoutError','TIMEOUT'],['TypeError','NETWORK']] as const) {
    const events: IdeaDiagnostic[] = []; let calls = 0;
    await reject(suggest(input,{key:'key',model:'test'},(async()=>{calls++;throw Object.assign(new Error('sensitive diagnostic'),{name});}) as typeof fetch,e=>events.push(e)), 'PROVIDER_OUTCOME_UNKNOWN');
    assert.equal(events[0].category,category); assert.equal(events[0].httpStatus,null); assert.equal(calls,1);
  }
  const events: IdeaDiagnostic[] = [];
  await reject(suggest(input,{key:'key',model:'test'},(async()=>new Response('invalid JSON')) as typeof fetch,e=>events.push(e)), 'PROVIDER_RESPONSE_INVALID');
  assert.equal(events[0].category,'INVALID_RESPONSE'); assert.equal(events[0].httpStatus,200);
});
test('success emits one safe diagnostic and a broken logger cannot discard usable suggestions', async () => {
  const mock = (async()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({suggestions})}]}}]})) as typeof fetch;
  const events: IdeaDiagnostic[]=[];
  assert.deepEqual(await suggest(input,{key:'key',model:'test'},mock,e=>events.push(e)),suggestions);
  assert.equal(events.length,1); assert.equal(events[0].category,'OK'); assert.equal(events[0].httpStatus,200);
  assert.deepEqual(await suggest(input,{key:'key',model:'test'},mock,()=>{throw new Error('logger failed');}),suggestions);
});

test('current request is separate and last; saved topic is explicitly optional context', async () => {
  const switching = {prompt: 'Give me water-cycle ideas instead', draft: {topic: 'Binary search', audience: 'Beginners', notes: 'Use sorted arrays', voicePreset: 'daniel-test'}};
  const mock = (async (_url: string, options: RequestInit) => {
    const body = JSON.parse(options.body as string);
    assert.equal(body.contents.length, 2);
    assert.match(body.contents[0].parts[0].text, /^SAVED DRAFT CONTEXT/);
    assert.match(body.contents[0].parts[0].text, /Binary search/);
    assert.equal(body.contents[1].parts[0].text, `CURRENT REQUEST (use this subject and direction):\n${switching.prompt}`);
    assert.equal(body.contents[1].parts[0].text.includes('Binary search'), false);
    assert.match(body.systemInstruction.parts[0].text, /switch completely/);
    assert.match(body.systemInstruction.parts[0].text, /Only use the saved topic when/);
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({suggestions})}]}}]});
  }) as typeof fetch;
  await suggest(switching, {key:'key',model:'test'}, mock);
  assert.equal(switching.draft.topic, 'Binary search');
});
