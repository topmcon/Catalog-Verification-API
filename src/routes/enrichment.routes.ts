import { Router } from 'express';
import { enrich, enrichSingle } from '../controllers/enrichment.controller';
import { asyncHandler } from '../middleware';

const router = Router();

/**
 * @route POST /api/enrich
 * @desc Enrich multiple products with category-specific attributes
 * @body { products: RawProductData[], options?: { skipAI?: boolean, batchSize?: number } }
 */
router.post('/', asyncHandler(enrich));

/**
 * @route POST /api/enrich/single
 * @desc Enrich a single product (quick endpoint)
 * @body RawProductData - raw product object
 */
router.post('/single', asyncHandler(enrichSingle));

export default router;
