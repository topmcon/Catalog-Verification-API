import mongoose, { Schema, Document } from 'mongoose';

/**
 * Pipeline Comparison Log Model
 * 
 * Records comparison between agent-based classification and monolith classification
 * for dual-path validation during Phase 1 rollout.
 * 
 * Query examples:
 *   - Match rate: db.pipeline_comparisons.aggregate([{$group: {_id: null, matchRate: {$avg: {$cond: ["$matched", 1, 0]}}}}])
 *   - Mismatches by category: db.pipeline_comparisons.find({matched: false}).sort({timestamp: -1})
 *   - Agent confidence on mismatches: db.pipeline_comparisons.find({matched: false}, {agentCategory: 1, monolithCategory: 1, agentConfidence: 1})
 */

export interface IPipelineComparison extends Document {
  sessionId: string;
  sfCatalogId: string;
  agentCategory: string;
  agentCategoryId: string;
  agentDepartment: string;
  agentFamily: string;
  agentConfidence: number;
  agentSource: string;
  monolithCategory: string;
  matched: boolean;
  timestamp: Date;
}

const PipelineComparisonSchema = new Schema<IPipelineComparison>({
  sessionId: { type: String, required: true, index: true },
  sfCatalogId: { type: String, required: true, index: true },
  agentCategory: { type: String, required: true },
  agentCategoryId: { type: String, required: true },
  agentDepartment: { type: String, required: true },
  agentFamily: { type: String, required: true },
  agentConfidence: { type: Number, required: true },
  agentSource: { type: String, required: true },
  monolithCategory: { type: String, required: true },
  matched: { type: Boolean, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

// TTL index: auto-delete after 90 days (comparison data is transitional)
PipelineComparisonSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const PipelineComparison = mongoose.model<IPipelineComparison>(
  'PipelineComparison',
  PipelineComparisonSchema,
  'pipeline_comparisons'
);
