# Project Status — NamasteVideo.ai

Last updated: October 1, 2026 (Asia/Kolkata).

This is the source of truth for development progress. Specifications describe intent; a feature is complete here only when its implementation and verification are recorded. Design approval is not evidence of working functionality.

## Current checkpoint

**F04 — Done locally, including the P2 history-restoration session fix; user feedback pending.** The user approved F03 testing and code review on October 1, 2026. F04 is implemented and verified below. Wait for user feedback before F05. Hosted Atlas configuration remains outstanding.

Internal authentication APIs and initial database collections are implemented and tested locally. Cinema sign-in/recovery and a protected workspace entry are available. No project CRUD API, hosted rendering or Instagram integration exists yet; no hosted database has been provisioned. The local video pipeline remains separately usable.

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
| F04 | Sign-in/recovery UI and private route protection | Done locally; delegated testing passed, user feedback pending | 51 automated tests and prior types/build passed; delegated desktop/mobile browser and interactive operator recovery walkthrough passed; evidence below |
| F05 | Personal project create/list/rename/delete APIs | Planned | Ownership isolation, validation, pagination and deletion behavior tested |
| F06 | My videos library UI | Planned | Real project data, filters, load more, empty/loading/error states and rename/delete dialogs |
| F07 | Idea draft API, autosave and conflict handling | Planned | Persist topic/notes/voice; revisions; failed saves preserve input; cross-user checks |
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

## Earlier evidence

The local pipeline history is retained in PROTOTYPE_STATUS.md. It records three generated videos, Gemini/ElevenLabs integrations, timing checks, and renderer recovery tests. Those historical results are not evidence that a hosted pipeline or dashboard works. Existing design artifacts remain in design/SCREEN_REVIEW_INDEX.md; the founder approved proceeding with implementation on October 1, 2026, with background colors normalized to the Cinema tokens.

## Change log

| Date | Feature | Change | Verification |
| --- | --- | --- | --- |
| 2026-10-01 | F04 delegated testing | Completed requested desktop/mobile browser and interactive operator recovery walkthrough; saved two screenshots and results; user feedback pending before F05 | Sign-in/error/show-hide/help/private-route/sign-out checks passed; recovery mismatch rejected, successful recovery revoked old session/password, new password worked; local servers stopped; `git diff --check` passed |
| 2026-10-01 | F04 review fix | Revalidate cached private pages before display on mount/reactivation/history navigation; discard superseded session checks | 17 auth tests, 23 prototype tests, both typechecks, build and two-tab Back/logout + valid-session Back/Forward checks passed |
| 2026-10-01 | F04 | Implemented Cinema sign-in/recovery, private workspace guards and operator recovery; browser review pending before F05 | 51 tests, both typechecks, production build and desktop/mobile browser walkthrough passed; four screenshots saved |
| 2026-10-01 | F03 acceptance | User confirmed feature testing and code review; authorized F04 | User approval in this conversation |
| 2026-10-01 | F03 manual testing | Completed user-delegated interactive API checkpoint and additional negative/security checks; recorded evidence only; awaiting user feedback before F04 | `auth:verify` exit 0 with five PASS messages; extra origin/input/cookie/disabled-account/rate-limit checks passed; local servers stopped; documentation checked with `git diff --check` |
| 2026-10-01 | F03 | Implemented internal authentication backend, operator account tools and disposable user-testing commands; waiting for user test before F04 | 14 auth/HTTP tests, 11 database tests, 23 prototype tests, typechecks and production build passed; user acceptance pending |
| 2026-10-01 | F02 | Completed local MongoDB foundation, initial schemas/indexes, operator setup and configuration documentation | 11 database tests, 23 prototype tests, both typechecks and production build passed on Node 24; hosted Atlas setup outstanding |
| 2026-10-01 | Branch workflow | Created `dev` from the published initial scaffold and made it the active development branch; documented milestone pushes to `dev` and approval before promotion to `main` | Clean starting tree; remote had no `dev`; documentation-only change, checked with `git diff --check`; remote branch equality verified at handoff |
| 2026-10-01 | Repository setup | Prepared initial public repository snapshot of the prototype, scaffold, specifications and design evidence; added standing milestone commit/push workflow | Remote confirmed empty; publishable text scanned for common credential patterns with no matches; environment and generated-media exclusions verified; F01 checks above remain applicable (no runtime code changed). Push result is verified against the remote and reported at handoff. |
| 2026-10-01 | F01 | Completed isolated Next.js scaffold, Cinema primitives, runtime configuration and status workflow | Node 24 production build, both typechecks, 23 tests, HTTP boundary checks and desktop/mobile review passed; evidence above |
