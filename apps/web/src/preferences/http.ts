import 'server-only';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {dependencies} from '../auth/runtime';
import {isAdmitted} from '../auth/engine';
import {HttpError,readBody} from '../auth/http';
import {ProjectError} from '../projects/contracts';
import {assertProjectsReady} from '../projects/setup';
import {preferenceService} from './service';
export async function handlePreferences(request:Request,getDependencies=dependencies){
 const requestId=`req_${randomUUID().replaceAll('-','')}`,headers={'Cache-Control':'private, no-store','X-Request-Id':requestId};
 try{
  const cookie=request.headers.get('cookie');if(!cookie)throw new ProjectError(401,'UNAUTHENTICATED','Sign in to continue.');
  const {db,auth,config}=await getDependencies(),session=await auth.api.getSession({headers:new Headers({cookie})});
  if(!session)throw new ProjectError(401,'UNAUTHENTICATED','Sign in to continue.');
  if(!await isAdmitted(db,session.user.id))throw new ProjectError(403,'ACCESS_DISABLED','Account access is disabled.');
  if(new URL(request.url).search)throw new ProjectError(422,'VALIDATION_FAILED','Query fields are not supported.');
  if(request.method!=='GET'&&request.headers.get('origin')!==config.origin)throw new ProjectError(403,'INVALID_ORIGIN','Invalid origin.');
  await assertProjectsReady(db);
  const index=(await db.collection('preferences').indexes()).find(i=>i.name==='preference_owner');if(!index?.unique||JSON.stringify(index.key)!==JSON.stringify({ownerId:1}))throw Error('PREFERENCE_SETUP_REQUIRED');
  const service=preferenceService(db),data=request.method==='GET'?await service.get(session.user.id):await service.save(session.user.id,await readBody(request));
  return Response.json({data,meta:{requestId}},{headers});
 }catch(e){let status=503,code='SERVICE_UNAVAILABLE',message='Could not confirm this request. Recover your pending save.';
  if(e instanceof ProjectError||e instanceof HttpError)({status,code,message}=e);else if(e instanceof z.ZodError){status=422;code='VALIDATION_FAILED';message='Check the preference fields.';}
  return Response.json({error:{code,message,requestId,retryable:status===503},meta:{requestId}},{status,headers});
 }
}
