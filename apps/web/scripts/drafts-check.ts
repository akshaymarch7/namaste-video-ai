import assert from 'node:assert/strict';
export async function checkDrafts(call: (path: string, method?: string, body?: unknown) => Promise<Response>, report: (message: string) => void = () => {}) {
  const created = await call('/api/projects', 'POST', { title: 'F07 idea draft verification' }); assert.equal(created.status, 201);
  const project = (await created.json()).data, path = `/api/projects/${project.id}/draft`;
  const initial = await call(path); assert.equal(initial.status, 200); assert.equal((await initial.json()).data.revision, 1);
  report('PASS: new project has a private blank draft');
  const saved = await call(path, 'PATCH', { expectedRevision: 1, changes: { topic: 'How binary search works', audience: 'Beginners', notes: 'Use a sorted list example.', voicePreset: 'daniel-test' } });
  assert.equal(saved.status, 200); assert.equal((await saved.json()).data.revision, 2);
  const reloaded = (await (await call(path)).json()).data; assert.equal(reloaded.topic, 'How binary search works'); assert.equal(reloaded.notes, 'Use a sorted list example.');
  report('PASS: topic, audience, notes and voice persist after reload');
  const stale = await call(path, 'PATCH', { expectedRevision: 1, changes: { topic: 'Stale edit' } }); assert.equal(stale.status, 409);
  assert.equal((await stale.json()).error.details.currentRevision, 2);
  assert.equal((await call(path, 'PATCH', { expectedRevision: 2, changes: { voicePreset: 'unavailable-fixture' } })).status, 422);
  assert.equal((await call(path, 'PATCH', { expectedRevision: 2, changes: { ownerId: 'foreign' } })).status, 422);
  report('PASS: stale edits and unsupported fields/voices are rejected');
  const resolved = await call(path, 'PATCH', { expectedRevision: 2, changes: { notes: 'Explicitly reviewed replacement' } }); assert.equal(resolved.status, 200);
  const parent = (await (await call(`/api/projects/${project.id}`)).json()).data; assert.equal(parent.revision, 1); assert.equal(parent.draftRevision, 3);
  assert.equal((await call(`/api/projects/${project.id}`, 'DELETE', { expectedRevision: 1, confirm: true })).status, 409);
  report('PASS: explicit revision retry succeeds; edited-project deletion remains guarded');
  // The disposable launcher removes this fixture on shutdown. Do not claim content cleanup is implemented.
}
