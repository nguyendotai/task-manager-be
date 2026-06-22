import { z } from 'zod';
import { WorkspaceRole } from '@/common/constants/enums';

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Workspace name must be at least 2 characters').max(100),
    description: z.string().max(500).optional(),
  }),
});

export const updateWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    role: z.nativeEnum(WorkspaceRole).default(WorkspaceRole.MEMBER),
  }),
});

export const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.nativeEnum(WorkspaceRole),
  }),
});

export const invitationTokenParamSchema = z.object({
  params: z.object({
    token: z.string().min(1, 'Invitation token is required'),
  }),
});
