/**
 * Product Enrichment Service
 * Core service that orchestrates the data enrichment workflow:
 * 1. Match product to category
 * 2. Get required attributes for category
 * 3. Use source data FIRST
 * 4. AI fills gaps
 * 5. Generate standardized title/description
 */
import { CategoryMatch } from './category-matcher.service';
import { CategoryAttributeConfig } from '../config/category-attributes';
export interface RawProductData {
    [key: string]: any;
}
export interface EnrichedProduct {
    category: CategoryMatch;
    categorySchema?: CategoryAttributeConfig;
    title: string;
    description: string;
    attributes: Record<string, any>;
    missingAttributes: string[];
    aiGenerated: string[];
    sourceDataUsed: string[];
    confidence: number;
    taxonomyTiers?: {
        tier1: string;
        tier2: string;
        tier3: string;
        tier4?: string;
    };
}
export interface EnrichmentResult {
    success: boolean;
    product?: EnrichedProduct;
    error?: string;
}
/**
 * Main enrichment function
 */
export declare function enrichProduct(rawData: RawProductData): Promise<EnrichmentResult>;
declare const _default: {
    enrichProduct: typeof enrichProduct;
};
export default _default;
//# sourceMappingURL=enrichment.service.d.ts.map