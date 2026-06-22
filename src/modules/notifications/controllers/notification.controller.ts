import { Request, Response } from 'express';
import { asyncHandler } from '@/common/utils/asyncHandler';
import { sendSuccess } from '@/common/utils/responseHandler';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const notifications = await NotificationService.list(userId, req.query as any);
    return sendSuccess(res, 'Notifications retrieved successfully', notifications);
  });

  static markRead = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const notification = await NotificationService.markRead(userId, req.params.id as string);
    return sendSuccess(res, 'Notification marked as read', notification);
  });

  static markAllRead = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const result = await NotificationService.markAllRead(userId);
    return sendSuccess(res, 'All notifications marked as read', result);
  });
}
