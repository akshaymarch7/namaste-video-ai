import {patchPreferences,preferenceView,type Preferences,type PreferencePatch} from '../../src/preferences/contracts';
export type PreferenceState={current:Preferences|null;draft:{timezone:string;defaultVoicePreset:string}|null;pending:PreferencePatch|null;busy:boolean;ready:boolean;error:string;saved:boolean};
export function preferenceStore(storage:Storage,owner:string){const key=`nv:preferences:${encodeURIComponent(owner)}`;return {
 read(){const raw=storage.getItem(key);return raw?patchPreferences.parse(JSON.parse(raw)):null;},
 write(body:PreferencePatch){storage.setItem(key,JSON.stringify(patchPreferences.parse(body)));},
 clear(body:PreferencePatch){const raw=storage.getItem(key);if(raw&&JSON.stringify(patchPreferences.parse(JSON.parse(raw)))!==JSON.stringify(body))throw Error();storage.removeItem(key);},
};}
export function preferenceController(store:ReturnType<typeof preferenceStore>,transport:{get():Promise<unknown>;save(body:PreferencePatch):Promise<unknown>},publish:(state:PreferenceState)=>void){
 // Keep conflict context independently of transient GET/storage errors until an explicit choice.
 let conflictUnresolved=false;
 let disposed=false,state:PreferenceState={current:null,draft:null,pending:null,busy:false,ready:false,error:'',saved:false};
 const emit=(patch:Partial<PreferenceState>)=>{if(!disposed){state={...state,...patch};publish(state);}};
 const fields=(p:Preferences)=>({timezone:p.timezone,defaultVoicePreset:p.defaultVoicePreset});
 async function dispatch(body:PreferencePatch){emit({busy:true,error:'',saved:false});try{
  const next=preferenceView.parse(await transport.save(body));
  if(next.revision!==body.expectedRevision+1||(body.timezone!==undefined&&next.timezone!==body.timezone)||(body.defaultVoicePreset!==undefined&&next.defaultVoicePreset!==body.defaultVoicePreset))throw {code:'UNCONFIRMED'};
  if(disposed)return;store.clear(body);conflictUnresolved=false;emit({current:next,draft:fields(next),pending:null,saved:true});
 }catch(e){if(disposed)return;const code=(e as {code?:string}).code??'UNCONFIRMED';
  if(['REVISION_CONFLICT','INVALID_TIMEZONE','VOICE_UNAVAILABLE','VALIDATION_FAILED','INVALID_ORIGIN'].includes(code)){
   try{store.clear(body);emit({pending:null});}catch{emit({error:'RECOVERY_STORAGE'});return;}
   if(code==='REVISION_CONFLICT'){conflictUnresolved=true;try{emit({current:preferenceView.parse(await transport.get())});}catch{emit({current:null});}}
  }
  emit({error:code});
 }finally{emit({busy:false});}}
 return {snapshot:()=>state,dispose(){disposed=true;},
  async load(){if(disposed||state.busy)return;emit({busy:true,error:'',saved:false});try{
   let pending:PreferencePatch|null;try{pending=store.read();}catch{emit({ready:false,error:'RECOVERY_STORAGE'});return;}
   emit({pending,ready:true});const current=preferenceView.parse(await transport.get());emit({current,error:conflictUnresolved?'REVISION_CONFLICT':'',draft:conflictUnresolved&&state.draft?state.draft:{...fields(current),...(pending?.timezone!==undefined?{timezone:pending.timezone}:{}),...(pending?.defaultVoicePreset!==undefined?{defaultVoicePreset:pending.defaultVoicePreset}:{})}});
  }catch(e){emit({error:(e as {code?:string}).code??'UNCONFIRMED'});}finally{emit({busy:false});}},
  edit(field:'timezone'|'defaultVoicePreset',value:string){if(!state.busy&&!state.pending&&state.draft)emit({draft:{...state.draft,[field]:value},saved:false});},
  useSaved(){if(state.current&&!state.busy&&!state.pending){conflictUnresolved=false;emit({draft:fields(state.current),error:'',saved:false});}},
  async save(){if(disposed||state.busy||!state.ready||state.pending||!state.current||!state.draft)return;
   const parsed=patchPreferences.safeParse({expectedRevision:state.current.revision,...state.draft});if(!parsed.success){emit({error:'VALIDATION_FAILED'});return;}
   try{store.write(parsed.data);}catch{emit({error:'RECOVERY_STORAGE'});return;}emit({pending:parsed.data});await dispatch(parsed.data);
  },async recover(){if(!disposed&&!state.busy&&state.pending)await dispatch(state.pending);},
 };
}
async function request(body?:PreferencePatch){const r=await fetch('/api/preferences',{method:body?'PATCH':'GET',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000),...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const payload=await r.json();if(!r.ok)throw {code:payload.error?.code??'UNCONFIRMED'};return payload.data;}
export const preferenceTransport={get:()=>request(),save:(body:PreferencePatch)=>request(body)};
