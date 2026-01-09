"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enrichment_controller_1 = require("../controllers/enrichment.controller");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * @route POST /api/enrich
 * @desc Enrich multiple products with category-specific attributes
 * @body { products: RawProductData[], options?: { skipAI?: boolean, batchSize?: number } }
 */
router.post('/', (0, middleware_1.asyncHandler)(enrichment_controller_1.enrich));
/**
 * @route POST /api/enrich/single
 * @desc Enrich a single product (quick endpoint)
 * @body RawProductData - raw product object
 */
router.post('/single', (0, middleware_1.asyncHandler)(enrichment_controller_1.enrichSingle));
exports.default = router;
//# sourceMappingURL=enrichment.routes.js.map