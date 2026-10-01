import { sessionRoute } from '@/src/auth/runtime';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return sessionRoute(request, 'read'); }
