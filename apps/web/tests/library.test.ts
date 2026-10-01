import assert from 'node:assert/strict';
import { test } from 'node:test';
import { libraryRequest, LibraryError, mergeProjects, libraryMessage } from '../components/library/client';
import type { ProjectView } from '../src/projects/contracts';
const item = (id: string, title = id) => ({ id, title } as ProjectView);
test('live pagination deduplicates IDs and replaces overlapping records without dropping earlier pages', () => {
  assert.deepEqual(mergeProjects([item('a'), item('b')], [item('b', 'renamed'), item('c')]), [item('a'), item('b', 'renamed'), item('c')]);
});
test('204 deletion succeeds without trying to parse an empty response', async () => {
  const original = globalThis.fetch;
  try { globalThis.fetch = async () => new Response(null, { status: 204 }); assert.equal(await libraryRequest('/api/projects/test', { method: 'DELETE' }), null); }
  finally { globalThis.fetch = original; }
});
test('network and server failures preserve ambiguous mutation outcome', async () => {
  const original = globalThis.fetch;
  try {
    for (const fake of [async () => { throw new Error('offline'); }, async () => Response.json({ error: { code: 'SERVICE_UNAVAILABLE' } }, { status: 503 }), async () => new Response('not-json', { status: 200 })]) {
      globalThis.fetch = fake;
      await assert.rejects(libraryRequest('/api/projects', { method: 'POST' }), error => error instanceof LibraryError && error.uncertain);
    }
  } finally { globalThis.fetch = original; }
});
test('definitive revision/ownership/session errors retain their codes without raw server messages', async () => {
  const original = globalThis.fetch;
  try {
    for (const [status, code] of [[409, 'REVISION_CONFLICT'], [404, 'NOT_FOUND'], [401, 'UNAUTHENTICATED'], [403, 'ACCESS_DISABLED']] as const) {
      globalThis.fetch = async () => Response.json({ error: { code, message: 'sensitive diagnostic' } }, { status });
      await assert.rejects(libraryRequest('/api/projects/test'), error => error instanceof LibraryError && error.code === code && !error.uncertain && !error.message.includes('sensitive'));
    }
  } finally { globalThis.fetch = original; }
});
test('cancelled list requests keep cancellation identity for stale-result suppression', async () => {
  const original = globalThis.fetch, controller = new AbortController(); controller.abort();
  const reason = new Error('cancelled');
  try { globalThis.fetch = async () => { throw reason; }; await assert.rejects(libraryRequest('/api/projects', { signal: controller.signal }), error => error === reason); }
  finally { globalThis.fetch = original; }
});
test('requests disable caching and unknown errors use safe actionable feedback', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (_path, options) => { assert.equal(options?.credentials, 'same-origin'); assert.equal(options?.cache, 'no-store'); return Response.json({ data: [] }); };
    assert.deepEqual(await libraryRequest('/api/projects'), { data: [] });
    assert.match(libraryMessage('INVALID_CURSOR'), /Refresh/); assert.equal(libraryMessage('secret-value'), libraryMessage('CONNECTION'));
  } finally { globalThis.fetch = original; }
});
