import { StatusCodes } from 'http-status-codes';
import { AppError } from '@/common/errors/AppError';
import { AccessControl } from '@/common/authorization/accessControl';
import { Permissions } from '@/common/authorization/permissions';
import { Label, ILabel } from '../models/Label';

type CreateLabelData = {
  name: string;
  color?: string;
  workspaceId: string;
};

type UpdateLabelData = Pick<Partial<ILabel>, 'name' | 'color'>;

export class LabelService {
  private static async ensureWorkspaceMember(workspaceId: string, userId: string) {
    return AccessControl.assertWorkspacePermission(userId, workspaceId, Permissions.WORKSPACE_VIEW);
  }

  private static async ensureWorkspaceAdmin(workspaceId: string, userId: string) {
    return AccessControl.assertWorkspacePermission(userId, workspaceId, Permissions.TASK_MANAGE_PRIVATE);
  }

  static async createLabel(userId: string, data: CreateLabelData) {
    await this.ensureWorkspaceAdmin(data.workspaceId, userId);

    const existingLabel = await Label.findOne({
      workspace: data.workspaceId,
      name: data.name,
    });

    if (existingLabel) {
      throw new AppError('Label name already exists in this workspace', StatusCodes.CONFLICT);
    }

    return Label.create({
      name: data.name,
      color: data.color,
      workspace: data.workspaceId,
    });
  }

  static async getWorkspaceLabels(workspaceId: string, userId: string) {
    await this.ensureWorkspaceMember(workspaceId, userId);
    return Label.find({ workspace: workspaceId }).sort('name');
  }

  static async updateLabel(labelId: string, userId: string, data: UpdateLabelData) {
    const label = await Label.findById(labelId);
    if (!label) throw new AppError('Label not found', StatusCodes.NOT_FOUND);

    await this.ensureWorkspaceAdmin(label.workspace.toString(), userId);

    if (data.name && data.name !== label.name) {
      const existingLabel = await Label.findOne({
        workspace: label.workspace,
        name: data.name,
        _id: { $ne: label._id },
      });

      if (existingLabel) {
        throw new AppError('Label name already exists in this workspace', StatusCodes.CONFLICT);
      }
    }

    const updatedLabel = await Label.findByIdAndUpdate(labelId, data, {
      new: true,
      runValidators: true,
    });

    return updatedLabel;
  }

  static async deleteLabel(labelId: string, userId: string) {
    const label = await Label.findById(labelId);
    if (!label) throw new AppError('Label not found', StatusCodes.NOT_FOUND);

    await this.ensureWorkspaceAdmin(label.workspace.toString(), userId);
    await label.deleteOne();
  }
}
