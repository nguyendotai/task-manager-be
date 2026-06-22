import { Request, Response } from 'express';
import { asyncHandler } from '@/common/utils/asyncHandler';
import { sendSuccess } from '@/common/utils/responseHandler';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  static getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const dashboard = await DashboardService.getDashboard(userId);
    return sendSuccess(res, 'Dashboard retrieved successfully', dashboard);
  });
}
