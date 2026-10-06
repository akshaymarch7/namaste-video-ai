import {applyStoryboard} from '../storyboards/editable-contract';
import 'server-only';
import { assertDraftsReady } from '../drafts/setup';
import { draftService } from '../drafts/service';
import { patchDraft } from '../drafts/contracts';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { dependencies } from '../auth/runtime';
import { isAdmitted } from '../auth/engine';
import { HttpError, readBody } from '../auth/http';
import { assertProjectsReady } from './setup';
import { createProject, renameProject, deleteProject, listProjects, projectId, idempotencyKey, ProjectError } from './contracts';
import { projectService } from './service';
export type ProjectAction = 'list' | 'create' | 'read' | 'rename' | 'delete' | 'draft-read' | 'draft-save' | 'draft-apply';
export async function handleProjects(request: Request, action: ProjectAction, rawId?: string, getDependencies = dependencies) {
  const requestId = `req_${randomUUID().replaceAll('-', '')}`;
  const headers = new Headers({ 'Cache-Control': 'private, no-store', 'X-Request-Id': requestId });
  const reply = (data: unknown, status = 200, page?: unknown) => status === 204 ? new Response(null, { status, headers }) : Response.json({ data, ...(page ? { page } : {}), meta: { requestId } }, { status, headers });
  try {
    if (!request.headers.get('cookie')) throw new ProjectError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
    const { db, client, config, auth } = await getDependencies();
    const session = await auth.api.getSession({ headers: new Headers({ cookie: request.headers.get('cookie')! }) });
    if (!session) throw new ProjectError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
    const ownerId = session.user.id;
    if (!await isAdmitted(db, ownerId)) throw new ProjectError(403, 'ACCESS_DISABLED', 'Account access is disabled.');
    if (!['list', 'read', 'draft-read'].includes(action) && request.headers.get('origin') !== config.origin) throw new ProjectError(403, 'INVALID_ORIGIN', 'Request origin is not allowed.');
    const parsedId = rawId === undefined ? undefined : projectId.safeParse(rawId);
    if (parsedId && !parsedId.success) throw new ProjectError(404, 'NOT_FOUND', 'Project not found.');
    const target = parsedId?.data!;
    await assertProjectsReady(db);
    if (action === 'draft-read' || action === 'draft-save' || action === 'draft-apply') {
      await assertDraftsReady(db);
      if (new URL(request.url).search) throw new ProjectError(422, 'VALIDATION_FAILED', 'Query parameters are not supported.');
      const drafts = draftService(db, client);
      if(action==='draft-apply'){
        const result=await drafts.apply(ownerId,target,idempotencyKey.parse(request.headers.get('idempotency-key')),applyStoryboard.parse(await readBody(request)));
        if(result.replayed)headers.set('Idempotency-Replayed','true');
        return reply(result.data);
      }
      return reply(action === 'draft-read' ? await drafts.get(ownerId, target) : await drafts.save(ownerId, target, patchDraft.parse(await readBody(request))));
    }
    const service = projectService(db, client, config.secret);
    if (action === 'list') {
      const query = new URL(request.url).searchParams;
      if (new Set(query.keys()).size !== [...query.keys()].length) throw new ProjectError(422, 'VALIDATION_FAILED', 'Duplicate query parameters are not allowed.');
      const input = listProjects.parse(Object.fromEntries(query));
      const result = await service.list(ownerId, input);
      return reply(result.data, 200, result.page);
    }
    if (action === 'read') return reply(await service.get(ownerId, target));
    const body = await readBody(request);
    if (action === 'rename') return reply(await service.rename(ownerId, target, renameProject.parse(body)));
    const key = idempotencyKey.parse(request.headers.get('idempotency-key'));
    const result = action === 'create' ? await service.create(ownerId, key, createProject.parse(body)) : await service.remove(ownerId, target, key, deleteProject.parse(body));
    if (result.replayed) headers.set('Idempotency-Replayed', 'true');
    if (result.status === 201 && result.data) headers.set('Location', `/api/projects/${result.data.id}`);
    return reply(result.data, result.status);
  } catch (error) {
    let status = 503, code = 'SERVICE_UNAVAILABLE', message = 'Project service is temporarily unavailable.', details: Record<string, unknown> | undefined;
    if (error instanceof ProjectError || error instanceof HttpError) {
      ({ status, code, message } = error); if (error instanceof ProjectError) details = error.details;
    } else if (error instanceof z.ZodError) { status = 422; code = 'VALIDATION_FAILED'; message = 'Check the request fields, bounds and required preconditions.'; }
    if (code === 'COMMAND_IN_PROGRESS') headers.set('Retry-After', '1');
    return Response.json({ error: { code, message, requestId, retryable: status === 503 || code === 'COMMAND_IN_PROGRESS', ...(details ? { details } : {}) }, meta: { requestId } }, { status, headers });
  }
}
