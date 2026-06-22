import { Request, Response } from 'express';
import { asyncHandler } from '@/common/utils/asyncHandler';
import { sendSuccess } from '@/common/utils/responseHandler';
import { TaskService } from '../services/task.service';

export class TaskController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const task = await TaskService.createTask(userId, req.body);
    return sendSuccess(res, 'Task created successfully', task);
  });

  static getByColumn = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { columnId } = req.params;
    const tasks = await TaskService.getColumnTasks(columnId as string, userId);
    return sendSuccess(res, 'Tasks retrieved successfully', tasks);
  });

  static getMarked = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const tasks = await TaskService.getMarkedTasks(userId, req.query as any);
    return sendSuccess(res, 'Marked tasks retrieved successfully', tasks);
  });

  static getRecent = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const tasks = await TaskService.getRecentTasks(userId, req.query as any);
    return sendSuccess(res, 'Recent tasks retrieved successfully', tasks);
  });

  static getMyTasks = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const tasks = await TaskService.getMyTasks(userId, req.query as any);
    return sendSuccess(res, 'My tasks retrieved successfully', tasks);
  });

  static search = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const tasks = await TaskService.searchTasks(userId, req.query as any);
    return sendSuccess(res, 'Tasks searched successfully', tasks);
  });

  static mark = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { id } = req.params;
    const task = await TaskService.markTask(id as string, userId, req.body.marked);
    return sendSuccess(res, 'Task mark status updated successfully', task);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { id } = req.params;
    const task = await TaskService.updateTask(id as string, userId, req.body);
    return sendSuccess(res, 'Task updated successfully', task);
  });

  static reorder = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const tasks = await TaskService.reorderTasks(userId, req.body);
    return sendSuccess(res, 'Tasks reordered successfully', tasks);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    const { id } = req.params;
    await TaskService.deleteTask(id as string, userId);
    return sendSuccess(res, 'Task deleted successfully');
  });
}
