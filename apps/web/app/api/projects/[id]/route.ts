import { handleProjects } from '@/src/projects/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
export const GET = async (request: Request, context: Context) => handleProjects(request, 'read', (await context.params).id);
export const PATCH = async (request: Request, context: Context) => handleProjects(request, 'rename', (await context.params).id);
export const DELETE = async (request: Request, context: Context) => handleProjects(request, 'delete', (await context.params).id);
