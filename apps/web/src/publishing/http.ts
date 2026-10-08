import 'server-only';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {dependencies} from '../auth/runtime';
import {isAdmitted} from '../auth/engine';
import {HttpError,readBody} from '../auth/http';
import {projectId,ProjectError} from '../projects/contracts';
import {readInstagramConfig} from '../instagram/config';
import {intentId,query} from './contracts';
import {publishingService,publishingEnabled} from './service';
export async function handlePublishing(request:Request,action:'create'|'list'|'read'|'cancel'|'retry'|'replace',id='',deps=dependencies,options?:{config:ReturnType<typeof readInstagramConfig>;enabled:boolean;kick?:(owner:string)=>void}){
 const requestId=`req_${randomUUID().replaceAll('-','')}`,headers=new Headers({'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Request-Id':requestId});
 try{
  const cookie=request.headers.get('cookie');if(!cookie)throw new ProjectError(401,'UNAUTHENTICATED','Sign in to continue.');
  const {db,client,auth,config}=await deps(),session=await auth.api.getSession({headers:new Headers({cookie})});if(!session)throw new ProjectError(401,'UNAUTHENTICATED','Sign in to continue.');
  if(!await isAdmitted(db,session.user.id))throw new ProjectError(403,'ACCESS_DISABLED','Account access is disabled.');
  if(action!=='create'&&!(action==='list'?projectId:intentId).safeParse(id).success)throw new ProjectError(404,'NOT_FOUND','Publication not found.');
  const url=new URL(request.url),service=publishingService(db,client,options?options.config:readInstagramConfig(),options?options.enabled:publishingEnabled()),owner=session.user.id;
  let body:unknown,status=200;
  if(action==='list'){if(new Set(url.searchParams.keys()).size!==url.searchParams.size)throw new ProjectError(422,'VALIDATION_FAILED','Duplicate query fields.');const q=query.parse(Object.fromEntries(url.searchParams));body=await service.list(owner,id,q.limit,q.cursor);}
  else{
   if(url.search)throw new ProjectError(422,'VALIDATION_FAILED','Unsupported query fields.');
   if(action==='read')body={data:await service.get(owner,id)};
   else{
    if(request.headers.get('origin')!==config.origin)throw new ProjectError(403,'INVALID_ORIGIN','Invalid origin.');
    const raw=await readBody(request),key=request.headers.get('idempotency-key')??'';
    const result=action==='create'?await service.create(owner,key,raw):action==='replace'?await service.replace(owner,id,key,raw):await service.action(owner,id,key,action,raw);
    if(result.replayed)headers.set('Idempotency-Replayed','true');status=action==='create'?201:200;headers.set('Location',`/api/publish-intents/${result.data.id}`);body={data:result.data};
   }
  }
  options?.kick?.(owner);return Response.json({...body as object,meta:{requestId}},{status,headers});
 }catch(e){let status=503,code='SERVICE_UNAVAILABLE',message='The result is unconfirmed. Recover the same request.';if(e instanceof ProjectError||e instanceof HttpError)({status,code,message}=e);else if(e instanceof z.ZodError){status=422;code='VALIDATION_FAILED';message='Check the caption and request fields.';}return Response.json({error:{code,message,requestId,retryable:false},meta:{requestId}},{status,headers});}
}
export async function handlePublishTick(request:Request,run:()=>Promise<unknown>,env:Record<string,string|undefined>=process.env){
 const headers={'Cache-Control':'private, no-store'};if(!publishingEnabled(env))return new Response(null,{status:503,headers});
 const key=env.INSTAGRAM_PUBLISH_SCHEDULER_SECRET??'',expected=Buffer.from(`Bearer ${key}`),actual=Buffer.from(request.headers.get('authorization')??'');
 if(key.length<32||actual.length!==expected.length||!timingSafeEqual(actual,expected))return new Response(null,{status:401,headers});
 if(request.method!=='POST'||new URL(request.url).search)return new Response(null,{status:400,headers});
 // Bound streamed body reads as well as rejecting unexpected payloads.
 const reader=request.body?.getReader();let timer:ReturnType<typeof setTimeout>|undefined;
 try{if(reader){const empty=await Promise.race([(async()=>{for(;;){const part=await reader.read();if(part.done)return true;if(part.value.length)return false;}})(),new Promise<boolean>(resolve=>{timer=setTimeout(()=>resolve(false),1000);})]);if(!empty)return new Response(null,{status:400,headers});}return Response.json({data:await run()},{headers});}
 catch{return Response.json({error:{code:'PUBLISH_TICK_UNAVAILABLE'}},{status:503,headers});}
 finally{clearTimeout(timer);void reader?.cancel().catch(()=>undefined);}
}
