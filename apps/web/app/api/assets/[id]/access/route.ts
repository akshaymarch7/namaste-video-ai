import {handleMedia} from '@/src/storage/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){return handleMedia(request,'access',(await params).id);}
