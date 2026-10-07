import {z} from 'zod';
// Values, never credentials, are frozen with the approved job input.
export const renderConfigSchema=z.object({version:z.literal(1),voiceId:z.literal('onwK4e9ZLuTAKqWW03F9'),model:z.literal('eleven_multilingual_v2'),format:z.literal('mp3_44100_128'),stability:z.literal(0.5),similarityBoost:z.literal(0.75),renderer:z.literal('plan-v2-1'),fps:z.literal(30),width:z.literal(1080),height:z.literal(1920)}).strict();
export const renderConfig=renderConfigSchema.parse({version:1,voiceId:'onwK4e9ZLuTAKqWW03F9',model:'eleven_multilingual_v2',format:'mp3_44100_128',stability:0.5,similarityBoost:0.75,renderer:'plan-v2-1',fps:30,width:1080,height:1920});
export type RenderConfig=z.infer<typeof renderConfigSchema>;
