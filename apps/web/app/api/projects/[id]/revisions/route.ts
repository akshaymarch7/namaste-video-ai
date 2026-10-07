import {withCloudDispatch} from '@/src/cloud/runtime';
import {handleStoryboards} from '@/src/storyboards/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){return withCloudDispatch(handleStoryboards(request,'revise',(await params).id));}

export const maxDuration=60;
