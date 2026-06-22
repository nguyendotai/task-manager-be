import { Request, Response } from 'express';
import { asyncHandler } from '@/common/utils/asyncHandler';
import { sendSuccess } from '@/common/utils/responseHandler';
import { CommentService } from '../services/comment.service';

export class CommentController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { taskId, content, attachments } = req.body;
    const comment = await CommentService.addComment(userId, taskId, content, attachments);
    return sendSuccess(res, 'Comment added successfully', comment);
  });

  static getByTask = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { taskId } = req.params;
    const comments = await CommentService.getTaskComments(taskId as string, userId);
    return sendSuccess(res, 'Comments retrieved successfully', comments);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const comment = await CommentService.updateComment(req.params.id as string, userId, req.body.content);
    return sendSuccess(res, 'Comment updated successfully', comment);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    await CommentService.deleteComment(req.params.id as string, userId);
    return sendSuccess(res, 'Comment deleted successfully');
  });
}
