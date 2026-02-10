/**
 * Category Schema Memory Bank
 * 
 * This module stores the complete category attribute schema for product data enrichment.
 * When product data is received, we:
 * 1. Match it to a category
 * 2. Pull the relevant attribute schema
 * 3. Use source data FIRST, then AI to fill gaps
 * 4. Generate standardized titles and descriptions
 */

// Import brand tiers from constants FIRST (before any exports that use them)
import { PREMIUM_BRANDS as CONSTANTS_PREMIUM_BRANDS, MID_TIER_BRANDS as CONSTANTS_MID_TIER_BRANDS } from './constants';

// Global Primary Display Attributes - Apply to ALL products
export const GLOBAL_PRIMARY_ATTRIBUTES = [
  "Brand (Verified)",
  "Category / Subcategory (Verified)",
  "Product Family (Verified)",
  "Product Style (Verified) (Category Specific)",
  "Depth / Length (Verified)",
  "Width (Verified)",
  "Height (Verified)",
  "Weight (Verified)",
  "MSRP (Verified)",
  "Market Value",
  "Description",
  "Product Title (Verified)",
  "Details",
  "Features List",
  "UPC / GTIN (Verified)",
  "Model Number (Verified)",
  "Model Number Alias (Symbols Removed)",
  "Model Parent",
  "Model Variant Number",
  "Total Model Variants (List all variant models)"
] as const;

// Title Format Template
export interface TitleComponents {
  brand: string;
  sizeClass?: string;      // e.g., "30-Inch", "24-Inch"
  styleOrType?: string;    // e.g., "French Door", "Slide-In"
  category: string;        // e.g., "Refrigerator", "Range"
  finishColor?: string;    // e.g., "Stainless Steel", "Black"
  specialFeatures?: string[]; // e.g., ["Built-In", "Panel Ready", "Smart"]
}

// Description Generation Context
export interface DescriptionContext {
  isLuxury: boolean;
  isHighEnd: boolean;
  specialFeatures: string[];  // Built-in, Panel Ready, etc.
  keySpecs: Record<string, string>;
  brandTier?: 'premium' | 'mid' | 'value';
}

// Category Attribute Schema
export interface CategoryAttributeSchema {
  categoryName: string;
  department: string;
  rowsInCategory: number;
  applicableAttributeCount: number;
  primaryDisplayGlobal: readonly string[];
  top15FilterAttributes: string[];
  htmlTableAttributes: string[];
  allApplicableAttributesRankedCounts: Record<string, number>;
}

// Taxonomy Tier Axis
export interface TaxonomyAxis {
  axisName: string;
  sourceColumn: string;
  coverage: number;
  nonnullCount: number;
  topValues: Array<{ value: string; count: number }>;
}

// Taxonomy Tiers
export interface TaxonomyTiers {
  rowsInCategory: number;
  tier2: {
    axes: TaxonomyAxis[];
    needsReview: boolean;
  };
}

// Complete Category Definition
export interface CategoryDefinition {
  categoryName: string;
  department: string;
  attributeSystem: CategoryAttributeSchema;
  taxonomyTiers: TaxonomyTiers;
}

// Department Structure
export interface Department {
  categories: Record<string, CategoryDefinition>;
}

// Special Feature Keywords (for title and description highlighting)
export const PREMIUM_FEATURE_KEYWORDS = [
  'Built-In',
  'Built In',
  'Panel Ready',
  'Counter Depth',
  'Professional',
  'Commercial Grade',
  'Smart Home',
  'WiFi',
  'Connected',
  'Luxury',
  'Premium',
  'High-End',
  'Custom',
  'Designer',
  'Pro Series',
  'Signature',
  'Elite',
  'Platinum',
  'Gold',
  'Stainless Steel',
  'Fingerprint Resistant',
  'Energy Star',
  'ADA Compliant',
  'Sabbath Mode',
  'Steam',
  'Convection',
  'Induction',
  'Dual Fuel',
  'Self-Cleaning'
] as const;

// Premium Brand Tiers - Re-exported from constants.ts (SINGLE SOURCE OF TRUTH)
// DO NOT DUPLICATE - Edit constants.ts instead
export const PREMIUM_BRANDS = CONSTANTS_PREMIUM_BRANDS;
export const MID_TIER_BRANDS = CONSTANTS_MID_TIER_BRANDS;

// Category Name Variations — Re-exported from category-aliases.ts (SINGLE SOURCE OF TRUTH)
// DO NOT DUPLICATE — Edit category-aliases.ts instead
import { CATEGORY_ALIASES as _CONSOLIDATED_ALIASES } from './category-aliases';
export const CATEGORY_ALIASES: Record<string, string[]> = _CONSOLIDATED_ALIASES;

// Export the full schema (will be populated from JSON)
export type CategorySchema = Record<string, Department>;

// Import category schemas
import { CategoryAttributeConfig } from './category-attributes';
// PREMIUM_BRANDS and MID_TIER_BRANDS imported at top of file

// Import the master schema map and lookup function
import { 
  getSchemaForCategory,
  getUniqueSchemas 
} from './master-category-schema-map';

/**
 * Get the category schema for a given category name
 * Uses the MASTER_CATEGORY_SCHEMA_MAP for comprehensive category support
 */
export function getCategorySchema(categoryName: string): CategoryAttributeConfig | null {
  return getSchemaForCategory(categoryName);
}

/**
 * Get all available category schemas (deduplicated)
 */
export function getAllCategorySchemas(): CategoryAttributeConfig[] {
  return getUniqueSchemas();
}

export default {
  GLOBAL_PRIMARY_ATTRIBUTES,
  PREMIUM_FEATURE_KEYWORDS,
  PREMIUM_BRANDS,
  MID_TIER_BRANDS,
  CATEGORY_ALIASES,
  getCategorySchema,
  getAllCategorySchemas
};
