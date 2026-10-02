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

In Edit idea, ask for suggestions, choose Use idea, wait for All changes saved and reload. Results persist; applying is disabled if their source draft has changed. Check request reuses the original receipt after an uncertain response. A new request after an unknown outcome may consume credits again. This is bounded brainstorming, not background storyboard generation.

Required server-only configuration: `GEMINI_API_KEY`, `GEMINI_MODEL`, `ELEVENLABS_API_KEY`. No provider value is returned to the client. Daniel preview proxies an existing sample; it does not synthesize speech. Current live verification: Gemini works; after granting `voices_read` on the correct key, the app adapter downloads Daniel’s existing sample successfully. Browser audio playback remains to be verified. Root prototype configuration remains separate. Run `npm run test:ideas` for offline provider and real local MongoDB contract tests. See PROJECT_STATUS.md for full evidence and limits.


### Gemini brainstorming reliability and diagnostics

The verified web brainstorming configuration is `GEMINI_MODEL=gemini-3.5-flash-lite`. The adapter explicitly selects minimal thinking for this model and `gemini-3.5-flash`; the root prototype model is separate. Restart the web process after environment changes. Existing deployments must set their own environment values; `.env.example` is not loaded automatically.

Run `npm run ideas:probe` under Node 24 for **one live request** using synthetic binary-search input. It can consume provider credits. It prints status/category/duration and suggestion count without model text or secrets. Application attempts emit `idea_provider_result` in server logs, correlated by the receipt ID returned by the suggestions API. Categories come from HTTP status/local validation, not raw provider messages. Logs are not stored in the database or returned to the browser. Retain server logs if you need historical investigation.

No automatic retry or fallback is enabled. Unknown outcomes remain unresolved; Check request recovers the existing receipt, while a new request can consume usage again. The October 2 fix passed six selected-model live checks (including dashboard application and recovery after reload); see Project Status for exact timings and limitations.


### F09a storyboard planner checkpoint (backend only)

Run `npm run storyboards:probe -- "Explain the water cycle to school students"` with Node 24 and the existing web Gemini configuration. It makes one live planning request and, only for a completed invalid candidate, at most one repair request. Provider calls may consume credits. A successful command prints an absolute path to a private ignored JSON inspection artifact under `apps/web/runs/storyboards`. It does not create a dashboard project/version, synthesize speech or render video. Each attempt has a 30-second timeout; unknown/provider failures do not automatically retry.

Review the saved `content.scenes`: narration, on-screen labels, flow/comparison data and exact narration cue events. `estimatedDurationSeconds` uses 150 spoken words/minute; it is not measured audio duration. The current version-1 registry includes title, takeaway, flow and comparison. The prototype renderer still consumes its original PlanV1 format. PlanV2 persistence/APIs are F09b and review UI is F10.

Run `npm run test:storyboards` for offline contract, planner and bounded-repair tests. The provider receives a reduced wire grammar; decoded output must pass the complete local validation contract before it can be saved as an inspection artifact. Narration relevance and factual accuracy still require human review.

### F09b saved storyboard API checkpoint

With Node 24, run `npm run auth:local -- --providers` in an interactive terminal (restart an older launcher to install migration 005). This uses the separate ignored `apps/web/.env.local` Gemini configuration and a disposable local database. In a second terminal run `npm run storyboards:verify` and enter that test account. The checkpoint generates one live candidate, checks read/history/replay/recovery, preserves the draft, then changes the draft to check stale detection. It consumes Gemini quota; no ElevenLabs call, render or publication happens. Stop the launcher to remove its test data.

Run `npm run test:storyboards` for contract/planner plus replica-set persistence/API-handler tests. `npm run test:auth` also checks actual Next storyboard route wiring without calling a live provider. Existing non-disposable databases require operator `npm run db:setup` before the new endpoints work. See the F09b sections in API_DESIGN.md and DB_DESIGN.md for receipt, deadline, idempotency, immutable history and failure contracts. There is no storyboard dashboard button yet; F10 adds review UI after this API checkpoint is accepted.

### F10a storyboard review UI checkpoint

Start `npm run auth:local -- --providers` with Node 24, sign in at `http://127.0.0.1:3001/sign-in`, create/open a project and save a topic. Select **Continue to storyboard →**, then **Create storyboard**. Review the schematic scene cards, narration, motion cues, full script and saved candidates. Generation consumes Gemini quota. No audio or video is generated by this screen.

Reloading during generation retains only the command key and expected revision in identity/project-scoped session storage; **Check request** replays that command rather than intentionally starting a new one. A failed/unknown result requires an explicit new generation. The screen does not promise background execution if the server terminates. Refresh checks the current saved idea; changed drafts mark prior candidates as earlier versions. Opening history does not apply or approve a candidate.

This is F10a, the first review checkpoint. Saved narration/on-screen text editing is F10b; conversational revisions and approval remain F11. These controls are not simulated. `npm run test:storyboard-ui` covers the client recovery controller. Independent QA should check reload recovery, two-tab idea changes, narrow-screen scene navigation, history switching, keyboard controls, and sign-out/session restoration.
