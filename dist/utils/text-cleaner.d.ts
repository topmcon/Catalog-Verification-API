/**
 * Text Cleaner Utility
 * Cleans, formats, and enhances customer-facing text content
 */
/**
 * Clean and fix encoding issues in text
 */
export declare function cleanEncodingIssues(text: string | undefined | null): string;
/**
 * Fix brand name to proper format
 */
export declare function fixBrandName(brand: string | undefined | null): string;
/**
 * Format a product title to be clean and professional
 */
export declare function formatTitle(title: string | undefined | null, brand?: string, _category?: string): string;
/**
 * Format and clean a product description
 */
export declare function formatDescription(description: string | undefined | null): string;
/**
 * Extract and format a features list from description text
 */
export declare function extractFeatures(description: string | undefined | null, existingFeatures?: string): string[];
/**
 * Generate HTML feature list from features array
 */
export declare function generateFeaturesHtml(features: string[]): string;
/**
 * Convert text to proper title case
 */
export declare function toTitleCase(text: string): string;
/**
 * Format a single sentence
 */
export declare function formatSentence(sentence: string): string;
/**
 * Fix common grammar issues
 */
export declare function fixGrammar(text: string): string;
/**
 * Escape HTML special characters
 */
export declare function escapeHtml(text: string): string;
/**
 * Clean all customer-facing text in a product response
 */
export interface CustomerFacingText {
    title: string;
    description: string;
    features: string[];
    featuresHtml: string;
    brand: string;
}
export declare function cleanCustomerFacingText(title: string | undefined | null, description: string | undefined | null, existingFeatures: string | undefined | null, brand: string | undefined | null, category?: string): CustomerFacingText;
declare const _default: {
    cleanEncodingIssues: typeof cleanEncodingIssues;
    fixBrandName: typeof fixBrandName;
    formatTitle: typeof formatTitle;
    formatDescription: typeof formatDescription;
    extractFeatures: typeof extractFeatures;
    generateFeaturesHtml: typeof generateFeaturesHtml;
    toTitleCase: typeof toTitleCase;
    formatSentence: typeof formatSentence;
    fixGrammar: typeof fixGrammar;
    escapeHtml: typeof escapeHtml;
    cleanCustomerFacingText: typeof cleanCustomerFacingText;
};
export default _default;
//# sourceMappingURL=text-cleaner.d.ts.map