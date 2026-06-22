import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { env } from '@/configs/env';
import { logger } from '@/configs/logger';
import { AppError } from '../errors/AppError';

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  err.statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  err.status = err.status || 'error';

  if (env.NODE_ENV === 'development') {
    logger.error(`Error: ${err.message}`, { stack: err.stack });
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      stack: err.stack,
      error: err,
    });
  }

  // Production mode
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Programming or unknown errors: don't leak details
  logger.error('ERROR', err);
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Something went very wrong!',
  });
};
