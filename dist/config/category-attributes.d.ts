/**
 * Category-Specific Attribute Schemas
 * Contains the required/optional attributes for each product category
 * Based on the provided category schema JSON
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
/**
 * APPLIANCES DEPARTMENT
 */
export declare const REFRIGERATOR_SCHEMA: CategoryAttributeConfig;
export declare const DISHWASHER_SCHEMA: CategoryAttributeConfig;
export declare const RANGE_SCHEMA: CategoryAttributeConfig;
export declare const OVEN_SCHEMA: CategoryAttributeConfig;
export declare const COOKTOP_SCHEMA: CategoryAttributeConfig;
export declare const MICROWAVE_SCHEMA: CategoryAttributeConfig;
export declare const RANGE_HOOD_SCHEMA: CategoryAttributeConfig;
export declare const WASHER_SCHEMA: CategoryAttributeConfig;
export declare const DRYER_SCHEMA: CategoryAttributeConfig;
export declare const FREEZER_SCHEMA: CategoryAttributeConfig;
/**
 * PLUMBING & BATH DEPARTMENT
 */
export declare const KITCHEN_SINK_SCHEMA: CategoryAttributeConfig;
export declare const KITCHEN_FAUCET_SCHEMA: CategoryAttributeConfig;
export declare const BATHROOM_FAUCET_SCHEMA: CategoryAttributeConfig;
export declare const TOILET_SCHEMA: CategoryAttributeConfig;
export declare const BATHTUB_SCHEMA: CategoryAttributeConfig;
/**
 * LIGHTING DEPARTMENT
 */
export declare const CHANDELIER_SCHEMA: CategoryAttributeConfig;
export declare const PENDANT_SCHEMA: CategoryAttributeConfig;
export declare const CEILING_FAN_SCHEMA: CategoryAttributeConfig;
/**
 * Master category schema map
 */
export declare const CATEGORY_SCHEMAS: Record<string, CategoryAttributeConfig>;
/**
 * Get category schema by name
 */
export declare function getCategorySchema(categoryName: string): CategoryAttributeConfig | null;
/**
 * Get required attributes for a category
 */
export declare function getRequiredAttributes(categoryName: string): string[];
declare const _default: {
    CATEGORY_SCHEMAS: Record<string, CategoryAttributeConfig>;
    getCategorySchema: typeof getCategorySchema;
    getRequiredAttributes: typeof getRequiredAttributes;
};
export default _default;
//# sourceMappingURL=category-attributes.d.ts.map