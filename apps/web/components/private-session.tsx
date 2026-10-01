'use client';
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './ui';
import { usePathname } from 'next/navigation';
import { signInLocation } from '@/src/auth/navigation';

export function PrivateSession({ expiresAt, userId, children }: { expiresAt: string; userId: string; children: ReactNode }) {
  const [state, setState] = useState<'ready' | 'checking' | 'offline'>('checking');
  const pathname = usePathname();
  const content = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const invalidate = useCallback(() => {
    generation.current += 1;
    pending.current?.abort();
    pending.current = null;
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
    } catch {
      if (current === generation.current) setState('offline');
    } finally {
      clearTimeout(timeout);
      if (current === generation.current) pending.current = null;
    }
  }, [invalidate, userId]);
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
