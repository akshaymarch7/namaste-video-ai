import { handleStoryboards } from '@/src/storyboards/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;
type Context = { params: Promise<{id: string}> };
export const GET = async (request: Request, context: Context) => handleStoryboards(request, 'read', (await context.params).id);
