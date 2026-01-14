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
  VerificationMetadata,
  CorrectionRecord,
  PriceAnalysis,
  AIReviewStatus,
  AIProviderReview,
  FieldAIReviews,
  FieldAIReview
} from '../types/salesforce.types';
import {
  getCategorySchema,
  getCategoryListForPrompt,
  getPrimaryAttributesForPrompt,
  getAllCategoriesWithTop15ForPrompt
} from '../config/master-category-attributes';
import { generateAttributeTable } from '../utils/html-generator';
import { cleanCustomerFacingText, cleanEncodingIssues } from '../utils/text-cleaner';
import logger from '../utils/logger';
import config from '../config';
import trackingService from './tracking.service';
import picklistMatcher from './picklist-matcher.service';
import { verificationAnalyticsService } from './verification-analytics.service';
import alertingService from './alerting.service';

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
    const openaiStartTime = Date.now();
    const xaiStartTime = Date.now();
    
    const [openaiResult, xaiResult] = await Promise.all([
      analyzeWithOpenAI(rawProduct, verificationSessionId),
      analyzeWithXAI(rawProduct, verificationSessionId)
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

    const processingTime = Date.now() - startTime;
    const response = buildFinalResponse(rawProduct, consensus, verificationSessionId, processingTime, openaiResult, xaiResult);
    
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

async function analyzeWithOpenAI(rawProduct: SalesforceIncomingProduct, sessionId: string): Promise<AIAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: config.openai?.model || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: buildAnalysisPrompt(rawProduct) }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from OpenAI');

    return parseAIResponse(JSON.parse(content), 'openai');
  } catch (error) {
    logger.error('OpenAI analysis failed', { sessionId, error });
    return createErrorResult('openai', error);
  }
}

async function analyzeWithXAI(rawProduct: SalesforceIncomingProduct, sessionId: string): Promise<AIAnalysisResult> {
  try {
    const response = await xai.chat.completions.create({
      model: config.xai?.model || 'grok-beta',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: buildAnalysisPrompt(rawProduct) }
      ],
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from xAI');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in xAI response');

    return parseAIResponse(JSON.parse(jsonMatch[0]), 'xai');
  } catch (error) {
    logger.error('xAI analysis failed', { sessionId, error });
    return createErrorResult('xai', error);
  }
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

function buildAnalysisPrompt(rawProduct: SalesforceIncomingProduct): string {
  return `Analyze this product and map it to our category system:

RAW PRODUCT DATA:
${JSON.stringify(rawProduct, null, 2)}

Tasks:
1. Determine the product category from our master list
2. Map all available data to the correct attribute fields for that category
3. **CRITICAL**: Clean and enhance ALL customer-facing text:
   - Fix brand encoding issues (e.g., "Caf(eback)" → "Café", "(TM)" → "™")
   - Fix run-on sentences (add spaces after periods)
   - Ensure proper capitalization
   - Professional grammar and punctuation
4. **REQUIRED**: Generate a features_list with 5-10 key features extracted from the description/specs
5. List any missing required fields
6. Note any corrections you made

The product_title, description, and features_list will be displayed directly to customers.
They MUST be professional, well-formatted, and error-free.

Return your analysis as JSON.`;
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
    researchPerformed: false,
    rawResponse: JSON.stringify(parsed)
  };
}

function buildConsensus(openaiResult: AIAnalysisResult, xaiResult: AIAnalysisResult): ConsensusResult {
  const disagreements: ConsensusResult['disagreements'] = [];
  const needsResearch: string[] = [];
  
  const categoriesMatch = openaiResult.determinedCategory.toLowerCase() === xaiResult.determinedCategory.toLowerCase();
  
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

function buildFinalResponse(
  rawProduct: SalesforceIncomingProduct,
  consensus: ConsensusResult,
  sessionId: string,
  _processingTimeMs: number,
  openaiResult: AIAnalysisResult,
  xaiResult: AIAnalysisResult
): SalesforceVerificationResponse {
  
  // Get raw values for customer-facing text
  const rawBrand = consensus.agreedPrimaryAttributes.brand || rawProduct.Brand_Web_Retailer || rawProduct.Ferguson_Brand || '';
  const rawTitle = consensus.agreedPrimaryAttributes.product_title || rawProduct.Product_Title_Web_Retailer || '';
  const rawDescription = consensus.agreedPrimaryAttributes.description || rawProduct.Product_Description_Web_Retailer || rawProduct.Ferguson_Description || '';
  
  // Handle features from AI - could be string (HTML), array, or missing
  let rawFeatures = consensus.agreedPrimaryAttributes.features_list || rawProduct.Features_Web_Retailer || '';
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
  
  const primaryAttributes: PrimaryDisplayAttributes = {
    Brand_Verified: cleanedText.brand,
    Brand_Id: (() => {
      const brandMatch = picklistMatcher.matchBrand(cleanedText.brand);
      return brandMatch.matched && brandMatch.matchedValue ? brandMatch.matchedValue.brand_id : null;
    })(),
    Category_Verified: cleanEncodingIssues(consensus.agreedCategory || ''),
    SubCategory_Verified: cleanEncodingIssues(consensus.agreedPrimaryAttributes.subcategory || ''),
    Product_Family_Verified: cleanEncodingIssues(consensus.agreedPrimaryAttributes.product_family || ''),
    Product_Style_Verified: cleanEncodingIssues(consensus.agreedPrimaryAttributes.product_style || ''),
    Color_Verified: cleanEncodingIssues(consensus.agreedPrimaryAttributes.color || rawProduct.Ferguson_Color || rawProduct.Color_Finish_Web_Retailer || ''),
    Finish_Verified: cleanEncodingIssues(consensus.agreedPrimaryAttributes.finish || rawProduct.Ferguson_Finish || ''),
    Depth_Verified: consensus.agreedPrimaryAttributes.depth_length || rawProduct.Depth_Web_Retailer,
    Width_Verified: consensus.agreedPrimaryAttributes.width || rawProduct.Width_Web_Retailer,
    Height_Verified: consensus.agreedPrimaryAttributes.height || rawProduct.Height_Web_Retailer,
    Weight_Verified: consensus.agreedPrimaryAttributes.weight || rawProduct.Weight_Web_Retailer,
    MSRP_Verified: consensus.agreedPrimaryAttributes.msrp || rawProduct.MSRP_Web_Retailer,
    Market_Value: rawProduct.Ferguson_Price || '',
    Market_Value_Min: rawProduct.Ferguson_Min_Price || '',
    Market_Value_Max: rawProduct.Ferguson_Max_Price || '',
    Description_Verified: cleanedText.description,
    Product_Title_Verified: cleanedText.title,
    Details_Verified: cleanEncodingIssues(consensus.agreedPrimaryAttributes.details || ''),
    Features_List_HTML: cleanedText.featuresHtml,
    UPC_GTIN_Verified: consensus.agreedPrimaryAttributes.upc_gtin || '',
    Model_Number_Verified: consensus.agreedPrimaryAttributes.model_number || rawProduct.Model_Number_Web_Retailer,
    Model_Number_Alias: consensus.agreedPrimaryAttributes.model_number_alias || '',
    Model_Parent: consensus.agreedPrimaryAttributes.model_parent || '',
    Model_Variant_Number: consensus.agreedPrimaryAttributes.model_variant_number || '',
    Total_Model_Variants: cleanEncodingIssues(consensus.agreedPrimaryAttributes.total_model_variants || '')
  };

  // Clean top filter attributes
  const topFilterAttributes: TopFilterAttributes = {};
  for (const [key, value] of Object.entries(consensus.agreedTop15Attributes)) {
    topFilterAttributes[key] = typeof value === 'string' ? cleanEncodingIssues(value) : value;
  }
  
  const additionalHtml = generateAttributeTable(consensus.agreedAdditionalAttributes);
  const priceAnalysis = buildPriceAnalysis(rawProduct);
  const status = determineStatus(consensus, openaiResult, xaiResult);
  const corrections: CorrectionRecord[] = [...openaiResult.corrections, ...xaiResult.corrections, ...textCorrections];

  // Build new sections for media, links, and documents
  const mediaAssets = buildMediaAssets(rawProduct);
  const referenceLinks = buildReferenceLinks(rawProduct);
  const documentsSection = buildDocumentsSection(rawProduct);

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

  return {
    SF_Catalog_Id: rawProduct.SF_Catalog_Id,
    SF_Catalog_Name: rawProduct.SF_Catalog_Name,
    Primary_Attributes: primaryAttributes,
    Top_Filter_Attributes: topFilterAttributes,
    Additional_Attributes_HTML: additionalHtml,
    Price_Analysis: priceAnalysis,
    Media: mediaAssets,
    Reference_Links: referenceLinks,
    Documents: documentsSection,
    Field_AI_Reviews: fieldAIReviews,
    AI_Review: aiReview,
    Verification: verification,
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
 */
function buildMediaAssets(rawProduct: SalesforceIncomingProduct): {
  Primary_Image_URL: string;
  All_Image_URLs: string[];
  Image_Count: number;
} {
  const stockImages = rawProduct.Stock_Images || [];
  const imageUrls = stockImages.map(img => img.url).filter(url => url && url.trim() !== '');
  
  return {
    Primary_Image_URL: imageUrls.length > 0 ? imageUrls[0] : '',
    All_Image_URLs: imageUrls,
    Image_Count: imageUrls.length,
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
 * Build Documents Section - placeholder until AI evaluation is integrated
 */
function buildDocumentsSection(rawProduct: SalesforceIncomingProduct): {
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
  }>;
} {
  const incomingDocs = rawProduct.Documents || [];
  
  // Mark all as 'review' until AI evaluation is implemented
  const documents = incomingDocs.map(doc => ({
    url: doc.url,
    name: doc.name,
    type: doc.type,
    ai_recommendation: 'review' as const,
    relevance_score: 0,
    reason: 'Pending AI evaluation',
    extracted_info: undefined,
  }));
  
  return {
    total_count: documents.length,
    recommended_count: 0,
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
    Status: 'failed',
    Error_Message: errorMessage
  };
}

export default { verifyProductWithDualAI };
export const dualAIVerificationService = { verifyProductWithDualAI };
