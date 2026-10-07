# NamasteVideo.ai

A local TypeScript prototype for short educational motion-graphics videos. The first user-reviewed output is `runs/water-cycle-viraj-live/output.mp4`: 81.7 seconds, 1080 × 1920, Daniel narration, captions and animated water diagrams. The storyboard for that first video was authored. Gemini planning and conversational revision are now working through Gemini 3.5 Flash's Interactions API.

The repository also includes an isolated Next.js application in `apps/web`, with database and internal authentication foundations, Cinema sign-in/recovery screens and a protected workspace entry. Personal project APIs and the My videos library UI are implemented. Idea editing and hosted generation remain future features. [Project Status](PROJECT_STATUS.md) is the development source of truth; [prototype status](PROTOTYPE_STATUS.md) retains historical pipeline evidence.

## Run the application scaffold

Use Node **24.21.0** (`nvm use` reads `.nvmrc`), then:

```sh
npm ci
npm run dev
```

Open http://localhost:3000 for the scaffold preview and `/foundation` for Cinema UI specimens. These routes do not save data or call providers. `npm run build` builds the web app; `npm start` serves the production build locally. `npm run check` checks both workspaces and runs the existing prototype tests.

The web app's public directory is separate from root `public/runs`. Do not copy or link prototype media into it. Root `.env.local` belongs to the CLI; future web secrets go in ignored `apps/web/.env.local`. This scaffold needs no environment variables.

## Application design documents

- [Product requirements](PRD.md)
- [System design](SYSTEM_DESIGN.md)
- [API design: requests, responses, authentication, errors and pagination](API_DESIGN.md)
- [Database design: schemas, relationships, indexes, state and transactions](DB_DESIGN.md)

The application contracts are design documents, not deployed endpoints or migrations. Cinema screen designs are approved for implementation; features are being built incrementally according to Project Status.

## Database foundation

The server-only MongoDB adapter and initial schema setup live in `apps/web/src/db`. Public preview pages work without a database. Account and project APIs require the database/auth setup below.

For an isolated development replica set or Atlas database, create `apps/web/.env.local` from its `.env.example` and configure `MONGODB_DATABASE` plus two separate credentials:

- `MONGODB_URI`: application runtime access, without schema/index administration or validation bypass privileges.
- `MONGODB_MIGRATION_URI`: operator setup access to create collections/indexes and write migration records. Do not install this credential in the hosted web runtime.

Run `npm run db:setup` explicitly from the repository root. It loads only the web environment file, never the prototype environment. It creates strict validators and named indexes for `internalAccess`, `preferences`, `projects`, `conversations` and `schemaMigrations`. It requires a transaction-capable topology, records a checksum/lease/checkpoint, reruns additive setup safely, and refuses validator drift or an edited migration. Existing mismatched schemas or conflicting indexes require a reviewed migration; setup never drops records or silently replaces validators. Keep the applied foundation definitions immutable when adding subsequent migrations.

This is infrastructure only: owner/reference checks, timezone validation and project/draft atomic creation are implemented with their respective future features. MongoDB schemas do not provide foreign-key or user-authorization guarantees. Authentication setup is described below.

Run `npm run test:db` for real MongoDB integration tests. They launch and stop a disposable **MongoDB 8.0.17** single-node replica set on localhost and ignore database environment credentials. The first run downloads the official MongoDB binary through `mongodb-memory-server`; allow local process/network access. `npm run check` continues to run typechecks and the prototype suite; run `test:db` separately for database changes. Driver **7.7.0** is pinned. Atlas access and its actual credential permissions have not yet been verified.

Connection pooling and transaction options follow the [MongoDB driver documentation](https://www.mongodb.com/docs/drivers/node/current/connect/connection-options/connection-pools/) and [transaction guidance](https://www.mongodb.com/docs/drivers/node/current/crud/transactions/). Transaction callbacks may be retried: prepare IDs before entering, use sequential DB operations, and keep provider calls outside them.

## Test the My videos library (F06 checkpoint)

F05 is user-approved. Run `npm run auth:local` with Node 24.21.0, enter fresh test credentials, and open **http://127.0.0.1:3001/sign-in**. Sign in to see your empty library, create a named project, rename it, change filters, and test cancelling/confirming deletion of your disposable project. Refresh or sign in again to verify persistence while the local launcher is running. Create more than 12 projects to exercise Load more. Check mobile layout too.

`npm run test:library` verifies the client request/error and pagination helpers. The UI uses real project APIs, with no sample records in production. Decorative card art is not a generated video thumbnail. Search/count totals, editor/open, playback/download, Instagram and settings controls are not exposed until implemented. Only blank-project deletion is currently supported.

The dialogs preserve edits on errors, require an explicit revision reload on conflict, and retry ambiguous create/delete responses with the same key while the dialog remains open. During an unresolved mutation, closing/editing is disabled to avoid accidental duplicate requests. A full browser reload does not preserve dialog input/retry keys. Stop the launcher with Ctrl+C after testing and share feedback before F07.

## Test project APIs (F05 checkpoint)

F04 and the session-restoration fix are user-approved. F05 adds create/list/read/rename/delete APIs. The F06 library above now consumes those APIs.

1. With Node 24.21.0, run `npm run auth:local` in one terminal. It creates a disposable MongoDB replica set, applies both migrations and provisions your test account. Use a fresh test password.
2. In another terminal, run `npm run projects:verify` and enter the same credentials. Expect five PASS messages covering authentication, creation/replay, read/list, rename/conflict and deletion/replay. Cookies stay in memory; the helper creates and removes only its test project.
3. Stop the local launcher with Ctrl+C and share feedback before F06. If a test is interrupted, restarting the launcher discards the fixture.

For code review, run `npm run test:projects`. [Implemented OpenAPI contract](design/projects.openapi.json) is regenerated with `npm run projects:openapi`. It covers `/api/projects` and `/api/projects/:id`. Creation and deletion require `Idempotency-Key`; mutations require exact Origin; rename/delete require the current revision. Empty-project deletion returns 204; projects needing future media/job cleanup return 409. See the F05 boundaries in API_DESIGN.md and DB_DESIGN.md.

On a configured development database, rerun `npm run db:setup` with operator credentials to apply `002-projects` before using these routes. This does not configure Atlas or deploy the app.

## Test the authentication backend (F03 checkpoint)

F03 was user-tested and code-reviewed on October 1, 2026. For the new **F04 browser checkpoint**, run `npm run auth:local` as below, then open **http://127.0.0.1:3001/sign-in**. Try a wrong password, show/hide the password, open “Need help signing in?”, then sign in with your test account. Check your name/email in the protected workspace and sign out. Opening `/projects` while signed out must return you to sign-in. Inspect desktop and mobile widths. Stop the local process with Ctrl+C and share feedback before F05.

Use Node 24.21.0 in two terminals, both at the repository root. No Atlas configuration is needed for this disposable test:

1. Run `npm run auth:local`. Enter a test name, email and a new test-only password of 12–128 characters. Password input is hidden. Wait for Next.js to report Ready on **http://127.0.0.1:3001**.
2. In the second terminal, run `npm run auth:verify` and enter the same email/password. It exercises the actual Next.js endpoints: anonymous denial, wrong-password denial, successful login, session recognition and logout/revocation. Cookies remain in memory and are not printed.
3. Return to the first terminal and press Ctrl+C. The disposable MongoDB replica set and test data are removed. Share browser test feedback before F05 begins.

`auth:verify` tests the API; the browser flow above tests the F04 UI. The launcher uses isolated data and a temporary signing secret; it does not read prototype credentials or point to Atlas. The first run may download the pinned official MongoDB binary. Use a free port 3001 and avoid running another Next.js development process in this workspace simultaneously.

### Configured development database

After foundation `npm run db:setup`, set `BETTER_AUTH_SECRET` and the exact `BETTER_AUTH_URL` in the web environment example, then run:

```sh
npm run auth:operator -- setup
npm run auth:operator -- provision
```

Provisioning is an interactive operator action, after out-of-band verification of email ownership. It uses Better Auth's supported signup API in an operator-only instance, links the actual stored user and never returns a session or resets an existing password. The web runtime disables signup, has no mounted `/api/auth/*` handler, and exposes only:

- `POST /api/session/sign-in` — strict `{email,password}`, exact Origin, JSON body.
- `GET /api/session` — cookie session and current enabled-access check.
- `POST /api/session/sign-out` — strict `{}`, exact Origin, clears/revokes the cookie session.

`npm run auth:operator -- disable` denies access before deleting that user's session records. No jobs/publication state exists yet to cancel/pause; those integrations belong to their later features.

`npm run auth:operator -- recover` performs operator-assisted recovery for an enabled, provisioned account after out-of-band identity verification. Enter and confirm the new password in hidden terminal prompts. Better Auth generates a five-minute one-use token held only in memory by the command; its supported reset API consumes the token and revokes existing sessions. No reset link/token/password is printed or sent by email, no public reset handler exists, and disabled accounts are not automatically re-enabled.

The public `/access-help` screen explains how to contact the administrator without claiming an email was sent or revealing account membership. The `/projects` page checks the actual session and enabled admission on every server render. It is a workspace entry, not the future project library. Session expiry redirects to sign-in; disabled/service-unavailable requests render generic recovery guidance. The client rechecks on window focus, periodically and after history restoration; it hides workspace content during checks, handles connectivity errors and reloads when the account identity changes. Future private pages must call the same server guard independently; a persistent layout alone is insufficient. Return destinations currently allow only `/projects`.

Sessions have a seven-day absolute lifetime, HttpOnly/SameSite=Lax cookies, no browser-readable token cache and no token fields in JSON. Production requires HTTPS/Secure cookies; HTTP is allowed only on development loopback. API responses use private/no-store caching. Generation/publishing capabilities are false until those features exist.

Login limits are database-backed: five failures per normalized-email HMAC and 30 per client-IP HMAC per 15-minute fixed window. Concurrent attempts reserve capacity; successful attempts release their own reservation, while failed/crashed attempts consume it. Set `AUTH_CLIENT_IP_HEADER` only for a reverse proxy that overwrites/removes incoming values; otherwise requests share one conservative IP bucket. Never trust arbitrary `x-forwarded-for`. Proxy behavior must be verified before deployment.

Auth indexes are created by operator setup from the pinned Better Auth 1.7.7 schema metadata (both field-level and table-level definitions). Runtime automatic index creation is disabled. Setup is additive/idempotent; it does not modify auth field validators or remove data/indexes. The rate-limit collection uses strict application validation. Changes to auth versions/schema need a reviewed migration; no automatic upgrades are enabled. `npm run test:auth` checks real MongoDB plus real Next.js route integration; `npm run test:db` and `npm run check` remain separate regression checks.

References: [Better Auth MongoDB adapter](https://better-auth.com/docs/adapters/mongo), [email/password API](https://better-auth.com/docs/authentication/email-password), [session configuration](https://better-auth.com/docs/concepts/session-management).

## Latest video outputs

`runs/binary-search-reviewed/output.mp4` is a 77-second binary-search explainer with real Daniel narration, captions, and deterministic midpoint/elimination animation. Gemini 3.8 Flash produced the draft; operator review refined decision cues and the final explanation. Three narrated topics now exist: water cycle, RAM versus storage, and binary search. The latter two await user playback review.

TypeScript and all 23 tests pass. A title-only revision reused all seven speech clips; an injected renderer failure resumed without provider calls. See `PROTOTYPE_STATUS.md` for evidence and remaining limits.

## Setup

```sh
npm install
npm run check
npm run pipeline -- preflight
```

Use Node 22 or newer. Copy `.env.example` to `.env.local` only if you have not already configured it. Keep all keys local; `.env.local`, generated runs, and media are excluded from Git. Preflight reports presence only, not live validity.

- `GEMINI_API_KEY`, `GEMINI_MODEL` (verified default: `gemini-3.5-flash`).
- `ELEVENLABS_API_KEY`, `ELEVENLABS_MODEL` (default: `eleven_multilingual_v2`).
- Optional preferred Indian male and female voice IDs. Free-plan API access to library voices was rejected by ElevenLabs in testing.
- Optional `BROWSER_EXECUTABLE`; otherwise Remotion uses its downloaded Chrome Headless Shell.

The default narrator is `daniel-test`: Daniel, a **British English male**, explicitly accepted for prototype testing. This preset does not overwrite the preferred Indian voice settings. Other presets remain `indian-english-male` and `indian-english-female`.

## Idea → storyboard → video

```sh
npm run pipeline -- plan --run my-video --topic-file examples/ram-storage.md
# Inspect runs/my-video/plan-review.html and its factual claims.
npm run pipeline -- approve --run my-video --plan-hash <printed-hash>
npm run pipeline -- generate --run my-video
```

Planning and narration consume provider credits. Review factual content before approving: schema validation cannot establish truth. An initial AI draft incorrectly overstated data permanence; the reviewed revision corrected it before narration.

The plan command defaults to Daniel. Add `--voice indian-english-male` only when that configured voice is accessible to your account. Water-cycle topics have specialized diagram types; other topics currently support comparison and flow components. Binary-search topics additionally support sorted numeric lists with computed midpoint and elimination states. Broad arbitrary-topic illustration remains limited to the available component catalog.

Outputs include `plan.json`, `plan-review.html`, `manifest.json`, per-scene speech/alignment, `timeline.json`, `preview-frames/`, `output.mp4`, and `qa.json`. Export checks cover codec, dimensions, frame rate, duration and audio presence; they do not replace listening and visual review.

```sh
npm run pipeline -- resume --run my-video
npm run pipeline -- resume --run my-video --audio-only
npm run pipeline -- resume --run my-video --stills-only
```

Resume verifies cache fingerprints and audio hashes before reuse. A new export replaces the previous MP4 only after passing checks. Do not delete a run lock unless its process has stopped.

## Conversational revisions

```sh
npm run pipeline -- revise --from my-video --run my-revision --instruction-file examples/ram-storage-revision.md
# Review and approve the new hash, then generate.
```

Every revision has a new run ID, approval hash, and parent reference. Only compatible narration caches are reused. A narrator change also requires a new run:

```sh
npm run pipeline -- change-voice --from my-video --run new-narrator --voice daniel-test
```

## Authored and silent tests

```sh
npm run pipeline -- import-plan --run authored-video --plan-file fixtures/water-cycle.json
npm run pipeline -- fixture --run silent-fixture
```

Both require approval before generating. Import mode uses real AI narration with authored content. Fixture mode is visibly labeled, silent, and synthetically timed. `npm run studio` opens the silent fixture composition, not the latest live video.

## Known limitations

Development progress is tracked in [PROJECT_STATUS.md](PROJECT_STATUS.md). UI design review is maintained in [design/SCREEN_REVIEW_INDEX.md](design/SCREEN_REVIEW_INDEX.md), with the approved Cinema brand in [design/NAMASTE_DIRECTION.md](design/NAMASTE_DIRECTION.md). Stitch screens remain design artifacts; the Next.js foundation is under `apps/web`, while authenticated dashboard features are still planned.

- Local developer workflow; no accounts, per-user ownership service, database, cloud storage, queue or Instagram connection yet. Never deploy the local public media folder as a multi-user service.
- Strict alignment rejects normalized narration differences instead of inventing timestamps.
- AI content still needs review; no open-web fact checker is included.
- No automatic speech retries, friendly cancellation UI, text-overflow measurement, or completed human review of all three topics yet.
- Real Indian voice quality remains deferred. Daniel is for testing.

## Operator edits and recovery checks

```sh
npm run pipeline -- edit-plan --from my-video --run edited-video --plan-file reviewed-plan.json
# Review and approve the new hash before generating.
```

This validates an edited plan and carries compatible audio into a new run without altering the source export.

The integration checks in `scripts/verify-recovery.ts` and `scripts/verify-failure-exit.ts` use the existing RAM output and fixed, single-use destination run IDs. They refuse to overwrite existing runs. They guard against provider requests, inject a missing-browser failure, and check cache reuse, lock release, process exit, and recovery. Reports are saved under `runs/ram-storage-recovery/` and `runs/renderer-exit-check/`.

### F07 idea draft API and autosave checkpoint

The draft API and reusable autosave controller are implemented; the visible idea editor is F08. Existing library UI remains unchanged. Use Node 24.21.0.

```bash
npm run test:drafts
# Interactive API checkpoint with disposable MongoDB:
npm run auth:local
# In another terminal, use the same test credentials:
npm run drafts:verify
```

Expect four PASS groups for persistence, conflicts/validation and guarded deletion. Stop `auth:local` with Ctrl+C to remove the edited fixture; populated-project deletion is not implemented yet. This script signs out its own session and prints no credentials. Its API checks also run against actual Next.js routes in `test:auth`.

For an explicitly configured development database, run `npm run db:setup` with the web operator configuration to install migration 003 before draft requests. Root prototype `.env.local` remains separate. The API supports topic/audience/notes and the existing `daniel-test` preset; it makes no AI calls. Autosave recovery is unit-tested and ready for F08 integration; there is no browser editor or unsaved-edit persistence across reloads yet.

### F08a idea editor checkpoint

Run `npm run auth:local` under Node 24.21.0, sign in at `http://127.0.0.1:3001/sign-in`, create a project and choose **Edit idea**. Enter a topic, expand audience/notes, and wait for **All changes saved** before reloading. Open the same project in two tabs; save in one, then edit the stale tab to exercise compare/keep-local/use-saved resolution. Field limits preserve invalid input and require correction plus **Check & retry save**. Leaving with unresolved input uses the browser's native unload warning; full reload does not retain unsaved input.

F08a implements the approved Cinema editor layout and existing draft APIs. F08b will add Gemini suggestions and voice previews. Storyboard generation remains F09; no generation action is presented as working here. Edited projects still cannot be deleted until the cleanup workflow is implemented. Stop the disposable launcher after testing.


### F08b brainstorming checkpoint

With Node 24, run `npm run auth:local -- --providers` to use the provider settings in ignored `apps/web/.env.local` with a disposable local database/account. Plain `npm run auth:local` explicitly disables providers. For an existing configured database, apply migration 004 with `npm run db:setup` first.

In Edit idea, ask for suggestions, choose Use idea, wait for All changes saved and reload. Results persist; applying is disabled if their source draft has changed. Check request reuses the original receipt after an uncertain response. A new request after an unknown outcome may consume credits again. Brainstorming remains a bounded request; storyboard generation uses the separate background worker described below.

Required server-only configuration: `GEMINI_API_KEY`, `GEMINI_MODEL`, `ELEVENLABS_API_KEY`. No provider value is returned to the client. Daniel preview proxies an existing sample; it does not synthesize speech. Current live verification: Gemini works; after granting `voices_read` on the correct key, the app adapter downloads Daniel’s existing sample successfully. Browser audio playback remains to be verified. Root prototype configuration remains separate. Run `npm run test:ideas` for offline provider and real local MongoDB contract tests. See PROJECT_STATUS.md for full evidence and limits.


### Gemini brainstorming reliability and diagnostics

The verified web brainstorming configuration is `GEMINI_MODEL=gemini-3.5-flash-lite`. The adapter explicitly selects minimal thinking for this model and `gemini-3.5-flash`; the root prototype model is separate. Restart the web process after environment changes. Existing deployments must set their own environment values; `.env.example` is not loaded automatically.

Run `npm run ideas:probe` under Node 24 for **one live request** using synthetic binary-search input. It can consume provider credits. It prints status/category/duration and suggestion count without model text or secrets. Application attempts emit `idea_provider_result` in server logs, correlated by the receipt ID returned by the suggestions API. Categories come from HTTP status/local validation, not raw provider messages. Logs are not stored in the database or returned to the browser. Retain server logs if you need historical investigation.

No automatic retry or fallback is enabled. Unknown outcomes remain unresolved; Check request recovers the existing receipt, while a new request can consume usage again. The October 2 fix passed six selected-model live checks (including dashboard application and recovery after reload); see Project Status for exact timings and limitations.


### F09a storyboard planner checkpoint (backend only)

Run `npm run storyboards:probe -- "Explain the water cycle to school students"` with Node 24 and the existing web Gemini configuration. It makes at most four live provider calls total, including targeted validation repairs and bounded transient HTTP retries. Provider calls may consume credits. A successful command prints an absolute path to a private ignored JSON inspection artifact under `apps/web/runs/storyboards`. It does not create a dashboard project/version, synthesize speech or render video. Each attempt has a 30-second timeout; unknown timeouts/network outcomes do not automatically retry; explicit 429/5xx responses can retry within the same four-call budget.

Review the saved `content.scenes`: narration, on-screen labels, flow/comparison data and exact narration cue events. `estimatedDurationSeconds` uses 150 spoken words/minute; it is not measured audio duration. The current version-1 registry includes title, takeaway, flow and comparison. The prototype renderer still consumes its original PlanV1 format. PlanV2 persistence/APIs are F09b and review UI is F10.

Run `npm run test:storyboards` for offline contract, planner and bounded-repair tests. The provider receives a reduced wire grammar; decoded output must pass the complete local validation contract before it can be saved as an inspection artifact. Narration relevance and factual accuracy still require human review.

### F09b saved storyboard API checkpoint

With Node 24, run `npm run auth:local -- --providers` in an interactive terminal (new launches install migration 006 and start a separate storyboard worker). This uses the separate ignored `apps/web/.env.local` Gemini configuration and a disposable local database. In a second terminal run `npm run storyboards:verify` and enter that test account. The checkpoint generates one live candidate, checks read/history/replay/recovery, preserves the draft, then changes the draft to check stale detection. It consumes Gemini quota; no ElevenLabs call, render or publication happens. Stop the launcher to remove its test data.

Run `npm run test:storyboards` for contract/planner plus replica-set persistence/API-handler tests. `npm run test:auth` also checks actual Next storyboard route wiring without calling a live provider. Existing non-disposable databases require operator `npm run db:setup` before the new endpoints work. See the F09b sections in API_DESIGN.md and DB_DESIGN.md for receipt, deadline, idempotency, immutable history and failure contracts. The F10a review UI now exposes candidate generation and history.

### F10a storyboard review UI checkpoint

Start `npm run auth:local -- --providers` with Node 24, sign in at `http://127.0.0.1:3001/sign-in`, create/open a project and save a topic. Select **Continue to storyboard →**, then **Create storyboard**. Review the schematic scene cards, narration, motion cues, full script and saved candidates. Generation consumes Gemini quota. No audio or video is generated by this screen.

Reloading during generation retains only the command key and expected revision in identity/project-scoped session storage; **Check request** replays that command rather than intentionally starting a new one. A failed/unknown result requires an explicit new generation. The screen does not promise background execution if the server terminates. Refresh checks the current saved idea; changed drafts mark prior candidates as earlier versions. Opening history does not apply or approve a candidate.

This is F10a, the first review checkpoint. Saved narration/on-screen text editing is F10b; conversational revisions and approval remain F11. These controls are not simulated. `npm run test:storyboard-ui` covers the client recovery controller. Independent QA should check reload recovery, two-tab idea changes, narrow-screen scene navigation, history switching, keyboard controls, and sign-out/session restoration.

### Storyboard reliability and local background worker

A storyboard POST now commits its receipt, source snapshot and queue entry together, then returns **202**. The worker plans and repairs in the background; the review screen polls automatically every 2.5 seconds while visible and can recover the same request after a reload. At most **four Gemini calls total**, each capped at 30 seconds, fit within a **180-second deadline starting at enqueue**. Validation failure feeds precise issues into the next repair. Explicit temporary HTTP failures back off within that same call budget. Authentication/configuration failures, truncated responses and uncertain transport outcomes stop without silent retries.

`npm run auth:local -- --providers` starts both Next and its local worker, using the isolated test database and web provider settings. For a persistent development database, run operator `npm run db:setup`, then keep `npm run dev` and `npm run storyboards:worker` running in separate terminals. Runtime database credentials need read/write access to `storyboardQueue`. The worker sends the queued topic, audience and notes to the configured Gemini service; it can consume provider quota. No root prototype settings or media are used.

This worker is for the internal local checkpoint. It processes one job at a time per process; multiple processes claim jobs atomically. Waiting time counts toward the deadline. A job already marked running is never reclaimed after a crash: it expires as unknown to avoid duplicate provider work. Queued jobs survive worker restart if the database survives and their deadline has not passed. The disposable launcher deliberately deletes its database when stopped. Completed/expired queue rows retain metadata but clear the copied draft. There is no hosted worker, cancellation or automatic daemon restart yet; hosted orchestration remains F13. Do not deploy only the Next app and expect background jobs to run.


### F10b1 editable storyboard API checkpoint

The backend can now copy a saved candidate into the project working draft and persist edits without changing the generated candidate. Run `npm run db:setup` with migration credentials on a persistent development database, or use a fresh `auth:local` launcher (migration 007 included). No Gemini call is required to edit an existing candidate.

QA sequence: GET the draft and candidate; POST `/api/projects/:id/draft/apply` with a fresh Idempotency-Key, current `expectedDraftRevision`, candidate `storyboardId` and `expectedContentHash`; PATCH the same draft with the returned `expectedRevision` and `changes.editablePlan` (modified full plan). GET verifies persistence. Empty narration saves with validation issues. Repeat an old revision to verify 409. Apply replay returns its original snapshot without overwriting later edits; reread the draft for current data. All mutations require the authenticated cookie, same Origin and JSON Content-Type. See API_DESIGN.md for the precise contract.

`npm run test:storyboards` includes fixture-based apply/edit/reload, isolation, idempotency, conflict, rollback and migration checks. These are labelled test providers, not live model quality evidence. The F10b1 checkpoint covered only immutable candidate review; working-copy editor controls are now available in F10b2 below. Do not expect API edits to appear as a new generated candidate. Storyboard approval remains F11.


### F10b2 Cinema storyboard editor checkpoint

On a project’s Storyboard page, select a saved candidate and choose **Edit selected candidate**, then confirm the editable copy. The separate **Working storyboard** section edits narration, titles, kickers, labels, flow-step labels and comparison text. Its preview is a layout schematic. Save explicitly with **Save storyboard edits**; empty text may save with validation feedback. Cue/pronunciation text and occurrence controls help align revised narration. Generated candidates remain immutable.

Reload after saving to verify persistence. Open the same project in two tabs, edit both and save one: saving the stale tab offers a text comparison and explicit keep-local/use-saved choices. A different source candidate blocks keep-local to avoid replacing unrelated content. Replacing the working copy requires confirmation and is blocked while local edits are unresolved. Unsent edits stay in memory with a full-document unload/reload warning; client-side app navigation is not intercepted, so save before following app links. Once Save is dispatched, its payload is temporarily retained in identity/project-scoped sessionStorage for reload recovery, then cleared on settlement; this is private draft content, not a provider credential. Storage failure blocks dispatch. Recovery replays the original revision-checked PATCH or apply key; it never treats an unchanged read as a confirmed save. Session storage is not a cross-device backup.

Run `npm run test:storyboard-ui` for generation/review plus editing-controller tests. No approval, AI revision or video rendering is introduced by the editor.

### F11a storyboard revision engine (server module only)

`apps/web/src/storyboards/revisions.ts` exports `reviseStoryboard({idea, source, planStale, request})`. `source` is a valid PlanV2 snapshot; `request` contains an instruction (1–4,000 trimmed characters) and optional stable `sceneId`. The caller must supply a trusted freshness flag. The engine clones/validates the source before dispatch, then returns a validated candidate, server-computed `changedSceneIds`/`changedFields`, provider metadata and `requiresApproval:true`. It does not read/write a project or authorize an HTTP request.

Scene-specific requests preserve all other scenes and root metadata exactly. Whole-story requests can change title/objective/sources and scene content, but this initial slice preserves scene IDs, order/count, language, voice and audience. Unsupported structure changes fail validation; there is no clarification UI yet. An unchanged candidate is not reported as a successful revision. All results need human review; structural differences cannot establish factual accuracy or fulfillment of the instruction.

The existing bounded Gemini executor supplies four total attempts, transient-error backoff, 30-second per-call timeout and three-minute deadline. Invalid completed results can be repaired; ambiguous timeout outcomes are not retried automatically. Revision validation never runs the original planner's scene-ID normalization. `npm run test:storyboards` includes deterministic revision tests and existing planner/storage regressions; no live provider keys are required. Dashboard revision controls, database candidates/conversation history, authorization/revision admission, stale-result application and immutable approval are later F11 slices. Existing editing remains usable.

### F11b1 durable storyboard revision API

Run `npm run db:setup` with the development database setup credentials before starting the updated worker; migration 008 adds private revision command metadata. A fresh `npm run auth:local -- --providers` installs it and starts the worker. Restarting a disposable launcher deletes its test data. An already-running older local instance is not automatically migrated/restarted by changing the code.

For API QA, GET a source candidate and the current draft, then POST `/api/projects/:id/revisions` with `{expectedDraftRevision,source:{kind:"storyboard",id,hash},instruction,sceneId?}` plus the authenticated cookie, same Origin, JSON content type and fresh Idempotency-Key. Use an untouched candidate at the current draft revision, or its exact fresh applied working copy. Wait via `/storyboard-requests/latest`; recover the particular command by replaying its exact body/key. The worker saves a new review-ready candidate with parentId/changedSceneIds/changeSummary, preserving the previous candidate and draft. Edits during generation make the result stale. No approval or rendering occurs. Revision controls are not yet on the dashboard; manually edited working copies cannot be revised until the next source-snapshot slice. `npm run test:storyboards` exercises fixture-based route admission, worker execution, lineage, rollback, concurrency, expiry and unknown-outcome recovery without provider quota.

### F11b2 Cinema revision panel

On Storyboard, select a saved candidate, choose whole-story or a scene under **What would you change?**, enter an instruction and click **Create revised candidate**. Save/resolve working edits first. The panel blocks a source that differs from manual edits; edited-source snapshots are the next slice. A configured migration-008 database and current worker are required, as above.

Progress polls automatically. Reload recovers the exact accepted/pending source, instruction, scope and key. **Check request** never intentionally creates a second job. The revised candidate displays changed scenes and **View previous version**; review it, then use the existing explicit working-copy replacement/confirmation to apply or restore. Pending requests temporarily store private instruction text in scoped sessionStorage. Unsent instructions are in memory and reset when changing candidates. No revision auto-applies or approves content.

### F11b3 saved manual versions

Apply a candidate, edit it, click **Save storyboard edits**, and resolve its validation warnings. Then **Save edited version** creates a labelled immutable manual version and opens it in candidate review. The revision panel can now target that version, including your manual text; prior candidates and your working copy are preserved. Snapshot creation uses no AI quota and grants no approval. Save when ready; switching to an older source does not silently include new manual edits.

Run `npm run db:setup` before testing this feature on a persistent development database (migration 009). A fresh auth:local launcher installs it; restarting a disposable launcher deletes its old test data. For API testing, POST `/api/projects/:id/storyboard-snapshots` with saved draft revision/contentHash and a new Idempotency-Key. Recover an uncertain outcome through Check saved version / Recover pending save using the original key; do not start a second command. Snapshot recovery stores only key/revision/hash metadata in the editor's scoped sessionStorage. Existing pending PATCH recovery still stores its private plan payload. Full live browser QA remains a separate checkpoint.

### Exact-version story approval API (F11c1)

Run `npm run db:setup --workspace=apps/web` against the intended database to install migration 010 before API QA; `auth:local` includes it for fresh disposable environments. No migration is automatically applied to an already running review server.

POST `/api/projects/:id/storyboard-approvals` with the authenticated session, same Origin, JSON and a fresh Idempotency-Key. Body: `{storyboardId,expectedDraftRevision,expectedDraftHash,expectedContentHash,approve:true}`. Get the saved draft revision/contentHash and selected immutable candidate contentHash from their current GET responses. Candidate must be current or exactly match its fresh applied working copy. Save manual changes as an immutable edited version first. Success returns the exact approval record; candidate reads/history expose approved state and approvalId. Replay the **same key and body** after an uncertain response, even if the draft has since changed. New versions never inherit approval.

This is an API checkpoint: the dashboard only reflects existing approval status; the confirmation button and browser recovery flow arrive in F11c2. Approval does not apply/select content, spend provider quota, generate a video or permit publishing. Run `npm run test:storyboards` for transactional/HTTP-handler access, replay, hash, validation and concurrency checks. See API_DESIGN.md for payload/error details and PROJECT_STATUS.md for verification limits.


### Storyboard approval in the dashboard (F11c2)

After reviewing a saved candidate, use **Review approval** below the storyboard, then **Confirm storyboard approval**. The confirmation identifies the saved version, scene count, estimated duration and test voice. Cancel/Escape returns to review without sending a request. Save/resolve unsaved edits first; use **Save edited version** when your working plan differs from the selected candidate. Approval covers the selected immutable version only.

While confirming or recovering approval, local editing, generation, revision submission and version selection are paused. If submission times out, choose **Recover approval**. Reload retains the exact pending command in identity/project-scoped sessionStorage; it never automatically approves a new version. Recovery works independently of the currently displayed draft. Confirmed approval opens its saved version and labels it in history. Changes made later do not inherit approval. Rendering and publishing are still separate future features.

Requires existing migration 010; this UI adds no migration or provider configuration. `npm run test:storyboard-ui` includes approval confirmation, interrupted-response recovery, storage failures, stale context, duplicate clicks and session-boundary checks. The controller tests supplement the browser evidence in PROJECT_STATUS.md.


## Private media storage (F12)

The storyboard page links to `/projects/{id}/media`. It lists private project assets, previews ready thumbnails/audio/video, prepares downloads, and revokes existing links. An empty library is expected until rendering is integrated. Storyboard approval does not create media. This feature does not expose the prototype's `runs` or `public/runs` directories.

Operator setup (not deployed automatically):

1. Run the existing web `db:setup` procedure with operator MongoDB credentials; migration **011-private-storage** follows 010. Existing review environments must be migrated before using media routes.
2. Create a **private** Cloudflare R2 bucket, with public development access and public custom-domain access disabled. Give the server bucket-scoped object read/write credentials. Set `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY` in ignored `apps/web/.env.local` or the server's secret manager. Root prototype configuration is separate.
3. Configure `apps/media-gateway/wrangler.toml`: replace the placeholder bucket and `APP_ORIGIN` with the exact application origin, configure an HTTPS Worker route, and bind `MEDIA_BUCKET` to the same private bucket. `workers_dev` and observability are disabled by default. The source entry is `apps/web/src/storage/gateway.ts`. Deployment is a separate operator action; Wrangler/runtime deployment has not been verified in this milestone.
4. Generate a strong random shared secret (at least 32 characters), configure `MEDIA_SERVICE_SECRET` in both the app and Worker secrets, and set `MEDIA_GATEWAY_ORIGIN` in the app to the exact gateway origin. The gateway must reach the app's `/api/internal/media-authorize` route over HTTPS. Do not enable URL/body capture in gateway, proxy, analytics or APM logs: media URLs are bearer credentials. Never commit these values.
5. Perform a live private-bucket upload/readback, full/Range/HEAD delivery, expiry/revocation and missing-object check before treating hosted storage as verified. No live R2 credentials were available for F12 verification.

The server-only producer API is `storageService(db, client).upload(ownerId, {id, projectId, kind, producerFingerprint}, bytes, r2Store())`. Allocate an `ast_` ID with 32 hexadecimal UUID characters and retain it durably before dispatch. The fingerprint is a 64-character SHA-256 of the producer's canonical inputs. Supported kinds and MIME types are in `src/storage/contracts.ts`; size is 1 byte–64 MiB. This is a trusted producer boundary, not a public file upload endpoint or a media decoder. Future render validation must establish playable, safe output before upload.

Uploads reserve a staging record, conditionally write an immutable object, stream it back to verify length/type/SHA-256, then transactionally mark it ready. Retrying the **same ID, bytes and inputs** recovers staging/uncertain uploads; changed content requires a new ID. No provider is called by storage. Failed uploads can leave staging records/objects; automatic orphan cleanup and full project deletion with assets are not implemented. Asset-bearing projects are protected from the existing empty-project deletion path.

Access URLs last ten minutes and stay in UI memory. Every gateway GET/HEAD, including Range requests, rechecks grant expiry/revocation, current account admission, live project and ready asset. A URL is usable by its bearer until expiry/revocation; it is not tied to the current browser cookie. Revocation cannot recall buffered/downloaded bytes or an already-authorized stream. The preview offers Refresh access on expiry/error and preserves media position where available. No automatic regeneration occurs.

Verification: `npm run test:storage` uses disposable MongoDB replica sets, real authentication sessions and labelled in-memory object-store fixtures. Cloudflare behavior requires the live verification above. Reference contracts: [R2 Worker binding](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/) and [AWS SDK v3 for R2](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/).

## Generation jobs (F13/F14, local execution)

The storyboard screen now offers **Generate video** for an exact approved saved version. Confirmation explains speech credit use, including possible repeat charges when generating again. New jobs freeze the Daniel voice ID, ElevenLabs multilingual v2 settings, output format and PlanV2 renderer configuration alongside the storyboard. Apply `npm run db:setup` (through migration **013-render-execution**) before use.

Run `npm run generations:worker` in a separate terminal with Node 24. It reads only `apps/web/.env.local`, requires working ElevenLabs/R2 configuration and preflights the local audio inspector before processing jobs. `--once` runs one bounded dispatch pass (up to 20 jobs, not necessarily one job). The worker processes each delivery serially; transactional admission allows at most two leased executions globally and one per owner across projects. Keep the worker running for queued jobs. Next.js requests do not run Chromium. Inngest can dispatch/acknowledge events, but its handler leaves execution for the dedicated local worker; cloud compute is still deferred. The former pure preflight fallback remains only for callers without execution adapters and legacy contract tests.

Jobs progress through checking, speech, rendering and uploading. Each speech scene gets a durable request-start record **before** the provider call. Audio, alignment and measured duration are written as one private, hash-verified R2 JSON artifact. Lease takeover reuses verified artifacts. A request whose result cannot be recovered stops without another speech call. A lost upload acknowledgement triggers a readback of the exact expected bytes. The UI explains unknown outcomes and failures; a new generation after any prior speech requires `acknowledgePossibleRepeat:true`. New generations currently synthesize afresh; there is no same-job Retry audio endpoint or cross-job cache yet.

Ninety-second leases renew every twenty seconds and progress writes use job fencing plus the live project/account checks. Cancel is immediate while queued and cooperative during execution; external work may finish or spend credits before cancellation is observed. The renderer is a child process with no provider/R2 credentials. It validates the MP4 locally, uploads the video and VTT privately, then one transaction exposes both asset records, records the immutable render output and completes the job. A cancellation, expired lease/deadline or changed owner/project prevents promotion. Earlier outputs are never overwritten. Crash/cancelled work can leave private orphan objects; cleanup/retention remains deferred. Capacity limits cover valid leases, not orphan child processes after a hard host crash.

The existing media page lists successful output assets. Browser delivery still needs the separately deferred HTTPS media gateway deployment/configuration; successful R2 upload does not mean hosted playback is configured. Exact-version video approval and dedicated version-review UI remain F15. Jobs expire after fifteen minutes, including queue wait. Unknown HTTP submissions use the existing original-key recovery controls; polling never submits a duplicate generation.

Checks: `npm run test:jobs`, `npm run test:storage`, `npm run check`, and `npm run build`. Reference contracts: [ElevenLabs timestamped speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps/) and [Inngest Next.js integration](https://www.inngest.com/docs/getting-started/nextjs-quick-start).

## PlanV2 renderer compatibility checkpoint (F14, local)

`npm run render:v2:fixture -- --run review-001` renders a labelled **silent**, authored 72-second RAM/storage fixture. Use a new run ID for every attempt. Add `--stills-only` for four scene frames without an MP4. This command does not load either environment file, call providers, read Atlas, upload to R2 or change dashboard jobs. It writes to ignored `runs/v2-<ID>/`; existing directories are never overwritten. A failed attempt stays separate from earlier outputs. Never serve this directory through Next.js.

The dedicated `src/plan-v2` composition preserves the approved cream/teal/DM Sans video style and supports the current PlanV2 registry: title, takeaway, directed flow and comparison. Every event retains its target, action, cue occurrence, offset and duration. Reveal/connect gates visibility; emphasize/compare applies a temporary accent. An element without a reveal is visible initially. Edges also require their source and destination to be visible. Caption spelling stays original when pronunciation uses a different spoken form. Cue/caption boundaries inside a replacement are proportionally interpolated within its measured speech span, not independently forced-aligned words. Unexpected provider text normalization fails closed. Measured total duration must be 60–90 seconds; invalid timing requires editorial review, never silent padding or trimming.

`compileV2` validates the existing dashboard storyboard contract and measured character alignment. `renderPlanV2` is a **local compute adapter**, not a web endpoint. Its non-fixture path requires explicit local MP3s, checks their codec and measured duration, and copies only those files to an isolated temporary public directory. It never bundles root `public/` or `public/runs/`. Only executable code from the fixed renderer registry is used. The adapter exports burned-in captions and WebVTT, validates H.264/1080×1920/30fps/duration/audio presence/64 MiB size before renaming the partial MP4, and removes the temporary bundle. Rendering/stills have a ten-minute cancellation timer (bundling/composition selection are outside that timer); interrupts during rendering cancel the render. `qa.json` includes wall time and Node-only peak RSS, which excludes Chromium/compositor children and is insufficient to size a hosted sandbox.

This compatibility checkpoint is now used by the local job worker described above. Hosted execution/media delivery and F15 video-version approval remain separate. Existing PlanV1 CLI and render tests remain unchanged.

### Video review

After `npm run db:setup` (including migration 014 and legacy output backfill), completed jobs create immutable video versions. Open **Review video** from My Videos or generation completion, or visit `/projects/{id}/video`. Browse versions, open a private preview, export MP4/VTT, save a selected version and explicitly approve the exact reviewed output. Another render retains earlier exports and needs its own approval. Unknown approval/selection requests can be recovered without creating another operation.

Preview/export requires the F12 media gateway configuration; hosted deployment remains pending. The page reports missing configuration without regenerating or losing the saved video. Run `npm run test:jobs` for version/API coverage and `npm run test:video-ui --workspace apps/web` for command recovery tests.

### Caption revisions (F16)

From a completed project's **Review video**, choose **Edit captions**, adjust capitalization/spacing and confirm **Render caption changes**. Drafts survive reload in the same tab. Word/punctuation changes use **Revise narration or visuals** and the existing storyboard approval flow. **Render again with saved narration** retains saved caption edits. Both create a separate unapproved version and preserve earlier exports/selection. Run the existing generation worker; verified cached speech is required and missing speech stops without another ElevenLabs call. See PROJECT_STATUS.md for local verification and hosted-delivery limitations.

### Personal preferences (F17)

Open **Settings** from My Videos to save your timezone and future-project voice default. Daniel is currently the only enabled test voice; the existing preview remains available when its provider is configured. Existing projects keep their narrator. Saves are explicit, revision-checked and recoverable in the same tab after a lost response. The timezone is stored for future scheduling; Instagram and scheduling remain separate milestones. No new migration is required beyond the existing database setup.

## F18: personal Instagram connection

Open **Settings → Manage Instagram connection**. The page supports account identity, reconnect, cancellation/error outcomes, explicit disconnect and same-tab disconnect recovery. No video is published by this feature. Facebook Login has passed live Meta authorization and read-only account checks. See PROJECT_STATUS.md for the latest dashboard/deployment verification; automated checks use labelled fixtures.

Apply migrations **015-instagram** and **016-instagram-facebook** with `npm run db:setup --workspace apps/web` before using an existing database. Fresh `auth:local` environments install it. No schema changes run automatically in request handlers. The runtime needs read/write access to `instagramConnections`, `oauthStates` and `instagramCommands`.

Configure only the web environment (`apps/web/.env.local` or server secret store):

- `INSTAGRAM_LOGIN_PROVIDER`: `instagram` (default) for direct Instagram Login, or `facebook` for the verified Facebook Login route.
- `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET`: the credentials for the selected provider. Never mix direct Instagram credentials and Facebook app credentials.
- `INSTAGRAM_FACEBOOK_CONFIG_ID`: required for Facebook Login; the configuration must request `pages_show_list`, `pages_read_engagement`, `instagram_basic` and `instagram_content_publish`.
- `INSTAGRAM_REDIRECT_URI`: exact registered `https://<app-origin>/api/instagram/callback`, sharing `BETTER_AUTH_URL` origin. No HTTP callback, alternate host, arbitrary redirect or browser token field is supported.
- `INSTAGRAM_GRAPH_VERSION`: explicit version supported by the configured Meta app. There is no implicit latest-version fallback.
- `INSTAGRAM_TOKEN_KEY_ID` and `INSTAGRAM_TOKEN_KEYS`: active key ID and JSON key ring, for example `{"k1":"<32 random bytes encoded as standard base64>"}`. Generate the value locally; do not commit it or paste it into chat. Keep old keys while stored ciphertext still references them; changing the active ID affects new connections and successful refreshes. Lost keys require reconnecting affected accounts.

Use a professional Creator/Business test account with the required Meta app role. The adapter requests `instagram_business_basic` and `instagram_business_content_publish` and rejects incomplete grants and unsupported account types. For the direct provider, no Facebook Page is required. Register/configure the Meta application and HTTPS callback before the live checkpoint; this code change does not deploy an endpoint or approve scopes on anyone’s behalf.

Primary references: [Meta Business Login and token lifecycle](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login), [profile response and fields](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/get-started), [Meta’s official Postman collection](https://www.postman.com/meta/instagram/folder/6raa77c/instagram-api-with-instagram-login). The logged-in browser verified these documents on October 7, 2026. The adapter accepts both flat and exactly-one `data`-wrapped token/profile responses, including documented `Business` and `Media_Creator` types and previously supported uppercase types. Ambiguous/malformed results and incomplete grants fail closed. Authorization uses the documented `force_reauth` parameter. These are document-backed fixture checks; live endpoint/response compatibility remains an acceptance item.

The [Facebook Login route](https://www.postman.com/meta/instagram/folder/u4g5a2a/instagram-api-with-facebook-login) requires a linked Facebook Page. Enter that Page ID explicitly in Settings before continuing to Facebook consent. This supports business-owned Pages without requesting the broader `business_management` permission just for discovery. The selected Page is bound to the OAuth receipt; Meta must return its Page token and linked Instagram identity. The dashboard shows both identities after connection. Meta does not expose `account_type` on this route; its linked account is truthfully labelled Professional.

The server exchanges the code for a short user token, exchanges for a long user token, verifies all four user permissions, obtains only the selected Page token, verifies its app/type/validity/scopes/expiry with `debug_token`, and reads the linked Instagram profile. Only the Page token is encrypted and persisted; intermediary user tokens are not saved. No token is accepted from the browser or API Explorer. Fixed Graph hosts, bounded responses, a shared 25-second timeout and sanitized error categories apply. No automatic exchange retries.

Facebook Page tokens can have no scheduled expiration. A missing date is never assumed to mean zero; verified zero token/data-access timestamps produce a null expiry. Positive expiry is the earlier of the two boundaries. These tokens remain revocable, require reconnect after invalidation and are never sent to the direct Instagram refresh endpoint. Configuration changes and pre-migration unbound credentials require reconnect. Switching provider/app/Page or Instagram identity advances the destination epoch.

The adapter uses a bounded, non-retrying code exchange → long-lived token → professional profile flow. Provider responses supply expiry; tokens are AES-256-GCM encrypted with fresh nonces and owner/connection-bound AAD. Client responses contain no tokens. Callback state is hashed, bound to the initiating session, single-use and valid for ten minutes. New connection attempts and disconnects invalidate older callbacks. Same-account reconnect retains destination epoch; switching increments it. Unique indexes prevent an Instagram account from being connected to multiple workspaces.

For the direct Instagram provider only, run `npm run instagram:refresh --workspace apps/web` as an operator to refresh unexpired tokens older than 24 hours that expire within seven days. This makes real provider calls when configured. Refresh has a lease and token-revision fence; failures require reconnecting. No recurring refresh deployment is installed. Before hosted use, arrange the reviewed scheduler and verify refresh against Meta. Expired connections are shown as requiring reconnection even if no operator job ran.

Disconnect removes this application’s saved credential and account link; it does not delete posts or revoke authorization in Instagram itself. Revoke the app in Instagram separately if desired. The command uses a revision check and durable idempotency receipt; an uncertain response stays recoverable in the originating tab. A replay cannot disconnect a newer connection.

**F19/F20 boundary:** `publishingAvailable` is always false. If future nonterminal publish intents are present, F18 conservatively rejects connection changes instead of erasing credentials. The publishing/scheduling milestones must replace that guard with atomic pause/reconciliation and credential retention before enabling delivery. No claimed schedule-pause implementation or reconciliation worker exists yet.

Suppress callback query strings and outbound token-exchange URLs in production proxy/APM/access logs before enabling live OAuth. Next development incoming-request logging excludes the callback route. The callback redirects to a fixed relative settings route with an allowlisted outcome, never raw provider errors or authorization codes.

Verification: `npm run test:instagram --workspace apps/web`, `npm run test:instagram-ui --workspace apps/web`, existing project/OpenAPI and preference tests, both typechecks and production build. Browser screenshots in `design/verification/f18-instagram-*.png` show synthetic account data only.
