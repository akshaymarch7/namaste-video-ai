import 'server-only';
import { createHash } from 'node:crypto';
import { Long, type Db, type MongoClient, type Document, type ClientSession } from 'mongodb';
import { inTransaction } from '../db/client';
import { canonical } from '../projects/service';
import { ProjectError } from '../projects/contracts';
import { fieldsOf, selectableVoices, type DraftPatch, type DraftView } from './contracts';
type Doc = Document & { _id: string };
export function draftService(db: Db, client: MongoClient) {
  const projects = db.collection<Doc>('projects'), drafts = db.collection<Doc>('drafts');
  async function read(ownerId: string, projectId: string, session: ClientSession) {
    const project = await projects.findOne({ _id: projectId, ownerId, deletedAt: null }, { session });
    if (!project) throw new ProjectError(404, 'NOT_FOUND', 'Project not found.');
    const draft = await drafts.findOne({ ownerId, projectId }, { session });
    if (!draft || draft.revision !== project.draftRevision) throw new Error('Draft aggregate invariant');
    return { project, draft };
  }
  function view(project: Doc, draft: Doc): DraftView {
    return { projectId: project._id, conversationId: project.conversationId, revision: draft.revision,
      topic: draft.topic, audience: draft.audience, notes: draft.notes, voicePreset: draft.voicePreset,
      editablePlan: null, sourceStoryboardId: null, planStale: false, contentHash: draft.contentHash,
      validation: { valid: false, issues: [{ path: 'editablePlan', code: 'STORYBOARD_REQUIRED', message: 'Create and review a storyboard before approval.' }] },
      updatedAt: draft.updatedAt.toISOString() };
  }
  return {
    get: (ownerId: string, projectId: string) => inTransaction(client, async session => {
      const { project, draft } = await read(ownerId, projectId, session); return view(project, draft);
    }),
    save: (ownerId: string, projectId: string, input: DraftPatch) => inTransaction(client, async session => {
      const { project, draft } = await read(ownerId, projectId, session);
      if (draft.revision !== input.expectedRevision) throw new ProjectError(409, 'REVISION_CONFLICT', 'This draft changed in another tab.', {
        currentRevision: draft.revision, reloadUrl: `/api/projects/${projectId}/draft`,
      });
      // Previously saved presets remain editable even if no longer selectable. New choices must be registered.
      if (input.changes.voicePreset !== undefined && input.changes.voicePreset !== draft.voicePreset
        && !selectableVoices.some(voice => voice === input.changes.voicePreset)) throw new ProjectError(422, 'VOICE_UNAVAILABLE', 'Choose an available voice preset.');
      const content = { ...fieldsOf(draft as unknown as DraftView), ...input.changes, editablePlan: null };
      const updatedAt = new Date(), revision = draft.revision + 1;
      const contentHash = createHash('sha256').update(canonical(content)).digest('hex');
      // Writing the live parent fences rename/delete and future child writers in the same transaction.
      const parent = await projects.updateOne({ _id: projectId, ownerId, deletedAt: null, draftRevision: input.expectedRevision }, {
        $set: { draftRevision: revision, updatedAt, 'flags.drafts': true }, $inc: { contentRevision: Long.ONE },
      }, { session });
      if (!parent.matchedCount) throw new Error('Draft parent fence');
      const updated = await drafts.findOneAndUpdate({ _id: draft._id, ownerId, revision: input.expectedRevision }, {
        $set: { ...content, contentHash, updatedAt, revision },
      }, { session, returnDocument: 'after' });
      if (!updated) throw new Error('Draft revision fence');
      return view(project, updated);
    }),
  };
}
