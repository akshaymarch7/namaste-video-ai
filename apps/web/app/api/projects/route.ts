import { handleProjects } from '@/src/projects/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => handleProjects(request, 'list');
export const POST = (request: Request) => handleProjects(request, 'create');
