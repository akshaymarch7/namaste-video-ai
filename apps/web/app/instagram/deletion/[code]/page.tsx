import {getDatabase} from '@/src/db/client';
import {deletionStatus} from '@/src/instagram/deletion';
import {DeletionStatus} from '@/components/instagram/deletion-status';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const metadata={title:'Instagram data request',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function Page({params}:{params:Promise<{code:string}>}){
 const {code}=await params;
 if(!/^[a-f0-9]{64}$/.test(code))return <DeletionStatus state="not_found"/>;
 try{const {db}=await getDatabase();const status=await deletionStatus(db,code);return <DeletionStatus state={status?.state??'not_found'} updatedAt={status?.updatedAt}/>;}
 catch{return <DeletionStatus state="unavailable"/>;}
}
