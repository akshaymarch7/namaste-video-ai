import { z } from 'zod';
// Count Unicode code points, matching MongoDB maxLength; preserve whitespace during editing.
const text = (max: number) => z.string().refine(value => [...value].length <= max);
export const ideaFields = z.object({ topic: text(2000), audience: text(200), notes: text(20000), voicePreset: z.string().min(1).max(64) }).strict();
export const patchDraft = z.object({ expectedRevision: z.number().int().min(1).max(2147483646), changes: ideaFields.partial().refine(value => Object.keys(value).length > 0) }).strict();
export type IdeaFields = z.infer<typeof ideaFields>;
export type DraftPatch = z.infer<typeof patchDraft>;
export type DraftView = IdeaFields & {
  projectId: string; conversationId: string; revision: number; editablePlan: null; sourceStoryboardId: null;
  planStale: false; contentHash: string; validation: { valid: false; issues: { path: string; code: string; message: string }[] }; updatedAt: string;
};
// Stable application preset, not an exposed provider ID or a live availability guarantee.
export const selectableVoices = ['daniel-test'] as const;
export const fieldsOf = ({ topic, audience, notes, voicePreset }: IdeaFields): IdeaFields => ({ topic, audience, notes, voicePreset });
export const sameIdea = (a: IdeaFields, b: IdeaFields) => (Object.keys(fieldsOf(a)) as (keyof IdeaFields)[]).every(key => a[key] === b[key]);
