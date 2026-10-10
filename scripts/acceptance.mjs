import {spawnSync} from 'node:child_process';
import {readdirSync, mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

// No provider credentials or operator flags are inherited by the fixture suites.
const root = fileURLToPath(new URL('../', import.meta.url));
const env = Object.fromEntries(['PATH', 'HOME', 'TMPDIR', 'TEMP', 'TMP', 'SystemRoot'].filter(key => process.env[key]).map(key => [key, process.env[key]]));
const tests = directory => readdirSync(path.join(root, directory)).filter(name => name.endsWith('.test.ts')).sort().map(name => `${directory}/${name}`);
// Match the client/server conditions used by the individual package scripts.
const clientNames = new Set(['instagram-deletion-ui', 'autosave', 'generation-controller', 'instagram-controller', 'library', 'preferences-controller', 'publishing-ui', 'session-controller', 'session-events', 'storyboard-approval', 'storyboard-editor', 'storyboard-review', 'video-review'].map(name => `${name}.test.ts`));
const webTests = tests('apps/web/tests');
const steps = [
  {name: 'Prototype and renderer regression', cwd: root, args: ['--import', 'tsx', '--test', '--test-concurrency=1', ...tests('tests')]},
  {name: 'Web services, ownership, recovery and controllers', cwd: path.join(root, 'apps/web'), args: ['--conditions=react-server', '--import', 'tsx', '--test', '--test-concurrency=1', ...webTests.filter(file => !clientNames.has(path.basename(file))).map(file => path.join(root, file))]},
  {name: 'Browser controllers and component contracts', cwd: path.join(root, 'apps/web'), args: ['--import', 'tsx', '--test', '--test-concurrency=1', ...webTests.filter(file => clientNames.has(path.basename(file))).map(file => path.join(root, file))]},
  {name: 'Worker credential and invocation boundaries', cwd: root, args: ['--test', 'apps/worker/config.test.mjs', 'apps/worker/invocation.test.mjs']},
  {name: 'Public demo full decoding', cwd: root, args: ['--import', 'tsx', 'scripts/verify-homepage-demos.ts']},
];
const report = {startedAt: new Date().toISOString(), scope: 'Local fixtures only; not live release approval', results: []};
const output = path.join(root, 'runs/acceptance');
mkdirSync(output, {recursive: true});
for (const step of steps) {
  console.log(`\nAcceptance: ${step.name}`);
  const started = performance.now();
  const result = spawnSync(process.execPath, step.args, {cwd: step.cwd, env, stdio: 'inherit', timeout: 20 * 60 * 1000});
  report.results.push({name: step.name, passed: result.status === 0, exitCode: result.status, signal: result.signal, durationMs: Math.round(performance.now() - started), ...(result.error ? {error: result.error.code ?? result.error.name} : {})});
  writeFileSync(path.join(output, 'latest.json'), JSON.stringify(report, null, 2) + '\n');
  if (result.status !== 0) { process.exitCode = 1; break; }
}
console.log(`\nLocal acceptance report: ${output}/latest.json`);
