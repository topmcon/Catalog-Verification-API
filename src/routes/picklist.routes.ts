/**
 * Picklist Routes
 * API endpoints for SF picklist management
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

// Matching endpoints (for testing)
router.post('/match/brand', picklistController.matchBrand.bind(picklistController));
router.post('/match/category', picklistController.matchCategory.bind(picklistController));

// Mismatch review
router.get('/mismatches', picklistController.getMismatches.bind(picklistController));

// Admin operations
router.post('/reload', picklistController.reloadPicklists.bind(picklistController));

export default router;
