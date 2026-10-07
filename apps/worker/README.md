# Hosted worker deployment checkpoint

Status: deployment preparation, not a verified hosted runtime. The local host has no Docker executable, so image build/Linux rendering and host resource sizing still need verification before paid provider calls. Existing queue, fencing, speech journal and output promotion are reused unchanged. No endpoint executes user-supplied code.

## Proposed topology

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
