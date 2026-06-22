import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '@/common/errors/AppError';
import { asyncHandler } from '@/common/utils/asyncHandler';
import { AccessControl } from '@/common/authorization/accessControl';
import { Permission } from '@/common/authorization/permissions';

const getUserId = (req: Request) => {
  const userId = (req as any).user?.userId;
  if (!userId) throw new AppError('You are not logged in. Please log in to get access.', StatusCodes.UNAUTHORIZED);
  return String(userId);
};

export const requirePlatformPermission = (permission: Permission) =>
  asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    await AccessControl.assertPlatformPermission(getUserId(req), permission);
    next();
  });

export const requireWorkspacePermission = (
  permission: Permission,
  workspaceIdSelector: (req: Request) => string | undefined = req =>
    (req.params.workspaceId || req.params.id || req.body.workspaceId || req.body.workspace) as string | undefined,
) =>
  asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const workspaceId = workspaceIdSelector(req);
    if (!workspaceId) throw new AppError('Workspace ID is required', StatusCodes.BAD_REQUEST);

    const access = await AccessControl.assertWorkspacePermission(getUserId(req), workspaceId, permission);
    (req as any).workspaceAccess = access;
    next();
  });
