import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { MongoServerError, type Db } from 'mongodb';
import type { AuthConfig } from './config';

const duration = 15 * 60_000;
export class LoginLimited extends Error {
  constructor(public retryAfter: number) { super('Too many login attempts.'); }
}
export async function reserveLogin(db: Db, config: AuthConfig, email: string, headers: Headers) {
  const now = Date.now(), windowStart = new Date(Math.floor(now / duration) * duration);
  const expiresAt = new Date(windowStart.getTime() + duration);
  // Missing trusted proxy configuration shares one conservative IP bucket; never trust arbitrary forwarded headers.
  const candidate = config.clientIpHeader ? headers.get(config.clientIpHeader)?.split(',')[0]?.trim() : undefined;
  const ip = candidate && isIP(candidate) ? candidate : 'unresolved-client';
  const digest = (value: string) => createHmac('sha256', config.secret).update(value).digest('hex');
  const buckets = db.collection<{ _id: string; count: number }>('rateLimitBuckets');
  const reserved: string[] = [];
  const release = async () => {
    for (const id of reserved) await buckets.updateOne({ _id: id, count: { $gt: 0 } }, { $inc: { count: -1 }, $set: { updatedAt: new Date() } });
  };
  try {
    for (const [kind, subject, max] of [['email', email, 5], ['ip', ip, 30]] as const) {
      const subjectHash = digest(`${kind}:${subject}`), action = `auth-login-${kind}`;
      const id = `lim_${digest(`${action}:${subjectHash}:${windowStart.toISOString()}`)}`;
      await buckets.findOneAndUpdate({ _id: id, count: { $lt: max } }, {
        $setOnInsert: { schemaVersion: 1, createdAt: new Date(), subjectHash, action, windowStart, expiresAt },
        $set: { updatedAt: new Date() }, $inc: { count: 1 },
      }, { upsert: true, returnDocument: 'after' });
      reserved.push(id);
    }
  } catch (error) {
    await release();
    if (error instanceof MongoServerError && error.code === 11000) throw new LoginLimited(Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)));
    throw error;
  }
  // Successful attempts release only their reservations. Failed/crashed attempts retain them until expiry.
  return release;
}
