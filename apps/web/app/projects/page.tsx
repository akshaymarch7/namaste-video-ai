import { Brand } from '@/components/ui';
import { PrivateSession, SignOutButton } from '@/components/private-session';
import { requirePageUser } from '@/src/auth/page-guard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your workspace' };
export default async function Projects() {
  const session = await requirePageUser();
  return <PrivateSession expiresAt={session.expiresAt} userId={session.user.id}><header className="auth-header"><Brand /><SignOutButton /></header><main id="main" className="workspace-entry container"><p className="eyebrow">Your personal workspace</p><h1>Welcome, {session.user.name}.</h1><p className="workspace-identity">Signed in as {session.user.email}</p><section className="workspace-welcome"><span className="workspace-play" aria-hidden="true">▶</span><h2>A space for your next idea.</h2><p>Your workspace is ready. Video creation will be available here soon.</p></section></main></PrivateSession>;
}
