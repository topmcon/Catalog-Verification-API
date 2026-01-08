import { Router } from 'express';
import { webhookController } from '../controllers';
import { asyncHandler, validate, webhookPayloadSchema, verifySalesforceWebhook } from '../middleware';

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
 * @route   GET /api/webhook/status/:sessionId
 * @desc    Get webhook processing status
 * @access  Protected
 */
router.get(
  '/status/:sessionId',
  asyncHandler(webhookController.getWebhookStatus)
);

export default router;
