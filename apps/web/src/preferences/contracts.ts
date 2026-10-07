import {z} from 'zod';
export const preferenceView=z.object({revision:z.number().int().min(0).max(2147483647),timezone:z.string().min(1).max(100),defaultVoicePreset:z.string().min(1).max(64)}).strict();
export type Preferences=z.infer<typeof preferenceView>;
export const patchPreferences=z.object({expectedRevision:z.number().int().min(0).max(2147483646),timezone:z.string().min(1).max(100).optional(),defaultVoicePreset:z.string().min(1).max(64).optional()}).strict().refine(v=>v.timezone!==undefined||v.defaultVoicePreset!==undefined);
export type PreferencePatch=z.infer<typeof patchPreferences>;
export const defaultPreferences:Preferences={revision:0,timezone:'Asia/Kolkata',defaultVoicePreset:'daniel-test'};
export function validTimezone(value:string){
 if(value!=='UTC'&&!/^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)+$/.test(value))return false;
 try{new Intl.DateTimeFormat('en',{timeZone:value}).format();return true;}catch{return false;}
}
