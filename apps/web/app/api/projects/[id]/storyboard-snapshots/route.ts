import {handleStoryboards} from '@/src/storyboards/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){return handleStoryboards(request,'snapshot',(await params).id);}
