import { Request, Response } from 'express';
import { asyncHandler } from '@/common/utils/asyncHandler';
import { sendSuccess } from '@/common/utils/responseHandler';
import { BoardService } from '../services/board.service';

export class BoardController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { workspaceId, workspace, ...data } = req.body;
    const board = await BoardService.createBoard(userId, workspaceId || workspace, data);
    return sendSuccess(res, 'Board created successfully', board);
  });

  static getByWorkspace = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { workspaceId } = req.params;
    const boards = await BoardService.getWorkspaceBoards(workspaceId as string, userId);
    return sendSuccess(res, 'Boards retrieved successfully', boards);
  });

  static getFullData = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { id } = req.params;
    const data = await BoardService.getBoardFullData(id as string, userId);
    return sendSuccess(res, 'Board data retrieved successfully', data);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { id } = req.params;
    const board = await BoardService.updateBoard(id as string, userId, req.body);
    return sendSuccess(res, 'Board updated successfully', board);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { id } = req.params;
    await BoardService.deleteBoard(id as string, userId);
    return sendSuccess(res, 'Board deleted successfully');
  });
}
