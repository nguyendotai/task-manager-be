import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const sendSuccess = (
  res: Response,
  message: string,
  data: any = null,
  statusCode: number = StatusCodes.OK
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
  errors: any = null
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
