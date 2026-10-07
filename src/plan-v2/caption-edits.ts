import {z} from 'zod';
export const captionOverride=z.object({sceneId:z.string().min(1).max(80),speechFingerprint:z.string().regex(/^[a-f0-9]{64}$/),sourceStart:z.number().int().nonnegative(),sourceEnd:z.number().int().positive(),displayText:z.string().trim().min(1).max(200)}).strict();
export const captionOverrides=z.array(captionOverride).max(100);
export type CaptionOverride=z.infer<typeof captionOverride>;
// Conservative display-only boundary: punctuation and word boundaries stay exact.
// Spelling, punctuation and semantic rewrites must return to narration review.
export const normalizeCaption=(s:string)=>s.trim().replace(/\s+/gu,' ').toLocaleLowerCase('en-US');
export function validateCaptionDisplay(source:string,display:string){if(normalizeCaption(source)!==normalizeCaption(display))throw Error('CAPTION_MEANING_CHANGE');}
export function fitCaption(text:string,measure:(text:string,size:number)=>number){
 for(let size=40;size>=24;size--){
  const lines:string[]=[];let line='';
  for(const word of text.trim().split(/\s+/u)){
   if(measure(word,size)>782){lines.push('');break;}
   const next=line?`${line} ${word}`:word;
   if(line&&measure(next,size)>782){lines.push(line);line=word;}else line=next;
  }
  if(line)lines.push(line);
  if(lines.length&&lines.length<=2&&lines.every(l=>l&&measure(l,size)<=782))return {lines,size};
 }
 throw Error('CAPTION_LAYOUT_INVALID');
}
