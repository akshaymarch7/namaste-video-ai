// Expand this allowlist only when a new private destination actually exists.
export function safeReturnTo(value: unknown): string {
  return typeof value === 'string' && ['/projects'].includes(value) ? value : '/projects';
}
export function signInLocation(reason?: 'expired' | 'signed-out') {
  const query = new URLSearchParams({ returnTo: '/projects' });
  if (reason) query.set('reason', reason);
  return `/sign-in?${query}`;
}
