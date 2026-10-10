'use client';
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Brand, Button } from './ui';
import {sessionController,readSession,initialSessionState} from './session-controller';
import {notifySessionChanged,subscribeSessionChanges} from './session-events';
import { usePathname } from 'next/navigation';
import { signInLocation } from '@/src/auth/navigation';

export function PrivateSession({ expiresAt, userId, children }: { expiresAt: string; userId: string; children: ReactNode }) {
  const [state, setState] = useState(initialSessionState);
  const session = useRef<ReturnType<typeof sessionController>|null>(null);
  const [revealVersion, setRevealVersion] = useState(0);
  const pathname = usePathname();
  const content = useRef<HTMLDivElement>(null);
  const dialogFocus = useRef<{ dialog: HTMLElement; control: HTMLElement; selection: [number | null, number | null, 'forward' | 'backward' | 'none' | null] | null } | null>(null);
  const conceal = useCallback(() => {
    // Capture before hiding moves focus to BODY. Repeated checks must not overwrite it.
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && content.current?.contains(focused)) {
      // Fragment navigation can emit popstate; preserve the skip-link target too.
      const dialog = focused.matches('main#main') ? focused : focused.closest<HTMLElement>('[role="dialog"],[data-private-focus-scope]');
      if (dialog) dialogFocus.current = { dialog, control: focused,
        selection: focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement
          ? [focused.selectionStart, focused.selectionEnd, focused.selectionDirection] : null };
    }
    // Hide synchronously: React can retain this DOM/state across route restoration.
    if (content.current) content.current.hidden = true;
  }, []);
  useLayoutEffect(() => {
    if (!state.visible) return;
    const saved = dialogFocus.current;
    if (!saved) return;
    if (!saved.dialog.isConnected || !content.current?.contains(saved.dialog)) { dialogFocus.current = null; return; }
    if (!saved.dialog.getClientRects().length) return;
    dialogFocus.current = null;
    // Do not steal focus if the user deliberately moved it elsewhere during validation.
    if (document.activeElement !== document.body && document.activeElement !== document.documentElement) return;
    const target = saved.control.isConnected && saved.dialog.contains(saved.control)
      && !saved.control.matches(':disabled,[inert]') && saved.control.getClientRects().length
      ? saved.control : saved.dialog.querySelector<HTMLElement>('input:not(:disabled),textarea:not(:disabled),button:not(:disabled),[tabindex="0"]') ?? saved.dialog;
    target.focus({ preventScroll: true });
    if (target === saved.control && saved.selection && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      const [start, end, direction] = saved.selection;
      if (start !== null && end !== null) target.setSelectionRange(start, end, direction ?? undefined);
    }
  }, [state, revealVersion]);
  useLayoutEffect(() => {
    const current=sessionController({userId,expiresAt,read:readSession,conceal,redirect:url=>window.location.replace(url),onChange:next=>{
      const wasHidden=content.current?.hidden;
      if(content.current)content.current.hidden=!next.visible;
      setState(next);
      if(next.visible&&wasHidden)setRevealVersion(value=>value+1);
    }});
    session.current=current;
    // Initial entry, pathname changes and React reactivation must not trust cached identity.
    void current.guard();
    const background=()=>{if(document.visibilityState==='visible')void current.check();};
    const guard=()=>{void current.guard();};
    const hide=()=>current.suspend();
    const show=(event:PageTransitionEvent)=>{if(event.persisted)guard();};
    const interval=setInterval(background,60000);
    const unsubscribe=subscribeSessionChanges(guard);
    window.addEventListener('focus',background);
    window.addEventListener('online',background);
    window.addEventListener('popstate',guard);
    window.addEventListener('pagehide',hide);
    window.addEventListener('pageshow',show);
    document.addEventListener('visibilitychange',background);
    return()=>{
      current.dispose();session.current=null;clearInterval(interval);unsubscribe();
      window.removeEventListener('focus',background);
      window.removeEventListener('online',background);
      window.removeEventListener('popstate',guard);
      window.removeEventListener('pagehide',hide);
      window.removeEventListener('pageshow',show);
      document.removeEventListener('visibilitychange',background);
    };
  }, [conceal, expiresAt, pathname, userId]);
  const retry=()=>void session.current?.check();
  return <><div ref={content} hidden={!state.visible}>{children}</div>
    {state.visible&&state.offline&&<aside className="session-banner" role="status"><span>Connection interrupted. Your work is still here. Retrying…</span><Button variant="secondary" onClick={retry} disabled={state.checking}>Retry now</Button></aside>}
    {!state.visible&&<section className="library-base session-placeholder" role="status" aria-label={state.offline?'Connection interrupted':'Loading your workspace'}>
      <aside className="library-sidebar" aria-hidden="true" inert><Brand/><div className="session-skeleton session-skeleton-nav"/></aside>
      <div className="library-content"><div className="library-topbar" aria-hidden="true"><div className="session-skeleton session-skeleton-title"/></div>
        <div className="library-main">{state.offline?<><h1>Connection interrupted</h1><p>We couldn’t verify your session. Your saved work is safe. Reconnecting automatically.</p><Button onClick={retry} disabled={state.checking}>Try again</Button></>:<div aria-hidden="true"><div className="session-skeleton session-skeleton-title"/><div className="session-skeleton session-skeleton-panel"/></div>}</div>
      </div>
    </section>}
  </>;

}

export function SignOutButton({ beforeSignOut, onSignOutFailed }: { beforeSignOut?: () => boolean; onSignOutFailed?: () => void } = {}) {
  const [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  async function signOut() {
    if (busy || (beforeSignOut && !beforeSignOut())) return;
    setBusy(true); setFailed(false);
    try {
      const response = await fetch('/api/session/sign-out', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(10000) });
      if (response.status !== 204) throw new Error();
      notifySessionChanged();
      window.location.replace(signInLocation('signed-out'));
    } catch { setFailed(true); setBusy(false); onSignOutFailed?.(); }
  }
  return <div className="sign-out-control"><Button variant="secondary" onClick={signOut} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'}</Button>{failed && <p role="alert">Couldn’t sign out. Please try again.</p>}</div>;
}
