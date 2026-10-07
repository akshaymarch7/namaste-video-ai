import {notFound} from 'next/navigation';
import {PrivateSession} from '@/components/private-session';
import {VideoReview} from '@/components/video/review';
import {requirePageUser} from '@/src/auth/page-guard';
import {projectId} from '@/src/projects/contracts';
export const dynamic='force-dynamic';
export const metadata={title:'Review your video'};
export default async function VideoPage({params}:{params:Promise<{id:string}>}){
 const session=await requirePageUser();const {id}=await params;if(!projectId.safeParse(id).success)notFound();
 return <PrivateSession expiresAt={session.expiresAt} userId={session.user.id}><VideoReview key={`${session.user.id}:${id}`} projectId={id} userId={session.user.id}/></PrivateSession>;
}
