import 'server-only';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { Long, MongoServerError, type Db, type MongoClient, type ClientSession, type Document } from 'mongodb';
import { inTransaction } from '../db/client';
import { ProjectError, type ProjectView, type filters } from './contracts';
const id = (prefix: string) => `${prefix}_${randomUUID().replaceAll('-', '')}`;
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const missing = () => new ProjectError(404, 'NOT_FOUND', 'Project not found.');
type RecordDoc = Document & { _id: string };
type FilterName = typeof filters[number];
export const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  return JSON.stringify(value);
};
function view(project: RecordDoc): ProjectView {
  return { id: project._id, title: project.title, revision: project.revision, draftRevision: project.draftRevision,
    conversationId: project.conversationId, currentStoryboardId: project.currentStoryboardId ?? null,
    latestReadyVideoId: project.latestReadyVideoId ?? null, selectedVideoId: project.selectedVideoId ?? null,
    activeJobId: project.activeJobId ?? null, flags: project.flags,
    createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt.toISOString() };
}
export function projectService(db: Db, client: MongoClient, secret: string) {
  const projects = db.collection<RecordDoc>('projects');
  const commands = db.collection<RecordDoc>('projectCommands');
  async function live(ownerId: string, projectId: string, session?: ClientSession) {
    const project = await projects.findOne({ _id: projectId, ownerId, deletedAt: null }, { session });
    if (!project) throw missing();
    return project;
  }
  function conflict(project: RecordDoc) {
    return new ProjectError(409, 'REVISION_CONFLICT', 'This project changed. Reload it before retrying.', { currentRevision: project.revision, reloadUrl: `/api/projects/${project._id}` });
  }
  async function command(ownerId: string, method: 'POST' | 'DELETE', path: string, key: string, body: unknown,
    execute: (session: ClientSession) => Promise<{ projectId: string; status: number; data: ProjectView | null }>) {
    const scope = { ownerId, method, path, keyHash: hash(key) }, requestHash = hash(canonical(body));
    async function replay(receipt: RecordDoc, session?: ClientSession) {
      if (method === 'POST') await live(ownerId, receipt.projectId, session);
      if (receipt.requestHash !== requestHash) throw new ProjectError(409, 'IDEMPOTENCY_KEY_REUSED', 'Use a new idempotency key for a different request.');
      return { status: receipt.status as number, data: receipt.response as ProjectView | null, replayed: true };
    }
    try {
      return await inTransaction(client, async session => {
        const previous = await commands.findOne(scope, { session });
        if (previous) return replay(previous, session);
        const result = await execute(session);
        const now = new Date();
        await commands.insertOne({ _id: id('cmd'), schemaVersion: 1, ...scope, requestHash,
          projectId: result.projectId, status: result.status, response: result.data, createdAt: now, updatedAt: now }, { session });
        return { status: result.status, data: result.data, replayed: false };
      });
    } catch (error) {
      // Concurrent same-key transactions may lose the unique-index race after rolling back.
      if (error instanceof MongoServerError && error.code === 11000 && error.keyPattern?.keyHash === 1) {
        const winner = await commands.findOne(scope);
        if (winner) return replay(winner);
        throw new ProjectError(409, 'COMMAND_IN_PROGRESS', 'Retry the same request and key.');
      }
      throw error;
    }
  }
  const sign = (payload: string) => createHmac('sha256', secret).update(`projects-cursor-v1:${payload}`).digest('base64url');
  return {
    async get(ownerId: string, projectId: string) { return view(await live(ownerId, projectId)); },
    async list(ownerId: string, input: { filter: FilterName; limit: number; cursor?: string }) {
      const query: Document = { ownerId, deletedAt: null };
      if (input.filter !== 'all') query[`flags.${input.filter === 'needs_attention' ? 'needsAttention' : input.filter}`] = true;
      if (input.cursor) {
        try {
          const [payload, signature, extra] = input.cursor.split('.');
          const expected = Buffer.from(sign(payload)), actual = Buffer.from(signature ?? '');
          if (extra || actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error();
          const cursor = JSON.parse(Buffer.from(payload, 'base64url').toString());
          if (cursor.v !== 1 || cursor.ownerId !== ownerId || cursor.filter !== input.filter || cursor.route !== '/api/projects'
            || !Number.isFinite(cursor.expires) || cursor.expires <= Date.now() || !/^prj_[A-Za-z0-9_-]{16,64}$/.test(cursor.id)
            || typeof cursor.at !== 'string' || new Date(cursor.at).toISOString() !== cursor.at) throw new Error();
          query.$or = [{ updatedAt: { $lt: new Date(cursor.at) } }, { updatedAt: new Date(cursor.at), _id: { $lt: cursor.id } }];
        } catch { throw new ProjectError(400, 'INVALID_CURSOR', 'This cursor is invalid or expired. Refresh the list.'); }
      }
      const results = await projects.find(query).sort({ updatedAt: -1, _id: -1 }).limit(input.limit + 1).toArray();
      const hasMore = results.length > input.limit;
      const items = results.slice(0, input.limit), last = items.at(-1);
      let nextCursor: string | null = null;
      if (hasMore && last) {
        const payload = Buffer.from(JSON.stringify({ v: 1, ownerId, route: '/api/projects', filter: input.filter,
          at: last.updatedAt.toISOString(), id: last._id, expires: Date.now() + 86400000 })).toString('base64url');
        nextCursor = `${payload}.${sign(payload)}`;
      }
      return { data: items.map(view), page: { hasMore, nextCursor } };
    },
    async create(ownerId: string, key: string, input: { title: string }) {
      return command(ownerId, 'POST', '/api/projects', key, input, async session => {
        const now = new Date(), projectId = id('prj'), conversationId = id('cnv');
        const preferences = await db.collection('preferences').findOne({ ownerId }, { session });
        const voicePreset = preferences?.defaultVoicePreset ?? 'daniel-test';
        const content = { topic: '', audience: '', notes: '', voicePreset, editablePlan: null };
        const project = { _id: projectId, schemaVersion: 1, ownerId, title: input.title, revision: 1, draftRevision: 1,
          conversationId, deletedAt: null, contentRevision: Long.ONE,
          flags: { drafts: true, ready: false, scheduled: false, published: false, needsAttention: false }, createdAt: now, updatedAt: now };
        await projects.insertOne(project, { session });
        await db.collection<RecordDoc>('drafts').insertOne({ _id: id('dft'), schemaVersion: 1, ownerId, projectId,
          revision: 1, ...content, planStale: false, contentHash: hash(canonical(content)), canonicalizationVersion: 1,
          validationIssues: [], createdAt: now, updatedAt: now }, { session });
        await db.collection<RecordDoc>('conversations').insertOne({ _id: conversationId, schemaVersion: 1, ownerId, projectId,
          kind: 'project', nextSequence: Long.ONE, createdAt: now, updatedAt: now }, { session });
        return { projectId, status: 201, data: view(project) };
      });
    },
    async rename(ownerId: string, projectId: string, input: { expectedRevision: number; title: string }) {
      return inTransaction(client, async session => {
        const project = await live(ownerId, projectId, session);
        if (project.revision !== input.expectedRevision) throw conflict(project);
        const updated = await projects.findOneAndUpdate({ _id: projectId, ownerId, deletedAt: null, revision: input.expectedRevision }, {
          $set: { title: input.title, updatedAt: new Date() }, $inc: { revision: 1, contentRevision: Long.ONE },
        }, { session, returnDocument: 'after' });
        if (!updated) throw conflict(project);
        return view(updated);
      });
    },
    async remove(ownerId: string, projectId: string, key: string, input: { expectedRevision: number; confirm: true }) {
      return command(ownerId, 'DELETE', `/api/projects/${projectId}`, key, input, async session => {
        const project = await live(ownerId, projectId, session);
        if (project.revision !== input.expectedRevision) throw conflict(project);
        const draft = await db.collection('drafts').findOne({ ownerId, projectId }, { session });
        const conversation = await db.collection('conversations').findOne({ ownerId, projectId }, { session });
        // Never claim successful external cleanup before the durable job/media features exist.
        if (project.activeJobId || project.currentStoryboardId || project.latestReadyVideoId || project.selectedVideoId
          || Object.entries(project.flags).some(([flag, value]) => flag !== 'drafts' && value)
          || project.draftRevision !== 1 || !draft || draft.revision !== 1 || draft.topic || draft.notes || draft.audience || draft.editablePlan
          || !conversation || !Long.ONE.equals(conversation.nextSequence)) {
          throw new ProjectError(409, 'PROJECT_DELETE_UNAVAILABLE', 'This project requires the forthcoming content cleanup workflow.');
        }
        await projects.updateOne({ _id: projectId, ownerId, deletedAt: null, revision: input.expectedRevision }, {
          $set: { title: 'Deleted project', deletedAt: new Date(), updatedAt: new Date(), flags: { drafts: false, ready: false, scheduled: false, published: false, needsAttention: false } },
          $inc: { revision: 1, contentRevision: Long.ONE },
        }, { session });
        await db.collection('drafts').deleteMany({ ownerId, projectId }, { session });
        await db.collection('conversations').deleteMany({ ownerId, projectId }, { session });
        // Scrub accepted create snapshots while retaining a minimal, permanent key tombstone.
        await commands.updateMany({ ownerId, projectId }, { $set: { response: null, updatedAt: new Date() } }, { session });
        return { projectId, status: 204, data: null };
      });
    },
  };
}
