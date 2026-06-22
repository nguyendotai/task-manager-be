import { StatusCodes } from 'http-status-codes';
import { Task, ITask } from '../models/Task';
import { Label } from '../models/Label';
import { Member } from '@/modules/workspaces/models/Member';
import { AppError } from '@/common/errors/AppError';
import { AccessControl } from '@/common/authorization/accessControl';
import { Permissions } from '@/common/authorization/permissions';
import { Column } from '@/modules/columns/models/Column';
import { ResourceVisibility, TaskStatus } from '@/common/constants/enums';
import { NotificationService } from '@/modules/notifications/services/notification.service';
import { ActivityService } from '@/modules/analytics/services/activity.service';

export class TaskService {
  private static readonly defaultTaskPopulate = [
    { path: 'assignees', select: 'name email avatar' },
    { path: 'labels', select: 'name color' },
    { path: 'createdBy', select: 'name email avatar' },
  ];

  private static async ensureLabelsBelongToWorkspace(labelIds: string[] | undefined, workspaceId: string) {
    if (!labelIds?.length) return;

    const labelsCount = await Label.countDocuments({
      _id: { $in: labelIds },
      workspace: workspaceId,
    });

    if (labelsCount !== new Set(labelIds).size) {
      throw new AppError('One or more labels are invalid for this workspace', StatusCodes.BAD_REQUEST);
    }
  }

  private static async getAccessibleTaskQuery(userId: string, workspaceId?: string) {
    const actor = await AccessControl.getActor(userId);
    if (AccessControl.isSuperAdmin(actor)) {
      return workspaceId ? { workspace: workspaceId } : {};
    }

    if (workspaceId) {
      const access = await AccessControl.assertWorkspacePermission(userId, workspaceId, Permissions.TASK_VIEW);
      return {
        workspace: workspaceId,
        ...AccessControl.buildTaskVisibilityFilter(userId, access.member),
      };
    }

    const memberships = await Member.find({ user: userId }).select('workspace role');
    if (!memberships.length) return { _id: { $exists: false } };

    return {
      $or: memberships.map(member => ({
        workspace: member.workspace,
        ...AccessControl.buildTaskVisibilityFilter(userId, member),
      })),
    };
  }

  private static getTaskLimit(limit?: number | string) {
    return limit ? Number(limit) : 20;
  }

  private static buildTaskFilters(filters: any) {
    const query: any = {};
    if (filters.boardId) query.board = filters.boardId;
    if (filters.columnId) query.column = filters.columnId;
    if (filters.assigneeId) query.assignees = filters.assigneeId;
    if (filters.labelId) query.labels = filters.labelId;
    if (filters.priority) query.priority = filters.priority;
    if (filters.status) query.status = filters.status;
    if (filters.keyword) {
      query.$or = [
        { title: { $regex: filters.keyword, $options: 'i' } },
        { description: { $regex: filters.keyword, $options: 'i' } },
      ];
    }
    if (filters.overdue) {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: TaskStatus.DONE };
    }
    if (filters.dueBefore || filters.dueAfter) {
      query.dueDate = {
        ...(query.dueDate || {}),
        ...(filters.dueBefore ? { $lte: new Date(filters.dueBefore) } : {}),
        ...(filters.dueAfter ? { $gte: new Date(filters.dueAfter) } : {}),
      };
    }
    return query;
  }

  static async createTask(userId: string, data: Partial<ITask>) {
    const payload = data as any;
    const workspaceId = payload.workspaceId || payload.workspace;
    const columnId = payload.columnId || payload.column;

    // 1. Check workspace permissions and board visibility.
    const access = await AccessControl.assertWorkspacePermission(userId, workspaceId, Permissions.TASK_CREATE);
    const board = await AccessControl.assertBoardAccess(userId, payload.boardId || payload.board, Permissions.BOARD_VIEW);
    const column = await Column.findById(columnId);
    if (!column) throw new AppError('Column not found', StatusCodes.NOT_FOUND);
    if (
      board.workspace.toString() !== workspaceId ||
      column.board.toString() !== board._id.toString()
    ) {
      throw new AppError('Task workspace, board, and column must belong together', StatusCodes.BAD_REQUEST);
    }

    if (payload.visibility === ResourceVisibility.PRIVATE && !AccessControl.hasWorkspacePermission(access.member, Permissions.TASK_MANAGE_PRIVATE)) {
      throw new AppError('You do not have permission to create private tasks', StatusCodes.FORBIDDEN);
    }
    if (payload.assignees?.some((assigneeId: string) => assigneeId !== userId)) {
      await AccessControl.assertWorkspacePermission(userId, workspaceId, Permissions.TASK_ASSIGN);
    }

    await this.ensureLabelsBelongToWorkspace(payload.labels, workspaceId);

    // 2. Get last order in column to append task at the end
    const lastTask = await Task.findOne({ column: columnId }).sort('-order');
    const order = lastTask ? lastTask.order + 1 : 0;

    // 3. Create task
    const task = await Task.create({
      ...data,
      board: payload.boardId || payload.board,
      column: columnId,
      workspace: workspaceId,
      order,
      createdBy: userId,
    });

    await NotificationService.createMany((payload.assignees || [])
      .filter((assigneeId: string) => assigneeId !== userId)
      .map((assigneeId: string) => ({
        recipient: assigneeId as any,
        sender: userId as any,
        type: 'task.assigned',
        title: 'Task assigned',
        message: `You have been assigned to "${task.title}"`,
        link: `/tasks/${task._id}`,
        metadata: { taskId: task._id },
      })));

    await ActivityService.record({
      user: userId as any,
      workspace: task.workspace,
      action: 'task.created',
      entityType: 'Task',
      entityId: task._id,
      details: `Task "${task.title}" created`,
      metadata: { boardId: task.board, columnId: task.column },
    });

    return task;
  }

  static async getColumnTasks(columnId: string, userId: string) {
    const column = await Column.findById(columnId);
    if (!column) throw new AppError('Column not found', StatusCodes.NOT_FOUND);

    const board = await AccessControl.assertBoardAccess(userId, column.board.toString(), Permissions.BOARD_VIEW);
    const visibilityQuery = await this.getAccessibleTaskQuery(userId, board.workspace.toString());

    return await Task.find({ column: columnId, ...visibilityQuery })
      .sort('order')
      .populate(this.defaultTaskPopulate);
  }

  static async getMarkedTasks(userId: string, filters: { workspaceId?: string; limit?: number | string }) {
    const accessQuery = await this.getAccessibleTaskQuery(userId, filters.workspaceId);

    return Task.find({
      ...accessQuery,
      markedBy: userId,
    })
      .sort('-updatedAt')
      .limit(this.getTaskLimit(filters.limit))
      .populate(this.defaultTaskPopulate);
  }

  static async getRecentTasks(userId: string, filters: { workspaceId?: string; limit?: number | string }) {
    const accessQuery = await this.getAccessibleTaskQuery(userId, filters.workspaceId);

    return Task.find({
      ...accessQuery,
    })
      .sort('-createdAt')
      .limit(this.getTaskLimit(filters.limit))
      .populate(this.defaultTaskPopulate);
  }

  static async searchTasks(userId: string, filters: any) {
    const accessQuery = await this.getAccessibleTaskQuery(userId, filters.workspaceId);
    const page = filters.page || 1;
    const limit = this.getTaskLimit(filters.limit);

    const taskFilters = this.buildTaskFilters(filters);
    const query = Object.keys(taskFilters).length
      ? { $and: [accessQuery, taskFilters] }
      : accessQuery;

    const [items, total] = await Promise.all([
      Task.find(query)
        .sort('-updatedAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(this.defaultTaskPopulate),
      Task.countDocuments(query),
    ]);

    return { items, total, page, limit };
  }

  static async getMyTasks(userId: string, filters: { workspaceId?: string; limit?: number | string }) {
    const accessQuery = await this.getAccessibleTaskQuery(userId, filters.workspaceId);

    return Task.find({
      ...accessQuery,
      assignees: userId,
    })
      .sort('-updatedAt')
      .limit(this.getTaskLimit(filters.limit))
      .populate(this.defaultTaskPopulate);
  }

  static async markTask(taskId: string, userId: string, marked: boolean) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', StatusCodes.NOT_FOUND);

    await AccessControl.assertTaskDocumentAccess(userId, task, Permissions.TASK_VIEW);

    const update = marked ? { $addToSet: { markedBy: userId } } : { $pull: { markedBy: userId } };

    return Task.findByIdAndUpdate(taskId, update, { new: true }).populate(this.defaultTaskPopulate);
  }

  static async updateTask(taskId: string, userId: string, data: Partial<ITask>) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', StatusCodes.NOT_FOUND);

    await AccessControl.assertTaskDocumentAccess(userId, task, Permissions.TASK_UPDATE);

    const payload = data as any;
    if (payload.columnId || payload.column) {
      const column = await Column.findById(payload.columnId || payload.column);
      if (!column) throw new AppError('Column not found', StatusCodes.NOT_FOUND);
      if (column.board.toString() !== task.board.toString()) {
        throw new AppError('Tasks can only move within their current board', StatusCodes.BAD_REQUEST);
      }
    }
    if (payload.assignees) {
      await AccessControl.assertWorkspacePermission(userId, task.workspace.toString(), Permissions.TASK_ASSIGN);
    }
    if (payload.visibility === ResourceVisibility.PRIVATE) {
      await AccessControl.assertWorkspacePermission(userId, task.workspace.toString(), Permissions.TASK_MANAGE_PRIVATE);
    }
    await this.ensureLabelsBelongToWorkspace(payload.labels, task.workspace.toString());

    const updateData = {
      ...payload,
      column: payload.columnId || payload.column,
    };
    delete updateData.columnId;

    const previousAssignees = task.assignees.map(assignee => assignee.toString());
    const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, { new: true });
    if (updatedTask && payload.assignees) {
      const newAssignees = payload.assignees.filter((assigneeId: string) => !previousAssignees.includes(assigneeId) && assigneeId !== userId);
      await NotificationService.createMany(newAssignees.map((assigneeId: string) => ({
        recipient: assigneeId as any,
        sender: userId as any,
        type: 'task.assigned',
        title: 'Task assigned',
        message: `You have been assigned to "${updatedTask.title}"`,
        link: `/tasks/${updatedTask._id}`,
        metadata: { taskId: updatedTask._id },
      })));
    }

    if (updatedTask) {
      await ActivityService.record({
        user: userId as any,
        workspace: updatedTask.workspace,
        action: 'task.updated',
        entityType: 'Task',
        entityId: updatedTask._id,
        details: `Task "${updatedTask.title}" updated`,
      });
    }
    return updatedTask;
  }

  static async reorderTasks(userId: string, data: { boardId: string; columnId: string; tasks: { id: string; order: number }[] }) {
    await AccessControl.assertBoardAccess(userId, data.boardId, Permissions.TASK_MOVE);

    const column = await Column.findById(data.columnId);
    if (!column) throw new AppError('Column not found', StatusCodes.NOT_FOUND);
    if (column.board.toString() !== data.boardId) {
      throw new AppError('Column does not belong to this board', StatusCodes.BAD_REQUEST);
    }

    const existingCount = await Task.countDocuments({
      board: data.boardId,
      column: data.columnId,
      _id: { $in: data.tasks.map(task => task.id) },
    });
    if (existingCount !== data.tasks.length) {
      throw new AppError('One or more tasks are invalid for this column', StatusCodes.BAD_REQUEST);
    }

    await Promise.all(
      data.tasks.map(task =>
        Task.updateOne({ _id: task.id, board: data.boardId, column: data.columnId }, { order: task.order }),
      ),
    );

    return Task.find({ board: data.boardId, column: data.columnId }).sort('order').populate(this.defaultTaskPopulate);
  }

  static async deleteTask(taskId: string, userId: string) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', StatusCodes.NOT_FOUND);

    await AccessControl.assertTaskDocumentAccess(userId, task, Permissions.TASK_DELETE);

    task.isDeleted = true;
    await task.save();

    await ActivityService.record({
      user: userId as any,
      workspace: task.workspace,
      action: 'task.deleted',
      entityType: 'Task',
      entityId: task._id,
      details: `Task "${task.title}" deleted`,
    });
  }
}
