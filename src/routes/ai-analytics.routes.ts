/**
 * AI Analytics Routes
 * API endpoints for AI usage tracking, cost analysis, and model performance
 * 
 * These endpoints power the AI Dashboard for monitoring:
 * - Cost per model/provider/task
 * - Success rates and failure patterns
 * - Model performance comparison
 * - Strong/weak points identification
 * - Provider consensus analysis
 */

import { Router } from 'express';
import aiAnalyticsController from '../controllers/ai-analytics.controller';
import { asyncHandler } from '../middleware';

const router = Router();

/**
 * @route   GET /api/ai-analytics/dashboard
 * @desc    Get full AI usage dashboard with all metrics
 * @access  Protected
 * @query   period - Preset period: today, 24h, 7d, 30d, 90d
 * @query   startDate - Custom start date (ISO string)
 * @query   endDate - Custom end date (ISO string)
 */
router.get('/dashboard', asyncHandler(aiAnalyticsController.getAIDashboard));

/**
 * @route   GET /api/ai-analytics/summary
 * @desc    Get overall AI usage summary (calls, costs, success rate)
 * @access  Protected
 */
router.get('/summary', asyncHandler(aiAnalyticsController.getUsageSummary));

/**
 * @route   GET /api/ai-analytics/models
 * @desc    Get performance breakdown by model
 * @access  Protected
 * @returns Model-by-model stats including success rate, latency, cost
 */
router.get('/models', asyncHandler(aiAnalyticsController.getModelPerformance));

/**
 * @route   GET /api/ai-analytics/tasks
 * @desc    Get analytics by task type (verification, vision, search, etc.)
 * @access  Protected
 */
router.get('/tasks', asyncHandler(aiAnalyticsController.getTaskAnalytics));

/**
 * @route   GET /api/ai-analytics/providers
 * @desc    Get provider comparison (OpenAI vs xAI)
 * @access  Protected
 * @returns Head-to-head comparison including agreement rate, win rates
 */
router.get('/providers', asyncHandler(aiAnalyticsController.getProviderComparison));

/**
 * @route   GET /api/ai-analytics/costs
 * @desc    Get cost breakdown over time (for charts)
 * @access  Protected
 * @query   granularity - hour, day, week (default: day)
 */
router.get('/costs', asyncHandler(aiAnalyticsController.getCostOverTime));

/**
 * @route   GET /api/ai-analytics/failures
 * @desc    Get recent AI call failures for debugging
 * @access  Protected
 * @query   limit - Number of records (default: 20, max: 100)
 */
router.get('/failures', asyncHandler(aiAnalyticsController.getRecentFailures));

/**
 * @route   GET /api/ai-analytics/categories
 * @desc    Get category performance analysis
 * @access  Protected
 * @returns Categories with success rates and attention flags
 */
router.get('/categories', asyncHandler(aiAnalyticsController.getCategoryPerformance));

/**
 * @route   GET /api/ai-analytics/pricing
 * @desc    Get current model pricing information
 * @access  Public
 * @returns Pricing per model (input/output per 1M tokens)
 */
router.get('/pricing', asyncHandler(aiAnalyticsController.getModelPricing));

/**
 * @route   GET /api/ai-analytics/insights
 * @desc    Get AI-generated insights about system performance
 * @access  Protected
 * @returns Strong points, weak points, and recommendations
 */
router.get('/insights', asyncHandler(aiAnalyticsController.getInsights));

export default router;
