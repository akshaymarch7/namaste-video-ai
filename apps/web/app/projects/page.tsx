import { PrivateSession } from '@/components/private-session';
import { ProjectLibrary } from '@/components/library/project-library';
import { requirePageUser } from '@/src/auth/page-guard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My videos' };
export default async function Projects() {
  const session = await requirePageUser();
  return <PrivateSession expiresAt={session.expiresAt} userId={session.user.id}><ProjectLibrary name={session.user.name} email={session.user.email} /></PrivateSession>;
}
