'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Brand, Button } from '../ui';
import { SignOutButton } from '../private-session';
import { filters, createProject, type ProjectView } from '@/src/projects/contracts';
import { signInLocation } from '@/src/auth/navigation';
import { libraryRequest, LibraryError, libraryMessage, mergeProjects } from './client';
const labels = { all: 'All', drafts: 'Drafts', ready: 'Ready', scheduled: 'Scheduled', published: 'Published', needs_attention: 'Needs attention' };
type Filter = typeof filters[number];
type Dialog = { kind: 'create' } | { kind: 'rename' | 'delete'; project: ProjectView };
export function ProjectLibrary({ name, email }: { name: string; email: string }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [items, setItems] = useState<ProjectView[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true), [more, setMore] = useState(false), [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0), [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const request = useRef<AbortController | null>(null), sequence = useRef(0), loadingRef = useRef(false);
  const newButton = useRef<HTMLButtonElement>(null), returnFocus = useRef<HTMLElement | null>(null);
  function sessionError(error: unknown) {
    if (error instanceof LibraryError && error.code === 'UNAUTHENTICATED') { window.location.replace(signInLocation('expired')); return true; }
    if (error instanceof LibraryError && error.code === 'ACCESS_DISABLED') { window.location.replace('/access-help?state=disabled'); return true; }
    return false;
  }
  const load = useCallback(async (next?: string) => {
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    const version = ++sequence.current; loadingRef.current = true;
    setError(''); if (next) setMore(true); else { setLoading(true); setItems([]); setCursor(null); setMore(false); }
    const timeout = setTimeout(() => controller.abort('timeout'), 15000);
    try {
      const query = new URLSearchParams({ limit: '12', filter }); if (next) query.set('cursor', next);
      const result = await libraryRequest(`/api/projects?${query}`, { signal: controller.signal });
      if (version !== sequence.current) return;
      setItems(previous => next ? mergeProjects(previous, result.data) : result.data); setCursor(result.page.nextCursor);
    } catch (cause) {
      if (version !== sequence.current || (controller.signal.aborted && controller.signal.reason !== 'timeout')) return;
      if (!sessionError(cause)) setError(cause instanceof LibraryError ? cause.code : 'CONNECTION');
    } finally {
      clearTimeout(timeout);
      if (version === sequence.current) { setLoading(false); setMore(false); loadingRef.current = false; }
    }
  }, [filter]);
  useEffect(() => {
    void load();
    return () => { sequence.current++; request.current?.abort(); loadingRef.current = false; };
  }, [load, refresh]);
  function open(value: Dialog) { returnFocus.current = document.activeElement as HTMLElement; setDialog(value); setNotice(''); }
  function close() {
    setDialog(null);
    requestAnimationFrame(() => { const target = returnFocus.current; (target?.isConnected ? target : newButton.current)?.focus(); });
  }
  function complete(message: string) {
    setDialog(null); setNotice(message); setRefresh(value => value + 1);
    // A refreshed grid replaces the triggering card; return focus to a stable control.
    requestAnimationFrame(() => newButton.current?.focus());
  }
  return <div className="library-shell">
    <div className="library-base" inert={dialog ? true : undefined}>
      <aside className="library-sidebar"><Brand /><p className="workspace-label">PERSONAL WORKSPACE</p><nav aria-label="Workspace"><a href="/projects" aria-current="page"><span aria-hidden="true">▦</span> My videos</a><a href="/settings">Settings</a></nav><div className="library-sidebar-bottom"><span className="internal-tag">Internal V1</span><p>One idea.<br />One clear story.</p><span>NamasteVideo.ai</span></div></aside>
      <div className="library-content"><header className="library-topbar"><span className="library-breadcrumb">Workspace <span aria-hidden="true">/</span> My videos</span><div className="library-account"><span title={email}>{name}</span><a href="/settings">Settings</a><SignOutButton /></div></header>
        <main id="main" className="library-main"><div className="library-heading"><div><p className="eyebrow">YOUR PERSONAL WORKSPACE</p><h1>My videos<span className="accent">.</span></h1><p>Your next story starts here.</p></div><button ref={newButton} className="button button--primary" onClick={() => open({ kind: 'create' })}><span aria-hidden="true">＋</span> New project</button></div>
          <p className="library-scope">Create a project, shape your idea, and pick up where you left off.</p>
          <div className="library-toolbar"><div className="library-filters" role="group" aria-label="Filter projects">{filters.map(value => <button key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); setNotice(''); }}>{labels[value]}</button>)}</div><button className="library-refresh" aria-label="Refresh projects" onClick={() => setRefresh(value => value + 1)} disabled={loading || more}>↻ <span>Refresh</span></button></div>
          <div className="library-announcement" role="status">{notice}</div>
          {error && <div className="library-error" role="alert"><div><strong>Couldn’t load your projects</strong><p>{libraryMessage(error)}</p></div><Button variant="secondary" onClick={() => void load(error === 'INVALID_CURSOR' ? undefined : cursor ?? undefined)}>Try again</Button></div>}
          {loading ? <div className="library-grid" aria-busy="true" aria-label="Loading projects">{[0,1,2].map(value => <div key={value} className="project-skeleton"><div /><span /><span /></div>)}</div> : items.length ? <><div className="library-grid">{items.map(item => <article className="project-card" key={item.id}>
            <div className="project-art" aria-hidden="true"><span className="project-art-label">PROJECT</span><div className="project-diagram"><i /><b /><i /><b /><i /></div><span className="project-art-caption">A story waiting to happen</span></div>
            <div className="project-info"><div className="project-flags">{Object.entries(item.flags).filter(([, active]) => active).map(([flag]) => <span key={flag}>{labels[flag === 'needsAttention' ? 'needs_attention' : flag as Filter]}</span>)}</div><h2><a href={`/projects/${item.id}/idea`}>{item.title}</a></h2>{item.nextSchedule&&<p>Scheduled {item.nextSchedule.localTime.replace('T',' ')} · {item.nextSchedule.timezone} · UTC{item.nextSchedule.utcOffset} <a href={`/projects/${item.id}/publish?video=${item.nextSchedule.videoId}`}>Manage schedule →</a></p>}<p className="project-updated">Updated <time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</time></p><div className="project-actions">{item.flags.ready&&<a href={`/projects/${item.id}/video`} aria-label={`Review video for ${item.title}`}>Review video →</a>}<a href={`/projects/${item.id}/idea`} aria-label={`Edit idea for ${item.title}`}>Edit idea →</a><button onClick={() => open({ kind: 'rename', project: item })} aria-label={`Rename ${item.title}`}>Rename</button><button onClick={() => open({ kind: 'delete', project: item })} aria-label={`Delete ${item.title}`}>Delete</button></div></div>
          </article>)}</div><div className="library-pagination"><p>{items.length} {items.length === 1 ? 'project' : 'projects'} loaded</p>{cursor && <Button variant="secondary" disabled={more} onClick={() => { if (!loadingRef.current) void load(cursor); }}>{more ? 'Loading…' : 'Load more'}</Button>}</div></> : !error && <section className="library-empty"><div className="empty-film" aria-hidden="true"><span>＋</span></div><p className="eyebrow">{filter === 'all' ? 'A BLANK CANVAS. ENDLESS POSSIBILITIES.' : labels[filter].toUpperCase()}</p><h2>{filter === 'all' ? 'Your first video starts with an idea.' : 'No projects match this filter.'}</h2><p>{filter === 'all' ? 'Give your idea a home. Create a project to get started.' : 'Try another filter or return to all your projects.'}</p><Button onClick={() => filter === 'all' ? open({ kind: 'create' }) : setFilter('all')}>{filter === 'all' ? 'Create your first project' : 'Clear filters'}</Button></section>}
        </main><footer className="library-footer"><span>{email}</span><span>Your projects. Your workspace.</span></footer>
      </div>
    </div>
    {dialog && <ProjectDialog dialog={dialog} close={close} complete={complete} sessionError={sessionError} />}
  </div>;
}
function ProjectDialog({ dialog, close, complete, sessionError }: { dialog: Dialog; close: () => void; complete: (message: string) => void; sessionError: (error: unknown) => boolean }) {
  const [title, setTitle] = useState(dialog.kind === 'create' ? '' : dialog.project.title);
  const [project, setProject] = useState(dialog.kind === 'create' ? null : dialog.project);
  const [busy, setBusy] = useState(false), [uncertain, setUncertain] = useState(false), [error, setError] = useState('');
  const pending = useRef(false), receipt = useRef<{ body: string; key: string } | null>(null), box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = box.current;
    if (element?.getClientRects().length && !element.contains(document.activeElement)) {
      (element.querySelector<HTMLElement>('input:not(:disabled),button:not(:disabled)') ?? element).focus();
    }
  }, [busy, error]);
  function keys(event: KeyboardEvent) {
    if (event.key === 'Escape' && !busy && !uncertain) { event.preventDefault(); close(); }
    if (event.key !== 'Tab') return;
    const controls = [...box.current!.querySelectorAll<HTMLElement>('input:not(:disabled),button:not(:disabled),[tabindex="0"]')];
    if (!controls.length) { event.preventDefault(); box.current?.focus(); return; }
    const first = controls[0], last = controls.at(-1)!;
    if (event.shiftKey && (document.activeElement === first || document.activeElement === box.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  async function reload() {
    if (!project || pending.current) return; pending.current = true; setBusy(true);
    try {
      const result = await libraryRequest(`/api/projects/${project.id}`);
      if (dialog.kind === 'rename' && result.data.title === title.trim()) { complete('Project renamed.'); return; }
      setProject(result.data); setUncertain(false); setError(''); receipt.current = null;
    } catch (cause) { if (!sessionError(cause)) { if (cause instanceof LibraryError && cause.code === 'NOT_FOUND') complete('Project is no longer available.'); else setError('CONNECTION'); } }
    finally { pending.current = false; setBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (pending.current) return;
    const parsed = createProject.safeParse({ title });
    if (dialog.kind !== 'delete' && !parsed.success) { setError('VALIDATION_FAILED'); return; }
    const body = JSON.stringify(dialog.kind === 'create' ? parsed!.data : dialog.kind === 'rename' ? { title: parsed!.data!.title, expectedRevision: project!.revision } : { expectedRevision: project!.revision, confirm: true });
    if (!receipt.current || receipt.current.body !== body) receipt.current = { body, key: crypto.randomUUID() };
    pending.current = true; setBusy(true); setError('');
    try {
      await libraryRequest(dialog.kind === 'create' ? '/api/projects' : `/api/projects/${project!.id}`, { method: dialog.kind === 'create' ? 'POST' : dialog.kind === 'rename' ? 'PATCH' : 'DELETE', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': receipt.current.key }, body });
      complete(dialog.kind === 'create' ? 'Project created. Find it in All or Drafts.' : dialog.kind === 'rename' ? 'Project renamed.' : 'Project deleted.');
    } catch (cause) {
      if (!sessionError(cause)) { setError(cause instanceof LibraryError ? cause.code : 'CONNECTION'); setUncertain(cause instanceof LibraryError && cause.uncertain); }
    } finally { pending.current = false; setBusy(false); }
  }
  const heading = dialog.kind === 'create' ? 'Give your idea a name.' : dialog.kind === 'rename' ? 'Rename project' : 'Delete this project?';
  return <div className="project-modal-backdrop"><div className="project-modal" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title" aria-describedby="project-dialog-description" tabIndex={-1} ref={box} onKeyDown={keys}><p className="eyebrow">{dialog.kind === 'delete' ? 'DELETE PROJECT' : 'YOUR NEXT STORY'}</p><h2 id="project-dialog-title">{heading}</h2><p id="project-dialog-description">{dialog.kind === 'delete' ? `“${project!.title}” will be removed from your workspace. This cannot be undone. Only empty projects can be deleted at this stage.` : dialog.kind === 'create' ? 'Start with a title. Then open the project to shape your idea.' : `Current title: ${project!.title}`}</p>
    <form onSubmit={submit}><div className="auth-field">{dialog.kind !== 'delete' && <><label htmlFor="project-title">Project title</label><input id="project-title" value={title} onChange={event => setTitle(event.target.value)} disabled={busy || uncertain} autoComplete="off" aria-invalid={error === 'VALIDATION_FAILED'} aria-describedby="project-dialog-feedback" /><span className="hint">{[...title.trim()].length}/100 characters</span></>}</div>
      <div id="project-dialog-feedback" aria-live="polite">{error && <p className="auth-error">{libraryMessage(error)}</p>}{uncertain && <p className="hint">The request may have succeeded. Retry this same request to confirm it before making another change.</p>}</div>
      {(error === 'REVISION_CONFLICT' || (uncertain && dialog.kind === 'rename')) && <Button variant="secondary" disabled={busy} onClick={() => void reload()}>Reload current details</Button>}
      <div className="project-modal-actions"><Button variant="secondary" disabled={busy || uncertain} onClick={close}>Cancel</Button>{error === 'NOT_FOUND' ? <Button onClick={() => complete('Library refreshed.')}>Refresh library</Button> : <Button type="submit" disabled={busy || error === 'REVISION_CONFLICT' || error === 'PROJECT_DELETE_UNAVAILABLE'}>{busy ? 'Working…' : uncertain ? 'Retry same request' : dialog.kind === 'create' ? 'Create project' : dialog.kind === 'rename' ? 'Save changes' : 'Delete project'}</Button>}</div>
    </form></div></div>;
}
