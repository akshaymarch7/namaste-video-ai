# F22 — Internal release acceptance

Status: in progress. This is a release gate, not a claim that all live flows passed.
`PROJECT_STATUS.md` remains the authoritative implementation/evidence record.

## Repeatable local gate

With Node 24 and installed dependencies, from the repository root:

```sh
npm run typecheck
npm run typecheck:web
npm run test:acceptance
npm run build
```

The acceptance command discovers all root/web `*.test.ts` files, runs them
sequentially to limit disposable MongoDB resource contention, checks worker
credential/invocation boundaries and fully decodes the public homepage videos.
It stops on failure and writes durations/exit statuses to ignored
`runs/acceptance/latest.json`. It strips inherited provider/database credentials
and `NODE_OPTIONS`; tests configure their own local fixtures. It does not load an
environment file. MongoDB binary download and temporary loopback listeners may
require sandbox/network permission. This is not a network isolation mechanism.
The ordinary Next build uses its normal local environment configuration.

A green gate establishes regression behavior under fixtures. It does not prove
live provider quality, live Meta delivery, browser usability or cloud deployment.
Do not publish the raw local test output without reviewing it.

## Evidence and remaining release gates

| Requirement | Existing evidence | Remaining acceptance |
|---|---|---|
| Private workspaces/auth | Auth/project/storage/storyboard/job/Instagram/publishing suites exercise ownership and disabled sessions; prior browser QA | Hosted two-account walkthrough of project, version, media and destination denial |
| Idea → review → export | Feature QA through F17; accepted 77.013333-second hosted water-cycle export | Representative topic evaluation below; record new deployment revision if retested |
| Recovery and races | Autosave, session, storyboard, jobs, caption/video and publishing fixtures; prior real reload/lost-response QA | Controlled hosted outage/recovery drill before continuous operation |
| Hosted generation/media | October 8 bounded Cloud Run, Atlas, R2, authenticated playback/download and user review passed | Rebuild renderer with F19 projections before resuming alongside publication; no ongoing activation yet |
| Publish now | F19 local UI/API/worker QA with simulated Meta | Exact-account/video/caption approved live post; verify remote permalink and app state |
| Schedule | F20 local DST, replacement, cancellation and due/expiry QA | Approved timed real post with browser closed and independent scheduler |
| Accessibility | F21 responsive, keyboard and reduced-motion QA; earlier feature checks | Screen reader, Safari and end-to-end keyboard review |
| Voice offering | Daniel test voice accepted for pilot | Indian male/female voices unavailable/unverified; do not advertise them as enabled |
| Operating permission | Internal-only admission, no billing/public signup | Confirm actual team/provider license eligibility and nominate operating owner |

## Representative content evaluation

All rows below are **pending** as a 20-topic release evaluation. Historical
water-cycle success is useful evidence, not a pass for this entire matrix.
Each run needs: project/version IDs, exact provider/model/voice, wall time,
output duration, attempt count, technical QA, factual reviewer, listening review,
and visual/caption assessment. Capture sanitized errors and whether a retry made
a second provider call. Keep private outputs in authorized storage, not Git.

| # | Input | Primary check |
|---|---|---|
| 1 | Water cycle | Cyclic arrows and evaporation/condensation order |
| 2 | Photosynthesis | Inputs/outputs and scientific accuracy |
| 3 | Bicycle brakes | Mechanism causality without misleading diagram |
| 4 | Renewable vs nonrenewable energy | Balanced comparison and readable labels |
| 5 | RAM vs storage | Temporary/persistent distinction |
| 6 | Butterfly life cycle | Ordered stages and cycle |
| 7 | Supplied four-event historical timeline | Supplied dates retained; no invented events |
| 8 | Binary search on a supplied sorted array | Correct midpoint and elimination |
| 9 | Probability of a fair six-sided die | Fractions/percentages and no certainty claims |
| 10 | Thermostat feedback loop | Negative feedback direction |
| 11 | Supplied chart: A=10, B=20, C=30 | Chart proportions/units match supplied data |
| 12 | 18% of ₹1,000 | Correct arithmetic, currency and pronunciation |
| 13 | HTTP, CPU and RAM | Acronym narration and captions |
| 14 | Bengaluru, Chennai and Thiruvananthapuram | Names/listening and pronunciation revision |
| 15 | 1,00,000 vs 1,000,000 | Indian notation and spoken quantity |
| 16 | 5 km and 500 m | Units, conversion and caption notation |
| 17 | x² + y² = z² | Mathematical text and explanation limits |
| 18 | Explain all of science | Clarification or coherent bounded scope |
| 19 | Supplied contradictory statements | No silent false reconciliation |
| 20 | Overlong request for unsupported photorealistic simulation | Clear limits/validation; saved input survives |

For each valid supported topic, require 60–90 seconds, complete intelligible
narration, factual and legible visuals, synchronized captions, and no overlaps.
For deliberately unsupported inputs, safe actionable refusal or clarification is
acceptable; silently fabricated diagrams or a stuck request are not. Record
observed median/range only after collecting measurements; no latency SLA is
inferred from a single successful render. Do not trigger 20 paid runs implicitly.

## Existing cloud benchmark baseline

These are historical October 8 observations, not a new run or an SLA:

| Measurement | Observed result |
|---|---|
| Silent 72-second render, 2 CPU / 4 GiB | 128.5 seconds rendering; 166.441 seconds execution creation to completion |
| Silent benchmark memory | Cgroup peak about 1.67 GiB |
| Real 77.013333-second narrated video | About 255 seconds from requested to completed |
| Hosted media | Full browser playback, MP4/VTT hash matches, H.264/AAC full decode |

Source: Project Status, “Regional startup workaround and east-region render verified”
and “Hosted live activation — end-to-end technical acceptance passed.” Preserve
the four-GiB allocation until a reviewed benchmark establishes a safe lower one.

## Controlled hosted rollout

October 8 continuation: migrations 018–019 passed live; commit `2ddc9e5` is
already serving the testing domain via Vercel Git auto-deploy. Both execution
endpoints were verified disabled. The two-account HTTP/browser denial checks
passed. @namastevideoai conversion and its new Facebook Page were approved and
created. The user subsequently rejected the Facebook Page flow: leave that Page
unlinked and complete direct Instagram Login instead. Direct product credentials,
OAuth acceptance and publication remain pending. User permits free allowances
only. Do not waive the 20-topic evaluation or infer zero future cost from rounded
billing totals.

The current hosted flags/scheduler state must be checked again at execution time.
The historical baseline is publishing disabled, generation disabled, rendering
scheduler paused, migrations through 017 and an older rendering image.

1. Choose the reviewed `dev` commit and obtain deployment approval. Keep both
   execution flags disabled. Check active/unknown jobs and intents before changes.
2. Apply additive migrations 018 and 019 using the existing database setup flow;
   inspect applied versions/index validation. Never downgrade collections on rollback.
3. Deploy the reviewed web source to the existing Vercel testing project; verify
   sign-in, two-account isolation, private media access and homepage. Do not merge
   to `main` or enable public registration as part of this step.
4. Configure the separate server-only publishing scheduler secret and a **paused**
   once-per-minute empty POST to `/api/internal/publish-tick`. Preserve the media
   gateway and Instagram keyring. Never log tokens or reuse the render secret.
5. Review the existing destination connection and exact approved video in the
   app. Obtain approval for each real post's account, version, caption and time.
   Agree a bounded execution window. Only then enable publishing/resume its tick.
6. Verify one immediate and one scheduled test (or separately approve each).
   Observe confirmed Meta ID/permalink, exact account/content, app/library state,
   and no duplicate submission. Close the browser for the scheduled check.
7. Disable publishing and pause its scheduler at the end of the agreed window.
   Inspect unresolved intents; remote submission is not undone by disabling.
   Deliberately reconcile unknown outcomes read-only; never repost blindly.
8. Before any new hosted generation window, approve/rebuild/deploy the current
   renderer image and role-specific configuration. Test bounded generation with
   current projections. Existing image success does not validate new source.

See `apps/worker/README.md` for exact runtime/configuration contracts. Deployment,
image builds, paid provider runs and actual Instagram posts are separate external
actions; this document and local gate do not perform or authorize them.

## Operations and rollback

- Operator: **Akshay Saini**, personal pilot, confirmed October 8. No backup
  operator is assigned; keep the pilot supervised and schedules bounded.
- Watch accepted/queued/running/unknown counts, oldest pending age, provider error
  categories, render duration and scheduler failures. Use IDs and sanitized status,
  never credentials, full private prompts or signed media URLs in shared logs.
- Provider outage: preserve work and previous successful output; inspect the
  persisted attempt. Retry only through the existing safe/recoverable UI action.
- Missed schedule: pre-submit work older than its 15-minute window requires fresh
  explicit approval; do not silently publish late. Unknown submitted work remains
  a reconciliation task regardless of deadline.
- Unauthorized destination or leaked token: stop new publishing, revoke/rotate
  affected credentials using the provider process, reconnect and review destination
  epoch before approving a fresh intent. Do not erase unknown receipts.
- Bad deploy: disable dispatch/publishing first; reconcile in-flight work. Roll
  web source back only to a schema-compatible version. Keep additive migrations,
  immutable outputs and command receipts; rollback is not data deletion.
- Missing/corrupt media: use recovery/regeneration to create a new reviewable
  version. Never silently substitute an asset in a confirmed scheduled post.

Full V1 acceptance remains open until live Instagram delivery, the content matrix,
remaining usability/isolation checks and operating ownership are recorded. Any
accepted pilot exception must be explicit and scoped; a local green suite is not
full release approval.
