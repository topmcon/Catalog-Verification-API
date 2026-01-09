"use strict";
/**
 * Analytics Routes
 * API endpoints for accessing tracking data and analytics
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = __importDefault(require("../controllers/analytics.controller"));
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get full dashboard with all key metrics
 * @access  Protected
 * @query   period - Preset period: today, 24h, 7d, 30d, 90d
 * @query   startDate - Custom start date (ISO string)
 * @query   endDate - Custom end date (ISO string)
 */
router.get('/dashboard', (0, middleware_1.asyncHandler)(analytics_controller_1.default.getDashboard));
/**
 * @route   GET /api/analytics/performance
 * @desc    Get overall performance summary
 * @access  Protected
 */
router.get('/performance', (0, middleware_1.asyncHandler)(analytics_controller_1.default.getPerformance));
/**
 * @route   GET /api/analytics/ai-providers
 * @desc    Get AI provider comparison statistics
 * @access  Protected
 */
router.get('/ai-providers', (0, middleware_1.asyncHandler)(analytics_controller_1.default.getAIProviderStats));
/**
 * @route   GET /api/analytics/consensus
 * @desc    Get consensus statistics and trends
 * @access  Protected
 */
router.get('/consensus', (0, middleware_1.asyncHandler)(analytics_controller_1.default.getConsensusStats));
/**
 * @route   GET /api/analytics/categories
 * @desc    Get category performance breakdown
 * @access  Protected
 * @query   limit - Number of categories to return (default: 20)
 */
router.get('/categories', (0, middleware_1.asyncHandler)(analytics_controller_1.default.getCategoryStats));
/**
 * @route   GET /api/analytics/brands
 * @desc    Get brand performance breakdown
 * @access  Protected
 * @query   limit - Number of brands to return (default: 20)
 */
router.get('/brands', (0, middleware_1.asyncHandler)(analytics_controller_1.default.getBrandStats));
/**
 * @route   GET /api/analytics/issues
 * @desc    Get issue trends and analysis
 * @access  Protected
 */
router.get('/issues', (0, middleware_1.asyncHandler)(analytics_controller_1.default.getIssueTrends));
/**
 * @route   GET /api/analytics/disagreements
 * @desc    Get detailed AI disagreement analysis
 * @access  Protected
 */
router.get('/disagreements', (0, middleware_1.asyncHandler)(analytics_controller_1.default.getDisagreementAnalysis));
/**
 * @route   GET /api/analytics/timeseries
 * @desc    Get time series data for charts
 * @access  Protected
 * @query   interval - Aggregation interval: hour, day, week (default: day)
 */
router.get('/timeseries', (0, middleware_1.asyncHandler)(analytics_controller_1.default.getTimeSeries));
/**
 * @route   GET /api/analytics/failures
 * @desc    Get recent failures for review
 * @access  Protected
 * @query   limit - Number of records to return (default: 50)
 */
router.get('/failures', (0, middleware_1.asyncHandler)(analytics_controller_1.default.getRecentFailures));
/**
 * @route   GET /api/analytics/low-confidence
 * @desc    Get low confidence verifications for review
 * @access  Protected
 * @query   threshold - Confidence threshold (default: 0.7)
 * @query   limit - Number of records to return (default: 50)
 */
router.get('/low-confidence', (0, middleware_1.asyncHandler)(analytics_controller_1.default.getLowConfidence));
/**
 * @route   GET /api/analytics/search
 * @desc    Search and filter API calls
 * @access  Protected
 * @query   status - Filter by status: success, partial, failed
 * @query   category - Filter by category
 * @query   brand - Filter by brand (partial match)
 * @query   catalogId - Filter by SF Catalog ID
 * @query   minScore - Minimum verification score
 * @query   maxScore - Maximum verification score
 * @query   issueType - Filter by issue type
 * @query   page - Page number (default: 1)
 * @query   limit - Records per page (default: 50, max: 100)
 */
router.get('/search', (0, middleware_1.asyncHandler)(analytics_controller_1.default.searchCalls));
/**
 * @route   GET /api/analytics/tracking/:trackingId
 * @desc    Get specific tracking record by ID
 * @access  Protected
 */
router.get('/tracking/:trackingId', (0, middleware_1.asyncHandler)(analytics_controller_1.default.getTrackingById));
/**
 * @route   GET /api/analytics/session/:sessionId
 * @desc    Get all tracking records for a session
 * @access  Protected
 */
router.get('/session/:sessionId', (0, middleware_1.asyncHandler)(analytics_controller_1.default.getTrackingBySession));
/**
 * @route   GET /api/analytics/catalog/:catalogId
 * @desc    Get all tracking records for a catalog item
 * @access  Protected
 */
router.get('/catalog/:catalogId', (0, middleware_1.asyncHandler)(analytics_controller_1.default.getTrackingByCatalog));
/**
 * @route   GET /api/analytics/export
 * @desc    Export tracking data
 * @access  Protected
 * @query   format - Export format: json, csv (default: json)
 * @query   limit - Max records to export (default: 1000, max: 10000)
 */
router.get('/export', (0, middleware_1.asyncHandler)(analytics_controller_1.default.exportData));
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map