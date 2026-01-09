/**
 * MASTER CATEGORY ATTRIBUTES CONFIGURATION
 * ==========================================
 * This is the STATIC backend definition of ALL categories and their attributes.
 * These are FIXED - the AI must map incoming data to these exact fields.
 *
 * STRUCTURE:
 * 1. PRIMARY ATTRIBUTES - Same 20 fields for ALL products (universal)
 * 2. TOP 15 FILTER ATTRIBUTES - Category-specific filter attributes
 * 3. ADDITIONAL ATTRIBUTES - Everything else → rendered as HTML spec table
 */
/**
 * ============================================
 * PRIMARY ATTRIBUTES (UNIVERSAL - ALL PRODUCTS)
 * ============================================
 * These 20 fields apply to EVERY product regardless of category
 */
export declare const PRIMARY_ATTRIBUTES: readonly ["Brand (Verified)", "Category / Subcategory (Verified)", "Product Family (Verified)", "Product Style (Verified) (Category Specific)", "Depth / Length (Verified)", "Width (Verified)", "Height (Verified)", "Weight (Verified)", "MSRP (Verified)", "Market Value", "Description", "Product Title (Verified)", "Details", "Features List", "UPC / GTIN (Verified)", "Model Number (Verified)", "Model Number Alias (Symbols Removed)", "Model Parent", "Model Variant Number", "Total Model Variants (List all variant models)"];
export type PrimaryAttributeName = typeof PRIMARY_ATTRIBUTES[number];
/**
 * Primary attribute field definitions with types and descriptions
 */
export interface PrimaryAttributeDefinition {
    name: PrimaryAttributeName;
    fieldKey: string;
    type: 'string' | 'number' | 'currency' | 'dimension' | 'html' | 'list';
    required: boolean;
    description: string;
}
export declare const PRIMARY_ATTRIBUTE_DEFINITIONS: PrimaryAttributeDefinition[];
/**
 * ============================================
 * CATEGORY SCHEMA DEFINITION
 * ============================================
 */
export interface CategorySchema {
    categoryId: string;
    categoryName: string;
    department: string;
    aliases: string[];
    top15FilterAttributes: FilterAttributeDefinition[];
}
export interface FilterAttributeDefinition {
    name: string;
    fieldKey: string;
    type: 'string' | 'number' | 'boolean' | 'enum';
    unit?: string;
    allowedValues?: string[];
    description: string;
}
/**
 * ============================================
 * APPLIANCE CATEGORIES - TOP 15 FILTER ATTRIBUTES
 * ============================================
 */
export declare const RANGE_SCHEMA: CategorySchema;
export declare const REFRIGERATOR_SCHEMA: CategorySchema;
export declare const DISHWASHER_SCHEMA: CategorySchema;
export declare const WALL_OVEN_SCHEMA: CategorySchema;
export declare const COOKTOP_SCHEMA: CategorySchema;
export declare const MICROWAVE_SCHEMA: CategorySchema;
export declare const RANGE_HOOD_SCHEMA: CategorySchema;
export declare const WASHER_SCHEMA: CategorySchema;
export declare const DRYER_SCHEMA: CategorySchema;
export declare const FREEZER_SCHEMA: CategorySchema;
export declare const WINE_COOLER_SCHEMA: CategorySchema;
export declare const ICE_MAKER_SCHEMA: CategorySchema;
/**
 * ============================================
 * MASTER CATEGORY MAP
 * ============================================
 */
export declare const MASTER_CATEGORIES: Record<string, CategorySchema>;
/**
 * ============================================
 * UTILITY FUNCTIONS
 * ============================================
 */
/**
 * Get all available category names
 */
export declare function getAllCategoryNames(): string[];
/**
 * Get all category IDs
 */
export declare function getAllCategoryIds(): string[];
/**
 * Get category schema by ID or name
 */
export declare function getCategorySchema(categoryIdOrName: string): CategorySchema | null;
/**
 * Get Primary Attributes list for AI prompt
 */
export declare function getPrimaryAttributesForPrompt(): string;
/**
 * Get formatted category list for AI prompt
 */
export declare function getCategoryListForPrompt(): string;
/**
 * Get Top 15 attributes for a category (for AI prompt)
 */
export declare function getTop15AttributesForPrompt(categoryId: string): string;
/**
 * Get all Top 15 attributes for all categories (for AI prompt)
 */
export declare function getAllCategoriesWithTop15ForPrompt(): string;
//# sourceMappingURL=master-category-attributes.d.ts.map