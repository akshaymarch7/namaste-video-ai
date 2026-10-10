import {measureStage} from '../diagnostics/timing';
import 'server-only';
import { getDatabase } from '../db/client';
import { readAuthConfig } from './config';
import { createAuth, isAdmitted } from './engine';
import { handleSession, type SessionAction } from './http';
import { assertAuthReady } from './setup';

let pending: Promise<{ client: Awaited<ReturnType<typeof getDatabase>>['client']; auth: ReturnType<typeof createAuth>; db: Awaited<ReturnType<typeof getDatabase>>['db']; config: ReturnType<typeof readAuthConfig> }> | undefined;
async function loadDependencies() {
  if (!pending) pending = (async () => {
    const config = readAuthConfig();
    const { db, client } = await getDatabase();
    await assertAuthReady(db);
    return { config, db, client, auth: createAuth(db, client, config) };
  })().catch(error => { pending = undefined; throw error; });
  return pending;
}
export const sessionRoute = (request: Request, action: SessionAction) => handleSession(request, action, dependencies);

export async function readPageSession(headers: Headers) {
  const cookie = headers.get('cookie');
  if (!cookie) return { state: 'anonymous' as const };
  try {
    const { auth, db } = await dependencies();
    const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
    if (!session) return { state: 'expired' as const };
    if (!await isAdmitted(db, session.user.id)) return { state: 'disabled' as const };
    return { state: 'authenticated' as const, user: { id: session.user.id, name: session.user.name, email: session.user.email }, expiresAt: session.session.expiresAt.toISOString() };
  } catch { return { state: 'unavailable' as const }; }
}

export function dependencies(){return measureStage('dependencies',loadDependencies);}
