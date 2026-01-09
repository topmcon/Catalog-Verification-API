"use strict";
/**
 * Salesforce Verification Service
 * Orchestrates the dual-AI consensus workflow for verifying Salesforce product data
 *
 * WORKFLOW:
 * 1. Receive raw Salesforce data
 * 2. Determine product category
 * 3. Get category-specific schema (Primary, Top 5, Top 15, Additional attributes)
 * 4. Send to BOTH AIs independently (OpenAI & xAI)
 * 5. Each AI:
 *    - Cleans/validates the data
 *    - Researches missing values
 *    - Returns their verified results
 * 6. Compare AI results for CONSENSUS
 * 7. Only AGREED values become verified
 * 8. Discrepancies trigger retry or manual review
 * 9. Build final response payload for Salesforce
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.salesforceVerificationService = void 0;
exports.verifyProduct = verifyProduct;
const category_matcher_service_1 = require("./category-matcher.service");
const category_schema_1 = require("../config/category-schema");
const html_generator_1 = require("../utils/html-generator");
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = __importDefault(require("../config"));
/**
 * Main verification function
 */
async function verifyProduct(rawProduct, sessionId) {
    const startTime = Date.now();
    logger_1.default.info(`Starting verification for product ${rawProduct.SF_Catalog_Id}`, { sessionId });
    try {
        // Step 1: Determine category
        const categoryMatch = (0, category_matcher_service_1.matchCategory)({
            category: rawProduct.Web_Retailer_Category,
            subcategory: rawProduct.Web_Retailer_SubCategory,
            productType: rawProduct.Ferguson_Product_Type,
            title: rawProduct.Product_Title_Web_Retailer,
            description: rawProduct.Product_Description_Web_Retailer
        });
        if (!categoryMatch) {
            logger_1.default.warn(`Could not determine category for ${rawProduct.SF_Catalog_Id}`);
            return buildErrorResponse(rawProduct, sessionId, 'Could not determine product category');
        }
        logger_1.default.info(`Category matched: ${categoryMatch.categoryName}`, {
            sessionId,
            confidence: categoryMatch.confidence,
            matchedOn: categoryMatch.matchedOn
        });
        // Step 2: Get category schema
        const categorySchema = (0, category_schema_1.getCategorySchema)(categoryMatch.categoryName);
        // Step 3: Prepare data for AI verification
        const preparedData = prepareDataForAI(rawProduct, categorySchema);
        // Step 4: Run DUAL AI verification (independent, parallel)
        const [openaiResult, xaiResult] = await Promise.all([
            runOpenAIVerification(preparedData, categorySchema, sessionId),
            runXAIVerification(preparedData, categorySchema, sessionId)
        ]);
        // Step 5: Build consensus
        const consensusResult = buildFieldConsensus(openaiResult, xaiResult, categorySchema);
        // Step 6: Determine verification status
        const verificationStatus = determineVerificationStatus(consensusResult);
        // Step 7: Build final response
        const response = buildVerificationResponse(rawProduct, categoryMatch, categorySchema, consensusResult, verificationStatus, sessionId, Date.now() - startTime);
        logger_1.default.info(`Verification complete for ${rawProduct.SF_Catalog_Id}`, {
            sessionId,
            status: response.Status,
            score: response.Verification.verification_score
        });
        return response;
    }
    catch (error) {
        logger_1.default.error(`Verification failed for ${rawProduct.SF_Catalog_Id}`, { sessionId, error });
        return buildErrorResponse(rawProduct, sessionId, error instanceof Error ? error.message : 'Unknown error');
    }
}
/**
 * Prepare raw Salesforce data for AI processing
 */
function prepareDataForAI(rawProduct, categorySchema) {
    // Merge all data sources into a unified structure
    const mergedAttributes = {};
    // Add Web Retailer specs
    if (rawProduct.Web_Retailer_Specs) {
        for (const spec of rawProduct.Web_Retailer_Specs) {
            const key = normalizeAttributeName(spec.name);
            if (!mergedAttributes[key])
                mergedAttributes[key] = [];
            if (spec.value && !mergedAttributes[key].includes(spec.value)) {
                mergedAttributes[key].push(cleanAttributeValue(spec.value));
            }
        }
    }
    // Add Ferguson attributes
    if (rawProduct.Ferguson_Attributes) {
        for (const attr of rawProduct.Ferguson_Attributes) {
            const key = normalizeAttributeName(attr.name);
            if (!mergedAttributes[key])
                mergedAttributes[key] = [];
            if (attr.value && !mergedAttributes[key].includes(attr.value)) {
                mergedAttributes[key].push(cleanAttributeValue(attr.value));
            }
        }
    }
    return {
        catalogId: rawProduct.SF_Catalog_Id,
        modelNumber: rawProduct.Model_Number_Web_Retailer || rawProduct.Ferguson_Model_Number,
        // Brand
        brand: {
            webRetailer: rawProduct.Brand_Web_Retailer,
            ferguson: rawProduct.Ferguson_Brand
        },
        // Titles
        title: {
            webRetailer: rawProduct.Product_Title_Web_Retailer,
            ferguson: rawProduct.Ferguson_Title
        },
        // Descriptions
        description: {
            webRetailer: rawProduct.Product_Description_Web_Retailer,
            ferguson: rawProduct.Ferguson_Description
        },
        // Category
        category: {
            webRetailer: rawProduct.Web_Retailer_Category,
            subCategory: rawProduct.Web_Retailer_SubCategory,
            fergusonType: rawProduct.Ferguson_Product_Type,
            fergusonBase: rawProduct.Ferguson_Base_Category
        },
        // Pricing
        pricing: {
            msrp: parsePrice(rawProduct.MSRP_Web_Retailer),
            fergusonPrice: parsePrice(rawProduct.Ferguson_Price),
            fergusonMin: parsePrice(rawProduct.Ferguson_Min_Price),
            fergusonMax: parsePrice(rawProduct.Ferguson_Max_Price)
        },
        // Dimensions
        dimensions: {
            width: {
                webRetailer: rawProduct.Width_Web_Retailer,
                ferguson: rawProduct.Ferguson_Width
            },
            height: {
                webRetailer: rawProduct.Height_Web_Retailer,
                ferguson: rawProduct.Ferguson_Height
            },
            depth: {
                webRetailer: rawProduct.Depth_Web_Retailer,
                ferguson: rawProduct.Ferguson_Depth
            },
            weight: rawProduct.Weight_Web_Retailer
        },
        // Appearance
        appearance: {
            colorFinish: rawProduct.Color_Finish_Web_Retailer,
            fergusonFinish: rawProduct.Ferguson_Finish
        },
        // Capacity
        capacity: rawProduct.Capacity_Web_Retailer,
        // Warranty
        warranty: rawProduct.Ferguson_Manufacturer_Warranty,
        // All merged attributes (deduplicated)
        attributes: mergedAttributes,
        // Category schema for reference
        requiredAttributes: categorySchema?.top15FilterAttributes || [],
        // Features (raw HTML)
        featuresHtml: rawProduct.Features_Web_Retailer
    };
}
/**
 * Run OpenAI verification
 */
async function runOpenAIVerification(_preparedData, _categorySchema, sessionId) {
    // This will be implemented to call the actual OpenAI service
    // For now, returning a placeholder
    logger_1.default.info('Running OpenAI verification', { sessionId });
    // TODO: Implement actual OpenAI API call with proper prompt
    // The prompt should include:
    // 1. The prepared data
    // 2. The category schema with required fields
    // 3. Instructions to clean, verify, and research missing data
    return {
        provider: 'openai',
        success: true,
        confidence: 0.85,
        verifiedFields: {},
        corrections: [],
        researchPerformed: []
    };
}
/**
 * Run xAI verification
 */
async function runXAIVerification(_preparedData, _categorySchema, sessionId) {
    // This will be implemented to call the actual xAI service
    logger_1.default.info('Running xAI verification', { sessionId });
    // TODO: Implement actual xAI API call with proper prompt
    return {
        provider: 'xai',
        success: true,
        confidence: 0.85,
        verifiedFields: {},
        corrections: [],
        researchPerformed: []
    };
}
/**
 * Build consensus from dual AI results
 */
function buildFieldConsensus(openaiResult, xaiResult, _categorySchema) {
    const consensusMap = new Map();
    const threshold = config_1.default.aiConsensus?.threshold || 0.8;
    // Get all unique fields from both results
    const allFields = new Set([
        ...Object.keys(openaiResult.verifiedFields),
        ...Object.keys(xaiResult.verifiedFields)
    ]);
    for (const field of allFields) {
        const openaiField = openaiResult.verifiedFields[field];
        const xaiField = xaiResult.verifiedFields[field];
        const consensus = {
            field,
            agreed: false,
            finalValue: null,
            openaiValue: openaiField?.value ?? null,
            xaiValue: xaiField?.value ?? null,
            openaiConfidence: openaiField?.confidence ?? 0,
            xaiConfidence: xaiField?.confidence ?? 0,
            source: 'unresolved'
        };
        // Both AIs provided a value
        if (openaiField && xaiField) {
            // Check if values match
            if (valuesMatch(openaiField.value, xaiField.value)) {
                consensus.agreed = true;
                consensus.finalValue = openaiField.value;
                consensus.source = 'consensus';
            }
            else {
                // Values differ - need resolution
                // Use higher confidence value if one is significantly higher
                if (openaiField.confidence >= threshold &&
                    openaiField.confidence > xaiField.confidence + 0.15) {
                    consensus.finalValue = openaiField.value;
                    consensus.source = 'openai_only';
                }
                else if (xaiField.confidence >= threshold &&
                    xaiField.confidence > openaiField.confidence + 0.15) {
                    consensus.finalValue = xaiField.value;
                    consensus.source = 'xai_only';
                }
                // Otherwise remains unresolved
            }
        }
        else if (openaiField && openaiField.confidence >= threshold) {
            // Only OpenAI provided a value
            consensus.finalValue = openaiField.value;
            consensus.source = 'openai_only';
        }
        else if (xaiField && xaiField.confidence >= threshold) {
            // Only xAI provided a value
            consensus.finalValue = xaiField.value;
            consensus.source = 'xai_only';
        }
        consensusMap.set(field, consensus);
    }
    return consensusMap;
}
/**
 * Check if two values match (with type coercion and normalization)
 */
function valuesMatch(value1, value2) {
    if (value1 === value2)
        return true;
    if (value1 == null && value2 == null)
        return true;
    // String comparison (case-insensitive, trimmed)
    if (typeof value1 === 'string' && typeof value2 === 'string') {
        return value1.toLowerCase().trim() === value2.toLowerCase().trim();
    }
    // Number comparison (with tolerance for floats)
    if (typeof value1 === 'number' && typeof value2 === 'number') {
        return Math.abs(value1 - value2) < 0.01;
    }
    // Boolean comparison
    if (typeof value1 === 'boolean' && typeof value2 === 'boolean') {
        return value1 === value2;
    }
    return false;
}
/**
 * Determine verification status based on consensus results
 */
function determineVerificationStatus(consensusMap) {
    let agreedCount = 0;
    let unresolvedCount = 0;
    let totalFields = consensusMap.size;
    for (const [, consensus] of consensusMap) {
        if (consensus.agreed || consensus.source !== 'unresolved') {
            agreedCount++;
        }
        else {
            unresolvedCount++;
        }
    }
    const agreementRate = totalFields > 0 ? agreedCount / totalFields : 0;
    if (agreementRate >= 0.9)
        return 'verified';
    if (agreementRate >= 0.7)
        return 'needs_review';
    return 'failed';
}
/**
 * Build the final verification response for Salesforce
 */
function buildVerificationResponse(rawProduct, _categoryMatch, categorySchema, consensusMap, status, sessionId, _processingTimeMs) {
    // Build Primary Display Attributes
    const primaryAttributes = buildPrimaryAttributes(rawProduct, consensusMap);
    // Build Top Filter Attributes (category-specific)
    const topFilterAttributes = buildTopFilterAttributes(consensusMap, categorySchema);
    // Build Additional Attributes HTML Table
    const additionalAttributesHtml = buildAdditionalAttributesHtml(rawProduct, consensusMap, categorySchema);
    // Build Price Analysis
    const priceAnalysis = buildPriceAnalysis(rawProduct);
    // Calculate verification score
    const verificationScore = calculateVerificationScore(consensusMap);
    // Build verification metadata
    const verification = {
        verification_timestamp: new Date().toISOString(),
        verification_session_id: sessionId,
        verification_score: verificationScore,
        verification_status: status,
        data_sources_used: ['Web_Retailer', 'Ferguson', 'AI_OpenAI', 'AI_xAI'],
        corrections_made: extractCorrections(consensusMap),
        missing_fields: extractMissingFields(consensusMap, categorySchema),
        confidence_scores: extractConfidenceScores(consensusMap)
    };
    return {
        SF_Catalog_Id: rawProduct.SF_Catalog_Id,
        SF_Catalog_Name: rawProduct.SF_Catalog_Name,
        Primary_Attributes: primaryAttributes,
        Top_Filter_Attributes: topFilterAttributes,
        Additional_Attributes_HTML: additionalAttributesHtml,
        Price_Analysis: priceAnalysis,
        Verification: verification,
        Status: status === 'failed' ? 'failed' : status === 'verified' ? 'success' : 'partial'
    };
}
/**
 * Build primary display attributes
 */
function buildPrimaryAttributes(rawProduct, consensusMap) {
    return {
        Brand_Verified: getConsensusValue(consensusMap, 'brand') || rawProduct.Brand_Web_Retailer,
        Category_Verified: getConsensusValue(consensusMap, 'category') || rawProduct.Web_Retailer_Category,
        SubCategory_Verified: getConsensusValue(consensusMap, 'subcategory') || rawProduct.Web_Retailer_SubCategory,
        Product_Family_Verified: getConsensusValue(consensusMap, 'product_family') || '',
        Product_Style_Verified: getConsensusValue(consensusMap, 'product_style') || '',
        Depth_Verified: getConsensusValue(consensusMap, 'depth') || rawProduct.Depth_Web_Retailer,
        Width_Verified: getConsensusValue(consensusMap, 'width') || rawProduct.Width_Web_Retailer,
        Height_Verified: getConsensusValue(consensusMap, 'height') || rawProduct.Height_Web_Retailer,
        Weight_Verified: getConsensusValue(consensusMap, 'weight') || rawProduct.Weight_Web_Retailer,
        MSRP_Verified: getConsensusValue(consensusMap, 'msrp') || rawProduct.MSRP_Web_Retailer,
        Market_Value: rawProduct.Ferguson_Price || '',
        Market_Value_Min: rawProduct.Ferguson_Min_Price || '',
        Market_Value_Max: rawProduct.Ferguson_Max_Price || '',
        Description_Verified: getConsensusValue(consensusMap, 'description') || rawProduct.Product_Description_Web_Retailer,
        Product_Title_Verified: getConsensusValue(consensusMap, 'title') || rawProduct.Product_Title_Web_Retailer,
        Details_Verified: getConsensusValue(consensusMap, 'details') || '',
        Features_List_HTML: buildFeaturesHtml(consensusMap),
        UPC_GTIN_Verified: getConsensusValue(consensusMap, 'upc') || '',
        Model_Number_Verified: rawProduct.Model_Number_Web_Retailer,
        Model_Number_Alias: removeSymbolsFromModelNumber(rawProduct.Model_Number_Web_Retailer),
        Model_Parent: extractModelParent(rawProduct.Model_Number_Web_Retailer),
        Model_Variant_Number: '',
        Total_Model_Variants: ''
    };
}
/**
 * Build top filter attributes based on category schema
 */
function buildTopFilterAttributes(consensusMap, categorySchema) {
    const topAttributes = {};
    if (!categorySchema)
        return topAttributes;
    // Get the top 15 filter attributes for this category
    for (const attrName of categorySchema.top15FilterAttributes) {
        const normalizedName = normalizeAttributeName(attrName);
        const consensus = consensusMap.get(normalizedName);
        topAttributes[attrName] = consensus?.finalValue ?? null;
    }
    return topAttributes;
}
/**
 * Build additional attributes as HTML table
 */
function buildAdditionalAttributesHtml(rawProduct, consensusMap, categorySchema) {
    // Get attributes that are NOT in the top 15
    const top15Set = new Set((categorySchema?.top15FilterAttributes || []).map(normalizeAttributeName));
    const additionalAttrs = [];
    // Add verified values from consensus map
    for (const [field, consensus] of consensusMap) {
        if (!top15Set.has(normalizeAttributeName(field)) && consensus.finalValue != null) {
            additionalAttrs.push({
                name: denormalizeAttributeName(field),
                value: String(consensus.finalValue)
            });
        }
    }
    // Also add raw attributes from rawProduct.Web_Retailer_Specs if not already covered
    if (rawProduct.Web_Retailer_Specs) {
        for (const attr of rawProduct.Web_Retailer_Specs) {
            const normalizedAttrName = normalizeAttributeName(attr.name);
            const alreadyExists = additionalAttrs.some(a => normalizeAttributeName(a.name) === normalizedAttrName);
            const isTop15 = top15Set.has(normalizedAttrName);
            if (!alreadyExists && !isTop15 && attr.value) {
                additionalAttrs.push({
                    name: attr.name,
                    value: attr.value
                });
            }
        }
    }
    // Convert array to Record for generateAttributeTable
    const additionalAttrsRecord = {};
    for (const attr of additionalAttrs) {
        additionalAttrsRecord[attr.name] = attr.value;
    }
    // Generate HTML table
    return (0, html_generator_1.generateAttributeTable)(additionalAttrsRecord);
}
/**
 * Build price analysis
 */
function buildPriceAnalysis(rawProduct) {
    const msrp = parsePrice(rawProduct.MSRP_Web_Retailer);
    const fergusonPrice = parsePrice(rawProduct.Ferguson_Price);
    const minPrice = parsePrice(rawProduct.Ferguson_Min_Price);
    const maxPrice = parsePrice(rawProduct.Ferguson_Max_Price);
    const marketValue = fergusonPrice || ((minPrice + maxPrice) / 2) || 0;
    const priceDifference = msrp - marketValue;
    const priceDifferencePercent = marketValue > 0 ? ((priceDifference / marketValue) * 100) : 0;
    let pricePosition = 'at_market';
    if (priceDifferencePercent > 5)
        pricePosition = 'above_market';
    else if (priceDifferencePercent < -5)
        pricePosition = 'below_market';
    return {
        msrp_web_retailer: msrp,
        market_value_ferguson: fergusonPrice,
        market_value_min: minPrice,
        market_value_max: maxPrice,
        price_difference: priceDifference,
        price_difference_percent: Math.round(priceDifferencePercent * 100) / 100,
        price_position: pricePosition
    };
}
/**
 * Calculate verification score (0-100)
 */
function calculateVerificationScore(consensusMap) {
    if (consensusMap.size === 0)
        return 0;
    let totalScore = 0;
    let fieldCount = 0;
    for (const [, consensus] of consensusMap) {
        fieldCount++;
        if (consensus.agreed) {
            totalScore += 100;
        }
        else if (consensus.source === 'openai_only' || consensus.source === 'xai_only') {
            totalScore += 70;
        }
        else {
            totalScore += 0;
        }
    }
    return Math.round(totalScore / fieldCount);
}
/**
 * Helper functions
 */
function getConsensusValue(map, field) {
    const consensus = map.get(field);
    return consensus?.finalValue != null ? String(consensus.finalValue) : '';
}
function normalizeAttributeName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}
function denormalizeAttributeName(name) {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
function cleanAttributeValue(value) {
    return value
        .replace(/<br\s*\/?>/gi, ', ')
        .replace(/<[^>]+>/g, '')
        .replace(/&[a-z]+;/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function parsePrice(price) {
    if (!price)
        return 0;
    const cleaned = price.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
}
function removeSymbolsFromModelNumber(model) {
    return model.replace(/[^a-zA-Z0-9]/g, '');
}
function extractModelParent(model) {
    // Extract base model (remove color/variant suffixes)
    const match = model.match(/^([A-Z]{2,}[0-9]+)/i);
    return match ? match[1] : model;
}
function buildFeaturesHtml(consensusMap) {
    const features = getConsensusValue(consensusMap, 'features');
    if (!features)
        return '<ul></ul>';
    const featureList = features.split(',').map(f => f.trim()).filter(f => f);
    const listItems = featureList.map(f => `<li>${f}</li>`).join('');
    return `<ul>${listItems}</ul>`;
}
function extractCorrections(consensusMap) {
    const corrections = [];
    for (const [_field, consensus] of consensusMap) {
        if (consensus.source === 'consensus' &&
            consensus.openaiValue !== consensus.xaiValue) {
            // This shouldn't happen in consensus, but just in case
        }
        // Could add more correction tracking here
    }
    return corrections;
}
function extractMissingFields(consensusMap, categorySchema) {
    const missing = [];
    if (!categorySchema)
        return missing;
    for (const attr of categorySchema.top15FilterAttributes) {
        const normalized = normalizeAttributeName(attr);
        const consensus = consensusMap.get(normalized);
        if (!consensus || consensus.finalValue == null) {
            missing.push(attr);
        }
    }
    return missing;
}
function extractConfidenceScores(consensusMap) {
    const scores = {};
    for (const [field, consensus] of consensusMap) {
        const avgConfidence = (consensus.openaiConfidence + consensus.xaiConfidence) / 2;
        scores[field] = Math.round(avgConfidence * 100) / 100;
    }
    return scores;
}
function buildErrorResponse(rawProduct, sessionId, errorMessage) {
    return {
        SF_Catalog_Id: rawProduct.SF_Catalog_Id,
        SF_Catalog_Name: rawProduct.SF_Catalog_Name,
        Primary_Attributes: {},
        Top_Filter_Attributes: {},
        Additional_Attributes_HTML: '',
        Price_Analysis: {
            msrp_web_retailer: 0,
            market_value_ferguson: 0,
            market_value_min: 0,
            market_value_max: 0,
            price_difference: 0,
            price_difference_percent: 0,
            price_position: 'at_market'
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
exports.default = { verifyProduct };
// Named export for use in controllers
exports.salesforceVerificationService = { verifyProduct };
//# sourceMappingURL=salesforce-verification.service.js.map