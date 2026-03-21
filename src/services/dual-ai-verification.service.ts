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
import Anthropic from '@anthropic-ai/sdk';
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
  getDepartmentForCategory,
  PRIMARY_ATTRIBUTE_FIELD_KEYS,
  resolveCategoryDisagreementByTitle
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
import { cleanCustomerFacingText, cleanEncodingIssues, extractColorFinish, extractWidthFromText } from '../utils/text-cleaner';
import { safeParseAIResponse, validateAIResponse } from '../utils/json-parser';
import { normalizeCategoryName, areCategoriesEquivalent } from '../config/category-aliases';
import { getSizeClassConfig } from '../config/category-size-classes';
import { roundToStandardSize, formatSizeClass } from '../utils/size-class-rounder';
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
import { AIPerformanceMetrics } from '../models/ai-performance-metrics.model';
import { catalogIndexService } from './catalog-index.service';
import { performProductResearch, formatResearchForPrompt, ResearchResult, FinalVerificationSearchResult, performDualAIWebSearch } from './research.service';
import { generateSEOTitle, SEOTitleInput } from './seo-title-generator.service';
import { failedMatchLogger } from './failed-match-logger.service';
import { inferMissingFields, FIELD_ALIASES, finalSweepTopFilterAttributes } from './smart-field-inference.service';
import { applyAppliancePipeline } from './pipelines/appliance-pipeline';
import { applyNonAppliancePipeline } from './pipelines/non-appliance-pipeline';
import { PipelineContext, defaultApplianceFeatures } from './pipelines/shared-pipeline-types';
import { researchAttestationService } from './research-attestation.service';
import { pendingCreationRequestService } from './pending-creation-request.service';
import { logAttributeCatalog, AttributeSourceMap } from './attribute-catalog.service';
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
  categoryAgreed: boolean;  // True when both AIs independently picked the same category
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
 * Check if a category belongs to the Appliances department
 * Appliances use Web Retailer as primary data source; all others use Ferguson
 */
function isAppliancesCategory(categoryName: string | null | undefined): boolean {
  if (!categoryName) return false;
  const dept = getDepartmentForCategory(categoryName);
  return dept === 'Appliances';
}

/**
 * Get field value with category-dependent source priority
 * Appliances: Web Retailer first, Ferguson second
 * All others: Ferguson first, Web Retailer second
 */
function getFieldByPriority(
  categoryName: string | null | undefined,
  webRetailerValue: any,
  fergusonValue: any,
  fallback: any = ''
): any {
  // Sanitize string "null"/"undefined" values that Salesforce sometimes sends
  const clean = (v: any) => (typeof v === 'string' && (v === 'null' || v === 'undefined' || v === 'N/A')) ? '' : v;
  const web = clean(webRetailerValue);
  const ferg = clean(fergusonValue);
  const isAppliance = isAppliancesCategory(categoryName);
  if (isAppliance) {
    return web || ferg || fallback;
  } else {
    return ferg || web || fallback;
  }
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
 * Check if an ID is a placeholder that should not be sent to Salesforce
 * Placeholder IDs like "pending_salesforce_id" or "NEEDS_NEW_ID" will cause SF errors
 */
function isPlaceholderId(id: string | null | undefined): boolean {
  if (!id) return true;  // null/undefined/empty is effectively a placeholder
  const placeholders = ['pending_salesforce_id', 'NEEDS_NEW_ID', 'PLACEHOLDER'];
  return placeholders.includes(id);
}

/**
 * Safely get a Salesforce ID, returning null if it's a placeholder
 * This prevents sending invalid placeholder IDs back to Salesforce
 */
function getSafeId(id: string | null | undefined): string | null {
  if (isPlaceholderId(id)) {
    return null;  // Don't send placeholder IDs to Salesforce
  }
  return id || null;
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
      AI_Product_Filter_Class: '',  // Size class for filtering (e.g., "48-Inch")
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
    Appliance_Features: {
      built_in: false,
      panel_ready: false,
      counter_depth: false,
      standard_depth: false,
      voltage_120v: false,
      voltage_240v: false,
      fuel_gas: false,
      fuel_electric: false
    },
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
 * 
 * EVIDENCE-FIRST APPROACH:
 * 1. Research data validation (web scrapes, images, PDFs)
 * 2. Picklist validation (known valid values)
 * 3. Quality analysis (completeness, precision)
 * 4. Escalate unresolvable conflicts (no arbitrary defaults)
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
  
  // STEP 0: Check if both values missing
  const validOpenai = openaiValue && openaiValue !== FIELD_NOT_FOUND && openaiValue !== 'Not Found' && openaiValue !== '';
  const validXai = xaiValue && xaiValue !== FIELD_NOT_FOUND && xaiValue !== 'Not Found' && xaiValue !== '';
  
  if (!validOpenai && !validXai) {
    return { resolvedValue: FIELD_NOT_FOUND, winner: 'not_found', reason: 'Neither AI found a value' };
  }
  
  if (validOpenai && !validXai) {
    return { resolvedValue: openaiValue, winner: 'openai', reason: 'Only OpenAI found a value' };
  }
  
  if (!validOpenai && validXai) {
    return { resolvedValue: xaiValue, winner: 'xai', reason: 'Only xAI found a value' };
  }
  
  // Both AIs have values - need to determine which is correct
  
  // STEP 1: RESEARCH VALIDATION FIRST (evidence-based)
  if (researchContext) {
    const researchValue = findValueInResearch(fieldName, researchContext);
    if (researchValue) {
      const matchesOpenai = valuesMatchLoose(researchValue, openaiValue);
      const matchesXai = valuesMatchLoose(researchValue, xaiValue);
      
      if (matchesOpenai && !matchesXai) {
        return { resolvedValue: openaiValue, winner: 'openai', reason: 'OpenAI matches research data' };
      }
      if (matchesXai && !matchesOpenai) {
        return { resolvedValue: xaiValue, winner: 'xai', reason: 'xAI matches research data' };
      }
      if (matchesOpenai && matchesXai) {
        // Both match research - they're equivalent values
        return { resolvedValue: openaiValue, winner: 'openai', reason: 'Both match research data, values equivalent' };
      }
    }
  }
  
  // STEP 2: FERGUSON-ONLY FIELDS
  if (FERGUSON_ONLY_FIELDS.has(normalizedField)) {
    if (!hasFergusonData) {
      return {
        resolvedValue: FIELD_NOT_FOUND,
        winner: 'not_found',
        reason: `${fieldName} should only come from Ferguson data which is not available`
      };
    }
    // Both have values from Ferguson - check which is more reliable
    // For now, neither can be validated so mark as unresolvable
    return {
      resolvedValue: openaiValue,
      winner: 'openai',
      reason: `Both extracted from Ferguson data, cannot validate - using first available`
    };
  }

  // STEP 3: TEXT FIELDS - Combine or analyze completeness
  if (TEXT_FIELDS.has(normalizedField)) {
    // For features_list, combine them
    if (COMBINABLE_FIELDS.has(normalizedField)) {
      const combined = combineFeatureLists(openaiValue, xaiValue);
      return { resolvedValue: combined, winner: 'combined', reason: 'Combined features from both AIs' };
    }
    
    // For other text fields (title, description), analyze completeness
    const openaiLength = String(openaiValue).length;
    const xaiLength = String(xaiValue).length;
    const lengthDiff = Math.abs(openaiLength - xaiLength);
    
    // If one is significantly longer (>30% difference), it might be more complete
    if (lengthDiff > Math.max(openaiLength, xaiLength) * 0.3) {
      if (openaiLength > xaiLength) {
        return { resolvedValue: openaiValue, winner: 'openai', reason: `OpenAI text more complete (${openaiLength} vs ${xaiLength} chars)` };
      } else {
        return { resolvedValue: xaiValue, winner: 'xai', reason: `xAI text more complete (${xaiLength} vs ${openaiLength} chars)` };
      }
    }
    
    // Similarish length - check for key details (model numbers, specifications)
    const openaiHasModel = /[A-Z0-9]{4,}/.test(String(openaiValue));
    const xaiHasModel = /[A-Z0-9]{4,}/.test(String(xaiValue));
    
    if (xaiHasModel && !openaiHasModel) {
      return { resolvedValue: xaiValue, winner: 'xai', reason: 'xAI text includes model/part number' };
    }
    if (openaiHasModel && !xaiHasModel) {
      return { resolvedValue: openaiValue, winner: 'openai', reason: 'OpenAI text includes model/part number' };
    }
    
    // Cannot determine quality difference - both have similar completeness
    return { resolvedValue: openaiValue, winner: 'openai', reason: 'Text fields similar quality, using first available for consistency' };
  }

  // STEP 4: STYLE/PRODUCT_STYLE - Picklist validation
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
    // Neither matches well - cannot determine which is better
    return { 
      resolvedValue: openaiValue, 
      winner: 'openai', 
      reason: `Neither style matches picklist well (OpenAI: "${openaiValue}" ${(openaiMatch.similarity * 100).toFixed(0)}%, xAI: "${xaiValue}" ${(xaiMatch.similarity * 100).toFixed(0)}%), escalation recommended` 
    };
  }

  // STEP 5: INSTALLATION_TYPE - Validation against known values
  if (normalizedField === 'installation_type' || normalizedField === 'installationtype') {
    const validTypes = getValidInstallationTypes();
    const normalizedOpenai = normalizeInstallationType(openaiValue);
    const normalizedXai = normalizeInstallationType(xaiValue);
    
    const openaiValid = normalizedOpenai && validTypes.includes(normalizedOpenai);
    const xaiValid = normalizedXai && validTypes.includes(normalizedXai);
    
    // VALIDATION-FIRST: Prefer the valid one
    if (openaiValid && !xaiValid) {
      return { 
        resolvedValue: normalizedOpenai, 
        winner: 'openai', 
        reason: `OpenAI value "${normalizedOpenai}" is valid, xAI value "${xaiValue}" is not in standard list` 
      };
    }
    if (xaiValid && !openaiValid) {
      return { 
        resolvedValue: normalizedXai, 
        winner: 'xai', 
        reason: `xAI value "${normalizedXai}" is valid, OpenAI value "${openaiValue}" is not in standard list` 
      };
    }
    if (openaiValid && xaiValid) {
      // Both valid but different - this needs escalation/review
      return { 
        resolvedValue: normalizedOpenai, 
        winner: 'openai', 
        reason: `Both installation types valid but differ (OpenAI: "${normalizedOpenai}", xAI: "${normalizedXai}"), using first for consistency but review recommended` 
      };
    }
    // Neither valid - flag for review, normalize what we can
    return { 
      resolvedValue: normalizedOpenai || normalizedXai || openaiValue, 
      winner: 'openai', 
      reason: `Neither installation type in standard list (OpenAI: "${openaiValue}", xAI: "${xaiValue}"), both invalid - review required` 
    };
  }

  // STEP 6: TYPE FIELD - Semantic vs quantity terms
  if (normalizedField === 'type') {
    const quantityTerms = ['single', 'double', 'triple', 'quad', 'dual', 'multi'];
    const openaiIsQuantity = quantityTerms.some(t => String(openaiValue || '').toLowerCase().includes(t));
    const xaiIsQuantity = quantityTerms.some(t => String(xaiValue || '').toLowerCase().includes(t));
    
    // Prefer semantic type over quantity
    if (xaiIsQuantity && !openaiIsQuantity) {
      return { resolvedValue: openaiValue, winner: 'openai', reason: 'OpenAI provides semantic type, xAI provided quantity term' };
    }
    if (openaiIsQuantity && !xaiIsQuantity) {
      return { resolvedValue: xaiValue, winner: 'xai', reason: 'xAI provides semantic type, OpenAI provided quantity term' };
    }
    // Both semantic or both quantity - cannot determine quality
    return { 
      resolvedValue: openaiValue, 
      winner: 'openai', 
      reason: `Type field - both similar format (OpenAI: "${openaiValue}", xAI: "${xaiValue}"), using first for consistency` 
    };
  }

  // STEP 7: NUMERIC FIELDS - Prefer more precise value
  const numOpenai = parseFloat(String(openaiValue).replace(/[^\d.-]/g, ''));
  const numXai = parseFloat(String(xaiValue).replace(/[^\d.-]/g, ''));
  
  if (!isNaN(numOpenai) && !isNaN(numXai)) {
    // Both numeric - check precision (decimal places)
    const openaiDecimals = (String(openaiValue).split('.')[1] || '').length;
    const xaiDecimals = (String(xaiValue).split('.')[1] || '').length;
    
    // If values are very close (within 1%), they're essentially the same
    const percentDiff = Math.abs(numOpenai - numXai) / Math.max(numOpenai, numXai);
    if (percentDiff < 0.01) {
      // Prefer more precise value (more decimal places)
      if (openaiDecimals > xaiDecimals) {
        return { resolvedValue: openaiValue, winner: 'openai', reason: `Values equivalent, OpenAI more precise (${openaiValue} vs ${xaiValue})` };
      } else if (xaiDecimals > openaiDecimals) {
        return { resolvedValue: xaiValue, winner: 'xai', reason: `Values equivalent, xAI more precise (${xaiValue} vs ${openaiValue})` };
      }
      // Same precision - values are essentially identical
      return { resolvedValue: openaiValue, winner: 'openai', reason: `Numeric values equivalent (${openaiValue} ≈ ${xaiValue})` };
    }
    
    // Significant difference - cannot determine which is correct without validation
    return { 
      resolvedValue: openaiValue, 
      winner: 'openai', 
      reason: `Numeric disagreement (OpenAI: ${openaiValue}, xAI: ${xaiValue}, ${(percentDiff * 100).toFixed(1)}% diff), validation needed - using first` 
    };
  }

  // STEP 8: UNRESOLVABLE - Log detailed reason for escalation
  return { 
    resolvedValue: openaiValue, 
    winner: 'openai', 
    reason: `Unable to determine correct value (OpenAI: "${openaiValue}", xAI: "${xaiValue}"), no validation criteria available - using first for consistency, review recommended` 
  };
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
  
  // ========================================================================
  // PHASE 0: CANADIAN DATA DETECTION & CONVERSION
  // ========================================================================
  // Detect Canadian product data and convert to US market standards
  // Canadian data indicators: Web_Retailer_Key starts with "CA_"
  // Requires conversion: MSRP (CAD→USD), Weight (kg→lbs)
  // ========================================================================
  const { 
    EXCHANGE_RATES, 
    UNIT_CONVERSIONS, 
    convertCADtoUSD, 
    convertKGtoLBS, 
    checkExchangeRateStaleness 
  } = require('../config/exchange-rates');
  
  const webRetailerKey = rawProduct.Web_Retailer_Key || '';
  const isCanadianData = webRetailerKey.toUpperCase().startsWith('CA_');
  let canadianConversionApplied = false;
  let convertedMSRP = rawProduct.MSRP_Web_Retailer;
  let convertedWeight = rawProduct.Weight_Web_Retailer;
  const originalCADMSRP = isCanadianData ? rawProduct.MSRP_Web_Retailer : null;
  const originalKGWeight = isCanadianData ? rawProduct.Weight_Web_Retailer : null;
  
  if (isCanadianData) {
    // Check exchange rate staleness
    const rateStaleness = checkExchangeRateStaleness();
    if (rateStaleness.isStale) {
      logger.warn('⚠️ Exchange rate config is stale - consider updating', {
        sessionId: verificationSessionId,
        lastUpdated: rateStaleness.lastUpdated,
        daysSinceUpdate: rateStaleness.daysSinceUpdate,
        currentRate: EXCHANGE_RATES.CAD_TO_USD
      });
    }
    
    // Convert MSRP (CAD → USD)
    if (convertedMSRP && !isNaN(parseFloat(String(convertedMSRP)))) {
      const cadPrice = parseFloat(String(convertedMSRP));
      convertedMSRP = String(convertCADtoUSD(cadPrice));
      canadianConversionApplied = true;
    }
    
    // Convert Weight (kg → lbs)
    if (convertedWeight && !isNaN(parseFloat(String(convertedWeight)))) {
      const kgWeight = parseFloat(String(convertedWeight));
      convertedWeight = String(convertKGtoLBS(kgWeight));
      canadianConversionApplied = true;
    }
    
    logger.info('🇨🇦 CANADIAN DATA DETECTED - Conversions applied', {
      sessionId: verificationSessionId,
      webRetailerKey,
      conversionsApplied: canadianConversionApplied,
      msrpConversion: convertedMSRP ? `${originalCADMSRP} CAD → ${convertedMSRP} USD` : 'N/A',
      weightConversion: convertedWeight ? `${originalKGWeight} kg → ${convertedWeight} lbs` : 'N/A',
      exchangeRate: EXCHANGE_RATES.CAD_TO_USD,
      conversionFactor: UNIT_CONVERSIONS.KG_TO_LBS
    });
    
    // Update raw product data with converted values
    // Ferguson data is always US market, so only convert Web Retailer fields
    rawProduct.MSRP_Web_Retailer = convertedMSRP;
    rawProduct.Weight_Web_Retailer = convertedWeight;
  }
  
  // ========================================================================
  // PHASE 0.1A: UNIVERSAL RAW DATA EXTRACTION
  // ========================================================================
  // When Salesforce sends Ferguson_Raw_Data (the full nested API response),
  // flat fields like Ferguson_Title, Ferguson_Width etc. may be EMPTY.
  // This phase extracts nested data into flat fields so ALL downstream code
  // (AI prompt builder, dimension extraction, post-processing) gets full data.
  // Only populates fields that are currently empty — never overwrites existing values.
  // ========================================================================
  const frd = (rawProduct as any).Ferguson_Raw_Data;
  if (frd?.product) {
    const p = frd.product;
    const specs = p.specifications || {};
    const featureGroups: any[] = p.feature_groups || [];
    
    // Helper: find a specification value from feature_groups by name
    const findFeatureValue = (name: string): string => {
      for (const group of featureGroups) {
        for (const feat of (group.features || [])) {
          if (feat.name?.toLowerCase() === name.toLowerCase()) {
            return feat.value || '';
          }
        }
      }
      return '';
    };
    
    // Helper: find matched variant for this specific model number
    const matchedVariant = (p.variants || []).find(
      (v: any) => v.model_number === (frd.model_number || rawProduct.SF_Catalog_Name)
    );
    
    let extractedCount = 0;
    
    // --- Core identification ---
    if (!rawProduct.Ferguson_Title && p.name) {
      rawProduct.Ferguson_Title = p.name;
      extractedCount++;
    }
    if (!rawProduct.Ferguson_Brand && p.brand) {
      rawProduct.Ferguson_Brand = p.brand;
      extractedCount++;
    }
    if (!rawProduct.Ferguson_Model_Number && (p.model_number || frd.model_number)) {
      rawProduct.Ferguson_Model_Number = p.model_number || frd.model_number;
      extractedCount++;
    }
    if (!rawProduct.Ferguson_URL && (p.url || frd.variant_url)) {
      rawProduct.Ferguson_URL = frd.variant_url || p.url;
      extractedCount++;
    }
    if (!rawProduct.Ferguson_Description && p.description) {
      rawProduct.Ferguson_Description = p.description;
      extractedCount++;
    }
    
    // --- Pricing ---
    if (!rawProduct.Ferguson_Price && p.price != null) {
      rawProduct.Ferguson_Price = String(p.price);
      extractedCount++;
    }
    if (!rawProduct.Ferguson_Min_Price && p.price_min != null) {
      rawProduct.Ferguson_Min_Price = String(p.price_min);
      extractedCount++;
    }
    if (!rawProduct.Ferguson_Max_Price && p.price_max != null) {
      rawProduct.Ferguson_Max_Price = String(p.price_max);
      extractedCount++;
    }
    
    // --- Classification ---
    if (!rawProduct.Ferguson_Base_Type && p.base_type) {
      rawProduct.Ferguson_Base_Type = p.base_type;
      extractedCount++;
    }
    if (!rawProduct.Ferguson_Product_Type && p.product_type) {
      rawProduct.Ferguson_Product_Type = p.product_type;
      extractedCount++;
    }
    if (!rawProduct.Ferguson_Base_Category && p.base_category) {
      rawProduct.Ferguson_Base_Category = p.base_category;
      extractedCount++;
    }
    if (!rawProduct.Ferguson_Business_Category && p.business_category) {
      rawProduct.Ferguson_Business_Category = p.business_category;
      extractedCount++;
    }
    
    // --- Dimensions from specifications ---
    // Width: check specs for "width" first, then "extension" (common for shower arms, faucets)
    if (!rawProduct.Ferguson_Width) {
      const widthVal = specs.width?.value || specs.extension?.value || findFeatureValue('Width') || findFeatureValue('Extension');
      if (widthVal) {
        rawProduct.Ferguson_Width = widthVal;
        extractedCount++;
      }
    }
    if (!rawProduct.Ferguson_Height) {
      const heightVal = specs.height?.value || findFeatureValue('Height');
      if (heightVal) {
        rawProduct.Ferguson_Height = heightVal;
        extractedCount++;
      }
    }
    if (!rawProduct.Ferguson_Depth) {
      const depthVal = specs.depth?.value || specs.length?.value || findFeatureValue('Depth') || findFeatureValue('Length');
      if (depthVal) {
        rawProduct.Ferguson_Depth = depthVal;
        extractedCount++;
      }
    }
    if (!rawProduct.Ferguson_Diameter) {
      const diameterVal = specs.diameter?.value || findFeatureValue('Diameter');
      if (diameterVal) {
        rawProduct.Ferguson_Diameter = diameterVal;
        extractedCount++;
      }
    }
    
    // --- Appearance: extract from matched variant ---
    if (!rawProduct.Ferguson_Finish && matchedVariant?.name) {
      rawProduct.Ferguson_Finish = matchedVariant.name; // e.g. "Brushed Brass PVD"
      extractedCount++;
    }
    if (!rawProduct.Ferguson_Color && matchedVariant?.color) {
      rawProduct.Ferguson_Color = matchedVariant.color; // Hex code e.g. "E1C16E"
      extractedCount++;
    }
    
    // --- Categories ---
    if (!rawProduct.Ferguson_Categories && p.categories?.length) {
      rawProduct.Ferguson_Categories = p.categories.map((c: any) => c.name).join('\n');
      extractedCount++;
    }
    if (!rawProduct.Ferguson_Related_Categories && p.related_categories?.length) {
      rawProduct.Ferguson_Related_Categories = p.related_categories.map((c: any) => c.name).join('\n');
      extractedCount++;
    }
    
    // --- Warranty, Collection, Certifications ---
    if (!rawProduct.Ferguson_Manufacturer_Warranty) {
      const warrantyVal = specs.manufacturer_warranty?.value || p.manufacturer_warranty || findFeatureValue('Manufacturer Warranty');
      if (warrantyVal) {
        rawProduct.Ferguson_Manufacturer_Warranty = warrantyVal;
        extractedCount++;
      }
    }
    if (!rawProduct.Ferguson_Collection) {
      const collectionVal = specs.collection?.value || p.collection?.name || findFeatureValue('Collection');
      if (collectionVal) {
        rawProduct.Ferguson_Collection = collectionVal;
        extractedCount++;
      }
    }
    if (!rawProduct.Ferguson_Certifications && p.certifications?.length) {
      rawProduct.Ferguson_Certifications = p.certifications.join(', ');
      extractedCount++;
    }
    
    // --- Ferguson_Attributes: extract from specifications + feature_groups ---
    if (!rawProduct.Ferguson_Attributes || rawProduct.Ferguson_Attributes.length === 0) {
      const extractedAttrs: { name: string; value: string }[] = [];
      // From specifications object
      for (const [key, spec] of Object.entries(specs)) {
        if (spec && typeof spec === 'object' && (spec as any).value != null) {
          const units = (spec as any).units ? ` ${(spec as any).units}` : '';
          extractedAttrs.push({
            name: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            value: `${(spec as any).value}${units}`.trim()
          });
        }
      }
      if (extractedAttrs.length > 0) {
        rawProduct.Ferguson_Attributes = extractedAttrs;
        extractedCount++;
      }
    }
    
    if (extractedCount > 0) {
      logger.info(`✅ PHASE 0.1A: Extracted ${extractedCount} Ferguson fields from Ferguson_Raw_Data`, {
        sessionId: verificationSessionId,
        modelNumber: rawProduct.SF_Catalog_Name || rawProduct.Model_Number_Web_Retailer,
        extractedFields: extractedCount,
        fergusonTitle: rawProduct.Ferguson_Title?.substring(0, 60) || '(empty)',
        fergusonWidth: rawProduct.Ferguson_Width || '(empty)',
        fergusonHeight: rawProduct.Ferguson_Height || '(empty)',
        fergusonPrice: rawProduct.Ferguson_Price || '(empty)',
        fergusonBrand: rawProduct.Ferguson_Brand || '(empty)',
        fergusonAttributeCount: rawProduct.Ferguson_Attributes?.length || 0
      });
    }
  }
  
  // ========================================================================
  // PHASE 0.2: FERGUSON PRIORITY VALIDATION
  // ========================================================================
  // Ferguson data is ALWAYS US market (USD, lbs) - most reliable source
  // If both Ferguson + Web Retailer exist, validate and prioritize Ferguson
  // If large discrepancy after Canadian conversion, flag for review
  // ========================================================================
  const fergusonMSRP = rawProduct.Ferguson_Price;
  // Extract Ferguson weight from attributes (not a dedicated field)
  const fergusonWeightAttr = rawProduct.Ferguson_Attributes?.find(attr => 
    attr.name?.toLowerCase().includes('weight') || attr.name?.toLowerCase().includes('shipping weight')
  );
  const fergusonWeight = fergusonWeightAttr?.value || null;
  
  if (isCanadianData && canadianConversionApplied) {
    // Validate converted Web Retailer values against Ferguson (if exists)
    if (fergusonMSRP && convertedMSRP) {
      const fergusonPrice = parseFloat(String(fergusonMSRP));
      const convertedPrice = parseFloat(String(convertedMSRP));
      
      if (!isNaN(fergusonPrice) && !isNaN(convertedPrice) && fergusonPrice > 0) {
        const priceDiff = Math.abs(fergusonPrice - convertedPrice);
        const percentDiff = (priceDiff / fergusonPrice) * 100;
        
        if (percentDiff > 30) {
          logger.warn('⚠️ Large MSRP difference after Canadian conversion - Claude will review', {
            sessionId: verificationSessionId,
            fergusonMSRP: `$${fergusonPrice} USD`,
            convertedWebRetailerMSRP: `$${convertedPrice} USD`,
            originalCADMSRP: `$${originalCADMSRP} CAD`,
            percentDifference: `${percentDiff.toFixed(1)}%`,
            explanation: 'May indicate data quality issue or incorrect exchange rate - flagged for Claude validation'
          });
        }
        
        // PRIORITY: Always use Ferguson (most reliable, always US market)
        logger.info('✅ Using Ferguson MSRP as primary (most reliable)', {
          sessionId: verificationSessionId,
          fergusonMSRP: `$${fergusonPrice} USD`,
          webRetailerConverted: `$${convertedPrice} USD`,
          source: 'Ferguson prioritized'
        });
      }
    }
    
    if (fergusonWeight && convertedWeight) {
      const fergusonLbs = parseFloat(String(fergusonWeight));
      const convertedLbs = parseFloat(String(convertedWeight));
      
      if (!isNaN(fergusonLbs) && !isNaN(convertedLbs) && fergusonLbs > 0) {
        const weightDiff = Math.abs(fergusonLbs - convertedLbs);
        const percentDiff = (weightDiff / fergusonLbs) * 100;
        
        if (percentDiff > 30) {
          logger.warn('⚠️ Large weight difference after Canadian conversion - Claude will review', {
            sessionId: verificationSessionId,
            fergusonWeight: `${fergusonLbs} lbs`,
            convertedWebRetailerWeight: `${convertedLbs} lbs`,
            originalKGWeight: `${originalKGWeight} kg`,
            percentDifference: `${percentDiff.toFixed(1)}%`,
            explanation: 'May indicate data quality issue or incorrect conversion factor - flagged for Claude validation'
          });
        }
        
        // PRIORITY: Always use Ferguson (most reliable, always US market)
        logger.info('✅ Using Ferguson Weight as primary (most reliable)', {
          sessionId: verificationSessionId,
          fergusonWeight: `${fergusonLbs} lbs`,
          webRetailerConverted: `${convertedLbs} lbs`,
          source: 'Ferguson prioritized'
        });
      }
    }
  } else if (fergusonMSRP && rawProduct.MSRP_Web_Retailer) {
    // Non-Canadian data: Still validate Ferguson vs Web Retailer for quality check
    const fergusonPrice = parseFloat(String(fergusonMSRP));
    const webRetailerPrice = parseFloat(String(rawProduct.MSRP_Web_Retailer));
    
    if (!isNaN(fergusonPrice) && !isNaN(webRetailerPrice) && fergusonPrice > 0) {
      const priceDiff = Math.abs(fergusonPrice - webRetailerPrice);
      const percentDiff = (priceDiff / fergusonPrice) * 100;
      
      if (percentDiff > 30) {
        logger.warn('⚠️ Large MSRP difference between sources (US data)', {
          sessionId: verificationSessionId,
          fergusonMSRP: `$${fergusonPrice} USD`,
          webRetailerMSRP: `$${webRetailerPrice} USD`,
          percentDifference: `${percentDiff.toFixed(1)}%`,
          explanation: 'May indicate pricing update, clearance, or data quality issue'
        });
      }
    }
  }
  
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
      } : undefined,
      // Pass Canadian data context if applicable
      canadianDataContext: canadianConversionApplied ? {
        isCanadianData,
        webRetailerKey,
        msrpConversion: convertedMSRP && originalCADMSRP ? `$${originalCADMSRP} CAD → $${convertedMSRP} USD` : undefined,
        weightConversion: convertedWeight && originalKGWeight ? `${originalKGWeight} kg → ${convertedWeight} lbs` : undefined,
        exchangeRate: EXCHANGE_RATES.CAD_TO_USD,
        conversionFactor: UNIT_CONVERSIONS.KG_TO_LBS
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
    // 🔍 STAGE 2: CATEGORY DETERMINATION (UNBIASED — AI DECIDES FROM RAW DATA)
    // ===============================================
    // Both AI models receive the complete raw product payload (including Category_Legacy,
    // Web_Retailer_Category, Ferguson fields, title, description, specs, URLs, etc.) and
    // make an INDEPENDENT determination.  No single input field is treated as authoritative —
    // the two AIs agree on a category via consensus; if they disagree the title tiebreaker
    // resolves it.  We log the available signals for observability but do NOT pick a winner
    // to anchor the AI against.
    const legacyCategory      = (rawProduct as any).Category_Legacy?.trim()  || null;
    const webRetailerCategory  = rawProduct.Web_Retailer_Category?.trim()     || null;
    // Ferguson's own catalog category fields: most reliable for plumbing/lighting/hardware
    const fergusonCategory     = rawProduct.Ferguson_Base_Category?.trim()
                               || rawProduct.Ferguson_Product_Type?.trim()
                               || null;
    // PATH B: Appliances use SF-anchored category (restore 926ad6b behavior);
    // Non-appliances use unbiased AI determination.
    const isAppliancesDepartment = determinedDepartment === 'Appliances';
    const salesforceCategory: string | null = isAppliancesDepartment
      ? (rawProduct.Web_Retailer_Category?.trim() || null)
      : null;

    logger.info(`🔍 STAGE 2 (Hierarchical): ${isAppliancesDepartment ? 'SF-anchored category validation (Appliances)' : 'AI determining category from raw data (unbiased)'}`, {
      sessionId: verificationSessionId,
      department: determinedDepartment,
      salesforceCategory: salesforceCategory || '(none — AI decides)',
      availableSignals: {
        Category_Legacy:       legacyCategory      || '(none)',
        Web_Retailer_Category: webRetailerCategory || '(none)',
        Ferguson_Category:     fergusonCategory    || '(none)',
      },
      mode: isAppliancesDepartment ? 'SF-anchored (926ad6b restore)' : 'unbiased',
      note: isAppliancesDepartment
        ? 'Appliances: SF Web_Retailer_Category used as anchor; AI validates independently'
        : 'Non-appliances: AI consensus decides; department-aware signal used as last-resort tiebreaker',
      productId: rawProduct.SF_Catalog_Id
    });
    
    // Declare variables that will be used later (scoped at this level)
    let determinedCategory: string = undefined as unknown as string;
    const stage2StartTime = Date.now();
    let openaiCategoryResult: AIAnalysisResult;
    let xaiCategoryResult: AIAnalysisResult;
    let categoryConsensus: any = null;
    
    if (salesforceCategory) {
      // 🔧 FINDING #020: AI must INDEPENDENTLY verify SF's category, override when both AIs disagree
      // Previously we blindly trusted SF - this caused Icemakers to be misclassified as Freezers
      
      logger.info('🔍 Stage 2: AI independently verifying Salesforce category', {
        sessionId: verificationSessionId,
        salesforceCategory: salesforceCategory,
        source: 'Salesforce (Web_Retailer_Category)',
        note: 'AI will independently determine category and compare'
      });
      
      // Run AI analysis - AI will independently determine category (not just validate SF)
      [openaiCategoryResult, xaiCategoryResult] = await Promise.all([
        analyzeWithOpenAI(processedProduct, verificationSessionId, promptOptions, trackingId, { 
          stage: 'category-only', 
          department: determinedDepartment,
          salesforceCategory: salesforceCategory,  // Context only - AI makes independent decision
          useFullPrompt: isAppliancesDepartment     // PATH B: Appliances get full prompt (926ad6b)
        }),
        analyzeWithXAI(processedProduct, verificationSessionId, promptOptions, trackingId, { 
          stage: 'category-only', 
          department: determinedDepartment,
          salesforceCategory: salesforceCategory,  // Context only - AI makes independent decision
          useFullPrompt: isAppliancesDepartment     // PATH B: Appliances get full prompt (926ad6b)
        })
      ]);
      
      // Get AI determinations
      const openaiCategory = openaiCategoryResult.determinedCategory;
      const xaiCategory = xaiCategoryResult.determinedCategory;
      
      // Normalize categories for comparison (handle aliases like "FREEZERS" vs "Freezer")
      const normalizeCategory = (cat: string | undefined): string => {
        if (!cat) return '';
        // Import CATEGORY_NAME_ALIASES not available here, so do basic normalization
        const normalized = cat.trim().toUpperCase();
        // Simple alias map for common cases
        const aliasMap: Record<string, string> = {
          'FREEZERS': 'FREEZER',
          'ICEMAKERS': 'ICEMAKER',
          'ICE MAKER': 'ICEMAKER',
          'ICE MACHINE': 'ICEMAKER',
          'NUGGET ICE MACHINE': 'ICEMAKER',
          'REFRIGERATORS': 'REFRIGERATOR',
          'DISHWASHERS': 'DISHWASHER',
          'OVENS': 'OVEN',
          'RANGES': 'RANGE',
          'COOKTOPS': 'COOKTOP',
          // Drawer variants - AIs sometimes say "Warming Drawer" instead of the valid category "Drawer"
          'WARMING DRAWER': 'DRAWER',
          'WARMING DRAWERS': 'DRAWER',
        };
        return aliasMap[normalized] || normalized;
      };
      
      const sfNormalized = normalizeCategory(salesforceCategory);
      const openaiNormalized = normalizeCategory(openaiCategory);
      const xaiNormalized = normalizeCategory(xaiCategory);
      
      // Check if both AIs agree with each other AND disagree with SF
      const aisAgreeWithEachOther = openaiNormalized === xaiNormalized && openaiNormalized !== '';
      const aiMatchesSf = openaiNormalized === sfNormalized || xaiNormalized === sfNormalized;
      const bothAisDisagreeWithSf = aisAgreeWithEachOther && !aiMatchesSf;
      
      if (bothAisDisagreeWithSf) {
        // 🚨 CRITICAL: Both AIs independently determined a DIFFERENT category than SF
        // This is a strong signal SF's category is wrong - OVERRIDE
        // Prefer whichever AI gave the canonical valid category name (e.g. xAI says "Drawer",
        // OpenAI says "Warming Drawer" — prefer "Drawer" since it exists in the picklist)
        const _allCatsForOverride = getAllCategories();
        const aiDeterminedCategory = (xaiCategory && _allCatsForOverride.includes(xaiCategory))
          ? xaiCategory
          : (openaiCategory && _allCatsForOverride.includes(openaiCategory))
            ? openaiCategory
            : openaiCategory || xaiCategory;
        
        logger.error('🚨 FINDING #020: OVERRIDING Salesforce category - both AIs independently disagree', {
          sessionId: verificationSessionId,
          salesforceCategory: salesforceCategory,
          aiDeterminedCategory: aiDeterminedCategory,
          openaiCategory: openaiCategory,
          xaiCategory: xaiCategory,
          reason: 'Both AIs analyzed product data and independently determined a different category',
          action: 'Using AI-determined category instead of Salesforce',
          productId: rawProduct.SF_Catalog_Id
        });
        
        // Use AI's category, not SF's
        determinedCategory = aiDeterminedCategory!;
        
        categoryConsensus = { 
          agreed: true, 
          agreedCategory: determinedCategory, 
          agreementReason: `AI OVERRIDE: Both AIs determined "${aiDeterminedCategory}" (SF had "${salesforceCategory}")` 
        };
      } else if (aiMatchesSf) {
        // At least one AI agrees with SF - use SF's category
        determinedCategory = salesforceCategory;
        
        logger.info('✅ Salesforce category validated by AI', {
          sessionId: verificationSessionId,
          category: determinedCategory,
          source: 'Salesforce (validated by AI)',
          openaiCategory: openaiCategory,
          xaiCategory: xaiCategory
        });
        
        categoryConsensus = { 
          agreed: true, 
          agreedCategory: determinedCategory, 
          agreementReason: 'Salesforce category validated by AI consensus' 
        };
      } else {
        // AIs don't agree with each other
        // 🎯 Title-based tiebreaker for non-appliance categories (before SF fallback)
        let titleTiebreakUsed = false;
        if (!isAppliancesCategory(openaiCategory) && !isAppliancesCategory(xaiCategory)) {
          const titleForTiebreak = rawProduct.Ferguson_Title || rawProduct.Product_Title_Web_Retailer || '';
          const tiebreak = resolveCategoryDisagreementByTitle(titleForTiebreak, openaiCategory || '', xaiCategory || '');
          if (tiebreak) {
            determinedCategory = tiebreak.winner;
            titleTiebreakUsed = true;
            logger.info('🎯 Title tiebreaker resolved AI disagreement (SF path)', {
              sessionId: verificationSessionId,
              winner: tiebreak.winner,
              loser: tiebreak.loser,
              matchedKeywords: tiebreak.matchedKeywords,
              salesforceCategory: salesforceCategory,
              openaiCategory: openaiCategory,
              xaiCategory: xaiCategory,
              titleUsed: titleForTiebreak.substring(0, 80),
              productId: rawProduct.SF_Catalog_Id
            });
            categoryConsensus = {
              agreed: false,
              agreedCategory: determinedCategory,
              agreementReason: `Title tiebreaker: "${tiebreak.matchedKeywords.join(', ')}" matched ${tiebreak.winner} (SF had ${salesforceCategory})`
            };
          }
        }
        if (!titleTiebreakUsed) {
          // Fallback: use SF as tiebreaker (existing behavior)
          determinedCategory = salesforceCategory;
          
          logger.warn('⚠️ AIs disagree with each other - using Salesforce as tiebreaker', {
            sessionId: verificationSessionId,
            salesforceCategory: salesforceCategory,
            openaiCategory: openaiCategory,
            xaiCategory: xaiCategory,
            decision: 'Using Salesforce category since AIs cannot reach consensus'
          });
          
          categoryConsensus = { 
            agreed: false, 
            agreedCategory: determinedCategory, 
            agreementReason: 'AIs disagreed - Salesforce used as tiebreaker' 
          };
        }
      }
      
      logger.info('✅ STAGE 2 complete - Category determined', {
        sessionId: verificationSessionId,
        department: determinedDepartment,
        finalCategory: determinedCategory,
        source: bothAisDisagreeWithSf ? 'AI (override)' : 'Salesforce',
        wasOverridden: bothAisDisagreeWithSf,
        openaiCategory: openaiCategory,
        xaiCategory: xaiCategory,
        durationMs: Date.now() - stage2StartTime
      });
    } else {
      // Primary path: AI determines category from raw product data without any pre-selected anchor.
      // Available signals (Category_Legacy, Web_Retailer_Category, Ferguson fields, titles, etc.)
      // are all present in the raw product payload the AI receives — they are treated as evidence,
      // not as authoritative sources.
      logger.info('🔍 Stage 2: AI determining category from all available raw data (no anchor)', {
        sessionId: verificationSessionId,
        department: determinedDepartment,
        availableSignals: {
          Category_Legacy:       legacyCategory      || '(none)',
          Web_Retailer_Category: webRetailerCategory || '(none)',
          Ferguson_Category:     fergusonCategory    || '(none)',
        },
        productId: rawProduct.SF_Catalog_Id
      });
      
      [openaiCategoryResult, xaiCategoryResult] = await Promise.all([
        analyzeWithOpenAI(processedProduct, verificationSessionId, promptOptions, trackingId, { 
          stage: 'category-only', 
          department: determinedDepartment
        }),
        analyzeWithXAI(processedProduct, verificationSessionId, promptOptions, trackingId, { 
          stage: 'category-only', 
          department: determinedDepartment
        })
      ]);
      
      logger.info('✅ STAGE 2 complete - Category determined by AI', {
        sessionId: verificationSessionId,
        department: determinedDepartment,
        openaiCategory: openaiCategoryResult.determinedCategory,
        xaiCategory: xaiCategoryResult.determinedCategory,
        openaiConfidence: openaiCategoryResult.categoryConfidence,
        xaiConfidence: xaiCategoryResult.categoryConfidence,
        durationMs: Date.now() - stage2StartTime
      });
      
      // Build consensus on category only
      categoryConsensus = buildConsensus(openaiCategoryResult, xaiCategoryResult);
      determinedCategory = categoryConsensus.agreedCategory || openaiCategoryResult.determinedCategory || xaiCategoryResult.determinedCategory;
      
      if (!determinedCategory) {
        logger.error('❌ STAGE 2 FAILED: No category could be determined', {
          sessionId: verificationSessionId,
          department: determinedDepartment,
          openaiError: openaiCategoryResult.error,
          xaiError: xaiCategoryResult.error
        });
        throw new Error('Category determination failed - both AIs returned no category');
      }
      
      // 🎯 Tiebreaker cascade when AIs originally disagree:
      //   Step 1 — Title keyword match (non-appliances only)
      //   Step 2 — Department-aware raw signal:
      //              Appliances    → Web_Retailer_Category (major appliance retailer data is reliable)
      //              Non-Appliances → Ferguson_Category   (Ferguson catalog is authoritative for plumbing/lighting/hardware)
      const aisOriginallyDisagreed = !areCategoriesEquivalent(
        openaiCategoryResult.determinedCategory, xaiCategoryResult.determinedCategory
      );
      let tiebreakApplied = false;

      // Step 1: Title tiebreaker (non-appliances only)
      if (aisOriginallyDisagreed && determinedCategory && !isAppliancesCategory(determinedCategory)) {
        const titleForTiebreak = rawProduct.Ferguson_Title || rawProduct.Product_Title_Web_Retailer || '';
        const tiebreak = resolveCategoryDisagreementByTitle(
          titleForTiebreak,
          openaiCategoryResult.determinedCategory,
          xaiCategoryResult.determinedCategory
        );
        if (tiebreak) {
          logger.info('🎯 Step 1 tiebreaker (title keywords) resolved AI disagreement', {
            sessionId: verificationSessionId,
            winner: tiebreak.winner,
            loser: tiebreak.loser,
            matchedKeywords: tiebreak.matchedKeywords,
            previousPick: determinedCategory,
            openaiCategory: openaiCategoryResult.determinedCategory,
            xaiCategory: xaiCategoryResult.determinedCategory,
            titleUsed: titleForTiebreak.substring(0, 80),
            productId: rawProduct.SF_Catalog_Id
          });
          determinedCategory = tiebreak.winner;
          tiebreakApplied = true;
          Object.assign(categoryConsensus, { 
            agreedCategory: determinedCategory,
            agreementReason: `Title tiebreaker: "${tiebreak.matchedKeywords.join(', ')}" matched ${tiebreak.winner}`
          });
        }
      }

      // Step 2: Department-aware raw signal tiebreaker
      if (aisOriginallyDisagreed && !tiebreakApplied) {
        const isAppliancesDept = determinedDepartment === 'Appliances';
        const signalValue      = isAppliancesDept ? webRetailerCategory : fergusonCategory;
        const signalSource     = isAppliancesDept ? 'Web_Retailer_Category' : 'Ferguson_Category';

        if (signalValue) {
          const normalizedSignal = normalizeCategoryName(signalValue);
          const allCats = getAllCategories();
          const signalIsKnown = allCats.some(
            c => normalizeCategoryName(c).toLowerCase() === normalizedSignal.toLowerCase()
          );
          if (signalIsKnown) {
            const openaiMatch = areCategoriesEquivalent(openaiCategoryResult.determinedCategory, normalizedSignal);
            const xaiMatch    = areCategoriesEquivalent(xaiCategoryResult.determinedCategory,   normalizedSignal);
            if (openaiMatch || xaiMatch) {
              const previousPick = determinedCategory;
              determinedCategory = normalizedSignal;
              tiebreakApplied    = true;
              logger.info('🎯 Step 2 tiebreaker (department-aware signal) resolved AI disagreement', {
                sessionId: verificationSessionId,
                signalSource,
                signalValue,
                normalizedSignal,
                department: determinedDepartment,
                previousPick,
                winner: determinedCategory,
                openaiCategory: openaiCategoryResult.determinedCategory,
                xaiCategory: xaiCategoryResult.determinedCategory,
                productId: rawProduct.SF_Catalog_Id
              });
              Object.assign(categoryConsensus, {
                agreed: false,
                agreedCategory: determinedCategory,
                agreementReason: `${signalSource} signal confirmed one AI's pick (${determinedCategory})`
              });
            }
          }
        }
      }

      logger.info('🎯 Category consensus reached (AI-determined)', {
        sessionId: verificationSessionId,
        department: determinedDepartment,
        agreedCategory: determinedCategory,
        aisAgreed: !aisOriginallyDisagreed,
        tiebreakApplied,
        source: 'AI Consensus (unbiased)',
        categoryConfidence: Math.max(openaiCategoryResult.categoryConfidence, xaiCategoryResult.categoryConfidence),
        signalComparison: {
          aiDetermined:          determinedCategory,
          Category_Legacy:       legacyCategory      || '(none)',
          Web_Retailer_Category: webRetailerCategory || '(none)',
          Ferguson_Category:     fergusonCategory    || '(none)',
          matchesLegacy:         legacyCategory      ? determinedCategory.toLowerCase() === legacyCategory.toLowerCase()      : null,
          matchesWebRetailer:    webRetailerCategory ? determinedCategory.toLowerCase() === webRetailerCategory.toLowerCase() : null,
          matchesFerguson:       fergusonCategory    ? determinedCategory.toLowerCase() === fergusonCategory.toLowerCase()    : null,
        }
      });
    }
    
    // ===============================================
    // ✅ PHASE 2 VALIDATION: CATEGORY VALIDATION
    // ===============================================
    let validCategoriesForDept = getCategoriesForDepartment(determinedDepartment);
    const allValidCategories = getAllCategories();
    
    // 🔧 CRITICAL: Apply category name normalization BEFORE validation
    // This resolves aliases (e.g., "Shower Accessories" → "Showerheads & Accessories")
    const normalizedCategory = normalizeCategoryName(determinedCategory);
    if (normalizedCategory !== determinedCategory) {
      logger.info('✅ Category alias resolved', {
        sessionId: verificationSessionId,
        originalCategory: determinedCategory,
        normalizedCategory: normalizedCategory
      });
      determinedCategory = normalizedCategory;
      Object.assign(categoryConsensus, { agreedCategory: determinedCategory });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // DEPARTMENT-AWARE CATEGORY CORRECTION: "Mirror" → "Bathroom Mirror"
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // "Mirror" = Home Décor category (decorative, accent, floor mirrors)
    // "Bathroom Mirror" = Plumbing & Bath category (vanity/LED/wall mirrors in bathrooms)
    // When the validated department is Plumbing & Bath but the AI picked generic "Mirror",
    // correct to "Bathroom Mirror" since that's the Plumbing category for mirrors.
    if (determinedCategory === 'Mirror' && determinedDepartment === 'Plumbing & Bath') {
      logger.warn('🪞 CATEGORY CORRECTION: "Mirror" → "Bathroom Mirror" (department is Plumbing & Bath)', {
        sessionId: verificationSessionId,
        originalCategory: determinedCategory,
        correctedCategory: 'Bathroom Mirror',
        department: determinedDepartment,
        reason: 'Generic "Mirror" belongs to Home Décor; Plumbing & Bath mirror category is "Bathroom Mirror"'
      });
      determinedCategory = 'Bathroom Mirror';
      Object.assign(categoryConsensus, { agreedCategory: determinedCategory });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SOURCE-SIGNAL OVERRIDE: "Mirror" (Home Décor) → "Bathroom Mirror"
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // When AI picks generic "Mirror" under Home Décor but source signals
    // (Legacy category, Web Retailer category, or product titles) indicate
    // a bathroom/plumbing product, override to "Bathroom Mirror".
    // This catches cases where both AIs agree on "Mirror" but all source
    // data says "Bathroom Mirror", "BATHROOM FURNITURE", "Medicine Cabinet", etc.
    if (determinedCategory === 'Mirror' && determinedDepartment !== 'Plumbing & Bath') {
      const legacyCat = ((rawProduct as any).Category_Legacy || '').toLowerCase();
      const wrCat = (rawProduct.Web_Retailer_Category || '').toLowerCase();
      const wrSubCat = (rawProduct.Web_Retailer_SubCategory || '').toLowerCase();
      const bathroomSignals = /\b(?:bathroom|bath\b|vanity|medicine\s*cabinet|lighted\s*mirror|led\s*mirror|lavatory)\b/i;
      const hasBathroomSignal = bathroomSignals.test(legacyCat)
        || bathroomSignals.test(wrCat)
        || bathroomSignals.test(wrSubCat);

      if (hasBathroomSignal) {
        logger.warn('🪞 SOURCE-SIGNAL OVERRIDE: "Mirror" → "Bathroom Mirror" (source data indicates bathroom product)', {
          sessionId: verificationSessionId,
          originalCategory: determinedCategory,
          originalDepartment: determinedDepartment,
          correctedCategory: 'Bathroom Mirror',
          correctedDepartment: 'Plumbing & Bath',
          signals: { legacyCat, wrCat, wrSubCat },
          reason: 'Source signals indicate bathroom/plumbing product — overriding to Bathroom Mirror'
        });
        determinedCategory = 'Bathroom Mirror';
        determinedDepartment = 'Plumbing & Bath';
        validCategoriesForDept = getCategoriesForDepartment('Plumbing & Bath');
        Object.assign(categoryConsensus, { agreedCategory: 'Bathroom Mirror', agreementReason: 'Source-signal override: source data says bathroom product' });
        Object.assign(departmentConsensus, { agreedDepartment: 'Plumbing & Bath' });
      }
    }

    // If category is valid but in a different department, auto-correct department
    const categoryDepartment = getDepartmentForCategory(determinedCategory);
    if (categoryDepartment && categoryDepartment !== determinedDepartment) {
      logger.warn('⚠️ Category belongs to different department - auto-correcting department', {
        sessionId: verificationSessionId,
        category: determinedCategory,
        originalDepartment: determinedDepartment,
        correctedDepartment: categoryDepartment
      });

      determinedDepartment = categoryDepartment;
      Object.assign(departmentConsensus, { agreedDepartment: determinedDepartment });
      validCategoriesForDept = getCategoriesForDepartment(determinedDepartment);
    }
    
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
        let retryDeterminedCategory = retryCategoryConsensus.agreedCategory || retryOpenaiResult.determinedCategory || retryXaiResult.determinedCategory;
        
        // 🔧 CRITICAL: Apply category name normalization BEFORE retry validation
        const normalizedRetryCategory = normalizeCategoryName(retryDeterminedCategory);
        if (normalizedRetryCategory !== retryDeterminedCategory) {
          logger.info('✅ Retry category alias resolved', {
            sessionId: verificationSessionId,
            originalRetryCategory: retryDeterminedCategory,
            normalizedRetryCategory: normalizedRetryCategory
          });
          retryDeterminedCategory = normalizedRetryCategory;
        }
        
        // Validate retry result
        const retryCategoryDepartment = retryDeterminedCategory ? getDepartmentForCategory(retryDeterminedCategory) : undefined;
        if (retryCategoryDepartment && retryCategoryDepartment !== determinedDepartment) {
          logger.warn('⚠️ Retry category belongs to different department - auto-correcting department', {
            sessionId: verificationSessionId,
            retryCategory: retryDeterminedCategory,
            originalDepartment: determinedDepartment,
            correctedDepartment: retryCategoryDepartment
          });

          determinedDepartment = retryCategoryDepartment;
          Object.assign(departmentConsensus, { agreedDepartment: determinedDepartment });
          validCategoriesForDept = getCategoriesForDepartment(determinedDepartment);
        }

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
            // Final fallback: use a valid category from trusted source category fields
            const sourceCategoryCandidates = [
              rawProduct.Web_Retailer_Category,
              rawProduct.Web_Retailer_SubCategory,
              rawProduct.Ferguson_Base_Category,
              rawProduct.Ferguson_Product_Type,
              (rawProduct as any).Category_Legacy
            ].filter((value): value is string => !!value && value.trim().length > 0);

            let sourceFallbackCategory: string | null = null;
            for (const candidate of sourceCategoryCandidates) {
              const normalizedCandidate = normalizeCategoryName(candidate);
              if (allValidCategories.includes(normalizedCandidate)) {
                sourceFallbackCategory = normalizedCandidate;
                break;
              }
            }

            if (sourceFallbackCategory) {
              const sourceCategoryDepartment = getDepartmentForCategory(sourceFallbackCategory);
              if (sourceCategoryDepartment && sourceCategoryDepartment !== determinedDepartment) {
                determinedDepartment = sourceCategoryDepartment;
                Object.assign(departmentConsensus, { agreedDepartment: determinedDepartment });
                validCategoriesForDept = getCategoriesForDepartment(determinedDepartment);
              }

              logger.warn('⚠️ Using source category fallback after retry failure', {
                sessionId: verificationSessionId,
                fallbackCategory: sourceFallbackCategory,
                fallbackDepartment: determinedDepartment,
                sourceCandidates: sourceCategoryCandidates
              });

              determinedCategory = sourceFallbackCategory;
              Object.assign(categoryConsensus, { agreedCategory: determinedCategory });
            } else {
            // Complete failure - throw error
            throw new Error(`Category validation failed after retry: "${determinedCategory}" → "${retryDeterminedCategory}" - neither valid for department "${determinedDepartment}"`);
            }
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
    // 🪞 LIGHTED MIRROR CORRECTION (POST-STAGE 2)
    // ===============================================
    // Products that are mirrors with integrated LED/lighting are MIRRORS first,
    // not lighting fixtures.  ET2 and similar brands make lighted mirrors that
    // get classified into Lighting & Electrical because of the brand/URL — but
    // the correct category is Bathroom Mirror (Plumbing & Bath department).
    // Trigger: AI landed in a lighting category AND title contains "mirror".
    const LIGHTING_CATEGORIES_THAT_COULD_BE_MIRRORS = new Set([
      'Bathroom Lighting', 'Vanity Lighting', 'Wall Sconce',
      'Wall Lights', 'Sconces', 'Bath Lighting'
    ]);
    const titlesForMirrorCheck = [
      rawProduct.Product_Title_Web_Retailer,
      rawProduct.Ferguson_Title,
      (rawProduct as any).Ferguson_Raw_Data?.product?.name,
      rawProduct.SF_Catalog_Name,
    ].filter(Boolean).join(' ');
    const LIGHTED_MIRROR_REGEX = /\b(?:bathroom|vanity|lighted|led)[\s-]*(?:wall\s+)?mirror\b|\bmirror\s+with\s+(?:led|light)/i;

    if (LIGHTING_CATEGORIES_THAT_COULD_BE_MIRRORS.has(determinedCategory) && LIGHTED_MIRROR_REGEX.test(titlesForMirrorCheck)) {
      logger.warn('🪞 LIGHTED MIRROR CORRECTION: Title contains "mirror" — overriding lighting category to Bathroom Mirror', {
        sessionId: verificationSessionId,
        fromCategory: determinedCategory,
        fromDepartment: determinedDepartment,
        toCategory: 'Bathroom Mirror',
        toDepartment: 'Plumbing & Bath',
        matchedTitle: titlesForMirrorCheck.substring(0, 120),
        reason: 'Product is a mirror with integrated lighting — primary function is mirror, not light fixture'
      });
      determinedCategory = 'Bathroom Mirror';
      determinedDepartment = 'Plumbing & Bath';
      validCategoriesForDept = getCategoriesForDepartment('Plumbing & Bath');
      Object.assign(categoryConsensus, { agreedCategory: 'Bathroom Mirror', agreementReason: 'Lighted mirror correction: title contains "mirror" with lighting features' });
      Object.assign(departmentConsensus, { agreedDepartment: 'Plumbing & Bath' });
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
                ['brand', 'msrp', 'weight', 'upc_gtin', 'model_parent', 'product_type', 'product_style', 'product_title', 'description', 'features_list'].includes(disagreement.field.toLowerCase())) {
              // Normalize installation_type if it's being resolved
              const valueToStore = disagreement.field === 'installation_type' 
                ? normalizeInstallationType(resolution.resolvedValue)
                : resolution.resolvedValue;
              consensus.agreedPrimaryAttributes[disagreement.field] = valueToStore;
            } else {
              // Normalize installation_type if it's being resolved
              const valueToStore = disagreement.field === 'installation_type' 
                ? normalizeInstallationType(resolution.resolvedValue)
                : resolution.resolvedValue;
              consensus.agreedTop15Attributes[disagreement.field] = valueToStore;
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
          
          // 🇨🇦 CANADIAN SOURCE DETECTION (Phase 6 Web Search)
          // Check if any web search sources are Canadian domains
          const { 
            isCanadianRetailerURL: checkCanadianURL,
            convertCADtoUSD,
            convertKGtoLBS,
            checkExchangeRateStaleness,
            EXCHANGE_RATES,
            UNIT_CONVERSIONS
          } = require('../config/exchange-rates');
          const canadianSources = dualSearchResult.sources.filter(url => checkCanadianURL(url));
          
          if (canadianSources.length > 0) {
            logger.info('PHASE 6: Canadian sources detected in web search', {
              sessionId: verificationSessionId,
              canadianSources: canadianSources.length,
              totalSources: dualSearchResult.sources.length,
              domains: canadianSources.map(url => {
                try {
                  return new URL(url).hostname;
                } catch { return url; }
              })
            });
            
            // Check for MSRP field and convert CAD→USD
            const msrpFields = ['msrp', 'price', 'market_value', 'retail_price'];
            for (const msrpField of msrpFields) {
              const spec = dualSearchResult.consensusSpecs[msrpField];
              if (spec && typeof spec.value === 'string') {
                const msrpValue = parseFloat(spec.value.replace(/[^0-9.]/g, ''));
                if (!isNaN(msrpValue) && msrpValue > 0) {
                  const convertedMSRP = convertCADtoUSD(msrpValue);
                  const originalCAD = msrpValue;
                  
                  // Update the consensus spec with converted USD value
                  dualSearchResult.consensusSpecs[msrpField].value = String(convertedMSRP);
                  
                  logger.info('PHASE 6: Converted Canadian MSRP to USD', {
                    sessionId: verificationSessionId,
                    field: msrpField,
                    originalCAD: `$${originalCAD} CAD`,
                    convertedUSD: `$${convertedMSRP} USD`,
                    exchangeRate: EXCHANGE_RATES.CAD_TO_USD,
                    sources: canadianSources
                  });
                }
              }
            }
            
            // Check for Weight field and convert kg→lbs
            const weightFields = ['weight', 'shipping_weight', 'product_weight'];
            for (const weightField of weightFields) {
              const spec = dualSearchResult.consensusSpecs[weightField];
              if (spec && typeof spec.value === 'string') {
                const weightValue = parseFloat(spec.value.replace(/[^0-9.]/g, ''));
                
                // Detect if value is in kg (typically <50 for most products, or contains "kg")
                const isKg = weightValue < 50 || spec.value.toLowerCase().includes('kg');
                
                if (!isNaN(weightValue) && weightValue > 0 && isKg) {
                  const convertedWeight = convertKGtoLBS(weightValue);
                  const originalKG = weightValue;
                  
                  // Update the consensus spec with converted lbs value
                  dualSearchResult.consensusSpecs[weightField].value = String(convertedWeight);
                  
                  logger.info('PHASE 6: Converted Canadian weight to lbs', {
                    sessionId: verificationSessionId,
                    field: weightField,
                    originalKG: `${originalKG} kg`,
                    convertedLBS: `${convertedWeight} lbs`,
                    conversionFactor: UNIT_CONVERSIONS.KG_TO_LBS,
                    sources: canadianSources
                  });
                }
              }
            }
            
            // Warn if exchange rate is stale
            const stalenessCheck = checkExchangeRateStaleness();
            if (stalenessCheck.isStale) {
              logger.warn('PHASE 6: Exchange rate may be stale', {
                sessionId: verificationSessionId,
                daysSinceUpdate: stalenessCheck.daysSinceUpdate,
                lastUpdated: stalenessCheck.lastUpdated
              });
            }
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
            ['brand', 'msrp', 'weight', 'upc_gtin', 'model_parent', 'product_type', 'product_style', 'product_title', 'description', 'features_list'].includes(disagreement.field.toLowerCase())) {
          // Normalize installation_type if it's being resolved
          const valueToStore = disagreement.field === 'installation_type' 
            ? normalizeInstallationType(resolution.resolvedValue)
            : resolution.resolvedValue;
          consensus.agreedPrimaryAttributes[disagreement.field] = valueToStore;
        } else {
          // Normalize installation_type if it's being resolved
          const valueToStore = disagreement.field === 'installation_type' 
            ? normalizeInstallationType(resolution.resolvedValue)
            : resolution.resolvedValue;
          consensus.agreedTop15Attributes[disagreement.field] = valueToStore;
        }
        
        disagreement.resolution = resolution.winner === 'xai' ? 'xai' : 'openai';
      }
    }

    const processingTime = Date.now() - startTime;
    const response = await buildFinalResponse(rawProduct, consensus, verificationSessionId, processingTime, openaiResult, xaiResult, determinedDepartment, determinedCategory, determinedType, researchResult, dataSourceAnalysis, researchPhaseTriggered, retryCount, finalSearchResult);
    
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
    category?: string,
    salesforceCategory?: string,  // Finding #016: SF's category for validation
    useFullPrompt?: boolean       // PATH B: Appliances use full prompt for Stage 2 (926ad6b restore)
  }
): Promise<AIAnalysisResult> {
  const maxRetries = 3;
  let lastError: any;
  const model = config.openai?.model || 'gpt-4o-mini';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Start AI usage tracking
    // Use minimal prompt for Stage 1/2 to prevent OpenAI from ignoring system prompt
    // PATH B: Appliances Stage 2 uses full prompt (926ad6b behavior) for richer context
    const prompt = stageConfig?.useFullPrompt
      ? buildAnalysisPrompt(rawProduct, promptOptions)
      : (stageConfig?.stage === 'department-only' || stageConfig?.stage === 'category-only')
        ? buildStagePrompt(rawProduct, stageConfig.stage)
        : buildAnalysisPrompt(rawProduct, promptOptions);
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
        systemPrompt = getCategoryOnlyPrompt(stageConfig.department, promptOptions, stageConfig.salesforceCategory);
        logger.info('🔍 STAGE 2 (Hierarchical): Using category-only prompt (OpenAI)', { sessionId, department: stageConfig.department, salesforceCategory: stageConfig.salesforceCategory, strictMode: promptOptions?.strictCategoryMode, productId: rawProduct.SF_Catalog_Id });
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

      // Stage-aware validation: department-only and category-only stages
      // don't need full field validation (category, primary_attributes, etc.)
      if (stageConfig?.stage === 'department-only') {
        // For department-only, we just need the department field
        // OpenAI may return it as a nested object {name, confidence, reasoning} or as a string
        const dept = (parsed as any).department;
        if (!dept) {
          // Log keys to debug what OpenAI actually returned
          logger.error('OpenAI department-only: missing department field', {
            sessionId,
            responseKeys: Object.keys(parsed),
            responsePreview: JSON.stringify(parsed).substring(0, 500)
          });
          throw new Error('Invalid OpenAI department-only response: missing department field');
        }
        logger.info('✅ OpenAI department-only validation passed', { sessionId, department: typeof dept === 'object' ? dept.name : dept });
      } else if (stageConfig?.stage === 'category-only') {
        // For category-only, we just need the category field
        if (!parsed.category) {
          throw new Error('Invalid OpenAI category-only response: missing category field');
        }
        logger.info('✅ OpenAI category-only validation passed', { sessionId, category: typeof parsed.category === 'object' ? (parsed.category as any).name : parsed.category });
      } else {
        // Full validation for Stage 3 (category-specific) and legacy prompts
        if (!validateAIResponse(parsed, 'openai')) {
          throw new Error('Invalid OpenAI response structure');
        }
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

      logger.error(`OpenAI analysis attempt ${attempt}/${maxRetries} failed`, { sessionId, errorMessage: error instanceof Error ? error.message : String(error) });
      
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
    category?: string,
    salesforceCategory?: string,  // Finding #016: SF's category for validation
    useFullPrompt?: boolean       // PATH B: Appliances use full prompt for Stage 2 (926ad6b restore)
  }
): Promise<AIAnalysisResult> {
  const maxRetries = 3;
  let lastError: any;
  const model = config.xai?.model || 'grok-3';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Start AI usage tracking
    // Use minimal prompt for Stage 1/2 to prevent conflicting instructions
    // PATH B: Appliances Stage 2 uses full prompt (926ad6b behavior) for richer context
    const prompt = stageConfig?.useFullPrompt
      ? buildAnalysisPrompt(rawProduct, promptOptions)
      : (stageConfig?.stage === 'department-only' || stageConfig?.stage === 'category-only')
        ? buildStagePrompt(rawProduct, stageConfig.stage)
        : buildAnalysisPrompt(rawProduct, promptOptions);
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
        systemPrompt = getCategoryOnlyPrompt(stageConfig.department, promptOptions, stageConfig.salesforceCategory);
        logger.info('🔍 STAGE 2 (Hierarchical): Using category-only prompt (xAI)', { sessionId, department: stageConfig.department, salesforceCategory: stageConfig.salesforceCategory, strictMode: promptOptions?.strictCategoryMode, productId: rawProduct.SF_Catalog_Id });
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

      // Stage-aware validation: department-only and category-only stages
      // don't need full field validation (category, primary_attributes, etc.)
      if (stageConfig?.stage === 'department-only') {
        const dept = (parsed as any).department;
        if (!dept) {
          throw new Error('Invalid xAI department-only response: missing department field');
        }
        logger.info('✅ xAI department-only validation passed', { sessionId, department: typeof dept === 'object' ? dept.name : dept });
      } else if (stageConfig?.stage === 'category-only') {
        if (!parsed.category) {
          throw new Error('Invalid xAI category-only response: missing category field');
        }
        logger.info('✅ xAI category-only validation passed', { sessionId, category: typeof parsed.category === 'object' ? (parsed.category as any).name : parsed.category });
      } else {
        // Full validation for Stage 3 (category-specific) and legacy prompts
        if (!validateAIResponse(parsed, 'xai')) {
          throw new Error('Invalid xAI response structure');
        }
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

      logger.error(`xAI analysis attempt ${attempt}/${maxRetries} failed`, { sessionId, errorMessage: error instanceof Error ? error.message : String(error) });
      
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
 * ENHANCED: Multi-keyword detection and context validation (Finding #008 fix)
 */
function getDepartmentOnlyPrompt(): string {
  const departmentList = getDepartmentListForPrompt();
  
  return `You are an expert product classifier specializing in appliances and home products.

⚠️ CRITICAL: Your ONLY task is to determine the product's DEPARTMENT. This is Stage 1 of hierarchical classification.

Your task:
1. ANALYZE the raw product data provided (title, model, specifications)
2. IDENTIFY ALL category keywords present in the product data
3. EVALUATE which department has the MOST supporting evidence
4. Return ONLY the department determination with high confidence

== AVAILABLE DEPARTMENTS ==
${departmentList}

== DEPARTMENT-CATEGORY RELATIONSHIPS ==
Each department contains specific categories. When multiple keywords suggest different departments:
- **Appliances**: Refrigerator, Freezer, Dishwasher, Range, Oven, Cooktop, Microwave, Wine Cooler, Ice Maker, Washer, Dryer, etc.
- **Heating & Cooling**: Furnace, Boiler, Heat Pump, Air Conditioner, Thermostat, Humidifier, Dehumidifier, Air Purifier, etc.
- **Plumbing & Bath**: Faucet, Sink, Toilet, Shower, Tub, Water Heater, Pump, Softener, etc.
- **Lighting & Electrical**: Chandelier, Pendant, Sconce, Ceiling Fan, Switch, Outlet, Generator, etc.
- **Outdoor**: Grill, Fire Pit, Patio Heater, Outdoor Furniture, Pergola, etc.
- **Hardware**: Door Handle, Lock, Hinge, Cabinet Hardware, etc.

**🔍 MULTI-KEYWORD DETECTION RULES (CRITICAL):**

When you find MULTIPLE category keywords pointing to DIFFERENT departments:

1. **PRIMARY FUNCTION TEST**: What is the product's MAIN purpose?
   - Example: "Refrigerator Heater Kit" → Primary function is REFRIGERATION (heating is secondary/supportive)
   - Example: "Dishwasher Water Heater" → Primary function is DISHWASHING (water heating is internal component)
   - Example: "Range Hood Light Bulb" → Primary function is RANGE VENTILATION (lighting is feature)

2. **CONTEXT VALIDATION TEST**: Check if ALL related keywords fit in ONE department
   - Example: "Refrigerator/Freezer Heater Kit" has keywords: refrigerator + freezer + heater
   - ✅ Appliances department HAS categories: Refrigerator, Freezer (2 matches)
   - ❌ Heating & Cooling department has NO categories: Refrigerator or Freezer (0 matches)
   - **CONCLUSION**: Appliances (2 supporting categories) beats Heating & Cooling (0 supporting categories)

3. **ACCESSORY/COMPONENT TEST**: If product is a part/accessory FOR another product
   - Always select the department of the PRIMARY PRODUCT, not the accessory type
   - Example: "Refrigerator Water Filter" → Appliances (accessory FOR refrigerator)
   - Example: "Oven Light Bulb" → Appliances (component OF oven)
   - Example: "Heater Kit for Side-by-Side Refrigerator" → Appliances (component FOR refrigerator)

4. **DISQUALIFICATION RULE**: Eliminate departments that lack supporting categories
   - If a product mentions "refrigerator" + "freezer" + "heater", check each department:
   - Does "Heating & Cooling" have a "Refrigerator" category? NO → Score: 0 supporting categories
   - Does "Appliances" have "Refrigerator" category? YES → Score: 1+ supporting categories
   - **Select the department with MORE supporting category matches**

**Department Selection Rules:**
- Analyze product title, model number, and primary function
- Identify ALL category keywords (don't stop at first match)
- If multiple departments have matching keywords, use PRIMARY FUNCTION + CONTEXT VALIDATION tests
- Choose the department with the MOST supporting category matches
- For accessories/parts, always select department of the PRIMARY PRODUCT

**Examples:**
  • "Built-In Refrigerator" → Appliances (primary function: refrigeration)
  • "Pull-Down Kitchen Faucet" → Plumbing & Bath (primary function: water delivery)
  • "Outdoor Wall Sconce Light" → Lighting & Electrical (primary function: illumination)
  • "Front Door Handle Set" → Hardware (primary function: door operation)
  • "Ceiling Fan with Light" → Lighting & Electrical (primary function: cooling/circulation)
  • "Portable Air Conditioner" → Heating & Cooling (primary function: cooling)
  • "Outdoor Patio Heater" → Outdoor (primary function: outdoor heating)
  • **"Drop-In Side Burner" / "Single Side Burner" / "Outdoor Side Burner"** → **Appliances, Cooktop** (primary function: GAS COOKING - it is a gas cooking appliance, NOT a fire pit accessory)
  • **"Fire Pit Accessory"** is for: log sets, spark screens, grates, covers, pokers — decorative/safety items FOR fire pits. NEVER for cooking burners or gas cooking appliances.
  • **"Refrigerator/Freezer Heater Kit"** → **Appliances** (keywords: refrigerator ✓, freezer ✓, heater ✗)
    - Appliances has Refrigerator + Freezer categories (2 matches)
    - Heating & Cooling has NO Refrigerator or Freezer categories (0 matches)
    - Primary function: Prevents condensation IN refrigerators (appliance accessory)
  • **"Dishwasher Water Heater Element"** → **Appliances** (component OF dishwasher, not a water heater)
  • **"Range Hood Light Bulb"** → **Appliances** (component OF range hood, not a light fixture)

**⚠️ IMPORTANT: Stage 1 Response Format**
This is Stage 1 (department determination only). Return a simplified JSON structure:

{
  "department": {
    "name": "The exact department name from the list",
    "confidence": 0.95,
    "reasoning": "Explain your analysis: keywords found, primary function identified, department validation performed, supporting categories counted"
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
 * STAGE 2 PROMPT: Category Determination/Validation (Department-Filtered)
 * Shows ONLY categories from the determined department
 * 🔧 FINDING #016: Supports validation mode when Salesforce provides category
 */
function getCategoryOnlyPrompt(department?: string, promptOptions?: PromptOptions, salesforceCategory?: string): string {
  const categoryList = getCategoryListForPrompt(department);
  const departmentContext = department 
    ? `from the **${department}** department` 
    : 'from our master list';
  
  // Add strict validation warning if in retry mode
  const strictWarning = promptOptions?.invalidCategoryWarning 
    ? `\n\n🚨 ${promptOptions.invalidCategoryWarning}\n`
    : '';
  
  // 🔧 FINDING #016 REVISED: AI must INDEPENDENTLY determine category, then we compare with SF
  // This prevents AI from blindly accepting incorrect SF categories (e.g., Icemaker labeled as Freezer)
  if (salesforceCategory) {
    return `You are an expert product classifier specializing in appliances and home products.

⚠️ CRITICAL: Determine the CORRECT category for this product based on actual product data.
${strictWarning}
**Context**: Salesforce has this product labeled as "${salesforceCategory}" but your job is to INDEPENDENTLY verify if this is accurate.

Your task:
1. ANALYZE the raw product data provided (title, description, specs, images)
2. DETERMINE what category this product ACTUALLY belongs to
3. Return YOUR determination (which may differ from Salesforce)
4. If your category differs from "${salesforceCategory}", explain why in reasoning

${categoryList}

**Category Selection Rules:**
- Analyze product title, model number, specifications, and images
- Match to the MOST SPECIFIC category available
- Consider product type, function, and primary purpose
- **IMPORTANT: Do NOT simply accept Salesforce's category** - verify based on evidence
- Example: "Nugget Ice Machine" → "Icemaker" (NOT Freezer, even if mislabeled)
- Example: "Ice Maker" producing ice → "Icemaker" category (ice production, not storage)
- Example: "Freezer" for cold storage → "Freezer" category (food storage appliance)

**⚠️ CRITICAL: TRUST SOURCE TITLES FOR CATEGORY DISAMBIGUATION**
- **When Ferguson_Title or Product_Title_Web_Retailer explicitly mentions a category name, TRUST it.**
- The Ferguson title clearly says 'Bar Faucet' which should be definitive.
- Example: Ferguson title contains "Bar Faucet" → Use "Bar Faucet" category (NOT "Kitchen Faucet")
- Example: Ferguson title contains "Kitchen Faucet" → Use "Kitchen Faucet" category (NOT "Bar Faucet")
- **Bar Faucet vs Kitchen Faucet disambiguation:** These categories are structurally similar but distinct:
  * Bar Faucet: Smaller faucets for bar/prep sinks (compact, bar prep areas)
  * Kitchen Faucet: Standard faucets for main kitchen sinks
  * If source title says "Bar Faucet", use Bar Faucet category regardless of other similarities

**⚠️ CRITICAL Product Type Distinctions:**
- **Icemaker/Ice Machine**: Produces ice (nugget, cube, etc.). Primary function is ICE PRODUCTION.
- **Freezer**: Stores frozen food. Primary function is COLD STORAGE.
- These are DIFFERENT product categories. An ice machine is NOT a freezer.
${promptOptions?.strictCategoryMode ? '\n⚠️ **STRICT MODE**: You MUST select a category from the provided list. DO NOT create new category names.' : ''}

**⚠️ IMPORTANT: Stage 2 Response Format**
This is Stage 2 (category determination with validation). Return a complete JSON structure:

You must respond with valid JSON in this exact format:
{
  "category": {
    "name": "Your determined category (must be from the list)",
    "confidence": 0.95,
    "reasoning": "Why this category was chosen. If different from Salesforce's '${salesforceCategory}', explain the discrepancy.",
    "salesforce_mismatch": true/false
  },
  "primary_attributes": {},
  "top15_filter_attributes": {},
  "additional_attributes": {},
  "missing_fields": [],
  "corrections": [],
  "confidence": 0.95
}`;
  }
  
  // Original determination mode (when no Salesforce category provided)
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

**⚠️ CRITICAL: TRUST SOURCE TITLES FOR CATEGORY DISAMBIGUATION**
- **When Ferguson_Title or Product_Title_Web_Retailer explicitly mentions a category name, TRUST it.**
- The Ferguson title clearly says 'Bar Faucet' which should be definitive.
- Example: Ferguson title contains "Bar Faucet" → Use "Bar Faucet" category (NOT "Kitchen Faucet")
- Example: Ferguson title contains "Kitchen Faucet" → Use "Kitchen Faucet" category (NOT "Bar Faucet")
- **Bar Faucet vs Kitchen Faucet disambiguation:** These categories are structurally similar but distinct:
  * Bar Faucet: Smaller faucets for bar/prep sinks (compact, bar prep areas)
  * Kitchen Faucet: Standard faucets for main kitchen sinks
  * If source title says "Bar Faucet", use Bar Faucet category regardless of other similarities
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
      typeSelectionGuide += `For Refrigerators, **CHECK FOR ACCESSORIES FIRST**:\n\n`;
      typeSelectionGuide += `⚠️ **ACCESSORY DETECTION (HIGHEST PRIORITY)**:\n`;
      typeSelectionGuide += `  If ANY of these words appear in the title, Type = Accessory:\n`;
      typeSelectionGuide += `    • "Panel Kit" / "Door Panel Kit" / "Custom Panel Kit" → Type: Accessory\n`;
      typeSelectionGuide += `    • "Installation Kit" / "Trim Kit" / "Unification Kit" → Type: Accessory\n`;
      typeSelectionGuide += `    • "Handle Kit" / "Door Handle" / "Handle Assembly" → Type: Accessory\n`;
      typeSelectionGuide += `    • "Shelf" / "Shelving" / "Rack" / "Bin" / "Drawer" → Type: Accessory\n`;
      typeSelectionGuide += `    • "Filter" / "Water Filter" / "Air Filter" → Type: Accessory\n`;
      typeSelectionGuide += `    • "Ice Maker Kit" / "Icemaker Assembly" → Type: Accessory\n`;
      typeSelectionGuide += `    • ANY product that is a PART or COMPONENT, not a complete refrigerator → Type: Accessory\n\n`;
      typeSelectionGuide += `⚠️ **CRITICAL DISTINCTION**:\n`;
      typeSelectionGuide += `    • "Panel Kit" = ACCESSORY (a kit/panels sold separately for panel-ready appliances)\n`;
      typeSelectionGuide += `    • A refrigerator that IS panel-ready uses its door configuration as Type (French Door, Column, etc.)\n`;
      typeSelectionGuide += `    If title says "Panel Kit for..." → It's an ACCESSORY!\n\n`;
      typeSelectionGuide += `**IF NOT AN ACCESSORY**, then prioritize explicit type mentions:\n`;
      typeSelectionGuide += `  - **STEP 1 - Check for Wine/Beverage Column FIRST (highest priority for tall units)**:\n`;
      typeSelectionGuide += `    ⚠️ **CRITICAL - Wine Column vs Wine Cooler distinction**:\n`;
      typeSelectionGuide += `    • A **Column** refrigerator is FULL HEIGHT (~84") and built-in/integrated. It can be dedicated to wine.\n`;
      typeSelectionGuide += `    • A **Wine Cooler** is a SMALLER unit (typically under-counter height, ≤34" tall) dedicated to wine.\n`;
      typeSelectionGuide += `    • Rule: If height ≥ 60" OR "Column" or "Integrated" appears in the product name/description → Type: Column\n`;
      typeSelectionGuide += `    • "Wine Column" / "Integrated Wine Column" / "Wine Storage Column" → Column\n`;
      typeSelectionGuide += `    • "Integrated Wine" (tall, full-height) → Column\n`;
      typeSelectionGuide += `    • "Wine Cooler" / "Wine Storage" (short, undercounter, ≤34") → Wine Cooler\n`;
      typeSelectionGuide += `    • "Beverage Center" / "Beverage Cooler" / "XX Can" (e.g., "140 Can") → Beverage Center\n`;
      typeSelectionGuide += `    • "Kegerator" / "Keg" / "Beer Dispenser" / "Tap System" → Kegerator\n`;
      typeSelectionGuide += `  - **STEP 2 - If NOT specialized wine/beverage, check door configuration**:\n`;
      typeSelectionGuide += `    • "Column" / "Column Refrigerator" / "Integrated" (tall, full-height single-door unit) → Column\n`;
      typeSelectionGuide += `    • "French Door" (explicitly mentioned OR 3-4 doors with bottom freezer) → French Door\n`;
      typeSelectionGuide += `    • "Side-by-Side" / "Side by Side" (2 vertical doors) → Side-by-Side\n`;
      typeSelectionGuide += `    • "Top Freezer" / "Top Mount" (explicitly mentioned) → Top Freezer\n`;
      typeSelectionGuide += `    • "Bottom Freezer" / "Bottom Mount" (explicitly mentioned, NOT french door) → Bottom Freezer\n`;
      typeSelectionGuide += `    • "4-Door Flex" (explicitly "Flex" OR 4 doors WITHOUT french door designation) → 4-Door Flex\n`;
      typeSelectionGuide += `  - **STEP 3 - Installation/Size**: Undercounter (built-in under counter height, ≤34"), Freestanding\n`;
      typeSelectionGuide += `  ⚠️ **CRITICAL**: If title says "Beverage Center" with can capacity, DO NOT classify as anything else!\n`;
      typeSelectionGuide += `  ⚠️ **4-Door Flex vs French Door**: "French Door" takes priority if both could apply\n`;
      typeSelectionGuide += `  ⚠️ **Wine Column example**: Monogram ZIW241NBWII = 84" tall integrated wine column → Type: Column (NOT Wine Cooler)\n`;
    } else if (categoryLower.includes('oven')) {
      typeSelectionGuide += `For Ovens, analyze model number and cavity count:\n`;
      typeSelectionGuide += `  - Model with "30" or "OB30" → 30" built-in\n`;
      typeSelectionGuide += `  - Check specs for "single cavity" vs "double cavity"\n`;
      typeSelectionGuide += `  - Look for "Single", "Double Wall", "Combination" in title\n`;
    } else if (categoryLower.includes('faucet')) {
      typeSelectionGuide += `For Faucets, check handle count and spray type:\n`;
      typeSelectionGuide += `  - Look for "Single Handle", "Two Handle", "Widespread"\n`;
      typeSelectionGuide += `  - Check for "Pull-Down", "Pull-Out" spray configurations\n`;
    } else if (categoryLower.includes('dryer') || categoryLower.includes('washer')) {
      typeSelectionGuide += `For ${determinedCategory}, **Type = LOADING CONFIGURATION ONLY** (how you load clothes):\n`;
      typeSelectionGuide += `  ⚠️ **CRITICAL DISTINCTION**:\n`;
      typeSelectionGuide += `    • **Type** = Physical structure: Front Load, Top Load, or Unitized\n`;
      typeSelectionGuide += `    • **Fuel Type** = Power source: Gas, Electric, Heat Pump (THIS IS AN ATTRIBUTE, NOT A TYPE!)\n`;
      typeSelectionGuide += `    • **Vent Type** = Venting: Vented, Ventless (THIS IS AN ATTRIBUTE, NOT A TYPE!)\n`;
      typeSelectionGuide += `    • **Size** = Compact, Stackable (THESE ARE ATTRIBUTES, NOT TYPES!)\n\n`;
      typeSelectionGuide += `  **Decision Process**:\n`;
      typeSelectionGuide += `    1. Look for loading configuration keywords:\n`;
      typeSelectionGuide += `       - "Front Load" / "Front Loading" → Front Load\n`;
      typeSelectionGuide += `       - "Top Load" / "Top Loading" → Top Load\n`;
      typeSelectionGuide += `       - "Unitized" / "Laundry Center" / "Stacked" / "All-in-One" → Unitized\n`;
      typeSelectionGuide += `    2. **IGNORE these when selecting Type** (they are separate attributes):\n`;
      typeSelectionGuide += `       - ❌ "Gas" / "Electric" / "Heat Pump" → DO NOT use as Type\n`;
      typeSelectionGuide += `       - ❌ "Vented" / "Ventless" / "Condenser" → DO NOT use as Type\n`;
      typeSelectionGuide += `       - ❌ "Compact" / "Stackable" / "Portable" → DO NOT use as Type\n`;
      typeSelectionGuide += `    3. If loading configuration not explicitly stated:\n`;
      typeSelectionGuide += `       - Check dimensions: Wide/standard = Front Load, Narrow/tall = Top Load\n`;
      typeSelectionGuide += `       - Default to Front Load for modern appliances if unclear\n\n`;
      typeSelectionGuide += `  **Example Mappings**:\n`;
      typeSelectionGuide += `    • "27-Inch Gas Front Load Dryer" → Type: Front Load, Fuel Type: Gas (attribute)\n`;
      typeSelectionGuide += `    • "Top Load Electric Washer" → Type: Top Load, Fuel Type: Electric (attribute)\n`;
      typeSelectionGuide += `    • "Ventless Heat Pump Dryer" → Type: Front Load, Vent Type: Ventless (attribute)\n`;
    } else if (categoryLower.includes('chandelier')) {
      typeSelectionGuide += `For Chandeliers, look for structural indicators:\n`;
      typeSelectionGuide += `  - "Tier" / "Tiered" / number of tiers\n`;
      typeSelectionGuide += `  - "Candle" style, "Drum" shade, "Crystal" type\n`;
    } else if (categoryLower.includes('door hardware')) {
      typeSelectionGuide += `For Door Hardware, check lock mechanism:\n`;
      typeSelectionGuide += `  - "Passage" (no lock), "Privacy" (push-button), "Entry" (keyed)\n`;
      typeSelectionGuide += `  - "Dummy" (non-functional), "Single Cylinder", "Double Cylinder"\n`;
    } else if (categoryLower.includes('icemaker') || categoryLower.includes('ice maker')) {
      // 🔧 NEW: Icemaker type selection guide - addresses dual-capability products
      typeSelectionGuide += `For Icemakers, **Type = INSTALLATION METHOD** (how it's installed):\n\n`;
      typeSelectionGuide += `⚠️ **CRITICAL**: Many ice makers support BOTH undercounter and freestanding installation.\n`;
      typeSelectionGuide += `When BOTH are mentioned, use these rules to determine PRIMARY type:\n\n`;
      typeSelectionGuide += `**Decision Priority Order:**\n`;
      typeSelectionGuide += `  1. **"ADA" or "ADA Compliant" mentioned** → Type: Undercounter\n`;
      typeSelectionGuide += `     - ADA compliance is specifically for built-in/undercounter scenarios\n`;
      typeSelectionGuide += `  2. **"Panel Ready" or "Custom Panel" mentioned** → Type: Undercounter\n`;
      typeSelectionGuide += `     - Panel-ready designs integrate with cabinetry (built-in)\n`;
      typeSelectionGuide += `  3. **"Outdoor" mentioned** → Type: Undercounter (typically built into outdoor kitchens)\n`;
      typeSelectionGuide += `  4. **"Portable" or "Countertop" mentioned** → Type: Portable\n`;
      typeSelectionGuide += `  5. **"Built-In" or "Undercounter" appears FIRST in title** → Type: Undercounter\n`;
      typeSelectionGuide += `  6. **"Freestanding" appears FIRST in title** → Type: Freestanding\n`;
      typeSelectionGuide += `  7. **Both equally mentioned, no other clues** → Default to Undercounter\n`;
      typeSelectionGuide += `     - Most high-end ice makers are designed primarily for built-in installation\n\n`;
      typeSelectionGuide += `**Examples:**\n`;
      typeSelectionGuide += `  • "ADA Collection 15\" Built-In / Freestanding Ice Maker" → Undercounter (ADA mentioned)\n`;
      typeSelectionGuide += `  • "15\" Panel Ready Freestanding/Built-In Ice Maker" → Undercounter (Panel Ready)\n`;
      typeSelectionGuide += `  • "Outdoor Undercounter/Freestanding Nugget Ice Machine" → Undercounter (Outdoor)\n`;
      typeSelectionGuide += `  • "15\" Freestanding/Built-In Ice Maker" → Freestanding (Freestanding appears first)\n`;
      typeSelectionGuide += `  • "Compact Countertop Ice Maker" → Portable\n`;
    } else if (categoryLower.includes('showerhead') || categoryLower === 'showerheads & accessories') {
      // 🔧 Showerheads & Accessories type selection guide
      typeSelectionGuide += `For Showerheads & Accessories, **Type = PRODUCT ASSEMBLY TYPE** (what the complete product is):\n\n`;
      typeSelectionGuide += `⚠️ **CRITICAL DISTINCTION — "Thermostatic" is a VALVE TECHNOLOGY, not a product type!**\n`;
      typeSelectionGuide += `  • "Thermostatic" = describes HOW the valve controls temperature (attribute)\n`;
      typeSelectionGuide += `  • "Pressure Balance" = describes HOW the valve maintains pressure (attribute)\n`;
      typeSelectionGuide += `  • These are VALVE TECHNOLOGIES, NOT the product assembly type!\n\n`;
      typeSelectionGuide += `**Decision Priority Order:**\n`;
      typeSelectionGuide += `  1. **"System" / "Kit" / "Set" / "Package" with MULTIPLE components** → Type: Shower System\n`;
      typeSelectionGuide += `     - Includes: shower head + valve + trim, or head + hand shower + bar\n`;
      typeSelectionGuide += `     - "Trim Package with Shower Head" = Shower System (multiple parts)\n`;
      typeSelectionGuide += `     - "Valve Trim with Diverter for Hand Shower and 2 Applications" = Shower System (controls multiple outputs)\n`;
      typeSelectionGuide += `  2. **Just a shower head (single component):**\n`;
      typeSelectionGuide += `     - "Rain Shower Head" / "Rainfall" / "Overhead" → Type: Rain Head\n`;
      typeSelectionGuide += `     - "Showerhead" / "Shower Head" (standard, not rain) → Type: Showerhead\n`;
      typeSelectionGuide += `  3. **Just a hand shower (single component):**\n`;
      typeSelectionGuide += `     - "Hand Shower" / "Handshower" / "Hand Held" → Type: Handheld\n`;
      typeSelectionGuide += `  4. **Just a body spray:** → Type: Body Spray\n`;
      typeSelectionGuide += `  5. **Just a valve trim (NO shower head included):**\n`;
      typeSelectionGuide += `     - "Valve Trim" / "Trim Only" (single valve control only) → Type: Trim\n`;
      typeSelectionGuide += `     - "Thermostatic Valve Trim" (single valve, no multi-output) → Type: Thermostatic Valve Trim\n`;
      typeSelectionGuide += `  6. **Diverter or volume control only:** → Type: Diverter or Volume Control\n`;
      typeSelectionGuide += `  7. **Use "Thermostatic" or "Pressure Balance" as Type ONLY when:**\n`;
      typeSelectionGuide += `     - Product is a standalone valve body/cartridge with NO other components\n`;
      typeSelectionGuide += `     - NOT a system, NOT a trim kit, NOT a shower head\n\n`;
      typeSelectionGuide += `**Examples:**\n`;
      typeSelectionGuide += `  • "Exposed Thermostatic Shower System with Head, Hand Shower, Slide Bar" → Type: Shower System\n`;
      typeSelectionGuide += `  • "Thermostatic Tub/Shower Trim Package with Shower Head and Volume Control" → Type: Shower System\n`;
      typeSelectionGuide += `  • "Thermostatic Valve Trim with Diverter for 2 Shower Applications" → Type: Shower System\n`;
      typeSelectionGuide += `  • "8\" Rain Shower Head with Arm" → Type: Rain Head\n`;
      typeSelectionGuide += `  • "Thermostatic Rough-In Valve Body" → Type: Thermostatic\n`;
      typeSelectionGuide += `  • "Single Function Valve Trim Only" → Type: Trim\n`;
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
    typeSelectionGuide += `\n⚠️ ⚠️ ⚠️  CRITICAL TYPE SELECTION RULES  ⚠️ ⚠️ ⚠️\n`;
    typeSelectionGuide += `  6. ALWAYS select a type from the provided list\n`;
    typeSelectionGuide += `  7. NEVER return "Not Found" - pick your BEST semantic match\n`;
    typeSelectionGuide += `  8. If truly uncertain: Pick the most COMMON [PRIMARY] type for this category\n`;
    typeSelectionGuide += `  9. When in doubt: Choose the most GENERIC type that fits\n`;
    typeSelectionGuide += `  10. NEVER use "Not Applicable" (product is already in correct category)\n`;
    typeSelectionGuide += `\n  📌 REMEMBER: A "good enough" match is BETTER than "Not Found"\n`;
  }
  
  // Build category-specific type list
  let categoryTypeContext = '';
  if (validTypes.length > 0) {
    const categoryMapping = getCategoryTypeMapping(determinedCategory);
    const logicDescription = categoryMapping?.logic || 'Product variation';
    
    categoryTypeContext = `\n== VALID PRODUCT TYPES FOR ${determinedCategory.toUpperCase()} ==\n`;
    categoryTypeContext += `📋 What "Type" means for this category: "${logicDescription}"\n`;
    categoryTypeContext += `   (This describes WHAT the type field represents, not what values you can use)\n\n`;
    categoryTypeContext += `✅ ONLY THESE VALUES ARE ALLOWED (choose from this list ONLY):\n`;
    categoryTypeContext += validTypes.map((t: string, idx: number) => `  ${idx + 1}. ${t}`).join('\n');
    categoryTypeContext += '\n\n⚠️ CRITICAL RULES:\n';
    categoryTypeContext += '  • You MUST select a type from the numbered list above\n';
    categoryTypeContext += '  • Do NOT use types from other categories (e.g., "Built-In" is for Microwave, not Barbeque)\n';
    categoryTypeContext += '  • If you see relevant info that matches the logic description but is NOT in the list:\n';
    categoryTypeContext += '    → Put it in filter_attributes or appliance_features instead\n';
    categoryTypeContext += '  • Example: For Barbeque, "Built-In" installation goes in filter_attributes.installation_type, NOT product_type';
    
    // ⚠️ SPECIAL CASE: Range Hood type clarification (prevents confusion with installation method)
    if (determinedCategory === 'Range Hood') {
      categoryTypeContext += '\n\n🔍 RANGE HOOD TYPE CLARIFICATION:\n';
      categoryTypeContext += '  • product_type describes the HOOD STYLE (Insert, Wall Mount, Under Cabinet, Island Mount, Pro-Style)\n';
      categoryTypeContext += '  • installation_type describes HOW it mounts (e.g., "Wall-Mounted", "Built-In")\n';
      categoryTypeContext += '  • These are DIFFERENT fields - do not confuse them!\n';
      categoryTypeContext += '\n  EXAMPLES:\n';
      categoryTypeContext += '  ✅ "Custom Insert Hood" → product_type: "Insert" (not "Wall Mount" even if it mounts on wall)\n';
      categoryTypeContext += '  ✅ "Undercabinet Hood" → product_type: "Under Cabinet" (not "Wall-Mounted")\n';
      categoryTypeContext += '  ✅ "Wall Mount Hood" → product_type: "Wall Mount"\n';
      categoryTypeContext += '  ✅ "Island Hood" → product_type: "Island Mount"\n';
      categoryTypeContext += '\n  🚫 COMMON MISTAKES TO AVOID:\n';
      categoryTypeContext += '  ❌ Seeing "wall-mounted installation" in description and choosing "Wall Mount" for Insert hood\n';
      categoryTypeContext += '  ❌ Seeing "under cabinet" mounting and choosing "Under Cabinet" for Insert hood\n';
      categoryTypeContext += '\n  KEY: Look for hood STYLE first (Insert/Liner, Under Cabinet, Wall Mount, Island), not mounting method!';
    }
    
    // ⚠️ SPECIAL CASE: Dishwasher type clarification (prevents confusion with Panel Ready attribute)
    if (determinedCategory === 'Dishwasher') {
      categoryTypeContext += '\n\n🔍 DISHWASHER TYPE CLARIFICATION:\n';
      categoryTypeContext += '  • product_type describes CONTROL LOCATION or INSTALLATION TYPE (Top Control, Front Control, Drawer, Portable, Countertop)\n';
      categoryTypeContext += '  • "Panel-Ready" as a TYPE means control panel integration (different from control location)\n';
      categoryTypeContext += '  • "Panel Ready" as title attribute (position 4) describes cabinet integration style\n';
      categoryTypeContext += '  • These are DIFFERENT fields - do not confuse or duplicate them!\n';
      categoryTypeContext += '\n  EXAMPLES:\n';
      categoryTypeContext += '  ✅ "Top Control Panel Ready Dishwasher" → product_type: "Top Control" (Panel Ready goes in separate attribute)\n';
      categoryTypeContext += '  ✅ "Front Control Dishwasher" → product_type: "Front Control"\n';
      categoryTypeContext += '  ✅ "Drawer Dishwasher" → product_type: "Drawer"\n';
      categoryTypeContext += '  ✅ "Panel-Ready Dishwasher" → product_type: "Panel-Ready" (when it\'s the TYPE, not just panel-ready finish)\n';
      categoryTypeContext += '\n  🚫 COMMON MISTAKES TO AVOID:\n';
      categoryTypeContext += '  ❌ Setting product_type: "Panel-Ready" when it should be "Top Control" with panel-ready FINISH\n';
      categoryTypeContext += '  ❌ Duplicating "Panel Ready" in both type and title attribute fields\n';
      categoryTypeContext += '\n  KEY: Look for CONTROL TYPE first (Top/Front Control, Drawer), not finish/integration style!';
    }
    
    // ⚠️ SPECIAL CASE: Dryer type clarification (prevents confusion with fuel type)
    if (determinedCategory === 'Dryer') {
      categoryTypeContext += '\n\n🔍 DRYER TYPE CLARIFICATION:\n';
      categoryTypeContext += '  • product_type describes LOADING CONFIGURATION (Front Load, Top Load, Unitized)\n';
      categoryTypeContext += '  • fuel_type describes POWER SOURCE (Electric, Gas, Heat Pump) - separate schema attribute at position 4\n';
      categoryTypeContext += '  • vent_type describes VENTING METHOD (Vented, Ventless) - separate attribute\n';
      categoryTypeContext += '  • These are DIFFERENT fields - do not confuse them!\n';
      categoryTypeContext += '\n  EXAMPLES:\n';
      categoryTypeContext += '  ✅ "Electric Dryer" → product_type: "Front Load" (or Top Load), fuel_type: "Electric"\n';
      categoryTypeContext += '  ✅ "Gas Dryer" → product_type: "Front Load" (or Top Load), fuel_type: "Gas"\n';
      categoryTypeContext += '  ✅ "Ventless Electric Dryer" → product_type: "Front Load", fuel_type: "Electric", vent_type: "Ventless"\n';
      categoryTypeContext += '  ✅ "Unitized Dryer" → product_type: "Unitized"\n';
      categoryTypeContext += '\n  🚫 COMMON MISTAKES TO AVOID:\n';
      categoryTypeContext += '  ❌ Seeing "Electric Dryer" and setting product_type: "Electric" (should be "Front Load" or "Top Load")\n';
      categoryTypeContext += '  ❌ Seeing "Gas Dryer" and setting product_type: "Gas" (should be loading type, fuel goes in fuel_type)\n';
      categoryTypeContext += '  ❌ Seeing "Ventless" and setting product_type: "Ventless" (should be vent_type attribute)\n';
      categoryTypeContext += '\n  KEY: Look for LOADING TYPE first (Front Load, Top Load, Unitized), not power source or venting!';
    }
    
    // ⚠️ SPECIAL CASE: Washer type clarification (prevents confusion with size/feature attributes)
    if (determinedCategory === 'Washer') {
      categoryTypeContext += '\n\n🔍 WASHER TYPE CLARIFICATION:\n';
      categoryTypeContext += '  • product_type describes LOADING CONFIGURATION ONLY (Front Load, Top Load, Unitized)\n';
      categoryTypeContext += '  • "Stackable" is NOT a type - it\'s a feature/attribute\n';
      categoryTypeContext += '  • "Compact" is NOT a type - captured by Width attribute (e.g., 24-Inch)\n';
      categoryTypeContext += '  • "Portable" is NOT a type - it\'s an attribute\n';
      categoryTypeContext += '  • These size/feature terms go in attributes, NOT product_type!\n';
      categoryTypeContext += '\n  EXAMPLES:\n';
      categoryTypeContext += '  ✅ "Compact Front Load Washer" → product_type: "Front Load", width: 24 (Compact via width, not type)\n';
      categoryTypeContext += '  ✅ "Stackable Top Load Washer" → product_type: "Top Load" (Stackable is feature attribute)\n';
      categoryTypeContext += '  ✅ "Portable Washer" → product_type: "Top Load" (Portable is attribute)\n';
      categoryTypeContext += '  ✅ "Unitized Washer" → product_type: "Unitized"\n';
      categoryTypeContext += '\n  🚫 COMMON MISTAKES TO AVOID:\n';
      categoryTypeContext += '  ❌ Seeing "Compact Washer" and setting product_type: "Compact" (should use loading type + width)\n';
      categoryTypeContext += '  ❌ Seeing "Stackable Washer" and setting product_type: "Stackable" (stackable is feature, not type)\n';
      categoryTypeContext += '  ❌ Seeing "Portable Washer" and setting product_type: "Portable" (loading type + portable attribute)\n';
      categoryTypeContext += '\n  KEY: Look for LOADING TYPE first (Front Load, Top Load, Unitized), not size or features!';
    }

    // ⚠️ SPECIAL CASE: Freezer type clarification (installation_type, panel_ready, AND type are three separate fields)
    if (determinedCategory === 'Freezer') {
      categoryTypeContext += '\n\n🔍 FREEZER TYPE CLARIFICATION:\n';
      categoryTypeContext += '  • product_type describes FORM FACTOR (Upright, Chest, Column, Undercounter)\n';
      categoryTypeContext += '  • installation_type describes HOW IT INSTALLS (Built-In, Freestanding) - SEPARATE field!\n';
      categoryTypeContext += '  • panel_ready describes INTEGRATION STYLE (Yes/No) - SEPARATE field!\n';
      categoryTypeContext += '  • These are THREE DIFFERENT fields — do NOT conflate them!\n';
      categoryTypeContext += '\n  VALID TYPES (form factor only): Upright, Chest, Column, Undercounter, Accessory\n';
      categoryTypeContext += '  ⚠️ "Compact" is NOT a valid type — use "Undercounter" for small/compact/mini freezers!\n';
      categoryTypeContext += '\n  EXAMPLES:\n';
      categoryTypeContext += '  ✅ "Built-In Column Freezer" → installation_type: "Built-In", product_type: "Column"\n';
      categoryTypeContext += '  ✅ "Freestanding Chest Freezer" → installation_type: "Freestanding", product_type: "Chest"\n';
      categoryTypeContext += '  ✅ "Built-In Panel Ready Column" → installation_type: "Built-In", panel_ready: "Panel Ready", product_type: "Column"\n';
      categoryTypeContext += '  ✅ "Compact/Mini Freezer" → product_type: "Undercounter" (Compact is not a valid type)\n';
      categoryTypeContext += '  ✅ "Undercounter Freezer" → product_type: "Undercounter"\n';
      categoryTypeContext += '\n  🚫 COMMON MISTAKES TO AVOID:\n';
      categoryTypeContext += '  ❌ Setting product_type: "Compact" (use "Undercounter" instead)\n';
      categoryTypeContext += '  ❌ Setting product_type: "Built-In" (that is installation_type, not form factor)\n';
      categoryTypeContext += '  ❌ Setting product_type: "Freestanding" (that is installation_type)\n';
      categoryTypeContext += '  ❌ Setting product_type: "Panel Ready" (that is a separate panel_ready attribute)\n';
      categoryTypeContext += '\n  KEY: product_type = physical shape/size (Upright/Chest/Column/Undercounter), NOT how it installs!';
    }
  } else {
    categoryTypeContext = `\n== PRODUCT TYPE ==\nThis category does not have type variations. Use "Not Applicable" for product_type field.`;
  }
  
  // Build category-specific style list
  const categoryStyleContext = `\n== VALID STYLES FOR ${determinedCategory.toUpperCase()} ==\n${validStyles.map((s: string, idx: number) => `  ${idx + 1}. ${s}`).join('\n')}`;
  
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

⚠️ CRITICAL ATTRIBUTES FOR TITLE GENERATION:
You MUST extract these attributes from product descriptions based on category:

**APPLIANCES** (Cooktop, Range, Oven, Dishwasher, Refrigerator, Microwave, Washer, Dryer):
- Width (inches): Standard sizes are 24", 27", 30", 36", 48"
- Fuel Type: Gas, Electric, Induction, Dual Fuel, Heat Pump (CRITICAL - customers need this!)
- Number of Burners: For cooktops/ranges (4, 5, 6 burners)
- Capacity: Cu. Ft. for refrigerators/ovens/washers/dryers
- Place Settings: For dishwashers (12, 14, 16 place settings)
- Control Type: For dishwashers (Top Control, Front Control)
- Installation Type: Built-In, Freestanding, Slide-In, Drop-In, Counter-Depth
- ⚠️ For Washer/Dryer: Type = Loading configuration (Front Load, Top Load, Unitized) ONLY - NOT fuel/venting!

**RANGE HOODS**:
- CFM: Airflow rating (CRITICAL - 100% of competitor titles include this!)
- Width: 30", 36", 48" standard
- Installation Type: Wall Mount, Under Cabinet, Island Mount, Insert

**PLUMBING FIXTURES** (Faucets, Showers, Tub Fillers, Sinks):
- GPM: Gallons Per Minute (1.2, 1.5, 1.8, 2.0, 2.5 GPM)
- Collection Name: For luxury brands (Graff, Kohler, Kallista, Axor)
- Installation Type: Wall Mount, Widespread, Single Hole, Deck Mount, Floor Mount
- Basin Count: For sinks (Single Basin, Double Basin)

**LIGHTING** (All lighting categories):
- Number of Lights: 1-Light, 3-Light, 5-Light, etc.
- Width: For vanity lights, chandeliers, pendants (in inches)
- Mounting Type: Ceiling Mount, Wall Mount, Flush Mount, Semi-Flush

**HEATING/COOKING**:
- BTU: British Thermal Units for heating capacity

⚠️ ⚠️ ⚠️  CRITICAL: TITLE FORMAT BY CATEGORY  ⚠️ ⚠️ ⚠️

**COOKTOP**: "Brand Width-Inch Burner_Count-Burner Fuel_Type Category Finish - Model"
  Example: "GE 36-Inch 5-Burner Gas Cooktop Stainless Steel - PGP966SETSS"
  MUST INCLUDE: Brand, Width (30/36"), Burner Count (4/5/6), Fuel Type (Gas/Electric/Induction), Finish, Model

**RANGE**: "Brand Width-Inch Burner_Count-Burner Fuel_Type Installation_Type Category Finish - Model"
  Example: "GE 30-Inch 5-Burner Dual Fuel Freestanding Range Stainless Steel - PGB911SEJSS"
  MUST INCLUDE: Brand, Width, Burner Count, Fuel Type, Installation Type (Freestanding/Slide-In), Finish, Model

**OVEN**: "Brand Width-Inch Type Category Finish - Model"
  Example: "GE 30-Inch Single Wall Oven Stainless Steel - JTS3000SNSS"
  MUST INCLUDE: Brand, Width, Type (Single/Double Wall), Finish, Model

**REFRIGERATOR**: "Brand Width-Inch Type Category Finish - Model"
  Example: "Whirlpool 36-Inch French Door Refrigerator Stainless Steel - WRF555SDFZ"
  MUST INCLUDE: Brand, Width, Type (French Door/Side-by-Side/etc.), Finish, Model

**DISHWASHER**: "Brand Width-Inch PlaceSettings-Place-Setting Control_Type Category Finish - Model"
  Example: "Bosch 24-Inch 16-Place-Setting Top Control Dishwasher Stainless Steel - SHPM88Z75N"
  MUST INCLUDE: Brand, Width (18/24"), Place Settings, Control Type (Top/Front), Finish, Model

**RANGE HOOD**: "Brand Width-Inch CFM_Value-CFM Installation_Type Category Finish - Model"
  Example: "Broan 36-Inch 400-CFM Under Cabinet Range Hood Stainless Steel - 413604"
  MUST INCLUDE: Brand, Width, CFM (airflow), Installation Type (Wall Mount/Under Cabinet/Island), Finish, Model

**WASHER/DRYER**: "Brand Width-Inch Capacity-Cu.-Ft. Type Fuel_Type Category Finish - Model"
  Example: "LG 27-Inch 4.5-Cu.-Ft. Front Load Gas Dryer Stainless Steel - DLGX4501V"
  MUST INCLUDE: Brand, Width, Capacity, Type (Front Load/Top Load), Fuel Type (for dryers), Finish, Model

**FAUCET**: "Brand Collection Handle_Config Pull_Type Category Finish - Model"
  Example: "Delta Trinsic Single Handle Pull-Down Kitchen Faucet Matte Black - 9159-BL-DST"
  MUST INCLUDE: Brand, Collection (if luxury), Handle Config (Single/Two Handle), Pull Type (Pull-Down/Pull-Out), Finish, Model

**GENERAL TITLE RULES**:
1. NO parentheses or marketing features like "(Touch2O Technology)" - just specs!
2. Model number ALWAYS at the END after a dash
3. Format dimensions as "36-Inch", "4.5-Cu.-Ft.", "400-CFM" with hyphens
4. Include ALL critical spec fields even if title gets long (60-80 chars is OK)
5. Order: Brand → Size → Capacity/Performance → Configuration/Type → Fuel/Control → Category → Finish → Model

Your task is to:
1. ANALYZE the raw product data provided
2. DETERMINE the product's TYPE (functional variation within ${determinedCategory} category)
3. MAP the raw data to the correct attributes for ${determinedCategory}
4. **EXTRACT all critical attributes listed above** from product titles, descriptions, specifications
5. VERIFY and CLEAN the data (fix obvious errors, standardize formats)
6. IDENTIFY any missing required fields
7. **GENERATE product_title following the category-specific format above**

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
    "product_type": "⚠️ MANDATORY: Select from the VALID PRODUCT TYPES list above. This is the FUNCTIONAL variation (e.g., 'Indoor' for ceiling fans, 'Single' vs 'Double Wall' for ovens). ALWAYS choose your BEST match - NEVER return 'Not Found'.",
    "product_style": "⚠️ MANDATORY: Select DESIGN AESTHETIC from VALID DESIGN STYLES (e.g., Contemporary, Modern, Traditional). DO NOT put functional types here.",
    "depth_length": "numeric value only (depth OR length)",
    "width": "numeric value only",
    "height": "numeric value only",
    "weight": "numeric value in lbs",
    "msrp": "Manufacturer's Suggested Retail Price (NOT current sale price)",
    "description": "Enhanced customer-ready description (max 500 chars)",
    "product_title": "⚠️ CRITICAL: Follow the TITLE FORMAT BY CATEGORY examples above for ${determinedCategory}. Include ALL critical specs (width, burner count, fuel type, etc.). NO features/parentheses. Model at END after dash.",
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
- For product_type: ALWAYS pick your BEST match from the type list - NEVER "Not Found"
- For product_style: ALWAYS select from universal design styles list
- Use "Not Found" for OTHER fields only if searched but truly not available
- Use "Not Applicable" ONLY if field doesn't apply to this category
- For product_type: Since product IS in ${determinedCategory} category, you MUST select a type from the list`;
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
  canadianDataContext?: {
    isCanadianData: boolean;
    webRetailerKey: string;
    msrpConversion?: string;  // e.g., "$3000 CAD → $2190 USD"
    weightConversion?: string;  // e.g., "28 kg → 61.73 lbs"
    exchangeRate: number;
    conversionFactor: number;
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
  
  // FILTER 0: Detect Web Retailer brand mismatch (data collision).
  // If Web Retailer brand is completely different from Ferguson brand,
  // the Web Retailer data is likely for a different product (key collision).
  // Example: SONNEMAN 3834.16 → Web_Retailer_Key CHELSEA:383416 → Palm Leaf Vase
  let webRetailerDataUnreliable = false;
  const fergusonBrand = (rawProduct as any).Ferguson_Brand || (rawProduct as any).Brand_Legacy || '';
  const webRetailerBrand = (rawProduct as any).Brand_Web_Retailer || '';
  if (fergusonBrand && webRetailerBrand) {
    const normFerguson = fergusonBrand.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normWebRetailer = webRetailerBrand.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Check if brands share any meaningful overlap (at least 3 consecutive chars)
    const shorter = normFerguson.length <= normWebRetailer.length ? normFerguson : normWebRetailer;
    const longer = normFerguson.length > normWebRetailer.length ? normFerguson : normWebRetailer;
    let hasOverlap = false;
    for (let i = 0; i <= shorter.length - 3; i++) {
      if (longer.includes(shorter.substring(i, i + 3))) {
        hasOverlap = true;
        break;
      }
    }
    if (!hasOverlap && normFerguson.length >= 3 && normWebRetailer.length >= 3) {
      webRetailerDataUnreliable = true;
      logger.warn('⚠️ WEB RETAILER BRAND MISMATCH: Data may be for a different product', {
        fergusonBrand,
        webRetailerBrand,
        webRetailerKey: (rawProduct as any).Web_Retailer_Key || 'N/A',
        action: 'Marking Web Retailer fields as unreliable'
      });
    }
  }
  
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
    
    // FILTER 4: If Web Retailer brand mismatch detected, annotate those fields
    if (webRetailerDataUnreliable && key.includes('Web_Retailer') && value) {
      sanitized[key] = `⚠️ UNRELIABLE (brand mismatch: Ferguson="${fergusonBrand}" vs WebRetailer="${webRetailerBrand}" — likely different product): ${value}`;
      continue;
    }
    
    // Keep all legitimate input data (Ferguson, Web_Retailer, Legacy, etc.)
    sanitized[key] = value;
  }
  
  return sanitized;
}

/**
 * Build a MINIMAL user message for Stage 1 (department) and Stage 2 (category) prompts.
 * 
 * ROOT CAUSE FIX: OpenAI was ignoring the department-only system prompt because
 * buildAnalysisPrompt() sends a massive user message starting with "You are a product
 * data VERIFICATION specialist... provide a value for EVERY field..." which OpenAI
 * prioritizes over the system prompt. This caused OpenAI to return full product analysis
 * (product_title, brand, category, type, etc.) instead of just {department: {...}}.
 * 
 * xAI/Grok followed the system prompt correctly, but OpenAI consistently failed all 3 retries.
 * 
 * This function sends ONLY the sanitized product data with a brief instruction,
 * letting the system prompt control the response format.
 */
function buildStagePrompt(rawProduct: SalesforceIncomingProduct, stage: 'department-only' | 'category-only'): string {
  const cleanProductData = sanitizeProductDataForAI(rawProduct);
  
  // Truncate very long field values to reduce token waste on early stages
  const trimmedData: any = {};
  for (const [key, value] of Object.entries(cleanProductData)) {
    if (typeof value === 'string' && value.length > 500) {
      trimmedData[key] = (value as string).substring(0, 500) + '...[truncated]';
    } else {
      trimmedData[key] = value;
    }
  }
  
  const stageLabel = stage === 'department-only' ? 'DEPARTMENT' : 'CATEGORY';
  
  return `Analyze this product and determine its ${stageLabel}. Follow the system instructions exactly.

RAW PRODUCT DATA:
${JSON.stringify(trimmedData, null, 2)}`;
}

function buildAnalysisPrompt(rawProduct: SalesforceIncomingProduct, options?: PromptOptions | string): string {
  // Support legacy signature: buildAnalysisPrompt(rawProduct, researchContext)
  const opts: PromptOptions = typeof options === 'string' 
    ? { researchContext: options }
    : (options || {});
    
  const { researchContext, modelMismatchWarning, externalDataTrusted = true, dataCoherenceWarnings, canadianDataContext } = opts;
  
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

  // Add Canadian data context if applicable
  if (canadianDataContext?.isCanadianData) {
    prompt += `

=== 🇨🇦 CANADIAN PRODUCT DATA - CONVERSIONS APPLIED ===
Web Retailer Key: ${canadianDataContext.webRetailerKey} (Canadian source detected)

**IMPORTANT: The MSRP and Weight values shown above have been CONVERTED to US market standards:**

${canadianDataContext.msrpConversion ? `📊 MSRP Conversion:\n   ${canadianDataContext.msrpConversion}\n   Exchange Rate: 1 CAD = ${canadianDataContext.exchangeRate} USD\n` : ''}${canadianDataContext.weightConversion ? `⚖️  Weight Conversion:\n   ${canadianDataContext.weightConversion}\n   Conversion: 1 kg = ${canadianDataContext.conversionFactor} lbs\n` : ''}
**The values in MSRP_Web_Retailer and Weight_Web_Retailer fields are ALREADY CONVERTED to USD and lbs.**
**Use these converted values directly - do NOT convert them again.**

${rawProduct.Ferguson_Price ? '**Ferguson data (always US market) for validation:**\n' + `   Ferguson MSRP: $${rawProduct.Ferguson_Price} USD\n` + '   → Compare converted Web Retailer values to Ferguson for quality check\n' : ''}
=== END CANADIAN DATA CONTEXT ===\n`;
  }

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
  
  // RULE 2: Outdoor cooking burner misclassified as Fire Pit Accessory
  // Drop-in/single/side burners are gas cooking appliances → Cooktop, NOT Fire Pit Accessory
  if (normalizedCategory === 'fire pit accessory') {
    const cookingBurnerPatterns = [
      /side.?burner/i,
      /single.?burner/i,
      /drop.?in.*burner/i,
      /outdoor.*cooktop/i,
      /grill.*burner/i,
      /sear.?burner/i,
      /infrared.?burner/i,
    ];
    const combinedText2 = `${title} ${description}`.toLowerCase();
    const isOutdoorCookingBurner = cookingBurnerPatterns.some(p => p.test(combinedText2));
    if (isOutdoorCookingBurner) {
      return {
        isValid: false,
        correctedCategory: 'Cooktop',
        correctedType: 'Gas',
        reason: 'Product is an outdoor gas cooking burner (side/drop-in burner), not a fire pit accessory. Gas cooking appliances = Cooktop.',
        violatedRule: 'OUTDOOR_COOKTOP_VS_FIRE_PIT_ACCESSORY'
      };
    }
  }

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
    categoryAgreed: categoriesMatch,
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
  
  // Fallback: Search Ferguson_Raw_Data.product.specifications (nested object)
  // This catches cases where Ferguson_Attributes flat array doesn't exist but
  // the rich Ferguson_Raw_Data payload has the value in its specifications object
  if (result.value === null && (rawProduct as any).Ferguson_Raw_Data?.product?.specifications) {
    const specs = (rawProduct as any).Ferguson_Raw_Data.product.specifications;
    for (const [specKey, specObj] of Object.entries(specs)) {
      if (!specObj || typeof specObj !== 'object') continue;
      const specValue = (specObj as any).value;
      if (!specValue || String(specValue).trim() === '') continue;
      
      const normalizedSpecKey = specKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedSpecKeySpaced = specKey.toLowerCase().replace(/_/g, ' ').trim();
      
      if (normalizedSpecKey === normalizedFieldKey ||
          normalizedSpecKeySpaced === normalizedFieldKeySpaced ||
          normalizedSpecKey === normalizeAttrName(attributeName) ||
          normalizedAliases.includes(normalizedSpecKeySpaced) ||
          normalizedAliases.includes(normalizedSpecKey)) {
        result = { value: String(specValue).trim(), matchedFrom: `FergusonSpecs:${specKey}` };
        logger.debug('Top15 found in Ferguson_Raw_Data.product.specifications', {
          fieldKey, specKey, value: specValue
        });
        break;
      }
    }
  }
  
  // Fallback: Search Ferguson_Raw_Data.product.feature_groups
  if (result.value === null && (rawProduct as any).Ferguson_Raw_Data?.product?.feature_groups) {
    const featureGroups = (rawProduct as any).Ferguson_Raw_Data.product.feature_groups;
    for (const group of featureGroups) {
      if (!group.features || !Array.isArray(group.features)) continue;
      const converted = group.features
        .filter((f: any) => f.name && f.value)
        .map((f: any) => ({ name: f.name, value: String(f.value) }));
      const groupResult = findInArray(converted, `FergusonFeatureGroup:${group.name}`);
      if (groupResult.value !== null) {
        result = groupResult;
        break;
      }
    }
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

  const brand = getFieldByPriority(category, rawProduct.Brand_Web_Retailer, rawProduct.Ferguson_Brand, 'Unknown');
  const modelNum = getFieldByPriority(category, rawProduct.Model_Number_Web_Retailer, rawProduct.Ferguson_Model_Number, 'Unknown');

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
 * Normalize installation type to standard values
 * ONLY fixes typos and casing, does NOT change semantic meaning
 * Also handles comma-separated combined values by picking the first valid one
 */
function normalizeInstallationType(value: string | undefined | null): string {
  if (!value) return '';
  
  // Handle combined values with comma OR "or" separator (e.g., "Built-In, Free Standing" or "Freestanding or Built-In")
  // ALWAYS prefer Built-In if it's one of the options (Built-In is primary for dual-capability products)
  if (value.includes(',') || value.toLowerCase().includes(' or ')) {
    // Split on comma or " or " (case insensitive)
    const parts = value.split(/,|\s+or\s+/i).map(p => p.trim());
    const validTypes = getValidInstallationTypes();
    
    // PRIORITY: If "Built-In" is in the list, ALWAYS use it (primary installation type)
    for (const part of parts) {
      const normalizedPart = normalizeInstallationType(part); // Recursive
      if (normalizedPart === 'Built-In') {
        return 'Built-In'; // ALWAYS prefer Built-In
      }
    }
    
    // Otherwise, try each part and return first valid one
    for (const part of parts) {
      const normalizedPart = normalizeInstallationType(part); // Recursive
      if (validTypes.includes(normalizedPart)) {
        return normalizedPart; // Return first valid one
      }
    }
    
    // If none are valid, use the first part (at least consistent behavior)
    return normalizeInstallationType(parts[0]);
  }
  
  const normalized = value.trim().toLowerCase();
  
  // Map ONLY typos and casing variations - NO semantic changes
  const installTypeMap: { [key: string]: string } = {
    // Built-In variations (casing only)
    'built in': 'Built-In',
    'built-in': 'Built-In',
    'builtin': 'Built-In',
    
    // Freestanding variations
    'freestanding': 'Freestanding',
    'free standing': 'Freestanding',
    'free-standing': 'Freestanding',
    
    // Slide-In variations
    'slide in': 'Slide-In',
    'slide-in': 'Slide-In',
    'slidein': 'Slide-In',
    
    // Drop-In variations
    'drop in': 'Drop-In',
    'drop-in': 'Drop-In',
    'dropin': 'Drop-In',
    
    // Counter-Depth variations
    'counter depth': 'Counter-Depth',
    'counter-depth': 'Counter-Depth',
    'counterdepth': 'Counter-Depth',
    
    // Wall Mount variations
    'wall mount': 'Wall Mount',
    'wall-mount': 'Wall Mount',
    'wallmount': 'Wall Mount',
    
    // Under Cabinet variations
    'under cabinet': 'Under Cabinet',
    'under-cabinet': 'Under Cabinet',
    'undercabinet': 'Under Cabinet',
    
    // Island Mount variations
    'island mount': 'Island Mount',
    'island-mount': 'Island Mount',
    
    // Deck Mount variations
    'deck mount': 'Deck Mount',
    'deck-mount': 'Deck Mount',
    
    // Floor Mount variations
    'floor mount': 'Floor Mount',
    'floor-mount': 'Floor Mount',
    
    // Undercounter variations (KEEP as separate value)
    'undercounter': 'Undercounter',
    'under counter': 'Undercounter',
    'under-counter': 'Undercounter'
  };
  
  return installTypeMap[normalized] || value; // Return mapped value or original if no match
}

/**
 * Get valid installation types for appliances
 * These are the standard Salesforce picklist values
 */
function getValidInstallationTypes(): string[] {
  return [
    'Built-In',
    'Freestanding',
    'Slide-In',
    'Drop-In',
    'Counter-Depth',
    'Wall Mount',
    'Under Cabinet',
    'Island Mount',
    'Deck Mount',
    'Floor Mount',
    'Undercounter',
    'Widespread',
    'Single Hole',
    'Alcove',
    'Drop-In Tub',
    'Freestanding Tub',
    'Corner',
    'Undermount',
    'Topmount',
    'Farmhouse',
    'Integrated',
    'Semi-Recessed',
    'Vessel'
  ];
}

/**
 * Get valid finish values for appliances and fixtures
 * These are the standard Salesforce picklist values
 */
function getValidFinishes(): string[] {
  return [
    'Stainless Steel',
    'Black Stainless',
    'Black',
    'White',
    'Panel Ready',
    'Slate',
    'Bisque',
    'Matte Black',
    'Matte White',
    'Brushed Nickel',
    'Chrome',
    'Oil Rubbed Bronze',
    'Polished Nickel',
    'Venetian Bronze',
    'Champagne Bronze',
    'Brushed Gold',
    'Polished Brass',
    'Satin Nickel',
    'Stainless',
    'Copper',
    'Pewter',
    'Silver',
    'Bronze',
    'Gold',
    'Graphite',
    'Platinum'
  ];
}

/**
 * Normalize finish to standard values, extracting only the finish color/material
 * REMOVES descriptive phrases and extracts ONLY the finish keyword
 * Examples:
 *   "Black cabinet with stainless steel door frame" -> "Stainless Steel"
 *   "Stainless steel finish" -> "Stainless Steel"
 *   "black stainless" -> "Black Stainless"
 */
function normalizeFinish(value: string | undefined | null): string {
  if (!value) return '';
  
  const normalized = value.trim().toLowerCase();
  const validFinishes = getValidFinishes();
  
  // Check if value is already a valid finish (case-insensitive match)
  for (const validFinish of validFinishes) {
    if (normalized === validFinish.toLowerCase()) {
      return validFinish;
    }
  }
  
  // Extract finish from descriptive phrases by looking for keywords
  // Priority order: Check for compound finishes first, then simple ones
  // CRITICAL: Multi-word finishes MUST be checked before single-word finishes to avoid truncation
  const finishKeywords = [
    { keywords: ['black stainless steel', 'black stainless'], finish: 'Black Stainless' },
    { keywords: ['stainless steel', 'stainless'], finish: 'Stainless Steel' },
    { keywords: ['oil rubbed bronze', 'oil-rubbed bronze', 'orb'], finish: 'Oil Rubbed Bronze' },
    { keywords: ['venetian bronze'], finish: 'Venetian Bronze' },
    { keywords: ['champagne bronze'], finish: 'Champagne Bronze' },
    { keywords: ['brushed nickel'], finish: 'Brushed Nickel' },
    { keywords: ['polished nickel'], finish: 'Polished Nickel' },
    { keywords: ['satin nickel'], finish: 'Satin Nickel' },
    { keywords: ['brushed gold'], finish: 'Brushed Gold' },
    { keywords: ['polished brass'], finish: 'Polished Brass' },
    { keywords: ['matte black'], finish: 'Matte Black' },
    { keywords: ['matte white'], finish: 'Matte White' },
    { keywords: ['white glass'], finish: 'White Glass' },  // Must be before 'white'
    { keywords: ['black glass'], finish: 'Black Glass' },  // Must be before 'black'
    { keywords: ['frosted glass'], finish: 'Frosted Glass' },
    { keywords: ['smoked glass'], finish: 'Smoked Glass' },
    { keywords: ['clear glass'], finish: 'Clear Glass' },
    { keywords: ['panel ready', 'panel-ready'], finish: 'Panel Ready' },
    { keywords: ['chrome', 'polished chrome'], finish: 'Chrome' },
    { keywords: ['slate'], finish: 'Slate' },
    { keywords: ['bisque'], finish: 'Bisque' },
    { keywords: ['copper'], finish: 'Copper' },
    { keywords: ['pewter'], finish: 'Pewter' },
    { keywords: ['silver'], finish: 'Silver' },
    { keywords: ['bronze'], finish: 'Bronze' },
    { keywords: ['gold'], finish: 'Gold' },
    { keywords: ['graphite'], finish: 'Graphite' },
    { keywords: ['platinum'], finish: 'Platinum' },
    { keywords: ['black'], finish: 'Black' },
    { keywords: ['white'], finish: 'White' },
    { keywords: ['glass'], finish: 'Glass' }  // Catch-all for unspecified glass
  ];
  
  // Search for finish keywords in the descriptive text
  for (const { keywords, finish } of finishKeywords) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return finish;
      }
    }
  }
  
  // Reject style values that are NOT finishes (AI sometimes confuses style/finish)
  const styleNotFinish = new Set([
    'modern', 'contemporary', 'traditional', 'transitional', 'industrial',
    'rustic', 'farmhouse', 'mid-century', 'minimalist', 'bohemian',
    'coastal', 'craftsman', 'art deco', 'victorian', 'scandinavian'
  ]);
  if (styleNotFinish.has(normalized)) {
    return '';
  }

  // If no keywords found, return original trimmed value (fallback)
  return value.trim();
}

/**
 * Smart prefer AI value - validates FIRST, then uses confidence
 * Prefers the AI that gives a VALID value over one that doesn't
 */
function smartPreferAIValue(
  consensusValue: any,
  openaiValue: any,
  xaiValue: any,
  openaiConfidence: number,
  xaiConfidence: number,
  fallback: any,
  validValues?: string[]
): any {
  // If consensus exists, use it
  if (consensusValue !== undefined && consensusValue !== null && consensusValue !== '') {
    return consensusValue;
  }
  
  // If no validation list provided, use old logic
  if (!validValues) {
    if (openaiValue && xaiValue) {
      return openaiConfidence >= xaiConfidence ? openaiValue : xaiValue;
    } else if (openaiValue) {
      return openaiValue;
    } else if (xaiValue) {
      return xaiValue;
    }
    return fallback;
  }
  
  // VALIDATION-FIRST LOGIC: Check which AI gave valid value
  const openaiValid = openaiValue && validValues.includes(openaiValue);
  const xaiValid = xaiValue && validValues.includes(xaiValue);
  
  // Both valid → use confidence as tiebreaker
  if (openaiValid && xaiValid) {
    return openaiConfidence >= xaiConfidence ? openaiValue : xaiValue;
  }
  
  // Only one valid → use the valid one regardless of confidence
  if (openaiValid && !xaiValid) {
    return openaiValue;
  }
  if (xaiValid && !openaiValid) {
    return xaiValue;
  }
  
  // Neither valid → use confidence (might need normalization later)
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
    model_used: config.xai?.visionModel || 'grok-3', // Current model used
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

  // Only skip primary dimension fields that are already captured in dedicated output fields
  const skipPrimaryFields = new Set([
    'height', 'width', 'depth', 'weight', 'product weight', 'nominal width', 'nominal height',
    'overall height', 'overall width', 'overall depth', 'shipping weight'
  ]);

  for (const attr of rawProduct.Ferguson_Attributes) {
    // Skip empty values
    if (!attr.value || attr.value.trim() === '') continue;
    
    // Skip if already used in Top Filter
    if (isUsedInTopFilters(attr.name)) continue;
    
    // Skip dimension/weight fields already captured in Primary Attributes
    const normalizedName = attr.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    if (skipPrimaryFields.has(normalizedName)) continue;
    
    // Include ALL remaining attributes — no allowlist restriction
    unusedAttrs[attr.name] = attr.value;
  }

  return unusedAttrs;
}

/**
 * Extract ALL attributes from Ferguson_Raw_Data nested structures (specifications + feature_groups)
 * that are not already captured in primary attributes, top 15, or Ferguson_Attributes flat array.
 * These get merged into the HTML additional attributes table.
 */
function extractNestedFergusonAttributes(
  rawProduct: SalesforceIncomingProduct,
  topFilterAttributes: TopFilterAttributes
): Record<string, string> {
  const nestedAttrs: Record<string, string> = {};
  const frd = (rawProduct as any).Ferguson_Raw_Data;
  
  if (!frd?.product) return nestedAttrs;
  
  const p = frd.product;
  const specs = p.specifications || {};
  const featureGroups: any[] = p.feature_groups || [];

  // Build a set of attribute names already captured in Ferguson_Attributes flat array
  // so we don't duplicate them
  const flatAttrNames = new Set<string>();
  if (rawProduct.Ferguson_Attributes && Array.isArray(rawProduct.Ferguson_Attributes)) {
    for (const attr of rawProduct.Ferguson_Attributes) {
      if (attr.name) {
        flatAttrNames.add(attr.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim());
      }
    }
  }
  
  // Skip primary dimension/identification fields already captured in dedicated output fields
  const skipFields = new Set([
    'height', 'width', 'depth', 'weight', 'product weight', 'nominal width', 'nominal height',
    'overall height', 'overall width', 'overall depth', 'shipping weight', 'length',
    'extension', 'diameter', 'brand', 'model number', 'name', 'price', 'description',
    'url', 'image', 'upc', 'gtin'
  ]);
  
  // Helper to check if attribute is already in Top 15
  const isUsedInTopFilters = (attrName: string): boolean => {
    const normalizedSearch = attrName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    for (const [key, value] of Object.entries(topFilterAttributes)) {
      if (value && value !== '' && value !== 'Not Found') {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        if (normalizedKey.includes(normalizedSearch) || normalizedSearch.includes(normalizedKey)) {
          return true;
        }
      }
    }
    return false;
  };
  
  // Helper: format spec key to readable name (snake_case → Title Case)
  const formatSpecKey = (key: string): string => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  };
  
  // --- Extract from specifications object ---
  for (const [specKey, specObj] of Object.entries(specs)) {
    if (!specObj || typeof specObj !== 'object') continue;
    const specValue = (specObj as any).value;
    if (!specValue || String(specValue).trim() === '') continue;
    
    const normalizedKey = specKey.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/_/g, ' ').trim();
    
    // Skip if it's a primary field, already in flat array, or used in top 15
    if (skipFields.has(normalizedKey)) continue;
    if (flatAttrNames.has(normalizedKey)) continue;
    if (isUsedInTopFilters(specKey.replace(/_/g, ' '))) continue;
    
    const units = (specObj as any).units ? ` ${(specObj as any).units}` : '';
    const displayName = formatSpecKey(specKey);
    nestedAttrs[displayName] = `${String(specValue).trim()}${units}`.trim();
  }
  
  // --- Extract from feature_groups ---
  for (const group of featureGroups) {
    if (!group.features || !Array.isArray(group.features)) continue;
    for (const feat of group.features) {
      if (!feat.name || !feat.value || String(feat.value).trim() === '') continue;
      
      const normalizedName = feat.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      
      // Skip if primary field, already in flat array, or used in top 15
      if (skipFields.has(normalizedName)) continue;
      if (flatAttrNames.has(normalizedName)) continue;
      if (isUsedInTopFilters(feat.name)) continue;
      
      // Don't overwrite if already extracted from specifications
      if (!nestedAttrs[feat.name]) {
        nestedAttrs[feat.name] = String(feat.value).trim();
      }
    }
  }
  
  return nestedAttrs;
}

/**
 * Get ALL unused Web Retailer attributes that are not already captured
 * in primary attributes or top 15 filter attributes.
 * Mirrors getUnusedFergusonAttributes but for Web_Retailer_Specs.
 */
function getUnusedWebRetailerAttributes(
  rawProduct: SalesforceIncomingProduct,
  topFilterAttributes: TopFilterAttributes
): Record<string, string> {
  const unusedAttrs: Record<string, string> = {};
  
  if (!rawProduct.Web_Retailer_Specs || !Array.isArray(rawProduct.Web_Retailer_Specs)) {
    return unusedAttrs;
  }

  // Helper to check if attribute is used in Top Filter Attributes
  const isUsedInTopFilters = (attrName: string): boolean => {
    const normalizedSearch = attrName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    
    for (const [key, value] of Object.entries(topFilterAttributes)) {
      if (value && value !== '' && value !== 'Not Found') {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        
        if (normalizedKey.includes(normalizedSearch) || normalizedSearch.includes(normalizedKey)) {
          return true;
        }
      }
    }
    return false;
  };

  // Skip primary dimension fields already captured in dedicated output fields
  const skipPrimaryFields = new Set([
    'height', 'width', 'depth', 'weight', 'product weight', 'nominal width', 'nominal height',
    'overall height', 'overall width', 'overall depth', 'shipping weight'
  ]);

  for (const attr of rawProduct.Web_Retailer_Specs) {
    if (!attr.value || attr.value.trim() === '') continue;
    if (isUsedInTopFilters(attr.name)) continue;
    
    const normalizedName = attr.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    if (skipPrimaryFields.has(normalizedName)) continue;
    
    // Include ALL remaining attributes
    unusedAttrs[attr.name] = attr.value;
  }

  return unusedAttrs;
}

/**
 * Extract key-value pairs from the Specification_Table HTML.
 * This HTML table from Salesforce contains manufacturer specs that may not
 * appear in Web_Retailer_Specs or Ferguson_Attributes arrays.
 * Returns attributes not already captured in primary or top 15.
 */
function extractSpecificationTableAttributes(
  rawProduct: SalesforceIncomingProduct,
  topFilterAttributes: TopFilterAttributes
): Record<string, string> {
  const specAttrs: Record<string, string> = {};
  
  const htmlTable = rawProduct.Specification_Table;
  if (!htmlTable || htmlTable.trim() === '') return specAttrs;
  
  // Build set of already-known attribute names from Web_Retailer_Specs + Ferguson_Attributes
  const knownAttrNames = new Set<string>();
  if (rawProduct.Web_Retailer_Specs && Array.isArray(rawProduct.Web_Retailer_Specs)) {
    for (const attr of rawProduct.Web_Retailer_Specs) {
      if (attr.name) knownAttrNames.add(attr.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim());
    }
  }
  if (rawProduct.Ferguson_Attributes && Array.isArray(rawProduct.Ferguson_Attributes)) {
    for (const attr of rawProduct.Ferguson_Attributes) {
      if (attr.name) knownAttrNames.add(attr.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim());
    }
  }
  
  const skipFields = new Set([
    'height', 'width', 'depth', 'weight', 'product weight', 'nominal width', 'nominal height',
    'overall height', 'overall width', 'overall depth', 'shipping weight', 'brand', 'model number',
    'upc', 'gtin', 'price', 'msrp'
  ]);
  
  const isUsedInTopFilters = (attrName: string): boolean => {
    const normalizedSearch = attrName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    for (const [key, value] of Object.entries(topFilterAttributes)) {
      if (value && value !== '' && value !== 'Not Found') {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        if (normalizedKey.includes(normalizedSearch) || normalizedSearch.includes(normalizedKey)) {
          return true;
        }
      }
    }
    return false;
  };
  
  const addSpec = (key: string, value: string): void => {
    if (!key || !value) return;
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    if (skipFields.has(normalizedKey)) return;
    if (knownAttrNames.has(normalizedKey)) return;
    if (isUsedInTopFilters(key)) return;
    if (!specAttrs[key]) {
      specAttrs[key] = value;
    }
  };
  
  try {
    // Pattern 1: <dt><strong>Label:</strong> Value</dt>
    const dtPattern = /<dt>\s*<strong>([^<]+):<\/strong>\s*([^<]*)<\/dt>/gi;
    let match;
    while ((match = dtPattern.exec(htmlTable)) !== null) {
      addSpec(match[1].trim(), match[2].trim());
    }
    
    // Pattern 2: <tr><td>Label</td><td>Value</td></tr>
    const trPattern = /<tr[^>]*>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<\/tr>/gi;
    while ((match = trPattern.exec(htmlTable)) !== null) {
      const key = match[1].replace(/<[^>]+>/g, '').trim();
      const value = match[2].replace(/<[^>]+>/g, '').trim();
      addSpec(key, value);
    }
    
    // Pattern 3: Label: Value (plain text with colon separator)
    const plainPattern = /(?:^|>)([A-Z][^:<>\n]{2,30}):\s*([^<>\n]{1,100})(?:<|$)/gim;
    while ((match = plainPattern.exec(htmlTable)) !== null) {
      addSpec(match[1].trim(), match[2].trim());
    }
  } catch {
    // If parsing fails, return what we have so far
  }
  
  return specAttrs;
}

async function buildFinalResponse(
  rawProduct: SalesforceIncomingProduct,
  consensus: ConsensusResult,
  sessionId: string,
  _processingTimeMs: number,
  openaiResult: AIAnalysisResult,
  xaiResult: AIAnalysisResult,
  determinedDepartment: string,
  determinedCategory: string,
  determinedType?: string,
  researchResult?: ResearchResult | null,
  dataSourceAnalysis?: DataSourceAnalysis,
  researchPerformed?: boolean,
  researchAttempts?: number,
  finalSearchResult?: FinalVerificationSearchResult | null
): Promise<SalesforceVerificationResponse> {
  
  // Track if research was performed for field marking
  const didResearch = researchPerformed || !!researchResult || !!finalSearchResult;
  
  // Get raw values for customer-facing text
  const rawBrand = consensus.agreedPrimaryAttributes.brand || getFieldByPriority(consensus.agreedCategory, rawProduct.Brand_Web_Retailer, rawProduct.Ferguson_Brand, '');
  
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
      rawDescription = getFieldByPriority(consensus.agreedCategory, rawProduct.Product_Description_Web_Retailer, rawProduct.Ferguson_Description, '');
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
  
  const normalizeTypeCandidate = (value?: string | null): string => String(value || '').trim();
  const isNAType = (value: string): boolean => /^(not applicable|n\/?a|not found|none)$/i.test(value.trim());
  const dedupeTypeCandidates = (candidates: string[]): string[] => {
    const seen = new Set<string>();
    return candidates.filter(candidate => {
      const key = candidate.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // If direct picklist match failed, try category-aware type matching with business-category hints
  // NOTE: Web_Retailer_SubCategory is often a CATEGORY name, not a TYPE - do not use as type candidate
  const subcategoryHint = rawProduct.Ferguson_Business_Category || '';
  const typeCandidates = dedupeTypeCandidates([
    normalizeTypeCandidate(determinedType),
    normalizeTypeCandidate(consensus.agreedPrimaryAttributes.product_type),
    normalizeTypeCandidate(openaiResult.primaryAttributes.product_type),
    normalizeTypeCandidate(xaiResult.primaryAttributes.product_type),
    normalizeTypeCandidate(rawProduct.Ferguson_Product_Type),
    // Web_Retailer_SubCategory REMOVED - it's a category, not a type (causes cross-contamination)
    normalizeTypeCandidate(rawProduct.Ferguson_Business_Category)
  ].filter(Boolean));

  // Prefer any concrete type over Not Found/Not Applicable, then fall back to any non-empty value
  let aiProductType = typeCandidates.find(candidate => !isNAType(candidate))
    || typeCandidates[0]
    || '';

  let typeMatchResult = picklistMatcher.matchType(aiProductType);
  if (!typeMatchResult.matched && aiProductType) {
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
      aiProductType = categoryAwareMatch.matchedValue.type_name;
    }
  }

  // Global fallback catch: if first candidate fails, iterate all available sources before using Not Found
  if (!typeMatchResult.matched) {
    for (const fallbackCandidate of typeCandidates) {
      if (!fallbackCandidate || fallbackCandidate.toLowerCase() === aiProductType.toLowerCase()) {
        continue;
      }

      const directFallback = picklistMatcher.matchType(fallbackCandidate);
      if (directFallback.matched) {
        aiProductType = fallbackCandidate;
        typeMatchResult = directFallback;
        logger.info('Resolved type using fallback candidate (direct picklist match)', {
          sessionId,
          verifiedCategory,
          chosenType: aiProductType,
          sourceCandidates: typeCandidates
        });
        break;
      }

      const categoryAwareFallback = matchTypeToPicklist(fallbackCandidate, verifiedCategory, subcategoryHint);
      if (categoryAwareFallback.matched && categoryAwareFallback.matchedValue) {
        aiProductType = categoryAwareFallback.matchedValue.type_name;
        typeMatchResult = {
          matched: true,
          original: fallbackCandidate,
          matchedValue: {
            type_id: categoryAwareFallback.matchedValue.type_id,
            type_name: categoryAwareFallback.matchedValue.type_name
          },
          similarity: categoryAwareFallback.confidence
        };
        logger.info('Resolved type using fallback candidate (category-aware match)', {
          sessionId,
          verifiedCategory,
          originalCandidate: fallbackCandidate,
          chosenType: aiProductType,
          sourceCandidates: typeCandidates
        });
        break;
      }
    }
  }
  
  logger.info('Type matching result', {
    sessionId,
    aiProductType,
    category: verifiedCategory,
    matched: typeMatchResult.matched,
    matchedTo: typeMatchResult.matchedValue?.type_name || null,
    similarity: typeMatchResult.similarity
  });

  // ──────────────────────────────────────────────────────────────────────
  // LIGHTED MIRROR SOURCE-TITLE OVERRIDE (Bathroom Mirror only)
  // ──────────────────────────────────────────────────────────────────────
  // The AI often defaults to "Wall Mirror" even when source titles explicitly
  // say "with LED Lighting", "with Light", "Lighted Mirror", etc.
  // Scan source titles here and upgrade to "Lighted" when any signal is found.
  // This runs AFTER normal type resolution so it only corrects, never downgrades.
  if (verifiedCategory === 'Bathroom Mirror' || verifiedCategory === 'Mirror') {
    const lightedMirrorPattern = /lighted\s+(?:wall\s+|bathroom\s+|vanity\s+)?mirror|led\s+(?:wall\s+|bathroom\s+|vanity\s+)?mirror|mirror\s+with\s+(?:led|integrated\s+led|built[\s-]+in\s+led)|mirror\s+with\s+(?:led\s+)?light(?:ing)?\b|(?:led|integrated|built[\s-]+in)\s+light(?:ing)?\s+(?:mirror|bathroom|vanity)|illuminated\s+mirror|backlit\s+mirror|back-lit\s+mirror|mirror\s+defog(?:ger)?/i;
    const sourceTitles = [
      rawProduct.Ferguson_Title,
      rawProduct.Product_Title_Web_Retailer,
      (rawProduct as any).Ferguson_Raw_Data?.product?.name,
      (rawProduct as any).Product_Description_Web_Retailer,
    ].filter(Boolean).join(' ');
    const currentType = typeMatchResult.matchedValue?.type_name || aiProductType || '';
    const isNotAlreadyLighted = !/lighted/i.test(currentType);
    if (isNotAlreadyLighted && lightedMirrorPattern.test(sourceTitles)) {
      const lightedType = getTypeByName('Lighted');
      if (lightedType) {
        const previousType = currentType;
        typeMatchResult = {
          matched: true,
          original: aiProductType,
          matchedValue: { type_id: lightedType.type_id, type_name: lightedType.type_name },
          similarity: 0.95
        };
        aiProductType = 'Lighted';
        logger.info('🔦 LIGHTED MIRROR OVERRIDE: source title signals LED/light — upgrading type to Lighted', {
          sessionId,
          verifiedCategory,
          previousType,
          newType: 'Lighted',
          matchedPattern: 'source title lighted mirror detector',
          sourceTitleSample: sourceTitles.substring(0, 120),
          productId: rawProduct.SF_Catalog_Id
        });
      }
    }
  }
  // ── end lighted mirror override ──────────────────────────────────────

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
  const productType = aiProductType || consensus.agreedPrimaryAttributes.product_type || '';
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

  // ═══════════════════════════════════════════════════════════════════════
  // VERIFIED DATA HIERARCHY — Department-Aware Source Ordering
  // ═══════════════════════════════════════════════════════════════════════
  // Priority: Titles (dept-aware) → Descriptions/Features (dept-aware) → Structured → Legacy
  // Appliances dept: Web Retailer first, Ferguson second
  // All other depts: Ferguson first, Web Retailer second
  // ═══════════════════════════════════════════════════════════════════════

  const isApplianceDept = isAppliancesCategory(consensus.agreedCategory);

  // Strip HTML tags to plain text for regex searching
  const stripHtml = (html: string | undefined | null): string => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  };

  // Ferguson_Raw_Data.product.name — rich product name from Ferguson API scraping
  // Used when Ferguson_Title (flat field from Salesforce) is empty
  const frdProductName = (!rawProduct.Ferguson_Title && (rawProduct as any).Ferguson_Raw_Data?.product?.name)
    ? String((rawProduct as any).Ferguson_Raw_Data.product.name).trim()
    : null;

  // Titles in department-priority order (raw text, no HTML)
  const deptTitles: string[] = isApplianceDept
    ? [rawProduct.Product_Title_Web_Retailer, rawProduct.Ferguson_Title || frdProductName].filter(Boolean) as string[]
    : [rawProduct.Ferguson_Title || frdProductName, rawProduct.Product_Title_Web_Retailer].filter(Boolean) as string[];

  // Descriptions in department-priority order (HTML stripped)
  const deptDescriptions: string[] = isApplianceDept
    ? [stripHtml(rawProduct.Product_Description_Web_Retailer), stripHtml(rawProduct.Ferguson_Description)].filter(Boolean)
    : [stripHtml(rawProduct.Ferguson_Description), stripHtml(rawProduct.Product_Description_Web_Retailer)].filter(Boolean);

  // Features in department-priority order (HTML stripped)
  const deptFeatures: string[] = isApplianceDept
    ? [stripHtml(rawProduct.Features_Web_Retailer), stripHtml(rawProduct.Features_Legacy)].filter(Boolean)
    : [stripHtml(rawProduct.Features_Legacy), stripHtml(rawProduct.Features_Web_Retailer)].filter(Boolean);

  // Legacy titles — absolute last resort
  const legacyTitles: string[] = [rawProduct.Product_Title_Legacy].filter(Boolean) as string[];

  // ═══════════════════════════════════════════════════════════════════════
  // UNIVERSAL TEXT EXTRACTORS
  // Search raw titles/descriptions/features for known values
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Search an array of texts for the first match from a list of known values.
   * Returns the canonical value (from knownValues) on match, or '' if not found.
   * Multi-word patterns are checked before single-word to avoid truncation.
   */
  const extractKnownValueFromTexts = (texts: string[], knownValues: string[]): string => {
    // Sort by length descending so "Brushed Nickel" matches before "Nickel"
    const sorted = [...knownValues].sort((a, b) => b.length - a.length);
    for (const text of texts) {
      if (!text) continue;
      const lower = text.toLowerCase();
      for (const val of sorted) {
        if (lower.includes(val.toLowerCase())) {
          return val;
        }
      }
    }
    return '';
  };

  /** Extract finish from texts using known picklist values + normalizeFinish keywords */
  const extractFinishFromTexts = (texts: string[]): string => {
    // Use the full normalizeFinish keyword set (broader than getValidFinishes)
    const finishValues = [
      'Black Stainless', 'Stainless Steel', 'Oil Rubbed Bronze', 'Venetian Bronze',
      'Champagne Bronze', 'Brushed Nickel', 'Polished Nickel', 'Satin Nickel',
      'Brushed Gold', 'Polished Brass', 'Matte Black', 'Matte White',
      'Panel Ready', 'Chrome', 'Slate', 'Bisque', 'Copper', 'Pewter',
      'Silver', 'Bronze', 'Gold', 'Graphite', 'Platinum', 'Black', 'White'
    ];
    return extractKnownValueFromTexts(texts, finishValues);
  };

  /** Extract installation type from texts using known picklist values */
  const extractInstallationFromTexts = (texts: string[]): string => {
    return extractKnownValueFromTexts(texts, getValidInstallationTypes());
  };

  /** Extract material from texts using known material values */
  const extractMaterialFromTexts = (texts: string[]): string => {
    const materials = [
      'Stainless Steel', 'Cast Iron', 'Fireclay', 'Vitreous China',
      'Porcelain', 'Ceramic', 'Composite', 'Granite Composite',
      'Acrylic', 'Solid Surface', 'Natural Stone', 'Marble', 'Quartz',
      'Copper', 'Brass', 'Glass', 'Wood', 'Bamboo', 'Zinc',
      'Aluminum', 'Iron', 'Steel', 'Plastic', 'Resin', 'Crystal'
    ];
    return extractKnownValueFromTexts(texts, materials);
  };

  /** Extract shape from texts using known shape values */
  const extractShapeFromTexts = (texts: string[]): string => {
    const shapes = [
      'Rectangular', 'Oval', 'Round', 'Square', 'D-Shape', 'D-Shaped',
      'Octagonal', 'Hexagonal', 'Arch', 'Arched'
    ];
    return extractKnownValueFromTexts(texts, shapes);
  };

  /** Extract configuration from texts using known configuration values */
  const extractConfigurationFromTexts = (texts: string[]): string => {
    const configs = [
      'Wine Column',  // Must be before 'Column' — most specific first
      'French Door', 'Side-by-Side', 'Side by Side', 'Top Freezer', 'Bottom Freezer',
      'Single Door', 'Double Door', 'Triple Door', 'Quad Door',
      'Single Oven', 'Double Oven', 'Combination', 'Convertible'
    ];
    return extractKnownValueFromTexts(texts, configs);
  };

  /** Extract fuel type from texts using known fuel type values */
  const extractFuelTypeFromTexts = (texts: string[]): string => {
    const fuelTypes = [
      'Dual Fuel', 'Natural Gas', 'Liquid Propane', 'LP Gas',
      'Gas', 'Electric', 'Induction', 'Propane'
    ];
    return extractKnownValueFromTexts(texts, fuelTypes);
  };

  /** Extract bowl shape from texts (Toilet / Toilet Seat) */
  const extractBowlShapeFromTexts = (texts: string[]): string => {
    const shapes = ['Elongated', 'Round-Front', 'Round Front', 'Round'];
    return extractKnownValueFromTexts(texts, shapes);
  };

  /** Extract flush type from texts (Toilet) */
  const extractFlushTypeFromTexts = (texts: string[]): string => {
    const flushTypes = [
      'Dual Flush', 'Dual-Flush', 'Single Flush', 'Pressure-Assisted',
      'Pressure Assisted', 'Gravity'
    ];
    return extractKnownValueFromTexts(texts, flushTypes);
  };

  /** Extract capacity from texts (e.g., "5.0 cu. ft.", "25.6 cu ft") */
  const extractCapacityFromTexts = (texts: string[]): string => {
    for (const text of texts) {
      if (!text) continue;
      const match = text.match(/(\d+(?:\.\d+)?)\s*(?:cu\.?\s*ft\.?|cubic\s*feet?)/i);
      if (match) return match[1];
    }
    return '';
  };

  // ── Dimension extraction from raw titles/descriptions ──────────────────
  // Raw titles often contain precise dimensions (e.g. '24" x 40"', '36" X 30"')
  // Uses department-aware ordering: dept titles first, then descriptions, then legacy
  const extractDimensionsFromText = (texts: (string | undefined)[]): { width: string; height: string; depth: string } => {
    for (const text of texts) {
      if (!text) continue;
      // Match patterns like: 24" x 40" x 1-3/4", 36" X 30", 24 x 30
      const m = text.match(/(\d+(?:[- ]\d+\/\d+)?(?:\.\d+)?)\s*"?\s*[xX×]\s*(\d+(?:[- ]\d+\/\d+)?(?:\.\d+)?)\s*"?(?:\s*[xX×]\s*(\d+(?:[- ]\d+\/\d+)?(?:\.\d+)?)\s*"?)?/);
      if (m) return { width: m[1].trim(), height: m[2].trim(), depth: m[3]?.trim() || '' };
    }
    return { width: '', height: '', depth: '' };
  };

  // Department-aware dimension extraction: dept titles → dept descriptions → legacy
  const titleDims = extractDimensionsFromText([
    ...deptTitles,
    ...deptDescriptions,
    ...legacyTitles,
  ]);

  // Get width from AI or verified sources
  // Fallback chain: AI → Title parse (dept-aware) → Structured (dept-aware) → Legacy
  const widthFinal = preferAIValue(
    consensus.agreedPrimaryAttributes.width,
    openaiResult.primaryAttributes.width,
    xaiResult.primaryAttributes.width,
    openaiResult.confidence,
    xaiResult.confidence,
    titleDims.width
      || getFieldByPriority(consensus.agreedCategory, rawProduct.Width_Web_Retailer, rawProduct.Ferguson_Width, '')
      || rawProduct.Width_Legacy || ''
  );
  
  // Get place settings from AI or text extraction (no structured field exists for this)
  const extractPlaceSettingsFromText = (text?: string): string => {
    if (!text) return '';
    const match = text.match(/(\d{1,2})\s+Place\s+Setting/i);
    return match ? match[1] : '';
  };

  // Extract GPM (Gallons Per Minute) from title text
  const extractGPMFromText = (text?: string): string => {
    if (!text) return '';
    const match = text.match(/(\d+\.?\d*)\s*GPM/i);
    return match ? match[1] : '';
  };

  // Extract CFM (Cubic Feet per Minute) from title text
  const extractCFMFromText = (text?: string): string => {
    if (!text) return '';
    const match = text.match(/(\d+)\s*CFM/i);
    return match ? match[1] : '';
  };

  // Extract BTU (British Thermal Units) from title text
  const extractBTUFromText = (text?: string): string => {
    if (!text) return '';
    const match = text.match(/([\d,]+)\s*BTU/i);
    return match ? match[1].replace(/,/g, '') : ''; // Remove commas
  };

  /**
   * Extract hole configuration from multiple sources with fallbacks
   * Priority: AI attributes → Ferguson title text → Type field inference
   */
  const extractHoleConfigForTitle = (
    topFilterAttributes: any,
    primaryAttributes: any,
    rawProduct: SalesforceIncomingProduct
  ): string => {
    // Check AI-extracted attributes (multiple field name variations)
    const aiHoleConfig = 
      topFilterAttributes.faucet_holes ||
      topFilterAttributes.number_of_faucet_holes ||
      topFilterAttributes.faucet_hole_size ||
      topFilterAttributes.hole_count ||
      topFilterAttributes.holes ||
      '';
    
    if (aiHoleConfig && aiHoleConfig !== 'N/A' && aiHoleConfig !== 'Not Found') {
      return String(aiHoleConfig);
    }

    // Extract from Ferguson title text (e.g., "Single Hole", "3-Hole", "3 Hole")
    const fergusonTitle = rawProduct.Ferguson_Title || '';
    const webRetailerTitle = rawProduct.Product_Title_Web_Retailer || '';
    
    const holePatterns = [
      /\b(Single)\s+Hole\b/i,
      /\b(1)[\s-]?Hole\b/i,
      /\b(2)[\s-]?Hole\b/i,
      /\b(3)[\s-]?Hole\b/i,
      /\b(4)[\s-]?Hole\b/i,
      /\b(5)[\s-]?Hole\b/i,
    ];

    for (const pattern of holePatterns) {
      const fergusonMatch = fergusonTitle.match(pattern);
      if (fergusonMatch) {
        const num = fergusonMatch[1];
        return num.toLowerCase() === 'single' || num === '1' ? 'Single Hole' : `${num}-Hole`;
      }
      
      const webMatch = webRetailerTitle.match(pattern);
      if (webMatch) {
        const num = webMatch[1];
        return num.toLowerCase() === 'single' || num === '1' ? 'Single Hole' : `${num}-Hole`;
      }
    }

    // Infer from Type field: "Single Handle" → "Single Hole"
    const productType = primaryAttributes.AI_Type || '';
    if (productType.toLowerCase().includes('single handle')) {
      return 'Single Hole';
    }

    return '';
  };
  
  // Place settings: AI → dept titles → dept descriptions → legacy
  const placeSettingsFinal = preferAIValue(
    consensus.agreedTop15Attributes?.place_settings,
    openaiResult.top15Attributes?.place_settings,
    xaiResult.top15Attributes?.place_settings,
    openaiResult.confidence,
    xaiResult.confidence,
    ''
  ) || 
  (() => { for (const t of deptTitles) { const v = extractPlaceSettingsFromText(t); if (v) return v; } return ''; })() ||
  (() => { for (const t of deptDescriptions) { const v = extractPlaceSettingsFromText(t); if (v) return v; } return ''; })() ||
  '';

  // GPM: AI → dept titles → dept descriptions → structured
  const gpmFinal = preferAIValue(
    consensus.agreedTop15Attributes?.gpm,
    openaiResult.top15Attributes?.gpm,
    xaiResult.top15Attributes?.gpm,
    openaiResult.confidence,
    xaiResult.confidence,
    ''
  ) ||
  (() => { for (const t of deptTitles) { const v = extractGPMFromText(t); if (v) return v; } return ''; })() ||
  (() => { for (const t of deptDescriptions) { const v = extractGPMFromText(t); if (v) return v; } return ''; })() ||
  rawProduct.GPM || '';

  // CFM: AI → dept titles → dept descriptions → structured
  const cfmFinal = preferAIValue(
    consensus.agreedTop15Attributes?.cfm,
    openaiResult.top15Attributes?.cfm,
    xaiResult.top15Attributes?.cfm,
    openaiResult.confidence,
    xaiResult.confidence,
    ''
  ) ||
  (() => { for (const t of deptTitles) { const v = extractCFMFromText(t); if (v) return v; } return ''; })() ||
  (() => { for (const t of deptDescriptions) { const v = extractCFMFromText(t); if (v) return v; } return ''; })() ||
  rawProduct.CFM || '';

  // BTU: AI → dept titles → dept descriptions → structured
  const btuFinal = preferAIValue(
    consensus.agreedTop15Attributes?.btu,
    openaiResult.top15Attributes?.btu,
    xaiResult.top15Attributes?.btu,
    openaiResult.confidence,
    xaiResult.confidence,
    ''
  ) ||
  (() => { for (const t of deptTitles) { const v = extractBTUFromText(t); if (v) return v; } return ''; })() ||
  (() => { for (const t of deptDescriptions) { const v = extractBTUFromText(t); if (v) return v; } return ''; })() ||
  rawProduct.BTU || '';
  
  // Log width source for debugging
  if (widthFinal) {
    const widthSource = consensus.agreedPrimaryAttributes.width || openaiResult.primaryAttributes.width || xaiResult.primaryAttributes.width 
      ? 'AI' 
      : (rawProduct.Width_Web_Retailer ? 'Width_Web_Retailer' : (rawProduct.Ferguson_Width ? 'Ferguson_Width' : 'unknown'));
    logger.info('Width determined for title from structured fields', {
      sessionId,
      width: widthFinal,
      source: widthSource,
      category: consensus.agreedCategory,
      widthWebRetailer: rawProduct.Width_Web_Retailer || 'not provided',
      fergusonWidth: rawProduct.Ferguson_Width || 'not provided'
    });
  } else {
    logger.warn('Width NOT available for title generation', {
      sessionId,
      category: consensus.agreedCategory,
      widthWebRetailer: rawProduct.Width_Web_Retailer || 'not provided',
      fergusonWidth: rawProduct.Ferguson_Width || 'not provided',
      aiWidth: consensus.agreedPrimaryAttributes.width || openaiResult.primaryAttributes.width || xaiResult.primaryAttributes.width || 'not extracted'
    });
  }
  
  // ===========================================
  // PANEL READY DETECTION
  // Detect if appliance is panel-ready, integrated, or fully integrated
  // Used for dishwashers, refrigerators, ice makers, etc.
  // ===========================================
  const installationTypeLower = String(
    consensus.agreedTop15Attributes?.installation_type || 
    openaiResult.top15Attributes?.installation_type || 
    xaiResult.top15Attributes?.installation_type || ''
  ).toLowerCase();
  
  const combinedTextForPanelReady = [
    rawProduct.Product_Description_Web_Retailer || '',
    rawProduct.Ferguson_Description || '',
    rawProduct.Product_Title_Web_Retailer || '',
    rawProduct.Ferguson_Title || '',
    rawProduct.Features_Web_Retailer || ''
  ].join(' ').toLowerCase();
  
  let panelReadyValue = '';
  if (
    installationTypeLower.includes('panel ready') ||
    installationTypeLower.includes('panel-ready') ||
    installationTypeLower.includes('integrated') ||
    installationTypeLower.includes('fully integrated') ||
    combinedTextForPanelReady.includes('panel ready') ||
    combinedTextForPanelReady.includes('panel-ready') ||
    combinedTextForPanelReady.includes('custom panel') ||
    combinedTextForPanelReady.includes('fully integrated')
  ) {
    panelReadyValue = 'Panel Ready';
    logger.info('Panel Ready detected for title', {
      sessionId,
      category: consensus.agreedCategory,
      source: installationTypeLower.includes('panel') || installationTypeLower.includes('integrated') 
        ? 'installation_type' 
        : 'product_description'
    });
  }
  
  // ===========================================
  // REFRIGERATOR DEPTH/INSTALLATION LOGIC
  // Built-In: always counter-depth (don't mention depth)
  // Freestanding + Counter-Depth: show "Counter-Depth" (don't show Freestanding - implied)
  // Freestanding + Standard Depth: show nothing (both implied)
  // ===========================================
  const categoryLowerForDepth = (consensus.agreedCategory || '').toLowerCase();
  const isRefrigeratorCategory = categoryLowerForDepth.includes('refrigerator') || categoryLowerForDepth.includes('freezer');
  
  let depthTypeValue = '';
  let installationTypeForTitle = '';
  
  if (isRefrigeratorCategory) {
    // Detect built-in
    const isBuiltIn = 
      installationTypeLower.includes('built-in') ||
      installationTypeLower.includes('built in') ||
      combinedTextForPanelReady.includes('built-in refrigerator') ||
      combinedTextForPanelReady.includes('built in refrigerator');
    
    // Detect counter-depth
    const isCounterDepth = 
      installationTypeLower.includes('counter-depth') ||
      installationTypeLower.includes('counter depth') ||
      combinedTextForPanelReady.includes('counter-depth') ||
      combinedTextForPanelReady.includes('counter depth');
    
    if (isBuiltIn) {
      // Built-in: show "Built-In", no depth (always counter-depth - implied)
      installationTypeForTitle = 'Built-In';
      depthTypeValue = ''; // Don't show - built-ins are always counter-depth
      logger.info('Refrigerator detected as Built-In (depth omitted - implied counter-depth)', {
        sessionId,
        category: consensus.agreedCategory
      });
    } else if (isCounterDepth) {
      // Freestanding + Counter-Depth: show "Counter-Depth", no "Freestanding" (implied)
      installationTypeForTitle = ''; // Don't show Freestanding - implied
      depthTypeValue = 'Counter-Depth';
      logger.info('Refrigerator detected as Freestanding Counter-Depth', {
        sessionId,
        category: consensus.agreedCategory
      });
    } else {
      // Freestanding + Standard Depth: show nothing (both implied)
      installationTypeForTitle = '';
      depthTypeValue = '';
      logger.info('Refrigerator detected as Freestanding Standard Depth (both omitted - implied)', {
        sessionId,
        category: consensus.agreedCategory
      });
    }
  }
  
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
    rawTitle: rawProduct.Product_Title_Web_Retailer || 
              rawProduct.Ferguson_Title || 
              consensus.agreedPrimaryAttributes.product_title || 
              openaiResult.primaryAttributes.product_title || 
              xaiResult.primaryAttributes.product_title || 
              '', // For accessory subtype extraction - use AI title as fallback if raw titles empty
    
    // Dimensions — AI → Title parse (dept-aware) → Structured (dept-aware) → Legacy
    width: widthFinal,
    height: preferAIValue(
      consensus.agreedPrimaryAttributes.height,
      openaiResult.primaryAttributes.height,
      xaiResult.primaryAttributes.height,
      openaiResult.confidence,
      xaiResult.confidence,
      titleDims.height
        || getFieldByPriority(consensus.agreedCategory, rawProduct.Height_Web_Retailer, rawProduct.Ferguson_Height, '')
        || rawProduct.Height_Legacy || ''
    ),
    depth: preferAIValue(
      consensus.agreedPrimaryAttributes.depth,
      openaiResult.primaryAttributes.depth,
      xaiResult.primaryAttributes.depth,
      openaiResult.confidence,
      xaiResult.confidence,
      titleDims.depth
        || getFieldByPriority(consensus.agreedCategory, rawProduct.Depth_Web_Retailer, rawProduct.Ferguson_Depth, '')
        || rawProduct.Depth_Legacy || ''
    ),
    
    // Style/Type
    style: styleToUse || '',
    type: typeMatchResult.matched && typeMatchResult.matchedValue 
      ? typeMatchResult.matchedValue.type_name 
      : (aiProductType || ''),  // Use matched type or AI value
    configuration: preferAIValue(
      consensus.agreedTop15Attributes?.configuration || consensus.agreedPrimaryAttributes.configuration,
      openaiResult.top15Attributes?.configuration || openaiResult.primaryAttributes.configuration,
      xaiResult.top15Attributes?.configuration || xaiResult.primaryAttributes.configuration,
      openaiResult.confidence,
      xaiResult.confidence,
      // Fallback: titles → descriptions/features → ''
      extractConfigurationFromTexts(deptTitles) || extractConfigurationFromTexts(deptDescriptions) || extractConfigurationFromTexts(deptFeatures) || ''
    ),
    
    // Appearance — AI → Title extract (dept-aware) → Desc/Features extract → Structured → ''
    finish: normalizeFinish(
      smartPreferAIValue(
        consensus.agreedPrimaryAttributes.finish,
        openaiResult.primaryAttributes.finish,
        xaiResult.primaryAttributes.finish,
        openaiResult.confidence,
        xaiResult.confidence,
        // Fallback: titles → descriptions/features → Ferguson_Finish structured field
        extractFinishFromTexts(deptTitles) || extractFinishFromTexts(deptDescriptions) || extractFinishFromTexts(deptFeatures)
          || rawProduct.Ferguson_Finish || '',
        getValidFinishes()
      )
    ),
    color: preferAIValue(
      consensus.agreedPrimaryAttributes.color,
      openaiResult.primaryAttributes.color,
      xaiResult.primaryAttributes.color,
      openaiResult.confidence,
      xaiResult.confidence,
      // Fallback: titles → descriptions/features → Ferguson_Color structured field
      extractFinishFromTexts(deptTitles) || extractFinishFromTexts(deptDescriptions) || extractFinishFromTexts(deptFeatures)
        || rawProduct.Ferguson_Color || ''
    ),
    material: preferAIValue(
      consensus.agreedPrimaryAttributes.material,
      openaiResult.primaryAttributes.material,
      xaiResult.primaryAttributes.material,
      openaiResult.confidence,
      xaiResult.confidence,
      // Fallback: titles → descriptions/features → ''
      extractMaterialFromTexts(deptTitles) || extractMaterialFromTexts(deptDescriptions) || extractMaterialFromTexts(deptFeatures) || ''
    ),
    
    // Category-specific attributes — AI → Title extract → Desc/Features extract → Structured → ''
    fuelType: preferAIValue(
      consensus.agreedTop15Attributes?.fuel_type,
      openaiResult.top15Attributes?.fuel_type,
      xaiResult.top15Attributes?.fuel_type,
      openaiResult.confidence,
      xaiResult.confidence,
      // Fallback: titles → descriptions/features → ''
      extractFuelTypeFromTexts(deptTitles) || extractFuelTypeFromTexts(deptDescriptions) || extractFuelTypeFromTexts(deptFeatures) || ''
    ),
    totalCapacity: preferAIValue(
      consensus.agreedTop15Attributes?.total_capacity || consensus.agreedPrimaryAttributes.total_capacity,
      openaiResult.top15Attributes?.total_capacity || openaiResult.primaryAttributes.total_capacity,
      xaiResult.top15Attributes?.total_capacity || xaiResult.primaryAttributes.total_capacity,
      openaiResult.confidence,
      xaiResult.confidence,
      // Fallback: titles → descriptions/features → structured → ''
      extractCapacityFromTexts(deptTitles) || extractCapacityFromTexts(deptDescriptions) || extractCapacityFromTexts(deptFeatures)
        || rawProduct.Capacity_Web_Retailer || ''
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
      consensus.agreedTop15Attributes?.number_of_burners || consensus.agreedPrimaryAttributes.number_of_burners,
      openaiResult.top15Attributes?.number_of_burners || openaiResult.primaryAttributes.number_of_burners,
      xaiResult.top15Attributes?.number_of_burners || xaiResult.primaryAttributes.number_of_burners,
      openaiResult.confidence,
      xaiResult.confidence,
      ''
    ),
    burnerCount: preferAIValue(
      consensus.agreedTop15Attributes?.number_of_burners || consensus.agreedPrimaryAttributes.number_of_burners,
      openaiResult.top15Attributes?.number_of_burners || openaiResult.primaryAttributes.number_of_burners,
      xaiResult.top15Attributes?.number_of_burners || xaiResult.primaryAttributes.number_of_burners,
      openaiResult.confidence,
      xaiResult.confidence,
      ''
    ),
    
    // Critical attributes - extracted from raw Ferguson/Web Retailer data
    cfm: cfmFinal,
    gpm: gpmFinal,
    btu: btuFinal,
    placeSettings: placeSettingsFinal,
    controlType: preferAIValue(
      consensus.agreedTop15Attributes?.control_type,
      openaiResult.top15Attributes?.control_type,
      xaiResult.top15Attributes?.control_type,
      openaiResult.confidence,
      xaiResult.confidence,
      ''
    ),
    basinCount: preferAIValue(
      consensus.agreedTop15Attributes?.basin_count,
      openaiResult.top15Attributes?.basin_count,
      xaiResult.top15Attributes?.basin_count,
      openaiResult.confidence,
      xaiResult.confidence,
      ''
    ),
    sinkShape: preferAIValue(
      consensus.agreedTop15Attributes?.sink_shape,
      openaiResult.top15Attributes?.sink_shape,
      xaiResult.top15Attributes?.sink_shape,
      openaiResult.confidence,
      xaiResult.confidence,
      // Fallback: titles → descriptions → structured spec
      extractShapeFromTexts(deptTitles) || extractShapeFromTexts(deptDescriptions)
        || (rawProduct as any).Ferguson_Raw_Data?.product?.specifications?.sink_shape?.value || ''
    ),
    shape: preferAIValue(
      consensus.agreedTop15Attributes?.mirror_shape || consensus.agreedTop15Attributes?.shape,
      openaiResult.top15Attributes?.mirror_shape || openaiResult.top15Attributes?.shape,
      xaiResult.top15Attributes?.mirror_shape || xaiResult.top15Attributes?.shape,
      openaiResult.confidence,
      xaiResult.confidence,
      // Fallback: titles → descriptions/features → ''
      extractShapeFromTexts(deptTitles) || extractShapeFromTexts(deptDescriptions) || extractShapeFromTexts(deptFeatures) || ''
    ),
    collection: preferAIValue(
      consensus.agreedTop15Attributes?.collection,
      openaiResult.top15Attributes?.collection,
      xaiResult.top15Attributes?.collection,
      openaiResult.confidence,
      xaiResult.confidence,
      ''
    ),
    installationType: normalizeInstallationType(
      smartPreferAIValue(
        consensus.agreedTop15Attributes?.installation_type || consensus.agreedPrimaryAttributes.installation_type,
        openaiResult.top15Attributes?.installation_type || openaiResult.primaryAttributes.installation_type,
        xaiResult.top15Attributes?.installation_type || xaiResult.primaryAttributes.installation_type,
        openaiResult.confidence,
        xaiResult.confidence,
        // Fallback: titles → descriptions/features → ''
        extractInstallationFromTexts(deptTitles) || extractInstallationFromTexts(deptDescriptions) || extractInstallationFromTexts(deptFeatures) || '',
        getValidInstallationTypes() // VALIDATION-FIRST: prefer valid value over confidence
      )
    ),
    depthType: depthTypeValue,
    panelReady: panelReadyValue,
    bowlShape: preferAIValue(
      consensus.agreedTop15Attributes?.bowl_shape,
      openaiResult.top15Attributes?.bowl_shape,
      xaiResult.top15Attributes?.bowl_shape,
      openaiResult.confidence,
      xaiResult.confidence,
      extractBowlShapeFromTexts(deptTitles) || extractBowlShapeFromTexts(deptDescriptions) || extractBowlShapeFromTexts(deptFeatures) || ''
    ),
    flushType: preferAIValue(
      consensus.agreedTop15Attributes?.flush_type,
      openaiResult.top15Attributes?.flush_type,
      xaiResult.top15Attributes?.flush_type,
      openaiResult.confidence,
      xaiResult.confidence,
      extractFlushTypeFromTexts(deptTitles) || extractFlushTypeFromTexts(deptDescriptions) || extractFlushTypeFromTexts(deptFeatures) || ''
    )
    
    // Features NOT passed to title generator (removed from titles in v2.1)
    // features: cleanedText.features
  };
  
  // ===========================================
  // REFRIGERATOR FIX: Apply special installation/depth logic
  // Built-In: show "Built-In" only, no depth
  // Freestanding + Counter-Depth: show "Counter-Depth" only, no Freestanding
  // Freestanding + Standard: show nothing (both implied)
  // ===========================================
  if (isRefrigeratorCategory) {
    seoTitleInput.installationType = installationTypeForTitle;
    seoTitleInput.depthType = depthTypeValue;
  }
  
  // ===========================================
  // COOKTOP/RANGE FIX: Fuel type should be in fuelType, not type
  // For cooking appliances, Gas/Electric/Induction are fuel types, not product types
  // ===========================================
  const FUEL_TYPE_VALUES = ['gas', 'electric', 'induction', 'dual fuel', 'propane', 'natural gas', 'lp'];
  const FUEL_TYPE_CATEGORIES = ['cooktop', 'range', 'rangetop', 'oven', 'wall oven'];
  
  const currentCategory = (seoTitleInput.category || '').toLowerCase();
  const currentType = (seoTitleInput.type || '').toLowerCase().trim();
  
  if (FUEL_TYPE_CATEGORIES.some(c => currentCategory.includes(c)) && 
      FUEL_TYPE_VALUES.some(f => currentType.includes(f))) {
    // Move fuel type from type field to fuelType field
    if (!seoTitleInput.fuelType) {
      seoTitleInput.fuelType = seoTitleInput.type;
    }
    // Clear type field so it doesn't duplicate fuel type
    seoTitleInput.type = '';
    
    logger.info('Cooktop/Range fuel type correction applied', {
      sessionId,
      category: seoTitleInput.category,
      movedFuelType: seoTitleInput.fuelType,
      installationType: seoTitleInput.installationType
    });
  }
  
  // Log seoTitleInput width/height values for debugging
  logger.info('SEO title input prepared', {
    sessionId,
    category: seoTitleInput.category,
    width: seoTitleInput.width || 'NOT SET',
    height: seoTitleInput.height || 'NOT SET',
    titleDimsUsed: (!seoTitleInput.width || seoTitleInput.width === titleDims.width) ? titleDims : 'not needed',
    placeSettings: seoTitleInput.placeSettings || 'NOT SET',
    type: seoTitleInput.type || 'NOT SET',
    fuelType: seoTitleInput.fuelType || 'NOT SET',
    burnerCount: seoTitleInput.burnerCount || 'NOT SET',
    installationType: seoTitleInput.installationType || 'NOT SET'
  });
  
  // Generate PRELIMINARY title for Final Review validation
  // This will be regenerated AFTER Final Review uses corrected data
  const preliminarySeoTitle = generateSEOTitle(seoTitleInput);
  logger.info('Preliminary SEO title generated (will regenerate after Final Review)', {
    sessionId,
    preliminarySeoTitle: preliminarySeoTitle.substring(0, 80),
    originalTitle: cleanedText.title?.substring(0, 80),
    category: seoTitleInput.category,
    brand: seoTitleInput.brand
  });
  
  const primaryAttributes: PrimaryDisplayAttributes = {
    AI_Brand: brandMatch.matched && brandMatch.matchedValue 
      ? brandMatch.matchedValue.brand_name  // Use EXACT Salesforce brand name
      : cleanedText.brand,
    AI_Brand_Lookup: brandMatch.matched && brandMatch.matchedValue 
      ? getSafeId(brandMatch.matchedValue.brand_id)  // Filter out placeholder IDs
      : null,
    AI_Product_Category: categoryMatch.matched && categoryMatch.matchedValue 
      ? categoryMatch.matchedValue.category_name  // Use EXACT Salesforce category name
      : cleanEncodingIssues(consensus.agreedCategory || ''),
    AI_Product_Category_Lookup: categoryMatch.matched && categoryMatch.matchedValue 
      ? getSafeId(categoryMatch.matchedValue.category_id)  // Filter out placeholder IDs
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
      ? getSafeId(typeMatchResult.matchedValue.type_id)  // Filter out placeholder IDs
      : null,
    AI_Style: styleMatch.matched && styleMatch.matchedValue 
      ? styleMatch.matchedValue.style_name  // Use EXACT Salesforce style name when matched
      : styleToUse,  // Use AI-derived style even if not in SF picklist (will be in Style_Requests)
    AI_Style_Lookup: styleMatch.matched && styleMatch.matchedValue 
      ? getSafeId(styleMatch.matchedValue.style_id)  // Filter out placeholder IDs
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
      
      // If color is a hex code (6 chars, all hex) and we have a finish name, use the finish name directly
      // Hex codes add no value for Salesforce — export the human-readable name instead
      if (color && /^[0-9a-fA-F]{6}$/.test(color.trim()) && finishName && finishName.trim()) {
        logger.info('Replaced hex color with finish name', { hexColor: color, finishName, sessionId });
        color = finishName.trim();
      } else if (color && /^[0-9a-fA-F]{6}$/.test(color.trim())) {
        // Hex code with no finish name — clear it rather than export a raw hex code
        logger.info('Cleared orphan hex color code', { hexColor: color, sessionId });
        color = '';
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
      getFieldByPriority(consensus.agreedCategory, rawProduct.Depth_Web_Retailer, rawProduct.Ferguson_Depth) ||
      findAttributeInRawData(rawProduct, 'Depth') ||
      findAttributeInRawData(rawProduct, 'Overall Depth') ||
      ''
    ),
    AI_Width: (() => {
      let width = preferAIValue(
        consensus.agreedPrimaryAttributes.width,
        openaiResult.primaryAttributes.width,
        xaiResult.primaryAttributes.width,
        openaiResult.confidence,
        xaiResult.confidence,
        getFieldByPriority(consensus.agreedCategory, rawProduct.Width_Web_Retailer, rawProduct.Ferguson_Width) ||
        findAttributeInRawData(rawProduct, 'Width') ||
        findAttributeInRawData(rawProduct, 'Overall Width') ||
        ''
      );
      
      // If still empty, try to extract from title/description
      if (!width || width.trim() === '') {
        const textToSearch = `${rawProduct.Product_Title_Web_Retailer || ''} ${rawProduct.Ferguson_Title || ''} ${rawProduct.Product_Description_Web_Retailer || ''} ${rawProduct.Ferguson_Description || ''}`;
        const extracted = extractWidthFromText(textToSearch);
        if (extracted) {
          width = extracted;
          logger.info('Extracted width from text', { width, source: 'title_description_extraction', sessionId });
        }
      }

      // For sinks, extract the primary marketing dimension from Ferguson's product name.
      // This is more reliable than guessing which specs axis (length vs width) is the marketing dimension,
      // since Ferguson's axis convention varies by product.
      // e.g., "Elavo 20-7/8\" Ceramic Undermount..." → 20.875 → "21"
      // e.g., "Mojito 13\" Drop-In Single Basin..." → 13 → "13"
      // e.g., "Atherton™ 18-3/8\" Vitreous China..." → 18.375 → "18"
      const sinkCats = ['Kitchen Sink', 'Bathroom Sink', 'Bar & Prep Sink'];
      if (sinkCats.includes(consensus.agreedCategory || '')) {
        const frd = (rawProduct as any).Ferguson_Raw_Data;
        const fergusonSpecs = frd?.product?.specifications;
        const isKitchenOrBar = consensus.agreedCategory !== 'Bathroom Sink';

        // Plausibility guard: skip Ferguson dimension if the Ferguson-matched product is clearly
        // a different product type (door lever, drinking fountain, etc.)
        const fergusonBizCat = ((frd?.search_meta_data?.business_category as string) || '').toLowerCase();
        const dimSkipKeywords = ['door', 'drawer', 'lever', 'handle', 'fountain', 'hardware', 'cooling', 'refriger'];
        const fergusonDataIsSuspect = fergusonBizCat.length > 0 && dimSkipKeywords.some(kw => fergusonBizCat.includes(kw));

        if (!fergusonDataIsSuspect) {
          let sinkWidthFound = false;

          // 1. Primary: nominal dimension from Ferguson specs
          //    These are Ferguson's industry-standard catalog sizes (typically whole integers).
          //    Kitchen/Bar sinks: the cabinet-width dimension is stored as "length" (longer L-R dim).
          //    Bathroom sinks: the marketing dimension is "width" (L-R front-facing dim).
          if (fergusonSpecs) {
            const nomDim = isKitchenOrBar
              ? (fergusonSpecs.nominal_length?.value || fergusonSpecs.sink_length?.value)
              : (fergusonSpecs.nominal_width?.value || fergusonSpecs.nominal_length?.value);

            if (nomDim) {
              const nomStr = String(nomDim).trim();
              // Handle whole number "32" or fractional form "37-1/2"
              const fracMatch = nomStr.match(/^(\d+)-(\d+)\/(\d+)$/);
              const numMatch = nomStr.match(/^(\d+(?:\.\d+)?)$/);
              let nomValue: number | null = null;
              if (fracMatch) {
                nomValue = parseInt(fracMatch[1]) + parseInt(fracMatch[2]) / parseInt(fracMatch[3]);
              } else if (numMatch) {
                nomValue = parseFloat(numMatch[1]);
              }
              if (nomValue !== null && nomValue >= 8 && nomValue <= 80) {
                width = String(Math.round(nomValue));
                sinkWidthFound = true;
                logger.info('Sink: using Ferguson nominal spec dimension for title', {
                  sessionId, category: consensus.agreedCategory,
                  specField: isKitchenOrBar ? 'nominal_length/sink_length' : 'nominal_width',
                  nominalValue: nomDim, resolvedWidth: width
                });
              }
            }
          }

          // 2. Fallback: extract dimension from Ferguson product name via regex
          //    Handles cases where nominal spec fields are absent.
          if (!sinkWidthFound) {
            // Prefer structured Ferguson name; fall back to flat Ferguson_Title for "no_sources" products
            const fergusonName = (frd?.product?.name as string) || (rawProduct.Ferguson_Title as string) || '';
            const dimMatch = fergusonName.match(/(\d+)(?:-(\d+)\/(\d+))?\s*"/);
            if (dimMatch) {
              const whole = parseInt(dimMatch[1]);
              const fracNum = dimMatch[2] ? parseInt(dimMatch[2]) : 0;
              const fracDen = dimMatch[3] ? parseInt(dimMatch[3]) : 1;
              const dimValue = whole + fracNum / fracDen;
              // Sanity check: reasonable sink dimension (8–80 inches)
              if (dimValue >= 8 && dimValue <= 80) {
                const dimStr = String(Math.round(dimValue));
                logger.info('Sink: using Ferguson name dimension as marketing width for title', {
                  sessionId, category: consensus.agreedCategory,
                  fergusonName: fergusonName.substring(0, 70),
                  extractedDimension: dimStr, previousAiWidth: width
                });
                width = dimStr;
              }
            }
          }
        } else {
          logger.warn('Sink: Ferguson data appears to be for wrong product type, skipping dimension override', {
            sessionId, category: consensus.agreedCategory,
            fergusonBizCat, retainingAiWidth: width
          });
        }
      }

      return width;
    })(),
    AI_Height: preferAIValue(
      consensus.agreedPrimaryAttributes.height,
      openaiResult.primaryAttributes.height,
      xaiResult.primaryAttributes.height,
      openaiResult.confidence,
      xaiResult.confidence,
      getFieldByPriority(consensus.agreedCategory, rawProduct.Height_Web_Retailer, rawProduct.Ferguson_Height) ||
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
      // Also reject non-numeric values like "Yes", "Not Found", "N/A"
      if (!weight) return '';
      const cleaned = String(weight).replace(/\s*(lbs?\.?|pounds?|kg|oz|ounces?)\s*$/i, '').trim();
      // Verify the result is actually numeric
      const parsed = parseFloat(cleaned);
      if (isNaN(parsed) || parsed <= 0) return '';
      return cleaned;
    })(),
    AI_Product_Filter_Class: (() => {
      // Calculate industry-standard size class for filtering
      // Example: 47.25" refrigerator → "48-Inch" (rounded to nearest standard size)
      // This enables Salesforce to filter products by standard size classes
      
      // Get the width value (same sources as AI_Width above)
      const widthStr = preferAIValue(
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
      );
      
      if (!widthStr || !widthStr.trim()) {
        return '';  // No width available
      }
      
      // Parse width to number
      const widthNum = parseFloat(String(widthStr));
      if (isNaN(widthNum) || widthNum <= 0) {
        return '';  // Invalid width
      }
      
      // Get size class configuration for this category
      const categoryName = categoryMatch.matched && categoryMatch.matchedValue 
        ? categoryMatch.matchedValue.category_name
        : consensus.agreedCategory || '';
      
      if (!categoryName) {
        return '';  // No category available
      }
      
      const sizeClassConfig = getSizeClassConfig(categoryName);
      
      if (!sizeClassConfig || !sizeClassConfig.has_measurement_class) {
        // Category doesn't have size classes - return empty
        logger.info('Category does not use size class system', {
          sessionId,
          category: categoryName
        });
        return '';
      }
      
      // Get installation type for categories with installation-dependent sizing
      const installationType = String(
        consensus.agreedTop15Attributes?.installation_type || 
        openaiResult.top15Attributes?.installation_type || 
        xaiResult.top15Attributes?.installation_type || 
        ''
      );
      
      // Round to standard size class
      const roundedSize = roundToStandardSize(widthNum, sizeClassConfig, installationType);
      
      // Format as display string
      const formatted = formatSizeClass(roundedSize, sizeClassConfig.classes);
      
      logger.info('Calculated Product Filter Class', {
        sessionId,
        category: categoryName,
        actualWidth: widthNum,
        roundedSize,
        filterClass: formatted,
        installationType: installationType || 'not specified'
      });
      
      return formatted;
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
    AI_Product_Title: preliminarySeoTitle,  // Preliminary title (will regenerate after Final Review)
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
    title: getFieldByPriority(consensus.agreedCategory, rawProduct.Product_Title_Web_Retailer, rawProduct.Ferguson_Title, ''),
    description: getFieldByPriority(consensus.agreedCategory, rawProduct.Product_Description_Web_Retailer, rawProduct.Ferguson_Description, ''),
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
          const safeAttributeId = getSafeId(attrMatch.matchedValue.attribute_id);  // Filter out placeholder IDs
          topFilterAttributeIds[key] = safeAttributeId;
          logger.warn('Top 15 attribute NOT in category config - used fuzzy match (may be incorrect)', {
            fieldKey: key,
            attributeName,
            category: consensus.agreedCategory,
            fuzzyMatchedTo: attrMatch.matchedValue.attribute_name,
            attribute_id: safeAttributeId,
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
          const safeAttributeId = getSafeId(attrMatch.matchedValue.attribute_id);  // Filter out placeholder IDs
          topFilterAttributeIds[key] = safeAttributeId;
          logger.warn('Top 15 attribute (by key) NOT in category config - used fuzzy match', {
            fieldKey: key,
            readableName,
            category: consensus.agreedCategory,
            fuzzyMatchedTo: attrMatch.matchedValue.attribute_name,
            attribute_id: safeAttributeId,
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
  
  // Get ALL unused attributes from both data sources (no allowlist — everything not in primary/top15)
  const unusedFergusonAttrs = getUnusedFergusonAttributes(rawProduct, topFilterAttributes);
  const unusedWebRetailerAttrs = getUnusedWebRetailerAttributes(rawProduct, topFilterAttributes);
  
  // Extract ALL nested Ferguson_Raw_Data specs/features not already in flat array or top 15
  const nestedFergusonAttrs = extractNestedFergusonAttributes(rawProduct, topFilterAttributes);
  
  // Extract specs from Specification_Table HTML not already in other sources
  const specTableAttrs = extractSpecificationTableAttributes(rawProduct, topFilterAttributes);
  
  // Merge all five sources — department-aware priority (same logic as getFieldByPriority)
  // Appliances: Web Retailer > Ferguson (web retail is source of record)
  // Non-Appliances: Ferguson > Web Retailer (Ferguson is more authoritative)
  // Uses smart deduplication: normalized key matching across sources prevents duplicates
  // while preserving highest-priority source's value for each unique attribute
  const isAppliance = isAppliancesCategory(determinedCategory);
  
  // Smart deduplication: merge sources in priority order (lowest → highest)
  // Higher-priority sources override lower ones for the same normalized key
  // This prevents duplicate attributes like "Ice Maker" appearing from both Ferguson and Web Retailer
  const normalizeAttrKey = (key: string): string =>
    key.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    
  const sourcesInPriorityOrder: Array<{ attrs: Record<string, unknown>; source: string }> = isAppliance
    ? [
        { attrs: nestedFergusonAttrs, source: 'Ferguson_Nested' },
        { attrs: unusedFergusonAttrs, source: 'Ferguson_Flat' },
        { attrs: consensus.agreedAdditionalAttributes || {}, source: 'AI_Consensus' },
        { attrs: specTableAttrs, source: 'Spec_Table' },
        { attrs: unusedWebRetailerAttrs, source: 'Web_Retailer' },  // Highest priority for appliances
      ]
    : [
        { attrs: specTableAttrs, source: 'Spec_Table' },
        { attrs: unusedWebRetailerAttrs, source: 'Web_Retailer' },
        { attrs: consensus.agreedAdditionalAttributes || {}, source: 'AI_Consensus' },
        { attrs: nestedFergusonAttrs, source: 'Ferguson_Nested' },
        { attrs: unusedFergusonAttrs, source: 'Ferguson_Flat' },  // Highest priority for non-appliances
      ];

  // Track which normalized keys we've seen — higher-priority sources override lower ones
  const seenNormalizedKeys = new Map<string, string>(); // normalizedKey → originalKey from winning source
  const mergedAdditionalAttributes: Record<string, string> = {};
  let duplicatesRemoved = 0;
  
  for (const { attrs } of sourcesInPriorityOrder) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === '') continue;
      const normalized = normalizeAttrKey(key);
      if (!normalized) continue;
      
      if (seenNormalizedKeys.has(normalized)) {
        // Duplicate — higher priority source overrides: remove old key, use this one
        const oldKey = seenNormalizedKeys.get(normalized)!;
        if (oldKey !== key) {
          delete mergedAdditionalAttributes[oldKey];
        }
        duplicatesRemoved++;
      }
      seenNormalizedKeys.set(normalized, key);
      mergedAdditionalAttributes[key] = String(value);
    }
  }
  
  if (duplicatesRemoved > 0) {
    logger.info('🔄 Deduplicated additional attributes across sources', {
      sessionId,
      duplicatesRemoved,
      uniqueAttributes: Object.keys(mergedAdditionalAttributes).length,
      totalBeforeDedup: duplicatesRemoved + Object.keys(mergedAdditionalAttributes).length,
    });
  }
  
  const additionalHtml = generateAttributeTable(mergedAdditionalAttributes);
  
  // Log what raw data attributes were added to HTML
  const fergusonFlatCount = Object.keys(unusedFergusonAttrs).length;
  const fergusonNestedCount = Object.keys(nestedFergusonAttrs).length;
  const webRetailerCount = Object.keys(unusedWebRetailerAttrs).length;
  const specTableCount = Object.keys(specTableAttrs).length;
  if (fergusonFlatCount > 0 || fergusonNestedCount > 0 || webRetailerCount > 0 || specTableCount > 0) {
    logger.info('Raw data attributes added to Additional_Attributes_HTML', {
      specTableCount,
      specTableAttributes: Object.keys(specTableAttrs),
      webRetailerCount,
      webRetailerAttributes: Object.keys(unusedWebRetailerAttrs),
      fergusonFlatCount,
      fergusonFlatAttributes: Object.keys(unusedFergusonAttrs),
      fergusonNestedCount,
      fergusonNestedAttributes: Object.keys(nestedFergusonAttrs),
      totalMerged: Object.keys(mergedAdditionalAttributes).length
    });
  }
  
  // --- Attribute Catalog Logging (fire-and-forget) ---
  // Log all found/not-found attributes per category/type for trend analysis
  const top15SchemaAttrNames = categorySchema?.top15FilterAttributes?.map(
    (attr: any) => typeof attr === 'string' ? attr : (attr.name || attr.fieldKey || '')
  ).filter(Boolean) || [];
  
  const hasFergusonData = !!(rawProduct.Ferguson_Attributes?.length || (rawProduct as any).Ferguson_Raw_Data?.product);
  const hasWebRetailerData = !!(rawProduct.Web_Retailer_Specs?.length);
  const hasSpecTable = !!(rawProduct.Specification_Table && rawProduct.Specification_Table.trim() !== '');
  const hasNestedFerguson = !!(rawProduct as any).Ferguson_Raw_Data?.product?.specifications || !!(rawProduct as any).Ferguson_Raw_Data?.product?.feature_groups;
  
  const catalogSourceMap: AttributeSourceMap = {
    availableSources: {
      ferguson: hasFergusonData,
      webRetailer: hasWebRetailerData,
      specTable: hasSpecTable,
      nestedFerguson: hasNestedFerguson,
      ai: true  // AI is always available
    },
    fergusonAttrs: unusedFergusonAttrs,
    webRetailerAttrs: unusedWebRetailerAttrs,
    specTableAttrs,
    nestedFergusonAttrs,
    aiAttrs: consensus.agreedAdditionalAttributes || {}
  };
  
  // Fire-and-forget — never blocks verification
  void logAttributeCatalog(
    determinedCategory,
    determinedType || '',
    top15SchemaAttrNames,
    [...PRIMARY_ATTRIBUTE_FIELD_KEYS],
    mergedAdditionalAttributes,
    catalogSourceMap
  );

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
    brand_id: getSafeId(primaryAttributes.AI_Brand_Lookup),  // Filter out placeholder IDs
    category: primaryAttributes.AI_Product_Category || '',
    category_id: getSafeId(primaryAttributes.AI_Product_Category_Lookup),  // Filter out placeholder IDs
    department: primaryAttributes.AI_Product_Department || '',
    family: primaryAttributes.AI_Product_Family || '',
    // subcategory removed - was redundant with category
    style: primaryAttributes.AI_Style || '',
    style_id: getSafeId(primaryAttributes.AI_Style_Lookup),  // Filter out placeholder IDs
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
  
  // ⚠️ CRITICAL: Normalize installation_type BEFORE it's used in title generation
  // March 16 hierarchy redesign prioritizes sanitizedTopFilterAttributes.installation_type,
  // but normalization was only applied to seoTitleInput.installationType
  // This caused titles to show "Built-In, Free Standing" instead of "Built-In"
  if (sanitizedTopFilterAttributes.installation_type) {
    sanitizedTopFilterAttributes.installation_type = normalizeInstallationType(
      String(sanitizedTopFilterAttributes.installation_type)
    );
    logger.info('Applied installation type normalization to filter attributes', {
      sessionId,
      category: consensus.agreedCategory,
      before: topFilterAttributes.installation_type,
      after: sanitizedTopFilterAttributes.installation_type
    });
  }
  
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

  // Track all creation requests for visibility and duplicate prevention
  // Fire-and-forget: don't block the response
  trackCreationRequests(
    rawProduct,
    sessionId,
    brandRequests,
    categoryRequests,
    filteredStyleRequests,
    attributeRequests
  ).catch(err => {
    logger.error('Failed to track creation requests', { error: err.message });
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

  // Build Appliance Features — handled by department pipeline after Final Review
  // Pipeline uses sanitized (post-Final Review) attributes for more accurate features
  let applianceFeatures = defaultApplianceFeatures();

  // ═══════════════════════════════════════════════════════════════
  // FINAL REVIEW STAGE - Post-Consensus Validation & Cross-Check
  // ═══════════════════════════════════════════════════════════════
  // Execute final validation before sending to Salesforce
  // This catches systematic errors where both AIs might agree on the wrong answer
  
  const finalReviewResult = await executeFinalReviewStage(
    consensus,
    sanitizedPrimaryAttributes,
    sanitizedTopFilterAttributes,
    preliminarySeoTitle,
    rawProduct,
    sessionId,
    determinedDepartment
  );

  // Add final review metadata to verification object
  const finalReviewMetadata = {
    final_review_performed: true,
    final_review_status: finalReviewResult.finalStatus,
    phase_a_confidence: finalReviewResult.phaseAResult.confidence,
    phase_b_performed: !!finalReviewResult.phaseBResult,
    phase_b_confidence: finalReviewResult.phaseBResult?.confidenceInResults,
    corrections_applied: finalReviewResult.correctionsApplied.length,
    issues_flagged: finalReviewResult.flaggedForReview.length,
    validation_issues: finalReviewResult.flaggedForReview.map(issue => ({
      severity: issue.severity,
      field: issue.field,
      issue: issue.issue,
      current_value: String(issue.currentValue).substring(0, 50)
    }))
  };

  // Determine final verification status
  let finalVerificationStatus = status;
  if (finalReviewResult.finalStatus === 'FAIL') {
    finalVerificationStatus = 'needs_review';
    logger.warn('🔴 FINAL REVIEW: Validation failed - downgrading status to needs_review', {
      sessionId,
      correctionsApplied: finalReviewResult.correctionsApplied.length,
      issuesFlagged: finalReviewResult.flaggedForReview.length
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // REGENERATE TITLE - After Final Review with Corrected Data
  // ═══════════════════════════════════════════════════════════════
  // Now that Final Review has applied corrections to brand, type, finish, etc.,
  // regenerate the title to ensure it reflects the most accurate data.
  // If Claude already corrected the title during Final Review, this will use those corrections.
  
  // Smart color/finish merge for title generation:
  // - Prefer Color when it's a real color name
  // - Use Finish only if it looks like a color (not a material/coating)
  // - Filter out material/coating names that aren't useful in titles
  // NOTE: "stainless steel" removed from exclusions - it's a critical appliance finish for SEO
  const MATERIAL_COATING_PATTERNS = /^(hygieneglaze|cefiontect|sanagloss|everclean|ceramic|porcelain|vitreous\s+china|plastic|fiberglass|acrylic|cast\s+iron|enameled\s+steel|granite|quartz|composite|solid\s+surface)$/i;
  const rawFinish = sanitizedPrimaryAttributes.AI_Finish || seoTitleInput.finish || '';
  const rawColor = sanitizedPrimaryAttributes.AI_Color || seoTitleInput.color || '';
  // Strip hex color code prefix from AI_Color (e.g., "E1C16E (Tuscan Brass)" → "Tuscan Brass")
  let cleanColor = rawColor;
  const hexColorMatch = cleanColor.match(/^[0-9a-f]{6}\s*\((.+)\)$/i);
  if (hexColorMatch) {
    cleanColor = hexColorMatch[1].trim();
  }
  // Use color if available and not a material; fall back to finish if finish isn't a material
  const smartAppearance = (cleanColor && !MATERIAL_COATING_PATTERNS.test(cleanColor.trim()))
    ? cleanColor
    : (rawFinish && !MATERIAL_COATING_PATTERNS.test(rawFinish.trim()) ? rawFinish : '');

  // Build seoTitleInput from CORRECTED attributes
  // Bridge: Final Review value → Preliminary seoTitleInput value (which has full verified hierarchy)
  const finalSeoTitleInput: SEOTitleInput = {
    brand: sanitizedPrimaryAttributes.AI_Brand || seoTitleInput.brand,
    modelNumber: sanitizedPrimaryAttributes.AI_Model_Number || seoTitleInput.modelNumber || '',
    category: sanitizedPrimaryAttributes.AI_Product_Category || seoTitleInput.category,
    subCategory: consensus.agreedPrimaryAttributes.subcategory || rawProduct.Web_Retailer_SubCategory || '',
    rawTitle: getFieldByPriority(consensus.agreedCategory, rawProduct.Product_Title_Web_Retailer, rawProduct.Ferguson_Title, ''),
    style: sanitizedPrimaryAttributes.AI_Style || seoTitleInput.style,
    type: sanitizedPrimaryAttributes.AI_Type || seoTitleInput.type,
    finish: smartAppearance,
    color: smartAppearance,
    width: sanitizedPrimaryAttributes.AI_Width || seoTitleInput.width,
    height: sanitizedPrimaryAttributes.AI_Height || seoTitleInput.height,
    depth: sanitizedPrimaryAttributes.AI_Depth || seoTitleInput.depth,
    length: sanitizedPrimaryAttributes.AI_Depth || seoTitleInput.depth, // For bathtubs: depth_length IS the marketing length
    material: seoTitleInput.material || '',
    // Extract specs from corrected topFilterAttributes, fall back to preliminary values
    gpm: String(sanitizedTopFilterAttributes.flow_rate_gpm || gpmFinal || ''),
    cfm: String(sanitizedTopFilterAttributes.cfm || cfmFinal || ''),
    btu: String(sanitizedTopFilterAttributes.btu || btuFinal || ''),
    totalCapacity: String(sanitizedTopFilterAttributes.total_capacity || sanitizedTopFilterAttributes.capacity || seoTitleInput.totalCapacity || ''),
    numberOfLights: String(sanitizedTopFilterAttributes.number_of_lights || seoTitleInput.numberOfLights || ''),
    numberOfBurners: String(sanitizedTopFilterAttributes.number_of_burners || seoTitleInput.numberOfBurners || ''),
    placeSettings: String(sanitizedTopFilterAttributes.place_settings || seoTitleInput.placeSettings || ''),
    installationType: String(sanitizedTopFilterAttributes.installation_type || seoTitleInput.installationType || ''),
    fuelType: String(sanitizedTopFilterAttributes.fuel_type || seoTitleInput.fuelType || ''),
    configuration: String(sanitizedTopFilterAttributes.configuration || seoTitleInput.configuration || ''),
    controlType: String(sanitizedTopFilterAttributes.control_type || seoTitleInput.controlType || ''),
    depthType: String(sanitizedTopFilterAttributes.depth_type || ''),
    holeConfig: extractHoleConfigForTitle(sanitizedTopFilterAttributes, sanitizedPrimaryAttributes, rawProduct),
    mountType: String(sanitizedTopFilterAttributes.mounting_type || sanitizedTopFilterAttributes.installation_type || ''),
    basinCount: String(sanitizedTopFilterAttributes.basin_count || sanitizedTopFilterAttributes.number_of_basins ||
      (rawProduct as any).Ferguson_Raw_Data?.product?.specifications?.number_of_basins?.value || seoTitleInput.basinCount || ''),
    sinkShape: String(sanitizedTopFilterAttributes.sink_shape ||
      (rawProduct as any).Ferguson_Raw_Data?.product?.specifications?.sink_shape?.value || seoTitleInput.sinkShape || ''),
    shape: String(sanitizedTopFilterAttributes.mirror_shape || sanitizedTopFilterAttributes.shape || seoTitleInput.shape || ''),
    bowlShape: String(sanitizedTopFilterAttributes.bowl_shape || seoTitleInput.bowlShape || ''),
    flushType: String(sanitizedTopFilterAttributes.flush_type || seoTitleInput.flushType || ''),
    // function field: populated by shower post-processing below; initialised empty here
    function: '',
  };

  // ── SHOWER TITLE POST-PROCESSING ────────────────────────────────────────────
  // Applied BEFORE title generation so the schema renders correctly.
  // Follows same reclassification pattern as Toilet → Toilet Seat.
  const fergusonProductName: string = (rawProduct as any).Ferguson_Raw_Data?.product?.name ||
    (rawProduct.Ferguson_Title as string) || '';

  // ═══════════════════════════════════════════════════════════════
  // DEPARTMENT PIPELINE ROUTING
  // Appliance vs Non-Appliance post-processing is completely isolated.
  // See src/services/pipelines/ for department-specific logic.
  // ═══════════════════════════════════════════════════════════════
  {
    const pipelineCtx: PipelineContext = {
      finalSeoTitleInput,
      sanitizedPrimaryAttributes,
      sanitizedTopFilterAttributes,
      rawProduct,
      determinedDepartment: sanitizedPrimaryAttributes.AI_Product_Department || '',
      agreedCategory: consensus.agreedCategory || '',
      sessionId,
      fergusonProductName,
    };

    const pipelineResult = (sanitizedPrimaryAttributes.AI_Product_Department || '').toLowerCase() === 'appliances'
      ? applyAppliancePipeline(pipelineCtx)
      : applyNonAppliancePipeline(pipelineCtx);

    applianceFeatures = pipelineResult.applianceFeatures;
  }

  // Generate final title using corrected data
  let finalSeoTitle = generateSEOTitle(finalSeoTitleInput);
  
  // ACCESSORY FALLBACK: When type is "Accessory" and the schema title is thin
  // (just brand + category + model), use cleaned raw title to preserve product identity.
  // Example: "JACLO Toilet Polished Gold - 9231-PG" → "Jaclo Toilet Tank Trip Lever Polished Gold - 9231-PG"
  if (finalSeoTitleInput.type === 'Accessory') {
    // Count meaningful words (exclude brand, category, model, and appearance/finish)
    const titleWords = finalSeoTitle.replace(/\s*-\s*\S+$/, '').split(/\s+/); // strip model suffix
    const brandWords = (finalSeoTitleInput.brand || '').split(/\s+/).length;
    const categoryWords = (finalSeoTitleInput.category || '').split(/\s+/).length;
    const appearanceWords = (smartAppearance || '').split(/\s+/).filter(Boolean).length;
    const meaningfulWords = titleWords.length - brandWords - categoryWords - appearanceWords;
    
    if (meaningfulWords <= 2) {
      // Title is thin — try to get a descriptive name from raw sources
      // Include Legacy title as it's often the only reliable source for accessories
      const rawSources = [
        rawProduct.Product_Title_Legacy,
        rawProduct.Product_Title_Web_Retailer,
        rawProduct.Ferguson_Title,
        (rawProduct as any).Ferguson_Raw_Data?.product?.name,
      ].filter(Boolean) as string[];
      
      if (rawSources.length > 0) {
        // Pick the longest raw title for max info
        const bestRaw = rawSources.sort((a, b) => b.length - a.length)[0];
        // Clean: strip brand prefix, model number suffix, normalize whitespace
        const brandRegex = new RegExp(`^${(finalSeoTitleInput.brand || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
        const modelRegex = new RegExp(`\\s*[-–]?\\s*${(finalSeoTitleInput.modelNumber || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');
        let cleanedRaw = bestRaw
          .replace(brandRegex, '')
          .replace(modelRegex, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleanedRaw.length > 10) {
          // Rebuild: Brand + cleanedRaw + Appearance + "- Model"
          const parts = [finalSeoTitleInput.brand, cleanedRaw];
          if (smartAppearance) parts.push(smartAppearance);
          if (finalSeoTitleInput.modelNumber) parts.push(`- ${finalSeoTitleInput.modelNumber}`);
          const accessoryTitle = parts.join(' ');
          
          logger.info('🔧 ACCESSORY FALLBACK: Schema title was thin, using enriched raw title', {
            sessionId,
            schemaTitle: finalSeoTitle.substring(0, 80),
            accessoryTitle: accessoryTitle.substring(0, 80),
            source: bestRaw.substring(0, 80),
          });
          finalSeoTitle = accessoryTitle;
        }
      }
    }
  }
  
  // ALWAYS use our schema-generated title.
  // Claude's field corrections (brand, type, finish, width, etc.) already flow into
  // finalSeoTitleInput, so the schema title benefits from ALL of Claude's corrections.
  // Letting Claude also rewrite the title STRING bypasses our formatting rules:
  //   - Bathroom Mirror merge logic (prevents "Wall Mirror Bathroom Mirror")
  //   - Dimension rounding (fractions → whole numbers)
  //   - Accessory title reordering
  //   - Redundancy dedup (Type substring of Category)
  //   - Model number enforcement
  // Previously we had per-category overrides (sinks, mirrors) to undo Claude's rewrites,
  // but the correct fix is to never let Claude override the title at all.
  const titleWasCorrectedByClaude = finalReviewResult.correctionsApplied.some(
    correction => correction.field === 'title'
  );
  sanitizedPrimaryAttributes.AI_Product_Title = finalSeoTitle;
  
  if (titleWasCorrectedByClaude) {
    logger.info('📝 FINAL TITLE: Claude corrected title but using schema-generated version (preserves formatting rules)', {
      sessionId,
      claudeTitle: (finalReviewResult.correctionsApplied.find(c => c.field === 'title')?.suggestedFix || '').toString().substring(0, 80),
      schemaTitle: finalSeoTitle.substring(0, 80),
    });
  } else {
    logger.info('📝 FINAL TITLE: Regenerated after Final Review using corrected data', {
      sessionId,
      preliminaryTitle: preliminarySeoTitle.substring(0, 80),
      finalTitle: finalSeoTitle.substring(0, 80),
      brandCorrected: finalReviewResult.correctionsApplied.some(c => c.field === 'brand'),
      typeCorrected: finalReviewResult.correctionsApplied.some(c => c.field === 'type'),
      finishCorrected: finalReviewResult.correctionsApplied.some(c => c.field === 'finish')
    });
  }

  // Build response object before capturing metrics (need finalValues)
  const responseObject = {
    SF_Catalog_Id: rawProduct.SF_Catalog_Id,
    SF_Catalog_Name: rawProduct.SF_Catalog_Name,
    Primary_Attributes: sanitizedPrimaryAttributes,
    Top_Filter_Attributes: sanitizedTopFilterAttributes,
    Top_Filter_Attribute_Ids: topFilterAttributeIds,
    Appliance_Features: applianceFeatures,  // Always included (defaults to all false for non-Appliances)
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
    Status: (finalVerificationStatus === 'verified' ? 'success' : finalVerificationStatus === 'needs_review' ? 'partial' : 'failed') as 'success' | 'partial' | 'failed',
    Final_Review: finalReviewMetadata
  };
  
  // Capture AI Performance Metrics (Phase C) - Run async without blocking response
  // This must happen AFTER response is built so we have finalValues
  captureAIPerformanceMetrics(
    sessionId,
    rawProduct,
    openaiResult,
    xaiResult,
    consensus,
    finalReviewResult.phaseBResult, // Claude review result (blind validation)
    responseObject as any, // Type assertion needed for Final_Review extension field
    dataSourceAnalysis || { scenario: 'unknown', hasFergusonData: false, hasWebData: false, hasImages: false },
    _processingTimeMs
  ).catch(err => {
    logger.error('Failed to capture AI performance metrics (non-critical)', {
      sessionId,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  });
  
  // Return with type assertion to handle Final_Review extension field
  return responseObject as SalesforceVerificationResponse;
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
    Appliance_Features: {
      built_in: false,
      panel_ready: false,
      counter_depth: false,
      standard_depth: false,
      voltage_120v: false,
      voltage_240v: false,
      fuel_gas: false,
      fuel_electric: false
    },
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
          manufacturer: getFieldByPriority(category, rawProduct.Brand_Web_Retailer, rawProduct.Ferguson_Brand),
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
          manufacturer: getFieldByPriority(category, rawProduct.Brand_Web_Retailer, rawProduct.Ferguson_Brand),
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

/**
 * Track creation requests sent to Salesforce for picklist items
 * This enables:
 * 1. Visibility into what's been requested from SF
 * 2. Duplicate prevention in future jobs
 * 3. Fulfillment matching when SF syncs back
 */
async function trackCreationRequests(
  rawProduct: SalesforceIncomingProduct,
  sessionId: string,
  brandRequests: BrandRequest[],
  categoryRequests: CategoryRequest[],
  styleRequests: StyleRequest[],
  attributeRequests: AttributeRequest[]
): Promise<void> {
  const jobReference = {
    job_id: sessionId,
    sf_catalog_id: rawProduct.SF_Catalog_Id || '',
    model_number: rawProduct.Model_Number_Web_Retailer || rawProduct.SF_Catalog_Name || '',
    requested_at: new Date()
  };
  
  // Track brand requests
  for (const req of brandRequests) {
    const result = await pendingCreationRequestService.checkAndCreateRequest({
      requestType: 'brand',
      requestedValue: req.brand_name,
      jobReference,
      context: {
        source: req.source,
        reason: req.reason
      }
    });
    
    if (!result.shouldSendToSF) {
      logger.info('[CreationTracker] Brand request already pending', {
        brand: req.brand_name,
        existingRequestId: result.request?.request_id
      });
    }
  }
  
  // Track category requests
  for (const req of categoryRequests) {
    const result = await pendingCreationRequestService.checkAndCreateRequest({
      requestType: 'category',
      requestedValue: req.category_name,
      jobReference,
      context: {
        suggested_for_category: req.suggested_department,
        source: req.source,
        reason: req.reason
      }
    });
    
    if (!result.shouldSendToSF) {
      logger.info('[CreationTracker] Category request already pending', {
        category: req.category_name,
        existingRequestId: result.request?.request_id
      });
    }
  }
  
  // Track style requests
  for (const req of styleRequests) {
    const result = await pendingCreationRequestService.checkAndCreateRequest({
      requestType: 'style',
      requestedValue: req.style_name,
      jobReference,
      context: {
        suggested_for_category: req.suggested_for_category,
        source: req.source,
        reason: req.reason
      }
    });
    
    if (!result.shouldSendToSF) {
      logger.info('[CreationTracker] Style request already pending', {
        style: req.style_name,
        existingRequestId: result.request?.request_id
      });
    }
  }
  
  // Track attribute requests
  for (const req of attributeRequests) {
    const result = await pendingCreationRequestService.checkAndCreateRequest({
      requestType: 'attribute',
      requestedValue: req.attribute_name,
      jobReference,
      context: {
        suggested_for_category: req.requested_for_category,
        source: req.source,
        reason: req.reason
      }
    });
    
    if (!result.shouldSendToSF) {
      logger.info('[CreationTracker] Attribute request already pending', {
        attribute: req.attribute_name,
        existingRequestId: result.request?.request_id
      });
    }
  }
  
  const totalTracked = brandRequests.length + categoryRequests.length + styleRequests.length + attributeRequests.length;
  if (totalTracked > 0) {
    logger.info('[CreationTracker] Tracked outbound requests', {
      sessionId,
      brands: brandRequests.length,
      categories: categoryRequests.length,
      styles: styleRequests.length,
      attributes: attributeRequests.length
    });
  }
}

/**
 * Capture AI Performance Metrics (Phase C)
 * 
 * Records individual AI outputs, disagreements, resolutions, and Claude's corrections
 * for post-job analysis. This enables learning from patterns to improve smart resolution.
 * 
 * CRITICAL: This runs AFTER job completion and does NOT influence current job results.
 * Claude's review remains independent - this is strictly for system improvement.
 */
async function captureAIPerformanceMetrics(
  sessionId: string,
  rawProduct: SalesforceIncomingProduct,
  openaiResult: AIAnalysisResult,
  xaiResult: AIAnalysisResult,
  consensus: ConsensusResult,
  claudeReview: ClaudeReviewResult | undefined,
  finalResponse: SalesforceVerificationResponse,
  dataSourceAnalysis: any,
  processingTimeMs: number
): Promise<void> {
  try {
    // Extract disagreements with their resolutions
    const disagreements = consensus.disagreements.map(d => ({
      field: d.field,
      openaiValue: d.openaiValue,
      xaiValue: d.xaiValue,
      smartResolutionWinner: d.resolution as 'openai' | 'xai' | 'combined' | 'not_found',
      smartResolutionReason: 'Resolved during consensus building' // Will be filled by smart resolution logs
    }));
    
    // Create performance metrics document
    const performanceMetrics = new AIPerformanceMetrics({
      jobId: sessionId,
      sfCatalogId: rawProduct.SF_Catalog_Id || 'unknown',
      sfCatalogName: rawProduct.SF_Catalog_Name || 'unknown',
      timestamp: new Date(),
      category: consensus.agreedCategory || 'unknown',
      
      openaiOutputs: {
        department: openaiResult.determinedDepartment,
        category: openaiResult.determinedCategory,
        primaryAttributes: openaiResult.primaryAttributes || {},
        top15Attributes: openaiResult.top15Attributes || {},
        confidence: openaiResult.confidence || 0
      },
      
      xaiOutputs: {
        department: xaiResult.determinedDepartment,
        category: xaiResult.determinedCategory,
        primaryAttributes: xaiResult.primaryAttributes || {},
        top15Attributes: xaiResult.top15Attributes || {},
        confidence: xaiResult.confidence || 0
      },
      
      disagreements,
      
      claudeReview: claudeReview ? {
        reviewStatus: claudeReview.reviewStatus,
        confidenceInResults: claudeReview.confidenceInResults,
        proposedCorrections: claudeReview.proposedCorrections || null,
        issues: claudeReview.issues || []
      } : null,
      
      finalValues: {
        department: finalResponse.Primary_Attributes?.AI_Product_Department || 'unknown',
        category: finalResponse.Primary_Attributes?.AI_Product_Category || 'unknown',
        type: finalResponse.Primary_Attributes?.AI_Type || null,
        style: finalResponse.Primary_Attributes?.AI_Style || null,
        brand: finalResponse.Primary_Attributes?.AI_Brand || null,
        color: finalResponse.Primary_Attributes?.AI_Color || null,
        finish: finalResponse.Primary_Attributes?.AI_Finish || null,
        msrp: finalResponse.Primary_Attributes?.AI_MSRP || null,
        product_title: finalResponse.Primary_Attributes?.AI_Product_Title || null,
        product_family: finalResponse.Primary_Attributes?.AI_Product_Family || null
      },
      
      processingTimeMs,
      dataSourceScenario: dataSourceAnalysis.scenario || 'unknown',
      hasFergusonData: dataSourceAnalysis.hasFergusonData || false,
      hasWebRetailerData: dataSourceAnalysis.hasWebData || false,
      imageAnalysisPerformed: dataSourceAnalysis.hasImages || false,
      webSearchPerformed: false // Will be updated if web search was triggered
    });
    
    await performanceMetrics.save();
    
    logger.info('📊 AI Performance Metrics captured', {
      sessionId,
      category: consensus.agreedCategory,
      disagreementCount: disagreements.length,
      claudeReviewed: !!claudeReview,
      claudeStatus: claudeReview?.reviewStatus
    });
    
  } catch (error) {
    logger.error('Failed to capture AI performance metrics', {
      sessionId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    // Don't throw - this is non-critical tracking
  }
}

// ═══════════════════════════════════════════════════════════════
// FINAL REVIEW STAGE - Post-Consensus Validation & Cross-Check
// ═══════════════════════════════════════════════════════════════

/**
 * Severity levels for validation issues
 */
type ValidationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Individual validation issue
 */
interface ValidationIssue {
  severity: ValidationSeverity;
  field: string;
  currentValue: any;
  issue: string;
  evidence?: string;
  suggestedFix?: any;
  ruleViolated?: string;
}

/**
 * Automated validation result (Phase A)
 */
interface AutomatedValidationResult {
  passed: boolean;
  confidence: number; // 0-100
  warnings: ValidationIssue[];
  corrections: ValidationIssue[];
  requiresAIReview: boolean;
  checksPerformed: string[];
}

/**
 * Claude review result (Phase B)
 */
interface ClaudeReviewResult {
  reviewStatus: 'PASS' | 'FLAG' | 'FAIL';
  confidenceInResults: number; // 0-100
  issues: ValidationIssue[];
  reasoning: string;
  reviewDuration?: number;
  proposedCorrections?: {
    category: string | null;
    department: string | null;
    type: string | null;
    style: string | null;
    title: string | null;
    finish: string | null;
    color: string | null;
    brand: string | null;
    model_number: string | null;
  } | null;
}

/**
 * Final review complete result
 */
interface FinalReviewResult {
  phaseAResult: AutomatedValidationResult;
  phaseBResult?: ClaudeReviewResult;
  finalStatus: 'PASS' | 'FLAG' | 'FAIL';
  correctionsApplied: ValidationIssue[];
  flaggedForReview: ValidationIssue[];
}

/**
 * Phase A: Automated Rule-Based Validation
 * Fast checks that don't require AI (5-10ms overhead)
 */
function performAutomatedValidation(
  consensus: ConsensusResult,
  primaryAttributes: PrimaryDisplayAttributes,
  topFilterAttributes: TopFilterAttributes,
  generatedTitle: string,
  rawProduct: SalesforceIncomingProduct,
  sessionId: string
): AutomatedValidationResult {
  const warnings: ValidationIssue[] = [];
  const corrections: ValidationIssue[] = [];
  const checksPerformed: string[] = [];
  let confidenceScore = 100;

  const category = consensus.agreedCategory || '';
  const department = primaryAttributes.AI_Product_Department || '';
  const productType = primaryAttributes.AI_Type || '';
  const title = (rawProduct.Product_Title_Web_Retailer || rawProduct.Product_Title_Legacy || '').toLowerCase();
  const description = (rawProduct.Product_Description_Web_Retailer || rawProduct.Product_Description_Legacy || '').toLowerCase();
  const fergusonTitle = (rawProduct.Ferguson_Title || '').toLowerCase();
  const combinedText = `${title} ${description} ${fergusonTitle}`;

  // ═══════════════════════════════════════════════════════════════
  // CHECK 1: Category Keyword Cross-Check
  // ═══════════════════════════════════════════════════════════════
  checksPerformed.push('category_keyword_match');
  
  const categoryKeywords: Record<string, string[]> = {
    'Faucet': ['faucet', 'tap', 'spout'],
    'Shower Head': ['shower', 'showerhead', 'rain head', 'hand shower'],
    'Range Hood': ['hood', 'vent', 'ventilation', 'cfm', 'exhaust'],
    'Chandelier': ['chandelier', 'pendant light', 'hanging light', 'ceiling light'],
    'Wall Sconce': ['sconce', 'wall light', 'wall lamp'],
    'Pendant': ['pendant', 'hanging light', 'suspension'],
    'Ceiling Fan': ['ceiling fan', 'fan', 'air circulator'],
    'Refrigerator': ['refrigerator', 'fridge', 'freezer'],
    'Range': ['range', 'stove', 'cooktop'],
    'Dishwasher': ['dishwasher'],
    'Oven': ['oven', 'wall oven'],
    'Cooktop': ['cooktop', 'cook top', 'burner', 'side burner', 'drop-in burner'],
    'Microwave': ['microwave'],
    'Cabinet Pull': ['cabinet pull', 'drawer pull', 'cabinet handle'],
    'Cabinet Knob': ['cabinet knob', 'drawer knob'],
    'Toilet': ['toilet', 'commode'],
    'Sink': ['sink', 'basin']
  };

  const requiredKeywords = categoryKeywords[category] || [];
  if (requiredKeywords.length > 0) {
    const hasKeyword = requiredKeywords.some(kw => combinedText.includes(kw));
    if (!hasKeyword) {
      warnings.push({
        severity: 'HIGH',
        field: 'category',
        currentValue: category,
        issue: `Selected category "${category}" but raw data lacks supporting keywords (${requiredKeywords.join(', ')})`,
        evidence: title.substring(0, 100),
        ruleViolated: 'CATEGORY_KEYWORD_MATCH'
      });
      confidenceScore -= 15;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CHECK 2: Department-Category Alignment
  // ═══════════════════════════════════════════════════════════════
  checksPerformed.push('department_category_alignment');
  
  const categoryDepartmentMap: Record<string, string> = {
    'Faucet': 'Plumbing',
    'Shower Head': 'Plumbing',
    'Shower System': 'Plumbing',
    'Toilet': 'Plumbing',
    'Sink': 'Plumbing',
    'Bathtub': 'Plumbing',
    'Range Hood': 'Appliances',
    'Refrigerator': 'Appliances',
    'Range': 'Appliances',
    'Dishwasher': 'Appliances',
    'Oven': 'Appliances',
    'Cooktop': 'Appliances',
    'Microwave': 'Appliances',
    'Washer': 'Appliances',
    'Dryer': 'Appliances',
    'Freezer': 'Appliances',
    'Wall Sconce': 'Lighting',
    'Chandelier': 'Lighting',
    'Pendant': 'Lighting',
    'Ceiling Fan': 'Lighting',
    'Table Lamp': 'Lighting',
    'Floor Lamp': 'Lighting',
    'Cabinet Pull': 'Hardware',
    'Cabinet Knob': 'Hardware',
    'Door Handle': 'Hardware',
    'Hinge': 'Hardware'
  };

  const expectedDepartment = categoryDepartmentMap[category];
  if (expectedDepartment && department !== expectedDepartment) {
    corrections.push({
      severity: 'HIGH',
      field: 'department',
      currentValue: department,
      suggestedFix: expectedDepartment,
      issue: `Department "${department}" doesn't match category "${category}" domain (should be "${expectedDepartment}")`,
      ruleViolated: 'DEPARTMENT_CATEGORY_ALIGNMENT'
    });
    confidenceScore -= 10;
  }

  // ═══════════════════════════════════════════════════════════════
  // CHECK 3: Accessory Pattern Validation
  // ═══════════════════════════════════════════════════════════════
  checksPerformed.push('accessory_pattern_validation');
  
  if (productType === 'Accessory') {
    const accessoryPatterns = [
      /for\s+(refrigerator|range|dishwasher|oven|cooktop|microwave|fridge|stove)/i,
      /compatible\s+with/i,
      /(replacement|spare)\s+part/i,
      /(handle|knob|rack|filter|kit|bracket|drawer|shelf)\s+for/i,
      /designed\s+for\s+\w+\s+model/i,
      /model\s+(number|#).*compatible/i
    ];

    const hasAccessoryPattern = accessoryPatterns.some(p => 
      p.test(title) || p.test(description)
    );

    if (!hasAccessoryPattern) {
      warnings.push({
        severity: 'HIGH',
        field: 'type',
        currentValue: 'Accessory',
        issue: 'Type set to "Accessory" but raw data lacks accessory indicators ("for [appliance]", "compatible with", "replacement part")',
        evidence: title.substring(0, 100),
        suggestedFix: 'Not Applicable',
        ruleViolated: 'ACCESSORY_PATTERN_VALIDATION'
      });
      confidenceScore -= 15;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CHECK 4: Title Schema Verification
  // ═══════════════════════════════════════════════════════════════
  checksPerformed.push('title_schema_verification');
  
  // Get category title schema to check title structure
  // Note: We're doing a simplified check here - just verifying title length and basic structure
  // Full title schema validation happens in seo-title-generator.service.ts
  // This check is just to flag obviously problematic titles
  
  // Import the getCategoryTitleSchema function at runtime to avoid circular dependency
  const { getCategoryTitleSchema } = require('../config/title-schema-by-category');
  const titleSchema = getCategoryTitleSchema(category);
  
  if (titleSchema && titleSchema.slots) {
    const generatedTitleLower = generatedTitle.toLowerCase();
    const missingSlots: string[] = [];

    // Check if critical slots appear in title
    for (const slot of titleSchema.slots) {
      if (slot.priority === 'critical' && slot.source) {
        const slotValue = topFilterAttributes[slot.source];
        
        if (slotValue && slotValue !== 'Not Found' && slotValue !== 'Not Applicable' && slotValue !== 'Procurement No Results') {
          const normalizedValue = String(slotValue).toLowerCase().replace(/[^a-z0-9]/g, '');
          const titleNormalized = generatedTitleLower.replace(/[^a-z0-9]/g, '');
          
          // Only flag if value is substantial (>3 chars) and missing
          if (!titleNormalized.includes(normalizedValue) && normalizedValue.length > 3) {
            missingSlots.push(slot.label);
          }
        }
      }
    }

    if (missingSlots.length > 0) {
      warnings.push({
        severity: 'MEDIUM',
        field: 'title',
        currentValue: generatedTitle.substring(0, 80),
        issue: `Generated title may be missing critical attributes for category "${category}": ${missingSlots.join(', ')}`,
        ruleViolated: 'TITLE_SCHEMA_COMPLETENESS'
      });
      confidenceScore -= 5;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CHECK 5: Title Length Validation
  // ═══════════════════════════════════════════════════════════════
  checksPerformed.push('title_length_validation');
  
  const titleLength = generatedTitle.length;
  if (titleLength < 40) {
    warnings.push({
      severity: 'LOW',
      field: 'title',
      currentValue: generatedTitle,
      issue: `Generated title too short (${titleLength} chars, recommended 60-150)`,
      ruleViolated: 'TITLE_LENGTH_MINIMUM'
    });
    confidenceScore -= 3;
  } else if (titleLength > 200) {
    warnings.push({
      severity: 'LOW',
      field: 'title',
      currentValue: generatedTitle.substring(0, 80) + '...',
      issue: `Generated title too long (${titleLength} chars, recommended 60-150)`,
      ruleViolated: 'TITLE_LENGTH_MAXIMUM'
    });
    confidenceScore -= 3;
  }

  // ═══════════════════════════════════════════════════════════════
  // CHECK 6: 🇨🇦 Canadian Data Conversion Validation
  // ═══════════════════════════════════════════════════════════════
  checksPerformed.push('canadian_conversion_validation');
  
  const webRetailerKey = rawProduct.Web_Retailer_Key || '';
  const isCanadianData = webRetailerKey.toUpperCase().startsWith('CA_');
  
  if (isCanadianData) {
    logger.info('🇨🇦 Phase A: Canadian data detected - validating conversions', {
      sessionId,
      webRetailerKey
    });
    
    // Check MSRP conversion against Ferguson
    const convertedMSRP = rawProduct.MSRP_Web_Retailer;
    const fergusonMSRP = rawProduct.Ferguson_Price;
    
    if (fergusonMSRP && convertedMSRP) {
      const fergusonPrice = parseFloat(String(fergusonMSRP));
      const convertedPrice = parseFloat(String(convertedMSRP));
      
      if (!isNaN(fergusonPrice) && !isNaN(convertedPrice) && fergusonPrice > 0) {
        const priceDiff = Math.abs(fergusonPrice - convertedPrice);
        const percentDiff = (priceDiff / fergusonPrice) * 100;
        
        if (percentDiff > 30) {
          warnings.push({
            severity: 'HIGH',
            field: 'msrp',
            currentValue: `$${convertedPrice} USD (converted)`,
            issue: `Canadian MSRP conversion shows ${percentDiff.toFixed(1)}% difference from Ferguson price. May indicate conversion error or data quality issue.`,
            evidence: `Ferguson: $${fergusonPrice} USD (US market baseline) vs Converted Web Retailer: $${convertedPrice} USD`,
            suggestedFix: `Use Ferguson price: $${fergusonPrice} USD`,
            ruleViolated: 'CANADIAN_CONVERSION_VALIDATION'
          });
          confidenceScore -= 10;
          
          logger.warn('⚠️ Phase A: Large MSRP discrepancy detected in Canadian conversion', {
            sessionId,
            fergusonPrice,
            convertedPrice,
            percentDiff: percentDiff.toFixed(1)
          });
        }
      }
    }
    
    // Check Weight conversion against Ferguson (if available)
    const convertedWeight = rawProduct.Weight_Web_Retailer;
    const fergusonWeightAttr = rawProduct.Ferguson_Attributes?.find(attr => 
      attr.name?.toLowerCase().includes('weight') || attr.name?.toLowerCase().includes('shipping weight')
    );
    const fergusonWeight = fergusonWeightAttr?.value || null;
    
    if (fergusonWeight && convertedWeight) {
      const fergusonLbs = parseFloat(String(fergusonWeight));
      const convertedLbs = parseFloat(String(convertedWeight));
      
      if (!isNaN(fergusonLbs) && !isNaN(convertedLbs) && fergusonLbs > 0) {
        const weightDiff = Math.abs(fergusonLbs - convertedLbs);
        const percentDiff = (weightDiff / fergusonLbs) * 100;
        
        if (percentDiff > 30) {
          warnings.push({
            severity: 'MEDIUM',
            field: 'weight',
            currentValue: `${convertedLbs} lbs (converted)`,
            issue: `Canadian weight conversion shows ${percentDiff.toFixed(1)}% difference from Ferguson weight. May indicate conversion error.`,
            evidence: `Ferguson: ${fergusonLbs} lbs (US market baseline) vs Converted Web Retailer: ${convertedLbs} lbs`,
            suggestedFix: `Use Ferguson weight: ${fergusonLbs} lbs`,
            ruleViolated: 'CANADIAN_CONVERSION_VALIDATION'
          });
          confidenceScore -= 5;
          
          logger.warn('⚠️ Phase A: Weight discrepancy detected in Canadian conversion', {
            sessionId,
            fergusonLbs,
            convertedLbs,
            percentDiff: percentDiff.toFixed(1)
          });
        }
      }
    }
  }

  // Calculate final confidence score (capped at 0-100)
  confidenceScore = Math.max(0, Math.min(100, confidenceScore));

  // Determine if AI review is needed
  // ⚠️ CRITICAL: Claude should audit EVERYTHING - final line of defense
  const requiresAIReview = true; // Always require Claude Final Review
  
  // Legacy conditions (kept for reference):
  // - confidenceScore < 90
  // - productType === 'Accessory'  
  // - warnings.some(w => w.severity === 'HIGH' || w.severity === 'CRITICAL')
  // - corrections.length > 0
  // - disagreementCount > 3 (AI disagreements)
  // - Canadian data conversions
  // But Claude's purpose is to catch what automated checks miss - so audit all jobs

  const passed = confidenceScore >= 85 && warnings.filter(w => w.severity === 'HIGH' || w.severity === 'CRITICAL').length === 0;

  logger.info('🔍 FINAL REVIEW - Phase A (Automated Validation) complete', {
    sessionId,
    passed,
    confidence: confidenceScore,
    warningCount: warnings.length,
    correctionCount: corrections.length,
    requiresAIReview,
    checksPerformed: checksPerformed.length,
    category,
    department
  });

  return {
    passed,
    confidence: confidenceScore,
    warnings,
    corrections,
    requiresAIReview,
    checksPerformed
  };
}

/**
 * Phase B: Claude Cross-Check (AI Review)
 * Comprehensive review by Claude Sonnet to catch nuanced errors
 * 
 * CRITICAL: Claude receives the SAME picklist data, schemas, and business rules
 * that our main AI verification uses. This ensures Claude's proposed fixes are
 * valid, actionable values from our system - not generic guesses.
 * 
 * Only invoked for jobs that Phase A flagged for review
 */
async function performClaudeReview(
  consensus: ConsensusResult,
  primaryAttributes: PrimaryDisplayAttributes,
  _topFilterAttributes: TopFilterAttributes,
  generatedTitle: string,
  rawProduct: SalesforceIncomingProduct,
  phaseAWarnings: ValidationIssue[],
  sessionId: string
): Promise<ClaudeReviewResult> {
  const startTime = Date.now();

  const category = consensus.agreedCategory || '';
  const department = primaryAttributes.AI_Product_Department || '';
  const productType = primaryAttributes.AI_Type || '';
  const style = primaryAttributes.AI_Style || '';

  // ═══════════════════════════════════════════════════════════════
  // LOAD REAL SYSTEM DATA - Same schemas/picklists our AIs use
  // Claude must have EQUIVALENT context to the primary AIs to audit effectively
  // ═══════════════════════════════════════════════════════════════
  
  // Get ALL valid categories with their departments
  const allCategories = getAllCategories();
  const allDepartments = getAllDepartments();
  
  // Get valid types for the CURRENT category and nearby categories
  const validTypesForCategory = getValidTypesForCategory(category);
  
  // Get valid styles
  const validStyles = getValidStylesForCategory(category);
  
  // Get the correct department for this category
  const correctDepartmentForCategory = getDepartmentForCategory(category);
  
  // Get title schema for the category
  const { getCategoryTitleSchema } = require('../config/title-schema-by-category');
  const titleSchema = getCategoryTitleSchema(category);
  
  // NEW: Get type hierarchy explanation (same as Stage 3 AIs receive)
  const typeHierarchy = getTypeHierarchyExplanation();
  
  // NEW: Get top-15 filter attributes for this category (same as Stage 3 AIs receive)
  const categorySchema = getCategorySchema(category);
  const top15Info = categorySchema 
    ? categorySchema.top15FilterAttributes.map((a: any) => `  ${a.rank}. ${a.name} (key: ${a.fieldKey})`).join('\n')
    : 'No filter attributes defined for this category';
  
  // NEW: Sanitize full product data (same as what primary AIs receive)
  const cleanProductData = sanitizeProductDataForAI(rawProduct);
  // Compact JSON: include all fields but truncate very long values
  const productDataForClaude = Object.entries(cleanProductData)
    .filter(([_, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => {
      const strVal = typeof v === 'string' ? v : JSON.stringify(v);
      // Truncate individual field values at 800 chars but keep ALL fields
      return `${k}: ${(strVal as string).length > 800 ? (strVal as string).substring(0, 800) + '...[truncated]' : strVal}`;
    }).join('\n');
  
  // Build a compact category→department reference (not all 161, just relevant ones)
  const categoryDeptReference = allCategories.map((c: string) => {
    const dept = getDepartmentForCategory(c);
    return `${c} → ${dept || 'Unknown'}`;
  }).join('\n');

  // Build warning summary for Claude
  const warningsSummary = phaseAWarnings.length > 0
    ? phaseAWarnings.map(w => `⚠️  [${w.severity}] ${w.field}: ${w.issue}`).join('\n')
    : 'No automated validation warnings';
  
  // Build title schema info
  const titleSchemaInfo = titleSchema 
    ? `Template: ${titleSchema.template}\nRequired Slots: ${titleSchema.slots.filter((s: any) => s.required).map((s: any) => s.attribute).join(', ')}\nAll Slots: ${titleSchema.slots.map((s: any) => `${s.attribute}${s.required ? '*' : ''}`).join(', ')}\nExample: ${titleSchema.exampleTitle}`
    : 'No title schema found for this category';
  
  // NEW: Build per-category type selection guide (same logic as getCategorySpecificPrompt)
  let typeSelectionGuide = '';
  if (validTypesForCategory.length > 0) {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('refrigerator')) {
      typeSelectionGuide = `\nTYPE SELECTION GUIDE FOR REFRIGERATOR:
Check for ACCESSORIES FIRST (highest priority):
  • "Panel Kit" / "Door Panel Kit" / "Custom Panel Kit" → Type: Accessory
  • "Installation Kit" / "Trim Kit" / "Unification Kit" → Type: Accessory
  • "Handle Kit" / "Door Handle" / "Handle Assembly" → Type: Accessory
  • "Shelf" / "Shelving" / "Rack" / "Bin" / "Drawer" → Type: Accessory
  • "Filter" / "Water Filter" / "Air Filter" → Type: Accessory
  • ANY product that is a PART or COMPONENT, not a complete refrigerator → Type: Accessory
CRITICAL: "Panel Kit" = ACCESSORY (panels sold separately for panel-ready appliances)
IF NOT AN ACCESSORY, check specialized types first:
  • "Wine Cooler" / "Wine Storage" → Wine Cooler
  • "Beverage Center" / "Beverage Cooler" → Beverage Center
  • "Kegerator" / "Keg" / "Beer Dispenser" → Kegerator
Then check door configuration: French Door, Side-by-Side, Top-Freezer, Bottom-Freezer, Column, 4-Door Flex
Then installation: Undercounter, Freestanding`;
    } else if (categoryLower.includes('ceiling fan')) {
      typeSelectionGuide = `\nTYPE SELECTION GUIDE FOR CEILING FAN:
CHECK FOR ACCESSORIES FIRST:
  • "Downrod" / "Remote" / "Light Kit" / "Blades" / "Canopy" → Type: Accessory
IF NOT ACCESSORY: Hugger (flush mount/low profile) → Outdoor (wet/damp rated) → Indoor
Priority: Accessory → Hugger → Outdoor → Indoor`;
    } else if (categoryLower.includes('dryer') || categoryLower.includes('washer')) {
      typeSelectionGuide = `\nTYPE SELECTION GUIDE FOR ${category.toUpperCase()}:
Type = LOADING CONFIGURATION ONLY:
  • Front Load / Top Load / Unitized (Laundry Center)
  • Gas/Electric/Heat Pump are FUEL TYPE attributes, NOT types
  • Vented/Ventless are VENT TYPE attributes, NOT types`;
    } else if (categoryLower.includes('oven')) {
      typeSelectionGuide = `\nTYPE SELECTION GUIDE FOR OVEN:
Analyze cavity count and form factor: Single, Double Wall, Microwave Combo`;
    } else if (categoryLower.includes('icemaker') || categoryLower.includes('ice maker')) {
      typeSelectionGuide = `\nTYPE SELECTION GUIDE FOR ICEMAKER:
Type = Installation method. Priority: ADA → Panel Ready → Outdoor → Portable → Undercounter/Freestanding
If dual-capable (both undercounter + freestanding), default to Undercounter`;
    } else if (categoryLower.includes('showerhead') || categoryLower === 'showerheads & accessories') {
      typeSelectionGuide = `\nTYPE SELECTION GUIDE FOR SHOWERHEADS & ACCESSORIES:
⚠️ CRITICAL: "Thermostatic" and "Pressure Balance" are VALVE TECHNOLOGIES, not product types!
Type = PRODUCT ASSEMBLY TYPE (what the complete product is):
  1. System/Kit/Package with MULTIPLE components → Shower System
     - "Trim Package with Shower Head" = Shower System
     - "Valve Trim with Diverter for multiple outputs" = Shower System
  2. Single shower head: Rain Head, Showerhead, or Handheld
  3. Single valve trim only (no head): Trim or Thermostatic Valve Trim
  4. Body spray, Diverter, Volume Control → use those types
  5. Use "Thermostatic" ONLY for standalone valve bodies/cartridges with NO other components`;
    }
  }

  // Get category mapping for logic field
  const categoryMapping = getCategoryTypeMapping(category);

  const reviewPrompt = `You are performing a FINAL REVIEW of an AI-verified product catalog entry.
Your job is to catch mistakes AND PROPOSE CONCRETE SOLUTIONS using our actual system data.

TWO AIs (OpenAI GPT-4 and xAI Grok) already analyzed this product and reached consensus.
Your role: Find errors and provide EXACT corrected values from OUR picklists.

⚠️ CRITICAL RULES:
- ALL suggested fixes MUST use values from the VALID OPTIONS sections below
- Do NOT invent categories, types, or departments - use ONLY what's listed
- The "logic" field describes what the TYPE dimension represents, but you must ONLY choose from the actual type values listed
- If you propose a category change, also propose the correct department and valid types
- Every FAIL must include a complete proposed solution, not just what's wrong

═══════════════════════════════════════════════════════════════
PRODUCT TYPE HIERARCHY (Our classification system):
═══════════════════════════════════════════════════════════════

${typeHierarchy}

═══════════════════════════════════════════════════════════════
VALID OPTIONS FROM OUR SYSTEM (Use ONLY these values):
═══════════════════════════════════════════════════════════════

VALID DEPARTMENTS (${allDepartments.length} total):
${allDepartments.join(', ')}

VALID CATEGORIES BY DEPARTMENT:
${categoryDeptReference}

VALID TYPES FOR "${category}" (current category):
📋 Type Logic: "${categoryMapping?.logic || 'Product variation'}"
   (This describes WHAT type means for this category - e.g., "Fuel source" means type = Gas/Electric/etc.)
   
✅ ALLOWED TYPE VALUES (choose ONLY from this list):
${validTypesForCategory.length > 0 ? validTypesForCategory.join(', ') : 'No types defined for this category'}

⚠️ CRITICAL TYPE SELECTION RULES:
  • You MUST select from the list above - these are the ONLY valid values
  • Do NOT use types from other categories (e.g., "Built-In" is a Microwave type, NOT valid for Barbeque)
  • If raw data shows info that matches the logic description but is NOT in the list:
    → Put it in filter_attributes or appliance_features, NOT in type field
  • Example: Barbeque type logic is "Fuel source and style" → Type must be Gas/Electric/Charcoal/etc.
  • Example: If Barbeque product is "Built-In", put in filter_attributes.installation_type, NOT type
${typeSelectionGuide}

VALID STYLES FOR "${category}":
${validStyles.join(', ')}

CORRECT DEPARTMENT FOR "${category}": ${correctDepartmentForCategory || 'NOT FOUND'}

TOP-15 FILTER ATTRIBUTES FOR "${category}":
${top15Info}

═══════════════════════════════════════════════════════════════
TITLE SCHEMA FOR "${category}":
═══════════════════════════════════════════════════════════════

${titleSchemaInfo}

ACCESSORY TITLE FORMAT (if Type = "Accessory"):
For accessories, our title system automatically reorders slots to:
  {Brand} {Width} {Category} {Finish} {Specific Subtype} - {Model}
  Example: "JENNAIR 18-Inch Refrigerator Stainless Steel Panel Kit - JKCPR181GL"
The specific subtype (e.g., "Panel Kit", "Handle Kit", "Water Filter") is extracted 
from the raw product title. The word "Accessory" NEVER appears in the generated title.
If proposing a title for an accessory, follow this pattern.

═══════════════════════════════════════════════════════════════
COMPLETE RAW PRODUCT DATA (Ground Truth - ALL fields):
═══════════════════════════════════════════════════════════════

${productDataForClaude}

═══════════════════════════════════════════════════════════════
DATA SOURCE TRUST HIERARCHY (Same rules our primary AIs use):
═══════════════════════════════════════════════════════════════

Tier 1 (MOST TRUSTED): Ferguson_Raw_Data, Ferguson_Title, Ferguson_* fields
Tier 2: *_Web_Retailer fields (Product_Title_Web_Retailer, Brand_Web_Retailer, etc.)
Tier 3: AI's own analysis and web data
Tier 4 (LEAST TRUSTED): *_Legacy fields — use ONLY for directional hints, NOT as truth

When sources conflict, prefer higher-tier data.

═══════════════════════════════════════════════════════════════
AI VERIFICATION RESULTS (What both AIs agreed on):
═══════════════════════════════════════════════════════════════

CORE CLASSIFICATION:
  Category: ${category}
  Department: ${department}
  Type: ${productType}
  Style: ${style}
  
PRIMARY ATTRIBUTES (28 fields):
  Brand: ${primaryAttributes.AI_Brand || 'N/A'}
  Model Number: ${primaryAttributes.AI_Model_Number || 'N/A'}
  Product Title: ${generatedTitle}
  Description: ${primaryAttributes.AI_Description ? (primaryAttributes.AI_Description.length > 100 ? primaryAttributes.AI_Description.substring(0, 100) + '...' : primaryAttributes.AI_Description) : 'N/A'}
  UPC/GTIN: ${primaryAttributes.AI_UPC_GTIN || 'N/A'}
  Color: ${primaryAttributes.AI_Color || 'N/A'}
  Finish: ${primaryAttributes.AI_Finish || 'N/A'}
  Width: ${primaryAttributes.AI_Width || 'N/A'}
  Height: ${primaryAttributes.AI_Height || 'N/A'}
  Depth: ${primaryAttributes.AI_Depth || 'N/A'}
  Weight: ${primaryAttributes.AI_Weight || 'N/A'}
  MSRP: ${primaryAttributes.AI_MSRP || 'N/A'}
  Product Filter Class: ${primaryAttributes.AI_Product_Filter_Class || 'N/A'}
  Features: ${primaryAttributes.AI_Features ? (typeof primaryAttributes.AI_Features === 'string' ? (primaryAttributes.AI_Features.length > 100 ? primaryAttributes.AI_Features.substring(0, 100) + '...' : primaryAttributes.AI_Features) : 'Multiple features') : 'N/A'}
  Model Parent: ${primaryAttributes.AI_Model_Parent || 'N/A'}
  Model Alias: ${primaryAttributes.AI_Model_Alias || 'N/A'}
  Model Variant: ${primaryAttributes.AI_Model_Variant_Number || 'N/A'}
  Total Variants: ${primaryAttributes.AI_Total_Model_Variants || 'N/A'}
  Product Family: ${primaryAttributes.AI_Product_Family || 'N/A'}

APPLIANCE FEATURES (if Category = Appliances):
  Built-In: ${(consensus as any).applianceFeatures?.built_in || 'false'}
  Panel Ready: ${(consensus as any).applianceFeatures?.panel_ready || 'false'}
  Counter Depth: ${(consensus as any).applianceFeatures?.counter_depth || 'false'} (Refrigerator/Freezer only)
  Standard Depth: ${(consensus as any).applianceFeatures?.standard_depth || 'false'} (Refrigerator/Freezer only)
  Voltage 120V: ${(consensus as any).applianceFeatures?.voltage_120v || 'false'}
  Voltage 240V: ${(consensus as any).applianceFeatures?.voltage_240v || 'false'}
  Fuel Gas: ${(consensus as any).applianceFeatures?.fuel_gas || 'false'}
  Fuel Electric: ${(consensus as any).applianceFeatures?.fuel_electric || 'false'}

TOP FILTER ATTRIBUTES (category-specific):
${Object.entries(_topFilterAttributes || {}).slice(0, 10).map(([k, v]) => `  ${k}: ${v}`).join('\n') || '  (none defined)'}

PRICE ANALYSIS:
  Extracted MSRP: ${primaryAttributes.AI_MSRP || '$0'}
  Ferguson Price: ${rawProduct.Ferguson_Price || 'N/A'}
  Web Retailer MSRP: ${rawProduct.MSRP_Web_Retailer || 'N/A'}

═══════════════════════════════════════════════════════════════
AUTOMATED VALIDATION WARNINGS (Phase A detected these):
═══════════════════════════════════════════════════════════════

${warningsSummary}

═══════════════════════════════════════════════════════════════
YOUR TASK - Comprehensive Review AND Propose Solutions:
═══════════════════════════════════════════════════════════════

**SECTION 1: CORE CLASSIFICATION**
⚠️ Category ("${category}") and Department ("${department}") have already been determined by TWO independent AIs with consensus. DO NOT review or propose changes to category or department — those are locked.
1. **Type**: Is "${productType}" valid? If wrong, pick from VALID TYPES for the category "${category}"
2. **Accessory Detection**: If raw data shows "for [appliance]", "replacement", "compatible with" → Type should be "Accessory"
3. **Style**: Is "${style}" reasonable for this product?

**SECTION 2: PRIMARY ATTRIBUTES (check all 28 fields)**
6. **Brand**: Correct brand name from Ferguson_Brand or Brand_Web_Retailer?
7. **Model Number**: Correct model from Ferguson_Model_Number or Model_Number_Web_Retailer?
8. **Product Title**: Does "${generatedTitle}" represent this product? Check length (60-80 chars ideal), schema compliance, clarity
9. **Description**: Quality check - descriptive, grammar correct, not just bullet points?
10. **UPC/GTIN**: Valid 12-14 digit code from raw data?
11. **Color**: Matches Ferguson_Color or Color_Web_Retailer? Not mixing color with finish?
12. **Finish**: Matches Ferguson_Finish or Finish_Web_Retailer? Examples: Stainless Steel, Matte Black, Polished Chrome
13. **Dimensions (Width/Height/Depth)**: Numeric values with units? Match raw data?
14. **Weight**: Numeric value in lbs (not kg)? Match Weight_Web_Retailer or Ferguson weight attribute?
15. **MSRP**: Valid price from Ferguson_Price or MSRP_Web_Retailer? Not $0 for premium brands?
16. **Product Filter Class**: Correct tier (Premium, Mid-Tier, Budget) based on brand and price?
17. **Features List**: Relevant features extracted from Ferguson_Raw_Data or Product_Description_Web_Retailer?
18. **Model Parent/Alias/Variant**: Correct model hierarchy from raw data?
19. **Product Family**: Brand's product line name (e.g., "Chef Collection", "Signature Kitchen Suite")?

**SECTION 3: APPLIANCE FEATURES (if Appliances dept)**
20. **Built-In**: Check installation_type from raw data - should be true if "Built-In" mentioned
21. **Panel Ready**: Check if "Panel Ready" / "Custom Panel" / "requires custom panel" in raw data
22. **Standard Depth vs Full Depth**: Check depth measurement - standard ~24-25", full/counter depth ~30-36"
23. **Voltage**: Check specifications - 120V (small appliances), 240V (ranges, dryers, ovens)
24. **Fuel Type**: Check fuel_type from raw data - gas vs electric (for ranges, dryers, cooktops, ovens)

**SECTION 4: FILTER ATTRIBUTES (category-specific top 5-10)**
25. **Installation Type**: For Appliances - Built-In, Freestanding, Undercounter, Column, etc.
26. **Fuel Type**: For gas-capable categories - Natural Gas, Propane, Dual Fuel, Electric
27. **Material**: For Plumbing/Hardware - Brass, Stainless Steel, Plastic, Bronze, etc.
28. **Finish Type**: For visible products - Polished, Brushed, Matte, Satin, Oil-Rubbed
29. **Connection Type**: For Plumbing - Compression, Threaded, Push-to-Connect, Solder
30. **Other relevant filters**: Check top 5-10 attributes defined for this category

**SECTION 5: PRICE VALIDATION (5 checks)**
31. **Data Source Match**: Does extracted MSRP match Ferguson_Price or MSRP_Web_Retailer?
32. **Price Reasonableness**: Check category benchmarks (Appliances $200-$15K, Plumbing $50-$5K, Lighting $50-$3K)
33. **Source Consistency**: If both Ferguson + Web Retailer exist, <30% price difference?
34. **Missing Price Detection**: Premium brands (Sub-Zero, Wolf, Miele, etc.) should NOT have $0 MSRP
35. **Format Validation**: MSRP must be positive number, not negative, not text, not null

**SECTION 6: 🇨🇦 CANADIAN DATA CONVERSION VALIDATION (CRITICAL)**
CHECK Web_Retailer_Key field:
  → If Web_Retailer_Key starts with "CA_" → This is CANADIAN product data
  → Canadian data requires conversion: CAD→USD (exchange rate ~0.73), kg→lbs (factor 2.20462)
  → The MSRP_Web_Retailer and Weight_Web_Retailer values are ALREADY CONVERTED to USD and lbs
  
⚠️ YOUR TASK FOR CANADIAN DATA:
36. **Validate Conversion Against Ferguson**: Compare converted MSRP_Web_Retailer to Ferguson_Price
    - If Ferguson_Price exists and differs by >30% from converted MSRP → FLAG as conversion error
    - Ferguson is ALWAYS US market data (most reliable) - use it as ground truth
    - Example: If converted MSRP = $1057 but Ferguson = $2500 → ERROR (57% difference)
37. **Weight Validation**: If Ferguson has weight attribute, compare to converted Weight_Web_Retailer
    - Large difference (>30%) may indicate incorrect conversion or data quality issue
38. **Check for Missing Conversions**: If Canadian data but MSRP_Web_Retailer looks like CAD price
    - Example: If high value like $3699 and Ferguson = $2700 → may be unconverted CAD
39. **Flag N/A Cases**: If Canadian but MSRP_Web_Retailer is empty/N/A
    - Should cross-reference with Ferguson_Price or mark as data gap
40. **Always Use Ferguson When Available**: For Canadian data with Ferguson match, PRIORITIZE Ferguson values
    - Ferguson is always US market, already in USD and lbs - no conversion needed

If you detect Canadian data conversion issues, return FAIL with HIGH/CRITICAL severity.

⚠️ CRITICAL ACCESSORY RULE — READ CAREFULLY:
If Type is "Accessory" and the product is an accessory, part, kit, panel, handle, filter, 
shelf, or component FOR a product in the current category, then:
  ✅ The current CATEGORY IS CORRECT — it stays as the parent product's category
  ✅ The current DEPARTMENT IS CORRECT — accessories inherit the parent category's department
  ✅ Type "Accessory" IS CORRECT — it's listed as a valid type for this category
  ❌ Do NOT re-categorize accessories to a different category (e.g., "Cabinet Finishing", "Hardware")
  ❌ Do NOT change the department away from the parent product's department

Examples:
  - "Refrigerator Panel Kit" → Category: Refrigerator, Type: Accessory, Dept: Appliances ✅
  - "Dishwasher Handle Kit" → Category: Dishwasher, Type: Accessory, Dept: Appliances ✅
  - "Range Hood Blower" → Category: Range Hood, Type: Accessory, Dept: Appliances ✅
  - "Ceiling Fan Remote Control" → Category: Ceiling Fan, Type: Accessory, Dept: Lighting ✅
  The product is FOR that category — it belongs IN that category as an Accessory type.

"Accessory" is in the VALID TYPES list above for "${category}". Respect the hierarchy.

═══════════════════════════════════════════════════════════════
RESPONSE FORMAT (JSON ONLY):
═══════════════════════════════════════════════════════════════

{
  "reviewStatus": "PASS" | "FLAG" | "FAIL",
  "confidenceInResults": 0-100,
  "issues": [
    {
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "field": "category" | "department" | "type" | "style" | "title" | "brand" | "model_number" | "color" | "finish" | "width" | "height" | "depth" | "weight" | "msrp" | "description" | "features" | "upc_gtin" | "product_filter_class" | "appliance_features" | "filter_attributes" | "price_analysis",
      "currentValue": "what AI selected",
      "issue": "Clear description of the problem",
      "evidence": "Direct quote from raw data proving the error",
      "suggestedFix": "EXACT value from our valid picklist options above or corrected value from raw data"
    }
  ],
  "proposedCorrections": {
    // CORE CLASSIFICATION (category and department are LOCKED — do not propose changes)
    "category": null,
    "department": null,
    "type": "exact valid type for ${category} or null if correct",
    "style": "exact valid style or null if correct",
    
    // PRIMARY ATTRIBUTES (set to corrected value or null if correct)
    "brand": "corrected brand from raw data or null",
    "model_number": "corrected model from raw data or null",
    "title": "proposed corrected title using schema slots or null if correct",
    "description": "improved description or null if correct",
    "color": "corrected color from raw data or null",
    "finish": "corrected finish from raw data or null",
    "width": "corrected width with units or null",
    "height": "corrected height with units or null",
    "depth": "corrected depth with units or null",
    "weight": "corrected weight in lbs or null",
    "msrp": "corrected MSRP from raw data or null",
    "product_filter_class": "Premium|Mid-Tier|Budget or null",
    "upc_gtin": "corrected UPC from raw data or null",
    "features": "corrected features list or null",
    "model_parent": "corrected model parent or null",
    "model_alias": "corrected model alias or null",
    "model_variant_number": "corrected variant number or null",
    "total_model_variants": "corrected total variants or null",
    "product_family": "corrected product family or null",
    
    // APPLIANCE FEATURES (if Appliances dept - object with corrected booleans or null)
    "appliance_features": {
      "built_in": true|false|null,
      "panel_ready": true|false|null,
      "standard_depth": true|false|null,
      "full_depth": true|false|null,
      "voltage_120v": true|false|null,
      "voltage_240v": true|false|null,
      "fuel_gas": true|false|null,
      "fuel_electric": true|false|null
    } | null,
    
    // FILTER ATTRIBUTES (category-specific - object with corrected values or null)
    "filter_attributes": {
      "attribute_name": "corrected value or null"
    } | null,
    
    // PRICE VALIDATION (if price issues detected)
    "price_issues": [
      "issue description (e.g., 'MSRP $0 for premium brand Sub-Zero')"
    ] | null
  },
  "reasoning": "Brief explanation of your overall assessment and WHY these corrections are needed. Focus on HIGH and CRITICAL issues first."
}

RULES:
- Category and department are LOCKED by 2-AI consensus. Always set "category": null and "department": null in proposedCorrections.
- proposedCorrections values MUST come from the VALID OPTIONS listed above (for type/style)
- For other fields, use EXACT values from raw product data (Ferguson_* or *_Web_Retailer fields)
- If a field is correct, set it to null in proposedCorrections
- Only flag issues with CLEAR EVIDENCE from raw data
- If results look correct, return "PASS" with empty issues and all-null proposedCorrections
- For FAIL: you MUST provide complete proposedCorrections - never fail without a solution
- CRITICAL severity: Wrong type (classification errors)
- HIGH severity: Wrong brand, model, MSRP, dimensions, appliance features
- MEDIUM severity: Wrong color, finish, filter attributes, description quality
- LOW severity: Missing optional fields, minor title formatting
- Return ONLY the JSON object, no other text`;


  try {
    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    });

    logger.info('🔍 FINAL REVIEW - Phase B: Sending to Claude with full context', {
      sessionId,
      promptLength: reviewPrompt.length,
      productFieldCount: Object.keys(cleanProductData).filter(k => cleanProductData[k]).length,
      hasTypeSelectionGuide: typeSelectionGuide.length > 0,
      hasTop15Attributes: categorySchema !== null,
      category,
      productType
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      temperature: 0.2,
      messages: [{ role: 'user', content: reviewPrompt }]
    });

    const reviewText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Log stop reason to detect truncation
    logger.info('🔍 FINAL REVIEW - Phase B: Claude response received', {
      sessionId,
      stopReason: response.stop_reason,
      responseLength: reviewText.length,
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens
    });
    
    // Check for truncation before parsing
    if (response.stop_reason !== 'end_turn') {
      logger.warn('⚠️ FINAL REVIEW - Phase B: Claude response may be truncated', {
        sessionId,
        stopReason: response.stop_reason,
        outputTokens: response.usage?.output_tokens,
        maxTokens: 4000
      });
    }

    // Parse Claude's JSON response
    let reviewResult: ClaudeReviewResult;
    try {
      // Strip markdown code blocks and any text before/after JSON
      let cleanedText = reviewText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      // Also try to extract JSON object if there's surrounding text
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      const parsed = JSON.parse(cleanedText);
      
      // Validate proposed corrections use valid picklist values
      if (parsed.proposedCorrections) {
        const pc = parsed.proposedCorrections;
        
        // Validate proposed category exists in our system
        if (pc.category && !allCategories.includes(pc.category)) {
          logger.warn('🔍 FINAL REVIEW: Claude proposed invalid category, clearing', {
            sessionId,
            proposed: pc.category,
            validCategories: allCategories.length
          });
          pc.category = null;
        }
        
        // Validate proposed department exists
        if (pc.department && !allDepartments.includes(pc.department)) {
          logger.warn('🔍 FINAL REVIEW: Claude proposed invalid department, clearing', {
            sessionId,
            proposed: pc.department,
            validDepartments: allDepartments
          });
          pc.department = null;
        }
        
        // Validate proposed type - must be valid for the proposed (or current) category
        if (pc.type) {
          const targetCategory = pc.category || category;
          const validTypes = getValidTypesForCategory(targetCategory);
          if (validTypes.length > 0 && !validTypes.includes(pc.type)) {
            logger.warn('🔍 FINAL REVIEW: Claude proposed invalid type for category, clearing', {
              sessionId,
              proposed: pc.type,
              targetCategory,
              validTypes
            });
            pc.type = null;
          }
        }
        
        // Validate proposed style
        if (pc.style && !validStyles.includes(pc.style)) {
          logger.warn('🔍 FINAL REVIEW: Claude proposed invalid style, clearing', {
            sessionId,
            proposed: pc.style,
            validStyles
          });
          pc.style = null;
        }
      }
      
      reviewResult = {
        reviewStatus: parsed.reviewStatus || 'FLAG',
        confidenceInResults: parsed.confidenceInResults || 50,
        issues: (parsed.issues || []).map((issue: any) => ({
          ...issue,
          // Ensure suggestedFix values are validated against picklists
          suggestedFix: issue.suggestedFix || null
        })),
        reasoning: parsed.reasoning || '',
        reviewDuration: Date.now() - startTime,
        proposedCorrections: parsed.proposedCorrections || null
      };
    } catch (parseError) {
      logger.error('🔴 FINAL REVIEW - Phase B: Failed to parse Claude response', {
        sessionId,
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        responseLength: reviewText.length,
        responseFirst500: reviewText.substring(0, 500),
        responseLast200: reviewText.substring(Math.max(0, reviewText.length - 200))
      });
      
      reviewResult = {
        reviewStatus: 'FLAG',
        confidenceInResults: 50,
        issues: [{
          severity: 'MEDIUM',
          field: 'validation',
          currentValue: 'N/A',
          issue: 'Claude review failed to parse - manual review recommended',
          evidence: parseError instanceof Error ? parseError.message : 'Parse error'
        }],
        reasoning: 'Failed to parse Claude response - treating as FLAG for safety',
        reviewDuration: Date.now() - startTime
      };
    }

    logger.info('🔍 FINAL REVIEW - Phase B (Claude Cross-Check) complete', {
      sessionId,
      reviewStatus: reviewResult.reviewStatus,
      confidence: reviewResult.confidenceInResults,
      issuesFound: reviewResult.issues.length,
      duration: reviewResult.reviewDuration,
      proposedCorrections: reviewResult.proposedCorrections || 'none'
    });

    return reviewResult;

  } catch (error) {
    logger.error('🔴 FINAL REVIEW - Phase B: Claude API error', {
      sessionId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      reviewStatus: 'FLAG',
      confidenceInResults: 50,
      issues: [{
        severity: 'MEDIUM',
        field: 'validation',
        currentValue: 'N/A',
        issue: 'Claude API error - manual review recommended',
        evidence: error instanceof Error ? error.message : 'API error'
      }],
      reasoning: 'Claude API failed - treating as FLAG for safety',
      reviewDuration: Date.now() - startTime
    };
  }
}

/**
 * Master function: Execute complete Final Review Stage
 * Phase A + Phase B (if needed) + Corrections
 */
async function executeFinalReviewStage(
  consensus: ConsensusResult,
  primaryAttributes: PrimaryDisplayAttributes,
  topFilterAttributes: TopFilterAttributes,
  generatedTitle: string,
  rawProduct: SalesforceIncomingProduct,
  sessionId: string,
  department?: string
): Promise<FinalReviewResult> {
  logger.info('🎯 FINAL REVIEW STAGE: Starting post-consensus validation', { sessionId, department });

  // Phase A: Automated Validation (always runs)
  const phaseAResult = performAutomatedValidation(
    consensus,
    primaryAttributes,
    topFilterAttributes,
    generatedTitle,
    rawProduct,
    sessionId
  );

  let phaseBResult: ClaudeReviewResult | undefined;
  let finalStatus: 'PASS' | 'FLAG' | 'FAIL' = phaseAResult.passed ? 'PASS' : 'FLAG';
  const correctionsApplied: ValidationIssue[] = [];
  const flaggedForReview: ValidationIssue[] = [];

  // PATH B: Skip Claude Phase B for Appliances (restores 926ad6b behavior — no Claude existed then)
  const isAppliancesDept = department === 'Appliances';

  // Phase B: Claude Review (only if Phase A flagged for review AND not Appliances)
  if (phaseAResult.requiresAIReview && !isAppliancesDept) {
    logger.info('🔍 FINAL REVIEW: Phase A flagged for Claude review', {
      sessionId,
      reason: `Confidence: ${phaseAResult.confidence}%, Warnings: ${phaseAResult.warnings.length}, Corrections: ${phaseAResult.corrections.length}`
    });

    phaseBResult = await performClaudeReview(
      consensus,
      primaryAttributes,
      topFilterAttributes,
      generatedTitle,
      rawProduct,
      phaseAResult.warnings,
      sessionId
    );

    // Update final status based on Claude's review
    if (phaseBResult.reviewStatus === 'FAIL') {
      finalStatus = 'FAIL';
    } else if (phaseBResult.reviewStatus === 'FLAG') {
      finalStatus = 'FLAG';
    }
  } else if (phaseAResult.requiresAIReview && isAppliancesDept) {
    logger.info('⏭️ FINAL REVIEW: Skipping Claude Phase B for Appliances (PATH B — 926ad6b restore)', {
      sessionId,
      department,
      phaseAConfidence: phaseAResult.confidence,
      reason: 'Appliances use pre-Claude verification logic'
    });
  }

  // Apply corrections from Phase A (deterministic fixes)
  for (const correction of phaseAResult.corrections) {
    if (correction.severity === 'HIGH' || correction.severity === 'CRITICAL') {
      // Auto-apply high severity corrections
      if (correction.field === 'department' && correction.suggestedFix) {
        (primaryAttributes as any).AI_Product_Department = correction.suggestedFix;
        correctionsApplied.push(correction);
        logger.warn('✏️  FINAL REVIEW: Auto-corrected department', {
          sessionId,
          from: correction.currentValue,
          to: correction.suggestedFix,
          reason: correction.issue
        });
      }
    } else {
      // Lower severity - flag for review
      flaggedForReview.push(correction);
    }
  }

  // Handle Claude's findings (if ran)
  if (phaseBResult) {
    // Use proposedCorrections (already validated against picklists in performClaudeReview)
    const pc = phaseBResult.proposedCorrections;
    if (pc && phaseBResult.reviewStatus === 'FAIL') {
      // Category and department are LOCKED — handled by 2-AI consensus.
      // Claude is told not to propose changes, but if it does, we ignore them.
      if (pc.category) {
        logger.info('ℹ️ FINAL REVIEW: Ignoring Claude category suggestion (category is locked by AI consensus)', {
          sessionId,
          agreedCategory: consensus.agreedCategory,
          claudeSuggested: pc.category
        });
      }
      if (pc.department) {
        logger.info('ℹ️ FINAL REVIEW: Ignoring Claude department suggestion (department is locked by AI consensus)', {
          sessionId,
          currentDepartment: primaryAttributes.AI_Product_Department,
          claudeSuggested: pc.department
        });
      }
      
      // Apply validated type correction
      if (pc.type) {
        const oldType = consensus.agreedPrimaryAttributes?.product_type;
        if (consensus.agreedPrimaryAttributes) {
          consensus.agreedPrimaryAttributes.product_type = pc.type;
        }
        (primaryAttributes as any).AI_Type = pc.type;
        correctionsApplied.push({
          severity: 'CRITICAL',
          field: 'type',
          currentValue: oldType || '',
          issue: `Claude corrected type from "${oldType}" to "${pc.type}"`,
          evidence: phaseBResult.reasoning,
          suggestedFix: pc.type
        });
        logger.error('🔴 FINAL REVIEW: Claude corrected type (validated against picklist)', {
          sessionId,
          from: oldType,
          to: pc.type,
          reasoning: phaseBResult.reasoning
        });
      }
      
      // Apply validated style correction
      if (pc.style) {
        const oldStyle = (primaryAttributes as any).AI_Style;
        (primaryAttributes as any).AI_Style = pc.style;
        correctionsApplied.push({
          severity: 'HIGH',
          field: 'style',
          currentValue: oldStyle || '',
          issue: `Claude corrected style from "${oldStyle}" to "${pc.style}"`,
          evidence: phaseBResult.reasoning,
          suggestedFix: pc.style
        });
        logger.warn('✏️  FINAL REVIEW: Claude corrected style (validated against picklist)', {
          sessionId,
          from: oldStyle,
          to: pc.style
        });
      }
      
      // Apply finish correction (no picklist — free text from raw data)
      if (pc.finish) {
        const oldFinish = (primaryAttributes as any).AI_Finish;
        (primaryAttributes as any).AI_Finish = pc.finish;
        correctionsApplied.push({
          severity: 'MEDIUM',
          field: 'finish',
          currentValue: oldFinish || '',
          issue: `Claude corrected finish from "${oldFinish}" to "${pc.finish}"`,
          evidence: phaseBResult.reasoning,
          suggestedFix: pc.finish
        });
        logger.warn('✏️  FINAL REVIEW: Claude corrected finish', {
          sessionId, from: oldFinish, to: pc.finish
        });
      }

      // Apply color correction (no picklist — free text from raw data)
      if (pc.color) {
        const oldColor = (primaryAttributes as any).AI_Color;
        (primaryAttributes as any).AI_Color = pc.color;
        correctionsApplied.push({
          severity: 'MEDIUM',
          field: 'color',
          currentValue: oldColor || '',
          issue: `Claude corrected color from "${oldColor}" to "${pc.color}"`,
          evidence: phaseBResult.reasoning,
          suggestedFix: pc.color
        });
        logger.warn('✏️  FINAL REVIEW: Claude corrected color', {
          sessionId, from: oldColor, to: pc.color
        });
      }

      // Apply brand correction (validate against brands picklist)
      if (pc.brand) {
        const oldBrand = primaryAttributes.AI_Brand;
        primaryAttributes.AI_Brand = pc.brand;
        correctionsApplied.push({
          severity: 'HIGH',
          field: 'brand',
          currentValue: oldBrand || '',
          issue: `Claude corrected brand from "${oldBrand}" to "${pc.brand}"`,
          evidence: phaseBResult.reasoning,
          suggestedFix: pc.brand
        });
        logger.warn('✏️  FINAL REVIEW: Claude corrected brand', {
          sessionId, from: oldBrand, to: pc.brand
        });
      }

      // Apply model number correction
      if (pc.model_number) {
        const oldModel = (primaryAttributes as any).AI_Model_Number;
        (primaryAttributes as any).AI_Model_Number = pc.model_number;
        correctionsApplied.push({
          severity: 'HIGH',
          field: 'model_number',
          currentValue: oldModel || '',
          issue: `Claude corrected model number from "${oldModel}" to "${pc.model_number}"`,
          evidence: phaseBResult.reasoning,
          suggestedFix: pc.model_number
        });
        logger.warn('✏️  FINAL REVIEW: Claude corrected model number', {
          sessionId, from: oldModel, to: pc.model_number
        });
      }

      // Apply validated title correction — but ONLY if it doesn't contradict
      // the verified brand or category. Claude sometimes smuggles category
      // disagreements into the title text (e.g., replacing "Wall Sconce" with
      // "Post Light" in the title even though category is locked).
      if (pc.title) {
        const oldTitle = primaryAttributes.AI_Product_Title || generatedTitle;
        const verifiedCategory = (primaryAttributes as any).AI_Product_Category || consensus.agreedCategory || '';
        const verifiedBrand = primaryAttributes.AI_Brand || '';
        const proposedTitleLower = pc.title.toLowerCase();
        
        // Check if Claude's title contains a DIFFERENT category name than the verified one
        // Common category names that appear in titles and indicate Claude disagreement
        const categoryTerms: Record<string, string[]> = {
          'wall sconce': ['post light', 'ceiling light', 'chandelier', 'pendant', 'flush mount'],
          'pendant': ['post light', 'chandelier', 'flush mount', 'wall sconce'],
          'chandelier': ['pendant', 'post light', 'flush mount'],
          'bathroom lighting': ['wall decor', 'bathtub', 'waste & overflow', 'drain'],
          'vanity lighting': ['wall decor', 'bathtub', 'waste & overflow', 'drain'],
          'recessed lighting': ['flush mount', 'surface mount'],
          'landscape lighting': ['wall sconce', 'post light'],
        };
        
        const verifiedCatLower = verifiedCategory.toLowerCase();
        const conflictingTerms = categoryTerms[verifiedCatLower] || [];
        const hasConflictingCategory = conflictingTerms.some(term => proposedTitleLower.includes(term));
        
        // Check if Claude used a different brand in the title
        const verifiedBrandLower = verifiedBrand.toLowerCase().replace(/[^a-z0-9]/g, '');
        const titleBrandArea = proposedTitleLower.split(/\d/)[0]; // Text before first digit is usually brand area
        const hasBrandMismatch = verifiedBrandLower.length > 2 && 
          !titleBrandArea.toLowerCase().replace(/[^a-z0-9]/g, '').includes(verifiedBrandLower);
        
        if (hasConflictingCategory) {
          // REJECT: Claude's title contradicts the verified category
          logger.warn('🛡️ FINAL REVIEW: Rejecting Claude title — contains conflicting category term', {
            sessionId,
            verifiedCategory,
            proposedTitle: pc.title,
            conflictingTermFound: conflictingTerms.find(term => proposedTitleLower.includes(term)),
            reason: 'Title contradicts 2-AI consensus category'
          });
          flaggedForReview.push({
            severity: 'HIGH',
            field: 'title',
            currentValue: oldTitle,
            issue: `Claude proposed title with conflicting category (rejected): "${pc.title}"`,
            evidence: phaseBResult.reasoning,
            suggestedFix: oldTitle
          });
        } else if (hasBrandMismatch) {
          // REJECT: Claude used a different brand in the title
          logger.warn('🛡️ FINAL REVIEW: Rejecting Claude title — brand mismatch', {
            sessionId,
            verifiedBrand,
            proposedTitle: pc.title,
            reason: 'Title uses different brand than verified'
          });
          flaggedForReview.push({
            severity: 'HIGH',
            field: 'title',
            currentValue: oldTitle,
            issue: `Claude proposed title with different brand (rejected): "${pc.title}"`,
            evidence: phaseBResult.reasoning,
            suggestedFix: oldTitle
          });
        } else {
          // ACCEPT: Title correction is consistent with verified data
          primaryAttributes.AI_Product_Title = pc.title;
          correctionsApplied.push({
            severity: 'HIGH',
            field: 'title',
            currentValue: oldTitle,
            issue: `Claude corrected title from "${oldTitle}" to "${pc.title}"`,
            evidence: phaseBResult.reasoning,
            suggestedFix: pc.title
          });
          logger.warn('✏️  FINAL REVIEW: Claude corrected title (validated & applied)', {
            sessionId,
            from: oldTitle,
            to: pc.title
          });
        }
      }
    }
    
    // Apply Claude's title correction even on FLAG status — title corrections are safe
    // (they don't touch locked category/brand fields) and improve quality.
    // The FAIL block above already handles title for FAIL status.
    if (pc && phaseBResult.reviewStatus === 'FLAG' && pc.title) {
      const oldTitle = primaryAttributes.AI_Product_Title || generatedTitle;
      const verifiedCategory = (primaryAttributes as any).AI_Product_Category || consensus.agreedCategory || '';
      const verifiedBrand = primaryAttributes.AI_Brand || '';
      const proposedTitleLower = pc.title.toLowerCase();
      const categoryTerms: Record<string, string[]> = {
        'wall sconce': ['post light', 'ceiling light', 'chandelier', 'pendant', 'flush mount'],
        'pendant': ['post light', 'chandelier', 'flush mount', 'wall sconce'],
        'chandelier': ['pendant', 'post light', 'flush mount'],
        'bathroom lighting': ['wall decor', 'bathtub', 'waste & overflow', 'drain'],
        'vanity lighting': ['wall decor', 'bathtub', 'waste & overflow', 'drain'],
        'recessed lighting': ['flush mount', 'surface mount'],
        'landscape lighting': ['wall sconce', 'post light'],
      };
      const verifiedCatLower = verifiedCategory.toLowerCase();
      const conflictingTerms = categoryTerms[verifiedCatLower] || [];
      const hasConflictingCategory = conflictingTerms.some(term => proposedTitleLower.includes(term));
      const verifiedBrandLower = verifiedBrand.toLowerCase().replace(/[^a-z0-9]/g, '');
      const titleBrandArea = proposedTitleLower.split(/\d/)[0];
      const hasBrandMismatch = verifiedBrandLower.length > 2 &&
        !titleBrandArea.toLowerCase().replace(/[^a-z0-9]/g, '').includes(verifiedBrandLower);
      if (!hasConflictingCategory && !hasBrandMismatch) {
        primaryAttributes.AI_Product_Title = pc.title;
        correctionsApplied.push({
          severity: 'HIGH',
          field: 'title',
          currentValue: oldTitle,
          issue: `Claude corrected title from "${oldTitle}" to "${pc.title}"`,
          evidence: phaseBResult.reasoning,
          suggestedFix: pc.title
        });
        logger.warn('✏️  FINAL REVIEW: Claude corrected title on FLAG (validated & applied)', {
          sessionId,
          from: oldTitle,
          to: pc.title
        });
      } else {
        logger.warn('🛡️ FINAL REVIEW: Rejecting Claude FLAG title — conflicting category or brand mismatch', {
          sessionId,
          verifiedCategory,
          proposedTitle: pc.title
        });
      }
    }

    // Also flag any non-CRITICAL individual issues for review
    for (const issue of phaseBResult.issues) {
      if (issue.severity !== 'CRITICAL') {
        flaggedForReview.push(issue);
      }
    }
  }

  logger.info('✅ FINAL REVIEW STAGE: Complete', {
    sessionId,
    finalStatus,
    phaseAConfidence: phaseAResult.confidence,
    phaseBConfidence: phaseBResult?.confidenceInResults,
    correctionsApplied: correctionsApplied.length,
    flaggedForReview: flaggedForReview.length,
    claudeReviewPerformed: !!phaseBResult
  });

  return {
    phaseAResult,
    phaseBResult,
    finalStatus,
    correctionsApplied,
    flaggedForReview
  };
}

// Export the research attestation service for external access
export { researchAttestationService };

export default { verifyProductWithDualAI };
export const dualAIVerificationService = { verifyProductWithDualAI };
