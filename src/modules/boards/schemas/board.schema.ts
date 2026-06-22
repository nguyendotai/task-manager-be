import { z } from 'zod';
import { ResourceVisibility } from '@/common/constants/enums';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const createBoardSchema = z.object({
  body: z
    .object({
      name: z.string().min(2, 'Board name must be at least 2 characters').max(100),
      workspaceId: objectIdSchema.optional(),
      workspace: objectIdSchema.optional(),
      visibility: z.nativeEnum(ResourceVisibility).optional(),
      allowedMembers: z.array(objectIdSchema).optional(),
    })
    .refine((body) => body.workspaceId || body.workspace, {
      message: 'Workspace ID is required',
      path: ['workspaceId'],
    }),
});

export const updateBoardSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    visibility: z.nativeEnum(ResourceVisibility).optional(),
    allowedMembers: z.array(objectIdSchema).optional(),
  }),
});
