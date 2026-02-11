/**
 * Picklist Routes
 * API endpoints for SF picklist management and sync
 */

import { Router } from 'express';
import picklistController from '../controllers/picklist.controller';

const router = Router();

// Stats and listing
router.get('/stats', picklistController.getStats.bind(picklistController));
router.get('/brands', picklistController.getBrands.bind(picklistController));
router.get('/categories', picklistController.getCategories.bind(picklistController));
router.get('/styles', picklistController.getStyles.bind(picklistController));
router.get('/attributes', picklistController.getAttributes.bind(picklistController));
router.get('/types', picklistController.getTypes.bind(picklistController));
router.get('/departments', picklistController.getDepartments.bind(picklistController));
router.get('/families', picklistController.getFamilies.bind(picklistController));

// Get by ID endpoints
router.get('/brands/:id', picklistController.getBrandById.bind(picklistController));
router.get('/categories/:id', picklistController.getCategoryById.bind(picklistController));

// Add new picklist items (single)
router.post('/brands', picklistController.addBrand.bind(picklistController));
router.post('/categories', picklistController.addCategory.bind(picklistController));
router.post('/styles', picklistController.addStyle.bind(picklistController));
router.post('/attributes', picklistController.addAttribute.bind(picklistController));

// Bulk sync from Salesforce - SF calls this after adding new picklist options
// NOTE: Syncs are now HELD for review, not auto-applied
// POST /api/picklists/sync → Returns 202 with pending_id for review
router.post('/sync', picklistController.syncPicklists.bind(picklistController));

// ============================================================
// PENDING SYNC REVIEW ENDPOINTS (Hold Bucket System)
// ============================================================

// List pending syncs awaiting review
// GET /api/picklists/sync/pending?status=pending|approved|rejected|all&limit=20
router.get('/sync/pending', picklistController.getPendingSyncs.bind(picklistController));

// Get specific pending sync details
// GET /api/picklists/sync/pending/:pendingId
router.get('/sync/pending/:pendingId', picklistController.getPendingSync.bind(picklistController));

// Approve and apply a pending sync
// POST /api/picklists/sync/pending/:pendingId/approve
// Body: { reviewed_by?: string, notes?: string }
router.post('/sync/pending/:pendingId/approve', picklistController.approvePendingSync.bind(picklistController));

// Reject a pending sync (discard without applying)
// POST /api/picklists/sync/pending/:pendingId/reject
// Body: { reviewed_by?: string, notes?: string }
router.post('/sync/pending/:pendingId/reject', picklistController.rejectPendingSync.bind(picklistController));

// Sync audit logs - view history of all applied sync operations
router.get('/sync/logs', picklistController.getSyncLogs.bind(picklistController));
router.get('/sync/logs/:syncId', picklistController.getSyncLogById.bind(picklistController));

// Matching endpoints (for testing)
router.post('/match/brand', picklistController.matchBrand.bind(picklistController));
router.post('/match/category', picklistController.matchCategory.bind(picklistController));

// Mismatch review (persisted in MongoDB)
router.get('/mismatches', picklistController.getMismatches.bind(picklistController));
router.get('/mismatches/stats', picklistController.getMismatchStats.bind(picklistController));
router.post('/mismatches/:type/:value/resolve', picklistController.resolveMismatch.bind(picklistController));

// Admin operations
router.post('/reload', picklistController.reloadPicklists.bind(picklistController));

export default router;
