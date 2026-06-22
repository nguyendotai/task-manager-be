import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '@/common/errors/AppError';
import { TokenService } from '@/modules/auth/services/token.service';
import { asyncHandler } from '@/common/utils/asyncHandler';
import { User } from '@/modules/users/models/User';

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', StatusCodes.UNAUTHORIZED));
  }

  try {
    const decoded = TokenService.verifyAccessToken(token) as { userId: string; role: string };
    
    const user = await User.findById(decoded.userId).select('+isBanned');
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', StatusCodes.UNAUTHORIZED));
    }
    if (user.isBanned) {
      return next(new AppError('This user account has been banned.', StatusCodes.FORBIDDEN));
    }

    // Grant access to protected route
    (req as any).user = {
      userId: user._id.toString(),
      role: user.role,
    };
    next();
  } catch (error) {
    return next(new AppError('Invalid token or expired. Please log in again.', StatusCodes.UNAUTHORIZED));
  }
});

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes((req as any).user.role)) {
      return next(new AppError('You do not have permission to perform this action', StatusCodes.FORBIDDEN));
    }
    next();
  };
};
