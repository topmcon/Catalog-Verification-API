import mongoose, { Schema, Document } from 'mongoose';

/**
 * API Call Tracker Model
 * Comprehensive tracking of all API calls for analytics, debugging, and improvement identification
 */

// Incoming request data structure
export interface IncomingRequestData {
  // Request metadata
  endpoint: string;
  method: string;
  ipAddress: string;
  userAgent: string;
  apiKeyHash?: string;  // Hashed for security
  
  // Salesforce product data received
  SF_Catalog_Id: string;
  SF_Catalog_Name?: string;
  Brand_Web_Retailer?: string;
  Model_Number_Web_Retailer?: string;
  Web_Retailer_Category?: string;
  Web_Retailer_SubCategory?: string;
  
  // Raw payload size and field counts
  payloadSizeBytes: number;
  webRetailerFieldCount: number;
  fergusonFieldCount: number;
  webRetailerSpecCount: number;
  fergusonAttributeCount: number;
  
  // Full request body (optional, for debugging)
  rawPayload?: Record<string, unknown>;
}

// AI processing results
export interface AIProcessingResult {
  provider: 'openai' | 'xai';
  success: boolean;
  
  // Category determination
  determinedCategory: string;
  categoryConfidence: number;
  
  // Processing metrics
  processingTimeMs: number;
  tokensUsed?: number;
  
  // Data quality
  fieldsPopulated: number;
  fieldsMissing: number;
  correctionsApplied: number;
  researchPerformed: boolean;
  
  // Confidence metrics
  overallConfidence: number;
  
  // Errors
  errorCode?: string;
  errorMessage?: string;
}

// Consensus result
export interface ConsensusData {
  agreed: boolean;
  consensusScore: number;
  
  // Category consensus
  categoryAgreed: boolean;
  finalCategory: string;
  
  // Field-level agreement
  fieldsAgreed: number;
  fieldsDisagreed: number;
  fieldsResolved: number;
  fieldsUnresolved: number;
  
  // Retry information
  retryCount: number;
  crossValidationPerformed: boolean;
  researchPhaseTriggered: boolean;
  
  // Disagreement details
  disagreementFields: string[];
  unresolvedFields: string[];
}

// Outgoing response data
export interface OutgoingResponseData {
  success: boolean;
  statusCode: number;
  
  // What was returned
  verifiedFieldCount: number;
  primaryAttributesPopulated: number;
  topFilterAttributesPopulated: number;
  additionalAttributesIncluded: boolean;
  htmlTableGenerated: boolean;
  
  // Key verified values returned
  Brand_Verified?: string;
  Category_Verified?: string;
  SubCategory_Verified?: string;
  Product_Title_Verified?: string;
  
  // Response size
  responseSizeBytes: number;
  
  // Full response (optional)
  responsePayload?: Record<string, unknown>;
}

// Issue tracking
export interface IssueFlag {
  type: 'missing_data' | 'category_mismatch' | 'low_confidence' | 'ai_error' | 'consensus_failure' | 'validation_error' | 'timeout' | 'research_failed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  field?: string;
  description: string;
  suggestedAction?: string;
}

/**
 * Main API Tracker Document Interface
 */
export interface IAPITracker extends Document {
  // Identifiers
  trackingId: string;
  sessionId: string;
  
  // Timestamps
  requestTimestamp: Date;
  responseTimestamp: Date;
  
  // Request data
  request: IncomingRequestData;
  
  // AI Processing
  openaiResult?: AIProcessingResult;
  xaiResult?: AIProcessingResult;
  
  // Consensus
  consensus?: ConsensusData;
  
  // Response data
  response: OutgoingResponseData;
  
  // Performance
  totalProcessingTimeMs: number;
  
  // Status
  overallStatus: 'success' | 'partial' | 'failed';
  verificationScore: number;
  
  // Issues flagged
  issues: IssueFlag[];
  
  // Tags for filtering
  tags: string[];
  
  // Created/Updated
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schemas
 */
const IncomingRequestDataSchema = new Schema({
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
  
  rawPayload: { type: Schema.Types.Mixed },
}, { _id: false });

const AIProcessingResultSchema = new Schema({
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

const ConsensusDataSchema = new Schema({
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

const OutgoingResponseDataSchema = new Schema({
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
  
  responsePayload: { type: Schema.Types.Mixed },
}, { _id: false });

const IssueFlagSchema = new Schema({
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
const APITrackerSchema = new Schema<IAPITracker>(
  {
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
  },
  {
    timestamps: true,
    collection: 'api_tracker',
  }
);

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

// TTL index for automatic cleanup - 90 days retention
APITrackerSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const APITracker = mongoose.model<IAPITracker>('APITracker', APITrackerSchema);
