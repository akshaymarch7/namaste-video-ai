import {snapshotRequest} from './api-contracts';
import {saveStoryboardSnapshot} from './snapshot-service';
import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { dependencies } from '../auth/runtime';
import { isAdmitted } from '../auth/engine';
import { HttpError, readBody } from '../auth/http';
import { projectId, idempotencyKey, ProjectError } from '../projects/contracts';
import { geminiConfig, ProviderError } from '../ideas/providers';
import {revisionRequest} from './api-contracts';
import {assertStoryboardRevisionsReady} from './revision-setup';
import {reviseStoryboard} from './revisions';
import { storyboardId, storyboardRequest, listStoryboards } from './api-contracts';
import { assertStoryboardQueueReady } from './queue-setup';
import { storyboardService, type StoryboardProvider } from './service';
import { planStoryboard } from './planner';
export const defaultProvider = (model?:string): StoryboardProvider => {
  const config = {...geminiConfig(),...(model?{model}:{})};
  return {model:config.model,run:(input,context)=>{
    const observe=(event:import('./planner').PlanningDiagnostic)=>console.info(JSON.stringify({event:'storyboard_provider_result',requestId:context.requestId,model:config.model,...event}));
    const options={deadline:context.deadline,progress:context.progress};
    return context.revision?reviseStoryboard({idea:input,source:context.revision.source,request:context.revision.request,planStale:false},config,fetch,observe,options):planStoryboard(input,config,fetch,observe,options);
  }};
};
export async function handleStoryboards(request: Request, action: 'create'|'revise'|'snapshot'|'list'|'read'|'latest', rawId: string, deps = dependencies, provider = defaultProvider) {
  const requestId = `req_${randomUUID().replaceAll('-','')}`;
  const headers = new Headers({'Cache-Control':'private, no-store','X-Request-Id':requestId,'Referrer-Policy':'no-referrer'});
  const reply = (data: unknown, status=200, page?: unknown) => Response.json({data,...(page?{page}:{}),meta:{requestId}},{status,headers});
  try {
    const cookie = request.headers.get('cookie');
    if (!cookie) throw new ProjectError(401,'UNAUTHENTICATED','Sign in to continue.');
    const {db,client,config,auth} = await deps();
    const session = await auth.api.getSession({headers:new Headers({cookie})});
    if (!session) throw new ProjectError(401,'UNAUTHENTICATED','Sign in to continue.');
    if (!await isAdmitted(db,session.user.id)) throw new ProjectError(403,'ACCESS_DISABLED','Account access is disabled.');
    if ((action==='create'||action==='revise'||action==='snapshot') && request.headers.get('origin')!==config.origin) throw new ProjectError(403,'INVALID_ORIGIN','Invalid origin.');
    const parsed = (action==='read'?storyboardId:projectId).safeParse(rawId);
    if (!parsed.success) throw new ProjectError(404,'NOT_FOUND','Resource not found.');
    const query = new URL(request.url).searchParams;
    if ((action!=='list' && query.size) || new Set(query.keys()).size!==query.size) throw new ProjectError(422,'VALIDATION_FAILED','Unsupported query parameters.');
    await assertStoryboardQueueReady(db);
    if(action==='revise')await assertStoryboardRevisionsReady(db);
    const service = storyboardService(db,client,config.secret,provider,undefined,true), owner = session.user.id, id = parsed.data;
    if(action==='snapshot'){
      const result=await saveStoryboardSnapshot(db,client,owner,id,idempotencyKey.parse(request.headers.get('idempotency-key')),snapshotRequest.parse(await readBody(request)));
      if(result.replayed)headers.set('Idempotency-Replayed','true');return reply(result.data);
    }
    if (action==='list') { const result=await service.list(owner,id,listStoryboards.parse(Object.fromEntries(query)));return reply(result.data,200,result.page); }
    if (action==='read') return reply(await service.get(owner,id));
    if (action==='latest') { const data=await service.latest(owner,id);return reply(data,data?.state==='running'?202:200); }
    const result=await service.create(owner,id,idempotencyKey.parse(request.headers.get('idempotency-key')),(action==='revise'?revisionRequest:storyboardRequest).parse(await readBody(request)));
    if(result.replayed)headers.set('Idempotency-Replayed','true');
    return reply(result.data,result.data.state==='running'?202:200);
  } catch(error) {
    let status=503,code='SERVICE_UNAVAILABLE',message='Storyboard request could not be confirmed. Recover it with the same key or read its receipt.';
    if(error instanceof ProjectError||error instanceof HttpError)({status,code,message}=error);
    else if(error instanceof z.ZodError){status=422;code='VALIDATION_FAILED';message='Check request fields and preconditions.';}
    else if(error instanceof ProviderError){code=error.code;message='Check provider configuration.';}
    return Response.json({error:{code,message,requestId,retryable:false},meta:{requestId}},{status,headers});
  }
}
