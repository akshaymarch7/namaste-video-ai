import {z} from 'zod';
import {projectId} from '../projects/contracts';
export const jobId=z.string().regex(/^job_[a-f0-9]{32}$/);
const revision=z.number().int().min(1).max(2147483646);
export const generationRequest=z.object({storyboardId:z.string().regex(/^stb_[a-f0-9]{32}$/),approvalId:z.string().regex(/^apr_[a-f0-9]{32}$/),expectedDraftRevision:revision,expectedDraftHash:z.string().regex(/^[a-f0-9]{64}$/),expectedContentHash:z.string().regex(/^[a-f0-9]{64}$/),confirm:z.literal(true)}).strict();
export const cancelRequest=z.object({expectedRevision:revision}).strict();
export const jobView=z.object({id:jobId,projectId,storyboardId:z.string(),state:z.enum(['queued','running','cancel_requested','cancelled','needs_input','failed']),stage:z.enum(['queued','checking','stopped']),revision,attempt:z.number().int().nonnegative(),errorCode:z.string().nullable(),createdAt:z.string().datetime(),updatedAt:z.string().datetime(),finishedAt:z.string().datetime().nullable(),actions:z.object({cancel:z.boolean()}).strict()}).strict();
export type JobView=z.infer<typeof jobView>;
export const activeStates=['queued','running','cancel_requested'];
