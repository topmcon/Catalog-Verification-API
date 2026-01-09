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
exports.VerificationSession = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * AI Validation Result Schema
 */
const AIValidationResultSchema = new mongoose_1.Schema({
    provider: { type: String, enum: ['openai', 'xai'], required: true },
    productId: { type: String, required: true },
    isValid: { type: Boolean, required: true },
    confidence: { type: Number, required: true },
    verifiedFields: { type: mongoose_1.Schema.Types.Mixed },
    corrections: [{
            field: String,
            originalValue: mongoose_1.Schema.Types.Mixed,
            correctedValue: mongoose_1.Schema.Types.Mixed,
            reason: String,
            suggestedBy: String,
        }],
    suggestions: [String],
    rawResponse: String,
    processingTimeMs: Number,
    error: String,
}, { _id: false });
/**
 * Consensus Discrepancy Schema
 */
const ConsensusDiscrepancySchema = new mongoose_1.Schema({
    field: { type: String, required: true },
    openaiValue: { type: mongoose_1.Schema.Types.Mixed },
    xaiValue: { type: mongoose_1.Schema.Types.Mixed },
    resolved: { type: Boolean, default: false },
    resolution: { type: mongoose_1.Schema.Types.Mixed },
    resolutionSource: { type: String, enum: ['openai', 'xai', 'manual'] },
}, { _id: false });
/**
 * Consensus Result Schema
 */
const ConsensusResultSchema = new mongoose_1.Schema({
    agreed: { type: Boolean, required: true },
    agreementScore: { type: Number, required: true },
    mergedResult: { type: mongoose_1.Schema.Types.Mixed },
    corrections: [{
            field: String,
            originalValue: mongoose_1.Schema.Types.Mixed,
            correctedValue: mongoose_1.Schema.Types.Mixed,
            reason: String,
            suggestedBy: String,
        }],
    discrepancies: [ConsensusDiscrepancySchema],
    retryCount: { type: Number, default: 0 },
    finalizedAt: { type: Date },
}, { _id: false });
/**
 * Session AI Results Schema
 */
const SessionAIResultSchema = new mongoose_1.Schema({
    productId: { type: String, required: true },
    openaiResult: AIValidationResultSchema,
    xaiResult: AIValidationResultSchema,
    consensusResult: ConsensusResultSchema,
}, { _id: false });
/**
 * Verification Session Schema
 */
const VerificationSessionSchema = new mongoose_1.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'partial'],
        default: 'pending',
        index: true,
    },
    totalProducts: {
        type: Number,
        required: true,
        default: 0,
    },
    verifiedCount: {
        type: Number,
        default: 0,
    },
    failedCount: {
        type: Number,
        default: 0,
    },
    flaggedCount: {
        type: Number,
        default: 0,
    },
    sourceMetadata: {
        batchId: String,
        source: String,
        timestamp: Date,
    },
    aiResults: [SessionAIResultSchema],
    processingTimeMs: {
        type: Number,
        default: 0,
    },
    startedAt: {
        type: Date,
    },
    completedAt: {
        type: Date,
    },
    exportedToSalesforce: {
        type: Boolean,
        default: false,
    },
    exportedAt: {
        type: Date,
    },
}, {
    timestamps: true,
    collection: 'verification_sessions',
});
// Indexes
VerificationSessionSchema.index({ status: 1, createdAt: -1 });
VerificationSessionSchema.index({ 'sourceMetadata.batchId': 1 });
/**
 * Verification Session Model
 */
exports.VerificationSession = mongoose_1.default.model('VerificationSession', VerificationSessionSchema);
exports.default = exports.VerificationSession;
//# sourceMappingURL=session.model.js.map