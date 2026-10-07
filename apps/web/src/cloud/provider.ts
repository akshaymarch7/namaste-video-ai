import 'server-only';
import {getVercelOidcToken} from '@vercel/oidc';
import {z} from 'zod';
import {jobName, runtimeAccount, taskSeconds, type CloudConfig, type WorkerRole} from './config';

export type LaunchResult = {state:'submitted'; operation:string} | {state:'unknown'|'rejected'; code:string};
export type Observation = {terminal:boolean; execution:string|null};
export class CloudError extends Error {
  constructor(readonly code:'AUTH_UNAVAILABLE'|'JOB_UNAVAILABLE'|'JOB_CONFIGURATION_CHANGED'|'OBSERVATION_UNAVAILABLE',readonly status:number|null=null){super(code);}
}
export interface CloudProvider {
  prepare(role:WorkerRole):Promise<string>;
  launch(role:WorkerRole, id:string, etag:string):Promise<LaunchResult>;
  observe(role:WorkerRole, id:string, createdAt:Date, operation:string|null):Promise<Observation>;
}
const token = z.string().min(1).max(16000);
const container = z.object({name:z.string(),image:z.string(),command:z.array(z.string()).optional(),args:z.array(z.string()).optional(),resources:z.object({limits:z.record(z.string(),z.string())}).optional()});
const execution = z.object({name:z.string(),createTime:z.iso.datetime(),completionTime:z.iso.datetime().optional(),template:z.object({containers:z.array(container)})});
const scope = 'https://www.googleapis.com/auth/cloud-platform';
// No SDK retry middleware: a timed-out jobs.run is an ambiguous paid operation.
export function googleCloudProvider(c:CloudConfig, request:typeof fetch=fetch,
  oidc:(audience:string)=>Promise<string>=audience=>getVercelOidcToken({audience})):CloudProvider {
  const bases=[c.project,c.number].map(project=>`projects/${project}/locations/${c.region}`);
  const validOperation=(name:string)=>bases.some(base=>name.startsWith(`${base}/operations/`)&&/^[-a-zA-Z0-9]+$/.test(name.slice(`${base}/operations/`.length)));
  const validJob=(name:string,role:WorkerRole)=>bases.some(base=>name===`${base}/jobs/namastevideo-${role}`);
  const expiresAt=Date.now()+40000;
  let access:Promise<string>|undefined;
  async function json(url:string, init:RequestInit) {
    const remaining=expiresAt-Date.now();if(remaining<=0)throw Error('CLOUD_DISPATCH_DEADLINE');
    const response=await request(url,{...init,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(Math.min(8000,remaining))});
    // Bound provider data and never propagate response bodies/errors into logs or APIs.
    const reader=response.body?.getReader();let size=0;const chunks:Uint8Array[]=[];
    try { if(reader)for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>256000)throw Error('CLOUD_RESPONSE_INVALID');chunks.push(part.value);} }
    finally { await reader?.cancel().catch(()=>undefined); }
    let data:unknown;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{data=null;}
    return {status:response.status,ok:response.ok,data};
  }
  async function authenticate(){
    const audience=`//iam.googleapis.com/projects/${c.number}/locations/global/workloadIdentityPools/${c.pool}/providers/${c.provider}`;
    const subject=await oidc(`https:${audience}`);
    const sts=await json('https://sts.googleapis.com/v1/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audience,grantType:'urn:ietf:params:oauth:grant-type:token-exchange',requestedTokenType:'urn:ietf:params:oauth:token-type:access_token',subjectTokenType:'urn:ietf:params:oauth:token-type:jwt',subjectToken:subject,scope})});
    if(!sts.ok)throw new CloudError('AUTH_UNAVAILABLE',sts.status);
    const federated=z.object({access_token:token}).parse(sts.data).access_token;
    const iam=await json(`https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${c.serviceAccount}:generateAccessToken`,{method:'POST',headers:{Authorization:`Bearer ${federated}`,'Content-Type':'application/json'},body:JSON.stringify({scope:[scope],lifetime:'600s'})});
    if(!iam.ok)throw new CloudError('AUTH_UNAVAILABLE',iam.status);
    return z.object({accessToken:token}).parse(iam.data).accessToken;
  }
  async function api(path:string, body?:unknown){
    access??=authenticate();
    return json(`https://run.googleapis.com/v2/${path}`,{method:body===undefined?'GET':'POST',headers:{Authorization:`Bearer ${await access}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  }
  function validExecution(value:unknown,role:WorkerRole,id:string,createdAt:Date){
    const parsed=execution.safeParse(value);if(!parsed.success)return null;
    const e=parsed.data,worker=e.template.containers[0];
    if(!bases.some(base=>{const prefix=`${base}/jobs/namastevideo-${role}/executions/`;return e.name.startsWith(prefix)&&/^[-a-z0-9]+$/.test(e.name.slice(prefix.length));})
      ||e.template.containers.length!==1||worker.image!==c.image||JSON.stringify(worker.args)!==JSON.stringify([role,'--job',id])
      ||!Number.isFinite(Date.parse(e.createTime))||Date.parse(e.createTime)<createdAt.getTime()-5000)return null;
    return e;
  }
  return {
    async prepare(role){
      const r=await api(jobName(c,role));if(!r.ok)throw new CloudError('JOB_UNAVAILABLE',r.status);
      const j=z.object({name:z.string(),etag:z.string().min(1).max(256),template:z.object({taskCount:z.number(),parallelism:z.number(),template:z.object({maxRetries:z.number(),timeout:z.string(),serviceAccount:z.string(),containers:z.array(container)})})}).parse(r.data);
      const t=j.template.template,worker=t.containers[0];
      if(!validJob(j.name,role)||j.template.taskCount!==1||j.template.parallelism!==1||t.maxRetries!==0||t.timeout!==`${taskSeconds(role)}s`
        ||t.serviceAccount!==runtimeAccount(c,role)||t.containers.length!==1||worker.name!=='worker'||worker.image!==c.image||Boolean(worker.command?.length)
        ||worker.resources?.limits.cpu!=='2'||worker.resources.limits.memory!=='4Gi')throw new CloudError('JOB_CONFIGURATION_CHANGED');
      return j.etag;
    },
    async launch(role,id,etag){
      if(!/^job_[a-f0-9]{32}$/.test(id))throw Error('INVALID_JOB_ID');
      try {
        const r=await api(`${jobName(c,role)}:run`,{etag,overrides:{taskCount:1,timeout:`${taskSeconds(role)}s`,containerOverrides:[{name:'worker',args:[role,'--job',id]}]}});
        // Only definite request rejection establishes that no execution was accepted.
        if([400,401,403,404,409,412,429].includes(r.status))return {state:'rejected',code:`HTTP_${r.status}`};
        if(!r.ok)return {state:'unknown',code:'LAUNCH_UNCONFIRMED'};
        const op=z.object({name:z.string()}).safeParse(r.data);
        if(!op.success||!validOperation(op.data.name))return {state:'unknown',code:'LAUNCH_UNCONFIRMED'};
        return {state:'submitted',operation:op.data.name};
      } catch {return {state:'unknown',code:'LAUNCH_UNCONFIRMED'};}
    },
    async observe(role,id,createdAt,operation){
      if(operation){
        if(!validOperation(operation))throw Error('INVALID_OPERATION');
        const r=await api(operation);
        const op=z.object({done:z.boolean().optional(),response:z.unknown().optional(),error:z.unknown().optional()}).safeParse(r.data);
        if(r.ok&&op.success&&op.data.done){
          const e=validExecution(op.data.response,role,id,createdAt);
          if(e)return {terminal:Boolean(e.completionTime),execution:e.name};
          // An operation error alone may hide an execution; inspect executions below.
        }
      }
      let page:string|undefined;
      for(let n=0;n<3;n++){
        const r=await api(`${jobName(c,role)}/executions?pageSize=100${page?`&pageToken=${encodeURIComponent(page)}`:''}`);
        const list=z.object({executions:z.array(z.unknown()).optional(),nextPageToken:z.string().max(4000).optional()}).safeParse(r.data);
        if(!r.ok||!list.success)throw new CloudError('OBSERVATION_UNAVAILABLE',r.status);
        const matches=(list.data.executions??[]).map(e=>validExecution(e,role,id,createdAt)).filter(e=>e!==null);
        // More than one matching execution is an operator incident, never a reason to launch.
        if(matches.length>1)throw Error('CLOUD_DUPLICATE_EXECUTION');
        if(matches[0])return {terminal:Boolean(matches[0].completionTime),execution:matches[0].name};
        page=list.data.nextPageToken;if(!page)break;
      }
      return {terminal:false,execution:null};
    },
  };
}
