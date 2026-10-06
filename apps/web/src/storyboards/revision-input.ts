import {z} from 'zod';
import {storyboardSchema} from './contracts';
export const revisionInstruction=z.object({
 instruction:z.string().trim().min(1).max(4000),
 sceneId:storyboardSchema.shape.scenes.element.shape.id.optional(),
}).strict();
export type RevisionInstruction=z.infer<typeof revisionInstruction>;
