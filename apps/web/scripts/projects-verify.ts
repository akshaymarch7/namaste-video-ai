import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { ask } from './auth-input';
const origin = 'http://127.0.0.1:3001';
let cookie = '';
try {
  const email = (await ask('Email used in auth:local: ')).trim();
  const password = await ask('Test password (hidden): ', true);
  const call = (path: string, method = 'GET', body?: unknown, key = randomUUID()) => fetch(`${origin}${path}`, {
    method, headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    ...(method === 'GET' ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000),
  });
  assert.equal((await call('/api/projects')).status, 401);
  const login = await call('/api/session/sign-in', 'POST', { email, password }); assert.equal(login.status, 200);
  cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
  console.log('PASS: anonymous denial and authenticated access');
  const key = randomUUID(), input = { title: 'F05 local verification' };
  const created = await call('/api/projects', 'POST', input, key); assert.equal(created.status, 201);
  const item = (await created.json()).data;
  const replay = await call('/api/projects', 'POST', input, key); assert.equal(replay.headers.get('Idempotency-Replayed'), 'true');
  assert.equal((await replay.json()).data.id, item.id);
  console.log('PASS: creation and safe same-key replay');
  const path = `/api/projects/${item.id}`;
  assert.equal((await call(path)).status, 200);
  const list = await call('/api/projects?filter=drafts&limit=50'); assert.equal(list.status, 200);
  assert.ok((await list.json()).data.some((project: { id: string }) => project.id === item.id));
  console.log('PASS: project read and filtered list');
  const renamed = await call(path, 'PATCH', { expectedRevision: 1, title: 'Renamed verification' }); assert.equal(renamed.status, 200);
  const current = (await renamed.json()).data;
  assert.equal(current.revision, 2); assert.equal(current.draftRevision, 1);
  assert.equal((await call(path, 'PATCH', { expectedRevision: 1, title: 'Stale' })).status, 409);
  console.log('PASS: rename and stale-revision conflict');
  const deleteKey = randomUUID(), deletion = { expectedRevision: 2, confirm: true };
  assert.equal((await call(path, 'DELETE', deletion, deleteKey)).status, 204);
  const repeated = await call(path, 'DELETE', deletion, deleteKey); assert.equal(repeated.status, 204); assert.equal(repeated.headers.get('Idempotency-Replayed'), 'true');
  assert.equal((await call(path)).status, 404);
  assert.equal((await call('/api/projects', 'POST', input, key)).status, 404);
  console.log('PASS: deletion, replay and deleted-content denial\nF05 API checkpoint passed. Share feedback before F06 library UI.');
} catch {
  console.error('TEST FAILED: Check auth:local is ready with matching credentials and project setup. Test data is disposable; restart auth:local if needed.'); process.exitCode = 1;
} finally {
  if (cookie) await fetch(`${origin}/api/session/sign-out`, { method: 'POST', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(10000) }).catch(() => undefined);
}
