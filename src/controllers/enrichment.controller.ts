import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { enrichProduct, RawProductData, EnrichmentResult } from '../services/enrichment.service';
import { VerificationSession, AuditLog, Product } from '../models';
import logger from '../utils/logger';

/**
 * Enrichment Controller
 * Handles product data enrichment requests
 */

export interface EnrichmentRequest {
  products: RawProductData[];
  options?: {
    skipAI?: boolean;
    batchSize?: number;
  };
}

export interface EnrichmentResponse {
  success: boolean;
  sessionId: string;
  totalProducts: number;
  enrichedCount: number;
  failedCount: number;
  results: EnrichmentResult[];
  processingTimeMs: number;
  timestamp: string;
}

/**
 * Process enrichment request
 */
export async function enrich(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const sessionId = uuidv4();
  const { products, options } = req.body as EnrichmentRequest;

  if (!products || !Array.isArray(products) || products.length === 0) {
    res.status(400).json({
      success: false,
      error: 'Products array is required and must not be empty',
    });
    return;
  }

  logger.info(`Starting enrichment session ${sessionId}`, {
    productCount: products.length,
    options,
  });

  // Create session record
  await VerificationSession.create({
    sessionId,
    status: 'processing',
    totalProducts: products.length,
    sourceMetadata: {
      timestamp: new Date(),
      source: 'enrichment-api',
    },
    startedAt: new Date(),
  });

  // Log session creation
  await AuditLog.create({
    sessionId,
    action: 'enrichment_session_created',
    details: { productCount: products.length, options },
  });

  try {
    const results: EnrichmentResult[] = [];
    let enrichedCount = 0;
    let failedCount = 0;

    // Process products
    const batchSize = options?.batchSize || 10;
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      logger.info(`Processing enrichment batch ${Math.floor(i / batchSize) + 1}`, {
        sessionId,
        batchStart: i,
        batchSize: batch.length,
      });

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (product, index) => {
          const productId = product.id || product.sku || product.modelNumber || `product-${i + index}`;
          
          try {
            const result = await enrichProduct(product);
            
            // Store product record
            await Product.create({
              sessionId,
              originalId: productId,
              rawData: product,
              cleanedData: result.success ? result.product?.attributes : null,
              status: result.success ? 'verified' : 'failed',
              verifiedData: result.success ? {
                title: result.product?.title,
                description: result.product?.description,
                category: result.product?.category?.categoryName,
                department: result.product?.category?.department,
                attributes: result.product?.attributes,
              } : null,
            });

            if (result.success) {
              enrichedCount++;
            } else {
              failedCount++;
            }

            // Log result
            await AuditLog.create({
              sessionId,
              productId,
              action: result.success ? 'product_enriched' : 'enrichment_failed',
              details: {
                category: result.product?.category?.categoryName,
                confidence: result.product?.confidence,
                aiGeneratedFields: result.product?.aiGenerated?.length || 0,
                error: result.error,
              },
            });

            return result;
          } catch (error) {
            logger.error(`Failed to enrich product ${productId}:`, error);
            failedCount++;
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      results.push(...batchResults);
    }

    // Update session
    const processingTimeMs = Date.now() - startTime;
    await VerificationSession.findOneAndUpdate(
      { sessionId },
      {
        status: failedCount === 0 ? 'completed' : 'partial',
        verifiedCount: enrichedCount,
        failedCount,
        processingTimeMs,
        completedAt: new Date(),
      }
    );

    // Log session completion
    await AuditLog.create({
      sessionId,
      action: 'enrichment_session_completed',
      details: { enrichedCount, failedCount, processingTimeMs },
    });

    const response: EnrichmentResponse = {
      success: true,
      sessionId,
      totalProducts: products.length,
      enrichedCount,
      failedCount,
      results,
      processingTimeMs,
      timestamp: new Date().toISOString(),
    };

    logger.info(`Enrichment session ${sessionId} completed`, {
      enrichedCount,
      failedCount,
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
      }
    );

    logger.error(`Enrichment session ${sessionId} failed:`, error);

    await AuditLog.create({
      sessionId,
      action: 'enrichment_session_failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    });

    res.status(500).json({
      success: false,
      sessionId,
      error: 'Enrichment processing failed',
    });
  }
}

/**
 * Enrich a single product (quick endpoint)
 */
export async function enrichSingle(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const product = req.body as RawProductData;

  if (!product || Object.keys(product).length === 0) {
    res.status(400).json({
      success: false,
      error: 'Product data is required',
    });
    return;
  }

  try {
    const result = await enrichProduct(product);
    
    res.status(result.success ? 200 : 400).json({
      ...result,
      processingTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('Single enrichment failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default { enrich, enrichSingle };
