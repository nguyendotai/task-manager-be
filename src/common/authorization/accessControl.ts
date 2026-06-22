import { FilterQuery } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '@/common/errors/AppError';
import { ResourceVisibility, UserRole, WorkspaceRole } from '@/common/constants/enums';
import { Member, IMember } from '@/modules/workspaces/models/Member';
import { User } from '@/modules/users/models/User';
import { Board, IBoard } from '@/modules/boards/models/Board';
import { Task, ITask } from '@/modules/tasks/models/Task';
import {
  Permission,
  Permissions,
  PLATFORM_ROLE_PERMISSIONS,
  PRIVATE_VISIBILITY_FILTER,
  WORKSPACE_ROLE_PERMISSIONS,
  WORKSPACE_ROLE_RANK,
} from './permissions';

type Actor = {
  userId: string;
  platformRole: UserRole;
};

type WorkspaceAccess = {
  actor: Actor;
  member: IMember | null;
  workspaceId: string;
};

const toId = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && '_id' in (value as any)) return String((value as any)._id);
  return String(value);
};

const hasPermissionInList = (permissions: Permission[], permission: Permission) => permissions.includes(permission);

export class AccessControl {
  static async getActor(userId: string): Promise<Actor> {
    const user = await User.findById(userId).select('+isDeleted');
    if (!user) throw new AppError('User not found', StatusCodes.UNAUTHORIZED);

    return {
      userId: user._id.toString(),
      platformRole: user.role,
    };
  }

  static isSuperAdmin(actor: Actor): boolean {
    return actor.platformRole === UserRole.SUPER_ADMIN;
  }

  static hasPlatformPermission(actor: Actor, permission: Permission): boolean {
    if (this.isSuperAdmin(actor)) return true;
    return hasPermissionInList(PLATFORM_ROLE_PERMISSIONS[actor.platformRole] || [], permission);
  }

  static hasWorkspacePermission(member: IMember | null, permission: Permission): boolean {
    if (!member) return false;
    return hasPermissionInList(WORKSPACE_ROLE_PERMISSIONS[member.role] || [], permission);
  }

  static async assertPlatformPermission(userId: string, permission: Permission) {
    const actor = await this.getActor(userId);
    if (!this.hasPlatformPermission(actor, permission)) {
      throw new AppError('You do not have permission to perform this action', StatusCodes.FORBIDDEN);
    }
    return actor;
  }

  static async getWorkspaceAccess(userId: string, workspaceId: string): Promise<WorkspaceAccess> {
    const actor = await this.getActor(userId);
    const member = await Member.findOne({ workspace: workspaceId, user: userId });
    return { actor, member, workspaceId };
  }

  static async assertWorkspaceMember(userId: string, workspaceId: string): Promise<WorkspaceAccess> {
    const access = await this.getWorkspaceAccess(userId, workspaceId);
    if (this.isSuperAdmin(access.actor)) return access;
    if (!access.member) throw new AppError('You are not a member of this workspace', StatusCodes.FORBIDDEN);
    return access;
  }

  static async assertWorkspacePermission(
    userId: string,
    workspaceId: string,
    permission: Permission,
  ): Promise<WorkspaceAccess> {
    const access = await this.assertWorkspaceMember(userId, workspaceId);
    if (this.isSuperAdmin(access.actor)) return access;
    if (!this.hasWorkspacePermission(access.member, permission)) {
      throw new AppError('You do not have permission to perform this action', StatusCodes.FORBIDDEN);
    }
    return access;
  }

  static assertCanManageRole(actorMember: IMember | null, targetRole: WorkspaceRole) {
    if (!actorMember) return;
    const actorRank = WORKSPACE_ROLE_RANK[actorMember.role];
    const targetRank = WORKSPACE_ROLE_RANK[targetRole];
    if (targetRole === WorkspaceRole.OWNER || actorRank <= targetRank) {
      throw new AppError('You cannot manage a member with an equal or higher role', StatusCodes.FORBIDDEN);
    }
  }

  static assertAssignableWorkspaceRole(actorMember: IMember | null, role: WorkspaceRole) {
    if (role === WorkspaceRole.OWNER) {
      throw new AppError('Ownership must be transferred explicitly', StatusCodes.FORBIDDEN);
    }
    if (!actorMember) return;
    const actorRank = WORKSPACE_ROLE_RANK[actorMember.role];
    const targetRank = WORKSPACE_ROLE_RANK[role];
    if (actorRank <= targetRank) {
      throw new AppError('You cannot grant an equal or higher role', StatusCodes.FORBIDDEN);
    }
  }

  static isPrivateResourceAllowed(resource: any, userId: string): boolean {
    const allowedMembers = (resource.allowedMembers || []).map((id: unknown) => toId(id));
    return (
      resource.visibility !== ResourceVisibility.PRIVATE ||
      allowedMembers.includes(userId) ||
      toId(resource.createdBy) === userId
    );
  }

  static async assertBoardAccess(userId: string, boardId: string, permission: Permission = Permissions.BOARD_VIEW) {
    const board = await Board.findById(boardId);
    if (!board) throw new AppError('Board not found', StatusCodes.NOT_FOUND);
    await this.assertBoardDocumentAccess(userId, board, permission);
    return board;
  }

  static async assertBoardDocumentAccess(userId: string, board: IBoard, permission: Permission = Permissions.BOARD_VIEW) {
    const workspaceId = toId((board as any).workspace);
    if (!workspaceId) throw new AppError('Board workspace is required', StatusCodes.BAD_REQUEST);
    const access = await this.assertWorkspacePermission(userId, workspaceId, permission);
    if (this.isSuperAdmin(access.actor)) return access;
    if (!this.hasWorkspacePermission(access.member, Permissions.BOARD_MANAGE_VISIBILITY) && !this.isPrivateResourceAllowed(board, userId)) {
      throw new AppError('You do not have access to this board', StatusCodes.FORBIDDEN);
    }
    return access;
  }

  static async assertTaskAccess(userId: string, taskId: string, permission: Permission = Permissions.TASK_VIEW) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', StatusCodes.NOT_FOUND);
    await this.assertTaskDocumentAccess(userId, task, permission);
    return task;
  }

  static async assertTaskDocumentAccess(userId: string, task: ITask, permission: Permission = Permissions.TASK_VIEW) {
    const access = await this.assertWorkspaceMember(userId, toId(task.workspace));
    if (this.isSuperAdmin(access.actor)) return access;

    const canManageAll = this.hasWorkspacePermission(access.member, Permissions.TASK_UPDATE);
    const canDoOwn = this.hasWorkspacePermission(access.member, Permissions.TASK_UPDATE_OWN) && toId(task.createdBy) === userId;
    const assigneeIds = task.assignees.map(id => toId(id));
    const canViewTask =
      this.hasWorkspacePermission(access.member, Permissions.TASK_VIEW) &&
      (access.member?.role !== WorkspaceRole.GUEST ||
        task.visibility === ResourceVisibility.PUBLIC ||
        assigneeIds.includes(userId) ||
        this.isPrivateResourceAllowed(task, userId));

    if (permission === Permissions.TASK_VIEW && canViewTask) return access;

    if (permission === Permissions.TASK_UPDATE && (canManageAll || canDoOwn)) {
      if (!canManageAll && !this.isPrivateResourceAllowed(task, userId)) {
        throw new AppError('You do not have access to this private task', StatusCodes.FORBIDDEN);
      }
      return access;
    }

    if (permission === Permissions.TASK_DELETE && canManageAll) return access;

    if (!this.hasWorkspacePermission(access.member, permission)) {
      throw new AppError('You do not have permission to perform this action', StatusCodes.FORBIDDEN);
    }

    return access;
  }

  static buildTaskVisibilityFilter(userId: string, member: IMember | null): FilterQuery<ITask> {
    if (!member) return {};
    const canManagePrivate = this.hasWorkspacePermission(member, Permissions.TASK_MANAGE_PRIVATE);
    if (canManagePrivate) return {};

    if (member.role === WorkspaceRole.GUEST) {
      return {
        $and: [
          PRIVATE_VISIBILITY_FILTER(userId),
          {
            $or: [{ visibility: ResourceVisibility.PUBLIC }, { assignees: userId }, { allowedMembers: userId }],
          },
        ],
      };
    }

    return PRIVATE_VISIBILITY_FILTER(userId);
  }
}
