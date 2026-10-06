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
import { StoryboardPlanningError, type PlanningProgress, plannerPromptVersion } from './planner';
import {revisionPromptVersion,revisionDiff,validateRevision} from './revisions';
import type {RevisionInstruction} from './revision-input';
import type {RevisionRequest} from './api-contracts';
import type { StoryboardReceipt } from './api-contracts';
type Doc = Document & { _id: string };
export type StoryboardProvider = { model: string; run(input: IdeaFields, context: { requestId: string; revision?:{source:Storyboard;request:RevisionInstruction}; deadline:number; progress:(value:PlanningProgress)=>Promise<void> }): Promise<{ content: unknown }> };
const hash = (value: unknown) => createHash('sha256').update(canonical(value)).digest('hex');
export function storyboardHashes(content: Storyboard) {
  // Retain all semantic text/data/order; omit animation timing/presentation events.
  const { scenes, ...semantic } = content;
  return { contentHash: hash(content), storyHash: hash({ ...semantic, scenes: scenes.map(({ events: _events, ...scene }) => scene) }) };
}
function receipt(doc: Doc): StoryboardReceipt {
  return { id: doc._id, projectId: doc.projectId, state: doc.state, sourceDraftRevision: doc.sourceDraftRevision, model: doc.model,
    storyboardId: doc.storyboardId, errorCode: doc.errorCode, createdAt: doc.createdAt.toISOString(), updatedAt: doc.updatedAt.toISOString(), deadline: doc.deadline.toISOString(), ...(doc.stage ? {stage:doc.stage,attempt:doc.attempt,issueCodes:doc.issueCodes} : {}) };
}
function summary(doc: Doc, revision: number, lineage?:{source:Doc;command:Doc}, approvalId:string|null=null) {
  const diff=lineage?revisionDiff(lineage.source.content,doc.content):null;
  return { origin:doc.plannerConfig.provider==='manual'?'manual' as const:'generated' as const, id: doc._id, projectId: doc.projectId, parentId: lineage?.source._id??null, sourceDraftRevision: doc.sourceDraftRevision, state: approvalId?'approved' as const:'review_ready' as const,
    title: doc.content.title as string, contentHash: doc.contentHash as string, storyHash: doc.storyHash as string,
    estimatedDurationSeconds: doc.estimatedDurationSeconds as number, wordCount: doc.wordCount as number,
    stale: doc.sourceDraftRevision !== revision, warnings: [], changeSummary: diff?`Updated ${diff.changedSceneIds.length} scene(s)${diff.changedFields.length?` and ${diff.changedFields.join(", ")}`:""}. Review before applying.`:null, changedSceneIds: diff?.changedSceneIds??[], approvalId, createdAt: doc.createdAt.toISOString() };
}
export function storyboardService(db: Db, client: MongoClient, secret: string, provider: () => StoryboardProvider, now = () => new Date(), background = false) {
  const requests = db.collection<Doc>('storyboardRequests'), candidates = db.collection<Doc>('storyboards'), projects = db.collection<Doc>('projects');
  const live = (ownerId: string, projectId: string, session: Parameters<typeof liveProject>[3]) => liveProject(db, ownerId, projectId, session, now());
  const sign = (payload: string) => createHmac('sha256', secret).update(`storyboards-cursor-v1:${payload}`).digest('base64url');
  async function lineage(ownerId:string,projectId:string,jobId:string,session?:Parameters<typeof liveProject>[3]) {
    const command=await db.collection<Doc>('storyboardRevisions').findOne({_id:jobId,ownerId,projectId},{session})??await db.collection<Doc>('storyboardSnapshots').findOne({_id:jobId,ownerId,projectId},{session});
    if(!command)return undefined;
    const source=await candidates.findOne({_id:command.sourceStoryboardId,ownerId,projectId},{session});
    if(!source||storyboardHashes(source.content).contentHash!==command.sourceContentHash)throw new ProjectError(409,'SOURCE_CHANGED','The source storyboard could not be verified.');
    return {source,command};
  }
  async function approval(doc:Doc,session:Parameters<typeof liveProject>[3]) {
    const saved=await db.collection<Doc>('approvals').findOne({ownerId:doc.ownerId,projectId:doc.projectId,kind:'story',subjectId:doc._id,contentHash:doc.contentHash,subjectHash:doc.storyHash,canonicalizationVersion:doc.canonicalizationVersion},{session,projection:{_id:1}});
    return saved? saved._id:null;
  }
  async function execute(ownerId:string,projectId:string,claim:{doc:Doc;adapter:StoryboardProvider;draft:IdeaFields}) {
      let result: ReturnType<typeof validateStoryboard> | undefined, state = 'completed', errorCode: string | null = null, issueCodes:string[]=[];
      let revision:Awaited<ReturnType<typeof lineage>>;
      try {
        revision=await lineage(ownerId,projectId,claim.doc._id);
        const acceptedBody=revision?{expectedDraftRevision:claim.doc.sourceDraftRevision,source:{kind:'storyboard',id:revision.command.sourceStoryboardId,hash:revision.command.sourceContentHash},instruction:revision.command.instruction,...(revision.command.sceneId?{sceneId:revision.command.sceneId}:{})}:{expectedDraftRevision:claim.doc.sourceDraftRevision};
        if(hash({method:'POST',path:`/api/projects/${projectId}/${revision?'revisions':'storyboards'}`,body:acceptedBody})!==claim.doc.requestHash)throw new ProjectError(409,'SOURCE_CHANGED','The accepted request snapshot could not be verified.');
        const revisionContext=revision?{source:validateStoryboard(revision.source.content,claim.draft).content,request:{instruction:revision.command.instruction,...(revision.command.sceneId?{sceneId:revision.command.sceneId}:{})}}:undefined;
        const output=await claim.adapter.run(claim.draft,{requestId:claim.doc._id,...(revisionContext?{revision:revisionContext}:{}),deadline:claim.doc.deadline.getTime(),progress:async value=>{
        const updated=await requests.updateOne({_id:claim.doc._id,state:'running',deadline:{$gt:now()}},{$set:{...value,updatedAt:now()}});
        if(!updated.matchedCount)throw new ProviderError('PLANNING_DEADLINE');
      }});
        result=revisionContext?validateRevision(output.content,revisionContext.source,claim.draft,revisionContext.request.sceneId):validateStoryboard(output.content,claim.draft);
      }
      catch (error) {
        if(error instanceof StoryboardPlanningError)issueCodes=[...new Set(error.issues.map(i=>i.code))].slice(0,30);
        const known = new Set(['STORYBOARD_INVALID','PROVIDER_OUTCOME_UNKNOWN','PROVIDER_LIMIT','PROVIDER_AUTHORIZATION','PROVIDER_CONFIGURATION','PROVIDER_UNAVAILABLE','PROVIDER_RESPONSE_INVALID','PLANNING_DEADLINE','ACCESS_DISABLED']);
        errorCode = error instanceof ProjectError && error.code==='SOURCE_CHANGED' ? 'SOURCE_CHANGED' : error instanceof StoryboardInvalid ? 'STORYBOARD_INVALID' : error instanceof ProviderError && known.has(error.code) ? error.code : 'PROVIDER_OUTCOME_UNKNOWN';
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
            plannerConfig:{provider:'gemini',model:current.model,promptVersion:revision?revisionPromptVersion:plannerPromptVersion},createdByJobId:current._id,createdAt:date,updatedAt:date},{session});
        }
        await requests.updateOne({_id:current._id,state:'running'},{$set:{state,storyboardId,errorCode,...(current.stage?{stage:state==='completed'?'ready':'stopped',issueCodes}:{}),updatedAt:date}},{session});
        await projects.updateOne({_id:projectId,ownerId,activeJobId:current._id},{$unset:{activeJobId:''},$inc:{contentRevision:Long.ONE}},{session});
        return {data:receipt({...current,state,storyboardId,errorCode,...(current.stage?{stage:state==='completed'?'ready':'stopped',issueCodes}:{}),updatedAt:date}),replayed:false};
      });
  }
  return {
    execute,
    latest: (ownerId: string, projectId: string) => inTransaction(client, async session => {
      await live(ownerId, projectId, session);
      const doc = await requests.findOne({ ownerId, projectId }, { sort: { createdAt: -1, _id: -1 }, session });
      return doc ? receipt(doc) : null;
    }),
    get: (ownerId: string, id: string) => inTransaction(client, async session => {
      const doc = await candidates.findOne({ _id: id, ownerId }, { session });
      if (!doc) throw new ProjectError(404, 'NOT_FOUND', 'Storyboard not found.');
      const parent = await live(ownerId, doc.projectId, session);
      return { ...summary(doc, parent.draftRevision,await lineage(ownerId,doc.projectId,doc.createdByJobId,session),await approval(doc,session)), content: doc.content as Storyboard };
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
      const data=[];for(const doc of items)data.push(summary(doc,parent.draftRevision,await lineage(ownerId,projectId,doc.createdByJobId,session),await approval(doc,session)));
      return {data,page:{hasMore,nextCursor}};
    }),
    async create(ownerId: string, projectId: string, key: string, input: {expectedDraftRevision: number}|RevisionRequest) {
      const revision='source' in input?input:undefined;
      const requestHash = hash({method:'POST',path:`/api/projects/${projectId}/${revision?"revisions":"storyboards"}`,body:input}), keyHash = hash(key);
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
        if(revision){
          const source=await candidates.findOne({_id:revision.source.id,ownerId,projectId},{session});
          if(!source)throw new ProjectError(404,'NOT_FOUND','Storyboard not found.');
          if(source.contentHash!==revision.source.hash||storyboardHashes(source.content).contentHash!==revision.source.hash)throw new ProjectError(409,'SOURCE_CHANGED','Reload the source storyboard.');
          // Applying a candidate increments the draft revision, so allow that exact
          // fresh working copy as well as an untouched source revision.
          const applied=!draft.planStale&&draft.sourceStoryboardId===source._id&&draft.editablePlan&&hash(draft.editablePlan)===source.contentHash;
          if(source.sourceDraftRevision!==draft.revision&&!applied)throw new ProjectError(409,'SOURCE_CHANGED','The draft changed since this candidate. Review a current source before revising.');
          try{validateStoryboard(source.content,fieldsOf(draft as unknown as IdeaFields));}catch{throw new ProjectError(422,'INVALID_DRAFT','The source is not valid for the saved idea.');}
          if(revision.sceneId&&!source.content.scenes.some((scene:Storyboard['scenes'][number])=>scene.id===revision.sceneId))throw new ProjectError(422,'INVALID_SCENE','Select a scene from the source storyboard.');
        }
        const adapter = provider(), date = now(), id = `job_${randomUUID().replaceAll('-','')}`;
        const doc = {_id:id,schemaVersion:1,ownerId,projectId,keyHash,requestHash,model:adapter.model,sourceDraftRevision:draft.revision,
          state:'running',storyboardId:null,errorCode:null,...(background?{stage:'queued',attempt:0,issueCodes:[]}:{}),createdAt:date,updatedAt:date,deadline:new Date(date.getTime()+180000)};
        await projects.updateOne({_id:projectId,ownerId,deletedAt:null},{$set:{activeJobId:id,updatedAt:date},$inc:{contentRevision:Long.ONE}},{session});
        await requests.insertOne(doc,{session});
        if(revision)await db.collection<Doc>('storyboardRevisions').insertOne({_id:id,ownerId,projectId,sourceStoryboardId:revision.source.id,sourceContentHash:revision.source.hash,instruction:revision.instruction,sceneId:revision.sceneId??null,createdAt:date},{session});
        if(background)await db.collection<Doc>('storyboardQueue').insertOne({_id:id,ownerId,projectId,model:adapter.model,state:'queued',draft:fieldsOf(draft as unknown as IdeaFields),createdAt:date,deadline:doc.deadline},{session});
        return {doc,adapter,draft:fieldsOf(draft as unknown as IdeaFields)};
      });
      if ('replay' in claim) return {data:claim.replay!,replayed:true};
      if(background)return {data:receipt(claim.doc),replayed:false};
      return execute(ownerId,projectId,claim);

    },
  };
}
