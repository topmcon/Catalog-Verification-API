import { Router } from 'express';
import responseQualityController from '../controllers/response-quality.controller';

const router = Router();

/**
 * Response Quality Analytics Routes
 * Track and analyze inconclusive/vague AI responses
 */

// GET /api/response-quality/trends/by-field?category=Dryer&fieldType=top_filter
router.get('/trends/by-field', responseQualityController.getTrendsByField);

// GET /api/response-quality/trends/by-category?startDate=2026-02-01&endDate=2026-02-05
router.get('/trends/by-category', responseQualityController.getTrendsByCategory);

// GET /api/response-quality/summary?startDate=2026-02-01
router.get('/summary', responseQualityController.getSummary);

// GET /api/response-quality/recommendations?category=Dryer
router.get('/recommendations', responseQualityController.getRecommendations);

export default router;
