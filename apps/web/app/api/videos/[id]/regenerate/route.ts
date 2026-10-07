import {handleVideos} from '@/src/videos/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){return handleVideos(request,'regenerate',(await params).id);}
