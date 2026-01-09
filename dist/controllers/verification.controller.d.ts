import { Request, Response } from 'express';
/**
 * Verification Controller
 * Handles product verification requests
 */
/**
 * Process verification request
 */
export declare function verify(req: Request, res: Response): Promise<void>;
/**
 * Get session status
 */
export declare function getSessionStatus(req: Request, res: Response): Promise<void>;
/**
 * Get session products
 */
export declare function getSessionProducts(req: Request, res: Response): Promise<void>;
/**
 * Export verified products to Salesforce
 */
export declare function exportToSalesforce(req: Request, res: Response): Promise<void>;
/**
 * Get session audit logs
 */
export declare function getSessionLogs(req: Request, res: Response): Promise<void>;
/**
 * Verify Salesforce product - Dual AI verification endpoint
 * Takes raw Salesforce data, runs it through both OpenAI and xAI independently,
 * and returns verified data where both AIs agree
 *
 * WORKFLOW:
 * 1. Raw data goes to BOTH AIs (OpenAI + xAI) in parallel
 * 2. Each AI determines the category and maps data to attributes
 * 3. AIs compare results to reach consensus
 * 4. If missing data, AIs research independently
 * 5. Return final agreed-upon verified data
 */
export declare function verifySalesforceProduct(req: Request, res: Response): Promise<void>;
/**
 * Batch verify Salesforce products
 */
export declare function verifySalesforceProductBatch(req: Request, res: Response): Promise<void>;
declare const _default: {
    verify: typeof verify;
    getSessionStatus: typeof getSessionStatus;
    getSessionProducts: typeof getSessionProducts;
    exportToSalesforce: typeof exportToSalesforce;
    getSessionLogs: typeof getSessionLogs;
    verifySalesforceProduct: typeof verifySalesforceProduct;
    verifySalesforceProductBatch: typeof verifySalesforceProductBatch;
};
export default _default;
//# sourceMappingURL=verification.controller.d.ts.map