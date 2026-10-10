import assert from 'node:assert/strict';
import {createServer, type ServerResponse} from 'node:http';

export type Behavior=(res:ServerResponse,call:number)=>void;
export const json=(body:unknown,status=200):Behavior=>res=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(body));};
export const sever:Behavior=res=>res.destroy();
export const partial:Behavior=res=>{res.writeHead(200,{'Content-Type':'application/json','Content-Length':'10000'});res.write('{"private":"',()=>res.destroy());};
export const stall:Behavior=res=>{res.writeHead(200,{'Content-Type':'application/json'});res.flushHeaders();};

// Only the fetch transport is redirected: these are real HTTP responses/socket
// failures consumed by the production adapters, not fabricated Response objects.
// No process environment or provider credentials are read by this suite.
export async function endpoint(work:(h:{request:typeof fetch;set:(b:Behavior)=>void;count:()=>number})=>Promise<void>){
 let behavior:Behavior=json({}),calls=0;
 const server=createServer((req,res)=>{req.resume();req.on('end',()=>behavior(res,++calls));});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();assert.ok(address&&typeof address==='object');
 const request=(async(url,options)=>{
  const target=new URL(String(url));
  assert.equal(target.protocol,'https:');
  assert.ok(['generativelanguage.googleapis.com','api.elevenlabs.io','graph.instagram.com'].includes(target.hostname));
  return fetch(`http://127.0.0.1:${address.port}${target.pathname}${target.search}`,options);
 }) as typeof fetch;
 try{await work({request,set:b=>{behavior=b;},count:()=>calls});}
 finally{server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
}
