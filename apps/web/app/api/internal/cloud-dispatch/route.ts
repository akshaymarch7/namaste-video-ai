import {handleCloudDispatch} from '@/src/cloud/http';
import {cloudTick} from '@/src/cloud/runtime';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export const POST=(request:Request)=>handleCloudDispatch(request,cloudTick);
