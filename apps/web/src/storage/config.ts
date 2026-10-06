import 'server-only';
import {ProjectError} from '../projects/contracts';
function missing(){return new ProjectError(503,'STORAGE_NOT_CONFIGURED','Private media storage needs server configuration.');}
export function privateOrigin(raw:string|undefined){
 try{const url=new URL(raw!);if(url.origin!==raw||url.username||url.password||!(url.protocol==='https:'||(process.env.NODE_ENV!=='production'&&url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname))))throw Error();return url.origin;}catch{throw missing();}
}
export function deliveryConfig(env:Record<string,string|undefined>=process.env){
 const origin=privateOrigin(env.MEDIA_GATEWAY_ORIGIN),secret=env.MEDIA_SERVICE_SECRET??'';
 if(secret.length<32)throw missing();return {origin,secret};
}
export function r2Config(env:Record<string,string|undefined>=process.env){
 const {R2_ACCOUNT_ID:account,R2_BUCKET:bucket,R2_ACCESS_KEY_ID:accessKeyId,R2_SECRET_ACCESS_KEY:secretAccessKey}=env;
 if(!account||!/^[a-f0-9]{32}$/.test(account)||!bucket||!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)||!accessKeyId||!secretAccessKey)throw missing();
 return {bucket,endpoint:`https://${account}.r2.cloudflarestorage.com`,accessKeyId,secretAccessKey};
}
