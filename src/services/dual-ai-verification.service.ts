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
  getCategorySchemaWithContext,
  getCategoryListForPrompt,
  getDepartmentListForPrompt,
  getPrimaryAttributesForPrompt,
  getAllCategoriesWithTop15ForPrompt,
  getAllCategories,
  getAllDepartments,
  getCategoriesForDepartment,
  PRIMARY_ATTRIBUTE_FIELD_KEYS
} from '../config/category-config';
import { getCategorySchema as getCategoryAttributeSchema } from '../config/category-attributes';
import { 
  matchStyleToCategory, 
  getValidStylesForCategory,
  getValidTypesForCategory,
  getAllCategoriesWithStylesForPrompt, 
  getAllCategoriesWithTypesForPrompt
} from '../config/master-picklist-helpers';
import {
  validateStyleForCategory,
  validateAndCorrectLightingStyle,
  validateAndCorrectShowerStyle,
} from './style-validator.service';
import { isNAValue, sanitizeObjectForSalesforce } from '../utils/sanitization.utils';
import { 
  getTypeHierarchyExplanation 
} from '../config/type-prompts';
import { matchTypeToPicklist } from './type-matcher.service';
import { getTypeByName, getCategoryTypeMapping, isValidTypeForCategory } from '../picklist-master/03-types/type-config';
import { generateAttributeTable } from '../utils/html-generator';
import { cleanCustomerFacingText, cleanEncodingIssues, extractColorFinish } from '../utils/text-cleaner';
import { safeParseAIResponse, validateAIResponse } from '../utils/json-parser';
import { normalizeCategoryName, areCategoriesEquivalent } from '../config/category-aliases';
import * as lookups from '../config/lookups';
// import ErrorRecoveryService from './error-recovery.service'; // TODO: Integrate circuit breaker

// Style validation functions extracted to: ./style-validator.service.ts
// - isAestheticStyle, isLightingCategory, isShowerCategory, isValidShowerStyle
// - validateStyleForCategory, validateAndCorrectLightingStyle, validateAndCorrectShowerStyle

import logger from '../utils/logger';
import config from '../config';
import trackingService from './tracking.service';
import aiUsageTracker from './ai-usage-tracking.service';
import picklistMatcher from './picklist-matcher.service';
import { verificationAnalyticsService } from './verification-analytics.service';
import alertingService from './alerting.service';
import responseQualityService from './response-quality-analytics.service';
import tokenManagementService from './token-management.service';
import { errorMonitor } from './error-monitor.service';
import { FieldAnalytics } from '../models/field-analytics.model';
import { CategoryConfusion } from '../models/category-confusion.model';
import { catalogIndexService } from './catalog-index.service';
import { performProductResearch, formatResearchForPrompt, ResearchResult, FinalVerificationSearchResult, performDualAIWebSearch } from './research.service';
import { generateSEOTitle, SEOTitleInput } from './seo-title-generator.service';
import { failedMatchLogger } from './failed-match-logger.service';
import { inferMissingFields, FIELD_ALIASES, finalSweepTopFilterAttributes } from './smart-field-inference.service';
import { researchAttestationService } from './research-attestation.service';
import { FIELD_STATUS_CODES, ResearchAttestation } from '../types/research-attestation.types';

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
  determinedDepartment?: string;  // Stage 1: Department determination
  departmentConfidence?: number;   // Stage 1: Confidence in department choice
  departmentReasoning?: string;    // Stage 1: Why this department was chosen
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
  agreedDepartment: string | null;  // Consensus on department
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

// Sanitization functions extracted to: ../utils/sanitization.utils.ts
// - sanitizeForSalesforce, isNAValue, sanitizeObjectForSalesforce

/**
 * DATA COHERENCE VALIDATION
 * =========================
 * Validates that input data sources describe the SAME product before processing.
 * Catches cases where Web_Retailer data, Ferguson data, and images are from
 * completely different products (e.g., a pillow vs a light fixture).
 */

interface DataCoherenceResult {
  isCoherent: boolean;
  confidenceScore: number;  // 0-100, how confident we are data is coherent
  conflicts: DataConflict[];
  warnings: string[];
  recommendation: 'proceed' | 'proceed_with_warnings' | 'reject';
  primaryDataSource: 'ferguson' | 'web_retailer' | 'none';
}

interface DataConflict {
  type: 'category_domain' | 'brand_mismatch' | 'product_type' | 'dimension_mismatch' | 'price_mismatch' | 'url_brand_mismatch';
  severity: 'critical' | 'warning' | 'info';
  source1: string;
  source2: string;
  value1: string;
  value2: string;
  description: string;
}

// Category domain mapping - groups similar categories together
const CATEGORY_DOMAINS: Record<string, string[]> = {
  'LIGHTING': ['lighting', 'chandelier', 'pendant', 'sconce', 'wall sconce', 'ceiling', 'lamp', 'lantern', 'flush mount', 'vanity light', 'outdoor lighting', 'wall lights'],
  'PLUMBING': ['plumbing', 'faucet', 'toilet', 'sink', 'shower', 'bathtub', 'drain', 'valve'],
  'APPLIANCES': ['appliance', 'refrigerator', 'dishwasher', 'range', 'oven', 'microwave', 'washer', 'dryer', 'freezer'],
  'FURNITURE': ['furniture', 'chair', 'table', 'sofa', 'bed', 'desk', 'cabinet', 'dresser', 'mirror', 'pillow', 'rug', 'dining room'],
  'HVAC': ['hvac', 'air conditioner', 'heater', 'thermostat', 'fan', 'ventilation'],
  'HARDWARE': ['hardware', 'door', 'knob', 'handle', 'hinge', 'lock', 'cabinet hardware'],
  'TOYS': ['toy', 'toys', 'play set', 'baking play set', 'kids', 'children'],
};

/**
 * Determine which category domain a category/product type belongs to
 */
function getCategoryDomain(category: string | null | undefined): string | null {
  if (!category) return null;
  
  const normalizedCategory = category.toLowerCase().trim();
  
  for (const [domain, keywords] of Object.entries(CATEGORY_DOMAINS)) {
    if (keywords.some(keyword => normalizedCategory.includes(keyword))) {
      return domain;
    }
  }
  
  return null;
}

/**
 * Validate that input data sources are coherent (describe the same product)
 * Run this BEFORE expensive AI processing to catch garbage-in scenarios
 * 
 * DATA SOURCE TRUST HIERARCHY:
 * 1. Ferguson_Raw_Data / Ferguson_* - Primary trusted source
 * 2. Web_Retailer_* - Secondary, verify against Ferguson
 * 3. *_Legacy - UNTRUSTED, only use as tie-breaker when Ferguson vs Web_Retailer conflict
 */
function validateDataCoherence(rawProduct: SalesforceIncomingProduct): DataCoherenceResult {
  const conflicts: DataConflict[] = [];
  const warnings: string[] = [];
  let confidenceScore = 100;

  // Extract key fields from each source
  const webRetailer = {
    brand: rawProduct.Brand_Web_Retailer?.trim() || null,
    category: rawProduct.Web_Retailer_Category?.trim() || null,
    subCategory: rawProduct.Web_Retailer_SubCategory?.trim() || null,
    title: rawProduct.Product_Title_Web_Retailer?.trim() || null,
    model: rawProduct.Model_Number_Web_Retailer?.trim() || null,
    price: rawProduct.MSRP_Web_Retailer,
  };

  const ferguson = {
    brand: rawProduct.Ferguson_Brand?.trim() || null,
    category: rawProduct.Ferguson_Base_Category?.trim() || null,
    productType: rawProduct.Ferguson_Product_Type?.trim() || null,
    businessCategory: rawProduct.Ferguson_Business_Category?.trim() || null,
    title: rawProduct.Ferguson_Title?.trim() || null,
    model: rawProduct.Ferguson_Model_Number?.trim() || null,
    price: rawProduct.Ferguson_Price,
  };

  // LEGACY DATA - UNTRUSTED, only for category/brand disambiguation
  // These fields are NEVER used in verification responses - only to help
  // determine what the product IS (category/brand) when sources conflict
  const legacy = {
    brand: (rawProduct as any).Brand_Legacy?.trim() || null,
    category: (rawProduct as any).Category_Legacy?.trim() || null,
  };

  const referenceUrl = rawProduct.Reference_URL?.toLowerCase() || '';

  // ========================================================================
  // CHECK 1: Category Domain Mismatch (CRITICAL)
  // ========================================================================
  const webRetailerDomain = getCategoryDomain(webRetailer.category) || getCategoryDomain(webRetailer.subCategory);
  const fergusonDomain = getCategoryDomain(ferguson.category) || getCategoryDomain(ferguson.productType) || getCategoryDomain(ferguson.businessCategory);
  const legacyDomain = legacy.category ? getCategoryDomain(legacy.category) : null;

  if (webRetailerDomain && fergusonDomain && webRetailerDomain !== fergusonDomain) {
    // Use Legacy Category ONLY to determine which source has the correct PRODUCT TYPE
    // This is NOT used in the response - only to flag which source is contaminated
    let tieBreaker = '';
    if (legacyDomain) {
      if (legacyDomain === fergusonDomain) {
        tieBreaker = ` [LEGACY TIE-BREAKER: Aligns with Ferguson (${fergusonDomain}) - Web Retailer data likely contaminated]`;
      } else if (legacyDomain === webRetailerDomain) {
        tieBreaker = ` [LEGACY TIE-BREAKER: Aligns with Web Retailer (${webRetailerDomain}) - Ferguson data may be from different product]`;
      }
    }
    
    conflicts.push({
      type: 'category_domain',
      severity: 'critical',
      source1: 'Web_Retailer',
      source2: 'Ferguson',
      value1: `${webRetailer.category || webRetailer.subCategory} (${webRetailerDomain})`,
      value2: `${ferguson.category || ferguson.productType} (${fergusonDomain})`,
      description: `Web Retailer describes a ${webRetailerDomain} product, but Ferguson describes a ${fergusonDomain} product${tieBreaker}`
    });
    confidenceScore -= 50; // Major penalty
  }

  // ========================================================================
  // CHECK 2: Brand Mismatch (CRITICAL when different domains)
  // ========================================================================
  if (webRetailer.brand && ferguson.brand) {
    const normalizedWebBrand = webRetailer.brand.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedFergusonBrand = ferguson.brand.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedLegacyBrand = legacy.brand?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    
    if (normalizedWebBrand !== normalizedFergusonBrand && normalizedWebBrand.length > 2 && normalizedFergusonBrand.length > 2) {
      // Check if brands are completely different (not just formatting)
      const brandSimilarity = calculateStringSimilarity(normalizedWebBrand, normalizedFergusonBrand);
      
      if (brandSimilarity < 0.5) {
        // Use Legacy Brand ONLY to determine which source is correct (not for response)
        let brandTieBreaker = '';
        if (normalizedLegacyBrand) {
          const legacyMatchesFerguson = calculateStringSimilarity(normalizedLegacyBrand, normalizedFergusonBrand) > 0.7;
          const legacyMatchesWebRetailer = calculateStringSimilarity(normalizedLegacyBrand, normalizedWebBrand) > 0.7;
          
          if (legacyMatchesFerguson && !legacyMatchesWebRetailer) {
            brandTieBreaker = ` [LEGACY TIE-BREAKER: Aligns with Ferguson brand "${ferguson.brand}" - Web Retailer brand likely wrong]`;
          } else if (legacyMatchesWebRetailer && !legacyMatchesFerguson) {
            brandTieBreaker = ` [LEGACY TIE-BREAKER: Aligns with Web Retailer brand "${webRetailer.brand}" - verify Ferguson data]`;
          }
        }
        
        const severity = webRetailerDomain !== fergusonDomain ? 'critical' : 'warning';
        conflicts.push({
          type: 'brand_mismatch',
          severity,
          source1: 'Web_Retailer',
          source2: 'Ferguson',
          value1: webRetailer.brand,
          value2: ferguson.brand,
          description: `Completely different brands: "${webRetailer.brand}" vs "${ferguson.brand}"${brandTieBreaker}`
        });
        confidenceScore -= severity === 'critical' ? 40 : 15;
      }
    }
  }

  // ========================================================================
  // CHECK 3: Reference URL Domain Check (CRITICAL)
  // ========================================================================
  // Detect when Reference_URL is for a completely irrelevant site
  const irrelevantUrlPatterns = [
    { pattern: /melissa.*doug|let.*play/i, domain: 'TOYS', description: "Children's toy website" },
    { pattern: /bestbuy\.com.*baking|toy/i, domain: 'TOYS', description: "Toy product on BestBuy" },
    { pattern: /wayfair\.com.*pillow|bedding|rug/i, domain: 'FURNITURE', description: "Home textile product" },
    { pattern: /amazon\.com.*toy|game|baby/i, domain: 'TOYS', description: "Toy product on Amazon" },
  ];

  for (const urlPattern of irrelevantUrlPatterns) {
    if (urlPattern.pattern.test(referenceUrl)) {
      if (fergusonDomain && fergusonDomain !== urlPattern.domain) {
        conflicts.push({
          type: 'product_type',
          severity: 'critical',
          source1: 'Reference_URL',
          source2: 'Ferguson',
          value1: `${urlPattern.description} (${urlPattern.domain})`,
          value2: `${ferguson.productType || ferguson.category} (${fergusonDomain})`,
          description: `Reference URL points to a ${urlPattern.domain} product, but Ferguson data is for ${fergusonDomain}`
        });
        confidenceScore -= 40;
      }
    }
  }

  // ========================================================================
  // CHECK 3.5: Reference URL Domain vs Brand Mismatch (CRITICAL)
  // ========================================================================
  // Detect when Reference_URL domain contains a different brand name than Ferguson_Brand
  if (referenceUrl && ferguson.brand) {
    // Extract domain from URL
    let urlDomain = '';
    try {
      const url = new URL(referenceUrl);
      urlDomain = url.hostname.replace('www.', '').toLowerCase();
    } catch {
      // If URL parsing fails, try regex extraction
      const domainMatch = referenceUrl.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/i);
      urlDomain = domainMatch?.[1]?.toLowerCase() || '';
    }
    
    // Normalize brand for comparison
    const normalizedBrand = ferguson.brand.toLowerCase().replace(/[^a-z0-9]/g, '');
    const urlDomainNormalized = urlDomain.replace(/[^a-z0-9]/g, '');
    
    // Check if URL domain contains a DIFFERENT well-known brand
    const knownBrandPatterns = [
      { brand: 'weld-on', patterns: ['weldon', 'weld-on', 'weld_on'], domain: 'PLUMBING' },
      { brand: 'melissa-doug', patterns: ['melissa', 'doug'], domain: 'TOYS' },
      { brand: 'kitchenaid', patterns: ['kitchenaid'], domain: 'APPLIANCES' },
    ];
    
    for (const brandPattern of knownBrandPatterns) {
      const urlHasBrand = brandPattern.patterns.some(p => urlDomainNormalized.includes(p) || referenceUrl.toLowerCase().includes(p));
      const inputBrandMatches = brandPattern.patterns.some(p => normalizedBrand.includes(p));
      
      // If URL contains a known brand that doesn't match Ferguson brand
      if (urlHasBrand && !inputBrandMatches) {
        conflicts.push({
          type: 'url_brand_mismatch',
          severity: 'critical',
          source1: 'Reference_URL',
          source2: 'Ferguson_Brand',
          value1: `URL contains "${brandPattern.brand}" brand`,
          value2: ferguson.brand,
          description: `Reference URL is for "${brandPattern.brand}" but Ferguson data is for "${ferguson.brand}" - likely wrong URL provided`
        });
        confidenceScore -= 50; // Heavy penalty - this is a data input error
        break;
      }
    }
    
    // Generic check: URL path contains a brand/product identifier that doesn't match
    const urlPathBrandIndicators = referenceUrl.match(/\/([a-z0-9-]+)\/|\/product\/([a-z0-9-]+)/gi);
    if (urlPathBrandIndicators) {
      for (const indicator of urlPathBrandIndicators) {
        const cleanIndicator = indicator.replace(/[\/]/g, '').toLowerCase();
        // If URL path segment looks like a brand name (>4 chars) and doesn't match input brand
        if (cleanIndicator.length > 4 && !normalizedBrand.includes(cleanIndicator.substring(0, 4)) && !cleanIndicator.includes(normalizedBrand.substring(0, 4))) {
          // Check if it's a known competing brand
          const competingBrands = ['weldon', 'weld-on', 'moen', 'kohler', 'delta', 'melissa', 'doug'];
          if (competingBrands.some(cb => cleanIndicator.includes(cb))) {
            warnings.push(`Reference URL path "${indicator}" may indicate a different product than ${ferguson.brand}`);
            confidenceScore -= 15;
          }
        }
      }
    }
  }

  // ========================================================================
  // CHECK 4: Product Title Content Analysis (WARNING)
  // ========================================================================
  if (webRetailer.title && ferguson.title) {
    // Check if titles describe fundamentally different products
    const webTitleLower = webRetailer.title.toLowerCase();
    const fergusonTitleLower = ferguson.title.toLowerCase();
    
    // Product type keywords that should match
    const productKeywords = [
      ['sconce', 'wall light', 'lantern', 'wall mount'],
      ['chandelier', 'pendant', 'hanging'],
      ['faucet', 'tap'],
      ['pillow', 'cushion'],
      ['mirror'],
      ['refrigerator', 'fridge'],
      ['dishwasher'],
    ];
    
    for (const keywordGroup of productKeywords) {
      const webHas = keywordGroup.some(kw => webTitleLower.includes(kw));
      const fergusonHas = keywordGroup.some(kw => fergusonTitleLower.includes(kw));
      
      // If one has a specific product type keyword and the other doesn't have ANY from that group
      if ((webHas && !fergusonHas) || (!webHas && fergusonHas)) {
        // Check if titles share ANY meaningful words
        const webWords = webTitleLower.split(/\s+/).filter(w => w.length > 3);
        const fergusonWords = fergusonTitleLower.split(/\s+/).filter(w => w.length > 3);
        const commonWords = webWords.filter(w => fergusonWords.includes(w));
        
        if (commonWords.length < 2) {
          warnings.push(`Product titles have no common keywords: "${webRetailer.title}" vs "${ferguson.title}"`);
          confidenceScore -= 10;
        }
      }
    }
  }

  // ========================================================================
  // CHECK 5: Extreme Price Mismatch (WARNING)
  // ========================================================================
  if (webRetailer.price && ferguson.price) {
    const priceDiff = Math.abs(Number(webRetailer.price) - Number(ferguson.price));
    const avgPrice = (Number(webRetailer.price) + Number(ferguson.price)) / 2;
    const priceVariance = avgPrice > 0 ? (priceDiff / avgPrice) * 100 : 0;
    
    if (priceVariance > 200) { // More than 200% difference
      conflicts.push({
        type: 'price_mismatch',
        severity: 'warning',
        source1: 'Web_Retailer',
        source2: 'Ferguson',
        value1: String(webRetailer.price),
        value2: String(ferguson.price),
        description: `Extreme price difference: $${webRetailer.price} vs $${ferguson.price} (${priceVariance.toFixed(0)}% variance)`
      });
      confidenceScore -= 10;
    }
  }

  // ========================================================================
  // DETERMINE RECOMMENDATION
  // ========================================================================
  // ALWAYS trust Ferguson data first - Web Retailer data may be miscategorized
  // Never reject - always proceed with Ferguson as primary source
  const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
  const warningConflicts = conflicts.filter(c => c.severity === 'warning');

  let recommendation: DataCoherenceResult['recommendation'];
  let primaryDataSource: DataCoherenceResult['primaryDataSource'];

  // Always use Ferguson as primary data source when available
  primaryDataSource = ferguson.brand ? 'ferguson' : webRetailer.brand ? 'web_retailer' : 'none';

  if (criticalConflicts.length > 0 || warningConflicts.length > 0) {
    // Conflicts detected - proceed with warnings but ALWAYS use Ferguson data
    recommendation = 'proceed_with_warnings';
    for (const conflict of criticalConflicts) {
      warnings.push(`Data mismatch (ignored - using Ferguson): ${conflict.description}`);
    }
  } else {
    // No conflicts
    recommendation = 'proceed';
  }

  // Floor the confidence score at 0
  confidenceScore = Math.max(0, confidenceScore);

  return {
    isCoherent: conflicts.filter(c => c.severity === 'critical').length === 0,
    confidenceScore,
    conflicts,
    warnings,
    recommendation,
    primaryDataSource
  };
}

/**
 * Calculate similarity between two strings (0-1 scale)
 * Uses Levenshtein distance normalized by max length
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1;
  
  // Simple containment check
  if (longer.includes(shorter)) {
    return shorter.length / longer.length;
  }
  
  // Count common characters
  let matches = 0;
  const longerChars = longer.split('');
  for (const char of shorter) {
    const idx = longerChars.indexOf(char);
    if (idx !== -1) {
      matches++;
      longerChars.splice(idx, 1);
    }
  }
  
  return matches / longer.length;
}

/**
 * Find closest matching category using fuzzy string matching
 * Returns best match with confidence score, or null if no good match found
 * 
 * @param input - Category name suggested by AI
 * @param validCategories - List of valid categories from picklist
 * @param minConfidence - Minimum confidence threshold (default 0.7)
 * @returns Best match with confidence score, or null
 */
function findClosestCategory(
  input: string, 
  validCategories: string[], 
  minConfidence: number = 0.7
): { category: string; confidence: number } | null {
  if (!input || !validCategories || validCategories.length === 0) {
    return null;
  }
  
  const normalizedInput = input.toLowerCase().trim();
  
  let bestMatch: string | null = null;
  let bestScore = 0;
  
  for (const validCat of validCategories) {
    const normalizedValid = validCat.toLowerCase().trim();
    
    // Perfect match
    if (normalizedInput === normalizedValid) {
      return { category: validCat, confidence: 1.0 };
    }
    
    // Calculate similarity
    const score = calculateStringSimilarity(normalizedInput, normalizedValid);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = validCat;
    }
  }
  
  // Return best match if above threshold
  if (bestMatch && bestScore >= minConfidence) {
    return { category: bestMatch, confidence: bestScore };
  }
  
  return null;
}

/**
 * PHASE 2 TYPE VALIDATION: Fuzzy match type against valid types for category
 * Similar to findClosestCategory but for types
 * 
 * @param input - Type name from AI (might be typo or similar)
 * @param validTypes - Valid types for the category
 * @param minConfidence - Minimum similarity threshold (default 0.85 - stricter than category)
 * @returns Closest type match and confidence, or null
 */
function findClosestType(
  input: string,
  validTypes: string[],
  minConfidence: number = 0.85
): { type: string; confidence: number } | null {
  if (!input || !validTypes || validTypes.length === 0) {
    return null;
  }
  
  const normalizedInput = input.toLowerCase().trim();
  
  let bestMatch: string | null = null;
  let bestScore = 0;
  
  for (const validType of validTypes) {
    const normalizedValid = validType.toLowerCase().trim();
    
    // Perfect match
    if (normalizedInput === normalizedValid) {
      return { type: validType, confidence: 1.0 };
    }
    
    // Calculate similarity
    const score = calculateStringSimilarity(normalizedInput, normalizedValid);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = validType;
    }
  }
  
  // Return best match if above threshold
  if (bestMatch && bestScore >= minConfidence) {
    return { type: bestMatch, confidence: bestScore };
  }
  
  return null;
}

/**
 * Build error response for rejected data coherence
 */
function buildDataCoherenceErrorResponse(
  rawProduct: SalesforceIncomingProduct,
  coherenceResult: DataCoherenceResult,
  sessionId: string,
  _processingTime: number
): SalesforceVerificationResponse {
  const conflictDescriptions = coherenceResult.conflicts
    .map(c => `[${c.severity.toUpperCase()}] ${c.description}`)
    .join('; ');

  return {
    SF_Catalog_Id: rawProduct.SF_Catalog_Id || '',
    SF_Catalog_Name: rawProduct.SF_Catalog_Name || '',
    Primary_Attributes: {
      AI_Brand: '',
      AI_Brand_Lookup: '',
      AI_Product_Category: '',
      AI_Product_Category_Lookup: '',
      AI_Product_Family: '',
      AI_Product_Department: '',
      AI_Type: '',  // Will be populated by type matching when available
      AI_Type_Id: null,
      AI_Style: '',
      AI_Style_Lookup: null,
      AI_Color: '',
      AI_Finish: '',
      AI_Depth: '',
      AI_Width: '',
      AI_Height: '',
      AI_Weight: '',
      AI_MSRP: '',
      // Market_Value fields removed - no longer sent to Salesforce
      AI_Description: '',
      AI_Product_Title: '',
      // Details_Verified field removed - no longer sent to Salesforce
      AI_Features: '',
      AI_UPC_GTIN: '',
      AI_Model_Number: '',
      AI_Model_Alias: '',
      AI_Model_Parent: '',
      AI_Model_Variant_Number: '',
      AI_Total_Model_Variants: '',
    },
    Top_Filter_Attributes: {},
    Top_Filter_Attribute_Ids: {},
    Additional_Attributes_HTML: '',
    Price_Analysis: {
      msrp_web_retailer: 0,
      msrp_ferguson: 0
    },
    Media: {
      Primary_Image_URL: '',
      All_Image_URLs: [],
      Image_Count: 0
    },
    Reference_Links: {
      Ferguson_URL: rawProduct.Ferguson_URL || '',
      Web_Retailer_URL: rawProduct.Reference_URL || '',
      Manufacturer_URL: ''
    },
    Documents: {
      total_count: 0,
      recommended_count: 0,
      documents: []
    },
    Research_Analysis: {
      research_performed: false,
      total_resources_analyzed: 0,
      web_pages: [],
      pdfs: [],
      images: [],
      summary: {
        total_specs_extracted: 0,
        total_features_extracted: 0,
        success_rate: 0
      }
    },
    Received_Attributes_Confirmation: {
      web_retailer_specs_processed: [],
      ferguson_attributes_processed: [],
      summary: {
        total_received_from_web_retailer: 0,
        total_received_from_ferguson: 0,
        total_included_in_response: 0,
        total_in_additional_attributes: 0,
        total_not_used: 0
      }
    },
    Field_AI_Reviews: {},
    AI_Review: {
      openai: { reviewed: false, result: 'not_reviewed', confidence: 0, fields_verified: 0, fields_corrected: 0 },
      xai: { reviewed: false, result: 'not_reviewed', confidence: 0, fields_verified: 0, fields_corrected: 0 },
      consensus: {
        both_reviewed: false,
        agreement_status: 'no_review',
        agreement_percentage: 0,
        final_arbiter: undefined
      }
    },
    Verification: {
      verification_timestamp: new Date().toISOString(),
      verification_session_id: sessionId,
      verification_score: coherenceResult.confidenceScore,
      verification_status: 'data_conflict',
      data_sources_used: [],
      corrections_made: [],
      missing_fields: ['All fields - data coherence validation failed'],
      confidence_scores: {
        openai: 0,
        xai: 0,
        consensus: 0,
        category: 0
      },
      score_breakdown: {
        ai_confidence_component: 0,
        agreement_component: 0,
        category_bonus: 0,
        fields_agreed: 0,
        fields_disagreed: coherenceResult.conflicts.length,
        total_fields: 0,
        agreement_percentage: 0,
        data_source_scenario: 'data_conflict',
        research_performed: false,
        data_coherence_failure: {
          reason: 'Input data sources describe different products',
          conflicts: coherenceResult.conflicts,
          warnings: coherenceResult.warnings,
          recommendation: coherenceResult.recommendation
        }
      }
    },
    Attribute_Requests: [],
    Brand_Requests: [],
    Category_Requests: [],
    Style_Requests: [],
    Status: 'data_conflict',
    Error_Message: `DATA COHERENCE FAILURE: ${conflictDescriptions}`
  };
}

/**
 * Model Number Match Validation
 * =============================
 * CRITICAL: External data must match the requested model number EXACTLY.
 * If external data is for a different model/variant, it MUST NOT be used
 * as it could provide wrong attributes (e.g., wrong color for a different variant).
 */

interface ModelMatchResult {
  isExactMatch: boolean;
  requestedModel: string;
  foundModel: string | null;
  mismatchReason?: string;
  normalizedRequested: string;
  normalizedFound: string | null;
}

/**
 * Normalize a model number for comparison
 * Removes common prefixes, suffixes, hyphens, and converts to uppercase
 */
function normalizeModelNumber(model: string | null | undefined): string {
  if (!model) return '';
  
  // Convert to uppercase and trim
  let normalized = model.toUpperCase().trim();
  
  // Remove common brand prefixes (K- for Kohler, etc.)
  normalized = normalized.replace(/^[A-Z]-/, '');
  
  // Remove all hyphens, underscores, and spaces for comparison
  normalized = normalized.replace(/[-_\s]/g, '');
  
  return normalized;
}

/**
 * Check if two model numbers are an exact match
 * Takes into account common formatting variations
 */
function isModelNumberMatch(requestedModel: string, foundModel: string): boolean {
  const normalizedRequested = normalizeModelNumber(requestedModel);
  const normalizedFound = normalizeModelNumber(foundModel);
  
  if (!normalizedRequested || !normalizedFound) return false;
  
  // Exact match after normalization
  if (normalizedRequested === normalizedFound) return true;
  
  // Check if one contains the other (for variant suffixes like -BL, -CP)
  // But require at least 80% match to avoid false positives
  const minLength = Math.min(normalizedRequested.length, normalizedFound.length);
  const maxLength = Math.max(normalizedRequested.length, normalizedFound.length);
  
  if (minLength / maxLength < 0.8) return false;
  
  // Check if the base part matches (without variant suffix)
  const requestedBase = normalizedRequested.replace(/[A-Z]{1,3}$/, ''); // Remove 1-3 letter suffix
  const foundBase = normalizedFound.replace(/[A-Z]{1,3}$/, '');
  
  // Base must match exactly, and the suffix difference must be meaningful
  if (requestedBase === foundBase && requestedBase.length > 3) {
    // Same base model - this is actually a MISMATCH (different variants)
    // The suffix indicates different variants (e.g., -BL vs -CP = Black vs Chrome Polished)
    return false;
  }
  
  return false;
}

/**
 * Validate if external data matches the requested model number
 * Returns detailed match information for logging and decision making
 */
function validateExternalDataModel(
  requestedModel: string,
  externalModelNumber: string | null | undefined,
  rawData?: any
): ModelMatchResult {
  const normalizedRequested = normalizeModelNumber(requestedModel);
  const normalizedFound = normalizeModelNumber(externalModelNumber || '');
  
  // If no external model found, can't validate
  if (!externalModelNumber || !normalizedFound) {
    return {
      isExactMatch: false,
      requestedModel,
      foundModel: externalModelNumber || null,
      mismatchReason: 'No external model number found',
      normalizedRequested,
      normalizedFound: null
    };
  }
  
  // Check for Ferguson_Raw_Data failure indicators
  if (rawData) {
    const fergusonRaw = rawData.Ferguson_Raw_Data;
    if (fergusonRaw && typeof fergusonRaw === 'object') {
      // Check if Ferguson lookup explicitly failed
      if (fergusonRaw.success === false) {
        return {
          isExactMatch: false,
          requestedModel,
          foundModel: externalModelNumber,
          mismatchReason: fergusonRaw.error || 'Ferguson lookup failed - external data may be from wrong model',
          normalizedRequested,
          normalizedFound
        };
      }
      // Check if requested_model doesn't match
      if (fergusonRaw.requested_model && normalizeModelNumber(fergusonRaw.requested_model) !== normalizedRequested) {
        return {
          isExactMatch: false,
          requestedModel,
          foundModel: externalModelNumber,
          mismatchReason: `Ferguson searched for ${fergusonRaw.requested_model} but requested model is ${requestedModel}`,
          normalizedRequested,
          normalizedFound
        };
      }
    }
  }
  
  // Direct comparison
  if (isModelNumberMatch(requestedModel, externalModelNumber)) {
    return {
      isExactMatch: true,
      requestedModel,
      foundModel: externalModelNumber,
      normalizedRequested,
      normalizedFound
    };
  }
  
  // Determine why it doesn't match
  const requestedBase = normalizedRequested.replace(/[A-Z]{1,3}$/, '');
  const foundBase = normalizedFound.replace(/[A-Z]{1,3}$/, '');
  
  let mismatchReason = 'Model numbers do not match';
  if (requestedBase === foundBase) {
    const requestedSuffix = normalizedRequested.replace(requestedBase, '');
    const foundSuffix = normalizedFound.replace(foundBase, '');
    mismatchReason = `Different variant: requested suffix "${requestedSuffix || 'none'}" vs found suffix "${foundSuffix || 'none'}" - likely different color/finish`;
  }
  
  return {
    isExactMatch: false,
    requestedModel,
    foundModel: externalModelNumber,
    mismatchReason,
    normalizedRequested,
    normalizedFound
  };
}

/**
 * Data source scenario detection
 * Determines what data sources are available and what research strategy to use
 */
interface DataSourceAnalysis {
  hasWebRetailerData: boolean;
  hasFergusonData: boolean;
  scenario: 'both_sources' | 'web_retailer_only' | 'ferguson_only' | 'no_sources';
  requiresExternalResearch: boolean;
  requiresConfirmationResearch: boolean;
  availableUrls: string[];
  // Model validation
  modelValidation?: ModelMatchResult;
  externalDataTrusted: boolean;  // False if model mismatch detected
  availableDocuments: string[];
  availableImages: string[];
  webRetailerFieldCount: number;
  fergusonFieldCount: number;
}

/**
 * Analyze incoming data to determine available sources and research strategy
 */
function analyzeDataSources(rawProduct: SalesforceIncomingProduct): DataSourceAnalysis {
  // Count meaningful Web Retailer fields (not null/empty)
  const webRetailerFields = [
    rawProduct.Brand_Web_Retailer,
    rawProduct.Model_Number_Web_Retailer,
    rawProduct.MSRP_Web_Retailer,
    rawProduct.Product_Title_Web_Retailer,
    rawProduct.Product_Description_Web_Retailer,
    rawProduct.Web_Retailer_Category,
    rawProduct.Web_Retailer_SubCategory,
    rawProduct.Depth_Web_Retailer,
    rawProduct.Width_Web_Retailer,
    rawProduct.Height_Web_Retailer,
  ];
  const webRetailerFieldCount = webRetailerFields.filter(f => f && typeof f === 'string' && f.trim() !== '').length;
  const webRetailerSpecsCount = (rawProduct.Web_Retailer_Specs || []).length;
  const hasWebRetailerData = webRetailerFieldCount >= 2 || webRetailerSpecsCount > 0;

  // Count meaningful Ferguson fields (not null/empty)
  const fergusonFields = [
    rawProduct.Ferguson_Brand,
    rawProduct.Ferguson_Model_Number,
    rawProduct.Ferguson_Price,
    rawProduct.Ferguson_Title,
    rawProduct.Ferguson_Description,
    rawProduct.Ferguson_Product_Type,
    rawProduct.Ferguson_Width,
    rawProduct.Ferguson_Height,
    rawProduct.Ferguson_Depth,
  ];
  const fergusonFieldCount = fergusonFields.filter(f => f && typeof f === 'string' && f.trim() !== '').length;
  const fergusonAttributesCount = (rawProduct.Ferguson_Attributes || []).length;
  const hasFergusonData = fergusonFieldCount >= 2 || fergusonAttributesCount > 0;

  // Collect available URLs for research (support both Reference_URL and Manufacturer_URL)
  const referenceUrlLocal = rawProduct.Reference_URL || rawProduct.Manufacturer_URL || null;
  const availableUrls: string[] = [];
  if (rawProduct.Ferguson_URL && rawProduct.Ferguson_URL.startsWith('http')) {
    availableUrls.push(rawProduct.Ferguson_URL);
  }
  if (referenceUrlLocal && referenceUrlLocal.startsWith('http')) {
    availableUrls.push(referenceUrlLocal);
  }

  // Collect documents
  const availableDocuments = (rawProduct.Documents || [])
    .map(d => typeof d === 'string' ? d : d?.url)
    .filter((url): url is string => !!url && url.startsWith('http'));

  // Collect images
  const availableImages = (rawProduct.Stock_Images || [])
    .map(i => typeof i === 'string' ? i : i?.url)
    .filter((url): url is string => !!url && url.startsWith('http'));

  // Determine scenario and research requirements
  let scenario: DataSourceAnalysis['scenario'];
  let requiresExternalResearch: boolean;
  let requiresConfirmationResearch: boolean;

  if (hasWebRetailerData && hasFergusonData) {
    scenario = 'both_sources';
    requiresExternalResearch = false; // Data can be cross-validated
    requiresConfirmationResearch = false; // Both sources present = validation possible
  } else if (hasWebRetailerData && !hasFergusonData) {
    scenario = 'web_retailer_only';
    requiresExternalResearch = false; // Have data to use
    requiresConfirmationResearch = true; // Need to confirm single source
  } else if (!hasWebRetailerData && hasFergusonData) {
    scenario = 'ferguson_only';
    requiresExternalResearch = false; // Have data to use
    requiresConfirmationResearch = true; // Need to confirm single source
  } else {
    scenario = 'no_sources';
    requiresExternalResearch = true; // MUST search externally
    requiresConfirmationResearch = false; // Nothing to confirm
  }

  // CRITICAL: Validate external data model number matches requested model
  // If there's a mismatch, external data MUST NOT be trusted for variant-specific attributes
  const requestedModel = rawProduct.SF_Catalog_Name || rawProduct.Model_Number_Web_Retailer || '';
  // Check multiple possible locations for Ferguson model number
  const externalModel = rawProduct.Ferguson_Model_Number 
    || (rawProduct as any).Ferguson_Raw_Data?.product?.model_number 
    || null;
  
  // Also check for Ferguson_Raw_Data which may contain error information
  const modelValidation = validateExternalDataModel(
    requestedModel,
    externalModel,
    rawProduct as any  // May contain Ferguson_Raw_Data
  );
  
  // External data is trusted only if model numbers match exactly
  const externalDataTrusted = modelValidation.isExactMatch;
  
  // If model mismatch detected and we have Ferguson data, mark it as untrusted
  if (!externalDataTrusted && hasFergusonData) {
    logger.warn('MODEL MISMATCH DETECTED - External data NOT trusted', {
      requestedModel,
      foundModel: modelValidation.foundModel,
      mismatchReason: modelValidation.mismatchReason,
      normalizedRequested: modelValidation.normalizedRequested,
      normalizedFound: modelValidation.normalizedFound,
      impact: 'External data will NOT be used for color, finish, or variant-specific attributes'
    });
  }

  return {
    hasWebRetailerData,
    hasFergusonData,
    scenario,
    requiresExternalResearch,
    requiresConfirmationResearch,
    availableUrls,
    availableDocuments,
    availableImages,
    webRetailerFieldCount,
    fergusonFieldCount,
    modelValidation,
    externalDataTrusted
  };
}

/**
 * Standard field value markers for different scenarios
 * Updated to use Research Attestation System codes
 */
const FIELD_NOT_FOUND = FIELD_STATUS_CODES.PROCUREMENT_NO_RESULTS; // AI completed all research steps but couldn't find data
const FIELD_NOT_APPLICABLE = 'Not Applicable'; // Field doesn't apply to this product type
const FIELD_RESEARCH_INCOMPLETE = FIELD_STATUS_CODES.RESEARCH_INCOMPLETE; // Research couldn't be completed
const FIELD_RESEARCH_ERROR = FIELD_STATUS_CODES.RESEARCH_ERROR; // Research had errors requiring human review

// sanitizeNumericForSalesforce function removed - no longer needed after Market_Value fields removal

/**
 * Mark an empty field value with the appropriate marker
 * Updated to use Research Attestation System status codes
 * 
 * @param value - The field value to check
 * @param fieldName - The name of the field (for determining if N/A is appropriate)
 * @param productCategory - The product category (for determining if field is applicable)
 * @param attemptedResearch - Whether research was attempted for this field
 * @param researchAttestation - Optional attestation object with full research details
 */
export function markEmptyField(
  value: string | number | null | undefined,
  fieldName: string,
  productCategory?: string,
  attemptedResearch: boolean = false,
  researchAttestation?: ResearchAttestation
): string {
  // If we have a valid value, return it
  if (value !== null && value !== undefined && String(value).trim() !== '') {
    const strValue = String(value).trim();
    // Don't modify existing status codes
    if (strValue === FIELD_NOT_FOUND || 
        strValue === FIELD_NOT_APPLICABLE ||
        strValue === FIELD_RESEARCH_INCOMPLETE ||
        strValue === FIELD_RESEARCH_ERROR) {
      return strValue;
    }
    return strValue;
  }
  
  // Fields that are typically not applicable to certain categories
  const categoryFieldApplicability: Record<string, string[]> = {
    // Bathroom products typically don't have these
    'Bathroom Faucet': ['cooling_capacity_btu', 'number_of_burners', 'oven_capacity', 'defrost_type', 'ice_maker'],
    'Toilets': ['cooling_capacity_btu', 'number_of_burners', 'oven_capacity', 'defrost_type'],
    'Sinks': ['cooling_capacity_btu', 'number_of_burners', 'oven_capacity', 'defrost_type'],
    // Kitchen appliances
    'Ranges': ['gpm', 'flush_type', 'bowl_shape'],
    'Refrigerators': ['number_of_burners', 'gpm', 'flush_type', 'oven_capacity'],
    'Dishwashers': ['number_of_burners', 'gpm', 'flush_type', 'cooling_capacity_btu'],
  };
  
  // Check if field is not applicable to this category
  if (productCategory) {
    const notApplicableFields = categoryFieldApplicability[productCategory] || [];
    const normalizedFieldName = fieldName.toLowerCase().replace(/[_\s]/g, '_');
    if (notApplicableFields.some(f => normalizedFieldName.includes(f.toLowerCase()))) {
      return FIELD_NOT_APPLICABLE;
    }
  }
  
  // If we have a full attestation, use its status
  if (researchAttestation) {
    switch (researchAttestation.status) {
      case 'FULLY_RESEARCHED':
        return FIELD_NOT_FOUND; // "Procurement No Results"
      case 'INCOMPLETE':
        return FIELD_RESEARCH_INCOMPLETE; // "Research Incomplete - Pending"
      case 'ERROR':
        return FIELD_RESEARCH_ERROR; // "Research Error - Manual Review Required"
      default:
        // If research was at least attempted, use incomplete status
        if (researchAttestation.completedSteps > 0) {
          return FIELD_RESEARCH_INCOMPLETE;
        }
    }
  }
  
  // Legacy: If research was attempted but no attestation provided
  if (attemptedResearch) {
    return FIELD_RESEARCH_INCOMPLETE; // Changed from FIELD_NOT_FOUND to be more accurate
  }
  
  // Default: return empty string (legacy behavior for fields that haven't been researched)
  return '';
}

/**
 * Smart Disagreement Resolution
 * Intelligently resolves AI disagreements based on field type and context
 * Returns the resolved value and which AI was chosen (or 'combined' for merged values)
 */
interface DisagreementResolution {
  resolvedValue: any;
  winner: 'openai' | 'xai' | 'combined' | 'not_found';
  reason: string;
}

/**
 * Fields that can be combined rather than choosing one
 */
const COMBINABLE_FIELDS = new Set(['features_list', 'features']);

/**
 * Text fields that don't need exact consensus - accept the higher-quality one
 */
const TEXT_FIELDS = new Set(['description', 'product_title', 'details', 'features_list', 'features']);

/**
 * Fields that should ONLY use Ferguson data (too error-prone from AI inference)
 */
const FERGUSON_ONLY_FIELDS = new Set(['model_variant_number', 'total_model_variants']);

/**
 * Resolve a disagreement between AI responses intelligently
 */
function resolveDisagreementSmart(
  fieldName: string,
  openaiValue: any,
  xaiValue: any,
  _category: string,
  hasFergusonData: boolean,
  researchContext?: ResearchResult
): DisagreementResolution {
  const normalizedField = fieldName.toLowerCase().replace(/[_\s]/g, '_');
  
  // 1. FERGUSON-ONLY FIELDS: Model variants should only come from Ferguson data
  if (FERGUSON_ONLY_FIELDS.has(normalizedField)) {
    if (!hasFergusonData) {
      return {
        resolvedValue: FIELD_NOT_FOUND,
        winner: 'not_found',
        reason: `${fieldName} should only come from Ferguson data which is not available`
      };
    }
    // If we have Ferguson data, one AI might have extracted it correctly
    const validOpenai = openaiValue && openaiValue !== FIELD_NOT_FOUND && openaiValue !== 'Not Found';
    const validXai = xaiValue && xaiValue !== FIELD_NOT_FOUND && xaiValue !== 'Not Found';
    if (validOpenai && !validXai) {
      return { resolvedValue: openaiValue, winner: 'openai', reason: 'OpenAI extracted from Ferguson data' };
    }
    if (validXai && !validOpenai) {
      return { resolvedValue: xaiValue, winner: 'xai', reason: 'xAI extracted from Ferguson data' };
    }
    return {
      resolvedValue: FIELD_NOT_FOUND,
      winner: 'not_found',
      reason: `${fieldName} could not be reliably determined from Ferguson data`
    };
  }

  // 2. TEXT FIELDS: Accept OpenAI's version by default (usually more detailed)
  //    Unless one references a wrong model number
  if (TEXT_FIELDS.has(normalizedField)) {
    // Check if either contains a different model number (wrong reference)
    // Note: Could add sophisticated model number validation here in the future
    
    // For now, prefer OpenAI for text generation (tends to be more detailed)
    // But could add more sophisticated checks here
    const validOpenai = openaiValue && openaiValue !== FIELD_NOT_FOUND;
    const validXai = xaiValue && xaiValue !== FIELD_NOT_FOUND;
    
    if (validOpenai && validXai) {
      // Both have values - for features_list, combine them
      if (COMBINABLE_FIELDS.has(normalizedField)) {
        const combined = combineFeatureLists(openaiValue, xaiValue);
        return { resolvedValue: combined, winner: 'combined', reason: 'Combined features from both AIs' };
      }
      // For other text fields, prefer OpenAI
      return { resolvedValue: openaiValue, winner: 'openai', reason: 'OpenAI text accepted (text fields allow variation)' };
    }
    if (validOpenai) {
      return { resolvedValue: openaiValue, winner: 'openai', reason: 'Only OpenAI provided text' };
    }
    if (validXai) {
      return { resolvedValue: xaiValue, winner: 'xai', reason: 'Only xAI provided text' };
    }
    return { resolvedValue: FIELD_NOT_FOUND, winner: 'not_found', reason: 'Neither AI provided text' };
  }

  // 3. STYLE/PRODUCT_STYLE: Match against picklist, prefer the one that matches
  if (normalizedField === 'style' || normalizedField === 'product_style') {
    const openaiMatch = picklistMatcher.matchStyle(String(openaiValue || ''));
    const xaiMatch = picklistMatcher.matchStyle(String(xaiValue || ''));
    
    // If one matches the picklist better, use it
    if (openaiMatch.matched && !xaiMatch.matched) {
      return { resolvedValue: openaiMatch.matchedValue?.style_name || openaiValue, winner: 'openai', reason: 'OpenAI style matches picklist' };
    }
    if (xaiMatch.matched && !openaiMatch.matched) {
      return { resolvedValue: xaiMatch.matchedValue?.style_name || xaiValue, winner: 'xai', reason: 'xAI style matches picklist' };
    }
    if (openaiMatch.similarity > xaiMatch.similarity) {
      return { resolvedValue: openaiValue, winner: 'openai', reason: `OpenAI style closer to picklist (${(openaiMatch.similarity * 100).toFixed(0)}% vs ${(xaiMatch.similarity * 100).toFixed(0)}%)` };
    }
    if (xaiMatch.similarity > openaiMatch.similarity) {
      return { resolvedValue: xaiValue, winner: 'xai', reason: `xAI style closer to picklist (${(xaiMatch.similarity * 100).toFixed(0)}% vs ${(openaiMatch.similarity * 100).toFixed(0)}%)` };
    }
    // Neither matches well - use OpenAI's value
    return { resolvedValue: openaiValue, winner: 'openai', reason: 'Neither style matches picklist, using OpenAI' };
  }

  // 4. TYPE FIELD: One might be semantic (product type) vs structural (single/double)
  //    Prefer the semantic product type description
  if (normalizedField === 'type') {
    const quantityTerms = ['single', 'double', 'triple', 'quad', 'dual', 'multi'];
    const openaiIsQuantity = quantityTerms.some(t => String(openaiValue || '').toLowerCase().includes(t));
    const xaiIsQuantity = quantityTerms.some(t => String(xaiValue || '').toLowerCase().includes(t));
    
    // If one is a quantity term and other is semantic, prefer semantic
    if (xaiIsQuantity && !openaiIsQuantity && openaiValue) {
      return { resolvedValue: openaiValue, winner: 'openai', reason: 'OpenAI provides semantic type, xAI provided quantity' };
    }
    if (openaiIsQuantity && !xaiIsQuantity && xaiValue) {
      return { resolvedValue: xaiValue, winner: 'xai', reason: 'xAI provides semantic type, OpenAI provided quantity' };
    }
    // Both are semantic or both are quantity - use OpenAI
    return { resolvedValue: openaiValue || xaiValue, winner: openaiValue ? 'openai' : 'xai', reason: 'Type field - using available value' };
  }

  // 5. ONE AI HAS VALUE, OTHER DOESN'T: Use the one that has a value
  const validOpenai = openaiValue && openaiValue !== FIELD_NOT_FOUND && openaiValue !== 'Not Found' && openaiValue !== '';
  const validXai = xaiValue && xaiValue !== FIELD_NOT_FOUND && xaiValue !== 'Not Found' && xaiValue !== '';
  
  if (validOpenai && !validXai) {
    return { resolvedValue: openaiValue, winner: 'openai', reason: 'Only OpenAI found a value' };
  }
  if (validXai && !validOpenai) {
    return { resolvedValue: xaiValue, winner: 'xai', reason: 'Only xAI found a value' };
  }
  if (!validOpenai && !validXai) {
    return { resolvedValue: FIELD_NOT_FOUND, winner: 'not_found', reason: 'Neither AI found a value' };
  }

  // 6. NUMERIC FIELDS: Prefer the one that looks more valid
  const numOpenai = parseFloat(String(openaiValue).replace(/[^\d.-]/g, ''));
  const numXai = parseFloat(String(xaiValue).replace(/[^\d.-]/g, ''));
  
  if (!isNaN(numOpenai) && !isNaN(numXai)) {
    // Both are numeric - prefer the one that seems more reasonable
    // For now, just use OpenAI's
    return { resolvedValue: openaiValue, winner: 'openai', reason: 'Numeric disagreement - using OpenAI' };
  }

  // 7. DEFAULT: Check if we can find this in research context
  if (researchContext) {
    const researchValue = findValueInResearch(fieldName, researchContext);
    if (researchValue) {
      // Determine which AI value matches research
      const matchesOpenai = valuesMatchLoose(researchValue, openaiValue);
      const matchesXai = valuesMatchLoose(researchValue, xaiValue);
      
      if (matchesOpenai && !matchesXai) {
        return { resolvedValue: openaiValue, winner: 'openai', reason: 'OpenAI matches research data' };
      }
      if (matchesXai && !matchesOpenai) {
        return { resolvedValue: xaiValue, winner: 'xai', reason: 'xAI matches research data' };
      }
    }
  }

  // 8. FINAL FALLBACK: Use OpenAI's value (it's generally more conservative)
  return { resolvedValue: openaiValue, winner: 'openai', reason: 'Default - using OpenAI value' };
}

/**
 * Combine feature lists from two sources, removing duplicates
 */
function combineFeatureLists(openaiFeatures: string, xaiFeatures: string): string {
  // Extract <li> items from both
  const extractItems = (html: string): string[] => {
    const matches = html.match(/<li>(.*?)<\/li>/gi) || [];
    return matches.map(m => m.replace(/<\/?li>/gi, '').trim().toLowerCase());
  };
  
  const openaiItems = extractItems(openaiFeatures);
  const xaiItems = extractItems(xaiFeatures);
  
  // Combine unique items (use Set for deduplication based on similarity)
  const allItems: string[] = [];
  const seen = new Set<string>();
  
  for (const item of [...openaiItems, ...xaiItems]) {
    const normalized = item.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Check if similar item already exists
    let isDuplicate = false;
    for (const seenItem of seen) {
      if (normalized.includes(seenItem) || seenItem.includes(normalized)) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate && normalized.length > 5) {
      seen.add(normalized);
      allItems.push(item);
    }
  }
  
  // Rebuild HTML list - capitalize first letter of each item
  const formattedItems = allItems.map(item => 
    item.charAt(0).toUpperCase() + item.slice(1)
  );
  
  return `<ul>${formattedItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
}

/**
 * Try to find a value in research results
 */
function findValueInResearch(fieldName: string, research: ResearchResult): string | null {
  const normalizedField = fieldName.toLowerCase().replace(/[_\s]/g, '');
  
  // Check combined specifications
  const specs = research.combinedSpecifications || {};
  for (const [specName, specValue] of Object.entries(specs)) {
    const normalizedSpecName = specName.toLowerCase().replace(/[_\s]/g, '');
    if (normalizedSpecName.includes(normalizedField) || normalizedField.includes(normalizedSpecName)) {
      return specValue;
    }
  }
  
  // Check image analysis for color/finish
  if (normalizedField.includes('color') || normalizedField.includes('finish')) {
    for (const img of research.images || []) {
      if (img.detectedColor) return img.detectedColor;
    }
  }
  
  // Check image analysis for product type
  if (normalizedField === 'type' || normalizedField === 'producttype') {
    for (const img of research.images || []) {
      if (img.productType) return img.productType;
    }
  }
  
  return null;
}

/**
 * Loose value matching for comparison
 */
function valuesMatchLoose(a: any, b: any): boolean {
  if (!a || !b) return false;
  const strA = String(a).toLowerCase().trim();
  const strB = String(b).toLowerCase().trim();
  return strA === strB || strA.includes(strB) || strB.includes(strA);
}

// sanitizeObjectForSalesforce extracted to: ../utils/sanitization.utils.ts

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
  
  // PHASE 0: Analyze data sources to determine research strategy
  const dataSourceAnalysis = analyzeDataSources(rawProduct);
  
  // PHASE 0.1: Validate data coherence - ensure input sources describe the SAME product
  const coherenceResult = validateDataCoherence(rawProduct);
  
  if (coherenceResult.recommendation === 'reject') {
    // Data sources are irreconcilable - return error response
    logger.error('DATA COHERENCE FAILURE - Rejecting verification request', {
      sessionId: verificationSessionId,
      trackingId,
      productId: rawProduct.SF_Catalog_Id,
      modelNumber: rawProduct.SF_Catalog_Name || rawProduct.Model_Number_Web_Retailer,
      coherenceScore: coherenceResult.confidenceScore,
      conflicts: coherenceResult.conflicts.map(c => ({
        type: c.type,
        severity: c.severity,
        description: c.description
      })),
      recommendation: coherenceResult.recommendation
    });
    
    const errorResponse = buildDataCoherenceErrorResponse(
      rawProduct,
      coherenceResult,
      verificationSessionId,
      Date.now() - startTime
    );
    
    // Track the failure
    await trackingService.completeTrackingWithError(
      trackingId, 
      new Error(`Data coherence failure: ${coherenceResult.conflicts.map(c => c.description).join('; ')}`),
      400
    );
    
    return errorResponse;
  }
  
  // Log coherence warnings if any
  if (coherenceResult.warnings.length > 0 || coherenceResult.conflicts.length > 0) {
    logger.warn('Data coherence warnings detected', {
      sessionId: verificationSessionId,
      productId: rawProduct.SF_Catalog_Id,
      coherenceScore: coherenceResult.confidenceScore,
      recommendation: coherenceResult.recommendation,
      primaryDataSource: coherenceResult.primaryDataSource,
      conflicts: coherenceResult.conflicts.length,
      warnings: coherenceResult.warnings
    });
  }
  
  // Normalize Reference_URL - support both Reference_URL and Manufacturer_URL as input
  const referenceUrl = rawProduct.Reference_URL || rawProduct.Manufacturer_URL || null;
  
  // Check if URL brand mismatch detected (used to warn AI, but NOT to skip URLs)
  const hasUrlBrandMismatch = coherenceResult.conflicts.some(c => c.type === 'url_brand_mismatch');
  if (hasUrlBrandMismatch) {
    logger.info('URL brand mismatch detected - AI will analyze all data to determine correctness', {
      sessionId: verificationSessionId,
      referenceUrl,
      inputBrand: rawProduct.Ferguson_Brand || rawProduct.Brand_Web_Retailer,
      reason: 'Passing all data to AI for intelligent analysis'
    });
  }
  
  logger.info('Starting dual AI verification', {
    sessionId: verificationSessionId,
    trackingId,
    productId: rawProduct.SF_Catalog_Id,
    modelNumber: rawProduct.Model_Number_Web_Retailer || rawProduct.SF_Catalog_Name,
    dataSourceScenario: dataSourceAnalysis.scenario,
    hasWebRetailerData: dataSourceAnalysis.hasWebRetailerData,
    hasFergusonData: dataSourceAnalysis.hasFergusonData,
    requiresExternalResearch: dataSourceAnalysis.requiresExternalResearch,
    requiresConfirmationResearch: dataSourceAnalysis.requiresConfirmationResearch,
    availableUrls: dataSourceAnalysis.availableUrls.length,
    availableDocuments: dataSourceAnalysis.availableDocuments.length,
    availableImages: dataSourceAnalysis.availableImages.length
  });

  try {
    // PHASE 0.5: Pre-fetch research data if needed BEFORE AI analysis
    // This ensures AIs have external data when no/limited sources are available
    let preResearchResult: ResearchResult | null = null;
    let preResearchContext: string | undefined;
    
    const shouldPreResearch = dataSourceAnalysis.requiresExternalResearch || 
                              dataSourceAnalysis.requiresConfirmationResearch ||
                              dataSourceAnalysis.availableUrls.length > 0; // Always scrape available URLs
    
    // Use all URLs - let the AI reason about which data is correct
    // DO NOT skip URLs - the AI needs all data to make intelligent decisions
    const fergusonUrlToUse = rawProduct.Ferguson_URL || null;
    
    if (shouldPreResearch && (config.research?.enabled !== false)) {
      logger.info('PHASE 0.5: Pre-fetching external research data (ALL sources)', {
        sessionId: verificationSessionId,
        fergusonUrl: fergusonUrlToUse,
        referenceUrl,
        hasUrlBrandMismatch,
        reason: dataSourceAnalysis.requiresExternalResearch 
          ? 'No source data - external research required'
          : dataSourceAnalysis.requiresConfirmationResearch
            ? 'Single source data - confirmation research required'
            : 'URLs available for additional validation',
        scenario: dataSourceAnalysis.scenario,
        note: hasUrlBrandMismatch ? 'AI will analyze conflicting data to determine correctness' : undefined
      });
      
      try {
        preResearchResult = await performProductResearch(
          fergusonUrlToUse,
          referenceUrl,
          dataSourceAnalysis.availableDocuments,
          dataSourceAnalysis.availableImages,
          { 
            maxDocuments: config.research?.maxDocuments || 5,
            maxImages: config.research?.maxImages || 3,
            skipImages: config.research?.enableImageAnalysis === false 
          }
        );
        
        preResearchContext = formatResearchForPrompt(preResearchResult);
        
        logger.info('Pre-research completed', {
          sessionId: verificationSessionId,
          webPagesSuccess: preResearchResult.webPages.filter(p => p.success).length,
          documentsSuccess: preResearchResult.documents.filter(d => d.success).length,
          imagesSuccess: preResearchResult.images.filter(i => i.success).length,
          totalSpecs: Object.keys(preResearchResult.combinedSpecifications).length,
          totalFeatures: preResearchResult.combinedFeatures.length
        });
      } catch (preResearchError) {
        logger.warn('Pre-research failed, continuing with available data', {
          sessionId: verificationSessionId,
          error: preResearchError instanceof Error ? preResearchError.message : 'Unknown error'
        });
      }
    }
    
    // PHASE 0.9: TOKEN MANAGEMENT - Detect and handle token overflow risks
    // Get category schema first (needed for spec prioritization)
    const initialCategoryGuess = rawProduct.Web_Retailer_Category || 
                                 rawProduct.Ferguson_Base_Category || 
                                 rawProduct.Ferguson_Product_Type || 
                                 'Bath Tub'; // Default to a valid category if unknown
    const categorySchemaForTokens = getCategoryAttributeSchema(initialCategoryGuess) || getCategoryAttributeSchema('Bath Tub')!;
    
    // Estimate token count BEFORE building prompts
    const tokenEstimate = tokenManagementService.estimateTokenCount(
      rawProduct,
      categorySchemaForTokens,
      preResearchResult || undefined
    );
    
    logger.info('TOKEN ESTIMATE', {
      sessionId: verificationSessionId,
      estimatedTokens: tokenEstimate.estimatedTokens,
      riskLevel: tokenEstimate.riskLevel,
      exceedsLimit: tokenEstimate.exceedsLimit,
      breakdown: tokenEstimate.breakdown,
      recommendation: tokenEstimate.recommendation,
      webRetailerSpecsCount: rawProduct.Web_Retailer_Specs?.length || 0,
      fergusonAttributesCount: rawProduct.Ferguson_Attributes?.length || 0,
    });
    
    // Apply smart truncation if needed (trigger at medium risk too, not just high/critical)
    let processedProduct = rawProduct;
    let processedResearch = preResearchResult;
    
    if (tokenEstimate.riskLevel === 'medium' || tokenEstimate.riskLevel === 'high' || tokenEstimate.riskLevel === 'critical') {
      logger.warn('⚠️ TOKEN RISK DETECTED - Applying smart truncation', {
        sessionId: verificationSessionId,
        estimatedTokens: tokenEstimate.estimatedTokens,
        riskLevel: tokenEstimate.riskLevel,
        productId: rawProduct.SF_Catalog_Id,
        modelNumber: rawProduct.Model_Number_Web_Retailer,
      });
      
      const truncationResult = tokenManagementService.applySmartTruncation(
        rawProduct,
        categorySchemaForTokens,
        preResearchResult,
        tokenEstimate
      );
      
      processedProduct = truncationResult.truncatedProduct;
      processedResearch = truncationResult.truncatedResearch;
      
      logger.info('✅ Smart truncation applied successfully', {
        sessionId: verificationSessionId,
        originalTokens: truncationResult.result.originalTokens,
        finalTokens: truncationResult.result.finalTokens,
        tokensSaved: truncationResult.result.tokensSaved,
        truncatedSections: truncationResult.result.truncatedSections,
        retainedSpecsCount: truncationResult.result.retainedSpecsCount,
        removedSpecsCount: truncationResult.result.removedSpecsCount,
      });
      
      // Update research context if research was truncated
      if (truncationResult.result.truncatedSections.includes('Research_Results') && processedResearch) {
        preResearchContext = formatResearchForPrompt(processedResearch);
      }
    } else {
      logger.info('✅ Token count is safe - no truncation needed', {
        sessionId: verificationSessionId,
        estimatedTokens: tokenEstimate.estimatedTokens,
        riskLevel: tokenEstimate.riskLevel,
      });
    }
    
    // PHASE 1: Three-Stage Hierarchical AI Analysis
    logger.info('PHASE 1: Three-Stage Hierarchical AI Analysis - STAGE 1 (Department) + STAGE 2 (Category) + STAGE 3 (Details)', {
      sessionId: verificationSessionId,
      hasPreResearchContext: !!preResearchContext,
      dataScenario: dataSourceAnalysis.scenario,
      externalDataTrusted: dataSourceAnalysis.externalDataTrusted,
      modelMismatch: dataSourceAnalysis.modelValidation?.mismatchReason || null,
      coherenceConflicts: coherenceResult.conflicts.length,
      hasUrlBrandMismatch,
      tokenManagement: {
        estimatedTokens: tokenEstimate.estimatedTokens,
        riskLevel: tokenEstimate.riskLevel,
        truncationApplied: processedProduct !== rawProduct,
      },
      hierarchicalEnabled: true // Flag for monitoring
    });
    
    // Build prompt options with model validation info AND coherence warnings
    // Pass coherence warnings so AI can reason about conflicting data
    const promptOptions: PromptOptions = {
      researchContext: preResearchContext,
      externalDataTrusted: dataSourceAnalysis.externalDataTrusted,
      modelMismatchWarning: dataSourceAnalysis.modelValidation?.mismatchReason,
      // Pass coherence warnings to help AI identify bad data sources
      dataCoherenceWarnings: (coherenceResult.conflicts.length > 0 || coherenceResult.warnings.length > 0) ? {
        conflicts: coherenceResult.conflicts.map(c => ({
          type: c.type,
          severity: c.severity,
          description: c.description,
          source1: c.source1,
          source2: c.source2,
          value1: c.value1,
          value2: c.value2
        })),
        warnings: coherenceResult.warnings,
        recommendation: coherenceResult.recommendation
      } : undefined
    };
    
    // ===============================================
    // 🏢 STAGE 1: DEPARTMENT DETERMINATION ONLY
    // ===============================================
    logger.info('🏢 STAGE 1 (Hierarchical): Determining product department', {
      sessionId: verificationSessionId,
      productId: rawProduct.SF_Catalog_Id
    });
    
    const stage1StartTime = Date.now();
    const [openaiDeptResult, xaiDeptResult] = await Promise.all([
      analyzeWithOpenAI(processedProduct, verificationSessionId, promptOptions, trackingId, { stage: 'department-only' }),
      analyzeWithXAI(processedProduct, verificationSessionId, promptOptions, trackingId, { stage: 'department-only' })
    ]);
    
    logger.info('✅ STAGE 1 complete - Department determined', {
      sessionId: verificationSessionId,
      openaiDepartment: openaiDeptResult.determinedDepartment,
      xaiDepartment: xaiDeptResult.determinedDepartment,
      openaiConfidence: openaiDeptResult.departmentConfidence,
      xaiConfidence: xaiDeptResult.departmentConfidence,
      durationMs: Date.now() - stage1StartTime
    });
    
    // Build consensus on department
    const departmentConsensus = buildConsensus(openaiDeptResult, xaiDeptResult);
    let determinedDepartment = departmentConsensus.agreedDepartment || openaiDeptResult.determinedDepartment || xaiDeptResult.determinedDepartment;
    
    if (!determinedDepartment) {
      logger.error('❌ STAGE 1 FAILED: No department could be determined', {
        sessionId: verificationSessionId,
        openaiError: openaiDeptResult.error,
        xaiError: xaiDeptResult.error
      });
      throw new Error('Department determination failed - both AIs returned no department');
    }
    
    logger.info('🎯 Department consensus reached', {
      sessionId: verificationSessionId,
      agreedDepartment: determinedDepartment,
      departmentsMatched: openaiDeptResult.determinedDepartment === xaiDeptResult.determinedDepartment,
      departmentConfidence: Math.max(openaiDeptResult.departmentConfidence || 0, xaiDeptResult.departmentConfidence || 0)
    });
    
    // ===============================================
    // ✅ PHASE 2 VALIDATION: DEPARTMENT VALIDATION
    // ===============================================
    const validDepartments = getAllDepartments();
    if (!validDepartments.includes(determinedDepartment)) {
      logger.error('❌ VALIDATION FAILED: Invalid department selected by AI', {
        sessionId: verificationSessionId,
        invalidDepartment: determinedDepartment,
        validDepartments,
        openaiDepartment: openaiDeptResult.determinedDepartment,
        xaiDepartment: xaiDeptResult.determinedDepartment
      });
      
      // Try fuzzy matching to find closest valid department
      const fuzzyMatch = findClosestCategory(determinedDepartment, validDepartments, 0.85);
      
      if (fuzzyMatch) {
        logger.warn('⚠️ Fuzzy match found for invalid department', {
          sessionId: verificationSessionId,
          originalDepartment: determinedDepartment,
          correctedDepartment: fuzzyMatch.category,
          confidence: fuzzyMatch.confidence
        });
        
        // Use fuzzy match correction
        determinedDepartment = fuzzyMatch.category;
        Object.assign(departmentConsensus, { agreedDepartment: determinedDepartment });
      } else {
        logger.error('❌ No fuzzy match found - department validation failed', {
          sessionId: verificationSessionId,
          invalidDepartment: determinedDepartment,
          validDepartments
        });
        throw new Error(`Department validation failed: "${determinedDepartment}" is not a valid department`);
      }
    } else {
      logger.info('✅ Department validation passed', {
        sessionId: verificationSessionId,
        validDepartment: determinedDepartment
      });
    }
    
    // ===============================================
    // 🔍 STAGE 2: CATEGORY DETERMINATION (FILTERED BY DEPARTMENT)
    // ===============================================
    logger.info('🔍 STAGE 2 (Hierarchical): Determining product category', {
      sessionId: verificationSessionId,
      department: determinedDepartment,
      productId: rawProduct.SF_Catalog_Id
    });
    
    const stage2StartTime = Date.now();
    const [openaiCategoryResult, xaiCategoryResult] = await Promise.all([
      analyzeWithOpenAI(processedProduct, verificationSessionId, promptOptions, trackingId, { 
        stage: 'category-only', 
        department: determinedDepartment 
      }),
      analyzeWithXAI(processedProduct, verificationSessionId, promptOptions, trackingId, { 
        stage: 'category-only', 
        department: determinedDepartment 
      })
    ]);
    
    logger.info('✅ STAGE 2 complete - Category determined', {
      sessionId: verificationSessionId,
      department: determinedDepartment,
      openaiCategory: openaiCategoryResult.determinedCategory,
      xaiCategory: xaiCategoryResult.determinedCategory,
      openaiConfidence: openaiCategoryResult.categoryConfidence,
      xaiConfidence: xaiCategoryResult.categoryConfidence,
      durationMs: Date.now() - stage2StartTime
    });
    
    // Build consensus on category only
    const categoryConsensus = buildConsensus(openaiCategoryResult, xaiCategoryResult);
    let determinedCategory = categoryConsensus.agreedCategory || openaiCategoryResult.determinedCategory || xaiCategoryResult.determinedCategory;
    
    if (!determinedCategory) {
      logger.error('❌ STAGE 2 FAILED: No category could be determined', {
        sessionId: verificationSessionId,
        department: determinedDepartment,
        openaiError: openaiCategoryResult.error,
        xaiError: xaiCategoryResult.error
      });
      throw new Error('Category determination failed - both AIs returned no category');
    }
    
    logger.info('🎯 Category consensus reached', {
      sessionId: verificationSessionId,
      department: determinedDepartment,
      agreedCategory: determinedCategory,
      categoriesMatched: categoryConsensus.agreed,
      categoryConfidence: Math.max(openaiCategoryResult.categoryConfidence, xaiCategoryResult.categoryConfidence)
    });
    
    // ===============================================
    // ✅ PHASE 2 VALIDATION: CATEGORY VALIDATION
    // ===============================================
    const validCategoriesForDept = getCategoriesForDepartment(determinedDepartment);
    const allValidCategories = getAllCategories();
    
    // Check if category exists in the selected department
    if (!validCategoriesForDept.includes(determinedCategory)) {
      logger.error('❌ VALIDATION FAILED: Invalid category for department', {
        sessionId: verificationSessionId,
        department: determinedDepartment,
        invalidCategory: determinedCategory,
        validCategoriesForDept,
        openaiCategory: openaiCategoryResult.determinedCategory,
        xaiCategory: xaiCategoryResult.determinedCategory
      });
      
      // Try fuzzy matching within the department first
      let fuzzyMatch = findClosestCategory(determinedCategory, validCategoriesForDept, 0.85);
      
      if (!fuzzyMatch) {
        // Try fuzzy matching across all categories (maybe wrong department)
        fuzzyMatch = findClosestCategory(determinedCategory, allValidCategories, 0.85);
        
        if (fuzzyMatch) {
          logger.warn('⚠️ Category found in different department - AI may have chosen wrong department', {
            sessionId: verificationSessionId,
            invalidCategory: determinedCategory,
            correctedCategory: fuzzyMatch.category,
            originalDepartment: determinedDepartment,
            categoryActualDepartment: getCategoriesForDepartment(determinedDepartment).includes(fuzzyMatch.category) ? determinedDepartment : 'OTHER',
            confidence: fuzzyMatch.confidence
          });
        }
      }
      
      if (fuzzyMatch) {
        logger.warn('⚠️ Fuzzy match found for invalid category', {
          sessionId: verificationSessionId,
          originalCategory: determinedCategory,
          correctedCategory: fuzzyMatch.category,
          confidence: fuzzyMatch.confidence
        });
        
        // Use fuzzy match correction
        determinedCategory = fuzzyMatch.category;
        Object.assign(categoryConsensus, { agreedCategory: determinedCategory });
      } else {
        // No fuzzy match found - retry with stricter prompt
        logger.warn('⚠️ No fuzzy match found - retrying with strict category validation', {
          sessionId: verificationSessionId,
          department: determinedDepartment,
          invalidCategory: determinedCategory,
          validCategoriesForDept,
          retryAttempt: 1
        });
        
        // Create strict retry prompt with explicit invalid category warning
        const strictPromptOptions = {
          ...promptOptions,
          strictCategoryMode: true,
          invalidCategoryWarning: `CRITICAL: Your previous selection "${determinedCategory}" is NOT VALID for department "${determinedDepartment}". You MUST select from the provided category list. DO NOT create new category names.`
        };
        
        // Retry Stage 2 with strict mode
        const [retryOpenaiResult, retryXaiResult] = await Promise.all([
          analyzeWithOpenAI(processedProduct, verificationSessionId, strictPromptOptions, trackingId, { 
            stage: 'category-only', 
            department: determinedDepartment 
          }),
          analyzeWithXAI(processedProduct, verificationSessionId, strictPromptOptions, trackingId, { 
            stage: 'category-only', 
            department: determinedDepartment 
          })
        ]);
        
        logger.info('✅ Retry attempt completed', {
          sessionId: verificationSessionId,
          retryOpenaiCategory: retryOpenaiResult.determinedCategory,
          retryXaiCategory: retryXaiResult.determinedCategory
        });
        
        // Build consensus from retry
        const retryCategoryConsensus = buildConsensus(retryOpenaiResult, retryXaiResult);
        const retryDeterminedCategory = retryCategoryConsensus.agreedCategory || retryOpenaiResult.determinedCategory || retryXaiResult.determinedCategory;
        
        // Validate retry result
        if (retryDeterminedCategory && validCategoriesForDept.includes(retryDeterminedCategory)) {
          logger.info('✅ Retry successful - valid category selected', {
            sessionId: verificationSessionId,
            originalCategory: determinedCategory,
            retryCategory: retryDeterminedCategory
          });
          determinedCategory = retryDeterminedCategory;
          Object.assign(categoryConsensus, { agreedCategory: determinedCategory });
        } else {
          // Retry failed - still invalid
          logger.error('❌ Retry failed - category validation still failing after retry', {
            sessionId: verificationSessionId,
            department: determinedDepartment,
            originalInvalidCategory: determinedCategory,
            retryInvalidCategory: retryDeterminedCategory,
            validCategoriesForDept,
            allValidCategories: allValidCategories.slice(0, 10)
          });
          
          // Last resort: Try fuzzy match on retry result
          const retryFuzzyMatch = retryDeterminedCategory 
            ? findClosestCategory(retryDeterminedCategory, validCategoriesForDept, 0.75) // Lower threshold
            : null;
          
          if (retryFuzzyMatch) {
            logger.warn('⚠️ Fuzzy match found on retry result (lowered threshold)', {
              sessionId: verificationSessionId,
              retryCategory: retryDeterminedCategory,
              fuzzyMatch: retryFuzzyMatch.category,
              confidence: retryFuzzyMatch.confidence
            });
            determinedCategory = retryFuzzyMatch.category;
            Object.assign(categoryConsensus, { agreedCategory: determinedCategory });
          } else {
            // Complete failure - throw error
            throw new Error(`Category validation failed after retry: "${determinedCategory}" → "${retryDeterminedCategory}" - neither valid for department "${determinedDepartment}"`);
          }
        }
      }
    } else {
      logger.info('✅ Category validation passed', {
        sessionId: verificationSessionId,
        department: determinedDepartment,
        validCategory: determinedCategory
      });
    }
    
    // ===============================================
    // 🎯 STAGE 3: DETAILED ANALYSIS (CATEGORY-SPECIFIC)
    // ===============================================
    logger.info('🎯 STAGE 3 (Hierarchical): Detailed analysis with category-specific context', {
      sessionId: verificationSessionId,
      department: determinedDepartment,
      category: determinedCategory,
      productId: rawProduct.SF_Catalog_Id
    });
    
    const stage3StartTime = Date.now();
    const [openaiResult, xaiResult] = await Promise.all([
      analyzeWithOpenAI(processedProduct, verificationSessionId, promptOptions, trackingId, { 
        stage: 'category-specific', 
        department: determinedDepartment,
        category: determinedCategory 
      }),
      analyzeWithXAI(processedProduct, verificationSessionId, promptOptions, trackingId, { 
        stage: 'category-specific', 
        department: determinedDepartment,
        category: determinedCategory 
      })
    ]);
    
    logger.info('✅ STAGE 3 complete - Detailed analysis finished', {
      sessionId: verificationSessionId,
      department: determinedDepartment,
      category: determinedCategory,
      openaiFieldsPopulated: Object.keys(openaiResult.primaryAttributes).length + Object.keys(openaiResult.top15Attributes).length,
      xaiFieldsPopulated: Object.keys(xaiResult.primaryAttributes).length + Object.keys(xaiResult.top15Attributes).length,
      durationMs: Date.now() - stage3StartTime
    });

    // ===============================================
    // 🔧 PHASE 2.5: TYPE VALIDATION (POST-STAGE 3)
    // ===============================================
    // Validate that Type is valid for the determined Category
    // Similar to category validation after Stage 2
    // 
    // CRITICAL FIX: Validate BOTH AI results separately to detect disagreements
    // If one is valid and one is invalid, force both to the valid one
    // If both are invalid, attempt correction on both
    
    const openaiType = openaiResult.primaryAttributes.product_type;
    const xaiType = xaiResult.primaryAttributes.product_type;
    const categoryMapping = getCategoryTypeMapping(determinedCategory);
    const validTypesForCategory = categoryMapping?.types.map(t => t.type_name) || [];
    
    // Determine which type to validate (prefer the one that exists)
    let determinedType = openaiType || xaiType;
    
    // Skip validation if category has no types or type is N/A/Not Found
    const skipTypeValidation = validTypesForCategory.length === 0 
      || !determinedType 
      || String(determinedType).toLowerCase() === 'not applicable' 
      || String(determinedType).toLowerCase() === 'not found';
    
    if (!skipTypeValidation && determinedType && determinedCategory) {
      // Check if BOTH AIs agree on the type
      const typesAgree = openaiType && xaiType && openaiType === xaiType;
      
      // Validate both types (or the single type if only one exists)
      const openaiTypeValid = openaiType ? isValidTypeForCategory(String(openaiType), determinedCategory) : false;
      const xaiTypeValid = xaiType ? isValidTypeForCategory(String(xaiType), determinedCategory) : false;
      
      // If they disagree, log the disagreement
      if (!typesAgree && openaiType && xaiType) {
        logger.warn('⚠️ PHASE 2.5: AIs disagree on type', {
          sessionId: verificationSessionId,
          category: determinedCategory,
          openaiType,
          xaiType,
          openaiValid: openaiTypeValid,
          xaiValid: xaiTypeValid
        });
      }
      
      // CRITICAL FIX: If they disagree, force both to agree on the valid one
      if (!typesAgree && openaiType && xaiType) {
        if (openaiTypeValid && !xaiTypeValid) {
          // OpenAI is valid, XAI is invalid → force both to OpenAI's value
          logger.info('✅ Forcing type agreement: OpenAI valid, XAI invalid', {
            sessionId: verificationSessionId,
            category: determinedCategory,
            openaiType,
            xaiType,
            forcedValue: openaiType
          });
          xaiResult.primaryAttributes.product_type = openaiType;
          determinedType = openaiType;
        } else if (!openaiTypeValid && xaiTypeValid) {
          // XAI is valid, OpenAI is invalid → force both to XAI's value
          logger.info('✅ Forcing type agreement: XAI valid, OpenAI invalid', {
            sessionId: verificationSessionId,
            category: determinedCategory,
            openaiType,
            xaiType,
            forcedValue: xaiType
          });
          openaiResult.primaryAttributes.product_type = xaiType;
          determinedType = xaiType;
        } else if (openaiTypeValid && xaiTypeValid) {
          // BOTH are valid but disagree → prefer PRIMARY_FILTER types over generic "Accessory"
          const openaiTypeInfo = categoryMapping?.types.find(t => t.type_name === openaiType);
          const xaiTypeInfo = categoryMapping?.types.find(t => t.type_name === xaiType);
          const openaiIsPrimary = openaiTypeInfo?.primary_filter === true;
          const xaiIsPrimary = xaiTypeInfo?.primary_filter === true;
          
          if (openaiIsPrimary && !xaiIsPrimary) {
            // OpenAI has primary filter type, XAI has generic → prefer OpenAI
            logger.info('✅ Forcing type agreement: OpenAI primary filter, XAI generic', {
              sessionId: verificationSessionId,
              category: determinedCategory,
              openaiType,
              xaiType,
              openaiPrimary: openaiIsPrimary,
              xaiPrimary: xaiIsPrimary,
              forcedValue: openaiType,
              reason: 'Prefer primary_filter types over generic catch-alls'
            });
            xaiResult.primaryAttributes.product_type = openaiType;
            determinedType = openaiType;
          } else if (!openaiIsPrimary && xaiIsPrimary) {
            // XAI has primary filter type, OpenAI has generic → prefer XAI
            logger.info('✅ Forcing type agreement: XAI primary filter, OpenAI generic', {
              sessionId: verificationSessionId,
              category: determinedCategory,
              openaiType,
              xaiType,
              openaiPrimary: openaiIsPrimary,
              xaiPrimary: xaiIsPrimary,
              forcedValue: xaiType,
              reason: 'Prefer primary_filter types over generic catch-alls'
            });
            openaiResult.primaryAttributes.product_type = xaiType;
            determinedType = xaiType;
          } else {
            // Both primary or both generic - no clear winner, will handle in consensus
            logger.warn('⚠️ Both types valid with same priority - will resolve in consensus', {
              sessionId: verificationSessionId,
              category: determinedCategory,
              openaiType,
              xaiType,
              openaiPrimary: openaiIsPrimary,
              xaiPrimary: xaiIsPrimary
            });
          }
        } else {
          // Both invalid - will handle below in the normal validation flow
          logger.warn('🔴 Both AIs selected invalid types', {
            sessionId: verificationSessionId,
            category: determinedCategory,
            openaiType,
            xaiType,
            bothInvalid: true
          });
        }
      }
      
      // Re-check validation after potential forced agreement
      const finalTypeValid = determinedType ? isValidTypeForCategory(String(determinedType), determinedCategory) : false;
      
      if (!finalTypeValid || (!typesAgree && !openaiTypeValid && !xaiTypeValid)) {
        // TYPE CROSS-CONTAMINATION DETECTED
        logger.warn('🔴 PHASE 2.5 VALIDATION: TYPE VALIDATION FAILED', {
          sessionId: verificationSessionId,
          category: determinedCategory,
          invalidType: determinedType,
          openaiType,
          xaiType,
          validTypes: validTypesForCategory.slice(0, 10),
          productId: rawProduct.SF_Catalog_Id
        });
        
        // Try fuzzy matching first
        const fuzzyMatch = findClosestType(String(determinedType), validTypesForCategory, 0.85);
        
        if (fuzzyMatch) {
          logger.info('✅ Fuzzy match found for invalid type', {
            sessionId: verificationSessionId,
            originalType: determinedType,
            fuzzyMatch: fuzzyMatch.type,
            confidence: fuzzyMatch.confidence
          });
          determinedType = fuzzyMatch.type;
          // Update BOTH AI results with corrected type
          openaiResult.primaryAttributes.product_type = fuzzyMatch.type;
          xaiResult.primaryAttributes.product_type = fuzzyMatch.type;
        } else {
          // No fuzzy match - retry Stage 3 with strict warning
          logger.warn('⚠️ No fuzzy match found - retrying Stage 3 with strict type validation', {
            sessionId: verificationSessionId,
            category: determinedCategory,
            invalidType: determinedType,
            validTypes: validTypesForCategory.slice(0, 10)
          });
          
          // Create strict prompt options with type warning
          const strictTypePromptOptions: Record<string, any> = {
            strictTypeMode: true,
            invalidTypeWarning: `⚠️ VALIDATION ERROR: Previous attempt selected type "${determinedType}" which is NOT valid for category "${determinedCategory}". Valid types for this category are: ${validTypesForCategory.join(', ')}. You MUST select from this list ONLY.`
          };
          
          // Retry Stage 3 with strict type validation
          const [retryOpenaiResult, retryXaiResult] = await Promise.all([
            analyzeWithOpenAI(processedProduct, verificationSessionId, strictTypePromptOptions, trackingId, { 
              stage: 'category-specific', 
              department: determinedDepartment,
              category: determinedCategory 
            }),
            analyzeWithXAI(processedProduct, verificationSessionId, strictTypePromptOptions, trackingId, { 
              stage: 'category-specific', 
              department: determinedDepartment,
              category: determinedCategory 
            })
          ]);
          
          const retryOpenaiType = retryOpenaiResult.primaryAttributes.product_type;
          const retryXaiType = retryXaiResult.primaryAttributes.product_type;
          const retryDeterminedType = retryOpenaiType || retryXaiType;
          const isRetryTypeValid = retryDeterminedType ? isValidTypeForCategory(String(retryDeterminedType), determinedCategory) : false;
          
          // Check if retry results agree
          const retryTypesAgree = retryOpenaiType && retryXaiType && retryOpenaiType === retryXaiType;
          
          if (isRetryTypeValid && retryTypesAgree) {
            // Retry succeeded with agreement
            logger.info('✅ Retry succeeded - type validation passed', {
              sessionId: verificationSessionId,
              category: determinedCategory,
              originalInvalidType: determinedType,
              retryValidType: retryDeterminedType
            });
            determinedType = retryDeterminedType;
            // Use retry results
            Object.assign(openaiResult, retryOpenaiResult);
            Object.assign(xaiResult, retryXaiResult);
          } else if (isRetryTypeValid && !retryTypesAgree) {
            // Retry returned valid type but AIs disagree - force agreement
            const retryOpenaiValid = retryOpenaiType ? isValidTypeForCategory(String(retryOpenaiType), determinedCategory) : false;
            const retryXaiValid = retryXaiType ? isValidTypeForCategory(String(retryXaiType), determinedCategory) : false;
            
            if (retryOpenaiValid && !retryXaiValid) {
              logger.info('✅ Retry: Forcing agreement to OpenAI value', {
                sessionId: verificationSessionId,
                retryOpenaiType,
                retryXaiType,
                chosen: retryOpenaiType
              });
              retryXaiResult.primaryAttributes.product_type = retryOpenaiType;
            } else if (!retryOpenaiValid && retryXaiValid) {
              logger.info('✅ Retry: Forcing agreement to XAI value', {
                sessionId: verificationSessionId,
                retryOpenaiType,
                retryXaiType,
                chosen: retryXaiType
              });
              retryOpenaiResult.primaryAttributes.product_type = retryXaiType;
            } else if (retryOpenaiValid && retryXaiValid) {
              // BOTH valid but disagree → prefer PRIMARY_FILTER types
              const retryOpenaiTypeInfo = categoryMapping?.types.find(t => t.type_name === retryOpenaiType);
              const retryXaiTypeInfo = categoryMapping?.types.find(t => t.type_name === retryXaiType);
              const retryOpenaiIsPrimary = retryOpenaiTypeInfo?.primary_filter === true;
              const retryXaiIsPrimary = retryXaiTypeInfo?.primary_filter === true;
              
              if (retryOpenaiIsPrimary && !retryXaiIsPrimary) {
                logger.info('✅ Retry: Forcing agreement to OpenAI (primary filter)', {
                  sessionId: verificationSessionId,
                  retryOpenaiType,
                  retryXaiType,
                  chosen: retryOpenaiType,
                  reason: 'Prefer primary_filter types over generic'
                });
                retryXaiResult.primaryAttributes.product_type = retryOpenaiType;
              } else if (!retryOpenaiIsPrimary && retryXaiIsPrimary) {
                logger.info('✅ Retry: Forcing agreement to XAI (primary filter)', {
                  sessionId: verificationSessionId,
                  retryOpenaiType,
                  retryXaiType,
                  chosen: retryXaiType,
                  reason: 'Prefer primary_filter types over generic'
                });
                retryOpenaiResult.primaryAttributes.product_type = retryXaiType;
              }
            }
            
            determinedType = retryDeterminedType;
            Object.assign(openaiResult, retryOpenaiResult);
            Object.assign(xaiResult, retryXaiResult);
          } else {
            // Retry failed - try fuzzy match on retry result
            logger.error('❌ Retry failed - type validation still failing after retry', {
              sessionId: verificationSessionId,
              category: determinedCategory,
              originalInvalidType: determinedType,
              retryInvalidType: retryDeterminedType,
              validTypesForCategory
            });
            
            const retryFuzzyMatch = retryDeterminedType 
              ? findClosestType(String(retryDeterminedType), validTypesForCategory, 0.75) // Lower threshold
              : null;
            
            if (retryFuzzyMatch) {
              logger.warn('⚠️ Fuzzy match found on retry result (lowered threshold)', {
                sessionId: verificationSessionId,
                retryType: retryDeterminedType,
                fuzzyMatch: retryFuzzyMatch.type,
                confidence: retryFuzzyMatch.confidence
              });
              determinedType = retryFuzzyMatch.type;
              // Update retry results
              retryOpenaiResult.primaryAttributes.product_type = retryFuzzyMatch.type;
              retryXaiResult.primaryAttributes.product_type = retryFuzzyMatch.type;
              Object.assign(openaiResult, retryOpenaiResult);
              Object.assign(xaiResult, retryXaiResult);
            } else {
              // Complete failure - set to "Not Found"
              logger.error('🔴 Type validation complete failure - forcing to "Not Found"', {
                sessionId: verificationSessionId,
                category: determinedCategory,
                originalType: determinedType,
                retryType: retryDeterminedType
              });
              determinedType = 'Not Found';
              openaiResult.primaryAttributes.product_type = 'Not Found';
              xaiResult.primaryAttributes.product_type = 'Not Found';
            }
          } 
        }
      } else {
        logger.info('✅ Type validation passed', {
          sessionId: verificationSessionId,
          category: determinedCategory,
          validType: determinedType,
          openaiType,
          xaiType,
          agree: typesAgree
        });
      }
    }

    // Track OpenAI result (All 3 stages)
    trackingService.recordOpenAIResult(trackingId, {
      success: openaiResult.success,
      determinedCategory: determinedCategory, // From STAGE 2 consensus
      categoryConfidence: openaiCategoryResult.categoryConfidence, // From STAGE 2
      processingTimeMs: (Date.now() - stage1StartTime) + (Date.now() - stage2StartTime) + (Date.now() - stage3StartTime),
      fieldsPopulated: Object.keys(openaiResult.primaryAttributes).length + Object.keys(openaiResult.top15Attributes).length,
      fieldsMissing: openaiResult.missingFields.length,
      correctionsApplied: openaiResult.corrections.length,
      researchPerformed: openaiResult.researchPerformed,
      overallConfidence: openaiResult.confidence,
      errorMessage: openaiResult.error,
    });

    // Track xAI result (All 3 stages)
    trackingService.recordXAIResult(trackingId, {
      success: xaiResult.success,
      determinedCategory: determinedCategory, // From STAGE 2 consensus
      categoryConfidence: xaiCategoryResult.categoryConfidence, // From STAGE 2
      processingTimeMs: (Date.now() - stage1StartTime) + (Date.now() - stage2StartTime) + (Date.now() - stage3StartTime),
      fieldsPopulated: Object.keys(xaiResult.primaryAttributes).length + Object.keys(xaiResult.top15Attributes).length,
      fieldsMissing: xaiResult.missingFields.length,
      correctionsApplied: xaiResult.corrections.length,
      researchPerformed: xaiResult.researchPerformed,
      overallConfidence: xaiResult.confidence,
      errorMessage: xaiResult.error,
    });

    logger.info('PHASE 1 complete - Three-stage hierarchical AI analysis finished', {
      sessionId: verificationSessionId,
      stage1Department: determinedDepartment,
      stage2Category: determinedCategory,
      stage3FieldsTotal: Object.keys(openaiResult.primaryAttributes).length + Object.keys(xaiResult.primaryAttributes).length,
      totalDurationMs: (Date.now() - stage1StartTime) + (Date.now() - stage2StartTime) + (Date.now() - stage3StartTime)
    });

    // PHASE 2: Build initial consensus
    logger.info('PHASE 2: Building consensus', {
      sessionId: verificationSessionId
    });
    
    let consensus = buildConsensus(openaiResult, xaiResult);
    
    // POST-CONSENSUS VALIDATION: Enforce critical business rules (only if category determined)
    if (consensus.agreedCategory) {
      const validation = validateConsensusCategory(
        consensus.agreedCategory,
        rawProduct,
        consensus.agreedPrimaryAttributes
      );
      
      if (!validation.isValid) {
        logger.warn('Category rule violation detected - correcting', {
          sessionId: verificationSessionId,
          wrongCategory: consensus.agreedCategory,
          correctCategory: validation.correctedCategory,
          violatedRule: validation.violatedRule,
          reason: validation.reason,
          product: rawProduct.SF_Catalog_Name
        });
        
        // Override with corrected category
        consensus.agreedCategory = validation.correctedCategory!;
        
        // Override product_type if validation specified
        if (validation.correctedType) {
          consensus.agreedPrimaryAttributes.product_type = validation.correctedType;
        }
        
        // Reload category schema for corrected category (if not null)
        if (consensus.agreedCategory) {
          void getCategorySchema(consensus.agreedCategory);
        }
      }
    }
    
    let crossValidationPerformed = false;
    let researchPhaseTriggered = !!preResearchResult; // Already triggered if pre-research was done
    let retryCount = 0;
    const MAX_CONSENSUS_RETRIES = 3;
    
    // PHASE 3: Handle disagreements with cross-validation (up to MAX_CONSENSUS_RETRIES attempts)
    // Use category equivalence check instead of strict string comparison
    const categoriesEquivalent = areCategoriesEquivalent(openaiResult.determinedCategory, xaiResult.determinedCategory);
    if (!consensus.agreed && !categoriesEquivalent) {
      logger.info('PHASE 3: Category disagreement - initiating cross-validation', { sessionId: verificationSessionId });
      crossValidationPerformed = true;
      retryCount++;
      
      const [openaiRevised, xaiRevised] = await Promise.all([
        reanalyzeWithContext(rawProduct, 'openai', xaiResult, verificationSessionId),
        reanalyzeWithContext(rawProduct, 'xai', openaiResult, verificationSessionId)
      ]);
      
      consensus = buildConsensus(openaiRevised, xaiRevised);
      
      // POST-CONSENSUS VALIDATION after cross-validation too (only if category determined)
      if (consensus.agreedCategory) {
        const validationAfterCrossCheck = validateConsensusCategory(
          consensus.agreedCategory,
          rawProduct,
          consensus.agreedPrimaryAttributes
        );
        
        if (!validationAfterCrossCheck.isValid) {
          logger.warn('Category rule violation after cross-validation - correcting', {
            sessionId: verificationSessionId,
            wrongCategory: consensus.agreedCategory,
            correctCategory: validationAfterCrossCheck.correctedCategory,
            violatedRule: validationAfterCrossCheck.violatedRule,
            reason: validationAfterCrossCheck.reason
          });
          
          consensus.agreedCategory = validationAfterCrossCheck.correctedCategory!;
          if (validationAfterCrossCheck.correctedType) {
            consensus.agreedPrimaryAttributes.product_type = validationAfterCrossCheck.correctedType;
          }
          if (consensus.agreedCategory) {
            void getCategorySchema(consensus.agreedCategory);
          }
        }
      }
    }

    // PHASE 4: Additional research for missing/unresolved fields
    // Use pre-research result if available, or perform targeted research
    let researchResult: ResearchResult | null = preResearchResult;
    
    // Determine if additional research is needed
    const needsMoreResearch = consensus.needsResearch.length > 0 || 
                              consensus.disagreements.filter(d => d.resolution === 'unresolved').length > 0;
    
    if (needsMoreResearch && consensus.agreedCategory && (config.research?.enabled !== false)) {
      logger.info('PHASE 4: Additional Research for missing/unresolved fields', { 
        sessionId: verificationSessionId,
        missingFields: consensus.needsResearch,
        unresolvedDisagreements: consensus.disagreements.filter(d => d.resolution === 'unresolved').map(d => d.field),
        hasPreResearch: !!preResearchResult,
        dataScenario: dataSourceAnalysis.scenario
      });
      researchPhaseTriggered = true;
      
      // If we already have pre-research, use it; otherwise fetch now
      if (!researchResult) {
        try {
          researchResult = await performProductResearch(
            rawProduct.Ferguson_URL || null,
            referenceUrl,
            dataSourceAnalysis.availableDocuments,
            dataSourceAnalysis.availableImages,
            { 
              maxDocuments: config.research?.maxDocuments || 5, 
              maxImages: config.research?.maxImages || 3, 
              skipImages: config.research?.enableImageAnalysis === false 
            }
          );
        } catch (researchError) {
          logger.warn('Research fetch failed', {
            sessionId: verificationSessionId,
            error: researchError instanceof Error ? researchError.message : 'Unknown error'
          });
        }
      }
      
      if (researchResult) {
        const researchContext = formatResearchForPrompt(researchResult);
        
        logger.info('Research data available for field resolution', {
          sessionId: verificationSessionId,
          webPagesSuccess: researchResult.webPages.filter(p => p.success).length,
          documentsSuccess: researchResult.documents.filter(d => d.success).length,
          imagesSuccess: researchResult.images.filter(i => i.success).length,
          totalSpecs: Object.keys(researchResult.combinedSpecifications).length,
          totalFeatures: researchResult.combinedFeatures.length
        });
        
        // Re-run AI analysis with research context for missing fields
        // Each AI does independent research-based analysis
        const [openaiResearch, xaiResearch] = await Promise.all([
          researchMissingData(rawProduct, consensus.needsResearch, 'openai', consensus.agreedCategory, verificationSessionId, researchContext),
          researchMissingData(rawProduct, consensus.needsResearch, 'xai', consensus.agreedCategory, verificationSessionId, researchContext)
        ]);
        
        consensus = mergeResearchResults(consensus, openaiResearch, xaiResearch);
        retryCount++;
        
        // PHASE 5: Final retry if still unresolved (up to MAX_CONSENSUS_RETRIES)
        while (retryCount < MAX_CONSENSUS_RETRIES && 
               consensus.disagreements.filter(d => d.resolution === 'unresolved').length > 0) {
          logger.info(`PHASE 5: Retry attempt ${retryCount + 1}/${MAX_CONSENSUS_RETRIES} for unresolved fields`, {
            sessionId: verificationSessionId,
            unresolvedFields: consensus.disagreements.filter(d => d.resolution === 'unresolved').map(d => d.field)
          });
          
          const [openaiRetry, xaiRetry] = await Promise.all([
            researchMissingData(rawProduct, consensus.disagreements.filter(d => d.resolution === 'unresolved').map(d => d.field), 'openai', consensus.agreedCategory!, verificationSessionId, researchContext),
            researchMissingData(rawProduct, consensus.disagreements.filter(d => d.resolution === 'unresolved').map(d => d.field), 'xai', consensus.agreedCategory!, verificationSessionId, researchContext)
          ]);
          
          consensus = mergeResearchResults(consensus, openaiRetry, xaiRetry);
          retryCount++;
        }
        
        // Apply SMART resolution for remaining unresolved fields instead of just marking "Not Found"
        if (retryCount >= MAX_CONSENSUS_RETRIES) {
          for (const disagreement of consensus.disagreements.filter(d => d.resolution === 'unresolved')) {
            // Use smart resolution to pick the best value
            const resolution = resolveDisagreementSmart(
              disagreement.field,
              disagreement.openaiValue,
              disagreement.xaiValue,
              consensus.agreedCategory || 'Unknown',
              dataSourceAnalysis.hasFergusonData,
              researchResult || undefined
            );
            
            logger.info(`Smart resolution for field "${disagreement.field}"`, {
              sessionId: verificationSessionId,
              field: disagreement.field,
              openaiValue: disagreement.openaiValue,
              xaiValue: disagreement.xaiValue,
              resolvedValue: resolution.resolvedValue,
              winner: resolution.winner,
              reason: resolution.reason
            });
            
            // Apply the resolved value to the appropriate attribute set
            if (disagreement.field in consensus.agreedPrimaryAttributes || 
                ['brand', 'msrp', 'weight', 'upc_gtin', 'model_parent'].includes(disagreement.field.toLowerCase())) {
              consensus.agreedPrimaryAttributes[disagreement.field] = resolution.resolvedValue;
            } else {
              consensus.agreedTop15Attributes[disagreement.field] = resolution.resolvedValue;
            }
            
            // Mark as resolved with the winning AI
            disagreement.resolution = resolution.winner === 'xai' ? 'xai' : 'openai';
          }
        }
      }
    } else if (!needsMoreResearch) {
      logger.info('PHASE 4: Additional research not needed (all fields resolved)', {
        sessionId: verificationSessionId
      });
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
      dataSourceScenario: dataSourceAnalysis.scenario,
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
      urlsScraped: dataSourceAnalysis.availableUrls.length,
      preResearchPerformed: !!preResearchResult,
    });

    // ========================================================================
    // PHASE 6: FINAL WEB SEARCH (Using verified data for targeted search)
    // ========================================================================
    // Now that we have verified category, brand, and model number from AI consensus,
    // we can perform a much more targeted web search to fill in missing fields.
    // This is more effective than searching at the beginning with unverified data.
    // ========================================================================
    let finalSearchResult: FinalVerificationSearchResult | null = null;
    
    // FIX: needsResearch is cleared by mergeResearchResults, so we need to identify
    // fields that STILL have "Not Found", empty, or missing values after all processing
    const stillMissingFields: string[] = [];
    const notFoundIndicators = ['not found', 'unknown', 'n/a', 'not available', 'not specified', ''];
    
    // Check primary attributes for missing values
    const criticalPrimaryFields = ['brand', 'msrp', 'weight', 'upc_gtin', 'product_style', 'color', 'finish'];
    for (const field of criticalPrimaryFields) {
      const value = consensus.agreedPrimaryAttributes[field];
      if (!value || notFoundIndicators.includes(String(value).toLowerCase().trim())) {
        stillMissingFields.push(field);
      }
    }
    
    // Check Top15 attributes for missing values
    for (const [field, value] of Object.entries(consensus.agreedTop15Attributes)) {
      if (!value || notFoundIndicators.includes(String(value).toLowerCase().trim())) {
        stillMissingFields.push(field);
      }
    }
    
    // Check disagreements that were "resolved" but with "Not Found" values
    for (const disagreement of consensus.disagreements) {
      const resolvedField = disagreement.field;
      const primaryValue = consensus.agreedPrimaryAttributes[resolvedField];
      const top15Value = consensus.agreedTop15Attributes[resolvedField];
      const resolvedValue = primaryValue || top15Value;
      
      if (!resolvedValue || notFoundIndicators.includes(String(resolvedValue).toLowerCase().trim())) {
        if (!stillMissingFields.includes(resolvedField)) {
          stillMissingFields.push(resolvedField);
        }
      }
    }
    
    // Limit to most important fields to avoid excessive API calls (max 10)
    const prioritizedMissingFields = stillMissingFields
      .filter(f => criticalPrimaryFields.includes(f.toLowerCase()) || 
                   ['width', 'height', 'depth', 'material', 'voltage'].includes(f.toLowerCase()))
      .slice(0, 10);
    
    const unresolvedFieldsList = consensus.disagreements
      .filter(d => d.resolution === 'unresolved')
      .map(d => d.field);
    
    // Use prioritized missing fields OR unresolved fields for final search
    const fieldsForFinalSearch = prioritizedMissingFields.length > 0 ? prioritizedMissingFields : unresolvedFieldsList;
    
    const shouldDoFinalSearch = fieldsForFinalSearch.length > 0 && 
                                 config.research?.enableFinalWebSearch !== false;
    
    if (shouldDoFinalSearch) {
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', { service: 'catalog-verification' });
      logger.info('PHASE 6: FINAL WEB SEARCH - Using verified data for targeted search', {
        sessionId: verificationSessionId,
        verifiedBrand: consensus.agreedPrimaryAttributes?.brand || consensus.agreedPrimaryAttributes?.Brand || '',
        verifiedModel: rawProduct.SF_Catalog_Name || rawProduct.Model_Number_Web_Retailer || '',
        verifiedCategory: consensus.agreedCategory || 'Unknown',
        stillMissingFields: stillMissingFields.length,
        prioritizedMissingFields: prioritizedMissingFields,
        unresolvedFields: unresolvedFieldsList.length,
        fieldsToSearch: fieldsForFinalSearch,
        reason: 'Performing targeted web search for fields still missing after all processing'
      });
      
      try {
        // Extract verified data from consensus
        const verifiedBrand = consensus.agreedPrimaryAttributes?.brand || 
                              consensus.agreedPrimaryAttributes?.Brand || 
                              rawProduct.Ferguson_Brand || 
                              rawProduct.Brand_Web_Retailer || '';
        const verifiedModel = rawProduct.SF_Catalog_Name || 
                              rawProduct.Model_Number_Web_Retailer || 
                              rawProduct.Ferguson_Model_Number || '';
        const verifiedCategory = consensus.agreedCategory || 'Unknown';
        const verifiedTitle = consensus.agreedPrimaryAttributes?.product_title || 
                              consensus.agreedPrimaryAttributes?.Product_Title ||
                              rawProduct.Ferguson_Title ||
                              rawProduct.Product_Title_Web_Retailer || '';
        
        // Use DUAL-AI web search with consensus validation
        const dualSearchResult = await performDualAIWebSearch(
          verifiedBrand,
          verifiedModel,
          verifiedCategory,
          verifiedTitle,
          [...fieldsForFinalSearch, ...unresolvedFieldsList],  // Search for all missing/unresolved fields
          verificationSessionId
        );
        
        if (dualSearchResult.success && Object.keys(dualSearchResult.consensusSpecs).length > 0) {
          logger.info('PHASE 6: DUAL-AI web search found consensus data', {
            sessionId: verificationSessionId,
            consensusSpecsFound: Object.keys(dualSearchResult.consensusSpecs).length,
            agreements: dualSearchResult.agreements.length,
            disagreements: dualSearchResult.disagreements.length,
            openaiSpecsFound: Object.keys(dualSearchResult.openaiSpecs).length,
            xaiSpecsFound: Object.keys(dualSearchResult.xaiSpecs).length,
            sources: dualSearchResult.sources.length
          });
          
          // Log disagreements for transparency (these are NOT merged)
          if (dualSearchResult.disagreements.length > 0) {
            logger.warn('PHASE 6: Web search disagreements (NOT merged)', {
              sessionId: verificationSessionId,
              disagreements: dualSearchResult.disagreements.map(d => ({
                field: d.field,
                openai: d.openai,
                xai: d.xai
              }))
            });
          }
          
          // Merge ONLY consensus specifications into results (dual-AI validated)
          for (const [field, spec] of Object.entries(dualSearchResult.consensusSpecs)) {
            const normalizedField = field.toLowerCase().replace(/[_\s]+/g, '_');
            
            // Check if this field was missing or unresolved
            const isMissing = fieldsForFinalSearch.some((f: string) => 
              f.toLowerCase().replace(/[_\s]+/g, '_') === normalizedField ||
              normalizedField.includes(f.toLowerCase().replace(/[_\s]+/g, '_'))
            );
            const isUnresolved = unresolvedFieldsList.some((f: string) => 
              f.toLowerCase().replace(/[_\s]+/g, '_') === normalizedField ||
              normalizedField.includes(f.toLowerCase().replace(/[_\s]+/g, '_'))
            );
            
            if (isMissing || isUnresolved) {
              // Determine if it's a primary attribute or top15
              const isPrimaryField = ['brand', 'msrp', 'weight', 'upc_gtin', 'model_parent', 
                'product_style', 'product_title', 'description', 'features_list',
                'width', 'height', 'depth', 'color', 'finish'].includes(normalizedField);
              
              if (isPrimaryField) {
                consensus.agreedPrimaryAttributes[field] = spec.value;
              } else {
                consensus.agreedTop15Attributes[field] = spec.value;
              }
              
              logger.info(`DUAL-AI web search filled field: ${field} = ${spec.value}`, { 
                sessionId: verificationSessionId,
                confidence: spec.confidence,
                source: spec.source,  // 'both', 'openai', or 'xai'
                validatedBy: spec.source === 'both' ? 'Both AIs agreed' : `Single AI (${spec.source}) high confidence`
              });
            }
          }
          
          // Store for the legacy result format
          finalSearchResult = {
            query: `${verifiedBrand} ${verifiedModel}`,
            verifiedData: { brand: verifiedBrand, modelNumber: verifiedModel, category: verifiedCategory, productTitle: verifiedTitle },
            missingFieldsSearched: [...fieldsForFinalSearch, ...unresolvedFieldsList],
            success: true,
            foundSpecifications: Object.fromEntries(
              Object.entries(dualSearchResult.consensusSpecs).map(([k, v]) => [k, v.value])
            ),
            foundFeatures: dualSearchResult.features,
            sources: dualSearchResult.sources,
            discoveredResources: dualSearchResult.discoveredResources,
            searchSummary: `Dual-AI consensus: ${dualSearchResult.agreements.length} agreements, ${dualSearchResult.disagreements.length} disagreements rejected`
          };
          
          // Also update missing fields list (remove ones we found)
          if (consensus.needsResearch) {
            consensus.needsResearch = consensus.needsResearch.filter(field => {
              const normalizedField = field.toLowerCase().replace(/[_\s]+/g, '_');
              return !Object.keys(dualSearchResult.consensusSpecs).some(f => 
                f.toLowerCase().replace(/[_\s]+/g, '_') === normalizedField
              );
            });
          }
        } else {
          logger.info('PHASE 6: Dual-AI web search did not reach consensus on any data', {
            sessionId: verificationSessionId,
            openaiFound: Object.keys(dualSearchResult.openaiSpecs).length,
            xaiFound: Object.keys(dualSearchResult.xaiSpecs).length,
            disagreements: dualSearchResult.disagreements.length,
            reason: 'AIs found conflicting data or no data'
          });
        }
      } catch (searchError) {
        logger.warn('PHASE 6: Final web search failed (non-critical)', {
          sessionId: verificationSessionId,
          error: searchError instanceof Error ? searchError.message : 'Unknown error'
        });
        // Non-critical - continue without final search data
      }
    } else {
      logger.info('PHASE 6: Final web search skipped', {
        sessionId: verificationSessionId,
        reason: fieldsForFinalSearch.length === 0 
          ? 'No critical fields missing after processing'
          : 'Final web search disabled in config',
        stillMissingCount: stillMissingFields.length,
        prioritizedCount: prioritizedMissingFields.length
      });
    }

    // FINAL PASS: Apply smart resolution to any remaining unresolved disagreements
    // This handles cases where research was skipped/disabled but we still have disagreements
    const stillUnresolved = consensus.disagreements.filter(d => d.resolution === 'unresolved');
    if (stillUnresolved.length > 0) {
      logger.info('FINAL PASS: Applying smart resolution to remaining unresolved fields', {
        sessionId: verificationSessionId,
        count: stillUnresolved.length,
        fields: stillUnresolved.map(d => d.field)
      });
      
      for (const disagreement of stillUnresolved) {
        const resolution = resolveDisagreementSmart(
          disagreement.field,
          disagreement.openaiValue,
          disagreement.xaiValue,
          consensus.agreedCategory || 'Unknown',
          dataSourceAnalysis.hasFergusonData,
          researchResult || undefined
        );
        
        logger.info(`Final smart resolution for "${disagreement.field}": ${resolution.winner} - ${resolution.reason}`, {
          sessionId: verificationSessionId,
          resolvedValue: resolution.resolvedValue
        });
        
        // Apply to appropriate attribute set
        if (disagreement.field in consensus.agreedPrimaryAttributes || 
            ['brand', 'msrp', 'weight', 'upc_gtin', 'model_parent', 'product_style', 'product_title', 'description', 'features_list'].includes(disagreement.field.toLowerCase())) {
          consensus.agreedPrimaryAttributes[disagreement.field] = resolution.resolvedValue;
        } else {
          consensus.agreedTop15Attributes[disagreement.field] = resolution.resolvedValue;
        }
        
        disagreement.resolution = resolution.winner === 'xai' ? 'xai' : 'openai';
      }
    }

    const processingTime = Date.now() - startTime;
    const response = buildFinalResponse(rawProduct, consensus, verificationSessionId, processingTime, openaiResult, xaiResult, determinedDepartment, determinedCategory, researchResult, dataSourceAnalysis, researchPhaseTriggered, retryCount, finalSearchResult);
    
    // ========================================================================
    // FINAL SWEEP: Check all "Not Found" values against raw data
    // This catches anything the AI missed that exists in Ferguson/Web data
    // ========================================================================
    if (response.Top_Filter_Attributes) {
      const category = response.Primary_Attributes?.AI_Product_Category || consensus.agreedCategory || undefined;
      const sweptAttributes = finalSweepTopFilterAttributes(
        response.Top_Filter_Attributes,
        rawProduct,
        category
      );
      
      // Update the response with swept values
      response.Top_Filter_Attributes = sweptAttributes;
      
      logger.info('Final sweep completed for Top_Filter_Attributes', {
        sessionId: verificationSessionId,
        category,
        attributeCount: Object.keys(sweptAttributes).length
      });
    }
    
    // Track field population rates (async, don't await)
    trackFieldPopulation(response, consensus.agreedCategory || 'unknown', openaiResult, xaiResult).catch(err => {
      logger.error('Failed to track field population', { error: err.message });
    });
    
    // Track response quality for analytics (async, don't await)
    trackResponseQuality(
      verificationSessionId,
      rawProduct,
      consensus.agreedCategory || 'Unknown',
      openaiResult,
      xaiResult,
      consensus,
      dataSourceAnalysis
    ).catch(err => {
      logger.error('Failed to track response quality', { error: err.message });
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
      { openai: (Date.now() - stage1StartTime) + (Date.now() - stage2StartTime), xai: (Date.now() - stage1StartTime) + (Date.now() - stage2StartTime) }
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

async function analyzeWithOpenAI(
  rawProduct: SalesforceIncomingProduct, 
  sessionId: string, 
  promptOptions?: PromptOptions, 
  trackingId?: string,
  stageConfig?: { 
    stage: 'department-only' | 'category-only' | 'category-specific', 
    department?: string,
    category?: string 
  }
): Promise<AIAnalysisResult> {
  const maxRetries = 3;
  let lastError: any;
  const model = config.openai?.model || 'gpt-4o-mini';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Start AI usage tracking
    const prompt = buildAnalysisPrompt(rawProduct, promptOptions);
    const usageId = aiUsageTracker.startAICall({
      sessionId,
      trackingId,
      productId: rawProduct.SF_Catalog_Id,
      provider: 'openai',
      model,
      taskType: 'verification',
      prompt,
      retryAttempt: attempt - 1,
      tags: promptOptions?.researchContext ? ['with-research'] : [],
    });

    try {
      // Select appropriate system prompt based on stage
      let systemPrompt: string;
      if (stageConfig?.stage === 'department-only') {
        systemPrompt = getDepartmentOnlyPrompt();
        logger.info('🏢 STAGE 1 (Hierarchical): Using department-only prompt (OpenAI)', { sessionId, productId: rawProduct.SF_Catalog_Id });
      } else if (stageConfig?.stage === 'category-only') {
        systemPrompt = getCategoryOnlyPrompt(stageConfig.department, promptOptions);
        logger.info('🔍 STAGE 2 (Hierarchical): Using category-only prompt (OpenAI)', { sessionId, department: stageConfig.department, strictMode: promptOptions?.strictCategoryMode, productId: rawProduct.SF_Catalog_Id });
      } else if (stageConfig?.stage === 'category-specific' && stageConfig.category) {
        systemPrompt = getCategorySpecificPrompt(stageConfig.category, promptOptions);
        logger.info('🎯 STAGE 3 (Hierarchical): Using category-specific prompt (OpenAI)', { sessionId, category: stageConfig.category, strictTypeMode: promptOptions?.strictTypeMode, productId: rawProduct.SF_Catalog_Id });
      } else {
        systemPrompt = getSystemPrompt(); // Legacy full prompt
        logger.info('⚠️ Using legacy full prompt (OpenAI)', { sessionId, productId: rawProduct.SF_Catalog_Id });
      }
      
      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
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

async function analyzeWithXAI(
  rawProduct: SalesforceIncomingProduct, 
  sessionId: string, 
  promptOptions?: PromptOptions, 
  trackingId?: string,
  stageConfig?: { 
    stage: 'department-only' | 'category-only' | 'category-specific', 
    department?: string,
    category?: string 
  }
): Promise<AIAnalysisResult> {
  const maxRetries = 3;
  let lastError: any;
  const model = config.xai?.model || 'grok-3';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Start AI usage tracking
    const prompt = buildAnalysisPrompt(rawProduct, promptOptions);
    const usageId = aiUsageTracker.startAICall({
      sessionId,
      trackingId,
      productId: rawProduct.SF_Catalog_Id,
      provider: 'xai',
      model,
      taskType: 'verification',
      prompt,
      retryAttempt: attempt - 1,
      tags: promptOptions?.researchContext ? ['with-research'] : [],
    });

    try {
      // Select appropriate system prompt based on stage
      let systemPrompt: string;
      if (stageConfig?.stage === 'department-only') {
        systemPrompt = getDepartmentOnlyPrompt();
        logger.info('🏢 STAGE 1 (Hierarchical): Using department-only prompt (xAI)', { sessionId, productId: rawProduct.SF_Catalog_Id });
      } else if (stageConfig?.stage === 'category-only') {
        systemPrompt = getCategoryOnlyPrompt(stageConfig.department, promptOptions);
        logger.info('🔍 STAGE 2 (Hierarchical): Using category-only prompt (xAI)', { sessionId, department: stageConfig.department, strictMode: promptOptions?.strictCategoryMode, productId: rawProduct.SF_Catalog_Id });
      } else if (stageConfig?.stage === 'category-specific' && stageConfig.category) {
        systemPrompt = getCategorySpecificPrompt(stageConfig.category, promptOptions);
        logger.info('🎯 STAGE 3 (Hierarchical): Using category-specific prompt (xAI)', { sessionId, category: stageConfig.category, strictTypeMode: promptOptions?.strictTypeMode, productId: rawProduct.SF_Catalog_Id });
      } else {
        systemPrompt = getSystemPrompt(); // Legacy full prompt
        logger.info('⚠️ Using legacy full prompt (xAI)', { sessionId, productId: rawProduct.SF_Catalog_Id });
      }
      
      const response = await xai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
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

/**
 * ===============================================
 * TWO-STAGE AI ANALYSIS ARCHITECTURE
 * ===============================================
 * STAGE 1: Determine category ONLY (lightweight prompt)
 * STAGE 2: Analyze with category-specific context ONLY
 * 
 * Benefits:
 * - AI only sees relevant types/styles/attributes (not 200+ irrelevant ones)
 * - Eliminates cross-contamination confusion
 * - Smaller, focused prompts = faster, cheaper, more accurate
 * - No defensive validation needed for type/style matching
 */

/**
 * STAGE 1 PROMPT: Department Determination Only (NEW - Hierarchical Phase 3)
 * Ultra-lightweight prompt with just department list
 */
function getDepartmentOnlyPrompt(): string {
  const departmentList = getDepartmentListForPrompt();
  
  return `You are an expert product classifier specializing in appliances and home products.

⚠️ CRITICAL: Your ONLY task is to determine the product's DEPARTMENT. This is Stage 1 of hierarchical classification.

Your task:
1. ANALYZE the raw product data provided (title, model, specifications)
2. DETERMINE which DEPARTMENT this product belongs to
3. Return ONLY the department determination with high confidence

== AVAILABLE DEPARTMENTS ==
${departmentList}

**Department Selection Rules:**
- Analyze product title, model number, and primary function
- Choose the department that BEST matches the product's core purpose
- Examples:
  • "Built-In Refrigerator" → Appliances
  • "Pull-Down Kitchen Faucet" → Plumbing & Bath
  • "Outdoor Wall Sconce Light" → Lighting & Electrical
  • "Front Door Handle Set" → Hardware
  • "Ceiling Fan with Light" → Lighting & Electrical (primary function is cooling/circulation, but categorized under lighting)
  • "Portable Air Conditioner" → Heating & Cooling
  • "Outdoor Patio Heater" → Outdoor

**⚠️ IMPORTANT: Stage 1 Response Format**
This is Stage 1 (department determination only). Return a simplified JSON structure:

{
  "department": {
    "name": "The exact department name from the list",
    "confidence": 0.95,
    "reasoning": "Why this department was chosen based on product analysis"
  },
  "category": {},
  "primary_attributes": {},
  "top15_filter_attributes": {},
  "additional_attributes": {},
  "missing_fields": [],
  "corrections": [],
  "confidence": 0.95
}`;
}

/**
 * STAGE 2 PROMPT: Category Determination (Department-Filtered)
 * Shows ONLY categories from the determined department
 */
function getCategoryOnlyPrompt(department?: string, promptOptions?: PromptOptions): string {
  const categoryList = getCategoryListForPrompt(department);
  const departmentContext = department 
    ? `from the **${department}** department` 
    : 'from our master list';
  
  // Add strict validation warning if in retry mode
  const strictWarning = promptOptions?.invalidCategoryWarning 
    ? `\n\n🚨 ${promptOptions.invalidCategoryWarning}\n`
    : '';
  
  return `You are an expert product classifier specializing in appliances and home products.

⚠️ CRITICAL: Your ONLY task is to determine the product's category ${departmentContext}. Do NOT populate other fields yet.
${strictWarning}
Your task:
1. ANALYZE the raw product data provided
2. DETERMINE which category ${departmentContext} the product belongs to
3. Return ONLY the category determination with high confidence

${categoryList}

**Category Selection Rules:**
- Analyze product title, model number, specifications, and images
- Match to the MOST SPECIFIC category available
- Consider product type, function, and installation location
- Example: "Ceiling Fan with Light" → select "Ceiling Fan" (not generic "Lighting")
- Example: "Built-In Oven" → select "Oven" (specific appliance)
- Example: "Pull-Down Kitchen Faucet" → select "Kitchen Faucet" (not generic "Faucet")
${promptOptions?.strictCategoryMode ? '\n⚠️ **STRICT MODE**: You MUST select a category from the provided list. DO NOT create new category names.' : ''}

**⚠️ IMPORTANT: Stage 2 Response Format**
This is Stage 2 (category determination only). Return a complete JSON structure, but:
- Focus ONLY on accurate category selection
- Leave attribute fields EMPTY (they will be populated in later stages)
- Do NOT attempt to populate primary_attributes or top15_filter_attributes yet

You must respond with valid JSON in this exact format:
{
  "category": {
    "name": "The exact category name from the list",
    "confidence": 0.95,
    "reasoning": "Why this category was chosen based on product analysis"
  },
  "primary_attributes": {},
  "top15_filter_attributes": {},
  "additional_attributes": {},
  "missing_fields": [],
  "corrections": [],
  "confidence": 0.95
}`;
}

/**
 * STAGE 2 PROMPT: Category-Specific Detail Analysis
 * Focused prompt with ONLY the determined category's types/styles/attributes
 */
function getCategorySpecificPrompt(determinedCategory: string, promptOptions?: Record<string, any>): string {
  const primaryAttrs = getPrimaryAttributesForPrompt();
  const typeHierarchy = getTypeHierarchyExplanation();
  
  // Get ONLY this category's context
  const categorySchema = getCategorySchema(determinedCategory);
  const validTypes = getValidTypesForCategory(determinedCategory);
  const validStyles = getValidStylesForCategory(determinedCategory);
  
  // Inject strict type validation warning if in retry mode
  let strictTypeWarning = '';
  if (promptOptions?.strictTypeMode && promptOptions?.invalidTypeWarning) {
    strictTypeWarning = `

🚨 TYPE VALIDATION WARNING 🚨
${promptOptions.invalidTypeWarning}

`;
  }
  
  // Build category-specific type selection guidance
  let typeSelectionGuide = '';
  if (validTypes.length > 0) {
    typeSelectionGuide = `\n== HOW TO EXTRACT PRODUCT TYPE ==\n`;
    
    // Category-specific extraction hints
    const categoryLower = determinedCategory.toLowerCase();
    if (categoryLower.includes('ceiling fan')) {
      typeSelectionGuide += `For Ceiling Fans, look for these keywords in title/description/specifications:\n\n`;
      typeSelectionGuide += `⚠️ CHECK FOR ACCESSORIES FIRST (highest priority):\n`;
      typeSelectionGuide += `  - "Downrod" / "Down Rod" / "Extension Rod" → Type: Accessory\n`;
      typeSelectionGuide += `  - "Remote" / "Remote Control" / "Wall Control" / "Controller" → Type: Accessory\n`;
      typeSelectionGuide += `  - "Light Kit" / "Light Fixture Kit" / "Lighting Kit" → Type: Accessory\n`;
      typeSelectionGuide += `  - "Blades" / "Fan Blades" / "Replacement Blades" → Type: Accessory\n`;
      typeSelectionGuide += `  - "Receiver" / "Transmitter" / "Canopy" / "Mounting" → Type: Accessory\n`;
      typeSelectionGuide += `  - If product is NOT a complete ceiling fan unit → Type: Accessory\n\n`;
      typeSelectionGuide += `IF NOT AN ACCESSORY, then check installation location:\n`;
      typeSelectionGuide += `  - "Hugger" / "Low Profile" / "Flush Mount" / "Flushmount" / "Close to Ceiling" → Type: Hugger\n`;
      typeSelectionGuide += `  - "Outdoor" / "Wet Rated" / "UL Listed for Wet Locations" / "Damp Rated" / "Weather" → Type: Outdoor\n`;
      typeSelectionGuide += `  - "Indoor" / "Interior" → Type: Indoor\n`;
      typeSelectionGuide += `  - "Indoor / Outdoor" (BOTH mentioned) → Type: Outdoor (more versatile rating)\n\n`;
      typeSelectionGuide += `**Priority Order:** Accessory → Hugger → Outdoor → Indoor\n`;
    } else if (categoryLower.includes('refrigerator')) {
      typeSelectionGuide += `For Refrigerators, analyze door configuration from images/specs:\n`;
      typeSelectionGuide += `  - Count doors and their arrangement\n`;
      typeSelectionGuide += `  - Look for "French Door", "Side-by-Side", "Top Freezer", "Bottom Freezer", "4-Door Flex"\n`;
    } else if (categoryLower.includes('oven')) {
      typeSelectionGuide += `For Ovens, analyze model number and cavity count:\n`;
      typeSelectionGuide += `  - Model with "30" or "OB30" → 30" built-in\n`;
      typeSelectionGuide += `  - Check specs for "single cavity" vs "double cavity"\n`;
      typeSelectionGuide += `  - Look for "Single", "Double Wall", "Combination" in title\n`;
    } else if (categoryLower.includes('faucet')) {
      typeSelectionGuide += `For Faucets, check handle count and spray type:\n`;
      typeSelectionGuide += `  - Look for "Single Handle", "Two Handle", "Widespread"\n`;
      typeSelectionGuide += `  - Check for "Pull-Down", "Pull-Out" spray configurations\n`;
    } else if (categoryLower.includes('chandelier')) {
      typeSelectionGuide += `For Chandeliers, look for structural indicators:\n`;
      typeSelectionGuide += `  - "Tier" / "Tiered" / number of tiers\n`;
      typeSelectionGuide += `  - "Candle" style, "Drum" shade, "Crystal" type\n`;
    } else if (categoryLower.includes('door hardware')) {
      typeSelectionGuide += `For Door Hardware, check lock mechanism:\n`;
      typeSelectionGuide += `  - "Passage" (no lock), "Privacy" (push-button), "Entry" (keyed)\n`;
      typeSelectionGuide += `  - "Dummy" (non-functional), "Single Cylinder", "Double Cylinder"\n`;
    } else {
      typeSelectionGuide += `Extraction strategy:\n`;
      typeSelectionGuide += `  1. Check product title for type keywords\n`;
      typeSelectionGuide += `  2. Review specifications for functional variations\n`;
      typeSelectionGuide += `  3. Analyze product images if available\n`;
      typeSelectionGuide += `  4. Look for configuration details (door count, handle count, installation method)\n`;
    }
    
    typeSelectionGuide += `\n**Decision Process:**\n`;
    typeSelectionGuide += `  1. **FIRST**: Check if product is an accessory/component (not a complete unit)\n`;
    typeSelectionGuide += `     - Downrods, remotes, controls, light kits, blades → Type: Accessory\n`;
    typeSelectionGuide += `  2. Read product title carefully for remaining type keywords\n`;
    typeSelectionGuide += `  3. If multiple types mentioned (e.g., "Indoor / Outdoor"):\n`;
    typeSelectionGuide += `     - Choose the MORE SPECIFIC or MORE CAPABLE type\n`;
    typeSelectionGuide += `     - "Indoor / Outdoor" → Outdoor (wet-rated is more versatile)\n`;
    typeSelectionGuide += `     - "Hugger" mentioned anywhere → Hugger (specific installation type)\n`;
    typeSelectionGuide += `  4. Check specifications and description for confirmation\n`;
    typeSelectionGuide += `  5. Select BEST match from types list even if slightly uncertain\n`;
    typeSelectionGuide += `  6. Only use "Not Found" if genuinely cannot determine from available data\n`;
    typeSelectionGuide += `  7. NEVER use "Not Applicable" (product is already in correct category)\n`;
  }
  
  // Build category-specific type list
  let categoryTypeContext = '';
  if (validTypes.length > 0) {
    categoryTypeContext = `\n== VALID PRODUCT TYPES FOR ${determinedCategory.toUpperCase()} ==\n`;
    categoryTypeContext += validTypes.map((t: string, idx: number) => `  ${idx + 1}. ${t}`).join('\n');
    categoryTypeContext += '\n\n⚠️ CRITICAL: ONLY select types from the list above. Do NOT use types from other categories.';
  } else {
    categoryTypeContext = `\n== PRODUCT TYPE ==\nThis category does not have type variations. Use "Not Applicable" for product_type field.`;
  }
  
  // Build category-specific style list
  const categoryStyleContext = `\n== VALID DESIGN STYLES ==\nUniversal design styles (apply to all categories):\n${validStyles.map((s: string, idx: number) => `  ${idx + 1}. ${s}`).join('\n')}`;
  
  // Build category-specific top15 attributes
  let categoryTop15Context = '';
  if (categorySchema && categorySchema.top15FilterAttributes.length > 0) {
    categoryTop15Context = `\n== TOP 15 FILTER ATTRIBUTES FOR ${determinedCategory.toUpperCase()} ==\n`;
    categoryTop15Context += `⚠️ CRITICAL: Use the field_key shown in parentheses in your JSON response.\n\n`;
    categoryTop15Context += categorySchema.top15FilterAttributes
      .map((attr: any, idx: number) => `   ${idx + 1}. "${attr.name}" (use key: "${attr.fieldKey}")`)
      .join('\n');
  } else {
    categoryTop15Context = `\n== TOP 15 FILTER ATTRIBUTES ==\nNo specific filter attributes defined for this category.`;
  }
  
  return `You are an expert product data analyst specializing in appliances and home products.

⚠️ CATEGORY CONTEXT: This product has been determined to be in the "${determinedCategory}" category.
Your task is to analyze the product and populate ALL fields specific to this category.${strictTypeWarning}

Your task is to:
1. ANALYZE the raw product data provided
2. DETERMINE the product's TYPE (functional variation within ${determinedCategory} category)
3. MAP the raw data to the correct attributes for ${determinedCategory}
4. VERIFY and CLEAN the data (fix obvious errors, standardize formats)
5. IDENTIFY any missing required fields
6. GENERATE high-quality, customer-facing text for title, description, and features

${typeHierarchy}
${typeSelectionGuide}
${categoryTypeContext}
${categoryStyleContext}
${categoryTop15Context}

== PRIMARY ATTRIBUTES (Same for ALL products) ==
${primaryAttrs}

== RESPONSE FORMAT ==

You must respond with valid JSON in this exact format:
{
  "category": {
    "name": "${determinedCategory}",
    "confidence": 0.95,
    "reasoning": "Category already determined in Stage 1"
  },
  "primary_attributes": {
    "brand": "value",
    "category_subcategory": "${determinedCategory}",
    "product_family": "value",
    "product_type": "⚠️ MANDATORY: Select from the VALID PRODUCT TYPES list above. This is the FUNCTIONAL variation (e.g., 'Indoor' for ceiling fans, 'Single' vs 'Double Wall' for ovens). Use 'Not Found' only if genuinely cannot determine from data.",
    "product_style": "⚠️ MANDATORY: Select DESIGN AESTHETIC from VALID DESIGN STYLES (e.g., Contemporary, Modern, Traditional). DO NOT put functional types here.",
    "depth_length": "numeric value only (depth OR length)",
    "width": "numeric value only",
    "height": "numeric value only",
    "weight": "numeric value in lbs",
    "msrp": "Manufacturer's Suggested Retail Price (NOT current sale price)",
    "description": "Enhanced customer-ready description (max 500 chars)",
    "product_title": "BRAND + SPEC + TYPE + CATEGORY + FINISH + MODEL",
    "details": "additional details",
    "features_list": "HTML <ul><li> format",
    "upc_gtin": "value",
    "model_number": "value",
    "model_number_alias": "symbols removed",
    "model_parent": "parent model if variant",
    "model_variant_number": "variant identifier",
    "total_model_variants": "comma-separated list"
  },
  "top15_filter_attributes": {
    "field_key": "value (use field_key from parentheses above, NOT attribute name)"
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

⚠️ CRITICAL FIELD VALUE RULES:
- NEVER leave fields blank or null
- Use actual value if found
- Use "Not Found" if searched but not available
- Use "Not Applicable" ONLY if field doesn't apply to this category
- For product_type: Since product IS in ${determinedCategory} category, use "Not Found" if cannot determine (NOT "Not Applicable")`;
}

/**
 * LEGACY PROMPT: Full prompt with all categories (kept for comparison/fallback)
 * This was the old single-stage approach that caused cross-contamination
 */
function getSystemPrompt(): string {
  const primaryAttrs = getPrimaryAttributesForPrompt();
  const categoryTop15 = getAllCategoriesWithTop15ForPrompt();
  const categoryList = getCategoryListForPrompt();
  const categoryStyles = getAllCategoriesWithStylesForPrompt();
  const categoryTypes = getAllCategoriesWithTypesForPrompt();
  const typeHierarchy = getTypeHierarchyExplanation();
  
  return `You are an expert product data analyst specializing in appliances and home products.

Your task is to:
1. ANALYZE the raw product data provided
2. DETERMINE which category from our master list the product belongs to
3. DETERMINE the product's TYPE (functional variation within category)
4. MAP the raw data to the correct attributes for that category
5. VERIFY and CLEAN the data (fix obvious errors, standardize formats)
6. IDENTIFY any missing required fields
7. GENERATE high-quality, customer-facing text for title, description, and features

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

⚠️ CRITICAL: FIELD NAME MAPPING
You MUST use the exact field_key names shown below in your JSON response. Sources may use different terminology - map them correctly:

**MSRP Field Mapping:**
- Source says: "MSRP", "Manufacturer's Suggested Retail Price", "List Price", "Retail Price", "SRP", "Suggested Retail"
- Output field: "msrp": "value"

**Weight Field Mapping:**
- Source says: "Weight", "Shipping Weight", "Net Weight", "Product Weight"
- Output field: "weight": "value in lbs" (convert kg to lbs if needed)

**Dimensions Field Mapping:**
- Source says: "Depth", "Length" → Output: "depth_length": "value"
- Source says: "Width", "W" → Output: "width": "value"  
- Source says: "Height", "H" → Output: "height": "value"

**UPC Field Mapping:**
- Source says: "UPC", "GTIN", "Barcode", "Product Code", "UPC/EAN"
- Output field: "upc_gtin": "value"

== PRIMARY ATTRIBUTES (Same for ALL products) ==
${primaryAttrs}

== TOP 15 FILTER ATTRIBUTES (Category-specific) ==
⚠️ CRITICAL: When populating top15_filter_attributes in your JSON response, you MUST use the field_key shown in parentheses (e.g., "horsepower", "feed_type"), NOT the full attribute name.
${categoryTop15}

${typeHierarchy}

== VALID PRODUCT TYPES (MANDATORY - Determines functional variation) ==
⚠️ CRITICAL: For product_type, you MUST analyze ALL available data (title, model number, specs, images, research) and select the BEST matching type from the list below.

**Type Selection Rules:**
- Type represents the FUNCTIONAL CONFIGURATION within a category
- You MUST select a value from the types list for the determined category
- 🔴 CRITICAL: ONLY select types that appear under YOUR CATEGORY in the list below
- 🔴 DO NOT select types from other categories even if they seem related
  - Example: "Dishwasher Pull" is for Cabinet Hardware → Appliance Pull, NOT for Dishwasher appliances
  - Example: "Single Handle" is for Kitchen Faucet, NOT for Bar Faucet (different types for each)
  - Example: "Shower" type belongs to Bathtub category, NOT to Shower category (different products)
- Analyze model numbers, product titles, specifications, images, and descriptions
- Example: Oven → analyze model (OB30 = 30" built-in = Single), specs (one cavity = Single) → select "Single" or "Double Wall"
- Example: Refrigerator → analyze door configuration from images/specs → select "French Door" or "Side-by-Side"  
- Example: Kitchen Faucet → analyze handle count and spray type → select "Single Handle" or "Pull-Down"
- Example: Ceiling Fan → check title/specs for "Indoor", "Outdoor", "Hugger", "Low Profile", "Flush Mount", "Wet Rated", "Damp Rated" → select "Indoor", "Outdoor", or "Hugger"

**When to use "Not Applicable":**
- ⚠️ ONLY use "Not Applicable" if you are verifying a product from a DIFFERENT category
- Example: Analyzing a Refrigerator but the field asks for "Oven Type" → "Not Applicable"
- Example: Analyzing a Sink but the field asks for "Refrigerator Door Type" → "Not Applicable"
- ❌ NEVER use "Not Applicable" if the product IS in the category being analyzed
- ❌ If you can't determine the type but the product IS in this category, use "Not Found" NOT "Not Applicable"

**Decision Process:**
1. Confirm the product IS in this category (if not, use "Not Applicable")
2. Examine model number (e.g., "OB30SDPTX1" → OB=Oven Built-in, 30=30-inch → likely Single)
3. Review specifications (cavity count, door configuration, handle count, etc.)
4. Analyze images (door style, configuration, handles)
5. Check product title and description
   - **Ceiling Fans**: Look for "Indoor", "Outdoor", "Hugger", "Low Profile", "Flush Mount", "Wet Rated", "Damp Rated", or "UL Listed for Damp/Wet Locations" in title/description
   - **Chandeliers**: Look for "Tier/Tiered" (number of tiers), "Candle" (candle-style), "Drum" (drum shade), "Crystal" (crystal type)
   - **Door Hardware**: Look for "Passage", "Privacy", "Entry", "Dummy", "Single Cylinder", "Double Cylinder" in title/description
6. Select the BEST match from the types list even if slightly uncertain
7. If genuinely cannot determine AND product IS in category → use "Not Found"

${categoryTypes}

== VALID CATEGORY STYLES (MANDATORY - Select the BEST matching DESIGN AESTHETIC from this list) ==
⚠️ CRITICAL: For product_style, select the DESIGN AESTHETIC that best describes the product's visual appearance.
- These are DESIGN/AESTHETIC styles (e.g., Contemporary, Modern, Traditional, Industrial)
- The final value MUST be one from the list below - this ensures proper website categorization
- Analyze the product's visual design language, era influences, and aesthetic qualities
- Example: A sleek minimalist oven with clean lines → "Contemporary" or "Modern"
- Example: A decorative chandelier with ornate details → "Traditional" or "Victorian"
- Example: An exposed-bulb industrial pendant → "Industrial"
- DO NOT put functional types here (use product_type for functional types like "Single", "French Door")
- If genuinely no style from the list applies, use "Not Applicable"
${categoryStyles}

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
    "product_type": "⚠️ MANDATORY: Analyze ALL data (model number, title, specs, images) and select the BEST matching type from the 'VALID PRODUCT TYPES' list for this category. This is the FUNCTIONAL VARIATION (e.g., 'Single' vs 'Double Wall' for ovens, 'French Door' vs 'Side-by-Side' for refrigerators). If product IS in this category but type cannot be determined, use 'Not Found'. ONLY use 'Not Applicable' if product is from a different category than what this field is for.",
    "product_style": "⚠️ MANDATORY: Select the DESIGN AESTHETIC from the 'VALID CATEGORY STYLES' list that best matches this product's visual style. These are aesthetic/visual terms like 'Contemporary', 'Modern', 'Traditional', 'Industrial', 'Farmhouse'. Analyze the product's design language and visual appearance to pick the best match. DO NOT put functional types here (those go in product_type).",
    "depth_length": "numeric value only (depth OR length - use whichever applies; for round items use diameter)",
    "width": "numeric value only (width; for round items use same as depth_length)",
    "height": "numeric value only",
    "weight": "numeric value in lbs",
    "msrp": "⚠️ CRITICAL: Manufacturer's Suggested Retail Price ONLY (also called 'List Price', 'Retail Price', 'SRP' in sources). Use the HIGHEST price found from official sources (manufacturer website, spec sheets, authorized retailers). DO NOT use current sale prices, street prices, or discounted market values. MSRP must be the original manufacturer's suggested price, NOT current market/selling price.",
    "description": "ENHANCED customer-ready description (max 500 chars, complete sentences, professional tone)",
    "product_title": "⚠️ TITLE FORMAT: BRAND + PRIMARY_SPEC + CONFIG/TYPE + INSTALL + CATEGORY + FINISH + MODEL. NO FEATURES OR PARENTHETICAL TEXT. Example: 'Delta Trinsic Single Handle Pull-Down Kitchen Faucet Matte Black' NOT 'Delta Trinsic Kitchen Faucet (Touch2O Technology)'",
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
    "field_key": "value (CRITICAL: Use the field_key shown in parentheses above, NOT the attribute name. Example: 'horsepower': '1/3 HP', NOT 'Horsepower': '1/3 HP')"
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

🔴 CRITICAL CATEGORY SELECTION RULES:
- Use ONLY the categories listed above
- Map raw data fields to our standard field_key names (see FIELD NAME MAPPING section above)
  - Example: Source "List Price: $1299" → Output: "msrp": "1299"
  - Example: Source "Manufacturer's Suggested Retail Price: $1299" → Output: "msrp": "1299"
  - Example: Source "Shipping Weight: 45 lbs" → Output: "weight": "45"
- Standardize units (dimensions in inches, capacity in cu. ft., weight in lbs)
- Clean up formatting (proper capitalization, remove extra spaces)
- Flag fields you cannot determine with confidence
- For TOP 15 attributes, use only the attributes defined for the determined category
- ALWAYS generate a features_list even if no features are in the raw data - extract them from description and specs

## ⚠️ CRITICAL: FIELD VALUE RULES - NEVER LEAVE FIELDS BLANK

For EVERY field, you MUST provide a value. Use these markers when appropriate:

**"Not Found"** - Use when:
- You searched for the data but could not find it in any source
- The information simply isn't available anywhere
- You cannot determine the value despite thorough research
- Example: Brand not mentioned in any source → brand: "Not Found"
- Example: Oven type cannot be determined from model/specs/images → product_type: "Not Found"

**"Not Applicable"** - Use when:
- The field DOES NOT APPLY to the product's category
- You are analyzing a product from a DIFFERENT category than the field asks for
- Example: Verifying a Refrigerator but field asks for "number_of_burners" (range attribute) → "Not Applicable"
- Example: Verifying a Showerhead but field asks for "oven_type" (oven attribute) → "Not Applicable"
- Example: Verifying a Ceiling Fan but field asks for "refrigerator_door_type" → "Not Applicable"
- ❌ NEVER use for category/type fields when product IS in that category - use "Not Found" instead

**Critical Distinction:**
- Product IS an Oven, can't determine type → product_type: "Not Found" (not "Not Applicable")
- Product is a Refrigerator, field asks for oven_type → oven_type: "Not Applicable" (different category)

**NEVER leave a field empty or null** - Always use one of:
- The actual value (if found)
- "Not Found" (if searched but not found, or cannot determine)
- "Not Applicable" (if field doesn't apply to product's category)

When analyzing data:
1. ALWAYS examine all provided URLs, documents, images, and spec tables
2. Extract every possible detail from images (color, finish, style, features)
3. Parse HTML spec tables for ALL available specifications
4. Use image-detected product type to help determine subcategory
5. Cross-reference multiple sources when available`;
}

interface PromptOptions {
  researchContext?: string;
  modelMismatchWarning?: string;
  externalDataTrusted?: boolean;
  strictCategoryMode?: boolean;  // Phase 2: Retry with stricter validation
  invalidCategoryWarning?: string;  // Phase 2: Warning about invalid previous selection
  strictTypeMode?: boolean;  // Phase 2.5: Retry with stricter type validation
  invalidTypeWarning?: string;  // Phase 2.5: Warning about invalid type for category
  dataCoherenceWarnings?: {
    conflicts: Array<{
      type: string;
      severity: string;
      description: string;
      source1: string;
      source2: string;
      value1: string;
      value2: string;
    }>;
    warnings: string[];
    recommendation: string;
  };
}

/**
 * Sanitize raw product data for AI prompt - CRITICAL DATA INTEGRITY
 * Removes contaminating fields that would bias AI verification
 * 
 * FILTERS OUT:
 * 1. Prior_Response_Data - Our own previous AI output (circular logic risk)
 * 2. Any AI_ prefixed fields - Past verification results should NOT influence new verification
 * 3. Any other fields that represent derived/computed data
 * 
 * WHY THIS MATTERS:
 * If AI sees its previous output as "input data", it may echo it back instead of
 * performing independent verification. This creates circular logic where wrong answers
 * get reinforced instead of corrected.
 */
function sanitizeProductDataForAI(rawProduct: SalesforceIncomingProduct): any {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(rawProduct)) {
    // FILTER 1: Remove Prior_Response_Data entirely
    if (key === 'Prior_Response_Data') {
      continue; // Skip - this is our own previous output
    }
    
    // FILTER 2: Remove any AI_ prefixed fields (past verification outputs)
    if (key.startsWith('AI_')) {
      continue; // Skip - these are derived fields from previous verifications
    }
    
    // FILTER 3: Remove any _Verified or _Lookup suffix fields (also our outputs)
    if (key.endsWith('_Verified') || key.endsWith('_Lookup')) {
      continue; // Skip - these are computed fields
    }
    
    // Keep all legitimate input data (Ferguson, Web_Retailer, Legacy, etc.)
    sanitized[key] = value;
  }
  
  return sanitized;
}

function buildAnalysisPrompt(rawProduct: SalesforceIncomingProduct, options?: PromptOptions | string): string {
  // Support legacy signature: buildAnalysisPrompt(rawProduct, researchContext)
  const opts: PromptOptions = typeof options === 'string' 
    ? { researchContext: options }
    : (options || {});
    
  const { researchContext, modelMismatchWarning, externalDataTrusted = true, dataCoherenceWarnings } = opts;
  
  // CRITICAL: Sanitize product data to remove AI output fields before showing to AI
  const cleanProductData = sanitizeProductDataForAI(rawProduct);
  
  let prompt = `You are a product data VERIFICATION specialist. Your job is to INDEPENDENTLY VERIFY product information, not blindly trust it.

## ⛔ STOP - READ THIS FIRST - MOST COMMON MISTAKE ⛔

### APPLIANCE-SPECIFIC PARTS vs. DECORATIVE HARDWARE:

**MANDATORY CHECKPOINT - ANSWER THESE QUESTIONS FIRST:**
1. Does the product title/description say "for [Brand Name] [Appliance Type]"? (e.g., "for Café Range", "for GE Refrigerator")
2. Does it include a specific appliance model number? (e.g., "CXPR8HKPTFB", "WR12X29352")
3. Is it made BY an appliance manufacturer? (GE, Café, Whirlpool, Samsung, LG, etc.)
4. Does it say "compatible with", "replacement for", "designed for" a SPECIFIC appliance brand/model?

**IF YES TO ANY ABOVE:**
✅ **CATEGORY** = The APPLIANCE type (Refrigerator, Range, Dishwasher, Oven, etc.)
✅ **TYPE** = "Accessory"
✅ **NEVER use:** "Appliance Pull", "Refrigerator Pull", "Dishwasher Pull", "Cabinet Pull"

**EXAMPLE - CORRECT:**
- Product: "Café Handle & Knob Set for Pro Range Model CXPR8HKPTFB"
- ✅ Category: "Refrigerator" or "Range"
- ✅ Type: "Accessory"  
- ❌ NOT: "Appliance Pull"

**IF NO TO ALL ABOVE (generic decorative hardware):**
- Then use "Cabinet Pull", "Appliance Pull

", etc. (decorative hardware categories)

**WHY THIS MATTERS:**
- "Appliance Pull" = Generic decorative cabinet hardware (Hardware department)
- Appliance Categories + Type "Accessory" = Manufacturer-specific replacement parts (Appliances department)
- This is the #1 most common categorization error - DO NOT GET THIS WRONG

---

## 🔴 CRITICAL: FIELD VALUE RULES - NEVER LEAVE FIELDS BLANK

For EVERY field in your response, you MUST provide a value. Use these markers when data is unavailable:

**"Not Found"** - Use when:
- You searched for the data but could not find it in any source
- The information simply isn't available anywhere
- You cannot determine the value despite thorough research
- Example: Brand not mentioned in any source → brand: "Not Found"
- Example: Oven type cannot be determined from model/specs/images → product_type: "Not Found"

**"Not Applicable"** - Use when:
- The field DOES NOT APPLY to the product's category
- You are analyzing a product from a DIFFERENT category than the field asks for
- Example: Verifying a Refrigerator but field asks for "number_of_burners" (range attribute) → "Not Applicable"
- Example: Verifying a Showerhead but field asks for "oven_type" (oven attribute) → "Not Applicable"
- ❌ NEVER use "Not Applicable" for category/type fields when product IS in that category - use "Not Found" instead

**Critical Distinction:**
- Product IS an Oven, can't determine type → product_type: "Not Found" ✅
- Product is a Refrigerator, field asks for oven_type → oven_type: "Not Applicable" ✅

**NEVER leave a field empty or null** - Always use one of:
1. The actual value (if found)
2. "Not Found" (if searched but not found, or cannot determine)
3. "Not Applicable" (if field doesn't apply to product's category)

---

## YOUR ROLE: VERIFY, DON'T TRUST
The data below is UNVERIFIED input that may contain errors, wrong products, or incomplete information.
- Treat ALL input data as "claims to investigate" NOT "facts to accept"
- Use web search, URLs, and documents to INDEPENDENTLY CONFIRM each data point
- If your research contradicts the input data, TRUST YOUR RESEARCH
- EXCLUDE any input data you determine to be incorrect
- ADD any additional data you discover through research

## ⚠️ DATA SOURCE TRUST HIERARCHY (CRITICAL!)

### PRIMARY TRUSTED SOURCES (Use these for verification):
1. **Ferguson_Raw_Data / Ferguson_* fields** - Fresh API data from Ferguson, generally reliable
2. **Web_Retailer_* fields** - Web scraped data, verify against Ferguson when possible
3. **Your web research** - Search results and URL scraping you perform

### UNTRUSTED SOURCE (IGNORE FOR VERIFICATION):
4. **_Legacy fields** (Brand_Legacy, Category_Legacy, etc.)
   - These contain OLD manually-entered data that is UNRELIABLE
   - **NEVER use Legacy data to populate ANY field in your response**
   - **NEVER reference or include Legacy values in verification results**
   - **ONLY use Legacy data (internally) for:**
     a) Confirming the CATEGORY of the product if uncertain (e.g., is this a faucet or a fan?)
     b) Confirming the BRAND of the product if there's conflicting data
     c) Example: If Web_Retailer says "Broan fan" and Ferguson says "Riobel showerhead", 
        check Category_Legacy to determine what the product ACTUALLY is
   - **THIS IS INTERNAL GUIDANCE ONLY** - do NOT include Legacy data in your response!

### DATA CONFLICT RESOLUTION:
When Ferguson and Web_Retailer CONTRADICT each other:
1. First, try to determine which is correct through your own web research
2. If still unclear, check Legacy Category/Brand for a directional hint
3. Use this ONLY to decide which source to TRUST - then verify with that source
4. **CRITICAL: Your final response should ONLY contain verified data from Ferguson/Web_Retailer/Research - NEVER Legacy values**

## RAW PRODUCT DATA (UNVERIFIED - REQUIRES CONFIRMATION):
${JSON.stringify(cleanProductData, null, 2)}
`;

  // Add DATA COHERENCE WARNING if conflicts detected
  // This helps the AI reason about which data sources are correct vs wrong
  if (dataCoherenceWarnings && (dataCoherenceWarnings.conflicts.length > 0 || dataCoherenceWarnings.warnings.length > 0)) {
    prompt += `

=== ⚠️ DATA CONFLICT ALERT - USE REASONING TO DETERMINE CORRECT DATA ⚠️ ===
Our system detected potential conflicts in the provided data sources. 
**YOUR TASK**: Analyze ALL data, use your reasoning to determine which sources are CORRECT vs WRONG.

**DETECTED CONFLICTS:**
${dataCoherenceWarnings.conflicts.map(c => `
- [${c.severity.toUpperCase()}] ${c.type}:
  ${c.description}
  Source 1 (${c.source1}): "${c.value1}"
  Source 2 (${c.source2}): "${c.value2}"
`).join('\n')}

${dataCoherenceWarnings.warnings.length > 0 ? `**WARNINGS:**\n${dataCoherenceWarnings.warnings.map(w => `- ${w}`).join('\n')}\n` : ''}

**REASONING REQUIRED**:
When you see conflicting data (e.g., URLs pointing to different products than the structured data):
1. Look at the MAJORITY of evidence - does most data point to Product A or Product B?
2. Check consistency - do Title, Brand, Description all align with the same product?
3. URLs/scraped content that describe a completely DIFFERENT product category are likely BAD DATA
   - Example: If Ferguson_Brand="Meyda Tiffany" and Ferguson_Title="Lily Lamp" but 
     the URL scraped data shows "PVC Cleaner" - the URL is clearly wrong
4. Trust structured fields (Brand, Title, Description) over scraped URL content when they conflict
5. Document which data sources you are IGNORING and why in your corrections

**MAKE YOUR DETERMINATION**: Decide which product this ACTUALLY is based on preponderance of evidence.
=== END DATA CONFLICT ALERT ===
`;
  }

  // Add CRITICAL model mismatch warning if detected
  if (modelMismatchWarning || !externalDataTrusted) {
    prompt += `

=== ⛔ CRITICAL MODEL NUMBER MISMATCH WARNING ⛔ ===
${modelMismatchWarning || 'External data may be from a DIFFERENT model variant.'}

**DO NOT USE** external data for the following variant-specific attributes:
- color (different variants have different colors, e.g., -BL = Black, -CP = Chrome)
- finish (different variants have different finishes)
- model_number (use the REQUESTED model number from SF_Catalog_Name)
- Any attributes that would differ between product variants

**ONLY USE external data for:**
- Brand name (same across variants)
- Product category/type
- Base dimensions (if same across variants)
- General product features (if not variant-specific)

For color/finish: ONLY use if the data source explicitly matches the requested model number.
If unsure, use "Not Found" rather than guessing from mismatched data.
=== END MODEL MISMATCH WARNING ===
`;
  }

  // Add research context if available
  if (researchContext && researchContext.trim()) {
    prompt += `

=== RESEARCH DATA (Retrieved from URLs/documents/images) ===
The following data was retrieved by fetching actual web pages, downloading PDFs, and analyzing product images.
**USE THIS DATA TO VERIFY** the raw input data above. If this research data contradicts the input, TRUST THE RESEARCH.
${!externalDataTrusted ? '\n⚠️ WARNING: Some research data may be from a different model variant. Verify model numbers match.\n' : ''}${dataCoherenceWarnings?.conflicts.length ? '\n⚠️ NOTE: Conflicts detected between sources. Use your judgment to determine what is correct.\n' : ''}
${researchContext}
=== END RESEARCH DATA ===
`;
  }

  prompt += `

## VERIFICATION TASKS (In Order of Priority):

### 1. INDEPENDENT VERIFICATION (CRITICAL)
- **Search the web** for the model number and/or product name
- **Access ALL provided URLs** (Ferguson_URL, Reference_URL) to see actual product pages
- **Read documents/PDFs** for specifications
- **Cross-reference multiple sources** to confirm what product this actually is

### 2. DETERMINE THE TRUTH
- Compare input data against your research findings
- If input says "Brand A" but URLs/web show "Brand B" → Use Brand B
- If input says "Lamp" but research shows "PVC Cleaner" → Use PVC Cleaner
- Trust the PREPONDERANCE OF EVIDENCE from your research

### 3. EXCLUDE INCORRECT DATA
- Document any input fields that are WRONG based on your research
- In corrections, list: field name, wrong value received, correct value from research, source

### 4. ENRICH WITH DISCOVERED DATA
- Add specifications, features, dimensions found in your research that weren't in input
- Fill in missing fields using your research
- Provide complete, accurate product data

### 5. CATEGORY MAPPING
- Based on your VERIFIED product identity, determine the correct category
- Map all VERIFIED data to the correct attribute fields

### 6. DATA QUALITY
${dataCoherenceWarnings?.conflicts.length ? '- ⚠️ DISCARD any input data that conflicts with your research findings' : ''}
${!externalDataTrusted ? '- ⚠️ VERIFY model numbers match before using variant-specific data' : ''}
- Clean and enhance ALL customer-facing text
- Fix brand encoding issues (e.g., "Caf(eback)" → "Café")
- Ensure professional grammar and formatting
- Generate features_list with 5-10 key features

### 7. FIELD COMPLETION
- Use verified value if confirmed by research
- Use "Not Found" if you searched but couldn't verify
- Use "Not Applicable" if field doesn't apply to this product type
- NEVER leave fields blank

### 8. DOCUMENT YOUR WORK
- List all corrections (input value vs verified value)
- List data sources used for verification
- Note any input data you excluded as incorrect and why

The product_title, description, and features_list will be displayed directly to customers.
They MUST be professional, well-formatted, and error-free.

Return your analysis as JSON.`;

  return prompt;
}

function parseAIResponse(parsed: any, provider: 'openai' | 'xai'): AIAnalysisResult {
  return {
    provider,
    success: true,
    determinedDepartment: parsed.department?.name || undefined,
    departmentConfidence: parsed.department?.confidence || undefined,
    departmentReasoning: parsed.department?.reasoning || undefined,
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

/**
 * POST-CONSENSUS VALIDATION: Enforces critical business rules after AI consensus
 * This catches systematic errors where both AIs agree on the WRONG category
 * 
 * CRITICAL RULE: Manufacturer-specific appliance parts must use appliance category + Type="Accessory"
 * NOT decorative hardware categories like "Appliance Pull"
 */
interface CategoryValidationResult {
  isValid: boolean;
  correctedCategory?: string;
  correctedType?: string;
  reason?: string;
  violatedRule?: string;
}

function validateConsensusCategory(
  agreedCategory: string,
  rawProduct: SalesforceIncomingProduct,
  agreedPrimaryAttributes: Record<string, any>
): CategoryValidationResult {
  
  // Extract key fields for analysis
  const title = (rawProduct.Product_Title_Web_Retailer || rawProduct.Product_Title_Legacy || '').toLowerCase();
  const description = (rawProduct.Product_Description_Web_Retailer || rawProduct.Product_Description_Legacy || '').toLowerCase();
  const modelNumber = rawProduct.Model_Number_Web_Retailer || '';
  const brand = agreedPrimaryAttributes.brand || rawProduct.Brand_Web_Retailer || '';
  
  // RULE 1: Appliance-specific parts must use appliance category, NOT decorative hardware
  // Pattern: "for [Brand] [Appliance]" + model number = manufacturer replacement part
  
  const applianceManufacturers = [
    'ge', 'general electric', 'café', 'cafe', 'monogram',
    'whirlpool', 'kitchenaid', 'maytag', 'jenn-air', 'amana',
    'samsung', 'lg', 'frigidaire', 'electrolux',
    'bosch', 'thermador', 'viking', 'wolf', 'sub-zero',
    'miele', 'dacor', 'haier', 'kenmore'
  ];
  
  const hasApplianceBrand = applianceManufacturers.some(mfg => 
    brand.toLowerCase().includes(mfg) || 
    title.includes(mfg)
  );
  
  // Check for "for [appliance type]" patterns
  const applianceForPatterns = [
    /for\s+(refrigerator|fridge|range|oven|dishwasher|cooktop|microwave|freezer)/i,
    /for\s+\w+\s+(refrigerator|fridge|range|oven|dishwasher|cooktop|microwave)/i, // "for GE Range"
    /(refrigerator|range|oven|dishwasher|cooktop|microwave)\s+(handle|knob|part|accessory|kit)/i,
    /(replacement|compatible|designed)\s+(for|with)\s+\w+\s+(model|refrigerator|range|oven|dishwasher)/i,
    /compatible\s+with.*\s+(refrigerator|range|oven|dishwasher|cooktop)/i
  ];
  
  const hasApplianceForPattern = applianceForPatterns.some(pattern => 
    pattern.test(title) || pattern.test(description)
  );
  
  // Check if it's a decorative hardware category (wrong for appliance-specific parts)
  // These are GENERIC categories that should NOT be used for manufacturer-specific parts
  const decorativeHardwareCategories = [
    'appliance pull',
    'refrigerator pull', 
    'dishwasher pull',
    'cabinet pull',
    'cabinet knob',
    'drawer pull',
    'cabinet hardware',
    'kitchen accessory'  // Generic accessory category - wrong for manufacturer parts
  ];
  
  const normalizedCategory = agreedCategory.toLowerCase().trim();
  const isDecorativeHardware = decorativeHardwareCategories.some(cat => 
    normalizedCategory === cat || normalizedCategory.includes(cat)
  );
  
  // ENFORCE RULE: If manufacturer-specific part classified as decorative hardware → WRONG
  if (hasApplianceBrand && hasApplianceForPattern && modelNumber && isDecorativeHardware) {
    
    // Deduce correct appliance category from title/description
    let correctCategory = 'Range'; // Default fallback
    
    if (title.includes('refrigerator') || title.includes('fridge') || description.includes('refrigerator')) {
      correctCategory = 'Refrigerator';
    } else if (title.includes('range') || description.includes('range')) {
      correctCategory = 'Range';
    } else if (title.includes('dishwasher') || description.includes('dishwasher')) {
      correctCategory = 'Dishwasher';
    } else if (title.includes('oven') || description.includes('oven')) {
      correctCategory = 'Oven';
    } else if (title.includes('cooktop') || description.includes('cooktop')) {
      correctCategory = 'Cooktop';
    } else if (title.includes('microwave') || description.includes('microwave')) {
      correctCategory = 'Microwave';
    } else if (title.includes('freezer') || description.includes('freezer')) {
      correctCategory = 'Freezer';
    }
    
    return {
      isValid: false,
      correctedCategory: correctCategory,
      correctedType: 'Accessory',
      reason: `Product is manufacturer-specific replacement part for ${correctCategory} (${brand} model ${modelNumber}), not generic decorative hardware`,
      violatedRule: 'APPLIANCE_ACCESSORIES_VS_DECORATIVE_HARDWARE'
    };
  }
  
  // RULE 2: Could add more validation rules here in the future
  // Example: Validate that category matches Web_Retailer_Category domain
  // Example: Check for category/type mismatches
  
  return { isValid: true };
}

function buildConsensus(openaiResult: AIAnalysisResult, xaiResult: AIAnalysisResult): ConsensusResult {
  const disagreements: ConsensusResult['disagreements'] = [];
  const needsResearch: string[] = [];
  
  // Department consensus (Stage  1)
  let agreedDepartment: string | null = null;
  if (openaiResult.determinedDepartment && xaiResult.determinedDepartment) {
    const departmentsMatch = openaiResult.determinedDepartment === xaiResult.determinedDepartment;
    agreedDepartment = departmentsMatch
      ? openaiResult.determinedDepartment
      : (openaiResult.departmentConfidence! >= xaiResult.departmentConfidence! 
          ? openaiResult.determinedDepartment 
          : xaiResult.determinedDepartment);
    
    if (!departmentsMatch) {
      logger.warn('Department disagreement', {
        openai: openaiResult.determinedDepartment,
        xai: xaiResult.determinedDepartment,
        chosen: agreedDepartment
      });
    }
  }
  
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
  
  // Build agreed attributes first - now with semantic picklist matching
  const agreedPrimary = buildAgreedAttributes(openaiResult.primaryAttributes, xaiResult.primaryAttributes, disagreements, agreedCategory);
  const agreedTop15 = buildAgreedAttributes(openaiResult.top15Attributes, xaiResult.top15Attributes, disagreements, agreedCategory);
  const agreedAdditional = buildAgreedAttributes(openaiResult.additionalAttributes, xaiResult.additionalAttributes, disagreements, agreedCategory);
  
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
    agreedDepartment,
   agreedCategory,
    agreedPrimaryAttributes: agreedPrimary,
    agreedTop15Attributes: agreedTop15,
    agreedAdditionalAttributes: agreedAdditional,
    disagreements,
    needsResearch,
    overallConfidence
  };
}

/**
 * Semantic value matcher - uses picklist matchers to resolve AI outputs to picklist values
 * This enables "Built-in Oven" and "Single" to be recognized as the same type
 * Handles: brand, category, product_type, product_style
 */
function semanticValueMatch(
  openaiVal: any,
  xaiVal: any,
  fieldKey: string,
  agreedCategory: string
): {
  isMatch: boolean;
  resolvedValue: string | null;
  openaiResolved: any;
  xaiResolved: any;
} {
  const noMatch = { isMatch: false, resolvedValue: null, openaiResolved: null, xaiResolved: null };
  
  // Brand matching
  if (fieldKey === 'brand') {
    const openaiMatch = picklistMatcher.matchBrand(String(openaiVal || ''));
    const xaiMatch = picklistMatcher.matchBrand(String(xaiVal || ''));
    
    // Both matched to SAME brand
    if (openaiMatch.matched && xaiMatch.matched && 
        openaiMatch.matchedValue?.brand_id === xaiMatch.matchedValue?.brand_id) {
      return {
        isMatch: true,
        resolvedValue: openaiMatch.matchedValue!.brand_name,
        openaiResolved: openaiMatch.matchedValue!.brand_name,
        xaiResolved: xaiMatch.matchedValue!.brand_name
      };
    }
    
    // Only one matched - use that one
    if (openaiMatch.matched && !xaiMatch.matched) {
      return {
        isMatch: true,
        resolvedValue: openaiMatch.matchedValue!.brand_name,
        openaiResolved: openaiMatch.matchedValue!.brand_name,
        xaiResolved: null
      };
    }
    if (xaiMatch.matched && !openaiMatch.matched) {
      return {
        isMatch: true,
        resolvedValue: xaiMatch.matchedValue!.brand_name,
        openaiResolved: null,
        xaiResolved: xaiMatch.matchedValue!.brand_name
      };
    }
    
    // Both matched but to DIFFERENT brands = real disagreement
    if (openaiMatch.matched && xaiMatch.matched) {
      return {
        isMatch: false,
        resolvedValue: null,
        openaiResolved: openaiMatch.matchedValue!.brand_name,
        xaiResolved: xaiMatch.matchedValue!.brand_name
      };
    }
    
    return noMatch;
  }
  
  // Category matching
  if (fieldKey === 'category' || fieldKey === 'category_subcategory') {
    const openaiMatch = picklistMatcher.matchCategory(String(openaiVal || ''));
    const xaiMatch = picklistMatcher.matchCategory(String(xaiVal || ''));
    
    if (openaiMatch.matched && xaiMatch.matched && 
        openaiMatch.matchedValue?.category_id === xaiMatch.matchedValue?.category_id) {
      return {
        isMatch: true,
        resolvedValue: openaiMatch.matchedValue!.category_name,
        openaiResolved: openaiMatch.matchedValue!.category_name,
        xaiResolved: xaiMatch.matchedValue!.category_name
      };
    }
    
    if (openaiMatch.matched && !xaiMatch.matched) {
      return {
        isMatch: true,
        resolvedValue: openaiMatch.matchedValue!.category_name,
        openaiResolved: openaiMatch.matchedValue!.category_name,
        xaiResolved: null
      };
    }
    if (xaiMatch.matched && !openaiMatch.matched) {
      return {
        isMatch: true,
        resolvedValue: xaiMatch.matchedValue!.category_name,
        openaiResolved: null,
        xaiResolved: xaiMatch.matchedValue!.category_name
      };
    }
    
    if (openaiMatch.matched && xaiMatch.matched) {
      return {
        isMatch: false,
        resolvedValue: null,
        openaiResolved: openaiMatch.matchedValue!.category_name,
        xaiResolved: xaiMatch.matchedValue!.category_name
      };
    }
    
    return noMatch;
  }
  
  // Product Type matching (category-aware)
  if (fieldKey === 'product_type' && agreedCategory) {
    const openaiMatch = matchTypeToPicklist(String(openaiVal || ''), agreedCategory);
    const xaiMatch = matchTypeToPicklist(String(xaiVal || ''), agreedCategory);
    
    // ⚠️ STRICT VALIDATION: Reject types that don't belong to this category
    const categoryMapping = getCategoryTypeMapping(agreedCategory);
    const validTypeNames = categoryMapping?.types.map(t => t.type_name) || [];
    
    // Check if EITHER AI selected an invalid type (cross-contamination detection)
    const openaiInvalid = openaiVal && !openaiMatch.matched && String(openaiVal).toLowerCase() !== 'not found' && String(openaiVal).toLowerCase() !== 'not applicable';
    const xaiInvalid = xaiVal && !xaiMatch.matched && String(xaiVal).toLowerCase() !== 'not found' && String(xaiVal).toLowerCase() !== 'not applicable';
    
    if (openaiInvalid || xaiInvalid) {
      logger.error('🔴 TYPE CROSS-CONTAMINATION DETECTED', {
        category: agreedCategory,
        openaiType: String(openaiVal),
        xaiType: String(xaiVal),
        openaiMatched: openaiMatch.matched,
        xaiMatched: xaiMatch.matched,
        validTypes: validTypeNames.slice(0, 10) // First 10 for reference
      });
      
      // Force to "Not Found" to prevent invalid data
      return {
        isMatch: true,
        resolvedValue: 'Not Found',
        openaiResolved: openaiInvalid ? null : (openaiMatch.matchedValue?.type_name || null),
        xaiResolved: xaiInvalid ? null : (xaiMatch.matchedValue?.type_name || null)
      };
    }
    
    // 🔥 THIS IS THE KEY FIX: "Built-in Oven" and "Single" both map to same type_id
    if (openaiMatch.matched && xaiMatch.matched && 
        openaiMatch.matchedValue?.type_id === xaiMatch.matchedValue?.type_id) {
      return {
        isMatch: true,
        resolvedValue: openaiMatch.matchedValue!.type_name,
        openaiResolved: openaiMatch.matchedValue!.type_name,
        xaiResolved: xaiMatch.matchedValue!.type_name
      };
    }
    
    if (openaiMatch.matched && !xaiMatch.matched) {
      return {
        isMatch: true,
        resolvedValue: openaiMatch.matchedValue!.type_name,
        openaiResolved: openaiMatch.matchedValue!.type_name,
        xaiResolved: null
      };
    }
    if (xaiMatch.matched && !openaiMatch.matched) {
      return {
        isMatch: true,
        resolvedValue: xaiMatch.matchedValue!.type_name,
        openaiResolved: null,
        xaiResolved: xaiMatch.matchedValue!.type_name
      };
    }
    
    if (openaiMatch.matched && xaiMatch.matched) {
      return {
        isMatch: false,
        resolvedValue: null,
        openaiResolved: openaiMatch.matchedValue!.type_name,
        xaiResolved: xaiMatch.matchedValue!.type_name
      };
    }
    
    return noMatch;
  }
  
  // Product Style matching
  if (fieldKey === 'product_style') {
    const openaiMatch = picklistMatcher.matchStyle(String(openaiVal || ''));
    const xaiMatch = picklistMatcher.matchStyle(String(xaiVal || ''));
    
    if (openaiMatch.matched && xaiMatch.matched && 
        openaiMatch.matchedValue?.style_id === xaiMatch.matchedValue?.style_id) {
      return {
        isMatch: true,
        resolvedValue: openaiMatch.matchedValue!.style_name,
        openaiResolved: openaiMatch.matchedValue!.style_name,
        xaiResolved: xaiMatch.matchedValue!.style_name
      };
    }
    
    if (openaiMatch.matched && !xaiMatch.matched) {
      return {
        isMatch: true,
        resolvedValue: openaiMatch.matchedValue!.style_name,
        openaiResolved: openaiMatch.matchedValue!.style_name,
        xaiResolved: null
      };
    }
    if (xaiMatch.matched && !openaiMatch.matched) {
      return {
        isMatch: true,
        resolvedValue: xaiMatch.matchedValue!.style_name,
        openaiResolved: null,
        xaiResolved: xaiMatch.matchedValue!.style_name
      };
    }
    
    if (openaiMatch.matched && xaiMatch.matched) {
      return {
        isMatch: false,
        resolvedValue: null,
        openaiResolved: openaiMatch.matchedValue!.style_name,
        xaiResolved: xaiMatch.matchedValue!.style_name
      };
    }
    
    return noMatch;
  }
  
  // Not a picklist field - apply general semantic attribute normalization
  return semanticAttributeNormalization(openaiVal, xaiVal, fieldKey);
}

/**
 * Semantic normalization for general attribute values (non-picklist fields)
 * Handles: boolean equivalence, numeric words, string variations
 */
function semanticAttributeNormalization(
  openaiVal: any,
  xaiVal: any,
  fieldKey: string
): {
  isMatch: boolean;
  resolvedValue: string | null;
  openaiResolved: any;
  xaiResolved: any;
} {
  const noMatch = { isMatch: false, resolvedValue: null, openaiResolved: null, xaiResolved: null };
  
  // Skip null/undefined values
  if (openaiVal == null && xaiVal == null) return noMatch;
  if (openaiVal == null || xaiVal == null) return noMatch;
  
  const openaiStr = String(openaiVal).trim();
  const xaiStr = String(xaiVal).trim();
  
  // Empty strings
  if (!openaiStr && !xaiStr) return noMatch;
  
  // 🔴 CRITICAL: MSRP field validation - must be actual MSRP, not market value
  if (fieldKey.toLowerCase().includes('msrp')) {
    // Normalize both values
    const openaiNorm = normalizeAttributeValue(openaiStr);
    const xaiNorm = normalizeAttributeValue(xaiStr);
    
    // Extract numeric values
    const openaiNum = parseFloat(openaiNorm.replace(/[^\d.-]/g, ''));
    const xaiNum = parseFloat(xaiNorm.replace(/[^\d.-]/g, ''));
    
    // If both are valid numbers and within 5% tolerance, they're likely the same MSRP
    if (!isNaN(openaiNum) && !isNaN(xaiNum)) {
      const tolerance = Math.max(openaiNum, xaiNum) * 0.05; // 5% tolerance
      if (Math.abs(openaiNum - xaiNum) <= tolerance) {
        // Use the higher value (MSRP is typically higher than street price)
        const resolvedValue = openaiNum >= xaiNum ? openaiStr : xaiStr;
        return {
          isMatch: true,
          resolvedValue,
          openaiResolved: openaiStr,
          xaiResolved: xaiStr
        };
      }
    }
    
    // Otherwise mark as disagreement for manual review
    return {
      isMatch: false,
      resolvedValue: null,
      openaiResolved: openaiStr,
      xaiResolved: xaiStr
    };
  }
  
  // Boolean equivalence: Yes/True/1, No/False/0
  const booleanMatch = matchBooleanEquivalence(openaiStr, xaiStr);
  if (booleanMatch.matched) {
    return {
      isMatch: true,
      resolvedValue: booleanMatch.normalizedValue,
      openaiResolved: booleanMatch.normalizedValue,
      xaiResolved: booleanMatch.normalizedValue
    };
  }
  
  // Numeric word equivalence: "2" vs "Two", "3" vs "Three"
  const numericMatch = matchNumericWords(openaiStr, xaiStr);
  if (numericMatch.matched) {
    return {
      isMatch: true,
      resolvedValue: numericMatch.normalizedValue,
      openaiResolved: numericMatch.normalizedValue,
      xaiResolved: numericMatch.normalizedValue
    };
  }
  
  // Enhanced string normalization
  const openaiNorm = normalizeAttributeValue(openaiStr);
  const xaiNorm = normalizeAttributeValue(xaiStr);
  
  // Exact match after normalization
  if (openaiNorm === xaiNorm) {
    return {
      isMatch: true,
      resolvedValue: openaiVal, // Use original value, not normalized
      openaiResolved: openaiVal,
      xaiResolved: xaiVal
    };
  }
  
  // Partial match: "Stainless Steel" vs "Stainless"
  if (openaiNorm.includes(xaiNorm) || xaiNorm.includes(openaiNorm)) {
    // Use the longer, more descriptive version
    const resolvedValue = openaiStr.length >= xaiStr.length ? openaiVal : xaiVal;
    return {
      isMatch: true,
      resolvedValue,
      openaiResolved: openaiVal,
      xaiResolved: xaiVal
    };
  }
  
  // No semantic match found
  return noMatch;
}

/**
 * Match boolean equivalents: Yes/True/1, No/False/0
 */
function matchBooleanEquivalence(val1: string, val2: string): { matched: boolean; normalizedValue: string } {
  const normalize = (v: string): string | null => {
    const lower = v.toLowerCase().trim();
    if (['yes', 'true', '1', 'on', 'enabled'].includes(lower)) return 'Yes';
    if (['no', 'false', '0', 'off', 'disabled'].includes(lower)) return 'No';
    return null;
  };
  
  const norm1 = normalize(val1);
  const norm2 = normalize(val2);
  
  if (norm1 && norm2 && norm1 === norm2) {
    return { matched: true, normalizedValue: norm1 };
  }
  
  return { matched: false, normalizedValue: '' };
}

/**
 * Match numeric words: "2" vs "Two", "3" vs "Three"
 */
function matchNumericWords(val1: string, val2: string): { matched: boolean; normalizedValue: string } {
  const wordToNumber: Record<string, string> = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
    'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
    'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
    'eighteen': '18', 'nineteen': '19', 'twenty': '20'
  };
  
  const normalize = (v: string): string => {
    const lower = v.toLowerCase().trim();
    return wordToNumber[lower] || v;
  };
  
  const norm1 = normalize(val1);
  const norm2 = normalize(val2);
  
  // Both normalized to the same numeric value
  if (norm1 === norm2 && /^\d+$/.test(norm1)) {
    return { matched: true, normalizedValue: norm1 };
  }
  
  return { matched: false, normalizedValue: '' };
}

/**
 * Normalize attribute values for comparison
 */
function normalizeAttributeValue(val: string): string {
  return String(val)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')                    // Multiple spaces to single
    .replace(/["']/g, '')                     // Remove quotes
    .replace(/\s*(inches?|in\.?|")\s*/gi, '') // Remove "inches", "in"
    .replace(/\s*(lbs?|pounds?)\s*/gi, '')    // Remove weight units
    .replace(/\s*(cu\.?\s*ft\.?|cubic feet)\s*/gi, '') // Remove volume units
    .replace(/unavailable|n\/a|not available|unknown/gi, '') // Remove placeholders
    .trim();
}

function buildAgreedAttributes(
  openaiAttrs: Record<string, any>, 
  xaiAttrs: Record<string, any>, 
  disagreements: ConsensusResult['disagreements'],
  agreedCategory: string
): Record<string, any> {
  const agreed: Record<string, any> = {};
  const allKeys = new Set([...Object.keys(openaiAttrs), ...Object.keys(xaiAttrs)]);
  
  for (const key of allKeys) {
    const openaiVal = openaiAttrs[key];
    const xaiVal = xaiAttrs[key];
    
    // Try semantic picklist matching first for known picklist fields
    const semanticMatch = semanticValueMatch(openaiVal, xaiVal, key, agreedCategory);
    if (semanticMatch.isMatch && semanticMatch.resolvedValue) {
      agreed[key] = semanticMatch.resolvedValue;
      logger.debug('Semantic picklist match', {
        field: key,
        openaiInput: openaiVal,
        xaiInput: xaiVal,
        resolvedTo: semanticMatch.resolvedValue
      });
      continue;
    }
    
    // If semantic matching found a real disagreement (both matched to different picklist values)
    if (!semanticMatch.isMatch && semanticMatch.openaiResolved && semanticMatch.xaiResolved) {
      disagreements.push({
        field: key,
        openaiValue: semanticMatch.openaiResolved,
        xaiValue: semanticMatch.xaiResolved,
        resolution: 'unresolved'
      });
      logger.debug('Semantic picklist disagreement', {
        field: key,
        openaiResolved: semanticMatch.openaiResolved,
        xaiResolved: semanticMatch.xaiResolved
      });
      continue;
    }
    
    // Fall back to literal value matching for non-picklist fields
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
 * ==========================================
 * CATEGORY-AWARE TOP 15 ATTRIBUTE FINDER
 * ==========================================
 * 
 * This function is CRITICAL for proper attribute mapping.
 * It searches raw data for values that match a specific Top 15 category attribute.
 * 
 * PRIORITY ORDER:
 * 1. Exact match on the Top 15 attribute name
 * 2. Exact match on the Top 15 field key
 * 3. Match using FIELD_ALIASES for this specific field key
 * 4. Fuzzy match with high confidence threshold
 * 
 * This ensures that "Installation Type" for Dishwasher maps to the Dishwasher's
 * installation_type field (not to "Mount Type" or other similar attributes).
 */
function findTop15AttributeValue(
  rawProduct: SalesforceIncomingProduct,
  fieldKey: string,
  attributeName: string
): { value: string | number | boolean | null; matchedFrom: string | null } {
  // Normalize function for consistent matching
  const normalizeAttrName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const normalizedAttrName = normalizeAttrName(attributeName);
  const normalizedFieldKey = fieldKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedFieldKeySpaced = fieldKey.toLowerCase().replace(/_/g, ' ').trim();
  
  // Get all known aliases for this field key from FIELD_ALIASES
  const aliases = FIELD_ALIASES[fieldKey] || FIELD_ALIASES[normalizedFieldKey] || [];
  const normalizedAliases = aliases.map(a => normalizeAttrName(a));
  
  // Build complete search terms list (prioritized)
  const searchTerms = [
    normalizedAttrName,           // e.g., "installation type"
    normalizedFieldKey,           // e.g., "installationtype"
    normalizedFieldKeySpaced,     // e.g., "installation type"
    ...normalizedAliases          // all aliases from FIELD_ALIASES
  ];
  
  // Remove duplicates while preserving order
  const uniqueSearchTerms = [...new Set(searchTerms)];
  
  // Helper to find value in attribute array with prioritized matching
  const findInArray = (
    attrs: Array<{ name: string; value: string }> | undefined, 
    sourceName: string
  ): { value: string | number | boolean | null; matchedFrom: string | null } => {
    if (!attrs || !Array.isArray(attrs)) return { value: null, matchedFrom: null };
    
    // PASS 1: Exact matches (highest priority)
    for (const attr of attrs) {
      if (!attr.value || String(attr.value).trim() === '') continue;
      
      const normalizedName = normalizeAttrName(attr.name);
      
      // Exact match on attribute name or field key
      if (normalizedName === normalizedAttrName || 
          normalizedName === normalizedFieldKey ||
          normalizedName === normalizedFieldKeySpaced) {
        logger.debug('Top15 exact match found', {
          fieldKey,
          attrName: attr.name,
          value: attr.value,
          source: sourceName
        });
        return { value: attr.value, matchedFrom: `${sourceName}:exact:${attr.name}` };
      }
    }
    
    // PASS 2: Alias matches (second priority)
    for (const attr of attrs) {
      if (!attr.value || String(attr.value).trim() === '') continue;
      
      const normalizedName = normalizeAttrName(attr.name);
      
      for (const alias of normalizedAliases) {
        if (normalizedName === alias) {
          logger.debug('Top15 alias match found', {
            fieldKey,
            attrName: attr.name,
            alias,
            value: attr.value,
            source: sourceName
          });
          return { value: attr.value, matchedFrom: `${sourceName}:alias:${alias}` };
        }
      }
    }
    
    // PASS 3: Contains match with high threshold (must be >70% overlap)
    for (const attr of attrs) {
      if (!attr.value || String(attr.value).trim() === '') continue;
      
      const normalizedName = normalizeAttrName(attr.name);
      
      // Check if attribute name contains our search term or vice versa
      for (const searchTerm of uniqueSearchTerms) {
        if (searchTerm.length < 3) continue; // Skip very short terms
        
        if (normalizedName.includes(searchTerm) || searchTerm.includes(normalizedName)) {
          const shorter = Math.min(normalizedName.length, searchTerm.length);
          const longer = Math.max(normalizedName.length, searchTerm.length);
          const ratio = shorter / longer;
          
          // Require 70% overlap for contains match
          if (ratio >= 0.7) {
            logger.debug('Top15 contains match found', {
              fieldKey,
              attrName: attr.name,
              searchTerm,
              ratio,
              value: attr.value,
              source: sourceName
            });
            return { value: attr.value, matchedFrom: `${sourceName}:contains:${searchTerm}` };
          }
        }
      }
    }
    
    return { value: null, matchedFrom: null };
  };
  
  // Search Ferguson first (generally more reliable), then Web Retailer
  let result = findInArray(rawProduct.Ferguson_Attributes, 'Ferguson');
  if (result.value === null) {
    result = findInArray(rawProduct.Web_Retailer_Specs, 'WebRetailer');
  }
  
  return result;
}

/**
 * Find attribute value in raw Web_Retailer_Specs or Ferguson_Attributes arrays
 * Uses fuzzy matching on attribute names
 * 
 * @deprecated Use findTop15AttributeValue for Top 15 attributes - it's category-aware
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
  
  // Get all possible aliases for this attribute from smart inference
  const fieldKey = attributeName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const aliases = FIELD_ALIASES[fieldKey] || [];
  const normalizedAliases = aliases.map(a => normalizeAttrName(a));
  
  // Helper to find in attribute array with fuzzy matching
  const findInArray = (attrs: Array<{ name: string; value: string }> | undefined): string | number | boolean | null => {
    if (!attrs || !Array.isArray(attrs)) return null;
    
    for (const attr of attrs) {
      const normalizedName = normalizeAttrName(attr.name);
      
      // Exact match
      if (normalizedName === normalizedTarget) {
        return attr.value;
      }
      
      // Check against known aliases
      for (const alias of normalizedAliases) {
        if (normalizedName === alias || 
            normalizedName.includes(alias) || 
            alias.includes(normalizedName)) {
          const shorterLen = Math.min(normalizedName.length, alias.length);
          const longerLen = Math.max(normalizedName.length, alias.length);
          if (shorterLen / longerLen > 0.5) {
            return attr.value;
          }
        }
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
  const model = provider === 'openai' ? (config.openai?.model || 'gpt-4o-mini') : (config.xai?.model || 'grok-3-mini');

  // CRITICAL: Sanitize product data to remove AI output fields
  const cleanProductData = sanitizeProductDataForAI(rawProduct);

  const prompt = `You previously analyzed a product. Another AI analyst determined it should be categorized as:
Category: ${otherResult.determinedCategory}
Confidence: ${otherResult.categoryConfidence}
Reasoning: ${otherResult.categoryReasoning}

Please re-analyze the product considering this perspective. If you agree after reviewing, update your categorization. If you still disagree, explain why.

ORIGINAL PRODUCT DATA:
${JSON.stringify(cleanProductData, null, 2)}

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
    // Fallback to regular analysis - no prompt options in fallback scenario
    return provider === 'openai' ? await analyzeWithOpenAI(rawProduct, sessionId, undefined) : await analyzeWithXAI(rawProduct, sessionId, undefined);
  }
}

async function researchMissingData(rawProduct: SalesforceIncomingProduct, missingFields: string[], provider: 'openai' | 'xai', category: string, sessionId: string, researchContext?: string): Promise<Record<string, any>> {
  const client = provider === 'openai' ? openai : xai;
  const model = provider === 'openai' ? (config.openai?.model || 'gpt-4o-mini') : (config.xai?.model || 'grok-3-mini');

  const brand = rawProduct.Brand_Web_Retailer || rawProduct.Ferguson_Brand || 'Unknown';
  const modelNum = rawProduct.Model_Number_Web_Retailer || rawProduct.Ferguson_Model_Number || 'Unknown';

  let prompt = `You need to research and find the following missing product specifications:

PRODUCT INFO:
- Brand: ${brand}
- Model: ${modelNum}
- Category: ${category}

MISSING FIELDS TO RESEARCH:
${missingFields.map(f => `- ${f}`).join('\n')}`;

  // Add research context if provided
  if (researchContext && researchContext.trim()) {
    prompt += `

=== EXTERNAL RESEARCH DATA ===
${researchContext}
=== END EXTERNAL RESEARCH DATA ===

Use this external research data to fill in the missing fields above.`;
  } else {
    prompt += `

Use your knowledge to find accurate values for these specifications. If you find the information, provide it. If you cannot determine a value with confidence, mark it as "unknown".`;
  }

  prompt += `

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
function buildResearchTransparency(
  researchResult: ResearchResult | null | undefined,
  finalSearchResult?: FinalVerificationSearchResult | null
): ResearchTransparency | undefined {
  // Return undefined only if BOTH research sources are empty
  if (!researchResult && !finalSearchResult) {
    return undefined;
  }

  const webPages = researchResult?.webPages.map(page => ({
    url: page.url,
    success: page.success,
    specs_extracted: page.success ? Object.keys(page.specifications || {}).length : 0,
    features_extracted: page.success ? (page.features || []).length : 0,
    processing_time_ms: 0, // Not tracked in current implementation
    error: page.error
  })) || [];

  const pdfs = researchResult?.documents.map(doc => ({
    url: doc.url || doc.filename,
    filename: doc.filename,
    success: doc.success,
    pages: doc.success ? (doc.pageCount || 0) : 0,
    specs_extracted: doc.success ? Object.keys(doc.specifications || {}).length : 0,
    text_length: doc.success ? (doc.text?.length || 0) : 0,
    processing_time_ms: 0, // Not tracked in current implementation
    error: doc.error
  })) || [];

  const images = researchResult?.images.map(img => ({
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
  })) || [];

  // Calculate totals from pre-research
  let totalSpecs = Object.keys(researchResult?.combinedSpecifications || {}).length;
  let totalFeatures = (researchResult?.combinedFeatures || []).length;
  
  // Add final search results if available
  let finalWebSearch: {
    performed: boolean;
    query: string;
    verified_data_used: {
      brand: string;
      model: string;
      category: string;
    };
    missing_fields_searched: string[];
    specs_found: number;
    features_found: number;
    sources: string[];
    success: boolean;
    error?: string;
  } | undefined = undefined;
  
  if (finalSearchResult) {
    finalWebSearch = {
      performed: true,
      query: finalSearchResult.query,
      verified_data_used: {
        brand: finalSearchResult.verifiedData.brand,
        model: finalSearchResult.verifiedData.modelNumber,
        category: finalSearchResult.verifiedData.category
      },
      missing_fields_searched: finalSearchResult.missingFieldsSearched,
      specs_found: Object.keys(finalSearchResult.foundSpecifications).length,
      features_found: finalSearchResult.foundFeatures.length,
      sources: finalSearchResult.sources,
      success: finalSearchResult.success,
      error: finalSearchResult.error
    };
    
    // Add final search specs to total
    totalSpecs += Object.keys(finalSearchResult.foundSpecifications).length;
    totalFeatures += finalSearchResult.foundFeatures.length;
  }

  const totalResources = webPages.length + pdfs.length + images.length + (finalSearchResult ? 1 : 0);
  const successfulResources = 
    webPages.filter(w => w.success).length +
    pdfs.filter(p => p.success).length +
    images.filter(i => i.success).length +
    (finalSearchResult?.success ? 1 : 0);

  return {
    research_performed: totalResources > 0,
    total_resources_analyzed: totalResources,
    web_pages: webPages,
    pdfs: pdfs,
    images: images,
    final_web_search: finalWebSearch,
    summary: {
      total_specs_extracted: totalSpecs,
      total_features_extracted: totalFeatures,
      success_rate: totalResources > 0 ? Math.round((successfulResources / totalResources) * 100) : 0
    }
  };
}

// Type for Research Attestation response
interface ResearchAttestationResponse {
  attestation_enabled: boolean;
  research_performed: boolean;
  checklist_completion: {
    completed_steps: number;
    total_steps: number;
    completion_rate: string;
    steps: {
      raw_sf_data_review: boolean;
      url_scraping: boolean;
      openai_analysis: boolean;
      xai_analysis: boolean;
      smart_inference: boolean;
      image_analysis: boolean;
      cross_reference: boolean;
      final_verification: boolean;
    };
  };
  field_status_summary: {
    total_fields: number;
    found_with_value: number;
    procurement_no_results: number;
    research_incomplete: number;
    not_found_fields: string[];
    incomplete_fields: string[];
  };
  status_code_meanings: {
    'Procurement No Results': string;
    'Research Incomplete - Pending': string;
    'Research Error - Manual Review Required': string;
  };
}

/**
 * Build Research Attestation Summary for response
 * Tracks which fields used "Procurement No Results" and their research completion status
 */
function buildResearchAttestationSummary(
  topFilterAttributes: TopFilterAttributes,
  primaryAttributes: Record<string, any>,
  didResearch: boolean,
  openaiResult: AIAnalysisResult,
  xaiResult: AIAnalysisResult,
  researchResult: ResearchResult | null | undefined,
  finalSearchResult?: FinalVerificationSearchResult | null
): ResearchAttestationResponse | undefined {
  // Only include if research was performed
  if (!didResearch) {
    return undefined;
  }

  // Count fields by status
  const allFields = { ...primaryAttributes, ...topFilterAttributes };
  let fullyResearchedCount = 0;
  let incompleteCount = 0;
  let foundCount = 0;
  const notFoundFields: string[] = [];
  const incompleteFields: string[] = [];

  for (const [fieldName, value] of Object.entries(allFields)) {
    const strValue = String(value || '').trim();
    
    if (strValue === FIELD_STATUS_CODES.PROCUREMENT_NO_RESULTS) {
      fullyResearchedCount++;
      notFoundFields.push(fieldName);
    } else if (strValue === FIELD_STATUS_CODES.RESEARCH_INCOMPLETE) {
      incompleteCount++;
      incompleteFields.push(fieldName);
    } else if (strValue === FIELD_STATUS_CODES.RESEARCH_ERROR) {
      incompleteCount++;
      incompleteFields.push(fieldName);
    } else if (strValue && strValue !== '' && strValue !== 'N/A') {
      foundCount++;
    }
  }

  // Build research steps completed summary
  const researchStepsCompleted = {
    raw_sf_data_review: true, // Always done
    url_scraping: !!researchResult?.webPages?.length || !!finalSearchResult,
    openai_analysis: openaiResult.success,
    xai_analysis: xaiResult.success,
    smart_inference: true, // Always attempted
    image_analysis: !!researchResult?.images?.length,
    cross_reference: openaiResult.success && xaiResult.success,
    final_verification: true // Always done
  };

  const completedSteps = Object.values(researchStepsCompleted).filter(Boolean).length;

  return {
    attestation_enabled: true,
    research_performed: didResearch,
    checklist_completion: {
      completed_steps: completedSteps,
      total_steps: 8,
      completion_rate: `${Math.round((completedSteps / 8) * 100)}%`,
      steps: researchStepsCompleted
    },
    field_status_summary: {
      total_fields: Object.keys(allFields).length,
      found_with_value: foundCount,
      procurement_no_results: fullyResearchedCount,
      research_incomplete: incompleteCount,
      not_found_fields: notFoundFields.slice(0, 10), // Limit for readability
      incomplete_fields: incompleteFields.slice(0, 5)
    },
    status_code_meanings: {
      'Procurement No Results': 'All 8 research steps completed, data genuinely not available',
      'Research Incomplete - Pending': 'Some research steps could not be completed',
      'Research Error - Manual Review Required': 'Conflicts or errors require human review'
    }
  };
}

/**
 * Build Received Attributes Confirmation - Track incoming attributes from Salesforce
 * Shows Salesforce which attributes we received, processed, and where they ended up
 */
function buildReceivedAttributesConfirmation(
  rawProduct: SalesforceIncomingProduct,
  topFilterAttributes: TopFilterAttributes,
  additionalAttributes: Record<string, any>
): any {
  const confirmation = {
    web_retailer_specs_processed: [] as any[],
    ferguson_attributes_processed: [] as any[],
    summary: {
      total_received_from_web_retailer: 0,
      total_received_from_ferguson: 0,
      total_included_in_response: 0,
      total_in_additional_attributes: 0,
      total_not_used: 0
    }
  };

  // Helper to find attribute in Top Filter Attributes
  // Uses FIELD_ALIASES for semantic matching (e.g., "Installation Type" -> "type")
  const findInTopFilters = (attrName: string): string | null => {
    // Normalize search term: lowercase, replace underscores with spaces, remove other special chars
    const normalizedSearch = attrName.toLowerCase().replace(/_/g, ' ').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    const normalizedSearchKey = attrName.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    
    for (const [key, value] of Object.entries(topFilterAttributes)) {
      if (value && value !== '') {
        // Normalize key: replace underscores with spaces for comparison
        const normalizedKey = key.toLowerCase().replace(/_/g, ' ').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        
        // Direct name matching
        if (normalizedKey.includes(normalizedSearch) || normalizedSearch.includes(normalizedKey)) {
          const matchRatio = Math.min(normalizedKey.length, normalizedSearch.length) / Math.max(normalizedKey.length, normalizedSearch.length);
          if (matchRatio > 0.5) {
            return key;
          }
        }
        
        // Check FIELD_ALIASES - does any alias for this key match the search term?
        const aliases = FIELD_ALIASES[key] || FIELD_ALIASES[normalizedKey.replace(/\s/g, '_')] || [];
        for (const alias of aliases) {
          const normalizedAlias = alias.toLowerCase().replace(/_/g, ' ').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
          if (normalizedAlias.includes(normalizedSearch) || 
              normalizedSearch.includes(normalizedAlias) ||
              normalizedAlias === normalizedSearchKey ||
              normalizedAlias.replace(/\s/g, '') === normalizedSearchKey) {
            return key;
          }
        }
        
        // Check if the search term is an alias for this field key
        // e.g., attrName="Installation Type" should match key="type" because "installation type" is in type's aliases
        const searchAliases = FIELD_ALIASES[normalizedSearchKey] || [];
        if (searchAliases.some(alias => {
          const normalizedAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normalizedAlias === normalizedKey.replace(/\s/g, '') || normalizedKey.includes(normalizedAlias);
        })) {
          return key;
        }
      }
    }
    return null;
  };

  // Helper to find attribute in Additional Attributes
  const findInAdditionalAttrs = (attrName: string): boolean => {
    if (!additionalAttributes) return false;
    const normalizedSearch = attrName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    for (const key of Object.keys(additionalAttributes)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      if (normalizedKey === normalizedSearch || normalizedKey.includes(normalizedSearch) || normalizedSearch.includes(normalizedKey)) {
        return true;
      }
    }
    return false;
  };

  // Process Web Retailer Specs
  if (rawProduct.Web_Retailer_Specs && Array.isArray(rawProduct.Web_Retailer_Specs)) {
    confirmation.summary.total_received_from_web_retailer = rawProduct.Web_Retailer_Specs.length;
    
    for (const spec of rawProduct.Web_Retailer_Specs) {
      const topFilterMatch = findInTopFilters(spec.name);
      const inAdditional = findInAdditionalAttrs(spec.name);
      
      let status: 'included_in_response' | 'included_in_additional' | 'not_used' | 'invalid' = 'not_used';
      let matchedField: string | undefined = undefined;
      let reason: string | undefined = undefined;
      
      if (topFilterMatch) {
        status = 'included_in_response';
        matchedField = `Top_Filter_Attributes.${topFilterMatch}`;
        confirmation.summary.total_included_in_response++;
      } else if (inAdditional) {
        status = 'included_in_additional';
        confirmation.summary.total_in_additional_attributes++;
      } else if (!spec.value || spec.value.trim() === '') {
        status = 'invalid';
        reason = 'Empty or missing value';
        confirmation.summary.total_not_used++;
      } else {
        confirmation.summary.total_not_used++;
        reason = 'Not matched to any attribute in this category';
      }
      
      confirmation.web_retailer_specs_processed.push({
        name: spec.name,
        value: spec.value,
        matched_to_field: matchedField,
        status,
        reason
      });
    }
  }

  // Process Ferguson Attributes
  if (rawProduct.Ferguson_Attributes && Array.isArray(rawProduct.Ferguson_Attributes)) {
    confirmation.summary.total_received_from_ferguson = rawProduct.Ferguson_Attributes.length;
    
    for (const attr of rawProduct.Ferguson_Attributes) {
      const topFilterMatch = findInTopFilters(attr.name);
      const inAdditional = findInAdditionalAttrs(attr.name);
      
      let status: 'included_in_response' | 'included_in_additional' | 'not_used' | 'invalid' = 'not_used';
      let matchedField: string | undefined = undefined;
      let reason: string | undefined = undefined;
      
      if (topFilterMatch) {
        status = 'included_in_response';
        matchedField = `Top_Filter_Attributes.${topFilterMatch}`;
        confirmation.summary.total_included_in_response++;
      } else if (inAdditional) {
        status = 'included_in_additional';
        confirmation.summary.total_in_additional_attributes++;
      } else if (!attr.value || attr.value.trim() === '') {
        status = 'invalid';
        reason = 'Empty or missing value';
        confirmation.summary.total_not_used++;
      } else {
        confirmation.summary.total_not_used++;
        reason = 'Not matched to any attribute in this category';
      }
      
      confirmation.ferguson_attributes_processed.push({
        name: attr.name,
        value: attr.value,
        matched_to_field: matchedField,
        status,
        reason
      });
    }
  }

  logger.info('Received attributes confirmation built', {
    web_retailer_total: confirmation.summary.total_received_from_web_retailer,
    ferguson_total: confirmation.summary.total_received_from_ferguson,
    included_in_response: confirmation.summary.total_included_in_response,
    in_additional: confirmation.summary.total_in_additional_attributes,
    not_used: confirmation.summary.total_not_used
  });

  return confirmation;
}

/**
 * Get Ferguson attributes that are NOT used in Top 15 Filter Attributes
 * These should be included in Additional_Attributes_HTML
 * 
 * Includes: Collection, Theme, Country Of Origin, Location Rating, Manufacturer Warranty, etc.
 */
function getUnusedFergusonAttributes(
  rawProduct: SalesforceIncomingProduct,
  topFilterAttributes: TopFilterAttributes
): Record<string, string> {
  const unusedAttrs: Record<string, string> = {};
  
  if (!rawProduct.Ferguson_Attributes || !Array.isArray(rawProduct.Ferguson_Attributes)) {
    return unusedAttrs;
  }

  // Helper to check if attribute is used in Top Filter Attributes
  const isUsedInTopFilters = (attrName: string): boolean => {
    const normalizedSearch = attrName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    
    for (const [key, value] of Object.entries(topFilterAttributes)) {
      if (value && value !== '' && value !== 'Not Found') {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        
        // Direct name matching
        if (normalizedKey.includes(normalizedSearch) || normalizedSearch.includes(normalizedKey)) {
          return true;
        }
      }
    }
    return false;
  };

  // Attributes we specifically want to include in HTML (valuable metadata)
  const valuableAttributes = new Set([
    'collection', 'theme', 'country of origin', 'made in america', 'location rating',
    'manufacturer warranty', 'commercial warranty', 'certifications', 'ul', 'etl', 
    'energy star', 'ada compliant', 'bulb base', 'bulb type', 'light direction',
    'reversible mounting', 'approved for commercial use', 'watts per bulb',
    'fixture shape', 'glass features', 'shade color', 'shade shape', 'power source',
    'cutout depth', 'cutout height', 'cutout width', 'installation type'
  ]);

  for (const attr of rawProduct.Ferguson_Attributes) {
    // Skip empty values
    if (!attr.value || attr.value.trim() === '') continue;
    
    // Skip if already used in Top Filter
    if (isUsedInTopFilters(attr.name)) continue;
    
    // Skip dimensions we already capture in Primary Attributes (Height, Width, Depth, Weight)
    const skipPrimary = ['height', 'width', 'depth', 'product weight', 'nominal width', 'nominal height'];
    if (skipPrimary.some(s => attr.name.toLowerCase().includes(s))) continue;
    
    // Include if it's a valuable attribute OR if we want to capture all unused
    const normalizedName = attr.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    if (valuableAttributes.has(normalizedName) || 
        attr.name.toLowerCase().includes('warranty') ||
        attr.name.toLowerCase().includes('collection') ||
        attr.name.toLowerCase().includes('country') ||
        attr.name.toLowerCase().includes('location') ||
        attr.name.toLowerCase().includes('made in') ||
        attr.name.toLowerCase().includes('certified') ||
        attr.name.toLowerCase().includes('rating') ||
        attr.name.toLowerCase().includes('theme')) {
      unusedAttrs[attr.name] = attr.value;
    }
  }

  return unusedAttrs;
}

function buildFinalResponse(
  rawProduct: SalesforceIncomingProduct,
  consensus: ConsensusResult,
  sessionId: string,
  _processingTimeMs: number,
  openaiResult: AIAnalysisResult,
  xaiResult: AIAnalysisResult,
  determinedDepartment: string,
  determinedCategory: string,
  researchResult?: ResearchResult | null,
  dataSourceAnalysis?: DataSourceAnalysis,
  researchPerformed?: boolean,
  researchAttempts?: number,
  finalSearchResult?: FinalVerificationSearchResult | null
): SalesforceVerificationResponse {
  
  // Track if research was performed for field marking
  const didResearch = researchPerformed || !!researchResult || !!finalSearchResult;
  
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
  
  logger.info('Features resolution check', {
    sessionId,
    consensusFeatures: typeof rawFeatures === 'string' ? rawFeatures?.substring(0, 200) : 'array/missing',
    consensusFeaturesType: typeof rawFeatures,
    hasConsensusFeatures: !!rawFeatures
  });
  
  if (!rawFeatures) {
    const openaiFeat = openaiResult.primaryAttributes.features_list;
    const xaiFeat = xaiResult.primaryAttributes.features_list;
    
    logger.info('Features fallback triggered', {
      sessionId,
      openaiFeatures: typeof openaiFeat === 'string' ? openaiFeat?.substring(0, 100) : 'array/missing',
      xaiFeatures: typeof xaiFeat === 'string' ? xaiFeat?.substring(0, 100) : 'array/missing'
    });
    
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
  
  // ✅ FIX: Use validated category from Phase 2.5 - DO NOT re-map!
  // Phase 2.5 already validated this category through hierarchical analysis
  // Re-mapping with source data can contradict the validated category
  // Example bug: Validated "Freezer" → product_family="Specialty Refrigerators" → overwrote to "Refrigerator" ❌
  const verifiedCategory = determinedCategory;
  
  // Match validated category to picklist for category_id (but don't change the category name)
  const categoryMatch = picklistMatcher.matchCategory(verifiedCategory);
  
  // Match Type against Salesforce types picklist
  const aiProductType = consensus.agreedPrimaryAttributes.product_type || '';
  const typeMatch = picklistMatcher.matchType(aiProductType);
  
  // If direct picklist match failed, try the category-aware type matcher with subcategory hint
  const subcategoryHint = rawProduct.Web_Retailer_SubCategory || rawProduct.Ferguson_Business_Category || '';
  let typeMatchResult = typeMatch;
  if (!typeMatch.matched && aiProductType && aiProductType.trim() !== '') {
    const categoryAwareMatch = matchTypeToPicklist(aiProductType, verifiedCategory, subcategoryHint);
    if (categoryAwareMatch.matched && categoryAwareMatch.matchedValue) {
      typeMatchResult = {
        matched: true,
        original: aiProductType,
        matchedValue: {
          type_id: categoryAwareMatch.matchedValue.type_id,
          type_name: categoryAwareMatch.matchedValue.type_name
        },
        similarity: categoryAwareMatch.confidence
      };
    }
  } else {
    typeMatchResult = typeMatch;
  }
  
  logger.info('Type matching result', {
    sessionId,
    aiProductType,
    category: verifiedCategory,
    matched: typeMatchResult.matched,
    matchedTo: typeMatchResult.matchedValue?.type_name || null,
    similarity: typeMatchResult.similarity
  });
  
  // ✅ USER DIRECTIVE: Image analysis and semantic extraction are ADVISORY ONLY
  // They CANNOT define or overwrite the Type field - only Phase 2.5 validated AI types are authoritative
  // Image findings are stored in metadata for reference but have no authority
  // 
  // Store image analysis findings as advisory metadata (not authoritative)
  let imageAdvisoryType: string | null = null;
  if (researchResult?.images) {
    const successfulImages = researchResult.images.filter(img => img.success && img.productType);
    if (successfulImages.length > 0 && successfulImages[0].productType) {
      imageAdvisoryType = successfulImages[0].productType;
      logger.info('Image analysis type stored as advisory (non-authoritative)', {
        sessionId,
        imageProductType: imageAdvisoryType,
        category: verifiedCategory,
        note: 'Image analysis cannot define or overwrite validated Type - advisory only'
      });
    }
  }
  
  // Handle case where AI returned "Not Applicable" or "Not Found" pattern
  const isNAPattern = aiProductType && /^(not applicable|n\/?a|not found|none)$/i.test(aiProductType.trim());
  
  // If type matching failed and AI type is empty, set to "Not Found"
  // DO NOT use image analysis or semantic extraction to define the type
  if (!typeMatchResult.matched && (!aiProductType || aiProductType.trim() === '')) {
    // AI didn't provide a type - set to "Not Found" (do not guess from images/subcategory)
    const notFoundType = getTypeByName('Not Found');
    const notApplicableType = getTypeByName('Not Applicable');
    
    if (notFoundType) {
      typeMatchResult = {
        matched: true,
        original: aiProductType || '(empty)',
        matchedValue: {
          type_id: notFoundType.type_id,
          type_name: notFoundType.type_name
        },
        similarity: 1.0
      };
      logger.info('Type set to "Not Found" (AI did not determine type)', {
        sessionId,
        aiProductType: aiProductType || '(empty)',
        type_id: notFoundType.type_id,
        imageAdvisoryType,
        subcategoryHint: subcategoryHint || null,
        reason: 'Phase 2.5 validated AI did not provide type - image analysis advisory only'
      });
    } else if (notApplicableType) {
      // Fallback to Not Applicable if Not Found doesn't exist
      typeMatchResult = {
        matched: true,
        original: aiProductType || 'Not Applicable',
        matchedValue: {
          type_id: notApplicableType.type_id,
          type_name: notApplicableType.type_name
        },
        similarity: 1.0
      };
      logger.warn('Type set to "Not Applicable" ("Not Found" type missing from schema)', {
        sessionId,
        aiProductType: aiProductType || '(empty)',
        imageAdvisoryType
      });
    }
  }
  
  // Handle case where AI explicitly returned "Not Applicable" or "Not Found" but it didn't match picklist
  // In this case, we should respect AI's choice and populate the ID
  if (!typeMatchResult.matched && isNAPattern) {
    const notApplicableType = getTypeByName('Not Applicable');
    const notFoundType = getTypeByName('Not Found');
    const preferredType = aiProductType.toLowerCase().includes('not found') ? notFoundType : notApplicableType;
    
    if (preferredType) {
      typeMatchResult = {
        matched: true,
        original: aiProductType,
        matchedValue: {
          type_id: preferredType.type_id,
          type_name: preferredType.type_name
        },
        similarity: 1.0
      };
      logger.info('Type set to N/A or Not Found (AI explicit choice)', {
        sessionId,
        aiProductType,
        type_id: preferredType.type_id,
        type_name: preferredType.type_name,
        imageAdvisoryType,
        reason: 'AI explicitly returned N/A/Not Found pattern - respecting choice'
      });
    }
  }
  
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
    
    // Log failed brand match for auditing
    failedMatchLogger.logFailedMatch({
      matchType: 'brand',
      attemptedValue: cleanedText.brand,
      similarity: brandMatch.similarity,
      closestMatches: brandMatch.suggestions?.slice(0, 5).map(s => ({
        value: s.brand_name,
        id: s.brand_id,
        similarity: brandMatch.similarity
      })) || [],
      matchThreshold: 0.6,
      source: 'ai_analysis',
      productContext: {
        sf_catalog_id: rawProduct.SF_Catalog_Id,
        sf_catalog_name: rawProduct.SF_Catalog_Name,
        model_number: rawProduct.Model_Number_Web_Retailer || "",
        brand: cleanedText.brand,
        category: consensus.agreedCategory,
        session_id: sessionId,
      },
      aiContext: {
        openai_value: openaiResult.primaryAttributes.brand,
        xai_value: xaiResult.primaryAttributes.brand,
        consensus_value: cleanedText.brand,
      },
      rawDataContext: {
        web_retailer_value: rawProduct.Brand_Web_Retailer,
        ferguson_value: rawProduct.Ferguson_Brand,
      },
      requestGenerated: true,
      requestDetails: {
        attribute_name: cleanedText.brand,
        requested_for_category: 'Brand',
        reason: `Brand "${cleanedText.brand}" not found in Salesforce picklist`,
      },
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
    
    // Log failed category match for auditing
    failedMatchLogger.logFailedMatch({
      matchType: 'category',
      attemptedValue: consensus.agreedCategory,
      similarity: categoryMatch.similarity,
      closestMatches: categoryMatch.suggestions?.slice(0, 5).map(s => ({
        value: s.category_name,
        id: s.category_id,
        similarity: categoryMatch.similarity
      })) || [],
      matchThreshold: 0.6,
      source: 'ai_analysis',
      productContext: {
        sf_catalog_id: rawProduct.SF_Catalog_Id,
        sf_catalog_name: rawProduct.SF_Catalog_Name,
        model_number: rawProduct.Model_Number_Web_Retailer || "",
        brand: cleanedText.brand,
        category: consensus.agreedCategory,
        session_id: sessionId,
      },
      aiContext: {
        openai_value: openaiResult.determinedCategory,
        xai_value: xaiResult.determinedCategory,
        consensus_value: consensus.agreedCategory,
        confidence: (openaiResult.categoryConfidence + xaiResult.categoryConfidence) / 2,
      },
      rawDataContext: {
        web_retailer_value: rawProduct.Web_Retailer_Category,
        original_attribute_name: rawProduct.Web_Retailer_SubCategory,
      },
      requestGenerated: true,
      requestDetails: {
        attribute_name: consensus.agreedCategory,
        requested_for_category: consensus.agreedPrimaryAttributes.department || 'Unknown',
        reason: `Category "${consensus.agreedCategory}" not found in Salesforce picklist`,
      },
    });
  }
  
  // Match Style using category-aware mapping
  // If AIs disagree on style, use EITHER value (prefer OpenAI) rather than skipping style entirely
  let styleMatch: { matched: boolean; matchedValue: { style_name: string; style_id: string } | null } = { matched: false, matchedValue: null };
  
  // Track style to use even if not in SF picklist (for populating response while requesting creation)
  let styleToUse: string = '';
  
  // ============================================
  // HIERARCHICAL VALIDATION: Check if type is "Not Applicable"
  // If product has no type variations, skip style determination
  // ============================================
  const productType = consensus.agreedPrimaryAttributes.product_type || '';
  const typeIsNA = productType.toLowerCase().includes('not applicable') || 
                   productType.toLowerCase().includes('n/a') ||
                   productType.trim() === '';
  
  if (typeIsNA) {
    logger.info('[HIERARCHICAL VALIDATION] Type is Not Applicable - skipping style determination', {
      sessionId,
      category: categoryMatch.matchedValue?.category_name,
      productType
    });
    styleToUse = 'Not Applicable';
  } else {
    // Proceed with normal style determination
    // Get style from agreed attributes, or fall back to individual AI values if they disagreed
    let potentialStyle = consensus.agreedPrimaryAttributes.product_style || '';
  
  // ============================================
  // POST-PROCESSING VALIDATION: Lighting Style Correction
  // ============================================
  if (potentialStyle && categoryMatch.matchedValue) {
    const matchedCategory = categoryMatch.matchedValue.category_name;
    const validStyles = getValidStylesForCategory(matchedCategory);
    
    const validation = validateAndCorrectLightingStyle(
      potentialStyle,
      matchedCategory,
      validStyles
    );
    
    if (validation.needsCorrection) {
      logger.warn('[STYLE VALIDATION] Aesthetic style detected in lighting category - correcting', {
        category: matchedCategory,
        originalStyle: potentialStyle,
        correctedStyle: validation.correctedStyle,
        reason: validation.reason
      });
      
      // Use corrected style if available, otherwise keep original but flag it
      if (validation.correctedStyle) {
        potentialStyle = validation.correctedStyle;
        logger.info('[STYLE CORRECTED] Using product type instead of aesthetic', {
          from: consensus.agreedPrimaryAttributes.product_style,
          to: potentialStyle,
          category: matchedCategory
        });
      }
    }
    
    // ============================================
    // POST-PROCESSING VALIDATION: Shower Style Correction
    // ============================================
    const showerValidation = validateAndCorrectShowerStyle(
      potentialStyle,
      matchedCategory,
      rawProduct.Ferguson_Description || rawProduct.Ferguson_Title || ''
    );
    
    if (showerValidation.needsCorrection) {
      logger.warn('[STYLE VALIDATION] Invalid style detected in shower category - correcting', {
        category: matchedCategory,
        originalStyle: potentialStyle,
        correctedStyle: showerValidation.correctedStyle,
        reason: showerValidation.reason
      });
      
      if (showerValidation.correctedStyle) {
        potentialStyle = showerValidation.correctedStyle;
        logger.info('[STYLE CORRECTED] Using valid shower style', {
          from: consensus.agreedPrimaryAttributes.product_style,
          to: potentialStyle,
          category: matchedCategory
        });
      }
    }
    
    // ============================================
    // POST-PROCESSING VALIDATION: Universal Category-Style Validation
    // Validates that the style is in the category-type-style-mapping list
    // ============================================
    const universalValidation = validateStyleForCategory(potentialStyle, matchedCategory);
    
    if (universalValidation.needsCorrection) {
      logger.warn('[STYLE VALIDATION] Style not in category-type-style list - correcting', {
        category: matchedCategory,
        originalStyle: potentialStyle,
        correctedStyle: universalValidation.correctedStyle,
        isAesthetic: universalValidation.isAesthetic,
        reason: universalValidation.reason
      });
      
      if (universalValidation.correctedStyle) {
        potentialStyle = universalValidation.correctedStyle;
        logger.info('[STYLE CORRECTED] Using valid style from category-type-style list', {
          from: consensus.agreedPrimaryAttributes.product_style,
          to: potentialStyle,
          category: matchedCategory,
          wasAesthetic: universalValidation.isAesthetic
        });
      }
    }
  }
  
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
  
  // ============================================
  // CHECK FERGUSON APPLICATION FIELD (Primary style indicator)
  // Ferguson's "application" field directly tells us the product type
  // e.g., "Shower Heads", "Kitchen Faucets", "Wall Sconces"
  // ============================================
  if (!potentialStyle) {
    const fergusonApplication = (rawProduct as any).Ferguson_Raw_Data?.product?.application;
    if (fergusonApplication) {
      // Normalize Ferguson application to our style format
      // "Shower Heads" -> "Showerhead", "Kitchen Faucets" -> "Kitchen Faucet"
      let normalizedApplication = fergusonApplication;
      
      // Handle plural to singular conversions
      if (fergusonApplication.toLowerCase() === 'shower heads') {
        normalizedApplication = 'Showerhead';
      } else if (fergusonApplication.endsWith('s') && !fergusonApplication.endsWith('ss')) {
        // Simple plural -> singular (e.g., "Faucets" -> "Faucet")
        normalizedApplication = fergusonApplication.slice(0, -1);
      }
      
      potentialStyle = normalizedApplication;
      logger.info('[FERGUSON APPLICATION] Using Ferguson application as style', { 
        original: fergusonApplication,
        normalized: normalizedApplication 
      });
    }
  }
  
  // Check Ferguson data for style information (Theme for design styles, Installation Type for functional styles)
  if (!potentialStyle) {
    // First check Ferguson Theme (design aesthetic: Contemporary, Modern, etc.)
    const fergusonTheme = rawProduct.Ferguson_Attributes?.find(
      (attr: { name: string; value: string }) => attr.name?.toLowerCase() === 'theme'
    )?.value;
    if (fergusonTheme) {
      potentialStyle = fergusonTheme;
      logger.info('Using Ferguson Theme as style', { theme: fergusonTheme });
    }
  }
  
  if (!potentialStyle) {
    // Then check Ferguson Installation Type (functional style: Wall Mounted, Undermount, etc.)
    const fergusonInstallType = rawProduct.Ferguson_Attributes?.find(
      (attr: { name: string; value: string }) => attr.name?.toLowerCase() === 'installation type'
    )?.value;
    if (fergusonInstallType) {
      potentialStyle = fergusonInstallType;
      logger.info('Using Ferguson Installation Type as style', { installationType: fergusonInstallType });
    }
  }
  
  // Final fallback to subcategory
  if (!potentialStyle) {
    potentialStyle = rawProduct.Web_Retailer_SubCategory || '';
  }
  
  // ============================================
  // POST-FALLBACK VALIDATION: Validate style after all fallbacks complete
  // This catches invalid styles that came from disagreements/fallbacks
  // ============================================
  if (potentialStyle && categoryMatch.matchedValue) {
    const matchedCategory = categoryMatch.matchedValue.category_name;
    
    // Re-validate shower styles after fallback (may have gotten invalid style from disagreements)
    const postFallbackShowerValidation = validateAndCorrectShowerStyle(
      potentialStyle,
      matchedCategory,
      rawProduct.Ferguson_Description || rawProduct.Ferguson_Title || ''
    );
    
    if (postFallbackShowerValidation.needsCorrection) {
      logger.warn('[POST-FALLBACK VALIDATION] Invalid shower style from fallback - correcting', {
        category: matchedCategory,
        originalStyle: potentialStyle,
        idealStyle: postFallbackShowerValidation.idealStyle,
        correctedStyle: postFallbackShowerValidation.correctedStyle,
        reason: postFallbackShowerValidation.reason
      });
      
      // Check if ideal style exists in SF picklist
      const idealStyle = postFallbackShowerValidation.idealStyle;
      if (idealStyle) {
        const idealMatch = picklistMatcher.matchStyle(idealStyle);
        const idealExists = picklistMatcher.getStyleByName(idealStyle);
        
        if (idealMatch.matched || idealExists) {
          // Ideal style exists in SF - use it!
          potentialStyle = idealStyle;
          logger.info('[POST-FALLBACK] Using ideal style - exists in SF picklist', {
            style: idealStyle,
            category: matchedCategory
          });
        } else {
          // Ideal style NOT in SF - generate request AND use fallback
          styleRequests.push({
            style_name: idealStyle,
            suggested_for_category: matchedCategory,
            source: 'ai_analysis',  // Use valid source type
            product_context: {
              sf_catalog_id: rawProduct.SF_Catalog_Id,
              model_number: rawProduct.Model_Number_Web_Retailer || rawProduct.SF_Catalog_Name
            },
            reason: `Ideal style "${idealStyle}" not in SF picklist (shower validation) - requesting creation. Using fallback "${postFallbackShowerValidation.correctedStyle}" for now.`
          });
          logger.warn('[STYLE REQUEST GENERATED] Ideal shower style missing from SF picklist', {
            idealStyle,
            fallbackUsed: postFallbackShowerValidation.correctedStyle,
            category: matchedCategory
          });
          
          // Use the fallback style that exists in SF
          potentialStyle = postFallbackShowerValidation.correctedStyle || potentialStyle;
        }
      } else if (postFallbackShowerValidation.correctedStyle) {
        potentialStyle = postFallbackShowerValidation.correctedStyle;
      }
      
      logger.info('[POST-FALLBACK CORRECTED] Shower style corrected after fallback chain', {
        to: potentialStyle,
        category: matchedCategory
      });
    }
  }
  
  // ============================================
  // FINAL UNIVERSAL VALIDATION: Validate style from ALL sources
  // This catches invalid styles from disagreements, smart resolution, fallbacks
  // Runs AFTER all style sources have been considered
  // ============================================
  if (potentialStyle && categoryMatch.matchedValue) {
    const matchedCategory = categoryMatch.matchedValue.category_name;
    const finalValidation = validateStyleForCategory(potentialStyle, matchedCategory);
    
    if (finalValidation.needsCorrection) {
      logger.warn('[FINAL STYLE VALIDATION] Invalid style detected - correcting', {
        category: matchedCategory,
        originalStyle: potentialStyle,
        correctedStyle: finalValidation.correctedStyle,
        isAesthetic: finalValidation.isAesthetic,
        reason: finalValidation.reason
      });
      
      if (finalValidation.correctedStyle) {
        potentialStyle = finalValidation.correctedStyle;
        logger.info('[FINAL STYLE CORRECTED] Using valid style from category-type-style list', {
          from: consensus.agreedPrimaryAttributes.product_style || '(from fallback)',
          to: potentialStyle,
          category: matchedCategory,
          wasAesthetic: finalValidation.isAesthetic
        });
      }
    }
  }
  
  if (potentialStyle && categoryMatch.matchedValue) {
    const matchedCategory = categoryMatch.matchedValue.category_name;
    const mappedStyle = matchStyleToCategory(potentialStyle, matchedCategory);
    
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
        // Style mapped but not matched - check if it already exists by name (prevents duplicate requests)
        const existingStyle = picklistMatcher.getStyleByName(mappedStyle);
        if (existingStyle) {
          // Style already exists in SF - use the existing one, don't request again
          styleMatch = { 
            matched: true, 
            matchedValue: existingStyle
          };
          styleToUse = existingStyle.style_name;
          logger.info('Style already exists in picklist - using existing instead of requesting new', {
            style: mappedStyle,
            existingStyleId: existingStyle.style_id,
            category: matchedCategory
          });
        } else {
          // Style truly doesn't exist - USE IT AND request creation
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
        
        // Log failed style match for auditing
        failedMatchLogger.logFailedMatch({
          matchType: 'style',
          attemptedValue: mappedStyle,
          similarity: sfStyleMatch.similarity,
          closestMatches: sfStyleMatch.suggestions?.slice(0, 5).map(s => ({
            value: s.style_name,
            id: s.style_id,
            similarity: sfStyleMatch.similarity
          })) || [],
          matchThreshold: 0.6,
          source: 'ai_analysis',
          productContext: {
            sf_catalog_id: rawProduct.SF_Catalog_Id,
            sf_catalog_name: rawProduct.SF_Catalog_Name,
            model_number: rawProduct.Model_Number_Web_Retailer || "",
            brand: cleanedText.brand,
            category: matchedCategory,
            session_id: sessionId,
          },
          aiContext: {
            openai_value: openaiResult.primaryAttributes.product_style,
            xai_value: xaiResult.primaryAttributes.product_style,
            consensus_value: potentialStyle,
          },
          rawDataContext: {
            web_retailer_value: rawProduct.Web_Retailer_SubCategory,
            original_attribute_name: potentialStyle,
          },
          requestGenerated: true,
          requestDetails: {
            attribute_name: mappedStyle,
            requested_for_category: matchedCategory,
            reason: `Style "${mappedStyle}" mapped from AI but not found in Salesforce picklist`,
          },
        });
      }
    } else {
      // No style mapping found - try fuzzy matching before requesting creation
      // IMPORTANT: Filter out N/A values - these break SF JSON parsing and are not valid styles
      const isValidStyle = potentialStyle && 
                           potentialStyle.trim() !== '' && 
                           !isNAValue(potentialStyle);
      
      if (isValidStyle) {
        // ENHANCEMENT: Try fuzzy matching first (catches "Storage Drawer" → "Storage Drawers", etc.)
        const fuzzyStyleMatch = picklistMatcher.matchStyle(potentialStyle);
        if (fuzzyStyleMatch.matched && fuzzyStyleMatch.matchedValue) {
          // Fuzzy match found! Use it instead of creating a request
          styleMatch = fuzzyStyleMatch;
          styleToUse = fuzzyStyleMatch.matchedValue.style_name;
          logger.info('Style matched via fuzzy matching (no category-specific mapping)', {
            originalStyle: potentialStyle,
            matchedStyle: styleToUse,
            similarity: fuzzyStyleMatch.similarity,
            category: matchedCategory
          });
        } else {
          // No fuzzy match - check if style already exists by exact name (prevents duplicates)
          const existingStyle = picklistMatcher.getStyleByName(potentialStyle);
          if (existingStyle) {
            // Style already exists - use existing instead of requesting new
            styleMatch = { 
              matched: true, 
              matchedValue: existingStyle
            };
            styleToUse = existingStyle.style_name;
            logger.info('Style already exists in picklist - using existing instead of requesting new', {
              style: potentialStyle,
              existingStyleId: existingStyle.style_id,
              category: matchedCategory
            });
          } else {
            // Style truly doesn't exist - request creation
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
          }
        }
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
  
  } // Close else block for type != N/A
  
  // ============================================
  // GENERATE SEO-OPTIMIZED TITLE
  // ============================================
  // Build title input from all available product data
  const seoTitleInput: SEOTitleInput = {
    brand: brandMatch.matched && brandMatch.matchedValue 
      ? brandMatch.matchedValue.brand_name 
      : cleanedText.brand,
    modelNumber: preferAIValue(
      consensus.agreedPrimaryAttributes.model_number,
      openaiResult.primaryAttributes.model_number,
      xaiResult.primaryAttributes.model_number,
      openaiResult.confidence,
      xaiResult.confidence,
      rawProduct.Ferguson_Model_Number || rawProduct.Model_Number_Web_Retailer || ''
    ) || '',
    category: categoryMatch.matched && categoryMatch.matchedValue
      ? categoryMatch.matchedValue.category_name
      : consensus.agreedCategory || '',
    subCategory: consensus.agreedPrimaryAttributes.subcategory || rawProduct.Web_Retailer_SubCategory || '',
    
    // Dimensions
    width: preferAIValue(
      consensus.agreedPrimaryAttributes.width,
      openaiResult.primaryAttributes.width,
      xaiResult.primaryAttributes.width,
      openaiResult.confidence,
      xaiResult.confidence,
      rawProduct.Width_Web_Retailer || rawProduct.Ferguson_Width || ''
    ),
    height: preferAIValue(
      consensus.agreedPrimaryAttributes.height,
      openaiResult.primaryAttributes.height,
      xaiResult.primaryAttributes.height,
      openaiResult.confidence,
      xaiResult.confidence,
      rawProduct.Height_Web_Retailer || rawProduct.Ferguson_Height || ''
    ),
    depth: preferAIValue(
      consensus.agreedPrimaryAttributes.depth,
      openaiResult.primaryAttributes.depth,
      xaiResult.primaryAttributes.depth,
      openaiResult.confidence,
      xaiResult.confidence,
      rawProduct.Depth_Web_Retailer || rawProduct.Ferguson_Depth || ''
    ),
    
    // Style/Type
    style: styleToUse || '',
    configuration: preferAIValue(
      consensus.agreedPrimaryAttributes.configuration,
      openaiResult.primaryAttributes.configuration,
      xaiResult.primaryAttributes.configuration,
      openaiResult.confidence,
      xaiResult.confidence,
      ''
    ),
    
    // Appearance
    finish: preferAIValue(
      consensus.agreedPrimaryAttributes.finish,
      openaiResult.primaryAttributes.finish,
      xaiResult.primaryAttributes.finish,
      openaiResult.confidence,
      xaiResult.confidence,
      rawProduct.Ferguson_Finish || ''
    ),
    color: preferAIValue(
      consensus.agreedPrimaryAttributes.color,
      openaiResult.primaryAttributes.color,
      xaiResult.primaryAttributes.color,
      openaiResult.confidence,
      xaiResult.confidence,
      rawProduct.Ferguson_Color || ''
    ),
    material: preferAIValue(
      consensus.agreedPrimaryAttributes.material,
      openaiResult.primaryAttributes.material,
      xaiResult.primaryAttributes.material,
      openaiResult.confidence,
      xaiResult.confidence,
      ''
    ),
    
    // Category-specific attributes
    fuelType: preferAIValue(
      consensus.agreedPrimaryAttributes.fuel_type,
      openaiResult.primaryAttributes.fuel_type,
      xaiResult.primaryAttributes.fuel_type,
      openaiResult.confidence,
      xaiResult.confidence,
      ''
    ),
    totalCapacity: preferAIValue(
      consensus.agreedPrimaryAttributes.total_capacity,
      openaiResult.primaryAttributes.total_capacity,
      xaiResult.primaryAttributes.total_capacity,
      openaiResult.confidence,
      xaiResult.confidence,
      rawProduct.Capacity_Web_Retailer || ''
    ),
    numberOfLights: preferAIValue(
      consensus.agreedPrimaryAttributes.number_of_lights,
      openaiResult.primaryAttributes.number_of_lights,
      xaiResult.primaryAttributes.number_of_lights,
      openaiResult.confidence,
      xaiResult.confidence,
      ''
    ),
    numberOfBurners: preferAIValue(
      consensus.agreedPrimaryAttributes.number_of_burners,
      openaiResult.primaryAttributes.number_of_burners,
      xaiResult.primaryAttributes.number_of_burners,
      openaiResult.confidence,
      xaiResult.confidence,
      ''
    ),
    
    // Features NOT passed to title generator (removed from titles in v2.1)
    // features: cleanedText.features,
    
    // Raw title as fallback
    rawTitle: cleanedText.title
  };
  
  // Generate SEO-optimized title
  const seoTitle = generateSEOTitle(seoTitleInput);
  logger.info('SEO title generated', {
    sessionId,
    seoTitle: seoTitle.substring(0, 80),
    originalTitle: cleanedText.title?.substring(0, 80),
    category: seoTitleInput.category,
    brand: seoTitleInput.brand
  });
  
  const primaryAttributes: PrimaryDisplayAttributes = {
    AI_Brand: brandMatch.matched && brandMatch.matchedValue 
      ? brandMatch.matchedValue.brand_name  // Use EXACT Salesforce brand name
      : cleanedText.brand,
    AI_Brand_Lookup: brandMatch.matched && brandMatch.matchedValue 
      ? brandMatch.matchedValue.brand_id 
      : null,
    AI_Product_Category: categoryMatch.matched && categoryMatch.matchedValue 
      ? categoryMatch.matchedValue.category_name  // Use EXACT Salesforce category name
      : cleanEncodingIssues(consensus.agreedCategory || ''),
    AI_Product_Category_Lookup: categoryMatch.matched && categoryMatch.matchedValue 
      ? categoryMatch.matchedValue.category_id 
      : null,
    // SubCategory removed - was redundant (same as Category)
    AI_Product_Family: categoryMatch.matched && categoryMatch.matchedValue?.family
      ? categoryMatch.matchedValue.family  // Use family directly from SF picklist data
      : cleanEncodingIssues(consensus.agreedPrimaryAttributes.product_family || ''),
    AI_Product_Department: determinedDepartment,  // Use hierarchically determined department from Stage 1
    AI_Type: typeMatchResult.matched && typeMatchResult.matchedValue
      ? typeMatchResult.matchedValue.type_name  // Use EXACT Salesforce type name
      : cleanEncodingIssues(aiProductType || 'Not Applicable'),  // Use AI value or fallback
    AI_Type_Id: typeMatchResult.matched && typeMatchResult.matchedValue 
      ? typeMatchResult.matchedValue.type_id 
      : null,
    AI_Style: styleMatch.matched && styleMatch.matchedValue 
      ? styleMatch.matchedValue.style_name  // Use EXACT Salesforce style name when matched
      : styleToUse,  // Use AI-derived style even if not in SF picklist (will be in Style_Requests)
    AI_Style_Lookup: styleMatch.matched && styleMatch.matchedValue 
      ? styleMatch.matchedValue.style_id 
      : null,
    AI_Color: (() => {
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
      
      // If still empty, check image analysis from research
      if ((!color || color.trim() === '') && researchResult) {
        for (const img of researchResult.images || []) {
          if (img.detectedColor) {
            color = img.detectedColor;
            logger.info('Extracted color from image analysis', { color, source: 'image_vision_analysis', sessionId });
            break;
          }
        }
      }
      
      // If still empty, try to extract from title/description
      if (!color || color.trim() === '') {
        const textToSearch = `${rawProduct.Product_Title_Web_Retailer || ''} ${rawProduct.Ferguson_Title || ''} ${rawProduct.Product_Description_Web_Retailer || ''} ${rawProduct.Ferguson_Description || ''}`;
        const extracted = extractColorFinish(textToSearch);
        if (extracted.color) {
          color = extracted.color;
          logger.info('Extracted color from text', { color, source: 'material_extraction' });
        }
      }
      
      // Format color as "hexcode (ColorName)" if we have both hex and finish name
      // Get the finish name first
      let finishName = cleanEncodingIssues(
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
      
      // If color is a hex code (6 chars, all hex) and we have a finish name, format as "hexcode (Name)"
      if (color && /^[0-9a-fA-F]{6}$/.test(color.trim()) && finishName && finishName.trim()) {
        color = `${color} (${finishName})`;
        logger.info('Formatted color with finish name', { color, sessionId });
      }
      
      return color;
    })(),
    AI_Finish: (() => {
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
      
      // If still empty, check image analysis from research
      if ((!finish || finish.trim() === '') && researchResult) {
        for (const img of researchResult.images || []) {
          if (img.detectedFinish) {
            finish = img.detectedFinish;
            logger.info('Extracted finish from image analysis', { finish, source: 'image_vision_analysis', sessionId });
            break;
          }
        }
      }
      
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
    AI_Depth: preferAIValue(
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
    AI_Width: preferAIValue(
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
    AI_Height: preferAIValue(
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
    AI_Weight: (() => {
      const weight = preferAIValue(
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
      );
      // Strip unit suffixes (lbs, lb, kg, oz, etc.) and return just the number
      return weight ? String(weight).replace(/\s*(lbs?\.?|pounds?|kg|oz|ounces?)\s*$/i, '').trim() : '';
    })(),
    AI_MSRP: preferAIValue(
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
    // Market_Value fields removed - no longer sent to Salesforce
    AI_Description: cleanedText.description,
    AI_Product_Title: seoTitle,  // Use SEO-optimized title
    // Details_Verified field removed - no longer sent to Salesforce
    AI_Features: cleanedText.featuresHtml,
    AI_UPC_GTIN: (() => {
      // Try AI-determined UPC first
      const aiUPC = preferAIValue(
        consensus.agreedPrimaryAttributes.upc_gtin,
        openaiResult.primaryAttributes.upc_gtin,
        xaiResult.primaryAttributes.upc_gtin,
        openaiResult.confidence,
        xaiResult.confidence,
        ''
      );
      
      // If UPC found and valid, use it
      if (aiUPC && aiUPC.trim() && aiUPC.toLowerCase() !== 'not found' && aiUPC.length >= 8) {
        return aiUPC;
      }
      
      // DEFAULT UPC when not found via any method
      // This placeholder indicates "UPC lookup required" for downstream systems
      logger.info('UPC not found - using default placeholder', {
        sessionId,
        modelNumber: rawProduct.SF_Catalog_Name || rawProduct.Model_Number_Web_Retailer,
        aiUPC
      });
      return '741360976603'; // Default UPC placeholder
    })(),
    AI_Model_Number: (() => {
      // NEW PRIORITY: 1) AI consensus/smart resolution (researched & validated), 2) Ferguson, 3) Web Retailer, 4) SF_Catalog_Name (fallback only)
      // AI often finds the complete model number (e.g., "K-26568-CP") while SF may have partial (e.g., "26568-BL")
      const aiModel = preferAIValue(
        consensus.agreedPrimaryAttributes.model_number,
        openaiResult.primaryAttributes.model_number,
        xaiResult.primaryAttributes.model_number,
        openaiResult.confidence,
        xaiResult.confidence,
        null
      )?.trim();
      
      // Only use AI model if it's a real value (not "Not Found" markers)
      if (aiModel && !aiModel.includes('Not Found') && !aiModel.includes('FIELD_NOT_FOUND')) {
        logger.info('Model number from AI consensus', { aiModel, sessionId });
        return aiModel;
      }
      
      const fergModel = rawProduct.Ferguson_Model_Number?.trim();
      if (fergModel) return fergModel;
      
      const wrModel = rawProduct.Model_Number_Web_Retailer?.trim();
      if (wrModel) return wrModel;
      
      // SF_Catalog_Name as last resort fallback
      const sfModel = rawProduct.SF_Catalog_Name?.trim();
      return sfModel || '';
    })(),
    AI_Model_Alias: (() => {
      const primary = rawProduct.SF_Catalog_Name || consensus.agreedPrimaryAttributes.model_number || rawProduct.Model_Number_Web_Retailer || '';
      // Remove special characters for alias
      return primary.replace(/[\/\-\s]/g, '');
    })(),
    AI_Model_Parent: (() => {
      // First try AI consensus
      const aiValue = preferAIValue(
        consensus.agreedPrimaryAttributes.model_parent,
        openaiResult.primaryAttributes.model_parent,
        xaiResult.primaryAttributes.model_parent,
        openaiResult.confidence,
        xaiResult.confidence,
        ''
      );
      if (aiValue && aiValue !== 'Not Found' && aiValue !== 'N/A' && aiValue !== '') {
        return aiValue;
      }
      
      // Fall back to Ferguson parent_model_number
      const fergusonParent = (rawProduct as any).Ferguson_Raw_Data?.product?.parent_model_number;
      if (fergusonParent) {
        return fergusonParent;
      }
      
      return 'None Identified';
    })(),
    AI_Model_Variant_Number: (() => {
      // First try to get from AI
      const aiValue = preferAIValue(
        consensus.agreedPrimaryAttributes.model_variant_number,
        openaiResult.primaryAttributes.model_variant_number,
        xaiResult.primaryAttributes.model_variant_number,
        openaiResult.confidence,
        xaiResult.confidence,
        ''
      );
      if (aiValue && aiValue !== 'Not Found' && aiValue !== 'N/A' && aiValue !== '') {
        return aiValue;
      }
      
      // Extract from Ferguson variants if available
      const fergusonVariants = (rawProduct as any).Ferguson_Raw_Data?.product?.variants;
      const currentModel = rawProduct.Ferguson_Model_Number || rawProduct.SF_Catalog_Name;
      if (Array.isArray(fergusonVariants) && fergusonVariants.length > 0 && currentModel) {
        // Find the variant suffix (e.g., "BK" from "356BK")
        const parentModel = (rawProduct as any).Ferguson_Raw_Data?.product?.parent_model_number;
        if (parentModel && currentModel.startsWith(parentModel)) {
          const suffix = currentModel.substring(parentModel.length);
          if (suffix) return suffix;
        }
      }
      
      return 'None Identified';
    })(),
    AI_Total_Model_Variants: (() => {
      // First try to get from AI
      let value = cleanEncodingIssues(
        preferAIValue(
          consensus.agreedPrimaryAttributes.total_model_variants,
          openaiResult.primaryAttributes.total_model_variants,
          xaiResult.primaryAttributes.total_model_variants,
          openaiResult.confidence,
          xaiResult.confidence,
          ''
        )
      );
      
      // If AI didn't find variants, extract from Ferguson_Raw_Data
      if (!value || value === 'Not Found' || value === 'N/A' || value === '') {
        const fergusonVariants = (rawProduct as any).Ferguson_Raw_Data?.product?.variants;
        if (Array.isArray(fergusonVariants) && fergusonVariants.length > 0) {
          // Extract model numbers from Ferguson variants
          const variantModels = fergusonVariants
            .map((v: any) => v.model_number || v.modelNumber)
            .filter((m: string) => m);
          if (variantModels.length > 0) {
            value = variantModels.join(', ');
            logger.info('Extracted variants from Ferguson_Raw_Data', {
              variantCount: variantModels.length,
              variants: variantModels.slice(0, 5)
            });
          }
        }
      }
      
      // If still no variants found
      if (!value || value === 'Not Found' || value === 'N/A' || value === '') {
        return 'None Identified';
      }
      
      // Extract only variant suffixes to save space (SF field limit: 255 chars)
      // Get the model parent to strip from each variant
      const modelParent = preferAIValue(
        consensus.agreedPrimaryAttributes.model_parent,
        openaiResult.primaryAttributes.model_parent,
        xaiResult.primaryAttributes.model_parent,
        openaiResult.confidence,
        xaiResult.confidence,
        ''
      ) || (rawProduct as any).Ferguson_Raw_Data?.product?.parent_model_number || '';
      
      if (modelParent && modelParent !== 'Not Found' && modelParent !== 'None Identified') {
        // Split variants and extract only the suffix portion
        // E.g., "2400-4273-034, 2400-4273/65" with parent "2400-4273" → "034, 65"
        const variants = value.split(/,\s*/);
        const suffixes = variants.map(variant => {
          const trimmed = variant.trim();
          // Simple approach: if variant starts with parent, extract suffix
          if (trimmed.startsWith(modelParent)) {
            let suffix = trimmed.substring(modelParent.length);
            // Remove leading separator (- or /)
            if (suffix.startsWith('-') || suffix.startsWith('/')) {
              suffix = suffix.substring(1);
            }
            return suffix || trimmed;
          }
          return trimmed;
        });
        
        const result = suffixes.join(', ');
        logger.info('Total_Model_Variants extracted suffixes only', {
          originalLength: value.length,
          resultLength: result.length,
          modelParent,
          sampleSuffixes: suffixes.slice(0, 5).join(', ')
        });
        
        // If still too long, truncate with indicator
        if (result.length > 250) {
          const truncated = result.substring(0, 245) + '...';
          return truncated;
        }
        return result;
      }
      
      // No parent to strip, just truncate if needed
      if (value.length > 250) {
        return value.substring(0, 245) + '...';
      }
      return value;
    })()
  };

  // Clean top filter attributes and build attribute ID lookups
  const topFilterAttributes: TopFilterAttributes = {};
  const topFilterAttributeIds: TopFilterAttributeIds = {};
  const attributeRequests: AttributeRequest[] = [];  // Track attributes not in Salesforce picklist
  
  // Get the category schema to map field keys to attribute names
  // Use context-aware lookup to refine generic categories (e.g., "Decorative Lighting #" -> "Pendants #")
  const productContext = {
    title: rawProduct.Product_Title_Web_Retailer || rawProduct.Ferguson_Title || '',
    description: rawProduct.Product_Description_Web_Retailer || rawProduct.Ferguson_Description || '',
    attributes: [
      ...(rawProduct.Ferguson_Attributes || []),
      ...(rawProduct.Web_Retailer_Specs || [])
    ],
    productType: rawProduct.Ferguson_Product_Type || ''
  };
  
  const categorySchema = consensus.agreedCategory 
    ? getCategorySchemaWithContext(consensus.agreedCategory, productContext) 
    : null;
  
  // Create set of PRIMARY field keys (normalized) to filter out from Top 15
  const primaryFieldKeysSet = new Set(
    PRIMARY_ATTRIBUTE_FIELD_KEYS.map(key => key.toLowerCase().replace(/[^a-z0-9]/g, ''))
  );
  
  // Log schema retrieval for debugging
  logger.info('Category schema lookup for attribute ID mapping', {
    originalCategory: consensus.agreedCategory || 'unknown',
    resolvedCategory: categorySchema?.categoryName || 'unknown',
    schemaFound: !!categorySchema,
    attributeCount: categorySchema?.top15FilterAttributes?.length || 0,
    wasRefined: categorySchema?.categoryName !== consensus.agreedCategory
  });
  
  // Map to track which attributes we've already processed as requests (avoid duplicates)
  const requestedAttributeNames = new Set<string>();
  
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
  // Use the category-aware findTop15AttributeValue function
  if (categorySchema?.top15FilterAttributes) {
    for (const attrDef of categorySchema.top15FilterAttributes) {
      const key = attrDef.fieldKey;
      const name = attrDef.name;
      
      // If AI didn't provide this attribute, search raw data using category-aware matching
      if (completeTop15[key] === undefined || completeTop15[key] === null || completeTop15[key] === '') {
        const result = findTop15AttributeValue(rawProduct, key, name);
        if (result.value) {
          completeTop15[key] = result.value;
          logger.info('Filled missing Top 15 attribute from raw data (category-aware)', {
            fieldKey: key,
            attributeName: name,
            value: result.value,
            matchedFrom: result.matchedFrom,
            source: 'raw_data_fallback'
          });
        }
      }
    }
  }
  
  // =========================================
  // SMART FIELD INFERENCE - Fill remaining gaps using common sense
  // =========================================
  if (categorySchema?.top15FilterAttributes) {
    // Get list of still-missing field keys
    const missingFieldKeys = categorySchema.top15FilterAttributes
      .map(attr => attr.fieldKey)
      .filter(key => completeTop15[key] === undefined || completeTop15[key] === null || completeTop15[key] === '');
    
    if (missingFieldKeys.length > 0) {
      logger.info('Running smart field inference for missing attributes', {
        missingCount: missingFieldKeys.length,
        missingFields: missingFieldKeys,
        category: consensus.agreedCategory
      });
      
      // Combine all raw specs for inference
      const allSpecs = [
        ...(rawProduct.Ferguson_Attributes || []),
        ...(rawProduct.Web_Retailer_Specs || [])
      ];
      
      // Get features text from cleaned output
      const featuresText = cleanedText.featuresHtml || '';
      
      // Combine descriptions
      const descriptionText = [
        rawProduct.Product_Description_Web_Retailer,
        rawProduct.Ferguson_Description
      ].filter(Boolean).join(' ');
      
      // Run smart inference
      const inferredValues = inferMissingFields(
        allSpecs,
        featuresText,
        descriptionText,
        missingFieldKeys,
        consensus.agreedCategory || undefined
      );
      
      // Apply inferred values to completeTop15
      for (const [fieldKey, extracted] of Object.entries(inferredValues)) {
        if (completeTop15[fieldKey] === undefined || completeTop15[fieldKey] === null || completeTop15[fieldKey] === '') {
          completeTop15[fieldKey] = extracted.value;
          logger.info('Filled attribute from smart inference', {
            fieldKey,
            value: extracted.value,
            confidence: extracted.confidence,
            source: extracted.source
          });
        }
      }
    }
  }
  
  // ⚠️ CRITICAL: Only iterate through SCHEMA-DEFINED Top 15 attributes for this category
  // Do NOT send all attributes AI found - only send the ranked Top 15 from category schema
  const schemaDefinedTop15 = categorySchema?.top15FilterAttributes || [];
  
  for (const attrDef of schemaDefinedTop15) {
    const key = attrDef.fieldKey;
    const value = completeTop15[key];
    
    // ⚠️ CRITICAL FILTER: Exclude PRIMARY_ATTRIBUTE field keys from Top_Filter_Attributes
    // Primary attributes (brand, description, product_style, etc.) should NEVER appear in Top 15
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (primaryFieldKeysSet.has(normalizedKey)) {
      logger.warn('Filtered PRIMARY attribute from Top_Filter_Attributes', {
        fieldKey: key,
        value: value,
        reason: 'PRIMARY attributes should only appear in Primary_Attributes section'
      });
      continue;  // Skip this attribute - it belongs in Primary_Attributes only
    }
    
    // ⚠️ CRITICAL: ALWAYS include ALL Top 15 attributes, even if not found
    // If no value found, mark with "Procurement No Results" to indicate research was completed
    let finalValue: any;
    if (value === null || value === undefined || value === '') {
      finalValue = FIELD_STATUS_CODES.PROCUREMENT_NO_RESULTS;
      logger.info('Top 15 attribute not found - marking as Procurement No Results', {
        fieldKey: key,
        attributeName: attrDef.name,
        rank: attrDef.rank,
        category: consensus.agreedCategory
      });
    } else {
      finalValue = typeof value === 'string' ? cleanEncodingIssues(value) : value;
    }
    
    // We already have attrDef from the loop - use it directly
    const attributeName = attrDef.name;
      
    // For enum types with allowedValues, validate and match against exact allowed values
    if (attrDef.type === 'enum' && attrDef.allowedValues && finalValue) {
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
    
    topFilterAttributes[key] = finalValue;
    
    // Look up the attribute ID from category-specific filter attributes
    // This ensures we get the CORRECT ID for the category, not a fuzzy match from all attributes
    // RULE: Use category-filter-attributes.json as source of truth for Top 15 IDs
    if (attributeName) {
      // First, try category-specific lookup (most accurate)
      const categoryAttrIdMap = lookups.getAttributeNameToSfIdMap(consensus.agreedCategory || '');
      let attributeId: string | null = null;
      
      // Try exact match, case-insensitive, and snake_case variations
      attributeId = categoryAttrIdMap[attributeName] || 
                   categoryAttrIdMap[attributeName.toLowerCase()] || 
                   categoryAttrIdMap[attributeName.toLowerCase().replace(/\s+/g, '_')] ||
                   null;
      
      if (attributeId) {
        // Found in category-filter-attributes.json - use this ID
        topFilterAttributeIds[key] = attributeId;
        logger.debug('Top 15 attribute matched to category-specific SF ID', {
          fieldKey: key,
          attributeName,
          category: consensus.agreedCategory,
          attribute_id: attributeId
        });
      } else {
        // Not in category config - try fuzzy match as fallback (with warning)
        const attrMatch = picklistMatcher.matchAttribute(attributeName, { forceIdLookup: true });
        
        if (attrMatch.matched && attrMatch.matchedValue) {
          // Found via fuzzy match - use with caution
          topFilterAttributeIds[key] = attrMatch.matchedValue.attribute_id;
          logger.warn('Top 15 attribute NOT in category config - used fuzzy match (may be incorrect)', {
            fieldKey: key,
            attributeName,
            category: consensus.agreedCategory,
            fuzzyMatchedTo: attrMatch.matchedValue.attribute_name,
            attribute_id: attrMatch.matchedValue.attribute_id,
            similarity: attrMatch.similarity,
            warning: 'This attribute should be added to category-filter-attributes.json with correct SF ID'
          });
        } else {
          // No match found at all - set ID to null AND generate an Attribute_Request
          topFilterAttributeIds[key] = null;
        
          // No match found at all - set ID to null AND generate an Attribute_Request
          topFilterAttributeIds[key] = null;
          
          // Only generate request if we haven't already requested this attribute
          if (!requestedAttributeNames.has(attributeName.toLowerCase())) {
            attributeRequests.push({
              attribute_name: attributeName,
              requested_for_category: consensus.agreedCategory || 'Unknown',
              source: 'top_15_filter',
              reason: `Top 15 Filter Attribute "${attributeName}" (key: ${key}) not found in category-filter-attributes.json or SF attributes picklist. Value: "${finalValue}". Closest matches: ${attrMatch.suggestions?.slice(0, 3).map(s => s.attribute_name).join(', ') || 'none'}. Please create this attribute in Salesforce.`
            });
            requestedAttributeNames.add(attributeName.toLowerCase());
            
            logger.info('Attribute Request generated for unmatched Top 15 attribute', {
              fieldKey: key,
              attributeName,
              value: finalValue,
              category: consensus.agreedCategory || 'Unknown',
              similarity: attrMatch.similarity,
              suggestions: attrMatch.suggestions?.map(s => s.attribute_name)
            });
            
            // Log failed Top 15 attribute match for auditing
            failedMatchLogger.logFailedMatch({
              matchType: 'attribute',
              attemptedValue: attributeName,
              similarity: attrMatch.similarity,
              closestMatches: attrMatch.suggestions?.slice(0, 5).map(s => ({
                value: s.attribute_name,
                id: s.attribute_id,
                similarity: attrMatch.similarity
              })) || [],
              matchThreshold: 0.6,
              source: 'top_15_filter',
              fieldKey: key,
              productContext: {
                sf_catalog_id: rawProduct.SF_Catalog_Id,
                sf_catalog_name: rawProduct.SF_Catalog_Name,
                model_number: rawProduct.Model_Number_Web_Retailer || "",
                brand: cleanedText.brand,
                category: consensus.agreedCategory,
                session_id: sessionId,
              },
              aiContext: {
                openai_value: String(openaiResult.top15Attributes[key] || ''),
                xai_value: String(xaiResult.top15Attributes[key] || ''),
                consensus_value: String(finalValue || ''),
              },
              rawDataContext: {
                original_attribute_name: attributeName,
              },
              requestGenerated: true,
              requestDetails: {
                attribute_name: attributeName,
                requested_for_category: consensus.agreedCategory || 'Unknown',
                reason: `Top 15 attribute "${attributeName}" not found in SF picklist`,
              },
            });
          }
        }
      }
    } else {
      // Fallback: No attributeName available - try using field key with category lookup first
      const categoryAttrIdMap = lookups.getAttributeNameToSfIdMap(consensus.agreedCategory || '');
      const readableName = key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      
      // Try category-specific lookup with field key variations
      let attributeId: string | null = categoryAttrIdMap[key] || 
                                        categoryAttrIdMap[readableName] ||
                                        categoryAttrIdMap[readableName.toLowerCase()] ||
                                        null;
      
      if (attributeId) {
        // Found in category config
        topFilterAttributeIds[key] = attributeId;
        logger.debug('Top 15 attribute (by key) matched to category-specific SF ID', {
          fieldKey: key,
          readableName,
          category: consensus.agreedCategory,
          attribute_id: attributeId
        });
      } else {
        // Not in category config - try fuzzy match as last resort
        const attrMatch = picklistMatcher.matchAttribute(key, { forceIdLookup: true });
        
        if (attrMatch.matched && attrMatch.matchedValue) {
          topFilterAttributeIds[key] = attrMatch.matchedValue.attribute_id;
          logger.warn('Top 15 attribute (by key) NOT in category config - used fuzzy match', {
            fieldKey: key,
            readableName,
            category: consensus.agreedCategory,
            fuzzyMatchedTo: attrMatch.matchedValue.attribute_name,
            attribute_id: attrMatch.matchedValue.attribute_id,
            similarity: attrMatch.similarity,
            warning: 'This attribute should be added to category-filter-attributes.json'
          });
        } else {
          // No match - set null AND generate request
          topFilterAttributeIds[key] = null;
          // No match - set null AND generate request
          topFilterAttributeIds[key] = null;
          
          // Convert field_key to human-readable name for the request
          const readableNameFinal = key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
          
          if (!requestedAttributeNames.has(key.toLowerCase())) {
            attributeRequests.push({
              attribute_name: readableNameFinal,
              requested_for_category: consensus.agreedCategory || 'Unknown',
              source: 'top_15_filter',
              reason: `Top 15 Filter Attribute "${readableNameFinal}" (key: ${key}) not found in category-filter-attributes.json or SF attributes picklist. Value: "${finalValue}". Please create this attribute in Salesforce.`
            });
            requestedAttributeNames.add(key.toLowerCase());
            
            logger.info('Attribute Request generated for unmatched Top 15 attribute (by key)', {
              fieldKey: key,
              readableName: readableNameFinal,
              value: finalValue,
              category: consensus.agreedCategory || 'Unknown',
              similarity: attrMatch.similarity
            });
            
            // Log failed Top 15 attribute match (by key) for auditing
            failedMatchLogger.logFailedMatch({
              matchType: 'attribute',
              attemptedValue: key,
              similarity: attrMatch.similarity,
              closestMatches: attrMatch.suggestions?.slice(0, 5).map(s => ({
                value: s.attribute_name,
                id: s.attribute_id,
                similarity: attrMatch.similarity
              })) || [],
              matchThreshold: 0.6,
              source: 'top_15_filter',
              fieldKey: key,
              productContext: {
                sf_catalog_id: rawProduct.SF_Catalog_Id,
                sf_catalog_name: rawProduct.SF_Catalog_Name,
                model_number: rawProduct.Model_Number_Web_Retailer || "",
                brand: cleanedText.brand,
                category: consensus.agreedCategory,
                session_id: sessionId,
              },
              aiContext: {
                openai_value: String(openaiResult.top15Attributes[key] || ''),
                xai_value: String(xaiResult.top15Attributes[key] || ''),
                consensus_value: String(finalValue || ''),
              },
              rawDataContext: {
                original_attribute_name: readableNameFinal,
              },
              requestGenerated: true,
              requestDetails: {
                attribute_name: readableNameFinal,
                requested_for_category: consensus.agreedCategory || 'Unknown',
                reason: `Top 15 attribute (by key) "${key}" not found in SF picklist`,
              },
            });
          }
        }
      }
    }
  }
  
  // Process HTML Table Attributes (Additional Attributes)
  // These are attributes beyond the Top 15 that AI extracted
  // Match them against SF picklist and generate requests for unmatched ones
  if (consensus.agreedAdditionalAttributes && Object.keys(consensus.agreedAdditionalAttributes).length > 0) {
    logger.info('Processing HTML table attributes for SF picklist matching', {
      count: Object.keys(consensus.agreedAdditionalAttributes).length,
      attributes: Object.keys(consensus.agreedAdditionalAttributes)
    });
    
    for (const [attrName, attrValue] of Object.entries(consensus.agreedAdditionalAttributes)) {
      if (!attrValue || attrValue === '' || isNAValue(attrValue)) {
        // Skip empty or N/A values
        continue;
      }
      
      // Skip if this attribute name looks like a value, not an attribute name
      if (picklistMatcher.isAttributeValue(attrName)) {
        logger.info('Skipping attribute - appears to be a value not a name', { attrName });
        continue;
      }
      
      // Skip if this is a primary attribute (already handled separately)
      if (picklistMatcher.isPrimaryAttribute(attrName)) {
        logger.info('Skipping attribute - is a primary attribute (handled separately)', { attrName });
        continue;
      }
      
      // Try to match against SF picklist
      const attrMatch = picklistMatcher.matchAttribute(attrName);
      
      if (attrMatch.matched && attrMatch.matchedValue) {
        // Attribute exists in SF - log for tracking
        logger.info('HTML table attribute matched to SF picklist', {
          attrName,
          attribute_id: attrMatch.matchedValue.attribute_id,
          similarity: attrMatch.similarity
        });
      } else {
        // Attribute NOT in SF picklist - generate request for creation
        // Check if we've already created a request for this exact attribute name (avoid duplicates)
        if (!requestedAttributeNames.has(attrName.toLowerCase())) {
          attributeRequests.push({
            attribute_name: attrName,
            requested_for_category: consensus.agreedCategory || 'Unknown',
            source: 'ai_analysis',
            reason: `Attribute "${attrName}" detected in AI analysis with value "${attrValue}" but not found in Salesforce picklist (similarity: ${(attrMatch.similarity * 100).toFixed(0)}%). Please create this attribute so future products can map values to it.`
          });
          
          requestedAttributeNames.add(attrName.toLowerCase());
          
          logger.info('Attribute request generated for Salesforce creation', {
            attrName,
            value: attrValue,
            category: consensus.agreedCategory,
            similarity: attrMatch.similarity,
            suggestions: attrMatch.suggestions?.map(s => s.attribute_name)
          });
          
          // Log failed additional/HTML table attribute match for auditing
          failedMatchLogger.logFailedMatch({
            matchType: 'attribute',
            attemptedValue: attrName,
            similarity: attrMatch.similarity,
            closestMatches: attrMatch.suggestions?.slice(0, 5).map(s => ({
              value: s.attribute_name,
              id: s.attribute_id,
              similarity: attrMatch.similarity
            })) || [],
            matchThreshold: 0.6,
            source: 'html_table',
            productContext: {
              sf_catalog_id: rawProduct.SF_Catalog_Id,
              sf_catalog_name: rawProduct.SF_Catalog_Name,
              model_number: rawProduct.Model_Number_Web_Retailer || "",
              brand: cleanedText.brand,
              category: consensus.agreedCategory,
              session_id: sessionId,
            },
            aiContext: {
              openai_value: String(openaiResult.additionalAttributes[attrName] || ''),
              xai_value: String(xaiResult.additionalAttributes[attrName] || ''),
              consensus_value: String(attrValue || ''),
            },
            rawDataContext: {
              original_attribute_name: attrName,
            },
            requestGenerated: true,
            requestDetails: {
              attribute_name: attrName,
              requested_for_category: consensus.agreedCategory || 'Unknown',
              reason: `Additional attribute "${attrName}" with value "${attrValue}" not found in SF picklist`,
            },
          });
        }
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
  
  // Get unused Ferguson attributes that should be included in Additional HTML
  // These include: Collection, Theme, Country, Location Rating, Warranties, etc.
  const unusedFergusonAttrs = getUnusedFergusonAttributes(rawProduct, topFilterAttributes);
  
  // Merge AI's additional attributes with unused Ferguson attributes
  // Ferguson attributes take precedence as they are authoritative data
  const mergedAdditionalAttributes = {
    ...consensus.agreedAdditionalAttributes,
    ...unusedFergusonAttrs  // Ferguson data comes last to override AI if both exist
  };
  
  const additionalHtml = generateAttributeTable(mergedAdditionalAttributes);
  
  // Log what Ferguson attributes were added to HTML
  if (Object.keys(unusedFergusonAttrs).length > 0) {
    logger.info('Ferguson attributes added to Additional_Attributes_HTML', {
      count: Object.keys(unusedFergusonAttrs).length,
      attributes: Object.keys(unusedFergusonAttrs)
    });
  }
  
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

  // Build data sources list based on what was actually used
  const dataSources: string[] = ['OpenAI', 'xAI'];
  if (dataSourceAnalysis?.hasWebRetailerData) dataSources.push('Web_Retailer');
  if (dataSourceAnalysis?.hasFergusonData) dataSources.push('Ferguson');
  if (didResearch) dataSources.push('External_Research');

  // Check if model mismatch was detected - this is a critical data quality indicator
  const modelMismatchDetected = dataSourceAnalysis?.modelValidation && !dataSourceAnalysis.modelValidation.isExactMatch;
  const modelMismatchWarning = modelMismatchDetected ? {
    warning: 'MODEL_NUMBER_MISMATCH',
    requested_model: dataSourceAnalysis.modelValidation?.requestedModel,
    found_model: dataSourceAnalysis.modelValidation?.foundModel,
    reason: dataSourceAnalysis.modelValidation?.mismatchReason,
    impact: 'External data may be from a different product variant. Color, finish, and variant-specific attributes may be inaccurate.'
  } : undefined;

  const verification: VerificationMetadata = {
    verification_timestamp: new Date().toISOString(),
    verification_session_id: sessionId,
    verification_score: Math.round(consensus.overallConfidence * 100),
    verification_status: status,
    data_sources_used: dataSources,
    corrections_made: corrections,
    missing_fields: consensus.needsResearch.map(field => 
      didResearch ? `${field} (researched - ${FIELD_NOT_FOUND})` : field
    ),
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
      })),
      // New: Data source analysis info
      data_source_scenario: dataSourceAnalysis?.scenario || 'unknown',
      research_performed: didResearch,
      research_attempts: researchAttempts || 0,
      urls_scraped: dataSourceAnalysis?.availableUrls.length || 0,
      documents_analyzed: dataSourceAnalysis?.availableDocuments.length || 0,
      images_analyzed: dataSourceAnalysis?.availableImages.length || 0,
      // Model match validation
      external_data_trusted: dataSourceAnalysis?.externalDataTrusted ?? true,
      model_mismatch_warning: modelMismatchWarning
    }
  };

  // Log model mismatch warning if detected
  if (modelMismatchDetected) {
    logger.warn('RESPONSE INCLUDES MODEL MISMATCH WARNING', {
      sessionId,
      ...modelMismatchWarning,
      sf_catalog_id: rawProduct.SF_Catalog_Id
    });
  }

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
    brand: primaryAttributes.AI_Brand || '',
    brand_id: primaryAttributes.AI_Brand_Lookup || null,
    category: primaryAttributes.AI_Product_Category || '',
    category_id: primaryAttributes.AI_Product_Category_Lookup || null,
    department: primaryAttributes.AI_Product_Department || '',
    family: primaryAttributes.AI_Product_Family || '',
    // subcategory removed - was redundant with category
    style: primaryAttributes.AI_Style || '',
    style_id: primaryAttributes.AI_Style_Lookup || null,
    attributes: {
      ...topFilterAttributes,
      color: primaryAttributes.AI_Color,
      width: primaryAttributes.AI_Width,
      height: primaryAttributes.AI_Height,
      depth: primaryAttributes.AI_Depth
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
  
  // Filter out any Style_Requests with N/A values AND styles that already exist in picklist
  // This prevents duplicate style creation in Salesforce
  const filteredStyleRequests = styleRequests.filter(req => {
    // Skip N/A values
    if (!req.style_name || isNAValue(req.style_name)) {
      return false;
    }
    // Skip if style already exists in picklist (final safety check)
    if (picklistMatcher.styleExistsByName(req.style_name)) {
      logger.info('Filtering out style request - style already exists in picklist', {
        style: req.style_name,
        category: req.suggested_for_category
      });
      return false;
    }
    return true;
  });

  // Build research transparency to show what was analyzed from each resource
  // Now includes the final web search results as well
  const researchTransparency = buildResearchTransparency(researchResult, finalSearchResult);

  // Build Research Attestation Summary - tracks "Procurement No Results" usage
  const researchAttestationSummary = buildResearchAttestationSummary(
    topFilterAttributes,
    sanitizedPrimaryAttributes,
    didResearch,
    openaiResult,
    xaiResult,
    researchResult,
    finalSearchResult
  );

  // Build Received Attributes Confirmation - Track all incoming attributes from Salesforce
  // This shows SF which attributes we received, processed, and where they ended up in the response
  const receivedAttributesConfirmation = buildReceivedAttributesConfirmation(
    rawProduct,
    topFilterAttributes,
    consensus.agreedAdditionalAttributes
  );

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
    Research_Attestation: researchAttestationSummary,
    Received_Attributes_Confirmation: receivedAttributesConfirmation,
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

/**
 * Track response quality for all fields to identify inconclusive responses
 */
async function trackResponseQuality(
  sessionId: string,
  rawProduct: SalesforceIncomingProduct,
  category: string,
  openaiResult: any,
  xaiResult: any,
  consensus: any,
  dataSourceAnalysis: any
): Promise<void> {
  try {
    // Determine what data sources were available
    const dataSourcesAvailable: string[] = [];
    if (dataSourceAnalysis.hasFergusonData) dataSourcesAvailable.push('ferguson');
    if (dataSourceAnalysis.hasWebData) dataSourcesAvailable.push('web_retailer');
    if (dataSourceAnalysis.hasDocuments) dataSourcesAvailable.push('documents');
    if (dataSourceAnalysis.hasImages) dataSourcesAvailable.push('images');
    
    const promptIncludedResearch = dataSourceAnalysis.recommendResearch;
    
    // Track primary attributes
    if (openaiResult.primaryAttributes || xaiResult.primaryAttributes) {
      const allPrimaryFields = new Set([
        ...Object.keys(openaiResult.primaryAttributes || {}),
        ...Object.keys(xaiResult.primaryAttributes || {})
      ]);
      
      for (const fieldName of allPrimaryFields) {
        const openaiValue = openaiResult.primaryAttributes?.[fieldName];
        const xaiValue = xaiResult.primaryAttributes?.[fieldName];
        const consensusValue = consensus.agreedPrimaryAttributes?.[fieldName];
        
        await responseQualityService.trackFieldResponse({
          sessionId,
          verificationJobId: sessionId,
          productId: rawProduct.SF_Catalog_Id || 'unknown',
          sfCatalogId: rawProduct.SF_Catalog_Id,
          category,
          productStyle: undefined, // Determined by AI, not in source data
          manufacturer: rawProduct.Brand_Web_Retailer || rawProduct.Ferguson_Brand,
          modelNumber: rawProduct.Model_Number_Web_Retailer || rawProduct.SF_Catalog_Name,
          fieldName,
          fieldType: 'primary',
          expectedSource: 'free_text',
          openaiValue: String(openaiValue || ''),
          xaiValue: String(xaiValue || ''),
          consensusValue: String(consensusValue || ''),
          consensusReached: openaiValue === xaiValue,
          promptIncludedResearch,
          dataSourcesAvailable
        });
      }
    }
    
    // Track top 15 filter attributes
    if (openaiResult.top15Attributes || xaiResult.top15Attributes) {
      const allFilterFields = new Set([
        ...Object.keys(openaiResult.top15Attributes || {}),
        ...Object.keys(xaiResult.top15Attributes || {})
      ]);
      
      for (const fieldName of allFilterFields) {
        const openaiValue = openaiResult.top15Attributes?.[fieldName];
        const xaiValue = xaiResult.top15Attributes?.[fieldName];
        const consensusValue = consensus.agreedTop15Attributes?.[fieldName];
        
        await responseQualityService.trackFieldResponse({
          sessionId,
          verificationJobId: sessionId,
          productId: rawProduct.SF_Catalog_Id || 'unknown',
          sfCatalogId: rawProduct.SF_Catalog_Id,
          category,
          productStyle: undefined, // Determined by AI, not in source data
          manufacturer: rawProduct.Brand_Web_Retailer || rawProduct.Ferguson_Brand,
          modelNumber: rawProduct.Model_Number_Web_Retailer || rawProduct.SF_Catalog_Name,
          fieldName,
          fieldType: 'top_filter',
          expectedSource: 'picklist',
          openaiValue: String(openaiValue || ''),
          xaiValue: String(xaiValue || ''),
          consensusValue: String(consensusValue || ''),
          consensusReached: openaiValue === xaiValue,
          promptIncludedResearch,
          dataSourcesAvailable
        });
      }
    }
    
  } catch (error) {
    logger.error('[ResponseQuality] Error tracking response quality:', error);
    // Don't throw - this is non-critical tracking
  }
}

// Export the research attestation service for external access
export { researchAttestationService };

export default { verifyProductWithDualAI };
export const dualAIVerificationService = { verifyProductWithDualAI };
