import {withCloudDispatch} from '@/src/cloud/runtime';
import {handleVideos} from '@/src/videos/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){return withCloudDispatch(handleVideos(request,'regenerate',(await params).id));}

export const maxDuration=60;
