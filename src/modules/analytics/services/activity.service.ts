import { FilterQuery } from 'mongoose';
import { ActivityLog, IActivityLog } from '../models/ActivityLog';
import { AccessControl } from '@/common/authorization/accessControl';
import { Permissions } from '@/common/authorization/permissions';

export class ActivityService {
  static async record(data: Partial<IActivityLog>) {
    return ActivityLog.create(data);
  }

  static async listByWorkspace(
    actorId: string,
    workspaceId: string,
    query: { action?: string; entityType?: string; userId?: string; page?: number; limit?: number },
  ) {
    await AccessControl.assertWorkspacePermission(actorId, workspaceId, Permissions.WORKSPACE_VIEW);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const filter: FilterQuery<IActivityLog> = { workspace: workspaceId };
    if (query.action) filter.action = query.action;
    if (query.entityType) filter.entityType = query.entityType;
    if (query.userId) filter.user = query.userId;

    const [items, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'name email avatar')
        .populate('workspace', 'name slug'),
      ActivityLog.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  }
}
