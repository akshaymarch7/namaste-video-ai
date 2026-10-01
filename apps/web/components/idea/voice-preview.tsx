'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui';
export function VoicePreview({ preset }: { preset: string }) {
  const [url, setUrl] = useState<string | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const audio = useRef<HTMLAudioElement>(null), objectUrl = useRef<string | null>(null), pending = useRef(false), controller = useRef<AbortController | null>(null);
  useEffect(() => {
    setUrl(null); setError(''); setBusy(false); pending.current = false;
    return () => { controller.current?.abort(); controller.current = null; audio.current?.pause(); if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); objectUrl.current = null; };
  }, [preset]);
  async function load() {
    if (pending.current) return; pending.current = true; setBusy(true); setError('');
    const abort = new AbortController(); controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 25000);
    try {
      const response = await fetch('/api/voices/daniel-test/preview', { credentials: 'same-origin', cache: 'no-store', signal: abort.signal });
      if (!response.ok || !response.headers.get('content-type')?.startsWith('audio/')) throw new Error();
      const blob = await response.blob(); if (abort.signal.aborted || controller.current !== abort) return;
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(blob); setUrl(objectUrl.current);
    } catch { if (controller.current === abort) setError('Preview is unavailable right now. Your narrator selection is unchanged.'); }
    finally { clearTimeout(timeout); if (controller.current === abort) { pending.current = false; setBusy(false); } }
  }
  return <div className="voice-preview">{preset === 'daniel-test' ? <><Button variant="secondary" disabled={busy} onClick={() => void load()}>{busy ? 'Loading sample…' : url ? 'Reload voice sample' : 'Preview Daniel'}</Button>{url && <audio ref={audio} controls preload="metadata" src={url} aria-label="Daniel voice sample" onError={() => setError('This sample could not be played. Try loading it again.')} />}</> : <p className="hint">Preview is only available for the Daniel test preset.</p>}{error && <p role="alert" className="auth-error">{error}</p>}<p className="hint">Existing ElevenLabs sample. This does not generate speech or guarantee synthesis access.</p></div>;
}
