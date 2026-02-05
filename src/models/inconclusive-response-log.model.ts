import mongoose, { Document, Schema } from 'mongoose';

/**
 * Tracks inconclusive/vague AI responses to identify problem areas
 * Examples: "Not Applicable", "N/A", "Unknown", "Product not found", etc.
 */

export interface IInconclusiveResponseLog extends Document {
  // Session tracking
  session_id: string;
  verification_job_id?: string;
  timestamp: Date;
  
  // Product context
  product_id: string;
  sf_catalog_id?: string;
  category: string;
  product_style?: string;
  manufacturer?: string;
  model_number?: string;
  
  // Field information
  field_name: string;
  field_type: 'primary' | 'top_filter' | 'additional' | 'category';
  expected_source: 'picklist' | 'free_text' | 'boolean' | 'number';
  
  // Response details
  inconclusive_value: string;
  inconclusive_type: 'not_applicable' | 'unknown' | 'not_found' | 'empty' | 'vague' | 'error';
  ai_provider: 'openai' | 'xai' | 'both';
  openai_value?: string;
  xai_value?: string;
  consensus_reached: boolean;
  
  // Context
  prompt_included_research: boolean;
  data_sources_available: string[];
  
  // Analysis
  pattern_detected?: string;
  potential_cause?: string;
  
  // Metadata
  created_at: Date;
}

const InconclusiveResponseLogSchema = new Schema<IInconclusiveResponseLog>({
  // Session tracking
  session_id: { type: String, required: true, index: true },
  verification_job_id: { type: String, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  
  // Product context
  product_id: { type: String, required: true, index: true },
  sf_catalog_id: { type: String, index: true },
  category: { type: String, required: true, index: true },
  product_style: { type: String, index: true },
  manufacturer: { type: String },
  model_number: { type: String },
  
  // Field information
  field_name: { type: String, required: true, index: true },
  field_type: { 
    type: String, 
    enum: ['primary', 'top_filter', 'additional', 'category'], 
    required: true,
    index: true 
  },
  expected_source: { 
    type: String, 
    enum: ['picklist', 'free_text', 'boolean', 'number'], 
    required: true 
  },
  
  // Response details
  inconclusive_value: { type: String, required: true },
  inconclusive_type: { 
    type: String, 
    enum: ['not_applicable', 'unknown', 'not_found', 'empty', 'vague', 'error'],
    required: true,
    index: true
  },
  ai_provider: { 
    type: String, 
    enum: ['openai', 'xai', 'both'], 
    required: true 
  },
  openai_value: { type: String },
  xai_value: { type: String },
  consensus_reached: { type: Boolean, default: false },
  
  // Context
  prompt_included_research: { type: Boolean, default: false },
  data_sources_available: [{ type: String }],
  
  // Analysis
  pattern_detected: { type: String },
  potential_cause: { type: String },
  
  // Metadata
  created_at: { type: Date, default: Date.now }
});

// Compound indexes for efficient analytics queries
InconclusiveResponseLogSchema.index({ category: 1, field_name: 1 });
InconclusiveResponseLogSchema.index({ field_name: 1, inconclusive_type: 1 });
InconclusiveResponseLogSchema.index({ timestamp: -1 });
InconclusiveResponseLogSchema.index({ category: 1, field_type: 1 });

export const InconclusiveResponseLog = mongoose.model<IInconclusiveResponseLog>(
  'InconclusiveResponseLog', 
  InconclusiveResponseLogSchema
);
