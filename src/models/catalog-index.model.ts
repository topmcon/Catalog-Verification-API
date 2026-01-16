import mongoose, { Document, Schema } from 'mongoose';

/**
 * CATALOG INTELLIGENCE INDEX
 * 
 * Tracks relationships and patterns from all verification calls:
 * - Department → Family → Category hierarchy
 * - Category → Style associations
 * - Category → Attribute mappings
 * - Brand → Category patterns
 * - Historical trends and frequencies
 */

// ============================================================================
// CATEGORY INDEX - Master category record with all associations
// ============================================================================
export interface ICategoryIndex extends Document {
  category_name: string;
  category_id: string | null;
  department: string;
  family: string;
  
  // Style associations seen with this category
  styles: {
    style_name: string;
    style_id: string | null;
    occurrence_count: number;
    first_seen: Date;
    last_seen: Date;
    sample_products: string[];  // Model numbers
  }[];
  
  // Attributes commonly seen with this category
  attributes: {
    attribute_name: string;
    occurrence_count: number;
    common_values: {
      value: string;
      count: number;
    }[];
  }[];
  
  // Brands that have products in this category
  brands: {
    brand_name: string;
    brand_id: string | null;
    product_count: number;
  }[];
  
  // Subcategories seen
  subcategories: {
    name: string;
    count: number;
  }[];
  
  // Statistics
  total_products_verified: number;
  avg_confidence_score: number;
  first_seen: Date;
  last_seen: Date;
  
  created_at: Date;
  updated_at: Date;
}

const CategoryIndexSchema = new Schema<ICategoryIndex>({
  category_name: { type: String, required: true, unique: true, index: true },
  category_id: { type: String, default: null },
  department: { type: String, default: '', index: true },
  family: { type: String, default: '', index: true },
  
  styles: [{
    style_name: { type: String, required: true },
    style_id: { type: String, default: null },
    occurrence_count: { type: Number, default: 1 },
    first_seen: { type: Date, default: Date.now },
    last_seen: { type: Date, default: Date.now },
    sample_products: [{ type: String }]
  }],
  
  attributes: [{
    attribute_name: { type: String, required: true },
    occurrence_count: { type: Number, default: 1 },
    common_values: [{
      value: { type: String },
      count: { type: Number, default: 1 }
    }]
  }],
  
  brands: [{
    brand_name: { type: String, required: true },
    brand_id: { type: String, default: null },
    product_count: { type: Number, default: 1 }
  }],
  
  subcategories: [{
    name: { type: String },
    count: { type: Number, default: 1 }
  }],
  
  total_products_verified: { type: Number, default: 0 },
  avg_confidence_score: { type: Number, default: 0 },
  first_seen: { type: Date, default: Date.now },
  last_seen: { type: Date, default: Date.now },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================================
// STYLE INDEX - Master style record with category associations
// ============================================================================
export interface IStyleIndex extends Document {
  style_name: string;
  style_id: string | null;
  in_salesforce_picklist: boolean;
  
  // Categories this style has been seen with
  categories: {
    category_name: string;
    category_id: string | null;
    department: string;
    family: string;
    occurrence_count: number;
    first_seen: Date;
    last_seen: Date;
  }[];
  
  // Brands commonly using this style
  brands: {
    brand_name: string;
    product_count: number;
  }[];
  
  // Common attributes seen with this style
  common_attributes: {
    attribute_name: string;
    common_values: string[];
  }[];
  
  total_occurrences: number;
  first_seen: Date;
  last_seen: Date;
  
  created_at: Date;
  updated_at: Date;
}

const StyleIndexSchema = new Schema<IStyleIndex>({
  style_name: { type: String, required: true, unique: true, index: true },
  style_id: { type: String, default: null },
  in_salesforce_picklist: { type: Boolean, default: false },
  
  categories: [{
    category_name: { type: String, required: true },
    category_id: { type: String, default: null },
    department: { type: String, default: '' },
    family: { type: String, default: '' },
    occurrence_count: { type: Number, default: 1 },
    first_seen: { type: Date, default: Date.now },
    last_seen: { type: Date, default: Date.now }
  }],
  
  brands: [{
    brand_name: { type: String },
    product_count: { type: Number, default: 1 }
  }],
  
  common_attributes: [{
    attribute_name: { type: String },
    common_values: [{ type: String }]
  }],
  
  total_occurrences: { type: Number, default: 0 },
  first_seen: { type: Date, default: Date.now },
  last_seen: { type: Date, default: Date.now },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================================
// HIERARCHY INDEX - Department → Family → Category tree
// ============================================================================
export interface IHierarchyIndex extends Document {
  department: string;
  families: {
    family_name: string;
    categories: {
      category_name: string;
      category_id: string | null;
      product_count: number;
      styles: string[];
    }[];
    product_count: number;
  }[];
  total_products: number;
  updated_at: Date;
}

const HierarchyIndexSchema = new Schema<IHierarchyIndex>({
  department: { type: String, required: true, unique: true, index: true },
  families: [{
    family_name: { type: String, required: true },
    categories: [{
      category_name: { type: String, required: true },
      category_id: { type: String, default: null },
      product_count: { type: Number, default: 0 },
      styles: [{ type: String }]
    }],
    product_count: { type: Number, default: 0 }
  }],
  total_products: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================================
// ATTRIBUTE INDEX - Track attribute patterns across categories
// ============================================================================
export interface IAttributeIndex extends Document {
  attribute_name: string;
  attribute_key: string;  // e.g., "Width_Verified", "fuel_type"
  
  // Categories where this attribute appears
  categories: {
    category_name: string;
    occurrence_count: number;
    is_required: boolean;
    common_values: {
      value: string;
      count: number;
    }[];
  }[];
  
  // Value statistics
  all_values: {
    value: string;
    total_count: number;
    categories: string[];
  }[];
  
  total_occurrences: number;
  value_type: 'string' | 'number' | 'boolean' | 'mixed';
  
  created_at: Date;
  updated_at: Date;
}

const AttributeIndexSchema = new Schema<IAttributeIndex>({
  attribute_name: { type: String, required: true, index: true },
  attribute_key: { type: String, required: true, unique: true, index: true },
  
  categories: [{
    category_name: { type: String, required: true },
    occurrence_count: { type: Number, default: 1 },
    is_required: { type: Boolean, default: false },
    common_values: [{
      value: { type: String },
      count: { type: Number, default: 1 }
    }]
  }],
  
  all_values: [{
    value: { type: String },
    total_count: { type: Number, default: 1 },
    categories: [{ type: String }]
  }],
  
  total_occurrences: { type: Number, default: 0 },
  value_type: { type: String, enum: ['string', 'number', 'boolean', 'mixed'], default: 'string' },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================================
// BRAND-CATEGORY INDEX - Track brand specializations
// ============================================================================
export interface IBrandCategoryIndex extends Document {
  brand_name: string;
  brand_id: string | null;
  
  // Categories this brand has products in
  categories: {
    category_name: string;
    department: string;
    family: string;
    product_count: number;
    styles: string[];
    first_seen: Date;
    last_seen: Date;
  }[];
  
  // Primary categories (highest product counts)
  primary_categories: string[];
  
  total_products: number;
  created_at: Date;
  updated_at: Date;
}

const BrandCategoryIndexSchema = new Schema<IBrandCategoryIndex>({
  brand_name: { type: String, required: true, unique: true, index: true },
  brand_id: { type: String, default: null },
  
  categories: [{
    category_name: { type: String, required: true },
    department: { type: String, default: '' },
    family: { type: String, default: '' },
    product_count: { type: Number, default: 1 },
    styles: [{ type: String }],
    first_seen: { type: Date, default: Date.now },
    last_seen: { type: Date, default: Date.now }
  }],
  
  primary_categories: [{ type: String }],
  total_products: { type: Number, default: 0 },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// ============================================================================
// VERIFICATION HISTORY - Individual verification records for analysis
// ============================================================================
export interface IVerificationHistory extends Document {
  sf_catalog_id: string;
  model_number: string;
  brand: string;
  
  // Verified values
  category: string;
  category_id: string | null;
  department: string;
  family: string;
  subcategory: string;
  style: string;
  style_id: string | null;
  
  // AI analysis
  openai_category: string;
  openai_style: string;
  xai_category: string;
  xai_style: string;
  ai_agreed: boolean;
  
  // Attributes captured
  attributes: Record<string, any>;
  
  confidence_score: number;
  verification_timestamp: Date;
}

const VerificationHistorySchema = new Schema<IVerificationHistory>({
  sf_catalog_id: { type: String, required: true, index: true },
  model_number: { type: String, index: true },
  brand: { type: String, index: true },
  
  category: { type: String, index: true },
  category_id: { type: String },
  department: { type: String, index: true },
  family: { type: String, index: true },
  subcategory: { type: String },
  style: { type: String, index: true },
  style_id: { type: String },
  
  openai_category: { type: String },
  openai_style: { type: String },
  xai_category: { type: String },
  xai_style: { type: String },
  ai_agreed: { type: Boolean },
  
  attributes: { type: Schema.Types.Mixed, default: {} },
  
  confidence_score: { type: Number },
  verification_timestamp: { type: Date, default: Date.now, index: true }
});

// Create compound indexes for efficient queries
VerificationHistorySchema.index({ category: 1, style: 1 });
VerificationHistorySchema.index({ department: 1, family: 1, category: 1 });
VerificationHistorySchema.index({ brand: 1, category: 1 });

// Export models
export const CategoryIndex = mongoose.model<ICategoryIndex>('CategoryIndex', CategoryIndexSchema);
export const StyleIndex = mongoose.model<IStyleIndex>('StyleIndex', StyleIndexSchema);
export const HierarchyIndex = mongoose.model<IHierarchyIndex>('HierarchyIndex', HierarchyIndexSchema);
export const AttributeIndex = mongoose.model<IAttributeIndex>('AttributeIndex', AttributeIndexSchema);
export const BrandCategoryIndex = mongoose.model<IBrandCategoryIndex>('BrandCategoryIndex', BrandCategoryIndexSchema);
export const VerificationHistory = mongoose.model<IVerificationHistory>('VerificationHistory', VerificationHistorySchema);
