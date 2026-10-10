import {getDatabase} from '@/src/db/client';
import {readInstagramConfig} from '@/src/instagram/config';
import {handleDeauthorization,deauthorizeInstagram} from '@/src/instagram/lifecycle';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request){
 const config=readInstagramConfig();
 return handleDeauthorization(request,config,async event=>{
  const {db,client}=await getDatabase();
  await deauthorizeInstagram(db,client,config!,event);
 });
}
