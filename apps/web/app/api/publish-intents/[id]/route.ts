import {handlePublishing} from '@/src/publishing/http';
import {readInstagramConfig} from '@/src/instagram/config';
import {publishingEnabled} from '@/src/publishing/service';
import {kickPublishing} from '@/src/publishing/runtime';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;return handlePublishing(request,'read',id,undefined,{config:readInstagramConfig(),enabled:publishingEnabled(),kick:kickPublishing});}
