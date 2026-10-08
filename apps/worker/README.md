# Hosted worker deployment checkpoint

Status: Linux image build, credential-free Cloud Run silent render/full-decode and the `us-east1` regional startup workaround passed on October 8, 2026. Use `us-east1` for the next pilot runtime validation; the existing image repository stays in `us-central1`. The dashboard-connected runtime is not yet verified. The local host has no Docker executable; cloud verification is recorded in PROJECT_STATUS.md. Existing queue, fencing, speech journal and output promotion are reused unchanged. No endpoint executes user-supplied code.

## Superseded Render topology (reference only)

Vercel handles authenticated requests. Two Render background services poll the existing Atlas queues: `storyboard` runs Gemini planning/revisions; `generation` runs ElevenLabs and Remotion and saves outputs in private R2. The Cloudflare media gateway authorizes each browser request against Vercel. No Redis or Inngest account is required for this deployment. Do not enable duplicate Inngest dispatch for it.

`render.yaml` is an explicit-import proposal, with automatic deployments disabled and one instance per role. Its 2 CPU/4 GB generation allocation is a starting benchmark configuration, not a measured minimum. Current listed compute is $85/month plus $7/month for the 512 MB storyboard process ($92 total continuously running). Build/bandwidth, provider, storage and any workspace fees are additional. Verify prices and obtain cost approval before service creation. Choose the region against Atlas latency before deployment.

Sources: [Render background workers](https://render.com/docs/background-workers), [compute pricing](https://render.com/pricing), [Blueprint fields](https://render.com/docs/blueprint-spec), [Remotion Docker runtime](https://www.remotion.dev/docs/docker).

## Build and first validation

From the repository root:

```sh
docker build -f apps/worker/Dockerfile -t namaste-worker .
docker run --rm --entrypoint node namaste-worker --import tsx -e "import {mediaProbePath} from './src/pipeline/media-binaries.ts'; console.log(mediaProbePath())"
```

Build installs the pinned npm lockfile and matching Remotion browser; runtime is non-root. The context uses an allowlist and excludes environment files, private runs, Git, dependencies and key files. Do not pass secrets as Docker build arguments or bake an env file into the image. Production runtime settings go into the host's secret environment fields. `start.mjs` passes only the selected role's required credentials into the queue process; neither role needs Better Auth, Meta, migration or media-service credentials.

Run a **silent fixture** inside the image before enabling the workers. Import `renderFixture` and `fixtureSpeech` from `src/plan-v2/fixture.ts` and call `renderPlanV2` with `fixture:true`, `notes:''`, and a new `/tmp` output directory. Check `qa.json`, decode the output and measure the full container peak RAM/CPU/duration; the earlier Node-only RSS is insufficient. Do not infer Linux success from a successful macOS probe.

Set secret variables listed in the Blueprint separately for each role. Apply database migrations through the existing operator path before startup; workers do not migrate. Allow the chosen host's outbound IP ranges in Atlas, without opening arbitrary database access. Initially leave the production queue idle; starting a worker processes already-queued user requests and consumes provider quota.

## Lifecycle and recovery

The container's tini init forwards shutdown signals to the entire process group and reaps descendants. A render interrupted by shutdown may fail; unknown speech requests remain explicitly unresolved instead of being silently charged again. Restart uses the same Atlas leases/journals. Avoid redeploying while jobs run. Render's proposed shutdown grace is 300 seconds, shorter than the full 15-minute job deadline; this does not promise uninterrupted rendering through redeploys. Verify hard-kill recovery in the hosted sandbox before acceptance. Ephemeral intermediates are not a source of truth; R2/Atlas retain committed data.

Monitor process exits, queue deadlines, failed/unknown outcomes, memory and disk pressure. Keep provider bodies, environment variables and media bearer URLs out of logs. No persistent disk is required; temporary data is scoped to each render. A full container OOM/resource test and restart acceptance remain pending.

## Media gateway and end-to-end acceptance

Use `apps/media-gateway/wrangler.toml` with the actual private dev bucket, the deployed Vercel origin and an HTTPS gateway route. Keep R2 public access disabled. Put the same random `MEDIA_SERVICE_SECRET` into the Worker and Vercel; set `MEDIA_GATEWAY_ORIGIN` on Vercel. Do not enable request URL/body logs: playback URLs are bearer grants. The existing gateway validates GET/HEAD/range requests against `/api/internal/media-authorize` before reading the bucket.

Acceptance requires: one real hosted idea → storyboard → approved generation → R2 → authenticated preview/download; exact MP4/VTT hashes; Range/HEAD/expired/revoked grants; cross-owner denial; reload recovery; queued/running shutdown with no duplicate speech; container resource benchmark; and a human listening review. None is claimed by the preparation commit. No Instagram publishing belongs to this checkpoint.

## Cloud Run Jobs direction (supersedes the Render proposal)

The user selected Cloud Run Jobs for the low-usage cloud-only pilot. Do not import `render.yaml` or create the proposed always-running Render services.

The image now defaults to an invalid bounded invocation and fails closed until a specific persisted request ID is supplied:

```text
generation --job job_<32 lowercase hex characters>
storyboard --job job_<32 lowercase hex characters>
```

These arguments use `apps/web/scripts/cloud-job.ts`, which executes only the selected request and exits. Explicit one-argument `generation`/`storyboard` commands retain the legacy continuous workers for existing local workflows. Never configure those one-argument commands on Cloud Run Jobs. An execution's process exit is not a substitute for its persisted business outcome; inspect Atlas job state. A missing or already-claimed/completed job is a no-op, not an instruction to consume another request.

Proposed Cloud Run settings: one task, parallelism one, platform retries zero, generation timeout 900 seconds and storyboard timeout 180 seconds; preserve the existing enqueue-relative deadlines. Limit active generations through the existing database admission/leases, and add dispatch admission limits before enabling dashboard triggers. These are planned host settings, not deployed evidence.

The durable dashboard dispatcher and authenticated reconciliation endpoint are now implemented locally; see the activation checkpoint below. Runtime identities/secret access, hosted federation and end-to-end playback acceptance remain pending. Do not start a worker against the real queue as a configuration check. The user explicitly requested a pause before billable workloads, including remote image builds and live execution.

## Google Cloud configuration checkpoint — October 8, 2026

Project `namastevideo-dev-20261007` has verified active billing. Cloud Run, Cloud Build, Artifact Registry, Secret Manager and IAM APIs are enabled. The selected pilot region is `us-central1`; cross-region Atlas latency and egress still require measurement. No workload has run.

`cloudbuild.yaml` prepares one credential-free image build from the public repository, checked out at an explicit reviewed full commit SHA. Submit with `--no-source` so local files are never uploaded. Docker's allowlist still applies. The build has a 1,200-second timeout, uses Cloud Logging, and pushes one commit-tagged image. This timeout is a duration limit, not a monetary cap; image storage continues after build completion. Do not submit until the user's billable-workload checkpoint is approved.

The dedicated `namastevideo-build` identity now has the user-approved Artifact Registry Writer grant on the `namastevideo-workers` repository only and Logs Writer on this project. No Owner/Editor, runtime secrets, provider credentials or database access were granted. Runtime service accounts and their narrowly scoped secret grants remain a separate setup step. The initial image build tests Chromium/ffprobe startup; it does not prove a complete Linux render or hosted dashboard operation. See Project Status for its live result.

### Credential-free Cloud Run benchmark

`cloud-run-benchmark.yaml` is a prepared, manual-only job. Replace `WORKER_IMAGE_DIGEST` with the successful build's immutable registry digest; create `namastevideo-benchmark` with no project roles, key files or secret grants. It uses one task, no retries, 2 vCPU/4 GiB and a 900-second timeout. Creating/replacing the job must not automatically execute it. Execution needs the user's separate workload approval.

The command uses only the image's built-in silent fixture. It renders the complete video, applies existing technical QA, decodes it with FFmpeg and prints bounded technical results. Decode explicitly selects `rawvideo` because the bundled FFmpeg omits the null muxer's default `wrapped_avframe` encoder; `-xerror` makes decoding errors fatal. This is full decoding, not stream copying. It reads the cgroup peak when exposed (including children and charged filesystem memory); otherwise it reports that metric unavailable. No Atlas, Gemini, ElevenLabs, R2 or production queue access is configured. Temporary video output is not retained, so this check cannot establish subjective playback, narration or hosted delivery acceptance. A failure must be investigated before another execution; there is no scheduler or automatic retry.

Cloud Run's writable filesystem consumes instance memory; this benchmark's memory check is therefore important even though the image already passes startup checks. See [Cloud Run job memory](https://docs.cloud.google.com/run/docs/configuring/jobs/memory-limits). A 900-second execution at this allocation is approximately US$0.04 for compute at the current `us-central1` list rates before free allowance, currency conversion, taxes and ancillary charges; it is not a billing cap or a promise of a zero-cost account. See [Cloud Run pricing](https://cloud.google.com/run/pricing).

Verified execution `namastevideo-render-benchmark-dwpkl` rendered the 72-second fixture and passed complete decoding with the explicit encoder. Render time was 157.3 seconds; benchmark time including decode was 162 seconds; cgroup peak was 1,347,624,960 bytes (about 1.26 GiB). This does not prove 2 GiB is sufficient for every narrated scene, so the 4 GiB allocation remains unchanged. The preceding diagnostic execution confirmed that its render passed and only the old decode command failed.

Cloud Run reported startup times around three to four minutes in these tests (4m20.31s on the passing execution). The image is 1,132,826,786 bytes in Artifact Registry. The cause of startup delay is not established. Do not enable storyboard dispatch with its existing 180-second enqueue-relative deadline until startup behavior is resolved and verified. No runtime secrets, provider requests, dashboard triggers or media gateway have been enabled by this benchmark. Two of the three approved diagnostic retries were used; stopped on success, with no scheduled or automatic execution.

### Startup investigation and regional comparison

Read-only task/log inspection narrowed the successful execution's timing (UTC):

| Event | Time |
| --- | --- |
| Task created | 19:09:12.183 |
| Image imported | 19:09:17.350 |
| Task scheduled annotation | 19:09:39.428 |
| Task started | 19:13:37.827 |
| Application render-start event (after imports) | 19:13:42.326 |

Only **4.499 seconds** elapsed between the recorded task start and application render start. Most delay precedes that task start; the evidence does not support blaming a four-minute JavaScript import or render initialization. It does not identify Google's internal provisioning cause. Google's [known issues](https://docs.cloud.google.com/run/docs/known-issues) lists high deployment latency in regions including `us-central1` and recommends another region. This is a hypothesis to test, not proof that this incident has the same cause. General [Node startup guidance](https://docs.cloud.google.com/run/docs/tips/nodejs) recommends bundling/lazy loading; no image rebuild or dependency rewrite is justified by this timing alone.

`cloud-run-startup-probe.yaml` prepares a manual regional comparison with the **same immutable image**, no-role benchmark identity and 2 CPU/4 GiB allocation. Replace `PROBE_REGION` and `WORKER_IMAGE_DIGEST`; create/replace without `--execute-now`. It emits a timestamp before tsx/application loading, then imports the bounded storyboard dependency graph in a credential-free child. It never calls the job entrypoint, opens a database or invokes providers. Child timeout is 90 seconds; task timeout is 120 seconds; retries are zero. No secret environment, schedules or media are configured.

After explicit workload approval, run at most one startup probe in `us-central1` and one in `us-east1`. Record execution creation, scheduled/task-start timestamps and both probe events. If the alternative reaches `startup-probe-ready` within 60 seconds of execution creation, run one full silent render/decode there with the existing benchmark command (900-second limit, zero retries). If neither region improves, stop and reassess; do not silently extend the storyboard deadline, repeat workloads indefinitely or claim a fix. Even successful samples are not a startup SLA and do not establish live database/provider readiness. Keep dashboard dispatch disabled until the full hosted path and expiration behavior are verified.

These three executions total 1,140 seconds of configured task runtime. At the cited Tier 1 job rates and this allocation, compute is approximately US$0.05 if all reach their timeouts, before free allowance, startup overhead, currency conversion, taxes, logs and cross-region image transfer/storage. This is an estimate, not a monetary cap; no recurring compute or image rebuild is proposed. The user approved this comparison separately; its three executions are now complete. No unused approval remains in this comparison.

### Regional workaround verified — October 8, 2026

Both startup probes succeeded. From execution creation to the application dependency-ready marker, `us-central1` took **112.163 seconds**, while `us-east1` took **58.812 seconds**, including a 46.33-second first image import. Dependency loading itself took 3.606 and 3.076 seconds respectively. East met the agreed 60-second gate, so the approved full silent render ran there.

Execution `namastevideo-render-benchmark-7zlwf` succeeded with exit 0 and zero retries. Creation → task start was **26.217 seconds**, creation → render-start event **30.347 seconds**, and creation → successful execution completion **166.441 seconds**. Render duration was **128.5 seconds** and render plus strict full decode **132 seconds**. The output passed all six technical QA checks (72 seconds, 1080×1920, H.264, 30 fps, silent fixture); cgroup peak was **1,796,321,280 bytes (~1.67 GiB)**. Keep 4 GiB: this fixture does not establish memory needs for all narrated videos. The image digest and code were unchanged.

The benchmark YAML now defaults to `us-east1`, matching the successful live job. Central resources remain as historical comparison jobs with no schedules. This is a verified regional mitigation, not a startup SLA or proof of Google's internal root cause. Keep the 180-second storyboard deadline and dashboard dispatch gate unchanged until a credentialed end-to-end test verifies Atlas/provider setup, durable dispatch and expiration behavior. Private R2/browser delivery and listening acceptance are also still pending. No runtime secret access, application job, image build or additional workload was included in this comparison.


## Durable dashboard dispatch — activation checkpoint

Implemented in `apps/web/src/cloud`, disabled unless `CLOUD_RUN_ENABLED=1`. All five enqueue routes (storyboard, conversational revision, video generation, caption render, video regeneration) register a post-response kick only after an accepted 202. Cloud Scheduler must independently POST to `/api/internal/cloud-dispatch` once per minute; Next.js `after` alone is not durable. The endpoint requires a separate 32+ character bearer, accepts no query/body or job payload, and returns aggregate counters and sanitized failure category/HTTP status. Never put that bearer in a URL or enable header logging.

Migration 017 adds strict `cloudDispatches` and `cloudDispatchControl` collections. Existing storyboard queue/generation rows remain the work source. A transaction serializes the global/owner/daily checks and permanently reserves the job ID **before** `jobs.run`. Defaults: two active executions globally, one per owner across both roles, ten launch attempts per UTC day (configurable 1–20). Accepted, rejected and ambiguous attempts count toward the daily limit. These application limits do not cap cloud billing or launches by administrators.

Dispatch validates the exact job name, digest, runtime identity, default entrypoint, resources, zero retries, task count and timeout, then uses the returned etag and overrides only the bounded role/job arguments. A transport timeout, 5xx, invalid response or crash after reservation never causes another automatic launch for that ID. Read-only operation/execution discovery matches the role, ID, image and creation time. No match is **not** proof of failure: its capacity slot stays occupied until verified termination. Daily rollover does not release unresolved capacity. Configuration/authentication failures before reservation leave work queued. Definite launch rejection stops the queued receipt with a recoverable explanation; saved ideas/storyboards/videos remain intact.

The scheduler expires business deadlines independently of browser polling. It does not extend the 180-second storyboard or 15-minute generation deadline. A Cloud Run success only proves process completion; existing Atlas business records and private output promotion are authoritative. Cancellation fences project output and existing provider journals; it does not promise to immediately stop Cloud Run compute. Inngest dispatch and continuous local scripts refuse Cloud Run mode. Stop independently configured local workers sharing this Atlas database before activation.

### Prepared deployment (not applied)

`cloud-run-runtime.yaml` defines two unscheduled jobs in `us-east1`, each one task/parallelism one, 2 CPU/4 GiB and zero retries. Default arguments intentionally fail until the dispatcher supplies a persisted ID. Timeouts are 180/900 seconds. Secret references use explicit version 1; verify database/model names against approved configuration and retain the verified digest from image source `c4d4f37`. The bounded runtime, renderer and provider implementations are unchanged from that image; this milestone adds dispatch on Vercel. No image rebuild is required for this test. Do not run `jobs execute` as a connectivity check: the end-to-end test owns all approved executions.

1. Apply migration 017 using the operator-only DB setup path. Do not give migration permissions to Vercel or the worker. Verify the Atlas network policy permits the chosen runtime; broadening its allowlist requires a separate explicit decision.
2. Create role identities `namastevideo-storyboard` and `namastevideo-generation`; grant Secret Manager Secret Accessor **on their referenced secrets only**. Storyboard receives MongoDB runtime URI and Gemini. Generation receives MongoDB runtime URI, ElevenLabs and the existing private dev R2 credentials. Neither gets auth, Meta, migration or media-service secrets. No project Editor/Owner grants or downloaded service-account keys.
3. Create `namastevideo-dispatch`. Grant a custom role containing `run.jobs.get`, `run.jobs.run`, `run.jobs.runWithOverrides`, `run.executions.get`, `run.executions.list` on these two jobs. Add `run.operations.get` at project scope if required for regional operation lookup; it grants read-only operation visibility. It cannot update jobs or access Secret Manager. Validate actual policy/resource support before applying; never broaden to Admin to bypass an error.
4. Configure Google Workload Identity Federation for the exact Vercel team, immutable project/team claims, and **production environment of namaste-video-ai-dev only**. Bind that exact subject to `roles/iam.workloadIdentityUser` on the dispatch account. Use the provider default audience. `@vercel/oidc` obtains a short-lived token; STS exchange and 600-second service-account impersonation happen server-side. Enable IAM Credentials and Security Token Service APIs. No service-account private key enters Vercel.
5. Reuse the verified image pinned in the runtime YAML. Configure both runtime jobs and validate their read-back using API v2. If subsequent work changes the bounded runtime, obtain approval for a new reviewed image build before using it. Keep dispatch off while setting the non-secret Cloud Run variables from `.env.example` and a fresh scheduler bearer in the Vercel **testing** project. Ensure existing Gemini/ElevenLabs/R2 server settings required by web features are present there, without logging values.
6. Create one **paused** Cloud Scheduler job: HTTPS POST to the exact dev app endpoint, empty body, `Authorization: Bearer …`, every minute, UTC, 60-second attempt deadline and no explicit retry loop. Retried scheduler ticks are safe, but do not retry a jobs.run POST. Review Scheduler/Vercel quotas and costs; do not assume free allowances are unused.
7. Deploy the existing private media Worker with its dev R2 binding, exact app origin and fresh shared media-service secret, and configure Vercel's gateway origin. Preserve private buckets and no request URL logging. This external deployment still requires approval.
8. After explicit credential/IAM/workload approval, set a fresh UTC `CLOUD_RUN_NOT_BEFORE` cutoff, daily limit **2 for the first QA run**, and enable dispatch. Resume the scheduler only for the controlled test window. Create one labelled English water-cycle storyboard and one approved Daniel-narrated video through the dashboard; no retries or unrelated queued work. Pause dispatch/scheduler when the two tests settle. Verify Atlas states, private R2 promotion, playback/Range/download and reload recovery before requesting ongoing pilot activation. Earlier credential-free benchmarks do not satisfy this acceptance.

### Operator recovery

Inspect only sanitized ledger fields (job ID, role, state, timestamps, operation/execution names, error category) and the matching Google execution. Do not dump snapshots, environments, provider responses or bearer URLs. An unknown/submitting row must never be deleted or reset to try again. If discovery cannot find an execution, retain the row and investigate Google audit/operation history; a missing list result or elapsed business deadline is insufficient to prove no compute exists. A confirmed terminal execution can be reconciled normally. A definitive manually established non-submission needs a separately reviewed operator correction, never an automatic replay. Image/region changes wait for all older executions to settle; the dispatcher refuses to reinterpret older receipts.

Emergency stop: disable `CLOUD_RUN_ENABLED` and pause Scheduler; existing executions can continue until their task limits, so separately inspect/cancel them in Google Cloud if needed. Keep the ledger and private outputs. After normal reactivation, reconciliation resumes; older queued jobs remain excluded by the activation cutoff.

Primary references: [Vercel OIDC for Google Cloud](https://vercel.com/docs/oidc/gcp), [Cloud Run jobs.run](https://docs.cloud.google.com/run/docs/reference/rest/v2/projects.locations.jobs/run), [execution discovery](https://docs.cloud.google.com/run/docs/reference/rest/v2/projects.locations.jobs.executions/list), [STS token exchange](https://docs.cloud.google.com/iam/docs/reference/sts/rest/v1/TopLevel/token). Hosted federation, job-template read-back, scheduler delivery and application runtime remain to be verified live.


First activation request is bounded to configuration/deployment plus at most **two executions** (one storyboard, one narrated render), with the existing 2 CPU/4 GiB allocation and 180/900-second task limits, zero retries and no image rebuild. At the current [Cloud Run instance-based rates](https://cloud.google.com/run/pricing), the combined full task durations are approximately **US$0.048 compute before free allowances**. This is an estimate, not a billing cap; provider quota, Secret Manager, image/object storage, networking, Vercel/Cloudflare usage and taxes are separate. [Cloud Scheduler](https://cloud.google.com/scheduler/pricing) lists $0.10/job/month with three free jobs per billing account; paused jobs still count. Verify available allowances before creation. Do not activate a perpetual paid schedule under this two-test authorization.

### F19 publishing activation (separate from render activation)

The web app now contains the reviewed Post now API/UI and a bounded publisher tick. Publishing an existing export while rendering stays paused does **not** need a new rendering image. Before resuming hosted generation alongside publishing, rebuild/deploy the reviewed worker image containing F19’s generation attention-projection changes; the existing image predates them. Keep `INSTAGRAM_PUBLISH_ENABLED=0` until an explicit real-post checkpoint. The previously paused rendering dispatcher/scheduler can remain paused while publishing an existing approved export.

For a separately approved activation: deploy the reviewed web code, apply migration 018 with the existing setup command, retain the configured Instagram token keyring and private media gateway, set a fresh server-only `INSTAGRAM_PUBLISH_SCHEDULER_SECRET`, and prepare an authenticated empty-body POST once per minute to `/api/internal/publish-tick` with no scheduler retries. Only then enable `INSTAGRAM_PUBLISH_ENABLED=1` for the agreed test window. Do not reuse the render scheduler secret or expose it to the browser. The endpoint processes at most one due intent per tick; `after()` provides a best-effort kick, not durable scheduling. Local operator alternative: `npm --prefix apps/web run publishing:tick` (may contact Meta and publish already-confirmed queued intents when enabled).

The real-post checkpoint must identify the approved video, exact caption and Instagram account before final confirmation. Fixture tests do not authorize an actual container/upload/post. After the bounded test, disable publishing and pause its scheduler. Disabling execution is not remote cancellation; already submitted posts may still appear. Re-enable read-only reconciliation deliberately if an outcome remains unknown. Never automatically retry `media_publish`, infer success from recent media/caption similarity, or clear an uncertain intent to permit a duplicate.

### F20 scheduling readiness

F20 uses the same bounded web publisher tick, not another renderer or scheduler. Before approved activation, deploy the reviewed source and apply migrations **018 and 019**. Keep the publishing flag off while migrating. The minute tick must run independently of an open browser; one due intent is processed per tick. Monitor pilot queue size against the 15-minute delivery window; this is not high-volume capacity or exact-time delivery. Pre-submit expiry requires a fresh explicit time/now approval; submitted unknown outcomes continue read-only reconciliation. No scheduler, deployment or real post was activated by F20 local implementation. Refresh the rendering image with the F19 projection changes before resuming generation alongside publication.

### F22 renderer refresh — October 8, 2026

The runtime YAML now pins `sha256:d71189980fa2d79571758533bafd666b8b1598fb63764f6de975da75fc39d490`, built from `9374a53f77dcdfbdae3666db4211f7face129d38`. Cloud Build `75d899ac-cc7b-4fa6-b29f-cc7258399638` passed its audio/Chromium smoke checks, and both existing us-east1 runtime jobs were updated without changing identities, secrets or resource limits.

The one user-approved saved-narration revision succeeded as `namastevideo-generation-r2vjr`. All six narration objects were reused; extracted AAC bytes match the original and the revised 77-second output fully decodes. Published project state and the original approved version were preserved. Rendering was paused again after completion. This verifies the previously pending worker refresh needed for generation alongside publishing; it is not authorization for ongoing execution or new speech calls. Exact activation, delivery and shutdown evidence remains in Project Status.
