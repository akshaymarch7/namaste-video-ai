'use client';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Button } from './ui';
import { signInLocation } from '@/src/auth/navigation';

export function PrivateSession({ expiresAt, userId, children }: { expiresAt: string; userId: string; children: ReactNode }) {
  const [state, setState] = useState<'ready' | 'checking' | 'offline'>('ready');
  const check = useCallback(async () => {
    setState('checking');
    try {
      const result = await fetch('/api/session', { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(10000) });
      if (result.status === 401) { window.location.replace(signInLocation('expired')); return; }
      if (result.status === 403) { window.location.replace('/access-help?state=disabled'); return; }
      if (result.ok && (await result.json()).data.user.id !== userId) { window.location.replace('/projects'); return; }
      setState(result.ok ? 'ready' : 'offline');
    } catch { setState('offline'); }
  }, [userId]);
  useEffect(() => {
    const expiry = setTimeout(() => window.location.replace(signInLocation('expired')), Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    const interval = setInterval(check, 60000);
    const hide = () => setState('checking');
    const show = (event: PageTransitionEvent) => { if (event.persisted) void check(); };
    window.addEventListener('focus', check); window.addEventListener('pagehide', hide); window.addEventListener('pageshow', show);
    return () => { clearTimeout(expiry); clearInterval(interval); window.removeEventListener('focus', check); window.removeEventListener('pagehide', hide); window.removeEventListener('pageshow', show); };
  }, [check, expiresAt]);
  return state === 'ready' ? children : <section className="session-check" role="status"><h1>{state === 'checking' ? 'Checking your session…' : 'Connection interrupted'}</h1>{state === 'offline' && <><p>We couldn’t verify your session. Check your connection to continue.</p><Button onClick={check}>Try again</Button></>}</section>;
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
