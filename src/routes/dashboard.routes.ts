import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

/**
 * Dashboard Analytics Routes
 */

// Main dashboard metrics
router.get('/dashboard', dashboardController.getDashboardMetrics);

// Field analytics
router.get('/fields/missing', dashboardController.getMissingFieldsAnalysis);
router.get('/fields/population', dashboardController.getFieldPopulationStats);

// Research analytics
router.get('/research/effectiveness', dashboardController.getResearchEffectiveness);

// Error analytics
router.get('/errors/timeline', dashboardController.getErrorTimeline);

// Category analytics
router.get('/category/confusion', dashboardController.getCategoryConfusionMatrix);

// System health
router.get('/health', dashboardController.getSystemHealth);
router.post('/circuit-breaker/reset', dashboardController.resetCircuitBreaker);

export default router;
