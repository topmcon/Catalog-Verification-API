/**
 * DUAL AI VERIFICATION SERVICE
 * =============================
 * Workflow:
 * 1. Raw Salesforce data comes in
 * 2. Send to BOTH AIs (OpenAI AND xAI) independently
 * 3. Each AI determines category and maps attributes
 * 4. Compare results for consensus
 * 5. If disagree, re-analyze with context
 * 6. Research missing data if needed
 * 7. Clean and enhance customer-facing text
 * 8. Return verified response to Salesforce
 */

import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import {
  SalesforceIncomingProduct,
  SalesforceVerificationResponse,
  PrimaryDisplayAttributes,
  TopFilterAttributes,
  TopFilterAttributeIds,
  VerificationMetadata,
  CorrectionRecord,
  PriceAnalysis,
  AIReviewStatus,
  AIProviderReview,
  FieldAIReviews,
  FieldAIReview,
  AttributeRequest,
  BrandRequest,
  CategoryRequest,
  StyleRequest,
  ResearchTransparency
} from '../types/salesforce.types';
import {
  getCategorySchema,
  getCategoryListForPrompt,
  getPrimaryAttributesForPrompt,
  getAllCategoriesWithTop15ForPrompt
} from '../config/master-category-attributes';
import { matchStyleToCategory, getValidStylesForCategory } from '../config/category-style-mapping';
import { generateAttributeTable } from '../utils/html-generator';
import { cleanCustomerFacingText, cleanEncodingIssues, extractColorFinish } from '../utils/text-cleaner';
import { safeParseAIResponse, validateAIResponse } from '../utils/json-parser';
import { normalizeCategoryName, areCategoriesEquivalent } from '../config/category-aliases';
// import ErrorRecoveryService from './error-recovery.service'; // TODO: Integrate circuit breaker
import logger from '../utils/logger';
import config from '../config';
import trackingService from './tracking.service';
import aiUsageTracker from './ai-usage-tracking.service';
import picklistMatcher from './picklist-matcher.service';
import { verificationAnalyticsService } from './verification-analytics.service';
import alertingService from './alerting.service';
import { errorMonitor } from './error-monitor.service';
import { FieldAnalytics } from '../models/field-analytics.model';
import { CategoryConfusion } from '../models/category-confusion.model';
import { catalogIndexService } from './catalog-index.service';
import { performProductResearch, formatResearchForPrompt, ResearchResult } from './research.service';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai?.apiKey || process.env.OPENAI_API_KEY
});

// xAI client (uses OpenAI-compatible API)
const xai = new OpenAI({
  apiKey: config.xai?.apiKey || process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1'
});

interface AIAnalysisResult {
  provider: 'openai' | 'xai';
  success: boolean;
  determinedCategory: string;
  categoryConfidence: number;
  categoryReasoning: string;
  primaryAttributes: Record<string, any>;
  top15Attributes: Record<string, any>;
  additionalAttributes: Record<string, any>;
  missingFields: string[];
  corrections: CorrectionRecord[];
  confidence: number;
  researchPerformed: boolean;
  researchSources?: string[];
  documentEvaluations?: Array<{
    url: string;
    recommendation: 'use' | 'skip' | 'review';
    relevanceScore: number;
    reason: string;
    extractedInfo?: string[];
  }>;
  primaryImageIndex?: number;
  primaryImageReason?: string;
  error?: string;
  rawResponse?: string;
}

interface ConsensusResult {
  agreed: boolean;
  agreedCategory: string | null;
  agreedPrimaryAttributes: Record<string, any>;
  agreedTop15Attributes: Record<string, any>;
  agreedAdditionalAttributes: Record<string, any>;
  disagreements: {
    field: string;
    openaiValue: any;
    xaiValue: any;
    resolution: 'openai' | 'xai' | 'unresolved';
  }[];
  needsResearch: string[];
  overallConfidence: number;
}

/**
 * Sanitize attribute values for Salesforce JSON compatibility
 * Removes N/A values that cause SF Apex JSON deserializer to fail
 */
function sanitizeForSalesforce(value: any): string {
  if (value === null || value === undefined) return '';
  
  const strValue = String(value).trim();
  
  // Replace N/A variants with empty string - these break SF JSON parser
  const naPatterns = [
    /^N\/A$/i,
    /^N\/A\s*\(/i,  // "N/A (some reason)"
    /^NA$/i,
    /^Not Applicable$/i,
    /^Not Available$/i,
    /^None$/i,
    /^Unknown$/i,
    /^-$/,
    /^--$/
  ];
  
  for (const pattern of naPatterns) {
    if (pattern.test(strValue)) {
      return '';
    }
  }
  
  // If the value starts with N/A, return empty
  if (/^N\/A/i.test(strValue)) {
    return '';
  }
  
  return strValue;
}

/**
 * Check if a value is an N/A variant that should be filtered out
 * Used for pre-filtering values before they enter data structures
 */
function isNAValue(value: any): boolean {
  if (value === null || value === undefined) return true;
  
  const strValue = String(value).trim();
  if (strValue === '') return true;
  
  const naPatterns = [
    /^N\/A$/i,
    /^N\/A\s*\(/i,
    /^NA$/i,
    /^Not Applicable$/i,
    /^Not Available$/i,
    /^None$/i,
    /^Unknown$/i,
    /^-$/,
    /^--$/
  ];
  
  return naPatterns.some(pattern => pattern.test(strValue)) || /^N\/A/i.test(strValue);
}

/**
 * Fields that should be numeric in Salesforce (Decimal type in Apex)
 * These must be null or a valid number - empty strings will break SF deserializer
 */
const NUMERIC_FIELDS = new Set([
  'Market_Value',
  'Market_Value_Min', 
  'Market_Value_Max'
]);

/**
 * Sanitize a value that should be numeric in Salesforce
 * Returns number if valid, null otherwise (NOT empty string which breaks SF Decimal deserialize)
 */
function sanitizeNumericForSalesforce(value: any): number | null {
  if (value === null || value === undefined) return null;
  
  const strValue = String(value).trim();
  
  // Check for N/A variants - return null for numeric fields
  if (isNAValue(strValue)) {
    return null;
  }
  
  // Remove currency symbols and commas, then parse
  const cleaned = strValue.replace(/[$,€£¥]/g, '').trim();
  const num = parseFloat(cleaned);
  
  // Return null if not a valid number
  if (isNaN(num)) return null;
  
  return num;
}

/**
 * Sanitize an entire object's values for Salesforce
 */
function sanitizeObjectForSalesforce<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObjectForSalesforce(value);
    } else if (NUMERIC_FIELDS.has(key)) {
      // Handle numeric fields specially - SF Apex expects Decimal, not String
      sanitized[key as keyof T] = sanitizeNumericForSalesforce(value) as T[keyof T];
    } else if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeForSalesforce(value) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  return sanitized;
}

export async function verifyProductWithDualAI(
  rawProduct: SalesforceIncomingProduct,
  sessionId?: string,
  requestContext?: { endpoint: string; method: string; ipAddress: string; userAgent: string; apiKey?: string }
): Promise<SalesforceVerificationResponse> {
  const verificationSessionId = sessionId || uuidv4();
  const startTime = Date.now();
  
  // Start tracking
  const trackingId = await trackingService.startTracking(
    verificationSessionId,
    requestContext?.endpoint || '/api/verify/salesforce',
    requestContext?.method || 'POST',
    requestContext?.ipAddress || 'unknown',
    requestContext?.userAgent || 'unknown',
    requestContext?.apiKey,
    rawProduct,
    rawProduct as unknown as Record<string, unknown>
  );
  
  logger.info('Starting dual AI verification', {
    sessionId: verificationSessionId,
    trackingId,
    productId: rawProduct.SF_Catalog_Id,
    modelNumber: rawProduct.Model_Number_Web_Retailer
  });

  try {
    // PHASE 0: External Research - Fetch URLs, PDFs, and analyze images BEFORE AI analysis
    const researchStartTime = Date.now();
    let researchResult: ResearchResult | null = null;
    let researchContext = '';
    
    // Only run research if enabled in config
    const researchEnabled = config.research?.enabled !== false;
    
    if (researchEnabled) {
      try {
        // Extract URLs from raw product
        const documentUrls = (rawProduct.Documents || [])
          .map(d => typeof d === 'string' ? d : d?.url)
          .filter(Boolean) as string[];
        
        const imageUrls = (rawProduct.Stock_Images || [])
          .map(i => typeof i === 'string' ? i : i?.url)
          .filter(Boolean) as string[];
        
        logger.info('Starting external research phase', {
          sessionId: verificationSessionId,
          fergusonUrl: rawProduct.Ferguson_URL || null,
          referenceUrl: rawProduct.Reference_URL || null,
          documentCount: documentUrls.length,
          imageCount: imageUrls.length
        });
        
        researchResult = await performProductResearch(
          rawProduct.Ferguson_URL || null,
          rawProduct.Reference_URL || null,
          documentUrls,
          imageUrls,
          { 
            maxDocuments: config.research?.maxDocuments || 3, 
            maxImages: config.research?.maxImages || 2, 
            skipImages: config.research?.enableImageAnalysis === false 
          }
        );
        
        researchContext = formatResearchForPrompt(researchResult);
        
        logger.info('External research completed', {
          sessionId: verificationSessionId,
          processingTime: Date.now() - researchStartTime,
          webPagesSuccess: researchResult.webPages.filter(p => p.success).length,
          documentsSuccess: researchResult.documents.filter(d => d.success).length,
          imagesSuccess: researchResult.images.filter(i => i.success).length,
          totalSpecs: Object.keys(researchResult.combinedSpecifications).length,
          totalFeatures: researchResult.combinedFeatures.length
        });
      } catch (researchError) {
        logger.warn('External research phase failed, continuing without', {
          sessionId: verificationSessionId,
          error: researchError instanceof Error ? researchError.message : 'Unknown error'
        });
      }
    } else {
      logger.info('External research phase skipped (disabled in config)', {
        sessionId: verificationSessionId
      });
    }

    // PHASE 1: AI Analysis with research context
    const openaiStartTime = Date.now();
    const xaiStartTime = Date.now();
    
    const [openaiResult, xaiResult] = await Promise.all([
      analyzeWithOpenAI(rawProduct, verificationSessionId, researchContext, trackingId),
      analyzeWithXAI(rawProduct, verificationSessionId, researchContext, trackingId)
    ]);

    // Track OpenAI result
    trackingService.recordOpenAIResult(trackingId, {
      success: openaiResult.success,
      determinedCategory: openaiResult.determinedCategory,
      categoryConfidence: openaiResult.categoryConfidence,
      processingTimeMs: Date.now() - openaiStartTime,
      fieldsPopulated: Object.keys(openaiResult.primaryAttributes).length + Object.keys(openaiResult.top15Attributes).length,
      fieldsMissing: openaiResult.missingFields.length,
      correctionsApplied: openaiResult.corrections.length,
      researchPerformed: openaiResult.researchPerformed,
      overallConfidence: openaiResult.confidence,
      errorMessage: openaiResult.error,
    });

    // Track xAI result
    trackingService.recordXAIResult(trackingId, {
      success: xaiResult.success,
      determinedCategory: xaiResult.determinedCategory,
      categoryConfidence: xaiResult.categoryConfidence,
      processingTimeMs: Date.now() - xaiStartTime,
      fieldsPopulated: Object.keys(xaiResult.primaryAttributes).length + Object.keys(xaiResult.top15Attributes).length,
      fieldsMissing: xaiResult.missingFields.length,
      correctionsApplied: xaiResult.corrections.length,
      researchPerformed: xaiResult.researchPerformed,
      overallConfidence: xaiResult.confidence,
      errorMessage: xaiResult.error,
    });

    logger.info('Initial AI analysis complete', {
      sessionId: verificationSessionId,
      openaiCategory: openaiResult.determinedCategory,
      xaiCategory: xaiResult.determinedCategory
    });

    let consensus = buildConsensus(openaiResult, xaiResult);
    let crossValidationPerformed = false;
    let researchPhaseTriggered = false;
    let retryCount = 0;
    
    if (!consensus.agreed && openaiResult.determinedCategory !== xaiResult.determinedCategory) {
      logger.info('Category disagreement - initiating cross-validation', { sessionId: verificationSessionId });
      crossValidationPerformed = true;
      retryCount++;
      
      const [openaiRevised, xaiRevised] = await Promise.all([
        reanalyzeWithContext(rawProduct, 'openai', xaiResult, verificationSessionId),
        reanalyzeWithContext(rawProduct, 'xai', openaiResult, verificationSessionId)
      ]);
      
      consensus = buildConsensus(openaiRevised, xaiRevised);
    }

    if (consensus.needsResearch.length > 0 && consensus.agreedCategory) {
      logger.info('Missing data - initiating research phase', { sessionId: verificationSessionId });
      researchPhaseTriggered = true;
      
      const [openaiResearch, xaiResearch] = await Promise.all([
        researchMissingData(rawProduct, consensus.needsResearch, 'openai', consensus.agreedCategory, verificationSessionId),
        researchMissingData(rawProduct, consensus.needsResearch, 'xai', consensus.agreedCategory, verificationSessionId)
      ]);
      
      consensus = mergeResearchResults(consensus, openaiResearch, xaiResearch);
    }

    // Track consensus result
    trackingService.recordConsensusResult(trackingId, {
      agreed: consensus.agreed,
      consensusScore: consensus.overallConfidence,
      categoryAgreed: openaiResult.determinedCategory === xaiResult.determinedCategory || consensus.agreedCategory !== null,
      finalCategory: consensus.agreedCategory || 'unknown',
      fieldsAgreed: Object.keys(consensus.agreedPrimaryAttributes).length + Object.keys(consensus.agreedTop15Attributes).length,
      fieldsDisagreed: consensus.disagreements.length,
      fieldsResolved: consensus.disagreements.filter(d => d.resolution !== 'unresolved').length,
      fieldsUnresolved: consensus.disagreements.filter(d => d.resolution === 'unresolved').length,
      retryCount,
      crossValidationPerformed,
      researchPhaseTriggered,
      disagreementFields: consensus.disagreements.map(d => d.field),
      unresolvedFields: consensus.disagreements.filter(d => d.resolution === 'unresolved').map(d => d.field),
    });

    // Log AI research and document/image usage
    const openaiResearch = openaiResult.researchPerformed ? 'YES' : 'NO';
    const xaiResearch = xaiResult.researchPerformed ? 'YES' : 'NO';
    const openaiDocs = openaiResult.documentEvaluations?.length || 0;
    const xaiDocs = xaiResult.documentEvaluations?.length || 0;
    const openaiImages = openaiResult.primaryImageIndex !== undefined ? 'Selected' : 'Not analyzed';
    const xaiImages = xaiResult.primaryImageIndex !== undefined ? 'Selected' : 'Not analyzed';
    
    logger.info('AI Document & Image Analysis Summary', {
      openai: {
        researchPerformed: openaiResearch,
        researchSources: openaiResult.researchSources?.length || 0,
        documentsEvaluated: openaiDocs,
        recommendedDocuments: openaiResult.documentEvaluations?.filter(d => d.recommendation === 'use').length || 0,
        primaryImageAnalysis: openaiImages,
        primaryImageIndex: openaiResult.primaryImageIndex,
      },
      xai: {
        researchPerformed: xaiResearch,
        researchSources: xaiResult.researchSources?.length || 0,
        documentsEvaluated: xaiDocs,
        recommendedDocuments: xaiResult.documentEvaluations?.filter(d => d.recommendation === 'use').length || 0,
        primaryImageAnalysis: xaiImages,
        primaryImageIndex: xaiResult.primaryImageIndex,
      },
      documentsProvided: rawProduct.Documents?.length || 0,
      imagesProvided: rawProduct.Stock_Images?.length || 0,
    });

    const processingTime = Date.now() - startTime;
    const response = buildFinalResponse(rawProduct, consensus, verificationSessionId, processingTime, openaiResult, xaiResult, researchResult);
    
    // Track field population rates (async, don't await)
    trackFieldPopulation(response, consensus.agreedCategory || 'unknown', openaiResult, xaiResult).catch(err => {
      logger.error('Failed to track field population', { error: err.message });
    });
    
    // Run alerting checks
    alertingService.recordResult(response.Status === 'success');
    alertingService.checkResponseTime(verificationSessionId, rawProduct.SF_Catalog_Id || 'unknown', processingTime);
    alertingService.checkConfidence(
      verificationSessionId,
      rawProduct.SF_Catalog_Id || 'unknown',
      openaiResult.confidence,
      xaiResult.confidence,
      consensus.overallConfidence
    );
    alertingService.checkConsensus(
      verificationSessionId,
      rawProduct.SF_Catalog_Id || 'unknown',
      consensus.overallConfidence,
      Object.keys(consensus.agreedPrimaryAttributes).length + Object.keys(consensus.agreedTop15Attributes).length,
      consensus.disagreements.length,
      openaiResult.determinedCategory === xaiResult.determinedCategory || !!consensus.agreedCategory
    );
    
    // Store analytics for ML training and trend analysis
    verificationAnalyticsService.storeVerificationResult(
      verificationSessionId,
      rawProduct,
      response,
      processingTime,
      { openai: Date.now() - openaiStartTime, xai: Date.now() - xaiStartTime }
    ).catch(err => {
      logger.error('Failed to store analytics', { error: err.message });
    });
    
    // Complete tracking with successful response
    await trackingService.completeTracking(trackingId, response, 200);
    
    return response;

  } catch (error) {
    logger.error('Dual AI verification failed', { sessionId: verificationSessionId, error });
    const errorResponse = buildErrorResponse(rawProduct, verificationSessionId, error);
    
    // Record failure for alerting
    alertingService.recordResult(false);
    
    // Complete tracking with error
    await trackingService.completeTrackingWithError(trackingId, error instanceof Error ? error : new Error(String(error)), 500);
    
    return errorResponse;
  }
}

async function analyzeWithOpenAI(rawProduct: SalesforceIncomingProduct, sessionId: string, researchContext?: string, trackingId?: string): Promise<AIAnalysisResult> {
  const maxRetries = 3;
  let lastError: any;
  const model = config.openai?.model || 'gpt-4o';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Start AI usage tracking
    const prompt = buildAnalysisPrompt(rawProduct, researchContext);
    const usageId = aiUsageTracker.startAICall({
      sessionId,
      trackingId,
      productId: rawProduct.SF_Catalog_Id,
      provider: 'openai',
      model,
      taskType: 'verification',
      prompt,
      retryAttempt: attempt - 1,
      tags: researchContext ? ['with-research'] : [],
    });

    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: getSystemPrompt() },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      // Use robust JSON parsing
      const parsed = safeParseAIResponse(content, 'openai');
      if (!parsed) {
        throw new Error('Failed to parse OpenAI response');
      }

      if (!validateAIResponse(parsed, 'openai')) {
        throw new Error('Invalid OpenAI response structure');
      }

      const result = parseAIResponse(parsed, 'openai');

      // Complete AI usage tracking with success
      await aiUsageTracker.completeAICall(usageId, {
        response: content,
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        outcome: 'success',
        jsonValid: true,
        confidenceScore: result.confidence,
        categoryDetermined: result.determinedCategory,
        categoryConfidence: result.categoryConfidence,
        fieldsCaptured: Object.keys(result.primaryAttributes).length + Object.keys(result.top15Attributes).length,
        fieldsExpected: 20, // Approximate expected field count
      });

      errorMonitor.recordSuccess();
      return result;
    } catch (error) {
      lastError = error;
      
      // Record failed attempt
      await aiUsageTracker.completeAICall(usageId, {
        response: '',
        promptTokens: 0,
        completionTokens: 0,
        outcome: attempt < maxRetries ? 'failed' : 'api-error',
        jsonValid: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      logger.error(`OpenAI analysis attempt ${attempt}/${maxRetries} failed`, { sessionId, error });
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  // All retries failed
  await errorMonitor.recordError('openai_analysis', 'high', 'OpenAI analysis failed after retries', { sessionId, error: lastError });
  return createErrorResult('openai', lastError);
}

async function analyzeWithXAI(rawProduct: SalesforceIncomingProduct, sessionId: string, researchContext?: string, trackingId?: string): Promise<AIAnalysisResult> {
  const maxRetries = 3;
  let lastError: any;
  const model = config.xai?.model || 'grok-3';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Start AI usage tracking
    const prompt = buildAnalysisPrompt(rawProduct, researchContext);
    const usageId = aiUsageTracker.startAICall({
      sessionId,
      trackingId,
      productId: rawProduct.SF_Catalog_Id,
      provider: 'xai',
      model,
      taskType: 'verification',
      prompt,
      retryAttempt: attempt - 1,
      tags: researchContext ? ['with-research'] : [],
    });

    try {
      const response = await xai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: getSystemPrompt() },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from xAI');

      // Use robust JSON parsing
      const parsed = safeParseAIResponse(content, 'xai');
      if (!parsed) {
        throw new Error('Failed to parse xAI response');
      }

      if (!validateAIResponse(parsed, 'xai')) {
        throw new Error('Invalid xAI response structure');
      }

      const result = parseAIResponse(parsed, 'xai');

      // Complete AI usage tracking with success
      await aiUsageTracker.completeAICall(usageId, {
        response: content,
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        outcome: 'success',
        jsonValid: true,
        confidenceScore: result.confidence,
        categoryDetermined: result.determinedCategory,
        categoryConfidence: result.categoryConfidence,
        fieldsCaptured: Object.keys(result.primaryAttributes).length + Object.keys(result.top15Attributes).length,
        fieldsExpected: 20,
      });

      errorMonitor.recordSuccess();
      return result;
    } catch (error) {
      lastError = error;

      // Record failed attempt
      await aiUsageTracker.completeAICall(usageId, {
        response: '',
        promptTokens: 0,
        completionTokens: 0,
        outcome: attempt < maxRetries ? 'failed' : 'api-error',
        jsonValid: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      logger.error(`xAI analysis attempt ${attempt}/${maxRetries} failed`, { sessionId, error });
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  // All retries failed
  await errorMonitor.recordError('xai_analysis', 'high', 'xAI analysis failed after retries', { sessionId, error: lastError });
  return createErrorResult('xai', lastError);
}

function createErrorResult(provider: 'openai' | 'xai', error: unknown): AIAnalysisResult {
  return {
    provider,
    success: false,
    determinedCategory: '',
    categoryConfidence: 0,
    categoryReasoning: '',
    primaryAttributes: {},
    top15Attributes: {},
    additionalAttributes: {},
    missingFields: [],
    corrections: [],
    confidence: 0,
    researchPerformed: false,
    error: error instanceof Error ? error.message : 'Unknown error'
  };
}

function getSystemPrompt(): string {
  const primaryAttrs = getPrimaryAttributesForPrompt();
  const categoryTop15 = getAllCategoriesWithTop15ForPrompt();
  const categoryList = getCategoryListForPrompt();
  
  return `You are an expert product data analyst specializing in appliances and home products.

Your task is to:
1. ANALYZE the raw product data provided
2. DETERMINE which category from our master list the product belongs to
3. MAP the raw data to the correct attributes for that category
4. VERIFY and CLEAN the data (fix obvious errors, standardize formats)
5. IDENTIFY any missing required fields
6. GENERATE high-quality, customer-facing text for title, description, and features

## ⚠️ CRITICAL: DIMENSION HANDLING

Products have different shapes and dimension terminologies. Follow these rules:

**Standard Rectangular Products** (Bathtubs, Sinks, Appliances):
- depth_length: The front-to-back measurement OR the longest horizontal measurement
- width: The side-to-side measurement
- height: The vertical measurement

**Circular/Cylindrical Products** (Jars, Cans, Round Sinks, Pipes):
- If product has a DIAMETER, use that value for BOTH depth_length AND width
- Example: 8" diameter jar → depth_length: "8", width: "8"
- height: The vertical measurement of the cylinder

**Long Products** (Pipes, Hoses, Cables):
- depth_length: The length of the product
- width: The diameter or cross-section width
- height: Leave empty or use diameter if applicable

**Dimension Rules**:
- Always provide values in INCHES (convert if needed)
- Use numeric values only (no units in the value): "32" not "32 inches"
- depth_length is a COMBINED field - use whichever applies: depth OR length
- For square products: depth_length and width can be the same value
- Round up to nearest 0.25" for fractional measurements

## ⚠️ CRITICAL: TEXT QUALITY ENHANCEMENT (Customer-Facing Data)

ALL text output must be CUSTOMER-READY. You MUST fix these issues:

**Run-on Sentences**: Add proper spacing after periods. 
- WRONG: "word.Another" 
- CORRECT: "word. Another"

**Encoding Issues**: Fix corrupted characters:
- "Caf(eback)" or "CAF(EBACK)" → "Café"
- "(TM)" or "(tm)" → "™"
- "(R)" or "(r)" → "®"
- "&amp;" → "&"
- "â€™" → "'"
- Remove random parentheses from brand names

**Proper Capitalization**:
- Brand names: "Café" not "CAFE" or "cafe"
- Product titles: Title Case for key words
- Preserve technical terms: "BTU", "WiFi", "SmartHQ"

**Grammar & Punctuation**:
- Add spaces after periods, commas, colons
- Remove duplicate punctuation
- Fix sentence fragments

**Description Enhancement**:
- Maximum 500 characters
- Complete sentences only
- Professional tone
- Include key selling points

**Feature List Generation**: 
You MUST extract 5-10 key features from the product description and specifications.
Each feature should be:
- A single selling point (under 100 characters)
- Action-oriented when possible
- Example: "21,000 BTU power burner for rapid boiling"
- Example: "WiFi enabled with SmartHQ app control"
- Example: "No Preheat Air Fry technology"

ATTRIBUTE STRUCTURE:

== PRIMARY ATTRIBUTES (Same for ALL products) ==
${primaryAttrs}

== TOP 15 FILTER ATTRIBUTES (Category-specific) ==
${categoryTop15}

== ADDITIONAL ATTRIBUTES ==
Any other specifications not covered above go here. These will be displayed as an HTML spec table.

You must respond with valid JSON in this exact format:
{
  "category": {
    "name": "The exact category name from the list",
    "confidence": 0.95,
    "reasoning": "Why this category was chosen"
  },
  "primary_attributes": {
    "brand": "value",
    "category_subcategory": "Category / Subcategory",
    "product_family": "value",
    "product_style": "value (category specific)",
    "depth_length": "numeric value only (depth OR length - use whichever applies; for round items use diameter)",
    "width": "numeric value only (width; for round items use same as depth_length)",
    "height": "numeric value only",
    "weight": "numeric value in lbs",
    "msrp": "value",
    "market_value": "value",
    "description": "ENHANCED customer-ready description (max 500 chars, complete sentences, professional tone)",
    "product_title": "ENHANCED standardized title (proper capitalization, cleaned encoding)",
    "details": "additional details",
    "features_list": "GENERATED feature list as HTML <ul><li>Feature 1</li><li>Feature 2</li>...</ul>",
    "upc_gtin": "value",
    "model_number": "value",
    "model_number_alias": "symbols removed",
    "model_parent": "parent model if variant",
    "model_variant_number": "variant identifier",
    "total_model_variants": "comma-separated list of all variants"
  },
  "top15_filter_attributes": {
    "attribute_name": "value"
  },
  "additional_attributes": {
    "attribute_name": "value"
  },
  "missing_fields": ["field1", "field2"],
  "corrections": [
    {"field": "field_name", "original": "old_value", "corrected": "new_value", "reason": "why"}
  ],
  "confidence": 0.85
}

AVAILABLE CATEGORIES:
${categoryList}

IMPORTANT:
- Use ONLY the categories listed above
- Map raw data fields to our standard attribute names
- Standardize units (dimensions in inches, capacity in cu. ft.)
- Clean up formatting (proper capitalization, remove extra spaces)
- Flag fields you cannot determine with confidence
- For TOP 15 attributes, use only the attributes defined for the determined category
- ALWAYS generate a features_list even if no features are in the raw data - extract them from description and specs`;
}

function buildAnalysisPrompt(rawProduct: SalesforceIncomingProduct, researchContext?: string): string {
  let prompt = `Analyze this product and map it to our category system:

RAW PRODUCT DATA:
${JSON.stringify(rawProduct, null, 2)}
`;

  // Add research context if available
  if (researchContext && researchContext.trim()) {
    prompt += `

=== EXTERNAL RESEARCH DATA (Retrieved from actual URLs/documents/images) ===
The following data was retrieved by fetching actual web pages, downloading PDFs, and analyzing product images.
This data is AUTHORITATIVE - use it to fill in missing information and verify raw data accuracy.

${researchContext}
=== END EXTERNAL RESEARCH DATA ===
`;
  }

  prompt += `

Tasks:
1. Determine the product category from our master list
2. Map all available data to the correct attribute fields for that category
3. ${researchContext ? '**PRIORITIZE** the external research data for filling missing fields' : 'Note any missing data'}
4. **CRITICAL**: Clean and enhance ALL customer-facing text:
   - Fix brand encoding issues (e.g., "Caf(eback)" → "Café", "(TM)" → "™")
   - Fix run-on sentences (add spaces after periods)
   - Ensure proper capitalization
   - Professional grammar and punctuation
5. **REQUIRED**: Generate a features_list with 5-10 key features extracted from the description/specs
6. List any missing required fields
7. Note any corrections you made and data sources used

The product_title, description, and features_list will be displayed directly to customers.
They MUST be professional, well-formatted, and error-free.

Return your analysis as JSON.`;

  return prompt;
}

function parseAIResponse(parsed: any, provider: 'openai' | 'xai'): AIAnalysisResult {
  return {
    provider,
    success: true,
    determinedCategory: parsed.category?.name || '',
    categoryConfidence: parsed.category?.confidence || 0,
    categoryReasoning: parsed.category?.reasoning || '',
    primaryAttributes: parsed.primary_attributes || {},
    top15Attributes: parsed.top15_filter_attributes || {},
    additionalAttributes: parsed.additional_attributes || {},
    missingFields: parsed.missing_fields || [],
    corrections: (parsed.corrections || []).map((c: any) => ({
      field: c.field,
      originalValue: c.original,
      correctedValue: c.corrected,
      reason: c.reason,
      source: provider
    })),
    confidence: parsed.confidence || 0,
    researchPerformed: (parsed.research_sources && parsed.research_sources.length > 0) || false,
    researchSources: parsed.research_sources || [],
    documentEvaluations: parsed.documentEvaluation || [],
    primaryImageIndex: parsed.primaryImageRecommendation?.recommendedIndex,
    primaryImageReason: parsed.primaryImageRecommendation?.reason,
    rawResponse: JSON.stringify(parsed)
  };
}

function buildConsensus(openaiResult: AIAnalysisResult, xaiResult: AIAnalysisResult): ConsensusResult {
  const disagreements: ConsensusResult['disagreements'] = [];
  const needsResearch: string[] = [];
  
  // Normalize categories before comparison
  const normalizedOpenAI = normalizeCategoryName(openaiResult.determinedCategory);
  const normalizedXAI = normalizeCategoryName(xaiResult.determinedCategory);
  
  const categoriesMatch = areCategoriesEquivalent(openaiResult.determinedCategory, xaiResult.determinedCategory);
  
  // Track category confusion if they disagree
  if (!categoriesMatch && normalizedOpenAI && normalizedXAI) {
    CategoryConfusion.updateOne(
      {
        openai_category: normalizedOpenAI,
        xai_category: normalizedXAI
      },
      {
        $inc: { count: 1 },
        $set: { last_occurred: new Date() }
      },
      { upsert: true }
    ).catch(err => logger.error('Failed to track category confusion', err));
  }
  
  const agreedCategory = categoriesMatch 
    ? openaiResult.determinedCategory
    : (openaiResult.categoryConfidence >= xaiResult.categoryConfidence ? openaiResult.determinedCategory : xaiResult.determinedCategory);

  void getCategorySchema(agreedCategory);
  
  // Build agreed attributes first
  const agreedPrimary = buildAgreedAttributes(openaiResult.primaryAttributes, xaiResult.primaryAttributes, disagreements);
  const agreedTop15 = buildAgreedAttributes(openaiResult.top15Attributes, xaiResult.top15Attributes, disagreements);
  const agreedAdditional = buildAgreedAttributes(openaiResult.additionalAttributes, xaiResult.additionalAttributes, disagreements);
  
  // Reconcile dimensions - handle swapped depth/width and circular products
  const reconciledDims = reconcileDimensions(openaiResult.primaryAttributes, xaiResult.primaryAttributes, agreedCategory);
  
  // Apply reconciled dimensions to agreed primary attributes
  if (reconciledDims.depth_length) {
    agreedPrimary.depth_length = reconciledDims.depth_length;
    // Remove dimension disagreements since we've reconciled them
    const dimFields = ['depth_length', 'depth', 'length', 'width'];
    for (let i = disagreements.length - 1; i >= 0; i--) {
      if (dimFields.includes(disagreements[i].field.toLowerCase())) {
        disagreements.splice(i, 1);
      }
    }
  }
  if (reconciledDims.width) {
    agreedPrimary.width = reconciledDims.width;
  }
  if (reconciledDims.height) {
    agreedPrimary.height = reconciledDims.height;
  }

  const allMissing = new Set([...openaiResult.missingFields, ...xaiResult.missingFields]);
  for (const field of allMissing) {
    if (openaiResult.missingFields.includes(field) && xaiResult.missingFields.includes(field)) {
      needsResearch.push(field);
    }
  }

  // Fields that are generated text - these naturally differ between AIs and shouldn't penalize scoring
  const generatedTextFields = new Set([
    'description', 'product_title', 'details', 'features_list', 
    'category_subcategory', 'material' // Often ambiguous
  ]);
  
  // Filter out generated text field disagreements from scoring (but keep them for tracking)
  const factualDisagreements = disagreements.filter(d => 
    !generatedTextFields.has(d.field.toLowerCase())
  );
  
  // Calculate scores based on total fields analyzed (agreed + factual disagreed)
  const totalAgreedFields = Object.keys(agreedPrimary).length + Object.keys(agreedTop15).length + Object.keys(agreedAdditional).length;
  const unresolvedCount = factualDisagreements.filter(d => d.resolution === 'unresolved').length;
  const totalFieldsAnalyzed = totalAgreedFields + unresolvedCount;
  
  // Agreement ratio: agreed fields / total fields (not penalizing disagreements as heavily)
  const agreementRatio = totalFieldsAnalyzed > 0 
    ? totalAgreedFields / totalFieldsAnalyzed 
    : 0;
  
  // Calculate overall confidence - ensure AI confidence values are valid (0-1 range)
  const openaiConf = Math.max(0, Math.min(1, openaiResult.confidence || 0));
  const xaiConf = Math.max(0, Math.min(1, xaiResult.confidence || 0));
  const avgAiConfidence = (openaiConf + xaiConf) / 2;
  
  // Category match bonus: Apply if FINAL agreed category matches (even after cross-validation)
  // This rewards agreement on the most important classification decision
  const categoryBonus = agreedCategory ? 0.1 : 0;
  
  // Final score: 50% AI confidence + 40% agreement ratio + 10% category bonus (capped at 1.0)
  const overallConfidence = Math.min(1, avgAiConfidence * 0.5 + agreementRatio * 0.4 + categoryBonus);
  
  // Log scoring breakdown for debugging
  logger.info('Consensus scoring breakdown', {
    totalAgreedFields,
    unresolvedCount,
    textFieldsExcluded: disagreements.length - factualDisagreements.length,
    totalFieldsAnalyzed,
    agreementRatio: Math.round(agreementRatio * 100),
    avgAiConfidence: Math.round(avgAiConfidence * 100),
    categoryBonus: categoryBonus * 100,
    finalScore: Math.round(overallConfidence * 100)
  });

  return {
    agreed: categoriesMatch && disagreements.filter(d => d.resolution === 'unresolved').length === 0,
    agreedCategory,
    agreedPrimaryAttributes: agreedPrimary,
    agreedTop15Attributes: agreedTop15,
    agreedAdditionalAttributes: agreedAdditional,
    disagreements,
    needsResearch,
    overallConfidence
  };
}

function buildAgreedAttributes(openaiAttrs: Record<string, any>, xaiAttrs: Record<string, any>, disagreements: ConsensusResult['disagreements']): Record<string, any> {
  const agreed: Record<string, any> = {};
  const allKeys = new Set([...Object.keys(openaiAttrs), ...Object.keys(xaiAttrs)]);
  
  for (const key of allKeys) {
    const openaiVal = openaiAttrs[key];
    const xaiVal = xaiAttrs[key];
    
    if (valuesMatch(openaiVal, xaiVal)) {
      agreed[key] = openaiVal ?? xaiVal;
    } else if (openaiVal && !xaiVal) {
      agreed[key] = openaiVal;
    } else if (!openaiVal && xaiVal) {
      agreed[key] = xaiVal;
    } else {
      // Only mark as unresolved if values are meaningfully different
      disagreements.push({ field: key, openaiValue: openaiVal, xaiValue: xaiVal, resolution: 'unresolved' });
    }
  }
  
  return agreed;
}

function valuesMatch(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  
  // Normalize strings: lowercase, trim, remove common filler words
  const normalize = (s: string): string => {
    return String(s)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')                    // Multiple spaces to single
      .replace(/["']/g, '')                     // Remove quotes
      .replace(/\s*(inches?|in\.?|")\s*/gi, '') // Remove "inches", "in", etc.
      .replace(/\s*(lbs?|pounds?)\s*/gi, '')    // Remove weight units
      .replace(/unavailable|n\/a|not available|unknown/gi, '') // Remove placeholders
      .trim();
  };
  
  const strA = normalize(a);
  const strB = normalize(b);
  
  // Empty after normalization = both are essentially empty/unavailable
  if (!strA && !strB) return true;
  
  // Exact match after normalization
  if (strA === strB) return true;
  
  // One contains the other (e.g., "60" vs "60 inches" both normalize to "60")
  if (strA.includes(strB) || strB.includes(strA)) return true;
  
  // Numeric comparison with tolerance
  const numA = parseFloat(strA.replace(/[^\d.-]/g, ''));
  const numB = parseFloat(strB.replace(/[^\d.-]/g, ''));
  if (!isNaN(numA) && !isNaN(numB)) {
    return Math.abs(numA - numB) < 0.1; // 0.1 tolerance for numeric values
  }
  
  return false;
}

/**
 * Find attribute value in raw Web_Retailer_Specs or Ferguson_Attributes arrays
 * Uses fuzzy matching on attribute names
 */
function findAttributeInRawData(
  rawProduct: SalesforceIncomingProduct, 
  attributeName: string
): string | number | boolean | null {
  // Normalize attribute name for matching (lowercase, remove special chars, collapse spaces)
  const normalizeAttrName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const normalizedTarget = normalizeAttrName(attributeName);
  
  // Helper to find in attribute array with fuzzy matching
  const findInArray = (attrs: Array<{ name: string; value: string }> | undefined): string | number | boolean | null => {
    if (!attrs || !Array.isArray(attrs)) return null;
    
    for (const attr of attrs) {
      const normalizedName = normalizeAttrName(attr.name);
      
      // Exact match
      if (normalizedName === normalizedTarget) {
        return attr.value;
      }
      
      // Fuzzy match: one contains the other
      if (normalizedName.includes(normalizedTarget) || normalizedTarget.includes(normalizedName)) {
        // Ensure it's a meaningful match (not just "a" matching "capacity")
        const shorterLength = Math.min(normalizedName.length, normalizedTarget.length);
        const longerLength = Math.max(normalizedName.length, normalizedTarget.length);
        const matchRatio = shorterLength / longerLength;
        
        if (matchRatio > 0.5) { // At least 50% overlap
          return attr.value;
        }
      }
    }
    
    return null;
  };
  
  // Try Ferguson first (more reliable), then Web Retailer
  let value = findInArray(rawProduct.Ferguson_Attributes);
  if (value === null || value === '') {
    value = findInArray(rawProduct.Web_Retailer_Specs);
  }
  
  return value;
}

/**
 * Normalize dimension values to pure numeric inches
 * Handles various formats: "60 inches", "60"", "60 in", "5 ft", etc.
 */
function normalizeDimension(value: any): string {
  if (!value || value === 'Unavailable' || value === 'N/A' || value === '') {
    return '';
  }
  
  const str = String(value).trim();
  
  // Extract numeric value
  const numMatch = str.match(/[\d.]+/);
  if (!numMatch) return '';
  
  let numValue = parseFloat(numMatch[0]);
  
  // Convert feet to inches if specified
  if (/\bft\b|feet|foot|'/i.test(str)) {
    numValue *= 12;
  }
  // Convert cm to inches
  else if (/\bcm\b|centimeter/i.test(str)) {
    numValue /= 2.54;
  }
  // Convert mm to inches
  else if (/\bmm\b|millimeter/i.test(str)) {
    numValue /= 25.4;
  }
  // Convert meters to inches
  else if (/\bm\b|meter/i.test(str)) {
    numValue *= 39.37;
  }
  
  // Round to 2 decimal places
  return numValue.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

/**
 * Check if dimensions might be swapped between two results
 * (e.g., one AI reports 60x32, the other reports 32x60)
 */
function areDimensionsSwapped(dims1: { depth?: string; width?: string }, dims2: { depth?: string; width?: string }): boolean {
  const d1 = normalizeDimension(dims1.depth);
  const w1 = normalizeDimension(dims1.width);
  const d2 = normalizeDimension(dims2.depth);
  const w2 = normalizeDimension(dims2.width);
  
  // If both have values, check if they're swapped
  if (d1 && w1 && d2 && w2) {
    return (d1 === w2 && w1 === d2);
  }
  return false;
}

/**
 * Reconcile dimensions between two AI results
 * Handles swapped dimensions and circular products
 */
function reconcileDimensions(
  openaiAttrs: Record<string, any>, 
  xaiAttrs: Record<string, any>,
  category: string
): { depth_length: string; width: string; height: string } {
  const openaiDims = {
    depth: openaiAttrs.depth_length || openaiAttrs.depth || openaiAttrs.length,
    width: openaiAttrs.width,
    height: openaiAttrs.height
  };
  
  const xaiDims = {
    depth: xaiAttrs.depth_length || xaiAttrs.depth || xaiAttrs.length,
    width: xaiAttrs.width,
    height: xaiAttrs.height
  };
  
  // Normalize all values
  const normOpenai = {
    depth: normalizeDimension(openaiDims.depth),
    width: normalizeDimension(openaiDims.width),
    height: normalizeDimension(openaiDims.height)
  };
  
  const normXai = {
    depth: normalizeDimension(xaiDims.depth),
    width: normalizeDimension(xaiDims.width),
    height: normalizeDimension(xaiDims.height)
  };
  
  // Check if dimensions are swapped
  const swapped = areDimensionsSwapped(normOpenai, normXai);
  
  // Determine final values - prefer the larger value for depth/length (convention)
  let finalDepth = normOpenai.depth || normXai.depth;
  let finalWidth = normOpenai.width || normXai.width;
  let finalHeight = normOpenai.height || normXai.height;
  
  // If swapped, use the convention: larger dimension = length/depth
  if (swapped && finalDepth && finalWidth) {
    const d = parseFloat(finalDepth);
    const w = parseFloat(finalWidth);
    if (!isNaN(d) && !isNaN(w) && w > d) {
      // Swap so depth is larger
      [finalDepth, finalWidth] = [finalWidth, finalDepth];
    }
  }
  
  // For circular products, if only one dimension is available, use it for both
  const circularCategories = ['jars', 'cans', 'bottles', 'pipes', 'tubes', 'round sinks', 'round mirrors'];
  const isCircular = circularCategories.some(c => category.toLowerCase().includes(c));
  
  if (isCircular || (finalDepth && !finalWidth && finalDepth === normOpenai.depth && finalDepth === normXai.width)) {
    // If diameter-based, use same value for both
    if (finalDepth && !finalWidth) {
      finalWidth = finalDepth;
    } else if (finalWidth && !finalDepth) {
      finalDepth = finalWidth;
    }
  }
  
  return {
    depth_length: finalDepth || '',
    width: finalWidth || '',
    height: finalHeight || ''
  };
}

async function reanalyzeWithContext(rawProduct: SalesforceIncomingProduct, provider: 'openai' | 'xai', otherResult: AIAnalysisResult, sessionId: string): Promise<AIAnalysisResult> {
  const client = provider === 'openai' ? openai : xai;
  const model = provider === 'openai' ? (config.openai?.model || 'gpt-4-turbo-preview') : (config.xai?.model || 'grok-beta');

  const prompt = `You previously analyzed a product. Another AI analyst determined it should be categorized as:
Category: ${otherResult.determinedCategory}
Confidence: ${otherResult.categoryConfidence}
Reasoning: ${otherResult.categoryReasoning}

Please re-analyze the product considering this perspective. If you agree after reviewing, update your categorization. If you still disagree, explain why.

ORIGINAL PRODUCT DATA:
${JSON.stringify(rawProduct, null, 2)}

Return your revised analysis as JSON with the same format as before.`;

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    return parseAIResponse(JSON.parse(jsonMatch[0]), provider);
  } catch (error) {
    logger.error(`${provider} reanalysis failed`, { sessionId, error: error instanceof Error ? error.message : 'Unknown' });
    return provider === 'openai' ? await analyzeWithOpenAI(rawProduct, sessionId) : await analyzeWithXAI(rawProduct, sessionId);
  }
}

async function researchMissingData(rawProduct: SalesforceIncomingProduct, missingFields: string[], provider: 'openai' | 'xai', category: string, sessionId: string): Promise<Record<string, any>> {
  const client = provider === 'openai' ? openai : xai;
  const model = provider === 'openai' ? (config.openai?.model || 'gpt-4-turbo-preview') : (config.xai?.model || 'grok-beta');

  const brand = rawProduct.Brand_Web_Retailer || rawProduct.Ferguson_Brand || 'Unknown';
  const modelNum = rawProduct.Model_Number_Web_Retailer || rawProduct.Ferguson_Model_Number || 'Unknown';

  const prompt = `You need to research and find the following missing product specifications:

PRODUCT INFO:
- Brand: ${brand}
- Model: ${modelNum}
- Category: ${category}

MISSING FIELDS TO RESEARCH:
${missingFields.map(f => `- ${f}`).join('\n')}

Use your knowledge to find accurate values for these specifications. If you find the information, provide it. If you cannot determine a value with confidence, mark it as "unknown".

Return JSON:
{
  "researched_values": {
    "field_name": "value or unknown"
  },
  "sources": ["description of source/reasoning for each value"],
  "confidence": 0.75
}`;

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a product research specialist. Find accurate specifications for appliances.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return {};

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.researched_values || {};
  } catch (error) {
    logger.error(`${provider} research failed`, { sessionId, error: error instanceof Error ? error.message : 'Unknown' });
    return {};
  }
}

function mergeResearchResults(consensus: ConsensusResult, openaiResearch: Record<string, any>, xaiResearch: Record<string, any>): ConsensusResult {
  const mergedAdditional = { ...consensus.agreedAdditionalAttributes };
  
  for (const field of consensus.needsResearch) {
    const openaiVal = openaiResearch[field];
    const xaiVal = xaiResearch[field];
    
    if (valuesMatch(openaiVal, xaiVal) && openaiVal !== 'unknown') {
      mergedAdditional[field] = openaiVal;
    } else if (openaiVal && openaiVal !== 'unknown' && (!xaiVal || xaiVal === 'unknown')) {
      mergedAdditional[field] = openaiVal;
    } else if (xaiVal && xaiVal !== 'unknown' && (!openaiVal || openaiVal === 'unknown')) {
      mergedAdditional[field] = xaiVal;
    }
  }
  
  return { ...consensus, agreedAdditionalAttributes: mergedAdditional, needsResearch: [] };
}

/**
 * Helper to prefer AI consensus value, or select higher confidence AI if they disagree
 * Falls back to raw source data only if no AI provided value
 */
function preferAIValue(
  consensusValue: any,
  openaiValue: any,
  xaiValue: any,
  openaiConfidence: number,
  xaiConfidence: number,
  fallback: any
): any {
  if (consensusValue !== undefined && consensusValue !== null && consensusValue !== '') {
    return consensusValue;
  }
  
  if (openaiValue && xaiValue) {
    return openaiConfidence >= xaiConfidence ? openaiValue : xaiValue;
  } else if (openaiValue) {
    return openaiValue;
  } else if (xaiValue) {
    return xaiValue;
  }
  
  return fallback;
}

/**
 * Build Research Transparency section showing exactly what was analyzed from each resource
 */
function buildResearchTransparency(researchResult: ResearchResult | null | undefined): ResearchTransparency | undefined {
  if (!researchResult) {
    return undefined;
  }

  const webPages = researchResult.webPages.map(page => ({
    url: page.url,
    success: page.success,
    specs_extracted: page.success ? Object.keys(page.specifications || {}).length : 0,
    features_extracted: page.success ? (page.features || []).length : 0,
    processing_time_ms: 0, // Not tracked in current implementation
    error: page.error
  }));

  const pdfs = researchResult.documents.map(doc => ({
    url: doc.url || doc.filename,
    filename: doc.filename,
    success: doc.success,
    pages: doc.success ? (doc.pageCount || 0) : 0,
    specs_extracted: doc.success ? Object.keys(doc.specifications || {}).length : 0,
    text_length: doc.success ? (doc.text?.length || 0) : 0,
    processing_time_ms: 0, // Not tracked in current implementation
    error: doc.error
  }));

  const images = researchResult.images.map(img => ({
    url: img.url,
    success: img.success,
    model_used: 'grok-2-vision-1212', // Current model used
    color_detected: img.detectedColor || undefined,
    finish_detected: img.detectedFinish || undefined,
    product_type: img.productType || undefined,
    features_detected: (img.detectedFeatures || []).length,
    confidence: img.confidence || 0,
    processing_time_ms: 0, // Not tracked in current implementation
    error: img.error
  }));

  const totalSpecs = Object.keys(researchResult.combinedSpecifications || {}).length;
  const totalFeatures = (researchResult.combinedFeatures || []).length;
  const totalResources = webPages.length + pdfs.length + images.length;
  const successfulResources = 
    webPages.filter(w => w.success).length +
    pdfs.filter(p => p.success).length +
    images.filter(i => i.success).length;

  return {
    research_performed: totalResources > 0,
    total_resources_analyzed: totalResources,
    web_pages: webPages,
    pdfs: pdfs,
    images: images,
    summary: {
      total_specs_extracted: totalSpecs,
      total_features_extracted: totalFeatures,
      success_rate: totalResources > 0 ? Math.round((successfulResources / totalResources) * 100) : 0
    }
  };
}

function buildFinalResponse(
  rawProduct: SalesforceIncomingProduct,
  consensus: ConsensusResult,
  sessionId: string,
  _processingTimeMs: number,
  openaiResult: AIAnalysisResult,
  xaiResult: AIAnalysisResult,
  researchResult?: ResearchResult | null
): SalesforceVerificationResponse {
  
  // Get raw values for customer-facing text
  const rawBrand = consensus.agreedPrimaryAttributes.brand || rawProduct.Brand_Web_Retailer || rawProduct.Ferguson_Brand || '';
  
  // For title: Prefer AI-improved version over raw source data
  let rawTitle = consensus.agreedPrimaryAttributes.product_title;
  if (!rawTitle) {
    const openaiTitle = openaiResult.primaryAttributes.product_title;
    const xaiTitle = xaiResult.primaryAttributes.product_title;
    
    if (openaiTitle && xaiTitle) {
      rawTitle = openaiResult.confidence >= xaiResult.confidence ? openaiTitle : xaiTitle;
      logger.info('Using AI-improved title', { 
        selectedProvider: openaiResult.confidence >= xaiResult.confidence ? 'OpenAI' : 'xAI'
      });
    } else if (openaiTitle) {
      rawTitle = openaiTitle;
    } else if (xaiTitle) {
      rawTitle = xaiTitle;
    } else {
      rawTitle = rawProduct.Product_Title_Web_Retailer || '';
    }
  }
  
  // For description: Prefer AI-improved version over raw source data
  // If both AIs provided descriptions (even if they differ), use the higher confidence one
  let rawDescription = consensus.agreedPrimaryAttributes.description;
  if (!rawDescription) {
    // Check if AIs provided improved descriptions
    const openaiDesc = openaiResult.primaryAttributes.description;
    const xaiDesc = xaiResult.primaryAttributes.description;
    
    if (openaiDesc && xaiDesc) {
      // Both provided descriptions - use higher confidence version
      rawDescription = openaiResult.confidence >= xaiResult.confidence ? openaiDesc : xaiDesc;
      logger.info('Using AI-improved description', { 
        selectedProvider: openaiResult.confidence >= xaiResult.confidence ? 'OpenAI' : 'xAI',
        openaiConfidence: openaiResult.confidence,
        xaiConfidence: xaiResult.confidence
      });
    } else if (openaiDesc) {
      rawDescription = openaiDesc;
      logger.info('Using OpenAI-improved description');
    } else if (xaiDesc) {
      rawDescription = xaiDesc;
      logger.info('Using xAI-improved description');
    } else {
      // Fall back to raw source data only if no AI provided improved version
      rawDescription = rawProduct.Product_Description_Web_Retailer || rawProduct.Ferguson_Description || '';
      logger.info('Using raw source description (no AI improvements)');
    }
  }
  
  // Handle features from AI - could be string (HTML), array, or missing
  // Prefer AI-improved version over raw source data
  let rawFeatures = consensus.agreedPrimaryAttributes.features_list;
  if (!rawFeatures) {
    const openaiFeat = openaiResult.primaryAttributes.features_list;
    const xaiFeat = xaiResult.primaryAttributes.features_list;
    
    if (openaiFeat && xaiFeat) {
      rawFeatures = openaiResult.confidence >= xaiResult.confidence ? openaiFeat : xaiFeat;
    } else if (openaiFeat) {
      rawFeatures = openaiFeat;
    } else if (xaiFeat) {
      rawFeatures = xaiFeat;
    } else {
      rawFeatures = rawProduct.Features_Web_Retailer || '';
    }
  }
  
  if (Array.isArray(rawFeatures)) {
    // AI returned an array - convert to HTML
    rawFeatures = '<ul>' + rawFeatures.map((f: string) => `<li>${f}</li>`).join('') + '</ul>';
  }
  
  logger.info('Text cleaner input', { rawBrand, rawTitle: rawTitle?.substring(0, 50), rawFeaturesLength: rawFeatures?.length });
  
  // Clean and enhance customer-facing text
  const cleanedText = cleanCustomerFacingText(
    rawTitle,
    rawDescription,
    rawFeatures,
    rawBrand,
    consensus.agreedCategory || undefined
  );
  
  logger.info('Text cleaner output', { cleanedBrand: cleanedText.brand, cleanedTitle: cleanedText.title?.substring(0, 50) });
  
  // Track any text cleaning corrections
  const textCorrections: CorrectionRecord[] = [];
  if (cleanedText.brand !== rawBrand && rawBrand) {
    textCorrections.push({
      field: 'brand',
      originalValue: rawBrand,
      correctedValue: cleanedText.brand,
      reason: 'Fixed encoding issues and standardized brand name',
      source: 'text_cleaner'
    });
  }
  if (cleanedText.title !== rawTitle && rawTitle) {
    textCorrections.push({
      field: 'product_title',
      originalValue: rawTitle,
      correctedValue: cleanedText.title,
      reason: 'Cleaned and formatted title for customer display',
      source: 'text_cleaner'
    });
  }
  if (cleanedText.description !== rawDescription && rawDescription) {
    textCorrections.push({
      field: 'description',
      originalValue: rawDescription.substring(0, 100) + '...',
      correctedValue: cleanedText.description.substring(0, 100) + '...',
      reason: 'Cleaned grammar, spelling, and formatting for customer display',
      source: 'text_cleaner'
    });
  }
  
  // Match against Salesforce picklists and use EXACT picklist values
  const brandMatch = picklistMatcher.matchBrand(cleanedText.brand);
  const categoryMatch = picklistMatcher.matchCategory(consensus.agreedCategory || '');
  
  // Initialize picklist request arrays - track values not in Salesforce picklists
  const brandRequests: BrandRequest[] = [];
  const categoryRequests: CategoryRequest[] = [];
  const styleRequests: StyleRequest[] = [];
  
  // Track brand requests if not matched
  if (!brandMatch.matched && cleanedText.brand && cleanedText.brand.trim() !== '') {
    brandRequests.push({
      brand_name: cleanedText.brand,
      source: 'ai_analysis',
      product_context: {
        sf_catalog_id: rawProduct.SF_Catalog_Id,
        model_number: rawProduct.Model_Number_Web_Retailer || rawProduct.SF_Catalog_Name
      },
      reason: `Brand "${cleanedText.brand}" not found in Salesforce picklist (similarity: ${(brandMatch.similarity * 100).toFixed(0)}%). Closest matches: ${brandMatch.suggestions?.map(s => s.brand_name).join(', ') || 'none'}`
    });
    logger.info('Brand request generated for Salesforce picklist', {
      brand: cleanedText.brand,
      similarity: brandMatch.similarity,
      suggestions: brandMatch.suggestions?.map(s => s.brand_name)
    });
  }
  
  // Track category requests if not matched
  if (!categoryMatch.matched && consensus.agreedCategory && consensus.agreedCategory.trim() !== '') {
    categoryRequests.push({
      category_name: consensus.agreedCategory,
      suggested_department: consensus.agreedPrimaryAttributes.department || '',
      suggested_family: consensus.agreedPrimaryAttributes.product_family || '',
      source: 'ai_analysis',
      product_context: {
        sf_catalog_id: rawProduct.SF_Catalog_Id,
        model_number: rawProduct.Model_Number_Web_Retailer || rawProduct.SF_Catalog_Name
      },
      reason: `Category "${consensus.agreedCategory}" not found in Salesforce picklist (similarity: ${(categoryMatch.similarity * 100).toFixed(0)}%). Closest matches: ${categoryMatch.suggestions?.map(s => s.category_name).join(', ') || 'none'}`
    });
    logger.info('Category request generated for Salesforce picklist', {
      category: consensus.agreedCategory,
      similarity: categoryMatch.similarity,
      suggestions: categoryMatch.suggestions?.map(s => s.category_name)
    });
  }
  
  // Match Style using category-aware mapping
  // If AIs disagree on style, use EITHER value (prefer OpenAI) rather than skipping style entirely
  let styleMatch: { matched: boolean; matchedValue: { style_name: string; style_id: string } | null } = { matched: false, matchedValue: null };
  
  // Track style to use even if not in SF picklist (for populating response while requesting creation)
  let styleToUse: string = '';
  
  // Get style from agreed attributes, or fall back to individual AI values if they disagreed
  let potentialStyle = consensus.agreedPrimaryAttributes.product_style || '';
  
  // If no agreed style, check if AIs provided different styles (disagreement)
  if (!potentialStyle) {
    const styleDisagreement = consensus.disagreements.find(d => d.field === 'product_style');
    if (styleDisagreement) {
      // Use OpenAI's style if available, otherwise xAI's - don't lose the AI analysis
      potentialStyle = String(styleDisagreement.openaiValue || styleDisagreement.xaiValue || '');
      logger.info('Using disagreed style value from AI', {
        openaiStyle: styleDisagreement.openaiValue,
        xaiStyle: styleDisagreement.xaiValue,
        selectedStyle: potentialStyle
      });
    }
  }
  
  // Final fallback to subcategory
  if (!potentialStyle) {
    potentialStyle = rawProduct.Web_Retailer_SubCategory || '';
  }
  
  if (potentialStyle && categoryMatch.matchedValue) {
    const matchedCategory = categoryMatch.matchedValue.category_name;
    const mappedStyle = matchStyleToCategory(matchedCategory, potentialStyle);
    
    if (mappedStyle) {
      // Verify the mapped style exists in Salesforce picklist
      const sfStyleMatch = picklistMatcher.matchStyle(mappedStyle);
      if (sfStyleMatch.matched) {
        styleMatch = sfStyleMatch;
        styleToUse = mappedStyle;
        logger.info(`[Style Matched] Category: "${matchedCategory}" → Style: "${mappedStyle}"`, {
          originalInput: potentialStyle
        });
      } else {
        // Style mapped but not in SF picklist - USE IT AND request creation
        styleToUse = mappedStyle;
        styleRequests.push({
          style_name: mappedStyle,
          suggested_for_category: matchedCategory,
          source: 'ai_analysis',
          product_context: {
            sf_catalog_id: rawProduct.SF_Catalog_Id,
            model_number: rawProduct.Model_Number_Web_Retailer || rawProduct.SF_Catalog_Name
          },
          reason: `Style "${mappedStyle}" mapped from AI analysis but not found in Salesforce picklist`
        });
        logger.info('Style used in response AND request generated for Salesforce picklist creation', {
          style: mappedStyle,
          category: matchedCategory,
          willPopulateResponse: true
        });
      }
    } else {
      // No style mapping found - use potential style from AI and request creation
      // IMPORTANT: Filter out N/A values - these break SF JSON parsing and are not valid styles
      const isValidStyle = potentialStyle && 
                           potentialStyle.trim() !== '' && 
                           !isNAValue(potentialStyle);
      
      if (isValidStyle) {
        styleToUse = potentialStyle;
        styleRequests.push({
          style_name: potentialStyle,
          suggested_for_category: matchedCategory,
          source: 'ai_analysis',
          product_context: {
            sf_catalog_id: rawProduct.SF_Catalog_Id,
            model_number: rawProduct.Model_Number_Web_Retailer || rawProduct.SF_Catalog_Name
          },
          reason: `Style "${potentialStyle}" from AI analysis - requesting creation for category "${matchedCategory}"`
        });
        logger.info('Using AI style in response AND requesting Salesforce picklist creation', {
          style: potentialStyle,
          category: matchedCategory,
          willPopulateResponse: true
        });
      } else if (potentialStyle && isNAValue(potentialStyle)) {
        logger.info('Skipping N/A style value - not adding to Style_Requests', {
          originalStyle: potentialStyle,
          category: matchedCategory
        });
      }
      const validStyles = getValidStylesForCategory(matchedCategory);
      logger.debug(`[Style Validation] Style not in SF picklist for category "${matchedCategory}"`, {
        potentialStyle,
        validStylesForCategory: validStyles,
        source: consensus.agreedPrimaryAttributes.product_style ? 'AI' : 'subcategory'
      });
    }
  }
  
  const primaryAttributes: PrimaryDisplayAttributes = {
    Brand_Verified: brandMatch.matched && brandMatch.matchedValue 
      ? brandMatch.matchedValue.brand_name  // Use EXACT Salesforce brand name
      : cleanedText.brand,
    Brand_Id: brandMatch.matched && brandMatch.matchedValue 
      ? brandMatch.matchedValue.brand_id 
      : null,
    Category_Verified: categoryMatch.matched && categoryMatch.matchedValue 
      ? categoryMatch.matchedValue.category_name  // Use EXACT Salesforce category name
      : cleanEncodingIssues(consensus.agreedCategory || ''),
    Category_Id: categoryMatch.matched && categoryMatch.matchedValue 
      ? categoryMatch.matchedValue.category_id 
      : null,
    SubCategory_Verified: cleanEncodingIssues(
      consensus.agreedPrimaryAttributes.subcategory || 
      consensus.agreedPrimaryAttributes.category_subcategory || 
      rawProduct.Web_Retailer_SubCategory || 
      ''
    ),
    Product_Family_Verified: categoryMatch.matched && categoryMatch.matchedValue?.family
      ? categoryMatch.matchedValue.family  // Use family directly from SF picklist data
      : cleanEncodingIssues(consensus.agreedPrimaryAttributes.product_family || ''),
    Department_Verified: categoryMatch.matched && categoryMatch.matchedValue?.department
      ? categoryMatch.matchedValue.department  // Use department directly from SF picklist data
      : '',
    Product_Style_Verified: styleMatch.matched && styleMatch.matchedValue 
      ? styleMatch.matchedValue.style_name  // Use EXACT Salesforce style name when matched
      : styleToUse,  // Use AI-derived style even if not in SF picklist (will be in Style_Requests)
    Style_Id: styleMatch.matched && styleMatch.matchedValue 
      ? styleMatch.matchedValue.style_id 
      : null,
    Color_Verified: (() => {
      let color = cleanEncodingIssues(
        preferAIValue(
          consensus.agreedPrimaryAttributes.color,
          openaiResult.primaryAttributes.color,
          xaiResult.primaryAttributes.color,
          openaiResult.confidence,
          xaiResult.confidence,
          rawProduct.Ferguson_Color || 
          rawProduct.Color_Finish_Web_Retailer || 
          findAttributeInRawData(rawProduct, 'Color') ||
          findAttributeInRawData(rawProduct, 'Finish Color') ||
          ''
        )
      );
      
      // If still empty, try to extract from title/description
      if (!color || color.trim() === '') {
        const textToSearch = `${rawProduct.Product_Title_Web_Retailer || ''} ${rawProduct.Ferguson_Title || ''} ${rawProduct.Product_Description_Web_Retailer || ''} ${rawProduct.Ferguson_Description || ''}`;
        const extracted = extractColorFinish(textToSearch);
        if (extracted.color) {
          color = extracted.color;
          logger.info('Extracted color from text', { color, source: 'material_extraction' });
        }
      }
      
      return color;
    })(),
    Finish_Verified: (() => {
      let finish = cleanEncodingIssues(
        preferAIValue(
          consensus.agreedPrimaryAttributes.finish,
          openaiResult.primaryAttributes.finish,
          xaiResult.primaryAttributes.finish,
          openaiResult.confidence,
          xaiResult.confidence,
          rawProduct.Ferguson_Finish || 
          findAttributeInRawData(rawProduct, 'Finish') ||
          findAttributeInRawData(rawProduct, 'Surface Finish') ||
          ''
        )
      );
      
      // If still empty, try to extract from title/description
      if (!finish || finish.trim() === '') {
        const textToSearch = `${rawProduct.Product_Title_Web_Retailer || ''} ${rawProduct.Ferguson_Title || ''} ${rawProduct.Product_Description_Web_Retailer || ''} ${rawProduct.Ferguson_Description || ''}`;
        const extracted = extractColorFinish(textToSearch);
        if (extracted.finish) {
          finish = extracted.finish;
          logger.info('Extracted finish from text', { finish, source: 'material_extraction' });
        }
      }
      
      return finish;
    })(),
    Depth_Verified: preferAIValue(
      consensus.agreedPrimaryAttributes.depth_length,
      openaiResult.primaryAttributes.depth_length,
      xaiResult.primaryAttributes.depth_length,
      openaiResult.confidence,
      xaiResult.confidence,
      rawProduct.Depth_Web_Retailer || 
      rawProduct.Ferguson_Depth ||
      findAttributeInRawData(rawProduct, 'Depth') ||
      findAttributeInRawData(rawProduct, 'Overall Depth') ||
      ''
    ),
    Width_Verified: preferAIValue(
      consensus.agreedPrimaryAttributes.width,
      openaiResult.primaryAttributes.width,
      xaiResult.primaryAttributes.width,
      openaiResult.confidence,
      xaiResult.confidence,
      rawProduct.Width_Web_Retailer || 
      rawProduct.Ferguson_Width ||
      findAttributeInRawData(rawProduct, 'Width') ||
      findAttributeInRawData(rawProduct, 'Overall Width') ||
      ''
    ),
    Height_Verified: preferAIValue(
      consensus.agreedPrimaryAttributes.height,
      openaiResult.primaryAttributes.height,
      xaiResult.primaryAttributes.height,
      openaiResult.confidence,
      xaiResult.confidence,
      rawProduct.Height_Web_Retailer || 
      rawProduct.Ferguson_Height ||
      findAttributeInRawData(rawProduct, 'Height') ||
      findAttributeInRawData(rawProduct, 'Overall Height') ||
      ''
    ),
    Weight_Verified: preferAIValue(
      consensus.agreedPrimaryAttributes.weight,
      openaiResult.primaryAttributes.weight,
      xaiResult.primaryAttributes.weight,
      openaiResult.confidence,
      xaiResult.confidence,
      rawProduct.Weight_Web_Retailer ||
      findAttributeInRawData(rawProduct, 'Weight') ||
      findAttributeInRawData(rawProduct, 'Product Weight') ||
      findAttributeInRawData(rawProduct, 'Shipping Weight') ||
      ''
    ),
    MSRP_Verified: preferAIValue(
      consensus.agreedPrimaryAttributes.msrp,
      openaiResult.primaryAttributes.msrp,
      xaiResult.primaryAttributes.msrp,
      openaiResult.confidence,
      xaiResult.confidence,
      rawProduct.MSRP_Web_Retailer || 
      rawProduct.Ferguson_Price ||  // Use Ferguson price as MSRP fallback
      findAttributeInRawData(rawProduct, 'MSRP') ||
      findAttributeInRawData(rawProduct, 'List Price') ||
      ''
    ),
    Market_Value: rawProduct.Ferguson_Price || '',
    Market_Value_Min: rawProduct.Ferguson_Min_Price || '',
    Market_Value_Max: rawProduct.Ferguson_Max_Price || '',
    Description_Verified: cleanedText.description,
    Product_Title_Verified: cleanedText.title,
    Details_Verified: cleanEncodingIssues(
      preferAIValue(
        consensus.agreedPrimaryAttributes.details,
        openaiResult.primaryAttributes.details,
        xaiResult.primaryAttributes.details,
        openaiResult.confidence,
        xaiResult.confidence,
        ''
      )
    ),
    Features_List_HTML: cleanedText.featuresHtml,
    UPC_GTIN_Verified: preferAIValue(
      consensus.agreedPrimaryAttributes.upc_gtin,
      openaiResult.primaryAttributes.upc_gtin,
      xaiResult.primaryAttributes.upc_gtin,
      openaiResult.confidence,
      xaiResult.confidence,
      ''
    ),
    Model_Number_Verified: (() => {
      // Prioritize: 1) SF_Catalog_Name (authoritative), 2) AI consensus or higher confidence, 3) Ferguson, 4) Web Retailer
      const sfModel = rawProduct.SF_Catalog_Name?.trim();
      if (sfModel) return sfModel;
      
      const aiModel = preferAIValue(
        consensus.agreedPrimaryAttributes.model_number,
        openaiResult.primaryAttributes.model_number,
        xaiResult.primaryAttributes.model_number,
        openaiResult.confidence,
        xaiResult.confidence,
        null
      )?.trim();
      
      const fergModel = rawProduct.Ferguson_Model_Number?.trim();
      const wrModel = rawProduct.Model_Number_Web_Retailer?.trim();
      
      return aiModel || fergModel || wrModel || '';
    })(),
    Model_Number_Alias: (() => {
      const primary = rawProduct.SF_Catalog_Name || consensus.agreedPrimaryAttributes.model_number || rawProduct.Model_Number_Web_Retailer || '';
      // Remove special characters for alias
      return primary.replace(/[\/\-\s]/g, '');
    })(),
    Model_Parent: preferAIValue(
      consensus.agreedPrimaryAttributes.model_parent,
      openaiResult.primaryAttributes.model_parent,
      xaiResult.primaryAttributes.model_parent,
      openaiResult.confidence,
      xaiResult.confidence,
      ''
    ),
    Model_Variant_Number: preferAIValue(
      consensus.agreedPrimaryAttributes.model_variant_number,
      openaiResult.primaryAttributes.model_variant_number,
      xaiResult.primaryAttributes.model_variant_number,
      openaiResult.confidence,
      xaiResult.confidence,
      ''
    ),
    Total_Model_Variants: cleanEncodingIssues(
      preferAIValue(
        consensus.agreedPrimaryAttributes.total_model_variants,
        openaiResult.primaryAttributes.total_model_variants,
        xaiResult.primaryAttributes.total_model_variants,
        openaiResult.confidence,
        xaiResult.confidence,
        ''
      )
    )
  };

  // Clean top filter attributes and build attribute ID lookups
  const topFilterAttributes: TopFilterAttributes = {};
  const topFilterAttributeIds: TopFilterAttributeIds = {};
  const attributeRequests: AttributeRequest[] = [];  // Track attributes not in Salesforce picklist
  
  // Get the category schema to map field keys to attribute names
  const categorySchema = consensus.agreedCategory ? getCategorySchema(consensus.agreedCategory) : null;
  
  // Log schema retrieval for debugging
  logger.info('Category schema lookup for attribute ID mapping', {
    category: consensus.agreedCategory || 'unknown',
    schemaFound: !!categorySchema,
    attributeCount: categorySchema?.top15FilterAttributes?.length || 0
  });
  
  // Build complete Top 15 attribute set - include AI-extracted AND raw data fallback
  const completeTop15: Record<string, any> = {};
  
  // First, normalize AI-extracted attributes to use ONLY field keys (deduplicate)
  const normalizedAITop15: Record<string, any> = {};
  if (categorySchema?.top15FilterAttributes) {
    // Create lookup: attribute name -> field key
    const nameToFieldKey = new Map<string, string>();
    for (const attrDef of categorySchema.top15FilterAttributes) {
      nameToFieldKey.set(attrDef.name.toLowerCase().replace(/[^a-z0-9]/g, ''), attrDef.fieldKey);
    }
    
    // Normalize all AI keys to field keys
    for (const [key, value] of Object.entries(consensus.agreedTop15Attributes)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const fieldKey = nameToFieldKey.get(normalizedKey) || key;
      
      // Only keep first value if duplicate (prefer what's already there)
      if (!normalizedAITop15[fieldKey]) {
        normalizedAITop15[fieldKey] = value;
      }
    }
  } else {
    // No schema available, use AI keys as-is
    Object.assign(normalizedAITop15, consensus.agreedTop15Attributes);
  }
  
  Object.assign(completeTop15, normalizedAITop15);
  
  // For attributes AI didn't extract, try to find them in raw data arrays
  if (categorySchema?.top15FilterAttributes) {
    for (const attrDef of categorySchema.top15FilterAttributes) {
      const key = attrDef.fieldKey;
      const name = attrDef.name;
      
      // If AI didn't provide this attribute, search raw data
      if (completeTop15[key] === undefined || completeTop15[key] === null || completeTop15[key] === '') {
        const rawValue = findAttributeInRawData(rawProduct, name);
        if (rawValue) {
          completeTop15[key] = rawValue;
          logger.info('Filled missing Top 15 attribute from raw data', {
            fieldKey: key,
            attributeName: name,
            value: rawValue,
            source: 'raw_data_fallback'
          });
        }
      }
    }
  }
  
  for (const [key, value] of Object.entries(completeTop15)) {
    let finalValue = typeof value === 'string' ? cleanEncodingIssues(value) : value;
    
    // Find the attribute definition from the schema to validate and standardize the value
    let attributeName: string | null = null;
    let attrDef: any = null;
    if (categorySchema?.top15FilterAttributes) {
      attrDef = categorySchema.top15FilterAttributes.find(attr => attr.fieldKey === key);
      attributeName = attrDef?.name || null;
      
      // For enum types with allowedValues, validate and match against exact allowed values
      if (attrDef && attrDef.type === 'enum' && attrDef.allowedValues && finalValue) {
        const normalizedValue = String(finalValue).toLowerCase().trim();
        
        // Try exact match first
        let matchedValue = attrDef.allowedValues.find((av: string) => 
          av.toLowerCase() === normalizedValue
        );
        
        // If no exact match, try fuzzy match
        if (!matchedValue) {
          matchedValue = attrDef.allowedValues.find((av: string) => 
            av.toLowerCase().includes(normalizedValue) || normalizedValue.includes(av.toLowerCase())
          );
        }
        
        // Use exact Salesforce allowed value if matched
        if (matchedValue) {
          finalValue = matchedValue;
          logger.info('Standardized attribute value to exact schema allowed value', {
            fieldKey: key,
            originalValue: value,
            standardizedValue: matchedValue
          });
        } else {
          logger.warn('Attribute value does not match allowed values in schema', {
            fieldKey: key,
            value: finalValue,
            allowedValues: attrDef.allowedValues
          });
        }
      }
      
      if (!attributeName) {
        logger.warn('Attribute definition not found in schema', {
          fieldKey: key,
          category: consensus.agreedCategory || 'unknown',
          availableFieldKeys: categorySchema.top15FilterAttributes.map(a => a.fieldKey)
        });
      }
    }
    
    topFilterAttributes[key] = finalValue;
    
    // Look up the attribute ID using the proper attribute name (not the field key)
    // NOTE: Top 15 attributes are FIXED in our schema per category - they don't need SF picklist matching
    // The SF attributes picklist is for HTML table attributes, not Top 15
    if (attributeName) {
      const attrMatch = picklistMatcher.matchAttribute(attributeName);
      topFilterAttributeIds[key] = attrMatch.matched && attrMatch.matchedValue 
        ? attrMatch.matchedValue.attribute_id 
        : null;
        
      // Top 15 attributes are defined in our category schema - they are FIXED
      // Do NOT generate Attribute_Requests for them since they're not meant to be in SF attributes picklist
      if (!attrMatch.matched) {
        // Log that this is a schema-defined Top 15 attribute (no request needed)
        logger.info('Top 15 attribute not in SF picklist - this is expected (schema-defined)', {
          fieldKey: key,
          attributeName,
          category: consensus.agreedCategory || 'Unknown',
          note: 'Top 15 attributes are fixed per category, SF attributes picklist is for HTML table only'
        });
      }
    } else {
      // Fallback: try matching the field key directly (legacy behavior)
      const attrMatch = picklistMatcher.matchAttribute(key);
      topFilterAttributeIds[key] = attrMatch.matched && attrMatch.matchedValue 
        ? attrMatch.matchedValue.attribute_id 
        : null;
        
      // Still don't generate requests - Top 15 are fixed in schema
      if (!attrMatch.matched) {
        logger.info('Top 15 attribute (by key) not in SF picklist - expected for schema-defined attributes', {
          fieldKey: key,
          category: consensus.agreedCategory || 'Unknown'
        });
      }
    }
  }
  
  // Log attribute requests summary if any
  if (attributeRequests.length > 0) {
    logger.info('Attribute requests generated for Salesforce picklist update', {
      count: attributeRequests.length,
      attributes: attributeRequests.map(ar => ar.attribute_name)
    });
  }
  
  const additionalHtml = generateAttributeTable(consensus.agreedAdditionalAttributes);
  const priceAnalysis = buildPriceAnalysis(rawProduct);
  const status = determineStatus(consensus, openaiResult, xaiResult);
  const corrections: CorrectionRecord[] = [...openaiResult.corrections, ...xaiResult.corrections, ...textCorrections];

  // Build new sections for media, links, and documents
  const mediaAssets = buildMediaAssets(rawProduct, openaiResult, xaiResult);
  const referenceLinks = buildReferenceLinks(rawProduct);
  const documentsSection = buildDocumentsSection(rawProduct, openaiResult, xaiResult);

  // Build AI Review Status (summary)
  const aiReview = buildAIReviewStatus(openaiResult, xaiResult, consensus);

  // Build per-field AI reviews for trend analysis
  const fieldAIReviews = buildFieldAIReviews(openaiResult, xaiResult, consensus);

  // Calculate score breakdown for transparency
  // Exclude generated text fields from the disagreement count (they naturally differ)
  const generatedTextFields = new Set([
    'description', 'product_title', 'details', 'features_list', 
    'category_subcategory', 'material'
  ]);
  
  const totalAgreedFields = Object.keys(consensus.agreedPrimaryAttributes).length + 
    Object.keys(consensus.agreedTop15Attributes).length + 
    Object.keys(consensus.agreedAdditionalAttributes).length;
  
  const factualDisagreements = consensus.disagreements.filter(d => 
    !generatedTextFields.has(d.field.toLowerCase())
  );
  const unresolvedCount = factualDisagreements.filter(d => d.resolution === 'unresolved').length;
  const totalFieldsAnalyzed = totalAgreedFields + unresolvedCount;
  
  // Category bonus applies if we have a final agreed category (even after cross-validation)
  const hasFinalCategory = consensus.agreedCategory && consensus.agreedCategory.length > 0;

  const verification: VerificationMetadata = {
    verification_timestamp: new Date().toISOString(),
    verification_session_id: sessionId,
    verification_score: Math.round(consensus.overallConfidence * 100),
    verification_status: status,
    data_sources_used: ['OpenAI', 'xAI', 'Web_Retailer', 'Ferguson'],
    corrections_made: corrections,
    missing_fields: consensus.needsResearch,
    confidence_scores: {
      openai: openaiResult.confidence,
      xai: xaiResult.confidence,
      consensus: consensus.overallConfidence,
      category: Math.max(openaiResult.categoryConfidence, xaiResult.categoryConfidence)
    },
    score_breakdown: {
      ai_confidence_component: Math.round(((openaiResult.confidence + xaiResult.confidence) / 2) * 50),
      agreement_component: Math.round((totalAgreedFields / Math.max(1, totalFieldsAnalyzed)) * 40),
      category_bonus: hasFinalCategory ? 10 : 0,
      fields_agreed: totalAgreedFields,
      fields_disagreed: unresolvedCount,
      total_fields: totalFieldsAnalyzed,
      agreement_percentage: Math.round((totalAgreedFields / Math.max(1, totalFieldsAnalyzed)) * 100),
      text_fields_excluded: consensus.disagreements.length - factualDisagreements.length,
      disagreement_details: factualDisagreements.slice(0, 5).map(d => ({
        field: d.field,
        openai: String(d.openaiValue).substring(0, 50),
        xai: String(d.xaiValue).substring(0, 50)
      }))
    }
  };

  // Log picklist requests summary
  const totalPicklistRequests = attributeRequests.length + brandRequests.length + categoryRequests.length + styleRequests.length;
  if (totalPicklistRequests > 0) {
    logger.info('Picklist requests generated for Salesforce', {
      total: totalPicklistRequests,
      attributes: attributeRequests.length,
      brands: brandRequests.length,
      categories: categoryRequests.length,
      styles: styleRequests.length
    });
  }

  // Record to Catalog Intelligence Index (async, don't wait)
  catalogIndexService.recordVerification({
    sf_catalog_id: rawProduct.SF_Catalog_Id,
    model_number: rawProduct.Model_Number_Web_Retailer || rawProduct.SF_Catalog_Name || '',
    brand: primaryAttributes.Brand_Verified || '',
    brand_id: primaryAttributes.Brand_Id || null,
    category: primaryAttributes.Category_Verified || '',
    category_id: primaryAttributes.Category_Id || null,
    department: primaryAttributes.Department_Verified || '',
    family: primaryAttributes.Product_Family_Verified || '',
    subcategory: primaryAttributes.SubCategory_Verified || '',
    style: primaryAttributes.Product_Style_Verified || '',
    style_id: primaryAttributes.Style_Id || null,
    attributes: {
      ...topFilterAttributes,
      color: primaryAttributes.Color_Verified,
      width: primaryAttributes.Width_Verified,
      height: primaryAttributes.Height_Verified,
      depth: primaryAttributes.Depth_Verified
    },
    confidence_score: consensus.overallConfidence,
    openai_category: openaiResult.primaryAttributes?.category || '',
    openai_style: openaiResult.primaryAttributes?.product_style || '',
    xai_category: xaiResult.primaryAttributes?.category || '',
    xai_style: xaiResult.primaryAttributes?.product_style || ''
  }).catch(err => {
    logger.error('Failed to record to catalog index', { error: err });
  });

  // Sanitize all attribute objects to prevent SF JSON parsing errors
  // SF Apex deserializer fails on "N/A (Regulation does not apply)" type values
  const sanitizedPrimaryAttributes = sanitizeObjectForSalesforce(primaryAttributes);
  const sanitizedTopFilterAttributes = sanitizeObjectForSalesforce(topFilterAttributes);
  
  // Filter out any Style_Requests with N/A values (extra safety check)
  const filteredStyleRequests = styleRequests.filter(req => 
    req.style_name && !isNAValue(req.style_name)
  );

  // Build research transparency to show what was analyzed from each resource
  const researchTransparency = buildResearchTransparency(researchResult);

  return {
    SF_Catalog_Id: rawProduct.SF_Catalog_Id,
    SF_Catalog_Name: rawProduct.SF_Catalog_Name,
    Primary_Attributes: sanitizedPrimaryAttributes,
    Top_Filter_Attributes: sanitizedTopFilterAttributes,
    Top_Filter_Attribute_Ids: topFilterAttributeIds,
    Additional_Attributes_HTML: additionalHtml,
    Price_Analysis: priceAnalysis,
    Media: mediaAssets,
    Reference_Links: referenceLinks,
    Documents: documentsSection,
    Research_Analysis: researchTransparency,
    Field_AI_Reviews: fieldAIReviews,
    AI_Review: aiReview,
    Verification: verification,
    // Picklist Requests - SF adds these options then calls /api/picklists/sync to update us
    Attribute_Requests: attributeRequests,
    Brand_Requests: brandRequests,
    Category_Requests: categoryRequests,
    Style_Requests: filteredStyleRequests,
    Status: status === 'verified' ? 'success' : status === 'needs_review' ? 'partial' : 'failed'
  };
}

/**
 * Build AI Review Status showing each AI's review and consensus
 */
function buildAIReviewStatus(
  openaiResult: AIAnalysisResult,
  xaiResult: AIAnalysisResult,
  consensus: ConsensusResult
): AIReviewStatus {
  // Determine OpenAI result
  const openaiReview: AIProviderReview = {
    reviewed: openaiResult.success,
    result: !openaiResult.success ? 'error' : 
            consensus.overallConfidence >= 0.85 ? 'agreed' :
            consensus.overallConfidence >= 0.6 ? 'partial' : 'disagreed',
    confidence: Math.round(openaiResult.confidence * 100),
    fields_verified: Object.keys(openaiResult.primaryAttributes || {}).length + 
                     Object.keys(openaiResult.top15Attributes || {}).length,
    fields_corrected: openaiResult.corrections.length,
    error_message: openaiResult.success ? undefined : 'AI analysis failed'
  };

  // Determine xAI result
  const xaiReview: AIProviderReview = {
    reviewed: xaiResult.success,
    result: !xaiResult.success ? 'error' :
            consensus.overallConfidence >= 0.85 ? 'agreed' :
            consensus.overallConfidence >= 0.6 ? 'partial' : 'disagreed',
    confidence: Math.round(xaiResult.confidence * 100),
    fields_verified: Object.keys(xaiResult.primaryAttributes || {}).length + 
                     Object.keys(xaiResult.top15Attributes || {}).length,
    fields_corrected: xaiResult.corrections.length,
    error_message: xaiResult.success ? undefined : 'AI analysis failed'
  };

  // Determine consensus status
  const bothReviewed = openaiResult.success && xaiResult.success;
  let agreementStatus: 'full_agreement' | 'partial_agreement' | 'disagreement' | 'single_source' | 'no_review';
  let finalArbiter: 'openai' | 'xai' | 'consensus' | 'manual_review_needed' | undefined;

  if (!openaiResult.success && !xaiResult.success) {
    agreementStatus = 'no_review';
    finalArbiter = 'manual_review_needed';
  } else if (!bothReviewed) {
    agreementStatus = 'single_source';
    finalArbiter = openaiResult.success ? 'openai' : 'xai';
  } else if (consensus.overallConfidence >= 0.85) {
    agreementStatus = 'full_agreement';
    finalArbiter = 'consensus';
  } else if (consensus.overallConfidence >= 0.6) {
    agreementStatus = 'partial_agreement';
    finalArbiter = 'consensus';
  } else {
    agreementStatus = 'disagreement';
    finalArbiter = 'manual_review_needed';
  }

  return {
    openai: openaiReview,
    xai: xaiReview,
    consensus: {
      both_reviewed: bothReviewed,
      agreement_status: agreementStatus,
      agreement_percentage: Math.round(consensus.overallConfidence * 100),
      final_arbiter: finalArbiter
    }
  };
}

/**
 * Build per-field AI reviews for tracking individual field success
 */
function buildFieldAIReviews(
  openaiResult: AIAnalysisResult,
  xaiResult: AIAnalysisResult,
  consensus: ConsensusResult
): FieldAIReviews {
  const fieldReviews: FieldAIReviews = {};

  // Helper to compare values and determine consensus
  const buildFieldReview = (
    _fieldName: string,
    openaiValue: any,
    xaiValue: any,
    finalValue: any
  ): FieldAIReview => {
    const openaiHasValue = openaiValue !== null && openaiValue !== undefined && openaiValue !== '';
    const xaiHasValue = xaiValue !== null && xaiValue !== undefined && xaiValue !== '';
    
    // Normalize for comparison
    const normalizeValue = (v: any) => String(v || '').toLowerCase().trim();
    const valuesMatch = normalizeValue(openaiValue) === normalizeValue(xaiValue);
    
    let consensusStatus: 'agreed' | 'partial' | 'disagreed' | 'single_source';
    let source: 'both_agreed' | 'openai_selected' | 'xai_selected' | 'averaged' | 'manual_needed';
    
    if (openaiHasValue && xaiHasValue) {
      if (valuesMatch) {
        consensusStatus = 'agreed';
        source = 'both_agreed';
      } else {
        // Check if final value matches either
        const finalNorm = normalizeValue(finalValue);
        if (finalNorm === normalizeValue(openaiValue)) {
          consensusStatus = 'partial';
          source = 'openai_selected';
        } else if (finalNorm === normalizeValue(xaiValue)) {
          consensusStatus = 'partial';
          source = 'xai_selected';
        } else {
          consensusStatus = 'disagreed';
          source = 'manual_needed';
        }
      }
    } else if (openaiHasValue) {
      consensusStatus = 'single_source';
      source = 'openai_selected';
    } else if (xaiHasValue) {
      consensusStatus = 'single_source';
      source = 'xai_selected';
    } else {
      consensusStatus = 'disagreed';
      source = 'manual_needed';
    }

    return {
      openai: {
        value: openaiValue ?? null,
        agreed: valuesMatch || !xaiHasValue,
        confidence: openaiHasValue ? Math.round(openaiResult.confidence * 100) : 0
      },
      xai: {
        value: xaiValue ?? null,
        agreed: valuesMatch || !openaiHasValue,
        confidence: xaiHasValue ? Math.round(xaiResult.confidence * 100) : 0
      },
      consensus: consensusStatus,
      source: source,
      final_value: finalValue ?? null
    };
  };

  // Build reviews for primary attributes
  const primaryFields = Object.keys(consensus.agreedPrimaryAttributes);
  for (const field of primaryFields) {
    fieldReviews[field] = buildFieldReview(
      field,
      openaiResult.primaryAttributes?.[field],
      xaiResult.primaryAttributes?.[field],
      consensus.agreedPrimaryAttributes[field]
    );
  }

  // Build reviews for top 15 attributes
  const top15Fields = Object.keys(consensus.agreedTop15Attributes);
  for (const field of top15Fields) {
    fieldReviews[field] = buildFieldReview(
      field,
      openaiResult.top15Attributes?.[field],
      xaiResult.top15Attributes?.[field],
      consensus.agreedTop15Attributes[field]
    );
  }

  // Add category as a tracked field
  fieldReviews['category'] = buildFieldReview(
    'category',
    openaiResult.determinedCategory,
    xaiResult.determinedCategory,
    consensus.agreedCategory
  );

  return fieldReviews;
}

function buildPriceAnalysis(rawProduct: SalesforceIncomingProduct): PriceAnalysis {
  const parsePrice = (val: string | number | undefined | null): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
  };

  return {
    msrp_web_retailer: parsePrice(rawProduct.MSRP_Web_Retailer),
    msrp_ferguson: parsePrice(rawProduct.Ferguson_Price),
  };
}

function determineStatus(consensus: ConsensusResult, openaiResult: AIAnalysisResult, xaiResult: AIAnalysisResult): 'verified' | 'needs_review' | 'failed' {
  if (!openaiResult.success && !xaiResult.success) return 'failed';
  if (consensus.overallConfidence >= 0.85) return 'verified';  // 85%+ confidence = verified (even with minor disagreements)
  if (consensus.overallConfidence >= 0.6) return 'needs_review';
  return 'failed';
}

/**
 * Build Media Assets section from incoming product images
 * Uses AI recommendation for primary image if available
 */
function buildMediaAssets(
  rawProduct: SalesforceIncomingProduct,
  openaiResult: AIAnalysisResult,
  xaiResult: AIAnalysisResult
): {
  Primary_Image_URL: string;
  All_Image_URLs: string[];
  Image_Count: number;
  AI_Recommended_Primary?: number;
  Recommendation_Reason?: string;
} {
  const stockImages = rawProduct.Stock_Images || [];
  const imageUrls = stockImages.map(img => img.url).filter(url => url && url.trim() !== '');
  
  // Use AI-recommended primary image if both AIs agree, or use higher confidence recommendation
  let primaryIndex = 0; // Default to first image
  let recommendationReason: string | undefined;
  
  const openaiIndex = openaiResult.primaryImageIndex;
  const xaiIndex = xaiResult.primaryImageIndex;
  
  if (openaiIndex !== undefined && xaiIndex !== undefined) {
    if (openaiIndex === xaiIndex) {
      // Both AIs agree - use their recommendation
      primaryIndex = openaiIndex;
      recommendationReason = openaiResult.primaryImageReason || xaiResult.primaryImageReason || 'Both AIs agreed';
      logger.info('Using AI-recommended primary image (consensus)', { 
        index: primaryIndex, 
        reason: recommendationReason 
      });
    } else {
      // AIs disagree - use higher confidence AI's recommendation
      primaryIndex = openaiResult.confidence >= xaiResult.confidence ? openaiIndex : xaiIndex;
      recommendationReason = openaiResult.confidence >= xaiResult.confidence 
        ? openaiResult.primaryImageReason 
        : xaiResult.primaryImageReason;
      logger.info('Using AI-recommended primary image (higher confidence)', { 
        index: primaryIndex, 
        selectedAI: openaiResult.confidence >= xaiResult.confidence ? 'OpenAI' : 'xAI',
        reason: recommendationReason 
      });
    }
  } else if (openaiIndex !== undefined) {
    primaryIndex = openaiIndex;
    recommendationReason = openaiResult.primaryImageReason;
  } else if (xaiIndex !== undefined) {
    primaryIndex = xaiIndex;
    recommendationReason = xaiResult.primaryImageReason;
  }
  
  // Validate index is within bounds
  if (primaryIndex < 0 || primaryIndex >= imageUrls.length) {
    logger.warn('AI-recommended image index out of bounds, using first image', {
      recommendedIndex: primaryIndex,
      availableImages: imageUrls.length
    });
    primaryIndex = 0;
  }
  
  return {
    Primary_Image_URL: imageUrls.length > 0 ? imageUrls[primaryIndex] : '',
    All_Image_URLs: imageUrls,
    Image_Count: imageUrls.length,
    AI_Recommended_Primary: (openaiIndex !== undefined || xaiIndex !== undefined) ? primaryIndex : undefined,
    Recommendation_Reason: recommendationReason,
  };
}

/**
 * Build Reference Links section from incoming product URLs
 */
function buildReferenceLinks(rawProduct: SalesforceIncomingProduct): {
  Ferguson_URL: string;
  Web_Retailer_URL: string;
  Manufacturer_URL: string;
} {
  return {
    Ferguson_URL: rawProduct.Ferguson_URL || '',
    Web_Retailer_URL: rawProduct.Reference_URL || '',
    Manufacturer_URL: '', // Could be extracted from documents
  };
}

/**
 * Build Documents Section using AI evaluations from both providers
 * Merges OpenAI and xAI document evaluations, preferring consensus or higher confidence
 */
function buildDocumentsSection(
  rawProduct: SalesforceIncomingProduct,
  openaiResult: AIAnalysisResult,
  xaiResult: AIAnalysisResult
): {
  total_count: number;
  recommended_count: number;
  documents: Array<{
    url: string;
    name?: string;
    type?: string;
    ai_recommendation: 'use' | 'skip' | 'review';
    relevance_score: number;
    reason: string;
    extracted_info?: string;
    openai_eval?: { recommendation: string; score: number; reason: string };
    xai_eval?: { recommendation: string; score: number; reason: string };
  }>;
} {
  const incomingDocs = rawProduct.Documents || [];
  const openaiEvals = openaiResult.documentEvaluations || [];
  const xaiEvals = xaiResult.documentEvaluations || [];
  
  // Build lookup maps by URL
  const openaiMap = new Map(openaiEvals.map(e => [e.url, e]));
  const xaiMap = new Map(xaiEvals.map(e => [e.url, e]));
  
  const documents = incomingDocs.map(doc => {
    const openaiEval = openaiMap.get(doc.url);
    const xaiEval = xaiMap.get(doc.url);
    
    // If neither AI evaluated this document, mark as review
    if (!openaiEval && !xaiEval) {
      return {
        url: doc.url,
        name: doc.name,
        type: doc.type,
        ai_recommendation: 'review' as const,
        relevance_score: 0,
        reason: 'Not evaluated by AI',
        extracted_info: undefined,
      };
    }
    
    // If both AIs evaluated, use consensus or higher confidence
    let finalRecommendation: 'use' | 'skip' | 'review';
    let finalScore: number;
    let finalReason: string;
    let extractedInfo: string[] = [];
    
    if (openaiEval && xaiEval) {
      // Both evaluated - check for consensus
      if (openaiEval.recommendation === xaiEval.recommendation) {
        finalRecommendation = openaiEval.recommendation;
        finalScore = Math.max(openaiEval.relevanceScore, xaiEval.relevanceScore);
        finalReason = `Both AIs agree: ${openaiEval.reason}`;
        extractedInfo = [...(openaiEval.extractedInfo || []), ...(xaiEval.extractedInfo || [])];
      } else {
        // Disagreement - use higher scoring evaluation
        const useOpenAI = openaiEval.relevanceScore >= xaiEval.relevanceScore;
        finalRecommendation = useOpenAI ? openaiEval.recommendation : xaiEval.recommendation;
        finalScore = Math.max(openaiEval.relevanceScore, xaiEval.relevanceScore);
        finalReason = useOpenAI 
          ? `OpenAI (${openaiEval.relevanceScore}): ${openaiEval.reason}` 
          : `xAI (${xaiEval.relevanceScore}): ${xaiEval.reason}`;
        extractedInfo = useOpenAI 
          ? (openaiEval.extractedInfo || []) 
          : (xaiEval.extractedInfo || []);
      }
    } else {
      // Only one AI evaluated
      const singleEval = openaiEval || xaiEval!;
      finalRecommendation = singleEval.recommendation;
      finalScore = singleEval.relevanceScore;
      finalReason = singleEval.reason;
      extractedInfo = singleEval.extractedInfo || [];
    }
    
    return {
      url: doc.url,
      name: doc.name,
      type: doc.type,
      ai_recommendation: finalRecommendation,
      relevance_score: finalScore,
      reason: finalReason,
      extracted_info: extractedInfo.length > 0 ? extractedInfo.join('; ') : undefined,
      openai_eval: openaiEval ? {
        recommendation: openaiEval.recommendation,
        score: openaiEval.relevanceScore,
        reason: openaiEval.reason
      } : undefined,
      xai_eval: xaiEval ? {
        recommendation: xaiEval.recommendation,
        score: xaiEval.relevanceScore,
        reason: xaiEval.reason
      } : undefined,
    };
  });
  
  const recommendedCount = documents.filter(d => d.ai_recommendation === 'use').length;
  
  logger.info('Document evaluation summary', {
    totalDocuments: documents.length,
    recommendedCount,
    skippedCount: documents.filter(d => d.ai_recommendation === 'skip').length,
    reviewCount: documents.filter(d => d.ai_recommendation === 'review').length,
  });
  
  return {
    total_count: documents.length,
    recommended_count: recommendedCount,
    documents,
  };
}

function buildErrorResponse(rawProduct: SalesforceIncomingProduct, sessionId: string, error: unknown): SalesforceVerificationResponse {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  return {
    SF_Catalog_Id: rawProduct.SF_Catalog_Id,
    SF_Catalog_Name: rawProduct.SF_Catalog_Name,
    Primary_Attributes: {} as PrimaryDisplayAttributes,
    Top_Filter_Attributes: {},
    Top_Filter_Attribute_Ids: {},
    Additional_Attributes_HTML: '',
    Price_Analysis: {
      msrp_web_retailer: 0,
      msrp_ferguson: 0,
    },
    Media: {
      Primary_Image_URL: '',
      All_Image_URLs: [],
      Image_Count: 0,
    },
    Reference_Links: {
      Ferguson_URL: '',
      Web_Retailer_URL: '',
      Manufacturer_URL: '',
    },
    Documents: {
      total_count: 0,
      recommended_count: 0,
      documents: [],
    },
    Field_AI_Reviews: {},
    AI_Review: {
      openai: {
        reviewed: false,
        result: 'error',
        confidence: 0,
        fields_verified: 0,
        fields_corrected: 0,
        error_message: errorMessage
      },
      xai: {
        reviewed: false,
        result: 'error',
        confidence: 0,
        fields_verified: 0,
        fields_corrected: 0,
        error_message: errorMessage
      },
      consensus: {
        both_reviewed: false,
        agreement_status: 'no_review',
        agreement_percentage: 0,
        final_arbiter: 'manual_review_needed'
      }
    },
    Verification: {
      verification_timestamp: new Date().toISOString(),
      verification_session_id: sessionId,
      verification_score: 0,
      verification_status: 'failed',
      data_sources_used: [],
      corrections_made: [],
      missing_fields: [],
      confidence_scores: {}
    },
    Attribute_Requests: [],
    Brand_Requests: [],
    Category_Requests: [],
    Style_Requests: [],
    Status: 'failed',
    Error_Message: errorMessage
  };
}

/**
 * Track field population rates for analytics
 */
async function trackFieldPopulation(
  finalResponse: SalesforceVerificationResponse,
  category: string,
  openaiResult: AIAnalysisResult,
  xaiResult: AIAnalysisResult
): Promise<void> {
  try {
    // Track primary attributes
    for (const [field, value] of Object.entries(finalResponse.Primary_Attributes)) {
      const aiProvided = !!(openaiResult.primaryAttributes[field] || xaiResult.primaryAttributes[field]);
      const populated = !!(value && value !== '' && value !== null);
      
      await FieldAnalytics.updateOne(
        { field_name: field, category, field_type: 'primary' },
        {
          $inc: {
            total_calls: 1,
            populated_count: populated ? 1 : 0,
            ai_provided_count: aiProvided ? 1 : 0,
            fallback_used_count: (populated && !aiProvided) ? 1 : 0,
            missing_count: populated ? 0 : 1
          }
        },
        { upsert: true }
      );
    }
    
    // Track top filter attributes
    for (const [field, value] of Object.entries(finalResponse.Top_Filter_Attributes)) {
      const aiProvided = !!(openaiResult.top15Attributes[field] || xaiResult.top15Attributes[field]);
      const populated = !!(value && value !== '' && value !== null);
      
      await FieldAnalytics.updateOne(
        { field_name: field, category, field_type: 'top_filter' },
        {
          $inc: {
            total_calls: 1,
            populated_count: populated ? 1 : 0,
            ai_provided_count: aiProvided ? 1 : 0,
            fallback_used_count: (populated && !aiProvided) ? 1 : 0,
            missing_count: populated ? 0 : 1
          }
        },
        { upsert: true }
      );
    }
    
    logger.debug('Field population tracked', { category, fields: Object.keys(finalResponse.Primary_Attributes).length });
  } catch (error) {
    logger.error('Failed to track field population', { error });
  }
}

export default { verifyProductWithDualAI };
export const dualAIVerificationService = { verifyProductWithDualAI };
