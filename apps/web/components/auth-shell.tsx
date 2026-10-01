import type { ReactNode } from 'react';
import { Brand } from './ui';

export function AuthShell({ children }: { children: ReactNode }) {
  return <div className="auth-shell"><header className="auth-header"><Brand /><span className="auth-access"><span aria-hidden="true" />Internal access</span></header>
    <main id="main" className="auth-main">{children}</main>
    <footer className="auth-footer"><span>One idea. One clear story.</span><span>NamasteVideo.ai</span></footer></div>;
}
export function AccessMark() {
  return <div className="access-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><rect x="7" y="13" width="18" height="14" rx="3" /><path d="M11 13V9a5 5 0 0 1 10 0v4M16 19v3" /></svg></div>;
}
