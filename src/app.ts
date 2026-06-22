import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { StatusCodes } from 'http-status-codes';

import { env } from '@/configs/env';
import { logger } from '@/configs/logger';
import { globalErrorHandler } from '@/common/middlewares/errorHandler';
import { AppError } from '@/common/errors/AppError';
import routes from '@/routes';

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

// Standard Middlewares
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/v1', routes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({ status: 'UP', message: 'Server is healthy' });
});

// 404 Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, StatusCodes.NOT_FOUND));
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
