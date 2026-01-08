import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import config from '../config';
import { ApiError } from './error.middleware';
import logger from '../utils/logger';

/**
 * API Key Authentication Middleware
 */
export function apiKeyAuth(req: Request, _res: Response, next: NextFunction): void {
  const apiKey = req.headers[config.security.apiKeyHeader.toLowerCase()] as string;

  if (!apiKey) {
    throw new ApiError(401, 'UNAUTHORIZED', 'API key is required');
  }

  // In production, validate against stored API keys
  // For now, check against webhook secret
  if (apiKey !== config.security.webhookSecret) {
    logger.warn('Invalid API key attempt', {
      ip: req.ip,
      path: req.path,
    });
    throw new ApiError(403, 'FORBIDDEN', 'Invalid API key');
  }

  next();
}

/**
 * Salesforce Webhook Signature Verification
 * Validates that the request came from Salesforce
 */
export function verifySalesforceWebhook(req: Request, _res: Response, next: NextFunction): void {
  const signature = req.headers['x-salesforce-signature'] as string;
  
  // Skip verification in development if no signature provided
  if (config.env === 'development' && !signature) {
    logger.debug('Skipping Salesforce webhook verification in development');
    next();
    return;
  }

  if (!signature) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Salesforce signature is required');
  }

  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', config.security.webhookSecret)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    logger.warn('Invalid Salesforce webhook signature', {
      ip: req.ip,
      path: req.path,
    });
    throw new ApiError(403, 'FORBIDDEN', 'Invalid webhook signature');
  }

  next();
}

/**
 * Request Logger Middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}

/**
 * Attach request ID middleware
 */
export function attachRequestId(req: Request, _res: Response, next: NextFunction): void {
  req.id = req.headers['x-request-id'] as string || crypto.randomUUID();
  next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export default {
  apiKeyAuth,
  verifySalesforceWebhook,
  requestLogger,
  attachRequestId,
};
