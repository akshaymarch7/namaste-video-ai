import 'server-only';
import { Long, type Db, type ClientSession, type Document } from 'mongodb';
import { ProjectError } from '../projects/contracts';
type Doc = Document & { _id: string };
// Bounded request receipts share one parent fence. Durable worker jobs arrive in F13.
export async function liveProject(db: Db, ownerId: string, projectId: string, session: ClientSession, now: Date) {
  const projects = db.collection<Doc>('projects');
  const project = await projects.findOne({ _id: projectId, ownerId, deletedAt: null }, { session });
  if (!project) throw new ProjectError(404, 'NOT_FOUND', 'Project not found.');
  if (project.activeJobId) {
    for (const name of ['ideaRequests', 'storyboardRequests']) {
      const receipts = db.collection<Doc>(name);
      const expired = await receipts.findOne({ _id: project.activeJobId, ownerId, projectId, state: 'running', deadline: { $lte: now } }, { session });
      if (!expired) continue;
      await receipts.updateOne({ _id: expired._id, state: 'running' }, { $set: { state: 'unknown', errorCode: 'PROVIDER_OUTCOME_UNKNOWN', updatedAt: now } }, { session });
      await projects.updateOne({ _id: projectId, ownerId, activeJobId: expired._id }, { $unset: { activeJobId: '' }, $inc: { contentRevision: Long.ONE } }, { session });
      delete project.activeJobId;
      break;
    }
  }
  return project;
}
