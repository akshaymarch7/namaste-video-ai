import {handleMedia} from '@/src/storage/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){return handleMedia(request,'authorize');}
