import {handleMedia} from '@/src/storage/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){return handleMedia(request,'list',(await params).id);}
