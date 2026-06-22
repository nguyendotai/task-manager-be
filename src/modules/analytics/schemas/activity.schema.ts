import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const workspaceActivityQuerySchema = z.object({
  params: z.object({
    workspaceId: objectIdSchema,
  }),
  query: z.object({
    action: z.string().optional(),
    entityType: z.string().optional(),
    userId: objectIdSchema.optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
