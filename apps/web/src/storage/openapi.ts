import {z} from 'zod';
import {assetId,assetView,accessRequest,accessView} from './contracts';
import {projectId} from '../projects/contracts';
export function storagePaths(){
 const schema=(s:z.ZodType)=>z.toJSONSchema(s),content=(s:unknown)=>({'application/json':{schema:s}});
 const errors=Object.fromEntries([400,401,403,404,409,413,415,422,503].map(status=>[status,{$ref:'#/components/responses/Error'}]));
 const parameter=(s:z.ZodType)=>[{in:'path',name:'id',required:true,schema:schema(s)}];
 const response=(data:unknown,page=false)=>({description:'Owner-scoped private media response. No object keys returned.',headers:{'Cache-Control':{schema:{const:'private, no-store'}}},content:content({type:'object',required:['data','meta',...(page?['page']:[])],properties:{data,meta:{type:'object',properties:{requestId:{type:'string'}}},...(page?{page:{type:'object',properties:{hasMore:{type:'boolean'},nextCursor:{type:['string','null']}}}}:{})}})});
 const mutation=[{in:'header',name:'Origin',required:true,schema:{type:'string'}}];
 return {
  '/api/projects/{id}/assets':{parameters:parameter(projectId),get:{operationId:'listPrivateAssets',description:'Private project assets in ascending immutable ID order. Opaque cursor is the last asset ID; all queries remain scoped to the owner/project. Internal JSON artifacts are listed but cannot receive browser grants.',parameters:[{in:'query',name:'limit',schema:{type:'integer',minimum:1,maximum:50,default:20}},{in:'query',name:'cursor',schema:schema(assetId)}],responses:{...errors,200:response({type:'array',items:schema(assetView)},true)}}},
  '/api/assets/{id}/access':{parameters:parameter(assetId),post:{operationId:'createMediaAccess',description:'Create a 10-minute bearer gateway URL for preview/download. No idempotency key; repeating creates another expiring grant and never calls a provider. Alignment/timeline/QA JSON cannot be accessed. Gateway reauthorizes each GET/HEAD/Range; never persist or log the returned URL.',parameters:mutation,requestBody:{required:true,content:content(schema(accessRequest))},responses:{...errors,200:response(schema(accessView))}}},
  '/api/assets/{id}/revoke':{parameters:parameter(assetId),post:{operationId:'revokeMediaAccess',description:'Revoke existing grants for this owned asset. New grants may be issued later. Buffered or already downloaded bytes cannot be recalled.',parameters:mutation,requestBody:{required:true,content:content({type:'object',additionalProperties:false})},responses:{...errors,200:response({type:'object',properties:{revoked:{const:true}}})}}},
 };
}
