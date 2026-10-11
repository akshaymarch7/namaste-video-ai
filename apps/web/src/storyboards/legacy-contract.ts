// Frozen registry used by migrations 005–009. Never widen this schema.
import { z } from 'zod';
const id = z.string().regex(/^[a-z][a-z0-9-]{0,49}$/);
const text = (max: number, min = 1) => min ? z.string().min(min).max(max).regex(/\S/u) : z.string().max(max);
const labelData = z.object({ labels: z.array(text(30)).min(1).max(4) }).strict();
const panel = z.object({ heading: text(18), points: z.array(text(26)).min(1).max(3) }).strict();
const visual = z.discriminatedUnion('component', [
  z.object({ component: z.literal('title'), version: z.literal(1), data: labelData }).strict(),
  z.object({ component: z.literal('takeaway'), version: z.literal(1), data: labelData }).strict(),
  z.object({ component: z.literal('flow'), version: z.literal(1), data: z.object({
    steps: z.array(z.object({id, label: text(30)}).strict()).min(2).max(4),
    edges: z.array(z.object({id, from: id, to: id}).strict()).min(1).max(6),
  }).strict() }).strict(),
  z.object({ component: z.literal('comparison'), version: z.literal(1), data: z.object({left: panel, right: panel}).strict() }).strict(),
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
