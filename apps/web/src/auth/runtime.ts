import 'server-only';
import { getDatabase } from '../db/client';
import { readAuthConfig } from './config';
import { createAuth } from './engine';
import { handleSession, type SessionAction } from './http';
import { assertAuthReady } from './setup';

let pending: Promise<{ auth: ReturnType<typeof createAuth>; db: Awaited<ReturnType<typeof getDatabase>>['db']; config: ReturnType<typeof readAuthConfig> }> | undefined;
async function dependencies() {
  if (!pending) pending = (async () => {
    const config = readAuthConfig();
    const { db, client } = await getDatabase();
    await assertAuthReady(db);
    return { config, db, auth: createAuth(db, client, config) };
  })().catch(error => { pending = undefined; throw error; });
  return pending;
}
export const sessionRoute = (request: Request, action: SessionAction) => handleSession(request, action, dependencies);
