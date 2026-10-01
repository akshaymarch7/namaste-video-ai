import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { Long, type Db, type MongoClient, type ClientSession, type Document } from 'mongodb';
import { inTransaction } from '../db/client';
import { canonical } from '../projects/service';
import { ProjectError } from '../projects/contracts';
import { fieldsOf, type IdeaFields } from '../drafts/contracts';
import { suggestionsSchema, type IdeaRequest, type IdeaResult, type Suggestion } from './contracts';
import { ProviderError } from './providers';
type Doc = Document & { _id: string };
export type IdeaProvider = { model: string; run(input: {prompt: string; draft: IdeaFields}): Promise<Suggestion[]> };
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
function view(doc: Doc): IdeaResult {
  return { id: doc._id, state: doc.state, sourceDraftRevision: doc.sourceDraftRevision, model: doc.model, suggestions: doc.suggestions, errorCode: doc.errorCode, createdAt: doc.createdAt.toISOString() };
}
export function ideaService(db: Db, client: MongoClient, provider: () => IdeaProvider, now = () => new Date()) {
  const requests = db.collection<Doc>('ideaRequests'), projects = db.collection<Doc>('projects');
  async function live(ownerId: string, projectId: string, session: ClientSession) {
    const p = await projects.findOne({ _id: projectId, ownerId, deletedAt: null }, { session });
    if (!p) throw new ProjectError(404, 'NOT_FOUND', 'Project not found.');
    if (p.activeJobId) {
      const expired = await requests.findOne({ _id: p.activeJobId, ownerId, projectId, state: 'running', deadline: { $lte: now() } }, { session });
      if (expired) {
        await requests.updateOne({ _id: expired._id, state: 'running' }, { $set: { state: 'unknown', errorCode: 'PROVIDER_OUTCOME_UNKNOWN', updatedAt: now() } }, { session });
        await projects.updateOne({ _id: projectId, activeJobId: expired._id }, { $unset: { activeJobId: '' }, $inc: { contentRevision: Long.ONE } }, { session });
        delete p.activeJobId;
      }
    }
    return p;
  }
  return {
    latest: (ownerId: string, projectId: string) => inTransaction(client, async session => {
      await live(ownerId, projectId, session);
      const doc = await requests.findOne({ ownerId, projectId }, { sort: { createdAt: -1, _id: -1 }, session });
      return doc ? view(doc) : null;
    }),
    async create(ownerId: string, projectId: string, key: string, input: IdeaRequest) {
      const requestHash = hash(canonical(input)), keyHash = hash(key);
      const claim = await inTransaction(client, async session => {
        const p = await live(ownerId, projectId, session);
        const old = await requests.findOne({ ownerId, projectId, keyHash }, { session });
        if (old) {
          if (old.requestHash !== requestHash) throw new ProjectError(409, 'IDEMPOTENCY_KEY_REUSED', 'Use a new key for different input.');
          return { replay: view(old) };
        }
        if (p.draftRevision !== input.expectedDraftRevision) throw new ProjectError(409, 'REVISION_CONFLICT', 'Save and reload your idea before brainstorming.');
        if (p.activeJobId) throw new ProjectError(409, 'PROJECT_BUSY', 'This project already has a request in progress.');
        const draft = await db.collection('drafts').findOne({ ownerId, projectId, revision: input.expectedDraftRevision }, { session });
        if (!draft) throw new ProjectError(409, 'REVISION_CONFLICT', 'Reload your idea.');
        const adapter = provider(), date = now(), id = `job_${randomUUID().replaceAll('-', '')}`;
        const doc = { _id: id, schemaVersion: 1, ownerId, projectId, keyHash, requestHash, model: adapter.model, sourceDraftRevision: draft.revision,
          state: 'running', suggestions: [], errorCode: null, createdAt: date, updatedAt: date, deadline: new Date(date.getTime() + 45000) };
        // All child writers share this parent write with deletion and other pipeline work.
        await projects.updateOne({ _id: projectId, ownerId, deletedAt: null }, { $set: { activeJobId: id, updatedAt: date }, $inc: { contentRevision: Long.ONE } }, { session });
        await requests.insertOne(doc, { session });
        return { doc, adapter, draft: fieldsOf(draft as unknown as IdeaFields) };
      });
      if ('replay' in claim) return claim.replay!;
      let suggestions: Suggestion[] = [], state = 'completed', errorCode: string | null = null;
      try { suggestions = suggestionsSchema.parse({ suggestions: await claim.adapter.run({ prompt: input.prompt, draft: claim.draft }) }).suggestions; }
      catch (error) { errorCode = error instanceof ProviderError ? error.code : 'PROVIDER_OUTCOME_UNKNOWN'; state = errorCode === 'PROVIDER_OUTCOME_UNKNOWN' ? 'unknown' : 'failed'; }
      return inTransaction(client, async session => {
        const p = await live(ownerId, projectId, session);
        const current = await requests.findOne({ _id: claim.doc._id, ownerId, projectId }, { session });
        if (!current) throw new Error('Missing idea receipt');
        if (current.state !== 'running' || p.activeJobId !== current._id) return view(current);
        await requests.updateOne({ _id: current._id, state: 'running' }, { $set: { state, suggestions, errorCode, updatedAt: now() } }, { session });
        await projects.updateOne({ _id: projectId, activeJobId: current._id }, { $unset: { activeJobId: '' }, $inc: { contentRevision: Long.ONE } }, { session });
        return view({ ...current, state, suggestions, errorCode });
      });
    },
  };
}
