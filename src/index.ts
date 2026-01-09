import { createApp } from './app';
import config from './config';
import { databaseService } from './services';
import logger from './utils/logger';

/**
 * Application Entry Point
 * Build version: 2026-01-09-v3 (Vercel serverless compatible)
 * 
 * Supports both:
 * - Vercel serverless: exports handler, lazy DB connection
 * - Traditional server: npm start runs main()
 */

// Create Express app (always available)
const app = createApp();

// Database connection state for serverless
let dbConnected = false;

/**
 * Ensure database is connected (for serverless cold starts)
 */
async function ensureDbConnected(): Promise<void> {
  if (!dbConnected && process.env.MONGODB_URI) {
    try {
      await databaseService.connect();
      dbConnected = true;
    } catch (error) {
      logger.error('Database connection failed', { error });
      // Continue without DB - some routes may still work
    }
  }
}

/**
 * Vercel Serverless Handler
 * Exported for Vercel to use as the request handler
 */
export default async function handler(req: any, res: any): Promise<void> {
  await ensureDbConnected();
  return app(req, res);
}

// Also export the app directly for flexibility
export { app };

/**
 * Traditional Server Mode
 * Only runs when executed directly (not imported by Vercel)
 */
async function main(): Promise<void> {
  try {
    logger.info('Starting Catalog Verification API...');
    await databaseService.connect();
    dbConnected = true;

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

      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

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

// Only start server if running directly (not in Vercel serverless)
// Vercel sets VERCEL=1 environment variable
if (!process.env.VERCEL) {
  main();
}
