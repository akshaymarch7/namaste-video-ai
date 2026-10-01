import { sessionRoute } from '@/src/auth/runtime';
export const runtime = 'nodejs';
export function POST(request: Request) { return sessionRoute(request, 'sign-in'); }
