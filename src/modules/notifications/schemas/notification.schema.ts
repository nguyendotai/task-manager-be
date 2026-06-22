import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const notificationListQuerySchema = z.object({
  query: z.object({
    unreadOnly: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const notificationIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});
