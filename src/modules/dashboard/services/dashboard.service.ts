import { TaskStatus } from '@/common/constants/enums';
import { Board } from '@/modules/boards/models/Board';
import { Task } from '@/modules/tasks/models/Task';
import { Member } from '@/modules/workspaces/models/Member';
import { Workspace } from '@/modules/workspaces/models/Workspace';

export class DashboardService {
  static async getDashboard(userId: string) {
    const memberships = await Member.find({ user: userId }).select('workspace');
    const workspaceIds = memberships.map(member => member.workspace);

    const activeWorkspaces = await Workspace.find({ _id: { $in: workspaceIds } }).select('_id');
    const activeWorkspaceIds = activeWorkspaces.map(workspace => workspace._id);

    const now = new Date();
    const taskScope = {
      workspace: { $in: activeWorkspaceIds },
      isDeleted: { $ne: true },
    };

    const [
      workspaceCount,
      boardCount,
      taskCount,
      completedTaskCount,
      overdueTaskCount,
      myTaskCount,
      markedTaskCount,
      recentTasks,
    ] = await Promise.all([
      Workspace.countDocuments({ _id: { $in: activeWorkspaceIds }, isDeleted: { $ne: true } }),
      Board.countDocuments({ workspace: { $in: activeWorkspaceIds }, isDeleted: { $ne: true } }),
      Task.countDocuments(taskScope),
      Task.countDocuments({ ...taskScope, status: TaskStatus.DONE }),
      Task.countDocuments({ ...taskScope, dueDate: { $lt: now }, status: { $ne: TaskStatus.DONE } }),
      Task.countDocuments({ ...taskScope, assignees: userId }),
      Task.countDocuments({ ...taskScope, markedBy: userId }),
      Task.find(taskScope)
        .sort('-createdAt')
        .limit(10)
        .populate('workspace', 'name')
        .populate('board', 'name')
        .populate('assignees', 'name email avatar')
        .populate('labels', 'name color'),
    ]);

    return {
      counts: {
        workspaces: workspaceCount,
        boards: boardCount,
        tasks: taskCount,
        completedTasks: completedTaskCount,
        overdueTasks: overdueTaskCount,
        myTasks: myTaskCount,
        markedTasks: markedTaskCount,
      },
      recentTasks,
    };
  }
}
