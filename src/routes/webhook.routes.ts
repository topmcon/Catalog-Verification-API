import { Router } from 'express';
import { webhookController } from '../controllers';
import { asyncHandler, validate, webhookPayloadSchema, verifySalesforceWebhook, apiKeyAuth } from '../middleware';

const router = Router();

/**
 * @route   POST /api/webhook/salesforce
 * @desc    Handle incoming Salesforce webhook
 * @access  Protected with webhook signature
 */
router.post(
  '/salesforce',
  verifySalesforceWebhook,
  validate(webhookPayloadSchema),
  asyncHandler(webhookController.handleSalesforceWebhook)
);

/**
 * @route   POST /api/webhook/confirm
 * @desc    Receive confirmation from SF that data was saved
 * @access  Protected (apiKeyAuth) — CON-07 hardening. Endpoint had ZERO legitimate
 *          traffic in the platform's entire history (0 sf_save_confirmed audit logs);
 *          SF uses the authenticated /api/verify/salesforce/confirm instead. Was
 *          previously public and accepted unauthenticated writes to AuditLog.
 */
router.post(
  '/confirm',
  apiKeyAuth,
  asyncHandler(webhookController.handleSaveConfirmation)
);

/**
 * @route   GET /api/webhook/status/:sessionId
 * @desc    Get webhook processing status
 * @access  Protected (apiKeyAuth)
 */
router.get(
  '/status/:sessionId',
  apiKeyAuth,
  asyncHandler(webhookController.getWebhookStatus)
);

export default router;
