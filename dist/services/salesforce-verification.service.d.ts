/**
 * Salesforce Verification Service
 * Orchestrates the dual-AI consensus workflow for verifying Salesforce product data
 *
 * WORKFLOW:
 * 1. Receive raw Salesforce data
 * 2. Determine product category
 * 3. Get category-specific schema (Primary, Top 5, Top 15, Additional attributes)
 * 4. Send to BOTH AIs independently (OpenAI & xAI)
 * 5. Each AI:
 *    - Cleans/validates the data
 *    - Researches missing values
 *    - Returns their verified results
 * 6. Compare AI results for CONSENSUS
 * 7. Only AGREED values become verified
 * 8. Discrepancies trigger retry or manual review
 * 9. Build final response payload for Salesforce
 */
import { SalesforceIncomingProduct, SalesforceVerificationResponse } from '../types/salesforce.types';
/**
 * Main verification function
 */
export declare function verifyProduct(rawProduct: SalesforceIncomingProduct, sessionId: string): Promise<SalesforceVerificationResponse>;
declare const _default: {
    verifyProduct: typeof verifyProduct;
};
export default _default;
export declare const salesforceVerificationService: {
    verifyProduct: typeof verifyProduct;
};
//# sourceMappingURL=salesforce-verification.service.d.ts.map