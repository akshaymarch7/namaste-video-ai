import 'server-only';
import { createHash,randomUUID } from 'node:crypto';
import {applyStoryboard,inspectEditablePlan} from '../storyboards/editable-contract';
import {assertEditableDraftsReady} from './edit-setup';
import type {z} from 'zod';
import { Long, type Db, type MongoClient, type Document, type ClientSession } from 'mongodb';
import { inTransaction } from '../db/client';
import { canonical } from '../projects/service';
import { ProjectError } from '../projects/contracts';
import { fieldsOf, selectableVoices, type DraftPatch, type DraftView,sameIdea } from './contracts';
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
      editablePlan: draft.editablePlan, sourceStoryboardId: draft.sourceStoryboardId??null, planStale: draft.planStale, contentHash: draft.contentHash,
      validation: inspectEditablePlan(draft.editablePlan,{notes:draft.notes,voicePreset:draft.voicePreset},draft.planStale),
      updatedAt: draft.updatedAt.toISOString() };
  }
  return {
    apply:(ownerId:string,projectId:string,key:string,input:z.infer<typeof applyStoryboard>)=>inTransaction(client,async session=>{
      await assertEditableDraftsReady(db);
      const {project,draft}=await read(ownerId,projectId,session);
      const keyHash=createHash('sha256').update(key).digest('hex'),requestHash=createHash('sha256').update(canonical(input)).digest('hex');
      const commands=db.collection<Doc>('draftCommands');
      const previous=await commands.findOne({ownerId,projectId,keyHash},{session});
      if(previous){if(previous.requestHash!==requestHash)throw new ProjectError(409,'IDEMPOTENCY_KEY_REUSED','Use a new key for different input.');return {data:previous.response as DraftView,replayed:true};}
      if(draft.revision!==input.expectedDraftRevision)throw new ProjectError(409,'REVISION_CONFLICT','The draft changed. Reload before applying.',{currentRevision:draft.revision});
      const candidate=await db.collection<Doc>('storyboards').findOne({_id:input.storyboardId,ownerId,projectId},{session});
      if(!candidate)throw new ProjectError(404,'NOT_FOUND','Storyboard not found.');
      if(candidate.contentHash!==input.expectedContentHash)throw new ProjectError(409,'HASH_MISMATCH','Reload the candidate.');
      if(candidate.content.voicePreset!==draft.voicePreset)throw new ProjectError(422,'VOICE_UNAVAILABLE','Candidate voice does not match the saved idea.');
      const content={...fieldsOf(draft as unknown as DraftView),editablePlan:candidate.content};
      const updated={...draft,...content,sourceStoryboardId:candidate._id,planStale:candidate.sourceDraftRevision!==draft.revision,revision:draft.revision+1,updatedAt:new Date(),contentHash:createHash('sha256').update(canonical(content)).digest('hex')};
      const child=await drafts.replaceOne({_id:draft._id,ownerId,revision:draft.revision},updated,{session});
      if(!child.matchedCount)throw new Error('Draft apply revision fence');
      const parent=await projects.updateOne({_id:projectId,ownerId,deletedAt:null,draftRevision:draft.revision},{$set:{draftRevision:updated.revision,currentStoryboardId:candidate._id,updatedAt:updated.updatedAt,'flags.drafts':true},$inc:{contentRevision:Long.ONE}},{session});
      if(!parent.matchedCount)throw new Error('Draft apply parent fence');
      const data=view(project,updated);
      await commands.insertOne({_id:`cmd_${randomUUID().replaceAll('-','')}`,ownerId,projectId,keyHash,requestHash,response:data,createdAt:updated.updatedAt},{session});
      return {data,replayed:false};
    }),
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
      if(input.changes.editablePlan!==undefined){
        await assertEditableDraftsReady(db);
        if(input.changes.editablePlan&&!draft.sourceStoryboardId)throw new ProjectError(409,'STORYBOARD_REQUIRED','Apply a saved candidate before editing.');
      }
      const content = { ...fieldsOf(draft as unknown as DraftView), editablePlan:draft.editablePlan, ...input.changes };
      if(content.editablePlan&&content.editablePlan.voicePreset!==content.voicePreset)throw new ProjectError(422,'VOICE_UNAVAILABLE','Working storyboard voice must match the saved idea.');
      const planStale=!!content.editablePlan&&(draft.planStale||!sameIdea(content,draft as unknown as DraftView));
      const provenance=input.changes.editablePlan===null?{sourceStoryboardId:null}:{};
      const updatedAt = new Date(), revision = draft.revision + 1;
      const contentHash = createHash('sha256').update(canonical(content)).digest('hex');
      // Writing the live parent fences rename/delete and future child writers in the same transaction.
      const parent = await projects.updateOne({ _id: projectId, ownerId, deletedAt: null, draftRevision: input.expectedRevision }, {
        $set: { draftRevision: revision, updatedAt, 'flags.drafts': true }, $inc: { contentRevision: Long.ONE },
      }, { session });
      if(input.changes.editablePlan===null)await projects.updateOne({_id:projectId,ownerId},{$unset:{currentStoryboardId:''}},{session});
      if (!parent.matchedCount) throw new Error('Draft parent fence');
      const updated = await drafts.findOneAndUpdate({ _id: draft._id, ownerId, revision: input.expectedRevision }, {
        $set: { ...content, ...provenance, planStale, contentHash, updatedAt, revision },
      }, { session, returnDocument: 'after' });
      if (!updated) throw new Error('Draft revision fence');
      return view(project, updated);
    }),
  };
}
