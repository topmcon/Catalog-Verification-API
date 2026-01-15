import mongoose, { Document, Schema } from 'mongoose';

export interface IFieldAnalytics extends Document {
  field_name: string;
  category: string;
  field_type: 'primary' | 'top_filter' | 'additional';
  total_calls: number;
  populated_count: number;
  ai_provided_count: number;
  fallback_used_count: number;
  missing_count: number;
  population_rate: number;
  last_updated: Date;
  created_at: Date;
}

const FieldAnalyticsSchema = new Schema<IFieldAnalytics>({
  field_name: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  field_type: { type: String, enum: ['primary', 'top_filter', 'additional'], required: true },
  total_calls: { type: Number, default: 0 },
  populated_count: { type: Number, default: 0 },
  ai_provided_count: { type: Number, default: 0 },
  fallback_used_count: { type: Number, default: 0 },
  missing_count: { type: Number, default: 0 },
  population_rate: { type: Number, default: 0 },
  last_updated: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

// Compound index for efficient queries
FieldAnalyticsSchema.index({ category: 1, field_name: 1 }, { unique: true });
FieldAnalyticsSchema.index({ population_rate: 1 });
FieldAnalyticsSchema.index({ last_updated: -1 });

// Calculate population rate before saving
FieldAnalyticsSchema.pre('save', function(next) {
  if (this.total_calls > 0) {
    this.population_rate = this.populated_count / this.total_calls;
  }
  this.last_updated = new Date();
  next();
});

export const FieldAnalytics = mongoose.model<IFieldAnalytics>('FieldAnalytics', FieldAnalyticsSchema);
