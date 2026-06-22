import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const createLabelSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Label name is required').max(50),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color')
      .optional(),
    workspaceId: objectIdSchema,
  }),
});

export const updateLabelSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color').optional(),
  }),
});

export const getWorkspaceLabelsSchema = z.object({
  params: z.object({
    workspaceId: objectIdSchema,
  }),
});
