import mongoose, { Document, Schema } from 'mongoose';

/**
 * AI Performance Metrics Model
 * 
 * Tracks individual AI performance (OpenAI vs xAI) for each verification job.
 * Used for post-job analysis to identify patterns, biases, and improvement opportunities.
 * 
 * This data is captured AFTER job completion and does NOT influence the current job's results.
 * Claude's review remains independent - this is strictly for learning and system improvement.
 */

export interface IAIPerformanceMetrics extends Document {
  jobId: string;
  sfCatalogId: string;
  sfCatalogName: string;
  timestamp: Date;
  category: string;
  
  // Raw AI outputs (before consensus)
  openaiOutputs: {
    department: string | null;
    category: string | null;
    primaryAttributes: Record<string, any>;
    top15Attributes: Record<string, any>;
    confidence: number;
  };
  
  xaiOutputs: {
    department: string | null;
    category: string | null;
    primaryAttributes: Record<string, any>;
    top15Attributes: Record<string, any>;
    confidence: number;
  };
  
  // Disagreements and how they were resolved
  disagreements: Array<{
    field: string;
    openaiValue: any;
    xaiValue: any;
    smartResolutionWinner: 'openai' | 'xai' | 'combined' | 'not_found';
    smartResolutionReason: string;
  }>;
  
  // Claude's corrections (if any)
  claudeReview: {
    reviewStatus: 'PASS' | 'FLAG' | 'FAIL';
    confidenceInResults: number;
    proposedCorrections: {
      category?: string | null;
      department?: string | null;
      type?: string | null;
      style?: string | null;
      title?: string | null;
    } | null;
    issues: Array<{
      severity: string;
      field: string;
      currentValue: string;
      issue: string;
      suggestedFix: string;
    }>;
  } | null;
  
  // Final values sent to Salesforce
  finalValues: {
    department: string;
    category: string;
    type: string | null;
    style: string | null;
    brand: string | null;
    color: string | null;
    finish: string | null;
    msrp: string | null;
    product_title: string | null;
    product_family: string | null;
  };
  
  // Performance metadata
  processingTimeMs: number;
  dataSourceScenario: string;
  hasFergusonData: boolean;
  hasWebRetailerData: boolean;
  imageAnalysisPerformed: boolean;
  webSearchPerformed: boolean;
}

const AIPerformanceMetricsSchema = new Schema<IAIPerformanceMetrics>(
  {
    jobId: { type: String, required: true, index: true },
    sfCatalogId: { type: String, required: true },
    sfCatalogName: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true },
    category: { type: String, required: true, index: true },
    
    openaiOutputs: {
      department: { type: String, default: null },
      category: { type: String, default: null },
      primaryAttributes: { type: Schema.Types.Mixed, default: {} },
      top15Attributes: { type: Schema.Types.Mixed, default: {} },
      confidence: { type: Number, required: true }
    },
    
    xaiOutputs: {
      department: { type: String, default: null },
      category: { type: String, default: null },
      primaryAttributes: { type: Schema.Types.Mixed, default: {} },
      top15Attributes: { type: Schema.Types.Mixed, default: {} },
      confidence: { type: Number, required: true }
    },
    
    disagreements: [
      {
        field: { type: String, required: true },
        openaiValue: { type: Schema.Types.Mixed },
        xaiValue: { type: Schema.Types.Mixed },
        smartResolutionWinner: { 
          type: String, 
          enum: ['openai', 'xai', 'combined', 'not_found'],
          required: true 
        },
        smartResolutionReason: { type: String, required: true }
      }
    ],
    
    claudeReview: {
      type: {
        reviewStatus: { 
          type: String, 
          enum: ['PASS', 'FLAG', 'FAIL'],
          required: true 
        },
        confidenceInResults: { type: Number, required: true },
        proposedCorrections: {
          type: {
            category: { type: String, default: null },
            department: { type: String, default: null },
            type: { type: String, default: null },
            style: { type: String, default: null },
            title: { type: String, default: null }
          },
          default: null
        },
        issues: [
          {
            severity: { type: String, required: true },
            field: { type: String, required: true },
            currentValue: { type: String, required: true },
            issue: { type: String, required: true },
            suggestedFix: { type: String, required: true }
          }
        ]
      },
      default: null
    },
    
    finalValues: {
      department: { type: String, required: true },
      category: { type: String, required: true },
      type: { type: String, default: null },
      style: { type: String, default: null },
      brand: { type: String, default: null },
      color: { type: String, default: null },
      finish: { type: String, default: null },
      msrp: { type: String, default: null },
      product_title: { type: String, default: null },
      product_family: { type: String, default: null }
    },
    
    processingTimeMs: { type: Number, required: true },
    dataSourceScenario: { type: String, required: true },
    hasFergusonData: { type: Boolean, required: true },
    hasWebRetailerData: { type: Boolean, required: true },
    imageAnalysisPerformed: { type: Boolean, required: true },
    webSearchPerformed: { type: Boolean, required: true }
  },
  {
    timestamps: true,
    collection: 'ai_performance_metrics'
  }
);

// Indexes for efficient querying
AIPerformanceMetricsSchema.index({ timestamp: -1 });
AIPerformanceMetricsSchema.index({ category: 1, timestamp: -1 });
AIPerformanceMetricsSchema.index({ 'claudeReview.reviewStatus': 1, timestamp: -1 });
AIPerformanceMetricsSchema.index({ 'disagreements.field': 1 });

export const AIPerformanceMetrics = mongoose.model<IAIPerformanceMetrics>(
  'AIPerformanceMetrics',
  AIPerformanceMetricsSchema
);
