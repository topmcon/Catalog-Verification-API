/**
 * Vercel Serverless Function Entry Point
 * This exports the Express app for Vercel to use
 */
import { createApp } from '../src/app';
import { databaseService } from '../src/services';
import logger from '../src/utils/logger';

// Create the Express app
const app = createApp();

// Connect to database on cold start
let dbConnected = false;
const connectDB = async () => {
  if (!dbConnected) {
    try {
      await databaseService.connect();
      dbConnected = true;
      logger.info('Database connected for serverless function');
    } catch (error) {
      logger.error('Failed to connect to database', { error });
      // Don't fail the request, continue without DB
    }
  }
};

// Wrap the app to ensure DB connection
const handler = async (req: any, res: any) => {
  await connectDB();
  return app(req, res);
};

export default handler;
