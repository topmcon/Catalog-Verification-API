import mongoose, { Schema, Document } from 'mongoose';
import { ConsensusResult, AIValidationResult } from '../types/ai.types';

/**
 * Verification Session Document Interface
 */
export interface IVerificationSession extends Document {
  sessionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  totalProducts: number;
  verifiedCount: number;
  failedCount: number;
  flaggedCount: number;
  sourceMetadata?: {
    batchId?: string;
    source?: string;
    timestamp?: Date;
  };
  aiResults: {
    productId: string;
    openaiResult?: AIValidationResult;
    xaiResult?: AIValidationResult;
    consensusResult?: ConsensusResult;
  }[];
  processingTimeMs: number;
  startedAt: Date;
  completedAt?: Date;
  exportedToSalesforce: boolean;
  exportedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AI Validation Result Schema
 */
const AIValidationResultSchema = new Schema({
  provider: { type: String, enum: ['openai', 'xai'], required: true },
  productId: { type: String, required: true },
  isValid: { type: Boolean, required: true },
  confidence: { type: Number, required: true },
  verifiedFields: { type: Schema.Types.Mixed },
  corrections: [{
    field: String,
    originalValue: Schema.Types.Mixed,
    correctedValue: Schema.Types.Mixed,
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
const ConsensusDiscrepancySchema = new Schema({
  field: { type: String, required: true },
  openaiValue: { type: Schema.Types.Mixed },
  xaiValue: { type: Schema.Types.Mixed },
  resolved: { type: Boolean, default: false },
  resolution: { type: Schema.Types.Mixed },
  resolutionSource: { type: String, enum: ['openai', 'xai', 'manual'] },
}, { _id: false });

/**
 * Consensus Result Schema
 */
const ConsensusResultSchema = new Schema({
  agreed: { type: Boolean, required: true },
  agreementScore: { type: Number, required: true },
  mergedResult: { type: Schema.Types.Mixed },
  corrections: [{
    field: String,
    originalValue: Schema.Types.Mixed,
    correctedValue: Schema.Types.Mixed,
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
const SessionAIResultSchema = new Schema({
  productId: { type: String, required: true },
  openaiResult: AIValidationResultSchema,
  xaiResult: AIValidationResultSchema,
  consensusResult: ConsensusResultSchema,
}, { _id: false });

/**
 * Verification Session Schema
 */
const VerificationSessionSchema = new Schema<IVerificationSession>(
  {
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
  },
  {
    timestamps: true,
    collection: 'verification_sessions',
  }
);

// Indexes
VerificationSessionSchema.index({ status: 1, createdAt: -1 });
VerificationSessionSchema.index({ 'sourceMetadata.batchId': 1 });

/**
 * Verification Session Model
 */
export const VerificationSession = mongoose.model<IVerificationSession>(
  'VerificationSession',
  VerificationSessionSchema
);

export default VerificationSession;
