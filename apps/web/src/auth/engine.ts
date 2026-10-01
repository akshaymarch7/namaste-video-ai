import 'server-only';
import { randomUUID } from 'node:crypto';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { APIError } from 'better-auth/api';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import type { Db, MongoClient } from 'mongodb';
import type { AuthConfig } from './config';

export async function isAdmitted(db: Db, userId: string) {
  return Boolean(await db.collection('internalAccess').findOne({
    provisionedUserId: userId, enabled: true, provisioningState: 'active',
  }, { projection: { _id: 1 } }));
}

export function authOptions(db: Db, client: MongoClient, config: AuthConfig, operator = false): BetterAuthOptions {
  return {
    appName: 'NamasteVideo.ai', baseURL: config.origin, secret: config.secret,
    database: mongodbAdapter(db, { client }), trustedOrigins: [config.origin],
    emailAndPassword: { enabled: true, disableSignUp: !operator, autoSignIn: false, minPasswordLength: 12, maxPasswordLength: 128 },
    session: { expiresIn: 7 * 86400, disableSessionRefresh: true, cookieCache: { enabled: false } },
    advanced: {
      database: { generateId: () => randomUUID() },
      useSecureCookies: config.secure,
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure: config.secure },
    },
    // Our facade owns shared database throttling; the native HTTP handler is never mounted.
    rateLimit: { enabled: false }, logger: { disabled: true },
    plugins: operator ? [] : [{
      id: 'operator-managed-indexes',
      schema: Object.fromEntries(['user', 'session', 'account', 'verification'].map(model => [model, { fields: {}, disableMigration: true }])),
    }],
    databaseHooks: {
      user: { create: { before: async data => {
        if (!operator) throw new APIError('FORBIDDEN', { message: 'Account creation is operator-only.' });
        return { data };
      } } },
      session: { create: { before: async data => {
        if (!await isAdmitted(db, data.userId)) throw new APIError('UNAUTHORIZED', { message: 'Invalid credentials.' });
        return { data };
      } } },
    },
  };
}
export function createAuth(db: Db, client: MongoClient, config: AuthConfig, operator = false) {
  return betterAuth(authOptions(db, client, config, operator));
}
export type AuthEngine = ReturnType<typeof createAuth>;
