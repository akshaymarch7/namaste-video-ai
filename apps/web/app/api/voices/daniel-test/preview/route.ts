import { handleIdeas } from '@/src/ideas/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const GET = (request: Request) => handleIdeas(request, 'preview');
