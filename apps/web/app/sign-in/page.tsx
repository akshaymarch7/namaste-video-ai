import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthShell, AccessMark } from '@/components/auth-shell';
import { SignInForm } from '@/components/sign-in-form';
import { readPageSession } from '@/src/auth/runtime';
import { safeReturnTo } from '@/src/auth/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in' };
export default async function SignIn({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  const session = await readPageSession(new Headers(await headers()));
  if (session.state === 'authenticated') redirect(returnTo);
  return <AuthShell><section className="auth-card" aria-labelledby="sign-in-heading"><AccessMark /><p className="eyebrow">Welcome to your workspace</p><h1 id="sign-in-heading">Good to see you.</h1><p className="auth-description">Sign in and make room for your next idea.</p><SignInForm returnTo={returnTo} reason={typeof params.reason === 'string' ? params.reason : undefined} /></section></AuthShell>;
}
