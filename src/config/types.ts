/**
 * CATEGORY CONFIGURATION TYPES
 * ============================
 * All TypeScript interfaces for the category schema system.
 * This is the single source of truth for type definitions.
 */

// ============================================
// RESPONSE BUILDER SCHEMA TYPES
// ============================================

/**
 * Schema configuration for Response Builder
 * Contains simple string arrays for attributes
 */
export interface CategoryAttributeConfig {
  categoryName: string;
  department: string;
  rowCount?: number;
  attributeCount?: number;
  top15FilterAttributes: string[];
  htmlTableAttributes: string[];
  taxonomyTiers: {
    tier1: string;
    tier2: string;
    tier3: string;
    tier4?: string;
  };
}

// ============================================
// AI VERIFICATION SCHEMA TYPES
// ============================================

/**
 * Schema for AI verification system
 * Contains structured attribute definitions with types
 */
export interface AIFilterAttributeDefinition {
  name: string;
  fieldKey: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  unit?: string;
  allowedValues?: string[];
  description: string;
}

/**
 * Category schema for AI prompts
 */
export interface AICategorySchema {
  categoryId: string;
  categoryName: string;
  department: string;
  aliases: string[];
  top15FilterAttributes: AIFilterAttributeDefinition[];
}

// ============================================
// CATEGORY DEFINITION TYPES
// ============================================

/**
 * Taxonomy axis for category hierarchy
 */
export interface TaxonomyAxis {
  axisName: string;
  sourceColumn: string;
  coverage: number;
  nonnullCount: number;
  topValues: Array<{ value: string; count: number }>;
}

/**
 * Taxonomy tier structure
 */
export interface TaxonomyTiers {
  rowsInCategory: number;
  tier2: {
    axes: TaxonomyAxis[];
    needsReview: boolean;
  };
}

/**
 * Complete category attribute schema
 */
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

/**
 * Complete category definition with all metadata
 */
export interface CategoryDefinition {
  categoryName: string;
  department: string;
  attributeSystem: CategoryAttributeSchema;
  taxonomyTiers: TaxonomyTiers;
}

/**
 * Department structure
 */
export interface Department {
  categories: Record<string, CategoryDefinition>;
}

// ============================================
// TITLE & DESCRIPTION TYPES
// ============================================

/**
 * Components for generating product titles
 */
export interface TitleComponents {
  brand: string;
  sizeClass?: string;      // e.g., "30-Inch", "24-Inch"
  styleOrType?: string;    // e.g., "French Door", "Slide-In"
  category: string;        // e.g., "Refrigerator", "Range"
  finishColor?: string;    // e.g., "Stainless Steel", "Black"
  specialFeatures?: string[]; // e.g., ["Built-In", "Panel Ready", "Smart"]
}

/**
 * Context for generating descriptions
 */
export interface DescriptionContext {
  isLuxury: boolean;
  isHighEnd: boolean;
  specialFeatures: string[];
  keySpecs: Record<string, string>;
  brandTier?: 'premium' | 'mid' | 'value';
}

// ============================================
// PICKLIST TYPES
// ============================================

/**
 * Salesforce picklist item
 */
export interface PicklistItem {
  label: string;
  value: string;
  category?: string;
}

/**
 * Picklist match result
 */
export interface PicklistMatchResult {
  matched: boolean;
  originalValue: string;
  matchedValue?: string;
  confidence: number;
  suggestions?: string[];
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Primary attribute definition
 */
export interface PrimaryAttributeDefinition {
  name: string;
  fieldKey: string;
  type: 'string' | 'number' | 'currency' | 'dimension' | 'html' | 'list';
  required: boolean;
  description: string;
}

/**
 * Generic category schema type for flexibility
 */
export type CategorySchema = Record<string, Department>;

// Export type guards
export function isCategoryAttributeConfig(obj: unknown): obj is CategoryAttributeConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'categoryName' in obj &&
    'top15FilterAttributes' in obj &&
    Array.isArray((obj as CategoryAttributeConfig).top15FilterAttributes)
  );
}

export function isAICategorySchema(obj: unknown): obj is AICategorySchema {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'categoryId' in obj &&
    'top15FilterAttributes' in obj &&
    Array.isArray((obj as AICategorySchema).top15FilterAttributes) &&
    (obj as AICategorySchema).top15FilterAttributes.length > 0 &&
    typeof (obj as AICategorySchema).top15FilterAttributes[0] === 'object'
  );
}
