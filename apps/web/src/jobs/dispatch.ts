import 'server-only';
import {randomUUID} from 'node:crypto';
import type {Db,MongoClient,Document} from 'mongodb';
import {inTransaction} from '../db/client';
import {liveProject} from '../generation/live-project';
import {assertJobsReady} from './setup';
type Doc=Document&{_id:string};
export async function dispatchJobs(db:Db,client:MongoClient,send:(event:{id:string;name:'namaste/generation.requested';data:{jobId:string}})=>Promise<unknown>,now=()=>new Date(),shouldStop=()=>false){
 await assertJobsReady(db);
 const jobs=db.collection<Doc>('generationJobs'),outbox=db.collection<Doc>('generationOutbox');
 // Bounded reconciliation runs independently of browsers. A sent event can be lost or execution interrupted.
 const candidates=await jobs.find({state:{$in:['queued','running','cancel_requested']}}).sort({deadlineAt:1}).limit(50).toArray();
 for(const job of candidates){
  await inTransaction(client,async session=>{try{await liveProject(db,job.ownerId,job.projectId,session,now());}catch(e){if((e as {code?:string}).code!=='NOT_FOUND')throw e;}
   const fresh=await jobs.findOne({_id:job._id},{session});
   if(fresh&&['queued','running','cancel_requested'].includes(fresh.state)&&(!fresh.leaseUntil||fresh.leaseUntil<=now()))await outbox.updateOne({jobId:job._id,state:'sent',availableAt:{$lte:now()}},{$set:{state:'pending',leaseToken:null,leaseUntil:null}},{session});
  });
 }
 let delivered=0;
 for(let n=0;n<20&&!shouldStop();n++){
  const token=randomUUID(),date=now();const event=await outbox.findOneAndUpdate({availableAt:{$lte:date},$or:[{state:'pending'},{state:'leased',leaseUntil:{$lte:date}}]},{$set:{state:'leased',leaseToken:token,leaseUntil:new Date(date.getTime()+30000)}},{sort:{availableAt:1},returnDocument:'after'});
  if(!event)break;
  const job=await jobs.findOne({_id:event.jobId});
  try{
   if(job&&['queued','running','cancel_requested'].includes(job.state))await send({id:`${event._id}-${token}`,name:'namaste/generation.requested',data:{jobId:event.jobId}});
   await outbox.updateOne({_id:event._id,leaseToken:token,state:'leased'},{$set:{state:'sent',leaseToken:null,leaseUntil:null,availableAt:new Date(now().getTime()+60000)}});delivered++;
  }catch{await outbox.updateOne({_id:event._id,leaseToken:token,state:'leased'},{$set:{state:'pending',leaseToken:null,leaseUntil:null,availableAt:new Date(now().getTime()+15000)}});}
 }
 return {delivered};
}
