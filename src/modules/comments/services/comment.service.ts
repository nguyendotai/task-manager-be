import { StatusCodes } from 'http-status-codes';
import { Comment } from '@/modules/comments/models/Comment';
import { Task } from '@/modules/tasks/models/Task';
import { AppError } from '@/common/errors/AppError';
import { AccessControl } from '@/common/authorization/accessControl';
import { Permissions } from '@/common/authorization/permissions';
import { NotificationService } from '@/modules/notifications/services/notification.service';
import { ActivityService } from '@/modules/analytics/services/activity.service';

export class CommentService {
  static async addComment(userId: string, taskId: string, content: string, attachments?: string[]) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', StatusCodes.NOT_FOUND);

    await AccessControl.assertTaskDocumentAccess(userId, task, Permissions.TASK_VIEW);
    await AccessControl.assertWorkspacePermission(userId, task.workspace.toString(), Permissions.COMMENT_CREATE);

    const comment = await Comment.create({
      content,
      task: taskId,
      user: userId,
      attachments,
    });

    const recipientIds = new Set(task.assignees.map(assignee => assignee.toString()));
    recipientIds.add(task.createdBy.toString());
    recipientIds.delete(userId);

    await NotificationService.createMany([...recipientIds].map(recipient => ({
      recipient: recipient as any,
      sender: userId as any,
      type: 'task.comment',
      title: 'New task comment',
      message: `A task you follow has a new comment: ${task.title}`,
      link: `/tasks/${task._id}`,
      metadata: { taskId: task._id, commentId: comment._id },
    })));

    await ActivityService.record({
      user: userId as any,
      workspace: task.workspace,
      action: 'comment.created',
      entityType: 'Comment',
      entityId: comment._id,
      details: `Comment added to task "${task.title}"`,
      metadata: { taskId: task._id },
    });

    return await comment.populate('user', 'name avatar');
  }

  static async getTaskComments(taskId: string, userId: string) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', StatusCodes.NOT_FOUND);

    await AccessControl.assertTaskDocumentAccess(userId, task, Permissions.TASK_VIEW);
    await AccessControl.assertWorkspacePermission(userId, task.workspace.toString(), Permissions.COMMENT_VIEW);

    return await Comment.find({ task: taskId }).sort('-createdAt').populate('user', 'name avatar');
  }

  static async updateComment(commentId: string, userId: string, content: string) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Comment not found', StatusCodes.NOT_FOUND);
    if (comment.user.toString() !== userId) {
      throw new AppError('You can only update your own comments', StatusCodes.FORBIDDEN);
    }

    const task = await Task.findById(comment.task);
    if (!task) throw new AppError('Task not found', StatusCodes.NOT_FOUND);
    await AccessControl.assertTaskDocumentAccess(userId, task, Permissions.TASK_VIEW);

    comment.content = content;
    await comment.save();
    return comment.populate('user', 'name avatar');
  }

  static async deleteComment(commentId: string, userId: string) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Comment not found', StatusCodes.NOT_FOUND);

    const task = await Task.findById(comment.task);
    if (!task) throw new AppError('Task not found', StatusCodes.NOT_FOUND);

    const canDeleteTask = await AccessControl.assertTaskDocumentAccess(userId, task, Permissions.TASK_UPDATE)
      .then(() => true)
      .catch(() => false);
    if (comment.user.toString() !== userId && !canDeleteTask) {
      throw new AppError('You do not have permission to delete this comment', StatusCodes.FORBIDDEN);
    }

    comment.isDeleted = true;
    await comment.save();
  }
}
