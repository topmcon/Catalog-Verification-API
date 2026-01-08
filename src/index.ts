import { createApp } from './app';
import config from './config';
import { databaseService } from './services';
import logger from './utils/logger';

/**
 * Application Entry Point
 */

async function main(): Promise<void> {
  try {
    // Connect to database
    logger.info('Starting Catalog Verification API...');
    await databaseService.connect();

    // Create and start Express app
    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(`Server started on port ${config.port}`, {
        environment: config.env,
        port: config.port,
        apiBaseUrl: config.apiBaseUrl,
      });
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await databaseService.disconnect();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error });
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Rejection', { reason });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    process.exit(1);
  }
}

main();
