import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import config from './config';
import routes from './routes';
import { errorHandler, notFoundHandler, requestLogger, attachRequestId } from './middleware';
import { httpLogStream } from './utils/logger';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: config.env === 'production' 
      ? process.env.ALLOWED_ORIGINS?.split(',') 
      : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-request-id'],
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request ID and logging
  app.use(attachRequestId);
  app.use(requestLogger);
  
  // HTTP request logging (Morgan)
  if (config.env !== 'test') {
    app.use(morgan('combined', { stream: httpLogStream }));
  }

  // Routes
  app.use(routes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
