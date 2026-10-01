import { handleProjects } from '@/src/projects/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
export const GET = async (request: Request, context: Context) => handleProjects(request, 'draft-read', (await context.params).id);
export const PATCH = async (request: Request, context: Context) => handleProjects(request, 'draft-save', (await context.params).id);
