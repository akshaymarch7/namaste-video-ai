import 'server-only';
import {Long, type Db, type MongoClient, type ClientSession, type Document} from 'mongodb';
import {inTransaction} from '../db/client';
import {liveProject} from '../generation/live-project';
import {isAdmitted} from '../auth/engine';
import {assertCloudDispatchReady} from './setup';
import {jobName, type CloudConfig, type WorkerRole} from './config';
import {CloudError,type CloudProvider} from './provider';

type Doc=Document & {_id:string};
type Candidate={_id:string;ownerId:string;projectId:string;role:WorkerRole;createdAt:Date;deadline:Date};
const active=['submitting','submitted','unknown'];
const source=(role:WorkerRole)=>role==='storyboard'?'storyboardQueue':'generationJobs';

// Only settle work which provably never reached a worker. Running journals retain
// their existing fenced completion/deadline semantics (especially speech recovery).
async function rejectQueued(db:Db, session:ClientSession, c:Candidate, date:Date, code:string){
  const row=await db.collection<Doc>(source(c.role)).findOne({_id:c._id,state:'queued'},{session});
  if(!row)return;
  if(c.role==='storyboard'){
    await db.collection<Doc>('storyboardQueue').updateOne({_id:c._id,state:'queued'},{$set:{state:'done',draft:null}},{session});
    await db.collection<Doc>('storyboardRequests').updateOne({_id:c._id,state:'running'},{$set:{state:'failed',stage:'stopped',errorCode:code,updatedAt:date}},{session});
  }else{
    await db.collection<Doc>('generationJobs').updateOne({_id:c._id,state:'queued'},{$set:{state:'failed',stage:'stopped',errorCode:code,updatedAt:date,finishedAt:date,leaseUntil:null},$inc:{revision:1,fence:1}},{session});
  }
  await db.collection<Doc>('projects').updateOne({_id:c.projectId,ownerId:c.ownerId,activeJobId:c._id},{$unset:{activeJobId:''},$set:{...(c.role==='generation'?{'flags.needsAttention':true}:{}),updatedAt:date},$inc:{contentRevision:Long.ONE}},{session});
}

export async function dispatchCloud(db:Db,client:MongoClient,config:CloudConfig,provider:CloudProvider,now=()=>new Date()){
  await assertCloudDispatchReady(db);
  const ledger=db.collection<Doc>('cloudDispatches');
  const result={launched:0,reconciled:0,unknown:0,rejected:0,waiting:0,unavailable:0,issue:null as null|{category:string;status:number|null}};
  const unavailable=(error:unknown)=>{result.unavailable++;result.issue=error instanceof CloudError?{category:error.code,status:error.status}:{category:'DISPATCH_UNAVAILABLE',status:null};};
  const stopAt=Date.now()+40000;
  // Expire persisted receipts even when the initiating browser has gone away.
  for(const role of ['storyboard','generation'] as const){
    const deadline=role==='storyboard'?'deadline':'deadlineAt';
    const expired=await db.collection<Doc>(source(role)).find({state:{$in:role==='storyboard'?['queued','running']:['queued','running','cancel_requested']},[deadline]:{$lte:now()}}).sort({[deadline]:1}).limit(25).toArray();
    for(const row of expired)await inTransaction(client,async session=>{
      const date=now();
      try{await liveProject(db,row.ownerId,row.projectId,session,date);}catch(e){if((e as {code?:string}).code!=='NOT_FOUND')throw e;}
      // Deleted/replaced parents must not leave immortal rows at the front of
      // this bounded scan. Settle only this expired record, never a newer slot.
      const stale=await db.collection<Doc>(source(role)).findOne({_id:row._id,state:{$in:role==='storyboard'?['queued','running']:['queued','running','cancel_requested']},[deadline]:{$lte:date}},{session});
      if(stale&&role==='storyboard'){
        await db.collection<Doc>('storyboardRequests').updateOne({_id:row._id,state:'running'},{$set:{state:stale.state==='queued'?'failed':'unknown',stage:'stopped',errorCode:stale.state==='queued'?'QUEUE_EXPIRED':'PROVIDER_OUTCOME_UNKNOWN',updatedAt:date}},{session});
        await db.collection<Doc>('storyboardQueue').updateOne({_id:row._id},{$set:{state:'done',draft:null}},{session});
      }else if(stale){
        await db.collection<Doc>('generationJobs').updateOne({_id:row._id,revision:stale.revision},{$set:{state:stale.state==='cancel_requested'?'cancelled':'failed',stage:'stopped',errorCode:stale.state==='cancel_requested'?null:stale.state==='queued'?'QUEUE_EXPIRED':'JOB_DEADLINE',updatedAt:date,finishedAt:date,leaseUntil:null},$inc:{revision:1,fence:1}},{session});
      }
    });
  }
  const outstanding=await ledger.find({state:{$in:active},checkAt:{$lte:now()}}).sort({checkAt:1}).limit(2).toArray();
  for(const record of outstanding){
    if(Date.now()>stopAt)break;
    // A deployment must not reinterpret receipts from another region/image.
    if(record.target!==jobName(config,record.role)||record.image!==config.image){result.unavailable++;continue;}
    try{
      const observed=await provider.observe(record.role,record._id,record.createdAt,record.operation);
      await inTransaction(client,async session=>{
        const fresh=await ledger.findOne({_id:record._id,state:{$in:active}},{session});if(!fresh)return;
        const date=now();
        await ledger.updateOne({_id:record._id},{$set:{state:observed.terminal?'finished':observed.execution?'submitted':'unknown',execution:observed.execution??fresh.execution,updatedAt:date,checkAt:new Date(date.getTime()+30000)}},{session});
        if(observed.terminal)await rejectQueued(db,session,{...record,deadline:date} as Candidate,date,'WORKER_STOPPED');
      });
      result.reconciled++;
    }catch(error){
      unavailable(error);
      await ledger.updateOne({_id:record._id,state:{$in:active}},{$set:{checkAt:new Date(now().getTime()+30000)}});
    }
  }
  const candidates:Candidate[]=[];
  for(const role of ['storyboard','generation'] as const){
    const rows=await db.collection<Doc>(source(role)).aggregate([
      {$match:{state:'queued',createdAt:{$gte:config.notBefore},[role==='storyboard'?'deadline':'deadlineAt']:{$gt:now()}}},
      {$lookup:{from:'cloudDispatches',localField:'_id',foreignField:'_id',as:'dispatch'}},
      {$match:{'dispatch.0':{$exists:false}}},{$sort:{createdAt:1}},
      {$group:{_id:'$ownerId',row:{$first:'$$ROOT'}}},{$replaceRoot:{newRoot:'$row'}},{$sort:{createdAt:1}},{$limit:20},
    ]).toArray();
    for(const row of rows)candidates.push({_id:row._id,ownerId:row.ownerId,projectId:row.projectId,role,createdAt:row.createdAt,deadline:row.deadline??row.deadlineAt});
  }
  candidates.sort((a,b)=>a.deadline.getTime()-b.deadline.getTime());
  const prepared=new Map<WorkerRole,string>();
  for(const c of candidates){
    if(Date.now()>stopAt||result.launched>=2)break;
    if(!prepared.has(c.role)){
      try{prepared.set(c.role,await provider.prepare(c.role));}catch(error){unavailable(error);continue;}
    }
    const reserved=await inTransaction(client,async session=>{
      // Updating this singleton serializes cap checks across all web/scheduler replicas.
      const lock=await db.collection<Doc>('cloudDispatchControl').updateOne({_id:'global'},{$inc:{revision:Long.ONE}},{session});
      if(!lock.matchedCount)throw Error('CLOUD_SETUP_REQUIRED');
      if(await ledger.findOne({_id:c._id},{session}))return false;
      const date=now(),fresh=await db.collection<Doc>(source(c.role)).findOne({_id:c._id,state:'queued'},{session});
      if(!fresh||c.deadline<=date)return false;
      const parent=await db.collection<Doc>('projects').findOne({_id:c.projectId,ownerId:c.ownerId,deletedAt:null,activeJobId:c._id},{session});
      if(!parent||!await isAdmitted(db,c.ownerId)){
        await rejectQueued(db,session,c,date,'ACCESS_UNAVAILABLE');return false;
      }
      const day=new Date(date);day.setUTCHours(0,0,0,0);
      if(await ledger.countDocuments({createdAt:{$gte:day}},{session})>=config.dailyLimit){
        await rejectQueued(db,session,c,date,'PILOT_DAILY_LIMIT');return false;
      }
      if(await ledger.countDocuments({state:{$in:active}},{session})>=2
        ||await ledger.countDocuments({ownerId:c.ownerId,state:{$in:active}},{session})>=1)return false;
      await ledger.insertOne({_id:c._id,ownerId:c.ownerId,projectId:c.projectId,role:c.role,target:jobName(config,c.role),image:config.image,state:'submitting',operation:null,execution:null,code:null,createdAt:date,updatedAt:date,checkAt:new Date(date.getTime()+30000)},{session});
      return true;
    });
    if(!reserved){result.waiting++;continue;}
    // This record is NEVER leased/retried. A crash here sacrifices availability
    // instead of risking a duplicate paid launch. Read-only reconciliation follows.
    let launch:Awaited<ReturnType<CloudProvider['launch']>>;
    try{launch=await provider.launch(c.role,c._id,prepared.get(c.role)!);}catch{launch={state:'unknown',code:'LAUNCH_UNCONFIRMED'};}
    await inTransaction(client,async session=>{
      const date=now();
      // A reconciler may have observed completion while the POST was in flight.
      await ledger.updateOne({_id:c._id,state:{$in:['submitting','unknown']}},{$set:{state:launch.state,operation:launch.state==='submitted'?launch.operation:null,code:launch.state==='submitted'?null:launch.code,updatedAt:date,checkAt:new Date(date.getTime()+30000)}},{session});
      if(launch.state==='rejected')await rejectQueued(db,session,c,date,'WORKER_UNAVAILABLE');
    });
    result.launched++;if(launch.state==='unknown')result.unknown++;if(launch.state==='rejected')result.rejected++;
  }
  return result;
}
