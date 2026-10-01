import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { readPageSession } from './runtime';
import { signInLocation } from './navigation';

// Call from each private page/data entry point, not only a persistent layout.
export async function requirePageUser() {
  const session = await readPageSession(new Headers(await headers()));
  if (session.state === 'authenticated') return session;
  if (session.state === 'disabled' || session.state === 'unavailable') redirect(`/access-help?state=${session.state}`);
  redirect(signInLocation(session.state === 'expired' ? 'expired' : undefined));
}
