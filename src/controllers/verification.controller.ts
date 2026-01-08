import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Product, VerificationSession, AuditLog } from '../models';
import { consensusService, salesforceService } from '../services';
import { cleanProducts } from '../utils/data-cleaner';
import { RawProduct, VerifiedProduct } from '../types/product.types';
import { VerificationResponse, VerificationResultItem } from '../types/api.types';
import config from '../config';
import logger from '../utils/logger';
import { ApiError } from '../middleware/error.middleware';

/**
 * Verification Controller
 * Handles product verification requests
 */

/**
 * Process verification request
 */
export async function verify(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const sessionId = uuidv4();
  const { products, options } = req.body as {
    products: RawProduct[];
    options?: { skipConsensus?: boolean; batchSize?: number };
  };

  logger.info(`Starting verification session ${sessionId}`, {
    productCount: products.length,
    options,
  });

  // Create session record
  const session = await VerificationSession.create({
    sessionId,
    status: 'processing',
    totalProducts: products.length,
    sourceMetadata: {
      timestamp: new Date(),
      source: 'api',
    },
    startedAt: new Date(),
  });

  // Log session creation
  await AuditLog.create({
    sessionId,
    action: 'session_created',
    details: { productCount: products.length, options },
  });

  try {
    // Step 1: Clean products
    const cleanedProducts = cleanProducts(products);
    
    // Store raw and cleaned products
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

    // Log cleaning complete
    await AuditLog.create({
      sessionId,
      action: 'session_started',
      details: { cleanedCount: cleanedProducts.length },
    });

    // Step 2: Process in batches
    const batchSize = options?.batchSize || config.batch.size;
    const results: VerificationResultItem[] = [];
    let verifiedCount = 0;
    let failedCount = 0;
    let flaggedCount = 0;

    for (let i = 0; i < cleanedProducts.length; i += batchSize) {
      const batch = cleanedProducts.slice(i, i + batchSize);
      logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}`, {
        sessionId,
        batchStart: i,
        batchSize: batch.length,
      });

      // Step 3: Run consensus for each product in batch
      const batchResults = await consensusService.processProducts(batch, sessionId);

      // Process results
      for (let j = 0; j < batch.length; j++) {
        const product = batch[j];
        const { consensusResult, verifiedProduct } = batchResults[j];

        let status: 'verified' | 'failed' | 'flagged_for_review';
        let productStatus: 'verified' | 'failed' | 'flagged';

        if (verifiedProduct && consensusResult.agreed) {
          status = 'verified';
          productStatus = 'verified';
          verifiedCount++;
        } else if (!consensusResult.agreed && consensusResult.discrepancies.length > 0) {
          status = 'flagged_for_review';
          productStatus = 'flagged';
          flaggedCount++;
        } else {
          status = 'failed';
          productStatus = 'failed';
          failedCount++;
        }

        // Update product record
        await Product.findOneAndUpdate(
          { sessionId, originalId: product.originalId },
          {
            status: productStatus,
            verifiedData: verifiedProduct,
          }
        );

        // Store AI results in session
        session.aiResults.push({
          productId: product.originalId,
          consensusResult,
        });

        results.push({
          productId: product.originalId,
          status,
          verifiedProduct,
          consensusResult,
        });

        // Log verification result
        await AuditLog.create({
          sessionId,
          productId: product.originalId,
          action: verifiedProduct ? 'product_verified' : 'product_flagged',
          details: {
            agreed: consensusResult.agreed,
            score: consensusResult.agreementScore,
            retries: consensusResult.retryCount,
          },
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

    // Log session completion
    await AuditLog.create({
      sessionId,
      action: 'session_completed',
      details: { verifiedCount, failedCount, flaggedCount, processingTimeMs },
    });

    const response: VerificationResponse = {
      success: true,
      sessionId,
      totalProducts: products.length,
      verifiedCount,
      failedCount,
      flaggedForReviewCount: flaggedCount,
      results,
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };

    logger.info(`Verification session ${sessionId} completed`, {
      verifiedCount,
      failedCount,
      flaggedCount,
      processingTimeMs,
    });

    res.status(200).json(response);
  } catch (error) {
    // Update session as failed
    await VerificationSession.findOneAndUpdate(
      { sessionId },
      {
        status: 'failed',
        processingTimeMs: Date.now() - startTime,
        completedAt: new Date(),
      }
    );

    // Log error
    await AuditLog.create({
      sessionId,
      action: 'session_failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    });

    throw error;
  }
}

/**
 * Get session status
 */
export async function getSessionStatus(req: Request, res: Response): Promise<void> {
  const { sessionId } = req.params;

  const session = await VerificationSession.findOne({ sessionId });

  if (!session) {
    throw new ApiError(404, 'NOT_FOUND', `Session ${sessionId} not found`);
  }

  res.status(200).json({
    success: true,
    session: {
      sessionId: session.sessionId,
      status: session.status,
      totalProducts: session.totalProducts,
      verifiedCount: session.verifiedCount,
      failedCount: session.failedCount,
      flaggedCount: session.flaggedCount,
      processingTimeMs: session.processingTimeMs,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      exportedToSalesforce: session.exportedToSalesforce,
    },
  });
}

/**
 * Get session products
 */
export async function getSessionProducts(req: Request, res: Response): Promise<void> {
  const { sessionId } = req.params;
  const { status, page = 1, limit = 50 } = req.query;

  const query: Record<string, unknown> = { sessionId };
  if (status) {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(query)
      .skip(skip)
      .limit(Number(limit))
      .select('-rawData -__v')
      .lean(),
    Product.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
}

/**
 * Export verified products to Salesforce
 */
export async function exportToSalesforce(req: Request, res: Response): Promise<void> {
  const { sessionId } = req.body;
  const { productIds } = req.body as { sessionId: string; productIds?: string[] };

  logger.info(`Starting Salesforce export for session ${sessionId}`);

  // Get session
  const session = await VerificationSession.findOne({ sessionId });
  if (!session) {
    throw new ApiError(404, 'NOT_FOUND', `Session ${sessionId} not found`);
  }

  if (session.status !== 'completed' && session.status !== 'partial') {
    throw new ApiError(400, 'BAD_REQUEST', 'Session is not ready for export');
  }

  // Get verified products
  const query: Record<string, unknown> = { sessionId, status: 'verified' };
  if (productIds && productIds.length > 0) {
    query.originalId = { $in: productIds };
  }

  const products = await Product.find(query).lean();
  const verifiedProducts = products
    .map(p => p.verifiedData as VerifiedProduct | undefined)
    .filter((p): p is VerifiedProduct => p !== undefined && p !== null);

  if (verifiedProducts.length === 0) {
    throw new ApiError(400, 'BAD_REQUEST', 'No verified products to export');
  }

  // Export to Salesforce
  const result = await salesforceService.exportProducts(verifiedProducts, sessionId);

  // Update session
  await VerificationSession.findOneAndUpdate(
    { sessionId },
    {
      exportedToSalesforce: result.success,
      exportedAt: new Date(),
    }
  );

  // Log export
  await AuditLog.create({
    sessionId,
    action: 'salesforce_export',
    details: result,
  });

  res.status(200).json({
    success: result.success,
    exported: result.successCount,
    failed: result.failedCount,
    errors: result.errors,
  });
}

/**
 * Get session audit logs
 */
export async function getSessionLogs(req: Request, res: Response): Promise<void> {
  const { sessionId } = req.params;
  const { page = 1, limit = 100 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    AuditLog.find({ sessionId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    AuditLog.countDocuments({ sessionId }),
  ]);

  res.status(200).json({
    success: true,
    data: logs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
}

export default {
  verify,
  getSessionStatus,
  getSessionProducts,
  exportToSalesforce,
  getSessionLogs,
};
