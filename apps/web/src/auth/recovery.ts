import 'server-only';
import { betterAuth } from 'better-auth';
import { z } from 'zod';
import type { Db, MongoClient } from 'mongodb';
import { DatabaseError } from '../db/config';
import { authOptions } from './engine';
import { assertAuthReady } from './setup';
import { emailSchema } from './operator';
import type { AuthConfig } from './config';

// No HTTP endpoint mounts this capability. The operator verifies identity out of band.
export async function recoverPassword(db: Db, client: MongoClient, config: AuthConfig, input: unknown) {
  await assertAuthReady(db);
  const parsed = z.object({ email: emailSchema, password: z.string().min(12).max(128) }).strict().safeParse(input);
  if (!parsed.success) throw new DatabaseError('RECOVERY_INPUT_INVALID', 'Use a valid email and a new password of 12–128 characters.');
  const access = await db.collection('internalAccess').findOne({ normalizedEmail: parsed.data.email, enabled: true, provisioningState: 'active' });
  if (!access?.provisionedUserId) throw new DatabaseError('RECOVERY_UNAVAILABLE', 'Recovery requires an enabled provisioned account. Disabled access is not re-enabled by password recovery.');
  let token: string | undefined;
  const options = authOptions(db, client, config);
  const auth = betterAuth({ ...options, emailAndPassword: { ...options.emailAndPassword,
    enabled: true, revokeSessionsOnPasswordReset: true, resetPasswordTokenExpiresIn: 300,
    sendResetPassword: async value => { if (value.user.id === access.provisionedUserId) token = value.token; },
  } });
  await auth.api.requestPasswordReset({ body: { email: parsed.data.email } });
  if (!token) throw new DatabaseError('RECOVERY_UNAVAILABLE', 'Could not prepare recovery for the provisioned identity.');
  try {
    await auth.api.resetPassword({ body: { token, newPassword: parsed.data.password } });
    return { status: 'recovered' };
  } finally { token = undefined; }
}
