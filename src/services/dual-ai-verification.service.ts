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
  getAllCategoriesWithTop15ForPrompt,
  PRIMARY_ATTRIBUTE_FIELD_KEYS
} from '../config/category-config';
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
import { performProductResearch, formatResearchForPrompt, ResearchResult, performFinalVerificationSearch, FinalVerificationSearchResult } from './research.service';
import { generateSEOTitle, SEOTitleInput } from './seo-title-generator.service';
import { failedMatchLogger } from './failed-match-logger.service';
import { inferMissingFields, FIELD_ALIASES, finalSweepTopFilterAttributes } from './smart-field-inference.service';

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

  const referenceUrl = rawProduct.Reference_URL?.toLowerCase() || '';

  // ========================================================================
  // CHECK 1: Category Domain Mismatch (CRITICAL)
  // ========================================================================
  const webRetailerDomain = getCategoryDomain(webRetailer.category) || getCategoryDomain(webRetailer.subCategory);
  const fergusonDomain = getCategoryDomain(ferguson.category) || getCategoryDomain(ferguson.productType) || getCategoryDomain(ferguson.businessCategory);

  if (webRetailerDomain && fergusonDomain && webRetailerDomain !== fergusonDomain) {
    conflicts.push({
      type: 'category_domain',
      severity: 'critical',
      source1: 'Web_Retailer',
      source2: 'Ferguson',
      value1: `${webRetailer.category || webRetailer.subCategory} (${webRetailerDomain})`,
      value2: `${ferguson.category || ferguson.productType} (${fergusonDomain})`,
      description: `Web Retailer describes a ${webRetailerDomain} product, but Ferguson describes a ${fergusonDomain} product`
    });
    confidenceScore -= 50; // Major penalty
  }

  // ========================================================================
  // CHECK 2: Brand Mismatch (CRITICAL when different domains)
  // ========================================================================
  if (webRetailer.brand && ferguson.brand) {
    const normalizedWebBrand = webRetailer.brand.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedFergusonBrand = ferguson.brand.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (normalizedWebBrand !== normalizedFergusonBrand && normalizedWebBrand.length > 2 && normalizedFergusonBrand.length > 2) {
      // Check if brands are completely different (not just formatting)
      const brandSimilarity = calculateStringSimilarity(normalizedWebBrand, normalizedFergusonBrand);
      
      if (brandSimilarity < 0.5) {
        const severity = webRetailerDomain !== fergusonDomain ? 'critical' : 'warning';
        conflicts.push({
          type: 'brand_mismatch',
          severity,
          source1: 'Web_Retailer',
          source2: 'Ferguson',
          value1: webRetailer.brand,
          value2: ferguson.brand,
          description: `Completely different brands: "${webRetailer.brand}" vs "${ferguson.brand}"`
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
  const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
  const warningConflicts = conflicts.filter(c => c.severity === 'warning');

  let recommendation: DataCoherenceResult['recommendation'];
  let primaryDataSource: DataCoherenceResult['primaryDataSource'];

  if (criticalConflicts.length >= 2) {
    // Multiple critical conflicts = data is unusable
    recommendation = 'reject';
    primaryDataSource = 'none';
  } else if (criticalConflicts.length === 1) {
    // Single critical conflict = proceed with warnings, trust Ferguson over Web Retailer
    recommendation = 'proceed_with_warnings';
    primaryDataSource = ferguson.brand ? 'ferguson' : 'web_retailer';
    warnings.push(`CRITICAL: ${criticalConflicts[0].description}. Proceeding with ${primaryDataSource} data only.`);
  } else if (warningConflicts.length > 0) {
    // Only warnings = proceed but log concerns
    recommendation = 'proceed_with_warnings';
    primaryDataSource = ferguson.brand ? 'ferguson' : 'web_retailer';
  } else {
    // No conflicts
    recommendation = 'proceed';
    primaryDataSource = ferguson.brand ? 'ferguson' : webRetailer.brand ? 'web_retailer' : 'none';
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
      Brand_Verified: '',
      Brand_Id: '',
      Category_Verified: '',
      Category_Id: '',
      SubCategory_Verified: '',
      Product_Family_Verified: '',
      Department_Verified: '',
      Product_Style_Verified: '',
      Style_Id: null,
      Color_Verified: '',
      Finish_Verified: '',
      Depth_Verified: '',
      Width_Verified: '',
      Height_Verified: '',
      Weight_Verified: '',
      MSRP_Verified: '',
      Market_Value: '',
      Market_Value_Min: '',
      Market_Value_Max: '',
      Description_Verified: '',
      Product_Title_Verified: '',
      Details_Verified: '',
      Features_List_HTML: '',
      UPC_GTIN_Verified: '',
      Model_Number_Verified: '',
      Model_Number_Alias: '',
      Model_Parent: '',
      Model_Variant_Number: '',
      Total_Model_Variants: '',
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
  const externalModel = rawProduct.Ferguson_Model_Number || null;
  
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
 */
const FIELD_NOT_FOUND = 'Not Found'; // AI attempted to find but couldn't
const FIELD_NOT_APPLICABLE = 'N/A'; // Field doesn't apply to this product type

function sanitizeNumericForSalesforce(value: any): number | null {
  if (value === null || value === undefined) return null;
  
  const strValue = String(value).trim();
  
  // Check for N/A variants - return null for numeric fields
  if (isNAValue(strValue)) {
    return null;
  }
  
  // Check for "Not Found" marker - return null for numeric fields
  if (strValue === FIELD_NOT_FOUND) {
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
 * Mark an empty field value with the appropriate marker
 * @param value - The field value to check
 * @param fieldName - The name of the field (for determining if N/A is appropriate)
 * @param productCategory - The product category (for determining if field is applicable)
 * @param attemptedResearch - Whether research was attempted for this field
 */
export function markEmptyField(
  value: string | number | null | undefined,
  fieldName: string,
  productCategory?: string,
  attemptedResearch: boolean = false
): string {
  // If we have a valid value, return it
  if (value !== null && value !== undefined && String(value).trim() !== '') {
    const strValue = String(value).trim();
    // Don't modify existing markers
    if (strValue === FIELD_NOT_FOUND || strValue === FIELD_NOT_APPLICABLE) {
      return strValue;
    }
    return strValue;
  }
  
  // Fields that are typically not applicable to certain categories
  const categoryFieldApplicability: Record<string, string[]> = {
    // Bathroom products typically don't have these
    'Bathroom Hardware and Accessories': ['cooling_capacity_btu', 'number_of_burners', 'oven_capacity', 'defrost_type', 'ice_maker'],
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
  
  // If research was attempted but field is still empty, mark as "Not Found"
  if (attemptedResearch) {
    return FIELD_NOT_FOUND;
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
    
    // PHASE 1: AI Analysis (with pre-research context if available)
    logger.info('PHASE 1: Dual AI Analysis', {
      sessionId: verificationSessionId,
      hasPreResearchContext: !!preResearchContext,
      dataScenario: dataSourceAnalysis.scenario,
      externalDataTrusted: dataSourceAnalysis.externalDataTrusted,
      modelMismatch: dataSourceAnalysis.modelValidation?.mismatchReason || null,
      coherenceConflicts: coherenceResult.conflicts.length,
      hasUrlBrandMismatch
    });
    
    const openaiStartTime = Date.now();
    const xaiStartTime = Date.now();
    
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
    
    // Pass research context and model validation to AIs
    const [openaiResult, xaiResult] = await Promise.all([
      analyzeWithOpenAI(rawProduct, verificationSessionId, promptOptions, trackingId),
      analyzeWithXAI(rawProduct, verificationSessionId, promptOptions, trackingId)
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

    logger.info('PHASE 1 complete - Initial AI analysis', {
      sessionId: verificationSessionId,
      openaiCategory: openaiResult.determinedCategory,
      xaiCategory: xaiResult.determinedCategory
    });

    // PHASE 2: Build initial consensus
    logger.info('PHASE 2: Building consensus', {
      sessionId: verificationSessionId
    });
    
    let consensus = buildConsensus(openaiResult, xaiResult);
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
    const missingFieldsList = consensus.needsResearch || [];
    const unresolvedFieldsList = consensus.disagreements
      .filter(d => d.resolution === 'unresolved')
      .map(d => d.field);
    
    const shouldDoFinalSearch = (missingFieldsList.length > 0 || unresolvedFieldsList.length > 0) && 
                                 config.research?.enableFinalWebSearch !== false;
    
    if (shouldDoFinalSearch) {
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', { service: 'catalog-verification' });
      logger.info('PHASE 6: FINAL WEB SEARCH - Using verified data for targeted search', {
        sessionId: verificationSessionId,
        verifiedBrand: consensus.agreedPrimaryAttributes?.brand || consensus.agreedPrimaryAttributes?.Brand || '',
        verifiedModel: rawProduct.SF_Catalog_Name || rawProduct.Model_Number_Web_Retailer || '',
        verifiedCategory: consensus.agreedCategory || 'Unknown',
        missingFields: missingFieldsList.length,
        unresolvedFields: unresolvedFieldsList.length,
        reason: 'Performing targeted search now that we have AI-verified product data'
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
        
        finalSearchResult = await performFinalVerificationSearch(
          verifiedBrand,
          verifiedModel,
          verifiedCategory,
          verifiedTitle,
          missingFieldsList,
          unresolvedFieldsList,
          verificationSessionId
        );
        
        if (finalSearchResult.success && Object.keys(finalSearchResult.foundSpecifications).length > 0) {
          logger.info('PHASE 6: Final web search found additional data', {
            sessionId: verificationSessionId,
            specsFound: Object.keys(finalSearchResult.foundSpecifications).length,
            featuresFound: finalSearchResult.foundFeatures.length,
            sources: finalSearchResult.sources.length
          });
          
          // Merge found specifications into consensus
          for (const [field, value] of Object.entries(finalSearchResult.foundSpecifications)) {
            const normalizedField = field.toLowerCase().replace(/[_\s]+/g, '_');
            
            // Check if this field was missing or unresolved
            const isMissing = missingFieldsList.some(f => 
              f.toLowerCase().replace(/[_\s]+/g, '_') === normalizedField ||
              normalizedField.includes(f.toLowerCase().replace(/[_\s]+/g, '_'))
            );
            const isUnresolved = unresolvedFieldsList.some(f => 
              f.toLowerCase().replace(/[_\s]+/g, '_') === normalizedField ||
              normalizedField.includes(f.toLowerCase().replace(/[_\s]+/g, '_'))
            );
            
            if (isMissing || isUnresolved) {
              // Determine if it's a primary attribute or top15
              const isPrimaryField = ['brand', 'msrp', 'weight', 'upc_gtin', 'model_parent', 
                'product_style', 'product_title', 'description', 'features_list',
                'width', 'height', 'depth', 'color', 'finish'].includes(normalizedField);
              
              if (isPrimaryField) {
                consensus.agreedPrimaryAttributes[field] = value;
              } else {
                consensus.agreedTop15Attributes[field] = value;
              }
              
              logger.info(`Final search filled field: ${field} = ${value}`, { sessionId: verificationSessionId });
            }
          }
          
          // Also update missing fields list (remove ones we found)
          if (consensus.needsResearch) {
            consensus.needsResearch = consensus.needsResearch.filter(field => {
              const normalizedField = field.toLowerCase().replace(/[_\s]+/g, '_');
              return !Object.keys(finalSearchResult!.foundSpecifications).some(f => 
                f.toLowerCase().replace(/[_\s]+/g, '_') === normalizedField
              );
            });
          }
        } else {
          logger.info('PHASE 6: Final web search did not find additional data', {
            sessionId: verificationSessionId,
            reason: finalSearchResult.searchSummary
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
        reason: missingFieldsList.length === 0 && unresolvedFieldsList.length === 0 
          ? 'No missing or unresolved fields'
          : 'Final web search disabled in config'
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
    const response = buildFinalResponse(rawProduct, consensus, verificationSessionId, processingTime, openaiResult, xaiResult, researchResult, dataSourceAnalysis, researchPhaseTriggered, retryCount, finalSearchResult);
    
    // ========================================================================
    // FINAL SWEEP: Check all "Not Found" values against raw data
    // This catches anything the AI missed that exists in Ferguson/Web data
    // ========================================================================
    if (response.Top_Filter_Attributes) {
      const category = response.Primary_Attributes?.Category_Verified || consensus.agreedCategory || undefined;
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

async function analyzeWithOpenAI(
  rawProduct: SalesforceIncomingProduct, 
  sessionId: string, 
  promptOptions?: PromptOptions, 
  trackingId?: string
): Promise<AIAnalysisResult> {
  const maxRetries = 3;
  let lastError: any;
  const model = config.openai?.model || 'gpt-4o';

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

async function analyzeWithXAI(
  rawProduct: SalesforceIncomingProduct, 
  sessionId: string, 
  promptOptions?: PromptOptions, 
  trackingId?: string
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
⚠️ CRITICAL: When populating top15_filter_attributes in your JSON response, you MUST use the field_key shown in parentheses (e.g., "horsepower", "feed_type"), NOT the full attribute name.
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

IMPORTANT:
- Use ONLY the categories listed above
- Map raw data fields to our standard attribute names
- Standardize units (dimensions in inches, capacity in cu. ft.)
- Clean up formatting (proper capitalization, remove extra spaces)
- Flag fields you cannot determine with confidence
- For TOP 15 attributes, use only the attributes defined for the determined category
- ALWAYS generate a features_list even if no features are in the raw data - extract them from description and specs

## ⚠️ CRITICAL: FIELD VALUE RULES - NEVER LEAVE FIELDS BLANK

For EVERY field, you MUST provide a value. Use these markers when appropriate:

**"Not Found"** - Use when:
- You searched for the data but could not find it in any source
- The information simply isn't available anywhere
- Example: Brand not mentioned in any source → brand: "Not Found"

**"N/A"** (Not Applicable) - Use when:
- The field doesn't apply to this product type
- Example: "number_of_burners" for a refrigerator → "N/A"
- Example: "cooling_capacity_btu" for a gas range → "N/A"

**NEVER leave a field empty or null** - Always use one of:
- The actual value (if found)
- "Not Found" (if searched but not found)
- "N/A" (if field doesn't apply to this product)

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

function buildAnalysisPrompt(rawProduct: SalesforceIncomingProduct, options?: PromptOptions | string): string {
  // Support legacy signature: buildAnalysisPrompt(rawProduct, researchContext)
  const opts: PromptOptions = typeof options === 'string' 
    ? { researchContext: options }
    : (options || {});
    
  const { researchContext, modelMismatchWarning, externalDataTrusted = true, dataCoherenceWarnings } = opts;
  
  let prompt = `You are a product data VERIFICATION specialist. Your job is to INDEPENDENTLY VERIFY product information, not blindly trust it.

## YOUR ROLE: VERIFY, DON'T TRUST
The data below is UNVERIFIED input that may contain errors, wrong products, or incomplete information.
- Treat ALL input data as "claims to investigate" NOT "facts to accept"
- Use web search, URLs, and documents to INDEPENDENTLY CONFIRM each data point
- If your research contradicts the input data, TRUST YOUR RESEARCH
- EXCLUDE any input data you determine to be incorrect
- ADD any additional data you discover through research

## RAW PRODUCT DATA (UNVERIFIED - REQUIRES CONFIRMATION):
${JSON.stringify(rawProduct, null, 2)}
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
- Use "N/A" if field doesn't apply to this product type
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
    // Fallback to regular analysis - no prompt options in fallback scenario
    return provider === 'openai' ? await analyzeWithOpenAI(rawProduct, sessionId, undefined) : await analyzeWithXAI(rawProduct, sessionId, undefined);
  }
}

async function researchMissingData(rawProduct: SalesforceIncomingProduct, missingFields: string[], provider: 'openai' | 'xai', category: string, sessionId: string, researchContext?: string): Promise<Record<string, any>> {
  const client = provider === 'openai' ? openai : xai;
  const model = provider === 'openai' ? (config.openai?.model || 'gpt-4-turbo-preview') : (config.xai?.model || 'grok-beta');

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
    const normalizedSearch = attrName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    const normalizedSearchKey = attrName.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    
    for (const [key, value] of Object.entries(topFilterAttributes)) {
      if (value && value !== '') {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        
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
          const normalizedAlias = alias.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
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
      // No style mapping found - use potential style from AI and request creation
      // IMPORTANT: Filter out N/A values - these break SF JSON parsing and are not valid styles
      const isValidStyle = potentialStyle && 
                           potentialStyle.trim() !== '' && 
                           !isNAValue(potentialStyle);
      
      if (isValidStyle) {
        // Check if style already exists by name before requesting (prevents duplicates)
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
    
    // Features for possible keyword injection
    features: cleanedText.features,
    
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
    Product_Title_Verified: seoTitle,  // Use SEO-optimized title
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
    UPC_GTIN_Verified: (() => {
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
    Model_Number_Verified: (() => {
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
    Model_Number_Alias: (() => {
      const primary = rawProduct.SF_Catalog_Name || consensus.agreedPrimaryAttributes.model_number || rawProduct.Model_Number_Web_Retailer || '';
      // Remove special characters for alias
      return primary.replace(/[\/\-\s]/g, '');
    })(),
    Model_Parent: (() => {
      const value = preferAIValue(
        consensus.agreedPrimaryAttributes.model_parent,
        openaiResult.primaryAttributes.model_parent,
        xaiResult.primaryAttributes.model_parent,
        openaiResult.confidence,
        xaiResult.confidence,
        ''
      );
      // Use "None Identified" instead of "Not Found" for model variant fields
      return (!value || value === 'Not Found') ? 'None Identified' : value;
    })(),
    Model_Variant_Number: (() => {
      const value = preferAIValue(
        consensus.agreedPrimaryAttributes.model_variant_number,
        openaiResult.primaryAttributes.model_variant_number,
        xaiResult.primaryAttributes.model_variant_number,
        openaiResult.confidence,
        xaiResult.confidence,
        ''
      );
      // Use "None Identified" instead of "Not Found" for model variant fields
      return (!value || value === 'Not Found') ? 'None Identified' : value;
    })(),
    Total_Model_Variants: (() => {
      const value = cleanEncodingIssues(
        preferAIValue(
          consensus.agreedPrimaryAttributes.total_model_variants,
          openaiResult.primaryAttributes.total_model_variants,
          xaiResult.primaryAttributes.total_model_variants,
          openaiResult.confidence,
          xaiResult.confidence,
          ''
        )
      );
      // Use "None Identified" instead of "Not Found" for model variant fields
      return (!value || value === 'Not Found') ? 'None Identified' : value;
    })()
  };

  // Clean top filter attributes and build attribute ID lookups
  const topFilterAttributes: TopFilterAttributes = {};
  const topFilterAttributeIds: TopFilterAttributeIds = {};
  const attributeRequests: AttributeRequest[] = [];  // Track attributes not in Salesforce picklist
  
  // Get the category schema to map field keys to attribute names
  const categorySchema = consensus.agreedCategory ? getCategorySchema(consensus.agreedCategory) : null;
  
  // Create set of PRIMARY field keys (normalized) to filter out from Top 15
  const primaryFieldKeysSet = new Set(
    PRIMARY_ATTRIBUTE_FIELD_KEYS.map(key => key.toLowerCase().replace(/[^a-z0-9]/g, ''))
  );
  
  // Log schema retrieval for debugging
  logger.info('Category schema lookup for attribute ID mapping', {
    category: consensus.agreedCategory || 'unknown',
    schemaFound: !!categorySchema,
    attributeCount: categorySchema?.top15FilterAttributes?.length || 0
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
    
    // Skip if no value found for this schema-defined attribute
    if (value === null || value === undefined || value === '') continue;
    
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
    
    let finalValue = typeof value === 'string' ? cleanEncodingIssues(value) : value;
    
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
    
    // Look up the attribute ID using the proper attribute name (not the field key)
    // Use forceIdLookup=true to get attribute_id even for "primary" attrs like Style, Height
    // because Top_Filter_Attribute_Ids needs the picklist attribute_id for ALL attributes
    // RULE: Every attribute MUST have an ID, or generate a request for a new attribute
    if (attributeName) {
      const attrMatch = picklistMatcher.matchAttribute(attributeName, { forceIdLookup: true });
      
      if (attrMatch.matched && attrMatch.matchedValue) {
        // Found a match - use the attribute_id
        topFilterAttributeIds[key] = attrMatch.matchedValue.attribute_id;
        logger.debug('Top 15 attribute matched to SF picklist', {
          fieldKey: key,
          attributeName,
          matchedTo: attrMatch.matchedValue.attribute_name,
          attribute_id: attrMatch.matchedValue.attribute_id,
          similarity: attrMatch.similarity
        });
      } else {
        // No match found - set ID to null AND generate an Attribute_Request
        topFilterAttributeIds[key] = null;
        
        // Only generate request if we haven't already requested this attribute
        if (!requestedAttributeNames.has(attributeName.toLowerCase())) {
          attributeRequests.push({
            attribute_name: attributeName,
            requested_for_category: consensus.agreedCategory || 'Unknown',
            source: 'top_15_filter',
            reason: `Top 15 Filter Attribute "${attributeName}" (key: ${key}) not found in Salesforce attributes picklist. Value: "${finalValue}". Closest matches: ${attrMatch.suggestions?.slice(0, 3).map(s => s.attribute_name).join(', ') || 'none'}. Please create this attribute in Salesforce.`
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
    } else {
      // Fallback: try matching the field key directly (legacy behavior)
      const attrMatch = picklistMatcher.matchAttribute(key, { forceIdLookup: true });
      
      if (attrMatch.matched && attrMatch.matchedValue) {
        topFilterAttributeIds[key] = attrMatch.matchedValue.attribute_id;
        logger.debug('Top 15 attribute (by key) matched to SF picklist', {
          fieldKey: key,
          matchedTo: attrMatch.matchedValue.attribute_name,
          attribute_id: attrMatch.matchedValue.attribute_id,
          similarity: attrMatch.similarity
        });
      } else {
        // No match - set null AND generate request
        topFilterAttributeIds[key] = null;
        
        // Convert field_key to human-readable name for the request
        const readableName = key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        
        if (!requestedAttributeNames.has(key.toLowerCase())) {
          attributeRequests.push({
            attribute_name: readableName,
            requested_for_category: consensus.agreedCategory || 'Unknown',
            source: 'top_15_filter',
            reason: `Top 15 Filter Attribute "${readableName}" (key: ${key}) not found in Salesforce attributes picklist. Value: "${finalValue}". Please create this attribute in Salesforce.`
          });
          requestedAttributeNames.add(key.toLowerCase());
          
          logger.info('Attribute Request generated for unmatched Top 15 attribute (by key)', {
            fieldKey: key,
            readableName,
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
              original_attribute_name: readableName,
            },
            requestGenerated: true,
            requestDetails: {
              attribute_name: readableName,
              requested_for_category: consensus.agreedCategory || 'Unknown',
              reason: `Top 15 attribute (by key) "${key}" not found in SF picklist`,
            },
          });
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

export default { verifyProductWithDualAI };
export const dualAIVerificationService = { verifyProductWithDualAI };
