import { handleIdeas } from '@/src/ideas/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => handleIdeas(request, 'voices');
