import 'server-only';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {dependencies} from '../auth/runtime';
import {isAdmitted} from '../auth/engine';
import {HttpError,readBody} from '../auth/http';
import {ProjectError,projectId,idempotencyKey} from '../projects/contracts';
import {videoId,listQuery} from './contracts';
import {videoService} from './service';
export async function handleVideos(request:Request,action:'list'|'read'|'approve'|'select',id:string,deps=dependencies){
 const requestId=`req_${randomUUID().replaceAll('-','')}`,headers=new Headers({'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Request-Id':requestId});
 const reply=(body:unknown)=>Response.json({...body as object,meta:{requestId}},{headers});
 try{
  const cookie=request.headers.get('cookie');if(!cookie)throw new ProjectError(401,'UNAUTHENTICATED','Sign in to continue.');
  const {db,client,auth,config}=await deps();const session=await auth.api.getSession({headers:new Headers({cookie})});if(!session)throw new ProjectError(401,'UNAUTHENTICATED','Sign in to continue.');
  if(!await isAdmitted(db,session.user.id))throw new ProjectError(403,'ACCESS_DISABLED','Account access is disabled.');
  if(!(action==='list'?projectId:videoId).safeParse(id).success)throw new ProjectError(404,'NOT_FOUND','Video not found.');
  const url=new URL(request.url),service=videoService(db,client),owner=session.user.id;
  if(action==='list'){
   if(new Set(url.searchParams.keys()).size!==url.searchParams.size)throw new ProjectError(422,'VALIDATION_FAILED','Duplicate query fields.');
   const q=listQuery.parse(Object.fromEntries(url.searchParams));return reply(await service.list(owner,id,q.limit,q.cursor));
  }
  if(url.search)throw new ProjectError(422,'VALIDATION_FAILED','Unsupported query fields.');
  if(action==='read')return reply({data:await service.get(owner,id)});
  if(request.headers.get('origin')!==config.origin)throw new ProjectError(403,'INVALID_ORIGIN','Invalid origin.');
  const key=idempotencyKey.parse(request.headers.get('idempotency-key'));
  const result=await service.mutate(owner,id,action,key,await readBody(request));if(result.replayed)headers.set('Idempotency-Replayed','true');return reply({data:result.data});
 }catch(e){let status=503,code='SERVICE_UNAVAILABLE',message='The result is unconfirmed. Recover the same request.';if(e instanceof ProjectError||e instanceof HttpError)({status,code,message}=e);else if(e instanceof z.ZodError){status=422;code='VALIDATION_FAILED';message='Check the request fields.';}return Response.json({error:{code,message,requestId,retryable:false},meta:{requestId}},{status,headers});}
}
