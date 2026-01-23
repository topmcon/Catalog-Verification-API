/**
 * Failed Match Log Routes
 * 
 * API routes for querying and managing failed attribute match logs
 */

import { Router } from 'express';
import * as failedMatchController from '../controllers/failed-match.controller';

const router = Router();

// Statistics
router.get('/stats', failedMatchController.getStats);

// Query endpoints
router.get('/', failedMatchController.queryFailedMatches);
router.get('/near-misses', failedMatchController.getNearMisses);
router.get('/top-unresolved', failedMatchController.getTopUnresolved);
router.get('/export', failedMatchController.exportMatches);

// Product/Session specific
router.get('/product/:sf_catalog_id', failedMatchController.getByProduct);
router.get('/session/:session_id', failedMatchController.getBySession);

// Resolution
router.post('/resolve/:matchType/:source/:attemptedValue', failedMatchController.resolveMatch);
router.post('/bulk-resolve', failedMatchController.bulkResolve);

export default router;
