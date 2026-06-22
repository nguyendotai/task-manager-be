import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '@/common/errors/AppError';

export const validate = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.reduce((acc: Record<string, string[]>, issue: any) => {
          const path = issue.path.join('.').replace(/^(body|query|params|cookies)\./, '');
          acc[path] = acc[path] || [];
          acc[path].push(issue.message);
          return acc;
        }, {});
        
        return next(new AppError('Validation failed', StatusCodes.BAD_REQUEST, errorMessages));
      }
      return next(error);
    }
  };
};
