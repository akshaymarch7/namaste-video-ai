import {PrivateSession} from '@/components/private-session';
import {Settings} from '@/components/preferences/settings';
import {requirePageUser} from '@/src/auth/page-guard';
export const dynamic='force-dynamic';
export const metadata={title:'Settings'};
export default async function Page(){const session=await requirePageUser();return <PrivateSession expiresAt={session.expiresAt} userId={session.user.id}><Settings userId={session.user.id} name={session.user.name} email={session.user.email}/></PrivateSession>;}
