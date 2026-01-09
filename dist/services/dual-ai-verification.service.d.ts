/**
 * DUAL AI VERIFICATION SERVICE
 * =============================
 * Workflow:
 * 1. Raw Salesforce data comes in
 * 2. Send to BOTH AIs (OpenAI AND xAI) independently
 * 3. Each AI determines category and maps attributes
 * 4. Compare results for consensus
 * 5. If disagree, re-analyze with context
 * 6. Research missing data if needed
 * 7. Clean and enhance customer-facing text
 * 8. Return verified response to Salesforce
 */
import { SalesforceIncomingProduct, SalesforceVerificationResponse } from '../types/salesforce.types';
export declare function verifyProductWithDualAI(rawProduct: SalesforceIncomingProduct, sessionId?: string, requestContext?: {
    endpoint: string;
    method: string;
    ipAddress: string;
    userAgent: string;
    apiKey?: string;
}): Promise<SalesforceVerificationResponse>;
declare const _default: {
    verifyProductWithDualAI: typeof verifyProductWithDualAI;
};
export default _default;
export declare const dualAIVerificationService: {
    verifyProductWithDualAI: typeof verifyProductWithDualAI;
};
//# sourceMappingURL=dual-ai-verification.service.d.ts.map