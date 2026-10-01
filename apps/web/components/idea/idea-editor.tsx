'use client';
import { Brainstorm } from './brainstorm';
import { VoicePreview } from './voice-preview';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui';
import { libraryRequest } from '../library/client';
import { createAutosave, draftTransport, type AutosaveState } from '@/src/drafts/autosave';
import type { IdeaFields } from '@/src/drafts/contracts';
import { signInLocation } from '@/src/auth/navigation';
const labels: Record<keyof IdeaFields, string> = { topic: 'Topic', audience: 'Audience', notes: 'Notes', voicePreset: 'Narrator' };
const statusText = { saved: 'All changes saved', dirty: 'Unsaved changes', saving: 'Saving…', error: 'Save needs attention', conflict: 'Another version was saved' };
function message(code: string) {
  switch (code) {
    case 'NOT_FOUND': return 'This project is no longer available in your workspace.';
    case 'VALIDATION_FAILED': return 'Check the field limits below, then retry saving. Your input is still here.';
    case 'VOICE_UNAVAILABLE': return 'This narrator is unavailable. Choose Daniel and retry saving.';
    case 'REVISION_CONFLICT': return 'Your draft changed in another tab. Load the saved version to compare before choosing what to keep.';
    default: return 'We couldn’t confirm the save. Your input is still here. Check your connection and retry.';
  }
}
export function IdeaEditor({ projectId, name }: { projectId: string; name: string }) {
  const [draft, setDraft] = useState<AutosaveState | null>(null), [title, setTitle] = useState('');
  const [loadError, setLoadError] = useState(''), [reload, setReload] = useState(0), [recovering, setRecovering] = useState(false);
  const controller = useRef<ReturnType<typeof createAutosave> | null>(null);
  const recoveryPending = useRef(false);
  const topicControl = useRef<HTMLTextAreaElement>(null), comparisonHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let active = true;
    setLoadError(''); setDraft(null);
    const transport = draftTransport(projectId);
    const sessionError = (code: string | null) => {
      if (code === 'UNAUTHENTICATED') { window.location.replace(signInLocation('expired')); return true; }
      if (code === 'ACCESS_DISABLED') { window.location.replace('/access-help?state=disabled'); return true; }
      return false;
    };
    void Promise.all([libraryRequest(`/api/projects/${projectId}`), transport.read()]).then(([project, initial]) => {
      if (!active) return;
      setTitle(project.data.title);
      const instance = createAutosave(initial, transport, state => {
        if (!active) return;
        setDraft(state); sessionError(state.error);
      });
      controller.current = instance; setDraft(instance.snapshot());
    }).catch(cause => {
      if (!active) return;
      const code = cause?.code ?? 'CONNECTION';
      if (!sessionError(code)) setLoadError(code);
    });
    // Full-document links intentionally retain the browser's native unsaved-change guard.
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (controller.current && controller.current.snapshot().status !== 'saved') { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => { active = false; controller.current?.dispose(); controller.current = null; window.removeEventListener('beforeunload', beforeUnload); };
  }, [projectId, reload]);
  async function recover() {
    if (recoveryPending.current) return;
    recoveryPending.current = true; setRecovering(true);
    try { await controller.current?.recover();
      if (controller.current?.snapshot().remote) requestAnimationFrame(() => comparisonHeading.current?.focus());
    } finally { recoveryPending.current = false; setRecovering(false); }
  }
  function resolve(choice: 'keep-local' | 'use-remote') {
    controller.current?.resolve(choice); topicControl.current?.focus();
  }
  const locked = draft?.error === 'NOT_FOUND';
  function field(key: 'topic' | 'audience' | 'notes', max: number, rows: number, placeholder: string) {
    const value = draft!.local[key], count = [...value].length, invalid = count > max;
    return <div className="idea-field"><label htmlFor={`idea-${key}`}>{labels[key]}{key !== 'topic' && <span> Optional</span>}</label><textarea ref={key === 'topic' ? topicControl : undefined} id={`idea-${key}`} rows={rows} value={value} placeholder={placeholder} disabled={locked} onChange={event => controller.current?.edit({ [key]: event.target.value })} aria-invalid={invalid} aria-describedby={`idea-${key}-count`} spellCheck /><p id={`idea-${key}-count`} className={invalid ? 'idea-count idea-invalid' : 'idea-count'}>{invalid ? 'Over the limit. Shorten this field to save. ' : ''}{count.toLocaleString('en-IN')} / {max.toLocaleString('en-IN')}</p></div>;
  }
  return <div className="idea-shell" data-private-focus-scope>
    <header className="idea-header"><a className="brand" href="/" aria-label="NamasteVideo home"><span className="brand-mark" aria-hidden="true">▶</span><span>NamasteVideo<span className="accent">.ai</span></span></a><a className="idea-back" href="/projects">← My videos</a><span className="idea-account">{name}</span></header>
    <main id="main" className="idea-main"><div className="idea-context"><p className="idea-project">{title || 'Your project'}</p><ol className="idea-steps" aria-label="Video workflow"><li aria-current="step"><span>01</span> Idea</li><li><span>02</span> Storyboard</li><li><span>03</span> Video</li><li><span>04</span> Publish</li></ol></div>
      <div className="idea-heading"><div><p className="eyebrow">EVERY GREAT VIDEO STARTS HERE</p><h1>What’s your <span className="accent">idea?</span></h1><p>Start with a concept. Give it a little context. Make it yours.</p></div><div className="idea-save-status" role="status" aria-live="polite">{draft && <><span className={draft.status === 'saved' ? 'save-dot' : 'save-dot save-dot--pending'} aria-hidden="true" />{statusText[draft.status]}</>}</div></div>
      {!draft ? loadError ? <section className="notice notice--error" role="alert"><h2>Couldn’t open this idea</h2><p>{loadError === 'NOT_FOUND' ? message(loadError) : 'Check your connection and try again.'}</p>{loadError !== 'NOT_FOUND' && <Button variant="secondary" onClick={() => setReload(value => value + 1)}>Try again</Button>}<a className="button button--secondary" href="/projects">Back to My videos</a></section> : <section className="idea-loading" role="status">Loading your saved idea…</section> : <div className="idea-layout">
        <form className="idea-form" onSubmit={event => { event.preventDefault(); void controller.current?.flush(); }}>
          <section className="idea-panel"><div className="idea-section-heading"><span className="idea-number">01</span><div><h2>The idea</h2><p>What would you like to explain?</p></div></div>{field('topic', 2000, 5, 'Explain binary search to a beginner…')}
            <details className="idea-details"><summary>Add audience & notes <span>Optional context</span></summary><div>{field('audience', 200, 2, 'For example, students learning to code')}{field('notes', 20000, 5, 'Examples, key points, or anything the story should include…')}</div></details>
          </section>
          <section className="idea-panel idea-narrator"><div className="idea-section-heading"><span className="idea-number">02</span><div><h2>The voice</h2><p>A narrator for your story.</p></div></div><label htmlFor="idea-voice">Narrator</label><select id="idea-voice" value={draft.local.voicePreset} disabled={locked} onChange={event => controller.current?.edit({ voicePreset: event.target.value })}>{draft.local.voicePreset !== 'daniel-test' && <option value={draft.local.voicePreset}>Previously saved narrator</option>}<option value="daniel-test">Daniel · English · Test voice</option></select><VoicePreview preset={draft.local.voicePreset} /></section>
          {draft.error && <section className="notice notice--error idea-feedback" role="alert"><strong>{locked ? 'Project unavailable' : 'Your draft needs attention'}</strong><p>{message(draft.error)}</p>{!locked && <Button variant="secondary" disabled={recovering} onClick={() => void recover()}>{recovering ? 'Checking saved version…' : draft.status === 'conflict' ? 'Compare saved version' : 'Check & retry save'}</Button>}</section>}
          {draft.status === 'conflict' && draft.remote && <section className="idea-panel idea-conflict" aria-label="Compare draft versions"><h2 ref={comparisonHeading} tabIndex={-1}>Choose what to keep</h2><p>Compare your current input with the saved version. Keeping yours replaces the saved idea fields.</p><div className="idea-comparisons">{(Object.keys(labels) as (keyof IdeaFields)[]).filter(key => draft.local[key] !== draft.remote![key]).map(key => <div key={key}><h3>{labels[key]}</h3><div className="idea-compare-columns"><div><strong>Your input</strong><pre>{draft.local[key] || '(empty)'}</pre></div><div><strong>Saved version</strong><pre>{draft.remote![key] || '(empty)'}</pre></div></div></div>)}</div><div className="idea-conflict-actions"><Button disabled={recovering} onClick={() => resolve('keep-local')}>Keep my input & save</Button><Button variant="secondary" disabled={recovering} onClick={() => resolve('use-remote')}>Use saved version</Button></div></section>}
          <div className="idea-save-bar"><p>Changes save automatically.<br /><span>Keep this tab open until your changes are saved.</span></p><Button type="submit" disabled={draft.status !== 'dirty' || recovering || locked}>Save now</Button></div>
        </form>
        <aside className="idea-brainstorm"><Brainstorm projectId={projectId} draft={draft} apply={(idea, revision) => {
          const current = controller.current?.snapshot();
          if (!current || current.status !== 'saved' || current.saved.revision !== revision) return false;
          controller.current!.edit({ topic: idea.topic }); topicControl.current?.focus(); return true;
        }} /></aside>
      </div>}
    </main><footer className="idea-footer">Your ideas stay in your personal workspace.</footer>
  </div>;
}
