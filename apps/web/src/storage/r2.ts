import 'server-only';
import {createHash} from 'node:crypto';
import {S3Client,PutObjectCommand,GetObjectCommand} from '@aws-sdk/client-s3';
import {r2Config} from './config';
import {MAX_ASSET_BYTES} from './contracts';
import {ProjectError} from '../projects/contracts';
export type ObjectStore={put(key:string,body:Uint8Array,type:string,hash:string):Promise<void>;verify(key:string,bytes:number,hash:string,type:string):Promise<void>};
export type ReadableObjectStore=ObjectStore&{read(key:string,bytes:number,hash:string,type:string):Promise<Uint8Array>};
export function r2Store(config=r2Config(),client=new S3Client({region:'auto',endpoint:config.endpoint,credentials:{accessKeyId:config.accessKeyId,secretAccessKey:config.secretAccessKey},requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED',maxAttempts:1})):ReadableObjectStore{
 return {
  async put(key,body,type,hash){
   try{await client.send(new PutObjectCommand({Bucket:config.bucket,Key:key,Body:body,ContentType:type,ContentLength:body.byteLength,Metadata:{sha256:hash},IfNoneMatch:'*'}),{abortSignal:AbortSignal.timeout(60000)});}catch(error){if((error as {$metadata?:{httpStatusCode:number}}).$metadata?.httpStatusCode===412)return;throw new ProjectError(503,'STORAGE_UNAVAILABLE','Upload could not be confirmed. Recover the same asset.');}
  },
  async verify(key,bytes,hash,type){
   try{
    const object=await client.send(new GetObjectCommand({Bucket:config.bucket,Key:key}),{abortSignal:AbortSignal.timeout(60000)});
    if(!object.Body)throw Error();
    let length=0;const digest=createHash('sha256');
    try{for await(const chunk of object.Body as AsyncIterable<Uint8Array>){length+=chunk.byteLength;if(length>MAX_ASSET_BYTES||length>bytes)throw Error();digest.update(chunk);}}finally{(object.Body as {destroy?:()=>void}).destroy?.();}
    if(length!==bytes||object.ContentLength!==bytes||object.ContentType!==type||object.Metadata?.sha256!==hash||digest.digest('hex')!==hash)throw Error();
   }catch{throw new ProjectError(503,'ASSET_INTEGRITY_FAILED','Stored media could not be verified. Recover the same asset.');}
  },
  async read(key,bytes,hash,type){
   try{
    if(!Number.isInteger(bytes)||bytes<1||bytes>MAX_ASSET_BYTES)throw Error();
    const object=await client.send(new GetObjectCommand({Bucket:config.bucket,Key:key}),{abortSignal:AbortSignal.timeout(60000)});
    if(!object.Body||object.ContentLength!==bytes||object.ContentType!==type||object.Metadata?.sha256!==hash){(object.Body as {destroy?:()=>void}|undefined)?.destroy?.();throw Error();}
    const chunks:Uint8Array[]=[];let length=0;const digest=createHash('sha256');
    try{for await(const chunk of object.Body as AsyncIterable<Uint8Array>){length+=chunk.length;if(length>bytes)throw Error();chunks.push(chunk);digest.update(chunk);}}finally{(object.Body as {destroy?:()=>void}).destroy?.();}
    if(length!==bytes||digest.digest('hex')!==hash)throw Error();return Buffer.concat(chunks);
   }catch{throw new ProjectError(503,'ASSET_INTEGRITY_FAILED','Stored media could not be recovered.');}
  },
 };
}
