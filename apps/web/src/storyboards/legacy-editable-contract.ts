// Frozen draft contract for migration 007.
import {z} from 'zod';
import {storyboardSchema} from './legacy-contract';
// Drafts preserve incomplete text while retaining all structural bounds and enums.
const text=(max:number)=>z.string().max(max);
const panel=z.object({heading:text(18),points:z.array(text(26)).min(1).max(3)}).strict();
const original=storyboardSchema.shape.scenes.element;
const visuals=original.shape.visual.options;
export const editableStoryboardSchema=storyboardSchema.extend({
 title:text(100),learningObjective:text(500),
 scenes:z.array(original.extend({title:text(65),kicker:text(35),narration:text(1400),
  visual:z.discriminatedUnion('component',[
   visuals[0].extend({data:z.object({labels:z.array(text(30)).min(1).max(4)}).strict()}),
   visuals[1].extend({data:z.object({labels:z.array(text(30)).min(1).max(4)}).strict()}),
   visuals[2].extend({data:visuals[2].shape.data.extend({steps:z.array(visuals[2].shape.data.shape.steps.element.extend({label:text(30)})).min(2).max(4)})}),
   visuals[3].extend({data:z.object({left:panel,right:panel}).strict()}),
  ]),
 })).min(3).max(10),
});
