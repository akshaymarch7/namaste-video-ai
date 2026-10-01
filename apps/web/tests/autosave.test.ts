import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAutosave, DraftRequestError, draftTransport } from '../src/drafts/autosave';
import type { DraftView, DraftPatch } from '../src/drafts/contracts';
const initial: DraftView = { projectId: 'prj_0000000000000000', conversationId: 'cnv_0000000000000000', revision: 1, topic: '', audience: '', notes: '', voicePreset: 'daniel-test', editablePlan: null, sourceStoryboardId: null, planStale: false, contentHash: '0'.repeat(64), validation: { valid: false, issues: [] }, updatedAt: new Date().toISOString() };
function fixture(save?: (input: DraftPatch) => Promise<DraftView>) {
  let remote = { ...initial }; const calls: DraftPatch[] = [];
  const controller = createAutosave(initial, { read: async () => remote, save: async input => {
    calls.push(input); if (save) return save(input); remote = { ...remote, ...input.changes, revision: remote.revision + 1 }; return remote;
  } }, () => {}, 60000);
  return { controller, calls, setRemote: (value: DraftView) => { remote = value; } };
}
test('in-flight edits remain dirty and save sequentially using the acknowledged revision', async () => {
  let resolve!: (value: DraftView) => void;
  const f = fixture(() => new Promise(r => { resolve = r; }));
  f.controller.edit({ topic: 'First' }); const pending = f.controller.flush();
  f.controller.edit({ topic: 'Second' }); await f.controller.flush(); assert.equal(f.calls.length, 1);
  resolve({ ...initial, topic: 'First', revision: 2 }); await pending;
  assert.equal(f.controller.snapshot().local.topic, 'Second'); assert.equal(f.controller.snapshot().status, 'dirty');
  const second = f.controller.flush(); assert.equal(f.calls[1].expectedRevision, 2);
  resolve({ ...initial, topic: 'Second', revision: 3 }); await second;
  assert.equal(f.controller.snapshot().status, 'saved'); f.controller.dispose();
});
test('unknown outcome is reconciled by read without duplicate write and retains newer typing', async () => {
  const f = fixture(async () => { throw new DraftRequestError('CONNECTION'); });
  f.controller.edit({ topic: 'Sent' }); await f.controller.flush(); f.controller.edit({ notes: 'New typing' });
  assert.equal(f.controller.snapshot().status, 'error'); await f.controller.flush(); assert.equal(f.calls.length, 1);
  f.setRemote({ ...initial, topic: 'Sent', revision: 2 }); await f.controller.recover();
  assert.equal(f.controller.snapshot().saved.revision, 2); assert.equal(f.controller.snapshot().local.notes, 'New typing');
  assert.equal(f.controller.snapshot().status, 'dirty'); assert.equal(f.calls.length, 1); f.controller.dispose();
});
test('competing edit requires an explicit decision; stale input never overwrites automatically', async () => {
  const f = fixture(async () => { throw new DraftRequestError('REVISION_CONFLICT'); });
  f.controller.edit({ topic: 'Local' }); await f.controller.flush();
  f.setRemote({ ...initial, topic: 'Other tab', revision: 2 }); await f.controller.recover();
  assert.equal(f.controller.snapshot().remote?.topic, 'Other tab'); assert.equal(f.controller.snapshot().local.topic, 'Local');
  await f.controller.flush(); assert.equal(f.calls.length, 1);
  f.controller.resolve('keep-local'); assert.equal(f.controller.snapshot().saved.revision, 2); assert.equal(f.controller.snapshot().status, 'dirty'); f.controller.dispose();
});
test('use-remote discards local edits only by explicit choice', async () => {
  const f = fixture(async () => { throw new DraftRequestError('REVISION_CONFLICT'); });
  f.controller.edit({ topic: 'Local' }); await f.controller.flush(); f.setRemote({ ...initial, topic: 'Remote', revision: 2 });
  await f.controller.recover(); f.controller.resolve('use-remote'); assert.equal(f.controller.snapshot().local.topic, 'Remote');
  assert.equal(f.controller.snapshot().status, 'saved'); f.controller.dispose();
});
test('failed saves preserve input; unchanged remote permits retry; invalid data never sends', async () => {
  const f = fixture(async () => { throw new DraftRequestError('SERVICE_UNAVAILABLE'); });
  f.controller.edit({ notes: 'Keep me' }); await f.controller.flush(); await f.controller.recover();
  assert.equal(f.controller.snapshot().local.notes, 'Keep me'); assert.equal(f.controller.snapshot().status, 'dirty'); f.controller.dispose();
  const invalid = fixture(); invalid.controller.edit({ notes: 'x'.repeat(20001) }); await invalid.controller.flush();
  assert.equal(invalid.calls.length, 0); assert.equal(invalid.controller.snapshot().error, 'VALIDATION_FAILED'); invalid.controller.dispose();
});
test('debounce coalesces edits and disposed controllers ignore late responses', async () => {
  let calls = 0, resolve!: (value: DraftView) => void, notifications = 0;
  const c = createAutosave(initial, { read: async () => initial, save: async () => { calls++; return new Promise(r => { resolve = r; }); } }, () => { notifications++; }, 10);
  c.edit({ topic: 'a' }); c.edit({ topic: 'b' }); await new Promise(r => setTimeout(r, 30)); assert.equal(calls, 1);
  c.dispose(); const before = notifications; resolve({ ...initial, topic: 'b', revision: 2 }); await new Promise(r => setTimeout(r, 0)); assert.equal(notifications, before);
});
test('transport uses private requests and surfaces session errors without discarding input', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, options) => { assert.equal(options?.cache, 'no-store'); assert.equal(options?.credentials, 'same-origin'); return Response.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 }); };
    await assert.rejects(draftTransport(initial.projectId).read(), (e: unknown) => (e as DraftRequestError).code === 'UNAUTHENTICATED');
  } finally { globalThis.fetch = original; }
});

for (const winner of ['delayed-original', 'recovery-write'] as const) {
  test(`unchanged recovery read cannot settle reverted input: ${winner} wins CAS`, async () => {
    let remote = { ...initial }, delayed!: DraftPatch;
    const calls: DraftPatch[] = [];
    const commit = (input: DraftPatch) => {
      if (input.expectedRevision !== remote.revision) throw new DraftRequestError('REVISION_CONFLICT');
      remote = { ...remote, ...input.changes, revision: remote.revision + 1 };
      return remote;
    };
    const c = createAutosave(initial, { read: async () => remote, save: async input => {
      calls.push(input);
      if (calls.length === 1) { delayed = input; throw new DraftRequestError('CONNECTION'); }
      return commit(input);
    } }, () => {}, 60000);
    try {
      c.edit({ topic: 'Delayed text' }); await c.flush();
      c.edit({ topic: initial.topic }); await c.recover();
      assert.equal(c.snapshot().status, 'dirty', 'Old revision does not prove the PATCH stopped');
      c.edit({ topic: initial.topic });
      assert.equal(c.snapshot().status, 'dirty', 'Further edits must not clear the unsettled write');
      if (winner === 'delayed-original') commit(delayed);
      await c.flush();
      assert.equal(calls[1].expectedRevision, 1);
      assert.equal(calls[1].changes.topic, initial.topic);
      if (winner === 'delayed-original') {
        assert.equal(c.snapshot().status, 'conflict'); await c.recover();
        assert.equal(c.snapshot().remote?.topic, 'Delayed text');
        assert.equal(c.snapshot().local.topic, initial.topic);
        c.resolve('keep-local'); await c.flush();
        assert.equal(calls[2].expectedRevision, 2);
      } else {
        assert.throws(() => commit(delayed), (e: unknown) => (e as DraftRequestError).code === 'REVISION_CONFLICT');
      }
      assert.equal(c.snapshot().status, 'saved');
      assert.equal(c.snapshot().saved.revision, remote.revision);
      assert.equal(remote.topic, initial.topic);
    } finally { c.dispose(); }
  });
}

test('a timed-out recovery write matching the old text still requires a revision fence', async () => {
  const f = fixture(async () => { throw new DraftRequestError('CONNECTION'); });
  try {
    f.controller.edit({ topic: 'Delayed text' }); await f.controller.flush();
    f.controller.edit({ topic: initial.topic }); await f.controller.recover(); await f.controller.flush();
    assert.equal(f.calls.length, 2);
    await f.controller.recover();
    assert.equal(f.controller.snapshot().status, 'dirty');
    assert.equal(f.controller.snapshot().saved.revision, 1);
  } finally { f.controller.dispose(); }
});
