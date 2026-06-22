import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '@/common/errors/AppError';

type RateLimitOptions = {
  windowMs: number;
  max: number;
};

const buckets = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = ({ windowMs, max }: RateLimitOptions) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.originalUrl}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      return next(new AppError('Too many requests, please try again later', StatusCodes.TOO_MANY_REQUESTS));
    }

    bucket.count += 1;
    return next();
  };
};
