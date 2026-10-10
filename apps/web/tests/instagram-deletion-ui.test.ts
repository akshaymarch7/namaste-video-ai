import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {DeletionStatusContent} from '../components/instagram/deletion-status';
for(const state of ['completed','needs_review','not_found','unavailable'] as const)test(`deletion status ${state} shows honest scope without account data`,()=>{
 const html=renderToStaticMarkup(createElement(DeletionStatusContent,{state,updatedAt:'2026-10-10T00:00:00.000Z'}));
 assert.match(html,/<h1>/);assert.match(html,/generated videos/);assert.match(html,/Minimal request/);
 assert.equal(html.includes('Instagram data removed.'),state==='completed');
 if(state==='needs_review')assert.match(html,/under review/);if(state==='unavailable')assert.match(html,/cannot check/);
 assert.ok(!html.includes('profileId'));assert.ok(!html.includes('subjectHash'));
});
