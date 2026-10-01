import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { ask } from './auth-input';
import { checkDrafts } from './drafts-check';
const origin = 'http://127.0.0.1:3001';
let cookie = '';
try {
  const email = (await ask('Email used in auth:local: ')).trim();
  const password = await ask('Test password (hidden): ', true);
  const call = (path: string, method = 'GET', body?: unknown) => fetch(`${origin}${path}`, {
    method, headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID() },
    ...(method === 'GET' ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000),
  });
  const login = await call('/api/session/sign-in', 'POST', { email, password }); assert.equal(login.status, 200);
  cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
  await checkDrafts(call, console.log);
  console.log('F07 checkpoint passed. Stop auth:local to remove the disposable edited project. Share feedback before F08 idea UI.');
} catch {
  console.error('TEST FAILED: Check auth:local is ready with matching credentials and draft setup. Restart the disposable launcher if needed.'); process.exitCode = 1;
} finally {
  if (cookie) await fetch(`${origin}/api/session/sign-out`, { method: 'POST', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(10000) }).catch(() => undefined);
}
