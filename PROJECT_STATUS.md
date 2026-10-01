# Project Status — NamasteVideo.ai

Last updated: October 1, 2026 (Asia/Kolkata).

This is the source of truth for development progress. Specifications describe intent; a feature is complete here only when its implementation and verification are recorded. Design approval is not evidence of working functionality.

## Current checkpoint

**F07 — Done locally; delegated API/autosave testing passed; user feedback/code review pending.** User approved moving beyond F06 and its focus fix. This slice adds idea draft persistence and a reusable autosave controller; the visible idea editor remains F08. Wait for user review before F08.

Internal authentication APIs and initial database collections are implemented and tested locally. Cinema sign-in/recovery and a protected workspace entry are available. Personal project create/list/read/rename/delete APIs are available; the My videos library UI is implemented, while hosted rendering and Instagram integration remain future work; no hosted database has been provisioned. The local video pipeline remains separately usable.

## How this document is maintained

1. Before coding, select one feature below and mark it In progress; identify its acceptance criteria.
2. Implement that feature without silently starting unrelated features.
3. Run relevant checks and record commands, results, date, and practical limits. Link files/artifacts rather than treating this document alone as proof.
4. Mark Done only when its acceptance criteria pass. Use Partial or Blocked when appropriate and explain what remains. Append the feature entry before reporting completion.
5. Update this document in the same change as every code/configuration addition or modification, including fixes to completed features. Keep the feature table and checkpoint consistent.
6. Commit and push each completed development step/milestone to [akshaymarch7/namaste-video-ai](https://github.com/akshaymarch7/namaste-video-ai). Verify the remote commit, and report any blocked/unpushed work. This is a standing user instruction, also recorded in AGENTS.md. Exclude credentials, generated video/audio, dependencies and build output.

Repository contributors follow this workflow through AGENTS.md. No external automation is implied; the document must be updated during development.

## Branch workflow

- `dev`: active development branch; completed steps/milestones are committed and pushed here.
- `main`: stable baseline, initially `dfe1883`. Finalized, verified changes are promoted through a pull request after explicit user approval to merge.
- This workflow is recorded in AGENTS.md; GitHub branch protection has not been configured.

## Feature backlog — build in order

| ID | Small feature | Status | Completion evidence required |
| --- | --- | --- | --- |
| F00 | Local idea-to-video proof of concept | Done (local prototype) | Existing three narrated exports and recovery reports; see PROTOTYPE_STATUS.md |
| F01 | Next.js workspace, Cinema tokens, primitives and app boundary | Done | Production build; both TypeScript checks; 23 existing tests; desktop/mobile route smoke checks; root media inaccessible — evidence below |
| F02 | MongoDB adapter, schema validation and initial indexes | Done (local) | 11 real replica-set tests; both typechecks; 23 prototype tests; production build; detailed evidence below. Atlas not configured. |
| F03 | Internal account admission and session backend | Done; user approved | User confirmed testing and code review October 1, 2026; backend and manual evidence below |
| F04 | Sign-in/recovery UI and private route protection | Done; user approved, including P2 fix | 51 automated tests and prior types/build passed; delegated desktop/mobile browser and interactive operator recovery walkthrough passed; evidence below |
| F05 | Personal project create/list/rename/delete APIs | Done; user approved | Five-group interactive checkpoint and extended two-user/pagination/revision/deletion checks passed; prior 65 automated tests/types/build recorded below |
| F06 | My videos library UI | Done; user approved | Delegated desktop/mobile CRUD, all filters, 12-to-13 pagination, two-tab conflict resolution and keyboard checks passed; prior tests/build below |
| F07 | Idea draft API, autosave and conflict handling | Done locally; delegated testing passed, user review pending | Four-group interactive checkpoint, seven live controller checks and seven targeted autosave tests passed; prior 85-test/types/build evidence below |
| F08 | Idea and brainstorming UI/integration | Planned | Save real idea; Gemini topic suggestions; use suggestion; available voice preview |
| F09 | Storyboard generation backend | Planned | Validated scene contract, saved version, bounded repair and recoverable failure |
| F10 | Combined storyboard/script review UI | Planned | Schematic scene cards, editable narration/on-screen text and estimates |
| F11 | Conversational storyboard revisions and approval | Planned | Changed scenes, restore, stale-result handling, immutable approved version |
| F12 | Private R2 asset adapter and media access | Planned | Private upload/read, owner-authorized access, expiry and missing-asset behavior |
| F13 | Durable generation job orchestration | Planned | Inngest integration, one active job, deduplication, progress and cancellation |
| F14 | Hosted rendering integration | Planned | Approved storyboard to validated MP4; resource/runtime benchmark; previous version retained |
| F15 | Video review, approval and download UI | Planned | Actual media playback, version selection, exact-version approval and export |
| F16 | Caption and video revision flow | Planned | Caption edits rerender; spoken changes return to storyboard; preserved previous output |
| F17 | Personal preferences UI/API | Planned | Timezone and future-project voice persisted without changing existing projects |
| F18 | Personal Instagram authorization | Planned | Official connect/callback, eligibility, reconnect/disconnect and owner isolation |
| F19 | Reviewed Post now flow | Planned | Exact asset/account/caption; confirmed publication; duplicate/unknown-outcome protection |
| F20 | Scheduling and schedule management | Planned | Timezone/DST/lead-time validation; durable dispatch; cancel/replace/reconnect races |
| F21 | Full Cinema homepage and cross-device polish | Planned | Complete approved homepage, deliberate hero motion, mobile/a11y review and real example playback |
| F22 | Internal end-to-end acceptance and deployment | Planned | Two-user isolation, outage/recovery checks, generation benchmarks, Meta test posts; deployment separately reviewed |

Infrastructure blockers are recorded against the affected feature. Do not move billing, public signup, teams or brand kits into V1 implicitly.

## F01 — implementation record

Scope: a runnable web application foundation, not the complete homepage or dashboard.

- `apps/web`: isolated npm workspace using Next.js App Router 16.3.8, React/React DOM 19.3.0, strict TypeScript, root layout and metadata.
- `apps/web/app/globals.css`: approved neutral Cinema tokens, responsive layout, visible focus, reduced-motion handling, shared control and panel styles.
- `apps/web/components/ui.tsx`: Brand, Shell, ActionLink and Button primitives.
- `/`: scaffold preview with the approved brand direction and a static story illustration; links to `/foundation`.
- `/foundation`: development specimens for colors, typography, controls and feedback; input is explicitly not saved. No false login or generation controls.
- Generic not-found and route error boundaries. Routes are public, contain no account data, and carry noindex metadata; noindex is not authentication.
- Local Fontsource packages serve fonts without build-time Google Fonts requests.
- `.nvmrc` selects Node 24.21.0. Host initially reports Node 25.2.1; all verification commands ran under Node 24.21.0.
- Root scripts delegate web dev/build/start to the workspace. Prototype dependencies and source are retained. Web React is separately versioned from prototype React 19.2.0.
- Root `public/runs` and `runs` are outside the Next.js app root. Never symlink them into the web app or use the root as a public server directory.
- Root `.env.local` remains prototype-only. No credentials were read or copied. Future web secrets belong in ignored `apps/web/.env.local`.

Architecture adjustment: SYSTEM_DESIGN.md's logical web `app/` and `components/` directories are located under `apps/web/` to isolate web static assets and runtime dependencies from the working Remotion prototype. The service/API design is unchanged.

### Verification

Verified October 1, 2026, locally:

| Check | Command or evidence | Result |
| --- | --- | --- |
| Runtime | `npm exec --yes --package=node@24.21.0 -- node --version` | v24.21.0 |
| Types and regression tests | `npm exec --yes --package=node@24.21.0 -- npm run check` | Prototype TypeScript, web TypeScript and all 23 existing tests passed |
| Production build | `npm exec --yes --package=node@24.21.0 -- npm run build` | Passed; `/`, `/foundation` and not-found routes generated |
| Production HTTP checks | [Recorded responses](design/verification/f01-http-checks.json) against `npm start` | `/` and `/foundation` return 200; unknown route, `/.env.local` and prototype MP4 path return 404; noindex present |
| Desktop UI | [Screenshot](design/verification/f01-desktop.png) | Cinema palette and two-column hero inspected; foundation link navigates correctly |
| Mobile UI, 390 × 844 viewport | [Home](design/verification/f01-mobile.png), [foundation](design/verification/f01-foundation-mobile.png) | Stacked layouts inspected; document width 375px within 390px viewport; no horizontal overflow; home link works |
| Browser console | Production preview after navigation and responsive checks | No captured warning/error entries |

The host Node 25 installation emitted the expected Node 24 engine warning; the commands above explicitly used the selected Node 24 runtime. No new paid API calls, video renders, external publication or deployment were performed. Existing pipeline tests validate local behavior, not live provider availability.

### Remaining limitations

- No database, auth, sessions, save operations, AI calls or media integrations in the web app.
- Homepage illustration is static; full homepage and motion are F21.
- The UI foundation page is a development specimen; it will be gated/removed before internal deployment.
- Error UI is present; failure injection verification is deferred until real server operations exist.

## F02 — implementation record

Completed October 1, 2026. This is a database foundation, not login or project CRUD.

- `apps/web/src/db/config.ts`: explicit runtime/operator configuration; missing/invalid configuration produces safe errors without echoing credentials.
- `apps/web/src/db/client.ts`: server-only, lazy shared MongoDB connection pool, bounded connection/wait timeouts, failed-connection retry, preserved BSON Long values and a transaction helper using snapshot reads/majority writes. Transaction callbacks must contain sequential database operations only.
- `apps/web/src/db/schema.ts`: strict BSON validators and named indexes for `internalAccess`, `preferences`, `projects`, `conversations` and the migration ledger. Application IDs are opaque strings; unknown document fields are rejected. Integer/Long and Date types follow DB_DESIGN.md.
- `apps/web/src/db/setup.ts`: explicit initial setup with replica-set/sharded-topology check, immutable migration checksum, exclusive lease/fence, progress checkpoint and safe replay of additive DDL. Existing validator drift or index conflicts stop setup; no records/indexes/validators are silently deleted or overwritten. Expired setup leases can be reclaimed.
- `apps/web/scripts/db-setup.ts`: operator CLI using separate `MONGODB_MIGRATION_URI`, safe error output and nonzero exit on failure. Root `npm run db:setup` delegates into the web workspace and loads only its environment file.
- `apps/web/tests/db.test.ts`: disposable localhost replica-set tests, independent of any environment database URI. MongoDB server 8.0.17, driver 7.7.0 and test runner package 11.3.0 are pinned.
- `apps/web/.env.example`, workspace/root package scripts and lockfile, and README document configuration, setup and verification. Prototype environment credentials were not read or changed. UI is unchanged.

### Verification

All commands below ran using `npm exec --yes --package=node@24.21.0 -- …`:

| Command | Result |
| --- | --- |
| `npm run check` | Both TypeScript checks and all 23 prototype tests passed |
| `npm run test:db` | 11/11 passed against actual MongoDB 8.0.17 replica set, then disposable instance stopped |
| `npm run build` | Production Next.js build passed without database credentials |
| `git diff --check` | Passed before commit |

Database tests cover configuration/CLI failure, shared connections/reconnect, secret-safe errors, idempotent setup preserving data, named project indexes, strict BSON/unknown-field/enum validation, partial uniqueness, preserved Long counters, transaction commit/rollback, schema drift refusal, checksum mismatch, active lease exclusion and expired lease recovery. Initial typecheck issues in driver collection metadata typing and the environment test interface were corrected before the passing full run.

### Remaining limitations

- No Atlas credentials or hosted database changes. A separate development database and least-privilege runtime/operator credentials must be configured before hosted integration; actual Atlas permissions/topology remain unverified.
- Auth-managed schemas belong to F03. Drafts, immutable content, jobs, publishing and other collections will be added with their owning features; this setup does not pre-create incomplete versions of them.
- These schemas do not enforce foreign keys, user authorization, valid IANA timezone names or state transitions. Those require the corresponding services. No public database endpoint has been added.
- The initial migration only performs additive collection/index setup. Data backfills, upgrades and prototype imports are not implemented; future migrations need separate immutable definitions and checksums.

## F03 — implementation record and user testing checkpoint

Implemented October 1, 2026. This record describes the backend milestone; F03 was subsequently user-approved and F04 is recorded separately below.

- `apps/web/src/auth/config.ts`, `engine.ts`, `runtime.ts`: Better Auth 1.7.7 with MongoDB, explicit string user IDs, server-only lazy initialization, seven-day absolute sessions, no cookie token cache, secure production configuration, and admission checks. Public signup is disabled by configuration and creation hook; no native Better Auth HTTP handler is mounted.
- `apps/web/src/auth/http.ts` and three `app/api/session` route files: strict input validation, exact Origin checks on mutations, bounded JSON bodies, safe response envelopes, private/no-store caching, cookie forwarding, generic credential failures and no session token in JSON. Session read returns a personal workspace ID matching the user ID; capabilities remain false until features exist.
- `apps/web/src/auth/operator.ts`, `scripts/auth-operator.ts`: interactive account provisioning via supported Better Auth API with out-of-band identity verification, idempotent actual-user linking, disabled-account refusal and operator disabling. Passwords are hidden and never accepted in command arguments. Disabling first denies admission, then deletes the user's session records using the pinned adapter's string-ID schema. No password hashes are implemented by application code.
- `apps/web/src/auth/setup.ts`: explicit additive operator setup derived from pinned auth schema metadata, including both field-level unique/index attributes and table-level indexes. The adapter's table-level index resolution omitted legacy field indexes; a real duplicate-email test caught this and operator setup now installs them. Runtime index administration is disabled and tested. Setup/provisioning refuse missing foundation setup; runtime checks required auth indexes before accepting requests. Auth version upgrades require a reviewed migration; this setup does not rewrite auth validators or delete data/indexes.
- `apps/web/src/auth/throttle.ts`: database-backed fixed-window email/IP HMAC buckets with five/30 failure limits per 15 minutes, atomic reservation, successful-attempt release and Retry-After. Only explicitly trusted proxy headers are accepted; otherwise one conservative shared IP bucket is used. Raw email/IP are not stored in bucket identifiers. TTL is cleanup, not the enforcement mechanism.
- `scripts/auth-local.ts`, `auth-input.ts`, `auth-verify.ts`: disposable MongoDB and actual Next.js API testing on port 3001; password input hidden, cookies only in memory, temporary secret, automatic cleanup. The launcher and verification commands are for user testing, not deployed product UI.
- `tests/auth.test.ts`: real MongoDB 8.0.17 and actual Next.js routes. Environment examples, scripts/lockfile, README and AGENTS.md updated. No root prototype credentials were read or changed; no hosted account was created.

### Verification

Commands ran under Node 24.21.0 using `npm exec --yes --package=node@24.21.0 -- …`:

| Check | Result |
| --- | --- |
| `npm run check` | Both TypeScript checks and all 23 prototype tests passed |
| `npm run test:db` | 11/11 foundation tests passed |
| `npm run test:auth` | 14/14 passed, including full HTTP login/session/logout through a temporary Next.js server |
| Final `npm run typecheck:web` and `npm run build` | Passed; three dynamic session API routes compiled; build requires no database credentials |
| `git diff --check` | Passed before commit |

Auth coverage includes provisioning/idempotency/real user uniqueness, signup denial, safe session DTOs, cookie attributes, missing/cross-site Origin, unknown fields/body bounds, generic invalid credentials, email/IP throttling, disabled access and revocation, expiry/tampering, runtime absence of schema operations, fail-closed incomplete setup and no native auth endpoint exposure. Test servers/databases stop after completion. The delegated manual checkpoint below passed; the user subsequently approved testing and code review on October 1, 2026.

### Delegated manual API testing — October 1, 2026

At the user's request, Codex exercised the interactive checkpoint against implementation commit `d311de7`, using the cached Node 24.21.0 runtime, a fresh test-only password and the launcher's disposable local MongoDB. No application code changed. Files changed for this verification milestone: `PROJECT_STATUS.md` only.

| Manual check | Observed result |
| --- | --- |
| `npm run auth:local` with interactive name/email/hidden password | Account provisioned; Next.js ready at `http://127.0.0.1:3001` |
| `npm run auth:verify` with the same credentials | Exit 0; all five PASS messages: anonymous denial, wrong-password denial, sign-in/workspace identity without token in JSON, authenticated session and logout revocation |
| Additional requests against the running Next.js API | Missing/foreign Origin 403; extra fields 422; malformed JSON 400; wrong content type 415; oversized body 413; native signup endpoint 404 |
| Credential and session protections | Unknown user and wrong password both 401 with identical generic errors; whitespace/case-normalized email login 200; HttpOnly/SameSite=Lax cookies, private/no-store response, safe DTO fields, false capabilities and seven-day expiry verified; forged cookie 401 |
| Rejected logout | Foreign Origin 403; existing session still usable afterward (200); anonymous valid logout 204 |
| Disabled-account protection | Changed admission only in the disposable fixture: existing session 403 and correct-password login 401. Called the actual `disableUser` operator function: stored sessions removed and previous cookie returned 401 |
| Rate limiting | Five failed attempts for a fresh test email returned 401; sixth returned 429 with positive Retry-After |
| Cleanup | Sent Ctrl+C to `auth:local`; launcher exited and neither Next.js port 3001 nor the disposable MongoDB port had a remaining listener |

Additional checks used a temporary ad hoc TypeScript harness outside the repository, with password entry hidden and cookies held in memory. No credentials, tokens or generated media were added to the repository. Initial environment restrictions (npm registry DNS lookup and sandbox socket binding) were resolved by using the already-cached Node runtime and approved local networking; no product failure was observed. The Ctrl+C-interrupted launcher reported exit 1; both server listeners stopped.

Scope limits: this was a local API walkthrough, not browser UI acceptance, Atlas verification, a new full regression run or production validation. The previously recorded 48 automated tests/typechecks/build were not rerun for this documentation-only milestone. The interactive operator CLI, session time passage and production HTTPS cookie behavior were not re-exercised manually. At that checkpoint F04 was unstarted; subsequent user approval authorized the F04 implementation below.

### Historical F03 API checkpoint — now user-approved

From the repository root using Node 24.21.0:

1. Terminal one: `npm run auth:local`. Enter a name/email and a fresh test-only password (12–128 characters). Wait for Next.js Ready at `http://127.0.0.1:3001`.
2. Terminal two: `npm run auth:verify`. Enter that same email/password. Expect PASS messages for anonymous denial, wrong-password denial, login/workspace identity, session recognition and logout.
3. Stop terminal one with Ctrl+C. Disposable test data is removed.
4. This checkpoint has been accepted; use the F04 browser checkpoint below for the current review.

This is an API test, not a browser sign-in screen. No Atlas credentials are required. Do not use a real/reused password. Port 3001 must be free; avoid another Next.js development server in this same workspace during the test.

### Remaining limitations

- Atlas configuration and actual hosted DB privileges remain unverified. Local checks do not establish production readiness.
- At the F03 milestone, browser UI, page guards and password recovery were deferred to F04 (now implemented below). Provisioning never silently resets passwords or re-enables disabled users.
- No jobs/publishing exist to cancel or pause on disable; later features must integrate these transitions. Hosted reverse-proxy IP trust must be verified before deployment.
- Local HTTP cookies intentionally lack Secure; HTTPS production configuration requires it. No deployment, AI calls or social publication occurred.

## F04 — implementation record and browser review checkpoint

Implemented and locally verified October 1, 2026. User acceptance is pending; F05 has not started.

### Scope and files

- `app/sign-in/page.tsx`, `components/sign-in-form.tsx`, `components/auth-shell.tsx` under `apps/web`: Cinema sign-in, accessible email/password fields, show/hide, pending state, generic credential errors, service/network feedback and Retry-After cooldown. No public signup.
- `app/access-help/page.tsx`: operator-assisted recovery guidance without exposing account membership or claiming an email was sent. Disabled/service-unavailable states have generic guidance.
- `src/auth/page-guard.ts`, `navigation.ts`, `runtime.ts`: server session/admission checks for private pages, safe redirects and an allowlisted return destination. `/projects` is an authenticated workspace entry showing the current identity, not project CRUD or a video library.
- `components/private-session.tsx`, `app/projects/page.tsx`: sign-out, session expiry, focus/periodic/history-restoration rechecks, identity-change reload and retry feedback when connectivity prevents verification. Future private pages and APIs must independently enforce authorization.
- `src/auth/recovery.ts`, `scripts/auth-operator.ts`: hidden, confirmed password input for operator recovery after out-of-band identity verification. Supported Better Auth reset APIs consume a five-minute one-use token and revoke existing sessions. Disabled accounts remain disabled; no public reset endpoint or email delivery was added.
- `app/globals.css`, `app/page.tsx`: approved Cinema tokens, responsive auth/workspace layouts and a working home sign-in link. Live Stitch retrieval was unavailable; implementation used the saved approved design specifications, not a newly verified pixel comparison.
- `tests/auth.test.ts`, `scripts/auth-local.ts`, README, AGENTS and this status document: integration coverage, browser test instructions and the next-feature review gate. Prototype credentials, rendering code and video styling are unchanged.

### Verification

Commands ran under Node 24.21.0 using `npm exec --yes --package=node@24.21.0 -- …`:

| Check | Result |
| --- | --- |
| `npm run check` | Both TypeScript checks and 23/23 prototype tests passed |
| `npm run test:db` | 11/11 real local MongoDB replica-set tests passed |
| `npm run test:auth` | 17/17 passed, including actual Next.js page/API requests, anonymous/expired/disabled route guards, safe return redirects, recovery/session revocation and one-use reset-token replay rejection |
| `npm run build` | Production build passed, including sign-in, access-help and private projects routes; no hosted credentials required |
| Desktop browser | Wrong-password generic error, cleared password, show/hide, successful login with correct identity, sign-out and anonymous private-route redirect passed |
| Mobile browser, 390 × 844 | Sign-in and recovery inspected; no horizontal overflow; help navigation passed |
| Screenshots | [Desktop sign-in](design/verification/f04-sign-in-desktop.png), [workspace](design/verification/f04-workspace-desktop.png), [mobile sign-in](design/verification/f04-sign-in-mobile.png), [mobile recovery](design/verification/f04-recovery-mobile.png) |

Total: 51 automated tests passed. Browser checks used a temporary Next.js server and disposable local MongoDB with synthetic credentials; that preview is stopped. No real credentials, paid API calls, deployment or social publication occurred.

### Delegated browser and operator testing — October 1, 2026

At the user's request, Codex tested implementation commit `4f8e29a` under cached Node 24.21.0. Started `npm run auth:local`, entered a fresh synthetic account through the interactive prompts, and exercised the actual pages in the Codex in-app browser. No application code or configuration changed. This milestone changes this status document and adds two screenshots under `design/verification/`.

| Manual check | Observed result |
| --- | --- |
| Empty sign-in form | Native required-field validation blocked submission and focused Work email |
| Password visibility | Show changed the input to text; Hide restored password masking; tested with an incorrect test value |
| Incorrect password | Generic error shown, password cleared, controls usable again; pending state disabled inputs and showed Signing in |
| Recovery guidance | Help link opened `/access-help`; instructions described contacting an operator and verifying identity, with no email-sent claim; Back to sign in worked |
| Successful sign-in | Correct synthetic name/email shown at `/projects`; workspace survived reload |
| Sign-out and private access | Signed-out notice shown; subsequent direct `/projects` visit redirected to sign-in with return destination preserved |
| Mobile, 390 × 844 | Sign-in, recovery and workspace inspected; no horizontal overflow (375px document width on auth pages, 390px on workspace); mobile sign-in succeeded |
| Operator recovery: mismatch | Ran the actual `scripts/auth-operator.ts recover` interactive CLI with isolated fixture configuration; both password prompts hidden; mismatched confirmation returned `RECOVERY_INPUT_INVALID` and exit 1; existing browser session still worked |
| Operator recovery: success | Matching confirmation returned success and exit 0; reloading the old browser session redirected to sign-in with session-ended notice; old password rejected; recovered password signed in successfully |
| Browser diagnostics | No warning/error entries captured by the browser log tool |
| Cleanup | Signed out, restored the browser viewport and closed the test tab; deleted temporary credentials/harness; Ctrl+C stopped the launcher, with no remaining listeners on web port 3001 or the disposable MongoDB port |

Evidence: [desktop workspace after recovery](design/verification/f04-manual-workspace-desktop.png) and [mobile sign-in](design/verification/f04-manual-sign-in-mobile.png). Screenshots contain only synthetic account information; no passwords or tokens. Operator testing used a temporary wrapper outside the repository to provide disposable database configuration and a temporary operator auth secret without reading environment files. It invoked the actual CLI, including its hidden-input and confirmation handling.

All listed checks passed; no functional defect was observed. `git diff --check` passed for this evidence-only milestone. The previously reported 51 tests, TypeScript checks and production build were not rerun. This walkthrough does not establish Atlas/production readiness, seven-day elapsed expiry, disabled-account recovery, one-use token replay behavior or browser cooldown/offline behavior; existing automated coverage and remaining limitations still apply. F05 remains unstarted pending user feedback.

### User browser checkpoint — review before F05

1. From the repository root with Node 24.21.0, run `npm run auth:local`. Enter a test name/email and a fresh test-only password of 12–128 characters. No Atlas configuration is needed.
2. Once Ready, open `http://127.0.0.1:3001/sign-in`. Check a wrong password, password visibility and “Need help signing in?”. Then sign in and verify your name/email.
3. Sign out, then visit `/projects`; it should return to sign-in. Inspect desktop and mobile layouts.
4. Stop with Ctrl+C and share feedback. Keep port 3001 free and avoid a second Next.js dev server in this workspace. The local fixture is disposable.

### Remaining limitations

- Atlas credentials/privileges, production HTTPS and deployment remain unverified. This is local acceptance evidence.
- Throttling is backend-tested; the UI cooldown and offline branches were not browser fault-injected. Session-ended browser redirects after operator recovery were manually verified, but seven-day elapsed expiry was not. Interactive operator recovery was manually verified for mismatch and success; disabled-account recovery and reset-token replay remain automated-test coverage.
- Project CRUD/library, AI generation and Instagram integration remain future features. The private workspace explicitly says video creation is coming soon.
- Recovery requires a trusted operator and out-of-band identity verification. Automated recovery email, public signup and an admin web console are outside this slice.

## F04 review fix — client-side history restoration

Completed October 1, 2026. Scope is the reported P2 session-display issue; F05 remains unstarted.

- `apps/web/components/private-session.tsx`: start in checking state with private content hidden. A layout effect immediately revalidates on mount/reactivation and pathname changes, before restored content can paint. Listen to `popstate` in addition to full-document restoration, focus and visibility events. Invalidate and synchronously hide the content on cleanup/deactivation; retain child state while checking. Abort superseded requests and compare a generation counter after response-body parsing so stale completions cannot reveal content or redirect the current view. Server/API authorization remains unchanged.
- `apps/web/tests/auth.test.ts`: extend the authenticated HTML integration check to require hidden private content and the checking state before client validation.
- Verification on Node 24.21.0: `npm run test:auth` 17/17 passed, `npm run check` both typechecks and 23/23 prototype tests passed, `npm run build` passed. No DB schema changed; the separate DB suite was not rerun for this fix.
- Browser regression with a disposable local account: sign in in tab A; open authenticated tab B; follow the home link in A; sign out in B; press Back in A. The restored route immediately showed only “Checking your session…” (no identity in the visible accessibility tree), then redirected to sign-in with `reason=expired`. Server logs show the immediate session request returned 401. [Result screenshot](design/verification/f04-history-logout.png).
- Valid-session regression: sign in again, follow home, Back returns to the workspace after validation, Forward returns home. No browser warning/error logs were captured during the logout regression.
- Test preview and disposable data were stopped afterward. The browser walkthrough used Next.js development mode; production compilation passed, but no deployed browser test was performed. Deliberately reordered network responses were not fault-injected; the generation/abort safeguard is implemented and code-reviewed here. This UI guard prevents stale display, not removal of data already delivered to the browser.

Repeat the browser regression with `npm run auth:local` and two tabs sharing its test account; use only a fresh test password. Do not treat a regular full-page reload as a substitute for the home-link → browser Back sequence.

## F05 — Personal project APIs and review checkpoint

Implemented October 1, 2026 after user approval of F04 and its P2 fix. This milestone is backend/API work; F06 library UI has not started.

### Scope and files

- `apps/web/app/api/projects/route.ts` and `[id]/route.ts`: authenticated list/create/read/rename/delete routes. Exact Origin on mutations, bounded JSON, strict input and query validation, generic safe errors, private/no-store caching, request IDs, 404 for foreign projects and admission checks on each request.
- `apps/web/src/projects/contracts.ts`, `http.ts`, `service.ts`: trimmed Unicode title bounds, metadata revision CAS, atomic aggregate creation, preference voice snapshot, current-state read, signed owner/filter-bound 24-hour tuple cursors, live filtered lists, idempotent creation/deletion and safe concurrent same-key replay. No owner or arbitrary media selection accepted from commands. Generation/publishing capabilities remain false.
- `apps/web/src/projects/setup.ts`: additive `002-projects` migration with strict blank-draft validation, unique draft ownership index, project receipt scope/parent indexes and no receipt TTL. Runtime checks setup/indexes without administering them. `src/db/setup.ts` extracts a reusable leased migration runner while preserving the original foundation definitions/checksum. Both setup scripts apply the new migration.
- Deletion is deliberately limited to empty F05 projects: one transaction tombstones/scrubs the parent title and flags, removes blank draft/conversation, scrubs create-response snapshots and stores a replayable 204 receipt. It rejects later content with `PROJECT_DELETE_UNAVAILABLE`. Minimal tombstones prevent deleted create keys recreating content. No background cleanup job or media/provider side effect is claimed. API_DESIGN.md and DB_DESIGN.md document this temporary boundary; the eventual 202 cleanup contract remains future work.
- `src/projects/openapi.ts`, `scripts/projects-openapi.ts`, `design/projects.openapi.json`: generated OpenAPI 3.1 for the implemented project routes, sourced from shared request schemas with explicit Unicode title constraints; checked for drift in tests. Not a full specification of unimplemented V1 routes.
- `tests/projects.test.ts`, extended `tests/auth.test.ts`, `scripts/projects-verify.ts`: database/HTTP/security/race tests, real mounted Next.js route checks and interactive local API checkpoint. Package scripts, README and AGENTS reflect the checkpoint before F06. Auth runtime exposes its existing server dependencies and bounded JSON reader; no authentication policy was changed.

### Verification

All commands used Node 24.21.0 via `npm exec --yes --package=node@24.21.0 -- …`.

| Check | Result |
| --- | --- |
| `npm run test:projects` | 14/14 passed against actual disposable MongoDB 8.0.17 replica set |
| `npm run test:auth` | 17/17 passed, including create/read/list/rename/delete through mounted Next.js routes and existing session/page regressions |
| `npm run test:db` | 11/11 passed, including original migration replay, checksum/lease protection, drift refusal and transaction rollback |
| `npm run check` | Both TypeScript checks and 23/23 prototype tests passed |
| `npm run build` | Production build passed; `/api/projects` and `/api/projects/[id]` compiled with existing routes |
| `npm run projects:openapi` | Generated the checked-in schema; equality test passed |
| Interactive local checkpoint | Started `auth:local`, provisioned a fresh disposable test account and ran `projects:verify` using hidden password input. Exit 0 and five PASS groups: authentication, create/replay, read/filter, rename/conflict, delete/replay/deleted-content denial. Signed out afterward; local launcher stopped with Ctrl+C (interrupted exit 1). |

Total: **65 automated tests passed**. Project cases cover owner isolation, Unicode title limits, unknown fields, preconditions, payload bounds, disabled admission, origin denial, key reuse, concurrent duplicate creation/deletion, child-write rollback, concurrent rename CAS, rename/delete races, tie-safe pagination, cursor tampering/expiry/owner/filter binding, preferences snapshot, migration readiness/checksum refusal, content scrubbing and deleted-parent replay denial. No provider calls, hosted DB mutation, deployment or social publication occurred. UI did not change, so no new visual acceptance is claimed.

### Delegated API testing — October 1, 2026

At the user's request, Codex tested implementation commit `348958e` using cached Node 24.21.0, `npm run auth:local`, fresh synthetic credentials and the launcher's disposable MongoDB. No application code/configuration changed; this verification milestone changes `PROJECT_STATUS.md` only.

| Check | Observed result |
| --- | --- |
| `npm run projects:verify` | Exit 0 and all five PASS groups: anonymous/authenticated access, creation/replay, read/filtered list, rename/stale revision and deletion/replay/deleted-content denial |
| Two-user ownership | Provisioned a second synthetic account in the same guarded disposable fixture; foreign read/rename/delete returned 404; second user's list contained only its own project; the same create key worked independently for each owner |
| Pagination and filters | Five primary-user projects traversed as 2/2/1, terminating with no missing/duplicate IDs; drafts included them and ready was empty |
| Cursor/query protections | Another owner's cursor, changed filter and tampered cursor each returned 400; limit 51 and duplicate limit parameters returned 422 |
| Request/retry protections | Changed create payload with reused key returned 409; missing key and injected owner field returned 422; foreign mutation Origin returned 403; create responses had private/no-store and correct Location headers |
| Revision concurrency | Two simultaneous renames at revision 1 produced one 200 and one 409; current revision was 2 and draft revision stayed 1; stale delete returned 409 with currentRevision 2; confirm:false returned 422 |
| Create replay after rename | Returned the accepted revision-1 snapshot with replay header; subsequent read still returned revision 2, so replay did not overwrite current state |
| Empty-project deletion | Deletes/replays returned 204; deleted reads and original create-key retries returned 404; list became empty; direct fixture checks confirmed blank drafts/conversations removed, parent title scrubbed and stored create responses cleared; the other owner's project remained accessible until separately cleaned up |
| Cleanup | Both extended-check sessions signed out with 204; temporary harness removed; Ctrl+C stopped the launcher, with no remaining listeners on port 3001 or its disposable MongoDB port |

Extended checks ran against actual mounted Next.js APIs using a temporary ad hoc TypeScript harness outside the repository; it exited 0 with six additional PASS groups. Direct database access was limited to provisioning the second synthetic account and inspecting cleanup in the verified disposable fixture. Password input was hidden; passwords/session cookies were not printed or committed. No functional defect was observed. `git diff --check` passed.

Scope limits: the previously recorded 65 automated tests, both typechecks and production build were not rerun for this documentation-only milestone. No browser/library UI, hosted Atlas, media cleanup, long-running cursor expiry or production behavior was validated. Empty-project deletion remains the supported boundary. F06 remains unstarted pending user feedback.

### User testing checkpoint — before F06

1. Run `npm run auth:local` with Node 24.21.0 and enter a fresh test name/email/password. It creates a disposable database; Atlas is not needed. Keep port 3001 free.
2. In another terminal, run `npm run projects:verify` with the same email/password. Expect five PASS groups and a final success message. Password and cookies are not printed. The helper creates and deletes its own test project.
3. Stop the launcher with Ctrl+C and share test/code-review feedback. The workspace UI remains the F04 entry screen; the F06 video library will consume these APIs after acceptance.

### Remaining limitations

- Hosted Atlas setup/privileges and production browser/deployment behavior remain unverified. Existing video generation remains CLI-only.
- Draft editing, available voice selection, preference editing, video selection, jobs and populated-project cleanup are later features. F07 must extend the blank-draft validator through a new migration; future child writers must fence the live parent and extend deletion before enabling their content.
- Lists use mutable updatedAt ordering, not snapshots. Clients must deduplicate IDs and refresh from page one after changes. Cursor signing shares the server auth secret with a distinct purpose prefix; secret rotation invalidates existing cursors.
- Minimal project/command tombstones are retained without automated purging. No user billing or retention product was added.

## F06 — My videos library UI and browser checkpoint

Implemented October 1, 2026 after user approval of F05 QA/code review. F07 has not started.

### Scope and files

- `apps/web/app/projects/page.tsx`: protected My videos page using the existing per-page server guard and P2-fixed PrivateSession wrapper. Private content remains hidden before client session verification; the auth integration assertion was updated for the library shell markup.
- `apps/web/components/library/project-library.tsx`: Cinema sidebar/header, current-user identity, responsive project grid with real titles/flags/dates, all six filters, 12-item pages, deduplicated Load more, Refresh, loading skeletons, empty/no-match states, error feedback and announcements. Only implemented navigation is shown. Card artwork is decorative, not a fabricated media thumbnail; no fake videos, durations, counts or provider status.
- Create/rename/delete dialogs call the real F05 APIs. Strict shared Unicode title validation, busy/duplicate-submit protection, explicit delete confirmation, preserved input on errors, revision-conflict reload and same-body/key retries for ambiguous create/delete responses. Modal background is inert; keyboard Tab is trapped, Escape cancels when safe, and focus returns to the originating control or stable New project button after a grid refresh. Dialogs stay within the private wrapper rather than a top-layer portal that could bypass hiding.
- `components/library/client.ts`: same-origin no-store requests, timeout/error classification, session-error redirects through the component, safe fixed feedback and ID-based page merging. List requests abort on filter change/unmount and discard stale completions.
- `app/globals.css`: Cinema library/card/modal layouts and desktop/mobile breakpoints; approved video rendering style is unchanged. Existing saved approved library/review specifications guided implementation. Create is labeled New project because idea/video generation is not yet implemented; open/download/social/settings actions and search/totals remain absent.
- `tests/library.test.ts`, extended auth markup assertion, package scripts, README, AGENTS and this status document record verification and the F07 review gate. No API/DB schema or prototype code was changed.

### Verification

Node 24.21.0 commands ran via `npm exec --yes --package=node@24.21.0 -- …`:

| Check | Result |
| --- | --- |
| `npm run test:library` | 6/6 passed: live-page merge/deduplication, 204 handling, ambiguous failures, safe error codes, aborted-request propagation and no-store credentials policy |
| `npm run test:auth` | 17/17 passed, including private page initial hiding and actual mounted project/session routes |
| `npm run check` | Both TypeScript checks and 23/23 existing prototype tests passed |
| `npm run build` | Final production build and TypeScript validation passed |
| Empty/create/rename | Signed in with a disposable local user; observed empty library, rejected blank title, created a project and renamed it through the UI with persisted API results |
| Pagination/filter | Seeded 12 additional disposable records through real APIs; verified 12 initial cards and 13 after Load more, Ready empty state and Clear filters |
| Delete/focus | Escape cancelled and restored focus to the original Delete control; confirmed deletion of a disposable project removed it and restored focus to New project |
| Concurrent edit | Advanced the same project revision via a second authenticated API session; UI showed conflict and disabled Save; explicit Reload current details updated the revision/title display while retaining proposed input; subsequent Save succeeded |
| Layout/keyboard | Desktop three-column layout and narrow single-column layout inspected. Requested mobile viewport 390×844 reported effective CSS width 325 with content width 312 (no overflow). Mobile dialog fit, title input focused, Tab wrapped, Escape dismissed and restored focus. Temporary viewport override reset. |
| Browser diagnostics | No captured warning/error logs during the walkthrough |

Total this milestone: **46 automated tests passed**. The unchanged standalone DB/project suites retain F05 evidence and were not rerun. Preview used an actual Next.js development server and disposable local MongoDB; test process stopped with Ctrl+C (interrupted exit 1). No real credentials, paid AI calls, deployment or social publication occurred.

Screenshots: [empty desktop](design/verification/f06-empty-desktop.png), [populated desktop](design/verification/f06-library-desktop.png), [mobile library](design/verification/f06-library-mobile.png), [mobile dialog](design/verification/f06-dialog-mobile.png), [revision conflict](design/verification/f06-conflict-desktop.png). All records shown are synthetic test projects stored through the actual APIs.

### Delegated browser testing — October 1, 2026

At the user's request, Codex reviewed implementation commit `ff00f5e` under cached Node 24.21.0 using `npm run auth:local`, a fresh synthetic account and the actual library in the Codex in-app browser. No application code/configuration changed. This milestone updates `PROJECT_STATUS.md` and adds three screenshots under `design/verification/`.

| Browser check | Observed result |
| --- | --- |
| Empty library and create | Empty state displayed; blank title rejected with guidance; Unicode/emoji title created successfully with surrounding whitespace trimmed; success announcement and focus on New project |
| Rename and persistence | Completed rename appeared in the card and survived browser reload |
| Cancel deletion | Escape closed the confirmation, preserved the project and returned focus to its Delete button |
| Two-tab conflict | Opened rename in one tab, saved a competing rename in another, then submitted the stale edit; conflict guidance appeared and Save was disabled; Reload current details displayed the newer title while preserving the proposed input; subsequent Save succeeded and persisted after reload |
| Load more | Seeded 12 additional synthetic projects through the real API; Refresh showed 12 cards, Load more produced 13 distinct project titles and then disappeared |
| All six filters | All and Drafts displayed the projects; Ready, Scheduled, Published and Needs attention each displayed the no-match state; Clear filters restored All with pagination reset |
| Confirmed deletion | Deleted one synthetic project through the dialog; success notice appeared, count became 12, Load more disappeared and focus returned to New project; deleted card remained absent after reload |
| Desktop/mobile layout | Desktop three-column grid inspected; 390×844 mobile viewport showed a single-column library with document width 375px, no horizontal overflow and a dialog fully within the viewport |
| Keyboard/dialog | Project title focused on open; Tab from the final button wrapped to the input; Shift+Tab wrapped back to the final button; Escape closed the dialog and restored New project focus |
| Diagnostics and cleanup | No captured browser warnings/errors; signed out, restored viewport, closed test tabs and removed temporary credentials/seed script; Ctrl+C stopped the launcher, with no remaining listeners on web port 3001 or its disposable MongoDB port |

Evidence: [desktop library](design/verification/f06-manual-library-desktop.png), [mobile library](design/verification/f06-manual-library-mobile.png), [two-tab revision conflict](design/verification/f06-manual-conflict.png). All screenshots contain synthetic test data only. The API seed helper ran outside the repository, created records through `/api/projects` and signed out its separate session. No passwords/session cookies were printed or committed. The dev server's generated `next-env.d.ts` change was restored.

No functional defect was observed in the completed checks. `git diff --check` passed. The prior 46 automated tests, both typechecks and production build were not rerun for this evidence-only milestone. This is local development-browser evidence; hosted/production behavior, network outages, ambiguous mutation responses and genuine non-Draft content were not tested. F07 remains unstarted pending user feedback.

### User browser checkpoint — before F07

1. Run `npm run auth:local` under Node 24.21.0, enter fresh test credentials, then open `http://127.0.0.1:3001/sign-in`.
2. Create a project, rename it, refresh to verify persistence, try filters, cancel deletion, then confirm deletion of your disposable test project. More than 12 projects enables Load more. Inspect mobile layout.
3. Stop the launcher with Ctrl+C and share feedback before F07. Test data only persists while this disposable launcher is running; configured database operation is separate.

### Remaining limitations

- The library organizes projects, not generated web videos yet. Editor/open, playback, download, schedule details, Instagram and settings belong to later features. Current app-created projects only have the Drafts flag.
- Network/503/aborted-request behavior is helper-tested and implemented in UI; prolonged outage/ambiguous-commit UI branches were not browser fault-injected. Loading skeletons exist but no artificial latency was added for visual capture. Production build passed; hosted/browser production acceptance is separate.
- Unresolved mutation dialogs retain input and retry keys only in memory and disable dismissal/editing until resolved. A full reload loses that dialog state; no cross-reload request recovery store is claimed.
- Live lists may move after edits; Refresh resets pagination and Load more deduplicates overlapping IDs. Atlas configuration/hosted privileges remain unverified. No generation or media cleanup was added.

## F06 review fix — dialog focus after session revalidation

Completed October 1, 2026. The reported P2 occurred because the private wrapper hid the focused dialog while its own busy/error state stayed unchanged, so the dialog effect never restored focus.

- `apps/web/components/private-session.tsx`: capture the focused dialog control and input/textarea selection before hiding private content. Preserve that snapshot across repeated invalidations. After an authorized reveal commits, a layout effect restores the still-usable control without scrolling; a removed/disabled control falls back inside the same live dialog. A reveal counter covers batched checking-to-ready updates. Closed/disconnected dialogs are ignored, and deliberate focus elsewhere is respected. Existing auth-failure/account-change redirects, hidden content and stale-request guards remain intact.
- Actual-component browser regression: opened New project on a disposable local account, typed `Focus survives`, and moved the caret to position 13. Waited approximately 68 seconds without clicking the field. The real periodic `/api/session` request returned 200; the same input remained focused with unchanged text and selection 13/13. Typed `X` using the currently focused element (no locator refocus), yielding `Focus surviveXs` at caret 14. Escape dismissed the dialog and returned focus to New project. [Screenshot after typing](design/verification/f06-session-focus.png).
- Verification: `npm run test:auth` 17/17 and `npm run test:library` 6/6 passed; web TypeScript check passed; production build passed under Node 24.21.0. No prototype/database changes were made, so those standalone suites were not rerun. This is a manual actual-timer browser regression, not a new automated DOM test. The removed/disabled-control fallback was code-reviewed, not independently browser fault-injected.
- Disposable preview stopped after verification. No credential/configuration changes, deployment or provider calls. F07 remains unstarted.

Repeat: run `npm run auth:local`, sign in, open New project or Rename, enter text and position the caret, wait at least 65 seconds, then type and press Escape **without clicking or refocusing the input**. The title/caret should survive, typing should continue, and Escape should dismiss the dialog.

## F07 — Idea draft API, autosave and conflict recovery

Implemented October 1, 2026 after user authorization to proceed beyond F06. This is the persistence/client-state slice; no idea editor, brainstorming, AI calls or voice preview UI is claimed.

### Scope and files

- `src/drafts/contracts.ts`, `service.ts` and `app/api/projects/[id]/draft/route.ts` under `apps/web`: owner-scoped GET/PATCH through the existing session/admission/Origin/envelope boundary in `src/projects/http.ts`. Strict field bounds (Unicode code points), empty text and whitespace preserved, nonempty changes and expectedRevision required. Supports topic, audience, notes and application voice preset only. Unknown fields/structured plans/query parameters are rejected. New preset choice is `daniel-test`; a preexisting saved preset can be retained. No provider availability promise.
- Transactional save recomputes the canonical content hash, increments draft revision and mirrors it to the live parent with contentRevision/updatedAt. Metadata revision remains separate. Concurrent saves yield one winner; stale clients receive 409 with currentRevision/reloadUrl. Child failure rolls back the parent. GET uses a consistent snapshot of parent/draft. Foreign/deleted parents are not readable or writable. The live parent write coordinates deletion; F05's edited-project deletion guard remains intact.
- `src/drafts/schema.ts`, `setup.ts`, reviewed extension to `src/db/setup.ts` and successor recognition in `src/projects/setup.ts`: migration 003 upgrades only the exact known blank-draft validator. Original migration definitions/checksums remain unchanged. Replays preserve edited data and indexes; unknown drift/checksum changes stop setup. `scripts/db-setup.ts` and `auth-local.ts` install the new migration using operator/disposable-local setup. Runtime requests do no DDL.
- `src/drafts/autosave.ts`: reusable controller with 800ms debounce, one save in flight, saved/dirty/saving/error/conflict states, preserved typing during saves/failures, read-before-retry recovery for ambiguous outcomes and explicit keep-local/use-remote resolution for competing changes. Disposal suppresses late notifications and clears timers. Transport uses same-origin/no-store requests and bounded timeouts. F08 must mount this controller and implement visible feedback, session redirects and navigation safeguards.
- Added `tests/drafts.test.ts`, `tests/autosave.test.ts`; extended mounted Next.js route coverage in `tests/auth.test.ts`. `scripts/drafts-check.ts` contains shared API acceptance checks, used by auth integration tests and the interactive `drafts:verify` command. Updated shared-schema OpenAPI (`src/projects/openapi.ts`, `design/projects.openapi.json`), package scripts, README, API/DB documents and AGENTS review gate. Prototype code/style and root credentials are untouched.

### Verification

Executed with cached **Node 24.21.0** placed first in PATH (the initial npm-exec registry lookup failed because the sandbox had no DNS; no dependency upgrade was needed). Disposable MongoDB tests require local sockets and were rerun successfully with the approved sandbox escalation after an initial EPERM. Synthetic test accounts only.

| Check | Result |
| --- | --- |
| Draft/API/controller tests | 14/14 passed, including migration/replay/drift, hash/Unicode preservation, cross-user/auth/Origin validation, concurrent CAS, lost-response conflict, deletion races, transaction rollback and autosave recovery/typing/disposal |
| DB/project/library regression suites | 31/31 passed (11 DB + 14 project + 6 library), including checked-in OpenAPI equality |
| `npm run test:auth` | 17/17 passed; actual mounted Next.js GET/PATCH draft routes and the shared four-group verification helper passed with real cookies and disposable MongoDB |
| `npm run check` | Both TypeScript checks and 23/23 prototype tests passed |
| Final targeted rerun | 25/25 DB/draft/autosave tests passed after tightening the explicit predecessor guard and copying the initial client snapshot |
| `npm run build` | Passed, including TypeScript and the dynamic `/api/projects/[id]/draft` route |

**85 distinct automated tests** passed across the suites above; the final 25-test targeted rerun and production build also passed. `git diff --check` passed. At implementation handoff, interactive password entry in the new verifier had not been separately exercised; the delegated walkthrough below now verifies it. No new browser UI exists in F07, so no browser screenshot is presented as feature evidence. Test servers/databases stop after completion. No Atlas migration, paid provider call, rendering run, deployment or Instagram publication occurred.

### Delegated API and autosave testing — October 1, 2026

At the user's request, Codex tested implementation commit `d04b915` under cached Node 24.21.0, starting `npm run auth:local` with fresh synthetic credentials. No application code/configuration changed; this evidence milestone changes `PROJECT_STATUS.md` only.

| Check | Observed result |
| --- | --- |
| Interactive `npm run drafts:verify` | Hidden password entry worked; exit 0 and all four PASS groups: blank draft, persisted fields, conflict/validation denial and explicit revision retry/edited-project deletion guard |
| Targeted controller suite | `node --import tsx --test apps/web/tests/autosave.test.ts`: 7/7 passed, including debounce, disposal, recovery, competing edits and transport/session behavior |
| Live controller persistence | Actual controller saved all four fields through mounted Next.js routes; readback preserved Unicode, emoji, leading/trailing whitespace and newlines; content hash changed |
| Simulated pre-send failure | Test transport threw SERVICE_UNAVAILABLE before sending; local input survived, server revision stayed unchanged, read-before-retry recovered and subsequent save persisted it |
| Simulated lost response after commit | Real API accepted the save, then test transport withheld its successful response and threw CONNECTION; recovery read the committed revision without another write and preserved newer typing for the next save |
| Typing during an in-flight save | Held an actual successful API response while editing locally; a second flush sent no concurrent write; acknowledgement left newer input dirty, and the next save persisted it |
| Competing writer and keep-local | Independent API save advanced the revision; controller hit a real conflict, kept local input and blocked automatic writes; recovery exposed remote content and explicit keep-local saved successfully |
| Explicit use-remote | Another real competing edit produced a conflict; choosing use-remote adopted remote content without another write; parent draftRevision matched saved draft revision while metadata revision stayed 1 |
| Session failure | Signed out the test API session, then attempted another save; actual UNAUTHENTICATED response retained unsaved local notes |
| Cleanup | Disposed the controller, removed temporary harness and stopped auth:local with Ctrl+C; no remaining listeners on port 3001 or its disposable MongoDB port; restored generated next-env.d.ts change |

The seven live controller checks used a temporary TypeScript harness outside the repository, importing the actual `createAutosave` controller with a custom test transport targeting the real local APIs. Failure/response delay was injected only in that transport; no browser outage or visible editor is claimed. Harness exit 0; no passwords/session cookies printed or committed. Edited fixtures were left for disposable database shutdown because populated-project deletion remains guarded. No functional defect was observed; `git diff --check` passed.

Scope limits: the full 85-test suite, both typechecks and production build were not rerun. Migration upgrade/drift and cross-user cases retain prior automated evidence; this walkthrough exercised fresh disposable setup. Browser editor integration, full-reload retention, Atlas and production behavior remain unverified. F08 remains unstarted pending user feedback/code review.

### User testing checkpoint — before F08

1. Under Node 24.21.0, run `npm run auth:local`, enter fresh synthetic name/email/password and leave the disposable server running.
2. In another terminal run `npm run drafts:verify` with the same email/password. Expect four PASS groups for blank draft, persisted idea fields, conflict/validation denial and explicit save recovery/guarded deletion.
3. Stop `auth:local` with Ctrl+C. This removes the edited fixture because edited-project deletion remains unavailable. Review the API/controller code and share feedback before F08.

### Remaining limitations

- No visible idea editor, Gemini brainstorming, provider calls, voice catalogue preview or storyboard editing; those retain their planned feature gates. DraftView is explicitly not approval-valid until a storyboard exists.
- Only in-memory unsaved input retention is implemented. Full reload loses unsaved edits; cross-reload recovery and actual browser integration/unsaved-navigation behavior are not claimed.
- Edited projects still return PROJECT_DELETE_UNAVAILABLE. Durable populated-content cleanup must be implemented before lifting the guard. Migration 003 needs operator setup on any configured development database; no hosted database was altered.
- Conflict resolution deliberately requires a user decision; it offers no automatic field merge. Voice acceptance reflects registered application presets, not current provider plan/credit availability.

## Earlier evidence

The local pipeline history is retained in PROTOTYPE_STATUS.md. It records three generated videos, Gemini/ElevenLabs integrations, timing checks, and renderer recovery tests. Those historical results are not evidence that a hosted pipeline or dashboard works. Existing design artifacts remain in design/SCREEN_REVIEW_INDEX.md; the founder approved proceeding with implementation on October 1, 2026, with background colors normalized to the Cinema tokens.

## Change log

| Date | Feature | Change | Verification |
| --- | --- | --- | --- |
| 2026-10-01 | F07 delegated testing | Completed interactive draft API checkpoint and live autosave failure/conflict recovery walkthrough; documentation only; user feedback/code review pending before F08 | Four verifier PASS groups, seven live controller PASS groups and 7/7 targeted autosave tests passed; local servers stopped; `git diff --check` passed |
| 2026-10-01 | F07 | Implemented idea draft persistence, reviewed validator upgrade and reusable autosave/conflict recovery; added local API verification command | 85 distinct tests, both typechecks, final 25-test rerun and production build passed; F08 waits for review |
| 2026-10-01 | F06 acceptance | User authorized the next feature after the session-focus fix | Conversation approval |
| 2026-10-01 | F06 delegated testing | Completed requested desktop/mobile library walkthrough and two-tab conflict test; added three screenshots; user feedback pending before F07 | Create/rename/delete/persistence, all filters, 12-to-13 Load more, conflict recovery and keyboard checks passed; test servers stopped; `git diff --check` passed |
| 2026-10-01 | F05 delegated testing | Completed requested interactive API checkpoint and extended two-user/pagination/revision/retry/deletion checks; evidence only; user feedback pending before F06 | Five verifier PASS groups and six extended PASS groups, both exit 0; disposable servers stopped; `git diff --check` passed |
| 2026-10-01 | F04 delegated testing | Completed requested desktop/mobile browser and interactive operator recovery walkthrough; saved two screenshots and results; user feedback pending before F05 | Sign-in/error/show-hide/help/private-route/sign-out checks passed; recovery mismatch rejected, successful recovery revoked old session/password, new password worked; local servers stopped; `git diff --check` passed |
| 2026-10-01 | F06 focus fix | Restore dialog control/caret after authorized session reveal | Actual 60-second poll + unrefocused typing/Escape passed; 23 auth/library tests, web typecheck and production build passed |
| 2026-10-01 | F06 | Built real project library with Cinema layout, filters/pagination and create/rename/delete dialogs; awaiting browser review before F07 | 46 tests, both typechecks, production build and desktop/mobile browser actions/conflict checks passed; five screenshots saved |
| 2026-10-01 | F05 acceptance | User confirmed QA/code review green and authorized F06 | User approval in conversation |
| 2026-10-01 | F05 | Added personal project API, transactional blank aggregates/deletion, revision checks, signed pagination, retries, OpenAPI and local verification command; awaiting review before F06 | 65 tests, both typechecks, build and interactive five-group checkpoint passed |
| 2026-10-01 | F04 acceptance | User approved F04 and P2 fix and authorized F05 | User approval in this conversation |
| 2026-10-01 | F04 review fix | Revalidate cached private pages before display on mount/reactivation/history navigation; discard superseded session checks | 17 auth tests, 23 prototype tests, both typechecks, build and two-tab Back/logout + valid-session Back/Forward checks passed |
| 2026-10-01 | F04 | Implemented Cinema sign-in/recovery, private workspace guards and operator recovery; browser review pending before F05 | 51 tests, both typechecks, production build and desktop/mobile browser walkthrough passed; four screenshots saved |
| 2026-10-01 | F03 acceptance | User confirmed feature testing and code review; authorized F04 | User approval in this conversation |
| 2026-10-01 | F03 manual testing | Completed user-delegated interactive API checkpoint and additional negative/security checks; recorded evidence only; awaiting user feedback before F04 | `auth:verify` exit 0 with five PASS messages; extra origin/input/cookie/disabled-account/rate-limit checks passed; local servers stopped; documentation checked with `git diff --check` |
| 2026-10-01 | F03 | Implemented internal authentication backend, operator account tools and disposable user-testing commands; waiting for user test before F04 | 14 auth/HTTP tests, 11 database tests, 23 prototype tests, typechecks and production build passed; user acceptance pending |
| 2026-10-01 | F02 | Completed local MongoDB foundation, initial schemas/indexes, operator setup and configuration documentation | 11 database tests, 23 prototype tests, both typechecks and production build passed on Node 24; hosted Atlas setup outstanding |
| 2026-10-01 | Branch workflow | Created `dev` from the published initial scaffold and made it the active development branch; documented milestone pushes to `dev` and approval before promotion to `main` | Clean starting tree; remote had no `dev`; documentation-only change, checked with `git diff --check`; remote branch equality verified at handoff |
| 2026-10-01 | Repository setup | Prepared initial public repository snapshot of the prototype, scaffold, specifications and design evidence; added standing milestone commit/push workflow | Remote confirmed empty; publishable text scanned for common credential patterns with no matches; environment and generated-media exclusions verified; F01 checks above remain applicable (no runtime code changed). Push result is verified against the remote and reported at handoff. |
| 2026-10-01 | F01 | Completed isolated Next.js scaffold, Cinema primitives, runtime configuration and status workflow | Node 24 production build, both typechecks, 23 tests, HTTP boundary checks and desktop/mobile review passed; evidence above |
