# NamasteVideo.ai — API Design

Version 1.0 · September 26, 2026  
Status: Target contract; implemented subsets and verification are recorded in PROJECT_STATUS.md.
Inputs: [PRD](PRD.md), [system design](SYSTEM_DESIGN.md), [database design](DB_DESIGN.md).  
Scope: Internal individual accounts, English 60–90-second explainers, private media, individual Instagram. UI design in Google Stitch precedes frontend implementation.

## 1. Reading this contract

The system design defines runtime boundaries. This document defines what a client submits, receives, retries and displays. The database document defines how those guarantees are persisted. Later user decisions take precedence over original PRD defaults: Daniel remains the explicitly accepted test voice; unavailable Indian presets are not silently substituted or falsely advertised.

All paths below are relative to the application's HTTPS origin unless marked gateway. `/api` is the V1 namespace. These are same-origin application APIs, not a public developer platform. Breaking changes require coordinated versioning, never silent reinterpretation of saved hashes or payloads. The document version is independent of storyboard `schemaVersion:2` and database record schema versions.

Refinements to the system-design outline:

- Add explicit session facade, history reads, candidate application/restoration, narrator change, and project-scoped publish-history reads.
- Draft revision, project metadata revision and publish-intent revision are independent counters.
- A publish intent references an immutable payload revision; rescheduling never erases previous approval evidence.
- Deletion returns a cleanup operation ID that remains owner-readable while content is inaccessible.
- Provider-owned authentication responses remain behind a small app facade; no bearer session token is returned to browser JavaScript.

No additional creator steps, billing features, public signup or shared workspaces are introduced.

### F05 implemented boundary — October 1, 2026

The session facade and P01–P04 are implemented locally; P04 currently accepts **title only**, with `expectedRevision`. P02 atomically creates a project, blank draft and conversation and snapshots the saved default voice (fallback `daniel-test`); preferences endpoints are implemented in F17 (see addendum). F07 implements P06 and the idea-field subset of P07, as detailed below. [Generated OpenAPI for the implemented project routes](design/projects.openapi.json) is checked against shared request schemas by tests.

**Temporary P05 response:** empty projects are synchronously tombstoned and their blank draft/conversation removed in a transaction, returning **204**. The original deletion key replays 204. Create-response snapshots are scrubbed; minimal key tombstones prevent replay from recreating deleted content. Projects with draft edits, pipeline references, messages or later-stage flags are rejected with **409 PROJECT_DELETE_UNAVAILABLE** until durable cleanup is implemented. No job is queued and no 202/cleanup ID is advertised. The full P05 contract below remains the target for the jobs/media feature; coordinate that API change with its client.

Project JSON errors include `error.requestId` and `meta.requestId`; all responses carry `X-Request-Id` and private/no-store caching. Unsupported fields (including ownerId and selectedVideoId), duplicate/unknown query parameters, missing preconditions and missing/invalid idempotency keys are rejected. Title limits count Unicode code points after trimming. Retry receipts and cursors never bypass current authentication/admission checks. List sorting is live and can move after edits as described below.

## 2. Transport and common conventions

### 2.1 Headers and representations

| Concern | Contract |
|---|---|
| Requests | HTTPS, `Content-Type: application/json` for JSON bodies, `Accept: application/json` |
| Cookies | Same-origin secure HttpOnly session cookie set by Better Auth integration; browser uses credentials `same-origin` |
| CSRF | Exact configured Origin required for cookie-authenticated mutations, including sign-in; reject missing/untrusted Origin on browser routes |
| Command identity | `Idempotency-Key` required for endpoints marked **K**; random UUID, 16–128 non-whitespace printable ASCII characters, no user content |
| Correlation | Server-generated `X-Request-Id` on every response; response meta/error repeats it |
| Caching | Private API: `Cache-Control: private, no-store`; no shared Next.js fetch cache for user data |
| Input size | Maximum JSON body 256 KiB; reject oversize before parsing; route-specific text limits also apply |
| Time | UTC RFC3339 with milliseconds, e.g. `2026-09-26T10:00:00.000Z`; schedule local time is explicitly separate |
| IDs | Opaque strings; application IDs are prefix + random suffix, pattern `^[a-z]{2,8}_[A-Za-z0-9_-]{16,64}$`; user IDs are opaque auth IDs |
| Hash | SHA-256 encoded as 64 lowercase hexadecimal characters; never supplied as proof of ownership |
| Integers | JSON integers within safe integer range; frames/counters nonnegative; revision starts at 1 |
| Null | GET representations use explicit null for known absent singleton references. Mutation omission means unchanged; null is allowed only where explicitly clearable. |
| Unknown fields | Reject mutation fields not in schema; clients tolerate additive response fields |

Trim topic/title and validate meaningful non-whitespace content. Count input length in Unicode code points, not bytes or UTF-16 code units. Preserve submitted narration text and line breaks after validation; do not normalize it silently after approval. UI and backend must use the same normalization before hashing. Text is plain text, never interpreted HTML/Markdown instructions by the renderer.

### 2.2 Response envelopes

Success: `{ "data": T, "meta": { "requestId": "req_example000000001" } }`.

List: `{ "data": [T], "page": { "nextCursor": null, "hasMore": false }, "meta": { "requestId": "..." } }`.

Async response (**202**) uses `data: AcceptedOperation`:

```json
{
  "data": {
    "jobId": "job_example000000001",
    "resource": {"kind": "video", "id": "vid_example000000001"},
    "state": "queued",
    "statusUrl": "/api/jobs/job_example000000001"
  },
  "meta": {"requestId": "req_example000000001"}
}
```

`resource` may be null until a planning result exists. A 202 means durable acceptance, not provider success. `Location` points to the job or intent status URL. No browser connection must remain open. 204 has no JSON body. OAuth redirects and media bytes are explicit envelope exceptions.

### 2.3 Pagination

List routes accept `limit` integer 1–50 (default 20) and optional `cursor` up to 2,048 characters. No numeric offsets or total-count promise. The cursor is opaque, versioned, HMAC-signed, bound to owner, route, filters, order and last sort tuple; expires after 24 hours. Validate before querying. Cross-owner, tampered, filter-mismatched or expired cursors return `400 INVALID_CURSOR` without disclosing contents.

Projects sort `updatedAt DESC, id DESC`; histories sort `createdAt DESC, id DESC`; conversation messages sort `sequence ASC`. Use a strict tuple boundary and fetch `limit+1`. Lists are live, not snapshot-isolated across requests: editing a project's sort key can move it between pages. Clients deduplicate by ID and refresh from page one after mutations. Do not claim stable snapshot pagination for mutable `updatedAt`.

Project filter: `filter=all|drafts|ready|scheduled|published|needs_attention`. Filters may overlap: a project can have a draft and a scheduled older video. A project response contains independent flags, not a single status pretending these are exclusive. Reads exclude tombstones. History endpoints reject deleted/non-owned parent projects.

### 2.4 Idempotency and concurrency

For **K** routes, the key scope is owner + HTTP method + normalized path. Server canonicalizes the validated request (including preconditions), hashes it and atomically stores the accepted response with created records/outbox. Same key/same request returns the same status and resource IDs with `Idempotency-Replayed: true`; current resource state is obtained by GET. Same key/different request returns `409 IDEMPOTENCY_KEY_REUSED`. A concurrent in-progress receipt returns `409 COMMAND_IN_PROGRESS` with `Retry-After: 1`.

Authorization and parent visibility are checked before replay; a receipt cannot reveal deleted/foreign data. Deleted content commands yield 404, except the owner's deletion receipt/status. Validation/authorization failures before acceptance do not consume the key. After an ambiguous HTTP timeout, retry the identical request and key. After editing the body, use a new key. Accepted command receipts have no short TTL; cleanup follows project deletion after side effects resolve. This does not guarantee exactly-once provider execution.

CAS routes require `expectedRevision`; missing preconditions return `422 VALIDATION_FAILED`. A stale revision returns `409 REVISION_CONFLICT` with the current revision and reload URL. A repeated autosave after a lost response may conflict; the client refetches and compares contents. It must not blindly resend against the newer revision.

Only one content pipeline per project. Brainstorm, plan, revise, generate, caption render and post-caption suggestion share the slot; overlapping commands return `409 PROJECT_BUSY` with owner-visible activeJobId. Publishing has its own independent state. Editing a draft does not cancel a running pipeline.

## 3. Authentication and authorization

Use Better Auth as the server auth engine. Expose the facade below and delegate password/session handling to its supported API; forward Set-Cookie correctly. Do not invent a parallel password database. The Better Auth native handler must not expose bypasses for signup/admission or return a reusable token through an unprotected alternate route. Verify exact facade integration against the pinned package. [Better Auth email/password](https://better-auth.com/docs/authentication/email-password), [sessions](https://better-auth.com/docs/concepts/session-management)

All domain routes require a valid session and enabled internal-access record. `ownerId`, `workspaceId`, provider keys and arbitrary voice IDs are never accepted in user commands. Authenticate first; then scope all identifiers, nested source references and assets to the session owner and project. Foreign IDs return 404. Authenticated disabled accounts receive 403 `ACCESS_DISABLED`; sign-in uses generic errors without revealing allowlist membership.

Initial session configuration: seven-day maximum cookie/session lifetime with server-controlled renewal; disable browser-readable session token caching. Revalidate enabled access on every private request and worker admission. Signing out ends this session and clears client state but does not cancel accepted jobs. Password recovery is operator-assisted; no public reset/signup product. Operator disable/recovery revokes sessions and pauses pending publication.

### Session endpoints

| Endpoint | Request | Response / errors |
|---|---|---|
| POST `/api/session/sign-in` | `{email:string<=254,password:string<=128}` | 200 `SessionView` + Set-Cookie; 401 `INVALID_CREDENTIALS`; 429 with Retry-After. Empty password invalid. Provisioned passwords require at least 12 characters; login does not enforce a new minimum against existing accounts. |
| GET `/api/session` | No body | 200 `SessionView`; 401 if expired/missing |
| POST `/api/session/sign-out` | `{}`; Origin required | 204, expire cookie; idempotent even if already expired |

`SessionView = {user:{id,email,name}, expiresAt, workspaceId, capabilities:{generation:boolean,instagramPublishing:boolean}}`. `workspaceId` equals the user ID, with no workspace switcher. No token/hash/password fields. Invalid email/password and non-provisioned account get the same generic login message. Login throttling: initial 5 failed attempts per 15 minutes per normalized-email hash and 30 per IP hash; configurable. Never log passwords or store raw IPs in rate-limit keys.

Service routes authenticate separately (section 14). A service signature is not a creator's publication approval.

## 4. Shared response and content schemas

Fields below are the complete public minimum contract. Server-only DB fields are intentionally absent. All nested mutation objects reject unknown fields.

### 4.1 Core views

```typescript
type ProjectView = {
  id: string; title: string; revision: number; draftRevision: number; conversationId:string;
  currentStoryboardId: string | null; latestReadyVideoId: string | null;
  selectedVideoId: string | null; activeJobId: string | null;
  flags: {drafts:boolean; ready:boolean; scheduled:boolean; published:boolean; needsAttention:boolean};
  createdAt: string; updatedAt: string;
};
type DraftView = {
  projectId: string; conversationId:string; revision: number; topic: string; audience: string;
  notes: string; voicePreset: string; editablePlan: PlanV2 | null;
  sourceStoryboardId: string | null; contentHash: string;
  validation: {valid:boolean; issues:FieldIssue[]}; updatedAt:string;
};
type StoryboardView = {
  id:string; projectId:string; parentId:string|null; sourceDraftRevision:number;
  state:'review_ready'|'approved'; content:PlanV2; contentHash:string; storyHash:string;
  estimatedDurationSeconds:number; warnings:FieldIssue[];
  changeSummary:string|null; changedSceneIds:string[];
  approvalId:string|null; createdAt:string;
};
type FieldIssue = {path:string; code:string; message:string};
type ApprovalView = {
  id:string; kind:'story'|'video'; subjectId:string; subjectHash:string; approvedAt:string;
};
```

Project metadata revision increments on user metadata commands, not every progress poll. Draft revision increments only on draft mutation. Flags and latest-result pointers may update independently; clients cannot PATCH them. `contentHash` hashes the saved plan/content, not a permission grant. GET draft may contain incomplete narration during editing, with validation issues; approval requires a fully valid plan.

### 4.2 PlanV2 and scene schema

```typescript
type PlanV2 = {
  schemaVersion:2; title:string; audience:string; learningObjective:string;
  language:'en'; voicePreset:string;
  sources:Array<{id:string; kind:'provided_notes'|'illustrative'; text:string}>;
  scenes:SceneV2[];
};
type SceneV2 = {
  id:string; title:string; kicker:string; narration:string;
  pronunciation:Array<{phrase:string; occurrence:number; spokenAs:string}>;
  visual:{component:string; version:number; data:object};
  events:Array<{
    id:string; targetId:string; action:string;
    cue:{phrase:string; occurrence:number; offsetMs:number};
    durationMs:number;
  }>;
  sourceIds:string[];
};
```

Bounds: title 1–100, audience 0–200, learningObjective 1–500 characters; 3–10 scenes (usually 6–10, a safety bound rather than a mandatory creator choice). Scene ID/event ID `^[a-z][a-z0-9-]{0,49}$`; unique within plan/scene respectively. Scene title ≤65, kicker ≤35, narration 20–1,400 characters for approval. Sources ≤20 and combined source text ≤20,000. Per scene ≤20 events, ≤20 pronunciation substitutions; cue/phrase 1–150 characters, occurrence 1–20, spokenAs 1–150, offsetMs -500..500, durationMs 0..3,000. Validate source and target references. Every cue must resolve to the specified occurrence. All computed events must be inside measured scene bounds; offsets never silently clamp inaccurate cues.

`visual.data` is a discriminated, versioned registry schema, not arbitrary JSON accepted by the renderer. GET `/api/capabilities` returns available component IDs/versions and limits. Exact component data schemas and semantic checks are in DB design section 4; both documents require a shared runtime contract package. Missing/disabled component → 422. Factual chart data requires a provided source; illustrative charts are explicitly marked. No user URLs, scripts or CSS are allowed in data.

### 4.3 Job and video views

```typescript
type JobView = {
  id:string; projectId:string; type:'brainstorm'|'storyboard'|'revision'|'generation'|'caption_render'|'voice_change'|'post_caption'|'cleanup';
  state:'queued'|'running'|'cancel_requested'|'cancelled'|'succeeded'|'needs_input'|'failed';
  stage:'queued'|'planning'|'speech'|'compile'|'render'|'validate'|'finalize'|'cleanup';
  revision:number; attempt:number;
  progress:{completedScenes:number|null; totalScenes:number|null; renderPercent:number|null};
  result:JobResult|null; error:OperationError|null; inputRequest:InputRequest|null;
  actions:{cancel:boolean;retry:boolean;regenerate:boolean};
  createdAt:string; updatedAt:string; finishedAt:string|null;
};
type JobResult =
  | {kind:'ideas'; suggestions:Array<{id:string;topic:string;angle:string;takeaway:string}>}
  | {kind:'storyboard';storyboardId:string;requiresApply:boolean}
  | {kind:'video';videoId:string}
  | {kind:'post_caption';text:string;sourceVideoId:string}
  | {kind:'cleanup';externalOutcomePending:boolean};
type InputRequest = {code:string;message:string;sceneIds:string[];candidateStoryboardId:string|null};
type OperationError = {code:string;message:string;retryable:boolean;correlationId:string};
type VideoView = {
  id:string; projectId:string; storyboardId:string; parentVideoId:string|null;
  state:'building'|'validating'|'ready_for_review'|'approved'|'failed';
  renderSpecHash:string; outputHash:string|null; outputAssetId:string|null;
  durationSeconds:number|null; width:1080; height:1920; fps:30;
  voice:{preset:string;label:string;accent:string;testOnly:boolean};
  qa:{passed:boolean;checks:Record<string,boolean>}|null;
  approvalId:string|null; createdAt:string;
};
```

No fictional overall percentage. Percent is 0–100 or null and applies only to measured rendering. `retryable` is not authorization; mutation rechecks state. `needs_input` is terminal for this execution and releases the project slot; correction launches a new job or eligible explicit retry. Cleanup status omits deleted content.

## 5. Projects, drafts and preferences

All responses below are wrapped as section 2 unless 204. **K** means Idempotency-Key required. All GET requests have no body.

| ID / endpoint | Request contract | Success | Specific errors |
|---|---|---|---|
| P01 GET `/api/projects` | limit, cursor, filter | 200 list of ProjectView | INVALID_CURSOR |
| P02 POST `/api/projects` **K** | `{title?:string(1..100)}`; default “Untitled video” | 201 ProjectView; Location project URL; creates blank draft/preferences default snapshot | VALIDATION_FAILED |
| P03 GET `/api/projects/:id` | path ID | 200 ProjectView | NOT_FOUND |
| P04 PATCH `/api/projects/:id` | `{expectedRevision, title?:string(1..100), selectedVideoId?:id}`; at least one change | 200 ProjectView | REVISION_CONFLICT, VIDEO_NOT_READY |
| P05 DELETE `/api/projects/:id` **K** | `{expectedRevision,confirm:true}` | 202 AcceptedOperation with cleanup job | REVISION_CONFLICT |
| P06 GET `/api/projects/:id/draft` | path ID | 200 DraftView | NOT_FOUND |
| P07 PATCH `/api/projects/:id/draft` | `{expectedRevision, changes:{topic?,audience?,notes?,voicePreset?,editablePlan?}}` | 200 DraftView | REVISION_CONFLICT, VOICE_UNAVAILABLE |
| P08 GET `/api/preferences` | none | 200 `{revision,timezone,defaultVoicePreset}` | — |
| P09 PATCH `/api/preferences` | `{expectedRevision,timezone?:IANA,defaultVoicePreset?:string}` | 200 preference view | REVISION_CONFLICT, INVALID_TIMEZONE, VOICE_UNAVAILABLE |
| P10 GET `/api/voices` | none | 200 `{voices:[{preset,label,accent,testOnly,sampleAssetId}],defaultPreset}` | — |
| P11 GET `/api/capabilities` | none | 200 `{planSchemaVersion:2,components:[{id,version}],limits:{minSeconds:60,maxSeconds:90,fps:30,width:1080,height:1920,postCaptionMaxCharacters:number\|null},instagramEnabled:boolean}` | — |

Topic ≤2,000 and notes ≤20,000; empty strings allowed during autosave. Audience ≤200. `editablePlan:null` explicitly clears the working storyboard. Structural validation applies even to drafts; incomplete strings are preserved with issues rather than silently rejected. Malformed arrays, IDs or unsafe data are rejected. Updating topic/notes/voice does not rewrite old approved plans: mark the working plan stale until replanned or explicitly updated/validated. Applying a whole plan checks `voicePreset` agrees with the draft field. A default preference change affects future projects only.

P04 selecting a video requires same owner/project and ready/approved state; it does not approve or schedule it. P05 removes content access at acceptance, cancels unclaimed delivery and queues physical cleanup. Already-submitted publication is reconciled, not claimed cancelled. Repeated deletion with its original key returns its cleanup ID; other content reads return 404.

Example save:

```json
{"expectedRevision":3,"changes":{"topic":"Explain binary search to beginners","audience":"New programmers","voicePreset":"daniel-test"}}
```

Response `data` is DraftView with `revision:4`, saved fields, current validation and a newly computed contentHash. Save conflict example:

```json
{"error":{"code":"REVISION_CONFLICT","message":"This draft changed in another tab.","requestId":"req_example000000002","retryable":false,"details":{"currentRevision":5,"reloadUrl":"/api/projects/prj_example000000001/draft"}}}
```

## 6. Planning, conversation and history

| ID / endpoint | Request contract | Success | Specific errors |
|---|---|---|---|
| S01 GET `/api/projects/:id/messages` | limit,cursor, conversationId required | 200 list `{id,conversationId,sequence,role:'user'\|'assistant',text,sourceStoryboardId,sourceVideoId,jobId,createdAt}` | INVALID_CURSOR, NOT_FOUND |
| S02 POST `/api/projects/:id/brainstorm` **K** | `{expectedDraftRevision,prompt:string(1..2000)}` | 202 job; result 3–5 suggestions or needs_input | PROJECT_BUSY, REVISION_CONFLICT |
| S03 POST `/api/projects/:id/storyboards` **K** | `{expectedDraftRevision}`; saved meaningful topic required | 202 job; result StoryboardView ID | PROJECT_BUSY, INVALID_DRAFT |
| S04 GET `/api/projects/:id/storyboards` | limit,cursor | 200 list StoryboardView summary excluding full content; includes hashes, state, source revision, title, estimate | — |
| S05 GET `/api/storyboards/:id` | path ID | 200 StoryboardView | NOT_FOUND |
| S06 POST `/api/projects/:id/draft/apply` **K** | `{expectedDraftRevision,storyboardId,expectedContentHash}` | 200 DraftView | REVISION_CONFLICT, HASH_MISMATCH |
| S07 POST `/api/projects/:id/draft/restore` **K** | Same as S06; creates working copy from earlier snapshot | 200 DraftView | REVISION_CONFLICT, HASH_MISMATCH |
| S08 POST `/api/projects/:id/revisions` **K** | `{source:{kind:'storyboard'\|'video',id,hash},expectedDraftRevision,instruction:string(1..4000),sceneId?:string}` | 202 JobView reference | SOURCE_CHANGED, PROJECT_BUSY, INVALID_SCENE |

One project conversation is created with the project; its ID is returned in ProjectView and DraftView as `conversationId`. Persist the user message and job acceptance atomically; write one deduplicated assistant result tied to job ID. No model-generated message can issue a publish command.

S03/S08 save immutable candidates. They never silently overwrite edits made while AI ran. UI applies a result with S06 against the revision it currently displays. If that revision no longer matches, show compare/reload. Applying changes the working draft and current selected storyboard pointer; it does not generate audio. Restoring does not undo schedules or delete later versions.

For S08, source.hash is storyboard.contentHash for a storyboard source or video.renderSpecHash for a video source. S08 interpretation is asynchronous. A trusted semantic diff determines result kind: narrative/factual changes yield a storyboard candidate and require story approval; a strictly visual change can inherit prior story approval and yield a new video. Unknown classification returns needs_input. A video-side request never alters the old video's spec. Unsupported duration requests explain the V1 range without accepting an out-of-scope render.

A sample completed storyboard job:

```json
{"data":{"id":"job_example000000001","projectId":"prj_example000000001","type":"storyboard","state":"succeeded","stage":"planning","revision":3,"attempt":1,"progress":{"completedScenes":null,"totalScenes":null,"renderPercent":null},"result":{"kind":"storyboard","storyboardId":"stb_example000000001","requiresApply":true},"error":null,"inputRequest":null,"actions":{"cancel":false,"retry":false,"regenerate":false},"createdAt":"2026-09-26T10:00:00.000Z","updatedAt":"2026-09-26T10:00:12.000Z","finishedAt":"2026-09-26T10:00:12.000Z"},"meta":{"requestId":"req_example000000001"}}
```

## 7. Approval, generation and jobs

| ID / endpoint | Request contract | Success | Specific errors |
|---|---|---|---|
| G01 POST `/api/projects/:id/generations` **K** | `{expectedDraftRevision,expectedContentHash,approve:true}` | 202 AcceptedOperation video/job; atomically snapshots plan + story approval | PROJECT_BUSY, REVISION_CONFLICT, HASH_MISMATCH, INVALID_DRAFT, VOICE_UNAVAILABLE |
| G02 GET `/api/jobs/:id` | owner-only ID | 200 JobView | NOT_FOUND |
| G03 POST `/api/jobs/:id/cancel` **K** | `{expectedRevision}` | 200 JobView; queued may cancel immediately, running → cancel_requested | REVISION_CONFLICT, JOB_TERMINAL |
| G04 POST `/api/jobs/:id/retry` **K** | `{expectedRevision,acknowledgePossibleProviderRepeat?:boolean}` | 202 AcceptedOperation referencing same job, new execution attempt | JOB_NOT_RETRYABLE, PROJECT_BUSY, REVISION_CONFLICT, REPEAT_ACK_REQUIRED |
| G05 POST `/api/videos/:id/regenerate` **K** | `{expectedRenderSpecHash}` | 202 new video/job with same immutable approved inputs | SOURCE_CHANGED, PROJECT_BUSY, VOICE_UNAVAILABLE |
| G06 POST `/api/videos/:id/voice` **K** | `{expectedRenderSpecHash,voicePreset,confirm:true}` | 202 new video/job; explicit configuration approval | SOURCE_CHANGED, PROJECT_BUSY, VOICE_UNAVAILABLE |

G01 resolves provider model and voice server-side and records them. It cannot approve an invalid schematic, missing cue, unresolved content warning requiring user input, stale plan or unsupported component. Successful schema validation is not a fact-checking guarantee. Hash the exact saved content; don't silently fix text during acceptance.

Retry reuses immutable input and verified caches. It cannot mean “rerun with today's model default.” A definite failed render is retryable; an ambiguous speech call requires acknowledgment that provider usage may repeat. Unknown Instagram outcomes are never retried via this endpoint. `needs_input` requiring new narration is fixed through a new draft/generation. G05 is for new output from existing approved inputs, including missing media; it creates a new final-review requirement and never updates a schedule. Changing unavailable provider configuration requires a new explicit reviewable version.

Cancelling a succeeded job returns 409; repeating the original accepted cancel key returns its recorded response. A render that finishes after cancellation cannot become the active ready output. Cleanup jobs cannot be cancelled by users. Jobs return actions to guide UI, but the server always rechecks. After project deletion, G02 exposes only the owning cleanup job’s minimal status; other project jobs return 404. A voice change creates a new storyboard/configuration snapshot and explicit story-configuration approval from confirm:true, rather than modifying the old story hash.

## 8. Videos, captions, approval and media

| ID / endpoint | Request contract | Success | Specific errors |
|---|---|---|---|
| V01 GET `/api/projects/:id/videos` | limit,cursor | 200 list VideoView | — |
| V02 GET `/api/videos/:id` | none | 200 VideoView | NOT_FOUND |
| V03 GET `/api/videos/:id/captions` | none | 200 `{videoId,renderSpecHash,scenes:[{sceneId,speechFingerprint,captions:[{id,sourceStart,sourceEnd,text,startFrame,endFrame}]}]}` | VIDEO_NOT_READY |
| V04 PATCH `/api/videos/:id/captions` **K** | `{expectedRenderSpecHash,overrides:[{sceneId,speechFingerprint,sourceStart,sourceEnd,displayText}]}` | 202 new video/job | SOURCE_CHANGED, CAPTION_MEANING_CHANGE, INVALID_SPAN, PROJECT_BUSY |
| V05 POST `/api/videos/:id/approve` **K** | `{expectedOutputHash,expectedRenderSpecHash,approve:true}` | 200 ApprovalView; video approved | VIDEO_NOT_READY, HASH_MISMATCH |
| V06 POST `/api/assets/:id/access` | `{purpose:'preview'\|'download'}` | 200 `{url,expiresAt,contentType,bytes}` | ASSET_NOT_READY, NOT_FOUND |

Caption spans are half-open Unicode code-point offsets `[sourceStart,sourceEnd)` in the scene's original narration; not JavaScript UTF-16 indices. Times are local scene frames at 30 fps. Display changes retain mapping to original speech. Maximum 100 overrides/video, 200 characters/override; no overlapping spans, unknown scenes, or mismatched speech fingerprints. Server can regroup/reflow captions without changing speech timing. Semantic changes return an instruction to revise narration. Size and line limits are also checked by actual font measurement before Ready.

V05 explicitly approves the bytes shown in the player. ApprovalView.subjectHash is SHA-256 of canonical `{outputHash,renderSpecHash}` for kind video; for kind story it is the storyboard storyHash. Download of a validated ready-for-review video is allowed without final publication approval; Post now/Schedule requires approval. Later versions require their own final approval even when story approval is inherited.

V06 creates a short-lived (initially 10-minute) revocable bearer URL at the media gateway. Do not store it as a permanent DB URL. The user must own the asset through an undeleted project; public sample assets are restricted to the configured sample catalog. Expired grant refresh does not restart generation. Raw R2 keys, credentials and alignment download URLs are not returned by ordinary video reads.

Gateway `GET|HEAD /media/:grantToken` supports one byte range with 200/206, appropriate Content-Length, Content-Type, Accept-Ranges and Content-Range; malformed/multiple/unsatisfiable ranges return 416. Expired/revoked/unknown grants return generic 404. Authorization is rechecked for each request. Download uses safe Content-Disposition filename; previews use inline. `Referrer-Policy: no-referrer`, `Cache-Control: private,no-store`. Revocation cannot recall bytes already delivered or stop every in-flight stream.

## 9. Instagram connection

| ID / endpoint | Request | Success | Specific errors |
|---|---|---|---|
| I01 POST `/api/instagram/connect` | `{returnProjectId?:id}`; Origin required | 200 `{authorizationUrl,expiresAt}` | INTEGRATION_UNAVAILABLE |
| I02 GET `/api/instagram/callback` | Provider query `code,state` OR `error,state`; no JSON body | 303 to server-generated relative return route with opaque outcome; Set-Cookie only if auth requires | Reject missing/expired/replayed/mismatched state; no token/query error echo |
| I03 GET `/api/instagram/connection` | none | 200 ConnectionView or data:null | — |
| I04 DELETE `/api/instagram/connection` **K** | `{expectedRevision,confirmPausePending:true}` | 200 `{connection:ConnectionView,pausedIntentCount,reconciliationPending:boolean}` | REVISION_CONFLICT |

`ConnectionView = {id,revision,state:'connected'|'expiring'|'reconnect_required'|'disconnected',account:{id,username,type:'BUSINESS'|'CREATOR'}|null,destinationEpoch,expiresAt:string|null,publishingAvailable:boolean,pendingIntentCount:number}`. No token, scopes secret material or app credentials in response.

OAuth state is random, session-bound, single use, ten-minute validity. Cancellation returns to the preserved publish page. Missing session means restart Connect after login; do not attach an account from an unbound callback. A connection owned elsewhere yields a generic conflict; do not identify its owner. Different-account reconnect pauses old intents and changes destination epoch; same-account refresh cannot silently change approved destination. If an old account has an unresolved submitted publication, reject switching with CONNECTION_RECONCILIATION_PENDING until its outcome is resolved; preserve the old reconciliation credentials. Disconnect prevents new publication but reconciliation of already-submitted work continues.

Internal testing still requires eligible professional accounts and configured Meta access. Do not expose raw provider auth URLs supplied by clients or arbitrary callback redirects. Exact upstream version/permissions and token refresh rules are adapter configuration verified during implementation, not client inputs.

## 10. Post captions, publishing and scheduling

### 10.1 Shared types

```typescript
type Destination = {connectionId:string; instagramUserId:string; destinationEpoch:number};
type ScheduleInput = {localTime:string; timezone:string; utcOffset:string};
// localTime: YYYY-MM-DDTHH:mm; timezone: IANA; utcOffset: +05:30, -04:00, etc.
type PublishPayloadInput = {
  videoId:string; videoApprovalId:string; expectedOutputHash:string;
  destination:Destination; caption:string;
};
type PublishIntentView = {
  id:string; projectId:string; revision:number; state:PublishState;
  payloadId:string; payloadHash:string; videoId:string; assetHash:string;
  destination:Destination & {usernameAtApproval:string}; caption:string;
  schedule:{scheduledAtUtc:string;localTime:string;timezone:string;utcOffset:string}|null;
  publishedAt:string|null; providerMediaId:string|null; permalink:string|null;
  error:OperationError|null;
  actions:{edit:boolean;cancel:boolean;retry:boolean;reconnect:boolean};
  createdAt:string; updatedAt:string;
};
type PublishState = 'scheduled'|'queued'|'claimed'|'preparing'|'processing'|'submitting'|
 'published'|'paused_auth'|'failed_safe'|'outcome_unknown'|'needs_attention'|'cancelled';
```

All times are server-validated. Schedule conversion rejects a nonexistent local time. For repeated local times the supplied offset must select a valid occurrence; if missing/invalid, return `422 AMBIGUOUS_LOCAL_TIME` with valid offsets. `utcOffset` is required even outside DST to make confirmation unambiguous. Minimum lead time is five minutes at server acceptance. API never guesses browser timezone; the UI uses preference → browser → Asia/Kolkata. A minute-based scheduler starts delivery near the requested time; Meta processing can delay visibility.

### 10.2 Endpoints

| ID / endpoint | Request contract | Success | Specific errors |
|---|---|---|---|
| U01 POST `/api/projects/:id/post-caption` **K** | `{videoId,expectedOutputHash,instruction?:string<=1000}` | 202 job; suggestion never edits an existing intent | VIDEO_NOT_READY, PROJECT_BUSY |
| U02 POST `/api/publish-intents` **K** | `{projectId,payload:PublishPayloadInput,mode:'now'\|'schedule',schedule?:ScheduleInput,confirm:true,repostOfIntentId?:id}` | 201 PublishIntentView + Location; queued or scheduled | VIDEO_NOT_APPROVED, DESTINATION_CHANGED, RECONNECT_REQUIRED, ALREADY_PUBLISHED, INVALID_SCHEDULE |
| U03 GET `/api/projects/:id/publish-intents` | limit,cursor | 200 list PublishIntentView | — |
| U04 GET `/api/publish-intents/:id` | none | 200 PublishIntentView | NOT_FOUND |
| U05 PATCH `/api/publish-intents/:id` **K** | `{expectedRevision,payload:PublishPayloadInput,mode:'now'\|'schedule',schedule?:ScheduleInput,confirm:true}`; full replacement, not partial payload | 200 PublishIntentView; new payload ID/revision | INTENT_ALREADY_CLAIMED, REVISION_CONFLICT, VIDEO_NOT_APPROVED, DESTINATION_CHANGED |
| U06 POST `/api/publish-intents/:id/cancel` **K** | `{expectedRevision}` | 200 PublishIntentView | INTENT_ALREADY_CLAIMED, REVISION_CONFLICT, OUTCOME_UNKNOWN |
| U07 POST `/api/publish-intents/:id/retry` **K** | `{expectedRevision,confirm:true}` | 200 PublishIntentView; queued/scheduled only if safe and within window | OUTCOME_UNKNOWN, RETRY_WINDOW_EXPIRED, RECONNECT_REQUIRED, INTENT_NOT_RETRYABLE |

Caption is plain text, may be empty only if current configured Meta validation allows it, and is bounded by the server's versioned provider constraint (initial application ceiling 2,200 code points, never more than live provider allows). Clients read capabilities and handle 422; no silent truncation. `schedule` required only for mode schedule and forbidden for now. `projectId` must match the pinned video and approval. The server obtains assetId from the approved video, never from user-selected media URLs.

Example schedule request (illustrative hashes, not a live approval):

```json
{
  "projectId":"prj_example000000001",
  "payload":{
    "videoId":"vid_example000000001",
    "videoApprovalId":"apr_example000000001",
    "expectedOutputHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "destination":{"connectionId":"igc_example000000001","instagramUserId":"17841400000000000","destinationEpoch":1},
    "caption":"Binary search, explained one step at a time."
  },
  "mode":"schedule",
  "schedule":{"localTime":"2026-09-28T18:00","timezone":"Asia/Kolkata","utcOffset":"+05:30"},
  "confirm":true
}
```

Response is PublishIntentView with `state:"scheduled"`, revision 1 and `scheduledAtUtc:"2026-09-28T12:30:00.000Z"`. Return exact displayed payload/account identity so the UI can show the user's approved selection.

### 10.3 Publication safety semantics

A duplicate unresolved video/account/content payload returns the existing intent (200, `deduplicated:true` in meta), even under a different key. Conflicting schedule for that same payload returns `409 PUBLISH_INTENT_EXISTS` with the existing owner-visible ID; use U05 explicitly. After successful publication, the same payload requires `repostOfIntentId` pointing to that published intent and a new user confirmation. Generic retries never create reposts.

Cancel/update races use state+revision CAS. Once a worker claims the intent, editing/cancellation returns conflict; UI must not promise cancellation. The claim also rechecks destination epoch, connection, tombstone, approval and asset hash. Reconnection to another account requires an explicitly confirmed replacement. Auto-refresh of credentials is not a new destination approval.

At most 15 minutes of lateness/retry from intended start; “now” uses acceptance time. Once expired before submission, require U05 with a new time/explicit now approval. Reconciliation continues beyond the window if a publish request was already attempted. Unknown outcome → no U07, no reschedule/replacement of that unresolved intent, and no automatic second publish call. Return `OUTCOME_UNKNOWN` with a plain explanation and status polling path.

## 11. Error catalog and client behavior

```json
{
  "error":{
    "code":"VALIDATION_FAILED",
    "message":"Please correct the highlighted fields.",
    "requestId":"req_example000000001",
    "retryable":false,
    "fieldErrors":[{"path":"changes.topic","code":"TOO_LONG","message":"Use at most 2,000 characters."}]
  }
}
```

`details` is an allowlisted object, never a raw provider error. Authentication, ownership and error redaction apply before providing IDs. Global errors apply to every endpoint even if not repeated in tables.

| HTTP | Codes | UI behavior |
|---|---|---|
| 400 | MALFORMED_JSON, INVALID_CURSOR, INVALID_QUERY | Fix request/restart listing; no blind retry |
| 401 | UNAUTHENTICATED, SESSION_EXPIRED, INVALID_CREDENTIALS | Sign in; preserve user-local unsaved state only for same user |
| 403 | ACCESS_DISABLED, ORIGIN_NOT_ALLOWED | Explain access/reload; never infer existence of foreign data |
| 404 | NOT_FOUND | Generic missing/inaccessible/deleted resource |
| 409 | REVISION_CONFLICT, SOURCE_CHANGED, HASH_MISMATCH | Refetch and review before resubmitting |
| 409 | IDEMPOTENCY_KEY_REUSED, COMMAND_IN_PROGRESS | Reuse original body/key or wait; never invent a second operation to bypass |
| 409 | PROJECT_BUSY, INTENT_ALREADY_CLAIMED | Observe active operation |
| 409 | OUTCOME_UNKNOWN, ALREADY_PUBLISHED, PUBLISH_INTENT_EXISTS | Observe/reconcile, or explicitly approve a distinct repost |
| 413 | PAYLOAD_TOO_LARGE | Shorten input |
| 415 | UNSUPPORTED_MEDIA_TYPE | Use JSON; uploads are out of scope |
| 422 | VALIDATION_FAILED, INVALID_DRAFT, INVALID_SCENE, INVALID_SPAN, INVALID_TIMEZONE, INVALID_SCHEDULE, AMBIGUOUS_LOCAL_TIME, NONEXISTENT_LOCAL_TIME | Correct specific fields |
| 422 | VOICE_UNAVAILABLE, VIDEO_NOT_READY, VIDEO_NOT_APPROVED, ASSET_NOT_READY, CAPTION_MEANING_CHANGE | Complete prerequisite or revise |
| 409 | DESTINATION_CHANGED, RECONNECT_REQUIRED, CONNECTION_RECONCILIATION_PENDING, REPEAT_ACK_REQUIRED, RETRY_WINDOW_EXPIRED, JOB_NOT_RETRYABLE, JOB_TERMINAL, INTENT_NOT_RETRYABLE | Explicit review/reconnection/safe action, not blind retries |
| 429 | RATE_LIMITED | Honor Retry-After seconds |
| 503 | INTEGRATION_UNAVAILABLE, SERVICE_UNAVAILABLE | Retry same accepted-operation key after recovery |
| 500 | INTERNAL_ERROR | Show request ID, refetch before repeating mutation |

Provider failures after acceptance appear in JobView/PublishIntentView with HTTP 200 on GET, not as a misleading transport failure. Job error codes include PROVIDER_AUTH, PROVIDER_QUOTA, PROVIDER_TEMPORARY, PROVIDER_REJECTED, PROVIDER_OUTCOME_UNKNOWN, INVALID_ALIGNMENT, DURATION_OUT_OF_RANGE, UNSUPPORTED_VISUAL, LAYOUT_OVERFLOW, RENDER_FAILED, ASSET_MISSING and OUTPUT_INVALID. Codes describe actionable categories without exposing notes or credentials.

Initial planning command limit: ten/user/minute plus project/worker concurrency controls. Job polling limit: 60/user/minute; client coalesces tabs and backs off on 429. Media grant creation: 30/user/minute. Thresholds are deployment config, not a credit system. Successful/error rate-limit responses may expose `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset` in seconds; Retry-After is authoritative for retry timing.

## 14. Internal interfaces

These are not endpoints available to ordinary sessions.

| Interface | Authentication and request | Result |
|---|---|---|
| `/api/inngest` | Official signed Inngest handler with pinned SDK; event body `{eventId,jobId}` or `{eventId,intentId}` only | SDK-defined transport; domain idempotency still required |
| POST `/api/internal/media-authorize` | Service HMAC over method/path/body digest/timestamp/nonce; ≤30s clock skew; reject reused nonce. Body `{token,method:'GET'\|'HEAD',range?:string}` | 200 `{objectKey,contentType,bytes,disposition}` or generic 404; never arbitrary object-key lookup |
| Render input/output | Attempt-bound one-object grants, deadline and fencing token; trusted build only | Attempt-specific result manifest with hashes, bytes, QA, build ID; supervisor validates before Ready |
| Operator diagnostics | Authenticated CLI under operator credentials, not user API | Provision/reset users, record verified external outcome, inspect redacted job state; audited |

Store service replay nonces with a short TTL, but check expiry synchronously. Deny public CORS on internal routes. Restrict gateway credentials to this route. No generic endpoint accepts `ownerId` + arbitrary service command. The gateway grant's owner is loaded from persistence. Raw media tokens must not appear in application/access logs.

## 15. End-to-end client examples and acceptance

**Create:** sign in → P02 → P07 → S03 → poll G02 → S05 → S06 → G01 → poll G02 → V02 → V06. All approval commands wait for successful autosave. Display human stage names, not infrastructure names.

**Revise:** S08 against visible source hash → poll → if storyboard candidate, S06 + G01; if visual-only video, V02 after completion. Previous output remains downloadable. Apply never auto-publishes.

**Publish:** V05 exact output → I03 (Connect if needed) → optional U01 → U02 explicit confirmation → U04. Disconnecting does not disable download. Final approval can be integrated into “Continue to publish” without another screen.

**Reconnect after session expiry:** GET session → login → reload project/job/intent IDs → reconcile. Never resubmit Generate/Post merely because the browser lost its response.

Before implementation completion, contract tests must cover every endpoint's success envelope, malformed/extra-field input, auth/foreign-ID denial, pagination, CAS conflict, idempotency replay, and deleted-parent behavior. Add race tests for generation/cancel, publish claim/cancel and account replacement. Test HTTP Range playback and grant expiry on desktop/mobile. Generate a machine-readable OpenAPI specification from the implemented shared Zod schemas and verify it against these named contracts before exposing the dashboard API; this Markdown document does not claim that specification or routes already exist.

## 16. PRD traceability and Stitch handoff

| Requirement | API sections |
|---|---|
| FR-01 accounts | 3, 5, 14 |
| FR-02 ideas | 5–6 |
| FR-03 storyboard | 4.2, 6–7 |
| FR-04 duration | 4.2, 7, 13 |
| FR-05 motion | 4.2, capabilities |
| FR-06 narration | 5 voices, G06 |
| FR-07 captions | 8 |
| FR-08 revisions | 6–8 |
| FR-09 jobs | 2.4, 7, 13 |
| FR-10 export | 8 |
| FR-11 connection | 9 |
| FR-12 publishing | 10 |
| FR-13 schedules | 10 |
| FR-14 autosave/deletion | 2.4, 5 |

Stitch designs should include empty project library, saving/unsaved/conflict states, planning, storyboard candidate comparison, unavailable voice, real generation stages, previous output during revision, ready preview, connection cancellation, schedule confirmation with timezone, paused authorization, and unknown publication outcome. UI may reorganize presentation but must not hide approvals, pretend uncertain publication failed safely, or invent unavailable actions. API changes discovered during design are reviewed in both this document and the database contract before coding.

## Implemented F07 idea draft slice

`GET/PATCH /api/projects/:id/draft` use the existing admitted session, owner filter, private/no-store envelope and exact mutation Origin policy. PATCH requires `expectedRevision` and a nonempty `changes` object containing only `topic` (≤2,000 Unicode code points), `audience` (≤200), `notes` (≤20,000) and/or `voicePreset` (1–64). Whitespace and empty text are preserved. Unknown fields, structured plans and query parameters are rejected. Request bodies remain capped at 256 KiB. See `design/projects.openapi.json` for the implemented request/response schema.

New voice selections currently allow only the approved `daniel-test` application preset. An existing saved preset can be retained; this is not a live ElevenLabs availability check. Other new choices return `422 VOICE_UNAVAILABLE`. No provider IDs or credentials appear in the DTO.

Every accepted PATCH advances the draft revision, recomputes its canonical SHA-256 content hash and transactionally updates parent draftRevision/contentRevision/updatedAt. Project metadata revision stays unchanged. Stale requests return `409 REVISION_CONFLICT` with currentRevision and reloadUrl; no automatic last-write-wins. GET uses a snapshot transaction to read the live parent and draft consistently. Foreign/deleted parents return 404.

F07 responses have editablePlan/sourceStoryboardId null, planStale false and validation.valid false with STORYBOARD_REQUIRED. Saving an idea is not storyboard approval. Plan editing/staleness transitions arrive with F09/F10. Edited projects retain the documented P05 409 deletion guard until durable cleanup is implemented.

The reusable autosave controller debounces at 800ms, serializes saves and preserves newer in-memory typing while requests run. Failures pause saving. Explicit recovery reads the current draft: matching attempted content at an advanced revision acknowledges a lost response; an unchanged revision keeps an attempted write unresolved and forces a revision-checked write even when local input matches the old saved text; other changes require an explicit keep-local/use-remote decision. It never blindly retries against a newer revision. A full page reload loses unsaved in-memory edits. F08 will mount the controller, show save/conflict feedback and connect session handling/navigation safeguards; F07 introduces no editor UI.

## F08b implementation contract adjustment (October 2, 2026)

Before F13, `POST /api/projects/:id/idea-suggestions` is a bounded request, not an Inngest job. It accepts an Idempotency-Key and `{expectedDraftRevision,prompt}`. A request receipt and live-project fence commit before Gemini is called once outside the transaction. Successful results return 200; a replay while running returns 202. GET on the same path returns the latest receipt for reload/recovery. Result fields: id, state (running/completed/failed/unknown), sourceDraftRevision, model, suggestions, errorCode and createdAt. Stale input rejects with 409; results never mutate the draft. A stalled request becomes unknown after its deadline, never automatically reruns. A fresh explicit request may spend provider usage again. S01/S02 conversation history/durable job contracts remain planned; this separate route does not claim them.

New requests require saved input. The client disables application after source revision/input changes, and Use idea changes only topic through normal autosave/CAS. Previous results remain readable until a new request is created. Receipt keys bind owner/project/body. Account admission and ownership apply to every read/replay. Deleted/foreign parents return 404. Projects with suggestion history retain the populated-project deletion guard.

`GET /api/voices` returns the single approved Daniel test preset and its authenticated preview path, without provider IDs/keys. `GET /api/voices/daniel-test/preview` retrieves current ElevenLabs voice metadata then proxies a bounded MP3 from an allowlisted HTTPS public sample host; it performs no speech generation. Missing config/access/sample yields a safe unavailable response. Preview availability does not prove synthesis entitlement. R2 media grants/range streaming remain F12.


### F08b provider diagnostics refinement (October 2, 2026)

No request/response shape changes. Terminal failed receipts can now distinguish `PROVIDER_AUTHORIZATION` (upstream 401/403), `PROVIDER_CONFIGURATION` (400/404), `PROVIDER_LIMIT` (429), `PROVIDER_UNAVAILABLE` (other unsuccessful responses), and `PROVIDER_RESPONSE_INVALID`. Network/deadline ambiguity remains `PROVIDER_OUTCOME_UNKNOWN` and state unknown. Error messages are fixed UI copy, not forwarded provider text. Server completion logs contain receipt ID, configured model, HTTP status/null, fixed category and duration; they exclude input and generated content. Logging does not repeat provider calls or change outcomes. The web model is explicitly configured to Flash-Lite with minimal thinking; all deadlines and idempotency behavior are unchanged.


### F08b brainstorming context precedence (October 2, 2026)

The current `prompt` is authoritative when it names a subject or audience. Saved topic/notes are optional context for implicit refinement and must not override an explicit topic switch. Suggestions do not mutate the saved draft; sourceDraftRevision remains the revision of the context snapshot regardless of the suggested subject. No public DTO or persistence schema change.


### F09a staged storyboard contract (October 2, 2026)

F09 is split before exposing S03/S04/S05: F09a implements a pure strict PlanV2 validation module and server-only planner, callable through a local operator probe. F09b will introduce owner-scoped request receipts, immutable candidate persistence and HTTP contracts. No new dashboard endpoint or OpenAPI operation is exposed in F09a.

The initial PlanV2 registry subset is title, takeaway, flow and comparison, all version 1. Events require known component targets/actions and exact case-sensitive narration cues. Source IDs and flow endpoints are validated. Provided-note source excerpts must occur in supplied notes. Pronunciation substitutions must resolve and cannot overlap. Planning duration is estimated from whitespace-separated spoken words (after pronunciation substitutions) at 150 words/minute and must fall within 60–90 seconds; it is not measured narration timing. Actual audio-bound event validation belongs to the compiler stage. The prototype PlanV1 renderer remains separate and is not claimed to consume PlanV2.

A planner call can make at most two provider requests: one initial request and one explicit validation repair of a completed candidate. HTTP failures, transport ambiguity and truncated/blocked output are never retried automatically. Each attempt is bounded at 30 seconds and 128 KiB; F09b must account for both attempts when defining receipt/route budgets. The provider wire schema encodes each visual data object into a bounded dataJson string and omits size/range/pattern constraints from the provider grammar after its full schema was rejected upstream. The complete contract is supplied in instructions; wire parsing, JSON decoding and full local schema/semantic validation remain authoritative. No wire-format data is exposed as a PlanV2 candidate. Exhausted repair returns STORYBOARD_INVALID with bounded path/code diagnostics only.

## F09b implemented API boundary — October 2, 2026

This section supersedes S03's future `202 JobView` contract for the current internal slice. F13 still owns Inngest/durable workers. All endpoints require an admitted cookie session and a live owner-matching project; foreign/missing/deleted resources return 404. Responses are private/no-store and use the existing `{data,meta:{requestId}}` / safe error envelopes. Full machine-readable contracts are in `design/projects.openapi.json`.

| Endpoint | Input | Implemented response |
| --- | --- | --- |
| POST `/api/projects/:id/storyboards` | Exact Origin, Idempotency-Key (16–128 printable non-space ASCII), JSON `{expectedDraftRevision:integer}` | 200 terminal StoryboardReceipt; 202 existing running receipt |
| GET `/api/projects/:id/storyboard-requests/latest` | No query | Newest receipt, or null; 202 running / 200 terminal or absent |
| GET `/api/projects/:id/storyboards` | `limit` 1–50, default 20; optional signed cursor ≤2048 chars | 200 `{data:StoryboardSummary[],page:{hasMore,nextCursor},meta}` |
| GET `/api/storyboards/:id` | `stb_` + 32 lowercase hex characters; no query | 200 StoryboardView including complete validated PlanV2 |

POST example: `{"expectedDraftRevision":2}`. A receipt contains `id`, `projectId`, `state` (`running|completed|failed|unknown`), `sourceDraftRevision`, `model`, nullable `storyboardId`, nullable `errorCode`, and ISO `createdAt`, `updatedAt`, `deadline`. It never exposes keys, raw provider responses, saved notes or internal hashes. The HTTP request waits for the planner; there is no fire-and-forget task. A running replay returns immediately. `Idempotency-Replayed:true` identifies replay; receipt state is current, not a frozen original response.

1. Save a meaningful topic and send the current draft revision with a new key. Blank topics return 422 INVALID_DRAFT; unsupported voices return 422 VOICE_UNAVAILABLE; revision mismatch returns 409 REVISION_CONFLICT; a different active request returns 409 PROJECT_BUSY. Missing provider configuration fails before a receipt/provider call.
2. The transaction claims the shared project slot and records a 75-second receipt. The planner runs outside all retryable transactions, with at most two 30-second calls (one repair only for completed invalid output). One transaction inserts the candidate, completes the receipt and releases that exact slot.
3. Retrying the identical key/body reads that receipt without calling Gemini. Different input with the same key returns 409 IDEMPOTENCY_KEY_REUSED. After a lost response, use that replay to recover the specific command; latest is discovery only and can refer to another tab's newer request.
4. A receipt with `completed` supplies the candidate ID. Failed receipts retain safe provider/validation codes. Unknown outcomes or process termination are never silently retried; after the 75-second deadline, the next storyboard or brainstorming service read/admission marks the receipt unknown and releases its slot. Late completions cannot insert candidates or release a newer slot. An explicit new key may consume additional quota.
5. A storage failure during finalization returns 503 without claiming completion; the candidate and receipt transaction rolls back. Recover using the same key. A request-time/process limit may end execution before the deadline; this slice recovers the receipt, not the terminated task. No automatic retry is implied by a 503.

StoryboardView adds `title`, `wordCount` and computed `stale` to the intended S05 shape. It has `state:review_ready`, `parentId:null`, `approvalId:null`, `changeSummary:null`, empty `changedSceneIds` and `warnings`; no approvals are implemented. `stale` means its source draft revision differs from the current one, even if text was later reverted. List summaries exclude `content` but retain hashes and metadata. History uses descending immutable `(createdAt,_id)` ordering, owner/project-bound HMAC cursors and 24-hour expiry; invalid/expired cursors return 400 INVALID_CURSOR. Newer insertions require refreshing page one. Unknown/duplicate query parameters and unknown JSON fields return 422. Body size/content-type limits remain the shared 256 KiB/JSON rules.

Generation neither updates the working draft nor selects/applies a storyboard. There is no mutation/delete endpoint for a candidate. F10/F11 own review/application/approval; F09b does not render, generate speech, write R2 or publish anything. Structural validity and an estimated 60–90 seconds do not establish factual accuracy or measured speech duration.


## Storyboard reliability checkpoint — implemented local queue

This checkpoint supersedes the earlier synchronous F09b execution budget. POST `/api/projects/{id}/storyboards` atomically commits the receipt, project fence and Mongo queue entry and returns 202. Same-key replay returns that original receipt; it never inserts another queue job. Terminal receipts return 200. Existing authentication, ownership, revision, idempotency and error envelopes remain unchanged.

Receipts add optional `stage` (`queued`, `planning`, `repairing`, `retrying`, `checking`, `ready`, `stopped`), `attempt` (0–4) and `issueCodes` (up to 30 sanitized codes). Optional fields preserve reads of historical receipts. Stage is progress, not a replacement for authoritative `state`. The UI polls/replays every 2.5 seconds while visible and automatically opens the completed candidate. No exact completion-time promise is made.

Worker policy: four model calls maximum including all validation repairs and transient 429/5xx retries; 30 seconds per call and 180 seconds from enqueue overall. Transient retry waits are 1/2/4 seconds within that budget. Auth/configuration failures stop immediately; network/timeouts and interrupted running jobs are not silently retried. Completed invalid candidates receive targeted repairs and strict revalidation. `STORYBOARD_INVALID` includes safe validation codes; `PLANNING_DEADLINE` is a known planner stop, while expired claimed requests remain `unknown`/`PROVIDER_OUTCOME_UNKNOWN`. A job atomically confirmed still queued expires as `failed`/`QUEUE_EXPIRED`, with no provider dispatch. Same-key replay preserves that terminal result. Only a fully valid plan becomes an immutable review candidate. No rendering approval is implied. The local queue is not Inngest and has no public worker endpoint.


## F10b1 — Editable storyboard draft API (implemented October 6, 2026)

This backend checkpoint implements S06 and extends P07; the Cinema editing controls are F10b2. Generated candidates remain immutable. No approval, restoration endpoint, AI revision, rendering or publishing is added.

- `POST /api/projects/:id/draft/apply`: authenticated, admitted owner; same-origin JSON; Idempotency-Key required. Body `{expectedDraftRevision, storyboardId, expectedContentHash}`. Copies an owner/project-matching candidate into `editablePlan`, sets `sourceStoryboardId` and the selected candidate pointer, increments the shared draft revision, and stores the command result atomically. Response 200 DraftView. Foreign/missing resources return 404; revision/hash/key reuse conflicts return 409. Existing populated working copies are replaced only by this explicit, revision-checked action; future UI must make this clear.
- Same-key/same-body replay returns the exact original result with `Idempotency-Replayed:true`, even if later edits exist. It does not apply again. Consumers must GET the current draft after recovery before treating the replay snapshot as current. Same key with different body returns `IDEMPOTENCY_KEY_REUSED`. Deleted projects refuse replays.
- `PATCH /api/projects/:id/draft`: `changes.editablePlan` now accepts the bounded PlanV2 draft shape or null. A non-null plan requires an already applied source. Narration, scene title/kicker, storyboard title/objective and visual label text can be temporarily empty; overlong text, invalid IDs, unknown fields, arbitrary code/components, or malformed arrays return 422 without saving. Cue/pronunciation structure remains strict. Semantic issues (missing cues, short narration, unsupported source references) are returned in validation without discarding the draft. `editablePlan:null` clears the working plan, provenance and selected candidate pointer.
- Idea fields and editablePlan share one revision fence. Saving idea fields preserves the plan and marks it stale if their values change. Editing plan text does not reset that stale flag. Applying a candidate from an older source revision keeps the stale warning. Plan voice must match the draft voice. Fresh full validation is computed on reads/saves from current notes/voice; `validation.valid` means the draft passes these checks, **not approval or verified factual accuracy**.

Example after applying at revision 2: GET returns revision 3 with an editablePlan. PATCH `{expectedRevision:3,changes:{editablePlan:<modified full plan>}}` returns revision 4 and validation issues, if any. A competing save at revision 3 returns 409 and must be explicitly reconciled. No API call here consumes provider quota.

### F11a implementation checkpoint

Only the internal storyboard revision engine is implemented. S07/S08 and G01 remain planned routes; the new server module is not an authenticated API and returns no persisted version/job/approval ID. Its input is a valid source PlanV2, saved idea, trusted freshness flag and `{instruction, sceneId?}`. Output includes validated content, planning estimate, provider metadata, trusted changed-scene IDs/metadata field names and `requiresApproval:true`. Future route admission must independently enforce ownership, source hash, draft revision, idempotency and the shared active-project slot; it must never trust a client-provided freshness flag. Initial revision scope preserves scene IDs/order/count and voice/language/audience. No public OpenAPI change is made at this checkpoint.

### F11b1 implemented revision API

`POST /api/projects/:id/revisions` is now implemented for `source.kind:"storyboard"` only. Body: `{expectedDraftRevision,source:{kind:"storyboard",id,hash},instruction,sceneId?}`. Instruction is trimmed, meaningful and at most 4,000 characters. Extra fields, unsupported video sources and malformed IDs/hashes return 422. Cookie authentication, active internal admission, exact Origin, JSON content type, bounded body and Idempotency-Key are required. Foreign/missing project or source returns 404; stale draft returns 409 REVISION_CONFLICT; wrong source hash or a changed/stale working copy returns 409 SOURCE_CHANGED; unknown scene returns 422 INVALID_SCENE; an occupied shared job slot returns 409 PROJECT_BUSY. A fresh source must either have the current draft revision or be the exact unchanged, non-stale applied working copy. Saved manual edits are not silently excluded from a revision: they require a future immutable edited-source snapshot before this endpoint can revise them.

Acceptance returns 202 with the existing StoryboardReceipt and invokes no provider in the request. The source reference/hash, instruction and scope are atomically committed alongside the receipt, idea snapshot queue row and project slot. Same-key/exact-body replay returns the same receipt (202 running or 200 terminal) with Idempotency-Replayed:true; reuse with changed input or the other storyboard POST route returns 409. Read the shared `/storyboard-requests/latest` or replay the exact revision command to recover after reload. This shared latest endpoint includes generation and revision work; GET does not initiate either.

The separate worker calls the revision engine and revalidates its candidate against the pinned source before committing. Existing storyboard GET/list responses now expose `parentId`, deterministic `changedSceneIds` and a short `changeSummary` for revision results; ordinary generated candidates retain null/empty defaults. Content/hash/sourceDraftRevision and staleness retain their existing meanings. Results never apply themselves, select a candidate, rewrite drafts or inherit approval. Existing explicit draft/apply can apply a reviewed candidate. Queue expiration/unknown outcomes use the same bounded policies as generation. Dedicated restore, messages/conversation UI, edited-source snapshots and video-side revisions remain unimplemented. No new approval or render route is added.

### F11b3 edited-source snapshot endpoint

`POST /api/projects/:id/storyboard-snapshots` requires the authenticated cookie, active internal admission, same Origin, JSON and Idempotency-Key. Body is exactly `{expectedDraftRevision, expectedContentHash}`; the hash is the saved **DraftView.contentHash**, not an existing candidate hash. It atomically freezes the saved editablePlan into a review-ready manual candidate and returns `200 {data:{storyboardId},meta:{requestId}}`. It makes no provider request, creates no running job and changes neither working draft nor selection. Result reads expose `origin:"manual"` (ordinary candidates: `"generated"`), parentId and differences. The new candidate's own contentHash and sourceDraftRevision can then be used with the existing revision endpoint.

Errors: 401/403 authentication/admission/origin, 404 foreign/missing project, 409 REVISION_CONFLICT/HASH_MISMATCH/PROJECT_BUSY/IDEMPOTENCY_KEY_REUSED, 422 malformed body/STORYBOARD_REQUIRED/PLAN_STALE/INVALID_DRAFT. Snapshot creation requires a valid, non-stale plan with an owner/project-scoped source. Semantic validation is not factual approval. Same-key/exact-body replay returns the original storyboardId with Idempotency-Replayed:true even after later draft edits; it never creates a replacement from the newer text. Distinct explicit keys can create separate versions. The client rereads the current draft and opens the immutable result rather than restoring an old draft snapshot. Full worker/live revision policies remain unchanged.

## F11c1 implemented checkpoint — exact storyboard approval (October 7, 2026)

This incremental endpoint precedes the planned G01 generation command. `POST /api/projects/:id/storyboard-approvals` accepts an authenticated admitted owner, exact same-origin header, JSON body and Idempotency-Key:

```json
{
  "storyboardId": "stb_<32 lowercase hex>",
  "expectedDraftRevision": 4,
  "expectedDraftHash": "<64 lowercase hex: saved draft contentHash>",
  "expectedContentHash": "<64 lowercase hex: selected candidate contentHash>",
  "approve": true
}
```

`approve` must be literally true; fields are strict. HTTP 200 returns `{data:ApprovalView,meta:{requestId}}`. ApprovalView contains `id` (apr ID), `projectId`, `kind:"story"`, `subjectId`, `subjectHash` (storyHash), `contentHash` (full PlanV2 including cues), `canonicalizationVersion:1`, `approvedBy`, ISO `approvedAt`, `reason:"explicit"`, `reviewedDraftRevision` and `reviewedDraftHash`. All responses are private/no-store. The endpoint has no query parameters or pagination; existing paginated storyboard history and candidate GET return derived `state:"approved"` and `approvalId` for the exact approved version. No separate approval-list endpoint is implemented.

Admission checks current draft revision/hash, no active request, exact owner/project candidate content and canonical hashes, and semantic validation against the saved notes/voice. The candidate must have been created from the current saved draft revision, or remain its exact non-stale applied working copy. A newly generated/revised candidate at the current revision can supersede a stale older working plan without silently applying it. Saved manual differences require a new immutable snapshot and review. Freshness does not prove factual accuracy or that the human read the content; explicit approval is the owner's assertion.

Same-key identical replay returns the original approval with `Idempotency-Replayed:true`, even after later draft changes. It still requires authentication/admission and a live owned project. Different input with that key returns 409 IDEMPOTENCY_KEY_REUSED. New keys recheck all preconditions and converge on the original approval for the same version, retaining its original time/review metadata. A lost response is recovered only by replaying the original key/body, not by reconstructing from a later draft. 409 also covers REVISION_CONFLICT, HASH_MISMATCH, SOURCE_CHANGED and PROJECT_BUSY; 422 covers VALIDATION_FAILED or INVALID_DRAFT; 401/403/404 retain shared access semantics. 503 is an unconfirmed service outcome: retain the command for recovery. No automatic fresh-key retries.

This call does **not** select/apply the candidate, alter the draft, call AI/TTS, allocate a render job, create a video, approve a video or authorize publishing. Historical story approval remains after later edits; every new candidate, even a cue-only change with the same storyHash, needs explicit approval. G01's combined approve-and-generate flow is still planned and must be reconciled with this durable approval record when rendering is implemented. Provider voice/model resolution and rendering configuration are not frozen by this story-only API. Migration 010 is required; confirmation UI is F11c2. The checked-in `design/projects.openapi.json` is the exact implemented wire contract.


## F12 implemented media API checkpoint — October 7, 2026

The generated `design/projects.openapi.json` is the exact implemented public contract. These routes require the admitted owner's Better Auth session; mutations require the exact application Origin. Unknown/foreign/deleted subjects return 404. Responses are private/no-store and include a request ID. No public upload or provider-generation route is added.

| Route | Request | Success |
| --- | --- | --- |
| GET `/api/projects/{id}/assets` | `limit` 1–50 (default 20), optional last asset-ID `cursor`; extra/duplicate parameters rejected | `{data:[{id,projectId,kind,state,contentType,bytes,createdAt}],page:{hasMore,nextCursor},meta:{requestId}}` |
| POST `/api/assets/{id}/access` | `{ "purpose": "preview" }` or `download` | `{data:{url,expiresAt,contentType,bytes},meta:{requestId}}` |
| POST `/api/assets/{id}/revoke` | `{}` | `{data:{revoked:true},meta:{requestId}}` |

Listing sorts immutable IDs ascending and always reapplies owner/project scope; it is not creation-time ordering or a frozen pagination snapshot. Internal alignment/timeline/QA JSON can be listed but cannot receive browser grants. Captions support download only. Extra body fields are rejected. Access issuance is deliberately not idempotent: a repeat creates another expiring grant without generating media. Revoke affects existing grants; subsequent issuance is allowed.

Errors use `{error:{code,message,requestId,retryable},meta:{requestId}}`: 401 UNAUTHENTICATED, 403 ACCESS_DISABLED/INVALID_ORIGIN, 404 NOT_FOUND, 409 ASSET_NOT_READY, 422 VALIDATION_FAILED/PREVIEW_UNAVAILABLE, and 503 STORAGE_NOT_CONFIGURED/STORAGE_UNAVAILABLE. Existing body parsing also enforces JSON type/size. A failed request does not imply missing media or authorize regeneration.

The returned bearer URL is `/media/{256-bit-base64url-token}` at the configured gateway, valid for ten minutes. Gateway GET/HEAD supports single bounded, open-ended or suffix byte ranges (206); invalid/unsatisfiable ranges return 416. If-Range compares the SHA-256 ETag; mismatch returns the full object. Content-Disposition distinguishes inline and attachment. All responses use private/no-store, no-referrer and nosniff; CORS permits only the configured app origin. Requests without Origin still require the bearer token. Unauthorized/missing objects are 404; authorization/storage failures are 503. No raw R2 key appears in public JSON.

Internal POST `/api/internal/media-authorize` is service-only. Body is `{token,method:"GET"|"HEAD",range?:string}` bounded to 4096 bytes. Headers `x-media-time` (milliseconds within 30 seconds), `x-media-nonce` (UUID), and `x-media-signature` authenticate HMAC-SHA256 over `POST\n/api/internal/media-authorize\nSHA256(rawBody)\ntimestamp\nnonce`. Nonces are persisted uniquely before authorization; replay fails closed. Success is `{data:{objectKey,contentType,bytes,sha256,disposition}}`, returned only to the gateway. Internal errors disclose only NOT_FOUND (404) or SERVICE_UNAVAILABLE (503). Tokens, signatures and response keys must not be logged. Secret rotation invalidates service communication until both deployments agree; existing bearer grants remain in the database.

## F13 implemented job-control checkpoint — October 7, 2026

This checkpoint intentionally precedes the planned approve-and-render G01 contract. POST `/api/projects/{id}/generations` currently means **prepare an already-approved storyboard job**, not create a video. Body: `{storyboardId,approvalId,expectedDraftRevision,expectedDraftHash,expectedContentHash,confirm:true}`. Exact owner, live project, saved draft revision/hash, validated full storyboard content/hash and matching story approval are required. Fresh candidates or exact non-stale applied copies are eligible. The transaction freezes input, claims the existing shared project slot, inserts a job, command receipt and outbox record. Same-key replay returns the recorded acceptance even after progress/draft changes; different payload under that key rejects. GET progress is authoritative.

- GET `/api/projects/{id}/generations`: latest job, or null, ordered by createdAt/ID; no history pagination in this checkpoint.
- POST on that route: 202 JobView with Origin and Idempotency-Key required.
- GET `/api/jobs/{id}`: owner-only current job, with live-parent checks.
- POST `/api/jobs/{id}/cancel`: `{expectedRevision}`, Origin and Idempotency-Key required; 200 recorded cancellation response. Queued becomes cancelled; running becomes cancel_requested. Terminal jobs reject fresh cancel commands. Exact cancellation replay remains available.

All public routes require admitted Better Auth sessions, strict body/query validation and private/no-store envelopes. Foreign/deleted parents return 404; wrong origin 403; stale revision/hash/source and PROJECT_BUSY return 409; missing exact approval returns APPROVAL_REQUIRED; invalid content returns 422. Extra query parameters are rejected. Responses expose no input snapshots/provider credentials.

Implemented JobView states are queued/running/cancel_requested/cancelled/needs_input/failed; stages queued/checking/stopped. View includes revision, attempt, storyboardId, safe errorCode, timestamps and actions.cancel. No succeeded/video result, retry/regenerate route, external stage progress or implicit approval is implemented. Pure preflight ends needs_input/RENDERER_NOT_CONNECTED; malformed frozen content fails INPUT_INVALID. Queue-only deadline is QUEUE_EXPIRED; dispatched expiry is JOB_DEADLINE. These preflight outcomes never claim a provider was invoked.

The official SDK serves `/api/inngest` with POST signature verification. Explicit local mode is loopback-only and disabled in production. Events contain jobId only; ownership and input come from committed MongoDB records. The bounded cron outbox/reconciliation function does not rely on browser activity. Actual local Inngest 1.46.0 cron/event delivery passed against disposable data; cloud delivery remains unverified. The local worker also drives the same services for development. No unrestricted worker endpoint is added.

### F14 implemented local generation amendment (October 7, 2026)

The F13 generation endpoint now freezes a fixed `renderConfig` and is executed by the dedicated local worker. Request adds optional `acknowledgePossibleRepeat: true`; if any speech stage exists for the owner's project, omission returns 409 `REPEAT_ACK_REQUIRED`. Confirmation must explain that a fresh generation may repeat speech charges. Same-key replay is checked first and still returns the original acceptance. New jobs have queued/checking/speech/rendering/uploading/complete progress; terminal success is `succeeded`. Existing owner/origin/idempotency/cancellation rules remain in force. `GET /api/projects/{id}/generations` remains latest-only.

Unknown speech results stop with `needs_input / PROVIDER_OUTCOME_UNKNOWN`; inaccessible stored speech stops with `SPEECH_RECOVERY_REQUIRED`; measured timing failure uses `SPEECH_TIMING_INVALID`. No automatic charged retry, same-job Retry audio endpoint, cross-job speech cache, or cloud render callback is implemented. A fresh confirmed generation uses current exact approved input. The complete worker result exposes a verified private MP4 and VTT through the existing assets API only after atomic completion; prior assets remain intact. F15 dedicated video versions/approval remains planned. Hosted media playback still requires the separately deferred gateway configuration/deployment. The Inngest event function acknowledges dispatch without consuming the local worker's job.

### F15 implemented video review contract

Migration 014 adds immutable `vid_` versions for completed local renders. `GET /api/projects/{id}/videos?limit=20&cursor=vid_…` returns `{data:VideoView[],page:{hasMore,nextCursor},project:{id,title,revision,selectedVideoId,latestReadyVideoId},meta:{requestId}}`. Limit is 1–50; ordering is createdAt descending then ID descending. Cursor must refer to an existing same-owner/project version. New renders appear on refresh. `GET /api/videos/{id}` returns `{data:VideoView,meta}`. VideoView includes ID, project/storyboard IDs, title, measured duration, MP4/VTT asset IDs, outputHash, renderSpecHash, createdAt and nullable exact approval. It exposes no object keys, provider credentials, signed URLs or full frozen render input.

`POST /api/videos/{id}/approve` accepts only `{expectedOutputHash,expectedRenderSpecHash,approve:true}` and returns `{data:{id,projectId,kind:"video",subjectId,subjectHash,outputHash,renderSpecHash,approvedAt},meta}`. The subject hash is SHA-256 of canonical `{outputHash,renderSpecHash}`. Existing exact approval is reused; another version never inherits it. Approval neither publishes nor changes project selection. Downloads are permitted before approval through F12 grants.

`POST /api/videos/{id}/select` accepts `{expectedProjectRevision}` and returns `{data:{projectId,videoId,projectRevision},meta}`. This dedicated command supersedes the planned selectedVideoId PATCH field for this slice. It uses metadata revision CAS, increments that revision and never removes previous output/approval. The first new render initializes an absent selection; later renders only advance latestReadyVideoId. Legacy backfill leaves an absent selection unset, allowing UI fallback to latest.

Both POSTs require same-origin Origin and Idempotency-Key (16–128 visible ASCII characters). Same-key replay returns the original result after current authentication, admission and undeleted ownership checks; refresh reads current selection. Another body under the same scoped key returns 409 IDEMPOTENCY_KEY_REUSED. Other errors include 401 UNAUTHENTICATED, 403 ACCESS_DISABLED/INVALID_ORIGIN, 404 NOT_FOUND, 409 VIDEO_NOT_READY/HASH_MISMATCH/REVISION_CONFLICT, 400 INVALID_CURSOR, 422 VALIDATION_FAILED and sanitized 503 SERVICE_UNAVAILABLE. Extra/duplicate query and body fields are rejected. Request IDs and private/no-store headers follow the existing facade. Unknown client mutation outcomes retain the exact key/body in user/project-scoped recovery storage and require explicit recovery.

The Cinema review screen at `/projects/{id}/video` supports native playback, expiring-link refresh, older-version browsing, saved selection, confirmed approval and prepared MP4/VTT download. Preview metadata must load before enabling the user's review checkbox; that checkbox records a human assertion, not automatic audiovisual quality validation. Hosted gateway deployment remains deferred. Caption editing, video regeneration commands and Instagram publication are not part of F15.


F15 recovery storage amendment: the browser persists each approval/selection receipt under an owner/project/command-UUID key. Concurrent tabs cannot overwrite another command's record. Completion removes only its exact receipt, then exposes another unresolved receipt for explicit recovery if present. Previous single-record receipts remain readable and are cleared only when matching the completed request. No mutation is sent merely by loading or discovering another tab's pending record; existing tabs must reload to use the updated client.

## F16 implemented addendum — caption revisions

`GET /api/videos/{id}/captions` returns owner-scoped saved caption groups, scene-local start/end frames (30 fps), original/display text, half-open Unicode-codepoint source spans and the saved speech fingerprint. It verifies the stored narration object before reconstructing timing. It never synthesizes speech. The generated `design/projects.openapi.json` is the exact request/response schema.

`PATCH /api/videos/{id}/captions` accepts `{expectedRenderSpecHash, overrides}`. Each override contains `sceneId`, `speechFingerprint`, `sourceStart`, `sourceEnd`, `displayText` (1–200 characters). At most 100 overrides; this is a complete replacement list, so an empty list restores the originals. Spans must match whole original caption groups, with no duplicates. Only capitalization and whitespace differences are accepted; changed words, punctuation or word boundaries require storyboard revision and narration approval. Interior spaces are preserved in display text, VTT and render layout. Leading/trailing whitespace is trimmed; tabs and line breaks become individual spaces so they cannot create VTT cue boundaries. Speech-safety comparison still collapses whitespace.

`POST /api/videos/{id}/regenerate` accepts `{expectedRenderSpecHash}` and retains the source version's caption overrides. Both mutation routes require the existing same-origin authenticated JSON request and Idempotency-Key. Both return 202 with `{data:{sourceVideoId,sourceRenderSpecHash,job},meta:...}` through the standard response envelope. Replaying the exact key/body returns the same receipt; different bodies conflict. These requests enqueue a new video version and do not change the selected video or copy its approval. Existing job progress/cancel/recovery APIs apply.

Errors use the normal sanitized envelope: missing/foreign/deleted source 404; stale source, busy project, duplicate key with different body or no changes 409; invalid spans/meaning/timing 422; unavailable or unverifiable saved speech 503 `SPEECH_RECOVERY_REQUIRED`. No missing-cache fallback invokes ElevenLabs. Clients preserve unresolved immutable commands using the F15 per-command records. Caption drafts themselves use tab-scoped sessionStorage keyed by owner/project/video and source hash. No endpoint returns storage keys or speech bytes.

## F17 implemented addendum — personal preferences

P08/P09 are now implemented at `/api/preferences`, with authenticated admission, owner scope from the session, `private, no-store` responses and same-origin JSON PATCH. GET rejects query parameters and returns `{data:{revision,timezone,defaultVoicePreset},meta:{requestId}}`. Before the first save it returns virtual defaults `revision:0`, `Asia/Kolkata`, `daniel-test` without creating a database row. Persisted revisions start at 1. PATCH accepts `expectedRevision` (0–2147483646) and at least one of timezone/defaultVoicePreset; unknown fields are rejected. IANA region names (including aliases accepted by the runtime) and UTC are validated with Intl; numeric offsets and invalid zones yield INVALID_TIMEZONE. Only the current selectable voice catalog is accepted; currently Daniel test voice.

Saves use owner/revision compare-and-swap; simultaneous first saves are serialized by the existing unique owner index. A stale revision returns 409 REVISION_CONFLICT. Generic service failures remain unknown: the tab stores the exact pending body before dispatch and retries the same expected revision on Recover save. A 409 triggers an explicit saved/local comparison, never silent overwrite or an assumption that an unchanged read settled a delayed write. Repeating a committed CAS request cannot increment twice. This is revision-based recovery, not a new idempotency-key API. Definitive validation failures release the pending record; storage failure blocks submission. Pending receipts are sessionStorage-scoped per owner/tab.

Settings supports manual save, discard, conflict review, reload recovery, timezone suggestions, current Daniel preview and leave/sign-out warnings. Unsaved edits are not autosaved; pending saves remain recoverable in the same tab. The saved voice is snapshotted by existing project creation; existing drafts, storyboards, jobs and videos are not rewritten. Timezone persistence supplies a future scheduling default; it does not yet add scheduling or change every date display.

### F18 implementation checkpoint (October 7, 2026)

The connect/callback/connection endpoints are implemented in `apps/web/src/instagram` with generated contracts in `design/projects.openapi.json`. GET adds `X-Instagram-Configured: true|false` for configuration readiness; this is not a live-provider health claim. Callback returns to `/settings/instagram` with an allowlisted outcome and optional owned project context (the project link opens video review). Pending disconnects use sessionStorage, scoped by owner and tab, and replay the original key/body. A later authoritative GET supplies current state after replay.

F18 deliberately keeps `publishingAvailable:false`. Nonterminal publish intents cause `CONNECTION_RECONCILIATION_PENDING`; automatic pausing and submitted-publication reconciliation remain F19/F20 work. Thus current successful disconnect returns `pausedIntentCount:0,reconciliationPending:false` only after checking there are no such intents. No remote publication is performed. Live Meta configuration/callback acceptance remains pending; local fixture results do not prove provider compatibility.

### F18 Facebook Login extension (migration 016)

GET additionally supplies `X-Instagram-Provider: instagram|facebook`. POST connect accepts `pageId` (1–100 numeric characters): required for Facebook Login and forbidden for the direct provider. It binds the selected Page, provider and app ID to the existing single-use OAuth receipt. The callback never accepts a Page choice from query parameters. Public connection adds `provider` and nullable `{id,name}` Page identity; `account.type: PROFESSIONAL` is used when the provider establishes eligibility but does not return Creator versus Business. `expiresAt:null` on a connected Facebook record means verified no scheduled expiry, not perpetual validity. Tokens and intermediary user credentials remain server-only.

Additional rejection outcomes: `page_required`, `page_unavailable`; provider/configuration changes invalidate pending authorization. The Facebook provider uses its configuration ID for the consent scopes and checks both user and Page-token grants. `business_management` is not requested. Same Page/provider/app/account reconnect preserves destination epoch; changing any destination binding increments it. Publishing remains disabled.


## Hosted dispatch implementation addendum (October 8, 2026)

Implemented locally; disabled until the deployment/credential/workload checkpoint in PROJECT_STATUS is approved and verified. The five existing enqueue mutations retain their original authentication, origin, idempotency, body and response contracts. An accepted 202 registers a post-response dispatch kick; no cloud operation name, token or project input is added to their public response. Existing read/progress/cancel APIs remain authoritative. A post-response kick is best-effort; independent reconciliation is required.

`POST /api/internal/cloud-dispatch` is an operator/scheduler endpoint, not a browser API. Header: `Authorization: Bearer <separate 32+ character scheduler secret>`. No query parameters or non-empty body are accepted (including `{}`). Empty streamed POST bodies are accepted. Response cache policy is `private, no-store`; maximum route duration is 60 seconds. Cloud mode defaults off. Request IDs/job IDs/owners are never supplied by this caller; the dispatcher derives them from durable owned queues.

Successful response: `{data:{launched,reconciled,unknown,rejected,waiting,unavailable,issue}}`, with integer counters and `issue: null | {category:string,status:number|null}` containing sanitized operator diagnostics. A 200 means the tick completed, not that all jobs started or any video succeeded; inspect `unavailable`/`issue` and saved business state. Invalid bearer returns empty 401; invalid method/query/non-empty body returns empty 400; disabled mode returns empty 503. An unexpected runtime/setup failure returns 503 `{error:{code:"CLOUD_DISPATCH_UNAVAILABLE"}}`. Unsupported methods at the Next route receive 405. Raw provider bodies, credentials, user input and media URLs are excluded.

Definite launch rejection settles a still-queued business receipt with `WORKER_UNAVAILABLE`; confirmed cloud completion before the worker consumed it uses `WORKER_STOPPED`; reaching the configured daily attempt limit uses `PILOT_DAILY_LIMIT`. These are saved business outcomes, not enqueue HTTP failures. Existing queue/deadline codes remain. Ambiguous launches are never replayed automatically. Cancellation fences saved output/provider work using the existing controller; it does not assert immediate termination of cloud compute. Inngest is disabled when Cloud Run mode is enabled. This endpoint grants no social publishing capability.

## F19 implementation addendum — reviewed Post now (October 8, 2026)

Implemented routes: `POST /api/publish-intents`, `GET /api/projects/:id/publish-intents?limit=20&cursor=...`, `GET /api/publish-intents/:id`, and `POST /api/publish-intents/:id/cancel|retry`. Mutations require the existing cookie session, current internal admission, exact Origin, JSON body, and Idempotency-Key. Creation accepts the U02 payload above with **mode `now` only**, `confirm:true`, no arbitrary asset URL, schedule or repost override. Cancel/retry take `{expectedRevision,confirm:true}`. Creation returns 201, reads/actions 200, private/no-store, request ID, Location and Idempotency-Replayed when applicable. Replay returns the current state of the same immutable intent, not a second job. History uses an owner/project-bound createdAt/ID cursor, maximum 50. Invalid fields are 422, foreign/missing resources 404, stale revisions/destination/approval or existing publication 409, inactive rollout 503 `PUBLISHING_DISABLED` (explicitly not accepted). Unclassified 503/timeouts remain unresolved client receipts.

`PublishIntentView` for F19 is defined by `src/publishing/contracts.ts`: exact video ID/title, assetHash, destination including usernameAtApproval, frozen caption, revision, state, timestamps, nullable media ID/permalink/errorCode and cancel/retry capabilities. The separate planned payloadId, editing/PATCH, caption-generation U01, scheduling and deliberate repost commands are not implemented in F19. Cancelled/safely failed requests can be explicitly retried using the same immutable intent. A unique owner/video/Instagram-account key prevents creating another intent with a fresh request key. A different caption after cancellation requires future intent-editing support; no silent mutation of the reviewed payload is offered.

Execution: Next `after()` kicks one bounded tick following authenticated publication reads/mutations. An independent **POST `/api/internal/publish-tick`**, empty body only, uses `INSTAGRAM_PUBLISH_SCHEDULER_SECRET` and `INSTAGRAM_PUBLISH_ENABLED=1`. A minute scheduler must call this endpoint to progress without an open browser. It is independent from the paused render dispatcher and does not use Cloud Run rendering. Each tick performs one container creation/status operation, or final publication plus optional permalink lookup, with 12-second provider timeouts and no POST transport retries. A lease prevents concurrent ticks. Five processing polls, spaced at least one minute, bound normal processing; uncertain submission is read-only reconciled up to 15 polls before needs_attention. Both rollout and external scheduler remain unactivated pending separate live-post approval.

Container creation is preceded by `preparing`; abandoned creation fails safely because only `media_publish` can post. `submitting` is committed before that POST; any lost response/worker interruption becomes outcome_unknown, never a blind publish retry. A returned media ID or container PUBLISHED status confirms publication. If the link lookup fails or reconciliation provides no media ID, the UI states that publication was confirmed but its link is unavailable; it does not guess a permalink from recent media. Reconnect/disconnect pauses all pre-submit work transactionally, while already submitted credentials stay encrypted and scoped to the original intent for reconciliation. Updating the connection cannot retarget a frozen intent. Retry revalidates the original account, approval, ready asset, configured provider and current destination epoch.

Private ingest uses a separate one-hour hashed grant, inaccessible through ordinary preview/download APIs. The existing signed authorization endpoint verifies the intent's state, attempt, asset hash, owner admission and project on each request. Cancellation/connection pause invalidates those grants. The R2 bucket stays private; only the temporary bearer URL is sent to Meta. Ordinary preview tokens retain their existing ten-minute rules. No provider token, container transport body, secret or ingest URL appears in the public intent view or logs.

Provider reference: Meta's official [Instagram API collection](https://www.postman.com/meta/workspace/instagram/documentation/23987686-9386f468-7714-490f-9bfc-9442db5c8f00), Reels `media` → container `status_code` → `media_publish`; adapter supports both configured Instagram and Facebook Graph hosts. Local fixtures verify protocol handling; they do not establish live publication success or App Review eligibility.

### F20 implemented scheduling and replacement contract

F20 extends F19 with `mode: "schedule"` and `schedule: {localTime: "YYYY-MM-DDTHH:mm", timezone: IANA identifier, utcOffset: "+05:30"}`. Schedule is forbidden for `now` and required for `schedule`. The server validates the actual local calendar time, timezone and selected offset, rejects DST gaps and requires an explicit valid occurrence for overlaps. Minimum lead time is five minutes at transaction acceptance; it stores both UTC and the confirmed original local representation. Errors include `INVALID_LOCAL_TIME`, `INVALID_UTC_OFFSET`, `AMBIGUOUS_LOCAL_TIME` and `INVALID_SCHEDULE` (422). Valid offsets appear in the error message. The API does not infer a timezone. The UI defaults to saved preferences → browser timezone → Asia/Kolkata, and stores drafts in tab-scoped recovery storage.

`PATCH /api/publish-intents/:id` accepts the complete create body plus `expectedRevision`. It requires session/admission, exact Origin, JSON, Idempotency-Key and `confirm:true`. It can replace scheduled/queued/paused_auth/failed_safe/cancelled requests, including the exact approved version, caption, destination and time. It rejects preparing/processing/submitting/published/unknown/manual-review states with `INTENT_ALREADY_CLAIMED`; revision conflicts return `REVISION_CONFLICT`. Project ID cannot change. All approval, ownership, readiness, destination-epoch and duplicate checks are rerun transactionally. Response is 200 and the same intent ID at a new revision. Replay returns current state, even after rollout is disabled or later replacement; client recovery accepts authoritative replay rather than falsely demanding the old payload still be current. F19's one-video/account intent uniqueness remains: no deliberate repost support.

Views now include `mode`, nullable `schedule` with ISO `utc`, `retryDeadlineAt`, and `actions.edit`. State adds `scheduled`. `GET /api/projects` includes nullable `nextSchedule` (earliest pending schedule, original timezone/time/offset, intent/video IDs); the Scheduled filter uses transactionally maintained flags. Editing preserves the local draft on conflict and requires explicit review against the refreshed saved revision. To replace an old scheduled version, open publishing from the newly approved video, select Edit / reschedule on the existing history entry, and review the displayed replacement video and destination.

At the due time the existing bounded publisher claims the saved intent; no Meta container is created early. The deadline is due + 15 minutes (acceptance + 15 minutes for now; legacy F19 rows derive from createdAt). A pre-submit intent past that deadline becomes `failed_safe` / `DELIVERY_WINDOW_EXPIRED`, sets Needs attention, and cannot use Retry. PATCH with a new explicit now/time approval is required. Explicit safe retries before expiry retain the original due time; future schedules never become immediate posts. Processing polls remain bounded; provider POSTs are not automatically retried. Submitted/unknown outcomes continue read-only reconciliation beyond the deadline, retaining F19's duplicate protection. Cancellation retains F19's safe pre-submission behavior; payload replacement stops at claim.

Activation is still off by default. Independent minute ticks, deployment and migrations 018–019 require the separate live activation checkpoint. One tick processes one due intent; this internal-pilot throughput is not a scale or exact-time SLA. No real scheduled post was made during local implementation.
