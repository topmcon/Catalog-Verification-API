import { Request, Response } from 'express';
import { RawProductData, EnrichmentResult } from '../services/enrichment.service';
/**
 * Enrichment Controller
 * Handles product data enrichment requests
 */
export interface EnrichmentRequest {
    products: RawProductData[];
    options?: {
        skipAI?: boolean;
        batchSize?: number;
    };
}
export interface EnrichmentResponse {
    success: boolean;
    sessionId: string;
    totalProducts: number;
    enrichedCount: number;
    failedCount: number;
    results: EnrichmentResult[];
    processingTimeMs: number;
    timestamp: string;
}
/**
 * Process enrichment request
 */
export declare function enrich(req: Request, res: Response): Promise<void>;
/**
 * Enrich a single product (quick endpoint)
 */
export declare function enrichSingle(req: Request, res: Response): Promise<void>;
declare const _default: {
    enrich: typeof enrich;
    enrichSingle: typeof enrichSingle;
};
export default _default;
//# sourceMappingURL=enrichment.controller.d.ts.map