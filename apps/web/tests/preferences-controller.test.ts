import {test} from 'node:test';
import assert from 'node:assert/strict';
import {preferenceController,preferenceStore} from '../components/preferences/controller';
import {defaultPreferences,type PreferencePatch} from '../src/preferences/contracts';
function storage():Storage{const m=new Map<string,string>();return {get length(){return m.size;},key:i=>[...m.keys()][i]??null,getItem:k=>m.get(k)??null,setItem:(k,v)=>{m.set(k,v);},removeItem:k=>{m.delete(k);},clear:()=>m.clear()};}
test('save updates confirmed preferences; owner stores are isolated',async()=>{
 const s=storage(),store=preferenceStore(s,'one');let current={...defaultPreferences};const c=preferenceController(store,{get:async()=>current,save:async b=>(current={...current,...b,revision:b.expectedRevision+1,timezone:b.timezone!,defaultVoicePreset:b.defaultVoicePreset!}, {revision:current.revision,timezone:current.timezone,defaultVoicePreset:current.defaultVoicePreset})},()=>{});
 await c.load();c.edit('timezone','UTC');await c.save();assert.equal(c.snapshot().saved,true);assert.equal(c.snapshot().pending,null);assert.equal(current.timezone,'UTC');assert.equal(preferenceStore(s,'two').read(),null);
});
test('lost save stays pending across reload; old read cannot declare success and exact CAS recovery resolves conflict',async()=>{
 const s=storage(),store=preferenceStore(s,'one'),sent:PreferencePatch[]=[];let current={...defaultPreferences};
 const c=preferenceController(store,{get:async()=>current,save:async b=>{sent.push(b);throw Error('lost');}},()=>{});await c.load();c.edit('timezone','UTC');await c.save();const pending=c.snapshot().pending;c.dispose();
 const recovered=preferenceController(store,{get:async()=>current,save:async b=>{sent.push(b);current={revision:1,timezone:'UTC',defaultVoicePreset:'daniel-test'};throw {code:'REVISION_CONFLICT'};}},()=>{});
 await recovered.load();assert.deepEqual(recovered.snapshot().pending,pending);assert.equal(recovered.snapshot().saved,false);
 await recovered.recover();assert.deepEqual(sent[0],sent[1]);assert.equal(recovered.snapshot().pending,null);assert.equal(recovered.snapshot().error,'REVISION_CONFLICT');assert.equal(recovered.snapshot().current?.revision,1);recovered.useSaved();assert.equal(recovered.snapshot().draft?.timezone,'UTC');
});
test('conflict preserves local edits and requires a new explicit save using current revision',async()=>{
 let current={...defaultPreferences},calls=0;const c=preferenceController(preferenceStore(storage(),'one'),{get:async()=>current,save:async b=>{calls++;if(calls===1){current={...current,revision:1,timezone:'Europe/London'};throw {code:'REVISION_CONFLICT'};}assert.equal(b.expectedRevision,1);return {...current,revision:2,timezone:b.timezone!};}},()=>{});
 await c.load();c.edit('timezone','UTC');await c.save();assert.equal(c.snapshot().draft?.timezone,'UTC');assert.equal(c.snapshot().current?.timezone,'Europe/London');assert.equal(calls,1);await c.save();assert.equal(c.snapshot().saved,true);
});
test('storage failure blocks mutation; disposed completion keeps receipt for recovery',async()=>{
 const s=storage();s.setItem=()=>{throw Error();};let calls=0;const c=preferenceController(preferenceStore(s,'one'),{get:async()=>defaultPreferences,save:async()=>{calls++;return {}; }},()=>{});await c.load();c.edit('timezone','UTC');await c.save();assert.equal(calls,0);assert.equal(c.snapshot().error,'RECOVERY_STORAGE');
 const store=preferenceStore(storage(),'two');let release!:(v:unknown)=>void;const d=preferenceController(store,{get:async()=>defaultPreferences,save:()=>new Promise(r=>release=r)},()=>{});await d.load();d.edit('timezone','UTC');const work=d.save();d.dispose();release({...defaultPreferences,revision:1,timezone:'UTC'});await work;assert.ok(store.read());
});

test('malformed success remains recoverable; validation rejection releases only the pending save',async()=>{
 const store=preferenceStore(storage(),'one');let reject=false;const c=preferenceController(store,{get:async()=>defaultPreferences,save:async()=>{if(reject)throw {code:'INVALID_TIMEZONE'};return {...defaultPreferences,revision:1,timezone:'unexpected'};}},()=>{});
 await c.load();c.edit('timezone','UTC');await c.save();assert.ok(c.snapshot().pending);assert.equal(c.snapshot().saved,false);reject=true;await c.recover();assert.equal(c.snapshot().pending,null);assert.equal(store.read(),null);assert.equal(c.snapshot().draft?.timezone,'UTC');
});

for(const choice of ['local','saved'] as const){
 test(`failed conflict refresh preserves draft through repeated reload failures, then explicit ${choice} choice`,async()=>{
  const store=preferenceStore(storage(),'one'),sent:PreferencePatch[]=[];let reads=0;
  const server={revision:3,timezone:'Europe/London',defaultVoicePreset:'daniel-test'};
  const c=preferenceController(store,{get:async()=>{reads++;if(reads===1)return defaultPreferences;if(reads<=3)throw Error('offline');return server;},save:async b=>{sent.push(b);if(sent.length===1)throw {code:'REVISION_CONFLICT'};return {...server,revision:4,timezone:b.timezone!};}},()=>{});
  await c.load();c.edit('timezone','UTC');await c.save();
  assert.equal(c.snapshot().current,null);assert.equal(c.snapshot().pending,null);assert.equal(store.read(),null);assert.equal(c.snapshot().draft?.timezone,'UTC');
  await c.load();assert.equal(c.snapshot().current,null);assert.equal(c.snapshot().draft?.timezone,'UTC');
  await c.load();assert.deepEqual(c.snapshot().current,server);assert.equal(c.snapshot().draft?.timezone,'UTC');assert.equal(c.snapshot().error,'REVISION_CONFLICT');assert.equal(c.snapshot().saved,false);assert.equal(sent.length,1);
  if(choice==='local'){await c.save();assert.equal(sent[1].expectedRevision,3);assert.equal(sent[1].timezone,'UTC');assert.equal(c.snapshot().saved,true);}
  else{c.useSaved();assert.equal(c.snapshot().draft?.timezone,'Europe/London');assert.equal(c.snapshot().error,'');assert.equal(sent.length,1);}
 });
}

test('settings-compatible brand navigation uses a native anchor so beforeunload can guard drafts',async()=>{
 const {Brand}=await import('../components/ui');
 const native=Brand({documentNavigation:true});
 assert.equal(native.type,'a');assert.equal(native.props.href,'/');assert.equal(native.props.onClick,undefined);assert.equal(native.props['aria-label'],'NamasteVideo home');
 assert.notEqual(Brand().type,'a'); // Other pages keep their existing Next.js navigation.
});
