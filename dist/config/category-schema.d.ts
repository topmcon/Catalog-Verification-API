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
export declare const GLOBAL_PRIMARY_ATTRIBUTES: readonly ["Brand (Verified)", "Category / Subcategory (Verified)", "Product Family (Verified)", "Product Style (Verified) (Category Specific)", "Depth / length (Verified)", "Width (Verified)", "Height (Verified)", "Weight (Verified)", "MSRP (Verified)", "Market Value", "Description", "Product Title (Verified)", "Details", "Features list", "UPC / GTIN (Verified)", "Model Number (Verified)", "Model Number Alias (Symbols Removed)", "Model Parent", "Model Varient Number", "Total Model Varients (List all varient models)"];
export interface TitleComponents {
    brand: string;
    sizeClass?: string;
    styleOrType?: string;
    category: string;
    finishColor?: string;
    specialFeatures?: string[];
}
export interface DescriptionContext {
    isLuxury: boolean;
    isHighEnd: boolean;
    specialFeatures: string[];
    keySpecs: Record<string, string>;
    brandTier?: 'premium' | 'mid' | 'value';
}
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
export interface TaxonomyAxis {
    axisName: string;
    sourceColumn: string;
    coverage: number;
    nonnullCount: number;
    topValues: Array<{
        value: string;
        count: number;
    }>;
}
export interface TaxonomyTiers {
    rowsInCategory: number;
    tier2: {
        axes: TaxonomyAxis[];
        needsReview: boolean;
    };
}
export interface CategoryDefinition {
    categoryName: string;
    department: string;
    attributeSystem: CategoryAttributeSchema;
    taxonomyTiers: TaxonomyTiers;
}
export interface Department {
    categories: Record<string, CategoryDefinition>;
}
export declare const PREMIUM_FEATURE_KEYWORDS: readonly ["Built-In", "Built In", "Panel Ready", "Counter Depth", "Professional", "Commercial Grade", "Smart Home", "WiFi", "Connected", "Luxury", "Premium", "High-End", "Custom", "Designer", "Pro Series", "Signature", "Elite", "Platinum", "Gold", "Stainless Steel", "Fingerprint Resistant", "Energy Star", "ADA Compliant", "Sabbath Mode", "Steam", "Convection", "Induction", "Dual Fuel", "Self-Cleaning"];
export declare const PREMIUM_BRANDS: readonly ["Sub-Zero", "Wolf", "Thermador", "Viking", "Miele", "Gaggenau", "La Cornue", "Dacor", "Monogram", "BlueStar", "Hestan", "JennAir", "Café", "Fisher & Paykel", "Liebherr", "Bertazzoni", "DERA", "Lynx", "Kalamazoo", "Alfresco"];
export declare const MID_TIER_BRANDS: readonly ["KitchenAid", "Bosch", "Samsung", "LG", "GE Profile", "Electrolux", "Frigidaire Gallery", "Whirlpool", "Maytag", "GE", "Broan", "Zephyr", "DERA", "Sharp"];
export declare const CATEGORY_ALIASES: Record<string, string[]>;
export type CategorySchema = Record<string, Department>;
import { CategoryAttributeConfig } from './category-attributes';
/**
 * Get the category schema for a given category name
 * Returns the appropriate schema with attributes for verification
 */
export declare function getCategorySchema(categoryName: string): CategoryAttributeConfig | null;
/**
 * Get all available category schemas
 */
export declare function getAllCategorySchemas(): CategoryAttributeConfig[];
declare const _default: {
    GLOBAL_PRIMARY_ATTRIBUTES: readonly ["Brand (Verified)", "Category / Subcategory (Verified)", "Product Family (Verified)", "Product Style (Verified) (Category Specific)", "Depth / length (Verified)", "Width (Verified)", "Height (Verified)", "Weight (Verified)", "MSRP (Verified)", "Market Value", "Description", "Product Title (Verified)", "Details", "Features list", "UPC / GTIN (Verified)", "Model Number (Verified)", "Model Number Alias (Symbols Removed)", "Model Parent", "Model Varient Number", "Total Model Varients (List all varient models)"];
    PREMIUM_FEATURE_KEYWORDS: readonly ["Built-In", "Built In", "Panel Ready", "Counter Depth", "Professional", "Commercial Grade", "Smart Home", "WiFi", "Connected", "Luxury", "Premium", "High-End", "Custom", "Designer", "Pro Series", "Signature", "Elite", "Platinum", "Gold", "Stainless Steel", "Fingerprint Resistant", "Energy Star", "ADA Compliant", "Sabbath Mode", "Steam", "Convection", "Induction", "Dual Fuel", "Self-Cleaning"];
    PREMIUM_BRANDS: readonly ["Sub-Zero", "Wolf", "Thermador", "Viking", "Miele", "Gaggenau", "La Cornue", "Dacor", "Monogram", "BlueStar", "Hestan", "JennAir", "Café", "Fisher & Paykel", "Liebherr", "Bertazzoni", "DERA", "Lynx", "Kalamazoo", "Alfresco"];
    MID_TIER_BRANDS: readonly ["KitchenAid", "Bosch", "Samsung", "LG", "GE Profile", "Electrolux", "Frigidaire Gallery", "Whirlpool", "Maytag", "GE", "Broan", "Zephyr", "DERA", "Sharp"];
    CATEGORY_ALIASES: Record<string, string[]>;
    getCategorySchema: typeof getCategorySchema;
    getAllCategorySchemas: typeof getAllCategorySchemas;
};
export default _default;
//# sourceMappingURL=category-schema.d.ts.map