import {observeHandler, measureStage} from '../diagnostics/timing';
import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Db } from 'mongodb';
import type { AuthConfig } from './config';
import { isAdmitted, type AuthEngine } from './engine';
import { emailSchema } from './operator';
import { LoginLimited, reserveLogin } from './throttle';

type Dependencies = { auth: AuthEngine; db: Db; config: AuthConfig };
export type SessionAction = 'sign-in' | 'read' | 'sign-out';
export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
const signInBody = z.object({ email: emailSchema, password: z.string().min(1).max(128) }).strict();
export async function readBody(request: Request) {
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Use application/json.');
  }
  const reader = request.body?.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 256 * 1024) { await reader.cancel(); throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.'); }
      chunks.push(value);
    }
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch {
    throw new HttpError(400, 'INVALID_JSON', 'Request body must contain valid JSON.');
  }
}
function cookieHeaders(source: Headers) {
  const headers = new Headers();
  const cookie = source.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  return headers;
}
function sessionView(value: { user: { id: string; email: string; name: string }; session: { expiresAt: string | Date } }) {
  return {
    user: { id: value.user.id, email: value.user.email, name: value.user.name },
    expiresAt: new Date(value.session.expiresAt).toISOString(), workspaceId: value.user.id,
    capabilities: { generation: false, instagramPublishing: false },
  };
}

async function handleSessionImpl(request: Request, action: SessionAction, dependencies: () => Promise<Dependencies>) {
  const requestId = `req_${randomUUID().replaceAll('-', '')}`;
  const headers = new Headers({ 'Cache-Control': 'private, no-store', 'X-Request-Id': requestId });
  const reply = (data: unknown, status = 200) => Response.json({ data, meta: { requestId } }, { status, headers });
  const error = (status: number, code: string, message: string) => Response.json({
    error: { code, message, retryable: status === 429 || status === 503 }, meta: { requestId },
  }, { status, headers });
  const copyCookies = (source: Headers) => source.getSetCookie().forEach(cookie => headers.append('Set-Cookie', cookie));
  try {
    const { auth, db, config } = await dependencies();
    if (action !== 'read' && request.headers.get('origin') !== config.origin) {
      throw new HttpError(403, 'INVALID_ORIGIN', 'Request origin is not allowed.');
    }
    if (action === 'sign-in') {
      const parsed = signInBody.safeParse(await readBody(request));
      if (!parsed.success) throw new HttpError(422, 'VALIDATION_FAILED', 'Provide a valid email and password; additional fields are not allowed.');
      const release = await reserveLogin(db, config, parsed.data.email, request.headers);
      const upstream = await auth.api.signInEmail({ body: parsed.data, asResponse: true });
      if (!upstream.ok) {
        if (upstream.status >= 500) { await release(); throw new Error('Auth unavailable'); }
        throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
      }
      const signedCookies = new Headers({ cookie: upstream.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') });
      const session = await measureStage('session',()=>auth.api.getSession({ headers: signedCookies }));
      if (!session || !await isAdmitted(db, session.user.id)) {
        await auth.api.signOut({ headers: signedCookies });
        throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
      }
      await release();
      copyCookies(upstream.headers);
      return reply(sessionView(session));
    }
    if (action === 'sign-out') {
      if (!z.object({}).strict().safeParse(await readBody(request)).success) throw new HttpError(422, 'VALIDATION_FAILED', 'Sign-out requires an empty JSON object.');
      const upstream = await auth.api.signOut({ headers: cookieHeaders(request.headers), asResponse: true });
      if (!upstream.ok) throw new Error('Auth unavailable');
      copyCookies(upstream.headers);
      return new Response(null, { status: 204, headers });
    }
    const session = await measureStage('session',()=>auth.api.getSession({ headers: cookieHeaders(request.headers) }));
    if (!session) throw new HttpError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
    if (!await isAdmitted(db, session.user.id)) throw new HttpError(403, 'ACCESS_DISABLED', 'Account access is disabled.');
    return reply(sessionView(session));
  } catch (cause) {
    if (cause instanceof HttpError) return error(cause.status, cause.code, cause.message);
    if (cause instanceof LoginLimited) {
      headers.set('Retry-After', String(cause.retryAfter));
      return error(429, 'RATE_LIMITED', 'Too many sign-in attempts. Try again later.');
    }
    return error(503, 'SERVICE_UNAVAILABLE', 'Sign-in service is temporarily unavailable.');
  }
}

export const handleSession=observeHandler('session',handleSessionImpl);
