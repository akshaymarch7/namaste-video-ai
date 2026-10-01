'use client';
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './ui';
import { usePathname } from 'next/navigation';
import { signInLocation } from '@/src/auth/navigation';

export function PrivateSession({ expiresAt, userId, children }: { expiresAt: string; userId: string; children: ReactNode }) {
  const [state, setState] = useState<'ready' | 'checking' | 'offline'>('checking');
  const [revealVersion, setRevealVersion] = useState(0);
  const pathname = usePathname();
  const content = useRef<HTMLDivElement>(null);
  const dialogFocus = useRef<{ dialog: HTMLElement; control: HTMLElement; selection: [number | null, number | null, 'forward' | 'backward' | 'none' | null] | null } | null>(null);
  const generation = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const invalidate = useCallback(() => {
    generation.current += 1;
    pending.current?.abort();
    pending.current = null;
    // Capture before hiding moves focus to BODY. Repeated checks must not overwrite it.
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && content.current?.contains(focused)) {
      const dialog = focused.closest<HTMLElement>('[role="dialog"]');
      if (dialog) dialogFocus.current = { dialog, control: focused,
        selection: focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement
          ? [focused.selectionStart, focused.selectionEnd, focused.selectionDirection] : null };
    }
    // Hide synchronously: React can retain this DOM/state across route restoration.
    if (content.current) content.current.hidden = true;
  }, []);
  const check = useCallback(async () => {
    invalidate();
    const current = generation.current;
    const controller = new AbortController();
    pending.current = controller;
    setState('checking');
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const result = await fetch('/api/session', { cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
      const identity = result.ok ? (await result.json()).data.user.id : undefined;
      // Aborting alone is insufficient if the response/body already resolved.
      if (current !== generation.current) return;
      if (result.status === 401) { window.location.replace(signInLocation('expired')); return; }
      if (result.status === 403) { window.location.replace('/access-help?state=disabled'); return; }
      if (result.ok && identity !== userId) { window.location.replace('/projects'); return; }
      if (content.current) content.current.hidden = !result.ok;
      setState(result.ok ? 'ready' : 'offline');
      // Also trigger restoration when React batches checking → ready into one render.
      if (result.ok) setRevealVersion(value => value + 1);
    } catch {
      if (current === generation.current) setState('offline');
    } finally {
      clearTimeout(timeout);
      if (current === generation.current) pending.current = null;
    }
  }, [invalidate, userId]);
  useLayoutEffect(() => {
    if (state !== 'ready') return;
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
    // Runs before paint on mount and on React reactivation, even with preserved state.
    void check();
    const expiry = setTimeout(() => { invalidate(); window.location.replace(signInLocation('expired')); }, Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    const interval = setInterval(check, 60000);
    const hide = () => { invalidate(); setState('checking'); };
    const show = (event: PageTransitionEvent) => { if (event.persisted) void check(); };
    const visibility = () => { if (document.visibilityState === 'visible') void check(); else hide(); };
    window.addEventListener('focus', check);
    window.addEventListener('popstate', check);
    window.addEventListener('pagehide', hide);
    window.addEventListener('pageshow', show);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      invalidate();
      clearTimeout(expiry); clearInterval(interval);
      window.removeEventListener('focus', check);
      window.removeEventListener('popstate', check);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('pageshow', show);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [check, invalidate, expiresAt, pathname]);
  return <><div ref={content} hidden={state !== 'ready'}>{children}</div>{state !== 'ready' && <section className="session-check" role="status"><h1>{state === 'checking' ? 'Checking your session…' : 'Connection interrupted'}</h1>{state === 'offline' && <><p>We couldn’t verify your session. Check your connection to continue.</p><Button onClick={check}>Try again</Button></>}</section>}</>;
}

export function SignOutButton() {
  const [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  async function signOut() {
    if (busy) return;
    setBusy(true); setFailed(false);
    try {
      const response = await fetch('/api/session/sign-out', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(10000) });
      if (response.status !== 204) throw new Error();
      window.location.replace(signInLocation('signed-out'));
    } catch { setFailed(true); setBusy(false); }
  }
  return <div className="sign-out-control"><Button variant="secondary" onClick={signOut} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'}</Button>{failed && <p role="alert">Couldn’t sign out. Please try again.</p>}</div>;
}
