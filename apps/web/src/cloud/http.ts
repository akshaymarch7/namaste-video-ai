import 'server-only';
import {timingSafeEqual} from 'node:crypto';
import {cloudEnabled} from './config';

async function emptyBody(request:Request){
  if(!request.body)return true;
  const reader=request.body.getReader();let timer:ReturnType<typeof setTimeout>|undefined;
  try{
    return await Promise.race([
      (async()=>{for(;;){const part=await reader.read();if(part.done)return true;if(part.value.byteLength)return false;}})(),
      new Promise<false>(resolve=>{timer=setTimeout(()=>resolve(false),1000);}),
    ]);
  }catch{return false;}
  finally{clearTimeout(timer);void reader.cancel().catch(()=>undefined);}
}

export async function handleCloudDispatch(request:Request,run:()=>Promise<unknown>,env:Record<string,string|undefined>=process.env){
  const headers={'Cache-Control':'private, no-store'};
  if(!cloudEnabled(env))return new Response(null,{status:503,headers});
  const secret=env.CLOUD_RUN_SCHEDULER_SECRET??'',actual=request.headers.get('Authorization')??'';
  const expected=`Bearer ${secret}`;
  const supplied=Buffer.from(actual),wanted=Buffer.from(expected);
  if(secret.length<32||supplied.length!==wanted.length||!timingSafeEqual(supplied,wanted))return new Response(null,{status:401,headers});
  if(request.method!=='POST'||new URL(request.url).search||!await emptyBody(request))return new Response(null,{status:400,headers});
  try{return Response.json({data:await run()},{headers});}
  catch{return Response.json({error:{code:'CLOUD_DISPATCH_UNAVAILABLE'}},{status:503,headers});}
}
