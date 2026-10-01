import assert from 'node:assert/strict';
import { ask } from './auth-input';

// Manual acceptance against the actual Next.js routes; cookie values stay in memory.
try {
  const origin = 'http://127.0.0.1:3001';
  const email = (await ask('Email used in auth:local: ')).trim();
  const password = await ask('Test password (hidden): ', true);
  const signIn = (value: string) => fetch(`${origin}/api/session/sign-in`, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: value }),
  });
  assert.equal((await fetch(`${origin}/api/session`)).status, 401);
  console.log('PASS: anonymous session denied');
  assert.equal((await signIn('deliberately-incorrect-test-password')).status, 401);
  console.log('PASS: wrong password denied');
  const login = await signIn(password);
  assert.equal(login.status, 200, 'Sign-in failed; check the test credentials or restart auth:local after throttling.');
  const cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
  const view = await login.json();
  assert.equal(view.data.user.email, email.toLowerCase());
  assert.equal(view.data.workspaceId, view.data.user.id);
  assert.equal(JSON.stringify(view).includes('token'), false);
  console.log('PASS: sign-in and personal workspace identity; no token in JSON');
  assert.equal((await fetch(`${origin}/api/session`, { headers: { Cookie: cookie } })).status, 200);
  console.log('PASS: authenticated session recognized');
  assert.equal((await fetch(`${origin}/api/session/sign-out`, {
    method: 'POST', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' }, body: '{}',
  })).status, 204);
  assert.equal((await fetch(`${origin}/api/session`, { headers: { Cookie: cookie } })).status, 401);
  console.log('PASS: sign-out revokes the session\nManual API checkpoint passed. Share your feedback before we begin the sign-in UI.');
} catch {
  console.error('TEST FAILED: Make sure auth:local is ready, credentials match, and port 3001 is available. No credentials were printed.');
  process.exitCode = 1;
}
