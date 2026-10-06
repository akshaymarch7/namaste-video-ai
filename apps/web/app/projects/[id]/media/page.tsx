import {notFound} from 'next/navigation';
import {PrivateSession} from '@/components/private-session';
import {MediaLibrary} from '@/components/media/media-library';
import {requirePageUser} from '@/src/auth/page-guard';
import {projectId} from '@/src/projects/contracts';
export const dynamic='force-dynamic';
export const metadata={title:'Private media'};
export default async function MediaPage({params}:{params:Promise<{id:string}>}){
 const session=await requirePageUser();const {id}=await params;if(!projectId.safeParse(id).success)notFound();
 return <PrivateSession expiresAt={session.expiresAt} userId={session.user.id}><MediaLibrary key={`${session.user.id}:${id}`} projectId={id}/></PrivateSession>;
}
