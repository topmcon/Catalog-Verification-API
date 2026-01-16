import { Router } from 'express';
import verificationRoutes from './verification.routes';
import webhookRoutes from './webhook.routes';
import healthRoutes from './health.routes';
import enrichmentRoutes from './enrichment.routes';
import analyticsRoutes from './analytics.routes';
import verificationAnalyticsRoutes from './verification-analytics.routes';
import picklistRoutes from './picklist.routes';
import catalogIndexRoutes from './catalog-index.routes';
import aiAnalyticsRoutes from './ai-analytics.routes';
import { apiKeyAuth } from '../middleware';

const router = Router();

// Health routes (public)
router.use('/health', healthRoutes);

// API routes (protected)
router.use('/api/verify', apiKeyAuth, verificationRoutes);
router.use('/api/enrich', apiKeyAuth, enrichmentRoutes);
router.use('/api/webhook', webhookRoutes);
router.use('/api/analytics', apiKeyAuth, analyticsRoutes);
router.use('/api/verification-analytics', apiKeyAuth, verificationAnalyticsRoutes);
router.use('/api/picklists', apiKeyAuth, picklistRoutes);
router.use('/api/catalog-index', apiKeyAuth, catalogIndexRoutes);
router.use('/api/ai-analytics', apiKeyAuth, aiAnalyticsRoutes);

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
      aiAnalytics: '/api/ai-analytics',
      catalogIndex: '/api/catalog-index',
    },
  });
});

export default router;
