import {z} from 'zod';
import {projectId} from '../projects/contracts';
export const facebookPageId=z.string().regex(/^\d{1,100}$/);
export const connectInput=z.object({returnProjectId:projectId.optional(),pageId:facebookPageId.optional()}).strict();
export const disconnectInput=z.object({expectedRevision:z.number().int().min(1),confirmPausePending:z.literal(true)}).strict();
export const connectionView=z.object({id:z.string(),revision:z.number().int(),state:z.enum(['connected','expiring','reconnect_required','disconnected']),account:z.object({id:z.string(),username:z.string(),type:z.enum(['BUSINESS','CREATOR','PROFESSIONAL'])}).nullable(),provider:z.enum(['instagram','facebook']).optional(),page:z.object({id:facebookPageId,name:z.string().min(1).max(256)}).nullable().optional(),destinationEpoch:z.number().int(),expiresAt:z.string().nullable(),publishingAvailable:z.boolean(),pendingIntentCount:z.number().int()});
export type ConnectionView=z.infer<typeof connectionView>;
export const scopes=['instagram_business_basic','instagram_business_content_publish'] as const;
