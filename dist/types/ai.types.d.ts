/**
 * AI Service Types and Interfaces
 */
import { CleanedProduct, ProductCorrection } from './product.types';
export type AIProvider = 'openai' | 'xai';
export interface AIValidationRequest {
    product: CleanedProduct;
    verifiedFieldsSchema: string[];
    sessionId: string;
}
export interface AIValidationResult {
    provider: AIProvider;
    productId: string;
    isValid: boolean;
    confidence: number;
    verifiedFields: Record<string, unknown>;
    corrections: ProductCorrection[];
    suggestions: string[];
    rawResponse: string;
    processingTimeMs: number;
    error?: string;
}
export interface ConsensusResult {
    agreed: boolean;
    agreementScore: number;
    mergedResult: Record<string, unknown>;
    corrections: ProductCorrection[];
    discrepancies: ConsensusDiscrepancy[];
    retryCount: number;
    finalizedAt: Date;
}
export interface ConsensusDiscrepancy {
    field: string;
    openaiValue: unknown;
    xaiValue: unknown;
    resolved: boolean;
    resolution?: unknown;
    resolutionSource?: AIProvider | 'manual';
}
export interface AIComparisonMetrics {
    jaccardSimilarity: number;
    fieldMatchPercentage: number;
    valueMatchPercentage: number;
    overallScore: number;
}
export interface RetryContext {
    attemptNumber: number;
    previousDiscrepancies: ConsensusDiscrepancy[];
    previousResults: {
        openai: AIValidationResult;
        xai: AIValidationResult;
    };
}
//# sourceMappingURL=ai.types.d.ts.map