import 'server-only';
import {AsyncLocalStorage} from 'node:async_hooks';

type Stage = 'dependencies' | 'session' | 'admission' | 'transaction' | 'readiness';
type Group = 'session' | 'projects' | 'videos' | 'publishing' | 'jobs' | 'media';
type Sample = {event:'dashboard_request';group:Group;status:number;requestId:string|null;durationMs:number;stages:Partial<Record<Stage,number>>};
const context = new AsyncLocalStorage<Partial<Record<Stage,number>>>();
const milliseconds = (start:number) => Math.max(0, Math.round((performance.now()-start)*10)/10);

// Stage names are fixed; never accept URLs, bodies, identities, tokens or raw errors.
export async function measureStage<T>(stage:Stage, run:()=>Promise<T>):Promise<T> {
  const stages=context.getStore();
  if(!stages)return run();
  const start=performance.now();
  try{return await run();}finally{stages[stage]=(stages[stage]??0)+milliseconds(start);}
}

export function observeHandler<A extends unknown[]>(group:Group, handler:(...args:A)=>Promise<Response>, report:(sample:Sample)=>void=sample=>console.info(JSON.stringify(sample))):(...args:A)=>Promise<Response> {
  return (...args)=>context.run({},async()=>{
    const start=performance.now();let response:Response|undefined;
    try {
      response=await handler(...args);
      const stages=context.getStore()!;
      response.headers.set('Server-Timing',[`app;dur=${milliseconds(start)}`,...Object.entries(stages).map(([key,value])=>`${key};dur=${value!.toFixed(1)}`)].join(', '));
      return response;
    } finally {
      const durationMs=milliseconds(start),status=response?.status??500;
      // Retain slow/failing observations only. Logger failures cannot change an outcome.
      if(durationMs>=5000||status>=500){
        const id=response?.headers.get('x-request-id');
        try{report({event:'dashboard_request',group,status,requestId:id&&/^req_[a-f0-9]{32}$/.test(id)?id:null,durationMs,stages:{...context.getStore()}});}catch{}
      }
    }
  });
}
