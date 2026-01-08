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

// Global Primary Display Attributes - Apply to ALL products
export const GLOBAL_PRIMARY_ATTRIBUTES = [
  "Brand (Verified)",
  "Category / Subcategory (Verified)",
  "Product Family (Verified)",
  "Product Style (Verified) (Category Specific)",
  "Depth / length (Verified)",
  "Width (Verified)",
  "Height (Verified)",
  "Weight (Verified)",
  "MSRP (Verified)",
  "Market Value",
  "Description",
  "Product Title (Verified)",
  "Details",
  "Features list",
  "UPC / GTIN (Verified)",
  "Model Number (Verified)",
  "Model Number Alias (Symbols Removed)",
  "Model Parent",
  "Model Varient Number",
  "Total Model Varients (List all varient models)"
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

// Premium Brand Tiers
export const PREMIUM_BRANDS = [
  'Sub-Zero', 'Wolf', 'Thermador', 'Viking', 'Miele', 
  'Gaggenau', 'La Cornue', 'Dacor', 'Monogram', 'BlueStar',
  'Hestan', 'JennAir', 'Café', 'Fisher & Paykel', 'Liebherr',
  'Bertazzoni', 'DERA', 'Lynx', 'Kalamazoo', 'Alfresco'
] as const;

export const MID_TIER_BRANDS = [
  'KitchenAid', 'Bosch', 'Samsung', 'LG', 'GE Profile',
  'Electrolux', 'Frigidaire Gallery', 'Whirlpool', 'Maytag',
  'GE', 'Broan', 'Zephyr', 'DERA', 'Sharp'
] as const;

// Category Name Variations (for matching)
export const CATEGORY_ALIASES: Record<string, string[]> = {
  'Refrigerator': ['Fridge', 'Refrigerators', 'Frig'],
  'Dishwasher': ['Dishwashers', 'Dish Washer'],
  'Range': ['Stove', 'Ranges', 'Cooking Range'],
  'Cooktop': ['Cooktops', 'Cook Top', 'Stovetop'],
  'Oven': ['Ovens', 'Wall Oven', 'Wall Ovens'],
  'Microwave': ['Microwaves', 'Microwave Oven'],
  'Range Hood': ['Hood', 'Vent Hood', 'Ventilation', 'Range Hoods'],
  'Washer': ['Washing Machine', 'Washers'],
  'Dryer': ['Dryers', 'Clothes Dryer'],
  'Freezer': ['Freezers', 'Chest Freezer', 'Upright Freezer'],
  'Icemaker': ['Ice Maker', 'Ice Machine'],
  'All in One Washer / Dryer': ['Washer Dryer Combo', 'Combo Washer Dryer', 'Laundry Center']
};

// Export the full schema (will be populated from JSON)
export type CategorySchema = Record<string, Department>;

export default {
  GLOBAL_PRIMARY_ATTRIBUTES,
  PREMIUM_FEATURE_KEYWORDS,
  PREMIUM_BRANDS,
  MID_TIER_BRANDS,
  CATEGORY_ALIASES
};
