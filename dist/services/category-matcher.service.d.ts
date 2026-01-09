/**
 * Category Matcher Service
 * Matches incoming product data to the correct category schema
 */
export declare const CATEGORY_KEYWORDS: Record<string, string[]>;
export interface CategoryMatch {
    categoryName: string;
    department: string;
    confidence: number;
    matchedOn: string;
}
/**
 * Match product data to a category
 */
export declare function matchCategory(productData: {
    category?: string;
    subcategory?: string;
    productType?: string;
    title?: string;
    description?: string;
}): CategoryMatch | null;
/**
 * Get all available categories
 */
export declare function getAllCategories(): Array<{
    name: string;
    department: string;
}>;
declare const _default: {
    matchCategory: typeof matchCategory;
    getAllCategories: typeof getAllCategories;
};
export default _default;
//# sourceMappingURL=category-matcher.service.d.ts.map