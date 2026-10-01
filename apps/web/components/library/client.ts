import type { ProjectView } from '@/src/projects/contracts';
export class LibraryError extends Error {
  constructor(public code: string, public uncertain = false) { super(code); }
}
export async function libraryRequest(path: string, options: RequestInit = {}) {
  let response: Response;
  try { response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', ...options, signal: options.signal ?? AbortSignal.timeout(15000) }); }
  catch (error) { if (options.signal?.aborted) throw error; throw new LibraryError('CONNECTION', true); }
  if (response.status === 204) return null;
  let body;
  try { body = await response.json(); } catch { throw new LibraryError('CONNECTION', true); }
  if (!response.ok) throw new LibraryError(body.error?.code ?? 'SERVICE_UNAVAILABLE', response.status >= 500 || body.error?.code === 'COMMAND_IN_PROGRESS');
  return body;
}
export function mergeProjects(current: ProjectView[], incoming: ProjectView[]) {
  const items = new Map(current.map(item => [item.id, item]));
  for (const item of incoming) items.set(item.id, item);
  return [...items.values()];
}
export function libraryMessage(code: string) {
  switch (code) {
    case 'REVISION_CONFLICT': return 'This project changed in another tab. Reload its current details before saving again.';
    case 'PROJECT_DELETE_UNAVAILABLE': return 'This project has content that cannot be deleted here yet.';
    case 'NOT_FOUND': return 'This project is no longer available. Refresh your library.';
    case 'INVALID_CURSOR': return 'The list has changed or expired. Refresh to continue.';
    case 'VALIDATION_FAILED': return 'Enter a title between 1 and 100 characters.';
    default: return 'We couldn’t confirm the request. Check your connection and try again.';
  }
}
