import { z } from 'zod';
import { UserRole } from '@/common/constants/enums';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    avatar: z.string().url().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

export const userListQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    role: z.nativeEnum(UserRole).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const updateUserRoleSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    role: z.nativeEnum(UserRole),
  }),
});
