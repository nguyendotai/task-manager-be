import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const createColumnSchema = z.object({
  body: z.object({
    boardId: objectIdSchema,
    name: z.string().min(1).max(100),
  }),
});

export const updateColumnSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().min(1).max(100),
  }),
});

export const columnIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const reorderColumnsSchema = z.object({
  body: z.object({
    boardId: objectIdSchema,
    columns: z.array(z.object({
      id: objectIdSchema,
      order: z.number().int().min(0),
    })).min(1),
  }),
});
