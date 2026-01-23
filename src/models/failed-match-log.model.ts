/**
 * Failed Attribute Match Log Model
 * 
 * Logs all API calls that result in failed attribute matches for later auditing
 * and improvement analysis. Captures:
 * - The original attempted value
 * - Product context (what product was being verified)
 * - Match attempt details (similarity scores, closest suggestions)
 * - AI analysis context (what the AI models extracted)
 * - Resolution status for tracking improvements
 */

import mongoose, { Schema, Document } from 'mongoose';

export type MatchType = 'brand' | 'category' | 'style' | 'attribute';
export type MatchSource = 'top_15_filter' | 'ai_analysis' | 'html_table' | 'raw_data';

export interface IFailedMatchLog extends Document {
  // Match identification
  matchType: MatchType;
  attemptedValue: string;
  normalizedValue: string;
  
  // Match result details
  similarity: number;
  closestMatches: Array<{
    value: string;
    id?: string;
    similarity: number;
  }>;
  matchThreshold: number;  // What threshold was used (e.g., 0.6 for attributes)
  
  // Source context
  source: MatchSource;
  fieldKey?: string;       // For top_15 attributes, the field key like 'height', 'width'
  
  // Product context
  productContext: {
    sf_catalog_id: string;
    sf_catalog_name?: string | null;
    model_number?: string | null;
    brand?: string | null;
    category?: string | null;
    session_id: string;
  };
  
  // AI analysis context - what the AI models said
  aiContext?: {
    openai_value?: string | null;
    xai_value?: string | null;
    consensus_value?: string | null;
    confidence?: number;
  };
  
  // Raw data context - what was in the original product data
  rawDataContext?: {
    web_retailer_value?: string | null;
    ferguson_value?: string | null;
    original_attribute_name?: string | null;
  };
  
  // Request generated (if any)
  requestGenerated: boolean;
  requestDetails?: {
    attribute_name: string;
    requested_for_category: string;
    reason: string;
  };
  
  // Resolution tracking
  resolved: boolean;
  resolution?: {
    action: 'added_to_picklist' | 'mapped_to_existing' | 'ignored' | 'value_corrected' | 'false_positive';
    resolvedValue?: string;
    resolvedTo?: string;  // What it was mapped/corrected to
    notes?: string;
    resolvedBy?: string;
    resolvedAt?: Date;
  };
  
  // Analytics
  occurrenceCount: number;
  firstSeen: Date;
  lastSeen: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const FailedMatchLogSchema = new Schema<IFailedMatchLog>(
  {
    matchType: {
      type: String,
      enum: ['brand', 'category', 'style', 'attribute'],
      required: true,
      index: true,
    },
    attemptedValue: {
      type: String,
      required: true,
      index: true,
    },
    normalizedValue: {
      type: String,
      required: true,
    },
    similarity: {
      type: Number,
      default: 0,
      index: true,
    },
    closestMatches: [{
      value: { type: String, required: true },
      id: { type: String },
      similarity: { type: Number, required: true },
    }],
    matchThreshold: {
      type: Number,
      default: 0.6,
    },
    source: {
      type: String,
      enum: ['top_15_filter', 'ai_analysis', 'html_table', 'raw_data'],
      required: true,
      index: true,
    },
    fieldKey: {
      type: String,
      index: true,
    },
    productContext: {
      sf_catalog_id: { type: String, required: true, index: true },
      sf_catalog_name: { type: String },
      model_number: { type: String },
      brand: { type: String },
      category: { type: String },
      session_id: { type: String, required: true, index: true },
    },
    aiContext: {
      openai_value: { type: String },
      xai_value: { type: String },
      consensus_value: { type: String },
      confidence: { type: Number },
    },
    rawDataContext: {
      web_retailer_value: { type: String },
      ferguson_value: { type: String },
      original_attribute_name: { type: String },
    },
    requestGenerated: {
      type: Boolean,
      default: false,
    },
    requestDetails: {
      attribute_name: { type: String },
      requested_for_category: { type: String },
      reason: { type: String },
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolution: {
      action: {
        type: String,
        enum: ['added_to_picklist', 'mapped_to_existing', 'ignored', 'value_corrected', 'false_positive'],
      },
      resolvedValue: { type: String },
      resolvedTo: { type: String },
      notes: { type: String },
      resolvedBy: { type: String },
      resolvedAt: { type: Date },
    },
    occurrenceCount: {
      type: Number,
      default: 1,
    },
    firstSeen: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'failed_match_logs',
  }
);

// Compound index for finding existing failed matches (unique per match type + value + source)
FailedMatchLogSchema.index(
  { matchType: 1, normalizedValue: 1, source: 1 }, 
  { unique: true }
);

// Index for analytics queries - most common failures
FailedMatchLogSchema.index({ resolved: 1, occurrenceCount: -1 });

// Index for time-based queries
FailedMatchLogSchema.index({ lastSeen: -1 });
FailedMatchLogSchema.index({ createdAt: -1 });

// Index for category-based analysis
FailedMatchLogSchema.index({ 'productContext.category': 1, matchType: 1 });

// Index for similarity-based queries (find near-misses)
FailedMatchLogSchema.index({ matchType: 1, similarity: -1, resolved: 1 });

export const FailedMatchLog = mongoose.model<IFailedMatchLog>('FailedMatchLog', FailedMatchLogSchema);
