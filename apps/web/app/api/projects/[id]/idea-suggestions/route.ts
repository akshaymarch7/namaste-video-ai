import { handleIdeas } from '@/src/ideas/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
type Context = { params: Promise<{id: string}> };
export const GET = async (request: Request, context: Context) => handleIdeas(request, 'read', (await context.params).id);
export const POST = async (request: Request, context: Context) => handleIdeas(request, 'create', (await context.params).id);
