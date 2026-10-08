import {publishingPaths} from '../publishing/openapi';
import {instagramPaths} from '../instagram/openapi';
import {preferencePaths} from '../preferences/openapi';
import {videoPaths} from '../videos/openapi';
import {jobPaths} from '../jobs/openapi';
import {storagePaths} from '../storage/openapi';
import {editableStoryboardSchema,applyStoryboard} from '../storyboards/editable-contract';
import { storyboardPaths } from '../storyboards/openapi';
import { z } from 'zod';
import { ideaRequestSchema, suggestionSchema } from '../ideas/contracts';
import { patchDraft } from '../drafts/contracts';
import { createProject, renameProject, deleteProject, projectId, idempotencyKey, filters } from './contracts';
const schema = (value: z.ZodType) => z.toJSONSchema(value, { io: 'input' });
const nullableId = { anyOf: [{ type: 'string' }, { type: 'null' }] };
const project = { type: 'object', additionalProperties: false,
  required: ['id','title','revision','draftRevision','conversationId','currentStoryboardId','latestReadyVideoId','selectedVideoId','activeJobId','flags','createdAt','updatedAt'],
  properties: { id: schema(projectId), title: { type: 'string', minLength: 1, maxLength: 100 }, revision: { type: 'integer', minimum: 1 }, draftRevision: { type: 'integer', minimum: 1 }, conversationId: { type: 'string' },
    ...Object.fromEntries(['currentStoryboardId','latestReadyVideoId','selectedVideoId','activeJobId'].map(key => [key, nullableId])),
    flags: { type: 'object', additionalProperties: false, required: ['drafts','ready','scheduled','published','needsAttention'], properties: Object.fromEntries(['drafts','ready','scheduled','published','needsAttention'].map(key => [key, { type: 'boolean' }])) },
    nextSchedule: {anyOf:[{type:'null'},{type:'object',required:['intentId','videoId','localTime','timezone','utcOffset','utc'],properties:Object.fromEntries(['intentId','videoId','localTime','timezone','utcOffset','utc'].map(key=>[key,{type:'string'}]))}]},
    createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
  } };
const meta = { type: 'object', required: ['requestId'], properties: { requestId: { type: 'string' } } };
const content = (value: unknown) => ({ 'application/json': { schema: value } });
const responseHeaders = { 'X-Request-Id': { schema: { type: 'string' } }, 'Cache-Control': { schema: { type: 'string', const: 'private, no-store' } } };
const errorResponse = { description: 'Safe error envelope; see API_DESIGN.md for error codes.', headers: responseHeaders, content: content({ type: 'object', required: ['error','meta'], properties: { error: { type: 'object', required: ['code','message','requestId','retryable'], properties: { code: { type: 'string' }, message: { type: 'string' }, requestId: { type: 'string' }, retryable: { type: 'boolean' }, details: { type: 'object' } } }, meta } }) };
const errors = Object.fromEntries([400,401,403,404,409,413,415,422,503].map(status => [status, { $ref: '#/components/responses/Error' }]));
const projectRef = { $ref: '#/components/schemas/Project' };
const body = (value: z.ZodType) => ({ required: true, content: content(schema(value)) });
const mutation = [{ in: 'header', name: 'Origin', required: true, schema: { type: 'string' }, description: 'Must exactly match configured application origin.' }];
const keyed = [...mutation, { in: 'header', name: 'Idempotency-Key', required: true, schema: schema(idempotencyKey) }];
const envelope = { type: 'object', required: ['data','meta'], properties: { data: projectRef, meta } };
const ideaResponse = { description: 'Latest request receipt, or null when absent. Running returns 202; terminal receipts return 200.', headers: responseHeaders, content: content({ type: 'object', required: ['data','meta'], properties: { meta, data: { anyOf: [{ type: 'null' }, { type: 'object', additionalProperties: false, required: ['id','state','sourceDraftRevision','model','suggestions','errorCode','createdAt'], properties: { id: { type: 'string' }, state: { enum: ['running','completed','failed','unknown'] }, sourceDraftRevision: { type: 'integer', minimum: 1 }, model: { type: 'string' }, suggestions: { type: 'array', maxItems: 5, items: schema(suggestionSchema) }, errorCode: nullableId, createdAt: { type: 'string', format: 'date-time' } } }] } } }) };
const success = (description: string) => ({ description, headers: responseHeaders, content: content(envelope) });
export function projectsOpenApi() {
  // Zod custom Unicode refinement is represented explicitly in the exported JSON Schema.
  const create = body(createProject), rename = body(renameProject);
  for (const request of [create, rename]) {
    const value = request.content['application/json'].schema as { properties: Record<string, object> };
    Object.assign(value.properties.title, { minLength: 1, maxLength: 100, description: 'Trimmed plain text, 1–100 Unicode code points.' });
  }
  const draftRequest = body(patchDraft);
  const changes = (draftRequest.content['application/json'].schema as { properties: { changes: { minProperties?: number; properties: Record<string, object> } } }).properties.changes;
  changes.minProperties = 1;
  for (const [key, maxLength] of Object.entries({ topic: 2000, audience: 200, notes: 20000 })) Object.assign(changes.properties[key], { maxLength, description: 'Unicode code points; whitespace preserved.' });
  const draftResponse = { description: 'Current working draft. Validation describes structural/content checks, not approval or factual accuracy.', headers: responseHeaders, content: content({ type: 'object', required: ['data', 'meta'], properties: { meta, data: {
    type: 'object', additionalProperties: false,
    required: ['projectId','conversationId','revision','topic','audience','notes','voicePreset','editablePlan','sourceStoryboardId','planStale','contentHash','validation','updatedAt'],
    properties: { projectId: schema(projectId), conversationId: { type: 'string' }, revision: { type: 'integer', minimum: 1 },
      topic: { type: 'string', maxLength: 2000 }, audience: { type: 'string', maxLength: 200 }, notes: { type: 'string', maxLength: 20000 }, voicePreset: { type: 'string', maxLength: 64 },
      editablePlan: schema(editableStoryboardSchema.nullable()), sourceStoryboardId: { type: ['string','null'] }, planStale: { type: 'boolean' }, contentHash: { type: 'string', pattern: '^[a-f0-9]{64}$' }, updatedAt: { type: 'string', format: 'date-time' },
      validation: { type: 'object', required: ['valid','issues'], properties: { valid: { type: 'boolean' }, issues: { type: 'array', items: { type: 'object', required: ['path','code','message'], properties: { path: { type: 'string' }, code: { type: 'string' }, message: { type: 'string' } } } } } },
    },
  } } }) };
  return { openapi: '3.1.0', info: { title: 'NamasteVideo project and idea draft API', version: '0.4.0', description: 'Implemented slice only. DELETE completes synchronously for empty projects (204); populated project cleanup is not yet supported. Video selection uses its dedicated version command.' },
    servers: [{ url: '/' }], security: [{ session: [] }], components: { schemas: { Project: project }, responses: { Error: errorResponse }, securitySchemes: { session: { type: 'apiKey', in: 'cookie', name: 'better-auth.session_token', description: 'Better Auth HttpOnly session cookie; production uses its __Secure- prefix. Obtain it via the session facade.' } } },
    paths: {
      ...storyboardPaths(),
      ...storagePaths(),
      ...jobPaths(),
      ...videoPaths(),
      ...preferencePaths(),
      ...instagramPaths(),
      ...publishingPaths(),
      '/api/projects/{id}/draft/apply':{parameters:[{in:'path',name:'id',required:true,schema:schema(projectId)}],post:{operationId:'applyStoryboardToDraft',description:'Explicit immutable candidate copy into the working draft. Shared revision and exact content hash required. Same-key replay returns the original snapshot, even after subsequent edits; reread the draft for current state. No approval or provider call.',parameters:keyed,requestBody:body(applyStoryboard),responses:{...errors,200:draftResponse}}},
      '/api/projects/{id}/idea-suggestions': {
        parameters: [{ in: 'path', name: 'id', required: true, schema: schema(projectId) }],
        get: { operationId: 'getLatestIdeaSuggestions', responses: { ...errors, 200: ideaResponse, 202: ideaResponse } },
        post: { operationId: 'requestIdeaSuggestions', description: 'Bounded synchronous Gemini request with durable receipt. Same-key replay never repeats the provider call. Deadline expiry becomes unknown; explicit new requests may consume credits again. Does not edit the draft or create an Inngest job.', parameters: keyed, requestBody: body(ideaRequestSchema), responses: { ...errors, 200: ideaResponse, 202: ideaResponse } },
      },
      '/api/voices': { get: { operationId: 'getVoiceCatalog', responses: { ...errors, 200: { description: 'Daniel test preset only; not a provider entitlement check.', headers: responseHeaders, content: content({ type: 'object', required: ['data','meta'], properties: { meta, data: { type: 'object', required: ['defaultPreset','voices'], properties: { defaultPreset: { const: 'daniel-test' }, voices: { type: 'array', items: { type: 'object', required: ['preset','label','accent','testOnly','previewPath'], properties: { preset: { const: 'daniel-test' }, label: { const: 'Daniel' }, accent: { const: 'English' }, testOnly: { const: true }, previewPath: { const: '/api/voices/daniel-test/preview' } } } } } } } }) } } } },
      '/api/voices/daniel-test/preview': { get: { operationId: 'getDanielSample', responses: { ...errors, 200: { description: 'Authenticated proxy of an existing provider MP3 sample, at most 2 MiB. Does not synthesize speech.', headers: responseHeaders, content: { 'audio/mpeg': { schema: { type: 'string', format: 'binary' } } } } } } },
      '/api/projects/{id}/draft': {
        parameters: [{ in: 'path', name: 'id', required: true, schema: schema(projectId) }],
        get: { operationId: 'getIdeaDraft', responses: { ...errors, 200: draftResponse } },
        patch: { operationId: 'saveIdeaDraft', description: 'Requires expectedRevision. Supports topic/audience/notes/voicePreset only. New voice choices allow daniel-test; existing saved preset may be retained. No idempotency key: after an unknown response read and compare before retrying; never silently overwrite a newer revision.', parameters: mutation, requestBody: draftRequest, responses: { ...errors, 200: draftResponse } },
      },
      '/api/projects': {
        get: { operationId: 'listProjects', parameters: [{ in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 } }, { in: 'query', name: 'filter', schema: { type: 'string', enum: filters, default: 'all' } }, { in: 'query', name: 'cursor', schema: { type: 'string', minLength: 1, maxLength: 2048 }, description: 'Signed owner/filter-bound tuple cursor, valid for 24 hours. Live lists may move after edits; deduplicate by ID.' }], responses: { ...errors, 200: { description: 'Owner-scoped live project list', headers: responseHeaders, content: content({ type: 'object', required: ['data','page','meta'], properties: { data: { type: 'array', items: projectRef }, page: { type: 'object', required: ['hasMore','nextCursor'], properties: { hasMore: { type: 'boolean' }, nextCursor: nullableId } }, meta } }) } } },
        post: { operationId: 'createProject', parameters: keyed, requestBody: create, responses: { ...errors, 201: { ...success('Project, blank draft and conversation created atomically'), headers: { ...responseHeaders, Location: { schema: { type: 'string' } }, 'Idempotency-Replayed': { schema: { type: 'string', const: 'true' } } } } } },
      },
      '/api/projects/{id}': {
        parameters: [{ in: 'path', name: 'id', required: true, schema: schema(projectId) }],
        get: { operationId: 'getProject', responses: { ...errors, 200: success('Current project') } },
        patch: { operationId: 'renameProject', parameters: mutation, requestBody: rename, responses: { ...errors, 200: success('Renamed project with incremented metadata revision') } },
        delete: { operationId: 'deleteEmptyProject', parameters: keyed, requestBody: body(deleteProject), responses: { ...errors, 204: { description: 'Empty project tombstoned, draft/conversation removed, create snapshots scrubbed. Same-key retry replays 204; no cleanup job is claimed.', headers: { ...responseHeaders, 'Idempotency-Replayed': { schema: { type: 'string', const: 'true' } } } } } },
      },
    },
  };
}
