'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui';
import type { AutosaveState } from '@/src/drafts/autosave';
import { ideaRequestSchema, type IdeaResult, type Suggestion } from '@/src/ideas/contracts';
import { signInLocation } from '@/src/auth/navigation';
export function Brainstorm({ projectId, draft, apply }: { projectId: string; draft: AutosaveState; apply: (idea: Suggestion, revision: number) => boolean }) {
  const [prompt, setPrompt] = useState(''), [result, setResult] = useState<IdeaResult | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const pending = useRef<{ key: string; body: string } | null>(null), inFlight = useRef(false), active = useRef(false), sequence = useRef(0);
  const path = `/api/projects/${projectId}/idea-suggestions`;
  async function request(replay = false, create = false) {
    if (inFlight.current) return;
    if (create) {
      const parsed = ideaRequestSchema.safeParse({ expectedDraftRevision: draft.saved.revision, prompt });
      if (!parsed.success || draft.status !== 'saved') { setError('VALIDATION_FAILED'); return; }
      pending.current = { key: crypto.randomUUID(), body: JSON.stringify(parsed.data) };
    }
    inFlight.current = true; setBusy(true); setError(''); setNotice('');
    const attempt = create || replay ? pending.current : null, version = ++sequence.current;
    try {
      const response = await fetch(path, { method: attempt ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(40000),
        ...(attempt ? { headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.key }, body: attempt.body } : {}) });
      const body = await response.json(); if (!active.current || version !== sequence.current) return;
      if (response.status === 401) { window.location.replace(signInLocation('expired')); return; }
      if (response.status === 403 && body.error?.code === 'ACCESS_DISABLED') { window.location.replace('/access-help?state=disabled'); return; }
      if (!response.ok) {
        if (response.status < 500 || body.error?.code === 'AI_NOT_CONFIGURED') pending.current = null;
        setError(body.error?.code ?? 'CONNECTION'); return;
      }
      setResult(body.data);
      // Keep the original key while running so status checks never create another request.
      if (body.data?.state !== 'running') pending.current = null;
    } catch { if (active.current && version === sequence.current) setError('CONNECTION'); }
    finally { if (active.current && version === sequence.current) { inFlight.current = false; setBusy(false); } }
  }
  useEffect(() => {
    active.current = true; inFlight.current = false; pending.current = null; setResult(null); setPrompt(''); void request();
    return () => { active.current = false; sequence.current++; };
    // Mount/reload fetch only; draft changes must not overwrite or regenerate suggestions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  const stale = Boolean(result && (draft.status !== 'saved' || result.sourceDraftRevision !== draft.saved.revision));
  const messages: Record<string, string> = {
    AI_NOT_CONFIGURED: 'AI suggestions need server configuration. Your idea is still saved.',
    PROVIDER_LIMIT: 'The AI service has reached its request or credit limit. Try again later.',
    PROVIDER_UNAVAILABLE: 'The AI service is temporarily unavailable. Your draft is saved; try a new request later.',
    PROVIDER_AUTHORIZATION: 'The AI service needs an administrator to check its API key permissions.',
    PROVIDER_CONFIGURATION: 'The AI service needs an administrator to check its model configuration.',
    PROVIDER_RESPONSE_INVALID: 'The AI service returned an unusable response. You can request new ideas.',
    PROJECT_BUSY: 'Another request is active for this project. Check its status before trying again.',
    REVISION_CONFLICT: 'The saved idea changed. Reload or resolve your draft before requesting new suggestions.',
    VALIDATION_FAILED: 'Save your idea and enter a prompt between 1 and 2,000 characters.',
    CONNECTION: 'We couldn’t confirm the result. Retry the same request to recover it without intentionally starting another.',
    NOT_FOUND: 'This project is no longer available.',
  };
  return <section className="brainstorm-panel" aria-labelledby="brainstorm-heading"><p className="eyebrow">A LITTLE INSPIRATION</p><h2 id="brainstorm-heading">Explore an idea.</h2><p className="brainstorm-intro">Ask AI for a few ways to explain your topic. You choose what becomes your draft.</p>
    <label htmlFor="brainstorm-prompt">What would you like to explore?</label><textarea id="brainstorm-prompt" rows={4} value={prompt} disabled={busy || Boolean(pending.current)} onChange={e => setPrompt(e.target.value)} placeholder="Three visual ways to teach binary search…" aria-describedby="brainstorm-hint" /><p className="hint" id="brainstorm-hint">{prompt.length}/2,000 · English suggestions · 60–90 seconds</p>
    <div className="brainstorm-actions">{pending.current || result?.state === 'running' ? <Button variant="secondary" disabled={busy} onClick={() => void request(Boolean(pending.current))}>{busy ? 'Exploring…' : 'Check request'}</Button> : <Button disabled={busy || draft.status !== 'saved' || !prompt.trim() || prompt.length > 2000} onClick={() => void request(false, true)}>{busy ? 'Exploring…' : 'Suggest ideas'}</Button>}
    {error && !pending.current && <Button variant="secondary" disabled={busy} onClick={() => void request()}>Refresh results</Button>}</div>
    {draft.status !== 'saved' && <p className="hint">Finish saving your draft before requesting or applying ideas.</p>}
    {error && <p className="auth-error" role="alert">{messages[error] ?? 'Suggestions are temporarily unavailable. Your draft has not changed.'}</p>}
    {result?.state === 'running' && <p role="status">Your request is still in progress. Check again shortly.</p>}
    {result && ['unknown','failed'].includes(result.state) && <p className="auth-error" role="status">{result.state === 'unknown' ? 'The previous request could not be confirmed. A new request may use provider credits again.' : messages[result.errorCode ?? ''] ?? 'The AI service could not return usable suggestions. You can make a new request.'}</p>}
    {stale && result?.state === 'completed' && <p className="hint">These ideas came from an earlier draft. Request new suggestions for your saved changes.</p>}
    <div className="suggestion-list">{result?.state === 'completed' && result.suggestions.map((idea, index) => <article key={`${result.id}-${index}`}><span className="suggestion-number">0{index + 1}</span><h3>{idea.title}</h3><p>{idea.angle}</p><details><summary>Read idea</summary><p>{idea.topic}</p></details><Button variant="secondary" disabled={stale || busy} onClick={() => { if (apply(idea, result.sourceDraftRevision)) setNotice('Idea added to Topic. It will save automatically.'); else setNotice('Your draft changed. Finish saving and request new suggestions.'); }}>Use idea</Button></article>)}</div>
    <p role="status" className="hint">{notice}</p><p className="hint">AI suggestions may be inaccurate. Review your topic before continuing.</p>
  </section>;
}
