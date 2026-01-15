import mongoose, { Document, Schema } from 'mongoose';

export interface ICategoryConfusion extends Document {
  openai_category: string;
  xai_category: string;
  count: number;
  last_occurred: Date;
  created_at: Date;
}

const CategoryConfusionSchema = new Schema<ICategoryConfusion>({
  openai_category: { type: String, required: true, index: true },
  xai_category: { type: String, required: true, index: true },
  count: { type: Number, default: 0 },
  last_occurred: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

// Compound index for efficient queries
CategoryConfusionSchema.index({ openai_category: 1, xai_category: 1 }, { unique: true });
CategoryConfusionSchema.index({ count: -1 });
CategoryConfusionSchema.index({ last_occurred: -1 });

export const CategoryConfusion = mongoose.model<ICategoryConfusion>('CategoryConfusion', CategoryConfusionSchema);
