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
exports.AuditLog = void 0;
const mongoose_1 = __importStar(require("mongoose"));
/**
 * Audit Log Schema
 */
const AuditLogSchema = new mongoose_1.Schema({
    sessionId: {
        type: String,
        required: true,
        index: true,
    },
    productId: {
        type: String,
        index: true,
    },
    action: {
        type: String,
        required: true,
        enum: [
            'session_created',
            'session_started',
            'session_completed',
            'session_failed',
            'product_cleaned',
            'ai_validation_openai',
            'ai_validation_xai',
            'consensus_reached',
            'consensus_retry',
            'consensus_failed',
            'product_verified',
            'product_flagged',
            'salesforce_export',
            'error',
        ],
        index: true,
    },
    details: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    metadata: {
        userId: String,
        ipAddress: String,
        userAgent: String,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: false,
    collection: 'audit_logs',
});
// Compound indexes for efficient querying
AuditLogSchema.index({ sessionId: 1, action: 1 });
AuditLogSchema.index({ sessionId: 1, timestamp: -1 });
AuditLogSchema.index({ productId: 1, timestamp: -1 });
// TTL index to automatically delete old logs (90 days)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
/**
 * Audit Log Model
 */
exports.AuditLog = mongoose_1.default.model('AuditLog', AuditLogSchema);
exports.default = exports.AuditLog;
//# sourceMappingURL=audit-log.model.js.map