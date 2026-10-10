import {dependencies} from '@/src/auth/runtime';
import {readInstagramConfig} from '@/src/instagram/config';
import {instagramProvider} from '@/src/instagram/provider';
import {handleRefreshTick,refreshOne} from '@/src/instagram/refresh';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request){return handleRefreshTick(request,async()=>{
 const config=readInstagramConfig();if(!config)throw Error('INSTAGRAM_NOT_CONFIGURED');
 const {db,client}=await dependencies();
 return refreshOne(db,client,config,instagramProvider(config));
});}
