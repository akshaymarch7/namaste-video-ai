import 'server-only';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { Long, type Db, type MongoClient, type Document } from 'mongodb';
import { inTransaction } from '../db/client';
import { canonical } from '../projects/service';
import { ProjectError } from '../projects/contracts';
import { fieldsOf, type IdeaFields } from '../drafts/contracts';
import { liveProject } from '../generation/live-project';
import { ProviderError } from '../ideas/providers';
import { validateStoryboard, StoryboardInvalid, type Storyboard } from './contracts';
import { plannerPromptVersion } from './planner';
import type { StoryboardReceipt } from './api-contracts';
type Doc = Document & { _id: string };
export type StoryboardProvider = { model: string; run(input: IdeaFields, context: { requestId: string }): Promise<{ content: unknown }> };
const hash = (value: unknown) => createHash('sha256').update(canonical(value)).digest('hex');
export function storyboardHashes(content: Storyboard) {
  // Retain all semantic text/data/order; omit animation timing/presentation events.
  const { scenes, ...semantic } = content;
  return { contentHash: hash(content), storyHash: hash({ ...semantic, scenes: scenes.map(({ events: _events, ...scene }) => scene) }) };
}
function receipt(doc: Doc): StoryboardReceipt {
  return { id: doc._id, projectId: doc.projectId, state: doc.state, sourceDraftRevision: doc.sourceDraftRevision, model: doc.model,
    storyboardId: doc.storyboardId, errorCode: doc.errorCode, createdAt: doc.createdAt.toISOString(), updatedAt: doc.updatedAt.toISOString(), deadline: doc.deadline.toISOString() };
}
function summary(doc: Doc, revision: number) {
  return { id: doc._id, projectId: doc.projectId, parentId: null, sourceDraftRevision: doc.sourceDraftRevision, state: 'review_ready' as const,
    title: doc.content.title as string, contentHash: doc.contentHash as string, storyHash: doc.storyHash as string,
    estimatedDurationSeconds: doc.estimatedDurationSeconds as number, wordCount: doc.wordCount as number,
    stale: doc.sourceDraftRevision !== revision, warnings: [], changeSummary: null, changedSceneIds: [], approvalId: null, createdAt: doc.createdAt.toISOString() };
}
export function storyboardService(db: Db, client: MongoClient, secret: string, provider: () => StoryboardProvider, now = () => new Date()) {
  const requests = db.collection<Doc>('storyboardRequests'), candidates = db.collection<Doc>('storyboards'), projects = db.collection<Doc>('projects');
  const live = (ownerId: string, projectId: string, session: Parameters<typeof liveProject>[3]) => liveProject(db, ownerId, projectId, session, now());
  const sign = (payload: string) => createHmac('sha256', secret).update(`storyboards-cursor-v1:${payload}`).digest('base64url');
  return {
    latest: (ownerId: string, projectId: string) => inTransaction(client, async session => {
      await live(ownerId, projectId, session);
      const doc = await requests.findOne({ ownerId, projectId }, { sort: { createdAt: -1, _id: -1 }, session });
      return doc ? receipt(doc) : null;
    }),
    get: (ownerId: string, id: string) => inTransaction(client, async session => {
      const doc = await candidates.findOne({ _id: id, ownerId }, { session });
      if (!doc) throw new ProjectError(404, 'NOT_FOUND', 'Storyboard not found.');
      const parent = await live(ownerId, doc.projectId, session);
      return { ...summary(doc, parent.draftRevision), content: doc.content as Storyboard };
    }),
    list: (ownerId: string, projectId: string, input: {limit: number; cursor?: string}) => inTransaction(client, async session => {
      const parent = await live(ownerId, projectId, session);
      const query: Document = { ownerId, projectId };
      if (input.cursor) {
        try {
          const [payload, signature, extra] = input.cursor.split('.');
          const expected = Buffer.from(sign(payload)), actual = Buffer.from(signature ?? '');
          if (extra || actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw Error();
          const cursor = JSON.parse(Buffer.from(payload, 'base64url').toString());
          if (cursor.v !== 1 || cursor.ownerId !== ownerId || cursor.projectId !== projectId || !Number.isFinite(cursor.expires) || cursor.expires <= now().getTime()
            || !/^stb_[a-f0-9]{32}$/.test(cursor.id) || typeof cursor.at !== 'string' || new Date(cursor.at).toISOString() !== cursor.at) throw Error();
          query.$or = [{createdAt: {$lt: new Date(cursor.at)}}, {createdAt: new Date(cursor.at), _id: {$lt: cursor.id}}];
        } catch { throw new ProjectError(400, 'INVALID_CURSOR', 'Refresh this storyboard list.'); }
      }
      const results = await candidates.find(query, {session}).sort({createdAt:-1,_id:-1}).limit(input.limit+1).toArray();
      const hasMore = results.length > input.limit, items = results.slice(0,input.limit), last = items.at(-1);
      let nextCursor: string | null = null;
      if (hasMore && last) {
        const payload = Buffer.from(JSON.stringify({v:1,ownerId,projectId,at:last.createdAt.toISOString(),id:last._id,expires:now().getTime()+86400000})).toString('base64url');
        nextCursor = `${payload}.${sign(payload)}`;
      }
      return {data:items.map(doc=>summary(doc,parent.draftRevision)),page:{hasMore,nextCursor}};
    }),
    async create(ownerId: string, projectId: string, key: string, input: {expectedDraftRevision: number}) {
      const requestHash = hash({method:'POST',path:`/api/projects/${projectId}/storyboards`,body:input}), keyHash = hash(key);
      const claim = await inTransaction(client, async session => {
        const parent = await live(ownerId, projectId, session);
        const old = await requests.findOne({ownerId,projectId,keyHash},{session});
        if (old) {
          if (old.requestHash !== requestHash) throw new ProjectError(409,'IDEMPOTENCY_KEY_REUSED','Use a new key for different input.');
          return {replay:receipt(old)};
        }
        if (parent.draftRevision !== input.expectedDraftRevision) throw new ProjectError(409,'REVISION_CONFLICT','Save and reload your idea before generating.');
        if (parent.activeJobId) throw new ProjectError(409,'PROJECT_BUSY','This project already has a request in progress.');
        const draft = await db.collection('drafts').findOne({ownerId,projectId,revision:input.expectedDraftRevision},{session});
        if (!draft) throw new ProjectError(409,'REVISION_CONFLICT','Reload your idea.');
        if (!draft.topic.trim()) throw new ProjectError(422,'INVALID_DRAFT','Save a topic before generating.');
        if (draft.voicePreset !== 'daniel-test') throw new ProjectError(422,'VOICE_UNAVAILABLE','Select an available voice.');
        const adapter = provider(), date = now(), id = `job_${randomUUID().replaceAll('-','')}`;
        const doc = {_id:id,schemaVersion:1,ownerId,projectId,keyHash,requestHash,model:adapter.model,sourceDraftRevision:draft.revision,
          state:'running',storyboardId:null,errorCode:null,createdAt:date,updatedAt:date,deadline:new Date(date.getTime()+75000)};
        await projects.updateOne({_id:projectId,ownerId,deletedAt:null},{$set:{activeJobId:id,updatedAt:date},$inc:{contentRevision:Long.ONE}},{session});
        await requests.insertOne(doc,{session});
        return {doc,adapter,draft:fieldsOf(draft as unknown as IdeaFields)};
      });
      if ('replay' in claim) return {data:claim.replay!,replayed:true};
      let result: ReturnType<typeof validateStoryboard> | undefined, state = 'completed', errorCode: string | null = null;
      try { result = validateStoryboard((await claim.adapter.run(claim.draft,{requestId:claim.doc._id})).content,claim.draft); }
      catch (error) {
        const known = new Set(['STORYBOARD_INVALID','PROVIDER_OUTCOME_UNKNOWN','PROVIDER_LIMIT','PROVIDER_AUTHORIZATION','PROVIDER_CONFIGURATION','PROVIDER_UNAVAILABLE','PROVIDER_RESPONSE_INVALID']);
        errorCode = error instanceof StoryboardInvalid ? 'STORYBOARD_INVALID' : error instanceof ProviderError && known.has(error.code) ? error.code : 'PROVIDER_OUTCOME_UNKNOWN';
        state = errorCode === 'PROVIDER_OUTCOME_UNKNOWN' ? 'unknown' : 'failed';
      }
      // Provider work is never inside a retryable transaction. Candidate + receipt + fence commit together.
      return inTransaction(client, async session => {
        const parent = await live(ownerId,projectId,session);
        const current = await requests.findOne({_id:claim.doc._id,ownerId,projectId},{session});
        if (!current) throw Error('Missing storyboard receipt');
        if (current.state !== 'running' || parent.activeJobId !== current._id) return {data:receipt(current),replayed:false};
        const date = now(); let storyboardId: string | null = null;
        if (result) {
          storyboardId = `stb_${randomUUID().replaceAll('-','')}`;
          await candidates.insertOne({_id:storyboardId,schemaVersion:1,ownerId,projectId,sourceDraftRevision:current.sourceDraftRevision,
            ...result,...storyboardHashes(result.content),canonicalizationVersion:1,state:'review_ready',
            plannerConfig:{provider:'gemini',model:current.model,promptVersion:plannerPromptVersion},createdByJobId:current._id,createdAt:date,updatedAt:date},{session});
        }
        await requests.updateOne({_id:current._id,state:'running'},{$set:{state,storyboardId,errorCode,updatedAt:date}},{session});
        await projects.updateOne({_id:projectId,ownerId,activeJobId:current._id},{$unset:{activeJobId:''},$inc:{contentRevision:Long.ONE}},{session});
        return {data:receipt({...current,state,storyboardId,errorCode,updatedAt:date}),replayed:false};
      });
    },
  };
}
