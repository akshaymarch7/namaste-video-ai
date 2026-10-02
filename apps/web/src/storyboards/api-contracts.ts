import { z } from 'zod';
import { storyboardSchema } from './contracts';
import { listProjects } from '../projects/contracts';
export const storyboardId = z.string().regex(/^stb_[a-f0-9]{32}$/);
export const storyboardRequest = z.object({ expectedDraftRevision: z.number().int().min(1).max(2147483647) }).strict();
export const listStoryboards = listProjects.omit({ filter: true });
const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const storyboardSummary = z.object({
  id: storyboardId, projectId: z.string(), parentId: z.null(), sourceDraftRevision: z.number().int(),
  state: z.literal('review_ready'), title: z.string(), contentHash: hash, storyHash: hash,
  estimatedDurationSeconds: z.number(), wordCount: z.number().int(), stale: z.boolean(),
  warnings: z.array(z.never()), changeSummary: z.null(), changedSceneIds: z.array(z.never()), approvalId: z.null(), createdAt: z.string(),
}).strict();
export const storyboardView = storyboardSummary.extend({ content: storyboardSchema });
export const storyboardReceipt = z.object({
  id: z.string().regex(/^job_[a-f0-9]{32}$/), projectId: z.string(), state: z.enum(['running','completed','failed','unknown']),
  sourceDraftRevision: z.number().int(), model: z.string(), storyboardId: storyboardId.nullable(), errorCode: z.string().nullable(),
  createdAt: z.string(), updatedAt: z.string(), deadline: z.string(),
  stage:z.enum(['queued','planning','repairing','retrying','checking','ready','stopped']).optional(), attempt:z.number().int().min(0).max(4).optional(), issueCodes:z.array(z.string().max(80)).max(30).optional(),
}).strict();
export type StoryboardReceipt = z.infer<typeof storyboardReceipt>;
