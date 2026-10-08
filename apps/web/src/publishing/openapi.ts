import {z} from 'zod';
import {publishInput,replaceInput,actionInput,intentId,intentView} from './contracts';
import {projectId,idempotencyKey} from '../projects/contracts';
export function publishingPaths(){
 const schema=(v:z.ZodType)=>z.toJSONSchema(v),content=(v:unknown)=>({'application/json':{schema:v}});
 const errors=Object.fromEntries([400,401,403,404,409,413,415,422,503].map(n=>[n,{$ref:'#/components/responses/Error'}]));
 const response={description:'Owner-scoped publication snapshot; private/no-store. Same-key recovery returns current state of the same intent.',content:content({type:'object',required:['data','meta'],properties:{data:schema(intentView),meta:{type:'object',properties:{requestId:{type:'string'}}}}})};
 const path=(s:z.ZodType)=>[{in:'path',name:'id',required:true,schema:schema(s)}];
 const mutation=(operationId:string,input:z.ZodType,status=200)=>({operationId,description:'Requires exact origin, current session/admission and Idempotency-Key. Scheduling requires an explicit IANA timezone and valid UTC offset, with five minutes lead time. No arbitrary media URLs. Publication POST is never automatically repeated after an uncertain outcome.',parameters:[{in:'header',name:'Origin',required:true,schema:{type:'string'}},{in:'header',name:'Idempotency-Key',required:true,schema:schema(idempotencyKey)}],requestBody:{required:true,content:content(schema(input))},responses:{...errors,[status]:response}});
 const create=mutation('createReviewedPublication',publishInput,201);
 // Unicode code-point constraint is also enforced by the service's refinement.
 ((create.requestBody.content['application/json'].schema as any).properties.payload.properties.caption).maxLength=2200;
 return {
  '/api/publish-intents':{post:create},
  '/api/publish-intents/{id}':{parameters:path(intentId),patch:mutation('replacePublication',replaceInput),get:{operationId:'getPublication',responses:{...errors,200:response}}},
  '/api/publish-intents/{id}/cancel':{parameters:path(intentId),post:mutation('cancelPublication',actionInput)},
  '/api/publish-intents/{id}/retry':{parameters:path(intentId),post:mutation('retrySafePublication',actionInput)},
  '/api/projects/{id}/publish-intents':{parameters:path(projectId),get:{operationId:'listPublications',parameters:[{in:'query',name:'limit',schema:{type:'integer',minimum:1,maximum:50,default:20}},{in:'query',name:'cursor',schema:schema(intentId)}],responses:{...errors,200:{description:'Newest first; owner/project-bound createdAt+ID cursor. enabled reports rollout configuration.',content:content({type:'object',required:['data','page','enabled','meta'],properties:{data:{type:'array',items:schema(intentView)},page:{type:'object',properties:{hasMore:{type:'boolean'},nextCursor:{anyOf:[schema(intentId),{type:'null'}]}}},enabled:{type:'boolean'},meta:{type:'object'}}})}}}},
 };
}
