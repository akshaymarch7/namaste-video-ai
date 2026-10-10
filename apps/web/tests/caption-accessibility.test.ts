import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CaptionField} from '../components/video/caption-field';
import {RevisionConfirmation} from '../components/video/revision-confirmation';
const props={sceneTitle:'Evaporation',index:0,startFrame:0,endFrame:60,originalText:'Water rises.',value:'Water rises.',disabled:false,onChange:()=>{}};
function render(value=props.value){return renderToStaticMarkup(createElement(CaptionField,{...props,value}));}
test('caption has a distinct scene/position label, independent original text and linked hints',()=>{
 const html=render(),id=/textarea id="([^"]+)"/.exec(html)![1];
 assert.ok(html.includes(`for="${id}"`));assert.match(html,/Evaporation · Caption 1 · 0.0–2.0s<\/label>/);
 assert.ok(html.includes(`aria-describedby="${id}-original ${id}-hint"`));
 assert.ok(html.includes(`id="${id}-original"`));assert.ok(html.includes(`id="${id}-hint"`));
 assert.match(html,/aria-invalid="false"/);
});
test('invalid caption links its specific repair guidance to the field',()=>{
 const html=render('Different words.'),id=/textarea id="([^"]+)"/.exec(html)![1];
 assert.match(html,/aria-invalid="true"/);assert.ok(html.includes(`aria-describedby="${id}-original ${id}-hint ${id}-error"`));
 assert.ok(html.includes(`id="${id}-error"`));assert.match(html,/Revise the storyboard to change narration/);
});
test('supported spacing and capitalization changes are not marked invalid',()=>{
 for(const value of ['WATER RISES.','Water   rises.']){const html=render(value);assert.match(html,/aria-invalid="false"/);assert.ok(!html.includes('-error"'));}
});
test('caption IDs remain unique when several scenes are rendered',()=>{
 const html=renderToStaticMarkup(createElement('div',null,...['Evaporation','Condensation'].map(sceneTitle=>createElement(CaptionField,{...props,sceneTitle,key:sceneTitle}))));
 const ids=[...html.matchAll(/textarea id="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,2);
});
test('revision confirmation is named by its focusable heading and stays nonmodal',()=>{
 const html=renderToStaticMarkup(createElement(RevisionConfirmation,{blocked:false,confirmDisabled:false,returnFocus:{current:null},onConfirm:()=>{},onCancel:()=>{}}));
 const id=/aria-labelledby="([^"]+)"/.exec(html)![1];assert.ok(html.includes(`<h3 id="${id}" tabindex="-1">`));
 assert.match(html,/Confirm new version/);assert.match(html,/Keep editing/);assert.ok(!html.includes('aria-modal'));
});
