import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '@/common/utils/asyncHandler';
import { sendSuccess } from '@/common/utils/responseHandler';
import { ColumnService } from '../services/column.service';

export class ColumnController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const column = await ColumnService.create(userId, req.body);
    return sendSuccess(res, 'Column created successfully', column, StatusCodes.CREATED);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const column = await ColumnService.update(userId, req.params.id as string, req.body);
    return sendSuccess(res, 'Column updated successfully', column);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    await ColumnService.delete(userId, req.params.id as string);
    return sendSuccess(res, 'Column deleted successfully');
  });

  static reorder = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const columns = await ColumnService.reorder(userId, req.body);
    return sendSuccess(res, 'Columns reordered successfully', columns);
  });
}
