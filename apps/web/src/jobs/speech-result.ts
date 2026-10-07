import {z} from 'zod';
export const speechResult=z.object({audio:z.string().min(1).max(12*1024*1024),duration:z.number().positive().max(90),alignment:z.object({characters:z.array(z.string().min(1).max(8)).min(1).max(5000),character_start_times_seconds:z.array(z.number().nonnegative()).max(5000),character_end_times_seconds:z.array(z.number().nonnegative()).max(5000)}).strict()}).strict();
export type SpeechResult=z.infer<typeof speechResult>;
