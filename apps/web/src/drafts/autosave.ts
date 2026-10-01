import { fieldsOf, ideaFields, patchDraft, sameIdea, type DraftView, type IdeaFields, type DraftPatch } from './contracts';
export class DraftRequestError extends Error {
  constructor(public code: string) { super(code); }
}
export type DraftTransport = { read(): Promise<DraftView>; save(input: DraftPatch): Promise<DraftView> };
export function draftTransport(projectId: string): DraftTransport {
  const path = `/api/projects/${encodeURIComponent(projectId)}/draft`;
  async function request(input?: DraftPatch): Promise<DraftView> {
    let response: Response;
    try {
      response = await fetch(path, { method: input ? 'PATCH' : 'GET', credentials: 'same-origin', cache: 'no-store',
        signal: AbortSignal.timeout(15000), ...(input ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) } : {}) });
    } catch { throw new DraftRequestError('CONNECTION'); }
    let body;
    try { body = await response.json(); } catch { throw new DraftRequestError('CONNECTION'); }
    if (!response.ok) throw new DraftRequestError(body.error?.code ?? 'SERVICE_UNAVAILABLE');
    const data = body.data;
    if (!data || data.projectId !== projectId || !Number.isInteger(data.revision) || data.revision < 1 || !ideaFields.safeParse(fieldsOf(data)).success) throw new DraftRequestError('CONNECTION');
    return data;
  }
  return { read: () => request(), save: input => request(input) };
}
export type AutosaveState = {
  local: IdeaFields; saved: DraftView; status: 'saved' | 'dirty' | 'saving' | 'error' | 'conflict';
  error: string | null; remote: DraftView | null;
};
// One controller per mounted project editor. No localStorage: drafts remain owner-bound and in memory.
export function createAutosave(initial: DraftView, transport: DraftTransport, onChange: (state: AutosaveState) => void, delay = 800) {
  let state: AutosaveState = { local: fieldsOf(initial), saved: structuredClone(initial), status: 'saved', error: null, remote: null };
  let timer: ReturnType<typeof setTimeout> | undefined, disposed = false, busy = false;
  let attempted: IdeaFields | null = null;
  const snapshot = (): AutosaveState => structuredClone(state);
  const emit = () => { if (!disposed) onChange(snapshot()); };
  const clear = () => { clearTimeout(timer); timer = undefined; };
  const schedule = () => { clear(); if (!disposed && state.status === 'dirty') timer = setTimeout(() => { void flush(); }, delay); };
  const accept = (saved: DraftView) => {
    state = { ...state, saved, remote: null, error: null, status: sameIdea(state.local, saved) ? 'saved' : 'dirty' };
    attempted = null;
  };
  async function flush() {
    clear();
    if (disposed || busy || state.status !== 'dirty') return;
    const parsed = patchDraft.safeParse({ expectedRevision: state.saved.revision, changes: state.local });
    if (!parsed.success) { state.status = 'error'; state.error = 'VALIDATION_FAILED'; emit(); return; }
    busy = true; attempted = { ...state.local }; state.status = 'saving'; emit();
    try { const saved = await transport.save(parsed.data); if (!disposed) accept(saved); }
    catch (error) {
      if (!disposed) { state.error = error instanceof DraftRequestError ? error.code : 'CONNECTION'; state.status = state.error === 'REVISION_CONFLICT' ? 'conflict' : 'error'; }
    } finally { busy = false; if (!disposed) { emit(); schedule(); } }
  }
  return {
    snapshot,
    edit(changes: Partial<IdeaFields>) {
      if (disposed) return;
      state.local = { ...state.local, ...changes };
      if (!busy && !['error', 'conflict'].includes(state.status)) state.status = sameIdea(state.local, state.saved) ? 'saved' : 'dirty';
      emit(); schedule();
    },
    flush,
    async recover() {
      // Resolve an unknown outcome by reading first; never blindly retry with a new revision.
      if (disposed || busy || !['error', 'conflict'].includes(state.status)) return;
      busy = true; clear();
      try {
        const remote = await transport.read();
        if (disposed) return;
        if ((attempted && sameIdea(remote, attempted)) || remote.revision === state.saved.revision) accept(remote);
        else { state.remote = remote; state.status = 'conflict'; state.error = 'REVISION_CONFLICT'; }
      } catch (error) { if (!disposed) state.error = error instanceof DraftRequestError ? error.code : 'CONNECTION'; }
      finally { busy = false; if (!disposed) { emit(); schedule(); } }
    },
    resolve(choice: 'keep-local' | 'use-remote') {
      // UI must show both versions and require this explicit decision after recover().
      if (disposed || busy || state.status !== 'conflict' || !state.remote) return;
      if (choice === 'use-remote') state.local = fieldsOf(state.remote);
      accept(state.remote); emit(); schedule();
    },
    dispose() { disposed = true; clear(); },
  };
}
