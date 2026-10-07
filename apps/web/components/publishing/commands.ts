import {z} from 'zod';
import {intentView,publishInput,actionInput,type PublishIntent} from '../../src/publishing/contracts';
const receipt=z.discriminatedUnion('action',[z.object({key:z.string().uuid(),action:z.literal('create'),body:publishInput}),z.object({key:z.string().uuid(),action:z.enum(['cancel','retry']),id:z.string(),body:actionInput})]);
export type Receipt=z.infer<typeof receipt>;
export type StorageLike=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export function publicationStore(storage:StorageLike,owner:string,project:string){const key=`namaste:publish:${owner}:${project}`;return {read(){const raw=storage.getItem(key);return raw?receipt.parse(JSON.parse(raw)):null;},write(value:Receipt){storage.setItem(key,JSON.stringify(value));},clear(keyValue:string){const raw=storage.getItem(key);if(raw&&receipt.parse(JSON.parse(raw)).key===keyValue)storage.removeItem(key);}};}
export async function sendPublication(command:Receipt,call:typeof fetch=fetch):Promise<PublishIntent>{
 const response=await call(command.action==='create'?'/api/publish-intents':`/api/publish-intents/${command.id}/${command.action}`,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','Idempotency-Key':command.key},body:JSON.stringify(command.body),signal:AbortSignal.timeout(15000)});
 let body:any;try{body=await response.json();}catch{throw {code:'UNCONFIRMED',definite:false};}
 if(!response.ok)throw {code:body.error?.code??'UNCONFIRMED',definite:response.status>=400&&response.status<500&&response.status!==429||body.error?.code==='PUBLISHING_DISABLED'};
 const result=intentView.parse(body.data);
 if(command.action==='create'){const b=command.body;if(result.projectId!==b.projectId||result.videoId!==b.payload.videoId||result.assetHash!==b.payload.expectedOutputHash||result.caption!==b.payload.caption||result.destination.connectionId!==b.payload.destination.connectionId||result.destination.instagramUserId!==b.payload.destination.instagramUserId)throw {code:'UNCONFIRMED',definite:false};}
 else if(result.id!==command.id)throw {code:'UNCONFIRMED',definite:false};
 return result;
}
export async function recoverPublication(store:ReturnType<typeof publicationStore>,command:Receipt,send=sendPublication){
 try{const result=await send(command);store.clear(command.key);return result;}catch(e){if((e as {definite?:boolean}).definite)store.clear(command.key);throw e;}
}
