import mongoose, { Schema, Document } from 'mongoose';

/**
 * AI Usage Tracker Model
 * ----------------------
 * Granular tracking of every AI API call for:
 * - Cost analysis and optimization
 * - Model performance comparison
 * - Success/failure rate monitoring
 * - Response time tracking
 * - Token usage analysis
 * - Identifying strong/weak points by task type
 */

// Cost per 1M tokens (as of Jan 2024) - update these as prices change
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI GPT-4o family
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-2024-11-20': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o-mini-2024-07-18': { input: 0.15, output: 0.60 },
  'gpt-4o-search-preview': { input: 2.50, output: 10.00 },
  'gpt-4o-mini-search-preview': { input: 0.15, output: 0.60 },
  
  // OpenAI GPT-4 Turbo
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-4-turbo-preview': { input: 10.00, output: 30.00 },
  'gpt-4-turbo-2024-04-09': { input: 10.00, output: 30.00 },
  
  // OpenAI o-series reasoning models
  'o1': { input: 15.00, output: 60.00 },
  'o1-preview': { input: 15.00, output: 60.00 },
  'o1-mini': { input: 3.00, output: 12.00 },
  'o3': { input: 15.00, output: 60.00 }, // Estimated
  'o3-mini': { input: 1.10, output: 4.40 },
  
  // xAI Grok family
  'grok-beta': { input: 5.00, output: 15.00 },
  'grok-2': { input: 2.00, output: 10.00 },
  'grok-2-latest': { input: 2.00, output: 10.00 },
  'grok-2-1212': { input: 2.00, output: 10.00 },
  'grok-2-vision-1212': { input: 2.00, output: 10.00 },
  'grok-3': { input: 3.00, output: 15.00 }, // Estimated
  'grok-3-mini': { input: 0.30, output: 0.50 },
  'grok-4': { input: 5.00, output: 20.00 }, // Estimated
};

export type AIProvider = 'openai' | 'xai';
export type TaskType = 
  | 'verification'      // Main product verification
  | 'cross-validation'  // Second pass after disagreement
  | 'research'          // Web search with search models
  | 'final-verification-search' // Final targeted web search after AI analysis
  | 'image-analysis'    // Vision model analysis
  | 'consensus-resolution'  // Resolving AI disagreements
  | 'enrichment'        // Product enrichment
  | 'categorization'    // Category-only determination
  | 'attribute-extraction'; // Attribute extraction only

export type TaskOutcome = 
  | 'success'           // Completed successfully
  | 'partial'           // Some data extracted but not all
  | 'failed'            // Complete failure
  | 'timeout'           // Request timed out
  | 'rate-limited'      // Hit rate limit
  | 'invalid-response'  // Couldn't parse AI response
  | 'api-error';        // API returned an error

export interface IAIUsage extends Document {
  // Identifiers
  usageId: string;
  trackingId?: string;      // Link to main API tracker
  sessionId: string;
  productId?: string;       // SF_Catalog_Id
  
  // Request Details
  provider: AIProvider;
  aiModel: string;          // Renamed from 'model' to avoid conflict with Mongoose
  taskType: TaskType;
  
  // Timing
  requestTimestamp: Date;
  responseTimestamp?: Date;
  latencyMs: number;
  
  // Token Usage
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  
  // Cost Calculation (in USD)
  inputCost: number;
  outputCost: number;
  totalCost: number;
  
  // Outcome
  outcome: TaskOutcome;
  httpStatus?: number;
  errorCode?: string;
  errorMessage?: string;
  
  // Quality Metrics
  confidenceScore?: number;       // AI's reported confidence
  responseQuality?: number;       // 0-100 quality score
  jsonValid: boolean;             // Was the JSON response parseable?
  fieldsCaptured: number;         // Number of fields extracted
  fieldsExpected: number;         // Number of fields expected
  
  // Consensus Data (if part of dual verification)
  agreedWithOtherAI?: boolean;
  disagreementFields?: string[];
  wasOverruled?: boolean;         // This AI's answer wasn't used in final result
  
  // Task-Specific Data
  categoryDetermined?: string;
  categoryConfidence?: number;
  imageUrls?: string[];           // For vision tasks
  searchQuery?: string;           // For search tasks
  urlsResearched?: string[];      // For research tasks
  
  // Debug Data
  promptLength: number;           // Character count of prompt
  responseLength: number;         // Character count of response
  retryAttempt: number;           // 0 = first try, 1+ = retry
  
  // Tags for filtering
  tags: string[];
  
  // Timestamps
  createdAt: Date;
}

const AIUsageSchema = new Schema<IAIUsage>(
  {
    usageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    trackingId: {
      type: String,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    productId: {
      type: String,
      index: true,
    },
    
    // Request Details
    provider: {
      type: String,
      enum: ['openai', 'xai'],
      required: true,
      index: true,
    },
    aiModel: {
      type: String,
      required: true,
      index: true,
    },
    taskType: {
      type: String,
      enum: ['verification', 'cross-validation', 'research', 'image-analysis', 
             'consensus-resolution', 'enrichment', 'categorization', 'attribute-extraction'],
      required: true,
      index: true,
    },
    
    // Timing
    requestTimestamp: {
      type: Date,
      required: true,
      index: true,
    },
    responseTimestamp: Date,
    latencyMs: {
      type: Number,
      required: true,
      index: true,
    },
    
    // Token Usage
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0, index: true },
    
    // Cost
    inputCost: { type: Number, default: 0 },
    outputCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0, index: true },
    
    // Outcome
    outcome: {
      type: String,
      enum: ['success', 'partial', 'failed', 'timeout', 'rate-limited', 'invalid-response', 'api-error'],
      required: true,
      index: true,
    },
    httpStatus: Number,
    errorCode: String,
    errorMessage: String,
    
    // Quality Metrics
    confidenceScore: { type: Number, min: 0, max: 100 },
    responseQuality: { type: Number, min: 0, max: 100 },
    jsonValid: { type: Boolean, default: false },
    fieldsCaptured: { type: Number, default: 0 },
    fieldsExpected: { type: Number, default: 0 },
    
    // Consensus
    agreedWithOtherAI: Boolean,
    disagreementFields: [String],
    wasOverruled: Boolean,
    
    // Task-Specific
    categoryDetermined: String,
    categoryConfidence: Number,
    imageUrls: [String],
    searchQuery: String,
    urlsResearched: [String],
    
    // Debug
    promptLength: { type: Number, default: 0 },
    responseLength: { type: Number, default: 0 },
    retryAttempt: { type: Number, default: 0 },
    
    // Tags
    tags: [{ type: String, index: true }],
  },
  {
    timestamps: true,
    collection: 'ai_usage',
  }
);

// Compound indexes for analytics queries
AIUsageSchema.index({ provider: 1, aiModel: 1, requestTimestamp: -1 });
AIUsageSchema.index({ taskType: 1, outcome: 1 });
AIUsageSchema.index({ aiModel: 1, outcome: 1, latencyMs: 1 });
AIUsageSchema.index({ requestTimestamp: -1, totalCost: -1 });
AIUsageSchema.index({ provider: 1, taskType: 1, confidenceScore: -1 });
AIUsageSchema.index({ categoryDetermined: 1, outcome: 1 });

// TTL index - 180 days retention for detailed usage data
AIUsageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

export const AIUsage = mongoose.model<IAIUsage>('AIUsage', AIUsageSchema);

/**
 * Calculate cost for a given model and token count
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): { inputCost: number; outputCost: number; totalCost: number } {
  const pricing = MODEL_PRICING[model] || { input: 5.00, output: 15.00 }; // Default if unknown
  
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  
  return {
    inputCost: Math.round(inputCost * 1_000_000) / 1_000_000, // Round to 6 decimal places
    outputCost: Math.round(outputCost * 1_000_000) / 1_000_000,
    totalCost: Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000,
  };
}
