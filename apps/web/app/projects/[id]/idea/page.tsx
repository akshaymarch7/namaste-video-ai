import { notFound } from 'next/navigation';
import { PrivateSession } from '@/components/private-session';
import { IdeaEditor } from '@/components/idea/idea-editor';
import { requirePageUser } from '@/src/auth/page-guard';
import { projectId } from '@/src/projects/contracts';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your idea' };
export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePageUser();
  const { id } = await params;
  if (!projectId.safeParse(id).success) notFound();
  return <PrivateSession expiresAt={session.expiresAt} userId={session.user.id}><IdeaEditor projectId={id} name={session.user.name} /></PrivateSession>;
}
