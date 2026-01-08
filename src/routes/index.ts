import { Router } from 'express';
import verificationRoutes from './verification.routes';
import webhookRoutes from './webhook.routes';
import healthRoutes from './health.routes';
import enrichmentRoutes from './enrichment.routes';
import { apiKeyAuth } from '../middleware';

const router = Router();

// Health routes (public)
router.use('/health', healthRoutes);

// API routes (protected)
router.use('/api/verify', apiKeyAuth, verificationRoutes);
router.use('/api/enrich', apiKeyAuth, enrichmentRoutes);
router.use('/api/webhook', webhookRoutes);

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
    },
  });
});

export default router;
