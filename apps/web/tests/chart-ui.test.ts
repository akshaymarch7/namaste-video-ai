import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {SceneVisual} from '../components/storyboard/scene-visual';
import {planText} from '../components/storyboard/plan-comparison';
import type {EditableStoryboard} from '../src/storyboards/editable-contract';
const visual={component:'chart' as const,version:1 as const,data:{unit:'items',bars:[{id:'a',label:'A',value:10},{id:'b',label:'B',value:20},{id:'c',label:'C',value:30}]}};
test('schematic chart exposes exact values and zero-based proportional widths',()=>{
 const html=renderToStaticMarkup(createElement(SceneVisual,{visual}));
 assert.match(html,/A: 10 items/);assert.match(html,/scale starts at zero/);assert.match(html,/width:33\.333/);assert.match(html,/width:66\.666/);assert.match(html,/width:100%/);
 const incomplete={...visual,data:{...visual.data,bars:visual.data.bars.map((b,i)=>({...b,value:i===0?null:b.value}))}};
 assert.match(renderToStaticMarkup(createElement(SceneVisual,{visual:incomplete})),/Enter a value/);
 const invalid={...visual,data:{...visual.data,bars:visual.data.bars.map((b,i)=>({...b,value:i===0?-1:b.value}))}};
 assert.match(renderToStaticMarkup(createElement(SceneVisual,{visual:invalid})),/width:0%/);
});
test('conflict comparisons include chart values and units',()=>{
 const plan={title:'Values',learningObjective:'Compare',scenes:[{title:'Chart',kicker:'DATA',narration:'Compare values',visual,events:[],pronunciation:[]}]} as unknown as EditableStoryboard;
 assert.match(planText(plan),/A: 10 items/);const changed=structuredClone(plan);if(changed.scenes[0].visual.component==='chart')changed.scenes[0].visual.data.bars[0].value=11;
 assert.notEqual(planText(plan),planText(changed));
});
