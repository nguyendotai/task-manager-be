import { Request, Response } from 'express';
import { asyncHandler } from '@/common/utils/asyncHandler';
import { sendSuccess } from '@/common/utils/responseHandler';
import { LabelService } from '../services/label.service';

export class LabelController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const label = await LabelService.createLabel(userId, req.body);
    return sendSuccess(res, 'Label created successfully', label);
  });

  static getByWorkspace = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { workspaceId } = req.params;
    const labels = await LabelService.getWorkspaceLabels(workspaceId as string, userId);
    return sendSuccess(res, 'Labels retrieved successfully', labels);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { id } = req.params;
    const label = await LabelService.updateLabel(id as string, userId, req.body);
    return sendSuccess(res, 'Label updated successfully', label);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { id } = req.params;
    await LabelService.deleteLabel(id as string, userId);
    return sendSuccess(res, 'Label deleted successfully');
  });
}
