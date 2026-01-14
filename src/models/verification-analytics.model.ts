/**
 * Verification Analytics Model
 * Stores all verification data for analysis, trends, and ML training
 */

import mongoose, { Schema, Document } from 'mongoose';

// ============================================================
// 1. VERIFICATION RESULT - Complete record of each API call
// ============================================================
export interface IVerificationResult extends Document {
  // Identity
  session_id: string;
  sf_catalog_id: string;
  sf_catalog_name: string;
  
  // Timing
  timestamp: Date;
  processing_time_ms: number;
  
  // Input data
  input_payload: {
    brand: string;
    category: string;
    subcategory: string;
    model_number: string;
    title: string;
    description: string;
    msrp_web_retailer: number;
    msrp_ferguson: number;
    image_count: number;
    document_count: number;
    has_ferguson_url: boolean;
    has_reference_url: boolean;
  };
  
  // AI Processing
  ai_results: {
    openai: {
      responded: boolean;
      response_time_ms: number;
      confidence: number;
      fields_returned: number;
      error?: string;
    };
    xai: {
      responded: boolean;
      response_time_ms: number;
      confidence: number;
      fields_returned: number;
      error?: string;
    };
  };
  
  // Consensus Summary
  consensus: {
    total_fields: number;
    agreed_count: number;
    partial_count: number;
    disagreed_count: number;
    single_source_count: number;
    agreement_percentage: number;
  };
  
  // Per-field details (for ML training)
  field_results: Array<{
    field_name: string;
    field_category: 'primary' | 'filter' | 'additional';
    openai_value: any;
    openai_confidence: number;
    xai_value: any;
    xai_confidence: number;
    consensus_status: 'agreed' | 'partial' | 'disagreed' | 'single_source';
    final_value: any;
    source_selected: string;
    values_identical: boolean;
  }>;
  
  // Document Analysis
  documents_analyzed: Array<{
    url: string;
    type: string;
    ai_recommendation: 'use' | 'skip' | 'review';
    relevance_score: number;
    contributed_to_verification: boolean;
  }>;
  
  // Final Output
  verification_score: number;
  verification_status: 'verified' | 'enriched' | 'needs_review' | 'failed';
  status: 'success' | 'partial' | 'error';
  
  // Category for analysis
  product_category: string;
  product_subcategory: string;
  brand: string;
}

const VerificationResultSchema = new Schema<IVerificationResult>({
  session_id: { type: String, required: true, index: true },
  sf_catalog_id: { type: String, required: true, index: true },
  sf_catalog_name: { type: String },
  
  timestamp: { type: Date, default: Date.now, index: true },
  processing_time_ms: { type: Number },
  
  input_payload: {
    brand: String,
    category: String,
    subcategory: String,
    model_number: String,
    title: String,
    description: String,
    msrp_web_retailer: Number,
    msrp_ferguson: Number,
    image_count: Number,
    document_count: Number,
    has_ferguson_url: Boolean,
    has_reference_url: Boolean
  },
  
  ai_results: {
    openai: {
      responded: Boolean,
      response_time_ms: Number,
      confidence: Number,
      fields_returned: Number,
      error: String
    },
    xai: {
      responded: Boolean,
      response_time_ms: Number,
      confidence: Number,
      fields_returned: Number,
      error: String
    }
  },
  
  consensus: {
    total_fields: Number,
    agreed_count: Number,
    partial_count: Number,
    disagreed_count: Number,
    single_source_count: Number,
    agreement_percentage: Number
  },
  
  field_results: [{
    field_name: { type: String, index: true },
    field_category: String,
    openai_value: Schema.Types.Mixed,
    openai_confidence: Number,
    xai_value: Schema.Types.Mixed,
    xai_confidence: Number,
    consensus_status: String,
    final_value: Schema.Types.Mixed,
    source_selected: String,
    values_identical: Boolean
  }],
  
  documents_analyzed: [{
    url: String,
    type: String,
    ai_recommendation: String,
    relevance_score: Number,
    contributed_to_verification: Boolean
  }],
  
  verification_score: Number,
  verification_status: String,
  status: String,
  
  product_category: { type: String, index: true },
  product_subcategory: { type: String, index: true },
  brand: { type: String, index: true }
}, {
  timestamps: true,
  collection: 'verification_results'
});

// Compound indexes for common queries
VerificationResultSchema.index({ timestamp: -1, product_category: 1 });
VerificationResultSchema.index({ 'consensus.agreement_percentage': 1 });
VerificationResultSchema.index({ brand: 1, timestamp: -1 });

export const VerificationResult = mongoose.model<IVerificationResult>('VerificationResult', VerificationResultSchema);


// ============================================================
// 2. FIELD PERFORMANCE METRICS - Aggregated per-field stats
// ============================================================
export interface IFieldMetrics extends Document {
  field_name: string;
  field_category: 'primary' | 'filter' | 'additional';
  
  // Lifetime stats
  total_occurrences: number;
  agreed_count: number;
  partial_count: number;
  disagreed_count: number;
  single_source_count: number;
  
  // Calculated metrics
  agreement_rate: number;
  avg_openai_confidence: number;
  avg_xai_confidence: number;
  
  // Which AI is more reliable for this field
  openai_selected_count: number;
  xai_selected_count: number;
  preferred_source: 'openai' | 'xai' | 'equal';
  
  // By category breakdown
  by_category: Array<{
    category: string;
    occurrences: number;
    agreement_rate: number;
  }>;
  
  // Trend (last 7 days vs previous)
  trend: {
    current_week_agreement: number;
    previous_week_agreement: number;
    trend_direction: 'improving' | 'declining' | 'stable';
  };
  
  last_updated: Date;
}

const FieldMetricsSchema = new Schema<IFieldMetrics>({
  field_name: { type: String, required: true, unique: true },
  field_category: String,
  
  total_occurrences: { type: Number, default: 0 },
  agreed_count: { type: Number, default: 0 },
  partial_count: { type: Number, default: 0 },
  disagreed_count: { type: Number, default: 0 },
  single_source_count: { type: Number, default: 0 },
  
  agreement_rate: { type: Number, default: 0 },
  avg_openai_confidence: { type: Number, default: 0 },
  avg_xai_confidence: { type: Number, default: 0 },
  
  openai_selected_count: { type: Number, default: 0 },
  xai_selected_count: { type: Number, default: 0 },
  preferred_source: { type: String, default: 'equal' },
  
  by_category: [{
    category: String,
    occurrences: Number,
    agreement_rate: Number
  }],
  
  trend: {
    current_week_agreement: Number,
    previous_week_agreement: Number,
    trend_direction: String
  },
  
  last_updated: { type: Date, default: Date.now }
}, {
  collection: 'field_metrics'
});

export const FieldMetrics = mongoose.model<IFieldMetrics>('FieldMetrics', FieldMetricsSchema);


// ============================================================
// 3. CATEGORY PERFORMANCE - Stats by product category
// ============================================================
export interface ICategoryMetrics extends Document {
  category: string;
  subcategory?: string;
  
  // Volume
  total_verifications: number;
  verifications_this_week: number;
  verifications_this_month: number;
  
  // Quality metrics
  avg_verification_score: number;
  avg_agreement_percentage: number;
  avg_processing_time_ms: number;
  
  // Status breakdown
  verified_count: number;
  enriched_count: number;
  needs_review_count: number;
  failed_count: number;
  
  // Problem fields for this category
  problem_fields: Array<{
    field_name: string;
    agreement_rate: number;
    occurrences: number;
  }>;
  
  // Top brands in category
  top_brands: Array<{
    brand: string;
    count: number;
    avg_score: number;
  }>;
  
  last_updated: Date;
}

const CategoryMetricsSchema = new Schema<ICategoryMetrics>({
  category: { type: String, required: true, index: true },
  subcategory: { type: String },
  
  total_verifications: { type: Number, default: 0 },
  verifications_this_week: { type: Number, default: 0 },
  verifications_this_month: { type: Number, default: 0 },
  
  avg_verification_score: { type: Number, default: 0 },
  avg_agreement_percentage: { type: Number, default: 0 },
  avg_processing_time_ms: { type: Number, default: 0 },
  
  verified_count: { type: Number, default: 0 },
  enriched_count: { type: Number, default: 0 },
  needs_review_count: { type: Number, default: 0 },
  failed_count: { type: Number, default: 0 },
  
  problem_fields: [{
    field_name: String,
    agreement_rate: Number,
    occurrences: Number
  }],
  
  top_brands: [{
    brand: String,
    count: Number,
    avg_score: Number
  }],
  
  last_updated: { type: Date, default: Date.now }
}, {
  collection: 'category_metrics'
});

CategoryMetricsSchema.index({ category: 1, subcategory: 1 }, { unique: true });

export const CategoryMetrics = mongoose.model<ICategoryMetrics>('CategoryMetrics', CategoryMetricsSchema);


// ============================================================
// 4. AI PROVIDER COMPARISON - OpenAI vs xAI performance
// ============================================================
export interface IAIProviderMetrics extends Document {
  provider: 'openai' | 'xai';
  
  // Reliability
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  success_rate: number;
  
  // Performance
  avg_response_time_ms: number;
  avg_confidence: number;
  avg_fields_returned: number;
  
  // Accuracy (when selected as final)
  times_selected_as_final: number;
  selection_rate: number;
  
  // By field type
  performance_by_field_type: Array<{
    field_category: string;
    selection_rate: number;
    avg_confidence: number;
  }>;
  
  // By category
  performance_by_category: Array<{
    category: string;
    selection_rate: number;
    avg_confidence: number;
  }>;
  
  // Daily trend (last 30 days)
  daily_stats: Array<{
    date: Date;
    calls: number;
    success_rate: number;
    avg_confidence: number;
  }>;
  
  last_updated: Date;
}

const AIProviderMetricsSchema = new Schema<IAIProviderMetrics>({
  provider: { type: String, required: true, unique: true },
  
  total_calls: { type: Number, default: 0 },
  successful_calls: { type: Number, default: 0 },
  failed_calls: { type: Number, default: 0 },
  success_rate: { type: Number, default: 0 },
  
  avg_response_time_ms: { type: Number, default: 0 },
  avg_confidence: { type: Number, default: 0 },
  avg_fields_returned: { type: Number, default: 0 },
  
  times_selected_as_final: { type: Number, default: 0 },
  selection_rate: { type: Number, default: 0 },
  
  performance_by_field_type: [{
    field_category: String,
    selection_rate: Number,
    avg_confidence: Number
  }],
  
  performance_by_category: [{
    category: String,
    selection_rate: Number,
    avg_confidence: Number
  }],
  
  daily_stats: [{
    date: Date,
    calls: Number,
    success_rate: Number,
    avg_confidence: Number
  }],
  
  last_updated: { type: Date, default: Date.now }
}, {
  collection: 'ai_provider_metrics'
});

export const AIProviderMetrics = mongoose.model<IAIProviderMetrics>('AIProviderMetrics', AIProviderMetricsSchema);


// ============================================================
// 5. DAILY SNAPSHOTS - For trend analysis over time
// ============================================================
export interface IDailySnapshot extends Document {
  date: Date;
  
  // Volume
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  
  // Quality
  avg_verification_score: number;
  avg_agreement_percentage: number;
  avg_processing_time_ms: number;
  
  // Consensus breakdown
  total_fields_processed: number;
  agreed_fields: number;
  partial_fields: number;
  disagreed_fields: number;
  
  // By status
  verified_count: number;
  enriched_count: number;
  needs_review_count: number;
  
  // Top categories that day
  top_categories: Array<{
    category: string;
    count: number;
  }>;
  
  // Problem fields that day
  lowest_agreement_fields: Array<{
    field_name: string;
    agreement_rate: number;
  }>;
}

const DailySnapshotSchema = new Schema<IDailySnapshot>({
  date: { type: Date, required: true, unique: true, index: true },
  
  total_calls: Number,
  successful_calls: Number,
  failed_calls: Number,
  
  avg_verification_score: Number,
  avg_agreement_percentage: Number,
  avg_processing_time_ms: Number,
  
  total_fields_processed: Number,
  agreed_fields: Number,
  partial_fields: Number,
  disagreed_fields: Number,
  
  verified_count: Number,
  enriched_count: Number,
  needs_review_count: Number,
  
  top_categories: [{
    category: String,
    count: Number
  }],
  
  lowest_agreement_fields: [{
    field_name: String,
    agreement_rate: Number
  }]
}, {
  collection: 'daily_snapshots'
});

export const DailySnapshot = mongoose.model<IDailySnapshot>('DailySnapshot', DailySnapshotSchema);


// ============================================================
// 6. ML TRAINING EXPORT - Structured data for model training
// ============================================================
export interface ITrainingExample extends Document {
  // Input features
  input: {
    product_text: string;  // Combined title + description
    brand: string;
    category: string;
    model_number: string;
    price: number;
    image_urls: string[];
    document_urls: string[];
  };
  
  // Target outputs (verified/corrected values)
  output: {
    field_name: string;
    correct_value: any;
    source: 'consensus' | 'openai' | 'xai' | 'manual';
    confidence: number;
  };
  
  // Metadata
  created_from_session: string;
  created_at: Date;
  
  // Quality flags
  high_confidence: boolean;  // Both AIs agreed with >90% confidence
  manually_verified: boolean;
  use_for_training: boolean;
}

const TrainingExampleSchema = new Schema<ITrainingExample>({
  input: {
    product_text: String,
    brand: String,
    category: String,
    model_number: String,
    price: Number,
    image_urls: [String],
    document_urls: [String]
  },
  
  output: {
    field_name: { type: String, index: true },
    correct_value: Schema.Types.Mixed,
    source: String,
    confidence: Number
  },
  
  created_from_session: String,
  created_at: { type: Date, default: Date.now },
  
  high_confidence: { type: Boolean, default: false, index: true },
  manually_verified: { type: Boolean, default: false },
  use_for_training: { type: Boolean, default: true, index: true }
}, {
  collection: 'training_examples'
});

TrainingExampleSchema.index({ 'output.field_name': 1, high_confidence: 1 });

export const TrainingExample = mongoose.model<ITrainingExample>('TrainingExample', TrainingExampleSchema);
