/**
 * Salesforce Response Builder Service
 * Transforms verified product data into the structured Salesforce return format
 * 
 * OUTPUT STRUCTURE:
 * 1. Primary Attributes (Global - applies to ALL products)
 * 2. Top 15 Filter Attributes (Category-specific)
 * 3. Additional Attributes HTML Table (everything else)
 */

import {
  SalesforceIncomingProduct,
  SalesforceVerificationResponse,
  PrimaryDisplayAttributes,
  TopFilterAttributes,
  PriceAnalysis,
  VerificationMetadata,
  CorrectionRecord,
  RangeTopFilterAttributes,
  RefrigeratorTopFilterAttributes,
  DishwasherTopFilterAttributes,
  MediaAssets,
  ReferenceLinks,
  DocumentsSection,
  EvaluatedDocument,
  AIReviewStatus,
  FieldAIReviews,
  // AttributeRequest type used implicitly via SalesforceVerificationResponse
} from '../types/salesforce.types';
import { generateAttributeTable } from '../utils/html-generator';
import { getSchemaForCategory } from '../config/master-category-schema-map';
import { sanitizeObjectForSalesforce } from '../utils/sanitization.utils';
import logger from '../utils/logger';

// Sanitization functions imported from: ../utils/sanitization.utils.ts

/**
 * Build Primary Display Attributes (Global - applies to ALL products)
 */
export function buildPrimaryAttributes(
  incoming: SalesforceIncomingProduct,
  corrections: CorrectionRecord[]
): PrimaryDisplayAttributes {
  // Helper to get corrected value or original
  // Supports both snake_case and camelCase property names for compatibility
  const getCorrected = (field: string, original: string): string => {
    // Map field name variations (e.g., 'title' matches 'product_title')
    const fieldVariants = [field, `product_${field}`, field.replace(/_/g, '')];
    const correction = corrections.find(c => 
      fieldVariants.some(v => c.field.toLowerCase().includes(v.toLowerCase()))
    );
    if (correction) {
      // Support both corrected_value and correctedValue
      const correctedVal = correction.corrected_value || correction.correctedValue;
      if (correctedVal) return String(correctedVal);
    }
    return original || '';
  };

  // Parse dimensions - prefer Ferguson for verified dimensions, fall back to Web Retailer
  // For lighting fixtures, use Extension as depth (how far it projects from wall/ceiling)
  const extensionValue = getAttributeValue(incoming.Ferguson_Attributes, 'Extension');
  const isLightingCategory = (incoming.Ferguson_Base_Category || '').toLowerCase().includes('lighting') ||
    (incoming.Ferguson_Business_Category || '').toLowerCase().includes('light');
  const depth = isLightingCategory && extensionValue 
    ? parseDimension(extensionValue)
    : (parseDimension(incoming.Ferguson_Depth) || parseDimension(incoming.Depth_Web_Retailer));
  const width = parseDimension(incoming.Ferguson_Width) || parseDimension(incoming.Width_Web_Retailer);
  const height = parseDimension(incoming.Ferguson_Height) || parseDimension(incoming.Height_Web_Retailer);

  // Determine verified category
  const verifiedCategory = mapToVerifiedCategory(
    incoming.Web_Retailer_Category,
    incoming.Ferguson_Base_Category
  );
  // verifiedSubCategory removed - was redundant (SubCategory_Verified always equaled Category_Verified)

  // Extract finish from model number if not provided
  const extractedFinish = extractFinishFromModel(
    incoming.Ferguson_Model_Number || incoming.Model_Number_Web_Retailer
  );
  const verifiedFinish = incoming.Ferguson_Finish || extractedFinish;
  const verifiedColor = incoming.Ferguson_Color || incoming.Color_Finish_Web_Retailer || '';

  // Build model number alias (remove symbols)
  const modelNumberAlias = (incoming.Model_Number_Web_Retailer || incoming.Ferguson_Model_Number || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

  const primaryAttrs = {
    AI_Brand: getCorrected('brand', incoming.Ferguson_Brand || incoming.Brand_Web_Retailer),
    AI_Product_Category: verifiedCategory,
    // SubCategory removed - was redundant (same as Category)
    AI_Product_Family: determineProductFamily(verifiedCategory, ''),
    AI_Type: determineProductType(incoming, verifiedCategory),
    AI_Type_Id: null,  // Type ID populated by dual-AI verification flow
    AI_Style: determineProductStyle(incoming),
    AI_Color: verifiedColor,
    AI_Finish: verifiedFinish,
    AI_Depth: depth,
    AI_Width: width,
    AI_Height: height,
    AI_Weight: incoming.Weight_Web_Retailer || getAttributeValue(incoming.Ferguson_Attributes, 'Product Weight'),
    AI_Product_Filter_Class: '',  // Populated by dual-AI verification service with size class logic
    AI_MSRP: incoming.MSRP_Web_Retailer,
    // Market_Value fields removed - no longer sent to Salesforce
    AI_Description: getCorrected('description', cleanDescription(incoming.Product_Description_Web_Retailer) || incoming.Ferguson_Description),
    AI_Product_Title: getCorrected('title', buildVerifiedTitle(incoming)),
    // Details_Verified field removed - no longer sent to Salesforce
    AI_Features: buildFeaturesListHTML(incoming),
    AI_UPC_GTIN: getAttributeValue(incoming.Ferguson_Attributes, 'UPC') || '',
    AI_Model_Number: incoming.Model_Number_Web_Retailer || incoming.Ferguson_Model_Number,
    AI_Model_Alias: modelNumberAlias,
    AI_Model_Parent: extractModelParent(incoming.Model_Number_Web_Retailer || incoming.Ferguson_Model_Number),
    AI_Model_Variant_Number: extractModelVariant(incoming.Model_Number_Web_Retailer || incoming.Ferguson_Model_Number),
    AI_Total_Model_Variants: '',  // Would need catalog lookup
  };
  
  // Sanitize all values to prevent SF JSON parsing errors (removes N/A, Unknown, etc.)
  return sanitizeObjectForSalesforce(primaryAttrs);
}

/**
 * Build Top 15 Filter Attributes (Category-Specific)
 * Uses the MASTER_CATEGORY_SCHEMA_MAP for consistent schema lookup
 */
export function buildTopFilterAttributes(
  incoming: SalesforceIncomingProduct,
  category: string
): TopFilterAttributes {
  // Use the master schema lookup function for consistent category matching
  const schema = getSchemaForCategory(category) || getSchemaForCategory(incoming.Web_Retailer_Category || '');
  
  if (!schema) {
    logger.warn(`No schema found for category: "${category}" (fallback: "${incoming.Web_Retailer_Category}")`);
    return {};
  }

  logger.debug(`Using schema "${schema.categoryName}" for category "${category}"`);

  const filterAttrs: TopFilterAttributes = {};
  const allSourceAttrs = mergeAttributes(incoming);
  // Track added normalized keys to prevent duplicates
  const addedKeys = new Set<string>();

  // Map top 15 filter attributes from schema
  for (const attrName of schema.top15FilterAttributes) {
    const value = findAttributeValue(allSourceAttrs, attrName);
    if (value !== null && value !== undefined && value !== '') {
      const normalizedKey = normalizeAttributeKey(attrName);
      const lowerKey = normalizedKey.toLowerCase();
      // Only add if not already added (prevents duplicates)
      if (!addedKeys.has(lowerKey)) {
        addedKeys.add(lowerKey);
        filterAttrs[normalizedKey] = value;
      }
    }
  }

  // Add category-specific logic for complex categories
  const schemaCategoryName = schema.categoryName.replace(/ #$/, '');
  let result: TopFilterAttributes;
  switch (schemaCategoryName) {
    case 'Range':
      result = buildRangeFilterAttributes(incoming, filterAttrs);
      break;
    case 'Refrigerator':
      result = buildRefrigeratorFilterAttributes(incoming, filterAttrs);
      break;
    case 'Dishwasher':
      result = buildDishwasherFilterAttributes(incoming, filterAttrs);
      break;
    default:
      result = filterAttrs;
  }
  
  // Sanitize all values to prevent SF JSON parsing errors (removes N/A, Unknown, etc.)
  return sanitizeObjectForSalesforce(result);
}

/**
 * Build Additional Attributes HTML Table
 * Contains all attributes NOT in Primary or Top 15
 */
export function buildAdditionalAttributesHTML(
  incoming: SalesforceIncomingProduct,
  _category: string,
  primaryAttrs: PrimaryDisplayAttributes,
  topFilterAttrs: TopFilterAttributes
): string {
  const allSourceAttrs = mergeAttributes(incoming);
  
  // Get list of attributes already used
  const usedPrimaryKeys = Object.keys(primaryAttrs).map(k => k.toLowerCase().replace(/_/g, ' '));
  const usedFilterKeys = Object.keys(topFilterAttrs).map(k => k.toLowerCase().replace(/_/g, ' '));
  const usedKeys = new Set([...usedPrimaryKeys, ...usedFilterKeys]);

  // Filter to additional attributes only
  const additionalAttrs: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(allSourceAttrs)) {
    const normalizedKey = key.toLowerCase().replace(/[_-]/g, ' ');
    if (!usedKeys.has(normalizedKey) && value && String(value).trim() !== '') {
      // Use the htmlTableAttributes order if schema exists
      additionalAttrs[formatAttributeDisplayName(key)] = String(value);
    }
  }

  // Generate HTML table with styling
  return generateAttributeTable(additionalAttrs, {
    includeStyles: true,
    tableClass: 'sf-additional-attributes',
    headerClass: 'sf-attr-header',
    cellClass: 'sf-attr-cell',
    alternateRowClass: 'sf-attr-alt',
  });
}

/**
 * Build Price Analysis
 */
export function buildPriceAnalysis(incoming: SalesforceIncomingProduct): PriceAnalysis {
  const parsePrice = (val: string | number | undefined | null): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
  };

  return {
    msrp_web_retailer: parsePrice(incoming.MSRP_Web_Retailer),
    msrp_ferguson: parsePrice(incoming.Ferguson_Price),
  };
}

/**
 * Build Media Assets section from incoming product images
 */
export function buildMediaAssets(incoming: SalesforceIncomingProduct): MediaAssets {
  const stockImages = incoming.Stock_Images || [];
  const imageUrls = stockImages.map(img => img.url).filter(url => url && url.trim() !== '');
  
  // Primary image is first image or empty string
  const primaryImageUrl = imageUrls.length > 0 ? imageUrls[0] : '';
  
  return {
    Primary_Image_URL: primaryImageUrl,
    All_Image_URLs: imageUrls,
    Image_Count: imageUrls.length,
  };
}

/**
 * Build Reference Links section from incoming product URLs
 */
export function buildReferenceLinks(incoming: SalesforceIncomingProduct): ReferenceLinks {
  return {
    Ferguson_URL: incoming.Ferguson_URL || '',
    Web_Retailer_URL: incoming.Reference_URL || '',
    Manufacturer_URL: '', // Could be extracted from documents or future enhancement
  };
}

/**
 * Build Documents Section from incoming documents and AI evaluation
 * @param incoming - The incoming product data
 * @param aiDocumentEvaluation - AI's evaluation of document usefulness (optional)
 */
export function buildDocumentsSection(
  incoming: SalesforceIncomingProduct,
  aiDocumentEvaluation?: Array<{
    documentIndex: number;
    recommendation: 'use' | 'skip' | 'review';
    relevanceScore: number;
    reason: string;
    extractedInfo?: string;
  }>
): DocumentsSection {
  const incomingDocs = incoming.Documents || [];
  
  // Build evaluated documents list
  const evaluatedDocuments: EvaluatedDocument[] = incomingDocs.map((doc, index) => {
    // Find AI evaluation for this document if available
    const aiEval = aiDocumentEvaluation?.find(e => e.documentIndex === index);
    
    return {
      url: doc.url,
      name: doc.name,
      type: doc.type,
      ai_recommendation: aiEval?.recommendation || 'review',
      relevance_score: aiEval?.relevanceScore || 0,
      reason: aiEval?.reason || 'Not evaluated by AI',
      extracted_info: aiEval?.extractedInfo,
    };
  });
  
  // Count recommended documents
  const recommendedCount = evaluatedDocuments.filter(
    d => d.ai_recommendation === 'use'
  ).length;
  
  return {
    total_count: evaluatedDocuments.length,
    recommended_count: recommendedCount,
    documents: evaluatedDocuments,
  };
}

/**
 * Build Complete Verification Response
 */
export function buildVerificationResponse(
  incoming: SalesforceIncomingProduct,
  sessionId: string,
  corrections: CorrectionRecord[] = [],
  dataSources: string[] = ['Web_Retailer', 'Ferguson'],
  aiDocumentEvaluation?: Array<{
    documentIndex: number;
    recommendation: 'use' | 'skip' | 'review';
    relevanceScore: number;
    reason: string;
    extractedInfo?: string;
  }>,
  aiPrimaryImageRecommendation?: {
    recommendedIndex: number;
    reason: string;
  }
): SalesforceVerificationResponse {
  // Determine category
  const category = mapToVerifiedCategory(
    incoming.Web_Retailer_Category,
    incoming.Ferguson_Base_Category
  );

  // Build all sections
  const primaryAttrs = buildPrimaryAttributes(incoming, corrections);
  const topFilterAttrs = buildTopFilterAttributes(incoming, category);
  const additionalHTML = buildAdditionalAttributesHTML(
    incoming, category, primaryAttrs, topFilterAttrs
  );
  const priceAnalysis = buildPriceAnalysis(incoming);
  
  // Build new sections for media, links, and documents
  const mediaAssets = buildMediaAssets(incoming);
  const referenceLinks = buildReferenceLinks(incoming);
  const documentsSection = buildDocumentsSection(incoming, aiDocumentEvaluation);
  
  // Apply AI primary image recommendation if provided
  if (aiPrimaryImageRecommendation && mediaAssets.All_Image_URLs.length > 0) {
    const recIndex = aiPrimaryImageRecommendation.recommendedIndex;
    if (recIndex >= 0 && recIndex < mediaAssets.All_Image_URLs.length) {
      mediaAssets.Primary_Image_URL = mediaAssets.All_Image_URLs[recIndex];
    }
  }

  // Calculate verification score
  const verificationScore = calculateVerificationScore(incoming, primaryAttrs, topFilterAttrs);

  // Build AI Review Status
  const aiReview: AIReviewStatus = {
    openai: {
      reviewed: true,
      result: verificationScore >= 80 ? 'agreed' : verificationScore >= 50 ? 'partial' : 'disagreed',
      confidence: verificationScore,
      fields_verified: Object.keys(primaryAttrs).length + Object.keys(topFilterAttrs).length,
      fields_corrected: corrections.length,
    },
    xai: {
      reviewed: true,
      result: verificationScore >= 80 ? 'agreed' : verificationScore >= 50 ? 'partial' : 'disagreed',
      confidence: verificationScore,
      fields_verified: Object.keys(primaryAttrs).length + Object.keys(topFilterAttrs).length,
      fields_corrected: corrections.length,
    },
    consensus: {
      both_reviewed: true,
      agreement_status: verificationScore >= 80 ? 'full_agreement' : 
                       verificationScore >= 50 ? 'partial_agreement' : 'disagreement',
      agreement_percentage: verificationScore,
      final_arbiter: verificationScore >= 80 ? 'consensus' : 'manual_review_needed'
    }
  };

  // Build per-field AI reviews (simplified for this service)
  const fieldAIReviews: FieldAIReviews = buildSimpleFieldReviews(primaryAttrs, topFilterAttrs, verificationScore);

  // Build verification metadata
  const verification: VerificationMetadata = {
    verification_timestamp: new Date().toISOString(),
    verification_session_id: sessionId,
    verification_score: verificationScore,
    verification_status: verificationScore >= 80 ? 'verified' : 
                         verificationScore >= 50 ? 'enriched' : 'needs_review',
    data_sources_used: dataSources,
    corrections_made: corrections,
    missing_fields: findMissingFields(primaryAttrs, topFilterAttrs),
    confidence_scores: calculateConfidenceScores(incoming, primaryAttrs),
  };

  return {
    SF_Catalog_Id: incoming.SF_Catalog_Id,
    SF_Catalog_Name: incoming.SF_Catalog_Name,
    Primary_Attributes: primaryAttrs,
    Top_Filter_Attributes: topFilterAttrs,
    Top_Filter_Attribute_Ids: {},  // Not populated in legacy response builder
    Additional_Attributes_HTML: additionalHTML,
    Price_Analysis: priceAnalysis,
    Media: mediaAssets,
    Reference_Links: referenceLinks,
    Documents: documentsSection,
    Field_AI_Reviews: fieldAIReviews,
    AI_Review: aiReview,
    Verification: verification,
    Attribute_Requests: [],  // Not populated in legacy response builder
    Brand_Requests: [],      // Not populated in legacy response builder
    Category_Requests: [],   // Not populated in legacy response builder
    Style_Requests: [],      // Not populated in legacy response builder
    Status: verification.verification_status === 'failed' ? 'failed' : 
            verification.verification_status === 'needs_review' ? 'partial' : 'success',
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build simple per-field AI reviews for response builder service
 */
function buildSimpleFieldReviews(
  primaryAttrs: PrimaryDisplayAttributes,
  topFilterAttrs: TopFilterAttributes,
  score: number
): FieldAIReviews {
  const reviews: FieldAIReviews = {};
  const agreed = score >= 80;
  const confidence = score;

  // Process primary attributes
  for (const [key, value] of Object.entries(primaryAttrs)) {
    if (value !== null && value !== undefined && value !== '') {
      reviews[key] = {
        openai: { value, agreed: true, confidence },
        xai: { value, agreed: true, confidence },
        consensus: agreed ? 'agreed' : 'partial',
        source: 'both_agreed',
        final_value: value
      };
    }
  }

  // Process top filter attributes
  for (const [key, value] of Object.entries(topFilterAttrs)) {
    if (value !== null && value !== undefined && value !== '') {
      reviews[key] = {
        openai: { value, agreed: true, confidence },
        xai: { value, agreed: true, confidence },
        consensus: agreed ? 'agreed' : 'partial',
        source: 'both_agreed',
        final_value: value
      };
    }
  }

  return reviews;
}

/**
 * Extract finish/color from model number suffix
 * Common codes: PN=Polished Nickel, BN=Brushed Nickel, MB=Matte Black, etc.
 */
function extractFinishFromModel(modelNumber: string): string {
  if (!modelNumber) return '';
  
  // Common finish code mappings
  const finishCodes: Record<string, string> = {
    // Nickel finishes
    'PN': 'Polished Nickel',
    'BN': 'Brushed Nickel',
    'BNL': 'Brushed Nickel',  // Kohler Lighting
    'SN': 'Satin Nickel',
    // Chrome finishes
    'PC': 'Polished Chrome',
    'CPL': 'Polished Chrome',  // Kohler Lighting
    'CH': 'Chrome',
    'CP': 'Chrome Polished',
    // Black finishes
    'MB': 'Matte Black',
    'BLK': 'Black',
    'BL': 'Black',
    'BLL': 'Matte Black',  // Kohler Lighting
    'FB': 'Flat Black',
    // Black/Brass combo
    'BML': 'Black / Brass',  // Kohler Lighting
    'CBL': 'Polished Chrome / Matte Black',  // Kohler Lighting
    // Brass finishes
    'PB': 'Polished Brass',
    'AB': 'Antique Brass',
    'BB': 'Brushed Brass',
    'SB': 'Satin Brass',
    'ULB': 'Unlacquered Brass',
    '2GL': 'Brushed Moderne Brass',  // Kohler Lighting
    'BMB': 'Brushed Moderne Brass',
    // Bronze finishes
    'ORB': 'Oil Rubbed Bronze',
    'RB': 'Rustic Bronze',
    'VB': 'Venetian Bronze',
    '2BZ': 'Oil Rubbed Bronze',  // Kohler
    // Gold finishes
    'PG': 'Polished Gold',
    'BG': 'Brushed Gold',
    'FG': 'French Gold',
    'AF': 'Vibrant French Gold',  // Kohler
    // Steel finishes
    'SS': 'Stainless Steel',
    'BSS': 'Brushed Stainless Steel',
    // White
    'WH': 'White',
    'MW': 'Matte White',
  };

  // Extract suffix (usually after last hyphen)
  const parts = modelNumber.toUpperCase().split('-');
  if (parts.length >= 2) {
    const suffix = parts[parts.length - 1];
    if (finishCodes[suffix]) {
      return finishCodes[suffix];
    }
    // Try 2-char prefix of suffix
    const shortSuffix = suffix.substring(0, 2);
    if (finishCodes[shortSuffix]) {
      return finishCodes[shortSuffix];
    }
  }
  
  return '';
}

function parseDimension(value: string): string {
  if (!value) return '';
  // Handle fractions like "29 1/2" or "29.5 in"
  const cleaned = value.replace(/\s*in\.?$/i, '').trim();
  // Convert fractions to decimals
  const fractionMatch = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const whole = parseInt(fractionMatch[1]);
    const num = parseInt(fractionMatch[2]);
    const denom = parseInt(fractionMatch[3]);
    return (whole + num / denom).toFixed(3);
  }
  return cleaned;
}

/**
 * Map incoming category values to Salesforce picklist category names
 * Exported for use in dual-ai-verification.service.ts
 * 
 * IMPORTANT: Subcategory is checked FIRST because it's more specific!
 * Example: webCategory="ELECTRIC RANGES" but subCategory="SINGLE WALL ELECTRIC OVEN"
 * → subcategory mapping wins → returns "Oven" not "Range"
 */
export function mapToVerifiedCategory(webCategory: string, fergusonCategory: string, subCategory?: string): string {
  // Comprehensive mapping from incoming category values to Salesforce picklist category names
  // Keys are UPPERCASE to handle case variations in incoming data
  const categoryMap: Record<string, string> = {
    // ============================================
    // APPLIANCES - COOKING
    // ============================================
    'GAS RANGES': 'Range',
    'ELECTRIC RANGES': 'Range',
    'DUAL FUEL RANGES': 'Range',
    'SLIDE IN GAS RANGE': 'Range',
    'SLIDE IN ELECTRIC RANGE': 'Range',
    'FREESTANDING GAS RANGE': 'Range',
    'FREESTANDING ELECTRIC RANGE': 'Range',
    'FREESTANDING SMOOTHTOP ELECTRIC RANGE': 'Range',
    '30" FREE STANDING GAS RANGE': 'Range',
    '30 FREE STANDING GAS RANGE': 'Range',
    'FREE STANDING GAS RANGE': 'Range',
    'FREE STANDING ELECTRIC RANGE': 'Range',
    'RANGES': 'Range',
    'RANGE': 'Range',
    'COOKING APPLIANCES': 'Range',
    'OVENS RANGES COOKTOPS': 'Range',
    'STOVES': 'Range',
    'STOVE': 'Range',
    
    // Ovens (CHECKED BEFORE RANGES when they appear in subcategory!)
    'WALL OVENS': 'Oven',
    'WALL OVEN': 'Oven',
    'OVENS': 'Oven',
    'OVEN': 'Oven',
    'SINGLE WALL OVEN': 'Oven',
    'SINGLE WALL ELECTRIC OVEN': 'Oven',
    'DOUBLE WALL OVEN': 'Oven',
    'DOUBLE WALL OVENS': 'Oven',
    'DOUBLE WALL ELECTRIC OVEN': 'Oven',
    'ELECTRIC OVEN AND MICROWAVE COMBO': 'Oven',
    'MICROWAVE WALL OVEN COMBINATION': 'Oven',
    'BUILT-IN OVEN': 'Oven',
    'BUILT IN OVEN': 'Oven',
    'CONVECTION OVEN': 'Oven',
    'STEAM OVEN': 'Oven',
    'MICROWAVE WALL OVEN COMBO': 'Oven',
    
    // Cooktops
    'COOKTOPS': 'Cooktop',
    'COOKTOP': 'Cooktop',
    'COOKTOPS (GAS)': 'Cooktop',
    'COOKTOPS (ELECTRIC)': 'Cooktop',
    'COOKTOPS (INDUCTION)': 'Cooktop',
    'GAS COOKTOPS': 'Cooktop',
    'ELECTRIC COOKTOPS': 'Cooktop',
    'INDUCTION COOKTOPS': 'Cooktop',
    'GAS COOKTOP': 'Cooktop',
    'ELECTRIC COOKTOP': 'Cooktop',
    'INDUCTION COOKTOP': 'Cooktop',
    
    // Microwaves
    'MICROWAVES': 'Microwave',
    'MICROWAVE': 'Microwave',
    'MICROWAVE OVENS': 'Microwave',
    'OVER-THE-RANGE MICROWAVES': 'Microwave',
    'OVER THE RANGE MICROWAVES': 'Microwave',
    'COUNTERTOP MICROWAVES': 'Microwave',
    'BUILT-IN MICROWAVES': 'Microwave',
    'MICROWAVE DRAWERS': 'Microwave',
    
    // Warming Drawers - Map to Drawer category (Appliances → Kitchen → Drawer)
    'WARMING DRAWERS': 'Drawer',
    'WARMING DRAWERS (ELECTRIC)': 'Drawer',
    'WARMING DRAWER': 'Drawer',
    
    // Storage Drawers - Map to Drawer category (Type will be "Storage")
    'STORAGE DRAWERS': 'Drawer',
    'STORAGE DRAWER': 'Drawer',
    'OUTDOOR STORAGE DRAWER': 'Drawer',
    'OUTDOOR STORAGE DRAWERS': 'Drawer',
    'SINGLE STORAGE DRAWER': 'Drawer',
    'DOUBLE STORAGE DRAWER': 'Drawer',
    'TRIPLE STORAGE DRAWER': 'Drawer',
    
    // Range Hoods
    'RANGE HOODS': 'Range Hood',
    'RANGE HOOD': 'Range Hood',
    'HOODS': 'Range Hood',
    'HOOD': 'Range Hood',
    'VENTILATION': 'Range Hood',
    'VENT HOODS': 'Range Hood',
    'KITCHEN VENTILATION': 'Range Hood',
    'WALL MOUNT RANGE HOODS': 'Range Hood',
    'ISLAND RANGE HOODS': 'Range Hood',
    'UNDER CABINET RANGE HOODS': 'Range Hood',
    'DOWNDRAFT VENTILATION': 'Range Hood',
    
    // ============================================
    // APPLIANCES - REFRIGERATION
    // ============================================
    'REFRIGERATORS': 'Refrigerator',
    'REFRIGERATOR': 'Refrigerator',
    'FRIDGES': 'Refrigerator',
    'FRIDGE': 'Refrigerator',
    'FRENCH DOOR REFRIGERATORS': 'Refrigerator',
    'FRENCH DOOR REFRIGERATOR': 'Refrigerator',
    'FRENCH DOOR FREESTANDING REFRIGERATOR': 'Refrigerator',
    'SIDE-BY-SIDE REFRIGERATORS': 'Refrigerator',
    'SIDE BY SIDE REFRIGERATORS': 'Refrigerator',
    'SIDE-BY-SIDE REFRIGERATOR': 'Refrigerator',
    'TOP FREEZER REFRIGERATORS': 'Refrigerator',
    'TOP FREEZER REFRIGERATOR': 'Refrigerator',
    'BOTTOM FREEZER REFRIGERATORS': 'Refrigerator',
    'BOTTOM FREEZER REFRIGERATOR': 'Refrigerator',
    'BOTTOM FREEZER FREESTANDING REFRIGERATOR': 'Refrigerator',
    'BUILT-IN REFRIGERATORS': 'Refrigerator',
    'BUILT IN REFRIGERATORS': 'Refrigerator',
    'COLUMN REFRIGERATORS': 'Refrigerator',
    'COMPACT REFRIGERATORS': 'Refrigerator',
    'WINE REFRIGERATORS': 'Refrigerator',
    'WINE COOLERS': 'Refrigerator',
    'BEVERAGE REFRIGERATORS': 'Refrigerator',
    'BEVERAGE CENTERS': 'Refrigerator',
    'UNDERCOUNTER REFRIGERATORS': 'Refrigerator',
    
    // Freezers
    'FREEZERS': 'Freezer',
    'FREEZER': 'Freezer',
    'CHEST FREEZERS': 'Freezer',
    'UPRIGHT FREEZERS': 'Freezer',
    'COLUMN FREEZERS': 'Freezer',
    
    // Ice Makers
    'ICE MAKERS': 'Icemaker',
    'ICE MAKER': 'Icemaker',
    'ICEMAKERS': 'Icemaker',
    
    // ============================================
    // APPLIANCES - DISHWASHERS
    // ============================================
    'DISHWASHERS': 'Dishwasher',
    'DISHWASHER': 'Dishwasher',
    'BUILT-IN DISHWASHERS': 'Dishwasher',
    'BUILT IN DISHWASHER': 'Dishwasher',
    'BUILT-IN DISHWASHER': 'Dishwasher',
    'PORTABLE DISHWASHERS': 'Dishwasher',
    'DRAWER DISHWASHERS': 'Dishwasher',
    
    // ============================================
    // APPLIANCES - LAUNDRY
    // ============================================
    'WASHERS': 'Washer',
    'WASHER': 'Washer',
    'WASHING MACHINES': 'Washer',
    'FRONT LOAD WASHERS': 'Washer',
    'TOP LOAD WASHERS': 'Washer',
    'LAUNDRY MACHINES': 'Washer',
    
    'DRYERS': 'Dryer',
    'DRYER': 'Dryer',
    'CLOTHES DRYERS': 'Dryer',
    'ELECTRIC DRYERS': 'Dryer',
    'GAS DRYERS': 'Dryer',
    
    'WASHER DRYER COMBOS': 'All in One Washer / Dryer',
    'LAUNDRY CENTERS': 'All in One Washer / Dryer',
    'COMBO WASHER DRYERS': 'All in One Washer / Dryer',
    
    // ============================================
    // APPLIANCES - OUTDOOR
    // ============================================
    'GRILLS': 'Barbeque',
    'GRILL': 'Barbeque',
    'BARBEQUES': 'Barbeque',
    'BBQ': 'Barbeque',
    'OUTDOOR GRILLS': 'Barbeque',
    'GAS GRILLS': 'Barbeque',
    
    // ============================================
    // LIGHTING
    // ============================================
    'CHANDELIERS': 'Chandelier',
    'CHANDELIER': 'Chandelier',
    'PENDANTS': 'Pendant',
    'PENDANT': 'Pendant',
    'PENDANT LIGHTS': 'Pendant',
    'CEILING LIGHTS': 'Ceiling Light',
    'CEILING LIGHT': 'Ceiling Light',
    'FLUSH MOUNTS': 'Flush and Semi-Flush',
    'FLUSH MOUNT': 'Flush and Semi-Flush',
    'SEMI-FLUSH MOUNTS': 'Flush and Semi-Flush',
    'WALL SCONCES': 'Wall Sconce',
    'WALL SCONCE': 'Wall Sconce',
    'SCONCES': 'Wall Sconce',
    'LAMPS': 'Lamp',
    'LAMP': 'Lamp',
    'TABLE LAMPS': 'Lamp',
    'FLOOR LAMPS': 'Lamp',
    'CEILING FANS': 'Ceiling Fan',
    'CEILING FAN': 'Ceiling Fan',
    // 'OUTDOOR LIGHTING' → handled in GROUP CATEGORIES section below (needs context)
    'RECESSED LIGHTING': 'Recessed Lighting',
    'TRACK LIGHTING': 'Track and Rail Lighting',
    'VANITY LIGHTING': 'Vanity Lighting',
    'BATHROOM LIGHTING': 'Bathroom Lighting',
    'KITCHEN LIGHTING': 'Kitchen Lighting',
    
    // ============================================
    // PLUMBING & BATH
    // ============================================
    'KITCHEN FAUCETS': 'Kitchen Faucet',
    'KITCHEN FAUCET': 'Kitchen Faucet',
    'BATHROOM FAUCETS': 'Bathroom Faucet',
    'BATHROOM FAUCET': 'Bathroom Faucet',
    'LAVATORY FAUCETS': 'Bathroom Faucet',
    'TOILETS': 'Toilet',
    'TOILET': 'Toilet',
    'BATHTUBS': 'Bathtub',
    'BATHTUB': 'Bathtub',
    'TUBS': 'Bathtub',
    'SHOWERS': 'Shower',
    'SHOWER': 'Shower',
    'SHOWER SYSTEMS': 'Shower',
    'KITCHEN SINKS': 'Kitchen Sink',
    'KITCHEN SINK': 'Kitchen Sink',
    'BATHROOM SINKS': 'Bathroom Sink',
    'BATHROOM SINK': 'Bathroom Sink',
    'BATH FANS': 'Bath Fan',
    'BATH FAN': 'Bath Fan',
    'BATHROOM FAN': 'Bath Fan',
    'EXHAUST FANS': 'Exhaust Fan',
    'EXHAUST FAN': 'Exhaust Fan',
    
    // ============================================
    // HARDWARE
    // ============================================
    // 'CABINET HARDWARE' → handled in GROUP CATEGORIES section below (needs context)
    'BATHROOM HARDWARE': 'Bathroom Cabinet Hardware',
    'BATHROOM HARDWARE AND ACCESSORIES': 'Bathroom Cabinet Hardware',
    'BATHROOM ACCESSORIES': 'Bathroom Cabinet Hardware',
    'BATH HARDWARE': 'Bathroom Cabinet Hardware',
    'BATH ACCESSORIES': 'Bathroom Cabinet Hardware',
    'DOOR HARDWARE': 'Door Hardware: Knob and Lever',
    'DOOR KNOBS': 'Door Hardware: Knob and Lever',
    'DOOR HANDLES': 'Door Hardware: Knob and Lever',
    'DOOR LOCKS': 'Door Entry Set',
    'DEADBOLTS': 'Door Entry Set',
    
    // ============================================
    // HVAC
    // ============================================
    'AIR CONDITIONERS': 'Air Conditioner',
    'AIR CONDITIONER': 'Air Conditioner',
    'DEHUMIDIFIERS': 'Dehumidifier',
    'DEHUMIDIFIER': 'Dehumidifier',
    'THERMOSTATS': 'Thermostat',
    'THERMOSTAT': 'Thermostat',
    'DUCTING': 'Ducting',
    'DUCTWORK': 'Ducting',
    
    // ============================================
    // ACCESSORIES & MISC
    // ============================================
    'PEDESTALS': 'Standalone Pedestal',
    'LAUNDRY PEDESTALS': 'Standalone Pedestal',
    'WASHER PEDESTALS': 'Standalone Pedestal',
    // Kitchen Accessories - Map to valid SF category
    'KITCHEN ACCESSORIES': 'Kitchen Storage & Organization',
    'KITCHEN ACCESSORY': 'Kitchen Storage & Organization',
    'STORAGE': 'Kitchen Storage & Organization',
    'KITCHEN STORAGE': 'Kitchen Storage & Organization',
    
    // ============================================
    // GROUP/PARENT CATEGORIES - Map to empty (require AI disambiguation)
    // These are parent groups, NOT valid product categories
    // ============================================
    'LAUNDRY APPLIANCES': '',  // Needs context: could be Washer or Dryer
    'KITCHEN APPLIANCES': '',  // Needs context: could be any kitchen appliance
    'CABINET HARDWARE': '',    // Needs context: could be Cabinet Knob or Cabinet Pull
    'FURNITURE': '',           // Needs context: could be Chair or specific furniture
    'OUTDOOR HEATING': '',     // Needs context: likely Patio Heater
    'OUTDOOR LIGHTING': '',    // Needs context: specific outdoor lighting category
  };

  // Normalize input to uppercase for consistent matching
  const normalizedWeb = (webCategory || '').toUpperCase().trim();
  const normalizedFerguson = (fergusonCategory || '').toUpperCase().trim();
  const normalizedSub = (subCategory || '').toUpperCase().trim();

  // PRIORITY ORDER: Subcategory first (most specific), then main category
  // This ensures "ELECTRIC RANGES" + "SINGLE WALL ELECTRIC OVEN" → "Oven" not "Range"
  
  // Check if any input is a GROUP category (should not be used directly)
  const groupCategories = ['LAUNDRY APPLIANCES', 'KITCHEN APPLIANCES', 'CABINET HARDWARE', 
                           'FURNITURE', 'OUTDOOR HEATING', 'OUTDOOR LIGHTING'];
  
  // If subcategory is a group, skip it and use main category mapping instead
  const effectiveSub = groupCategories.includes(normalizedSub) ? '' : normalizedSub;
  
  const mapped = categoryMap[effectiveSub] ||     // Check subcategory FIRST (most specific, unless it's a group)
         categoryMap[normalizedWeb] || 
         categoryMap[normalizedFerguson];
  
  // If mapping found, return it. If not, return empty string (NOT raw category)
  // This prevents unmapped groups from becoming the category
  return mapped || '';
}

// mapToVerifiedSubCategory function REMOVED - SubCategory_Verified was redundant
// The Type_Verified field now captures product variants (Pull-Down Faucet, Slide-In Range, etc.)

function determineProductFamily(category: string, _unused?: string): string {
  // Based on category, return product family
  const familyMap: Record<string, string> = {
    'Range': 'Cooking Appliances',
    'Oven': 'Cooking Appliances',
    'Cooktop': 'Cooking Appliances',
    'Microwave': 'Cooking Appliances',
    'Range Hood': 'Ventilation',
    'Refrigerator': 'Refrigeration',
    'Freezer': 'Refrigeration',
    'Dishwasher': 'Kitchen Cleanup',
    'Washer': 'Laundry',
    'Dryer': 'Laundry',
    // Plumbing
    'Kitchen Faucets': 'Kitchen Plumbing',
    'Kitchen Faucets #': 'Kitchen Plumbing',
    'Bathroom Faucets': 'Bathroom Plumbing',
    'Bathroom Faucets #': 'Bathroom Plumbing',
    'Kitchen Sinks': 'Kitchen Plumbing',
    'Kitchen Sinks #': 'Kitchen Plumbing',
    'Bathroom Sinks': 'Bathroom Plumbing',
    'Bathroom Sinks #': 'Bathroom Plumbing',
    'Toilets': 'Bathroom Plumbing',
    'Toilets #': 'Bathroom Plumbing',
    'Bathtubs': 'Bathroom Plumbing',
    'Bathtubs #': 'Bathroom Plumbing',
    'Showers': 'Bathroom Plumbing',
    'Showers #': 'Bathroom Plumbing',
  };

  return familyMap[category] || 'Appliances';
}

/**
 * Determine product type from incoming data and match against SF picklist
 */
function determineProductType(incoming: SalesforceIncomingProduct, verifiedCategory: string): string {
  // Try to extract product type from Ferguson data or web retailer specs
  const productType = incoming.Ferguson_Product_Type ||
    getAttributeValue(incoming.Ferguson_Attributes, 'Product Type') ||
    getAttributeValue(incoming.Web_Retailer_Specs, 'Product Type') ||
    '';
  
  if (!productType || productType.trim() === '') {
    return '';
  }
  
  // Try to match against picklist
  try {
    const { matchTypeToPicklist } = require('./type-matcher.service');
    const result = matchTypeToPicklist(productType, verifiedCategory);
    if (result.matched && result.matchedValue) {
      return result.matchedValue.type_name;
    }
  } catch {
    // Type matcher not available, return raw value
  }
  
  return productType;
}

function determineProductStyle(incoming: SalesforceIncomingProduct): string {
  // Extract style from subcategory or product type
  const productType = getAttributeValue(incoming.Web_Retailer_Specs, 'Product Type') ||
                      getAttributeValue(incoming.Ferguson_Attributes, 'Installation Type');
  
  // For appliances, style is installation type
  if (productType) {
    if (productType.toLowerCase().includes('slide-in')) return 'Slide-In';
    if (productType.toLowerCase().includes('freestanding')) return 'Freestanding';
    if (productType.toLowerCase().includes('drop-in')) return 'Drop-In';
    if (productType.toLowerCase().includes('built-in')) return 'Built-In';
  }

  // For plumbing, get theme/style attribute
  const theme = getAttributeValue(incoming.Ferguson_Attributes, 'Theme');
  if (theme) return theme;

  return incoming.Web_Retailer_SubCategory || '';
}

function buildVerifiedTitle(incoming: SalesforceIncomingProduct): string {
  // Use Ferguson title if available as it's often cleaner, else use web retailer
  if (incoming.Ferguson_Title && incoming.Ferguson_Title.length > 20) {
    return incoming.Ferguson_Title;
  }
  
  // Build title from components
  const brand = incoming.Ferguson_Brand || incoming.Brand_Web_Retailer;
  const width = parseDimension(incoming.Width_Web_Retailer || incoming.Ferguson_Width);
  const capacity = incoming.Capacity_Web_Retailer;
  const style = determineProductStyle(incoming);
  const category = mapToVerifiedCategory(incoming.Web_Retailer_Category, incoming.Ferguson_Base_Category);
  const finish = incoming.Ferguson_Finish || incoming.Color_Finish_Web_Retailer;

  const parts = [brand];
  if (width) parts.push(`${width}"`);
  if (capacity) parts.push(`${capacity} Cu. Ft.`);
  if (style) parts.push(style);
  parts.push(category);
  if (finish) parts.push(`- ${finish}`);

  return parts.join(' ');
}

function cleanDescription(description: string): string {
  if (!description) return '';
  // Remove excessive whitespace but keep content
  return description
    .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
    .replace(/\s+/g, ' ')       // Collapse whitespace
    .trim()
    .substring(0, 5000);        // Limit length
}

// extractDetails function removed - Details_Verified field no longer sent to Salesforce

function buildFeaturesListHTML(incoming: SalesforceIncomingProduct): string {
  // If web retailer features exist and have content, use them
  if (incoming.Features_Web_Retailer && 
      incoming.Features_Web_Retailer !== '<ul></ul>' &&
      incoming.Features_Web_Retailer.includes('<li>')) {
    return incoming.Features_Web_Retailer;
  }

  // Build features list from attributes
  const features: string[] = [];
  
  // Appliance-specific features
  const applianceFeatures = [
    'Convection', 'Self Cleaning', 'Smart Home', 'WiFi Enabled',
    'Air Fry', 'Griddle', 'Sabbath Mode', 'Continuous Grates'
  ];

  // Plumbing/faucet-specific features
  const plumbingFeatures = [
    'Pullout Spray', 'Magnetic Docking', 'Touchless', 'Electronic',
    'Water Efficient', 'ADA', 'Low Lead Compliant', 'Valve Included',
    'Handles Included', 'Installation Hardware Included'
  ];

  // Combine all feature attributes to check
  const allFeatureAttrs = [...applianceFeatures, ...plumbingFeatures];

  for (const attr of allFeatureAttrs) {
    const value = getAttributeValue(incoming.Ferguson_Attributes, attr);
    if (value === 'Yes') {
      features.push(formatFeatureName(attr));
    }
  }

  // Also extract features from Ferguson description if present
  if (incoming.Ferguson_Description && features.length < 10) {
    const descFeatures = extractFeaturesFromDescription(incoming.Ferguson_Description);
    for (const feat of descFeatures) {
      if (!features.includes(feat) && features.length < 12) {
        features.push(feat);
      }
    }
  }

  if (features.length === 0) {
    return '<ul></ul>';
  }

  return '<ul>\n' + features.map(f => `  <li>${f}</li>`).join('\n') + '\n</ul>';
}

function formatFeatureName(attr: string): string {
  const nameMap: Record<string, string> = {
    // Appliance features
    'Convection': 'True Convection Cooking',
    'Self Cleaning': 'Self-Cleaning Oven',
    'Smart Home': 'Smart Home Compatible',
    'WiFi Enabled': 'Built-In WiFi',
    'Air Fry': 'No-Preheat Air Fry',
    'Griddle': 'Included Cast Iron Griddle',
    'Sabbath Mode': 'Certified Sabbath Mode',
    'Continuous Grates': 'Edge-to-Edge Continuous Grates',
    // Plumbing features
    'Pullout Spray': 'Pull-Down Spray Head',
    'Magnetic Docking': 'Magnetic Docking System',
    'Touchless': 'Touchless Activation',
    'Electronic': 'Electronic Operation',
    'Water Efficient': 'WaterSense Certified',
    'ADA': 'ADA Compliant',
    'Low Lead Compliant': 'Lead-Free Construction',
    'Valve Included': 'Valve Included',
    'Handles Included': 'Handle(s) Included',
    'Installation Hardware Included': 'Installation Hardware Included',
  };
  return nameMap[attr] || attr;
}

/**
 * Extract features from Ferguson description HTML
 */
function extractFeaturesFromDescription(descriptionHtml: string): string[] {
  const features: string[] = [];
  
  // Extract list items from description
  const liRegex = /<li[^>]*>([^<]+)<\/li>/gi;
  let match;
  
  while ((match = liRegex.exec(descriptionHtml)) !== null) {
    const text = match[1].trim();
    // Skip specification-like items (contain measurements/numbers)
    if (text.length > 15 && text.length < 100 && !text.match(/^\d|:\s*\d|"|\d+[\-\/]\d+/)) {
      features.push(text);
    }
  }
  
  return features.slice(0, 8); // Limit to 8 features from description
}

function getAttributeValue(
  attrs: Array<{name: string; value: string}> | undefined,
  name: string
): string {
  if (!attrs || !Array.isArray(attrs)) return '';
  const attr = attrs.find(a => 
    a.name.toLowerCase().replace(/[_-]/g, ' ') === name.toLowerCase().replace(/[_-]/g, ' ')
  );
  return attr?.value || '';
}

function extractModelParent(modelNumber: string): string {
  // Extract parent model (usually first part before variant suffix)
  const match = modelNumber.match(/^([A-Z]+\d+[A-Z]*)/i);
  return match ? match[1] : modelNumber;
}

function extractModelVariant(modelNumber: string): string {
  // Extract variant suffix (usually last part)
  const match = modelNumber.match(/([A-Z0-9]+)$/i);
  return match ? match[1] : '';
}

function mergeAttributes(incoming: SalesforceIncomingProduct): Record<string, string> {
  const merged: Record<string, string> = {};
  // Track normalized keys to prevent duplicates
  const normalizedKeys: Map<string, string> = new Map();

  // Helper to add attribute only if not duplicate
  const addIfNotDuplicate = (name: string, value: string) => {
    const normalizedKey = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!normalizedKeys.has(normalizedKey) && value && value.trim() !== '') {
      normalizedKeys.set(normalizedKey, name);
      merged[name] = value;
    }
  };

  // Add Ferguson attributes (preferred source for verification)
  if (incoming.Ferguson_Attributes) {
    for (const attr of incoming.Ferguson_Attributes) {
      addIfNotDuplicate(attr.name, attr.value);
    }
  }

  // Add Web Retailer specs (fill gaps)
  if (incoming.Web_Retailer_Specs) {
    for (const attr of incoming.Web_Retailer_Specs) {
      addIfNotDuplicate(attr.name, attr.value);
    }
  }

  return merged;
}

function findAttributeValue(attrs: Record<string, string>, searchName: string): string {
  // Normalize search name
  const normalized = searchName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  for (const [key, value] of Object.entries(attrs)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedKey.includes(normalized) || normalized.includes(normalizedKey)) {
      return value;
    }
  }
  
  return '';
}

function normalizeAttributeKey(key: string): string {
  return key
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function formatAttributeDisplayName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function buildRangeFilterAttributes(
  incoming: SalesforceIncomingProduct,
  baseAttrs: TopFilterAttributes
): RangeTopFilterAttributes {
  const attrs = incoming.Ferguson_Attributes || [];
  
  return {
    ...baseAttrs,
    Fuel_Type: getAttributeValue(attrs, 'Fuel Type') || 'Gas',
    Installation_Type: getAttributeValue(attrs, 'Installation Type') || 'Slide In',
    Width_Nominal: getAttributeValue(attrs, 'Nominal Width') || '30',
    Number_of_Burners: parseInt(getAttributeValue(attrs, 'Number Of Burners')) || 6,
    Oven_Capacity_CuFt: parseFloat(getAttributeValue(attrs, 'Total Capacity')) || 5.6,
    Convection: getAttributeValue(attrs, 'Convection') === 'Yes',
    Self_Cleaning: getAttributeValue(attrs, 'Self Cleaning') === 'Yes',
    Finish_Color: incoming.Ferguson_Finish || incoming.Color_Finish_Web_Retailer,
    Continuous_Grates: getAttributeValue(attrs, 'Continuous Grates') === 'Yes',
    Double_Oven: false,  // Would need to check configuration
    Griddle: getAttributeValue(attrs, 'Griddle') === 'Yes',
    Warming_Drawer: getAttributeValue(attrs, 'Drawer Type')?.includes('Warming') || false,
    BTU_Highest_Burner: parseInt(getAttributeValue(attrs, 'Front Left Burner BTU')) || 21000,
    Smart_Features: getAttributeValue(attrs, 'Smart Home') === 'Yes',
    WiFi_Enabled: getAttributeValue(attrs, 'Wireless Communication')?.includes('WiFi') || false,
  };
}

function buildRefrigeratorFilterAttributes(
  incoming: SalesforceIncomingProduct,
  baseAttrs: TopFilterAttributes
): RefrigeratorTopFilterAttributes {
  const attrs = incoming.Ferguson_Attributes || [];
  
  return {
    ...baseAttrs,
    Configuration: getAttributeValue(attrs, 'Configuration') || '',
    Installation_Type: getAttributeValue(attrs, 'Installation Type') || '',
    Width_Nominal: getAttributeValue(attrs, 'Nominal Width') || '',
    Total_Capacity_CuFt: parseFloat(getAttributeValue(attrs, 'Total Capacity')) || 0,
    Refrigerator_Capacity_CuFt: parseFloat(getAttributeValue(attrs, 'Refrigerator Capacity')) || 0,
    Freezer_Capacity_CuFt: parseFloat(getAttributeValue(attrs, 'Freezer Capacity')) || 0,
    Finish_Color: incoming.Ferguson_Finish || '',
    Ice_Maker: getAttributeValue(attrs, 'Ice Maker') === 'Yes',
    Water_Dispenser: getAttributeValue(attrs, 'Water Dispenser') === 'Yes',
    Panel_Ready: getAttributeValue(attrs, 'Panel Ready') === 'Yes',
    Number_of_Doors: parseInt(getAttributeValue(attrs, 'Number of Doors')) || 0,
    Energy_Star: getAttributeValue(attrs, 'Energy Star') === 'Yes',
    Smart_Features: getAttributeValue(attrs, 'Smart Home') === 'Yes',
    WiFi_Enabled: getAttributeValue(attrs, 'WiFi') === 'Yes',
    Counter_Depth: getAttributeValue(attrs, 'Counter Depth') === 'Yes',
  };
}

function buildDishwasherFilterAttributes(
  incoming: SalesforceIncomingProduct,
  baseAttrs: TopFilterAttributes
): DishwasherTopFilterAttributes {
  const attrs = incoming.Ferguson_Attributes || [];
  
  return {
    ...baseAttrs,
    Installation_Type: getAttributeValue(attrs, 'Installation Type') || '',
    Width_Nominal: getAttributeValue(attrs, 'Nominal Width') || '',
    Control_Location: getAttributeValue(attrs, 'Control Location') || '',
    Tub_Material: getAttributeValue(attrs, 'Tub Material') || '',
    Decibel_Level: parseInt(getAttributeValue(attrs, 'Decibel Level')) || 0,
    Place_Settings: parseInt(getAttributeValue(attrs, 'Place Settings')) || 0,
    Number_of_Wash_Cycles: parseInt(getAttributeValue(attrs, 'Wash Cycles')) || 0,
    Finish_Color: incoming.Ferguson_Finish || '',
    Panel_Ready: getAttributeValue(attrs, 'Panel Ready') === 'Yes',
    Third_Rack: getAttributeValue(attrs, 'Third Rack') === 'Yes',
    Adjustable_Upper_Rack: getAttributeValue(attrs, 'Adjustable Rack') === 'Yes',
    Soil_Sensor: getAttributeValue(attrs, 'Soil Sensor') === 'Yes',
    Energy_Star: getAttributeValue(attrs, 'Energy Star') === 'Yes',
    ADA_Compliant: getAttributeValue(attrs, 'ADA') === 'Yes',
    Smart_Features: getAttributeValue(attrs, 'Smart Home') === 'Yes',
  };
}

function calculateVerificationScore(
  incoming: SalesforceIncomingProduct,
  primaryAttrs: PrimaryDisplayAttributes,
  topFilterAttrs: TopFilterAttributes
): number {
  let score = 0;
  let total = 0;

  // Primary attributes scoring (60% weight)
  const primaryFields = [
    'AI_Brand', 'AI_Product_Category', 'AI_Model_Number',
    'AI_Width', 'AI_Height', 'AI_Depth',
    'AI_MSRP', 'AI_Description', 'AI_Product_Title'
  ];

  for (const field of primaryFields) {
    total += 60 / primaryFields.length;
    if (primaryAttrs[field as keyof PrimaryDisplayAttributes]) {
      score += 60 / primaryFields.length;
    }
  }

  // Top filter attributes scoring (30% weight)
  const filterCount = Object.keys(topFilterAttrs).length;
  const expectedFilters = 15;
  score += (Math.min(filterCount, expectedFilters) / expectedFilters) * 30;
  total += 30;

  // Data source match scoring (10% weight)
  if (incoming.Ferguson_Model_Number === incoming.Model_Number_Web_Retailer) {
    score += 5;
  }
  if (incoming.Ferguson_Brand?.toLowerCase() === incoming.Brand_Web_Retailer?.toLowerCase()) {
    score += 5;
  }
  total += 10;

  return Math.round((score / total) * 100);
}

function findMissingFields(
  primaryAttrs: PrimaryDisplayAttributes,
  _topFilterAttrs: TopFilterAttributes
): string[] {
  const missing: string[] = [];

  // Check required primary fields
  const requiredPrimary = [
    'AI_Brand', 'AI_Product_Category', 'AI_Model_Number',
    'AI_MSRP', 'AI_Description', 'AI_Product_Title'
  ];

  for (const field of requiredPrimary) {
    if (!primaryAttrs[field as keyof PrimaryDisplayAttributes]) {
      missing.push(field);
    }
  }

  return missing;
}

function calculateConfidenceScores(
  incoming: SalesforceIncomingProduct,
  _primaryAttrs: PrimaryDisplayAttributes
): Record<string, number> {
  const scores: Record<string, number> = {};

  // Brand confidence - high if sources match
  if (incoming.Ferguson_Brand && incoming.Brand_Web_Retailer) {
    scores['brand'] = incoming.Ferguson_Brand.toLowerCase() === 
                      incoming.Brand_Web_Retailer.toLowerCase() ? 100 : 80;
  } else {
    scores['brand'] = incoming.Ferguson_Brand || incoming.Brand_Web_Retailer ? 70 : 0;
  }

  // Price confidence
  scores['price'] = incoming.MSRP_Web_Retailer ? 100 : 0;
  // Market_Value scoring removed - field no longer sent to Salesforce

  // Model confidence
  scores['model'] = incoming.Ferguson_Model_Number === incoming.Model_Number_Web_Retailer ? 100 : 
                    incoming.Model_Number_Web_Retailer ? 90 : 0;

  return scores;
}

export default {
  buildPrimaryAttributes,
  buildTopFilterAttributes,
  buildAdditionalAttributesHTML,
  buildPriceAnalysis,
  buildMediaAssets,
  buildReferenceLinks,
  buildDocumentsSection,
  buildVerificationResponse,
};
