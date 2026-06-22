import { StatusCodes } from 'http-status-codes';
import { Column } from '../models/Column';
import { Task } from '@/modules/tasks/models/Task';
import { AppError } from '@/common/errors/AppError';
import { AccessControl } from '@/common/authorization/accessControl';
import { Permissions } from '@/common/authorization/permissions';

export class ColumnService {
  static async create(userId: string, data: { boardId: string; name: string }) {
    await AccessControl.assertBoardAccess(userId, data.boardId, Permissions.BOARD_UPDATE);
    const lastColumn = await Column.findOne({ board: data.boardId }).sort('-order');
    const order = lastColumn ? lastColumn.order + 1 : 0;

    return Column.create({
      name: data.name,
      board: data.boardId,
      order,
    });
  }

  static async update(userId: string, columnId: string, data: { name: string }) {
    const column = await Column.findById(columnId);
    if (!column) throw new AppError('Column not found', StatusCodes.NOT_FOUND);
    await AccessControl.assertBoardAccess(userId, column.board.toString(), Permissions.BOARD_UPDATE);

    column.name = data.name;
    await column.save();
    return column;
  }

  static async delete(userId: string, columnId: string) {
    const column = await Column.findById(columnId);
    if (!column) throw new AppError('Column not found', StatusCodes.NOT_FOUND);
    await AccessControl.assertBoardAccess(userId, column.board.toString(), Permissions.BOARD_UPDATE);

    const taskCount = await Task.countDocuments({ column: columnId });
    if (taskCount > 0) {
      throw new AppError('Cannot delete a column that still has tasks', StatusCodes.BAD_REQUEST);
    }

    column.isDeleted = true;
    await column.save();
  }

  static async reorder(userId: string, data: { boardId: string; columns: { id: string; order: number }[] }) {
    await AccessControl.assertBoardAccess(userId, data.boardId, Permissions.BOARD_UPDATE);

    const existingCount = await Column.countDocuments({
      board: data.boardId,
      _id: { $in: data.columns.map(column => column.id) },
    });
    if (existingCount !== data.columns.length) {
      throw new AppError('One or more columns are invalid for this board', StatusCodes.BAD_REQUEST);
    }

    await Promise.all(
      data.columns.map(column =>
        Column.updateOne({ _id: column.id, board: data.boardId }, { order: column.order }),
      ),
    );

    return Column.find({ board: data.boardId }).sort('order');
  }
}
