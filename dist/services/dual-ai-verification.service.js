"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dualAIVerificationService = void 0;
exports.verifyProductWithDualAI = verifyProductWithDualAI;
const uuid_1 = require("uuid");
const openai_1 = __importDefault(require("openai"));
const master_category_attributes_1 = require("../config/master-category-attributes");
const html_generator_1 = require("../utils/html-generator");
const text_cleaner_1 = require("../utils/text-cleaner");
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = __importDefault(require("../config"));
const tracking_service_1 = __importDefault(require("./tracking.service"));
// Initialize OpenAI client
const openai = new openai_1.default({
    apiKey: config_1.default.openai?.apiKey || process.env.OPENAI_API_KEY
});
// xAI client (uses OpenAI-compatible API)
const xai = new openai_1.default({
    apiKey: config_1.default.xai?.apiKey || process.env.XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1'
});
async function verifyProductWithDualAI(rawProduct, sessionId, requestContext) {
    const verificationSessionId = sessionId || (0, uuid_1.v4)();
    const startTime = Date.now();
    // Start tracking
    const trackingId = await tracking_service_1.default.startTracking(verificationSessionId, requestContext?.endpoint || '/api/verify/salesforce', requestContext?.method || 'POST', requestContext?.ipAddress || 'unknown', requestContext?.userAgent || 'unknown', requestContext?.apiKey, rawProduct, rawProduct);
    logger_1.default.info('Starting dual AI verification', {
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
        tracking_service_1.default.recordOpenAIResult(trackingId, {
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
        tracking_service_1.default.recordXAIResult(trackingId, {
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
        logger_1.default.info('Initial AI analysis complete', {
            sessionId: verificationSessionId,
            openaiCategory: openaiResult.determinedCategory,
            xaiCategory: xaiResult.determinedCategory
        });
        let consensus = buildConsensus(openaiResult, xaiResult);
        let crossValidationPerformed = false;
        let researchPhaseTriggered = false;
        let retryCount = 0;
        if (!consensus.agreed && openaiResult.determinedCategory !== xaiResult.determinedCategory) {
            logger_1.default.info('Category disagreement - initiating cross-validation', { sessionId: verificationSessionId });
            crossValidationPerformed = true;
            retryCount++;
            const [openaiRevised, xaiRevised] = await Promise.all([
                reanalyzeWithContext(rawProduct, 'openai', xaiResult, verificationSessionId),
                reanalyzeWithContext(rawProduct, 'xai', openaiResult, verificationSessionId)
            ]);
            consensus = buildConsensus(openaiRevised, xaiRevised);
        }
        if (consensus.needsResearch.length > 0 && consensus.agreedCategory) {
            logger_1.default.info('Missing data - initiating research phase', { sessionId: verificationSessionId });
            researchPhaseTriggered = true;
            const [openaiResearch, xaiResearch] = await Promise.all([
                researchMissingData(rawProduct, consensus.needsResearch, 'openai', consensus.agreedCategory, verificationSessionId),
                researchMissingData(rawProduct, consensus.needsResearch, 'xai', consensus.agreedCategory, verificationSessionId)
            ]);
            consensus = mergeResearchResults(consensus, openaiResearch, xaiResearch);
        }
        // Track consensus result
        tracking_service_1.default.recordConsensusResult(trackingId, {
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
        // Complete tracking with successful response
        await tracking_service_1.default.completeTracking(trackingId, response, 200);
        return response;
    }
    catch (error) {
        logger_1.default.error('Dual AI verification failed', { sessionId: verificationSessionId, error });
        const errorResponse = buildErrorResponse(rawProduct, verificationSessionId, error);
        // Complete tracking with error
        await tracking_service_1.default.completeTrackingWithError(trackingId, error instanceof Error ? error : new Error(String(error)), 500);
        return errorResponse;
    }
}
async function analyzeWithOpenAI(rawProduct, sessionId) {
    try {
        const response = await openai.chat.completions.create({
            model: config_1.default.openai?.model || 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: getSystemPrompt() },
                { role: 'user', content: buildAnalysisPrompt(rawProduct) }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        });
        const content = response.choices[0]?.message?.content;
        if (!content)
            throw new Error('Empty response from OpenAI');
        return parseAIResponse(JSON.parse(content), 'openai');
    }
    catch (error) {
        logger_1.default.error('OpenAI analysis failed', { sessionId, error });
        return createErrorResult('openai', error);
    }
}
async function analyzeWithXAI(rawProduct, sessionId) {
    try {
        const response = await xai.chat.completions.create({
            model: config_1.default.xai?.model || 'grok-beta',
            messages: [
                { role: 'system', content: getSystemPrompt() },
                { role: 'user', content: buildAnalysisPrompt(rawProduct) }
            ],
            temperature: 0.1
        });
        const content = response.choices[0]?.message?.content;
        if (!content)
            throw new Error('Empty response from xAI');
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch)
            throw new Error('No JSON found in xAI response');
        return parseAIResponse(JSON.parse(jsonMatch[0]), 'xai');
    }
    catch (error) {
        logger_1.default.error('xAI analysis failed', { sessionId, error });
        return createErrorResult('xai', error);
    }
}
function createErrorResult(provider, error) {
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
function getSystemPrompt() {
    const primaryAttrs = (0, master_category_attributes_1.getPrimaryAttributesForPrompt)();
    const categoryTop15 = (0, master_category_attributes_1.getAllCategoriesWithTop15ForPrompt)();
    const categoryList = (0, master_category_attributes_1.getCategoryListForPrompt)();
    return `You are an expert product data analyst specializing in appliances and home products.

Your task is to:
1. ANALYZE the raw product data provided
2. DETERMINE which category from our master list the product belongs to
3. MAP the raw data to the correct attributes for that category
4. VERIFY and CLEAN the data (fix obvious errors, standardize formats)
5. IDENTIFY any missing required fields

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
    "depth_length": "value in inches",
    "width": "value in inches",
    "height": "value in inches",
    "weight": "value in lbs",
    "msrp": "value",
    "market_value": "value",
    "description": "full description",
    "product_title": "standardized title",
    "details": "additional details",
    "features_list": "HTML formatted list",
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
- For TOP 15 attributes, use only the attributes defined for the determined category`;
}
function buildAnalysisPrompt(rawProduct) {
    return `Analyze this product and map it to our category system:

RAW PRODUCT DATA:
${JSON.stringify(rawProduct, null, 2)}

Tasks:
1. Determine the product category from our master list
2. Map all available data to the correct attribute fields for that category
3. Clean and standardize the values
4. List any missing required fields
5. Note any corrections you made

Return your analysis as JSON.`;
}
function parseAIResponse(parsed, provider) {
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
        corrections: (parsed.corrections || []).map((c) => ({
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
function buildConsensus(openaiResult, xaiResult) {
    const disagreements = [];
    const needsResearch = [];
    const categoriesMatch = openaiResult.determinedCategory.toLowerCase() === xaiResult.determinedCategory.toLowerCase();
    const agreedCategory = categoriesMatch
        ? openaiResult.determinedCategory
        : (openaiResult.categoryConfidence >= xaiResult.categoryConfidence ? openaiResult.determinedCategory : xaiResult.determinedCategory);
    void (0, master_category_attributes_1.getCategorySchema)(agreedCategory);
    const agreedPrimary = buildAgreedAttributes(openaiResult.primaryAttributes, xaiResult.primaryAttributes, disagreements);
    const agreedTop15 = buildAgreedAttributes(openaiResult.top15Attributes, xaiResult.top15Attributes, disagreements);
    const agreedAdditional = buildAgreedAttributes(openaiResult.additionalAttributes, xaiResult.additionalAttributes, disagreements);
    const allMissing = new Set([...openaiResult.missingFields, ...xaiResult.missingFields]);
    for (const field of allMissing) {
        if (openaiResult.missingFields.includes(field) && xaiResult.missingFields.includes(field)) {
            needsResearch.push(field);
        }
    }
    const agreementRatio = 1 - (disagreements.filter(d => d.resolution === 'unresolved').length /
        Math.max(1, Object.keys(agreedPrimary).length + Object.keys(agreedTop15).length));
    const overallConfidence = ((openaiResult.confidence + xaiResult.confidence) / 2 * 0.6 + agreementRatio * 0.4);
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
function buildAgreedAttributes(openaiAttrs, xaiAttrs, disagreements) {
    const agreed = {};
    const allKeys = new Set([...Object.keys(openaiAttrs), ...Object.keys(xaiAttrs)]);
    for (const key of allKeys) {
        const openaiVal = openaiAttrs[key];
        const xaiVal = xaiAttrs[key];
        if (valuesMatch(openaiVal, xaiVal)) {
            agreed[key] = openaiVal ?? xaiVal;
        }
        else if (openaiVal && !xaiVal) {
            agreed[key] = openaiVal;
        }
        else if (!openaiVal && xaiVal) {
            agreed[key] = xaiVal;
        }
        else {
            disagreements.push({ field: key, openaiValue: openaiVal, xaiValue: xaiVal, resolution: 'unresolved' });
        }
    }
    return agreed;
}
function valuesMatch(a, b) {
    if (a === b)
        return true;
    if (a == null && b == null)
        return true;
    if (a == null || b == null)
        return false;
    const strA = String(a).toLowerCase().trim();
    const strB = String(b).toLowerCase().trim();
    if (strA === strB)
        return true;
    const numA = parseFloat(strA);
    const numB = parseFloat(strB);
    if (!isNaN(numA) && !isNaN(numB)) {
        return Math.abs(numA - numB) < 0.01;
    }
    return false;
}
async function reanalyzeWithContext(rawProduct, provider, otherResult, sessionId) {
    const client = provider === 'openai' ? openai : xai;
    const model = provider === 'openai' ? (config_1.default.openai?.model || 'gpt-4-turbo-preview') : (config_1.default.xai?.model || 'grok-beta');
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
        if (!content)
            throw new Error('Empty response');
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch)
            throw new Error('No JSON in response');
        return parseAIResponse(JSON.parse(jsonMatch[0]), provider);
    }
    catch (error) {
        logger_1.default.error(`${provider} reanalysis failed`, { sessionId, error: error instanceof Error ? error.message : 'Unknown' });
        return provider === 'openai' ? await analyzeWithOpenAI(rawProduct, sessionId) : await analyzeWithXAI(rawProduct, sessionId);
    }
}
async function researchMissingData(rawProduct, missingFields, provider, category, sessionId) {
    const client = provider === 'openai' ? openai : xai;
    const model = provider === 'openai' ? (config_1.default.openai?.model || 'gpt-4-turbo-preview') : (config_1.default.xai?.model || 'grok-beta');
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
        if (!content)
            return {};
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch)
            return {};
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.researched_values || {};
    }
    catch (error) {
        logger_1.default.error(`${provider} research failed`, { sessionId, error: error instanceof Error ? error.message : 'Unknown' });
        return {};
    }
}
function mergeResearchResults(consensus, openaiResearch, xaiResearch) {
    const mergedAdditional = { ...consensus.agreedAdditionalAttributes };
    for (const field of consensus.needsResearch) {
        const openaiVal = openaiResearch[field];
        const xaiVal = xaiResearch[field];
        if (valuesMatch(openaiVal, xaiVal) && openaiVal !== 'unknown') {
            mergedAdditional[field] = openaiVal;
        }
        else if (openaiVal && openaiVal !== 'unknown' && (!xaiVal || xaiVal === 'unknown')) {
            mergedAdditional[field] = openaiVal;
        }
        else if (xaiVal && xaiVal !== 'unknown' && (!openaiVal || openaiVal === 'unknown')) {
            mergedAdditional[field] = xaiVal;
        }
    }
    return { ...consensus, agreedAdditionalAttributes: mergedAdditional, needsResearch: [] };
}
function buildFinalResponse(rawProduct, consensus, sessionId, _processingTimeMs, openaiResult, xaiResult) {
    // Get raw values for customer-facing text
    const rawBrand = consensus.agreedPrimaryAttributes.brand || rawProduct.Brand_Web_Retailer || rawProduct.Ferguson_Brand || '';
    const rawTitle = consensus.agreedPrimaryAttributes.product_title || rawProduct.Product_Title_Web_Retailer || '';
    const rawDescription = consensus.agreedPrimaryAttributes.description || rawProduct.Product_Description_Web_Retailer || rawProduct.Ferguson_Description || '';
    const rawFeatures = consensus.agreedPrimaryAttributes.features_list || rawProduct.Features_Web_Retailer || '';
    logger_1.default.info('Text cleaner input', { rawBrand, rawTitle: rawTitle?.substring(0, 50) });
    // Clean and enhance customer-facing text
    const cleanedText = (0, text_cleaner_1.cleanCustomerFacingText)(rawTitle, rawDescription, rawFeatures, rawBrand, consensus.agreedCategory || undefined);
    logger_1.default.info('Text cleaner output', { cleanedBrand: cleanedText.brand, cleanedTitle: cleanedText.title?.substring(0, 50) });
    // Track any text cleaning corrections
    const textCorrections = [];
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
    const primaryAttributes = {
        Brand_Verified: cleanedText.brand,
        Category_Verified: (0, text_cleaner_1.cleanEncodingIssues)(consensus.agreedCategory || ''),
        SubCategory_Verified: (0, text_cleaner_1.cleanEncodingIssues)(consensus.agreedPrimaryAttributes.subcategory || ''),
        Product_Family_Verified: (0, text_cleaner_1.cleanEncodingIssues)(consensus.agreedPrimaryAttributes.product_family || ''),
        Product_Style_Verified: (0, text_cleaner_1.cleanEncodingIssues)(consensus.agreedPrimaryAttributes.product_style || ''),
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
        Details_Verified: (0, text_cleaner_1.cleanEncodingIssues)(consensus.agreedPrimaryAttributes.details || ''),
        Features_List_HTML: cleanedText.featuresHtml,
        UPC_GTIN_Verified: consensus.agreedPrimaryAttributes.upc_gtin || '',
        Model_Number_Verified: consensus.agreedPrimaryAttributes.model_number || rawProduct.Model_Number_Web_Retailer,
        Model_Number_Alias: consensus.agreedPrimaryAttributes.model_number_alias || '',
        Model_Parent: consensus.agreedPrimaryAttributes.model_parent || '',
        Model_Variant_Number: consensus.agreedPrimaryAttributes.model_variant_number || '',
        Total_Model_Variants: (0, text_cleaner_1.cleanEncodingIssues)(consensus.agreedPrimaryAttributes.total_model_variants || '')
    };
    // Clean top filter attributes
    const topFilterAttributes = {};
    for (const [key, value] of Object.entries(consensus.agreedTop15Attributes)) {
        topFilterAttributes[key] = typeof value === 'string' ? (0, text_cleaner_1.cleanEncodingIssues)(value) : value;
    }
    const additionalHtml = (0, html_generator_1.generateAttributeTable)(consensus.agreedAdditionalAttributes);
    const priceAnalysis = buildPriceAnalysis(rawProduct);
    const status = determineStatus(consensus, openaiResult, xaiResult);
    const corrections = [...openaiResult.corrections, ...xaiResult.corrections, ...textCorrections];
    const verification = {
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
        }
    };
    return {
        SF_Catalog_Id: rawProduct.SF_Catalog_Id,
        SF_Catalog_Name: rawProduct.SF_Catalog_Name,
        Primary_Attributes: primaryAttributes,
        Top_Filter_Attributes: topFilterAttributes,
        Additional_Attributes_HTML: additionalHtml,
        Price_Analysis: priceAnalysis,
        Verification: verification,
        Status: status === 'verified' ? 'success' : status === 'needs_review' ? 'partial' : 'failed'
    };
}
function buildPriceAnalysis(rawProduct) {
    const parsePrice = (val) => {
        if (!val)
            return 0;
        return parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
    };
    const msrp = parsePrice(rawProduct.MSRP_Web_Retailer);
    const fergusonPrice = parsePrice(rawProduct.Ferguson_Price);
    const minPrice = parsePrice(rawProduct.Ferguson_Min_Price);
    const maxPrice = parsePrice(rawProduct.Ferguson_Max_Price);
    const marketValue = fergusonPrice || ((minPrice + maxPrice) / 2) || 0;
    const priceDiff = msrp - marketValue;
    const priceDiffPercent = marketValue > 0 ? (priceDiff / marketValue) * 100 : 0;
    let pricePosition = 'at_market';
    if (priceDiffPercent > 5)
        pricePosition = 'above_market';
    else if (priceDiffPercent < -5)
        pricePosition = 'below_market';
    return {
        msrp_web_retailer: msrp,
        market_value_ferguson: fergusonPrice,
        market_value_min: minPrice,
        market_value_max: maxPrice,
        price_difference: Math.round(priceDiff * 100) / 100,
        price_difference_percent: Math.round(priceDiffPercent * 100) / 100,
        price_position: pricePosition
    };
}
function determineStatus(consensus, openaiResult, xaiResult) {
    if (!openaiResult.success && !xaiResult.success)
        return 'failed';
    if (consensus.agreed && consensus.overallConfidence >= 0.8)
        return 'verified';
    if (consensus.overallConfidence >= 0.6)
        return 'needs_review';
    return 'failed';
}
function buildErrorResponse(rawProduct, sessionId, error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
exports.default = { verifyProductWithDualAI };
exports.dualAIVerificationService = { verifyProductWithDualAI };
//# sourceMappingURL=dual-ai-verification.service.js.map