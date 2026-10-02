import {notFound} from 'next/navigation';
import {PrivateSession} from '@/components/private-session';
import {StoryboardReview} from '@/components/storyboard/storyboard-review';
import {requirePageUser} from '@/src/auth/page-guard';
import {projectId} from '@/src/projects/contracts';
export const dynamic='force-dynamic';
export const metadata={title:'Your storyboard'};
export default async function StoryboardPage({params}:{params:Promise<{id:string}>}){
 const session=await requirePageUser();const {id}=await params;if(!projectId.safeParse(id).success)notFound();
 return <PrivateSession expiresAt={session.expiresAt} userId={session.user.id}><StoryboardReview projectId={id} userId={session.user.id} name={session.user.name}/></PrivateSession>;
}
