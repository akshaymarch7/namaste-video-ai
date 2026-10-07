import {PrivateSession} from '@/components/private-session';
import {InstagramConnection} from '@/components/instagram/connection';
import {requirePageUser} from '@/src/auth/page-guard';
import {projectId} from '@/src/projects/contracts';
export const dynamic='force-dynamic';
export const metadata={title:'Instagram connection',referrer:'no-referrer' as const};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const session=await requirePageUser(),query=await searchParams,project=projectId.safeParse(query.project);return <PrivateSession expiresAt={session.expiresAt} userId={session.user.id}><InstagramConnection userId={session.user.id} name={session.user.name} outcome={typeof query.outcome==='string'?query.outcome:undefined} project={project.success?project.data:undefined}/></PrivateSession>;}
