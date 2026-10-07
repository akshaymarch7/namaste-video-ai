import {signInLocation} from '../src/auth/navigation';

export type SessionState={visible:boolean;checking:boolean;offline:boolean};
export const initialSessionState:SessionState={visible:false,checking:true,offline:false};
export type SessionResult={status:number;userId?:string;expiresAt?:string};
export async function readSession(signal:AbortSignal):Promise<SessionResult>{
 const response=await fetch('/api/session',{cache:'no-store',credentials:'same-origin',signal});
 if(!response.ok)return {status:response.status};
 const body=await response.json();
 if(typeof body?.data?.user?.id!=='string'||!body.data.user.id||typeof body.data.expiresAt!=='string'||!Number.isFinite(Date.parse(body.data.expiresAt)))throw Error('Invalid session response');
 return {status:response.status,userId:body.data.user.id,expiresAt:body.data.expiresAt};
}

// A check can refresh an already-visible page, or guard untrusted/restored content.
// Only the latter hides content. UI state is never treated as authorization by APIs.
export function sessionController(options:{userId:string;expiresAt:string;read:(signal:AbortSignal)=>Promise<SessionResult>;onChange:(state:SessionState)=>void;conceal:()=>void;redirect:(url:string)=>void}){
 let state={...initialSessionState},generation=0,disposed=false,terminal=false;
 let pending:{controller:AbortController;promise:Promise<void>}|null=null;
 let expiryTimer:ReturnType<typeof setTimeout>|undefined,retryTimer:ReturnType<typeof setTimeout>|undefined;
 let deadline=Date.parse(options.expiresAt);
 const update=(patch:Partial<SessionState>)=>{if(!disposed){state={...state,...patch};options.onChange(state);}};
 const cancel=()=>{generation++;pending?.controller.abort();pending=null;clearTimeout(retryTimer);};
 const conceal=()=>{options.conceal();update({visible:false});};
 const leave=(url:string)=>{if(disposed||terminal)return;terminal=true;cancel();clearTimeout(expiryTimer);conceal();options.redirect(url);};
 function armExpiry(){
  clearTimeout(expiryTimer);
  const remaining=deadline-Date.now();
  if(!Number.isFinite(remaining)||remaining<=0){leave(signInLocation('expired'));return;}
  expiryTimer=setTimeout(armExpiry,Math.min(remaining,2147483647));
 }
 function check():Promise<void>{
  if(disposed||terminal)return Promise.resolve();
  if(!Number.isFinite(deadline)||deadline<=Date.now()){leave(signInLocation('expired'));return Promise.resolve();}
  if(pending)return pending.promise;
  clearTimeout(retryTimer);
  const current=++generation,controller=new AbortController();
  update({checking:true});
  let timeout:ReturnType<typeof setTimeout>;
  const timedOut=new Promise<never>((_,reject)=>{timeout=setTimeout(()=>{controller.abort();reject(Error('Session check timed out'));},10000);});
  const task=Promise.race([Promise.resolve().then(()=>options.read(controller.signal)),timedOut]).then(result=>{
   if(disposed||terminal||current!==generation)return;
   if(result.status===401){leave(signInLocation('expired'));return;}
   if(result.status===403){leave('/access-help?state=disabled');return;}
   if(result.status!==200||!result.userId||!result.expiresAt||!Number.isFinite(Date.parse(result.expiresAt)))throw Error('Session unavailable');
   if(result.userId!==options.userId){leave('/projects');return;}
   deadline=Date.parse(result.expiresAt);armExpiry();
   if(!terminal)update({visible:true,offline:false});
  }).catch(()=>{
   if(disposed||terminal||current!==generation)return;
   // Preserve the last confirmed page/draft during a network failure, but never reveal a guarded page.
   update({offline:true});
   retryTimer=setTimeout(()=>void check(),15000);
  }).finally(()=>{
   clearTimeout(timeout!);
   if(!disposed&&!terminal&&current===generation){pending=null;update({checking:false});}
  });
  pending={controller,promise:task};
  return task;
 }
 function guard(){cancel();conceal();update({checking:true,offline:false});return check();}
 armExpiry();
 return {check,guard,snapshot:()=>state,
  suspend(){cancel();conceal();update({checking:true,offline:false});},
  dispose(){cancel();clearTimeout(expiryTimer);disposed=true;options.conceal();},
 };
}
