"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verification_routes_1 = __importDefault(require("./verification.routes"));
const webhook_routes_1 = __importDefault(require("./webhook.routes"));
const health_routes_1 = __importDefault(require("./health.routes"));
const enrichment_routes_1 = __importDefault(require("./enrichment.routes"));
const analytics_routes_1 = __importDefault(require("./analytics.routes"));
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// Health routes (public)
router.use('/health', health_routes_1.default);
// API routes (protected)
router.use('/api/verify', middleware_1.apiKeyAuth, verification_routes_1.default);
router.use('/api/enrich', middleware_1.apiKeyAuth, enrichment_routes_1.default);
router.use('/api/webhook', webhook_routes_1.default);
router.use('/api/analytics', middleware_1.apiKeyAuth, analytics_routes_1.default);
// Root endpoint
router.get('/', (_req, res) => {
    res.json({
        name: 'Catalog Verification & Enrichment API',
        version: '2.0.0',
        documentation: '/api/docs',
        health: '/health',
        endpoints: {
            verify: '/api/verify',
            enrich: '/api/enrich',
            enrichSingle: '/api/enrich/single',
            analytics: '/api/analytics',
        },
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map