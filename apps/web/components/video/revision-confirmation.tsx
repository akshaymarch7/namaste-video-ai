'use client';
import {useEffect,useId,useRef,type RefObject} from 'react';
import {Button} from '../ui';

// This is an inline confirmation, not a modal: move to its heading without
// trapping Tab or hiding the rest of the review page.
export function RevisionConfirmation({blocked,confirmDisabled,returnFocus,onConfirm,onCancel}:{blocked:boolean;confirmDisabled:boolean;returnFocus:RefObject<HTMLButtonElement|null>;onConfirm:()=>void;onCancel:()=>void}) {
 const id=useId(),heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{heading.current?.focus();},[]);
 function cancel(){
  onCancel();
  const target=returnFocus.current;
  if(target?.isConnected&&!target.disabled&&!target.closest('[inert]'))target.focus();
 }
 return <section className="notice" aria-labelledby={id}>
  <h3 id={id} ref={heading} tabIndex={-1}>Create a new version?</h3>
  <p>We will reuse verified saved narration. If it is unavailable, this request stops without another speech call. Your earlier video stays available, and the new version needs its own approval.</p>
  <Button disabled={confirmDisabled} onClick={onConfirm}>Confirm new version</Button>
  <Button variant="secondary" disabled={blocked} onClick={cancel}>Keep editing</Button>
 </section>;
}
