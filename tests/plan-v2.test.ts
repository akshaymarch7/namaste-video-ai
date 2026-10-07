import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileV2,spokenText,motionAt,captionsVtt} from '../src/plan-v2/compiler';
import {renderFixture,fixtureSpeech,fixtureTimeline,layoutStressFixture} from '../src/plan-v2/fixture';
import {syntheticSpeech} from '../src/pipeline/timing';
import {labelLines,fitLabel} from '../src/plan-v2/text';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {renderPlanV2} from '../src/plan-v2/render';
const context={notes:'',voicePreset:'daniel-test'};
test('SVG text wraps long tokens without splitting Unicode code points',()=>{
 assert.deepEqual(labelLines('ABCDEFGHIJKLMNOPQRST',14),['ABCDEFGHIJKLMN','OPQRST']);
 assert.deepEqual(labelLines('🙂🙂🙂 test',2),['🙂🙂','🙂','te','st']);
});
test('all four components compile without discarding directed edges or motion events',()=>{
 const t=fixtureTimeline();assert.equal(t.frames,2160);assert.equal(t.fixture,true);
 assert.deepEqual(t.scenes.map(s=>s.visual.component),['title','flow','comparison','takeaway']);
 assert.deepEqual(t.scenes[1].visual,renderFixture.scenes[1].visual);
 assert.equal(t.scenes.reduce((n,s)=>n+s.events.length,0),11);
 for(let i=0;i<t.scenes.length;i++)assert.equal(t.scenes[i].start,i*540);
});
test('pronunciation maps repeated occurrences and retains original caption spelling',()=>{
 const s={narration:'RAM and RAM',pronunciation:[{phrase:'RAM',occurrence:2,spokenAs:'random access memory'}]};
 const spoken=spokenText(s);assert.equal(spoken.text,'RAM and random access memory');assert.equal(spoken.boundaries[8],8);assert.equal(spoken.boundaries[11],28);
 const t=fixtureTimeline();assert.match(t.scenes[0].captions.map(c=>c.text).join(' '),/RAM/);
});
test('cue inside a pronunciation replacement maps to measured spoken time',()=>{
 const p=structuredClone(renderFixture);p.scenes[0].pronunciation[0].spokenAs='random access memory';
 p.scenes[0].events[0].cue.phrase='AM';
 const speech=fixtureSpeech();speech.intro=syntheticSpeech(spokenText(p.scenes[0]).text,17.7);
 const t=compileV2(p,context,speech,true);assert.ok(t.scenes[0].events[0].start>0);
 assert.equal(t.scenes[0].captions.map(c=>c.text).join(' '),p.scenes[0].narration);
});
test('code-point alignment supports emoji and repeated cue occurrence',()=>{
 const p=structuredClone(renderFixture);p.scenes[0].narration='🙂 '+p.scenes[0].narration+' RAM.';
 p.scenes[0].events[0].cue={phrase:'RAM',occurrence:2,offsetMs:0};p.scenes[0].events[0].durationMs=0;
 const speech=fixtureSpeech();speech.intro=syntheticSpeech(spokenText(p.scenes[0]).text,17.7);
 const t=compileV2(p,context,speech,true);assert.ok(t.scenes[0].events[0].start>490);assert.match(t.scenes[0].captions[0].text,/🙂/);
});
test('rejects unknown registry, missing speech, mismatched text and malformed alignment',()=>{
 const p=structuredClone(renderFixture) as any;p.scenes[0].visual.component='arbitrary-code';assert.throws(()=>compileV2(p,context,fixtureSpeech(),true));
 const s=fixtureSpeech();delete s.intro;assert.throws(()=>compileV2(renderFixture,context,s,true),/SPEECH_SCENE_MISMATCH/);
 const mismatch=fixtureSpeech();mismatch.intro.alignment.characters[0]='?';assert.throws(()=>compileV2(renderFixture,context,mismatch,true),/ALIGNMENT_TEXT_MISMATCH/);
 const malformed=fixtureSpeech();malformed.intro.alignment.character_start_times_seconds[3]=NaN;assert.throws(()=>compileV2(renderFixture,context,malformed,true),/Invalid alignment/);
});
test('rejects measured duration outside 60–90 seconds',()=>{
 const speech=Object.fromEntries(renderFixture.scenes.map(s=>[s.id,syntheticSpeech(spokenText(s).text,8)]));
 assert.throws(()=>compileV2(renderFixture,context,speech,true),/MEASURED_DURATION_OUT_OF_RANGE/);
});
test('rejects collapsed caption timing instead of silently dropping spoken words',()=>{
 const speech=fixtureSpeech();speech.intro.alignment.character_start_times_seconds.fill(0);speech.intro.alignment.character_end_times_seconds.fill(0);
 assert.throws(()=>compileV2(renderFixture,context,speech,true),/CAPTION_OUT_OF_BOUNDS/);
});
test('rejects negative cue times and events extending past scene end',()=>{
 const p=structuredClone(renderFixture);p.scenes[0].events[0].cue={phrase:'Your',occurrence:1,offsetMs:-500};
 assert.throws(()=>compileV2(p,context,fixtureSpeech(),true),/MOTION_OUT_OF_BOUNDS/);
 p.scenes[0].events[0].cue={phrase:'both.',occurrence:1,offsetMs:0};p.scenes[0].events[0].durationMs=3000;
 assert.throws(()=>compileV2(p,context,fixtureSpeech(),true),/MOTION_OUT_OF_BOUNDS/);
});
test('reveal duration, zero-duration connect, compare and emphasis have explicit timing',()=>{
 const events=[{id:'a',targetId:'node',action:'reveal' as const,start:10,frames:20},{id:'b',targetId:'node',action:'emphasize' as const,start:35,frames:10}];
 assert.equal(motionAt(events,'node',9).visibility,0);assert.equal(motionAt(events,'node',20).visibility,.5);assert.equal(motionAt(events,'node',30).visibility,1);
 assert.ok(motionAt(events,'node',40).accent>.9);assert.equal(motionAt(events,'node',45).accent,0);
 assert.equal(motionAt(events,'other',0).visibility,1);
 assert.equal(motionAt([{id:'a',targetId:'edge',action:'connect',start:10,frames:0}],'edge',10).visibility,1);
 assert.equal(motionAt([{id:'a',targetId:'left',action:'compare',start:10,frames:0}],'left',10).accent,1);
});
test('VTT uses global offsets, preserves original captions and escapes markup',()=>{
 const t=fixtureTimeline();t.scenes[0].captions[0].text='<RAM> & storage';const vtt=captionsVtt(t);
 assert.match(vtt,/^WEBVTT\n/);assert.match(vtt,/&lt;RAM&gt; &amp; storage/);assert.match(vtt,/00:00:18\./);
});
test('renderer refuses an existing output directory and preserves earlier media',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'v2-preservation-'));
 try{
  await fs.writeFile(path.join(dir,'output.mp4'),'earlier output');
  await assert.rejects(()=>renderPlanV2({plan:renderFixture,notes:'',speech:fixtureSpeech(),fixture:true,outputDirectory:dir}),{code:'EEXIST'});
  assert.equal(await fs.readFile(path.join(dir,'output.mp4'),'utf8'),'earlier output');
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('live render rejects synthetic speech without local measured MP3 files before bundling',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'v2-audio-boundary-'));
 try{
  const dir=path.join(root,'attempt');
  await assert.rejects(()=>renderPlanV2({plan:renderFixture,notes:'',speech:fixtureSpeech(),fixture:false,outputDirectory:dir}),/LOCAL_AUDIO_REQUIRED/);
  await assert.rejects(()=>fs.stat(path.join(dir,'output.mp4')),{code:'ENOENT'});
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('reported three-line labels and headings fit their complete allocated slots',()=>{
 for(const [text,limit,size,top,height] of [
  ['Reliable distributed systems',16,32,56,80],
  ['Cloud storage cost',10,32,105,79],
  ['Retains data without power',10,27,218,100],
 ] as const){
  const layout=fitLabel(text,limit,size,top,height);
  assert.ok(layout.lines.length>=3);
  assert.ok(layout.baseline-layout.fontSize>=top-1e-8);
  const bottom=layout.baseline+(layout.lines.length-1)*layout.lineHeight+layout.fontSize*.2;
  assert.ok(bottom<=top+height+1e-8);
  assert.equal(layout.lines.join(' '),text);
 }
});
test('maximum-card and comparison stress fixture remains a valid storyboard',()=>{
 const t=compileV2(layoutStressFixture(),context,fixtureSpeech(),true);
 assert.equal(t.scenes.length,4);
 for(let i=0;i<4;i++){
  const layout=fitLabel('Reliable distributed systems',16,32,40+i*158+16,80);
  assert.ok(layout.baseline+2*layout.lineHeight+layout.fontSize*.2<40+i*158+112);
 }
});

test('caption display edits preserve source spans, timing and Unicode code points',async()=>{
 const {captionOverrides}=await import('../src/plan-v2/caption-edits');
 const plan=structuredClone(renderFixture),speech=fixtureSpeech();
 plan.scenes[0].narration='🧠 '+plan.scenes[0].narration;
 speech[plan.scenes[0].id]=syntheticSpeech(spokenText(plan.scenes[0]).text,speech[plan.scenes[0].id].duration);
 const base=compileV2(plan,{notes:'',voicePreset:'daniel-test'},speech,true),scene=base.scenes[0],caption=scene.captions[0];
 const overrides=captionOverrides.parse([{sceneId:scene.id,speechFingerprint:'a'.repeat(64),sourceStart:caption.sourceStart,sourceEnd:caption.sourceEnd,displayText:caption.text.toUpperCase()}]);
 const changed=compileV2(plan,{notes:'',voicePreset:'daniel-test'},speech,true,overrides);
 assert.equal(changed.scenes[0].captions[0].text,caption.text.toUpperCase());assert.equal(changed.scenes[0].captions[0].start,caption.start);assert.equal(changed.frames,base.frames);
 assert.throws(()=>compileV2(plan,{notes:'',voicePreset:'daniel-test'},speech,true,[{...overrides[0],displayText:'A different statement.'}]),/CAPTION_MEANING_CHANGE/);
 assert.throws(()=>compileV2(plan,{notes:'',voicePreset:'daniel-test'},speech,true,[overrides[0],overrides[0]]),/INVALID_SPAN/);
 assert.throws(()=>compileV2(plan,{notes:'',voicePreset:'daniel-test'},speech,true,[{...overrides[0],sourceStart:caption.sourceStart+1}]),/INVALID_SPAN/);
 for(const s of base.scenes){const original=plan.scenes.find(p=>p.id===s.id)!;for(const c of s.captions)assert.equal(Array.from(original.narration).slice(c.sourceStart,c.sourceEnd).join('').replace(/\s+/gu,' '),c.originalText);}
});

test('caption fitting preserves text within two measured lines and rejects impossible fits',async()=>{
 const {fitCaption,validateCaptionDisplay}=await import('../src/plan-v2/caption-edits');
 const text='W'.repeat(24)+' '+'W'.repeat(24),layout=fitCaption(text,(s,size)=>s.length*size);
 assert.ok(layout.lines.length<=2);assert.ok(layout.size<40);assert.equal(layout.lines.join(' '),text);
 assert.throws(()=>fitCaption('unfit',()=>900),/CAPTION_LAYOUT_INVALID/);
 assert.throws(()=>validateCaptionDisplay('1.5 metres','15 metres'),/CAPTION_MEANING_CHANGE/);
 assert.throws(()=>validateCaptionDisplay('do not change','do change'),/CAPTION_MEANING_CHANGE/);
});
