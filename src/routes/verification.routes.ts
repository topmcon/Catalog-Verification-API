import { Router } from 'express';
import { verificationController } from '../controllers';
import { asyncHandler, validate, verificationRequestSchema, exportRequestSchema } from '../middleware';

const router = Router();

/**
 * @route   POST /api/verify
 * @desc    Verify product catalog data
 * @access  Protected
 */
router.post(
  '/',
  validate(verificationRequestSchema),
  asyncHandler(verificationController.verify)
);

/**
 * @route   GET /api/verify/session/:sessionId
 * @desc    Get verification session status
 * @access  Protected
 */
router.get(
  '/session/:sessionId',
  asyncHandler(verificationController.getSessionStatus)
);

/**
 * @route   GET /api/verify/session/:sessionId/products
 * @desc    Get products from a verification session
 * @access  Protected
 */
router.get(
  '/session/:sessionId/products',
  asyncHandler(verificationController.getSessionProducts)
);

/**
 * @route   GET /api/verify/session/:sessionId/logs
 * @desc    Get audit logs for a verification session
 * @access  Protected
 */
router.get(
  '/session/:sessionId/logs',
  asyncHandler(verificationController.getSessionLogs)
);

/**
 * @route   POST /api/verify/export
 * @desc    Export verified products to Salesforce
 * @access  Protected
 */
router.post(
  '/export',
  validate(exportRequestSchema),
  asyncHandler(verificationController.exportToSalesforce)
);

export default router;
