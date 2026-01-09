"use strict";
/**
 * API Tracking Service
 * Handles recording and updating API call tracking data
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTracking = startTracking;
exports.recordOpenAIResult = recordOpenAIResult;
exports.recordXAIResult = recordXAIResult;
exports.recordConsensusResult = recordConsensusResult;
exports.addIssue = addIssue;
exports.addTag = addTag;
exports.completeTracking = completeTracking;
exports.completeTrackingWithError = completeTrackingWithError;
exports.getTracking = getTracking;
exports.getTrackingBySession = getTrackingBySession;
exports.getTrackingByCatalogId = getTrackingByCatalogId;
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
const api_tracker_model_1 = require("../models/api-tracker.model");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * In-memory tracking context for in-flight requests
 */
const inFlightRequests = new Map();
/**
 * Start tracking a new API call
 */
async function startTracking(sessionId, endpoint, method, ipAddress, userAgent, apiKey, rawProduct, rawPayload) {
    const trackingId = (0, uuid_1.v4)();
    // Count fields in the raw product data
    let webRetailerFieldCount = 0;
    let fergusonFieldCount = 0;
    let webRetailerSpecCount = 0;
    let fergusonAttributeCount = 0;
    if (rawProduct) {
        // Count Web Retailer fields (non-empty)
        const webRetailerFields = [
            'Brand_Web_Retailer', 'Model_Number_Web_Retailer', 'MSRP_Web_Retailer',
            'Color_Finish_Web_Retailer', 'Product_Title_Web_Retailer', 'Depth_Web_Retailer',
            'Width_Web_Retailer', 'Height_Web_Retailer', 'Capacity_Web_Retailer',
            'Weight_Web_Retailer', 'Features_Web_Retailer', 'Product_Description_Web_Retailer',
            'Web_Retailer_Category', 'Web_Retailer_SubCategory', 'Specification_Table'
        ];
        webRetailerFieldCount = webRetailerFields.filter(f => rawProduct[f] &&
            String(rawProduct[f]).trim() !== '').length;
        // Count Ferguson fields (non-empty)
        const fergusonFields = [
            'Ferguson_Title', 'Ferguson_URL', 'Ferguson_Finish', 'Ferguson_Color',
            'Ferguson_Brand', 'Ferguson_Model_Number', 'Ferguson_Price', 'Ferguson_Base_Type',
            'Ferguson_Product_Type', 'Ferguson_Base_Category', 'Ferguson_Business_Category',
            'Ferguson_Width', 'Ferguson_Height', 'Ferguson_Depth', 'Ferguson_Categories',
            'Ferguson_Description', 'Ferguson_Collection', 'Ferguson_Certifications'
        ];
        fergusonFieldCount = fergusonFields.filter(f => rawProduct[f] &&
            String(rawProduct[f]).trim() !== '').length;
        webRetailerSpecCount = rawProduct.Web_Retailer_Specs?.length || 0;
        fergusonAttributeCount = rawProduct.Ferguson_Attributes?.length || 0;
    }
    const trackingData = {
        trackingId,
        sessionId,
        requestTimestamp: new Date(),
        request: {
            endpoint,
            method,
            ipAddress,
            userAgent,
            apiKeyHash: apiKey ? hashApiKey(apiKey) : undefined,
            SF_Catalog_Id: rawProduct?.SF_Catalog_Id || 'unknown',
            SF_Catalog_Name: rawProduct?.SF_Catalog_Name,
            Brand_Web_Retailer: rawProduct?.Brand_Web_Retailer,
            Model_Number_Web_Retailer: rawProduct?.Model_Number_Web_Retailer,
            Web_Retailer_Category: rawProduct?.Web_Retailer_Category,
            Web_Retailer_SubCategory: rawProduct?.Web_Retailer_SubCategory,
            payloadSizeBytes: rawPayload ? JSON.stringify(rawPayload).length : 0,
            webRetailerFieldCount,
            fergusonFieldCount,
            webRetailerSpecCount,
            fergusonAttributeCount,
            rawPayload: process.env.TRACK_RAW_PAYLOADS === 'true' ? rawPayload : undefined,
        },
        issues: [],
        tags: [],
    };
    // Store in memory for updates
    inFlightRequests.set(trackingId, trackingData);
    logger_1.default.debug('Started API tracking', { trackingId, sessionId, catalogId: rawProduct?.SF_Catalog_Id });
    return trackingId;
}
/**
 * Record OpenAI processing result
 */
function recordOpenAIResult(trackingId, result) {
    const tracking = inFlightRequests.get(trackingId);
    if (!tracking) {
        logger_1.default.warn('Tracking not found for OpenAI result', { trackingId });
        return;
    }
    tracking.openaiResult = {
        provider: 'openai',
        success: result.success,
        determinedCategory: result.determinedCategory || 'unknown',
        categoryConfidence: result.categoryConfidence || 0,
        processingTimeMs: result.processingTimeMs,
        tokensUsed: result.tokensUsed,
        fieldsPopulated: result.fieldsPopulated || 0,
        fieldsMissing: result.fieldsMissing || 0,
        correctionsApplied: result.correctionsApplied || 0,
        researchPerformed: result.researchPerformed || false,
        overallConfidence: result.overallConfidence || 0,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
    };
    // Add issue if AI failed
    if (!result.success) {
        addIssue(trackingId, {
            type: 'ai_error',
            severity: 'high',
            description: `OpenAI processing failed: ${result.errorMessage || 'Unknown error'}`,
            suggestedAction: 'Review AI configuration and retry',
        });
    }
    logger_1.default.debug('Recorded OpenAI result', { trackingId, success: result.success });
}
/**
 * Record xAI processing result
 */
function recordXAIResult(trackingId, result) {
    const tracking = inFlightRequests.get(trackingId);
    if (!tracking) {
        logger_1.default.warn('Tracking not found for xAI result', { trackingId });
        return;
    }
    tracking.xaiResult = {
        provider: 'xai',
        success: result.success,
        determinedCategory: result.determinedCategory || 'unknown',
        categoryConfidence: result.categoryConfidence || 0,
        processingTimeMs: result.processingTimeMs,
        tokensUsed: result.tokensUsed,
        fieldsPopulated: result.fieldsPopulated || 0,
        fieldsMissing: result.fieldsMissing || 0,
        correctionsApplied: result.correctionsApplied || 0,
        researchPerformed: result.researchPerformed || false,
        overallConfidence: result.overallConfidence || 0,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
    };
    // Add issue if AI failed
    if (!result.success) {
        addIssue(trackingId, {
            type: 'ai_error',
            severity: 'high',
            description: `xAI processing failed: ${result.errorMessage || 'Unknown error'}`,
            suggestedAction: 'Review AI configuration and retry',
        });
    }
    logger_1.default.debug('Recorded xAI result', { trackingId, success: result.success });
}
/**
 * Record consensus result
 */
function recordConsensusResult(trackingId, result) {
    const tracking = inFlightRequests.get(trackingId);
    if (!tracking) {
        logger_1.default.warn('Tracking not found for consensus result', { trackingId });
        return;
    }
    tracking.consensus = {
        agreed: result.agreed,
        consensusScore: result.consensusScore,
        categoryAgreed: result.categoryAgreed ?? true,
        finalCategory: result.finalCategory || 'unknown',
        fieldsAgreed: result.fieldsAgreed || 0,
        fieldsDisagreed: result.fieldsDisagreed || 0,
        fieldsResolved: result.fieldsResolved || 0,
        fieldsUnresolved: result.fieldsUnresolved || 0,
        retryCount: result.retryCount || 0,
        crossValidationPerformed: result.crossValidationPerformed || false,
        researchPhaseTriggered: result.researchPhaseTriggered || false,
        disagreementFields: result.disagreementFields || [],
        unresolvedFields: result.unresolvedFields || [],
    };
    // Add issues for consensus problems
    if (!result.agreed) {
        addIssue(trackingId, {
            type: 'consensus_failure',
            severity: 'medium',
            description: `AIs did not reach consensus. Score: ${result.consensusScore}`,
            suggestedAction: 'Review disagreement fields for potential data quality issues',
        });
    }
    if (!result.categoryAgreed) {
        addIssue(trackingId, {
            type: 'category_mismatch',
            severity: 'high',
            description: 'AIs disagreed on product category',
            suggestedAction: 'Review product data for clearer category indicators',
        });
    }
    if (result.consensusScore < 0.7) {
        addIssue(trackingId, {
            type: 'low_confidence',
            severity: result.consensusScore < 0.5 ? 'high' : 'medium',
            description: `Low consensus score: ${result.consensusScore}`,
            suggestedAction: 'Consider manual review of verification results',
        });
    }
    logger_1.default.debug('Recorded consensus result', { trackingId, agreed: result.agreed, score: result.consensusScore });
}
/**
 * Add an issue flag
 */
function addIssue(trackingId, issue) {
    const tracking = inFlightRequests.get(trackingId);
    if (!tracking) {
        logger_1.default.warn('Tracking not found for issue', { trackingId });
        return;
    }
    if (!tracking.issues) {
        tracking.issues = [];
    }
    tracking.issues.push(issue);
    logger_1.default.debug('Added issue to tracking', { trackingId, issueType: issue.type });
}
/**
 * Add a tag for filtering
 */
function addTag(trackingId, tag) {
    const tracking = inFlightRequests.get(trackingId);
    if (!tracking)
        return;
    if (!tracking.tags) {
        tracking.tags = [];
    }
    if (!tracking.tags.includes(tag)) {
        tracking.tags.push(tag);
    }
}
/**
 * Complete tracking and save to database
 */
async function completeTracking(trackingId, response, statusCode = 200) {
    const tracking = inFlightRequests.get(trackingId);
    if (!tracking) {
        logger_1.default.warn('Tracking not found for completion', { trackingId });
        return;
    }
    const responseTimestamp = new Date();
    const totalProcessingTimeMs = responseTimestamp.getTime() - (tracking.requestTimestamp?.getTime() || 0);
    // Count verified fields in response
    let verifiedFieldCount = 0;
    let primaryAttributesPopulated = 0;
    let topFilterAttributesPopulated = 0;
    if (response.Primary_Attributes) {
        primaryAttributesPopulated = Object.values(response.Primary_Attributes)
            .filter(v => v !== null && v !== undefined && v !== '').length;
        verifiedFieldCount += primaryAttributesPopulated;
    }
    if (response.Top_Filter_Attributes) {
        topFilterAttributesPopulated = Object.values(response.Top_Filter_Attributes)
            .filter(v => v !== null && v !== undefined && v !== '').length;
        verifiedFieldCount += topFilterAttributesPopulated;
    }
    // Determine overall status based on response Status field
    let overallStatus = 'failed';
    if (response.Status === 'success') {
        overallStatus = 'success';
    }
    else if (response.Status === 'partial') {
        overallStatus = 'partial';
    }
    // Calculate verification score
    const verificationScore = response.Verification?.verification_score ||
        (tracking.consensus?.consensusScore || 0) * 100;
    // Build response tracking data
    tracking.responseTimestamp = responseTimestamp;
    tracking.totalProcessingTimeMs = totalProcessingTimeMs;
    tracking.overallStatus = overallStatus;
    tracking.verificationScore = verificationScore;
    tracking.response = {
        success: response.Status === 'success' || response.Status === 'partial',
        statusCode,
        verifiedFieldCount,
        primaryAttributesPopulated,
        topFilterAttributesPopulated,
        additionalAttributesIncluded: !!response.Additional_Attributes_HTML,
        htmlTableGenerated: !!response.Additional_Attributes_HTML,
        Brand_Verified: response.Primary_Attributes?.Brand_Verified,
        Category_Verified: response.Primary_Attributes?.Category_Verified,
        SubCategory_Verified: response.Primary_Attributes?.SubCategory_Verified,
        Product_Title_Verified: response.Primary_Attributes?.Product_Title_Verified,
        responseSizeBytes: JSON.stringify(response).length,
        responsePayload: process.env.TRACK_RAW_PAYLOADS === 'true' ? response : undefined,
    };
    // Add tags based on results
    if (overallStatus === 'failed')
        addTag(trackingId, 'failed');
    if (verificationScore < 50)
        addTag(trackingId, 'low-score');
    if (tracking.consensus?.retryCount && tracking.consensus.retryCount > 0)
        addTag(trackingId, 'retried');
    if (tracking.consensus?.researchPhaseTriggered)
        addTag(trackingId, 'researched');
    if (tracking.issues && tracking.issues.length > 0)
        addTag(trackingId, 'has-issues');
    try {
        // Save to database
        await api_tracker_model_1.APITracker.create(tracking);
        logger_1.default.info('API tracking saved', {
            trackingId,
            sessionId: tracking.sessionId,
            status: overallStatus,
            score: verificationScore,
            processingTime: totalProcessingTimeMs
        });
    }
    catch (error) {
        logger_1.default.error('Failed to save API tracking', { trackingId, error });
    }
    finally {
        // Clean up memory
        inFlightRequests.delete(trackingId);
    }
}
/**
 * Complete tracking with error
 */
async function completeTrackingWithError(trackingId, error, statusCode = 500) {
    const tracking = inFlightRequests.get(trackingId);
    if (!tracking) {
        logger_1.default.warn('Tracking not found for error completion', { trackingId });
        return;
    }
    const responseTimestamp = new Date();
    const totalProcessingTimeMs = responseTimestamp.getTime() - (tracking.requestTimestamp?.getTime() || 0);
    tracking.responseTimestamp = responseTimestamp;
    tracking.totalProcessingTimeMs = totalProcessingTimeMs;
    tracking.overallStatus = 'failed';
    tracking.verificationScore = 0;
    tracking.response = {
        success: false,
        statusCode,
        verifiedFieldCount: 0,
        primaryAttributesPopulated: 0,
        topFilterAttributesPopulated: 0,
        additionalAttributesIncluded: false,
        htmlTableGenerated: false,
        responseSizeBytes: 0,
    };
    // Add error issue
    addIssue(trackingId, {
        type: 'validation_error',
        severity: 'critical',
        description: typeof error === 'string' ? error : error.message,
        suggestedAction: 'Review error logs and fix underlying issue',
    });
    addTag(trackingId, 'error');
    addTag(trackingId, 'failed');
    try {
        await api_tracker_model_1.APITracker.create(tracking);
        logger_1.default.info('API tracking saved (with error)', { trackingId, error: typeof error === 'string' ? error : error.message });
    }
    catch (saveError) {
        logger_1.default.error('Failed to save API tracking', { trackingId, error: saveError });
    }
    finally {
        inFlightRequests.delete(trackingId);
    }
}
/**
 * Hash API key for storage (security)
 */
function hashApiKey(apiKey) {
    return crypto_1.default.createHash('sha256').update(apiKey).digest('hex').substring(0, 16);
}
/**
 * Get tracking by ID
 */
async function getTracking(trackingId) {
    return api_tracker_model_1.APITracker.findOne({ trackingId }).lean();
}
/**
 * Get tracking by session ID
 */
async function getTrackingBySession(sessionId) {
    return api_tracker_model_1.APITracker.find({ sessionId }).sort({ requestTimestamp: -1 }).lean();
}
/**
 * Get tracking by catalog ID
 */
async function getTrackingByCatalogId(catalogId) {
    return api_tracker_model_1.APITracker.find({ 'request.SF_Catalog_Id': catalogId }).sort({ requestTimestamp: -1 }).lean();
}
exports.default = {
    startTracking,
    recordOpenAIResult,
    recordXAIResult,
    recordConsensusResult,
    addIssue,
    addTag,
    completeTracking,
    completeTrackingWithError,
    getTracking,
    getTrackingBySession,
    getTrackingByCatalogId,
};
//# sourceMappingURL=tracking.service.js.map