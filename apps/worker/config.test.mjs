import {test} from 'node:test';
import assert from 'node:assert/strict';
import {workerConfig} from './config.mjs';
const source={MONGODB_URI:'mongodb://fixture',MONGODB_DATABASE:'test_app',GEMINI_API_KEY:'fixture-gemini',GEMINI_MODEL:'fixture-model',ELEVENLABS_API_KEY:'fixture-speech',R2_ACCOUNT_ID:'fixture-account',R2_BUCKET:'fixture-bucket',R2_ACCESS_KEY_ID:'fixture-id',R2_SECRET_ACCESS_KEY:'fixture-secret',INSTAGRAM_APP_SECRET:'excluded',BETTER_AUTH_SECRET:'excluded',MONGODB_MIGRATION_URI:'excluded',NODE_OPTIONS:'excluded',NEXT_PUBLIC_SECRET:'excluded'};
test('storyboard process receives only its provider and runtime database settings',()=>{const c=workerConfig('storyboard',source);assert.equal(c.script,'storyboards-worker.ts');assert.deepEqual(Object.keys(c.env).sort(),['GEMINI_API_KEY','GEMINI_MODEL','MONGODB_DATABASE','MONGODB_URI','NODE_ENV'].sort());assert.equal(c.env.NODE_ENV,'production');});
test('generation excludes web auth, Meta, Gemini, migration and arbitrary node options',()=>{const c=workerConfig('generation',source);assert.equal(c.script,'generations-worker.ts');assert.deepEqual(Object.keys(c.env).sort(),['ELEVENLABS_API_KEY','R2_ACCOUNT_ID','R2_BUCKET','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','MONGODB_DATABASE','MONGODB_URI','NODE_ENV'].sort());});
test('invalid role or missing configuration fails before starting or exposing values',()=>{assert.throws(()=>workerConfig('bad',source),/Choose/);assert.throws(()=>workerConfig('generation',{...source,ELEVENLABS_API_KEY:''}),/^Error: Worker configuration missing: ELEVENLABS_API_KEY$/);});
test('OpenAI is scoped to storyboard only and primary credentials are required',()=>{
 const settings={...source,OPENAI_API_KEY:'private-openai',STORYBOARD_PRIMARY_PROVIDER:'openai',STORYBOARD_FALLBACK_PROVIDER:'gemini',OPENAI_STORYBOARD_MODEL:'gpt-4.1-mini'};
 assert.equal(workerConfig('storyboard',settings).env.OPENAI_API_KEY,'private-openai');
 assert.equal(workerConfig('generation',settings).env.OPENAI_API_KEY,undefined);
 assert.throws(()=>workerConfig('storyboard',{...settings,OPENAI_API_KEY:''}),/missing: OPENAI_API_KEY/);
 assert.equal(workerConfig('storyboard',{...settings,STORYBOARD_FALLBACK_PROVIDER:'',GEMINI_API_KEY:''}).env.OPENAI_API_KEY,'private-openai');
});
