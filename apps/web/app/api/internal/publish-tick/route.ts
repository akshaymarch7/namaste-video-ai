import {handlePublishTick} from '@/src/publishing/http';
import {publishingTick} from '@/src/publishing/runtime';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request){return handlePublishTick(request,()=>publishingTick());}
