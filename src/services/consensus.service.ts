import config from '../config';
import { CleanedProduct, VerifiedProduct, ProductCorrection } from '../types/product.types';
import {
  AIValidationResult,
  ConsensusResult,
  ConsensusDiscrepancy,
  RetryContext,
} from '../types/ai.types';
import { verifiedFieldNames } from '../config/verified-fields';
import * as openaiService from './openai.service';
import * as xaiService from './xai.service';
import { compareAIResults, identifyDiscrepancies, mergeAIResults } from '../utils/similarity';
import { generateAttributeTable } from '../utils/html-generator';
import picklistMatcher from './picklist-matcher.service';
import logger from '../utils/logger';

/**
 * Consensus Service
 * Orchestrates dual AI validation and consensus building
 */

interface DualValidationResult {
  openai: AIValidationResult;
  xai: AIValidationResult;
}

/**
 * Perform dual AI validation on a product
 */
async function performDualValidation(
  product: CleanedProduct,
  sessionId: string,
  retryContext?: RetryContext
): Promise<DualValidationResult> {
  logger.info(`Starting dual AI validation for product ${product.originalId}`, { sessionId });

  // Run both validations in parallel (independent, no cross-communication)
  const [openaiResult, xaiResult] = await Promise.all([
    openaiService.validateProduct(
      { product, verifiedFieldsSchema: verifiedFieldNames, sessionId },
      retryContext
    ),
    xaiService.validateProduct(
      { product, verifiedFieldsSchema: verifiedFieldNames, sessionId },
      retryContext
    ),
  ]);

  return { openai: openaiResult, xai: xaiResult };
}

/**
 * Build consensus from dual AI validation results
 */
export async function buildConsensus(
  product: CleanedProduct,
  sessionId: string
): Promise<{ consensusResult: ConsensusResult; verifiedProduct?: VerifiedProduct }> {
  const threshold = config.aiConsensus.threshold;
  const maxRetries = config.aiConsensus.maxRetries;
  const retryDelay = config.aiConsensus.retryDelayMs;

  let retryCount = 0;
  let currentResults: DualValidationResult;
  let discrepancies: ConsensusDiscrepancy[] = [];

  logger.info(`Building consensus for product ${product.originalId}`, { sessionId, threshold, maxRetries });

  // Initial validation
  currentResults = await performDualValidation(product, sessionId);

  while (retryCount < maxRetries) {
    // Check if either validation failed
    if (currentResults.openai.error && currentResults.xai.error) {
      logger.error(`Both AI validations failed for product ${product.originalId}`);
      return {
        consensusResult: {
          agreed: false,
          agreementScore: 0,
          mergedResult: {},
          corrections: [],
          discrepancies: [],
          retryCount,
          finalizedAt: new Date(),
        },
      };
    }

    // Calculate comparison metrics
    const metrics = compareAIResults(currentResults.openai, currentResults.xai);
    logger.debug(`Consensus metrics for ${product.originalId}`, { metrics, retryCount });

    // Check if consensus is reached
    if (metrics.overallScore >= threshold) {
      logger.info(`Consensus reached for product ${product.originalId}`, {
        score: metrics.overallScore,
        retryCount,
      });

      const mergedResult = mergeAIResults(currentResults.openai, currentResults.xai);
      const allCorrections = [
        ...currentResults.openai.corrections,
        ...currentResults.xai.corrections,
      ];

      // Deduplicate corrections
      const uniqueCorrections = deduplicateCorrections(allCorrections);

      const consensusResult: ConsensusResult = {
        agreed: true,
        agreementScore: metrics.overallScore,
        mergedResult,
        corrections: uniqueCorrections,
        discrepancies: [],
        retryCount,
        finalizedAt: new Date(),
      };

      // Build verified product
      const verifiedProduct = buildVerifiedProduct(product, mergedResult, uniqueCorrections);

      return { consensusResult, verifiedProduct };
    }

    // Consensus not reached - identify discrepancies and retry
    discrepancies = identifyDiscrepancies(currentResults.openai, currentResults.xai, threshold);
    
    logger.warn(`Consensus not reached for product ${product.originalId}`, {
      score: metrics.overallScore,
      discrepancyCount: discrepancies.length,
      retryCount,
    });

    // Prepare retry context
    const retryContext: RetryContext = {
      attemptNumber: retryCount + 2, // +2 because initial is attempt 1
      previousDiscrepancies: discrepancies,
      previousResults: currentResults,
    };

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    // Retry validation
    retryCount++;
    currentResults = await performDualValidation(product, sessionId, retryContext);
  }

  // Max retries reached - flag for manual review
  logger.warn(`Max retries reached for product ${product.originalId}, flagging for review`);

  const finalMetrics = compareAIResults(currentResults.openai, currentResults.xai);
  const mergedResult = mergeAIResults(currentResults.openai, currentResults.xai);

  // Mark discrepancies as unresolved
  const unresolvedDiscrepancies = identifyDiscrepancies(
    currentResults.openai,
    currentResults.xai,
    threshold
  );

  return {
    consensusResult: {
      agreed: false,
      agreementScore: finalMetrics.overallScore,
      mergedResult,
      corrections: [],
      discrepancies: unresolvedDiscrepancies,
      retryCount,
      finalizedAt: new Date(),
    },
  };
}

/**
 * Build a verified product from consensus results
 */
function buildVerifiedProduct(
  product: CleanedProduct,
  mergedResult: Record<string, unknown>,
  corrections: ProductCorrection[]
): VerifiedProduct {
  // Generate HTML table for additional attributes
  const additionalAttributesHtml = generateAttributeTable(product.additionalAttributes);

  // Get brand name from merged result or product
  const brandName = (mergedResult.Brand as string) || product.Brand || '';
  
  // Match brand to SF picklist
  const brandMatch = picklistMatcher.matchBrand(brandName);
  const matchedBrand = brandMatch.matched && brandMatch.matchedValue 
    ? brandMatch.matchedValue.brand_name 
    : brandName || undefined;
  const brandId = brandMatch.matched && brandMatch.matchedValue
    ? brandMatch.matchedValue.brand_id
    : null;

  // Get category name from merged result or product
  const categoryName = (mergedResult.PrimaryCategory as string) || product.PrimaryCategory;
  
  // Match category to SF picklist (text only, no ID needed)
  const categoryMatch = picklistMatcher.matchCategory(categoryName);
  const matchedCategory = categoryMatch.matched && categoryMatch.matchedValue
    ? categoryMatch.matchedValue.category_name
    : categoryName;

  logger.debug('Picklist matching results', {
    brand: { original: brandName, matched: matchedBrand, brandId, similarity: brandMatch.similarity },
    category: { original: categoryName, matched: matchedCategory, similarity: categoryMatch.similarity }
  });

  return {
    originalId: product.originalId,
    ProductName: (mergedResult.ProductName as string) || product.ProductName,
    SKU: (mergedResult.SKU as string) || product.SKU,
    Price: (mergedResult.Price as number) || product.Price,
    Description: (mergedResult.Description as string) || product.Description,
    PrimaryCategory: matchedCategory,
    Brand: matchedBrand,
    BrandId: brandId,
    Quantity: (mergedResult.Quantity as number) || product.Quantity,
    Status: (mergedResult.Status as string) || product.Status,
    ImageURL: (mergedResult.ImageURL as string) || product.ImageURL,
    Weight: (mergedResult.Weight as number) || product.Weight,
    verificationScore: calculateVerificationScore(mergedResult),
    corrections,
    additionalAttributesHtml,
    verifiedAt: new Date(),
    verifiedBy: ['openai', 'xai'],
  };
}

/**
 * Calculate verification score based on field completeness
 */
function calculateVerificationScore(result: Record<string, unknown>): number {
  let score = 0;
  let totalWeight = 0;

  const fieldWeights: Record<string, number> = {
    ProductName: 20,
    SKU: 15,
    Price: 15,
    Description: 15,
    PrimaryCategory: 10,
    Brand: 5,
    Quantity: 5,
    Status: 10,
    ImageURL: 3,
    Weight: 2,
  };

  for (const [field, weight] of Object.entries(fieldWeights)) {
    totalWeight += weight;
    const value = result[field];
    
    if (value !== null && value !== undefined && value !== '') {
      score += weight;
    }
  }

  return (score / totalWeight) * 100;
}

/**
 * Deduplicate corrections from both AI providers
 */
function deduplicateCorrections(corrections: ProductCorrection[]): ProductCorrection[] {
  const seen = new Map<string, ProductCorrection>();

  for (const correction of corrections) {
    const key = `${correction.field}:${JSON.stringify(correction.correctedValue)}`;
    
    if (!seen.has(key)) {
      seen.set(key, correction);
    } else {
      // If same correction from both AIs, mark as consensus
      const existing = seen.get(key)!;
      existing.suggestedBy = 'consensus';
    }
  }

  return Array.from(seen.values());
}

/**
 * Process multiple products through consensus
 */
export async function processProducts(
  products: CleanedProduct[],
  sessionId: string
): Promise<Array<{ consensusResult: ConsensusResult; verifiedProduct?: VerifiedProduct }>> {
  logger.info(`Processing ${products.length} products through consensus`, { sessionId });

  const results: Array<{ consensusResult: ConsensusResult; verifiedProduct?: VerifiedProduct }> = [];

  // Process sequentially to manage API rate limits
  for (const product of products) {
    try {
      const result = await buildConsensus(product, sessionId);
      results.push(result);
    } catch (error) {
      logger.error(`Failed to process product ${product.originalId}`, { error });
      results.push({
        consensusResult: {
          agreed: false,
          agreementScore: 0,
          mergedResult: {},
          corrections: [],
          discrepancies: [],
          retryCount: 0,
          finalizedAt: new Date(),
        },
      });
    }

    // Delay between products
    await new Promise(resolve => setTimeout(resolve, config.batch.delayMs));
  }

  return results;
}

export default {
  buildConsensus,
  processProducts,
};
