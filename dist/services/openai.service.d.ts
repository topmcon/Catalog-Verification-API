import { CleanedProduct } from '../types/product.types';
import { AIValidationResult, AIValidationRequest, RetryContext } from '../types/ai.types';
/**
 * Validate a product using OpenAI
 */
export declare function validateProduct(request: AIValidationRequest, retryContext?: RetryContext): Promise<AIValidationResult>;
/**
 * Validate multiple products in batch
 */
export declare function validateProducts(products: CleanedProduct[], sessionId: string): Promise<AIValidationResult[]>;
/**
 * Check if OpenAI service is available
 */
export declare function healthCheck(): Promise<{
    status: 'up' | 'down';
    latencyMs?: number;
    error?: string;
}>;
declare const _default: {
    validateProduct: typeof validateProduct;
    validateProducts: typeof validateProducts;
    healthCheck: typeof healthCheck;
};
export default _default;
//# sourceMappingURL=openai.service.d.ts.map