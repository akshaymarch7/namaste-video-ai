'use client';

import Link from 'next/link';
import {notifySessionChanged} from './session-events';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from './ui';
import { safeReturnTo } from '@/src/auth/navigation';

export function SignInForm({ returnTo, reason }: { returnTo: string; reason?: string }) {
  const [initialized, setInitialized] = useState(false);
  useEffect(() => { setInitialized(true); }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [retryAt, setRetryAt] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const submitting = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!retryAt) return;
    const tick = () => setRemaining(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [retryAt]);
  useEffect(() => { if (message) feedback.current?.focus(); }, [message]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!initialized || submitting.current || remaining > 0) return;
    submitting.current = true; setBusy(true); setMessage('');
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const response = await fetch('/api/session/sign-in', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.get('email'), password: values.get('password') }), signal: AbortSignal.timeout(15000),
      });
      if (response.ok) { notifySessionChanged(); window.location.replace(safeReturnTo(returnTo)); return; }
      (form.elements.namedItem('password') as HTMLInputElement).value = '';
      if (response.status === 429) {
        const seconds = Math.min(3600, Math.max(1, Number(response.headers.get('Retry-After')) || 60));
        setRetryAt(Date.now() + seconds * 1000); setRemaining(seconds);
        setMessage('Too many sign-in attempts. Please wait before trying again.');
      } else if (response.status === 401) setMessage('Invalid email or password. Please try again.');
      else setMessage('We couldn’t sign you in right now. Please try again in a moment.');
    } catch { setMessage('We couldn’t reach the sign-in service. Check your connection and try again.'); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <form className="auth-form" method="post" action="/api/session/sign-in" onSubmit={submit} aria-busy={busy}>
    <noscript><p className="auth-notice">JavaScript is required to sign in. Enable it and reload this page.</p></noscript>
    {reason === 'expired' && <p className="auth-notice" role="status">Your session has ended. Sign in to return to your workspace.</p>}
    {reason === 'signed-out' && <p className="auth-notice" role="status">You’ve been signed out.</p>}
    {message && <div className="auth-error" role="alert" tabIndex={-1} ref={feedback}>{message}{remaining > 0 && <span> Try again in {Math.ceil(remaining / 60)} minute{remaining > 60 ? 's' : ''}.</span>}</div>}
    <div className="auth-field"><label htmlFor="email">Work email</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={254} placeholder="you@example.com" disabled={!initialized || busy} autoCapitalize="none" spellCheck={false} /></div>
    <div className="auth-field"><label htmlFor="password">Password</label><div className="password-field"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required maxLength={128} placeholder="Enter your password" disabled={!initialized || busy} /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)} disabled={!initialized || busy}>{showPassword ? 'Hide' : 'Show'}</button></div></div>
    <Button type="submit" disabled={!initialized || busy || remaining > 0}>{busy ? 'Signing in…' : 'Sign in'}<span aria-hidden="true">→</span></Button>
    <Link className="auth-help-link" href="/access-help">Need help signing in?</Link>
    <p className="auth-internal-note">For approved internal accounts.<br />Your ideas and videos stay in your own workspace.</p>
  </form>;
}
