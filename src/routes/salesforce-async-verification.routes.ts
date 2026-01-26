/**
 * Salesforce Async Verification Routes
 */

import { Router } from 'express';
import {
  verifySalesforceAsync,
  getVerificationStatus,
  getQueueStats,
  checkModelNumber,
  acknowledgeReceipt
} from '../controllers/salesforce-async-verification.controller';
import { apiKeyAuth } from '../middleware/auth.middleware';

const router = Router();

// Apply API key validation to all routes
router.use(apiKeyAuth);

/**
 * POST /api/verify/salesforce
 * Main Salesforce verification endpoint - returns immediate acknowledgment
 */
router.post('/salesforce', verifySalesforceAsync);

/**
 * GET /api/verify/salesforce/status/:jobId
 * Check status of a verification job
 */
router.get('/salesforce/status/:jobId', getVerificationStatus);

/**
 * GET /api/verify/salesforce/queue/stats
 * Get queue statistics
 */
router.get('/salesforce/queue/stats', getQueueStats);

/**
 * POST /api/verify/salesforce/model-check
 * Check if model number exists in catalog
 */
router.post('/salesforce/model-check', checkModelNumber);

/**
 * POST /api/verify/salesforce/acknowledge/:jobId
 * Salesforce confirms they received and processed webhook data
 */
router.post('/salesforce/acknowledge/:jobId', acknowledgeReceipt);

export default router;
