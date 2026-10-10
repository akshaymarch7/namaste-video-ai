import {getDatabase} from '@/src/db/client';
import {readInstagramConfig} from '@/src/instagram/config';
import {handleSignedLifecycle} from '@/src/instagram/lifecycle';
import {deletionEnabled,requestInstagramDeletion} from '@/src/instagram/deletion';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request){const config=readInstagramConfig();return handleSignedLifecycle(request,config,async event=>{const {db,client}=await getDatabase();return requestInstagramDeletion(db,client,config!,event);},deletionEnabled());}
