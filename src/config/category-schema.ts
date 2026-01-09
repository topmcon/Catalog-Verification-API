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

// Import category schemas
import {
  REFRIGERATOR_SCHEMA,
  DISHWASHER_SCHEMA,
  RANGE_SCHEMA,
  OVEN_SCHEMA,
  COOKTOP_SCHEMA,
  MICROWAVE_SCHEMA,
  RANGE_HOOD_SCHEMA,
  WASHER_SCHEMA,
  DRYER_SCHEMA,
  FREEZER_SCHEMA,
  CategoryAttributeConfig
} from './category-attributes';

// Category Schema Lookup Map
const CATEGORY_SCHEMA_MAP: Record<string, CategoryAttributeConfig> = {
  // Exact matches
  'Refrigerator': REFRIGERATOR_SCHEMA,
  'Dishwasher': DISHWASHER_SCHEMA,
  'Range': RANGE_SCHEMA,
  'Oven': OVEN_SCHEMA,
  'Cooktop': COOKTOP_SCHEMA,
  'Microwave': MICROWAVE_SCHEMA,
  'Range Hood': RANGE_HOOD_SCHEMA,
  'Washer': WASHER_SCHEMA,
  'Dryer': DRYER_SCHEMA,
  'Freezer': FREEZER_SCHEMA,
  
  // Web Retailer category variations
  'REFRIGERATORS': REFRIGERATOR_SCHEMA,
  'GAS RANGES': RANGE_SCHEMA,
  'ELECTRIC RANGES': RANGE_SCHEMA,
  'DUAL FUEL RANGES': RANGE_SCHEMA,
  'SLIDE IN GAS RANGE': RANGE_SCHEMA,
  'SLIDE IN ELECTRIC RANGE': RANGE_SCHEMA,
  'FREESTANDING GAS RANGE': RANGE_SCHEMA,
  'FREESTANDING ELECTRIC RANGE': RANGE_SCHEMA,
  'DISHWASHERS': DISHWASHER_SCHEMA,
  'WALL OVENS': OVEN_SCHEMA,
  'COOKTOPS': COOKTOP_SCHEMA,
  'MICROWAVES': MICROWAVE_SCHEMA,
  'RANGE HOODS': RANGE_HOOD_SCHEMA,
  'VENTILATION': RANGE_HOOD_SCHEMA,
  'WASHERS': WASHER_SCHEMA,
  'DRYERS': DRYER_SCHEMA,
  'FREEZERS': FREEZER_SCHEMA,
  
  // Ferguson category variations
  'Cooking Appliances': RANGE_SCHEMA,
  'Ovens Ranges Cooktops': RANGE_SCHEMA,
  'Range with Single Oven': RANGE_SCHEMA,
};

/**
 * Get the category schema for a given category name
 * Returns the appropriate schema with attributes for verification
 */
export function getCategorySchema(categoryName: string): CategoryAttributeConfig | null {
  // Try exact match first
  if (CATEGORY_SCHEMA_MAP[categoryName]) {
    return CATEGORY_SCHEMA_MAP[categoryName];
  }
  
  // Try case-insensitive match
  const upperName = categoryName.toUpperCase();
  for (const [key, schema] of Object.entries(CATEGORY_SCHEMA_MAP)) {
    if (key.toUpperCase() === upperName) {
      return schema;
    }
  }
  
  // Try partial match
  const lowerName = categoryName.toLowerCase();
  for (const [key, schema] of Object.entries(CATEGORY_SCHEMA_MAP)) {
    if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
      return schema;
    }
  }
  
  return null;
}

/**
 * Get all available category schemas
 */
export function getAllCategorySchemas(): CategoryAttributeConfig[] {
  return [
    REFRIGERATOR_SCHEMA,
    DISHWASHER_SCHEMA,
    RANGE_SCHEMA,
    OVEN_SCHEMA,
    COOKTOP_SCHEMA,
    MICROWAVE_SCHEMA,
    RANGE_HOOD_SCHEMA,
    WASHER_SCHEMA,
    DRYER_SCHEMA,
    FREEZER_SCHEMA
  ];
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
