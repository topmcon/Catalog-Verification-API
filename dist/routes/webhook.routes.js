"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/webhook/salesforce
 * @desc    Handle incoming Salesforce webhook
 * @access  Protected with webhook signature
 */
router.post('/salesforce', middleware_1.verifySalesforceWebhook, (0, middleware_1.validate)(middleware_1.webhookPayloadSchema), (0, middleware_1.asyncHandler)(controllers_1.webhookController.handleSalesforceWebhook));
/**
 * @route   GET /api/webhook/status/:sessionId
 * @desc    Get webhook processing status
 * @access  Protected
 */
router.get('/status/:sessionId', (0, middleware_1.asyncHandler)(controllers_1.webhookController.getWebhookStatus));
exports.default = router;
//# sourceMappingURL=webhook.routes.js.map