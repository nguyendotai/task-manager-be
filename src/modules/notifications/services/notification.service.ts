import { StatusCodes } from 'http-status-codes';
import { FilterQuery } from 'mongoose';
import { Notification, INotification } from '../models/Notification';
import { AppError } from '@/common/errors/AppError';

export class NotificationService {
  static async create(data: Partial<INotification>) {
    return Notification.create(data);
  }

  static async createMany(items: Partial<INotification>[]) {
    if (!items.length) return [];
    return Notification.insertMany(items);
  }

  static async list(userId: string, query: { unreadOnly?: boolean; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const filter: FilterQuery<INotification> = { recipient: userId };
    if (query.unreadOnly) filter.readAt = { $exists: false };

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('sender', 'name avatar'),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: userId, readAt: { $exists: false } }),
    ]);

    return { items, total, unreadCount, page, limit };
  }

  static async markRead(userId: string, notificationId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { readAt: new Date() },
      { new: true },
    );
    if (!notification) throw new AppError('Notification not found', StatusCodes.NOT_FOUND);
    return notification;
  }

  static async markAllRead(userId: string) {
    const result = await Notification.updateMany(
      { recipient: userId, readAt: { $exists: false } },
      { readAt: new Date() },
    );
    return { modifiedCount: result.modifiedCount };
  }
}
