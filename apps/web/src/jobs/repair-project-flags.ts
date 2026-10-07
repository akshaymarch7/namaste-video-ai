import 'server-only';
import {Long,type Db,type MongoClient,type Document} from 'mongodb';
import {inTransaction} from '../db/client';
type Doc=Document&{_id:string};

// Idempotent repair for jobs completed before library projection was connected.
// Parent writes serialize with job completion/deletion; preserve unrelated flags
// and ordering timestamps. Never infer readiness from a job without its output.
export async function repairGenerationProjectFlags(db:Db,client:MongoClient){
 let changed=0;
 for await(const ref of db.collection<Doc>('projects').find({deletedAt:null},{projection:{_id:1}})){
  const updated=await inTransaction(client,async session=>{
   const projects=db.collection<Doc>('projects');
   const project=await projects.findOne({_id:ref._id,deletedAt:null},{session});
   if(!project)return false;
   const scope={ownerId:project.ownerId,projectId:project._id};
   const jobs=db.collection<Doc>('generationJobs');
   const active=project.activeJobId?await jobs.findOne({...scope,_id:project.activeJobId},{session}):null;
   const latest=active??await jobs.findOne(scope,{session,sort:{createdAt:-1,_id:-1}});
   if(!latest)return false;
   const output=await db.collection('renderOutputs').findOne(scope,{session});
   const ready=!!output,needsAttention=['failed','needs_input'].includes(latest.state)||!!await db.collection('publishIntents').findOne({...scope,state:{$in:['paused_auth','failed_safe','outcome_unknown','needs_attention']}},{session});
   if(project.flags.ready===ready&&project.flags.needsAttention===needsAttention)return false;
   await projects.updateOne({_id:project._id,deletedAt:null},{$set:{'flags.ready':ready,'flags.needsAttention':needsAttention},$inc:{contentRevision:Long.ONE}},{session});
   return true;
  });
  if(updated)changed++;
 }
 return {generationProjectFlagsRepaired:changed};
}
