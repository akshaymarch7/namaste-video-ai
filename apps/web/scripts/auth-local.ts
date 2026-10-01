import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawn, type ChildProcess } from 'node:child_process';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { setupDatabase } from '../src/db/setup';
import { setupAuth } from '../src/auth/setup';
import { provisionUser } from '../src/auth/operator';
import { accountInput } from './auth-input';

let replica: MongoMemoryReplSet | undefined;
let client: MongoClient | undefined;
let web: ChildProcess | undefined;
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  if (web && web.exitCode === null) {
    const exited = new Promise<void>(resolve => web!.once('exit', () => resolve()));
    web.kill('SIGTERM');
    await exited;
  }
  await client?.close();
  await replica?.stop();
}
process.once('SIGINT', () => { void stop(); });
process.once('SIGTERM', () => { void stop(); });
try {
  console.log('Disposable local authentication test. No Atlas or existing accounts are used.\nChoose a test password you do not use elsewhere. Data disappears when you stop this process.');
  const input = await accountInput();
  replica = await MongoMemoryReplSet.create({ binary: { version: '8.0.17' }, replSet: { count: 1, ip: '127.0.0.1', storageEngine: 'wiredTiger' } });
  client = await new MongoClient(replica.getUri(), { promoteLongs: false }).connect();
  const db = client.db('namastevideo_auth_local');
  const config = { origin: 'http://127.0.0.1:3001', secure: false, secret: randomBytes(48).toString('base64url') };
  await setupDatabase(db);
  await setupAuth(db, client, config);
  await provisionUser(db, client, config, input);
  // Explicit environment wins over any web env file. Do not inherit provider or migration credentials.
  const env: NodeJS.ProcessEnv = { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR,
    NODE_ENV: 'development', MONGODB_URI: replica.getUri(), MONGODB_DATABASE: db.databaseName,
    BETTER_AUTH_SECRET: config.secret, BETTER_AUTH_URL: config.origin,
    NEXT_TELEMETRY_DISABLED: '1', AUTH_CLIENT_IP_HEADER: '',
  };
  console.log('Test account ready. Open http://127.0.0.1:3001/sign-in when Next.js is ready.\nOptional API check in a second terminal: npm run auth:verify\nPress Ctrl+C here when finished.');
  web = spawn(process.execPath, [createRequire(import.meta.url).resolve('next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', '3001'], { env, stdio: 'inherit' });
  await new Promise<void>((resolve, reject) => { web!.once('exit', code => code && !stopping ? reject(new Error('Web server failed')) : resolve()); web!.once('error', reject); });
} catch {
  console.error('Local auth test could not start. Check input, package installation and whether port 3001 is free.');
  process.exitCode = 1;
} finally { await stop(); }
