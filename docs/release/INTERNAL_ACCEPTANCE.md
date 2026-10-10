# F22 — Internal release acceptance

Status: in progress. Real Post now and scheduled delivery acceptance passed on October 8. The remaining matrix below, including longer-run response reliability, is still open; this is not full release approval.
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
| Private workspaces/auth | October 8 hosted two-account sign-in, project/version/media/asset denial and destination isolation passed; detailed evidence in Project Status | Retain isolation checks when authorization scope or storage boundaries change |
| Direct Instagram connection | @namastevideoai real Instagram consent/callback, clean reload, expected workspace, consumed OAuth receipt, encrypted token and HTTP 200 profile check passed on October 8 | Public access needs applicable Advanced Access/App Review; lifecycle callbacks and recurring token refresh remain pending; this does not prove publishing |
| Idea → review → export | Feature QA through F17; accepted 77.013333-second hosted water-cycle export | Representative topic evaluation below; record new deployment revision if retested |
| Dashboard latency | October 10 aligned Vercel Mumbai with Atlas Mumbai; 12 live reads, two-account isolation and exact media delivery passed; 476 local tests/build passed | Preserve timing evidence for any recurrence; short sample does not guarantee no future timeout |
| Recovery and races | Autosave, session, storyboard, jobs, caption/video and publishing fixtures; prior real reload/lost-response QA | Controlled hosted outage/recovery drill before continuous operation |
| Hosted generation/media | October 8 bounded Cloud Run, Atlas, R2, authenticated playback/download and user review passed | Current renderer rebuilt and saved-narration revision verified October 8; ongoing activation remains paused |
| Publish now | October 8 real @namastevideoai Reel, provider ID/permalink, exact caption, one intent/attempt, reload and Published filter passed; see Project Status | Full Instagram player/listening review was not repeated; scheduled delivery has separate live evidence below |
| Schedule | October 8 real scheduled @namastevideoai Reel, project tabs closed before due; scheduler processing at due+7.610s, published at due+137.757s; one attempt, exact caption and no duplicate | Passed pilot timed-delivery check; no general timing SLA claimed |
| Accessibility | F21 responsive, keyboard and reduced-motion QA; earlier feature checks | Screen reader, Safari and end-to-end keyboard review |
| Voice offering | Daniel test voice accepted for pilot | Indian male/female voices unavailable/unverified; do not advertise them as enabled |
| Operating permission | Internal-only admission; Akshay confirmed personal operation and is the pilot owner; ElevenLabs Free plan observed | Retain provider/license restrictions; free allowances only, no unapproved paid evaluation or continuous workloads |

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
remaining usability checks and operating requirements are recorded. Any
accepted pilot exception must be explicit and scoped; a local green suite is not
full release approval.

## Direct Instagram setup support draft — not submitted

Historical investigation: the older NamasteDev app subsequently provided the direct
Instagram setup. Its approved pilot connection now passes real OAuth and profile
verification without a Facebook Page. The fresh-app panel discrepancy remains
unexplained, but no longer blocks this pilot. Preserve the unsent draft as evidence;
no additional support submission or app creation is needed for this activation.

The October 8 fresh-app check did not expose Instagram Login settings. The
official bug tool's Developer Tools → App Dashboard → Create App category says
support is unavailable through that channel and directs developers to the
Developer Community Forum. The following draft is prepared for review; it has
not been sent to Meta or published. Obtain explicit authorization before posting.

**Title:** Instagram Login setup missing in a newly created Instagram-only app

We are setting up direct Instagram authorization for our own professional Creator
account without a linked Facebook Page. In a new app named NamasteVideo Direct:

1. Select only “Manage messaging & content on Instagram” during app creation.
2. Complete creation without a business portfolio, accepting the displayed terms
   and completing the account verification prompt.
3. Open Use cases → Customize.
4. The console immediately includes Facebook Login for Business and offers only
   “API setup with Facebook login.” No Facebook Login configuration was saved.
5. Add `instagram_business_basic` and `instagram_business_content_publish` in
   Permissions and features. Both show Ready for testing.
6. Reload: the Instagram Login setup is still absent. Add more to this use case
   offers Webhooks; the use-case switcher contains only Instagram API.

Expected: Meta's current [Instagram use-case guide](https://developers.facebook.com/docs/development/create-an-app/instagram-use-case/)
describes choosing Instagram Login, obtaining an Instagram-specific App ID and
App Secret, and configuring the business-login redirect URL. We cannot reach
those settings. The same missing panel appears on our two older apps, so creating
a dedicated app did not resolve it.

Please identify the supported way to provision Instagram Login for this app, or
any documented prerequisite missing from these steps. We have not established a
root cause or confirmed a platform bug. We can provide a screenshot of the
console without secrets. No passwords, access tokens, app secrets, private media
or customer data are included in this report.

### October 8 scheduled-publication evidence

- Source worker image built from verified `9374a53`, build `75d899ac-cc7b-4fa6-b29f-cc7258399638`, digest `d71189980fa2d79571758533bafd666b8b1598fb63764f6de975da75fc39d490`. One approved caption-only cloud render succeeded, reusing all six saved narration segments. Both MP4 downloads/VTT matched stored hashes, extracted AAC bytes were identical, full decode and private browser playback passed. Prior selected/approved/published version was preserved.
- Scheduled intent `pub_0247a46450fe41ac91c7fbf92b35b8cc`, video `vid_1a2f33946fc7540ea097f4adb5074e79`, due **2026-10-08T13:36:00Z / 19:06 Asia/Kolkata**. Both project tabs closed at13:30:07UTC and were not reopened until independent published evidence. Processing observed13:36:07.610UTC, published13:38:17.757UTC, attempt1. No manual publishing tick.
- Real Reel: https://www.instagram.com/reel/DePDj89lXPk/ ; media ID `18074031323754720`. Instagram displayed the correct account and exact caption including narration attribution and personal-pilot label. Dashboard history subsequently displayed both Published versions. Atlas confirmed two intents/two published/one attempt each, no unresolved states, both approvals, temporary credential cleanup and correct project flags.
- Intermittent preview/read/approval/schedule response timeouts occurred. Original approval and schedule commands recovered successfully without duplicates. This is recovery evidence, **not** a latency fix. A follow-up should capture sanitized per-stage request timings and distinguish browser/network, Vercel and Atlas latency before expanding the pilot.
- Publisher paused19:08:53IST; bounded window began18:51:06IST. Vercel shutdown deployment `X8nhGCT1ttegERyzPNuA4gaXqDFG` reached Ready; cloud-dispatch and publish-tick both returned503. Rendering already paused after its single execution. No ongoing execution authorized.
- Cost authorization: up toUS$1 additional Google Cloud for one build/one saved-narration render; no new speech synthesis. Recorded build332seconds and execution208.326seconds correspond to aboutUS$0.043 list compute before free allowances/ancillary usage/taxes. This is an estimate, not a final invoice or account-wide spend cap; image storage persists. Remaining narrated evaluation was not run or waived.

## Dashboard latency diagnostics

The web project pins Vercel Functions to `bom1` in `apps/web/vercel.json` to
match the verified Atlas AWS `AP_SOUTH_1` deployment. Keep this aligned if the
database moves. Static assets remain on Vercel's CDN. This does not move or
activate Cloud Run workers. See [Vercel region configuration](https://vercel.com/docs/functions/configuring-functions/region).

Session, project/draft, video, job, publishing and media HTTP handlers expose
`Server-Timing`: `app`, `dependencies`, `session`, `admission`, `readiness`, and
`transaction` where applicable. Stage durations are inclusive; nested or
concurrent work must not be added to estimate total latency. `app` starts inside
the handler and excludes platform startup, edge routing, network transfer and
response-body consumption. Compare it with client wall time and the existing
`X-Request-Id`; a large difference is not proof that MongoDB is slow.

Requests taking at least five seconds or returning 5xx emit a `dashboard_request`
server log with fixed route group, status, generated request ID and timings only.
No request URL, query, body, cookie, credentials, user/project identity or raw
exception is logged. Normal fast responses produce no log. These diagnostics
never retry a request or change the client recovery receipt. A killed invocation
may have no completion log; use Vercel's platform logs for that case.

For a bounded retest, sign in using an existing local test-account file, read
session, projects, video versions and publication history three times, then sign
out. Do not print cookies or response bodies. Record status, sanitized request
ID, timings and deployment revision. Verify publication/generation remain
disabled; read checks must not enable schedulers or issue render/publish commands.
