/**
 * ASYNC SALESFORCE VERIFICATION CONTROLLER
 * Handles Salesforce verification requests with immediate response
 * and async processing via webhook callback
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { VerificationJob } from '../models/verification-job.model';
import asyncVerificationProcessor from '../services/async-verification-processor.service';
import { ApiError } from '../middleware/error.middleware';

/**
 * Salesforce verification endpoint - Immediate acknowledgment
 * POST /api/verify/salesforce
 */
export async function verifySalesforceAsync(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const jobId = uuidv4();

  try {
    // Extract Salesforce payload
    const {
      SF_Catalog_Id,
      SF_Catalog_Name,
      webhookUrl,
      ...productData
    } = req.body;

    // Validate required fields
    if (!SF_Catalog_Id) {
      throw new ApiError(400, 'MISSING_FIELD', 'Missing required field: SF_Catalog_Id');
    }

    if (!SF_Catalog_Name) {
      throw new ApiError(400, 'MISSING_FIELD', 'Missing required field: SF_Catalog_Name (model number)');
    }

    logger.info('Received Salesforce verification request', {
      jobId,
      sfCatalogId: SF_Catalog_Id,
      sfCatalogName: SF_Catalog_Name,
      webhookUrl: webhookUrl || 'none'
    });

    // Create verification job
    await VerificationJob.create({
      jobId,
      sfCatalogId: SF_Catalog_Id,
      sfCatalogName: SF_Catalog_Name,
      status: 'pending',
      rawPayload: productData,
      webhookUrl: webhookUrl,
      webhookAttempts: 0
    });

    logger.info('Verification job queued', {
      jobId,
      sfCatalogId: SF_Catalog_Id,
      queueTime: Date.now() - startTime
    });

    // Trigger async processing (non-blocking)
    asyncVerificationProcessor.triggerProcessing().catch(err => {
      logger.error('Error triggering async processor', {
        jobId,
        error: err instanceof Error ? err.message : String(err)
      });
    });

    // Send immediate acknowledgment response
    res.status(202).json({
      success: true,
      message: 'Request Received / Processing',
      jobId,
      SF_Catalog_Id,
      SF_Catalog_Name,
      status: 'queued',
      estimatedProcessingTime: '30-120 seconds',
      webhookConfigured: !!webhookUrl,
      receivedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error queuing verification job', {
      jobId,
      error: error instanceof Error ? error.message : String(error)
    });

    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        jobId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        jobId
      });
    }
  }
}

/**
 * Check verification job status
 * GET /api/verify/salesforce/status/:jobId
 */
export async function getVerificationStatus(req: Request, res: Response): Promise<void> {
  try {
    const { jobId } = req.params;

    const job = await VerificationJob.findOne({ jobId });

    if (!job) {
      throw new ApiError(404, 'JOB_NOT_FOUND', 'Job not found');
    }

    const response: any = {
      jobId: job.jobId,
      SF_Catalog_Id: job.sfCatalogId,
      SF_Catalog_Name: job.sfCatalogName,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    };

    if (job.status === 'processing') {
      response.startedAt = job.startedAt;
    }

    if (job.status === 'completed') {
      response.completedAt = job.completedAt;
      response.processingTimeMs = job.processingTimeMs;
      response.result = job.result;
      response.webhookSuccess = job.webhookSuccess;
    }

    if (job.status === 'failed') {
      response.error = job.error;
      response.completedAt = job.completedAt;
    }

    res.json(response);

  } catch (error) {
    logger.error('Error fetching job status', {
      error: error instanceof Error ? error.message : String(error)
    });

    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

/**
 * Get queue statistics
 * GET /api/verify/salesforce/queue/stats
 */
export async function getQueueStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await asyncVerificationProcessor.getQueueStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching queue stats', {
      error: error instanceof Error ? error.message : String(error)
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Model number check endpoint (for Salesforce to verify model before sending full request)
 * POST /api/verify/salesforce/model-check
 */
export async function checkModelNumber(req: Request, res: Response): Promise<void> {
  try {
    const { model_number } = req.body;

    if (!model_number) {
      throw new ApiError(400, 'MISSING_FIELD', 'Missing required field: model_number');
    }

    logger.info('Model number check requested', { model_number });

    // TODO: Implement catalog lookup to check if model exists
    // For now, just return acknowledgment
    res.json({
      success: true,
      model_number,
      exists: true, // TODO: Implement actual check
      message: 'Model number verification endpoint - implementation pending'
    });

  } catch (error) {
    logger.error('Error checking model number', {
      error: error instanceof Error ? error.message : String(error)
    });

    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
