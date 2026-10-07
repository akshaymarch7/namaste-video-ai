import {withCloudDispatch} from '@/src/cloud/runtime';
import {handleVideos} from '@/src/videos/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){return handleVideos(request,'captions',(await params).id);}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){return withCloudDispatch(handleVideos(request,'edit-captions',(await params).id));}

export const maxDuration=60;
