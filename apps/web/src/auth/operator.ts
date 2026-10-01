import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Db, MongoClient } from 'mongodb';
import { z } from 'zod';
import { DatabaseError } from '../db/config';
import { createAuth } from './engine';
import type { AuthConfig } from './config';
import { assertAuthReady } from './setup';

export const emailSchema = z.string().trim().toLowerCase().max(254).email();
const provisionSchema = z.object({ email: emailSchema, name: z.string().trim().min(1).max(100), password: z.string().min(12).max(128) }).strict();

export async function provisionUser(db: Db, client: MongoClient, config: AuthConfig, input: unknown) {
  await assertAuthReady(db);
  const parsed = provisionSchema.safeParse(input);
  if (!parsed.success) throw new DatabaseError('PROVISION_INPUT_INVALID', 'Use a valid email, name and password of 12–128 characters.');
  const { email, name, password } = parsed.data;
  const access = db.collection<{ _id: string; normalizedEmail: string; enabled: boolean; provisioningState: string; provisionedUserId?: string }>('internalAccess');
  await access.updateOne({ normalizedEmail: email }, { $setOnInsert: {
    _id: `acc_${randomUUID().replaceAll('-', '')}`, schemaVersion: 1, createdAt: new Date(), updatedAt: new Date(),
    normalizedEmail: email, enabled: false, provisioningState: 'pending', operatorRef: 'operator-cli',
  } }, { upsert: true });
  const admission = await access.findOne({ normalizedEmail: email });
  if (admission?.provisioningState === 'disabled') throw new DatabaseError('ACCESS_DISABLED', 'Disabled accounts require an explicit recovery flow; provisioning will not re-enable them.');
  const users = db.collection<{ _id: string; email: string }>('user');
  let user = await users.findOne({ email });
  if (!user) {
    const auth = createAuth(db, client, config, true);
    await auth.api.signUpEmail({ body: { email, name, password } });
    // With autoSignIn=false, duplicate signup responses can be synthetic. Link only the stored identity.
    user = await users.findOne({ email });
  }
  if (!user || !await db.collection('account').findOne({ userId: user._id, providerId: 'credential' })) {
    throw new DatabaseError('PROVISION_INCOMPLETE', 'Provisioning is incomplete; operator recovery is required.');
  }
  const result = await access.updateOne({ normalizedEmail: email, provisioningState: { $in: ['pending', 'active'] } }, {
    $set: { enabled: true, provisioningState: 'active', provisionedUserId: user._id, updatedAt: new Date() },
  });
  if (!result.matchedCount) throw new DatabaseError('ACCESS_DISABLED', 'Access changed while provisioning; no account was enabled.');
  return { userId: user._id, email, status: 'active' };
}

export async function disableUser(db: Db, input: unknown) {
  const email = emailSchema.parse(input);
  const access = await db.collection('internalAccess').findOneAndUpdate({ normalizedEmail: email }, {
    $set: { enabled: false, provisioningState: 'disabled', updatedAt: new Date() },
  }, { returnDocument: 'after' });
  // IDs are strings by our explicit, supported Better Auth generateId configuration.
  // Admission is denied first; deleting adapter-owned session rows then revokes current cookies.
  if (access?.provisionedUserId) await db.collection('session').deleteMany({ userId: access.provisionedUserId });
  return { status: 'disabled' };
}
