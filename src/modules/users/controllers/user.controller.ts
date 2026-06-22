import { Request, Response } from 'express';
import { asyncHandler } from '@/common/utils/asyncHandler';
import { sendSuccess } from '@/common/utils/responseHandler';
import { UserService } from '../services/user.service';

export class UserController {
  static getMe = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const user = await UserService.getMe(userId);
    return sendSuccess(res, 'Profile retrieved successfully', user);
  });

  static updateMe = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const user = await UserService.updateMe(userId, req.body);
    return sendSuccess(res, 'Profile updated successfully', user);
  });

  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    await UserService.changePassword(userId, req.body.currentPassword, req.body.newPassword);
    return sendSuccess(res, 'Password changed successfully');
  });

  static deactivateMe = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    await UserService.deactivateMe(userId);
    return sendSuccess(res, 'Account deactivated successfully');
  });

  static listUsers = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const users = await UserService.listUsers(userId, req.query as any);
    return sendSuccess(res, 'Users retrieved successfully', users);
  });

  static updateRole = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const user = await UserService.updateUserRole(userId, req.params.id as string, req.body.role);
    return sendSuccess(res, 'User role updated successfully', user);
  });

  static ban = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const user = await UserService.setBanStatus(userId, req.params.id as string, true);
    return sendSuccess(res, 'User banned successfully', user);
  });

  static unban = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const user = await UserService.setBanStatus(userId, req.params.id as string, false);
    return sendSuccess(res, 'User unbanned successfully', user);
  });
}
