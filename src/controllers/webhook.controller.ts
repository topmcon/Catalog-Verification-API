import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Product, VerificationSession, AuditLog } from '../models';
import { consensusService } from '../services';
import { cleanProducts } from '../utils/data-cleaner';
import { RawProduct } from '../types/product.types';
import { SalesforceWebhookPayload } from '../types/api.types';
import config from '../config';
import logger from '../utils/logger';

/**
 * Webhook Controller
 * Handles incoming webhooks from Salesforce
 */

/**
 * Process Salesforce webhook
 */
export async function handleSalesforceWebhook(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const sessionId = uuidv4();
  const payload = req.body as SalesforceWebhookPayload;
  const { products, metadata } = payload;

  logger.info(`Received Salesforce webhook`, {
    sessionId,
    productCount: products.length,
    batchId: metadata?.batchId,
    source: metadata?.source,
  });

  // Immediately acknowledge receipt
  res.status(202).json({
    success: true,
    sessionId,
    message: 'Verification started',
    timestamp: new Date().toISOString(),
  });

  // Process asynchronously
  processWebhookAsync(sessionId, products, metadata, startTime).catch(error => {
    logger.error(`Async webhook processing failed for session ${sessionId}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  });
}

/**
 * Async webhook processing
 */
async function processWebhookAsync(
  sessionId: string,
  products: RawProduct[],
  metadata: SalesforceWebhookPayload['metadata'],
  startTime: number
): Promise<void> {
  // Create session record
  const session = await VerificationSession.create({
    sessionId,
    status: 'processing',
    totalProducts: products.length,
    sourceMetadata: {
      batchId: metadata?.batchId,
      source: metadata?.source || 'salesforce_webhook',
      timestamp: metadata?.timestamp ? new Date(metadata.timestamp) : new Date(),
    },
    startedAt: new Date(),
  });

  // Log session creation
  await AuditLog.create({
    sessionId,
    action: 'session_created',
    details: { productCount: products.length, source: 'webhook', metadata },
  });

  try {
    // Clean products
    const cleanedProducts = cleanProducts(products);

    // Store products
    await Promise.all(
      cleanedProducts.map((cleaned, index) =>
        Product.create({
          sessionId,
          originalId: cleaned.originalId,
          rawData: products[index],
          cleanedData: cleaned,
          status: 'processing',
        })
      )
    );

    // Process in batches
    const batchSize = config.batch.size;
    let verifiedCount = 0;
    let failedCount = 0;
    let flaggedCount = 0;

    for (let i = 0; i < cleanedProducts.length; i += batchSize) {
      const batch = cleanedProducts.slice(i, i + batchSize);
      const batchResults = await consensusService.processProducts(batch, sessionId);

      for (let j = 0; j < batch.length; j++) {
        const product = batch[j];
        const { consensusResult, verifiedProduct } = batchResults[j];

        let productStatus: 'verified' | 'failed' | 'flagged';

        if (verifiedProduct && consensusResult.agreed) {
          productStatus = 'verified';
          verifiedCount++;
        } else if (!consensusResult.agreed && consensusResult.discrepancies.length > 0) {
          productStatus = 'flagged';
          flaggedCount++;
        } else {
          productStatus = 'failed';
          failedCount++;
        }

        await Product.findOneAndUpdate(
          { sessionId, originalId: product.originalId },
          {
            status: productStatus,
            verifiedData: verifiedProduct,
          }
        );

        session.aiResults.push({
          productId: product.originalId,
          consensusResult,
        });
      }
    }

    // Update session
    const processingTimeMs = Date.now() - startTime;
    await VerificationSession.findOneAndUpdate(
      { sessionId },
      {
        status: failedCount === 0 ? 'completed' : 'partial',
        verifiedCount,
        failedCount,
        flaggedCount,
        aiResults: session.aiResults,
        processingTimeMs,
        completedAt: new Date(),
      }
    );

    await AuditLog.create({
      sessionId,
      action: 'session_completed',
      details: { verifiedCount, failedCount, flaggedCount, processingTimeMs },
    });

    logger.info(`Webhook processing completed for session ${sessionId}`, {
      verifiedCount,
      failedCount,
      flaggedCount,
      processingTimeMs,
    });

    // TODO: Optionally callback to Salesforce with results
    // await notifySalesforceComplete(sessionId, verifiedCount, failedCount, flaggedCount);

  } catch (error) {
    const processingTimeMs = Date.now() - startTime;

    await VerificationSession.findOneAndUpdate(
      { sessionId },
      {
        status: 'failed',
        processingTimeMs,
        completedAt: new Date(),
      }
    );

    await AuditLog.create({
      sessionId,
      action: 'session_failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    });

    logger.error(`Webhook processing failed for session ${sessionId}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get webhook processing status
 */
export async function getWebhookStatus(req: Request, res: Response): Promise<void> {
  const { sessionId } = req.params;

  const session = await VerificationSession.findOne({ sessionId });

  if (!session) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Session not found' },
    });
    return;
  }

  res.status(200).json({
    success: true,
    sessionId: session.sessionId,
    status: session.status,
    totalProducts: session.totalProducts,
    verifiedCount: session.verifiedCount,
    failedCount: session.failedCount,
    flaggedCount: session.flaggedCount,
    processingTimeMs: session.processingTimeMs,
    completedAt: session.completedAt,
  });
}

/**
 * Handle SF confirmation that data was saved successfully
 * SF calls this after successfully saving the verification response to the record
 */
export async function handleSaveConfirmation(req: Request, res: Response): Promise<void> {
  const {
    sf_catalog_id,
    sf_catalog_name,
    session_id,
    status,
    fields_updated,
    error_message,
    timestamp
  } = req.body;

  const confirmationTime = new Date().toISOString();

  if (status === 'saved') {
    logger.info('✅ SF CONFIRMATION: Data saved successfully', {
      sf_catalog_id,
      sf_catalog_name,
      session_id,
      fields_updated,
      sf_timestamp: timestamp,
      confirmation_time: confirmationTime
    });

    // Optional: Update analytics or tracking
    try {
      await AuditLog.create({
        sessionId: session_id || 'unknown',
        action: 'sf_save_confirmed',
        details: {
          sf_catalog_id,
          sf_catalog_name,
          fields_updated,
          status: 'success',
          sf_timestamp: timestamp
        },
        timestamp: new Date()
      });
    } catch (err) {
      logger.warn('Failed to log SF confirmation to audit', { error: err });
    }

    res.status(200).json({
      success: true,
      message: 'Confirmation received',
      received_at: confirmationTime
    });
  } else if (status === 'error') {
    logger.error('❌ SF CONFIRMATION: Save failed', {
      sf_catalog_id,
      sf_catalog_name,
      session_id,
      error_message,
      sf_timestamp: timestamp,
      confirmation_time: confirmationTime
    });

    // Log the error for tracking
    try {
      await AuditLog.create({
        sessionId: session_id || 'unknown',
        action: 'sf_save_failed',
        details: {
          sf_catalog_id,
          sf_catalog_name,
          error_message,
          status: 'error',
          sf_timestamp: timestamp
        },
        timestamp: new Date()
      });
    } catch (err) {
      logger.warn('Failed to log SF error to audit', { error: err });
    }

    res.status(200).json({
      success: true,
      message: 'Error confirmation received',
      received_at: confirmationTime
    });
  } else {
    logger.warn('SF CONFIRMATION: Unknown status', {
      sf_catalog_id,
      status,
      body: req.body
    });

    res.status(200).json({
      success: true,
      message: 'Confirmation received (unknown status)',
      received_at: confirmationTime
    });
  }
}

export default {
  handleSalesforceWebhook,
  getWebhookStatus,
  handleSaveConfirmation,
};
