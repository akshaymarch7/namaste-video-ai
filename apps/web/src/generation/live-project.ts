import 'server-only';
import { Long, type Db, type ClientSession, type Document } from 'mongodb';
import { ProjectError } from '../projects/contracts';
type Doc = Document & { _id: string };
// Bounded request receipts share one parent fence. Storyboard jobs use a local durable queue; hosted orchestration remains F13.
export async function liveProject(db: Db, ownerId: string, projectId: string, session: ClientSession, now: Date) {
  const projects = db.collection<Doc>('projects');
  const project = await projects.findOne({ _id: projectId, ownerId, deletedAt: null }, { session });
  if (!project) throw new ProjectError(404, 'NOT_FOUND', 'Project not found.');
  if (project.activeJobId) {
    const jobs=db.collection<Doc>('generationJobs');
    const expired=await jobs.findOne({_id:project.activeJobId,ownerId,projectId,state:{$in:['queued','running','cancel_requested']},deadlineAt:{$lte:now}},{session});
    if(expired){
      await jobs.updateOne({_id:expired._id,revision:expired.revision},{$set:{state:expired.state==='cancel_requested'?'cancelled':'failed',stage:'stopped',errorCode:expired.state==='cancel_requested'?null:expired.state==='queued'?'QUEUE_EXPIRED':'JOB_DEADLINE',finishedAt:now,updatedAt:now,leaseUntil:null},$inc:{revision:1,fence:1}},{session});
      await projects.updateOne({_id:projectId,ownerId,activeJobId:expired._id},{$unset:{activeJobId:''},$set:{'flags.needsAttention':expired.state!=='cancel_requested',updatedAt:now},$inc:{contentRevision:Long.ONE}},{session});
      delete project.activeJobId;
    }
  }
  if (project.activeJobId) {
    for (const name of ['ideaRequests', 'storyboardRequests']) {
      const receipts = db.collection<Doc>(name);
      const expired = await receipts.findOne({ _id: project.activeJobId, ownerId, projectId, state: 'running', deadline: { $lte: now } }, { session });
      if (!expired) continue;
      // Claim the queued expiration in this transaction: a concurrent worker claim
      // conflicts and retries, so we never call dispatched work a queue-only expiry.
      // Attempt zero alone is insufficient: a worker may have claimed before crashing.
      const queuedExpiry = name === 'storyboardRequests' && (await db.collection<Doc>('storyboardQueue').updateOne(
        { _id: expired._id, ownerId, projectId, state: 'queued', deadline: { $lte: now } },
        { $set: { state: 'done', draft: null } }, { session },
      )).matchedCount === 1;
      await receipts.updateOne({ _id: expired._id, state: 'running' }, { $set: {
        state: queuedExpiry ? 'failed' : 'unknown', errorCode: queuedExpiry ? 'QUEUE_EXPIRED' : 'PROVIDER_OUTCOME_UNKNOWN',
        ...(expired.stage?{stage:'stopped'}:{}), updatedAt: now,
      } }, { session });
      await projects.updateOne({ _id: projectId, ownerId, activeJobId: expired._id }, { $unset: { activeJobId: '' }, $inc: { contentRevision: Long.ONE } }, { session });
      delete project.activeJobId;
      break;
    }
  }
  return project;
}
