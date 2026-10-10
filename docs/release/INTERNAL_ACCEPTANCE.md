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
| Direct Instagram connection | @namastevideoai real Instagram consent/callback, clean reload, expected workspace, consumed OAuth receipt, encrypted token and HTTP 200 profile check passed on October 8 | Public access needs applicable Advanced Access/App Review; lifecycle callbacks passed live October 10; daily token-maintenance activation passed October 10; actual provider extension awaits eligible expiry; this does not prove publishing |
| Idea → review → export | Feature QA through F17; accepted 77.013333-second hosted water-cycle export | Representative topic evaluation below; record new deployment revision if retested |
| Dashboard latency | October 10 aligned Vercel Mumbai with Atlas Mumbai; 12 live reads, two-account isolation and exact media delivery passed; 476 local tests/build passed | Preserve timing evidence for any recurrence; short sample does not guarantee no future timeout |
| Recovery and races | Autosave, session, storyboard, jobs, caption/video and publishing fixtures; October 10 hosted create-response loss recovered with the same key/body, one project, changed-body rejection and cleanup | October 10 isolated hosted Atlas access-loss/recovery passed with API and browser autosave; actual provider/network-outage acceptance remains separate |
| Hosted generation/media | October 8 bounded Cloud Run, Atlas, R2, authenticated playback/download and user review passed | Current renderer rebuilt and saved-narration revision verified October 8; ongoing activation remains paused |
| Publish now | October 8 real @namastevideoai Reel, provider ID/permalink, exact caption, one intent/attempt, reload and Published filter passed; see Project Status | Full Instagram player/listening review was not repeated; scheduled delivery has separate live evidence below |
| Schedule | October 8 real scheduled @namastevideoai Reel, project tabs closed before due; scheduler processing at due+7.610s, published at due+137.757s; one attempt, exact caption and no duplicate | Passed pilot timed-delivery check; no general timing SLA claimed |
| Accessibility | F21 responsive/reduced-motion QA; October 10 Chrome dialog focus wrap/Escape and storyboard navigation; direct skip focus → next control → dialog/Escape passed live on f90ad44 | Full screen reader/end-to-end keyboard review; Safari playback smoke passed October 10 with native progression and user visual confirmation; complete listening review remains separate |
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

Current baseline (October 10): migrations through 022, direct Instagram Login
for @namastevideoai, custom-domain callbacks/media and both real immediate and
scheduled publications passed. The older Facebook Page route was rejected and
is not required. The worker was rebuilt and its saved-narration render verified
October 8. Vercel auto-deploys `dev`; the dashboard now runs in Mumbai.

Both execution flags are disabled and both schedulers paused after the bounded
acceptance window. Recheck live state before any execution. The US$1 approval
covered the recorded single build/render, not another evaluation batch or ongoing
operation. Do not waive the 20-topic evaluation or infer zero future cost from
rounded billing totals. The steps below are the runbook for a newly authorized
window, not evidence that the completed setup must be repeated.

1. Choose the reviewed `dev` commit and obtain deployment approval. Keep both
   execution flags disabled. Check active/unknown jobs and intents before changes.
2. Verify migrations through 019 using the existing database setup flow;
   apply only newly required additive migrations and validate indexes. Never downgrade collections on rollback.
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


## Bounded Instagram token maintenance

**Pilot configuration (October 10, 2026):** daily operation approved by the owner.
Job `namastevideo-instagram-refresh` in `namastevideo-dev-20261007/us-east1`
uses 09:00 Asia/Calcutta, an empty POST to the canonical endpoint, a dedicated
Production bearer, a 60-second deadline and no automatic retries. Live acceptance
results are recorded in Project Status. Other schedulers remain independent.

To stop maintenance, pause this job and set `INSTAGRAM_REFRESH_ENABLED=0` in
Vercel Production, then redeploy. A fresh connection is expected to return
`skipped`; this is not evidence of a successful Meta token extension. The owner
should inspect failed executions and expiring/reconnect-required connections.


The disabled-by-default `POST /api/internal/instagram-refresh` accepts an empty
body and no query string, using a **separate** server-only bearer in
`INSTAGRAM_REFRESH_SCHEDULER_SECRET` (32+ random characters). It returns 503
unless `INSTAGRAM_REFRESH_ENABLED=1`; missing/invalid authorization returns 401.
Do not reuse the publishing, render-dispatch, session or media secrets.

One invocation considers only admitted owners and renews at most one direct
Instagram connection for the currently configured app. The existing
`connection_refresh` index supports the state/expiry query; no schema migration
is required. The token must be unexpired, at least 24 hours old, and expire in
less than seven days. Selection prefers the earliest expiry. The 60-second lease
and token revision fence concurrent scheduler/manual runs and late responses.
Successful renewal changes token/connection revision but not destination identity
or approval/publication history. Existing Settings displays expiry and connection
state; no additional creator workflow is required.

Transient provider/network/invalid-response failures retain the valid credential
and use the existing lease timestamp as a durable 15-minute retry delay. Explicit
401/403 or Meta error 190 authentication rejection requires reconnection. Actual
expiry still prevents publishing. Results contain only `skipped`, `refreshed`,
`retry_later`, `reconnect_required` or `superseded`; no tokens/account IDs/raw errors.
A crash after a provider response can still produce an unknown maintenance
outcome; the next invocation rechecks durable eligibility rather than bypassing
the lease. This does not submit Instagram content.

Activation checklist (not activated by implementation):

1. Provision a dedicated secret in the existing web Production environment and
   a **paused** Cloud Scheduler job targeting the canonical HTTPS endpoint.
2. Review deployment, admission and token dates; enable only this maintenance
   flag for one bounded live check. A fresh token correctly returns `skipped`;
   do not falsify its age or expiry to force renewal.
3. Record sanitized result/state, then disable again unless recurring operation
   has been explicitly approved. For this personal pilot, a daily tick is enough
   for one eligible account; larger populations require cadence/capacity planning
   because a tick renews at most one account. Failures need operator follow-up;
   no automatic paid monitoring service is configured.
4. After recurring approval, enable the dedicated job with bounded retries and
   monitor stale `expiring`/`reconnect_required` connections. Publishing/render
   flags and their paused schedulers remain independent.

Primary contract checked October 10:
[Meta Business Login for Instagram — refresh a long-lived token](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login).
Deauthorization/data-deletion callback handling remains a separate unfinished
lifecycle requirement; this maintenance endpoint does not claim to implement it.

## Signed Instagram deauthorization

Implementation is separate from data deletion. Configure the **Instagram product's**
deauthorization URL as `https://namastevideo.ai/api/instagram/deauthorize` only
after activation verification. Do not replace callbacks for another NamasteDev
product. No callback has been configured by this implementation.

The endpoint defaults off (`INSTAGRAM_LIFECYCLE_ENABLED=0`). It accepts only POST,
no query, a <=20KB form, multipart or exact single-field JSON body with one `signed_request`, and a verified
HMAC-SHA256 signature made with the configured Instagram App Secret. The payload
requires a decimal `user_id` string or losslessly parsed integer, algorithm and integer `issued_at`; more than five
minutes in the future is rejected. Body reading is bounded to two seconds. Old
legitimate deliveries are accepted, with replay prevention in the database.
Plain-text/unlabelled form or JSON delivery is also accepted, but never unsigned identity payloads. Unverified requests never open the database; errors do not echo payloads.

Migration **020-instagram-lifecycle** creates `instagramLifecycle` with strict
validation, built-in unique `_id`, no TTL. The key hashes provider/app/app-scoped
user ID; values are latest revocation/authorization timestamps, update time and
the verified Instagram profile ID. No secret, raw signature or token is stored.
The ledger is pseudonymous provider data, not anonymized data; deletion work must
include it. OAuth records the short-token exchange's `user_id` independently of
the profile `user_id`. Migration 022 adds optional app identity and an app/profile index without changing
migration 020 checksum. OAuth transactionally maps both its verified subject and
the authenticated profile ID: live Instagram removal delivered the latter. Both
identities are checked for pending deletion/revocation before saving consent.
Existing accounts must reconnect after activation to establish these mappings; unknown subjects are acknowledged and retained as a
revocation watermark, never guessed or applied to another identity.

One transaction advances the revocation watermark, marks the matching current
connection reconnect-required, clears its token and increments OAuth/token fences.
It invalidates outstanding OAuth receipts. It also removes encrypted publishing
and ingest credentials plus grants for the mapped provider/app/account, including
older intents after an account switch. Unsubmitted work becomes paused_auth;
submitting/unknown work becomes needs_attention. Confirmed posts/history remain.
Library flags are recomputed. A late worker response cannot overwrite that state.
An already in-flight provider POST may still finish externally; there is no claim
that revocation cancels it. Check Instagram manually before any further action.

OAuth and revocation write the same ledger row transactionally, preventing an
in-flight first authorization from resurrecting revoked access. A newer consent
must start strictly after the revoked second. Same-second ambiguity is resolved
conservatively by asking the user to start again. Delayed/replayed callbacks do
not revoke newer recorded consent. No new API permissions are requested.

Activation checklist:

1. Apply migrations 020 and 022 using the normal reviewed database setup, keep generation
   and publishing disabled, then enable the lifecycle flag in web Production.
2. Reconnect the pilot account through the real OAuth UI to establish its verified
   app-scoped mapping. Confirm only the existence/match, without printing IDs or
   credentials. Capture a mapping for each existing account before calling its
   lifecycle handling live-ready.
3. Save the Instagram-product deauthorization URL in Meta; preserve all other
   app/product callbacks. With explicit test authorization, revoke the pilot's
   app access, verify callback acceptance, credentials removed, queued/unknown
   states correct, then reconnect and verify old replay cannot revoke it.
4. Leave callback handling active once registered; disabling it returns 503 and
   requires operator follow-up. It has no scheduler or provider API workload.

Remaining: live contract/identifier verification, data-deletion request/status
workflow, actual provider/Atlas outage, screen-reader and narrated-content gates.
Do not describe deauthorization as account deletion, erase publication history,
or return a deletion-completed response from this endpoint.

Primary sources read October 10, 2026:
[Instagram app setup, Business login settings](https://developers.facebook.com/documentation/instagram-platform/create-an-instagram-app),
[Business Login identity exchange](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login),
[Meta signed-request/deletion contract](https://developers.facebook.com/documentation/development/create-an-app/app-dashboard/data-deletion-callback).
The last source also requires deletion requests to return a confirmation code and
human-readable status URL; this deauthorization endpoint intentionally does not
claim to satisfy that separate deletion contract.

## Instagram data-deletion requests

The implemented callback is `POST https://namastevideo.ai/api/instagram/data-deletion`.
It is disabled unless both `INSTAGRAM_LIFECYCLE_ENABLED=1` and
`INSTAGRAM_DELETION_ENABLED=1`. Migrations 020, **021-instagram-deletion** and 022 must
be applied, and existing accounts must have the verified OAuth subject mapping.
The callback shares the bounded form/HMAC verification used for deauthorization.
It returns Meta's `{url, confirmation_code}` receipt only after transaction commit.
Receiving that receipt is not a promise that deletion has completed.

The high-entropy status URL `/instagram/deletion/<code>` is public without sign-in,
no-store, no-referrer and noindex. It displays only completed/review status and an
update time; no account, owner, username, caption, video or internal review reason.
Missing or unavailable records never render a completed status. Treat the link as
private even though it carries no identifying profile data.

Scope and retained records:

- Remove the verified account's connection/profile/credential fields, related
  publish intents, matching approved-payload snapshots and media-ingest grants.
  Clear relevant OAuth/disconnect receipts and the lifecycle profile mapping.
  Recompute library flags. This removes local publication history, not Instagram
  posts, generated MP4/audio/assets, project ideas or the NamasteVideo login.
- Retain minimal deletion receipts and lifecycle replay timestamps/subject hashes,
  existing command hashes/references, disconnected connection shells and hash-only
  duplicate-publication markers. These are pseudonymous safety records, not a
  claim of total erasure or anonymization. The status page discloses retention.
  A removed version/account combination is conservatively blocked from publishing
  again, including through replacement or retry and after feature flags change.
- Different-app/account data is not selected for automatic cleanup. Legacy
  snapshots lack provider-app provenance: if matching snapshots have no owner
  corroborated by a matching current connection/intent, retain the request for
  identity/history review rather than falsely claiming completion.

Known mapped requests without uncertain submission or newer consent finish in
one transaction. Same subject/issued_at callbacks replay the same random receipt.
Unmapped identity, newer consent, ambiguous history or potentially submitted posts
remain `needs_review`. Tokens/grants for a known mapping are removed immediately;
work is paused/fenced and fresh authorization/publication is blocked during review.
Already in-flight provider requests may still finish externally. Late results
cannot recreate removed data or overwrite the review state.

Operator completion is a separate, explicit destructive action:

```
npm run instagram:deletion --workspace apps/web -- status <confirmation-code>
npm run instagram:deletion --workspace apps/web -- complete <confirmation-code> --confirm-account-and-publication-review
```

Before `complete`, verify the exact account/consent and inspect any submitted post
on Instagram using the established internal operator process. The flag attests
that review; it does not perform a provider query or prove an outcome. Completion
retains the duplicate guard and makes no provider POST. Unmapped or ambiguous
historical data cannot be bypassed by this flag: resolve identity/provenance with
a reviewed operator data repair first, or keep the status pending. There is no
public completion endpoint, automatic operator waiver or silent retry of a post.
Use the status command after a lost CLI response; completion is idempotent.

Migration 021 adds `instagramDeletions` (unique event hash, subject/state and
app/profile/state indexes) and `instagramPublicationTombstones` (unique hash key),
with strict validators and no TTL. This pilot processes an account's history in
one transaction. Large accounts require a separately designed bounded erasure
worker; timeout/failure rolls back and returns 503, never a false success.

Live activation requires configuring the Instagram product's deletion callback
without replacing unrelated NamasteDev settings, plus explicit approval for a
real destructive deletion/reconnect test. No real user data has been erased by
this implementation. Legal retention policy and public-creator readiness are not
established by these technical tests. See the Meta deletion contract linked above.


### October 10 lifecycle live acceptance

Migrations 020–022 are applied. Both canonical Instagram-product callback URLs are
registered and enabled. Actual removal delivered HTTP 200 to both handlers after
numeric-ID, verified-alias and transport fixes. The second deletion completed
automatically; the first was explicitly operator-reviewed after an unmapped-ID
finding. Pilot connection was restored through real OAuth. Local publishing
history was deleted with approval, while both generated videos/four assets and
both original Instagram Reels remain. Live replay against restored consent was
not executed following an automatic approval-review rejection; automated replay
and newer-consent tests passed. Earlier “pending” activation text above is retained
as a runbook, not the current live state. Renewal and workload schedulers remain
disabled; this does not close the remaining F22 gates.


## Isolated outage drill

The local `tests/outage-recovery.test.ts` uses a disposable loopback MongoDB
and a TCP proxy. It drops actual sockets, first during initial connection and
then after a successful persisted write, restores transport and verifies recovery
through the same application connection and unchanged saved data. The normal
acceptance runner discovers this test automatically. It never reads Atlas or
provider environment files. This does not simulate an Atlas regional failure or
establish hosted UI acceptance.

The October 10 hosted database drill passed on a separate application-auth-protected test deployment and
isolated database with synthetic users/content. Do not change production Atlas
network access, credentials or renewal configuration to induce a failure.
Prepare synthetic saved work, deny only the test deployment's database access,
verify bounded errors and preserved local edits, restore access, and confirm
same-command recovery without duplicate writes. Provider failures must use
clearly labelled controlled responses; they do not establish real provider
availability. Keep generation/publishing disabled and omit all real provider,
Instagram and R2 credentials from the isolated deployment. Record exact revision,
failure/recovery timing, browser evidence, saved-record comparison and cleanup.
Deployment and any additional billable resources require explicit approval.

Hosted database drill result (October 10): source `eb7fadc`, separate Hobby project
`namaste-video-outage-test`, synthetic database/account only. Scoped Atlas access
removal caused sanitized 503s; restoration preserved saved data, recovered the
original command without duplicates and saved the browser-held edit across reload.
No redeployment/restart was needed for recovery. Test Git integration was then
disconnected, sessions signed out and database access quarantined until automatic
six-hour credential expiry. The inert deployment and synthetic database remain;
no permanent cloud deletion was performed. See Project Status for exact evidence.
This is authorization-loss testing; do not label it a regional/provider outage.
