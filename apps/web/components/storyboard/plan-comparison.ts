import type {EditableStoryboard} from '../../src/storyboards/editable-contract';

/** Human-readable comparison of text and timing settings replaced by keep-local. */
export function planText(plan:EditableStoryboard|null):string {
 if(!plan)return 'No working copy';
 return `${plan.title}\n${plan.learningObjective}\n\n`+plan.scenes.map((scene,index)=>{
  const visual=scene.visual;
  const onScreen=visual.component==='flow'?visual.data.steps.map(step=>step.label).join(' → ')
   :visual.component==='comparison'?[visual.data.left,visual.data.right].map(side=>[side.heading,...side.points].join(' · ')).join(' / ')
   :visual.data.labels.join(' · ');
  const cues=scene.events.map((event,i)=>
   `  Cue ${i+1} (${event.id}): phrase ${JSON.stringify(event.cue.phrase)}; occurrence ${event.cue.occurrence}; offset ${event.cue.offsetMs} ms; ${event.action} ${event.targetId}; duration ${event.durationMs} ms`
  ).join('\n')||'  None';
  const pronunciation=scene.pronunciation.map((entry,i)=>
   `  Pronunciation ${i+1}: phrase ${JSON.stringify(entry.phrase)}; spoken as ${JSON.stringify(entry.spokenAs)}; occurrence ${entry.occurrence}`
  ).join('\n')||'  None';
  return `${index+1}. ${scene.title}\n${scene.kicker}\n${scene.narration}\nOn-screen text: ${onScreen}\nMotion cues:\n${cues}\nPronunciation:\n${pronunciation}`;
 }).join('\n\n');
}
