# NamasteVideo.ai

A local TypeScript prototype for short educational motion-graphics videos. The first user-reviewed output is `runs/water-cycle-viraj-live/output.mp4`: 81.7 seconds, 1080 × 1920, Daniel narration, captions and animated water diagrams. The storyboard for that first video was authored. Gemini planning and conversational revision are now working through Gemini 3.5 Flash's Interactions API.

The repository also includes an isolated Next.js application in `apps/web`, with database and internal authentication foundations, Cinema sign-in/recovery screens and a protected workspace entry. Project CRUD and the video library are not implemented yet. [Project Status](PROJECT_STATUS.md) is the development source of truth; [prototype status](PROTOTYPE_STATUS.md) retains historical pipeline evidence.

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

The server-only MongoDB adapter and initial schema setup live in `apps/web/src/db`. The web pages still work without a database. No account or project API is connected yet.

For an isolated development replica set or Atlas database, create `apps/web/.env.local` from its `.env.example` and configure `MONGODB_DATABASE` plus two separate credentials:

- `MONGODB_URI`: application runtime access, without schema/index administration or validation bypass privileges.
- `MONGODB_MIGRATION_URI`: operator setup access to create collections/indexes and write migration records. Do not install this credential in the hosted web runtime.

Run `npm run db:setup` explicitly from the repository root. It loads only the web environment file, never the prototype environment. It creates strict validators and named indexes for `internalAccess`, `preferences`, `projects`, `conversations` and `schemaMigrations`. It requires a transaction-capable topology, records a checksum/lease/checkpoint, reruns additive setup safely, and refuses validator drift or an edited migration. Existing mismatched schemas or conflicting indexes require a reviewed migration; setup never drops records or silently replaces validators. Keep the applied foundation definitions immutable when adding subsequent migrations.

This is infrastructure only: owner/reference checks, timezone validation and project/draft atomic creation are implemented with their respective future features. MongoDB schemas do not provide foreign-key or user-authorization guarantees. Authentication setup is described below.

Run `npm run test:db` for real MongoDB integration tests. They launch and stop a disposable **MongoDB 8.0.17** single-node replica set on localhost and ignore database environment credentials. The first run downloads the official MongoDB binary through `mongodb-memory-server`; allow local process/network access. `npm run check` continues to run typechecks and the prototype suite; run `test:db` separately for database changes. Driver **7.7.0** is pinned. Atlas access and its actual credential permissions have not yet been verified.

Connection pooling and transaction options follow the [MongoDB driver documentation](https://www.mongodb.com/docs/drivers/node/current/connect/connection-options/connection-pools/) and [transaction guidance](https://www.mongodb.com/docs/drivers/node/current/crud/transactions/). Transaction callbacks may be retried: prepare IDs before entering, use sequential DB operations, and keep provider calls outside them.

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
