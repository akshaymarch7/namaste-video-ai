import {handleProjects} from '@/src/projects/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const POST=async(request:Request,context:{params:Promise<{id:string}>})=>handleProjects(request,'draft-apply',(await context.params).id);
