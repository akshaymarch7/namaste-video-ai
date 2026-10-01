import { z } from 'zod';
export const suggestionSchema = z.object({ title: z.string().min(1).max(100), topic: z.string().min(1).max(2000), angle: z.string().min(1).max(300) }).strict();
export const suggestionsSchema = z.object({ suggestions: z.array(suggestionSchema).min(3).max(5) }).strict();
export const ideaRequestSchema = z.object({ expectedDraftRevision: z.number().int().min(1).max(2147483647), prompt: z.string().trim().min(1).max(2000) }).strict();
export type IdeaRequest = z.infer<typeof ideaRequestSchema>;
export type Suggestion = z.infer<typeof suggestionSchema>;
export type IdeaResult = { id: string; state: 'running' | 'completed' | 'failed' | 'unknown'; sourceDraftRevision: number; model: string; suggestions: Suggestion[]; errorCode: string | null; createdAt: string };
