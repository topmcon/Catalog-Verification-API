"use strict";
/**
 * Analytics Controller
 * Handles API endpoints for viewing tracking data and analytics
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = getDashboard;
exports.getPerformance = getPerformance;
exports.getAIProviderStats = getAIProviderStats;
exports.getConsensusStats = getConsensusStats;
exports.getCategoryStats = getCategoryStats;
exports.getBrandStats = getBrandStats;
exports.getIssueTrends = getIssueTrends;
exports.getDisagreementAnalysis = getDisagreementAnalysis;
exports.getTimeSeries = getTimeSeries;
exports.getRecentFailures = getRecentFailures;
exports.getLowConfidence = getLowConfidence;
exports.searchCalls = searchCalls;
exports.getTrackingById = getTrackingById;
exports.getTrackingBySession = getTrackingBySession;
exports.getTrackingByCatalog = getTrackingByCatalog;
exports.exportData = exportData;
const analytics_service_1 = __importDefault(require("../services/analytics.service"));
const tracking_service_1 = __importDefault(require("../services/tracking.service"));
const api_tracker_model_1 = require("../models/api-tracker.model");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Parse date range from query parameters
 */
function parseDateRange(req) {
    const { startDate, endDate, period } = req.query;
    // Handle preset periods
    if (period) {
        const now = new Date();
        let start;
        switch (period) {
            case 'today':
                start = new Date(now.setHours(0, 0, 0, 0));
                break;
            case '24h':
                start = new Date(Date.now() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                return undefined;
        }
        return { start, end: new Date() };
    }
    // Handle explicit date range
    if (startDate && endDate) {
        return {
            start: new Date(startDate),
            end: new Date(endDate),
        };
    }
    return undefined;
}
/**
 * GET /api/analytics/dashboard
 * Get full dashboard data with all key metrics
 */
async function getDashboard(req, res) {
    try {
        const dateRange = parseDateRange(req);
        const dashboard = await analytics_service_1.default.getDashboardData(dateRange);
        res.json({
            success: true,
            data: dashboard,
            dateRange: dateRange ? {
                start: dateRange.start.toISOString(),
                end: dateRange.end.toISOString(),
            } : 'all-time',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get dashboard data', { error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve dashboard data' },
        });
    }
}
/**
 * GET /api/analytics/performance
 * Get overall performance summary
 */
async function getPerformance(req, res) {
    try {
        const dateRange = parseDateRange(req);
        const performance = await analytics_service_1.default.getPerformanceSummary(dateRange);
        res.json({
            success: true,
            data: performance,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get performance data', { error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve performance data' },
        });
    }
}
/**
 * GET /api/analytics/ai-providers
 * Get AI provider comparison stats
 */
async function getAIProviderStats(req, res) {
    try {
        const dateRange = parseDateRange(req);
        const aiStats = await analytics_service_1.default.getAIProviderStats(dateRange);
        res.json({
            success: true,
            data: aiStats,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get AI provider stats', { error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve AI provider statistics' },
        });
    }
}
/**
 * GET /api/analytics/consensus
 * Get consensus analytics
 */
async function getConsensusStats(req, res) {
    try {
        const dateRange = parseDateRange(req);
        const consensus = await analytics_service_1.default.getConsensusStats(dateRange);
        res.json({
            success: true,
            data: consensus,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get consensus stats', { error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve consensus statistics' },
        });
    }
}
/**
 * GET /api/analytics/categories
 * Get category performance breakdown
 */
async function getCategoryStats(req, res) {
    try {
        const dateRange = parseDateRange(req);
        const limit = parseInt(req.query.limit) || 20;
        const categories = await analytics_service_1.default.getCategoryStats(dateRange, limit);
        res.json({
            success: true,
            data: categories,
            count: categories.length,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get category stats', { error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve category statistics' },
        });
    }
}
/**
 * GET /api/analytics/brands
 * Get brand performance breakdown
 */
async function getBrandStats(req, res) {
    try {
        const dateRange = parseDateRange(req);
        const limit = parseInt(req.query.limit) || 20;
        const brands = await analytics_service_1.default.getBrandStats(dateRange, limit);
        res.json({
            success: true,
            data: brands,
            count: brands.length,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get brand stats', { error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve brand statistics' },
        });
    }
}
/**
 * GET /api/analytics/issues
 * Get issue trends and analysis
 */
async function getIssueTrends(req, res) {
    try {
        const dateRange = parseDateRange(req);
        const issues = await analytics_service_1.default.getIssueTrends(dateRange);
        res.json({
            success: true,
            data: issues,
            totalIssueTypes: issues.length,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get issue trends', { error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve issue trends' },
        });
    }
}
/**
 * GET /api/analytics/disagreements
 * Get detailed disagreement analysis
 */
async function getDisagreementAnalysis(req, res) {
    try {
        const dateRange = parseDateRange(req);
        const disagreements = await analytics_service_1.default.getDisagreementAnalysis(dateRange);
        res.json({
            success: true,
            data: disagreements,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get disagreement analysis', { error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve disagreement analysis' },
        });
    }
}
/**
 * GET /api/analytics/timeseries
 * Get time series data for charts
 */
async function getTimeSeries(req, res) {
    try {
        let dateRange = parseDateRange(req);
        if (!dateRange) {
            // Default to last 7 days
            dateRange = {
                start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                end: new Date()
            };
        }
        const interval = req.query.interval || 'day';
        const timeSeries = await analytics_service_1.default.getTimeSeries(dateRange, interval);
        res.json({
            success: true,
            data: timeSeries,
            interval,
            count: timeSeries.length,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get time series data', { error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve time series data' },
        });
    }
}
/**
 * GET /api/analytics/failures
 * Get recent failures for review
 */
async function getRecentFailures(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const failures = await analytics_service_1.default.getRecentFailures(limit);
        res.json({
            success: true,
            data: failures,
            count: failures.length,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get recent failures', { error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve recent failures' },
        });
    }
}
/**
 * GET /api/analytics/low-confidence
 * Get low confidence verifications for review
 */
async function getLowConfidence(req, res) {
    try {
        const threshold = parseFloat(req.query.threshold) || 0.7;
        const limit = parseInt(req.query.limit) || 50;
        const lowConfidence = await analytics_service_1.default.getLowConfidenceVerifications(threshold, limit);
        res.json({
            success: true,
            data: lowConfidence,
            threshold,
            count: lowConfidence.length,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get low confidence verifications', { error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve low confidence verifications' },
        });
    }
}
/**
 * GET /api/analytics/search
 * Search and filter API calls
 */
async function searchCalls(req, res) {
    try {
        const dateRange = parseDateRange(req);
        const filters = {
            status: req.query.status,
            category: req.query.category,
            brand: req.query.brand,
            catalogId: req.query.catalogId,
            minScore: req.query.minScore ? parseFloat(req.query.minScore) : undefined,
            maxScore: req.query.maxScore ? parseFloat(req.query.maxScore) : undefined,
            issueType: req.query.issueType,
            dateRange,
            page: parseInt(req.query.page) || 1,
            limit: Math.min(parseInt(req.query.limit) || 50, 100),
        };
        const results = await analytics_service_1.default.searchAPICalls(filters);
        res.json({
            success: true,
            data: results.results,
            pagination: {
                page: results.page,
                pages: results.pages,
                total: results.total,
                limit: filters.limit,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to search API calls', { error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to search API calls' },
        });
    }
}
/**
 * GET /api/analytics/tracking/:trackingId
 * Get specific tracking record by ID
 */
async function getTrackingById(req, res) {
    try {
        const { trackingId } = req.params;
        const tracking = await tracking_service_1.default.getTracking(trackingId);
        if (!tracking) {
            res.status(404).json({
                success: false,
                error: { message: 'Tracking record not found' },
            });
            return;
        }
        res.json({
            success: true,
            data: tracking,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get tracking record', { error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve tracking record' },
        });
    }
}
/**
 * GET /api/analytics/session/:sessionId
 * Get all tracking records for a session
 */
async function getTrackingBySession(req, res) {
    try {
        const { sessionId } = req.params;
        const trackings = await tracking_service_1.default.getTrackingBySession(sessionId);
        res.json({
            success: true,
            data: trackings,
            count: trackings.length,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get session tracking records', { error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve session tracking records' },
        });
    }
}
/**
 * GET /api/analytics/catalog/:catalogId
 * Get all tracking records for a catalog item
 */
async function getTrackingByCatalog(req, res) {
    try {
        const { catalogId } = req.params;
        const trackings = await tracking_service_1.default.getTrackingByCatalogId(catalogId);
        res.json({
            success: true,
            data: trackings,
            count: trackings.length,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get catalog tracking records', { error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to retrieve catalog tracking records' },
        });
    }
}
/**
 * GET /api/analytics/export
 * Export tracking data to CSV/JSON
 */
async function exportData(req, res) {
    try {
        const dateRange = parseDateRange(req);
        const format = req.query.format || 'json';
        const limit = Math.min(parseInt(req.query.limit) || 1000, 10000);
        const query = {};
        if (dateRange) {
            query.requestTimestamp = { $gte: dateRange.start, $lte: dateRange.end };
        }
        const data = await api_tracker_model_1.APITracker.find(query)
            .sort({ requestTimestamp: -1 })
            .limit(limit)
            .lean();
        if (format === 'csv') {
            // Generate CSV
            const csvHeaders = [
                'trackingId', 'sessionId', 'timestamp', 'catalogId', 'brand', 'category',
                'status', 'verificationScore', 'processingTimeMs', 'openaiSuccess', 'xaiSuccess',
                'consensusAgreed', 'consensusScore', 'issueCount'
            ].join(',');
            const csvRows = data.map(row => [
                row.trackingId,
                row.sessionId,
                row.requestTimestamp?.toISOString(),
                row.request?.SF_Catalog_Id,
                row.request?.Brand_Web_Retailer,
                row.consensus?.finalCategory,
                row.overallStatus,
                row.verificationScore,
                row.totalProcessingTimeMs,
                row.openaiResult?.success,
                row.xaiResult?.success,
                row.consensus?.agreed,
                row.consensus?.consensusScore,
                row.issues?.length || 0
            ].join(','));
            const csv = [csvHeaders, ...csvRows].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=api-tracking-export-${Date.now()}.csv`);
            res.send(csv);
        }
        else {
            res.json({
                success: true,
                data,
                count: data.length,
                exportedAt: new Date().toISOString(),
            });
        }
    }
    catch (error) {
        logger_1.default.error('Failed to export tracking data', { error });
        res.status(500).json({
            success: false,
            error: { message: 'Failed to export tracking data' },
        });
    }
}
exports.default = {
    getDashboard,
    getPerformance,
    getAIProviderStats,
    getConsensusStats,
    getCategoryStats,
    getBrandStats,
    getIssueTrends,
    getDisagreementAnalysis,
    getTimeSeries,
    getRecentFailures,
    getLowConfidence,
    searchCalls,
    getTrackingById,
    getTrackingBySession,
    getTrackingByCatalog,
    exportData,
};
//# sourceMappingURL=analytics.controller.js.map