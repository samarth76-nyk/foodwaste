import app from './app.js';
import { env } from './config/environment.js';
import { logger } from './utils/logger.js';

const PORT = env.PORT;

/**
 * Start HTTP Server
 */
const server = app.listen(PORT, () => {
  logger.success(`=======================================================`);
  logger.success(`  ShareBite Server running in [${env.NODE_ENV}] mode`);
  logger.success(`  Port: http://localhost:${PORT}`);
  logger.success(`  Health Check: http://localhost:${PORT}${env.API_PREFIX}/health`);
  logger.success(`  API Base: http://localhost:${PORT}${env.API_PREFIX}`);
  logger.success(`=======================================================`);
});

/**
 * Graceful Process Termination
 */
const handleTermination = (signal) => {
  logger.warn(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown if connections do not close within 10s
  setTimeout(() => {
    logger.error('Forceful shutdown triggered after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleTermination('SIGTERM'));
process.on('SIGINT', () => handleTermination('SIGINT'));

/**
 * Catch unhandled exceptions & promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});
