# Project Status — NamasteVideo.ai

Last updated: October 6, 2026 (Asia/Kolkata).

This is the source of truth for development progress. Specifications describe intent; a feature is complete here only when its implementation and verification are recorded. Design approval is not evidence of working functionality.

## Current checkpoint

**F11b2 — revision dashboard controls implemented; ready for independent QA.** User accepted F11b1 API/worker QA. The Cinema panel now submits whole-story/scene-scoped requests, recovers exact pending commands, shows changes/parent history and retains explicit working-copy replacement. Manual edited-source snapshots remain F11b3, approval F11c. Full browser generation/mobile QA remains pending.

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
| F11b2 | Revision dashboard controls | Implemented; awaiting QA/review | 30 UI/controller tests, types/build, 23 prototype tests; limited browser panel/guard checks below |
| F11b3 | Edited-source snapshots | Planned | Make manually edited working copies immutable revision sources without losing edits |
| F11c | Immutable storyboard approval | Planned | Exact-version approval and integration boundary for later rendering |
| F12 | Private R2 asset adapter and media access | Planned | Private upload/read, owner-authorized access, expiry and missing-asset behavior |
| F13 | Durable generation job orchestration | Partial: local storyboard queue brought forward; hosted jobs planned | Inngest integration, one active job, deduplication, progress and cancellation |
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
