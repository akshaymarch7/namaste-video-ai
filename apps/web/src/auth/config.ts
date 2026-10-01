import { DatabaseError } from '../db/config';

export type AuthConfig = { secret: string; origin: string; secure: boolean; clientIpHeader?: string };
export function readAuthConfig(env: Record<string, string | undefined> = process.env): AuthConfig {
  const secret = env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new DatabaseError('AUTH_CONFIG_MISSING', 'Set a random BETTER_AUTH_SECRET of at least 32 characters in the web environment.');
  let url: URL;
  try { url = new URL(env.BETTER_AUTH_URL ?? ''); } catch {
    throw new DatabaseError('AUTH_CONFIG_INVALID', 'Set BETTER_AUTH_URL to the exact application origin.');
  }
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash
    || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname) && env.NODE_ENV !== 'production'))) {
    throw new DatabaseError('AUTH_CONFIG_INVALID', 'Use an HTTPS origin; HTTP loopback is allowed only outside production.');
  }
  const clientIpHeader = env.AUTH_CLIENT_IP_HEADER?.toLowerCase();
  if (clientIpHeader && !['x-vercel-forwarded-for', 'x-real-ip'].includes(clientIpHeader)) {
    throw new DatabaseError('AUTH_CONFIG_INVALID', 'Configure only an IP header overwritten by your trusted reverse proxy.');
  }
  return { secret, origin: url.origin, secure: url.protocol === 'https:', clientIpHeader };
}
