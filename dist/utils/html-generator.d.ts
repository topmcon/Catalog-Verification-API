import { UnmatchedAttribute } from '../types/product.types';
/**
 * HTML Table Generator
 * Creates HTML tables for unmatched/additional attributes
 */
export interface HtmlTableOptions {
    includeStyles?: boolean;
    tableClass?: string;
    headerClass?: string;
    cellClass?: string;
    alternateRowClass?: string;
    emptyMessage?: string;
}
/**
 * Generate HTML table from additional attributes
 */
export declare function generateAttributeTable(attributes: Record<string, unknown>, options?: HtmlTableOptions): string;
/**
 * Generate HTML table from array of unmatched attributes
 */
export declare function generateUnmatchedAttributeTable(attributes: UnmatchedAttribute[], options?: HtmlTableOptions): string;
/**
 * Format attribute name for display (camelCase/snake_case to Title Case)
 */
export declare function formatAttributeName(name: string): string;
/**
 * Format attribute value for display
 */
export declare function formatAttributeValue(value: unknown): string;
/**
 * Generate a complete HTML document with the attribute table
 */
export declare function generateAttributeTableDocument(productName: string, attributes: Record<string, unknown>): string;
declare const _default: {
    generateAttributeTable: typeof generateAttributeTable;
    generateUnmatchedAttributeTable: typeof generateUnmatchedAttributeTable;
    generateAttributeTableDocument: typeof generateAttributeTableDocument;
    formatAttributeName: typeof formatAttributeName;
    formatAttributeValue: typeof formatAttributeValue;
};
export default _default;
//# sourceMappingURL=html-generator.d.ts.map