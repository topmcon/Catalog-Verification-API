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
import config from '../config';

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
      webhookUrl
    } = req.body;

    // Validate required fields
    if (!SF_Catalog_Id) {
      throw new ApiError(400, 'MISSING_FIELD', 'Missing required field: SF_Catalog_Id');
    }

    if (!SF_Catalog_Name) {
      throw new ApiError(400, 'MISSING_FIELD', 'Missing required field: SF_Catalog_Name (model number)');
    }

    // Use provided webhook URL or fall back to default Salesforce webhook
    const finalWebhookUrl = webhookUrl || config.salesforce.webhookUrl;

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', { service: 'catalog-verification' });
    logger.info('STEP 1: Received Salesforce verification request', {
      jobId,
      sfCatalogId: SF_Catalog_Id,
      sfCatalogName: SF_Catalog_Name,
      webhookUrl: finalWebhookUrl,
      webhookSource: webhookUrl ? 'provided' : 'default',
      payloadSize: JSON.stringify(req.body).length + ' bytes'
    });

    // Create verification job (store entire request body as rawPayload)
    await VerificationJob.create({
      jobId,
      sfCatalogId: SF_Catalog_Id,
      sfCatalogName: SF_Catalog_Name,
      status: 'pending',
      rawPayload: req.body, // Store complete payload
      webhookUrl: finalWebhookUrl,
      webhookAttempts: 0
    });

    logger.info('STEP 2: Verification job saved to database', {
      jobId,
      sfCatalogId: SF_Catalog_Id,
      status: 'pending',
      queueTime: Date.now() - startTime + 'ms'
    });

    // Job will be picked up by async processor (polls every 5 seconds)
    // Optionally trigger immediate processing for faster response
    asyncVerificationProcessor.processNextJob().catch(err => {
      // Non-critical - job will be picked up by next poll cycle
      logger.debug('Immediate processing trigger failed (job will be processed in next poll)', {
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
      webhookConfigured: true,
      webhookUrl: finalWebhookUrl,
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
      response.webhookDelivery = {
        success: job.webhookSuccess,
        attempts: job.webhookAttempts,
        lastAttempt: job.webhookLastAttempt,
        configured: !!job.webhookUrl
      };
    }

    if (job.status === 'failed') {
      response.error = job.error;
      response.completedAt = job.completedAt;
      response.webhookDelivery = {
        success: job.webhookSuccess,
        attempts: job.webhookAttempts,
        lastAttempt: job.webhookLastAttempt,
        configured: !!job.webhookUrl
      };
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

/**
 * Salesforce acknowledgment endpoint - confirms they received webhook data
 * POST /api/verify/salesforce/acknowledge/:jobId
 */
export async function acknowledgeReceipt(req: Request, res: Response): Promise<void> {
  try {
    const { jobId } = req.params;
    const { 
      received = true, 
      processed = false,
      error = null,
      salesforce_record_updated = false 
    } = req.body;

    const job = await VerificationJob.findOne({ jobId });

    if (!job) {
      throw new ApiError(404, 'JOB_NOT_FOUND', 'Job not found');
    }

    logger.info('Salesforce acknowledged webhook receipt', {
      jobId,
      sfCatalogId: job.sfCatalogId,
      received,
      processed,
      salesforce_record_updated,
      error
    });

    // Update job with Salesforce confirmation
    job.salesforceAcknowledged = received;
    job.salesforceProcessed = processed;
    job.salesforceError = error;
    job.salesforceAcknowledgedAt = new Date();
    await job.save();

    res.json({
      success: true,
      message: 'Acknowledgment received',
      jobId,
      SF_Catalog_Id: job.sfCatalogId
    });

  } catch (error) {
    logger.error('Error processing Salesforce acknowledgment', {
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
