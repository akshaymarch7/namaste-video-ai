import { z } from 'zod';
export const projectId = z.string().regex(/^prj_[A-Za-z0-9_-]{16,64}$/);
const title = z.string().trim().refine(value => [...value].length >= 1 && [...value].length <= 100, 'Title must contain 1–100 Unicode characters.');
const revision = z.number().int().min(1).max(2147483646);
export const createProject = z.object({ title: title.default('Untitled video') }).strict();
export const renameProject = z.object({ expectedRevision: revision, title }).strict();
export const deleteProject = z.object({ expectedRevision: revision, confirm: z.literal(true) }).strict();
export const filters = ['all', 'drafts', 'ready', 'scheduled', 'published', 'needs_attention'] as const;
export const listProjects = z.object({
  limit: z.string().regex(/^(?:[1-9]|[1-4][0-9]|50)$/).default('20').transform(Number),
  cursor: z.string().min(1).max(2048).optional(), filter: z.enum(filters).default('all'),
}).strict();
export const idempotencyKey = z.string().regex(/^[\x21-\x7e]{16,128}$/);
export type ProjectView = {
  id: string; title: string; revision: number; draftRevision: number; conversationId: string;
  currentStoryboardId: string | null; latestReadyVideoId: string | null;
  selectedVideoId: string | null; activeJobId: string | null;
  flags: { drafts: boolean; ready: boolean; scheduled: boolean; published: boolean; needsAttention: boolean };
  createdAt: string; updatedAt: string;
};
export class ProjectError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: Record<string, unknown>) { super(message); }
}
