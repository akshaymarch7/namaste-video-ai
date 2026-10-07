import {z} from 'zod';
// Keep interior spacing; flatten line breaks/tabs so VTT cue syntax stays valid.
export const captionDisplayText=(s:string)=>s.trim().replace(/\s/gu,' ');
export const captionOverride=z.object({sceneId:z.string().min(1).max(80),speechFingerprint:z.string().regex(/^[a-f0-9]{64}$/),sourceStart:z.number().int().nonnegative(),sourceEnd:z.number().int().positive(),displayText:z.string().trim().min(1).max(200)}).strict();
export const captionOverrides=z.array(captionOverride).max(100);
export type CaptionOverride=z.infer<typeof captionOverride>;
// Conservative display-only boundary: punctuation and word boundaries stay exact.
// Spelling, punctuation and semantic rewrites must return to narration review.
export const normalizeCaption=(s:string)=>s.trim().replace(/\s+/gu,' ').toLocaleLowerCase('en-US');
export function validateCaptionDisplay(source:string,display:string){if(normalizeCaption(source)!==normalizeCaption(display))throw Error('CAPTION_MEANING_CHANGE');}
export function fitCaption(text:string,measure:(text:string,size:number)=>number){
 const display=captionDisplayText(text);
 for(let size=40;size>=24;size--){
  if(measure(display,size)<=782)return {lines:[display],size};
  // Break only after a complete separator, retaining every space on the first line.
  const candidates=[...display.matchAll(/ +/g)].map(m=>m.index!+m[0].length)
   .map(i=>[display.slice(0,i),display.slice(i)])
   .filter(lines=>lines.every(line=>measure(line,size)<=782));
  candidates.sort((a,b)=>Math.abs(measure(a[0],size)-measure(a[1],size))-Math.abs(measure(b[0],size)-measure(b[1],size)));
  if(candidates.length)return {lines:candidates[0],size};
 }
 throw Error('CAPTION_LAYOUT_INVALID');
}
