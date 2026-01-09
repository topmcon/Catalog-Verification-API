"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.APITracker = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Schemas
 */
const IncomingRequestDataSchema = new mongoose_1.Schema({
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    apiKeyHash: { type: String },
    SF_Catalog_Id: { type: String, required: true },
    SF_Catalog_Name: { type: String },
    Brand_Web_Retailer: { type: String },
    Model_Number_Web_Retailer: { type: String },
    Web_Retailer_Category: { type: String },
    Web_Retailer_SubCategory: { type: String },
    payloadSizeBytes: { type: Number, default: 0 },
    webRetailerFieldCount: { type: Number, default: 0 },
    fergusonFieldCount: { type: Number, default: 0 },
    webRetailerSpecCount: { type: Number, default: 0 },
    fergusonAttributeCount: { type: Number, default: 0 },
    rawPayload: { type: mongoose_1.Schema.Types.Mixed },
}, { _id: false });
const AIProcessingResultSchema = new mongoose_1.Schema({
    provider: { type: String, enum: ['openai', 'xai'], required: true },
    success: { type: Boolean, required: true },
    determinedCategory: { type: String },
    categoryConfidence: { type: Number },
    processingTimeMs: { type: Number },
    tokensUsed: { type: Number },
    fieldsPopulated: { type: Number, default: 0 },
    fieldsMissing: { type: Number, default: 0 },
    correctionsApplied: { type: Number, default: 0 },
    researchPerformed: { type: Boolean, default: false },
    overallConfidence: { type: Number },
    errorCode: { type: String },
    errorMessage: { type: String },
}, { _id: false });
const ConsensusDataSchema = new mongoose_1.Schema({
    agreed: { type: Boolean, required: true },
    consensusScore: { type: Number, required: true },
    categoryAgreed: { type: Boolean },
    finalCategory: { type: String },
    fieldsAgreed: { type: Number, default: 0 },
    fieldsDisagreed: { type: Number, default: 0 },
    fieldsResolved: { type: Number, default: 0 },
    fieldsUnresolved: { type: Number, default: 0 },
    retryCount: { type: Number, default: 0 },
    crossValidationPerformed: { type: Boolean, default: false },
    researchPhaseTriggered: { type: Boolean, default: false },
    disagreementFields: [{ type: String }],
    unresolvedFields: [{ type: String }],
}, { _id: false });
const OutgoingResponseDataSchema = new mongoose_1.Schema({
    success: { type: Boolean, required: true },
    statusCode: { type: Number, required: true },
    verifiedFieldCount: { type: Number, default: 0 },
    primaryAttributesPopulated: { type: Number, default: 0 },
    topFilterAttributesPopulated: { type: Number, default: 0 },
    additionalAttributesIncluded: { type: Boolean, default: false },
    htmlTableGenerated: { type: Boolean, default: false },
    Brand_Verified: { type: String },
    Category_Verified: { type: String },
    SubCategory_Verified: { type: String },
    Product_Title_Verified: { type: String },
    responseSizeBytes: { type: Number, default: 0 },
    responsePayload: { type: mongoose_1.Schema.Types.Mixed },
}, { _id: false });
const IssueFlagSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['missing_data', 'category_mismatch', 'low_confidence', 'ai_error', 'consensus_failure', 'validation_error', 'timeout', 'research_failed'],
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
    },
    field: { type: String },
    description: { type: String, required: true },
    suggestedAction: { type: String },
}, { _id: false });
/**
 * Main API Tracker Schema
 */
const APITrackerSchema = new mongoose_1.Schema({
    trackingId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    sessionId: {
        type: String,
        required: true,
        index: true,
    },
    requestTimestamp: { type: Date, required: true, index: true },
    responseTimestamp: { type: Date },
    request: { type: IncomingRequestDataSchema, required: true },
    openaiResult: AIProcessingResultSchema,
    xaiResult: AIProcessingResultSchema,
    consensus: ConsensusDataSchema,
    response: { type: OutgoingResponseDataSchema, required: true },
    totalProcessingTimeMs: { type: Number, required: true },
    overallStatus: {
        type: String,
        enum: ['success', 'partial', 'failed'],
        required: true,
        index: true,
    },
    verificationScore: { type: Number, default: 0 },
    issues: [IssueFlagSchema],
    tags: [{ type: String, index: true }],
}, {
    timestamps: true,
    collection: 'api_tracker',
});
// Compound indexes for common queries
APITrackerSchema.index({ requestTimestamp: -1, overallStatus: 1 });
APITrackerSchema.index({ 'request.SF_Catalog_Id': 1 });
APITrackerSchema.index({ 'request.Web_Retailer_Category': 1 });
APITrackerSchema.index({ 'request.Brand_Web_Retailer': 1 });
APITrackerSchema.index({ 'consensus.finalCategory': 1 });
APITrackerSchema.index({ 'issues.type': 1 });
APITrackerSchema.index({ 'issues.severity': 1 });
APITrackerSchema.index({ verificationScore: 1 });
APITrackerSchema.index({ totalProcessingTimeMs: 1 });
// TTL index for automatic cleanup (optional - set to 90 days)
// APITrackerSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
exports.APITracker = mongoose_1.default.model('APITracker', APITrackerSchema);
//# sourceMappingURL=api-tracker.model.js.map