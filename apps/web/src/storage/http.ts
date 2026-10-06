import 'server-only';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {dependencies} from '../auth/runtime';
import {isAdmitted} from '../auth/engine';
import {readBody,HttpError} from '../auth/http';
import {ProjectError,projectId} from '../projects/contracts';
import {assetId,accessRequest,mediaAuthRequest} from './contracts';
import {deliveryConfig} from './config';
import {storageService} from './service';
import {assertStorageReady} from './setup';
import {serviceSignature,authPath} from './wire';
export async function handleMedia(request:Request,action:'list'|'access'|'revoke'|'authorize',id='',deps=dependencies,config=deliveryConfig){
 const requestId=`req_${randomUUID().replaceAll('-','')}`,headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Request-Id':requestId};
 const reply=(data:unknown,status=200)=>Response.json(data,{status,headers});
 try{
  const url=new URL(request.url);let parsedBody:unknown;
  // Check HMAC before resolving database/auth dependencies. Never log raw bodies/tokens.
  if(action==='authorize'){
   if(url.pathname!==authPath||url.search||request.method!=='POST')throw new ProjectError(404,'NOT_FOUND','Media not found.');
   const timestamp=request.headers.get('x-media-time')??'',nonce=request.headers.get('x-media-nonce')??'',signature=request.headers.get('x-media-signature')??'';
   if(!/^\d{13}$/.test(timestamp)||Math.abs(Date.now()-Number(timestamp))>30000||!z.string().uuid().safeParse(nonce).success||! /^[a-f0-9]{64}$/.test(signature))throw new ProjectError(404,'NOT_FOUND','Media not found.');
   const reader=request.body?.getReader();let length=0;const chunks:Uint8Array[]=[];if(reader){while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>4096){await reader.cancel();throw new ProjectError(404,'NOT_FOUND','Media not found.');}chunks.push(value);}}const raw=Buffer.concat(chunks).toString('utf8');
   const expected=await serviceSignature(config().secret,raw,timestamp,nonce);
   if(!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))throw new ProjectError(404,'NOT_FOUND','Media not found.');
   parsedBody=mediaAuthRequest.parse(JSON.parse(raw));
   const {db,client}=await deps();await assertStorageReady(db);
   try{await db.collection('mediaServiceNonces').insertOne({_id:nonce as never,expiresAt:new Date(Date.now()+60000)});}catch{throw new ProjectError(404,'NOT_FOUND','Media not found.');}
   return reply({data:await storageService(db,client).authorize(parsedBody as z.infer<typeof mediaAuthRequest>)});
  }
  const cookie=request.headers.get('cookie');if(!cookie)throw new ProjectError(401,'UNAUTHENTICATED','Sign in to continue.');
  const {db,client,auth,config:authConfig}=await deps();const session=await auth.api.getSession({headers:new Headers({cookie})});if(!session)throw new ProjectError(401,'UNAUTHENTICATED','Sign in to continue.');
  if(!await isAdmitted(db,session.user.id))throw new ProjectError(403,'ACCESS_DISABLED','Account access is disabled.');
  const parsed=(action==='list'?projectId:assetId).safeParse(id);if(!parsed.success)throw new ProjectError(404,'NOT_FOUND','Media not found.');
  const service=storageService(db,client),owner=session.user.id;
  if(action==='list'){
   if(new Set(url.searchParams.keys()).size!==url.searchParams.size)throw new ProjectError(422,'VALIDATION_FAILED','Check query parameters.');
   const query=z.object({limit:z.coerce.number().int().min(1).max(50).default(20),cursor:assetId.optional()}).strict().parse(Object.fromEntries(url.searchParams));
   return reply({...await service.list(owner,id,query.limit,query.cursor),meta:{requestId}});
  }
  if(request.headers.get('origin')!==authConfig.origin)throw new ProjectError(403,'INVALID_ORIGIN','Invalid origin.');
  if(url.search)throw new ProjectError(422,'VALIDATION_FAILED','Unsupported query parameters.');
  if(action==='revoke'){z.object({}).strict().parse(await readBody(request));await service.revoke(owner,id);return reply({data:{revoked:true},meta:{requestId}});}
  const body=accessRequest.parse(await readBody(request));return reply({data:await service.access(owner,id,body.purpose,config().origin),meta:{requestId}});
 }catch(error){
  let status=503,code='STORAGE_UNAVAILABLE',message='Private media is unavailable. Try again shortly.';
  if(error instanceof ProjectError||error instanceof HttpError)({status,code,message}=error);else if(error instanceof z.ZodError){status=422;code='VALIDATION_FAILED';message='Check request fields.';}
  if(action==='authorize')return reply({error:{code:status===503?'SERVICE_UNAVAILABLE':'NOT_FOUND'}},status===503?503:404);
  return reply({error:{code,message,requestId,retryable:status===503},meta:{requestId}},status);
 }
}
