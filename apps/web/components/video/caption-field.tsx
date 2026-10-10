'use client';
import {useId} from 'react';
import {normalizeCaption} from '../../../../src/plan-v2/caption-edits';

export function CaptionField({sceneTitle,index,startFrame,endFrame,originalText,value,disabled,onChange}:{sceneTitle:string;index:number;startFrame:number;endFrame:number;originalText:string;value:string;disabled:boolean;onChange:(value:string)=>void}) {
 const id=useId(),invalid=normalizeCaption(value)!==normalizeCaption(originalText);
 return <div className="caption-edit-field">
  <label htmlFor={id}>{sceneTitle} · Caption {index+1} · {(startFrame/30).toFixed(1)}–{(endFrame/30).toFixed(1)}s</label>
  <textarea id={id} maxLength={200} rows={2} value={value} disabled={disabled} onChange={e=>onChange(e.target.value)} aria-invalid={invalid} aria-describedby={`${id}-original ${id}-hint${invalid?` ${id}-error`:''}`}/>
  <small id={`${id}-original`}>Original: {originalText}</small>
  <small id={`${id}-hint`}>Capitalization and spacing only. Up to 200 characters.</small>
  {invalid&&<p id={`${id}-error`} className="idea-invalid">Words and punctuation must match the original. Revise the storyboard to change narration.</p>}
 </div>;
}
