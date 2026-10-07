# Project Status — NamasteVideo.ai

Last updated: October 7, 2026 (Asia/Kolkata).

This is the source of truth for development progress. Specifications describe intent; a feature is complete here only when its implementation and verification are recorded. Design approval is not evidence of working functionality.

## Current checkpoint

**Hosted video completion is in progress.** The user accepted the session UX fix after quick QA and authorized progression. Existing local workers and private media gateway are being prepared for hosting; see the latest checkpoint for evidence, costs and deployment prerequisites. Hosted rendering/playback is not yet accepted.

**F18 live dashboard authorization passed.** Facebook Login connected the personal Instagram destination, encrypted persistence and reload succeeded, and the stored Page token passed a read-only API call. The test Vercel app is deployed. Meta public App Review and Instagram publication remain pending; the previous local-only checkpoint is superseded by the October 7 hosted evidence below.

**F17 local independent QA passed through `14ad96b`.** Desktop/mobile preference saves, validation/discard, both conflict choices, committed-response recovery, sign-out confirmation and future-project defaults passed. The conflict-refresh data-loss issue reproduced at `992557d` was independently closed after `f6d09e2`; the `14ad96b` logo guard retained unsaved input during a guarded navigation attempt. Existing project/draft documents remained unchanged. Relevant tests, typechecks and production build passed; evidence and native-dialog limits are below. F18 now has its separate local checkpoint above.

**F16 local QA passed; spacing P2 independently closed at `491e685`.** Spacing-only edits now enable rendering and survive draft reload, saved-version reload, VTT download and real rendering. Independent recheck passed 91 tests, both typechecks, production build, desktop/mobile editing and a fresh 72.2-second revision using saved synthetic silent audio with no additional speech calls. Previous selection/approval and exact audio bytes were preserved. Earlier core revision/recovery QA is retained below. Hosted playback and subjective listening remain pending; F17 has its separate checkpoint below.

**F15 multi-tab recovery P2 fixed; verification recorded below.** Video approval/selection recovery uses one localStorage record per command UUID. Tabs no longer overwrite a shared pending slot or delete another command on completion. Legacy pending receipts remain readable.

**Sign-in fallback P2 independently verified and closed at `53765f5`.** With scripts blocked in the browser, all credential controls stayed disabled and clicking Sign in did not submit or alter the URL. Normal initialization, incorrect-password feedback, login and sign-out passed. A native-style POST returned sanitized 415 without redirects, query credentials or echoed inputs. Independently reran 17 authentication tests and web typecheck. Listening limits and deferred hosted playback remain unchanged; the separate newer video-recovery fix was not rechecked in this turn.

**F15 local video review passed independent QA at `290e32f`.** Independently reran 96 tests and both typechecks; checked private preview/error refresh, approval recovery after a deliberately lost committed response, version non-inheritance, selection reload/two-tab conflict and actual MP4/VTT browser downloads with exact byte/hash matches. Desktop/mobile checks passed. Hosted playback and subjective listening remain pending. The separate pre-existing sign-in fallback P2 found during that QA was subsequently fixed and independently closed at `53765f5`; its history and recheck evidence are preserved below.

**F14 local job integration is implemented; independent filter QA passed at `004934e` and closes the P2.** Ready and Needs attention now show the correct projects, including overlapping flags after a failed attempt and retained Ready output after cancellation. Independent checks passed 52 targeted tests, web TypeScript and desktop browser filtering; repair restored two deliberately stale records and changed nothing on a second run. Earlier independent 154-test and technical playback evidence remains below. Subjective listening is still pending; hosted compute/media deployment remains deferred. See the final entry for the recheck evidence and limits.

The preceding local renderer checkpoint, including both layout fixes, was accepted by the user. F13's earlier Renderer not connected boundary is superseded for the configured local worker. Hosted compute and media gateway deployment remain explicitly deferred; this is not hosted playback; F15 local video review now has its separate evidence below. Internal account isolation, projects, idea/storyboard generation, editing, revisions and exact storyboard approval remain implemented with their prior evidence below.

## How this document is maintained

1. Before coding, select one feature below and mark it In progress; identify its acceptance criteria.
2. Deliver the complete feature, including backend, UI and relevant verification, without silently starting unrelated features. Split only for a concrete dependency, material risk or necessary user decision, and explain why a separate checkpoint is needed. Internal tasks and coherent commits do not require additional a/b/c or nested numbered milestones or automatic user review gates. Preserve explicit user-requested checkpoints.
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

| ID | Feature | Status | Completion evidence required |
| --- | --- | --- | --- |
| F00 | Local idea-to-video proof of concept | Done (local prototype) | Existing three narrated exports and recovery reports; see PROTOTYPE_STATUS.md |
| F01 | Next.js workspace, Cinema tokens, primitives and app boundary | Done | Production build; both TypeScript checks; 23 existing tests; desktop/mobile route smoke checks; root media inaccessible — evidence below |
| F02 | MongoDB adapter, schema validation and initial indexes | Done (local) | 11 real replica-set tests; both typechecks; 23 prototype tests; production build; detailed evidence below. Atlas not configured. |
| F03 | Internal account admission and session backend | Done; user approved | User confirmed testing and code review October 1, 2026; backend and manual evidence below |
| F04 | Sign-in/recovery UI and private route protection | Done; user approved, including P2 fix | 51 automated tests and prior types/build passed; delegated desktop/mobile browser and interactive operator recovery walkthrough passed; evidence below |
| F05 | Personal project create/list/rename/delete APIs | Done; user approved | Five-group interactive checkpoint and extended two-user/pagination/revision/deletion checks passed; prior 65 automated tests/types/build recorded below |
| F06 | My videos library UI | Done; user approved | Delegated desktop/mobile CRUD, all filters, 12-to-13 pagination, two-tab conflict resolution and keyboard checks passed; prior tests/build below |
| F07 | Idea draft API, autosave and conflict handling | Done; user approved progression | Four-group interactive checkpoint, seven live controller checks and seven targeted autosave tests passed; prior 85-test/types/build evidence below |
| F08a | Cinema idea editor and autosave integration | Done; user approved | Browser autosave/reload, both conflict choices, validation recovery, mobile editing and 87-second session-focus check passed; prior 56-test/typecheck/build evidence below |
| F08b | AI brainstorming and voice previews | Done; user approved | Live topic switching, implicit refinement, draft preservation, recovery, Use idea/save/reload and prior Daniel playback passed; topic-switching finding closed |
| F09a | Storyboard contract and planner | Done; user approved | Live RAM/storage candidate passed after one repair, 62.4-second estimate; 13 tests plus artifact/boundary checks passed; no persistence/UI or content approval |
| F09b | Storyboard candidate storage and APIs | Done; user approved | 24 targeted tests rerun, two live candidates and extended HTTP isolation/recovery/pagination checks; prior 109 web tests/types/build recorded below |
| F10a | Storyboard generation and review UI | Done; user approved including reliability fixes | Desktop/mobile review, successful and failed reload recovery, two-tab conflict/history checks, 11 client tests; prior types/build below |
| F10b1 | Editable storyboard persistence/API | Done; user approved | 69 targeted tests and six actual-HTTP check groups covering apply/edit/replay/conflicts/isolation/preservation; evidence below |
| F10b2 | Cinema storyboard text editor | Done; user approved | Prior desktop/mobile editing and save recovery passed; P2 cue comparison fix browser-verified on bc129c3; 23 UI/controller tests rerun |
| F11a | Storyboard revision engine | Done; user approved | 45 storyboard tests rerun; live single-scene and whole-story revisions passed, preserving unaffected scenes; prior prototype/types/build evidence below |
| F11b1 | Durable revision API and worker | Done; user approved | 55 storyboard + 14 project/OpenAPI tests rerun; actual HTTP admission/replay/history and two live worker revisions passed; source/draft preservation verified |
| F11b2 | Revision dashboard controls | Done; user approved | 30 UI/controller tests rerun; two live desktop/mobile submissions, queued reload recovery, change summaries, parent navigation and explicit apply/restore passed |
| F11b3 | Edited-source snapshots | Done; user approved | 61 storyboard, 32 UI/controller and 14 project tests rerun; browser timeout recovery, mobile snapshot/revision, live manual-scene preservation and immutable history passed; details below |
| F11c1 | Exact-version approval API and storage | Done; user approved | 70 storyboard, 32 UI/controller and 14 project/OpenAPI tests rerun; five actual-HTTP groups passed, including discarded committed response, concurrent requests and non-inheritance; API checkpoint only |
| F11c2 | Storyboard approval confirmation UI | Done; user approved | 42 UI/controller tests rerun; independent desktop confirmation/cancel, committed-response timeout, mobile reload/recovery and preservation of newer two-tab edits passed; prior types/build/prototype evidence below |
| F12 | Private R2 asset adapter and media access | Partial: local QA and live Atlas/R2 service checks passed; hosted gateway deferred by user | Prior local browser/download evidence retained; real verified uploads, conditional retries, range reads, Atlas asset/grant lifecycle passed; deployed Worker/browser delivery remains pending |
| F13 | Durable generation job orchestration | Partial: local execution connected; hosted delivery deferred | 30 job/controller tests; frozen inputs, speech journal, leases, cancellation and atomic completion; browser reload/cancel and live local execution below. |
| F14 | Hosted rendering integration | In progress: hosted worker packaging; local pipeline/filter fixes verified | Filter recheck: 52 tests/web typecheck, desktop browser and stale-record repair passed. Prior 154-test/media/R2 evidence and limits below. |
| F15 | Video review, approval and download UI | Implemented: independent local QA passed; hosted media/listening pending | 96 tests/both typechecks; browser preview/recovery, selection conflicts, exact approval and downloaded byte/hash checks below. |
| F16 | Caption and video revision flow | Local QA passed; spacing P2 independently closed | Prior core-flow QA plus 491e685 recheck: 91 tests, types/build, desktop/mobile spacing, saved/exported text and real silent revision; hosted/listening pending |
| F17 | Personal preferences UI/API | Local independent QA passed through 14ad96b | Saves, conflicts, lost-response recovery, discard/sign-out, future-project defaults and unchanged old projects; 66 relevant tests, types/build; evidence below |
| F18 | Personal Instagram authorization | Implemented; hosted connection verified | Facebook dashboard OAuth, encrypted persistence/reload and read-only saved Page-token API check passed; 115 targeted tests/types/build; public App Review and publishing pending |
| F19 | Reviewed Post now flow | Planned | Exact asset/account/caption; confirmed publication; duplicate/unknown-outcome protection |
| F20 | Scheduling and schedule management | Planned | Timezone/DST/lead-time validation; durable dispatch; cancel/replace/reconnect races |
| F21 | Full Cinema homepage and cross-device polish | Planned | Complete approved homepage, deliberate hero motion, mobile/a11y review and real example playback |
| F22 | Internal end-to-end acceptance and deployment | Planned | Two-user isolation, outage/recovery checks, generation benchmarks, Meta test posts; deployment separately reviewed |

Infrastructure blockers are recorded against the affected feature. Do not move billing, public signup, teams or brand kits into V1 implicitly.

Feature sizing preference updated October 7, 2026: keep future features whole by default and subdivide only when necessary. Existing subdivided IDs remain for evidence traceability; they are not a template for future planning.

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

## F07 review fix — unchanged reads cannot settle timed-out saves

Completed October 1, 2026. The P2 report was reproduced with three failing controller regressions before the fix: a recovery read at revision 1 incorrectly reported reverted text saved while a timed-out PATCH could still commit at revision 2.

- `apps/web/src/drafts/autosave.ts`: an unchanged recovery read retains the attempted write and marks the state dirty, requiring a same-revision CAS write even if input equals the last acknowledged text. Further edits cannot clear this unsettled state. Read-based acknowledgement of attempted content requires an advanced revision. If the delayed original commits first, the recovery write conflicts and preserves local input for explicit resolution; if the recovery write commits first, the old revision can no longer commit. A second timeout with unchanged text/revision remains unresolved.
- `apps/web/tests/autosave.test.ts`: deterministic regression tests simulate both transaction orderings and a timed-out recovery write whose text matches the old persisted text. All three failed on the previous implementation and passed after the fix. Existing seven controller tests also passed (10/10 total).
- `API_DESIGN.md`: recovery contract updated. Verification under cached Node 24.21.0: targeted autosave suite 10/10, `npm run typecheck:web`, and `git diff --check` passed. DB/API code is unchanged; the full DB/auth/prototype suites and production build were not rerun. The delayed-commit race is tested with a controlled revision-checking transport, not a browser/network fault injection. F08 remains unstarted.

## F08a — Cinema idea editor and autosave UI

Implemented October 1, 2026 after user authorization to proceed beyond F07. F08 is now two small slices: F08a delivers the real editor and persistence; F08b retains Gemini brainstorming and available voice previews. F09 still owns storyboard generation. No AI suggestions, voice playback or generation buttons are mocked as implemented.

### Scope and files

- `apps/web/app/projects/[id]/idea/page.tsx`: protected dynamic route using the per-page session guard and PrivateSession. Invalid ID syntax returns 404. Project/draft data loads only through existing owner-authorized APIs; server-rendered private content is initially hidden. Session-error paths reuse the existing sign-in/access-help destinations.
- `components/idea/idea-editor.tsx`: approved Cinema direction from screens 07/19 with project context, four-step indicator, topic, expandable audience/notes, saved narrator and English/60–90s guidance. All fields use the F07 controller/API. Real loading/missing/error states, Unicode counters and invalid input feedback, saved/dirty/saving/error/conflict announcements, manual Save now and explicit check/retry recovery. Two-version field comparison exposes keep-local/save and use-saved decisions. Comparison/resolve actions manage keyboard focus.
- Full-document home/library links and a native beforeunload guard protect unresolved in-memory changes on normal supported desktop browser navigation. No localStorage or cross-reload draft recovery. Session expiry/account changes still require reauthentication and can discard unsaved input; saved drafts remain server-side. The editor does not implement automatic merging or pretend an unchanged recovery read settles a pending save.
- `components/library/project-library.tsx`: title and Edit idea links open the project editor; create/library copy reflects implemented editing. Existing create/rename/delete behavior retained. `components/private-session.tsx` extends the reviewed focus-scope capture to the editor so periodic hiding/reveal restores the textarea and caret; dialog behavior is retained.
- `app/globals.css`: responsive Cinema editor, guide panel, narrator/validation/compare layouts and library link styling. Existing video rendering style remains unchanged. No provider/environment/database/API migration changes.
- Updated auth integration assertions, README and AGENTS checkpoint. F08b remains planned; this is not full F08 completion.

### Verification

All commands use cached Node 24.21.0. Browser checks used actual Next.js and disposable MongoDB with a synthetic account.

| Check | Result |
| --- | --- |
| Autosave/library/prototype suites | 39/39 passed (10 controller + 6 library + 23 prototype) |
| Web TypeScript | `npm run typecheck:web` and final production TypeScript validation passed |
| Auth/route integration | 17/17 passed, including unauthenticated editor redirect, hidden initial markup, absent server project data and malformed route-ID checks |
| Production build | Passed, including dynamic `/projects/[id]/idea`; `git diff --check` passed |
| Create → editor → save/reload | Created project through UI, opened Edit idea, saved topic/audience/multiline notes; topic and optional fields persisted after reload; Daniel test preset shown |
| Two-tab conflict | Second tab saved a competing topic; stale tab preserved input, displayed both versions, Keep my input saved and survived reload. Use saved version in the other tab restored server text and focused Topic |
| Input limits/recovery | 2,001-character topic remained editable, showed over-limit guidance and blocked saving; corrected text + Check & retry save reached All changes saved |
| Navigation protection | Clicking My videos while invalid/unsaved input was present left the editor and text intact. In-app browser exposed no inspectable native dialog; native warning presentation remains browser-dependent and was not visually asserted |
| Session poll focus | Waited approximately 76 seconds with Topic focused and caret at position 46; actual 60-second session checks returned 200. Field/caret remained at 46; typing `!` without refocusing inserted at that position and autosaved |
| Layout and unavailable project | Desktop layout reviewed. Requested 390×844 mobile viewport reported effective CSS width 325 with document width 312 (no horizontal overflow). Missing project showed safe unavailable message and library link |
| Browser diagnostics | No captured warnings/errors on the main editor walkthrough; expected missing-project 404 requests occurred in the separate tab |

Screenshots: [desktop](design/verification/f08a-editor-desktop.png), [mobile](design/verification/f08a-editor-mobile.png), [comparison](design/verification/f08a-conflict.png). Screens show synthetic data. Viewport override reset; disposable preview stopped after browser checks. No new paid calls, deployment, credentials or external publication.

### Delegated browser testing — October 1, 2026

At the user's request, Codex reviewed implementation commit `2575807` with cached Node 24.21.0, `npm run auth:local`, fresh synthetic credentials and a project created through the real library UI. No application code/configuration changed. This milestone updates `PROJECT_STATUS.md` and adds three screenshots under `design/verification/`.

| Browser check | Observed result |
| --- | --- |
| Library entry | Created a project and followed its Edit idea link to the protected editor with correct project context |
| Autosave and persistence | Topic, audience and multiline notes changed from Unsaved changes to All changes saved; Unicode/emoji and newlines were retained after reload; the sole available Daniel test narrator persisted |
| Keep-local conflict recovery | Second tab saved a competing topic; stale first tab retained its input and showed Another version was saved; Compare saved version displayed both topics and focused the comparison heading; Keep my input & save restored Topic focus and reached All changes saved |
| Use-saved conflict recovery | A new stale edit in the second tab produced another real conflict; comparison showed both versions; Use saved version adopted server text, cleared conflict and focused Topic |
| Topic validation and retry | 2,001-character topic remained editable, displayed over-limit/error guidance and disabled Save now after validation; correcting it and choosing Check & retry save reached All changes saved |
| Unsaved navigation | My videos click with invalid unsaved input retained the editor URL and input; no inspectable native dialog was exposed, so native warning appearance is not asserted |
| Session poll and caret | Left Topic focused at caret 1 for 87.5 seconds without browser interactions; server logs recorded two new GET /api/session 200 responses; focus/caret remained at 1; typing `!` without refocusing inserted exactly there and autosaved |
| Manual save | Removed the test insertion and clicked Save now; completed state was All changes saved and corrected topic survived mobile reload |
| Mobile | At 390×844, document width was 375px with no horizontal overflow; optional fields expanded, persisted content remained visible, and a mobile audience edit autosaved |
| Diagnostics and cleanup | No captured browser warning/error entries; returned to library, signed out, reset viewport, closed both test tabs and deleted temporary credentials; Ctrl+C stopped the launcher and neither web port 3001 nor its disposable MongoDB port retained a listener |

Evidence: [desktop saved editor](design/verification/f08a-manual-editor-desktop.png), [mobile editor](design/verification/f08a-manual-editor-mobile.png), [two-tab comparison](design/verification/f08a-manual-conflict.png). All content is synthetic; no passwords/session cookies were printed or committed. No functional defect was observed in the completed checks. `git diff --check` passed.

Scope limits: the prior 56 automated tests, web typecheck and production build were not rerun for this evidence-only milestone. Native unload-warning presentation, live network outages, provider availability, hosted production and mobile OS behavior remain unverified. Only the currently available Daniel test narrator was exercised. F08b remains unstarted pending user feedback/code review.

### Review checkpoint and limitations

Run `npm run auth:local`, sign in, create a project and click Edit idea. Test autosave/reload, optional fields, field limits and competing edits in two tabs. Wait at least 65 seconds with Topic focused and continue typing without clicking it. Stop the launcher when finished. Share feedback before F08b.

AI suggestions/voice previews remain F08b; storyboard creation remains F09. Existing edited-project deletion restriction still applies. Network recovery and delayed-write semantics have controller coverage, but this slice did not inject a live browser outage. No hosted/production browser acceptance or mobile OS unload-warning guarantee is claimed. No AI-provider or new database functionality was added. Existing DB/project standalone suites were not rerun; this slice changes UI and route markup only.

## Earlier evidence

The local pipeline history is retained in PROTOTYPE_STATUS.md. It records three generated videos, Gemini/ElevenLabs integrations, timing checks, and renderer recovery tests. Those historical results are not evidence that a hosted pipeline or dashboard works. Existing design artifacts remain in design/SCREEN_REVIEW_INDEX.md; the founder approved proceeding with implementation on October 1, 2026, with background colors normalized to the Cinema tokens.

## Change log

| Date | Feature | Change | Verification |
| --- | --- | --- | --- |
| 2026-10-01 | F08a delegated testing | Completed editor browser walkthrough; saved three synthetic-data screenshots; user feedback/code review pending before F08b | Autosave/reload, both conflict resolutions, validation retry, mobile edit and 87-second session/caret check passed; local servers stopped; `git diff --check` passed |
| 2026-10-01 | F08a | Implemented Cinema idea editor, library entry links, real autosave/recovery/comparison UI and session focus scope; F08b remains planned | 56 automated tests, web typecheck/build, real desktop/mobile persistence/conflict/validation/session-poll checks passed; screenshots saved |
| 2026-10-01 | F07 acceptance | User authorized the next feature after the unresolved-save fix | Conversation approval |
| 2026-10-01 | F07 recovery fix | Keep timed-out saves unresolved after unchanged reads; require a revision-checked write before declaring reverted input saved | Three regressions reproduced before fix; 10/10 controller tests, web typecheck and diff check passed |
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


## F08b — AI brainstorming and voice sample preview (October 2, 2026)

Scope: owner-scoped Gemini suggestions in the Cinema idea editor, 3–5 bounded title/topic/angle cards, explicit Use idea through the existing autosave controller, source-revision guards, and authenticated Daniel sample proxy/player. No storyboard generation, TTS synthesis or video rendering was added. Provider settings were copied into ignored web configuration with user authorization; no values are stored here or committed.

Implementation:
- `apps/web/src/ideas/{contracts,providers,setup,service,http}.ts`: shared schemas, bounded provider adapters, migration 004 strict request receipts, transactions, auth and safe responses. Gemini uses configured model, structured JSON and a 30-second timeout. Receipts occupy the parent active slot before one provider call; replay does not repeat it. A 45-second deadline fences late completion and releases the slot lazily as unknown. No durable worker/resumption is claimed.
- `apps/web/app/api/projects/[id]/idea-suggestions/route.ts`, `app/api/voices/route.ts`, `app/api/voices/daniel-test/preview/route.ts`: mounted authenticated routes. Preview fetches metadata then an allowlisted, size-bounded MP3 without forwarding credentials to storage or following redirects.
- `components/idea/{brainstorm,voice-preview,idea-editor}.tsx` and `app/globals.css`: request/recovery UI, result cards, autosave application and audio sample controls. Stale or unsaved drafts cannot apply suggestions. Object URLs and pending preview fetches are cleaned up.
- Operator/local launcher applies migration 004; `auth:local -- --providers` explicitly enables separate web provider settings. Offline launcher and auth integration tests mask provider values even when Next loads `.env.local`.
- Project deletion now also refuses suggestion history until durable cleanup exists. API/DB design adjustments and generated `design/projects.openapi.json` document this bounded slice separately from future S02/Inngest conversation jobs.

Verification:
- `npm run test:ideas`: 12/12 passed, including provider bounds, SSRF rejection, strict schema, owner/origin/revision denial, receipt replay, single active slot, stale draft preservation, unknown deadline and late completion fencing.
- `npm run test:projects`: 14/14; `npm run test:drafts`: 17/17; `npm run test:library`: 6/6; `npm run test:auth`: 17/17. Auth tests include the actual new Next routes, anonymous denial, catalog and safe missing-provider errors; no paid calls occur in automated suites.
- `npm run check`: prototype/web typechecks and 23/23 prototype rendering/algorithm tests passed. `npm run build`: production build passed with all new routes.
- Live Gemini (`gemini-3.5-flash`) returned three validated ideas. Browser testing exposed an off-topic English-lessons response; the system prompt now explicitly distinguishes language from subject. A subsequent live request returned three binary-search approaches. Quality remains probabilistic and requires review.
- Real browser: create project, request ideas, Use idea, autosave, reload persistence and stale-card disablement passed. Daniel preview showed the safe unavailable state; direct metadata check returned HTTP 401. Successful audio playback remains unverified with the current key. No synthesis credits were used by the preview adapter.
- Desktop and narrow responsive screenshots: `design/qa/f08b-desktop.png`, `design/qa/f08b-mobile.png`. Narrow view reported 325 CSS pixels with no horizontal overflow. This is a layout smoke check, not mobile-device playback certification. Disposable browser/server stopped after testing.

Remaining limits: one test narrator, no voice entitlement guarantee, no full chat history, automatic polling, resumable background generation, rate-limit UI, or populated-project deletion. Prompt text is not restored after reload; persisted suggestion results are. Unknown requests require explicit recovery/new-request decisions and may already have consumed provider credits. Hosted deployment, end-to-end successful MP3 playback and provider outage browser injection are not verified.

Review checkpoint: run `npm run auth:local -- --providers` with Node 24, choose fresh test credentials, open http://127.0.0.1:3001/sign-in, create a project and choose Edit idea. Ask for suggestions, select Use idea, confirm All changes saved and reload. ElevenLabs requires a working key/voice-read permission before its live sample can be verified. Stop the disposable launcher with Ctrl+C. Do not start F09 until this slice is reviewed.


### F08b preview authorization and URL compatibility fix — October 2, 2026

The user enabled `voices_read` on the correct existing API key. Retesting returned HTTP 200 for voice metadata and the sample. Metadata now supplies a signed `api.us.elevenlabs.io/v1/voices/{Daniel ID}/previews/audio` URL rather than the static `.mp3` paths previously supported. Updated `apps/web/src/ideas/providers.ts` to accept only that exact host/voice/path, including its server-only query. HTTPS, URL length, no credentials/fragment, redirect rejection, MIME and byte bounds remain enforced. The sample fetch does not forward the API key. No keys or signed URLs are logged or committed.

Verification: 6/6 provider tests passed, including the new signed-endpoint acceptance, wrong-host/voice/path rejection and no-key-forwarding regression test in `apps/web/tests/idea-providers.test.ts`; `npm run typecheck:web` passed. The actual app adapter downloaded 45,975 bytes successfully from ElevenLabs. No speech was synthesized. Browser playback and production build were not rerun for this narrow adapter change. Earlier 401 limitations are superseded by this evidence. README and AGENTS checkpoint updated; unrelated generated `next-env.d.ts` changes are excluded from this commit.

### F08b manual QA — October 2, 2026

Started from clean `a0b73fd` using Node 24.21.0 and `npm run auth:local -- --providers`, with a fresh disposable account. Concurrent work committed the signed-preview fix as `146105c` during this run; it was preserved and the subsequent successful preview checks exercised that updated adapter. This milestone changes documentation and synthetic screenshots only.

| Check | Observed result |
| --- | --- |
| Real Gemini requests | Three explicit requests: two persisted `unknown / PROVIDER_OUTCOME_UNKNOWN`, then one `failed / PROVIDER_UNAVAILABLE`. The second request stayed open and returned after 30.4 seconds; the third failed after 11.9 seconds. No successful live suggestion is claimed for this run. |
| Reload and recovery | Reloaded the first request while Exploring; saved Topic survived, prompt reset as documented, and Check request restored the running state. Later checking showed the unknown-outcome warning, including possible repeat credit usage. New requests required explicit action. |
| Fixture boundary | After the live failures, used the real idea service with a local `manual-qa-fixture` provider to persist three clearly labelled QA cards in the disposable database. No production code or provider response was altered. The following application checks use these fixtures, not live Gemini results. |
| Use idea and stale protection | Read idea expanded; Use idea copied the first fixture topic and focused Topic. All three cards disabled immediately while unsaved and stayed disabled with earlier-draft guidance after All changes saved. |
| Reload persistence | Mobile reload retained the applied Topic and three stale cards; no second application or replacement occurred. |
| Prompt validation | Empty and 2,001-character prompts disabled Suggest ideas. No provider request was made for those inputs. |
| Daniel preview | Initial unavailable state preserved narrator choice. After the concurrent signed-URL fix, preview returned HTTP 200 and exposed audio controls. Play changed to Pause with `readyState=4`, advancing currentTime and no media error; playback ended at 5.746875 seconds. A second play paused at 5.627835 seconds without error. No speech synthesis was invoked. This verifies browser media behavior, not subjective listening quality. |
| Narrow-layout smoke check | Requested 390×844 viewport; browser reported 325 CSS-pixel viewport and 312px document/scroll width, with no measured horizontal overflow. Saved draft and stale cards survived reload; prompt validation worked. Full-page capture was visibly clipped, so it was discarded and complete mobile visual acceptance is not claimed. This is desktop browser emulation, not a mobile OS test. |
| Targeted automated checks | Initial idea/provider suite passed 12/12. Rerun after signed-preview changes passed 13/13, including receipt replay, deadline/late-completion fencing, owner/origin/revision denial and signed URL restrictions. |
| Cleanup | Signed out successfully, reset viewport, closed test tab, removed temporary credentials and stopped launcher with Ctrl+C. Neither port 3001 nor the disposable MongoDB port 64414 retained a listener. |

Evidence: [saved fixture and sample controls](design/verification/f08b-manual-editor.png), [unknown-request recovery](design/verification/f08b-manual-recovery.png). Screenshots contain only synthetic test content. No credentials, signed sample URLs, cookies or downloaded audio were saved in the repository. `git diff --check` passed.

Result: application/recovery checks above passed, but this is not a complete live Gemini happy-path pass. Successful live generation should be rechecked before treating the manual checkpoint as fully green. No implementation defect was established from the bounded provider failures. Typechecks, production build, full regression suite, hosted operation, two-tab suggestion races and injected network outages were not rerun for this evidence-only milestone. F09 remains unstarted pending user review.


### F08b controlled Gemini diagnostic retest — October 2, 2026

Following the manual QA report, two sequential synthetic binary-search requests used the actual `suggest` adapter, configured web model `gemini-3.5-flash`, existing 30-second timeout and a diagnostic fetch wrapper. No browser reload, database, fixture substitution or automatic retry participated.

| Attempt | Sanitized evidence | Result |
| --- | --- | --- |
| 1 | HTTP 503; Google category UNAVAILABLE; headers 22,346 ms; total 22,354 ms | PROVIDER_UNAVAILABLE; no suggestion cards possible |
| 2 | No HTTP response headers; TimeoutError at 30,008 ms | PROVIDER_OUTCOME_UNKNOWN; provider completion/usage cannot be inferred |

This independently reproduces both reported failure classes. Attempt 1 demonstrates upstream availability failure rather than an authentication error for that request; attempt 2 demonstrates the configured client/provider deadline, without proving why upstream was slow. Neither required browser reload. The original three QA requests still cannot be retrospectively classified beyond their stored safe codes. Google documents 503 UNAVAILABLE as temporary overload/unavailability: https://ai.google.dev/gemini-api/docs/troubleshooting .

No implementation, model, timeouts, retry semantics or credentials changed. No prompts, keys, raw provider messages or generated output were logged. Existing automated/UI passes remain separate from live reliability; F08b live Gemini acceptance remains incomplete. Recommended next slice: bounded server-side diagnostics (HTTP status, allowlisted category, duration and request correlation) with redaction tests, then a controlled model/latency comparison. Do not blindly increase only the provider timeout: browser, receipt and route limits are respectively 40/45/60 seconds. Do not automatically retry ambiguous outcomes. This is diagnosis, not a provider reliability fix.


### F08b Gemini latency and diagnostics fix — October 2, 2026

Implemented after user authorization to fix the live QA failures. The earlier 503 and timeout were real; this change reduces latency and changes the configured brainstorming model rather than claiming to repair Google's service availability.

Changes:
- `apps/web/src/ideas/providers.ts`: explicit minimal thinking for the verified `gemini-3.5-flash` and `gemini-3.5-flash-lite` model IDs. Other explicitly configured models retain their provider defaults. Structured output validation and the 30-second bound remain. No automatic retries or fallback models were added.
- Selected `gemini-3.5-flash-lite` in ignored web configuration and `.env.example` after live comparison. Root prototype configuration and credentials were not changed. Model catalog returned HTTP 200 and included both tested IDs.
- `src/ideas/http.ts` and `service.ts`: provider completion emits one structured server log correlated by durable receipt ID, with model, HTTP status (or null), a fixed safe category and duration. Categories distinguish success, authorization, configuration, rate limit, availability, timeout, network and invalid output. No prompts, raw provider errors, response text, headers, signed URLs or keys are logged. Diagnostics stay in server logs, not the public DTO or Mongo receipt; deployment log retention is operational, not a new database feature. A logging failure cannot change a successful result.
- `components/idea/brainstorm.tsx`: actionable messages for provider authorization/configuration, rate limits, unavailability and malformed output. Unknown outcomes still explicitly warn that a new request may consume credits again. Existing receipt replay/single-slot/late-completion fencing remains intact.
- `scripts/ideas-probe.ts`, package scripts: `npm run ideas:probe` performs exactly one explicit live request with synthetic input and prints only safe diagnostic fields plus validated suggestion count. It uses the web environment file and may consume provider credits; it is not part of automated tests.
- API/README documentation and AGENTS checkpoint updated. No DB migration or response shape change is required; receipt errorCode already permits the new fixed codes.

Verification:
| Check | Evidence |
| --- | --- |
| Minimal-thinking comparison | Flash-Lite: 2,413 ms; Flash: 4,122 ms. Both HTTP 200, three schema-valid, binary-search-related ideas. This small comparison does not isolate provider-load effects from thinking configuration. |
| Selected model topic checks | Water cycle: 1,962 ms; RAM/storage: 2,166 ms; binary search: 1,839 ms. Each HTTP 200 with three usable-format suggestions and relevant titles. |
| Live dashboard request | Three real binary-search cards appeared; provider duration 2,213 ms. Use idea → autosave → reload retained the topic; earlier cards were disabled as stale. No fixtures used. |
| Reload during live request | Requested RAM/storage ideas, reloaded while running, recovered 202 receipt, then Check request returned three real cards. One provider completion log, 2,291 ms, HTTP 200. Existing draft unchanged. No second generation was triggered by recovery. |
| Targeted automated checks | `npm run test:ideas`: 18/18; `npm run test:auth`: 17/17. New tests cover outgoing thinking config, fixed diagnostic fields/redaction, HTTP classes, timeout vs network, invalid output, throwing logger, receipt correlation and no repeat diagnostics/provider execution on replay. |
| Static/build | `npm run typecheck:web`, `npm run build`, `git diff --check` passed. |
| Screenshots | `design/verification/f08b-live-gemini-fixed.png`, `design/verification/f08b-live-reload-recovered.png`. Synthetic disposable account/project only. Browser and local server stopped afterward. |

Limits: six successful requests on the selected model are evidence for this checkpoint, not a statistical reliability guarantee. Upstream 503s and timeouts may recur; failure/recovery semantics remain truthful. No hosted/serverless interruption guarantee, durable background worker, automatic polling or model failover is claimed. Provider/browser/receipt/route bounds remain 30/40/45/60 seconds. Full prototype and unrelated project/library suites were not rerun for this provider-focused fix. No deployments or social publication occurred.

References: Google's minimal-thinking guidance: https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.5 ; model thinking support: https://ai.google.dev/gemini-api/docs/thinking .

### F08b independent fix verification — October 2, 2026

Retested clean `dev` commit `bdaace1` at the user's request, using Node 24.21.0, `npm run auth:local -- --providers` and a fresh disposable account/project. All three requests used real Gemini; no fixture results, mocks, configuration changes or implementation edits were used.

| Attempt | Scenario | Server diagnostic and outcome |
| --- | --- | --- |
| 1 | Original binary-search topic and prompt, page left open | `gemini-3.5-flash-lite`, HTTP 200, category OK, 2,375 ms; three relevant cards; receipt completed with no error |
| 2 | Water-cycle prompt with saved binary-search draft; reload while Exploring | HTTP 200, OK, 2,407 ms; reloaded GET returned 202, Check request recovered three cards; exactly one provider completion for this receipt; no unknown outcome; content was incorrectly about binary search |
| 3 | Same water-cycle prompt, page left open | HTTP 200, OK, 2,367 ms; three cards, completed receipt, no error; binary-search content mismatch repeated |

Functional passes: first live card's Read idea expanded; Use idea populated Topic and focused it; cards disabled while unsaved and remained disabled as stale after All changes saved. Reload retained the generated Topic and cards. Requests 2 and 3 left the saved Topic unchanged because no Use idea action was taken. Read-only database inspection confirmed exactly three completed receipts, three suggestions each, null error codes, and request hashes matching the water-cycle prompt for attempts 2 and 3. There was one correlated provider-completion log per attempt. No captured browser warning/error entries.

**Open finding (P2): explicit brainstorm subject can be overridden by saved draft context.** Reproduction: save/apply a binary-search topic; enter `Suggest three visual ways to explain the water cycle to children: evaporation, condensation and rain, in a 60–90 second video.` in Explore an idea; click Suggest ideas. Expected: water-cycle suggestions, consistent with the adapter instruction to prioritize the explicit prompt subject. Actual: binary-search cards on both attempts, including `The Magic Phone Book` with a topic explicitly explaining binary search. One attempt involved reload recovery and the other did not; both stored request hashes matched the new prompt. This is a content-relevance failure, separate from the original timeout/availability problem. Root cause and a fix have not been established in this QA-only change.

Verification: `npm run test:ideas` passed 18/18, including diagnostics classification/redaction, minimal-thinking configuration, replay, deadline fencing and durable receipt correlation. `git diff --check` passed. Typechecks, production build, other regression suites, mobile and voice playback were not rerun for this focused retest.

Evidence: [real idea saved and reloaded](design/verification/f08b-qa-fix-saved.png), [recovered live result](design/verification/f08b-qa-fix-recovery.png), [prompt/result subject mismatch](design/verification/f08b-qa-fix-topic-mismatch.png). Synthetic content only; no credentials, provider response logs or audio committed. Signed out, closed the QA tab, removed temporary credentials, stopped the local launcher and confirmed ports 3001 and 53800 had no listeners. Restored only the known Next-generated route-type path changes in next-env.d.ts.

Assessment: the reported unknown/provider-unavailable issue did not recur and the reliability fix passes this local retest. Three successful requests do not guarantee future upstream availability. Full F08b acceptance still needs review of the separate topic-switching finding; F09 remains unstarted.


### F08b topic-switch precedence correction — October 2, 2026

User QA accepted the timeout/availability repair but reproduced water-cycle requests following the saved binary-search topic twice. The old provider payload serialized `{prompt,draft}` in one message with the draft last, described saved material as supporting context, and included a binary-search example in the system instruction. This gave competing topic cues without a sufficiently explicit conflict policy. It is a prompt-context ambiguity; there was no evidence of a stale API result being served as a new generation.

Changed `apps/web/src/ideas/providers.ts`: send optional saved topic/audience/notes as an earlier labelled message and the current request as a separate, final message. The system instruction explicitly prioritizes the current subject, discards conflicting old topic/notes, avoids blending subjects unless requested, and uses saved context for implicit refinements. Removed the hardcoded binary-search example and irrelevant voice preset from the provider context. Model, minimal thinking, JSON schema, timeout, retries and persistence are unchanged.

Live adapter verification with the actual configured Flash-Lite model (no substituted suggestions):
| Saved context | Current request | Outcome |
| --- | --- | --- |
| Binary search; sorted-array notes | Water-cycle ideas for school students | HTTP 200, 2,364 ms; three water-cycle ideas |
| Binary search; notes saying to keep explaining it only | Switch to water-cycle ideas | HTTP 200, 2,001 ms; three water-cycle ideas |
| Water cycle; evaporation/rain notes | Binary-search ideas for beginners | HTTP 200, 1,635 ms; three binary-search ideas |
| Binary search | More approaches to this topic | HTTP 200, 1,837 ms; three binary-search ideas |

`tests/idea-providers.test.ts` checks outgoing context/request separation and precedence instructions. `tests/ideas.test.ts` verifies a changed subject is passed separately from saved context and that returned fixture suggestions do not change the saved draft or source revision; this fixture test does not prove model relevance. `npm run test:ideas`: 20/20 passed; web typecheck and production build passed. No browser walkthrough was repeated for this adapter-only change. Independent browser topic-switch acceptance remains pending. Synthetic generated text was inspected for relevance, not fact-checked for publication; generative relevance cannot be guaranteed by prompt instructions alone.

QA checkpoint: save a binary-search topic and notes, request water-cycle ideas twice, then verify the cards discuss the water cycle while the saved topic stays binary search. Use idea should be the only action that replaces Topic. Also test a vague request such as “give me more approaches to this topic” to ensure saved context is still useful.

### F08b independent topic-switch browser acceptance — October 2, 2026

Retested clean `dev` commit `e144b8c` at the user's request, using Node 24.21.0, `npm run auth:local -- --providers` and a fresh disposable account/project. All suggestions came from real Gemini; no fixtures, mocks or provider/configuration changes. Saved the exact prior phone-book/binary-search topic, audience `Beginning programmers`, and deliberately conflicting notes: `Keep explaining binary search only. Use sorted arrays and repeatedly halve the search range.`

| Request | Browser scenario | Observed outcome |
| --- | --- | --- |
| 1 | Exact previous water-cycle prompt, while saved topic/notes remain binary search | HTTP 200, OK, 2,517 ms; three water-cycle cards. Expanded and reviewed all topics; no binary-search blending. Topic, audience, notes and narrator unchanged. |
| 2 | Repeat identical prompt; reload during Exploring, then Check request | HTTP 200, OK, 1,859 ms; recovered from running/202 to three water-cycle cards covering evaporation, condensation and rain. One provider completion for the receipt. Saved fields matched the original after reload. |
| 3 | `Give me more approaches to this topic.` without applying the water-cycle suggestions | HTTP 200, OK, 2,292 ms; three binary-search approaches (guessing game, dictionary, threshold search), correctly using the still-saved context rather than the previous suggestions. Saved fields unchanged. |
| 4 | Repeat explicit water-cycle prompt for application check | HTTP 200, OK, 2,303 ms; three water-cycle ideas. Used the first idea, waited for All changes saved, then reloaded; the exact water-cycle Topic persisted and all prior cards were disabled as stale. |

Read-only database evidence before Use idea: four completed receipts, null error codes, three suggestions each, all source revisions 3; draft revision still 3 and Topic still binary search. After explicit application: draft revision 4 and water-cycle Topic, with original audience and notes preserved. Browser focus moved to Topic after application; no captured browser warning/error entries. No unknown, unavailable or wrong-subject result appeared in this retest.

`npm run test:ideas`: 20/20 passed. `git diff --check` passed. This evidence-only milestone does not rerun typechecks/build, unrelated regression suites, mobile, voice playback or the opposite-direction browser switch. Existing implementation verification and prior playback evidence remain separate. Generated content was checked for subject relevance, not certified for factual completeness or publication. A small successful live sample is not a guarantee of future provider availability or model behavior.

Evidence: [water-cycle cards beside unchanged binary-search draft](design/verification/f08b-qa-topic-switch.png), [implicit saved-context refinement](design/verification/f08b-qa-implicit-context.png), [water-cycle idea saved and reloaded](design/verification/f08b-qa-water-cycle-saved.png). Synthetic data only. Signed out, closed the QA tab, removed temporary credentials and stopped the launcher. Ports 3001 and 56978 had no remaining listeners; restored only the known Next-generated route-type path changes.

Result: **PASS for the requested browser checkpoint; prior topic-switching P2 finding closed.** F08b is ready for user approval under the documented local scope. No implementation changes or new feature work; F09 remains unstarted.


## F09a — Validated storyboard contract and local planner (October 2, 2026)

F08b QA was explicitly accepted by the user. F09 was split into this contract/planner slice and F09b persistence/API integration so a validated candidate format can be reviewed before enabling dashboard generation.

Implemented files:
- `apps/web/src/storyboards/contracts.ts`: strict PlanV2 core schema, supported visual union (title/takeaway/flow/comparison v1), bounded narration/labels/events/sources/pronunciation, unique IDs, target/action checks, flow endpoint checks, exact case-sensitive cue occurrence checks, source references and exact provided-note excerpts. Overlapping/missing pronunciation substitutions fail. Duration estimate is whitespace-token count after pronunciation substitution at 150 words/minute, bounded to 60–90 seconds; diagnostic range issues include actual/minimum/maximum word counts. No measured audio timing is claimed.
- `apps/web/src/storyboards/planner.ts`: server-only saved-idea planning with configured web Gemini model, minimal thinking for supported IDs, 128 KiB response cap and 30 seconds per attempt. At most one repair of completed invalid output; no retry after HTTP failure, transport uncertainty, truncation or blocked output. Exhaustion returns STORYBOARD_INVALID with safe bounded field/code/numeric diagnostics. Diagnostic callback emits attempt/status/category/duration only and cannot alter result success.
- Provider wire format uses a JSON string for each component data object and a simplified generated schema without provider-side size/range/pattern constraints. The complete contract remains in instructions and all wire/decoded output passes full local validation. Wire strings are parsed as JSON, never evaluated or executed. No arbitrary SVG, code or remote asset component is accepted.
- `apps/web/scripts/storyboards-probe.ts` and package commands: creates an exclusive mode-0600 local JSON artifact in ignored `apps/web/runs/storyboards`; prints path, scene count, estimate and attempt count. This is an inspection artifact, not a stored project version, approval or generated video. It neither reads nor writes prototype runs and exposes no HTTP route.
- `apps/web/tests/storyboards.test.ts`: contract, component, source, cue, pronunciation, duration, safe diagnostics, transport, repair and wire-format tests. API/DB design and README document the staged boundary.

Verification:
| Check | Result |
| --- | --- |
| `npm run test:storyboards` | 13/13 passed |
| `npm run check` | Prototype/web typechecks and 23/23 existing rendering/algorithm tests passed; final web typecheck also passed after planner refinements |
| `npm run build` | Production build passed; no storyboard routes added |
| RAM/storage live probe | HTTP 200, first candidate rejected, one repair succeeded: 4,287 + 3,558 ms. Six scenes, 165 spoken words, 66-second estimate. Artifact: `apps/web/runs/storyboards/426c8f92-fd86-4c9f-85be-5fd39d8672e3.json` |
| Water-cycle live probe | Final request HTTP 200 in 6,052 ms, first attempt valid. Six scenes, 176 words, 70.4-second estimate. Artifact: `apps/web/runs/storyboards/93323574-c08b-4a2c-abe0-48782b0e2e96.json` |
| Content inspection | Both saved JSON artifacts were read; narration and component selection matched their requested subject. No independent factual certification or human publication approval is implied. |

Development probes exposed real upstream schema rejections and invalid candidates (missing cues, out-of-range narration length, extra keys); these were rejected, not stripped into acceptable plans. A fuller Flash comparison returned 503 and did not automatically retry. The final grammar/instructions corrected compatibility, and numeric word-count feedback improved the repair path. These historical failures are not counted as successful live validation. Model availability and generation quality remain variable; two validated artifacts do not establish production reliability.

Remaining work: F09b must add owner isolation, immutable candidate documents/hashes, idempotent request admission, active-project fencing, source-revision/stale-result behavior, pagination/read APIs and crash recovery. Its time budget must allow up to two planner attempts; the existing F08b 45-second receipt cannot simply be reused unchanged. F10 will add schematic storyboard/script review. PlanV2 is not yet accepted by the prototype PlanV1 renderer, and the wider registry (binary search, water-specific drawings, charts, diagrams, timelines) is not enabled. Semantic/factual review and measured narration/event bounds remain later checks. No DB changes, dashboard changes, audio spending, deployment or social publishing occurred in this slice.

QA command: `npm run storyboards:probe -- "Explain RAM versus storage to beginners"` under Node 24. This is a live provider request and may consume credits; one validation repair may make a second call. Open its printed JSON path and inspect narration, visuals, cues and estimated duration. Share results before moving to F09b.

### F09a independent planner QA — October 2, 2026

Tested clean `dev` commit `f4234d3` with Node 24.21.0. Ran the requested `npm run storyboards:probe -- "Explain RAM versus storage to beginners"` against configured live Gemini. Attempt 1 returned HTTP 200 but failed validation (`INVALID_RESPONSE`, 6,452 ms); its single repair returned HTTP 200/OK in 4,894 ms. The command exited 0 and produced a six-scene PlanV2 candidate with 156 spoken words and a 62.4-second estimate. Exactly two attempts were reported. The first candidate's specific validation issues were not emitted by this probe, so its precise rejection cause is not asserted.

Local artifact: `apps/web/runs/storyboards/1aa35b22-c24d-4cf8-8a83-c21de0b48326.json`. Read the full narration, visuals and cues. The sequence covers introduction, RAM, storage, speed comparison, volatility and a desk/filing-cabinet takeaway, using title/flow/comparison/takeaway version 1. Events reference valid targets and exact narration cues. This is an ignored local inspection artifact, not a database version, approved storyboard or rendered video; it remains uncommitted with mode 0600.

| Check | Result |
| --- | --- |
| `npm run test:storyboards` | 13/13 passed, including bounded repair/exhaustion, strict registry, sources, pronunciation, cues and provider failures |
| Artifact revalidation | Independently revalidated the new RAM/storage file and supplied water-cycle file `93323574-c08b-4a2c-abe0-48782b0e2e96.json`; recalculated word counts/estimates match 156/62.4 and 176/70.4; both mode 0600 and ignored by Git |
| Mutated live candidate | Case-mismatched cue, offset 501 ms, duration 3,001 ms and unknown visual-data field were rejected |
| Pronunciation estimate | Expanding one spoken RAM occurrence to R A M increased the calculated count by exactly two words |
| Additional fixture-only failure checks | Invalid visual JSON repaired in exactly two calls; repeated invalid JSON stopped at two; HTTP 401 and 429 stopped at one call with the expected safe error code. These injected checks used no provider calls. |
| Workspace | No source/configuration changes, credentials or generated plans committed; `git diff --check` passed; probe completed with no server to stop |

Content review caveat: the new RAM/storage candidate includes overly absolute wording about apps responding instantly without delays and storage retaining everything safely until manual deletion. These should be revised during editorial review; the strict schema cannot establish those claims. Motion cues are structurally valid, but their timing and rendered appearance were not evaluated. The water-cycle artifact was an existing sample, not a second fresh generation in this QA run.

Result: **PASS for the F09a local contract/planner checkpoint**, with the documented editorial limitations. No new technical blocker was observed. Typechecks/build and the prototype suite were not rerun for this documentation-only milestone; prior implementation evidence remains separate. No TTS, rendering, database/API persistence, UI, deployment or publication was exercised. Wait for user review before F09b.


## F09b — immutable storyboard candidates and owner-protected APIs

October 2, 2026. F09a QA/code review accepted by the user before this slice. Implementation is ready for independent QA; F10 has not started.

- Migration 005 installs strict `storyboardRequests` and `storyboards` validators/indexes. Runtime checks migration readiness; operator setup and the disposable local launcher install it.
- POST generation snapshots the saved draft and revision, claims the shared project slot, invokes the existing planner outside transactions, revalidates the result, and atomically stores one immutable candidate plus the completed receipt. It does not modify/select the draft or storyboard, generate speech, or render.
- GET candidate/history/latest-receipt APIs enforce admitted session and live owner parent. POST additionally requires exact Origin and an idempotency key. Signed, owner/project-bound 24-hour cursors paginate summaries without full content. Candidate reads compute stale status against the current draft revision.
- Same-key replay never calls Gemini again. Shared idea/storyboard deadline recovery releases only the matching slot; late results cannot insert or unlock newer work. Failed finalization rolls back candidate and completion together. The 75-second bounded receipt is not an Inngest job. Empty-delete rejects storyboard histories.
- Canonical content/story hashes are versioned and documented. No update/delete/approval endpoint exists. Candidate immutability is enforced by application behavior, not an administrator-proof database restriction.

Files: `apps/web/src/storyboards/{api-contracts,setup,service,http,openapi}.ts`; `apps/web/src/generation/live-project.ts`; three API route modules; shared idea/project service integration; setup/local launcher; `apps/web/scripts/storyboards-verify.ts`; `apps/web/tests/storyboard-storage.test.ts`; actual route checks in `apps/web/tests/auth.test.ts`. API_DESIGN.md, DB_DESIGN.md, README.md and generated `design/projects.openapi.json` document this implemented boundary.

Verification:
- `npm run test:storyboards`: **24/24 passed** (13 planner/contract + 11 storage/API groups). Includes nested Mongo rejection, unique result index, owner/disabled-session/origin isolation, unchanged draft, stale source, concurrent same-key admission, cross-kind busy/expiry, late-completion fencing, safe terminal failures, signed cursor tamper/expiry, deleted-parent rejection and rollback on forced candidate insert failure.
- Complete web suite, `node --conditions=react-server --import tsx --test tests/*.test.ts` from apps/web: **109/109 passed**, including actual Next.js routes, checked-in OpenAPI drift and previous feature regressions.
- `npm run check`: both TypeScript checks and **23/23 prototype tests passed**. A test-only Mongo listCollections type error was corrected before this successful check.
- Live `auth:local -- --providers` + `storyboards:verify` against the actual Next.js server: **passed**, Gemini `gemini-3.5-flash-lite`, one HTTP 200 provider attempt, 6.938 seconds; six scenes, 160 words, 64-second estimate. Candidate read/list, exact-key replay with no further provider log/call, latest receipt, unchanged saved draft and stale detection all passed. Disposable test database/server stopped afterward; this is not a retained user project. No credentials/content were written to logs/status.
- `npm run build`: **passed**; all three new route modules compiled as dynamic Node routes. `git diff --check`: passed.

QA checkpoint: restart `npm run auth:local -- --providers`, then run `npm run storyboards:verify` in a second interactive terminal with that disposable account. This consumes Gemini quota. Existing persistent databases need `npm run db:setup`. API and DB design appendices contain exact contracts and failure semantics. There is no new browser review screen until F10 is accepted for implementation.

Limitations: one live provider success is not a reliability benchmark. Estimates are not measured audio duration; factual/editorial review remains necessary. No background continuation after server termination; interrupted receipts become unknown lazily after their deadline. No candidate application/editing/approval, R2, hosted rendering or cleanup lifecycle. Public deployment is not part of this milestone.

### F09b independent API and recovery QA — October 2, 2026

Tested clean `dev` commit `06702d6` under Node 24 with `npm run auth:local -- --providers`, fresh disposable credentials and real Gemini. `npm run test:storyboards` passed **24/24**. The requested interactive `npm run storyboards:verify` exited successfully: six scenes, 164 spoken words, **65.6-second estimate**, first provider attempt HTTP 200/OK in 5,693 ms. Candidate read/history, exact-key replay, receipt lookup, draft preservation and subsequent stale detection passed.

Extended checks used the actual HTTP routes, a second approved test user and a temporary local QA script. Database access was limited to test-account provisioning/enablement and read-only evidence checks; generation and candidate persistence used the application API.

| Check | Independent result |
| --- | --- |
| Access boundaries | Anonymous reads returned 401; foreign-owner candidate/history/receipt reads and generation returned 404; a disabled test account returned 403. |
| Immutability and request validation | Candidate PATCH/DELETE returned 405 and rereads were unchanged. Reads used private/no-store caching. Cross-origin generation returned 403, stale revision 409, unknown body field 422, duplicate query parameter 422 and malformed cursor 400. Rejected requests added no receipts. |
| Client disconnect and recovery | Started a second generation, observed its running receipt, then aborted the original client request. Same-key retry returned the same running job with the replay header; polling recovered its completed candidate. A competing storyboard request and idea request both returned PROJECT_BUSY. |
| Concurrent draft edit and stale result | Edited the draft during generation. Completion preserved that edit, reported source revision 4/current revision 5 and marked the candidate stale. Final same-key replay returned the same candidate; changed input under that key returned IDEMPOTENCY_KEY_REUSED. |
| Persistence and history | Exactly two receipts and two candidates existed. Recomputed canonical hashes and duration counts matched. The original candidate was unchanged; the active slot was released and no storyboard was selected. Two limit-1 history pages returned newest then oldest summaries without full content; tampered and cross-project cursors were rejected. |

The second live generation produced six scenes, 152 spoken words and a **60.8-second estimate**. Its first HTTP 200 output failed validation (4,676 ms); the permitted single repair succeeded with HTTP 200/OK (4,778 ms). The safe diagnostic did not expose the specific validation failure, so its cause is not asserted. Across two requests there were three provider attempts including this repair; recovery/replay did not cause duplicate generation. No unknown or unavailable terminal outcome occurred in this run.

Result: **PASS for F09b API QA; no new technical blocker observed.** This checked client-disconnect recovery, not an actual server crash. Deadline expiry, late-result fencing and transactional rollback were covered by the targeted automated suite. The prior full 109-test web suite, 23 prototype tests, typechecks and build were not rerun for this documentation-only milestone. No storyboard browser UI exists in this slice; no audio, rendering, factual approval or hosted reliability claim is made.

Signed out both test sessions, restored the temporary account's enabled state, removed the temporary QA script and credentials, and stopped the disposable server/database. Ports 3001 and 50731 had no listeners afterward. Generated candidates were disposable, not retained artifacts. No source/configuration changes, secrets or generated media are included in this milestone. Wait for user review before F10.


## F10a — generation and storyboard review UI

October 2, 2026. User approved F09b QA/code review before this slice. F10 is split into review/generation (F10a) and saved narration/on-screen text editing (F10b), because existing candidates are immutable and no working storyboard draft/apply API exists yet. F11 remains conversational revisions/approval. Do not call the read-only screen an implemented editor.

Implemented:
- Private `/projects/:id/storyboard` page reuses `PrivateSession` and server admission guard. Client data comes only from owner-protected APIs. The idea editor's **Continue to storyboard** control is disabled until autosave is settled; navigation itself does not generate.
- Saved-topic context, explicit Create storyboard/Generate another, loading/empty/recovery/error states; no fabricated progress percentage. Request key + expected revision are saved before dispatch in same-user/project-scoped sessionStorage. No draft/content/credentials are cached there. Reload replays the same command; status checks never intentionally create a new key. Storage failures stop dispatch. Known admission rejections clear the command; uncertain failures retain it.
- Scene navigator, title/takeaway labels, flow nodes with explicit directed connection labels, comparison panels, narration, pronunciation notes, motion cues, complete script and source notes. All diagram previews are schematic and durations estimated; nothing is presented as a rendered or approved video.
- Paginated saved-candidate history and explicit selection. Refresh preserves the currently browsed candidate. Earlier-draft notices derive from source/current revisions; generation never applies or edits a candidate or the idea. Existing candidates remain visible after failed generation.
- Cinema tokens and responsive layout; approved Stitch screen 08 retrieved and inspected. The implementation omits future editing/revision/approval actions rather than presenting them as operational.

Files: `apps/web/components/storyboard/{controller.ts,storyboard-review.tsx,scene-visual.tsx}`, private storyboard page, idea editor entry, `apps/web/app/globals.css`, `apps/web/tests/storyboard-review.test.ts`, private-route assertions in `apps/web/tests/auth.test.ts`, package scripts, README and design QA notes.

Verification:
- `npm run test:storyboard-ui`: **11/11 passed**. Read-only mount, dispatch ordering, same-key reload after lost response, single in-flight request, running guard, admission rejection recovery, terminal failure preservation, storage failures, disposal, history preservation/pagination, identity/project storage isolation and private transport/auth propagation. Includes a late rejection after disposal that must not clear a newer controller’s recovery key.
- `npm run check`: both TypeScript checks and **23/23 prototype tests passed**.
- Browser: actual disposable local Mongo/Next server with live Gemini. Initial 170-word/six-scene candidate estimated 68 seconds (4.419s initial attempt + 3.675s repair). Reloaded during generation, recovered running receipt, then checked completed receipt; server diagnostics show one request ID and exactly the one permitted repair, not a new generation. Changed saved topic to a desk/cabinet analogy; old candidate was marked earlier. Second explicit generation produced 152 words/six scenes/60.8 seconds (4.862s + 4.848s repair). Switched back to the earlier candidate through history successfully.
- Desktop scene selection/comparison schematic and Full script passed. Mobile 390×844 inspection passed; measured content/client width both 375px (scrollbar excluded), no document horizontal overflow. No browser warnings/errors observed. Viewport override reset and disposable server/database stopped after QA.
- Screenshots: `design/verification/f10a-storyboard-desktop.png` and `design/verification/f10a-storyboard-mobile.png` show live-generated content. They are visual evidence, not factual/editorial approval of the narration.
- Complete web suite: **118/118 passed** (before adding two focused disposal/pagination cases, which passed in the final 11-test client suite). Actual Next route tests verify authentication, hidden-until-validated private content and invalid project IDs. `npm run build`: passed; final guard recheck recorded before commit. `git diff --check`: passed.

QA checkpoint: run `npm run auth:local -- --providers`, sign in to the disposable account, open/create a project, save a topic, choose **Continue to storyboard →** then **Create storyboard**. Check scenes/script, reload recovery, two-tab saved-idea changes, history, keyboard navigation and mobile layout. Generation uses Gemini quota. Persistent installations still require migration 005 from F09b; no new DB migration is introduced here.

Remaining: saved narration/on-screen text editing (F10b), conversational changes, apply/approval and rendering are not implemented. No automatic polling/background-worker guarantee; users select Check request/Refresh to reconcile. sessionStorage recovery lasts only within its browser tab session; a new tab discovers the latest receipt. History multi-page behavior is supported but large-history browser QA is still pending. Independent QA/code review approval is required before the next slice.


### F10a independent browser QA — October 2, 2026

Tested clean `dev` commit `2cb093d` under Node 24 with `npm run auth:local -- --providers`, a fresh disposable account/project and real Gemini. `npm run test:storyboard-ui` passed **11/11**. No application source or configuration was changed.

| Live request | Outcome |
| --- | --- |
| Water cycle, initial generation; browser reloaded during request | Initial output and its single repair returned HTTP 200 but failed local validation (4,369 + 5,175 ms). Reload replay returned the existing running receipt; Check request recovered the terminal failure and displayed the explicit retry guidance. No candidate was fabricated. |
| Water cycle, explicit retry | First attempt HTTP 200/OK in 4,497 ms; six scenes, 152 words, **60.8-second estimate**. |
| RAM versus storage after a saved idea change; browser reloaded during request | First attempt HTTP 200/OK in 5,976 ms; six scenes, 153 words, **61.2-second estimate**. Check request recovered completion and added the candidate to history, preserving the earlier candidate being viewed until explicit selection. |

Provider diagnostics showed three distinct request IDs and four total attempts, including the first request's allowed repair. Reload/recovery did not create an extra provider request. No provider-unavailable or unknown terminal result occurred. The safe diagnostic reports INVALID_RESPONSE without the rejected fields, so the precise validation failure is not asserted. This live sample demonstrates a remaining generation-quality limitation, not reliable first-attempt success.

| Browser check | Result |
| --- | --- |
| Saved idea gate and empty screen | Continue was disabled immediately after editing, enabled after save; navigation showed the saved topic and an empty storyboard without generating. |
| Review controls | Title, flow connections, comparison panels, takeaway, narration, motion cues, supplied source notes and all six script sections were readable. Scene/script switching worked by mouse and keyboard. |
| Idea preservation | A second tab showed the original topic, audience, notes and narrator unchanged after the water-cycle generation. |
| Two-tab revision conflict | Changed and saved topic/audience/notes in the second tab. Generate another from the stale review tab returned 409 with refresh guidance and retained the previous candidate. Refresh showed the new topic and marked the existing storyboard as an earlier idea version. |
| Candidate history | Both successful candidates were selectable. Returning to the older candidate and refreshing preserved that selection and the earlier-version warning. A fresh tab independently loaded the newest saved candidate. |
| Mobile | Tested 390×844. Document client/scroll widths both measured 375px, excluding the scrollbar, in scene and full-script views. Comparison panels remained readable; keyboard activation reached scene 6 in the horizontally scrolling scene navigator. |
| Session and diagnostics | Sign-out followed by storyboard reload redirected to sign-in. Captured desktop/mobile browser warning/error lists were empty. |

Evidence: [desktop review and history](design/verification/f10a-qa-desktop.jpg), [mobile comparison review](design/verification/f10a-qa-mobile.jpg), [recovered validation failure](design/verification/f10a-qa-validation-failure.jpg). Screenshots contain synthetic test content only. The generated RAM/storage narration uses overly broad claims about storage keeping files securely/intact; these need editorial revision before approval. This QA checks the review functionality, not factual certification or rendered motion/audio.

Result: **PASS for the F10a browser checkpoint, with the observed model-validation failure documented.** No new UI blocker was found. History beyond the first page was not exercised in this browser run; its pagination controller test passed. Provider outage injection, real server-crash recovery, saved text editing, approval and rendering were outside this slice. Typechecks/build and unrelated regression suites were not rerun for this evidence-only milestone; prior implementation results remain separate.

Signed out, closed all three QA tabs, reset the viewport override and stopped the disposable launcher/database; port 3001 had no listener afterward. No credentials or generated candidate JSON are committed. Wait for user/code review before F10b.


## Storyboard reliability fix — October 2, 2026

**Scope/status:** implemented for the internal local app; user QA/code review pending. No F10b edits, rendering, approval or publication added.

- Replaced synchronous storyboard HTTP execution with atomic queue admission and an immediate 202 receipt. A separate Node worker claims jobs, checks account admission and preserves the original draft snapshot. The browser polls automatically while visible, recovers by the same key after reload and opens the newly completed candidate. Previous candidates remain intact.
- Planner budget is four calls total (initial plus up to three repairs/retries), 30 seconds per provider call, 180 seconds from queue admission overall. Completed invalid plans receive targeted repair instructions with actual validation issues. Local normalization only renames scene/event IDs and corrects an unambiguous cue capitalization match. Strict validation still gates persistence.
- Explicit transient HTTP responses can back off within that same four-call budget. Authentication/configuration failures stop immediately. Truncation and unknown timeout/network outcomes do not trigger silent retries. Interrupted running jobs expire as unknown; they are never reclaimed into duplicate provider calls. Late results cannot overwrite the active project fence.
- Receipt progress includes stage, attempt and safe issue codes. The UI explains narration-length or scene/cue exhaustion and preserves saved work. Diagnostic output excludes prompts, provider bodies, narration and keys.
- Migration 006 adds strict `storyboardQueue` and optional receipt progress fields. Migration 005 checksum is unchanged and accepts its exact successor validator on replay. Queue input is cleared on completion/expiration. The existing local DB was migrated in place without removing its project data.
- `auth:local` now launches the worker; persistent development databases require operator setup plus a separate `storyboards:worker` process. The currently running older launcher was preserved and a standalone worker attached to its database for this checkpoint. Explicit user approval was received for queued topic/audience/notes transmission to Gemini after automatic review requested it.

**Files:** planner/service/HTTP/contracts/OpenAPI and new queue schema/setup/worker modules under `apps/web/src/storyboards`; shared expiry in `src/generation/live-project.ts`; storyboard controller/review UI; worker, setup, launcher and verification scripts; root/web package scripts; planner/storage/controller/auth test setup; API/DB/system design, README and generated `design/projects.openapi.json`.

**Verification:**

- `npm run test:storyboards`: **30/30**. Four-call exhaustion and fourth-call repair success; transient backoff/auth stop/deadline; safe normalization/diagnostics; real replica-set admission/replay, snapshot isolation, competing workers, abandoned running jobs, expiry, disabled owner, migration replay, strict schema and late-result fences.
- `npm run test:storyboard-ui`: **12/12**, including background completion automatically selecting the new candidate, same-key reload recovery, history preservation and duplicate-click protection.
- `npm run test:ideas`: **20/20**, including shared project-slot expiry and earlier brainstorming behavior.
- `npm run check`: both TypeScript checks and **23/23** unchanged prototype tests. `npm run build`: production build passed. OpenAPI regenerated; `git diff --check` passed.
- Live browser QA in labelled project **QA — Storyboard reliability**: one Create storyboard click, immediate queued state, full reload during generation, then automatic saved six-scene candidate without Check request/retry. Gemini attempt 1 returned valid output in **4.198s**. A second single-click generation retained the old candidate; attempts 1 and 2 returned HTTP 200 but failed `DURATION_ESTIMATE_OUT_OF_RANGE` (**6.347s**, **4.747s**); attempt 3 passed (**4.973s**), automatically showing the new candidate. This directly exercises the previous two-call failure case and confirms it was validation, not a 10-second timeout. Total provider time for that request was **16.067s**, excluding queue/poll overhead. No duplicate job/provider call caused by reload was observed.
- Local screenshot (ignored/private): `apps/web/runs/storyboard-reliability.jpg`. User's earlier project was preserved. No generated media or credentials included in Git.

**Limits:** two live requests demonstrate recovery, not a universal success rate. Structural checks do not establish factual accuracy; narration needs review. The worker processes one job at a time per process; queue wait counts against three minutes. Durable recovery depends on Mongo surviving; the disposable launcher intentionally removes its DB on shutdown. No hosted worker, cancellation, autoscaling or daemon supervisor yet. Full auth-route suite was not rerun because it launches a second Next dev process in the same build directory; actual authenticated storyboard/browser routes were exercised live and auth-test migration setup was typechecked. New launcher lifecycle has been code-reviewed but the existing session was not restarted, to preserve user test data.


### Storyboard reliability independent QA — October 6, 2026

Tested clean `dev` commit `0a86a82` using Node 24 and the updated `npm run auth:local -- --providers` launcher from a stopped state. It successfully started a fresh disposable Mongo database, Next.js and its separate worker. Reused the exact synthetic water-cycle topic, audience and notes from the prior failing QA scenario. No implementation/configuration changes or provider fixtures were used for live generations.

| Check | Result |
| --- | --- |
| Targeted suites | `test:storyboards` **30/30**, `test:storyboard-ui` **12/12**, `test:ideas` **20/20** passed. Covers fourth-call repair success/exhaustion, transient retries, authorization/unknown-outcome stop, deadlines, competing workers, queue snapshots, admission, automatic selection and shared project slots. |
| First single-click request | Immediate 202 (32 ms route time), then full reload during generation. The page automatically recovered and opened a saved candidate without Check request/Refresh/retry: six scenes, 170 words, **68-second estimate**; one provider call, HTTP 200/OK in **5,199 ms**. |
| Second single-click request | Existing candidate remained visible while queued/planning. Completion automatically selected the new candidate: six scenes, 157 words, **62.8-second estimate**; one provider call, HTTP 200/OK in **6,146 ms**. Both candidates remained in history. |
| Real three-minute expiry | Paused only this disposable worker after both requests completed, then queued another request. Automatic browser polling ended the waiting state and re-enabled Generate another after **180.085 seconds**. The receipt had attempt 0; no provider call occurred. |
| Preservation and cleanup | Read-only database digests before/after expiry matched for the complete draft and both candidate documents. Exactly two candidates remained. After resuming the worker, the expired queue entry was done with its input cleared and the project slot released. |
| Responsive progress | At 390×844, queued status and controls remained readable; document client/scroll widths both measured 375px excluding scrollbar. Captured browser warning/error list was empty. |

One minor finding: a queued request that never reached the provider expires as `PROVIDER_OUTCOME_UNKNOWN` and the UI says a new generation may use credits again. This is conservative and does not cause duplicate generation or data loss, but it does not clearly explain that the three-minute queue deadline elapsed before generation started. `apps/web/src/generation/live-project.ts` currently uses the same unknown classification for all expired running receipts. Recommend distinguishing proven queued/attempt-zero expiry from an interrupted dispatched call; keep conservative unknown handling for genuinely uncertain calls. This QA records the finding without changing behavior.

Evidence: [queued state with earlier candidate](design/verification/storyboard-reliability-qa-queued.jpg), [mobile progress](design/verification/storyboard-reliability-qa-mobile.jpg), [automatic expiry and retained candidate](design/verification/storyboard-reliability-qa-expired.jpg). Synthetic test content only. Two live generations used exactly two provider attempts; neither required repair. The engineer's previous attempt-three live result remains separate evidence. This QA independently verifies the four-attempt ceiling and repair/exhaustion through deterministic tests, not a fresh live repair sequence.

Result: **PASS for background execution, automatic reload recovery, bounded expiry and saved-work preservation; minor error-wording follow-up remains.** No unexpected unknown/provider-unavailable failure occurred; the third request was intentionally prevented from starting. No production reliability, factual approval, measured audio duration or hosted crash recovery claim is made. Full typechecks/build and unrelated suites were not rerun for this evidence-only change; prior implementation checks are recorded above.

Signed out, closed the QA tab, reset the viewport, resumed the paused worker, then stopped the launcher and its children. Ports 3001 and 53328 had no listeners afterward. Restored only the known Next-generated type path changes. No credentials, queue input or candidate JSON are included in Git. F10b remains pending user review.


## Queue-expiry wording follow-up — October 6, 2026

Implemented the minor issue reported by independent QA. Requests that expire while atomically confirmed still queued now report `failed` / `QUEUE_EXPIRED`: “Your request expired in the queue before generation started. Your idea and earlier candidates are saved. Please try again.” A claimed job retains `unknown` / `PROVIDER_OUTCOME_UNKNOWN`, including a crash before its first progress update; attempt zero alone never establishes that dispatch did not occur. Historical terminal receipts are not rewritten.

Scope/files: shared `apps/web/src/generation/live-project.ts` atomically closes the queued row and clears its snapshot in the same receipt/parent-release transaction, preventing a conflicting worker claim; storyboard review adds the message; storage tests exercise both reader-triggered and worker-triggered expiry, queued versus claimed states, zero calls, cleared input and exact same-key terminal replay. API/DB documentation and generated OpenAPI updated. No migration, new provider calls or next feature added.

Verification: **30/30 storyboard tests**, **20/20 brainstorming/shared-fence tests**, and **web TypeScript check** passed. The regression tests use a controlled clock rather than another three-minute live wait; fresh browser/live Gemini testing was not repeated for this wording fix. Independent QA's two live first-attempt successes remain distinct from the prior implementation run's live third-attempt repair. User review of the follow-up remains pending.


## F10b1 — Editable storyboard backend — October 6, 2026

**Scope:** first small slice of saved storyboard editing, complete for API review. Explicit `POST /api/projects/:id/draft/apply` copies the selected immutable candidate into the existing draft with revision/hash checks and a permanent same-key response receipt. PATCH draft accepts a bounded editablePlan (or null to clear). Incomplete narration/labels/titles persist with current validation issues. Invalid shapes/oversized input remain rejected. Semantic cue/duration/source failures do not discard edits or imply approval.

Idea fields and storyboard edits share the same optimistic revision fence. Idea edits preserve the working plan and mark it stale; plan edits cannot silently clear staleness. Applying an older source remains conservatively stale. Generated candidates remain unchanged. Apply selects the original candidate pointer; manual edits are working-draft content, not a new immutable history version. Null clears provenance and selection. Same-key replay returns its original snapshot without changing later edits; clients must reread current draft after recovery.

**Implementation:** new editable contract and migration-007 draft/command definitions; migration successor handling accepts the exact known 003/007 validators without modifying historical checksums. Draft service/read validation, apply/save transactions, project HTTP handler/new Next route, launcher/operator setup and generated OpenAPI updated. Tests cover owner/project isolation, origin/auth/hash/revision rejection, replay after later edits, competing apply calls, incomplete-text persistence, missing cues, invalid shapes, idea changes, clearing, migration replay and rollback if receipt insertion fails. API_DESIGN.md, DB_DESIGN.md, SYSTEM_DESIGN.md and README explain contracts and the API checkpoint.

**Verification:**

- `npm run test:storyboards`: **35/35**, including five new editing integration groups on real disposable MongoDB replica sets and preserved generation/queue behavior.
- `npm run test:drafts`: **17/17**, including existing ambiguous autosave recovery and revision-fenced writes.
- `npm run test:auth`: **17/17**, including a real Next server's new apply route (anonymous rejected, authenticated malformed input rejected). Successful apply/save operations were exercised through the HTTP handler with real auth/Mongo; no browser editor exists yet.
- DB, projects, brainstorming and storyboard controller regression suites completed; project suite verifies checked-in OpenAPI matches shared schemas. `npm run check` passed both TypeScript checks and **23/23** prototype tests; `npm run build` passed, exposing the new route. OpenAPI regenerated and `git diff --check` passed.
- Tests use labelled fixture candidates and consume no Gemini/ElevenLabs quota. No persistent/user database was migrated in this slice; a fresh auth:local installs 007, or a persistent environment needs operator db:setup. Test servers were stopped after verification.

**Remaining:** F10b2 must add explicit working-copy/replace UI, editable narration/on-screen text, validation display, safe recovery of uncertain saves, and conflict handling. Current browser review still shows immutable candidates, so API edits will not appear there. F11 owns approval, immutable edited versions, restoration and AI revisions. This is not a completed end-user editing feature and adds no render/publish capability.


### F10b1 independent API QA — October 6, 2026

Tested clean `dev` commit `14d4cd2` under Node 24.21.0. `npm run test:storyboards` passed **35/35**, `npm run test:drafts` **17/17**, and `npm run test:auth` **17/17**, including the real Next route checks. Auth-route testing finished before launching the manual server to avoid sharing Next build output between processes.

Started a fresh `npm run auth:local -- --providers` server/worker/database with disposable credentials. A temporary QA script exercised real network HTTP endpoints. Direct database access was limited to provisioning additional test accounts, temporarily disabling/restoring a test account and read-only integrity checks; apply/edit/clear operations used the public authenticated application routes.

Live candidate prerequisite: the first request ended as `PROVIDER_OUTCOME_UNKNOWN` after one 30,007 ms timeout with no HTTP status and no automatic retry. A separately authorized explicit new request received HTTP 503 (2,331 ms), then HTTP 200 with INVALID_JSON (10,104 ms), then HTTP 200/OK (9,942 ms). It saved six scenes, 161 spoken words and a **64.4-second estimate** on attempt 3. This exercised bounded provider retry/repair but is not a generation reliability guarantee. There were two generation receipts and one saved candidate; editing made no provider calls.

| Actual HTTP check group | Result |
| --- | --- |
| Admission and isolation | Anonymous apply 401, foreign-owner apply 404, cross-origin apply 403, same-owner wrong-project candidate 404, disabled account 403. Wrong hash/stale revision 409; absent key/extra body field 422. Editing a plan before applying a candidate returned STORYBOARD_REQUIRED. Rejected requests left the draft unchanged. |
| Apply and replay | Three simultaneous identical apply commands all returned the same revision-3 snapshot; exactly two had the replay header. Candidate content was copied exactly, validation was initially valid and the selected candidate pointer was set. Applying the old key after later text saves returned its original snapshot without altering current data; changed input under that key returned IDEMPOTENCY_KEY_REUSED. |
| Incomplete and invalid edits | Empty overall title, scene title, narration and visual label persisted and reread exactly, with validation failures; topic/audience/notes/voice remained unchanged. Extra plan fields, zero scenes, narration over 1,400 characters and attempted client control of planStale were rejected with 422 and no mutation. |
| Concurrent edits and semantic feedback | Two edits at the same revision produced one 200 winner and one 409 conflict. Reusing an old revision also returned 409. A structurally complete plan with changed narration reported MISSING_CUE; restoring valid content restored valid validation before any idea change. |
| Staleness and clear | Editing the idea preserved the working plan and marked it stale. Subsequent plan edits and application of the old candidate did not clear staleness. Two distinct apply commands at the same revision produced one winner and one conflict. Null cleared the plan, provenance and selected pointer; a recovered earlier apply response could not resurrect it. Re-editing without a fresh apply returned STORYBOARD_REQUIRED. |
| Candidate integrity and private reads | Candidate content matched the original applied snapshot; the stored candidate document was unchanged through the remaining validation/staleness/clear checks. Exactly one candidate and two committed apply receipts existed. Final draft revision was 12 with no editable plan. Reads returned private/no-store caching. |

The temporary harness was corrected during the run to accept documented 202 running receipts and to test semantic cue feedback using structurally valid text fields; semantic validation is not asserted when blank required fields already fail structural validation. The checks resumed against the same project/candidate. These were harness assumptions, not application fixes; the table records the completed checks across those resumptions. No source/configuration changes were needed.

Result: **PASS for F10b1 backend API QA; no new editing-backend blocker found.** The initial live provider timeout remains a separate observed limitation. This does not approve an end-user editing UI, rendering or generated factual content. Browser editing is unimplemented until F10b2. Typechecks/build and unrelated suites were not repeated for this documentation-only QA milestone; prior implementation results remain separate.

Signed out the QA sessions, restored the temporary disabled account, removed the temporary script and stopped the launcher/worker/database. Ports 3001 and 60884 had no remaining listeners. Restored only the known Next-generated type path changes. No credentials, candidate JSON or generated media are included in Git. Wait for user/code review before F10b2.


## F10b2 — Cinema storyboard text editor — October 6, 2026

**Scope:** a separate Working storyboard section now creates an editable copy of the selected candidate, with explicit confirmation before creation/replacement. It edits storyboard title/objective, scene title/kicker/narration, visual labels, flow steps and comparison headings/points, with a schematic preview. Advanced cue and pronunciation phrase/occurrence controls support narration changes. Live validation explains incomplete text, unmatched cues, duration and stale-source issues. Save is explicit; incomplete bounded text can persist. This is not approval or a rendered video.

**Recovery and concurrency:** shared draft revision checks preserve newer idea fields and stop stale writes. Conflicts show local/saved text and require an explicit choice. Keep-local is blocked if another candidate became the source. Pending apply keys and pending save payloads are retained in identity/project-scoped sessionStorage before dispatch, cleared on settlement and replayed safely after reload. Storage failure blocks dispatch. A newer matching revision can settle a replay; an unchanged read cannot settle an uncertain write. Apply replay always rereads the current draft rather than displaying its historical receipt snapshot. Disposed controllers cannot clear a newer controller's pending recovery data.

**Files:** new `apps/web/components/storyboard/editor-controller.ts`, `text-editor.tsx` and `apps/web/tests/storyboard-editor.test.ts`; updated storyboard review integration, Cinema CSS, web test command, README and this status document. No API contract, database migration, provider, prototype or render changes.

**Verification:**

- `npm run test:storyboard-ui`: **21/21** (12 existing generation/review tests and nine editing tests). Includes explicit saves, incomplete text, uncertain-write reload replay, revision conflicts, changed-source protection, apply replay after later edits, bounds/storage failures, disposed controllers, identity/project storage isolation and duplicate saves.
- `npm run check`: both TypeScript checks and **23/23** existing prototype tests passed. Final `npm run typecheck:web` and `npm run build` passed after the final UI changes. `git diff --check` passed.
- Actual authenticated browser checks on a disposable Mongo/Next server with a labelled **QA fixture — storyboard editing** candidate: confirm editable copy; edit scene title/label; save and reload; verify original candidate stays unchanged; save empty narration with validation feedback; two-tab competing edits trigger comparison; explicitly keep local text and save; restore narration and return to valid checks. No Gemini/ElevenLabs requests were made.
- Desktop editor visually inspected; a narrow viewport check found no document horizontal overflow. Full mobile interaction/accessibility QA remains pending. Screenshot is local/ignored at `apps/web/runs/storyboard-editor.jpg`; fixture candidate/media and disposable launcher are excluded from Git.

**Limitations/checkpoint:** unsent typing stays in memory. The browser warns on full-document unload/reload, but this slice does not intercept client-side navigation; save before following app links. Dispatched pending saves include private draft content in sessionStorage for that tab's recovery, not a cross-device backup. Provider quality, full mobile QA, all visual-component editing branches and the existing session-focus behavior were not revalidated manually in this run. Backend suites were not rerun because no backend changed; F10b1's accepted independent API QA remains the backend evidence. Independent code review/user QA remains required before F11. The offline disposable server is left running on port 3001 for this review; its data disappears when stopped.


## F10b2 — independent QA checkpoint — October 6, 2026

Reviewed implementation `734942a` on `dev`, using the supplied authenticated **QA fixture — storyboard editing** project on the existing disposable local server. This was fixture-based UI/API integration testing, with no provider calls, generated content approval or implementation changes.

**Passed:**

- `npm run test:storyboard-ui` under Node 24: **21/21**. Existing controller tests cover pending-save reload replay, changed-source protection, storage failure and duplicate dispatch; these remain distinct from browser checks below.
- Desktop scene-title, kicker and label changes immediately update the working preview. Explicit save and full reload preserve them; the original candidate retains its original title, labels and narration.
- Empty narration saves and survives reload with validation feedback. Rewriting narration shows an unmatched motion-cue warning; updating the cue phrase restores valid checks.
- Two real tabs saving competing scene titles produce a conflict with retained local input. Both **Keep my text & save** and **Use saved version** resolve to the explicitly chosen text.
- An overlong label is rejected with its input retained. Restoring the previous value clears the dirty state. Replacement requires confirmation; Cancel preserves the working copy. Confirmed replacement was covered in the earlier implementation walkthrough, not repeated here.
- A controlled 25-second pause of the local Next server exceeded the editor's 15-second request deadline. The browser displayed **Save outcome unconfirmed**, retained the pending text and disabled conflicting edits. After the server automatically resumed, **Recover pending save** reached **All changes saved**; a full reload retained the attempted title. Pending reload-before-recovery remains covered by controller tests rather than this browser fault injection.
- At a 390 × 844 viewport, text/cue edits, explicit save and reload passed. No document horizontal overflow was observed. The original fixture values were restored through these controls (scene title `Second tab edit`, kicker `WATER CYCLE`, original narration, label `River water`, cue `Water`). The viewport override was reset and QA-created tabs closed. No console warnings/errors were returned by the final tab log check.

**Open finding — P2: conflict comparison omits editable motion and pronunciation settings.** `apps/web/components/storyboard/text-editor.tsx:9` serializes title/objective, scene titles/kickers/narration and visual text only. Browser reproduction: load the same working copy in two tabs; change scene 1 cue phrase to `The sun` in tab A and `As this vapor` in tab B; save A, then B. Both are valid phrases in the fixture narration. B correctly reports a revision conflict, but its two comparison columns are identical and neither exposes the differing cue value/occurrence. The local cue remains visible in the disabled editor below; the saved cue cannot be inspected before choosing a version. Keep-local replaces the entire working plan, so the user can overwrite an unseen competing cue edit. Code inspection shows pronunciation phrase/spoken-as/occurrence are omitted by the same formatter; that variant was not separately exercised. Include all editable cue and pronunciation values in comparison and add a regression check for differences confined to those fields before full approval.

Evidence: [title conflict](design/verification/f10b2-qa-conflict.jpg), [cue-only conflict with identical comparison columns](design/verification/f10b2-qa-cue-conflict.jpg), [mobile editor](design/verification/f10b2-qa-mobile.jpg). Screenshots contain labelled synthetic fixture content only.

**Result:** core editing, persistence, validation and save recovery passed; full QA approval is withheld for the P2 comparison omission. Flow/comparison-specific visual fields, pronunciation editing, session expiry/focus preservation and a full accessibility/device matrix were not manually revalidated. Typechecks/build/prototype/backend suites were not repeated for this documentation-only checkpoint; previous implementation verification remains separate. The supplied server and authenticated review session remain available; no provider configuration or credentials changed. F11 has not begun.


## F10b2 — Complete conflict comparison fix — October 6, 2026

Fixed the independent QA P2: both local and saved conflict columns now include each scene's motion cue phrase/occurrence, event identity/action/target, offset and duration, plus pronunciation phrase, spoken-as text and occurrence. Empty pronunciation lists explicitly show None. A cue-only or pronunciation-only change is now visible before choosing which full working plan to keep. Existing save/conflict semantics are unchanged.

Files: extracted the shared human-readable formatter into `apps/web/components/storyboard/plan-comparison.ts`, wired both columns in `text-editor.tsx` to it, and added two regression tests in `tests/storyboard-editor.test.ts`. One reproduces a real controller revision conflict with differences confined to cues and checks both compared values; the other independently varies all editable cue/pronunciation fields and verifies each affects the comparison.

Verification: `npm run test:storyboard-ui` **23/23** passed; `npm run typecheck:web` passed; `git diff --check` passed. No provider calls, API/DB changes or fixture edits. Browser QA was not repeated in this fix; the earlier independent core editing/mobile/save-recovery pass remains separate evidence. The comparison fix is ready for targeted QA/code review; F11 has not begun.


## F10b2 — targeted QA of conflict comparison fix — October 6, 2026

**PASS: the P2 comparison omission is closed for implementation `bc129c3`.** Repeated the original cue-only two-tab browser reproduction in the existing labelled storyboard fixture, with an additional occurrence difference. Tab A saved `The sun`, occurrence 1; tab B attempted `As this vapor`, occurrence 2. The resulting conflict correctly displayed the distinct phrase and occurrence in each column, along with event identity/action/target, offset **0 ms** and duration **400 ms**. Empty pronunciation sections explicitly showed **None**. Both columns use the same extracted formatter.

**Keep my text & save** then saved tab B's chosen settings; full reload preserved its phrase and occurrence, with the expected unmatched-cue validation warning for the deliberately nonexistent second occurrence. Restored the original fixture cue `Water`, occurrence 1, and explicitly saved; **All changes saved** and **Draft checks passed** returned. Other fixture fields were unchanged. QA-created tabs were closed; the supplied server and review session remain running.

`npm run test:storyboard-ui` under Node 24 passed **23/23**, including both new regressions. The tests independently exercise pronunciation phrase/spoken-as/occurrence differences; this fixture has no pronunciation entries, so a pronunciation-only browser conflict was not claimed. Timing values were visually confirmed, not edited through the UI. The preceding independent desktop/mobile, validation and actual timeout-recovery checks remain valid separate evidence; no providers were called. Typechecks/build and unrelated suites were not repeated for this targeted documentation-only QA checkpoint.

Evidence: [corrected cue conflict comparison](design/verification/f10b2-qa-cue-conflict-fixed.jpg). No new blocker found. F10b2 QA is passed within the recorded scope; user acceptance remains separate, and F11 has not begun.


## F11a — Storyboard revision engine — October 6, 2026

**Acceptance/scope:** user approved F10b2 including the independently verified comparison fix. F11 is split into engine (F11a), persistent revision/dashboard workflow (F11b), and immutable approval (F11c). This slice implements a server-only revision engine accepting a validated PlanV2 source snapshot, saved idea, trusted freshness flag, bounded instruction and optional stable scene ID. It returns a validated candidate and deterministic changed-scene/metadata-field lists with `requiresApproval:true`. It performs no database writes and grants no approval.

Whole-story requests may revise content/title/objective/sources but retain scene IDs/order/count and voice/language/audience. Scene-scoped requests additionally preserve root metadata and all other scenes exactly. Source inputs are cloned/validated before async work; caller mutation cannot change the baseline. Unknown scenes, stale or invalid sources and invalid instructions fail before provider dispatch. Unchanged output is rejected rather than reported as applied. Results are checked by the server, not a model-provided change summary. Existing planner ID normalization is deliberately bypassed for revision results to preserve stable identities.

The engine reuses the established bounded Gemini executor: four total calls, completed-invalid-result repair, transient backoff, 30-second per-call timeout and three-minute deadline. Authorization/configuration/ambiguous network outcomes stop without automatic retries. Out-of-scope changes enter bounded repair against the original source. Logs retain only existing sanitized status/category/duration/issue codes. No keys or content are logged by these changes.

**Files:** new `apps/web/src/storyboards/revisions.ts` and `tests/storyboard-revisions.test.ts`; shared executor extraction in `src/storyboards/planner.ts`; web storyboard test command; README, API/system design checkpoint notes and Project Status. Public routes/OpenAPI/database schemas and frontend remain unchanged. Prototype CLI/rendering stay intact.

**Verification:** `npm run test:storyboards` **45/45**, including ten new tests for scoped/global revisions, source immutability, stable IDs, trusted diff, scope repair/exhaustion, no-op/invalid result rejection, pre-dispatch failures, timeout/auth/deadline behavior and transient retries/sanitized diagnostics. Existing real disposable Mongo storage/queue/apply tests passed. `npm run check` passed both TypeScript checks and **23/23** prototype tests. `npm run build` and `git diff --check` passed. All provider responses were labelled deterministic fixtures; no provider quota or live browser check was needed for this server-module slice.

**Remaining:** F11b must authorize and snapshot owner/project/version/hash/revision in durable admission, persist revision candidates/lineage/conversation, and add review/apply/restoration plus stale-result/reload handling. The caller freshness flag is not an HTTP security boundary. F11c owns immutable explicit approval; no generated revision inherits approval. Scene insertion/deletion/reordering, voice/language/audience changes and video-side revisions are unsupported here. Structural validation cannot establish factual accuracy or instruction fulfillment; live Gemini revision evaluation is pending. There is no new dashboard checkpoint to test yet. Stop at this engine checkpoint for code review before the next slice.


## F11a — independent engine QA — October 6, 2026

**PASS for engine checkpoint `15830ee`; no blocker found within this scope.** Reviewed `revisions.ts`, the shared executor extraction, validators and regression tests. Source validation/cloning precedes provider work; scoped results enforce unchanged root metadata and other scenes; scene IDs/order/count and fixed fields remain protected. Differences are computed server-side and every successful result requires fresh approval. These module guarantees do not substitute for F11b owner/version admission or persistence.

`npm run test:storyboards` under Node 24 passed **45/45**, including real disposable Mongo tests and revision cases for scope repair/exhaustion, unchanged output, invalid inputs, source mutation, fixed identities, no-retry ambiguous/auth failures, deadline admission, transient backoff and sanitized diagnostics. No test/source changes were required.

Two sequential live checks used the configured **gemini-3.5-flash-lite** adapter and the existing local six-scene water-cycle PlanV2 artifact, with separate requests against the same original source:

| Check | Observed result |
| --- | --- |
| Single scene: revise evaporation using a drying puddle example | HTTP 200, first attempt, **4.728 s** overall; validated **72-second** estimate. Only `scene-2` changed; all five other scenes and all root metadata deep-equaled the source. Narration explained liquid changing to invisible vapor; labels and exact cues matched the revised scene. |
| Whole story: add puddle and cold-glass condensation examples | HTTP 200, first attempt, **4.902 s** overall; validated **81.6-second** estimate. Only `scene-2` and `scene-3` changed; the other four scenes remained identical. The condensation narration explicitly attributed droplets outside the glass to water vapor in the air. |

Both results retained scene IDs/order/count, left the input source unchanged and returned `requiresApproval:true`. Server change lists matched the observed edits; no root-field changes were reported. Narration was manually inspected for the requested examples and consistency with the original explanation. This is two successful samples, not a broad factual-quality or provider-reliability guarantee. Retry/repair failure paths were exercised by deterministic tests, not by these two first-attempt live successes.

Local inspection outputs (ignored, not committed or stored dashboard versions): `apps/web/runs/storyboards/f11a-qa-scene.json` and `apps/web/runs/storyboards/f11a-qa-whole.json`. The temporary QA runner was removed. No credentials, raw provider responses, candidate JSON or generated media are included in Git; no dashboard data was edited and the existing review server was left alone.

Typechecks/build/prototype tests were not repeated for this documentation-only QA checkpoint; prior implementation verification remains separate. No browser test is applicable to the new backend-only module. F11b persistence/review/apply controls and F11c immutable approval remain unimplemented; neither was started during QA. Await user/code-review acceptance before progression.


## F11b1 — Durable revision API and worker — October 6, 2026

**Scope:** `POST /api/projects/:id/revisions` now accepts an authenticated, same-origin, idempotent instruction against an immutable storyboard source/hash and current draft revision. It returns the shared storyboard receipt before provider work. Source ownership/project/hash, current source/working-copy freshness, scene scope and shared active-job slot are checked before admission. Whole-story and selected-scene commands use F11a through the existing worker. Result candidates preserve source, draft and selection, expose parentId/server-computed changedSceneIds/changeSummary, and never inherit approval. Existing GET/list/latest and explicit apply support API-level recovery/review. No new frontend controls are implemented.

**Persistence:** migration 008 adds strict private storyboardRevisions metadata (accepted job ID, owner/project, source ID/hash, instruction, optional scene ID, creation time). Admission commits metadata, receipt, queued saved idea and project slot atomically. No provider call runs inside a transaction. Worker validates source/accepted request hashes before dispatch; missing metadata cannot degrade a revision into a fresh generation. It independently validates scope/content before the candidate/receipt/fence completion transaction. Commands retain lineage/instruction history; transient queued draft input is cleared after completion/expiry. Same-key recovery, concurrent worker claims, project busy, stale completion, expiry and unknown outcomes reuse existing durable-queue semantics. No historical migration checksum was modified.

**Files:** new revision route, revision-input schema and revision-setup module; storyboard service/provider wiring, API contracts/OpenAPI, local/setup/worker scripts, expanded storage/auth-route tests, generated design/projects.openapi.json, README/API/DB/system-design notes and this document. Engine input schema moved to a client-safe module without behavior change. Worker startup now requires migration 008; operator setup and fresh local launch install it.

**Verification:**

- `npm run test:storyboards`: **55/55**, including ten new storage/API groups for migration, owner/origin/hash/revision/scope rejection, simultaneous same-key commands/two workers, lineage/draft/source preservation, applied-source freshness, concurrent edits/stale result, independent result validation, atomic admission rollback, queued expiry, ambiguous outcome replay and missing-command integrity. Real disposable Mongo replica sets and real auth sessions are used; provider outputs are deterministic fixtures.
- `npm run test:projects`: passed, including checked-in OpenAPI consistency. `npm run test:storyboard-ui`: **23/23** passed. `npm run check`: both TypeScript checks and **23/23** unchanged prototype tests passed. Final web typecheck passed after the integrity check. Production build passed and includes the new revision route; `git diff --check` passed.
- No live provider calls or dashboard QA were performed for this backend checkpoint. F11a's two accepted live revision samples remain separate evidence. Auth-route regression assertions were added/typechecked but the full auth suite was not rerun because it starts another Next dev process sharing this workspace's build directory with the user's running test server; the new HTTP handler was tested with actual authenticated Request/Response sessions and database services in the storage suite.

**Remaining/limits:** only immutable storyboard-source revisions are accepted. If a working copy differs from that candidate, request returns SOURCE_CHANGED rather than silently losing manual edits; immutable edited-source snapshots are needed in F11b2. Dedicated restore/conversation-message APIs, revision chat UI, friendly source/error recovery and full API browser/live testing remain. The latest receipt is shared by generation and revision; exact command replay recovers a specific request. Approval/rendering remain future work. The user's existing local server/database was not migrated or restarted; preserve its disposable data, or explicitly restart a fresh local launcher for API QA after review. Project Status does not claim this backend slice is a completed end-user conversational-revision workflow. Stop for review before F11b2.


## F11b1 — independent API/worker QA — October 6, 2026

**PASS for backend checkpoint `3432599`; no blocker found within the tested scope.** Reviewed revision admission, migration 008, request-integrity checks, provider wiring, worker claims, result revalidation and lineage reads. Reran `npm run test:storyboards` under Node 24: **55/55**; `npm run test:projects`: **14/14**, including checked-in OpenAPI consistency. Existing tests additionally cover admission rollback, missing-command integrity, edited-source rejection, out-of-scope provider output, expired jobs and ambiguous-outcome replay.

For independent actual-HTTP checks, created an isolated source copy at this commit, a Next development server on **127.0.0.1:3011**, a disposable Mongo replica set with all migrations, and two in-memory test identities. The existing port-3001 review server/database were not migrated, restarted or edited. Seeded one labelled candidate from the previously validated local water-cycle artifact; that seed did not call a provider. Revision admissions/read/replay/history went through real HTTP routes. The worker checks directly invoked the production `runStoryboardJob` entry point with the real configured Gemini adapter and a dispatch counter; they did not test the worker CLI's polling/process-restart lifecycle.

| Check | Evidence |
| --- | --- |
| Admission and account boundaries | Anonymous 401, foreign owner 404, wrong origin 403, wrong source hash/stale revision 409, missing scene/extra body field 422; all rejected before a revision command was inserted. Disabled-account admission returned 403. Private/no-store headers were present. |
| Duplicate execution protection | Three simultaneous same-key HTTP POSTs returned 202 and the same receipt; two carried replay headers. Changed input with the same key returned IDEMPOTENCY_KEY_REUSED, and a separate request while queued returned PROJECT_BUSY. Two simultaneous worker calls dispatched the live revision only once. |
| Live single-scene revision | Gemini Flash-Lite returned HTTP 200 on attempt 1 in **8.815 s** of provider time. New candidate: **70.4-second estimate**, parent points to seed, changedSceneIds exactly `scene-2`, review_ready with null approval. The puddle example was present; all five unaffected scenes matched the seed. Source database document, draft API snapshot and null selected-storyboard pointer were unchanged. Queue completed and cleared its transient draft. |
| Live whole-story revision with concurrent edit | A second command revised the first result to add the cold-glass condensation analogy. A note was saved over HTTP while queued. Gemini returned HTTP 200 on attempt 1 in **9.205 s**; result **77.6 seconds**, changedSceneIds `scene-3`, parent points to the first revision. The narration explicitly attributed glass droplets to water vapor in the air. The new candidate was marked stale, the concurrent draft snapshot remained exact, and selection stayed unchanged. |
| History and recovery | Paginated one-item history returned the second revision then its parent with correct lineage. Latest receipt matched the second command; replaying the first key still recovered the first result without further dispatch. Foreign candidate reads returned 404. A new revision against the now-stale source returned SOURCE_CHANGED. Exactly two live adapter dispatches occurred overall. |

All revision assertions completed. The temporary harness then attempted to decode the documented empty **204 sign-out** response as JSON; this cleanup-helper assumption caused its final nonzero exit, not a revision/API failure. Its `finally` block stopped the QA web server and replica set, destroying both disposable sessions. Port 3011 had no listener afterward; the original port-3001 server remained listening. The temporary runner and isolated source/build copy were removed. Ignored local inspection output is `apps/web/runs/storyboards/f11b1-qa-live.json`; it is not committed or a retained dashboard version after teardown. No credentials, private candidate JSON or generated media entered Git.

**Limits:** two successful live samples do not establish general provider reliability or factual correctness. Fault/expiry/rollback scenarios used the deterministic suite. UI/prototype/type/build checks were not repeated for this documentation-only QA change; the implementation's results remain separate evidence. No new revision dashboard exists yet. F11b2 edited-source snapshots, review/apply/restore controls and F11c immutable approval remain future work; await acceptance before progression.


## F11b2 — Cinema revision controls — October 6, 2026

**Scope:** a revision panel targets the selected saved candidate, with whole-story or one stable scene selection, labelled instruction input, 4,000-character feedback and explicit Create revised candidate. Commands retain their exact source ID/hash, reviewed draft revision, instruction/scope and key before dispatch in identity/project-scoped sessionStorage. Reload recovery replays that payload instead of constructing a request from newer edits. Generation and revision share the existing pending-request lock and automatic progress polling. Definitive source/scope/precondition failures clear pending state; uncertain responses retain it. Input remains on the same candidate after failure; switching candidates resets the unsent instruction/scope to avoid applying an old request accidentally.

Revision results show the server's change summary, changed scene markers and View previous version. Prior candidates are still accessed through history; explicit replacement/confirmation in the working editor is reused to apply or restore one. No result automatically changes the working plan or approves a story. Manual editing conflicts, unresolved saves and unsaved text block new revision submission. A candidate must match the saved revision or its unchanged fresh applied working copy. When manual edits differ, the panel explains the limitation rather than excluding those edits; immutable edited-source support is a separate F11b3 slice before approval.

**Files:** new `apps/web/components/storyboard/revision-panel.tsx`; review controller/transport/storage, storyboard review integration, editor busy/dirty notification, Cinema CSS and seven added controller tests. README and Project Status updated. No API/provider/schema changes.

**Verification:** `npm run test:storyboard-ui` **30/30** (seven new revision checks: exact dispatch snapshot, timeout/reload replay after draft changes, input/storage failures, definitive rejection, shared duplicate lock, revision endpoint/body/key, and applied-versus-edited/stale eligibility). `npm run check` passed both TypeScript checks and **23/23** prototype tests. `npm run build` and `git diff --check` passed.

Browser inspection used the existing labelled editing fixture on port 3001: panel layout, selecting scene 2, instruction typing/count and disabled submission for its saved manual edits were verified. Existing fixture content was preserved; the temporary unsent QA instruction was cleared and whole-story scope restored. Screenshot is ignored/local at `apps/web/runs/revision-panel.jpg`. No provider calls were made. Successful submission/result/parent restore, real transport-failure recovery, session-focus behavior and mobile layout were not re-tested in the browser this slice; controller evidence is separate from browser evidence. The running disposable database was not migrated/restarted, so live API QA needs migration 008 and the updated worker (or a fresh configured launcher) as documented in F11b1. This is a review checkpoint, not full end-to-end approval.

**Limits:** no edited-source snapshot, dedicated restore endpoint or persisted conversation transcript UI. Saved candidate replacement remains explicit and older candidates can remain stale relative to changed ideas. Pending revision instructions are private text stored in sessionStorage for recovery, not only IDs; unsent instructions remain in memory. Scope/order/count/voice limits remain those of F11a. Wait for user/QA review before F11b3.


## F11b2 — independent desktop/mobile QA — October 6–7, 2026

**PASS for UI checkpoint `9c82b87`; no new blocker found within the tested scope.** Reran `npm run test:storyboard-ui` with Node 24: **30/30**. Browser QA used an isolated copy of this commit, current migrations on a disposable replica set, Next on `localhost:3011`, a fresh account, and the actual worker CLI. The original `127.0.0.1:3001` server, database and browser session were preserved. The starting candidate was explicitly labelled as a QA fixture using the existing water-cycle sample; revision results used live **gemini-3.5-flash-lite**.

| Browser check | Result |
| --- | --- |
| Request bounds and edit protection | Empty and 4,001-character input disabled submission. Unsaved working title changes showed the save/resolve message. After saving manual changes, submission remained blocked with the edited-source limitation. Restoring the exact original title and saving re-enabled revisions without discarding other input. |
| Desktop whole-story request | Submitted a new title plus everyday evaporation/condensation examples. Held the worker, reloaded while the request was in progress and saw the saved request text recovered. Database contained exactly one queued revision command. Starting the worker completed it on attempt 1 (**6.386 s** provider time), with an **84-second** estimate. Automatic polling opened the result and showed changed scenes **2, 3** plus the title change. |
| Review does not apply | The working title/content remained the original after result arrival. Full script displayed the requested examples and changed-scene markers. View previous version opened the parent and cleared unsent instruction/scope; selecting the new candidate through history did not change the working copy. Canceling replacement retained the original title; only Confirm replacement applied the new result. |
| Mobile scene-only request | At **390 × 844**, selected scene 2 and requested only its title/first visual label change. Controls were usable with no document horizontal overflow (375px scroll width at 390px viewport). Live generation succeeded on attempt 1 (**5.260 s**), returned **84 seconds**, marked only scene **2** changed and showed the new title **A Puddle Disappears**. The working scene remained **Evaporation** until explicit confirmation; after applying, the editor showed the requested title and **Drying puddle** flow label. |
| Parent chain and restoration | Navigating back through both parents left the newer working scene unchanged. Explicitly confirmed restoration of the original candidate, then reloaded. The working title returned to **The Amazing Water Cycle** and its content hash exactly matched the initial fixture. The existing conservative stale-version warning appeared after restoring an older candidate; no approval was implied. |

Database snapshots confirmed **two revision commands, two completed revision jobs, three candidates including the seed**, correct parent chains, no duplicate generation after reload, and unchanged original candidate content. The two live worker diagnostics each showed one HTTP-200 attempt. No console warnings/errors were returned by the final browser log check. Screenshot evidence: [desktop change summary/history](design/verification/f11b2-qa-desktop.jpg), [mobile scene request](design/verification/f11b2-qa-mobile.jpg), containing only synthetic QA content.

**Limits:** this run covered reload recovery while queued, not an injected 85-second submission timeout or provider failure; those failure branches retain controller/backend test coverage. Session-focus expiry, a full accessibility/device matrix and worker crash/restart were not stress-tested. The two live samples are not a reliability or factual-content approval. The older-candidate stale flag on restore and manual-edit revision restriction remain documented behavior pending later slices. Typechecks/build/prototype/backend suites were not repeated for this documentation-only checkpoint; implementation and earlier backend QA remain separate evidence.

Reset the viewport and closed the QA tab; stopped the isolated worker, web server and disposable database; removed the temporary runner, credentials and source/build copy. The pre-existing port-3001 review environment remains available. No application code changed and no F11b3 work began. Await acceptance before progression.


## F11b3 — Saved edited versions — October 7, 2026

**Scope:** added Save edited version to the working editor. It freezes the exact saved, validated, non-stale plan using draft revision/contentHash preconditions, returns a permanent immutable candidate ID, and opens it after refreshing history/context. Manual provenance is visible in candidate history/review; original candidates and working text are unchanged. The existing revision API can target the new candidate and preserve manual text in unaffected scenes. No provider call or approval occurs during snapshot creation.

**Persistence/recovery:** synchronous snapshot endpoint with owner/admission/origin/body/key checks; migration 009 adds strict snapshot commands and manual candidate provenance. Permanent same-key replay returns the original ID after later edits. Candidate/receipt/parent conflict fence commit atomically; concurrent autosave either occurs after snapshot or makes snapshot fail its revision precondition. Editor stores pending key/revision/hash before dispatch, blocks unsaved/conflicting/incomplete/stale work, recovers after reload and rereads current draft rather than replacing it with the earlier content. History opening waits until the review controller is free. Existing migration checksums remain unchanged and old schema replay recognizes the exact successor.

**Files:** new snapshot route, schema/upgrade helper, setup and transactional service; storyboard schema/reads/HTTP/OpenAPI; editor controller, action and review integration; operator/local setup; six storage test groups and two client recovery tests; generated OpenAPI and README/API/DB/system-design/status docs. Prototype CLI, rendering and provider logic are unchanged.

**Verification:** `npm run test:storyboards` **61/61**, including migration replay, same-key concurrency/replay after edits, content/ancestry/draft preservation, boundary/validation failures, rollback, manually edited source through revision worker, and snapshot/autosave race. Tests use real disposable Mongo replicas and authenticated HTTP-handler sessions with labelled provider fixtures. `npm run test:storyboard-ui` **32/32** including lost snapshot response/reload and unsaved/rejected-command recovery. `npm run test:projects` **14/14** including generated OpenAPI consistency. `npm run check` passed both TypeScript checks and **23/23** prototype tests; production build passed and includes the new route. `git diff --check` passed.

Browser: refreshed the existing labelled fixture on port 3001, confirmed the saved valid editor exposes Save edited version and the revision panel directs manual edits to that action. Visually inspected the control; local ignored screenshot `apps/web/runs/edited-version-control.png`. Did not submit on the existing unmigrated database or alter its content. Actual browser creation/result opening, mobile behavior, failure recovery and live Gemini revision from a manual snapshot remain independent QA work; fixture/controller tests are not a live end-to-end claim. Existing running database/server were not migrated or restarted. Configure migration 009 (or a fresh disposable launcher) before API/browser QA. No credentials/private media committed; no deployment or publishing. F11c has not begun.


## F11b3 — independent saved-version QA — October 7, 2026

**PASS for checkpoint `faa32ed`; no blocker found within the tested scope.** Reran with Node 24: `npm run test:storyboards` **61/61**, `npm run test:storyboard-ui` **32/32**, and `npm run test:projects` **14/14**, including OpenAPI consistency. Reviewed snapshot transactions, migration 009, owner/admission checks, permanent request replay and browser pending-save recovery. Browser QA used an isolated source copy, current migrations on a disposable Mongo replica set, Next at `localhost:3011`, a fresh synthetic account and the actual worker CLI. The existing `127.0.0.1:3001` environment and browser session were preserved. A labelled seed used the existing water-cycle artifact; only the later revision called live Gemini.

| Check | Observed result |
| --- | --- |
| Validation and saved-state gates | Saved empty narration produced validation feedback and disabled Save edited version. Restored narration plus a changed story title, scene-1 title and visual label remained ineligible while unsaved; explicitly saving valid edits enabled the action. |
| Timeout and recovery | Paused only the temporary Next process for 25 seconds. The browser showed Save outcome unconfirmed, retained input and exposed Recover pending save. After resuming the server, recovery created one manual candidate and one snapshot receipt; no revision or generation job was added. The selected candidate opened as Saved edited version, with Saved edits · no AI call in history. The original candidate and working-plan hash were unchanged. |
| Mobile submission | At **390 × 844**, save recovery and revision controls were usable, with no horizontal document overflow (375px scroll width). Submitted a scene-2 request from the manual version for a puddle drying in warm sunlight, then reloaded. |
| Live manual-source revision | **gemini-3.5-flash-lite**, attempt **1**, HTTP **200**, **4.949 s** provider time. Reload opened the new **70.4-second** candidate; full script contained the puddle/sunlight example. Its parent was the manual snapshot and changedSceneIds contained only **scene-2**. Scene 1, including its manual title and visual label, matched the snapshot exactly. The working draft remained unchanged. |
| Later edits and history | Saved a further working title, then used View previous version. The manual candidate retained its earlier title/text and the original scene-2 narration; the working copy retained the later title. Original, manual and revised candidate hashes stayed unchanged. Final database counts were **one snapshot command, one revision command, three candidates and two job receipts including the seed**. |

Screenshot evidence: [desktop result and history](design/verification/f11b3-qa-desktop.jpg), [mobile manual-version revision controls](design/verification/f11b3-qa-mobile.jpg), [uncertain-save recovery](design/verification/f11b3-qa-recovery.jpg). These contain only synthetic QA content. Final browser warning/error log check returned none.

**Limits:** the injected timeout occurred before snapshot creation; lost responses after a committed snapshot, same-key concurrency/replay after later edits, rollback and snapshot/autosave races were covered by the deterministic suites rather than separately injected through the browser. Reload here recovered the revision result; pending-snapshot reload is controller-test evidence. One live provider sample is not a general reliability or factual-content approval. Types/build/prototype checks were not repeated for this documentation-only QA checkpoint; the implementation evidence above remains separate. No approval or rendering workflow was tested or added.

Reset the viewport, closed the QA tab, stopped the temporary worker/web server/replica set and removed the temporary runner, credentials and source copy. The original port-3001 server remains available. No application code changed. Await user acceptance before F11c.


## F11c1 — Exact-version approval API and storage — October 7, 2026

**Acceptance/scope:** user accepted F11b3 QA/code review and requested the next feature. F11c is split into transactional approval API/storage (this slice) and explicit confirmation/recovery dashboard controls (F11c2). This slice exposes `POST /api/projects/:id/storyboard-approvals`, requiring literal approve:true, selected immutable candidate ID/full contentHash, and current saved-draft revision/hash. It performs owner/admission/origin validation, freshness checks and semantic revalidation. Existing candidate GET/history derive approved state and approvalId; the candidate heading reflects historical approval when present. There is no new approval button yet.

**Persistence:** migration 010 adds strict story-only approvals and permanent command receipts with unique subject/key indexes. It preserves existing validators/migration checksums. Atomic parent conflict fence, approval and command commit serialize with saves/job admission. Same-key replay returns the original record after later edits, while different input rejects. Separate keys converge on one original approval after fresh precondition checks. A fresh generated/revised candidate can supersede an older working copy without applying it. Otherwise approval requires the exact fresh applied source; manual edits first need an immutable snapshot. Both full contentHash and semantic storyHash are pinned; cue-only versions and new IDs never inherit approval. Later edits retain historical approval without approving the changed content. Approved candidate documents, drafts, selection and existing jobs are not rewritten.

**Files:** new approval route, service and migration; shared request/response/OpenAPI contracts, authenticated handler, candidate read projection and historical status label; operator/disposable setup; nine storage test groups; generated OpenAPI; README/API/DB/system-design/status documentation. No prototype, Gemini/TTS, renderer or media changes.

**Verification:** `npm run test:storyboards` **70/70** using real disposable MongoDB replica sets and real authenticated HTTP-handler Request/Response sessions, with labelled provider fixtures. New coverage includes strict migration/index readiness, exact hashes/read projection, same/different-key races, replay after edits, owner/project/origin/consent/body/precondition/busy rejection, applied/manual/stale eligibility, cue-only non-inheritance, transactional rollback, autosave race and semantic/hash revalidation. Approval tests fail if the approval handler resolves a provider. `npm run test:storyboard-ui` **32/32**; `npm run test:projects` **14/14**, including generated OpenAPI consistency; `npm run check` passed both TypeScript checks and **23/23** unchanged prototype tests. Production build passed and includes the approval route; `git diff --check` passed.

**Limits/checkpoint:** no browser submission or actual-network HTTP QA was performed; handler/transaction tests are not a browser end-to-end claim. The full auth suite was not rerun because it starts a second Next process in the same build directory as the existing review server; access boundaries above used actual auth sessions in the handler suite. Existing local database/server were not migrated or restarted. Install migration 010 on the intended QA environment or launch a fresh disposable environment before API QA. No live provider call, provider voice/model freeze, generation/video/publishing authorization or deployment occurred. Planned G01 combined approval/generation is still unimplemented and must consume/revalidate this exact-version boundary when rendering is added. Historical approved versions can also be stale relative to today's draft. Approval confirmation, browser pending-command recovery and interaction QA remain F11c2. Stop at this API checkpoint for review before that next slice.


## F11c1 — independent approval API QA — October 7, 2026

**PASS for checkpoint `59b09a4`; no blocker found within the tested scope.** Reviewed migration 010, the approval transaction and conflict fence, exact content/story hash checks, permanent command replay and candidate read projection. Reran under Node 24: `npm run test:storyboards` **70/70**, `npm run test:projects` **14/14**, and `npm run test:storyboard-ui` **32/32** (**116 total**).

Independent HTTP QA used an isolated source copy, all migrations on a disposable Mongo replica set, Next at `127.0.0.1:3011` and two fresh in-memory identities. Sign-in, project creation, draft edits/apply, manual snapshots, approvals and candidate/history reads used real network routes. One labelled water-cycle fixture was seeded through the production storyboard service; no provider key or live provider was used. A local proxy on port 3012 deliberately discarded one complete upstream approval response and disconnected the client after the API had committed successfully.

| Actual HTTP check | Result |
| --- | --- |
| Admission and exact preconditions | Anonymous 401, foreign owner 404, wrong origin 403 and disabled account 403; absent/false consent, extra fields, query and invalid key 422; wrong draft/content hashes and stale revision 409. Rejected requests created no approvals; private/no-store headers were present. |
| Committed response lost | Proxy received HTTP 200 but delivered no response to the client. Database held one exact approval; candidate GET/history exposed its approvalId and approved state. Original candidate document, draft and selected-storyboard pointer were unchanged. No queue item or extra generation receipt appeared. |
| Recovery after later edits | Applied the candidate and saved a manual scene-title edit, then retried the original key/body. Response recovered the same original approval with Idempotency-Replayed:true and the original reviewed revision. A new key with old preconditions rejected; changed payload under the old key returned IDEMPOTENCY_KEY_REUSED. Approving the old candidate against the edited draft returned SOURCE_CHANGED. The new manual snapshot had no inherited approval. |
| Concurrent submissions | Three simultaneous requests for that manual snapshot—two sharing a key and one with a separate key—returned 200 and the same approval ID. Exactly one response was a same-key replay. One approval and two command receipts were added, with working draft unchanged. |
| Cue-only and historical versions | Changing only an event duration produced a new snapshot with the same storyHash but a different full contentHash and no approval. It required a distinct approval. A subsequent topic edit made that approved version stale; it retained historical approval, while a fresh approval attempt returned SOURCE_CHANGED. Foreign reads remained 404. |

All five HTTP groups passed and the temporary runner exited successfully, including 204 sign-out. Final database counts: **three approvals, four command receipts, three candidates, one seed generation receipt and zero queue items**. The original candidate document still matched its initial snapshot. The approval endpoint worked with provider configuration absent and started no rendering.

**Limits:** transaction rollback, approval/autosave races, busy-project rejection and stored-hash/semantic corruption used the deterministic test suite; they were not separately injected over the network. Browser confirmation/pending-command recovery is still F11c2, and no browser approval flow is claimed here. Typechecks, production build and prototype tests were not repeated for this documentation-only checkpoint; implementation results remain separate evidence. No render authorization, provider quality or hosted-environment claim is implied.

Stopped the temporary web server, proxy and replica set; removed the temporary runner/source copy. Credentials stayed in memory and no private candidate artifact was committed. Verified the existing port-3001 review server remained running and ports 3011/3012 had no listener. No application code changed. Await user acceptance before F11c2.

## Feature sizing workflow update — October 7, 2026

User requested fewer feature subdivisions, used only when necessary. Updated `AGENTS.md` and this document's maintenance rules to default to complete features with backend, UI and verification together. A separate milestone now needs an explained dependency, material risk or necessary user decision; routine implementation tasks and commits do not create automatic review gates. Historical feature IDs and verification records are retained. This documentation change does not mark pending work implemented or QA accepted.

Verification: reviewed the documentation diff for consistency and ran `git diff --check` successfully. No application code or configuration changed; runtime tests were not rerun. The current implementation checkpoint and its recorded limitations remain unchanged.


## F11c2 — Storyboard approval confirmation and recovery — October 7, 2026

**Acceptance/scope:** user accepted F11c1 QA/code review and requested the next feature. Completed the existing approval feature with Cinema dashboard controls; no further sub-milestones were introduced. Review approval prepares a frozen version summary, and Confirm storyboard approval is the only new-approval dispatch. Inline confirmation identifies title/version, scenes, estimate and voice; Escape/Cancel sends nothing and restores focus. Local unsaved/conflicting edits, pending generation/revision and unavailable context prevent new approval. Working-editor controls, other submissions and history selection are disabled during confirmation or uncertain recovery. Schematic scenes remain readable.

**Recovery:** exact key/body/storyHash metadata is persisted before POST to identity/project-scoped sessionStorage; no storyboard text is stored for approval. Twenty-second transport timeout and ambiguous/mismatched responses retain pending state. Reload only reads the pending command; Recover approval explicitly replays it. Definitive rejection requires fresh review, storage failures prevent new dispatch, and disposed callbacks cannot remove newer recovery metadata. Success checks response subject/project/full hash/storyHash, clears pending state and refreshes/opens the approved saved version. Approval history does not apply content, overwrite the working copy or start generation. A later saved manual version remains unapproved.

**Files:** new `components/storyboard/approval-controller.ts` and `approval-panel.tsx`; storyboard-review integration/history, editor fieldset lock, Cinema CSS; ten approval controller/transport tests added to test:storyboard-ui; README/system design/status. Backend approval API and migration 010 are unchanged.

**Automated verification:** `npm run test:storyboard-ui` **42/42**, including ten new groups for explicit consent, changing confirmation context, reload recovery, concurrent clicks, storage failures, definitive/ambiguous/auth rejection, malformed/mismatched success, disposed responses, storage isolation and exact transport payloads. `npm run check` passed both TypeScript checks and **23/23** prototype tests. Production build and `git diff --check` passed. Backend/project/auth suites were not repeated for this UI-only change; accepted F11c1 backend/HTTP evidence remains above.

**Browser verification:** isolated current source copy, Next/webpack on `127.0.0.1:3011`, disposable Mongo replica set with migrations through 010, synthetic account and labelled 150-word water-cycle fixture; no live provider. Review opened the correct confirmation and disabled conflicting actions. Escape returned focus to Review approval. First confirmation persisted approval and displayed historical status without changing the working copy. Applied the candidate, edited/saved its title and created an immutable manual version: that version required separate approval. Paused the actual isolated server process long enough to exceed the 20-second timeout. The session guard also hid private content during its failed revalidation; after resuming the server and using Try again, the original pending approval remained recoverable. Reload retained the same version/draft metadata. Recover approval on the narrow viewport succeeded, opened the manual version and labelled its history entry approved. Database counts were exactly **two approvals and two command receipts** for the two reviewed versions; no duplicate approval. The initial attempt to pause only the Next launcher did not interrupt the server and was a normal successful approval, not timeout evidence.

Requested mobile viewport was 390×844; the browser reported **325 CSS pixels** effective width and **312px** document scroll width (no horizontal overflow). Visually inspected mobile/desktop completed state; final browser warning/error log read returned none. Local ignored screenshots: `apps/web/runs/approval-mobile.png` and `apps/web/runs/approval-desktop.png`, containing only synthetic data. Reset viewport, closed QA tab and stopped the disposable launcher/server/replica set; removed the temporary source copy. The original port-3001 review environment was not migrated or restarted.

**Limits:** confirmation changes, cross-context recovery, storage failure and malformed success are controller evidence, not a full browser/device/security matrix. Browser outage interrupted the request before a confirmed response; committed-but-lost response recovery was covered by accepted F11c1 actual-HTTP QA and new controller tests, not separately injected after commit here. No live Gemini/TTS, renderer, R2, deployment or publishing was involved. sessionStorage recovery is per tab and cannot survive deliberate browser-storage clearing; server history still retains committed approval. Independent QA/code review remains requested before moving to F12 private media storage.


## Storyboard approval — independent UI QA — October 7, 2026

**PASS for F11c2 checkpoint `692d9d8`; no blocker found within the tested scope.** Reran `npm run test:storyboard-ui` under Node 24: **42/42**. Reviewed confirmation/context guards, persisted command contents, response matching, action locks and disposed-callback recovery. Browser checks used an isolated source copy, fresh account, disposable Mongo replica set migrated through 010, Next on port 3012 and a local HTTP proxy at `localhost:3011`. A labelled water-cycle fixture was seeded and applied through production services. No provider credentials, live generation or renderer were used; the original port-3001 environment and session were preserved.

| Browser check | Observed result |
| --- | --- |
| Explicit confirmation and cancellation | Review approval displayed the exact title/version suffix, six scenes, 70.4-second estimate and narrator. Focus moved to the confirmation heading. Editing, generation and history actions were disabled while scene review stayed available. Escape and Cancel restored Review approval focus; database and proxy counters remained at zero approval requests/records. |
| Unsaved edits and successful approval | A local unsaved title change disabled Review approval. Restoring the saved title enabled review. Only Confirm storyboard approval submitted the first request, resulting in one approval/command. The heading/history and status identified the approved saved version; working title and original candidate were preserved. |
| New edited version | Saved a different working title and froze it as a manual version. The selected version showed NOT APPROVED, its history entry had no approval label, and Review approval was enabled independently of the original approved version. |
| Committed response withheld | Submitted approval of that manual version. The proxy observed the API's HTTP-200 response after commit, then withheld it beyond the browser's 20-second timeout while other API requests remained available. The browser showed Approval outcome unconfirmed with the exact saved-version suffix and reviewed draft revision. A second tab saved a newer working title during this request. |
| Reload and explicit recovery | At **390 × 844**, reloaded the pending tab. The exact original command remained recoverable and the newer working title loaded. Proxy approval-request count stayed at two: reload did not replay. Recover approval sent the third request, returned the existing manual-version approval, opened that version and retained the newer working text. Database still held exactly **two approvals and two command receipts**. |
| Historical labels and mobile layout | The recovered candidate and history showed approval for the saved version, while the panel explicitly excluded later working-copy changes. Both candidates were historical relative to the newer draft. Mobile document scroll width was **375px** at a **390px** viewport, with usable recovery controls and no horizontal overflow. |

Final database inspection confirmed the original candidate content was unchanged, the working draft retained the newer title at revision 5, and the recovered approval still referenced reviewed revision 4. Exactly one seed generation receipt and zero queue items remained; approval started no generation. The final browser warning/error log read returned none. Screenshot evidence, containing only synthetic QA content: [desktop approval](design/verification/f11c2-qa-desktop.jpg), [mobile uncertain outcome](design/verification/f11c2-qa-timeout.jpg), [mobile recovered approval/history](design/verification/f11c2-qa-mobile.jpg).

**Limits:** browser-storage failure, malformed/mismatched response and confirmation-context rejection remain deterministic controller evidence; this was not a full device/accessibility matrix. Only the approval response was delayed, not authentication or all server traffic. Backend tests/types/build/prototype checks were not repeated for this documentation-only QA checkpoint; implementation and accepted API QA evidence above remain separate. No live provider quality, media storage, rendering, publishing or deployment was tested.

Reset the viewport and closed both QA tabs. Stopped the isolated proxy, web server and disposable database, removed temporary credentials/runner/source copy, and verified ports 3011/3012 had no listener while the original port-3001 review server remained available. No application code changed and no F12 work began.


## F12 — Private assets, gateway and media library — October 7, 2026

**Acceptance/scope:** user accepted F11c2 QA/code review and authorized the next feature. Implemented the F12 backend and Cinema media library together. No rendering, publishing or deployment started. Live private-R2 verification remains a concrete configuration dependency, not a claim of completed cloud QA.

**Implementation:** server-only S3-compatible adapter with conditional immutable writes, bounded 64-MiB inputs, full streamed readback length/type/SHA-256 verification and required checksum metadata; transactional staging/ready asset service, exact-input recovery and live-parent deletion fences. Migration 011 installs strict assets, hashed media grants and service nonce collections with unique/pagination/revocation/TTL indexes. Setup commands now apply 011. Asset-bearing projects cannot use empty-project deletion. A failed upload/finalization remains staging and may leave an object; automatic orphan cleanup is not implemented.

Owner-authenticated list/access/revoke routes enforce admission, same-origin mutations, strict bodies/query bounds and owner/project scope. Browser grants expire after ten minutes; internal JSON cannot be downloaded and captions are download-only. The Cloudflare Worker entry reauthorizes every GET/HEAD/Range via bounded, replay-protected HMAC POST, then streams the private binding with explicit disposition, range, CORS and no-store headers. No raw object key reaches the public API. Bearer URLs are shareable until expiry/revocation; already-authorized or buffered bytes cannot be recalled. Revoke applies to existing grants and does not prevent subsequent issuance.

Cinema media page is linked from storyboard review and includes pagination, preview, prepared download, grant revocation, expiry/error refresh with retained playback position where available, and an honest empty state. No producer is connected to rendering yet; approval alone creates no files. Tokens remain in component memory. Root prototype media remains outside the web application.

**Files:** `apps/web/src/storage/*`, private-media API routes, media page/component and Cinema CSS; migration setup scripts; project deletion guard; SDK dependency/lockfile and storage test scripts; `apps/media-gateway/wrangler.toml`; generated OpenAPI and README/API/DB/system documentation. Worker configuration contains placeholders only. No credentials or generated media are committed.

**Automated evidence:** `npm run test:storage` **18/18** on disposable MongoDB replica sets and real Better Auth sessions: strict migration/readiness, immutable uploads and conflicts, staging/retry/finalization failure, concurrent exact retries, tombstoned parents, ownership/admission, expiry/revocation, HMAC tamper/replay, pagination, missing/corrupt objects, full/HEAD/range delivery, If-Range fallback, fail-closed outages, conditional SDK commands and checksum metadata. Object storage uses labelled in-memory fixtures; SDK commands use doubles. `npm run test:projects` **14/14**, including generated OpenAPI consistency and deletion regression. Final `npm run check` passed both TypeScript checks and **23/23** prototype tests. Production build passed with new routes before the final checksum-metadata validation addition; that addition was covered by the final storage suite and typechecks. `git diff --check` passed. These results are not live Cloudflare evidence.

**Browser evidence and interruption:** isolated source copy on port 3011, disposable migrated MongoDB, synthetic owner, and a local port-3012 gateway executing the production gateway handler against an in-memory bucket. Sign-in, owned inventory, Preview thumbnail and an actually decoded 1×1 labelled PNG passed. Prepare download exposed the download link. Waiting for the browser download event stalled and the turn was interrupted; download completion was not established. No full mobile, playback, expiry or revocation browser matrix is claimed; the corresponding backend paths have automated coverage. After resumption no listeners remained on 3011/3012. Port 3001 also had no listener at that check; no original review server was deliberately stopped or migrated by this work.

**Remaining limits/checkpoint:** no R2/media configuration was present in the web environment. Real S3 upload/readback, Cloudflare Worker runtime/deployment and hosted delivery require operator configuration and live QA using the README procedure. No deployment was attempted. The existing local review database has not been migrated/restarted; use migration 011 or a fresh disposable setup before testing media. Media format/codec QA and generation integration belong to F13/F14; video version approval belongs to F15. Full object deletion, cleanup, backups and Meta ingest grants are not implemented. Independent QA/code review is requested before progressing to the next major feature.


## F12 — Independent local media QA — October 7, 2026

**PASS within the local scope for checkpoint `5772385`; live R2 remains unverified.** Reran `npm run test:storage` **18/18** and `npm run test:projects` **14/14** under Node 24. Reviewed the asset service, access authorization, gateway, immutable SDK writes/readback and media library. Actual HTTP/browser checks used an isolated source copy, disposable Mongo replica set with migration 011, fresh synthetic owner/foreign accounts, Next at `localhost:3011` and the production gateway handler on port 3012 with an in-memory bucket. Twenty-one labelled assets were seeded through production upload/verify services; no rendering or cloud provider was used.

| Check | Independent evidence |
| --- | --- |
| Private access over real HTTP | Anonymous inventory returned 401; foreign inventory/access 404; wrong-origin access 403; internal QA JSON download 404. Issued thumbnail access returned the exact original bytes with private/no-store headers; HEAD length and bytes=0-7 range were correct. A grant whose stored expiry was moved into the past returned 404. |
| Inventory and preview | Browser initially listed 20 assets. Load more media showed all 21 without duplicates and removed the pagination control. Thumbnail decoded at 1×1 natural pixels. Captions preview and both internal JSON preview/download controls were disabled. A separate empty project showed No media yet and explicitly stated approval alone creates no files. |
| Desktop download completion | Prepare download followed by Download thumbnail produced a completed browser download in the local Downloads directory. The file was **68 bytes**, SHA-256 **f6d6acb2dcf66d4e1b6419962726cf72cb16371556bc7dbdfd4e66e2caee2b8c**, exactly matching the uploaded PNG fixture. The gateway observed HTTP 200 with attachment disposition. This closes the prior unconfirmed browser-download checkpoint for the tested local path. |
| Revocation | Clicking Revoke links removed the selected preview/download panel and revoked all three extant grants for that thumbnail. A previously retained access URL then returned 404. New authorized issuance remained possible, as designed. |
| Mobile captions download | At **390×844**, Prepare download/Download captions completed a **73-byte VTT** with SHA-256 **f520e014e4be516360cecc3b0ab1123f23f9529d68e5fa0fda3910156f95d0c3**, matching the original fixture. Document scroll width was **375px**, with no horizontal overflow. |
| Missing-file recovery | Temporarily hid fixture objects from the bucket. Preview showed the missing/expired/unavailable message and Refresh access. Restoring the object and clicking Refresh access produced a newly decoded thumbnail without regenerating media. |

Evidence screenshots contain only synthetic data: [desktop media library](design/verification/f12-qa-desktop.jpg) and [mobile captions download control](design/verification/f12-qa-mobile.jpg). Download completion is evidenced by browser download events, returned local paths, file size/hash checks and gateway attachment responses, not by screenshots alone. Final page warning/error log read returned none after returning to the inventory; the injected missing-object 404 was expected.

**Limits:** the bucket was an in-memory fixture and the Worker handler ran under Node, so this does not verify live R2 conditional puts/readback, Cloudflare bindings/runtime, TLS/hosted streaming or deployed configuration. The ten-minute browser countdown was not waited out; expiry rejection used a past-expiry database fixture plus the deterministic suite. No audio/video codec playback, seeking or large-file performance matrix was run. Types/build/prototype checks were not repeated for this documentation-only QA change; implementation evidence remains separate. No application code, deployment or next-feature work was added.

Reset the browser viewport, closed the QA tab and stopped the isolated server, gateway and database. Removed credentials, runner/source copy and the two hash-verified disposable downloads. No private media or bearer URLs were committed. Port 3001 was already not listening before this run; no original review server was stopped. F12 remains partial until live R2 configuration and verification are completed.


## Development R2 credentials — October 7, 2026

User requested collecting the remaining R2 settings from their signed-in Chrome session. Existing buckets belonged to a different project, so created private `namastevideo-dev` with Standard storage and automatic Asia Pacific placement. Dashboard confirmed Public Access Disabled. Created `namastevideo-dev-local` user token with Object Read & Write restricted to this bucket (default non-expiring lifetime); no account-wide bucket administration granted.

Saved only R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY into ignored `apps/web/.env.local`, preserving existing entries and restricting file permissions to 0600. Secrets were not printed or committed. Using the saved environment, an actual SDK ListObjectsV2 request to the configured bucket returned HTTP 200. This verifies credential/bucket connectivity only, not upload integrity, gateway deployment or browser delivery. No objects were uploaded and no MongoDB migrations were run in this credential-collection step. Local ignored screenshot `apps/web/runs/r2-private-bucket.png` records the private bucket confirmation without credentials. No application code changed; runtime test suites were not repeated. Full live storage and Atlas verification remain pending.


## Local authentication and shared development DB credential — October 7, 2026

User authorized generating the Better Auth secret, configuring the local URL and reusing the existing MongoDB URI for setup. Updated ignored `apps/web/.env.local`: generated a cryptographically random 48-byte secret, set BETTER_AUTH_URL to `http://127.0.0.1:3000` (the normal web dev command), and set MONGODB_MIGRATION_URI equal to the existing MONGODB_URI. This needs no separate database credential; the explicit setup variable/code contract remains intact. The disposable `auth:local` harness retains its independent port-3001 configuration.

Both production configuration readers accepted the updated auth/setup settings; equality of the two DB URI settings was checked without displaying them. File mode remains 0600 and Git ignores the environment file. Earlier read-only connection checks authenticated successfully against MongoDB and returned HTTP 200 from R2; the selected database had zero completed application migrations. Setup privileges have not been verified through a migration run. No database migration, account provisioning, server start, gateway deployment or provider request was performed in this step. No application code changed; runtime suites were not repeated. Gateway origin/shared secret still await gateway setup.


## Live development infrastructure verification — October 7, 2026

**Authorization:** user requested verification of the saved environment and live services before moving to the next feature. Applied development database setup and used synthetic labelled QA data. User explicitly chose **Keep deployment pending; finish live service checks** when asked about the Worker and HTTPS application endpoint. No deployment, tunnel, social publishing or provider-key disclosure occurred.

**Atlas:** existing `db:setup` applied all eleven migrations (001–011) successfully to the configured database. `auth:operator -- setup` created the pinned Better Auth collections/indexes. Runtime credentials passed auth/storage readiness checks. A fresh synthetic account was provisioned with an in-memory random password, signed in through the actual Better Auth API and resolved its stored session. Production project service created a project transactionally and replayed the same command to the same project. Disabling the account invalidated its session. Final database inspection counted eleven completed migrations, zero active permanent accounts and zero labelled QA users. This was direct production service/adapter verification against Atlas, not browser or hosted HTTP QA.

**R2:** actual private-bucket checks used small labelled VTT objects. Production R2 adapter conditional upload, streamed type/length/checksum/metadata readback, same-key exact retry and SDK byte-range GET passed. The first fixture's deletion was confirmed by HEAD 404. A second integrated check used the production storage service with real Atlas and real R2: staging-to-ready upload and inventory, access issuance/authorization, revocation rejection and time-controlled expiry rejection all passed. The integrated check used a deliberately non-routable probe gateway origin only in its in-memory service call; it was never saved as app configuration. It does not demonstrate a deployed gateway. Exact fixture object and owner-scoped QA records were cleaned up; no user data was used.

**Providers:** the existing `ideas:probe` sent one synthetic binary-search prompt to the configured Gemini model: HTTP 200, three schema-valid suggestions, 2,301 ms. Production `voicePreview` resolved the configured Daniel test voice via ElevenLabs and retrieved 45,975 audio bytes. This verifies voice-read/preview access, not fresh speech synthesis quota, timestamp alignment or rendering.

**Environment:** both authentication and DB/storage configuration readers passed after setup. `.env.local` remains mode 0600 with no duplicate variable names or NEXT_PUBLIC secret variables. The two gateway settings remain absent deliberately. No credentials, cookies, raw provider text or private artifacts were printed/committed. No application code changed; local test suites were not rerun for this operator-only checkpoint, and prior results remain separate evidence.

**Remaining checkpoint:** MEDIA_GATEWAY_ORIGIN and MEDIA_SERVICE_SECRET, deployed Worker/runtime/HTTPS callback and live browser delivery await the user-deferred deployment. A permanent testing account still needs an email/display name and local password setup; the temporary QA identity was removed. F13 is next (durable generation jobs, idempotency, progress and cancellation), but no F13 implementation is claimed in this infrastructure checkpoint. Finish and report this verification before opening that feature; preserve the explicit hosted-delivery limitation when progressing.


## Persistent dummy test accounts — October 7, 2026

User requested dummy accounts instead of a personal identity. Provisioned Test Creator One (`creator.one@example.test`) and Test Creator Two (`creator.two@example.test`) through the production operator service in the configured Atlas development database. Generated separate random passwords and saved them only in ignored `apps/web/runs/development-test-accounts.json` with file mode 0600. Actual Better Auth sign-in passed for both; verification sessions were removed. Accounts remain enabled for user testing, with no fabricated project/media records. The earlier zero-active-accounts result above predates this explicit follow-up. Git ignore was verified; secrets are not part of this documentation commit. Hosted gateway deployment remains deferred; no server start or F13 implementation occurred.


## F13 — Durable approved-input job control — October 7, 2026

**Scope/dependency:** user accepted the infrastructure checkpoint and requested the next big feature. Delivered backend, UI, local worker and verification together. Before implementation, explained the concrete dependency: F14 has no PlanV2 speech/render adapter or frozen render configuration yet. F13 therefore prepares durable jobs and validates frozen approved input; it does not simulate a successful video. The UI explicitly explains this before confirmation. No additional numbered sub-milestones were introduced; the full planned hosted rendering workflow remains incomplete.

**Backend:** migration 012-generation-jobs adds strict generationJobs, generationCommands and generationOutbox records/indexes. Creation validates owner/live parent, current draft revision/hash, matching exact saved story approval and semantic PlanV2 content before atomically freezing input, acquiring the existing project active slot and inserting the job/command/outbox. Same-key races produce one job, changed payload under a key rejects, and replay retains the original response. Authenticated private/no-store latest/read/cancel APIs enforce ownership, admission, origins, strict inputs and revisions. Queued cancellation releases immediately; running cancellation is cooperative and persisted. Finalization checks a monotonic fence, cancellation, parent/admission and deadline; old work cannot release a newer slot or change a newer outcome. Reads and worker reconciliation distinguish queue expiry from dispatched deadlines. Existing idea/storyboard work continues sharing the project slot.

**Execution boundary:** pure preflight checks snapshot SHA-256 and PlanV2 validity, then stops at needs_input/RENDERER_NOT_CONNECTED. It cannot create audio/video/assets or promote output. Only this side-effect-free work is reclaimable after a ninety-second lease. F14 must add provider request journals, verified artifacts, model/voice/render snapshots, stage progress, unknown-outcome acknowledgement and rendering before any chargeable work is connected. No retry/regenerate/video route, job history pagination or generic external-stage execution is claimed.

**Dispatch:** pinned Inngest 4.21.1, official Next handler with signing checks, ID-only event function and minute-based outbox/reconciliation. Explicit local dev mode accepts loopback only; production forces signed/cloud SDK mode, and missing signing configuration fails closed. Outbox claims are leased; failed sends return to pending after fifteen seconds. A fresh transport envelope per delivery permits reconciliation redelivery, with Mongo job identity/fencing providing deduplication. Sent but unexecuted jobs are eligible again after one minute. Local `generations:worker` processes the same service without cloud configuration. Existing storyboard queue remains separate and is not silently replaced.

**UI:** Cinema storyboard page adds Prepare approved storyboard, exact-version confirmation, current job state, explicit cancellation, refresh and three-second visible-page polling. Pending create/cancel commands are stored before dispatch using identity/project-scoped sessionStorage, without story text or credentials. Reload reads without reposting. Recover job request reuses the original key/body; malformed/mismatched responses and network/auth uncertainty retain the command. Definitive rejections clear it. Storage failure prevents submission; disposed responses cannot erase newer recovery state. Job controls do not apply/edit/approve storyboard content.

**Files:** new `src/jobs` contracts/setup/service/dispatch/http/Inngest/OpenAPI; generation and cancel routes plus signed SDK route; generation panel/controller; local worker; migration operator/disposable setup and shared parent expiry/deletion guards; pinned dependency/lockfile; generated OpenAPI; README/API/DB/system/status documentation. Next dev generated `apps/web/AGENTS.md` and `CLAUDE.md`; retained the framework guidance, read the bundled route-handler documentation and left generated next-env declarations in their production-build form. No existing package versions changed in the lockfile; additions/hoisting accompany Inngest. No secrets or generated media are committed.

**Automated evidence:** `npm run test:jobs` **20/20**, using real disposable Mongo replica sets/Better Auth sessions and labelled storyboard content. Covers simultaneous same-key admission, busy slot, exact snapshot, owner/auth/origin/body boundaries, missing approval/stale input, queued and running cancellation, replay and safe slot release, queue expiry, pure-work lease takeover/late completion fences, dispatch failure recovery/ID-only payload, disabled admission, transaction rollback on outbox failure, deleted parent, corrupted input, missing configuration and unsigned SDK rejection. Six controller tests cover reload/explicit recovery/duplicate clicks, storage failure, response identity, disposal, cancellation revision conflicts and storage isolation. No provider or actual Inngest transport was used by these deterministic tests; a separate real-runtime check is recorded below.

Regression verification: `test:storyboards` **70/70**, `test:projects` **14/14** (including generated OpenAPI consistency), `test:storyboard-ui` **42/42**; `npm run check` passed root/web TypeScript and **23/23** prototype tests. Production build passed with the new routes. An initial build included the temporary browser runner and rejected its test-only definite-assignment declarations; removed that completed ignored runner and the production build then passed. Final `git diff --check` passed.

**Browser evidence:** Next/webpack at 127.0.0.1:3011 with a disposable database through migration 012, synthetic owner and labelled approved water-cycle candidate. Actual sign-in, preparation confirmation, queued state and same job after reload passed. Cancel job changed revision 1 → 2 and showed Job cancelled. Narrow viewport reload retained cancellation; preparation/Keep reviewing worked, with no overflow (325 CSS-pixel effective viewport, 312-pixel document width). Final warning/error log read was empty. Screenshots in ignored `apps/web/runs/f13-desktop.png` and `f13-mobile.png`; no full device/accessibility matrix claimed. Worker preflight completion/cancel-during-execution and ambiguous submission recovery are automated service/controller evidence, not browser scenarios in this run. Reset viewport, closed QA tab, stopped the disposable launcher/server/database and removed its temporary runner/context files.

**Development setup/checkpoint:** applied db:setup successfully to the configured development Atlas database through migration 012; earlier migrations replayed. No provider request, persistent QA job/account, R2 write, Inngest cloud account/key setup or deployment occurred in F13. Existing real-service evidence from the previous checkpoint remains separate. Hosted media delivery is still explicitly deferred. Start the normal web server and local generations worker for manual review; an approved current storyboard is required. Independent QA/code review should assess this preparation/control boundary before the F14 renderer integration. Real local Inngest delivery passed in the follow-up below; cloud transport and the F14 rendering boundary remain outstanding, so the full planned generation workflow is not marked complete.


**Additional F13 real Inngest check:** ran official CLI **1.46.0** in ephemeral local dev mode with discovery disabled and a disposable Next/Mongo app on port 3011. `/api/inngest` reported dev mode and two functions. Its actual minute timer invoked the outbox function, published an ID-only generation event and completed the generation-preflight function; runtime logs recorded both finished functions. Independent DB inspection found needs_input / RENDERER_NOT_CONNECTED at **attempt 1**. A later manual dispatch probe delivered zero because the cron had already handled the event; it was not counted as another successful dispatch. This closes the local transport gap without a cloud deployment. Stopped the identified CLI/QA launcher and removed the ignored runner/context file. Runtime state was in memory; no live Atlas or provider configuration was used. Hosted signature validation beyond unsigned-request rejection, cloud retries/outages and rendering remain separate checks.


## Independent F13 QA — October 7, 2026

**Verdict:** no blocking defect found in the durable **preparation/job-control** milestone at `d311560`. This is not approval of a working video renderer or hosted generation pipeline. Reviewed the job admission/worker/outbox/controller boundaries and independently reran `test:jobs` **20/20**, `test:storyboards` **70/70** and `test:projects` **14/14**: **104/104 passed**. Expected unsigned-Inngest rejection output occurred within the passing negative test. No application code changed; TypeScript, production build and prototype checks were not repeated for this documentation-only QA checkpoint.

**Isolation:** browser QA used an archived copy of this commit, installed dependencies, Next/webpack, a disposable Mongo replica set through migration 012, synthetic approved three-scene water-cycle fixtures and fresh random test credentials. The browser used localhost:3011 through a local response-fault proxy to Next on 3012. No saved `.env.local`, development Atlas accounts/data, R2 objects, provider keys or cloud Inngest configuration were used. Fixtures were seeded through production project/draft/storyboard/approval services; they were not live Gemini output.

| Scenario | Independent result |
| --- | --- |
| Explicit confirmation | Prepare approved storyboard showed the exact saved-version suffix and the no-rendering limitation. Keep reviewing dismissed it with zero creation requests and zero jobs. |
| Accepted create response lost | Proxy withheld a real HTTP 202 response after commit. Browser displayed Recover job request after its timeout. Reload retained the pending command and made no additional POST (creation count remained one). Explicit recovery made the second POST but kept **one job, one command, revision 1, attempt 0**. |
| Frozen approved input | After admission, changed and saved the working storyboard title in the browser. Draft advanced from revision 3 to 4 with the new title, while the queued job's entire frozen plan still exactly matched the original approved fixture. |
| Queued cancellation and subsequent work | Cancel job produced cancelled/revision 2/attempt 0 and cleared the project slot. Restored and saved the matching approved fixture, then successfully prepared a fresh job. |
| Actual local worker | Ran the unmodified `scripts/generations-worker.ts --once` entry point in the isolated environment. Exit 0; fresh job reached **needs_input / RENDERER_NOT_CONNECTED**, revision 3, attempt 1. Browser showed Renderer not connected. The cancelled earlier job stayed cancelled, the project slot was clear, and no assets were created. |
| Running cancellation with lost response | In a second disposable fixture, paused the production worker using its existing `beforeFinish` test hook, after claim. Browser showed Checking approved input (revision 2/attempt 1). Cancel POST committed HTTP 200 but its response was withheld; DB held cancel_requested/revision 3. Releasing the hook finalized **cancelled/revision 4/attempt 1** and cleared the slot. This is deterministic cooperative-cancellation QA, not a real long-running render. |
| Cancellation reload/recovery | After the timeout, the browser showed the terminal cancellation plus the recovery prompt. Reload made no new cancel POST; explicit recovery made the second cancel POST and retained **one job, two total commands, one outbox row, revision 4, attempt 1**. Recovery cleared the prompt. Running the real worker CLI afterward left that terminal state and attempt count unchanged. |
| Narrow layout | At **390×844**, confirmation, cancellation, refresh and recovery remained usable. Document scroll width was **375px**, with no horizontal overflow. Final warning/error log read returned none. |

Screenshot evidence contains only synthetic fixture data: [local worker outcome](design/verification/f13-qa-worker.jpg) and [mobile cancellation after recovery](design/verification/f13-qa-mobile-cancel.jpg). Database state and proxy mutation counters, rather than screenshots alone, establish the no-duplicate and frozen-input results. The first fault-injector run did not match the cancellation route, so its ordinary queued-cancel result was not counted as lost-response coverage; corrected the QA harness and used the separate running-cancellation run above for that claim.

**Limits:** hosted Inngest delivery/signatures/outages, infrastructure restarts and real audio/video rendering were not exercised. The implementation's earlier real local Inngest evidence remains separate; this run used the local worker CLI and the deterministic pause hook. No full device/accessibility/performance matrix is claimed. The existing live Atlas/R2 service evidence and user-deferred hosted media gateway remain unchanged. F14 still needs the documented render/provider execution safeguards before chargeable generation is connected.

Restored the viewport, closed the QA tab, stopped both disposable database/server runs and removed temporary credentials, launcher and source copy. Ports 3011 and 3012 no longer listened. No application changes, deployment, private media or next-feature implementation were included.

## F14 — PlanV2 renderer compatibility checkpoint (October 7, 2026)

**Scope and reason for checkpoint:** user accepted F13 QA/code review and requested the next feature. Inspection confirmed a concrete dependency: the existing approved PlanV1 renderer cannot represent PlanV2's per-target motion events or pronunciation edits. Before implementation, explained that this adapter must be verified before connecting chargeable TTS/background execution. This entry is a local renderer checkpoint within F14, not completion of hosted rendering or a new dashboard generation feature. Hosted deployment remains deferred by the user's earlier instruction.

**Implemented:** a dedicated versioned PlanV2 compiler/composition with title, takeaway, directed flow and comparison components. Validated events retain target/action/occurrence/offset/duration; reveal/connect controls visibility and emphasize/compare adds a temporary accent. Edges wait for visible endpoints. Original caption spelling is retained through pronunciation replacements; boundaries inside replacements are proportional estimates over the measured spoken span, not word-level forced alignment. Provider-normalized text that differs from the expected spoken text fails closed. Malformed alignment, collapsed captions, out-of-scene cues and measured duration outside 60–90 seconds fail instead of silently changing the story. SVG labels wrap including unbroken/Unicode tokens. Cream/teal/orange/DM Sans video styling is retained; dashboard Cinema styling is untouched.

**Files:** `src/plan-v2/compiler.ts`, `Composition.tsx`, `text.ts`, `index.tsx`, `fixture.ts`, `render.ts`; `scripts/render-v2.ts`; `tests/plan-v2.test.ts`; root package script and README. The existing PlanV1 prototype files/tests and dashboard job/API/database code are unchanged.

**Render boundary:** only explicitly supplied measured local MP3s enter a temporary asset directory; root public/runs is never bundled. Non-fixture audio is probed for MP3 codec, single audio stream and matching measured duration before rendering. Every attempt requires a new output directory, protecting earlier output. H.264, 1080×1920, 30fps, 60–90 seconds, expected audio presence and 64 MiB maximum are checked before output.partial.mp4 becomes output.mp4. Burned-in captions, VTT, four scene frames, timeline and QA JSON are produced. The rendering/stills phase has a ten-minute cancellation timer and signal handling; bundle/select and hard process-kill cleanup are not durable job supervision.

**Verification:** `npm run check` passed both root/web typechecks and the then-current 35 tests. Final root typecheck and `npm test` passed **36/36** after adding collapsed-caption protection: 23 unchanged prototype tests and 13 new PlanV2 tests. New coverage includes pronunciation/repeated cues/Unicode, component/event preservation, exact measured duration bounds, malformed alignment, event overrun, reveal/accent timing, VTT offsets/escaping, long label wrapping, preserving earlier output and refusal of live rendering without local audio. No web route changed, so a production build, browser dashboard QA and database suites were not repeated for this local-only checkpoint.

**Remaining F14 work:** request-start journals before charged provider calls; frozen voice/model/render configuration; artifact recovery and explicit unknown-outcome acknowledgement; execution leases/heartbeats/cancellation fencing; worker integration; R2 upload and atomic ready-video promotion; cloud runtime/full-process resource benchmark and separately authorized deployment. F13 still ends at RENDERER_NOT_CONNECTED. No live PlanV2 TTS, audio/listening quality, R2 integration through this renderer, dashboard playback, version approval or hosted readiness is claimed. No credentials, paid provider calls, Atlas mutations, R2 writes, deployment or social publication occurred. Generated MP4/VTT/timeline remain ignored local artifacts.

**Actual rendering evidence:** final `npm run render:v2:fixture -- --run f14-verified-20261007` completed in **57.5 seconds**, producing a **72.0-second** 1080×1920 / 30fps H.264 MP4; all six media checks passed. The fixture is deliberately silent (audio check confirms absence), with synthetic timing and an explicit on-video label. Node-only peak RSS was 759,088 KiB; this excludes Chromium/compositor and is not a hosted memory requirement. Four scene stills were generated; visual inspection across the checkpoint covered title, flow, comparison and takeaway. A final comparison frame is retained in `design/verification/f14-plan-v2-comparison.png`. The local review MP4 is `runs/v2-f14-verified-20261007/output.mp4`. Independent motion/playback review remains pending; the scene-frame inspection is not a claim of complete frame-by-frame QA.


## F14 P2 fix — fit wrapped diagram text (October 7, 2026)

**Finding:** valid three-line card labels (Reliable distributed systems) escaped the fixed card, and a three-line comparison heading (Cloud storage cost) crossed its divider. Wrapping alone did not account for the block height.

**Change:** `text.ts` now computes font size, line spacing and a vertically centered baseline from the full wrapped line count and the available height. `Composition.tsx` uses padded slots for all title/takeaway/flow card labels, comparison headings and comparison points. Card dimensions, arrow anchors and panel dividers remain stable; all wrapped lines are retained. A reproducible `--layout-stress` fixture covers four cards and both comparison panels with three four-line points each. Files: compiler-independent text/layout components, fixture, CLI, regression tests and this status entry; no API/database/provider behavior changed.

**Verification:** root `npm run typecheck` and `npm test` passed **38/38** tests, including two new layout regressions checking complete block bounds and contract-valid stress content. Actual Remotion still generation passed with `npm run render:v2:fixture -- --run f14-wrap-fix --layout-stress --stills-only`. Inspected the four-card and comparison stills: every line stays inside its padded card/heading/point slot, headings finish above the divider, and third comparison points remain inside the panel. Evidence: `design/verification/f14-wrap-fix-intro.png` and `design/verification/f14-wrap-fix-comparison.png`. `git diff --check` passed. This was still-image verification of the layout fix; no new MP4, provider request, deployment, or dashboard functionality was added. Prior F14 integration limitations remain unchanged.


## Independent F14 local-renderer QA — October 7, 2026

**Verdict: one P2 layout fix requested before full checkpoint sign-off.** Reviewed `72e2ac0` and independently ran `npm run check`: both root/web TypeScript checks and **36/36 tests passed**, including the unchanged 23 prototype tests. The ordinary silent fixture passed render, playback, sampled motion and caption checks. This remains a local PlanV2 adapter checkpoint; no approval of live narration, background rendering, R2 output or hosted readiness is implied.

**Fresh render:** `npm run render:v2:fixture -- --run f14-qa-20261007` completed in **64.4 seconds**. The resulting MP4 is **72.0 seconds**, 1080×1920, 30fps, H.264, **1,132,107 bytes**, with no audio stream as expected. All six output checks passed. Node-only peak RSS was 766,704 KiB, excluding renderer children; concurrent QA still rendering and local execution mean this is not a clean performance benchmark. A separate full FFmpeg decode completed with exit 0 and no decode errors. Local review artifact: `runs/v2-f14-qa-20261007/output.mp4` (ignored, not committed).

**Playback and motion:** served only the synthetic MP4 and a temporary QA viewer over loopback, outside the Next.js app. Browser playback at 2× reached currentTime/duration **72/72**, ended=true; final warning/error log was empty. Independently extracted and inspected MP4 frames **47, 55, 64, 80, 692, 735, 786, 1110, 1137, 1165, 1688 and 1757**. These showed the intro hidden/partial/full reveals, ordered flow nodes and connections, comparison accent appearing and disappearing, and separate takeaway accents. [Motion contact sheet](design/verification/f14-qa-motion-contact.png); [browser playback evidence](design/verification/f14-qa-browser-playback.jpg). These are sampled transitions, not a frame-by-frame visual review of all 2,160 frames.

**Captions and layout boundaries:** all **29** caption groups had positive duration and non-overlapping global timings. Concatenated captions exactly retained every scene's original narration, including uppercase RAM despite spoken pronunciation mapping. The unit suite additionally covers expanded pronunciation, repeated cues and Unicode; this silent run cannot verify spoken quality or real-provider timing. An extra validated still fixture exercised a 65-character wide title, 30-character wide label, Unicode label, four label rows, four flow nodes and backward/non-adjacent edges. Those elements stayed within their intended regions in the inspected stills.

**P2 — Constrain the kicker while preserving the scene counter.** At `src/plan-v2/Composition.tsx:53` in `72e2ac0` (line 56 after the diagram-text fix), the kicker and counter share a flex row without a bounded/wrapping kicker or a non-shrinking counter. A schema-valid 35-character wide kicker consumes the row and pushes **01 / 04** out of its intended position, wrapping it onto three lines at the right edge. Minimal reproduction: clone `renderFixture`, change only `plan.scenes[0].kicker` to `'W'.repeat(35)`, and call `renderPlanV2` with `fixtureSpeech()`, fixture=true and stillsOnly=true. The issue survives validation and is baked into the output; character-count validation alone does not protect this row. Reserve space for the counter and wrap/size the kicker within the remaining width, preserving the supplied text. Add visual boundary coverage for the maximum accepted kicker and recheck all four scene layouts. [Reproduction still](design/verification/f14-qa-kicker-overflow.png). Application code was not changed in QA.

**Limits and cleanup:** no paid/provider calls, saved environment loading, Atlas/R2 mutations, dashboard job execution or deployment occurred. Live audio input/mux/listening, actual provider alignment, cancellation under render load, resource limits and hard-kill recovery remain unverified here. Dashboard generation still ends at preflight. Closed the browser tab, stopped the loopback viewer (3013 no longer listening) and removed temporary runner/viewer source. Synthetic review MP4, captions and timelines remain ignored locally; only synthetic QA screenshots/contact sheet and this evidence are committed.

**Revision follow-up:** another development task committed `16538d8` during QA, fitting multiline diagram labels/headings/points. Its change does not touch the kicker/counter row. The full MP4 evidence above predates that commit; the minimal kicker-only still was rendered afterward and reproduces the same open issue. Independently reran root TypeScript and the updated suite: **38/38 passed**. No new full MP4 or independent visual sign-off of the separate diagram-text stress fixture is claimed in this follow-up. The existing fix commit and its evidence were preserved.


## F14 P2 fix — reserve scene-counter space (October 7, 2026)

**Finding:** QA's valid 35-character wide kicker forced the scene counter onto three lines. The previous diagram-text fix did not address the scene header.

**Change:** `src/plan-v2/Composition.tsx` now gives the counter a fixed 130px grid column with no wrapping and a 24px gap. The kicker occupies the remaining bounded column and can wrap unbroken text without truncation. A 56px header accommodates two lines; the title margin was reduced accordingly to preserve its position and leave clear separation. `layoutStressFixture` now includes 35 W characters on every scene, making this reproduction part of the existing validated visual fixture. No changes to narration, timing, media delivery or job execution.

**Verification:** root typecheck and **38/38 tests passed**. `npm run render:v2:fixture -- --run f14-kicker-fix --layout-stress --stills-only` generated fresh stills for title, flow, comparison and takeaway. Inspected all four: complete kicker text wraps into two lines within its column; counters 01 / 04 through 04 / 04 remain on one line and inside the right margin; titles and diagrams remain clear. Evidence: `design/verification/f14-kicker-fixed.png`; all four local stills are in ignored `runs/v2-f14-kicker-fix/frames/`. `git diff --check` passed. This layout-only check did not rerun full MP4 playback or live narration/jobs/R2; prior independent QA evidence and those integration limitations remain unchanged. Ready for independent recheck before checkpoint sign-off.


## Independent F14 kicker-fix recheck — October 7, 2026

**Verdict: PASS; close the kicker-overflow P2 at `4c7223e`.** Reviewed the reserved 130px counter column, 24px gap, bounded wrapping kicker and two-line header allocation. Independently ran root `npm run typecheck` and `npm test`: **38/38 passed**.

Ran `npm run render:v2:fixture -- --run f14-qa-kicker-recheck-20261007 --layout-stress --stills-only`. Inspected all four freshly generated 1080×1920 stills: title, directed flow, comparison and takeaway. Each full 35-W kicker fits on two lines without truncation; counters **01 / 04–04 / 04** stay on one line within the right margin. Titles remain below the kicker with clear separation. Also verified the existing diagram-text stress cases: all four three-line cards stay inside their boxes, flow labels leave arrows clear, and comparison headings/three four-line points remain inside their allocated slots and below/above the correct dividers. No new defect found in this targeted recheck.

[Four-layout header evidence](design/verification/f14-qa-kicker-recheck.png) contains cropped/scaled excerpts from the fresh synthetic stills. Full local stills remain ignored under `runs/v2-f14-qa-kicker-recheck-20261007/frames/`. The renderer exited successfully and cleaned its temporary bundle. No temporary server, browser tab or QA source was needed.

This closes the local renderer checkpoint's outstanding layout finding, together with the prior independent silent render/playback/motion/caption checks. It does **not** complete F14 integration: live narration, jobs, R2 output and hosted execution remain unverified. Full MP4 playback, web typecheck/build and database suites were not repeated for this isolated layout recheck. No application code, provider calls, cloud mutations or deployment were added.


## F14 — live local generation integration (October 7, 2026)

**Scope:** following user acceptance of renderer QA/code review, connected the approved immutable storyboard to the local job worker, real ElevenLabs narration, PlanV2 rendering and private R2 output. The dashboard now presents generation stages, completion and a private-media link, cancellation and a confirmation explaining repeat speech-credit use. Earlier output remains intact. This completes the local integration scope; hosted execution and browser media gateway deployment remain deferred by the user.

**Execution and storage:** each job freezes Daniel's voice, multilingual-v2 model, voice settings and renderer configuration inside its hashed snapshot. A request-start journal commits before each charged scene call; ambiguous speech outcomes stop instead of automatically repeating synthesis. Audio, alignment and measured duration are stored together in private R2 with expected length/hash recorded before upload. Same-job lease recovery reuses verified stored speech; a missing/ambiguous result requires attention. Lost speech-upload acknowledgement is recovered by exact readback. Fresh generation requires explicit repeat-cost acknowledgement when prior speech exists. There is no cross-job speech cache or separate same-job Retry audio endpoint.

Fenced 90-second leases, 20-second heartbeats, live ownership/admission checks and parent serialization protect every stage. A transactionally serialized scheduler admits at most two valid execution leases globally and one per owner. Cancellation/deletion/access loss stops publication; a stale worker cannot publish. Both verified MP4/VTT asset records, render output, terminal job and released project slot commit together. Failed uploads or final transaction failure expose no partial new assets. Hard-crashed process descendants and private orphan objects are not a completed resource-control/cleanup system.

**Runtime boundary:** the explicit local worker supplies production adapters. Inngest transport remains wired, but its handler leaves execution for that worker; no hosted render runtime is claimed. Rendering runs in a separate Node process outside react-server conditions, without provider/storage credentials in its environment, with temporary audio and output files. Root prototype media remains inaccessible to the web application. Measured speech must pass the existing 60–90-second PlanV2 timing/alignment checks; generated MP4 must pass codec/dimensions/audio/size checks before upload.

**Files:** added `apps/web/src/jobs/{render-config,render-setup,execution,local-render}.ts` and `scripts/render-v2-job.ts`; updated job service/contracts/setup/Inngest/OpenAPI, local worker, R2 recovery reads, generation panel, job/storage tests and generated API contract. Updated README, API/DB/system design amendments and this status document. The DB migration runner now skips empty secondary-index batches for the scheduler singleton.

**Migration:** additive migration 013 installs the successor job validator plus `renderScheduler`, `speechStages` and `renderOutputs`, with strict schemas and unique stage/output identities. Migration 012 checksum/history is preserved and accepts the reviewed successor validator on replay. `npm run db:setup` succeeded against configured development Atlas, replaying the preceding setup and applying 013. No existing Atlas project was rendered in this check.

**Automated verification:** 154 relevant tests passed: 30 job/controller, 19 storage, 11 DB, 14 project/OpenAPI, 42 storyboard UI/controller and 38 root renderer/prototype tests. Execution regressions cover frozen configuration, no duplicate TTS, unknown response, lease takeover/late completion, stored-speech reuse, cancellation during rendering, upload failure, invalid duration, lost upload acknowledgement, owner concurrency and final-transaction rollback. These execution test adapters use explicitly labelled media doubles and do not establish codec/provider quality. Final `npm run check` passed root/web typechecks and root tests; production `npm run build` passed. The prior prototype remains covered.

**Real provider/storage evidence:** a synthetic RAM/storage storyboard and disposable MongoDB replica set exercised the production job service and adapters against real ElevenLabs and R2. The first controlled probe stopped safely with an unknown speech outcome: macOS ffprobe could not resolve its bundled dylibs. Fixed its working directory and added a startup probe before any charged speech call; no automatic repeat occurred. The second controlled probe succeeded in **84.5 seconds**, with four stored speech stages and two ready assets. Verified R2 readback produced a **75.285-second**, 1080×1920, 30fps H.264/AAC MP4 of **4,143,164 bytes**; renderer QA passed and a separate full FFmpeg decode exited 0. This uses a labelled authored storyboard, not live Gemini generation. Local review output: `apps/web/runs/f14-live-probe-retest/output.mp4` and `captions.vtt` (ignored). All **six** temporary R2 objects were deleted after checks; temporary account/database/server and credential context were removed. No media or credentials are committed.

**Browser verification:** the disposable dashboard showed the successful job at attempt 1/revision 6 and both ready assets. Confirmation displayed the exact version and repeat-credit warning; dismissing it kept the storyboard. A second job was queued without a worker, reload restored that same job, and cancellation completed at attempt 0/revision 2; the earlier two assets remained listed. No additional provider call was made for this browser sequence. Narrow layout remained usable with measured CSS viewport width 325px and document width 312px (requested device viewport 390×844). Evidence: `design/verification/f14-live-job-ready.png`, `f14-live-media.png`, `f14-generation-mobile.png`.

**Checkpoint and limitations:** ready for independent code review/manual QA before the next feature. Run the web app with `npm run dev` and the explicitly chargeable local worker with `npm run generations:worker`; use an approved current storyboard. The saved local narrated MP4 is available for listening review. Subjective narration quality/full browser playback of this new output, full Atlas-backed live generation, hosted media delivery, cloud resource benchmarks, hard-kill process cleanup and automatic orphan reclamation remain unverified or pending. The temporary QA server/worker were stopped. F15 video review/version approval is not implemented by this milestone. No deployment or social publishing occurred.


## Independent F14 integration QA — October 7, 2026

**Verdict: one P2 fix requested before full sign-off.** Reviewed `29b539b`. The supplied narrated video passes technical media checks, and disposable dashboard checks pass progress, reload recovery and cancellation preserving earlier output. The My Videos Ready and Needs attention projections remain stale after terminal generation outcomes. Subjective listening is still pending: this session's audio-input tool explicitly reported that audio input is unsupported, so no pronunciation, naturalness or spoken-word accuracy sign-off is claimed.

**Automated verification:** independently ran `npm run test:jobs` (30), `test:storage` (19), `test:projects` (14), `test:storyboard-ui` (42), `test:db` (11) and `npm run check` (38 root renderer/prototype tests plus root/web TypeScript checks): **154/154 passed**, both typechecks passed. The expected unsigned-Inngest rejection appeared in its negative test. Production build was not repeated; the implementation's build evidence above remains separate.

**P2 — Update library flags with terminal generation outcomes.** In `apps/web/src/jobs/service.ts:100–103`, successful publication inserts assets/render output and updates the terminal job, but the project update only releases `activeJobId` and increments `contentRevision`. It never updates the materialized `flags.ready` or `flags.needsAttention` used by project listing. In a disposable database, a succeeded job with two ready assets/render output retained `ready:false`; a `needs_input` job with `PROVIDER_OUTCOME_UNKNOWN` retained `needsAttention:false`. Both filtered service queries returned zero projects. Actual browser Ready and Needs attention views each showed “No projects match this filter,” while All showed both projects as Drafts and their storyboard pages showed the correct job states. Update these projections in the fenced terminal transaction, deriving them from retained output and attention state; a later failed/cancelled attempt must not remove Ready while earlier output remains. Add coverage through filtered project listing. This does not request F15 video-version approval or `latestReadyVideoId` implementation. Evidence: [Ready filter](design/verification/f14-integration-qa-ready-filter.jpg), [Needs attention filter](design/verification/f14-integration-qa-attention-filter.jpg).

**Disposable browser checks:** used an archived copy of `29b539b`, Node 24, MongoDB Memory replica set with migrations 001–013, fresh test credentials and a loopback Next.js server. Production authentication/project/draft/storyboard/approval/job services ran against explicitly labelled speech/render/storage adapter doubles. These checks establish orchestration and UI behavior, not new real TTS/render/R2 success. The successful project showed Video ready, attempt 1/revision 6 and two ready private assets. Repeat-generation confirmation named the exact reviewed version and warned about speech credits and uncertain provider outcomes; dismissing it preserved the storyboard. A new job survived reload with the same job ID. Holding its renderer adapter allowed cancellation at the visible Rendering your video stage; after release it terminated cancelled at attempt 1/revision 6, released the active project slot and preserved the earlier two ready assets without publishing new assets. At 390×844 the document width was 375px, with no horizontal overflow. The injected lost-provider-response project displayed Generation needs attention and the no-automatic-repeat/credit explanation; replay of that job did not make a second speech call. Browser warning/error logs were empty. [Mobile cancelled state](design/verification/f14-integration-qa-cancel.jpg).

**Supplied video inspection:** inspected the existing `apps/web/runs/f14-live-probe-retest/output.mp4`; no new paid generation was run. The file is **4,143,164 bytes**, H.264 1080×1920 at 30fps with 2,258 frames, AAC stereo at 48kHz, total duration **75.285333 seconds**. Video/audio stream durations differ by approximately 19ms. Independent full FFmpeg decoding exited 0 without decode errors. A temporary loopback viewer served only this MP4 outside the Next.js application; muted technical playback at 2× reached the end (75.285333/75.285333, ended=true), with no browser errors. Inspected extracted frames at 7, 27, 45 and 62 seconds across all four scene layouts: titles, diagram labels and captions stayed within the frame. [Local playback evidence](design/verification/f14-integration-qa-playback.jpg).

**Audio/captions and listening limit:** original stereo audio analysis measured **−24.41 LUFS integrated**, **−9.59 dBTP true peak** and **1.80 LU loudness range**; no clipping was indicated and the source file was not normalized or modified. All **29** VTT caption groups had positive duration, non-overlapping global timings and bounds within the output duration. Their concatenated text exactly matched each of the four authored fixture narration strings, including RAM spelling. These checks establish file integrity and caption/script coverage, not actual spoken wording, pronunciation quality or perceptual synchronization. Audio input was unavailable in this session; subjective listening needs a listener with playback access.

**Limits and cleanup:** no fresh provider calls, Atlas changes, R2 writes or deployment occurred during independent QA. The implementation's earlier real provider/storage probe remains separate; this run's job adapters were labelled doubles. Hosted playback/gateway, cloud runtime sizing, hard-crash descendant cleanup, orphan reclamation and F15 remain outside this check. Stopped the disposable server/database/viewer, closed both QA tabs, restored the viewport, removed the archived source copy, temporary credentials, runner and extracted audio; ports 3011/3013 no longer listened. Original user MP4/VTT remain unchanged and ignored. Only this status update and synthetic QA screenshots are included in the QA commit; application code is unchanged.


## F14 P2 fix — generation outcomes in library filters (October 7, 2026)

**Cause:** My Videos correctly queried indexed project flags, but generation committed its terminal job/assets without projecting the outcome onto those flags. Individual project pages read the job directly and therefore disagreed with the library.

**Change:** job admission clears previous generation attention; successful output atomically sets Ready and clears attention; failed/needs-input outcomes set attention. Cancellation clears attention and never removes earlier Ready output. Deadline expiration and access-failure paths also update attention. Project update timestamps follow these user-visible changes; other flags remain unchanged. All updates retain the existing active-job parent fence, so older jobs cannot overwrite a newer job's projection. A project may appear in both Ready and Needs attention when it retains an earlier usable output and its latest attempt failed.

**Existing records:** `repairGenerationProjectFlags` is called by `npm run db:setup` after schema setup. It scans live projects with generation history, derives readiness from committed render output and attention from the active/latest generation job, and repairs only mismatches in a per-project transaction. Parent writes serialize with concurrent completion/deletion; unrelated flags and ordering timestamps are preserved. Repeated repair is a no-op. No schema/index/API response changes were needed; the library retains its indexed filtering/pagination.

**Files:** `apps/web/src/jobs/service.ts`, `apps/web/src/generation/live-project.ts`, new `apps/web/src/jobs/repair-project-flags.ts`, `apps/web/scripts/db-setup.ts`, `apps/web/tests/jobs.test.ts`, and this status document.

**Verification:** **52 tests passed**: 32 job/controller, 14 project/API and six library tests. New real replica-set regressions exercise success → failure → new attempt → cancellation → success through the actual project list service, including owner isolation and preservation of earlier Ready output. Queue expiration and restoring old false flags are covered; a second repair reports zero changes. Web typecheck and `git diff --check` passed. No frontend layout, renderer or provider code changed, so no new render/build or browser visual check is claimed. Independent QA should recheck the Ready and Needs attention tabs. Listening review remains pending and hosted playback stays deferred.

**Live setup check:** `npm run db:setup` succeeded against configured development Atlas, replaying migrations and reporting **0 project flag repairs needed**. The old-record repair itself was verified with deliberately stale records in the disposable replica-set tests; no claim is made that Atlas contained the QA fixture projects. No provider calls, media writes, deployment or social publishing occurred.


## Independent F14 library-filter recheck — October 7, 2026

**Verdict: PASS; close the P2 at `004934e`.** Reviewed generation admission, queued/running cancellation, terminal success/failure, access/deadline paths and the existing-record repair. Terminal projection changes share the transaction and active-job parent fence; successful publication sets Ready, failures set Needs attention, and later failures/cancellations do not clear earlier Ready output. No new actionable defect found in this targeted recheck.

**Independent checks:** `npm run test:jobs` **32/32**, `npm run test:projects` **14/14**, `npm run test:library` **6/6**, and `npm run typecheck:web` passed (**52 tests total**). The initial sandboxed attempt could not bind the disposable MongoDB listener (EPERM); reran with local-server permission and all checks passed. The expected unsigned-Inngest rejection remains a passing negative test. Production build, root tests and fresh rendering were not repeated for this projection-only fix; prior evidence is preserved above.

**Browser and state verification:** used an isolated archived copy of `004934e` with Node 24, Next.js on loopback, a disposable MongoDB replica set with migrations 001–013, and a fresh test account. Production project/draft/storyboard/approval/job services generated four labelled fixtures through in-memory speech/render/storage doubles: success only; success followed by an ambiguous provider failure; first-attempt provider failure; and success followed by cancellation during the render adapter. Ready showed exactly the three projects with earlier ready output; Needs attention showed exactly the two failed attempts. The successful-then-failed project appeared in both filters. The cancelled project's earlier two ready assets remained, and it was absent from Needs attention. Browser warning/error logs were empty. [Ready browser evidence](design/verification/f14-filter-recheck-ready.jpg); [Needs attention browser evidence](design/verification/f14-filter-recheck-attention.jpg). These are orchestration/filter checks with labelled media doubles, not new live speech/R2/render evidence.

**Repair verification:** deliberately set the successful project's Ready flag and the first-failure project's Needs attention flag to false in the disposable database. Browser refresh reproduced the missing records (Ready count 3→2, Needs attention 2→1). Called the production `repairGenerationProjectFlags`: first run repaired **2** projects; second run repaired **0**. Assertions confirmed ordering timestamps and unrelated Drafts/Scheduled/Published flags were preserved. Browser refresh then restored the exact expected memberships (Ready 3, Needs attention 2). The automated suite separately covered queue expiry, new-attempt attention clearing, queued cancellation and owner isolation. The implementation's Atlas setup result remains separate; independent QA made no Atlas changes.

**Limits and cleanup:** this closes the filter finding only. Listening review remains pending because this session cannot hear the audio; hosted playback stays deferred. No cloud credentials, paid provider calls, R2 writes, deployment or application changes were involved. Stopped the disposable Next.js/database, removed the temporary account file and archived harness/source copy, and closed the active QA tab. Only this status update and the two synthetic browser screenshots are committed.


## F15 — video review, selection, approval and export (October 7, 2026)

**Scope:** user accepted F14/filter QA and requested the next milestone. Implemented the complete local F15 backend and Cinema dashboard workflow. Hosted media/compute deployment remains deferred as previously requested; explained this concrete infrastructure dependency before implementation. No new F16 revision or publishing work is included.

**Backend:** successful generation materializes an immutable `vid_` record in the same transaction as both assets, render output, terminal job and project summary. Frozen render spec/input hash and output byte hash identify exactly what is reviewed. Earlier versions persist; latestReadyVideoId advances, while an existing selectedVideoId remains selected. New owner-scoped paginated list/read endpoints expose safe metadata, not object keys, credentials or frozen private provider input. Exact-hash approval is explicit and never inherited; its subjectHash covers canonical outputHash/renderSpecHash. Approval does not publish or change selection. Dedicated idempotent selection checks project metadata revision. Both mutations retain request receipts and recheck live ownership on replay.

**UI:** `/projects/{id}/video` shows native private preview, expiry/error refresh, version history, persistent selection, confirmation of final approval, and MP4/caption exports. Preview must load before the review checkbox can be asserted. That assertion is a UI workflow control, not an automated test that a human actually heard/read the content. User/project-scoped local receipts preserve unknown approval/selection outcomes for explicit same-key recovery. Definitive conflicts ask for refreshed review. Browsing versions resets preview and review confirmation; a later unapproved version remains unapproved when an earlier one is approved. My Videos and generation completion link to the new review page. No fake Publish button or hosted-delivery success is presented.

**Schema:** additive migration 014 creates strict `videos`, `videoApprovals` and `videoCommands` collections, including unique job/approval/command indexes and owner/project creation-time pagination. Separate video approvals preserve the applied story schema and its checksum. Setup transactionally backfills legacy committed outputs without approval, retaining existing selections; repeated backfill is a no-op. The local worker checks migration readiness before charging for speech. Development Atlas `npm run db:setup` succeeded through 014 and reported **0 videos needing backfill / 0 flag repairs**. Backfill with an actual legacy fixture was verified in the disposable replica-set test, not claimed from the empty Atlas result.

**Files:** new `apps/web/src/videos/{contracts,setup,materialize,service,http,openapi}.ts`; four API routes; `/projects/[id]/video/page.tsx`; `components/video/{review,commands}` and controller tests. Updated generation completion, setup script, My Videos/media/generation links, Cinema CSS, generated OpenAPI, job tests and API/DB/system/README documentation. Existing prototype renderer and media gateway implementation are unchanged.

**Automated verification:** **96 tests passed**: 35 job/controller (including video service/HTTP/backfill integration), 14 project/OpenAPI, three video-command recovery tests, six library tests and 38 root renderer/prototype tests. New coverage includes transactional version creation, immutable pagination, cross-user isolation, exact-hash rejection, duplicate approval/key reuse, revision conflicts, deletion denial on replay, origin/auth/body validation, no inherited approval, legacy backfill idempotence, recovery after unknown outcome/reload, storage failure preventing dispatch and disposed/foreign responses remaining unresolved. Initial disposable setup rejected a too-short migration ID; corrected it to the existing ID contract before successful tests or Atlas application. Final root/web typechecks and optimized production build passed; `git diff --check` passed.

**Browser evidence:** used two explicitly labelled synthetic version records in a disposable database, a loopback gateway and the already-verified 75.285-second RAM/storage MP4/VTT from F14. Synthetic storyboard metadata says water cycle; the reused clip deliberately does not claim a fresh storyboard-to-render result. No Gemini, ElevenLabs or R2 requests occurred. The actual preview reached readyState 4 and playback time advanced; pause worked. Confirmed fixture approval survived reload, a later version remained unapproved, selecting that version survived reload, and both versions stayed available. Prepared MP4/VTT downloads through the actual gateway matched original SHA-256 hashes exactly. These are UI/state/technical-media checks, not subjective listening or semantic approval of the fixture.

Desktop at **1280px** (document1265) and mobile at **390px** (document375) showed no horizontal overflow. Adjusted review page horizontal padding after initial narrow inspection. Screenshots: `design/verification/f15-review-desktop.png` and `f15-review-mobile.png`; synthetic data only. Browser warning/error log was empty in the checked session. The temporary app/gateway/database were stopped, credential context and source harness removed, tabs closed and viewport reset. No saved environment values were changed.

**Review checkpoint:** ready for independent code review and manual QA before F16. Test Review video from a completed project's library card or storyboard generation panel. Existing live app playback still needs the user-deferred media gateway deployment/configuration. Full subjective listening, hosted range delivery, actual cloud render-to-review integration and the complete accessibility/device matrix remain unverified. Local browser checks used labelled fixture associations and reused valid media, not a newly charged generation. This milestone adds no deployment, Instagram connection or publication.


## Independent F15 local review QA — October 7, 2026

**Verdict: PASS for the local F15 workflow at `290e32f`; no new F15 defect found.** Hosted delivery and subjective listening remain pending. A separate pre-existing sign-in fallback issue is recorded below. This is QA evidence, not approval of the fixture's narration/content or permission to deploy/publish.

**Independent automated checks:** `npm run test:jobs` **35/35**, `npm run test:projects` **14/14**, `npm run test:video-ui --workspace apps/web` **3/3**, `npm run test:library` **6/6**, and `npm run check` **38/38 root tests plus both TypeScript checks**: **96/96 passed**. Expected unsigned-Inngest rejection appeared in its negative test. Reviewed immutable materialization/backfill, exact-hash approvals, ownership/lifecycle checks, selection revision checks, receipt recovery and UI version changes. The implementation's production-build and Atlas migration evidence remain separate; neither was repeated by independent QA.

**Local setup:** archived `290e32f` into a disposable source copy, initialized MongoDB replica-set migrations 001–014, and used a fresh test account. Production project/storyboard/approval/job services created two versions with labelled speech/render adapters and in-memory object storage. Both reuse the existing F14 RAM/storage MP4/VTT; storyboard fixture metadata says water cycle, and the project explicitly says “QA fixture — reused RAM/storage clip.” No new semantic storyboard-to-render result is claimed. The production media gateway ran over loopback with its real signed authorization endpoint and a memory-backed bucket. No cloud credentials, Atlas/R2 writes or paid provider calls were used.

**Preview and workflow guards:** opened Review video from the completed project's library card. The existing selected version loaded while the later version remained available. Review checkbox/approval stayed disabled until preview metadata loaded. A one-shot gateway 503 produced the refresh-access message; Refresh preview recovered to readyState **4** and duration **75.285333 seconds**. Native playback advanced beyond 3 seconds and paused at approximately 7.76 seconds. This establishes technical playback, not listening quality. Selecting another version cleared preview/review state; its approval remained absent even though the earlier version was approved.

**Lost-response approval recovery:** in the disposable route only, wrapped the unchanged production approval handler to discard its first successful response and return 503 after commit. The UI showed an unconfirmed approval and blocked further mutations. Database inspection showed exactly **one approval and one command receipt** before recovery. Full reload retained Recover request; explicit recovery replayed the receipt, cleared the pending state, retained the same approval ID and created no duplicate approval. Afterwards the older version showed Approved while the newer version showed Needs review. [Recovered approval evidence](design/verification/f15-qa-approval-recovered.jpg).

**Selection and two tabs:** loaded the same project revision in two tabs, selected the newer version in one, then tried selecting it from the stale tab. The latter received HTTP **409** and “Another tab changed the selected version. Refresh and choose again.” Refresh reconciled the selected marker. Reload of the first tab restored the newer selection. Final database state had project revision **3**, two versions, one approval (older version only), and two successful command receipts (approval and selection). The failed conflict did not create a receipt or overwrite selection.

**Actual browser exports:** used Export MP4/Export captions, then clicked each generated download link and waited for completed browser downloads. Compared downloaded files to the original fixture: MP4 **4,143,164 bytes**, SHA-256 `4543a9d3a088a2da700bf564b1b87bca44cad6d812693ab49d9519f28264e84e`; VTT **1,877 bytes**, SHA-256 `2b5cc88de386bfc9e7c87cf1fd23c714336364e61814f557a7a1da49e6fdbb2c`. Both matched byte-for-byte. These checks used the production gateway on loopback, not deployed Cloudflare delivery.

**Responsive check:** desktop measured viewport/document widths **1146/1133px**. The first viewport override affected another selected tab, so its still-desktop result was not counted as mobile evidence. In the active mobile tab, actual measured dimensions were **390/375px**, with no horizontal overflow. Preview reached readyState 4; export controls and the caption download link remained usable, and approval stayed disabled while the review checkbox was unchecked. [Mobile evidence](design/verification/f15-qa-mobile.jpg). No full device/accessibility matrix is claimed.

**Separate P2 — prevent native sign-in submission from putting credentials in URLs.** At `apps/web/components/sign-in-form.tsx:46`, the form relies solely on React's `onSubmit`/`preventDefault` and supplies no safe native submission method/action. During an early QA proxy setup, scripts did not initialize; clicking Sign in submitted a native GET to `/sign-in?email=…&password=…`, visibly placing the disposable test password in the address/query and local request log. The query values are intentionally omitted from this report. With scripts unavailable or before hydration, the same HTML default is unsafe: passwords can enter browser history and access logs. Add a safe non-GET fallback and/or keep submission disabled until initialized, and verify a blocked/failed-JavaScript sign-in cannot place credentials in a URL. Git history confirms this file last changed at `4f8e29a`, predating F15. Direct Next.js initialization worked; no claim is made that F15 caused the temporary proxy failure. Only disposable credentials were involved and their database was destroyed.

**Harness corrections and cleanup:** the first reused-clip adapter had inconsistent synthetic duration and was correctly rejected; corrected fixture timing before counting browser success. The temporary fault proxy could not initialize browser scripts, so completed F15 checks used direct Next.js with only the explicit post-commit response wrapper for fault injection. Proxy counters were not used as evidence; database receipts and actual HTTP/UI outcomes establish recovery. Removed the isolated source copy/wrapper/marker, test credentials/database, and the two QA downloads; stopped all local app/gateway/proxy processes (ports 3012–3014 no longer listened), closed QA tabs and reset the viewport. Original fixture MP4/VTT are unchanged and ignored. This commit contains only Project Status and synthetic screenshots; application code is unchanged.


## P2 fix — prevent sign-in credentials in native GET URLs (October 7, 2026)

**Cause:** the existing sign-in form depended on the hydrated React submit handler to prevent default browser navigation. Without that handler, the absent method/action allowed native GET submission with named credentials in the query string.

**Change:** `apps/web/components/sign-in-form.tsx` now supplies explicit `method="post"` and `action="/api/session/sign-in"`. Email, password, visibility toggle and submit remain disabled until the component's initialization effect runs; the submit handler also checks initialization. A noscript notice explains that JavaScript must be enabled and the page reloaded. The normal hydrated JSON sign-in flow is unchanged. Defense in depth: if native submission is forced despite disabled controls, the existing endpoint rejects URL-encoded POST with a sanitized 415 rather than putting credentials into a redirect or URL. This intentionally does not implement JavaScript-free authentication.

**Verification:** `npm run test:auth` passed **17/17**, including the actual Next.js route integration. Added assertions inspect the actual server-rendered form before script execution: explicit POST/action, disabled named credential inputs and submit button, and noscript guidance. A URL-encoded native-style POST is rejected with 415, no Location header, no query string and no echoed email/password. Existing successful JSON sign-in, session round trip, authorization, origin checks, throttling and recovery tests passed. Web typecheck and `git diff --check` passed. An initial test assertion incorrectly depended on HTML attribute order; corrected the assertion and reran the complete suite successfully. No credentials are captured in evidence.

**Scope/limits:** changed only the sign-in component, authentication integration test and Project Status. Restored the incidental generated next-env change from the local test server. The test verifies served HTML and native-style HTTP behavior; no new manual browser-with-JavaScript-disabled check or production build is claimed. Ready for independent QA of the reported initialization-failure case. No provider calls, live database changes, deployment or social publishing occurred. Listening review and hosted playback remain pending.


## F15 P2 fix — preserve recovery commands across tabs (October 7, 2026)

**Cause:** two video review controllers loaded before either submitted could each believe no command was pending. Both wrote the same owner/project localStorage entry; the later write replaced the first request, and unconditional cleanup could erase an unresolved command from the other tab.

**Change:** `components/video/commands.ts` now stores receipts under owner/project/command-UUID keys. Writing a command cannot overwrite another command; a same-key/different-body collision fails closed. Success and definite rejection clear only the matching immutable key/body. The controller then exposes any remaining receipt for explicit recovery, never automatic dispatch. Reading keeps compatibility with the prior owner/project single-record format, and its cleanup requires an exact matching command. Cross-owner/project scope remains unchanged. Reload or tab closure does not delete stored receipts. Already-open tabs running the older bundle should be reloaded to use the fix.

**Verification:** all **6 video controller/store tests passed**, including three new regressions using the real store with shared localStorage semantics: two pre-opened controllers, a lost approval response followed by another tab's successful selection, two distinct stored records, exact original key/body recovery after reload, and deletion of only the recovered command. Other cases cover a definitive conflict preserving another pending command, separate users, legacy receipt compatibility, and mismatched-key/body write/cleanup refusal. Existing storage-failure, disposed-response and foreign-response guards remain green. Web typecheck and `git diff --check` passed. No server/API/database behavior changed; no new manual-browser concurrency run or production build is claimed.

**Files/scope:** video command store/controller, `tests/video-review.test.ts`, API recovery clarification and this status entry. Ready for independent recheck of the reported two-tab case. No provider calls, database changes, deployment or publication. F15 listening review and hosted playback remain pending.


## Independent sign-in fallback P2 recheck — October 7, 2026

**Verdict: PASS; close the sign-in credential-URL finding at `53765f5`.** Reviewed explicit POST/action and initialization guards. A newer unrelated video-recovery commit (`f79d4d2`) was already present; preserved it and its status evidence. Browser testing used an isolated archive of the requested sign-in fix. No independent sign-off of the separate multi-tab video-recovery fix is implied.

**Automated verification:** independently ran `npm run test:auth` **17/17** and `npm run typecheck:web`, both passing. These ran on the current checkout, whose later commit leaves this sign-in component/auth test unchanged. The auth suite includes the actual Next.js server HTML, safe native-style POST, successful JSON session round trip and existing account-isolation/recovery coverage. Production build and unrelated renderer/video suites were not repeated for this targeted recheck.

**Browser initialization-failure reproduction:** served the isolated app through a loopback test proxy adding `Content-Security-Policy: script-src 'none'` to block all initialization scripts. In the actual browser, email, password, password-visibility toggle and Sign in were all disabled. DOM inspection confirmed native method `post`, action `/api/session/sign-in`, and an empty URL query. Clicking the disabled Sign in control made no submission or navigation. [Blocked-script browser evidence](design/verification/signin-qa-blocked-scripts.jpg). This explicitly tests failed/blocked scripts, not the browser's global JavaScript-off setting; the noscript notice was checked in server HTML by the suite rather than claimed visible under CSP.

**Normal browser round trip:** on the direct app origin, controls initially rendered disabled and became usable after initialization. An incorrect test-only password produced the generic error and cleared the password field; the correct fresh credentials opened My Videos. Sign out returned to the sign-in page with only the expected returnTo/reason parameters. Credentials never appeared in the browser URL. An additional independent native-style URL-encoded POST to the real endpoint returned **415**, no Location header, no URL query and neither submitted credential in its response. JavaScript-free authentication remains intentionally unsupported; the fallback fails safely.

**Cleanup/limits:** disposable local MongoDB and fresh test credentials only; no saved environment, cloud account/provider/R2/Atlas data or deployment was used. Closed both QA tabs, stopped the app/database/script-blocking proxy, removed the temporary account file and isolated source/launcher, and verified ports 3016/3017 no longer listened. Only this status update and a credential-free screenshot are included in the QA commit. Listening review and hosted playback remain pending.


## F16 — caption editing and saved-narration revisions (October 7, 2026)

**Scope/status:** user accepted the two P2 fixes and requested the next milestone. Implemented backend, Cinema UI, worker integration and renderer support together. Caption edits intentionally allow capitalization/whitespace only: changed words, punctuation and narration/visual edits return to the existing storyboard revision/approval flow. This is not a free-form semantic caption editor or a new conversational video editor. New versions preserve the selected video, earlier exports and approvals, and need their own approval.

**Backend and persistence:** new owner-scoped caption GET/PATCH and regenerate POST routes, strict schemas and generated OpenAPI; exact source render hash, scene speech fingerprint and whole-caption codepoint spans; max 100 overrides, duplicate/invalid spans and semantic changes rejected. Enqueue atomically creates the existing job/outbox/command receipt and reserves the live project. Replayed key/body returns the same job. Source metadata/overrides are immutable in renderSpec; no schema migration beyond 014. Worker journals reuse of verified saved speech under the new job and never synthesizes on a missing cache. Existing fenced execution, cancellation and atomic video completion remain in force.

**UI:** Review video now offers Edit captions, Render caption changes, Render again with saved narration, and a storyboard revision link. Scene-local times and original text are shown beside each group. Per-tab drafts survive reload, and storage failure blocks submission. Meaning-changing edits and over-limit override sets cannot submit. Explicit confirmation precedes enqueue. Revision commands retain the existing per-command multi-tab recovery mechanism; latest-job progress, cancellation/recovery and automatic version refresh use the existing job controller. Earlier selected output remains selected.

**Rendering:** PlanV2 compiler carries original narration codepoint spans into caption groups, changes only displayed text, and keeps audio/event timings. Renderer build `plan-v2-2` waits for the bundled DM Sans font and measures actual caption width, fitting at most two lines at 40–24px with no truncation. New base generations use v2; old queued ordinary v1 snapshots stop before speech with RENDER_CONFIG_CHANGED and require a fresh generation. Revision metadata declares v2 separately while preserving source speech configuration/fingerprints. Prototype PlanV1 remains unchanged.

**Automated verification:** root/web typechecks and root suite **40/40**; video controller/store suite **8/8**; project/OpenAPI suite **14/14**. Job integration suite **38/38**; **100 targeted tests total**. Added coverage includes codepoint spans, semantic/duplicate/span rejection, caption fitting, exact revision recovery, over-limit requests failing before persistence/dispatch, cached-speech revision and repeat render, missing-cache stop without TTS, old approval/selection preservation, and the old-renderer pre-speech guard. Production Next.js build passed. No production cloud migration or provider call was required.

**Actual render evidence:** produced a fresh **72-second**, 1080×1920, 30fps H.264 silent fixture with every caption group uppercased, using the real compiler/Remotion renderer. All technical QA checks passed; full FFmpeg decode completed without errors. Sampled intro and comparison stills show fitting caption text. Local ignored output: `runs/v2-f16-captions-20261007/output.mp4`, timeline/VTT/qa.json. [Rendered caption evidence](design/verification/f16-render-caption.png). Synthetic timings and silence do not establish live pronunciation or listening quality.

**Browser verification:** isolated source copy, disposable MongoDB, memory-backed object store and loopback gateway; no saved environment or cloud credentials. Confirmed changed words disable render; uppercase edit survives reload; explicit caption revision completes and appears automatically as a second unapproved version; original version stays selected. Reading the new version returns uppercase captions; Render again produces a third version retaining those captions. Browser render adapter reused a labelled prior valid MP4; it was not the independently rendered uppercase video, and is not claimed as end-to-end live rendering. Desktop editor evidence and **390px mobile viewport / 375px document width** show no horizontal overflow. [Desktop](design/verification/f16-caption-editor.png), [mobile](design/verification/f16-caption-mobile.png). Local QA app/worker/gateway/database stopped and QA tab closed; viewport reset.

**Files:** caption contracts/service/routes/OpenAPI, caption editor/progress/review/command controller, execution/speech-result/local-render/config, root PlanV2 compiler/render/composition/caption-edits, targeted tests, API/DB/system/README documentation and this status file.

**Review checkpoint/limits:** ready for independent QA/code review before the next feature. Verify from a completed video: edit capitalization, reload the draft, confirm a new version with the local generation worker running, review/select/export the result, rerender it, and exercise lost-response recovery/cancel. Source narration must still be available. Hosted delivery/compute remains deferred, and no live Atlas/R2-to-render pass, new paid narration, listening review or full accessibility/device matrix is claimed. Missing cache requires deliberate recovery, never automatic speech charges. No deployment, Instagram connection or social publishing occurred.


## F16 — independent QA at `fa97e9d` (October 7, 2026)

**Result: core revision flow passed; one P2 prevents full approval.** No application code was changed during this QA. The earlier F15 per-command recovery regressions also passed in the eight video-controller tests; this entry does not claim a separate full F15 browser recheck.

### Finding — P2: advertised spacing edits are discarded

- In Review video → Edit captions, change `Water moves through our world in a` to `Water  moves through our world in a` (two spaces). **Render caption changes stays disabled**, with no validation explanation, although the page explicitly says spacing can change. A capitalization-only edit enables it immediately.
- `apps/web/components/video/caption-editor.tsx:23–24` collapses whitespace both for the changed check and override filtering. The compiler at `src/plan-v2/compiler.ts:78` also collapses any whitespace submitted through the API, and `fitCaption` rejoins words with single spaces. Thus enabling the button alone would not fix the output.
- Preserve supported display spacing through dirty detection, override persistence, VTT and layout while retaining normalized comparison for speech safety; alternatively obtain agreement to narrow the advertised feature. Add a spacing-only end-to-end regression. Full F16 approval is pending this fix/recheck.

### Independent verification

- Node 24: `npm run test:jobs` (38), `npm run test:projects` (14), `npm run test:video-ui --workspace apps/web` (8), and `npm run check` (both TypeScript checks plus 40 root tests): **100/100 passed**. `npm run build --workspace apps/web`: passed.
- Isolated archive of `fa97e9d`, disposable MongoDB replica set/account, loopback Next.js on 3018 and the production private gateway handler on 3019. A verified local disk object store substituted for R2. No development Atlas records, real provider credentials or external media services were used.
- The production local render adapter and worker rendered both the original and revised videos from real MP3 files containing **synthetic silence and synthetic alignment**. The seeded source was explicitly approved and selected to test preservation. Both videos are 72.213333 seconds. The renderer passed its technical checks; independent full video/audio decoding of the revised MP4 passed. This is technical render evidence, not speech quality or listening evidence.
- Desktop: caption loading/timing, punctuation rejection and disabled submission, capitalization editing, draft restoration after reload, explicit new-version confirmation, queued/running reload, completed-version review, private playback and VTT browser download passed. Playback advanced beyond 13 seconds with readyState 4. Returning to storyboard is available for spoken changes.
- A one-shot fault in the isolated PATCH route replaced a successfully committed response with HTTP 503. The pending revision survived reload; **Recover request reused the same queued job**, with one source job and one revision job total. No duplicate render or speech execution occurred.
- Worker counters after completion: **3 synthetic speech calls for the source, still 3 after the revision; 2 real render calls**. The original video remained selected and approved, and the new child version was unapproved. Its VTT differs only in the first caption's requested uppercase text; every timing is identical. Extracted AAC tracks have identical SHA-256 `4b25bdcc754257b9ae3aacba27f5fdf74f21d29e798128e1dcf1c6f4a444c25e`.
- Browser VTT download completed and matched the saved revised VTT exactly: 1,720 bytes, SHA-256 `a9ae983c5c0f84cb24bc302bec0aed41834eed64f376fe900e3d323b4ebee9a6`. Rendered uppercase text was inspected in a fresh decoded frame and fits within the caption box.
- Render again with saved narration admitted a third job; cancelling it while queued produced the expected cancelled UI/state. The two saved videos, original selection/approval, and speech/render counts remained unchanged. Missing-cache/no-synthesis and override inheritance remain covered by the independently rerun worker tests.
- Mobile with a 390×844 viewport override: caption input and controls stayed within the viewport. A second tab began with its own unedited caption draft; changing it did not overwrite the uppercase draft restored in the first tab.
- Additional actual HTTP checks passed: no session → 401, foreign origin → 403, spoken-word change → 422 `CAPTION_MEANING_CHANGE`, wrong speech fingerprint → 422 `INVALID_SPAN`, unknown field → 422 `VALIDATION_FAILED`.

### Evidence and remaining limits

- Screenshots: [running revision](design/verification/f16-qa-rendering.jpg), [mobile editor](design/verification/f16-qa-mobile.jpg), [new version alongside approved/selected original](design/verification/f16-qa-version.jpg), [fresh rendered uppercase caption](design/verification/f16-qa-rendered-caption.png). All use labelled synthetic fixtures.
- Local ignored render artifacts: `runs/f16-independent-qa-20261007/video-1.mp4`, `video-2.mp4`, and corresponding VTT files. Generated media, temporary credentials, database and QA-only adapter/fault code are excluded from Git.
- **Open:** the spacing-edit P2 above. Hosted playback, deployed workers/gateway and subjective listening remain pending; no claim of fresh live TTS/R2 verification is made. No F17 work was started.

## F16 P2 fix — release recovery after unavailable saved narration (October 7, 2026)

**Cause:** caption/regenerate admission returns explicit `SPEECH_RECOVERY_REQUIRED` for missing or corrupt saved narration before enqueueing. The video command controller treated that response as an unknown outcome, retaining the receipt and blocking other review actions indefinitely.

**Change:** `apps/web/components/video/commands.ts` now treats this code as a definite rejection for caption and regenerate commands only. It clears the matching immutable receipt, reads any other pending command, retains the actionable error message and releases the busy state. Existing generic service failures, lost responses and invalid success responses remain unresolved for recovery. The same logic clears previously persisted affected commands when the user chooses Recover request after loading the updated app. Other tabs' commands are never discarded.

**Verification:** `npm run test:video-ui --workspace apps/web` passed **12/12**; web typecheck and `git diff --check` passed. Four new regressions use the actual controller and command store with shared-storage semantics, covering both caption and regenerate actions: initial explicit rejection, reload without a stuck receipt, subsequent approval, generic unavailable outcome retained through reload, same-key/body recovery, and explicit recovery rejection clearing only its own record while preserving another command. Existing unknown-outcome and multi-tab tests remain green.

**Scope/limits:** controller, controller/store tests and this status entry only. No API/database/rendering changes, provider calls or deployment. No new browser run or production build is claimed for this targeted controller fix. The separate spacing-edit finding in the independent F16 QA entry remains open; this fix does not claim full F16 approval.

## F16 P2 fix — preserve spacing-only caption edits (October 7, 2026)

**Cause:** editor dirty detection, override filtering, compilation and line fitting independently collapsed whitespace. Extra interior spaces therefore never enabled rendering and were discarded even when submitted through the API.

**Change:** shared `captionDisplayText` preserves interior spaces in editor comparison and compiler output. Layout now chooses a measured one/two-line fit without discarding separators, including when wrapping. VTT contains the same preserved display text. Leading/trailing whitespace is trimmed; each interior tab/line-break whitespace character becomes a space to protect VTT cue boundaries. The UI explains interior-space/line-break behavior. Speech-safety validation still compares normalized words and punctuation; spacing changes reuse saved speech and do not change timings.

**Verification:** root suite **41/41**, job integration **38/38**, video controller/store **12/12** (**91 tests**), both typechecks and `git diff --check` passed. Added root regression follows a spacing-only edit through the same display comparison used by the editor, compilation, VTT and measured wrapping. The worker integration now submits a spacing-only revision, checks persisted caption text and rendered VTT, rerenders with overrides retained and no new speech, and preserves original selection/approval. Existing capitalization/source-span/semantic tests remain green. An initial test-edit inadvertently changed an unrelated diagram assertion; corrected it and reran successfully.

**Scope:** caption editor, shared display/layout helper, compiler, root/job tests, API documentation and this status entry. This resolves the reported implementation defect; independent browser recheck is still required before full F16 approval. No new live TTS/R2/Atlas calls or deployment. Hosted playback and subjective listening remain pending.

**Render/build evidence:** production Next.js build passed. A fresh real Remotion **72-second silent render** with triple interior spaces in every caption passed all technical QA checks. Inspected the intro still: preserved gaps, two lines, text within the caption box. [Spacing render still](design/verification/f16-spacing-caption.png). Ignored local artifacts: `runs/v2-f16-spacing-20261007/output.mp4`, `captions.vtt`, `timeline.json`, `qa.json`. This is synthetic-timing render evidence, not listening or a new manual dashboard run. Removed the temporary probe script; no generated video or credentials are committed.


## F16 spacing P2 — independent browser recheck at `491e685` (October 7, 2026)

**Result: PASS; the reported spacing-only P2 is closed.** No additional finding arose in this targeted recheck. No application code was changed. The earlier QA finding is retained above as historical evidence; this entry supersedes its open status.

- Repeated the exact desktop failure: `Water moves through our world in a` → `Water  moves through our world in a`. Render caption changes changed from disabled to enabled. A second caption used triple spaces throughout. Both spacing-only edits survived draft reload and explicit revision submission.
- After completion, selecting the new version returned the exact double/triple spaces. They remained intact after a full page reload and reselection. With no additional edits, the render-changes button correctly stayed disabled. The original version remained selected and approved; the new child version remained unapproved.
- Mobile with a 390×844 viewport override also enabled rendering for a spacing-only edit, with no horizontal overflow (document width 375px). Outer whitespace alone did not count as a change; two line breaks did. Adding punctuation still disabled rendering with the storyboard guidance.
- The browser-downloaded VTT matched the actual rendered export: **1,735 bytes**, SHA-256 `68c4a8106e98ee48dac4f79cda57f3f1d1453cd26bace2fac6ea8ddc75459103`. It differs from the baseline only in the two intended spacing edits. Every timing is unchanged.
- The production local adapter/worker completed a fresh **72.213333-second** revision render from verified saved synthetic-silence MP3s. Full video/audio decoding passed. Inspected decoded frames show both the double-space caption and the triple-space caption wrapping into two unclipped lines. Speech-adapter calls remained **3 before and after revision**; the revision made zero additional speech calls. Extracted AAC SHA-256 stayed `4b25bdcc754257b9ae3aacba27f5fdf74f21d29e798128e1dcf1c6f4a444c25e`, identical to the baseline.
- Independently reran `npm run test:jobs` (38), `npm run test:video-ui --workspace apps/web` (12), `npm run check` (41 root tests and both TypeScript checks): **91/91 passed**. Production `npm run build --workspace apps/web` and `git diff --check` passed. The 12 controller tests include the separate unavailable-narration recovery fix; this was not a new browser recheck of that separate fault path.
- Harness: isolated archive, temporary replica-set database/account, verified disk storage substitute and loopback production gateway handler. The baseline reused the previously verified original silent MP4; the spacing revision used the **real renderer**, not a reused output. No live provider/R2/Atlas or deployment calls. Temporary services/account were cleaned up, QA tabs closed and viewport reset.
- Evidence: [saved revision text](design/verification/f16-spacing-qa-saved.jpg), [mobile edit](design/verification/f16-spacing-qa-mobile.jpg), [double-space rendered caption](design/verification/f16-spacing-qa-rendered.png), [wrapped triple-space caption](design/verification/f16-spacing-qa-wrapped.png). All are synthetic QA fixtures. Ignored local output: `runs/f16-spacing-qa-20261007/output.mp4` and `captions.vtt`.

**Limits unchanged:** hosted playback and subjective listening remain pending. This silent fixture verifies formatting, persistence, reuse and technical output; it does not establish narration quality. No F17 work or deployment was performed.


## F17 — personal preferences UI and API (October 7, 2026)

**Scope/status:** user accepted F16 QA/code review and both P2 fixes, then requested the next milestone. Delivered personal preferences backend and Cinema Settings UI together. No Instagram/F18 implementation or deployment is included. Settings is accessible from My Videos on desktop/mobile and uses the existing server/private-session guards.

**Implemented:** read-only account email; IANA timezone input with suggestions and invalid-value feedback; future-project voice default; existing Daniel preview component; explicit save/discard and saved/error states. Daniel remains the only enabled test voice. Timezone is persisted for future scheduling, not a claim of working schedules or global date-display conversion. The UI explains that existing narration/videos are unchanged. Inline sign-out confirmation protects unsaved edits; full-document leave/reload uses beforeunload. Sign-out failure resets the leave bypass. Ordinary unsaved edits are not autosaved.

**API/database:** authenticated owner-scoped GET/PATCH `/api/preferences`, strict fields, origin/content-type/body protections, no query parameters, no-store envelope and generated OpenAPI. Missing records read as virtual revision 0 defaults (Asia/Kolkata, daniel-test); GET performs no write. First save inserts revision 1 behind existing unique owner index; subsequent updates atomically match owner/revision and increment once. Concurrent/stale requests yield REVISION_CONFLICT. Server validates actual IANA timezone support and current voice catalog. Existing foundation validator/index suffice; no migration or live Atlas setup change. Existing project creation already snapshots the saved voice in its creation transaction, leaving earlier project aggregates untouched.

**Recovery/conflicts:** the controller writes an exact pending PATCH to owner/tab-scoped sessionStorage before dispatch. Storage failure prevents the request. Unknown outcomes survive reload and require explicit Recover save with the original body/revision. An old GET never settles a delayed save. A committed request replay conflicts rather than writes twice; the UI fetches current preferences, keeps local inputs and asks the user to use saved values or explicitly save their changes. Definite validation errors release the receipt. Malformed/mismatching success responses remain unresolved. This is CAS recovery, not an idempotent success-receipt endpoint.

**Automated verification:** project/API/replica-set suite **17/17**, preference controller/store **5/5**, root prototype/renderer **41/41** (**63 tests total**) and both typechecks passed. Tests cover invalid timezone/voice, simultaneous first writes, one unique owner record, stale revisions, isolated defaults, strict authenticated HTTP/origin/query/body rules, future-project voice snapshot versus unchanged older drafts, exact lost-save recovery after an unchanged read, explicit conflict resubmission, storage failures, disposed completion and malformed-response protection. Generated OpenAPI matches checked-in schemas. Production Next.js build passed. `git diff --check` passed.

**Browser verification:** temporary source copy and disposable local MongoDB/account on loopback, without saved environment/cloud credentials. Saved UTC and reloaded; two pre-opened tabs then produced the expected stale conflict (saved Europe/London versus local Asia/Kolkata). The local edit remained and Save my changes committed only on explicit click. Invalid Mars/Olympus disabled Save; Discard restored the saved value. Inline unsaved sign-out prompt appeared without signing out; Keep editing retained the form. Mobile save passed at **390px viewport / 375px document width**, no horizontal overflow. [Desktop Settings](design/verification/f17-settings-desktop.png), [mobile Settings](design/verification/f17-settings-mobile.png). Initial harness directory/executable-path mistakes were corrected before counted browser evidence. A native confirmation experiment was replaced with the verified inline confirmation; no native-confirm cancellation pass is claimed.

**Files:** new preference contracts/service/HTTP/OpenAPI, Settings route and API route, settings/controller components, shared SignOutButton optional hooks, library navigation/Cinema CSS, controller/project tests, package test script, generated OpenAPI, API/DB/system/README docs and this status record. No dependency or credential changes.

**QA checkpoint/limits:** open My Videos → Settings; save/reload timezone, check invalid input, verify future-project defaults, test two-tab conflict choices, interrupted-save recovery and sign-out warning. Lost-response recovery is covered by actual controller/store tests; no new browser fault-injection run or live provider/Atlas/R2 test is claimed. Daniel preview reuses the existing implementation; no new listening/provider-preview check was performed. Hosted media and listening remain pending from earlier milestones. QA app/database stopped, temporary account/copy/helper removed, successful QA tabs closed and viewport reset. A connection-error browser tab could not be rebound for cleanup because its internal error-page URL was blocked; it contains no account data. No F18 work started.

## F17 P2 fix — preserve edits while retrying conflict refresh (October 7, 2026)

**Cause:** a rejected PATCH cleared its pending receipt, then a failed conflict GET set current to null. Reload preferences subsequently followed the initial-load path and replaced local inputs with server values, losing the attempted change and comparison context.

**Change:** `components/preferences/controller.ts` now keeps unresolved conflict context independently of transient error messages. Refresh retries preserve the current local draft, including across repeated failures. A successful refresh restores REVISION_CONFLICT with the fetched server revision/values and the unchanged local draft, enabling the existing explicit comparison choices. Only confirmed saving or Use saved preferences resolves that context. No automatic resubmission occurs.

**Verification:** preference controller/store suite **7/7** and web typecheck passed; `git diff --check` passed. Two new actual-controller regressions cover PATCH conflict → failed follow-up GET → another failed Reload preferences → successful retry. They assert the local timezone remains intact, no extra PATCH occurs during reads, comparison state returns, Save my changes uses the newly fetched revision, and Use saved preferences explicitly replaces the draft without writing.

**Scope/limits:** controller, regression tests and Project Status only. Backend/persistence contracts unchanged. No new browser fault-injection run, production build, cloud calls or deployment are claimed for this targeted fix. Ready for independent recheck before F18.

## F17 P2 fix — run the leave guard for logo navigation (October 7, 2026)

**Cause:** Settings registered beforeunload, but its shared Brand used Next.js Link. Logo navigation stayed within the current document, bypassing the warning and discarding ordinary unsaved edits.

**Change:** Brand now supports an explicit documentNavigation option. Settings opts in, rendering a native home anchor so logo clicks take the same full-document path as its other navigation links and trigger the existing unsaved/pending-save beforeunload protection. Other Brand consumers retain Next.js Link behavior. Appearance, destination and accessible label are unchanged.

**Verification:** preference/controller/component suite **8/8** and web typecheck passed; `git diff --check` passed. The added regression checks that the opted-in Brand is a native anchor to `/` without a client click handler, with the existing accessible label, while the default still uses Next.js navigation. Existing conflict-refresh and save-recovery tests remain green. No new browser confirmation-dialog run or production build is claimed for this targeted navigation change.

**Scope:** shared Brand, Settings opt-in, regression test and this status entry only. Existing unrelated QA screenshots remain untouched/uncommitted. No backend, schema, provider or deployment changes. Ready for independent logo-navigation recheck before F18.


## F17 — independent local QA and fix rechecks (October 7, 2026)

**Result: PASS through `14ad96b`; no remaining finding from these checks.** Started against `992557d`. During QA, `f6d09e2` and `14ad96b` landed on dev; their exact changed application files were loaded into the isolated test copy, and the affected checks were repeated. This QA commit changes only this record and synthetic screenshots.

### Browser and persistence evidence

- Entered through My Videos → Settings. A labelled legacy `test-preset` preference showed the unavailable-voice option; selecting Daniel and saving UTC persisted after reload. Only Daniel was enabled. Invalid `Mars/Olympus` disabled Save; Discard restored the saved timezone.
- Two pre-opened tabs preserved the local Asia/Tokyo input while displaying the server's Europe/London value. Use saved preferences adopted the server value without another write. A separate conflict resolved only after explicit Save my changes; its result survived reload.
- Injected one HTTP 503 **after** a real successful PATCH. The pending save disabled further edits and survived full-document sign-out/sign-in within the same tab. Recover save resent the exact body (`expectedRevision:5`, Europe/Paris, Daniel), received the expected CAS conflict, and allowed Use saved preferences. Audit showed one successful revision increment and a 409 replay, not a duplicate write. A direct pending-state reload attempt stayed on Settings under beforeunload; it is not counted as a completed reload. Fresh-document recovery was verified via sign-out/sign-in instead.
- Sign out with pending or ordinary unsaved edits showed the inline confirmation. Keep editing retained state. Choosing Sign out again completed logout; signing back in restored the recoverable pending command. No credentials are included in evidence.
- Created a new project through My Videos after changing the default. Database inspection confirmed the new draft used `daniel-test`; the earlier labelled draft retained `test-preset`. Full serialized earlier project and draft documents were unchanged after repeated preference saves and new-project creation, not just their voice fields.
- Mobile save passed with a 390×844 viewport override and 375px document width, without horizontal overflow. Existing projects remained unchanged. Timezone remains a stored future scheduling preference; this does not establish scheduling or global date conversion.

### Findings reproduced and closed during this turn

- **Conflict-refresh P2 reproduced at `992557d`:** another tab saved Europe/London; local Asia/Tokyo received PATCH 409 and a deliberately failed follow-up GET. Reload preferences then replaced Asia/Tokyo with Europe/London without a discard/accept-saved choice. Historical [failed read](design/verification/f17-qa-failed-conflict-read.jpg) and [lost draft](design/verification/f17-qa-discarded-conflict.jpg) evidence is retained.
- **`f6d09e2` independently rechecked and closed:** repeated the failed conflict GET and an additional failed Reload preferences. Asia/Tokyo survived both. The next successful read restored the Europe/London comparison while retaining Asia/Tokyo; audit showed no extra PATCH during the reads. Explicit Save my changes then used fetched revision 10 and committed revision 11. [Preserved local draft after retry](design/verification/f17-qa-fixed-conflict.jpg).
- **`14ad96b` logo guard checked:** clicking NamasteVideo home with unsaved UTC left the URL at `/settings` and retained UTC. After explicit Discard, the same link navigated to `/`. The browser automation surface did not expose a native beforeunload dialog, so this records guarded-navigation/retention outcomes, not a visual dialog or manual accept/dismiss walkthrough. Inline sign-out confirmation was separately verified above.

### Automated checks, isolation and limits

- Initial `992557d`: project/API suite **17/17**, preference controller suite **5/5**, root suite **41/41**, both TypeScript checks and production build passed. After the fixes: updated preference/component suite **8/8**, web typecheck and production build passed. Final relevant suite total is **66 tests** (17 + 8 + 41); the unchanged project/root suites were not redundantly rerun after controller/Brand-only fixes. `git diff --check` passed.
- Disposable MongoDB replica set/account and loopback Next.js; no development Atlas data, provider credentials, R2 or external services. One-shot response/read faults existed only in the isolated API route. Normal backend authentication, validation, CAS and project creation were exercised. Temporary services/account were cleaned up, tabs closed and viewport reset.
- Evidence: [normal conflict](design/verification/f17-qa-conflict.jpg), [interrupted save](design/verification/f17-qa-recovery.jpg), [mobile preferences](design/verification/f17-qa-mobile.jpg), [final saved Settings](design/verification/f17-qa-saved.jpg), plus the closed finding evidence above. Local ignored PATCH audit is in `runs/f17-independent-qa-20261007/patch-audit.jsonl`.
- Daniel preview was not played in this recheck; the existing preview implementation/evidence is unchanged. Hosted playback and subjective listening remain pending from earlier milestones. No deployment, Instagram/F18 work or main-branch promotion occurred.


## F18 — personal Instagram authorization, local implementation (October 7, 2026)

The user accepted F17 QA/review and requested the next milestone. Delivered the F18 backend and Cinema UI together. Live provider acceptance is a separate infrastructure checkpoint because a configured Meta app and registered same-origin HTTPS callback are required; deployment remains explicitly deferred. F19 publishing was not started.

Implemented:

- `apps/web/src/instagram/{contracts,config,provider,service,http,setup,openapi}.ts`: strict requests, same-origin authenticated mutations, internal admission, session-bound single-use ten-minute hashed OAuth state, server-side code/token/profile adapter, eligibility checks, safe outcome redirects and no-store responses.
- Migration **015-instagram** adds strict connection/state/command collections; unique owner/account indexes, hashed state TTL and durable owner/idempotency receipts. Included in `db-setup.ts` and the disposable `auth-local.ts` launcher. No migration was applied to Atlas in this milestone.
- AES-256-GCM token encryption uses random nonces, versioned key ring and owner/connection authenticated data. Token values never appear in the public contract. Explicit HTTPS same-origin callback and Graph version are required; incomplete configuration disables connect.
- OAuth epoch fences newer attempts/disconnects against delayed callbacks. Account switches advance destination epoch; same-account reconnect does not. Cross-owner account collisions return a generic unavailable outcome.
- Disconnect uses revision CAS and atomic durable command receipts. Same-key replay cannot disconnect a newer connection. Matching browser receipts remain in owner-scoped sessionStorage after unknown outcomes; explicit conflicts require reload/review.
- `scripts/instagram-refresh.ts`: operator-run refresh for eligible expiring tokens, with age check, lease and token-revision fence. Delayed refresh cannot restore disconnected credentials. Failure/expiry requires reconnect. No recurring job was deployed.
- `/settings/instagram` and `components/instagram/{controller,connection}`: connected identity, availability/expiry, reconnect, confirmation/cancel/disconnect, pending recovery, callback feedback, private-session boundary, Settings entry and owned-project return link. Downloads remain independent. Native Settings link preserves existing unload protection for unsaved preferences.
- Next development callback request logging suppressed. Production proxy/APM query redaction is an operator requirement before live authorization; no production environment was changed.
- `.env.example`, README operator guidance, API/DB implementation notes and generated OpenAPI updated. No saved credentials, private media or real account data added.

Verification:

- `npm run test:instagram --workspace apps/web`: **14/14**, isolated MongoDB 8 replica set. Migration replay/strict schema; ciphertext tamper/owner binding/key rotation; session mismatch/replay/expiry/cancel; ownership; account epochs; disconnect vs delayed callback; same-key concurrent disconnect; refresh success/failure/expiry and disconnect race; HTTP auth/origin and safe redirects; provider fixture host/scope/error checks.
- `npm run test:instagram-ui --workspace apps/web`: **5/5**, pending reload/exact replay, conflict review, storage failure, owner separation, malformed/disposed outcomes and redirect allowlist.
- Existing project/OpenAPI tests **17/17**, preferences UI/controller **8/8**, root prototype/rendering tests **41/41**. Total distinct tests run: **85**.
- Both TypeScript checks passed; production Next build passed. Final web typecheck rerun after refresh tests and local-launcher wiring. `git diff --check` passed.
- Isolated local browser fixture on port 3108: sign-in; Settings → connection; labelled connected Creator identity; unavailable configuration disabled reconnect; explicit disconnect confirmation/cancel; confirmed disconnect; reload retained disconnected state. Mobile 390×844 had no horizontal overflow. Screenshots: [desktop](design/verification/f18-instagram-desktop.png), [mobile](design/verification/f18-instagram-mobile.png). Only synthetic fixture data, no Meta calls. Temporary test server/database/browser tab removed after checks.

Limits / next acceptance:

- Real Meta app ID/secret, professional test account role, exact registered HTTPS callback and live provider response/Graph-version compatibility remain unverified. Direct Meta docs were rate-limited (HTTP 429); Postman’s full document was not available through the text viewer. README records primary reference entry points and does not claim the adapter was live-verified. No external app setup, permissions grant or deployment was performed.
- `publishingAvailable` is always false. F18 refuses changes when any future nonterminal publish intent exists. F19/F20 must add transactional pause/reconciliation and retained submission credentials before enabling posting/scheduling; no fake pause counts or claimed reconciliation implementation.
- Disconnect removes this workspace’s saved token; it does not revoke Instagram-side app authorization or delete posts. Operator refresh is implemented, automatic hosted scheduling is not.
- Existing hosted media/compute and subjective listening checks remain pending. Independent QA/code review of F18 is still needed before progression.


## F18 — live setup started, browser prerequisite pending (October 7, 2026)

- After the user completed Facebook login and explicitly authorized accepting Meta's creation terms, created the separate **NamasteVideo.ai** Meta app, ID `28596164173368598`. Existing NamasteDev app was not modified. The new app remains unpublished and has no business portfolio connected.
- Selected the Instagram content-management use case. Added `instagram_business_basic` and verified its **Ready for testing** status. Clicked Add for `instagram_business_content_publish`; its final status still needs verification.
- Current app navigation exposed only **API setup with Facebook login**; direct Instagram Login configuration still needs resolution. Did not substitute Facebook Login credentials or change the application adapter.
- Official Instagram setup documentation became readable in the logged-in browser. No real authorization code exchange, token storage, account connection, or posting was completed.
- Opened Vercel dashboard for HTTPS setup; browser is on Vercel's login page. No deployment or DNS changes were performed.
- Browser control then returned “Please update the ChatGPT extension in Google Chrome to the latest version to continue.” Resume after the extension update and Vercel login. No secrets were collected or written to environment files. Live F18 remains pending.

## F18 — HTTPS development deployment and Atlas setup (October 7, 2026)

- Browser control recovered after the extension update. Located the logged-in NamasteAI Vercel workspace in the user's other Chrome profile.
- User explicitly approved deploying the testing site and storing its MongoDB/authentication/Instagram configuration in Vercel. Deployed `namaste-video-ai-dev` from `dev` commit `d2d4b63`, root `apps/web`; Vercel reported Ready. HTTPS address: https://namaste-video-ai-dev.vercel.app. Set this project's production-environment branch tracking to `dev`; `main` remains unchanged. Subsequent dev pushes can trigger this testing deployment.
- Configured the existing development MongoDB URI/database and Better Auth secret as sensitive server environment variables, with the exact hosted Better Auth origin and Vercel's forwarded-client-IP header. No provider, R2 or Instagram secrets have been uploaded in this checkpoint. Local loopback environment remains unchanged.
- Ran `npm run db:setup --workspace apps/web` against the configured Atlas development database: all migrations completed, including `015-instagram`; zero project-flag repairs or video backfills. Hosted browser sign-in with an existing dummy account reached the authenticated My Videos workspace after session validation. This is not an end-to-end hosted rendering/media test.
- The first Meta app still exposes only Facebook Login setup. Following Meta's documented Other → Business → Instagram product creation path, and after separate explicit terms approval, created replacement **NamasteVideo Connect**, app ID `1318790197986622`, in Development mode without a business portfolio. Added the Instagram product. This app also exposes only API setup with Facebook login; direct Instagram Login setup remains unresolved. Original apps were preserved.
- No Instagram credentials were substituted, callback registered, live OAuth exchange completed, token saved, or post published. The HTTPS prerequisite is complete; full live Instagram authorization remains pending the missing direct-login setup and provider compatibility verification. Hosted media/compute and listening review remain separate pending checks.
- No application code changed. Vercel production build succeeded; database setup and hosted sign-in were the relevant live checks. Local screenshots are ignored under `apps/web/runs/` (deployment success, replacement-app confirmation and missing direct-login navigation); no credentials were added to repository evidence.

## F18 — Instagram tester invitation accepted (October 7, 2026)

- After explicit user approval, added the user's logged-in Instagram account as an Instagram Tester of NamasteVideo Connect. Verified Meta displayed the invitation as Pending. After separate approval of the displayed Platform Terms and Developer Policies, accepted the invitation in Instagram's Apps and websites → Tester Invites.
- Instagram now displays NamasteVideo Connect-IG as authorized on October 7, 2026. Reloaded Meta's app roles and verified the tester remains listed without Pending status. Acceptance evidence is local and ignored: `apps/web/runs/meta-tester-accepted.png`.
- Reopened the Instagram product navigation after refreshing: it still exposes only API setup with Facebook login. The hypothesis that accepting the tester invitation would expose direct Instagram Login was not confirmed. Direct-login credentials and callback configuration remain unavailable through the observed UI.
- This is tester-role acceptance, not successful NamasteVideo dashboard OAuth: no authorization-code exchange, encrypted connection token, or publishing check was completed. No posts published, application code or environment settings changed. Browser state checks were the relevant verification; automated application tests were not rerun for this documentation-only checkpoint.

## F18 — documented provider compatibility and Facebook Login investigation (October 7, 2026)

- User requested further research and active browser setup. Read Meta's current Business Login and Get Started documentation in the logged-in browser and Meta's official Instagram Postman collections. Both direct Instagram Login and Facebook Login support professional accounts and publishing; the latter requires a linked Facebook Page. The missing direct-login panel remains unexplained: both existing test apps still expose only Facebook Login, and a direct setup route did not expose configuration. No additional app was created or switched to Live.
- Fixed concrete document compatibility gaps in `apps/web/src/instagram/provider.ts`: short-token and profile responses accept a flat object or exactly one result under `data`; empty, multiple, mixed and malformed envelopes are rejected. Required scope checks remain. Added explicit documented `Business` / `Media_Creator` mappings alongside previously accepted uppercase values, and replaced undocumented `force_authentication` with `force_reauth=true`. Long-token/refresh behavior is unchanged.
- Added `apps/web/tests/instagram-provider.test.ts` to `test:instagram`. **24/24 tests passed** (14 existing database/integration tests and 10 new provider tests), web typecheck passed, and `git diff --check` passed. Tests cover all flat/wrapped combinations, request contract, scope rejection, invalid envelopes, account-type mapping/rejection and existing refresh. Initial sandbox run could not bind the disposable MongoDB port; the approved rerun passed. No live provider response is represented by these fixtures. README now links verified primary documentation and distinguishes the unsupported Facebook adapter path.
- Browser confirmed the user's Facebook Page and Instagram professional account are already linked in Meta Business Suite. In the existing **NamasteVideo.ai** app (`28596164173368598`), enabled only `instagram_basic`, `instagram_content_publish`, `pages_read_engagement` and `pages_show_list`; each displayed Ready for testing. Created **NamasteVideo Instagram Test**, configuration ID `1404290674658268`, General variation with a User access token and those four permissions. This only configures the permission request; it does not grant access to an account. No messages, comments or business-management permissions requested.
- Graph API Explorer now enables token generation using this configuration and successfully opened the real Facebook Login consent screen for NamasteVideo.ai. Account consent is pending explicit user confirmation before the read-only API check. Local ignored screenshots: `apps/web/runs/meta-facebook-login-config-created.png` and `meta-facebook-consent-review.png`.
- Full dashboard connection remains incomplete. Facebook Login requires a separate adapter, Page selection, token handling and migration; no Facebook credentials were substituted into the direct-login adapter. No token persisted, callback registered for Facebook Login, live API read completed, post created or published in this checkpoint. Vercel's authorized development deployment may rebuild on the dev push; no full hosted acceptance is claimed.

## F18 — live Facebook Login authorization and Instagram API checks passed (October 7, 2026)

- After the user's explicit approval of the account-access request, completed Facebook Login for **NamasteVideo.ai** using configuration `1404290674658268`. Selected only the approved existing Facebook Page and Instagram account; disabled the default opt-in to all current/future assets. Meta displayed its successful connection confirmation. This authorization used Graph API Explorer's callback, not the NamasteVideo dashboard callback.
- With the resulting user token, real Graph API **v26.0** read-only checks passed: `/me/permissions` showed all four requested permissions granted (plus automatic `public_profile`); direct lookup of the approved Page returned its linked Instagram ID; querying that Instagram ID returned the expected username; `/content_publishing_limit?fields=config,quota_usage` returned usage **0**, total **100**, duration **86400 seconds** at the time of the check. This proves live authorization and those API reads, not successful future media upload or publication.
- `/me/accounts` returned an empty list. Verified Meta's official [v17 User Accounts changelog](https://developers.facebook.com/docs/graph-api/changelog/version17.0#user-accounts) in the browser: business-linked Pages require `business_management` and a role on the business for this discovery edge. That permission was not granted. Direct lookup of the approved known Page succeeded, so the empty list did not block identity/readiness checks. Before dashboard implementation, choose an explicit known-Page entry flow or obtain informed consent for the additional discovery permission; never silently grant broader access or silently select a destination.
- Tokens stayed in Meta's browser-based API Explorer and transient browser-control memory. No token, app secret or account credential was written to source, logs, status, screenshots, local environment or the application database. Captured token-free evidence under ignored `apps/web/runs/`: `meta-facebook-connected.png`, `meta-instagram-api-profile-verified.png`, `meta-instagram-api-quota-verified.png`. API screenshots crop out the token control. No media container or post was created, no social content published, and no unrelated Page/account authorized.
- Direct Instagram Login's missing setup remains unresolved, but the Facebook Login route is now verified with real account authorization and reads. Next work is the separate Facebook provider, secure code exchange and Page-token handling, destination selection, persistence migration and dashboard integration. The existing F18 app still implements direct Instagram Login only; F19 publishing remains unimplemented. No test-only token was inserted as a fake completed dashboard connection.
- No application code changed in this checkpoint; live browser/API reads are the relevant checks. Retried the earlier GitHub synchronization successfully: provider-fix commit `deaffbc` was pushed and its exact remote dev hash verified. `main` remains unchanged.

## F18 — Facebook Login dashboard implementation and hosted configuration (October 7, 2026)

- Continued the user's request to establish the complete connection after the successful Meta API Explorer checks. Implemented the separate Facebook Login route while preserving direct Instagram Login. Added explicit numeric linked-Page selection before authorization, configured-provider headers, provider-specific redirect allowlists, connected Page identity, honest Professional account labelling and no-scheduled-expiry explanation. No business-management scope was added; no Page ID/account is hardcoded in application code.
- Provider exchanges code → short user token → long user token, verifies all four user grants, retrieves the selected Page token/link, introspects Page validity/app/type/scopes/expiry and reads the linked Instagram identity. Only the Page token is encrypted and stored. User tokens and raw provider diagnostics are not persisted. Bounded responses, shared timeout, fixed endpoints, sanitized error categories and no automatic code replay. A live read verified `account_type` is unsupported on Facebook's IG User edge; eligibility is established by the linked Page.
- OAuth receipts pin provider/app/Page. Callback rejects changed configuration and mismatched grants; destination epoch tracks provider/app/Page/account changes. Facebook Page expiry derives from verified token/data-access timestamps, including explicit no-scheduled-expiry; it never enters direct Instagram refresh. Old unbound records/receipts require a new connection. Existing session, owner, encryption, state expiry, disconnect recovery and concurrency fences remain.
- Migration **016-instagram-facebook** upgrades the exact reviewed 015 validators without changing 015's definitions/checksum or deleting existing records. Strict provider/token-kind/Page combinations; existing indexes retained. Applied successfully to the development Atlas database using the approved operator setup; no project repairs/video backfills were needed.
- Registered the exact testing callback `https://namaste-video-ai-dev.vercel.app/api/instagram/callback` in the NamasteVideo.ai Meta app. Configured eight server-only Instagram settings as Vercel Secret variables in the approved test project's Production environment (tracking dev). No production/public app launch or social publication. Local server configuration is preserved; a mode-0600 ignored hosted configuration file is retained under `apps/web/runs/`.
- Credential-handling incident: Vercel's environment editor exposed secret values in a tool snapshot during save verification. Informed the user immediately. The user reset the Meta app secret; replaced the unused encryption key and updated both in Vercel/local ignored configuration before any dashboard token was encrypted. Replacement values were not displayed. No credential was committed. Later verification uses booleans/field labels only while secret inputs are present.
- Verification: **46 Instagram tests** (22 service/database, 10 direct provider, 14 Facebook provider), **11 UI/controller tests**, **17 project/API/OpenAPI tests**, **41 prototype/rendering tests**: **115 passed**. Both TypeScript checks, production Next.js build and diff checks passed. Tests include applied-015 upgrade/replay/data preservation, config/Page binding, cross-owner/epoch/race protection, no-expiry/expiry, direct-only refresh, malformed/denied provider responses, strict redirect validation and recovery. Independent review found no actionable service/migration issue.
- Files: Instagram config/provider/contracts/service/HTTP/schema/OpenAPI; new Facebook adapter and provider tests; UI/controller and tests; package test command; environment example; generated OpenAPI; README/API/DB docs and this record. Browser proof of full dashboard authorization remains pending deployment in the next checkpoint. Publishing/scheduling, hosted media/compute and listening remain separate pending milestones.

## F18 — full hosted dashboard connection verified (October 7, 2026)

**Result: live connection passed through the application's own OAuth callback.** Vercel reported Ready for `4a9b2a3` on the approved testing project, and remote dev matched that exact commit. `main` remains unchanged.

- Signed-in Test Creator One workspace loaded the new Facebook flow. Entered the previously approved Page ID, started Connect Instagram, and continued Meta's existing consent settings for the same app/assets/scopes. No additional permission or account was selected.
- Meta returned to the registered NamasteVideo HTTPS callback. The production adapter completed its real code exchange, long-user exchange, permission checks, selected Page-token lookup, introspection and Instagram profile lookup. The dashboard showed the expected Instagram username, linked Page and connected status. Navigating to a clean settings URL without the callback outcome retained that identity and connection.
- Independently read the saved Atlas record, decrypted its `facebook_page` token in memory using the replacement encryption key, and made one read-only `content_publishing_limit` call to Meta. It succeeded: quota usage 0, quota total 100, duration 86400 seconds at verification. Stored revision 2, destination epoch 1; effective provider/data-access expiry January 5, 2027. No raw token, ciphertext, app secret or provider body was printed by this verification script.
- The active replacement Meta secret and encryption key are verified by successful hosted exchange and independent decryption. The earlier credential-handling incident and remediation remain documented above. Ignored local evidence: `apps/web/runs/instagram-dashboard-connected.png`, `vercel-instagram-secret-settings.png`, `meta-facebook-callback-saved.png`. Hosted configuration and read-only verification helper remain ignored with private configuration permissions.
- **Limits:** app remains unpublished/development access for approved roles; general-user App Review is not complete. No media container or Instagram post was created. Posting/scheduling remain F19/F20, and hosted media/compute and subjective listening remain pending. This acceptance establishes real dashboard authorization, encrypted persistence, reload recovery and a read-only Page-token API call; it does not claim a Reel publication test or a fresh full mobile/independent QA run.

## Settings laptop layout fix — implementation (October 7, 2026)

- Reproduced the user's report on the hosted Settings page at a 1728px viewport: sidebar occupied the full width at y=0; content began below it at y=276.5. The wrapper was `library-shell` with computed `display:block`.
- Cause: both personal Settings and Instagram Settings omitted `library-base`, the shared responsive two-column grid used by My Videos. Added that class to their existing wrapper; preserved the existing Cinema CSS and its 760px mobile breakpoint. No settings, authentication or Instagram behavior changed.
- Files: `apps/web/components/preferences/settings.tsx`, `apps/web/components/instagram/connection.tsx`, this status record. Web typecheck, existing preference/controller tests **8/8**, Instagram/controller tests **11/11**, and `git diff --check` passed. No implementation-mirroring test added for the two-class correction. Hosted laptop browser verification follows the authorized dev deployment.

### Settings layout — hosted verification passed

- Verified deployed fix `68549a0` on both `/settings` and `/settings/instagram`. At 1024px, sidebar is 200px wide and content starts at x=200; at 1280px and 1440px, sidebar is 240px wide and content starts at x=240. Both share y=0 with computed grid layout. Document width stays within the viewport at every checked width; no horizontal overflow.
- Personal preference fields and the existing connected Instagram identity loaded normally; no save, disconnect, reconnect or provider operation was performed. Visually inspected the 1280px Settings screenshot, retained locally under ignored `apps/web/runs/settings-laptop-fixed-1280.png`.
- Restored browser viewport to its original 1728px size and closed the temporary QA tab. Existing app tab remains open. Test/typecheck evidence remains **19/19 plus web typecheck** above. GitHub dev matched the fix commit; main unchanged. No new mobile or unrelated feature QA is claimed.

## Uninterrupted session checks — implementation (October 7, 2026)

- Routine 60-second, foreground and reconnect checks now keep confirmed workspace content mounted and visible. They no longer replace the dashboard or move keyboard focus. Concurrent checks share one request; a 10-second timeout shows a non-blocking connection banner and retries after 15 seconds. Known session expiry still hides private content immediately; every API continues enforcing server authorization.
- Initial entry, route reactivation, browser history restoration and cross-tab authentication changes remain gated behind fresh validation. Replaced the black checking screen with a Cinema dashboard skeleton. Failed guarded checks cannot reveal cached identity; stale responses cannot undo invalidation. Retained dialog/control selection restoration for checks that must hide content.
- Successful sign-in/sign-out broadcast an identity-free invalidation marker through BroadcastChannel and localStorage, deduplicated across transports. Restricted browser storage is best-effort and cannot prevent auth navigation. No credentials or identities are put in the marker.
- Files: private-session/sign-in-form, new session-controller/session-events helpers, Cinema CSS, session regression tests and web test script. Controller coverage includes background continuity, retries, timeout, expiry, 401/403, changed identity, history invalidation, stale results, disposal and cross-tab transport cleanup.
- Verification: **31/31** session, preferences and Instagram controller/UI tests passed from the web workspace; web typecheck and diff whitespace check passed. An initial root-directory test invocation used the wrong JSX configuration; rerunning from apps/web passed. Hosted browser focus/poll verification follows the dev deployment. No live cross-tab sign-out or playback review claimed yet.

### Session experience — hosted browser verification

- Vercel reported implementation commit `797a5ad` Ready. Reloaded the testing dashboard and observed the new “Loading your workspace” skeleton followed by Test Creator One's workspace.
- Opened New project without submitting, entered labelled unsaved text, and left the visible tab open for **82.5 seconds**, spanning the 60-second poll. At the checkpoint the dialog remained visible, `project-title` retained focus and its exact text, and the checking screen was absent. Escape then dismissed the dialog normally. No project was created or existing user data changed.
- Local screenshot: ignored `apps/web/runs/session-background-check.png`. Negative outcomes and transport deduplication are covered by the 12 new automated regressions; live sign-out across tabs, offline injection and video playback were not exercised in this browser check. Implementation push was verified against GitHub dev; main remains unchanged.


## Hosted video completion — deployment preparation (October 7, 2026)

- User accepted the session fix's quick QA and approved the hosted generation/delivery milestone before F19. Scope is the existing storyboard/generation workers, Linux rendering and private gateway through browser playback/export. F19/F20 are not started. Reconciled the stale opening/F18 table against the retained successful hosted authorization evidence.
- Added portable non-root Debian/Node 24 Docker packaging for two isolated queue-process roles, image-time Remotion browser setup, tini process-group shutdown, allowlisted build context and role-specific environment filtering. No secrets, private media or migration credentials belong in the image/runtime. Added Render deployment proposal with one instance per role, manual deployments and 300-second shutdown grace; not deployed.
- Found an actual Linux blocker: existing ffprobe resolution assumed `compositor-linux-x64`, but the installed package contract is `compositor-linux-x64-gnu`. Shared resolver now handles Debian Linux x64/arm64 and preserves macOS; local narration and root media probing both use it. Unsupported platforms fail explicitly.
- Render is recommended based on documented Docker background workers. Browser-verified current list pricing: 2 CPU/4 GB renderer $85/month and 512 MB storyboard worker $7/month, before other usage/provider charges. This is a proposed benchmark allocation, not a proven memory requirement. User requested a hosting recommendation; new paid service creation and credential transfer need concrete approval.
- The generation dispatcher now stops claiming additional queued work after a shutdown signal; a claim racing shutdown is returned to pending without invoking the renderer/provider. Existing current-job fencing and unknown-outcome behavior remain unchanged.
- Verification: role environment tests **3/3**, root renderer/prototype suite **43/43**, storage suite **19/19**, generation/job suite **39/39**, both TypeScript checks passed. Credential-free local audio/Chromium startup preflight passed; the Docker build runs that same preflight before runtime secrets are supplied. Actual installed macOS ffprobe executes with the new resolver. Docker is absent on this host; no Linux image build, container render, hosted resource benchmark or lifecycle test is claimed. Deployment instructions and acceptance criteria are in `apps/worker/README.md`.
- Remaining: host account/cost approval, Linux image verification, worker secret configuration, live media gateway deployment/configuration, full hosted generation-to-playback/export and listening acceptance. This milestone remains **in progress**, not complete. No provider calls, new paid services or Instagram publications occurred in this preparation step.

## Google Cloud Run setup — account verification checkpoint (October 7, 2026)

- User selected Cloud Run Jobs instead of Render and authorized browser setup in Chrome Person One. Created and verified the isolated project `namastevideo-dev-20261007` (NamasteVideo Dev). Render proposal is superseded; no Render services exist from this work.
- No active billing account was listed. Prepared NamasteVideo Pilot billing setup with the existing Google payments profile. User explicitly approved “Submit and enable billing” while requiring a pause before running billable workloads. Submission reached a payment-provider verification dialog; activation/linkage is **not yet verified**. Browser is handed to the user for bank verification. No OTP/card data is copied into source, logs or this record.
- Added a bounded Cloud Run entry point taking exactly one persisted `job_…` ID and explicit generation/storyboard role. Storyboard claiming/expiry can be scoped to that ID; it never falls through to unrelated queued work. Existing continuous local entry points remain available. Docker's default now fails closed without a supplied valid job ID rather than starting an endless poller. No dashboard Cloud Run dispatch is claimed implemented.
- Local verification: invocation/environment suite **6/6**, storyboard suite **71/71** and web typecheck passed. No live provider call, cloud build, job execution, secret transfer, service-account grant or media deployment was performed in this checkpoint.
- Pending: user bank verification, verified project billing linkage, narrow IAM/secret configuration, explicit authorization before billable image build/execution, Linux runtime benchmark, durable dashboard triggering/reconciliation, private gateway and end-to-end media checks. Hosted milestone remains in progress. Local screenshot `apps/web/runs/cloud-payment-verification.png` is ignored and not committed.

## Google Cloud Run setup — billing and APIs verified (October 8, 2026)

- User completed bank/Aadhaar verification. Linked NamasteVideo Dev to the approved NamasteVideo Pilot billing account; Cloud Shell's read-only billing check returned `True`. The console shows a paid account; no trial credit or guaranteed zero-cost operation is claimed.
- Enabled Cloud Run, Cloud Build, Artifact Registry, Secret Manager and IAM APIs successfully. Created the empty private Docker repository `namastevideo-workers` in `us-central1`. No images were uploaded and no builds or jobs ran. No application secret was transferred or explicit service-account grant made.
- Added `apps/worker/cloudbuild.yaml`: public source clone, explicit reviewed commit checkout, existing allowlisted Docker build, one commit-tagged private image, Cloud Logging and a 1,200-second build timeout. Dedicated build identity is specified but not yet created/granted. README records the proposed repository-only Artifact Registry Writer plus project Logs Writer permissions; no runtime secrets or Owner/Editor role required.
- Verification: YAML parsed locally and its bounded/no-secret build structure checked; `git diff --check` passed. This is configuration preparation, not Google validation or a Linux build success. No application code changed, so earlier runtime test evidence is retained without claiming a new application QA run. Ignored screenshot: `apps/web/runs/cloud-billing-apis-ready.png`.
- Preserved the user's explicit pause before billable workloads. Next approval covers limited build identity grants and a single image build/storage operation; Cloud Run execution, runtime credential access, dashboard dispatch/reconciliation, private media gateway and hosted end-to-end acceptance remain pending. Milestone remains in progress.
