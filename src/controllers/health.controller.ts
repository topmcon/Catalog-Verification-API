import { Request, Response } from 'express';
import { databaseService } from '../services';
import * as openaiService from '../services/openai.service';
import * as xaiService from '../services/xai.service';
import * as salesforceService from '../services/salesforce.service';
import { HealthCheckResponse } from '../types/api.types';
import config from '../config';

/**
 * Health Controller
 * Handles health check endpoints
 */

/**
 * Basic health check
 */
export async function healthCheck(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Detailed health check with service status
 */
export async function detailedHealthCheck(_req: Request, res: Response): Promise<void> {
  const timestamp = new Date().toISOString();

  // Check all services in parallel
  const [dbHealth, openaiHealth, xaiHealth, salesforceHealth] = await Promise.all([
    databaseService.healthCheck(),
    openaiService.healthCheck(),
    xaiService.healthCheck(),
    salesforceService.healthCheck(),
  ]);

  // Determine overall status
  const services = {
    database: {
      status: dbHealth.status,
      latencyMs: dbHealth.latencyMs,
      lastChecked: timestamp,
      error: dbHealth.error,
    },
    openai: {
      status: openaiHealth.status,
      latencyMs: openaiHealth.latencyMs,
      lastChecked: timestamp,
      error: openaiHealth.error,
    },
    xai: {
      status: xaiHealth.status,
      latencyMs: xaiHealth.latencyMs,
      lastChecked: timestamp,
      error: xaiHealth.error,
    },
    salesforce: {
      status: salesforceHealth.status,
      latencyMs: salesforceHealth.latencyMs,
      lastChecked: timestamp,
      error: salesforceHealth.error,
    },
  };

  // Determine overall health
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  const downServices = Object.values(services).filter(s => s.status === 'down');
  if (downServices.length > 0) {
    // Database down = unhealthy, other services down = degraded
    if (services.database.status === 'down') {
      overallStatus = 'unhealthy';
    } else {
      overallStatus = 'degraded';
    }
  }

  const response: HealthCheckResponse = {
    status: overallStatus,
    version: process.env.npm_package_version || '1.0.0',
    timestamp,
    services,
  };

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
  res.status(statusCode).json(response);
}

/**
 * Readiness check (for Kubernetes)
 */
export async function readinessCheck(_req: Request, res: Response): Promise<void> {
  const dbHealth = await databaseService.healthCheck();

  if (dbHealth.status === 'up') {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false, reason: 'Database unavailable' });
  }
}

/**
 * Liveness check (for Kubernetes)
 */
export function livenessCheck(_req: Request, res: Response): void {
  res.status(200).json({ alive: true });
}

/**
 * Get application info
 */
export function getInfo(_req: Request, res: Response): void {
  res.status(200).json({
    name: 'Catalog Verification API',
    version: process.env.npm_package_version || '1.0.0',
    environment: config.env,
    nodeVersion: process.version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}

export default {
  healthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck,
  getInfo,
};
