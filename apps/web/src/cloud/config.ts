import 'server-only';

export type WorkerRole = 'storyboard' | 'generation';
export type CloudConfig = {
  project: string; number: string; region: string; pool: string; provider: string;
  serviceAccount: string; image: string; notBefore: Date; dailyLimit: number;
};
const id = /^[a-z][a-z0-9-]{3,62}$/;
export function cloudEnabled(env:Record<string,string|undefined> = process.env) { return env.CLOUD_RUN_ENABLED === '1'; }
export function cloudConfig(env:Record<string,string|undefined> = process.env): CloudConfig {
  const project = env.CLOUD_RUN_PROJECT ?? '', number = env.CLOUD_RUN_PROJECT_NUMBER ?? '';
  const pool = env.CLOUD_RUN_IDENTITY_POOL ?? '', provider = env.CLOUD_RUN_IDENTITY_PROVIDER ?? '';
  const image = env.CLOUD_RUN_IMAGE ?? '', region = env.CLOUD_RUN_REGION ?? 'us-east1';
  const notBefore = new Date(env.CLOUD_RUN_NOT_BEFORE ?? '');
  const dailyLimit = Number(env.CLOUD_RUN_DAILY_LIMIT ?? '10');
  if (!id.test(project) || !/^\d{6,20}$/.test(number) || !id.test(pool) || !id.test(provider)
    || !/^[a-z]+-[a-z]+\d$/.test(region) || !Number.isFinite(notBefore.getTime())
    || !Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 20
    || !image.startsWith(`us-central1-docker.pkg.dev/${project}/namastevideo-workers/worker@sha256:`)
    || !/@sha256:[a-f0-9]{64}$/.test(image)) throw Error('CLOUD_CONFIGURATION_INVALID');
  return {project, number, region, pool, provider, image, notBefore, dailyLimit,
    serviceAccount: `namastevideo-dispatch@${project}.iam.gserviceaccount.com`};
}
export const taskSeconds = (role: WorkerRole) => role === 'storyboard' ? 180 : 900;
export const jobName = (c: CloudConfig, role: WorkerRole) => `projects/${c.project}/locations/${c.region}/jobs/namastevideo-${role}`;
export const runtimeAccount = (c: CloudConfig, role: WorkerRole) => `namastevideo-${role}@${c.project}.iam.gserviceaccount.com`;
