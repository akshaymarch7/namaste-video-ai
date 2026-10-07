import 'server-only';
import type {Db,MongoClient,Document} from 'mongodb';
import {inTransaction} from '../db/client';
import {liveProject} from '../generation/live-project';
import {isAdmitted} from '../auth/engine';
import {ProviderError} from '../ideas/providers';
import {storyboardService,type StoryboardProvider} from './service';
import type {IdeaFields} from '../drafts/contracts';
type Doc=Document&{_id:string};
export async function runStoryboardJob(db:Db,client:MongoClient,provider:(model:string)=>StoryboardProvider,now=()=>new Date(),onlyJobId?:string){
 if(onlyJobId!==undefined&&!/^job_[a-f0-9]{32}$/.test(onlyJobId))throw Error('INVALID_JOB_ID');
 const scope=onlyJobId?{_id:onlyJobId}:{};
 const queue=db.collection<Doc>('storyboardQueue');
 // Expiration is independent of browser polling. Never reclaim a running provider call.
 const expired=await queue.find({...scope,state:{$ne:'done'},deadline:{$lte:now()}}).limit(20).toArray();
 for(const job of expired){
  try{await inTransaction(client,session=>liveProject(db,job.ownerId,job.projectId,session,now()));}catch(error){if((error as {code?:string}).code!=='NOT_FOUND')throw error;}
  await queue.updateOne({_id:job._id},{$set:{state:'done',draft:null}});
 }
 const job=await queue.findOneAndUpdate({...scope,state:'queued',deadline:{$gt:now()}},{$set:{state:'running'}},{sort:{createdAt:1},returnDocument:'after'});
 if(!job)return false;
 const doc=await db.collection<Doc>('storyboardRequests').findOne({_id:job._id,ownerId:job.ownerId,projectId:job.projectId});
 if(!doc||doc.state!=='running'){await queue.updateOne({_id:job._id},{$set:{state:'done',draft:null}});return true;}
 // Ownership and admission are derived from the committed job, never event/browser input.
 const parent=await db.collection('projects').findOne({_id:job.projectId as never,ownerId:job.ownerId,deletedAt:null,activeJobId:job._id});
 if(!parent){await queue.updateOne({_id:job._id},{$set:{state:'done',draft:null}});return true;}
 const adapter:StoryboardProvider={model:job.model,run:async(input,context)=>{
   if(!await isAdmitted(db,job.ownerId))throw new ProviderError('ACCESS_DISABLED');
   const result=await provider(job.model).run(input,context);
   if(!await isAdmitted(db,job.ownerId))throw new ProviderError('ACCESS_DISABLED');
   return result;
 }};
 // If this process dies here, its receipt expires as unknown. No silent provider replay.
 await storyboardService(db,client,'worker-does-not-use-cursors',()=>adapter,now).execute(job.ownerId,job.projectId,{doc,adapter,draft:job.draft as IdeaFields});
 await queue.updateOne({_id:job._id,state:'running'},{$set:{state:'done',draft:null}});
 return true;
}
