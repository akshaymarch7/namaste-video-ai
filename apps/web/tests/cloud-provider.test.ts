import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cloudConfig,cloudEnabled,jobName,runtimeAccount} from '../src/cloud/config';
import {googleCloudProvider} from '../src/cloud/provider';
import {handleCloudDispatch} from '../src/cloud/http';
const env={CLOUD_RUN_PROJECT:'test-project',CLOUD_RUN_PROJECT_NUMBER:'123456789',CLOUD_RUN_IDENTITY_POOL:'vercel',CLOUD_RUN_IDENTITY_PROVIDER:'vercel',CLOUD_RUN_IMAGE:'us-central1-docker.pkg.dev/test-project/namastevideo-workers/worker@sha256:'+'a'.repeat(64),CLOUD_RUN_NOT_BEFORE:'2026-10-08T00:00:00Z'};
const c=cloudConfig(env),id='job_'+'b'.repeat(32),createdAt=new Date('2026-10-08T10:00:00Z');
const operation=`projects/${c.project}/locations/${c.region}/operations/fixture-op`;
const job=()=>({name:jobName(c,'generation'),etag:'fixture-etag',template:{taskCount:1,parallelism:1,template:{maxRetries:0,timeout:'900s',serviceAccount:runtimeAccount(c,'generation'),containers:[{name:'worker',image:c.image,resources:{limits:{cpu:'2',memory:'4Gi'}}}]}}});
const execution=(terminal=true)=>({name:jobName(c,'generation')+'/executions/fixture-execution',createTime:createdAt.toISOString(),...(terminal?{completionTime:'2026-10-08T10:02:00Z'}:{}),template:{containers:[{name:'worker',image:c.image,args:['generation','--job',id]}]}});
function harness(run:(url:string,init:RequestInit)=>Response|Promise<Response>){
  const calls:{url:string;init:RequestInit}[]=[];
  const request:typeof fetch=async(input,init={})=>{
    const url=String(input);calls.push({url,init});
    assert.equal(init.redirect,'error');assert.equal(init.cache,'no-store');assert.ok(init.signal);
    if(url==='https://sts.googleapis.com/v1/token'){
      const body=JSON.parse(init.body as string);assert.equal(body.subjectToken,'labelled-oidc');assert.equal(body.audience,`//iam.googleapis.com/projects/${c.number}/locations/global/workloadIdentityPools/vercel/providers/vercel`);
      assert.equal((init.headers as Record<string,string>).Authorization,undefined);
      return Response.json({access_token:'labelled-federated'});
    }
    if(url.startsWith('https://iamcredentials.googleapis.com/'))return Response.json({accessToken:'labelled-access'});
    assert.ok(url.startsWith('https://run.googleapis.com/v2/'));return run(url,init);
  };
  const provider=googleCloudProvider(c,request,async audience=>{assert.equal(audience,`https://iam.googleapis.com/projects/${c.number}/locations/global/workloadIdentityPools/vercel/providers/vercel`);return 'labelled-oidc';});
  return {provider,calls};
}
test('cloud mode is opt-in; malformed destinations, unpinned images and invalid pilot limits fail closed',()=>{
  assert.equal(cloudEnabled({}),false);assert.equal(cloudEnabled({CLOUD_RUN_ENABLED:'true'}),false);assert.equal(cloudEnabled({CLOUD_RUN_ENABLED:'1'}),true);
  assert.equal(cloudConfig(env).dailyLimit,10);
  assert.equal(cloudConfig({...env,CLOUD_RUN_DAILY_LIMIT:'50'}).dailyLimit,50);
  for(const override of [{CLOUD_RUN_PROJECT:'../evil'},{CLOUD_RUN_IMAGE:'https://evil.test'},{CLOUD_RUN_DAILY_LIMIT:'51'},{CLOUD_RUN_DAILY_LIMIT:'0'},{CLOUD_RUN_NOT_BEFORE:''},{CLOUD_RUN_REGION:'east/../../evil'}])assert.throws(()=>cloudConfig({...env,...override}));
});
test('verified job template and etag produce one bounded invocation with no content or secrets in args',async()=>{
  const h=harness((url,init)=>{if(!url.endsWith(':run'))return Response.json(job());assert.deepEqual(JSON.parse(init.body as string),{etag:'fixture-etag',overrides:{taskCount:1,timeout:'900s',containerOverrides:[{name:'worker',args:['generation','--job',id]}]}});return Response.json({name:operation});});
  const etag=await h.provider.prepare('generation');assert.equal(etag,'fixture-etag');assert.deepEqual(await h.provider.launch('generation',id,etag),{state:'submitted',operation});assert.equal(h.calls.filter(x=>x.url.endsWith(':run')).length,1);assert.equal(h.calls.filter(x=>x.url.includes('sts.googleapis')).length,1);
});
test('template drift in retry count, task count, image, identity, memory or timeout prevents launch',async()=>{
  for(const change of [(j:ReturnType<typeof job>)=>j.template.taskCount=2,(j:ReturnType<typeof job>)=>j.template.template.maxRetries=1,(j:ReturnType<typeof job>)=>j.template.template.timeout='3600s',(j:ReturnType<typeof job>)=>j.template.template.serviceAccount='other',(j:ReturnType<typeof job>)=>j.template.template.containers[0].image='latest',(j:ReturnType<typeof job>)=>j.template.template.containers[0].resources.limits.memory='8Gi']){
    const j=job();change(j);const h=harness(()=>Response.json(j));await assert.rejects(h.provider.prepare('generation'));assert.equal(h.calls.filter(x=>x.url.endsWith(':run')).length,0);
  }
});
test('only definite rejection is settled; 5xx, network failure, malformed or foreign operation remain unknown',async()=>{
  for(const status of [400,401,403,404,409,412,429]){const h=harness(()=>Response.json({private:'not returned'},{status}));assert.deepEqual(await h.provider.launch('generation',id,'etag'),{state:'rejected',code:`HTTP_${status}`});}
  for(const response of [()=>Response.json({}, {status:500}),()=>Response.json({name:'https://evil.test/op'}),()=>new Response('bad JSON'),()=>{throw Error('private upstream failure');},()=>new Response('x'.repeat(256001))]){
    const h=harness(response);assert.deepEqual(await h.provider.launch('generation',id,'etag'),{state:'unknown',code:'LAUNCH_UNCONFIRMED'});assert.equal(h.calls.filter(x=>x.url.endsWith(':run')).length,1);
  }
});
test('operation completion is matched to the exact job ID, image and execution namespace',async()=>{
  const h=harness(()=>Response.json({done:true,response:execution()}));assert.deepEqual(await h.provider.observe('generation',id,createdAt,operation),{terminal:true,execution:execution().name});
  const wrong=execution();wrong.template.containers[0].args[2]='job_'+'c'.repeat(32);
  const mismatch=harness(url=>Response.json(url.includes('/operations/')?{done:true,response:wrong}:{executions:[wrong]}));assert.deepEqual(await mismatch.provider.observe('generation',id,createdAt,operation),{terminal:false,execution:null});
  await assert.rejects(h.provider.observe('generation',id,createdAt,'projects/foreign/locations/us-east1/operations/fixture'));
});
test('lost acknowledgement recovers via read-only paginated execution discovery',async()=>{
  const h=harness(url=>Response.json(url.includes('pageToken=next')?{executions:[execution(false)]}:{executions:[],nextPageToken:'next'}));
  assert.deepEqual(await h.provider.observe('generation',id,createdAt,null),{terminal:false,execution:execution().name});assert.equal(h.calls.filter(x=>x.url.endsWith(':run')).length,0);assert.equal(h.calls.filter(x=>x.url.includes('/executions?')).length,2);
});
test('an empty discovery result does not assert termination; provider failures stay unresolved',async()=>{
  const h=harness(()=>Response.json({}));assert.deepEqual(await h.provider.observe('generation',id,createdAt,null),{terminal:false,execution:null});
  const bad=harness(()=>Response.json({}, {status:503}));await assert.rejects(bad.provider.observe('generation',id,createdAt,null));
});
test('duplicate execution matches fail closed',async()=>{const h=harness(()=>Response.json({executions:[execution(),execution()]}));await assert.rejects(h.provider.observe('generation',id,createdAt,null));});
test('Google canonical project-number resource names are accepted without accepting another project',async()=>{
  const j=job();j.name=j.name.replace(c.project,c.number);const canonical=operation.replace(c.project,c.number);
  const h=harness(url=>Response.json(url.endsWith(':run')?{name:canonical}:j));assert.equal(await h.provider.prepare('generation'),'fixture-etag');assert.deepEqual(await h.provider.launch('generation',id,'etag'),{state:'submitted',operation:canonical});
  const e=execution();e.name=e.name.replace(c.project,c.number);const read=harness(()=>Response.json({done:true,response:e}));assert.equal((await read.provider.observe('generation',id,createdAt,canonical)).terminal,true);
});
test('scheduler endpoint rejects unauthenticated, disabled, query and payload requests without touching work',async()=>{
  const secret='labelled-scheduler-secret-'.repeat(3),e={CLOUD_RUN_ENABLED:'1',CLOUD_RUN_SCHEDULER_SECRET:secret};let calls=0;const run=async()=>{calls++;return {launched:1};};
  const req=(auth:string,query='',body?:string)=>new Request('https://app.test/api/internal/cloud-dispatch'+query,{method:'POST',headers:{Authorization:auth},...(body?{body}: {})});
  assert.equal((await handleCloudDispatch(req(''),run,e)).status,401);assert.equal((await handleCloudDispatch(req('Bearer '+secret.replace('l','é')),run,e)).status,401);
  assert.equal((await handleCloudDispatch(req('Bearer '+secret),run,{})).status,503);
  assert.equal((await handleCloudDispatch(req('Bearer '+secret,'?job=evil'),run,e)).status,400);assert.equal((await handleCloudDispatch(req('Bearer '+secret,'','{}'),run,e)).status,400);assert.equal(calls,0);
  const result=await handleCloudDispatch(req('Bearer '+secret),run,e);assert.equal(result.status,200);assert.equal(calls,1);assert.equal(result.headers.get('cache-control'),'private, no-store');
  const streamedEmpty=new Request('https://app.test/api/internal/cloud-dispatch',{method:'POST',headers:{Authorization:'Bearer '+secret},body:''});
  assert.equal((await handleCloudDispatch(streamedEmpty,run,e)).status,200);assert.equal(calls,2);
  const failed=await handleCloudDispatch(req('Bearer '+secret),async()=>{throw Error('private fixture');},e);assert.equal(failed.status,503);assert.equal((await failed.text()).includes('private fixture'),false);
});

test('historical image observation requires its exact original digest and never alters launch validation',async()=>{
 const oldImage=c.image.replace(/a{64}$/, 'd'.repeat(64)),old=execution();old.template.containers[0].image=oldImage;
 const h=harness(url=>Response.json(url.includes('/operations/')?{done:true,response:old}:{executions:[old]}));
 assert.equal((await h.provider.observe('generation',id,createdAt,operation,oldImage)).terminal,true);
 assert.deepEqual(await h.provider.observe('generation',id,createdAt,operation),{terminal:false,execution:null});
 assert.equal(h.calls.filter(x=>x.url.endsWith(':run')).length,0);
 for(const invalid of ['latest',oldImage.replace('test-project','foreign-project'),oldImage+'extra'])await assert.rejects(h.provider.observe('generation',id,createdAt,operation,invalid));
 const current=job();current.template.template.containers[0].image=oldImage;
 await assert.rejects(harness(()=>Response.json(current)).provider.prepare('generation'));
});
