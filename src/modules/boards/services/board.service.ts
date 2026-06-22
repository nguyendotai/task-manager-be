import { StatusCodes } from 'http-status-codes';
import { Board } from '../models/Board';
import { Column } from '@/modules/columns/models/Column';
import { AppError } from '@/common/errors/AppError';
import { AccessControl } from '@/common/authorization/accessControl';
import { Permissions } from '@/common/authorization/permissions';
import { ResourceVisibility } from '@/common/constants/enums';
import { ActivityService } from '@/modules/analytics/services/activity.service';

export class BoardService {
  static async createBoard(
    userId: string,
    workspaceId: string,
    data: { name: string; visibility?: ResourceVisibility; allowedMembers?: string[] },
  ) {
    await AccessControl.assertWorkspacePermission(userId, workspaceId, Permissions.BOARD_CREATE);

    const board = await Board.create({
      name: data.name,
      workspace: workspaceId,
      createdBy: userId,
      visibility: data.visibility,
      allowedMembers: data.allowedMembers,
    });

    const defaultColumns = [
      { name: 'To Do', board: board._id, order: 0 },
      { name: 'In Progress', board: board._id, order: 1 },
      { name: 'Done', board: board._id, order: 2 },
    ];

    try {
      await Column.create(defaultColumns);
    } catch (error) {
      await Board.findByIdAndDelete(board._id);
      throw error;
    }

    await ActivityService.record({
      user: userId as any,
      workspace: board.workspace,
      action: 'board.created',
      entityType: 'Board',
      entityId: board._id,
      details: `Board "${board.name}" created`,
      metadata: { workspaceId },
    });

    return board;
  }

  static async getWorkspaceBoards(workspaceId: string, userId: string) {
    const access = await AccessControl.assertWorkspacePermission(userId, workspaceId, Permissions.BOARD_VIEW);
    const visibilityFilter = AccessControl.hasWorkspacePermission(access.member, Permissions.BOARD_MANAGE_VISIBILITY)
      ? {}
      : {
          $or: [
            { visibility: { $ne: ResourceVisibility.PRIVATE } },
            { allowedMembers: userId },
            { createdBy: userId },
          ],
        };

    return await Board.find({ workspace: workspaceId, ...visibilityFilter });
  }

  static async getBoardFullData(boardId: string, userId: string) {
    const board = await AccessControl.assertBoardAccess(userId, boardId, Permissions.BOARD_VIEW);

    // Get columns for this board
    const columns = await Column.find({ board: boardId }).sort('order');
    
    return {
      ...board.toObject(),
      columns
    };
  }

  static async updateBoard(
    boardId: string,
    userId: string,
    data: { name?: string; visibility?: ResourceVisibility; allowedMembers?: string[] },
  ) {
    await AccessControl.assertBoardAccess(userId, boardId, Permissions.BOARD_UPDATE);
    const board = await Board.findByIdAndUpdate(boardId, data, { new: true, runValidators: true });
    if (board) {
      await ActivityService.record({
        user: userId as any,
        workspace: board.workspace,
        action: 'board.updated',
        entityType: 'Board',
        entityId: board._id,
        details: `Board "${board.name}" updated`,
      });
    }
    return board;
  }

  static async deleteBoard(boardId: string, userId: string) {
    const board = await AccessControl.assertBoardAccess(userId, boardId, Permissions.BOARD_DELETE);
    board.isDeleted = true;
    await board.save();

    await ActivityService.record({
      user: userId as any,
      workspace: board.workspace,
      action: 'board.deleted',
      entityType: 'Board',
      entityId: board._id,
      details: `Board "${board.name}" deleted`,
    });
  }
}
