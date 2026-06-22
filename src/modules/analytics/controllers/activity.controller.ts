import { Request, Response } from 'express';
import { asyncHandler } from '@/common/utils/asyncHandler';
import { sendSuccess } from '@/common/utils/responseHandler';
import { ActivityService } from '../services/activity.service';

export class ActivityController {
  static listByWorkspace = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const activities = await ActivityService.listByWorkspace(userId, req.params.workspaceId as string, req.query as any);
    return sendSuccess(res, 'Activity logs retrieved successfully', activities);
  });
}
