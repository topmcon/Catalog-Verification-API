import { Request, Response } from 'express';
/**
 * Webhook Controller
 * Handles incoming webhooks from Salesforce
 */
/**
 * Process Salesforce webhook
 */
export declare function handleSalesforceWebhook(req: Request, res: Response): Promise<void>;
/**
 * Get webhook processing status
 */
export declare function getWebhookStatus(req: Request, res: Response): Promise<void>;
declare const _default: {
    handleSalesforceWebhook: typeof handleSalesforceWebhook;
    getWebhookStatus: typeof getWebhookStatus;
};
export default _default;
//# sourceMappingURL=webhook.controller.d.ts.map