import { StatusCodes } from 'http-status-codes';
import { FilterQuery } from 'mongoose';
import { User, IUser } from '../models/User';
import { AppError } from '@/common/errors/AppError';
import { AccessControl } from '@/common/authorization/accessControl';
import { Permissions } from '@/common/authorization/permissions';
import { UserRole } from '@/common/constants/enums';

const sanitizeUser = (user: IUser) => {
  const data = user.toObject();
  delete data.password;
  delete data.refreshToken;
  delete data.passwordResetToken;
  delete data.passwordResetExpires;
  delete data.emailVerificationToken;
  return data;
};

export class UserService {
  static async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', StatusCodes.NOT_FOUND);
    return sanitizeUser(user);
  }

  static async updateMe(userId: string, data: { name?: string; avatar?: string }) {
    const user = await User.findByIdAndUpdate(userId, data, { new: true, runValidators: true });
    if (!user) throw new AppError('User not found', StatusCodes.NOT_FOUND);
    return sanitizeUser(user);
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId).select('+password +refreshToken');
    if (!user || !(await user.comparePassword(currentPassword))) {
      throw new AppError('Current password is incorrect', StatusCodes.UNAUTHORIZED);
    }

    user.password = newPassword;
    user.refreshToken = undefined;
    await user.save();
  }

  static async deactivateMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', StatusCodes.NOT_FOUND);
    user.isDeleted = true;
    user.refreshToken = undefined;
    await user.save();
  }

  static async listUsers(actorId: string, query: { search?: string; role?: UserRole; page?: number; limit?: number }) {
    await AccessControl.assertPlatformPermission(actorId, Permissions.USER_MANAGE);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const filter: FilterQuery<IUser> = {};
    if (query.role) filter.role = query.role;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit).select('+isBanned'),
      User.countDocuments(filter),
    ]);

    return { items: items.map(sanitizeUser), total, page, limit };
  }

  static async updateUserRole(actorId: string, targetUserId: string, role: UserRole) {
    await AccessControl.assertPlatformPermission(actorId, Permissions.USER_MANAGE);
    const user = await User.findByIdAndUpdate(targetUserId, { role }, { new: true, runValidators: true });
    if (!user) throw new AppError('User not found', StatusCodes.NOT_FOUND);
    return sanitizeUser(user);
  }

  static async setBanStatus(actorId: string, targetUserId: string, isBanned: boolean) {
    await AccessControl.assertPlatformPermission(actorId, Permissions.USER_BAN);
    if (actorId === targetUserId) throw new AppError('You cannot ban yourself', StatusCodes.BAD_REQUEST);

    const user = await User.findById(targetUserId).select('+isBanned');
    if (!user) throw new AppError('User not found', StatusCodes.NOT_FOUND);
    user.isBanned = isBanned;
    if (isBanned) user.refreshToken = undefined;
    await user.save();
    return sanitizeUser(user);
  }
}
