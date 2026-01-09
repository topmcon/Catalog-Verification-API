import { Request, Response, NextFunction } from 'express';
/**
 * API Key Authentication Middleware
 */
export declare function apiKeyAuth(req: Request, _res: Response, next: NextFunction): void;
/**
 * Salesforce Webhook Signature Verification
 * Validates that the request came from Salesforce
 */
export declare function verifySalesforceWebhook(req: Request, _res: Response, next: NextFunction): void;
/**
 * Request Logger Middleware
 */
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
/**
 * Attach request ID middleware
 */
export declare function attachRequestId(req: Request, _res: Response, next: NextFunction): void;
declare global {
    namespace Express {
        interface Request {
            id?: string;
        }
    }
}
declare const _default: {
    apiKeyAuth: typeof apiKeyAuth;
    verifySalesforceWebhook: typeof verifySalesforceWebhook;
    requestLogger: typeof requestLogger;
    attachRequestId: typeof attachRequestId;
};
export default _default;
//# sourceMappingURL=auth.middleware.d.ts.map