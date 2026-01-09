import { RawProduct, CleanedProduct, RawProductAttribute } from '../types/product.types';
/**
 * Data Cleaner Utility
 * Handles normalization and cleaning of raw product data
 */
/**
 * Clean and normalize a single product
 */
export declare function cleanProduct(rawProduct: RawProduct): CleanedProduct;
/**
 * Clean multiple products in batch
 */
export declare function cleanProducts(rawProducts: RawProduct[]): CleanedProduct[];
/**
 * Normalize a string value
 */
export declare function normalizeString(value: unknown): string | undefined;
/**
 * Normalize a number value
 */
export declare function normalizeNumber(value: unknown): number | undefined;
/**
 * Normalize product status
 */
export declare function normalizeStatus(value: unknown): string;
/**
 * Normalize URL
 */
export declare function normalizeUrl(value: unknown): string | undefined;
/**
 * Generate a SKU if not provided
 */
export declare function generateSKU(product: RawProduct): string;
/**
 * Extract attributes that don't match verified fields
 */
export declare function extractAdditionalAttributes(rawProduct: RawProduct): RawProductAttribute;
/**
 * Convert weight between units
 */
export declare function convertWeight(value: number, fromUnit: string, toUnit: string): number;
/**
 * Sanitize HTML content
 */
export declare function sanitizeHtml(value: string): string;
declare const _default: {
    cleanProduct: typeof cleanProduct;
    cleanProducts: typeof cleanProducts;
    normalizeString: typeof normalizeString;
    normalizeNumber: typeof normalizeNumber;
    normalizeStatus: typeof normalizeStatus;
    normalizeUrl: typeof normalizeUrl;
    generateSKU: typeof generateSKU;
    extractAdditionalAttributes: typeof extractAdditionalAttributes;
    convertWeight: typeof convertWeight;
    sanitizeHtml: typeof sanitizeHtml;
};
export default _default;
//# sourceMappingURL=data-cleaner.d.ts.map