import 'server-only';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {dependencies} from '../auth/runtime';
import {isAdmitted} from '../auth/engine';
import {HttpError,readBody} from '../auth/http';
import {ProjectError,projectId,idempotencyKey} from '../projects/contracts';
import {jobId,generationRequest,cancelRequest} from './contracts';
import {generationService} from './service';
export async function handleJobs(request:Request,action:'create'|'latest'|'read'|'cancel',id:string,deps=dependencies){
 const requestId=`req_${randomUUID().replaceAll('-','')}`,headers=new Headers({'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Request-Id':requestId});
 const reply=(data:unknown,status=200)=>Response.json({data,meta:{requestId}},{status,headers});
 try{
  const cookie=request.headers.get('cookie');if(!cookie)throw new ProjectError(401,'UNAUTHENTICATED','Sign in to continue.');
  const {db,client,auth,config}=await deps();const session=await auth.api.getSession({headers:new Headers({cookie})});if(!session)throw new ProjectError(401,'UNAUTHENTICATED','Sign in to continue.');
  if(!await isAdmitted(db,session.user.id))throw new ProjectError(403,'ACCESS_DISABLED','Account access is disabled.');
  if(!(action==='read'||action==='cancel'?jobId:projectId).safeParse(id).success)throw new ProjectError(404,'NOT_FOUND','Resource not found.');
  if(new URL(request.url).search)throw new ProjectError(422,'VALIDATION_FAILED','Unsupported query parameters.');
  const service=generationService(db,client),owner=session.user.id;
  if(action==='read')return reply(await service.get(owner,id));
  if(action==='latest')return reply(await service.latest(owner,id));
  if(request.headers.get('origin')!==config.origin)throw new ProjectError(403,'INVALID_ORIGIN','Invalid origin.');
  const key=idempotencyKey.parse(request.headers.get('idempotency-key')),raw=await readBody(request);
  const result=action==='create'?await service.create(owner,id,key,generationRequest.parse(raw)):await service.cancel(owner,id,key,cancelRequest.parse(raw));
  if(result.replayed)headers.set('Idempotency-Replayed','true');return reply(result.data,action==='create'?202:200);
 }catch(e){let status=503,code='SERVICE_UNAVAILABLE',message='The result is unconfirmed. Recover the same request.';if(e instanceof ProjectError||e instanceof HttpError)({status,code,message}=e);else if(e instanceof z.ZodError){status=422;code='VALIDATION_FAILED';message='Check the request fields.';}return Response.json({error:{code,message,requestId,retryable:false},meta:{requestId}},{status,headers});}
}
