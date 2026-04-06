/**
 * CategoryClassifierAgent - Module-Level Consensus Builder
 * 
 * Compares OpenAI vs xAI results at each hierarchical level:
 * - Department agreement (critical)
 * - Family agreement (medium)
 * - Category agreement (low if same family)
 * 
 * Handles asymmetric confidence: High-disparity agreement
 * (both AIs return same category but with very different confidence scores)
 */

import { AgentConsensus, AgentDiscrepancy } from '../base/types';
import { CategoryClassifierOutput } from './schema';
import logger from '../../utils/logger';

/**
 * Build consensus between OpenAI and xAI category classifications
 */
export async function buildCategoryConsensus(
  openaiResult: CategoryClassifierOutput,
  xaiResult: CategoryClassifierOutput
): Promise<AgentConsensus<CategoryClassifierOutput>> {
  const discrepancies: AgentDiscrepancy[] = [];
  
  // Check agreement at each hierarchical level
  const departmentMatch = openaiResult.department === xaiResult.department;
  const familyMatch = openaiResult.family === xaiResult.family;
  const categoryMatch = openaiResult.category === xaiResult.category;
  
  // Calculate confidence disparity (asymmetric confidence handling)
  const confidenceDisparity = Math.abs(openaiResult.confidence - xaiResult.confidence);
  const highDisparityThreshold = 25; // More than 25 points difference
  const isHighDisparity = confidenceDisparity > highDisparityThreshold;
  
  // ═══════════════════════════════════════════════════════════════
  // CASE 1: Perfect Consensus (all levels agree)
  // ═══════════════════════════════════════════════════════════════
  if (departmentMatch && familyMatch && categoryMatch) {
    // Check for asymmetric confidence (high-disparity agreement)
    if (isHighDisparity) {
      logger.warn(
        `Weak consensus: Both AIs agreed on ${openaiResult.category} but with high confidence disparity ` +
        `(OpenAI: ${openaiResult.confidence}%, xAI: ${xaiResult.confidence}%)`
      );
      
      // Apply 10-point penalty for high-disparity agreement
      const penalizedConfidence = Math.max(openaiResult.confidence, xaiResult.confidence) - 10;
      
      return {
        agreed: true,
        agreementScore: 85, // Lower than perfect 100
        value: {
          ...openaiResult,
          confidence: penalizedConfidence,
          locked: false,
        },
        discrepancies: [{
          field: 'confidence',
          openaiValue: openaiResult.confidence,
          xaiValue: xaiResult.confidence,
          severity: 'low',
          resolution: `High disparity detected. Applied 10-point penalty. One AI is uncertain.`,
        }],
        retryAllowed: true, // Allow retry to see if confidence aligns
        source: 'partial-consensus',
      };
    }
    
    // Perfect consensus with aligned confidence
    return {
      agreed: true,
      agreementScore: 100,
      value: {
        ...openaiResult,
        confidence: Math.max(openaiResult.confidence, xaiResult.confidence),
        locked: false, // Soft lock (can be re-evaluated if downstream struggles)
      },
      discrepancies: [],
      retryAllowed: false,
      source: 'consensus',
    };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // CASE 2: Department Disagreement (CRITICAL)
  // ═══════════════════════════════════════════════════════════════
  if (!departmentMatch) {
    discrepancies.push({
      field: 'department',
      openaiValue: openaiResult.department,
      xaiValue: xaiResult.department,
      severity: 'critical',
    });
    
    logger.error(
      `Critical disagreement: Department mismatch - ` +
      `OpenAI: ${openaiResult.department}, xAI: ${xaiResult.department}`
    );
    
    return {
      agreed: false,
      agreementScore: 0,
      discrepancies,
      retryAllowed: true,
      retryContext: {
        attempt: 1,
        message: 
          `You determined this is a ${openaiResult.department} product with ${openaiResult.confidence}% confidence. ` +
          `However, another analysis determined this is ${xaiResult.department} with ${xaiResult.confidence}% confidence. ` +
          `\n\nProduct context:\n` +
          `Ferguson Category: "${openaiResult.reasoning.step1Department}"\n` +
          `Web Retailer Category: "${xaiResult.reasoning.step1Department}"\n\n` +
          `Please reconsider: Which department is correct? Provide your reasoning.`,
        previousResults: {
          openai: openaiResult,
          xai: xaiResult,
        },
      },
    };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // CASE 3: Family Disagreement (MEDIUM)
  // ═══════════════════════════════════════════════════════════════
  if (!familyMatch) {
    discrepancies.push({
      field: 'family',
      openaiValue: openaiResult.family,
      xaiValue: xaiResult.family,
      severity: 'medium',
    });
    
    logger.warn(
      `Medium disagreement: Family mismatch (same department) - ` +
      `OpenAI: ${openaiResult.family}, xAI: ${xaiResult.family}`
    );
    
    return {
      agreed: false,
      agreementScore: 30,
      discrepancies,
      retryAllowed: true,
      retryContext: {
        attempt: 1,
        message:
          `Both analyses agree this is a ${openaiResult.department} product. ` +
          `However, you determined family is "${openaiResult.family}" while another analysis determined "${xaiResult.family}". ` +
          `\n\nReconsider: Which family within ${openaiResult.department} is correct?`,
        previousResults: {
          openai: openaiResult,
          xai: xaiResult,
        },
      },
    };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // CASE 4: Category Disagreement (LOW - same family)
  // ═══════════════════════════════════════════════════════════════
  if (!categoryMatch) {
    discrepancies.push({
      field: 'category',
      openaiValue: openaiResult.category,
      xaiValue: xaiResult.category,
      severity: 'low',
    });
    
    logger.info(
      `Low disagreement: Category mismatch (same family) - ` +
      `OpenAI: ${openaiResult.category} (${openaiResult.confidence}%), ` +
      `xAI: ${xaiResult.category} (${xaiResult.confidence}%)`
    );
    
    // Pick higher confidence result
    const higherConfidenceResult = openaiResult.confidence >= xaiResult.confidence
      ? openaiResult
      : xaiResult;
    
    const resolution = `Chose ${higherConfidenceResult.provider} result (higher confidence: ${higherConfidenceResult.confidence}%)`;
    
    discrepancies[0].resolution = resolution;
    discrepancies[0].resolutionSource = higherConfidenceResult.provider;
    
    // Weak consensus with confidence penalty
    const penalizedConfidence = higherConfidenceResult.confidence * 0.9; // 10% penalty
    
    return {
      agreed: true, // Weak consensus
      agreementScore: 60,
      value: {
        ...higherConfidenceResult,
        confidence: Math.round(penalizedConfidence),
        locked: false,
      },
      discrepancies,
      retryAllowed: true, // Allow retry to see if they align
      source: 'partial-consensus',
    };
  }
  
  // Fallback (should never reach here)
  return {
    agreed: false,
    agreementScore: 0,
    discrepancies: [{
      field: 'unknown',
      openaiValue: JSON.stringify(openaiResult),
      xaiValue: JSON.stringify(xaiResult),
      severity: 'critical',
    }],
    retryAllowed: false,
    source: 'escalated',
  };
}
