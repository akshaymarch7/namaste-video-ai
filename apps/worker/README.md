# Hosted worker deployment checkpoint

Status: Linux image build and a credential-free Cloud Run silent render/full-decode benchmark passed on October 8, 2026. The dashboard-connected runtime is not yet verified. The local host has no Docker executable; cloud verification is recorded in PROJECT_STATUS.md. Existing queue, fencing, speech journal and output promotion are reused unchanged. No endpoint executes user-supplied code.

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

A complete integration still requires authenticated dashboard dispatch, durable handling of failed/ambiguous trigger acknowledgements, a bounded reconciliation mechanism, narrow runtime identities/secret access, a Linux image build/benchmark and hosted playback acceptance. Do not start a worker against the real queue as a configuration check. The user explicitly requested a pause before billable workloads, including remote image builds and live execution.

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

These three proposed executions total 1,140 seconds of configured task runtime. At the cited Tier 1 job rates and this allocation, compute is approximately US$0.05 if all reach their timeouts, before free allowance, startup overhead, currency conversion, taxes, logs and cross-region image transfer/storage. This is an estimate, not a monetary cap; no recurring compute or image rebuild is proposed. The earlier diagnostic authorization stopped when the render passed, so this new comparison awaits the user's workload approval.
