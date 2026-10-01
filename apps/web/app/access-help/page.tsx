import { AuthShell, AccessMark } from '@/components/auth-shell';
import { ActionLink } from '@/components/ui';

export const metadata = { title: 'Access and recovery' };
export default async function AccessHelp({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { state } = await searchParams;
  const unavailable = state === 'unavailable';
  return <AuthShell><section className="auth-card recovery-card"><AccessMark /><p className="eyebrow">A little help getting back</p>
    <h1>{unavailable ? 'Let’s try again shortly.' : 'Back to your ideas.'}</h1>
    <p className="auth-description">{unavailable ? 'We can’t reach the sign-in service right now. Please try again in a moment.' : 'Contact your administrator to restore access.'}</p>
    {!unavailable && <div className="recovery-instructions"><p>If you’ve forgotten your password or can’t access your account, your administrator can help.</p><ol><li>Use your usual internal communication channel.</li><li>Share the email you use to sign in.</li><li>Verify your identity with your administrator.</li></ol><p className="hint">Never share your password. Recovery doesn’t happen through an automatic email request.</p></div>}
    <ActionLink href="/sign-in">Back to sign in <span aria-hidden="true">→</span></ActionLink>
    <p className="auth-internal-note">Access is available to approved internal accounts.</p>
  </section></AuthShell>;
}
