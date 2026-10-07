import 'server-only';
import {createHash} from 'node:crypto';
import {Long,type Db,type MongoClient,type Document,type ClientSession} from 'mongodb';
import {canonical} from '../projects/service';
import {inTransaction} from '../db/client';
type Doc=Document&{_id:string};
export const videoHash=(v:unknown)=>createHash('sha256').update(canonical(v)).digest('hex');
// Called inside the producer's completion transaction, after verified assets exist.
export async function materializeVideo(db:Db,job:Doc,output:Doc,session:ClientSession){
 const asset=await db.collection<Doc>('assets').findOne({_id:output.videoAssetId,ownerId:job.ownerId,projectId:job.projectId,kind:'video',state:'ready'},{session});
 const captions=await db.collection<Doc>('assets').findOne({_id:output.captionsAssetId,ownerId:job.ownerId,projectId:job.projectId,kind:'captions',state:'ready'},{session});
 if(!asset||!captions||output.inputHash!==job.inputHash||videoHash(job.inputSnapshot)!==job.inputHash)throw Error('VIDEO_INPUT_INVALID');
 const id=`vid_${createHash('sha256').update(job._id).digest('hex').slice(0,32)}`;
 await db.collection<Doc>('videos').updateOne({_id:id},{$setOnInsert:{ownerId:job.ownerId,projectId:job.projectId,jobId:job._id,storyboardId:job.storyboardId,storyApprovalId:job.approvalId,title:job.inputSnapshot.plan.title,renderSpec:job.inputSnapshot,renderSpecHash:job.inputHash,outputHash:asset.sha256,outputAssetId:asset._id,captionsAssetId:captions._id,duration:output.duration,createdAt:output.createdAt}},{session,upsert:true});
 return id;
}
export async function backfillVideos(db:Db,client:MongoClient){
 let count=0;
 for await(const output of db.collection<Doc>('renderOutputs').find({}).sort({createdAt:1,_id:1})){
  const added=await inTransaction(client,async session=>{
   const parent=await db.collection<Doc>('projects').findOne({_id:output.projectId,ownerId:output.ownerId,deletedAt:null},{session});
   if(!parent||await db.collection('videos').findOne({jobId:output.jobId},{session}))return false;
   const job=await db.collection<Doc>('generationJobs').findOne({_id:output.jobId,ownerId:output.ownerId,projectId:output.projectId,state:'succeeded'},{session});
   if(!job)throw Error('VIDEO_JOB_MISSING');
   const id=await materializeVideo(db,job,output,session);
   const latest=await db.collection<Doc>('videos').findOne({ownerId:output.ownerId,projectId:output.projectId},{session,sort:{createdAt:-1,_id:-1}});
   await db.collection<Doc>('projects').updateOne({_id:parent._id,deletedAt:null},{$set:{latestReadyVideoId:latest!._id},$inc:{contentRevision:Long.ONE}},{session});
   return true;
  });if(added)count++;
 }
 return {videosBackfilled:count};
}
