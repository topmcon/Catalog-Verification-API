import { VerifiedProduct } from '../types/product.types';
import { SalesforceProductRecord } from '../types/api.types';
/**
 * Export verified products to Salesforce
 */
export declare function exportProducts(products: VerifiedProduct[], sessionId: string): Promise<{
    success: boolean;
    successCount: number;
    failedCount: number;
    errors: Array<{
        productId: string;
        error: string;
    }>;
}>;
/**
 * Update existing Salesforce records
 */
export declare function updateProducts(products: Array<{
    id: string;
    data: Partial<SalesforceProductRecord>;
}>): Promise<{
    success: boolean;
    successCount: number;
    failedCount: number;
    errors: Array<{
        id: string;
        error: string;
    }>;
}>;
/**
 * Query products from Salesforce
 */
export declare function queryProducts(soqlQuery: string): Promise<{
    success: boolean;
    records: unknown[];
    error?: string;
}>;
/**
 * Check Salesforce connection health
 */
export declare function healthCheck(): Promise<{
    status: 'up' | 'down';
    latencyMs?: number;
    error?: string;
}>;
/**
 * Disconnect from Salesforce
 */
export declare function disconnect(): Promise<void>;
declare const _default: {
    exportProducts: typeof exportProducts;
    updateProducts: typeof updateProducts;
    queryProducts: typeof queryProducts;
    healthCheck: typeof healthCheck;
    disconnect: typeof disconnect;
};
export default _default;
//# sourceMappingURL=salesforce.service.d.ts.map