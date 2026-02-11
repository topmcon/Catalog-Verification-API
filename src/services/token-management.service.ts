/**
 * TOKEN MANAGEMENT SERVICE
 * ========================
 * Detects requests that may exceed AI token limits and applies smart truncation
 * to prioritize the most important product specifications.
 * 
 * AI LIMITS:
 * - OpenAI GPT-4: 128,000 tokens (~96,000 words)
 * - xAI Grok-2: 131,072 tokens (~98,000 words)
 * 
 * SAFE LIMIT: 100,000 tokens (leaves buffer for AI response)
 * 
 * BREAKDOWN OF TOKEN USAGE (from observed session bddf104b-485b-4990-afcf-5b4ec8c1b1aa):
 * - Base prompt template: ~5,000 tokens
 * - Product metadata (title, desc, category): ~3,000 tokens
 * - Examples & instructions: ~8,000 tokens
 * - Web_Retailer_Specs (140 items): ~30,000 tokens
 * - Ferguson_Attributes (140 items): ~30,000 tokens
 * - Specification_Table: ~5,000 tokens (~10,000 if large)
 * - Web research pages (2-3 pages): ~20,000-30,000 tokens
 * - PDF documents (1-2 docs): ~10,000-15,000 tokens
 * - Image analysis: ~3,000 tokens
 * - Combined specs summary: ~10,000 tokens (duplicates of above)
 * 
 * TOTAL FOR DATA-RICH PRODUCT: ~148,000 tokens ❌ EXCEEDS LIMIT
 */

import { SalesforceIncomingProduct, SalesforceIncomingAttribute } from '../types/salesforce.types';
import { ResearchResult } from './research.service';
import { CategoryAttributeConfig } from '../config/category-attributes';
import logger from '../utils/logger';

/**
 * Rough estimation: 1 token ≈ 0.75 words ≈ 4 characters
 * More accurate for technical/structured data: 1 token ≈ 3-4 chars
 */
const CHARS_PER_TOKEN = 3.5;
const MAX_SAFE_TOKENS = 90000; // Leave 38K buffer for AI response (128K limit)
const HIGH_RISK_THRESHOLD = 70000; // Warn if approaching limit

export interface TokenEstimate {
  estimatedTokens: number;
  breakdown: {
    basePrompt: number;
    productMetadata: number;
    webRetailerSpecs: number;
    fergusonAttributes: number;
    specificationTable: number;
    webResearch: number;
    pdfDocuments: number;
    imageAnalysis: number;
    combinedSpecs: number;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  exceedsLimit: boolean;
  recommendation: string;
}

export interface TruncationResult {
  truncated: boolean;
  originalTokens: number;
  finalTokens: number;
  tokensSaved: number;
  truncatedSections: string[];
  retainedSpecsCount: number;
  removedSpecsCount: number;
}

/**
 * SPEC IMPORTANCE SCORING SYSTEM
 * ===============================
 * Assigns importance scores (0-100) to specifications based on multiple factors
 */
export interface SpecImportance {
  attributeName: string;
  attributeValue: string;
  importanceScore: number;
  reasons: string[];
  category: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Estimate token count for incoming request BEFORE building full prompt
 * This allows us to make smart decisions about truncation
 */
export function estimateTokenCount(
  rawProduct: SalesforceIncomingProduct,
  _categorySchema: CategoryAttributeConfig,
  researchResult?: ResearchResult
): TokenEstimate {
  const breakdown = {
    basePrompt: 5000, // Template + instructions + examples
    productMetadata: 0,
    webRetailerSpecs: 0,
    fergusonAttributes: 0,
    specificationTable: 0,
    webResearch: 0,
    pdfDocuments: 0,
    imageAnalysis: 0,
    combinedSpecs: 0,
  };

  // Product metadata
  const metadataText = [
    rawProduct.Product_Title_Web_Retailer,
    rawProduct.Product_Description_Web_Retailer,
    rawProduct.Ferguson_Title,
    rawProduct.Ferguson_Description,
    rawProduct.Brand_Web_Retailer,
    rawProduct.Ferguson_Brand,
    rawProduct.Model_Number_Web_Retailer,
    rawProduct.Ferguson_Model_Number,
  ].join(' ');
  breakdown.productMetadata = estimateTokensFromText(metadataText);

  // Web Retailer Specs
  if (rawProduct.Web_Retailer_Specs) {
    const specsText = rawProduct.Web_Retailer_Specs.map(s => `${s.name}: ${s.value}`).join('\n');
    breakdown.webRetailerSpecs = estimateTokensFromText(specsText);
  }

  // Ferguson Attributes
  if (rawProduct.Ferguson_Attributes) {
    const attrsText = rawProduct.Ferguson_Attributes.map(a => `${a.name}: ${a.value}`).join('\n');
    breakdown.fergusonAttributes = estimateTokensFromText(attrsText);
  }

  // Specification Table
  if (rawProduct.Specification_Table) {
    breakdown.specificationTable = estimateTokensFromText(rawProduct.Specification_Table);
  }

  // Research data
  if (researchResult) {
    // Web pages
    const webPagesText = researchResult.webPages
      .filter(p => p.success)
      .map(p => `${p.title} ${p.description} ${JSON.stringify(p.specifications)}`)
      .join('\n');
    breakdown.webResearch = estimateTokensFromText(webPagesText);

    // PDFs
    const pdfsText = researchResult.documents
      .filter(d => d.success)
      .map(d => `${d.filename} ${JSON.stringify(d.specifications)} ${d.text}`)
      .join('\n');
    breakdown.pdfDocuments = estimateTokensFromText(pdfsText);

    // Images
    const imagesText = researchResult.images
      .filter(i => i.success)
      .map(i => `${i.description} ${i.productType} ${i.detectedColor} ${i.detectedFeatures.join(' ')}`)
      .join('\n');
    breakdown.imageAnalysis = estimateTokensFromText(imagesText);

    // Combined specs (NOTE: This is often duplicate data!)
    const combinedText = Object.entries(researchResult.combinedSpecifications)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    breakdown.combinedSpecs = estimateTokensFromText(combinedText);
  }

  const estimatedTokens = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  let recommendation: string;

  if (estimatedTokens > MAX_SAFE_TOKENS) {
    riskLevel = 'critical';
    recommendation = 'CRITICAL: Will exceed token limit. Apply aggressive truncation and prioritization.';
  } else if (estimatedTokens > HIGH_RISK_THRESHOLD) {
    riskLevel = 'high';
    recommendation = 'HIGH RISK: Close to token limit. Apply smart truncation to prevent overflow.';
  } else if (estimatedTokens > 60000) {
    riskLevel = 'medium';
    recommendation = 'MEDIUM: Token count is high. Monitor and consider light truncation.';
  } else {
    riskLevel = 'low';
    recommendation = 'SAFE: Well within token limits. No truncation needed.';
  }

  return {
    estimatedTokens,
    breakdown,
    riskLevel,
    exceedsLimit: estimatedTokens > MAX_SAFE_TOKENS,
    recommendation,
  };
}

/**
 * Estimate tokens from text (rough approximation)
 */
function estimateTokensFromText(text: string | undefined | null): number {
  if (!text) return 0;
  const charCount = text.length;
  return Math.ceil(charCount / CHARS_PER_TOKEN);
}

/**
 * SPEC IMPORTANCE SCORING
 * ========================
 * Determines which specifications are most important based on multiple factors:
 * 
 * FACTOR 1: REQUIRED FIELDS (Score: +40 points)
 * - Brand, Model Number, Category, SubCategory
 * - Dimensions (Width, Height, Depth, Weight)
 * - Color, Finish, MSRP
 * 
 * FACTOR 2: TOP 15 FILTER ATTRIBUTES (Score: +35 points)
 * - Category-specific attributes defined in schema
 * - Used for filtering in Salesforce
 * - Critical for product discoverability
 * 
 * FACTOR 3: UNIQUE IDENTIFIERS (Score: +30 points)
 * - UPC, EAN, GTIN, SKU
 * - Manufacturer Part Number, Catalog Number
 * - Model Number variants
 * 
 * FACTOR 4: TECHNICAL SPECIFICATIONS (Score: +25 points)
 * - Voltage, Amperage, Wattage, BTU
 * - Capacity (gallons, cubic feet)
 * - Electrical requirements
 * - Certifications (UL, CSA, Energy Star)
 * 
 * FACTOR 5: PHYSICAL ATTRIBUTES (Score: +20 points)
 * - Material composition
 * - Finish type (Brushed, Polished, Matte)
 * - Installation type (Freestanding, Built-in, Wall-mount)
 * 
 * FACTOR 6: MARKETING/FEATURES (Score: +10 points)
 * - Technology names (SmartHQ, Wi-Fi, Touch2O)
 * - Feature descriptions
 * - Warranty info
 * 
 * FACTOR 7: REDUNDANT/LOW-VALUE (Score: -20 points penalty)
 * - "Prop 65", "Country of Origin: China"
 * - Shipping dimensions (vs product dimensions)
 * - Generic features ("High Quality", "Durable")
 */
export function scoreSpecificationImportance(
  attrName: string,
  attrValue: string,
  categorySchema: CategoryAttributeConfig
): SpecImportance {
  const normalizedName = attrName.toLowerCase().trim();
  const normalizedValue = String(attrValue || '').toLowerCase().trim();
  
  let score = 0;
  const reasons: string[] = [];
  
  // FACTOR 1: Required fields
  const requiredFields = [
    'brand', 'model', 'model number', 'category', 'subcategory', 'sub category',
    'width', 'height', 'depth', 'weight', 'capacity',
    'color', 'finish', 'msrp', 'price', 'product title', 'title'
  ];
  if (requiredFields.some(field => normalizedName.includes(field))) {
    score += 40;
    reasons.push('REQUIRED_FIELD');
  }
  
  // FACTOR 2: Top 15 filter attributes
  const isTop15 = categorySchema.top15FilterAttributes.some(attr => {
    const normalizedAttr = attr.toLowerCase().replace(/_/g, ' ');
    return normalizedName.includes(normalizedAttr) || normalizedAttr.includes(normalizedName);
  });
  if (isTop15) {
    score += 35;
    reasons.push('TOP_15_FILTER_ATTRIBUTE');
  }
  
  // FACTOR 3: Unique identifiers
  const identifiers = ['upc', 'ean', 'gtin', 'sku', 'part number', 'mpn', 'catalog number', 'item number'];
  if (identifiers.some(id => normalizedName.includes(id))) {
    score += 30;
    reasons.push('UNIQUE_IDENTIFIER');
  }
  
  // FACTOR 4: Technical specifications
  const technicalSpecs = [
    'voltage', 'volts', 'amperage', 'amps', 'wattage', 'watts', 'btu',
    'electrical', 'power', 'energy', 'efficiency',
    'ul', 'csa', 'energy star', 'certif', 'rating',
    'gallons', 'cubic feet', 'cu ft', 'liters', 'capacity'
  ];
  if (technicalSpecs.some(spec => normalizedName.includes(spec))) {
    score += 25;
    reasons.push('TECHNICAL_SPEC');
  }
  
  // FACTOR 5: Physical attributes
  const physicalAttrs = [
    'material', 'finish type', 'installation', 'mount', 'mounting',
    'freestanding', 'built-in', 'wall mount', 'style', 'design',
    'type', 'configuration', 'orientation'
  ];
  if (physicalAttrs.some(attr => normalizedName.includes(attr))) {
    score += 20;
    reasons.push('PHYSICAL_ATTRIBUTE');
  }
  
  // FACTOR 6: Marketing features
  const marketingTerms = [
    'wifi', 'wi-fi', 'smart', 'technology', 'bluetooth', 'app',
    'control', 'feature', 'warranty', 'guarantee'
  ];
  if (marketingTerms.some(term => normalizedName.includes(term) || normalizedValue.includes(term))) {
    score += 10;
    reasons.push('MARKETING_FEATURE');
  }
  
  // FACTOR 7: Redundant/low-value (PENALTIES)
  const lowValueIndicators = [
    'prop 65', 'proposition 65', 'country of origin',
    'shipping weight', 'shipping dimensions', 'package',
    'generic', 'standard', 'default'
  ];
  if (lowValueIndicators.some(indicator => normalizedName.includes(indicator))) {
    score -= 20;
    reasons.push('LOW_VALUE_PENALTY');
  }
  
  // Empty or generic values penalty
  if (!normalizedValue || normalizedValue === 'yes' || normalizedValue === 'no' || 
      normalizedValue === 'n/a' || normalizedValue === 'unknown' || normalizedValue.length < 2) {
    score -= 10;
    reasons.push('GENERIC_VALUE_PENALTY');
  }
  
  // Determine category
  let category: 'critical' | 'high' | 'medium' | 'low';
  if (score >= 40) {
    category = 'critical';
  } else if (score >= 25) {
    category = 'high';
  } else if (score >= 10) {
    category = 'medium';
  } else {
    category = 'low';
  }
  
  return {
    attributeName: attrName,
    attributeValue: String(attrValue || ''),
    importanceScore: Math.max(0, score), // Floor at 0
    reasons,
    category,
  };
}

/**
 * Smart truncation of attribute arrays based on importance
 */
export function truncateAttributesByImportance(
  attributes: SalesforceIncomingAttribute[],
  categorySchema: CategoryAttributeConfig,
  maxAttributes: number,
  source: 'Web_Retailer' | 'Ferguson'
): { retained: SalesforceIncomingAttribute[]; removed: SalesforceIncomingAttribute[]; tokensSaved: number } {
  // Score all attributes
  const scoredAttrs = attributes.map(attr => ({
    attr,
    importance: scoreSpecificationImportance(attr.name, attr.value, categorySchema),
  }));
  
  // Sort by importance score (highest first)
  scoredAttrs.sort((a, b) => b.importance.importanceScore - a.importance.importanceScore);
  
  // Separate into retained and removed
  const retained = scoredAttrs.slice(0, maxAttributes).map(sa => sa.attr);
  const removed = scoredAttrs.slice(maxAttributes).map(sa => sa.attr);
  
  // Estimate tokens saved
  const removedText = removed.map(r => `${r.name}: ${r.value}`).join('\n');
  const tokensSaved = estimateTokensFromText(removedText);
  
  logger.info(`Truncated ${source} attributes for token management`, {
    originalCount: attributes.length,
    retainedCount: retained.length,
    removedCount: removed.length,
    tokensSaved,
    topRetainedAttributes: retained.slice(0, 5).map(r => r.name),
    topRemovedAttributes: removed.slice(0, 5).map(r => r.name),
  });
  
  return { retained, removed, tokensSaved };
}

/**
 * Smart truncation of research results
 */
export function truncateResearchResults(
  research: ResearchResult,
  targetTokenReduction: number
): { truncatedResearch: ResearchResult; tokensSaved: number } {
  let tokensSaved = 0;
  const truncatedResearch = { ...research };
  
  // Strategy 1: Limit web pages to most relevant (keep Ferguson + 1 other)
  if (research.webPages.length > 2) {
    const fergusonPage = research.webPages.find(p => p.url.includes('ferguson'));
    const otherPages = research.webPages.filter(p => !p.url.includes('ferguson'));
    
    truncatedResearch.webPages = fergusonPage ? [fergusonPage, otherPages[0]].filter(Boolean) : [otherPages[0]];
    
    const removedPagesText = research.webPages.slice(2).map(p => 
      `${p.title} ${p.description} ${JSON.stringify(p.specifications)}`
    ).join('\n');
    tokensSaved += estimateTokensFromText(removedPagesText);
  }
  
  // Strategy 2: AGGRESSIVE PDF truncation - extract structured data only
  // Skip prose paragraphs, keep only specification-like content (key:value patterns)
  truncatedResearch.documents = research.documents.map(doc => {
    if (!doc.text) return doc;
    
    // Extract structured data patterns (key:value, numbered specs, tables)
    const structuredLines = doc.text.split('\n').filter(line => {
      const trimmed = line.trim();
      // Keep lines that look like specs: "Width: 30 inches", "• Feature", "1. Spec"
      return /^[\w\s]+:\s*.+/.test(trimmed) ||  // Key: Value pattern
             /^[•\-\*\d]+[.\)]\s*.+/.test(trimmed) ||  // Bullet or numbered
             /^\|.*\|$/.test(trimmed) ||  // Table row
             trimmed.length < 100;  // Short lines are usually structured
    });
    
    // Take first 500 chars of structured content only
    const structuredText = structuredLines.join('\n').substring(0, 500);
    
    return {
      ...doc,
      text: structuredText,
    };
  });
  const pdfTextReduced = research.documents.reduce((sum, doc) => 
    sum + (doc.text?.length || 0) - 500, 0);
  tokensSaved += estimateTokensFromText(' '.repeat(Math.max(0, pdfTextReduced)));
  
  // Strategy 3: Remove combinedSpecifications if we already have individual specs
  // (This is often duplicate data!)
  if (Object.keys(research.combinedSpecifications).length > 30) {
    const combinedText = JSON.stringify(research.combinedSpecifications);
    tokensSaved += estimateTokensFromText(combinedText);
    truncatedResearch.combinedSpecifications = {};
    logger.info('Removed combinedSpecifications to save tokens (duplicate data)');
  }
  
  // Strategy 4: Limit combined features to top 10
  if (research.combinedFeatures.length > 10) {
    const removedFeatures = research.combinedFeatures.slice(10);
    tokensSaved += estimateTokensFromText(removedFeatures.join('\n'));
    truncatedResearch.combinedFeatures = research.combinedFeatures.slice(0, 10);
  }
  
  logger.info('Truncated research results for token management', {
    originalWebPages: research.webPages.length,
    truncatedWebPages: truncatedResearch.webPages.length,
    tokensSaved,
    targetReduction: targetTokenReduction,
  });
  
  return { truncatedResearch, tokensSaved };
}

/**
 * Main entry point: Apply smart truncation to keep request under token limit
 */
export function applySmartTruncation(
  rawProduct: SalesforceIncomingProduct,
  categorySchema: CategoryAttributeConfig,
  researchResult: ResearchResult | null,
  tokenEstimate: TokenEstimate
): { 
  truncatedProduct: SalesforceIncomingProduct;
  truncatedResearch: ResearchResult | null;
  result: TruncationResult;
} {
  if (tokenEstimate.riskLevel === 'low') {
    // No truncation needed
    return {
      truncatedProduct: rawProduct,
      truncatedResearch: researchResult,
      result: {
        truncated: false,
        originalTokens: tokenEstimate.estimatedTokens,
        finalTokens: tokenEstimate.estimatedTokens,
        tokensSaved: 0,
        truncatedSections: [],
        retainedSpecsCount: (rawProduct.Web_Retailer_Specs?.length || 0) + (rawProduct.Ferguson_Attributes?.length || 0),
        removedSpecsCount: 0,
      },
    };
  }
  
  const truncatedSections: string[] = [];
  let totalTokensSaved = 0;
  const truncatedProduct = { ...rawProduct };
  let truncatedResearch = researchResult;
  
  // Calculate how many tokens we need to save
  const tokensToSave = tokenEstimate.estimatedTokens - MAX_SAFE_TOKENS;
  
  logger.warn('Applying smart truncation due to high token count', {
    estimatedTokens: tokenEstimate.estimatedTokens,
    riskLevel: tokenEstimate.riskLevel,
    tokensToSave,
    breakdown: tokenEstimate.breakdown,
  });
  
  // STEP 1: Truncate Web_Retailer_Specs (if > 50 items)
  if (rawProduct.Web_Retailer_Specs && rawProduct.Web_Retailer_Specs.length > 50) {
    const { retained, tokensSaved } = truncateAttributesByImportance(
      rawProduct.Web_Retailer_Specs,
      categorySchema,
      50, // Max 50 specs
      'Web_Retailer'
    );
    truncatedProduct.Web_Retailer_Specs = retained;
    totalTokensSaved += tokensSaved;
    truncatedSections.push('Web_Retailer_Specs');
  }
  
  // STEP 2: Truncate Ferguson_Attributes (if > 50 items)
  if (rawProduct.Ferguson_Attributes && rawProduct.Ferguson_Attributes.length > 50) {
    const { retained, tokensSaved } = truncateAttributesByImportance(
      rawProduct.Ferguson_Attributes,
      categorySchema,
      50, // Max 50 specs
      'Ferguson'
    );
    truncatedProduct.Ferguson_Attributes = retained;
    totalTokensSaved += tokensSaved;
    truncatedSections.push('Ferguson_Attributes');
  }
  
  // STEP 3: If still over limit, truncate research results
  if (totalTokensSaved < tokensToSave && researchResult) {
    const { truncatedResearch: tres, tokensSaved } = truncateResearchResults(
      researchResult,
      tokensToSave - totalTokensSaved
    );
    truncatedResearch = tres;
    totalTokensSaved += tokensSaved;
    truncatedSections.push('Research_Results');
  }
  
  // STEP 4: If STILL over limit, be more aggressive with attributes (reduce to 30 each)
  if (totalTokensSaved < tokensToSave && tokenEstimate.riskLevel === 'critical') {
    if (rawProduct.Web_Retailer_Specs && rawProduct.Web_Retailer_Specs.length > 30) {
      const { retained, tokensSaved } = truncateAttributesByImportance(
        rawProduct.Web_Retailer_Specs,
        categorySchema,
        30,
        'Web_Retailer'
      );
      truncatedProduct.Web_Retailer_Specs = retained;
      totalTokensSaved += tokensSaved;
    }
    
    if (rawProduct.Ferguson_Attributes && rawProduct.Ferguson_Attributes.length > 30) {
      const { retained, tokensSaved } = truncateAttributesByImportance(
        rawProduct.Ferguson_Attributes,
        categorySchema,
        30,
        'Ferguson'
      );
      truncatedProduct.Ferguson_Attributes = retained;
      totalTokensSaved += tokensSaved;
    }
  }
  
  const finalTokens = tokenEstimate.estimatedTokens - totalTokensSaved;
  
  const originalSpecCount = (rawProduct.Web_Retailer_Specs?.length || 0) + (rawProduct.Ferguson_Attributes?.length || 0);
  const finalSpecCount = (truncatedProduct.Web_Retailer_Specs?.length || 0) + (truncatedProduct.Ferguson_Attributes?.length || 0);
  
  logger.info('Smart truncation completed', {
    originalTokens: tokenEstimate.estimatedTokens,
    finalTokens,
    tokensSaved: totalTokensSaved,
    truncatedSections,
    originalSpecCount,
    finalSpecCount,
    removedSpecCount: originalSpecCount - finalSpecCount,
  });
  
  return {
    truncatedProduct,
    truncatedResearch,
    result: {
      truncated: true,
      originalTokens: tokenEstimate.estimatedTokens,
      finalTokens,
      tokensSaved: totalTokensSaved,
      truncatedSections,
      retainedSpecsCount: finalSpecCount,
      removedSpecsCount: originalSpecCount - finalSpecCount,
    },
  };
}

export default {
  estimateTokenCount,
  scoreSpecificationImportance,
  truncateAttributesByImportance,
  truncateResearchResults,
  applySmartTruncation,
};
