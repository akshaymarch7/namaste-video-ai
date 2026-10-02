import { z } from 'zod';
import { storyboardRequest, storyboardSummary, storyboardView, storyboardReceipt, storyboardId } from './api-contracts';
import { projectId, idempotencyKey } from '../projects/contracts';
export function storyboardPaths() {
  const schema = (value: z.ZodType) => z.toJSONSchema(value);
  const content = (value: unknown) => ({'application/json':{schema:value}});
  const meta = {type:'object',required:['requestId'],properties:{requestId:{type:'string'}}};
  const page = {type:'object',required:['hasMore','nextCursor'],properties:{hasMore:{type:'boolean'},nextCursor:{type:['string','null']}}};
  const response = (data: unknown, paged=false) => ({description:paged?'Immutable candidates, newest first. Content excluded.':'Owner-scoped result. Running receipts return 202; terminal receipts return 200.',headers:{'Cache-Control':{schema:{const:'private, no-store'}},'X-Request-Id':{schema:{type:'string'}},'Idempotency-Replayed':{schema:{const:'true'},description:'Present only on a same-key POST replay.'}},content:content({type:'object',required:['data','meta',...(paged?['page']:[])],properties:{data,meta,...(paged?{page}:{})}})});
  const errors=Object.fromEntries([400,401,403,404,409,413,415,422,503].map(status=>[status,{$ref:'#/components/responses/Error'}]));
  const receipt=response(schema(storyboardReceipt)), latest=response({anyOf:[schema(storyboardReceipt),{type:'null'}]});
  const parameter=(value:z.ZodType)=>[{in:'path',name:'id',required:true,schema:schema(value)}];
  return {
    '/api/projects/{id}/storyboards':{parameters:parameter(projectId),
      post:{operationId:'generateStoryboardCandidate',description:'Enqueues a persisted MongoDB job and returns 202 before provider work. A separate worker makes up to four 30-second calls total, including targeted validation repairs and bounded transient HTTP retries. Receipt deadline is 180 seconds from enqueue; expiry becomes unknown and fences late results. Optional stage, attempt and sanitized issueCodes support polling. Same-key replay never enqueues again. Running work is never reclaimed after a worker crash. No Inngest job, automatic apply or approval.',parameters:[{in:'header',name:'Origin',required:true,schema:{type:'string'}},{in:'header',name:'Idempotency-Key',required:true,schema:schema(idempotencyKey)}],requestBody:{required:true,content:content(schema(storyboardRequest))},responses:{...errors,200:receipt,202:receipt}},
      get:{operationId:'listStoryboardCandidates',parameters:[{in:'query',name:'limit',schema:{type:'integer',minimum:1,maximum:50,default:20}},{in:'query',name:'cursor',schema:{type:'string',maxLength:2048},description:'Signed owner/project-bound tuple cursor; expires after 24 hours.'}],responses:{...errors,200:response({type:'array',items:schema(storyboardSummary)},true)}}},
    '/api/projects/{id}/storyboard-requests/latest':{parameters:parameter(projectId),get:{operationId:'getLatestStoryboardRequest',description:'Recover newest receipt, or null. To recover a particular command, replay its exact POST body and key. GET never invokes the provider.',responses:{...errors,200:latest,202:latest}}},
    '/api/storyboards/{id}':{parameters:parameter(storyboardId),get:{operationId:'getStoryboardCandidate',responses:{...errors,200:response(schema(storyboardView))}}},
  };
}
