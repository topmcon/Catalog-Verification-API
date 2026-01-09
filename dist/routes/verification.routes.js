"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/verify
 * @desc    Verify product catalog data
 * @access  Protected
 */
router.post('/', (0, middleware_1.validate)(middleware_1.verificationRequestSchema), (0, middleware_1.asyncHandler)(controllers_1.verificationController.verify));
/**
 * @route   POST /api/verify/salesforce
 * @desc    Verify a single Salesforce product using dual AI consensus
 * @access  Protected
 */
router.post('/salesforce', (0, middleware_1.asyncHandler)(controllers_1.verificationController.verifySalesforceProduct));
/**
 * @route   POST /api/verify/salesforce/batch
 * @desc    Batch verify Salesforce products using dual AI consensus
 * @access  Protected
 */
router.post('/salesforce/batch', (0, middleware_1.asyncHandler)(controllers_1.verificationController.verifySalesforceProductBatch));
/**
 * @route   GET /api/verify/session/:sessionId
 * @desc    Get verification session status
 * @access  Protected
 */
router.get('/session/:sessionId', (0, middleware_1.asyncHandler)(controllers_1.verificationController.getSessionStatus));
/**
 * @route   GET /api/verify/session/:sessionId/products
 * @desc    Get products from a verification session
 * @access  Protected
 */
router.get('/session/:sessionId/products', (0, middleware_1.asyncHandler)(controllers_1.verificationController.getSessionProducts));
/**
 * @route   GET /api/verify/session/:sessionId/logs
 * @desc    Get audit logs for a verification session
 * @access  Protected
 */
router.get('/session/:sessionId/logs', (0, middleware_1.asyncHandler)(controllers_1.verificationController.getSessionLogs));
/**
 * @route   POST /api/verify/export
 * @desc    Export verified products to Salesforce
 * @access  Protected
 */
router.post('/export', (0, middleware_1.validate)(middleware_1.exportRequestSchema), (0, middleware_1.asyncHandler)(controllers_1.verificationController.exportToSalesforce));
exports.default = router;
//# sourceMappingURL=verification.routes.js.map