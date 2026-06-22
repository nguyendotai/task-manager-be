import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment content is required').max(2000),
    taskId: objectIdSchema,
    attachments: z.array(z.string().url()).optional(),
  }),
});

export const updateCommentSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    content: z.string().min(1).max(2000),
  }),
});

export const commentIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const taskCommentsParamSchema = z.object({
  params: z.object({
    taskId: objectIdSchema,
  }),
});
