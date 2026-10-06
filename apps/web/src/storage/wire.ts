// Shared by the Node authorization route and the Cloudflare Worker. No secrets in bundles.
export const authPath='/api/internal/media-authorize';
const encoder=new TextEncoder();
export async function serviceSignature(secret:string,body:string,timestamp:string,nonce:string){
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(body)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(`POST\n${authPath}\n${hash}\n${timestamp}\n${nonce}`)))).map(x=>x.toString(16).padStart(2,'0')).join('');
}
