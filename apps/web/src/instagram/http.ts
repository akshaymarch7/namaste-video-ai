import 'server-only';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {dependencies} from '../auth/runtime';
import {isAdmitted} from '../auth/engine';
import {readBody,HttpError} from '../auth/http';
import {ProjectError} from '../projects/contracts';
import {readInstagramConfig,type InstagramConfig} from './config';
import {instagramProvider,type InstagramProvider} from './provider';
import {instagramService} from './service';
import {assertInstagramReady} from './setup';
export async function handleInstagram(request:Request,action:'read'|'connect'|'callback'|'disconnect',getDependencies=dependencies,integration?:{config:InstagramConfig|null;provider:InstagramProvider|null}){
 const requestId=`req_${randomUUID().replaceAll('-','')}`,headers:Record<string,string>={'Cache-Control':'private, no-store','X-Request-Id':requestId,'Referrer-Policy':'no-referrer'};
 try{
  const cookie=request.headers.get('cookie');if(!cookie)throw new ProjectError(401,'UNAUTHENTICATED','Sign in to connect Instagram.');
  const {db,client,auth,config}=await getDependencies(),session=await auth.api.getSession({headers:new Headers({cookie})});
  if(!session)throw new ProjectError(401,'UNAUTHENTICATED','Sign in to connect Instagram.');
  if(!await isAdmitted(db,session.user.id))throw new ProjectError(403,'ACCESS_DISABLED','Account access is disabled.');
  const url=new URL(request.url);
  if(action!=='callback'&&url.search)throw new ProjectError(422,'VALIDATION_FAILED','Query fields are not supported.');
  if((action==='connect'||action==='disconnect')&&request.headers.get('origin')!==config.origin)throw new ProjectError(403,'INVALID_ORIGIN','Invalid origin.');
  await assertInstagramReady(db);
  const settings=integration?integration.config:readInstagramConfig(),provider=integration?integration.provider:settings?instagramProvider(settings):null;
  const service=instagramService(db,client,settings,provider);
  if(action==='callback'){
   if(['code','state','error'].some(k=>url.searchParams.getAll(k).length>1))throw new ProjectError(422,'VALIDATION_FAILED','Invalid callback.');
   const location=await service.callback(session.user.id,session.session.id,url.searchParams.get('state')??'',url.searchParams.get('code'),url.searchParams.has('error'));
   return new Response(null,{status:303,headers:{...headers,Location:location}});
  }
  headers['X-Instagram-Configured']=settings?'true':'false';
  headers['X-Instagram-Provider']=settings?.provider??'instagram';
  const data=action==='read'?await service.get(session.user.id):action==='connect'?await service.connect(session.user.id,session.session.id,await readBody(request)):await service.disconnect(session.user.id,request.headers.get('idempotency-key')??'',await readBody(request));
  return Response.json({data,meta:{requestId}},{headers});
 }catch(e){
  let status=503,code='SERVICE_UNAVAILABLE',message='Could not confirm this request. Reload or recover your pending disconnect.';
  if(e instanceof ProjectError||e instanceof HttpError)({status,code,message}=e);else if(e instanceof z.ZodError){status=422;code='VALIDATION_FAILED';message='Check the connection request.';}
  if(action==='callback')return new Response(null,{status:303,headers:{...headers,Location:`/settings/instagram?outcome=${code==='UNAUTHENTICATED'?'sign_in_required':'expired'}`}});
  return Response.json({error:{code,message,requestId,retryable:status>=500},meta:{requestId}},{status,headers});
 }
}
