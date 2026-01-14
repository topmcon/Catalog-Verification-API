/**
 * Verification Analytics Routes
 * API endpoints for analytics, trends, and ML training data export
 */

import { Router } from 'express';
import { verificationAnalyticsController } from '../controllers/verification-analytics.controller';

const router = Router();

// Dashboard - all metrics in one call
router.get('/dashboard', (req, res) => verificationAnalyticsController.getDashboard(req, res));

// System health metrics
router.get('/health', (req, res) => verificationAnalyticsController.getSystemHealth(req, res));

// Field-level metrics
router.get('/fields', (req, res) => verificationAnalyticsController.getFieldMetrics(req, res));

// Problematic fields (low agreement)
router.get('/problems', (req, res) => verificationAnalyticsController.getProblematicFields(req, res));

// AI provider comparison
router.get('/ai-comparison', (req, res) => verificationAnalyticsController.getAIComparison(req, res));

// Category performance
router.get('/categories', (req, res) => verificationAnalyticsController.getCategoryPerformance(req, res));

// Daily trends
router.get('/trends', (req, res) => verificationAnalyticsController.getDailyTrends(req, res));

// Disagreement examples for review
router.get('/disagreements', (req, res) => verificationAnalyticsController.getDisagreements(req, res));

// Export training data
router.get('/export/training', (req, res) => verificationAnalyticsController.exportTrainingData(req, res));

export default router;
