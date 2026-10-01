import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { dependencies } from '../auth/runtime';
import { isAdmitted } from '../auth/engine';
import { HttpError, readBody } from '../auth/http';
import { projectId, idempotencyKey, ProjectError } from '../projects/contracts';
import { ideaRequestSchema } from './contracts';
import { assertIdeasReady } from './setup';
import { ideaService } from './service';
import { geminiConfig, suggest, voicePreview, ProviderError } from './providers';
const defaultProvider = () => { const config = geminiConfig(); return { model: config.model, run: (input: Parameters<typeof suggest>[0], context: { requestId: string }) => suggest(input, config, fetch, event => console.info(JSON.stringify({ event: 'idea_provider_result', requestId: context.requestId, model: config.model, ...event }))) }; };
export async function handleIdeas(request: Request, action: 'read' | 'create' | 'voices' | 'preview', rawId?: string, deps = dependencies, provider = defaultProvider, preview = voicePreview) {
  const requestId = `req_${randomUUID().replaceAll('-', '')}`;
  const headers = { 'Cache-Control': 'private, no-store', 'X-Request-Id': requestId, 'Referrer-Policy': 'no-referrer' };
  const reply = (data: unknown, status = 200) => Response.json({ data, meta: { requestId } }, { status, headers });
  try {
    if (!request.headers.get('cookie')) throw new ProjectError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
    const { db, client, config, auth } = await deps();
    const session = await auth.api.getSession({ headers: new Headers({ cookie: request.headers.get('cookie')! }) });
    if (!session) throw new ProjectError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
    if (!await isAdmitted(db, session.user.id)) throw new ProjectError(403, 'ACCESS_DISABLED', 'Account access is disabled.');
    if (action === 'create' && request.headers.get('origin') !== config.origin) throw new ProjectError(403, 'INVALID_ORIGIN', 'Invalid origin.');
    if (new URL(request.url).search) throw new ProjectError(422, 'VALIDATION_FAILED', 'No query parameters are supported.');
    if (action === 'voices') return reply({ defaultPreset: 'daniel-test', voices: [{ preset: 'daniel-test', label: 'Daniel', accent: 'English', testOnly: true, previewPath: '/api/voices/daniel-test/preview' }] });
    if (action === 'preview') return new Response(new Uint8Array(await preview()), { headers: { ...headers, 'Content-Type': 'audio/mpeg', 'X-Content-Type-Options': 'nosniff' } });
    const parsed = projectId.safeParse(rawId); if (!parsed.success) throw new ProjectError(404, 'NOT_FOUND', 'Project not found.');
    await assertIdeasReady(db);
    const service = ideaService(db, client, provider);
    const data = action === 'read' ? await service.latest(session.user.id, parsed.data) : await service.create(session.user.id, parsed.data, idempotencyKey.parse(request.headers.get('idempotency-key')), ideaRequestSchema.parse(await readBody(request)));
    return reply(data, data?.state === 'running' ? 202 : 200);
  } catch (error) {
    let status = 503, code = 'SERVICE_UNAVAILABLE';
    if (error instanceof ProjectError || error instanceof HttpError) ({ status, code } = error);
    else if (error instanceof z.ZodError) { status = 422; code = 'VALIDATION_FAILED'; }
    else if (error instanceof ProviderError) code = error.code;
    return Response.json({ error: { code, message: 'The request could not be completed. Check your input, access or provider configuration.', requestId, retryable: false }, meta: { requestId } }, { status, headers });
  }
}
