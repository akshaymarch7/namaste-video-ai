import {notFound} from 'next/navigation';
import {PrivateSession} from '@/components/private-session';
import {PublishPanel} from '@/components/publishing/panel';
import {requirePageUser} from '@/src/auth/page-guard';
import {projectId} from '@/src/projects/contracts';
import {videoId} from '@/src/videos/contracts';
export const dynamic='force-dynamic';
export const metadata={title:'Publish your video'};
export default async function PublishPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{video?:string}>}){
 const session=await requirePageUser(),{id}=await params,{video}=await searchParams;if(!projectId.safeParse(id).success||!videoId.safeParse(video).success)notFound();
 return <PrivateSession expiresAt={session.expiresAt} userId={session.user.id}><PublishPanel key={`${session.user.id}:${id}:${video}`} projectId={id} videoId={video!} userId={session.user.id}/></PrivateSession>;
}
