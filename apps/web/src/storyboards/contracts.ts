import { z } from 'zod';
const id = z.string().regex(/^[a-z][a-z0-9-]{0,49}$/);
const text = (max: number, min = 1) => min ? z.string().min(min).max(max).regex(/\S/u) : z.string().max(max);
const labelData = z.object({ labels: z.array(text(30)).min(1).max(4) }).strict();
const panel = z.object({ heading: text(18), points: z.array(text(26)).min(1).max(3) }).strict();
export const chartVisual=z.object({component:z.literal('chart'),version:z.literal(1),data:z.object({unit:text(20),bars:z.array(z.object({id,label:text(30),value:z.number().finite().min(0).max(1000000000)}).strict()).min(2).max(4)}).strict()}).strict();
const visual = z.discriminatedUnion('component', [
  z.object({ component: z.literal('title'), version: z.literal(1), data: labelData }).strict(),
  z.object({ component: z.literal('takeaway'), version: z.literal(1), data: labelData }).strict(),
  z.object({ component: z.literal('flow'), version: z.literal(1), data: z.object({
    steps: z.array(z.object({id, label: text(30)}).strict()).min(2).max(4),
    edges: z.array(z.object({id, from: id, to: id}).strict()).min(1).max(6),
  }).strict() }).strict(),
  z.object({ component: z.literal('comparison'), version: z.literal(1), data: z.object({left: panel, right: panel}).strict() }).strict(),
  chartVisual,
]);
export const storyboardSchema = z.object({
  schemaVersion: z.literal(2), title: text(100), audience: text(200,0), learningObjective: text(500),
  language: z.literal('en'), voicePreset: z.literal('daniel-test'),
  sources: z.array(z.object({id, kind: z.enum(['provided_notes','illustrative']), text: text(20000)}).strict()).max(20),
  scenes: z.array(z.object({
    id, title: text(65), kicker: text(35), narration: text(1400,20),
    pronunciation: z.array(z.object({phrase:text(150), occurrence:z.number().int().min(1).max(20), spokenAs:text(150)}).strict()).max(20),
    visual,
    events: z.array(z.object({id, targetId: id, action:z.enum(['reveal','emphasize','connect','compare']),
      cue: z.object({phrase:text(150),occurrence:z.number().int().min(1).max(20),offsetMs:z.number().int().min(-500).max(500)}).strict(),
      durationMs:z.number().int().min(0).max(3000),
    }).strict()).min(1).max(20),
    sourceIds:z.array(id).max(20),
  }).strict()).min(3).max(10),
}).strict();
export type Storyboard = z.infer<typeof storyboardSchema>;
// One authoritative target/action registry for validation and provider repair.
export function visualTargets(raw: unknown): Record<string,string[]> {
  const parsed=visual.safeParse(raw);
  if(!parsed.success)return {};
  const v=parsed.data;
  if(v.component==='flow')return Object.fromEntries([
    ...v.data.steps.map(s=>[s.id,['reveal','emphasize']]),
    ...v.data.edges.map(e=>[e.id,['reveal','emphasize','connect']]),
  ]);
  if(v.component==='chart')return Object.fromEntries(v.data.bars.map(b=>[b.id,['reveal','emphasize']]));
  if(v.component==='comparison')return {left:['reveal','emphasize','compare'],right:['reveal','emphasize','compare']};
  return Object.fromEntries(v.data.labels.map((_,i)=>[`label-${i+1}`,['reveal','emphasize']]));
}

export type PlanIssue = { path: string; code: string; actual?: number; minimum?: number; maximum?: number };
export function schemaIssues(issues:readonly z.core.$ZodIssue[]):PlanIssue[] {
  return issues.slice(0,30).map(issue=>({path:issue.path.join('.'),code:issue.code,
    ...('maximum' in issue&&typeof issue.maximum==='number'&&Number.isFinite(issue.maximum)?{maximum:issue.maximum}:{}),
    ...('minimum' in issue&&typeof issue.minimum==='number'&&Number.isFinite(issue.minimum)?{minimum:issue.minimum}:{})}));
}
export class StoryboardInvalid extends Error {
  constructor(public issues: PlanIssue[]) { super('STORYBOARD_INVALID'); }
}
function occurrence(text: string, phrase: string, n: number) {
  let index = -1;
  for(let i=0;i<n;i++) { index=text.indexOf(phrase,index+1); if(index<0) return -1; }
  return index;
}
export function validateStoryboard(raw: unknown, context: {notes: string; voicePreset: string}) {
  const parsed = storyboardSchema.safeParse(raw);
  // Only schema paths and fixed codes leave validation. Never echo model/user text.
  if(!parsed.success) throw new StoryboardInvalid(schemaIssues(parsed.error.issues));
  const plan = parsed.data, issues: PlanIssue[]=[];
  const add=(path:string,code:string)=>{if(issues.length<30)issues.push({path,code});};
  const unique=(values:string[],path:string)=>{if(new Set(values).size!==values.length)add(path,'DUPLICATE_ID');};
  unique(plan.scenes.map(s=>s.id),'scenes'); unique(plan.sources.map(s=>s.id),'sources');
  if(plan.voicePreset!==context.voicePreset)add('voicePreset','VOICE_MISMATCH');
  if(plan.sources.reduce((n,s)=>n+s.text.length,0)>20000)add('sources','SOURCE_TEXT_LIMIT');
  for(const [i,source] of plan.sources.entries()) if(source.kind==='provided_notes'&&!context.notes.includes(source.text))add(`sources.${i}`,'UNSUPPORTED_SOURCE');
  let words=0;
  for(const [i,scene] of plan.scenes.entries()) {
    const path=`scenes.${i}`, targets=visualTargets(scene.visual);
    unique(scene.events.map(e=>e.id),`${path}.events`); unique(scene.sourceIds,`${path}.sourceIds`);
    if(scene.sourceIds.some(id=>!plan.sources.some(s=>s.id===id)))add(`${path}.sourceIds`,'UNKNOWN_SOURCE');
    const v=scene.visual;
    if(v.component==='flow') {
      unique([...v.data.steps.map(s=>s.id),...v.data.edges.map(e=>e.id)],`${path}.visual.data`);
      for(const edge of v.data.edges) {
        if(edge.from===edge.to||![edge.from,edge.to].every(id=>v.data.steps.some(s=>s.id===id)))add(`${path}.visual.data.edges`,'INVALID_EDGE');
      }
    } else if(v.component==='chart') {
      unique(v.data.bars.map(b=>b.id),`${path}.visual.data.bars`);
    }
    for(const [j,event] of scene.events.entries()) {
      if(!Object.hasOwn(targets,event.targetId)||!targets[event.targetId].includes(event.action))add(`${path}.events.${j}`,'INVALID_TARGET_ACTION');
      if(occurrence(scene.narration,event.cue.phrase,event.cue.occurrence)<0)add(`${path}.events.${j}.cue`,'MISSING_CUE');
    }
    const replacements=scene.pronunciation.map((p,j)=>{
      const start=occurrence(scene.narration,p.phrase,p.occurrence);
      if(start<0)add(`${path}.pronunciation.${j}`,'MISSING_PHRASE');
      return {start,end:start+p.phrase.length,spoken:p.spokenAs};
    }).sort((a,b)=>a.start-b.start);
    for(let j=1;j<replacements.length;j++)if(replacements[j].start<replacements[j-1].end)add(`${path}.pronunciation`,'OVERLAPPING_PRONUNCIATION');
    let spoken=scene.narration;
    for(const replacement of [...replacements].reverse())if(replacement.start>=0)spoken=spoken.slice(0,replacement.start)+replacement.spoken+spoken.slice(replacement.end);
    words+=spoken.trim().split(/\s+/u).filter(Boolean).length;
  }
  // Planning estimate only: 150 spoken words/minute. Actual speech timing is later.
  const estimatedDurationSeconds=Math.round(words/2.5*10)/10;
  if((estimatedDurationSeconds<60||estimatedDurationSeconds>90)&&issues.length<30)issues.push({path:'scenes',code:'DURATION_ESTIMATE_OUT_OF_RANGE',actual:words,minimum:150,maximum:225});
  if(issues.length)throw new StoryboardInvalid(issues);
  return {content:plan,estimatedDurationSeconds,wordCount:words};
}
