# Project Status — NamasteVideo.ai

Last updated: October 1, 2026 (Asia/Kolkata).

This is the source of truth for development progress. Specifications describe intent; a feature is complete here only when its implementation and verification are recorded. Design approval is not evidence of working functionality.

## Current checkpoint

**F02 — MongoDB foundation: Done (local verification).** Server-only connection, initial strict schemas/indexes and operator setup pass real replica-set tests. Hosted Atlas configuration remains outstanding. Next feature: F03, internal account admission and sessions.

No application authentication, project CRUD API, hosted rendering or Instagram integration exists yet. Initial database collections are implemented and tested locally; no hosted database has been provisioned. The local video pipeline predates the application and remains separately usable.

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
| F03 | Internal account admission and session backend | Planned | Better Auth, provision approved users, no public signup, login/logout and disabled-user tests |
| F04 | Sign-in/recovery UI and private route protection | Planned | Approved sign-in flow; generic errors; expired session; private pages inaccessible anonymously |
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

## Earlier evidence

The local pipeline history is retained in PROTOTYPE_STATUS.md. It records three generated videos, Gemini/ElevenLabs integrations, timing checks, and renderer recovery tests. Those historical results are not evidence that a hosted pipeline or dashboard works. Existing design artifacts remain in design/SCREEN_REVIEW_INDEX.md; the founder approved proceeding with implementation on October 1, 2026, with background colors normalized to the Cinema tokens.

## Change log

| Date | Feature | Change | Verification |
| --- | --- | --- | --- |
| 2026-10-01 | F02 | Completed local MongoDB foundation, initial schemas/indexes, operator setup and configuration documentation | 11 database tests, 23 prototype tests, both typechecks and production build passed on Node 24; hosted Atlas setup outstanding |
| 2026-10-01 | Branch workflow | Created `dev` from the published initial scaffold and made it the active development branch; documented milestone pushes to `dev` and approval before promotion to `main` | Clean starting tree; remote had no `dev`; documentation-only change, checked with `git diff --check`; remote branch equality verified at handoff |
| 2026-10-01 | Repository setup | Prepared initial public repository snapshot of the prototype, scaffold, specifications and design evidence; added standing milestone commit/push workflow | Remote confirmed empty; publishable text scanned for common credential patterns with no matches; environment and generated-media exclusions verified; F01 checks above remain applicable (no runtime code changed). Push result is verified against the remote and reported at handoff. |
| 2026-10-01 | F01 | Completed isolated Next.js scaffold, Cinema primitives, runtime configuration and status workflow | Node 24 production build, both typechecks, 23 tests, HTTP boundary checks and desktop/mobile review passed; evidence above |
