import {z} from 'zod';
import {generationRequest,cancelRequest,jobView,jobId} from './contracts';
import {projectId,idempotencyKey} from '../projects/contracts';
export function jobPaths(){
 const schema=(value:z.ZodType)=>z.toJSONSchema(value),content=(value:unknown)=>({'application/json':{schema:value}});
 const parameters=(id:z.ZodType)=>[{in:'path',name:'id',required:true,schema:schema(id)}];
 const mutation=[{in:'header',name:'Origin',required:true,schema:{type:'string'}},{in:'header',name:'Idempotency-Key',required:true,schema:schema(idempotencyKey)}];
 const errors=Object.fromEntries([401,403,404,409,413,415,422,503].map(s=>[s,{$ref:'#/components/responses/Error'}]));
 const response=(nullable=false)=>({description:'Private owner-scoped generation state. Local worker renders approved input and atomically publishes private assets.',content:content({type:'object',required:['data','meta'],properties:{data:nullable?{anyOf:[schema(jobView),{type:'null'}]}:schema(jobView),meta:{type:'object',properties:{requestId:{type:'string'}}}}})});
 return {
 '/api/projects/{id}/generations':{parameters:parameters(projectId),get:{operationId:'latestGenerationJob',responses:{...errors,200:response(true)}},post:{operationId:'createGenerationJob',description:'Freezes an already-approved storyboard plus the fixed Daniel/model/render configuration and queues the local generation worker. Existing speech attempts require acknowledgePossibleRepeat=true for a fresh generation. Speech ambiguity is not automatically retried. Hosted execution remains deferred. Same-key replay returns the recorded acceptance; GET gives current progress.',parameters:mutation,requestBody:{required:true,content:content(schema(generationRequest))},responses:{...errors,202:response()}}},
 '/api/jobs/{id}':{parameters:parameters(jobId),get:{operationId:'getGenerationJob',responses:{...errors,200:response()}}},
 '/api/jobs/{id}/cancel':{parameters:parameters(jobId),post:{operationId:'cancelGenerationJob',parameters:mutation,requestBody:{required:true,content:content(schema(cancelRequest))},responses:{...errors,200:response()}}},
 };
}
