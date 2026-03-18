import mongoose, { Document, Schema } from 'mongoose';

export interface ISourceBreakdown {
  found: number;       // times this source provided a value for this attribute
  available: number;   // times this source had data at all for this category/type
}

export interface IAttributeCatalog extends Document {
  category: string;
  type: string;                    // product type within category (e.g., "Two-Piece" for Toilet)
  attributeName: string;           // normalized canonical name
  
  // Frequency tracking
  totalVerifications: number;      // total verifications for this category/type combo
  foundCount: number;              // times this attribute had a non-empty value
  fillRate: number;                // foundCount / totalVerifications (computed on save)
  
  // Source breakdown — only incremented when that source had data for the product
  sources: {
    ferguson: ISourceBreakdown;
    webRetailer: ISourceBreakdown;
    ai: ISourceBreakdown;
    specTable: ISourceBreakdown;
    nestedFerguson: ISourceBreakdown;
  };
  
  // Classification
  currentLocation: 'top15' | 'primary' | 'html' | 'discovered';
  isMetadata: boolean;             // warranty, certifications, Energy Star, etc.
  
  // Tracking
  firstSeen: Date;
  lastSeen: Date;
  lastValue: string;               // most recent value (for debugging/context)
}

const SourceBreakdownSchema = new Schema<ISourceBreakdown>({
  found: { type: Number, default: 0 },
  available: { type: Number, default: 0 }
}, { _id: false });

const AttributeCatalogSchema = new Schema<IAttributeCatalog>({
  category: { type: String, required: true, index: true },
  type: { type: String, default: '', index: true },
  attributeName: { type: String, required: true, index: true },
  
  totalVerifications: { type: Number, default: 0 },
  foundCount: { type: Number, default: 0 },
  fillRate: { type: Number, default: 0 },
  
  sources: {
    ferguson: { type: SourceBreakdownSchema, default: () => ({ found: 0, available: 0 }) },
    webRetailer: { type: SourceBreakdownSchema, default: () => ({ found: 0, available: 0 }) },
    ai: { type: SourceBreakdownSchema, default: () => ({ found: 0, available: 0 }) },
    specTable: { type: SourceBreakdownSchema, default: () => ({ found: 0, available: 0 }) },
    nestedFerguson: { type: SourceBreakdownSchema, default: () => ({ found: 0, available: 0 }) }
  },
  
  currentLocation: { 
    type: String, 
    enum: ['top15', 'primary', 'html', 'discovered'], 
    default: 'discovered' 
  },
  isMetadata: { type: Boolean, default: false },
  
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  lastValue: { type: String, default: '' }
});

// Unique compound index — one record per category + type + attribute
AttributeCatalogSchema.index(
  { category: 1, type: 1, attributeName: 1 }, 
  { unique: true }
);

// Query indexes
AttributeCatalogSchema.index({ fillRate: 1 });
AttributeCatalogSchema.index({ currentLocation: 1 });
AttributeCatalogSchema.index({ lastSeen: -1 });
AttributeCatalogSchema.index({ foundCount: -1 });

// Compute fill rate before saving
AttributeCatalogSchema.pre('save', function(next) {
  if (this.totalVerifications > 0) {
    this.fillRate = this.foundCount / this.totalVerifications;
  }
  this.lastSeen = new Date();
  next();
});

export const AttributeCatalog = mongoose.model<IAttributeCatalog>(
  'AttributeCatalog', 
  AttributeCatalogSchema
);
