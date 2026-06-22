import mongoose from 'mongoose';
import app from './app';
import { env } from '@/configs/env';
import { logger } from '@/configs/logger';

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    logger.info('✅ Database connected successfully');

    // 2. Start Server
    const server = app.listen(env.PORT, () => {
      logger.info(`
      ################################################
      🛡️  Server listening on port: ${env.PORT} 🛡️
      ------------------------------------------------
      🚀 Environment: ${env.NODE_ENV}
      ################################################
      `);
    });

    // Handle Graceful Shutdown
    process.on('unhandledRejection', (err: Error) => {
      logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
      logger.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('uncaughtException', (err: Error) => {
      logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
      logger.error(err.name, err.message);
      process.exit(1);
    });

    process.on('SIGTERM', () => {
      logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        logger.info('💥 Process terminated!');
      });
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
