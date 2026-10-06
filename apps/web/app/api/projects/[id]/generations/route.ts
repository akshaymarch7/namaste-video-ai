import {handleJobs} from '@/src/jobs/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){return handleJobs(request,'create',(await params).id);}
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){return handleJobs(request,'latest',(await params).id);}
