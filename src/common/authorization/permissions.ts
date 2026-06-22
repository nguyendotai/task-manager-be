import { ResourceVisibility, UserRole, WorkspaceRole } from '@/common/constants/enums';

export const Permissions = {
  WORKSPACE_CREATE: 'workspace:create',
  WORKSPACE_VIEW: 'workspace:view',
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_DELETE: 'workspace:delete',
  WORKSPACE_INVITE: 'workspace:invite',
  WORKSPACE_REMOVE_MEMBER: 'workspace:remove_member',
  WORKSPACE_MANAGE_ROLES: 'workspace:manage_roles',
  WORKSPACE_TRANSFER_OWNERSHIP: 'workspace:transfer_ownership',
  WORKSPACE_MANAGE_SETTINGS: 'workspace:manage_settings',

  BOARD_CREATE: 'board:create',
  BOARD_VIEW: 'board:view',
  BOARD_UPDATE: 'board:update',
  BOARD_DELETE: 'board:delete',
  BOARD_MANAGE_VISIBILITY: 'board:manage_visibility',

  TASK_CREATE: 'task:create',
  TASK_VIEW: 'task:view',
  TASK_UPDATE: 'task:update',
  TASK_UPDATE_OWN: 'task:update_own',
  TASK_DELETE: 'task:delete',
  TASK_ASSIGN: 'task:assign',
  TASK_MOVE: 'task:move',
  TASK_MANAGE_PRIVATE: 'task:manage_private',

  COMMENT_CREATE: 'comment:create',
  COMMENT_VIEW: 'comment:view',
  ATTACHMENT_UPLOAD: 'attachment:upload',

  ADMIN_ACCESS: 'admin:access',
  USER_MANAGE: 'user:manage',
  USER_BAN: 'user:ban',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export const ALL_PERMISSIONS = Object.values(Permissions);

export const PLATFORM_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: ALL_PERMISSIONS,
  [UserRole.ADMIN]: [Permissions.WORKSPACE_CREATE],
  [UserRole.USER]: [Permissions.WORKSPACE_CREATE],
};

export const WORKSPACE_ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  [WorkspaceRole.OWNER]: [
    Permissions.WORKSPACE_VIEW,
    Permissions.WORKSPACE_UPDATE,
    Permissions.WORKSPACE_DELETE,
    Permissions.WORKSPACE_INVITE,
    Permissions.WORKSPACE_REMOVE_MEMBER,
    Permissions.WORKSPACE_MANAGE_ROLES,
    Permissions.WORKSPACE_TRANSFER_OWNERSHIP,
    Permissions.WORKSPACE_MANAGE_SETTINGS,
    Permissions.BOARD_CREATE,
    Permissions.BOARD_VIEW,
    Permissions.BOARD_UPDATE,
    Permissions.BOARD_DELETE,
    Permissions.BOARD_MANAGE_VISIBILITY,
    Permissions.TASK_CREATE,
    Permissions.TASK_VIEW,
    Permissions.TASK_UPDATE,
    Permissions.TASK_UPDATE_OWN,
    Permissions.TASK_DELETE,
    Permissions.TASK_ASSIGN,
    Permissions.TASK_MOVE,
    Permissions.TASK_MANAGE_PRIVATE,
    Permissions.COMMENT_CREATE,
    Permissions.COMMENT_VIEW,
    Permissions.ATTACHMENT_UPLOAD,
  ],
  [WorkspaceRole.ADMIN]: [
    Permissions.WORKSPACE_VIEW,
    Permissions.WORKSPACE_INVITE,
    Permissions.WORKSPACE_REMOVE_MEMBER,
    Permissions.WORKSPACE_MANAGE_ROLES,
    Permissions.BOARD_CREATE,
    Permissions.BOARD_VIEW,
    Permissions.BOARD_UPDATE,
    Permissions.BOARD_DELETE,
    Permissions.BOARD_MANAGE_VISIBILITY,
    Permissions.TASK_CREATE,
    Permissions.TASK_VIEW,
    Permissions.TASK_UPDATE,
    Permissions.TASK_UPDATE_OWN,
    Permissions.TASK_DELETE,
    Permissions.TASK_ASSIGN,
    Permissions.TASK_MOVE,
    Permissions.TASK_MANAGE_PRIVATE,
    Permissions.COMMENT_CREATE,
    Permissions.COMMENT_VIEW,
    Permissions.ATTACHMENT_UPLOAD,
  ],
  [WorkspaceRole.MEMBER]: [
    Permissions.WORKSPACE_VIEW,
    Permissions.BOARD_VIEW,
    Permissions.TASK_CREATE,
    Permissions.TASK_VIEW,
    Permissions.TASK_UPDATE_OWN,
    Permissions.TASK_MOVE,
    Permissions.COMMENT_CREATE,
    Permissions.COMMENT_VIEW,
    Permissions.ATTACHMENT_UPLOAD,
  ],
  [WorkspaceRole.GUEST]: [
    Permissions.WORKSPACE_VIEW,
    Permissions.BOARD_VIEW,
    Permissions.TASK_VIEW,
    Permissions.COMMENT_CREATE,
    Permissions.COMMENT_VIEW,
  ],
};

export const WORKSPACE_ROLE_RANK: Record<WorkspaceRole, number> = {
  [WorkspaceRole.OWNER]: 400,
  [WorkspaceRole.ADMIN]: 300,
  [WorkspaceRole.MEMBER]: 200,
  [WorkspaceRole.GUEST]: 100,
};

export const PRIVATE_VISIBILITY_FILTER = (
  userId: string,
  visibilityField = 'visibility',
  allowedMembersField = 'allowedMembers',
) => ({
  $or: [
    { [visibilityField]: { $ne: ResourceVisibility.PRIVATE } },
    { [allowedMembersField]: userId },
    { createdBy: userId },
  ],
});
