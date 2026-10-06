import {z} from 'zod';
import {storyboardSchema,StoryboardInvalid,validateStoryboard,type PlanIssue} from './contracts';
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
export type EditableStoryboard=z.infer<typeof editableStoryboardSchema>;
export function inspectEditablePlan(plan:EditableStoryboard|null,context:{notes:string;voicePreset:string},stale:boolean){
 let issues:PlanIssue[]=[];
 if(!plan)issues=[{path:'editablePlan',code:'STORYBOARD_REQUIRED'}];
 else try{validateStoryboard(plan,context);}catch(error){if(!(error instanceof StoryboardInvalid))throw error;issues=error.issues;}
 if(stale)issues=[{path:'editablePlan',code:'PLAN_STALE'},...issues].slice(0,30);
 return {valid:issues.length===0,issues:issues.map(i=>({...i,message:i.code==='PLAN_STALE'?'The saved idea changed; generate and apply a current storyboard.':i.code==='STORYBOARD_REQUIRED'?'Create and review a storyboard before approval.':`Review ${i.path||'storyboard'}: ${i.code}.`}))};
}
export const applyStoryboard=z.object({expectedDraftRevision:z.number().int().min(1).max(2147483646),storyboardId:z.string().regex(/^stb_[a-f0-9]{32}$/),expectedContentHash:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
