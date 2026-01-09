"use strict";
/**
 * Analytics Service
 * Provides comprehensive analytics, trends, and insights from API tracking data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPerformanceSummary = getPerformanceSummary;
exports.getAIProviderStats = getAIProviderStats;
exports.getConsensusStats = getConsensusStats;
exports.getCategoryStats = getCategoryStats;
exports.getBrandStats = getBrandStats;
exports.getIssueTrends = getIssueTrends;
exports.getTimeSeries = getTimeSeries;
exports.getRecentFailures = getRecentFailures;
exports.getLowConfidenceVerifications = getLowConfidenceVerifications;
exports.getDisagreementAnalysis = getDisagreementAnalysis;
exports.getDashboardData = getDashboardData;
exports.searchAPICalls = searchAPICalls;
const api_tracker_model_1 = require("../models/api-tracker.model");
/**
 * Get overall performance summary
 */
async function getPerformanceSummary(dateRange) {
    const query = {};
    if (dateRange) {
        query.requestTimestamp = { $gte: dateRange.start, $lte: dateRange.end };
    }
    const [stats, percentiles] = await Promise.all([
        api_tracker_model_1.APITracker.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalCalls: { $sum: 1 },
                    successCount: { $sum: { $cond: [{ $eq: ['$overallStatus', 'success'] }, 1, 0] } },
                    partialCount: { $sum: { $cond: [{ $eq: ['$overallStatus', 'partial'] }, 1, 0] } },
                    failedCount: { $sum: { $cond: [{ $eq: ['$overallStatus', 'failed'] }, 1, 0] } },
                    avgProcessingTimeMs: { $avg: '$totalProcessingTimeMs' },
                    avgVerificationScore: { $avg: '$verificationScore' },
                }
            }
        ]),
        api_tracker_model_1.APITracker.aggregate([
            { $match: query },
            { $sort: { totalProcessingTimeMs: 1 } },
            {
                $group: {
                    _id: null,
                    processingTimes: { $push: '$totalProcessingTimeMs' }
                }
            },
            {
                $project: {
                    p95: { $arrayElemAt: ['$processingTimes', { $floor: { $multiply: [{ $size: '$processingTimes' }, 0.95] } }] },
                    p99: { $arrayElemAt: ['$processingTimes', { $floor: { $multiply: [{ $size: '$processingTimes' }, 0.99] } }] }
                }
            }
        ])
    ]);
    const result = stats[0] || {
        totalCalls: 0,
        successCount: 0,
        partialCount: 0,
        failedCount: 0,
        avgProcessingTimeMs: 0,
        avgVerificationScore: 0,
    };
    return {
        totalCalls: result.totalCalls,
        successCount: result.successCount,
        partialCount: result.partialCount,
        failedCount: result.failedCount,
        successRate: result.totalCalls > 0 ? (result.successCount / result.totalCalls) * 100 : 0,
        avgProcessingTimeMs: Math.round(result.avgProcessingTimeMs || 0),
        avgVerificationScore: Math.round((result.avgVerificationScore || 0) * 100) / 100,
        p95ProcessingTimeMs: percentiles[0]?.p95 || 0,
        p99ProcessingTimeMs: percentiles[0]?.p99 || 0,
    };
}
/**
 * Get AI provider performance statistics
 */
async function getAIProviderStats(dateRange) {
    const query = {};
    if (dateRange) {
        query.requestTimestamp = { $gte: dateRange.start, $lte: dateRange.end };
    }
    const [openaiStats, xaiStats] = await Promise.all([
        api_tracker_model_1.APITracker.aggregate([
            { $match: { ...query, openaiResult: { $exists: true } } },
            {
                $group: {
                    _id: null,
                    totalCalls: { $sum: 1 },
                    successCount: { $sum: { $cond: ['$openaiResult.success', 1, 0] } },
                    failedCount: { $sum: { $cond: ['$openaiResult.success', 0, 1] } },
                    avgProcessingTimeMs: { $avg: '$openaiResult.processingTimeMs' },
                    avgConfidence: { $avg: '$openaiResult.overallConfidence' },
                    avgFieldsPopulated: { $avg: '$openaiResult.fieldsPopulated' },
                    avgCorrections: { $avg: '$openaiResult.correctionsApplied' },
                    researchTriggeredCount: { $sum: { $cond: ['$openaiResult.researchPerformed', 1, 0] } },
                }
            }
        ]),
        api_tracker_model_1.APITracker.aggregate([
            { $match: { ...query, xaiResult: { $exists: true } } },
            {
                $group: {
                    _id: null,
                    totalCalls: { $sum: 1 },
                    successCount: { $sum: { $cond: ['$xaiResult.success', 1, 0] } },
                    failedCount: { $sum: { $cond: ['$xaiResult.success', 0, 1] } },
                    avgProcessingTimeMs: { $avg: '$xaiResult.processingTimeMs' },
                    avgConfidence: { $avg: '$xaiResult.overallConfidence' },
                    avgFieldsPopulated: { $avg: '$xaiResult.fieldsPopulated' },
                    avgCorrections: { $avg: '$xaiResult.correctionsApplied' },
                    researchTriggeredCount: { $sum: { $cond: ['$xaiResult.researchPerformed', 1, 0] } },
                }
            }
        ])
    ]);
    const formatStats = (stats, provider) => {
        const s = stats[0] || {};
        return {
            provider,
            totalCalls: s.totalCalls || 0,
            successCount: s.successCount || 0,
            failedCount: s.failedCount || 0,
            successRate: s.totalCalls > 0 ? (s.successCount / s.totalCalls) * 100 : 0,
            avgProcessingTimeMs: Math.round(s.avgProcessingTimeMs || 0),
            avgConfidence: Math.round((s.avgConfidence || 0) * 100) / 100,
            avgFieldsPopulated: Math.round((s.avgFieldsPopulated || 0) * 10) / 10,
            avgCorrections: Math.round((s.avgCorrections || 0) * 10) / 10,
            researchTriggeredCount: s.researchTriggeredCount || 0,
        };
    };
    return {
        openai: formatStats(openaiStats, 'openai'),
        xai: formatStats(xaiStats, 'xai'),
    };
}
/**
 * Get consensus statistics
 */
async function getConsensusStats(dateRange) {
    const query = { consensus: { $exists: true } };
    if (dateRange) {
        query.requestTimestamp = { $gte: dateRange.start, $lte: dateRange.end };
    }
    const stats = await api_tracker_model_1.APITracker.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                totalConsensusAttempts: { $sum: 1 },
                agreedCount: { $sum: { $cond: ['$consensus.agreed', 1, 0] } },
                disagreedCount: { $sum: { $cond: ['$consensus.agreed', 0, 1] } },
                avgConsensusScore: { $avg: '$consensus.consensusScore' },
                avgFieldsAgreed: { $avg: '$consensus.fieldsAgreed' },
                avgFieldsDisagreed: { $avg: '$consensus.fieldsDisagreed' },
                crossValidationCount: { $sum: { $cond: ['$consensus.crossValidationPerformed', 1, 0] } },
                researchPhaseCount: { $sum: { $cond: ['$consensus.researchPhaseTriggered', 1, 0] } },
                avgRetryCount: { $avg: '$consensus.retryCount' },
            }
        }
    ]);
    const s = stats[0] || {};
    return {
        totalConsensusAttempts: s.totalConsensusAttempts || 0,
        agreedCount: s.agreedCount || 0,
        disagreedCount: s.disagreedCount || 0,
        agreementRate: s.totalConsensusAttempts > 0 ? (s.agreedCount / s.totalConsensusAttempts) * 100 : 0,
        avgConsensusScore: Math.round((s.avgConsensusScore || 0) * 100) / 100,
        avgFieldsAgreed: Math.round((s.avgFieldsAgreed || 0) * 10) / 10,
        avgFieldsDisagreed: Math.round((s.avgFieldsDisagreed || 0) * 10) / 10,
        crossValidationCount: s.crossValidationCount || 0,
        researchPhaseCount: s.researchPhaseCount || 0,
        avgRetryCount: Math.round((s.avgRetryCount || 0) * 10) / 10,
    };
}
/**
 * Get category performance statistics
 */
async function getCategoryStats(dateRange, limit = 20) {
    const query = { 'consensus.finalCategory': { $exists: true, $ne: null } };
    if (dateRange) {
        query.requestTimestamp = { $gte: dateRange.start, $lte: dateRange.end };
    }
    const stats = await api_tracker_model_1.APITracker.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$consensus.finalCategory',
                totalCalls: { $sum: 1 },
                successCount: { $sum: { $cond: [{ $eq: ['$overallStatus', 'success'] }, 1, 0] } },
                failedCount: { $sum: { $cond: [{ $eq: ['$overallStatus', 'failed'] }, 1, 0] } },
                avgVerificationScore: { $avg: '$verificationScore' },
                avgProcessingTimeMs: { $avg: '$totalProcessingTimeMs' },
            }
        },
        { $sort: { totalCalls: -1 } },
        { $limit: limit }
    ]);
    // Get common issues per category
    const categoriesWithIssues = await Promise.all(stats.map(async (cat) => {
        const issues = await api_tracker_model_1.APITracker.aggregate([
            { $match: { ...query, 'consensus.finalCategory': cat._id } },
            { $unwind: '$issues' },
            { $group: { _id: '$issues.type', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        return {
            category: cat._id,
            totalCalls: cat.totalCalls,
            successCount: cat.successCount,
            failedCount: cat.failedCount,
            successRate: cat.totalCalls > 0 ? (cat.successCount / cat.totalCalls) * 100 : 0,
            avgVerificationScore: Math.round((cat.avgVerificationScore || 0) * 100) / 100,
            avgProcessingTimeMs: Math.round(cat.avgProcessingTimeMs || 0),
            commonIssues: issues.map(i => ({ type: i._id, count: i.count })),
        };
    }));
    return categoriesWithIssues;
}
/**
 * Get brand performance statistics
 */
async function getBrandStats(dateRange, limit = 20) {
    const query = { 'request.Brand_Web_Retailer': { $exists: true, $ne: null } };
    if (dateRange) {
        query.requestTimestamp = { $gte: dateRange.start, $lte: dateRange.end };
    }
    const stats = await api_tracker_model_1.APITracker.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$request.Brand_Web_Retailer',
                totalCalls: { $sum: 1 },
                successCount: { $sum: { $cond: [{ $eq: ['$overallStatus', 'success'] }, 1, 0] } },
                avgVerificationScore: { $avg: '$verificationScore' },
                categories: { $addToSet: '$consensus.finalCategory' }
            }
        },
        { $sort: { totalCalls: -1 } },
        { $limit: limit }
    ]);
    return stats.map(s => ({
        brand: s._id,
        totalCalls: s.totalCalls,
        successRate: s.totalCalls > 0 ? (s.successCount / s.totalCalls) * 100 : 0,
        avgVerificationScore: Math.round((s.avgVerificationScore || 0) * 100) / 100,
        topCategories: (s.categories || []).filter(Boolean).slice(0, 5),
    }));
}
/**
 * Get issue trends
 */
async function getIssueTrends(dateRange) {
    const query = { issues: { $exists: true, $ne: [] } };
    if (dateRange) {
        query.requestTimestamp = { $gte: dateRange.start, $lte: dateRange.end };
    }
    const [totalCount, issueStats] = await Promise.all([
        api_tracker_model_1.APITracker.countDocuments(dateRange ? { requestTimestamp: { $gte: dateRange.start, $lte: dateRange.end } } : {}),
        api_tracker_model_1.APITracker.aggregate([
            { $match: query },
            { $unwind: '$issues' },
            {
                $group: {
                    _id: '$issues.type',
                    count: { $sum: 1 },
                    lowCount: { $sum: { $cond: [{ $eq: ['$issues.severity', 'low'] }, 1, 0] } },
                    mediumCount: { $sum: { $cond: [{ $eq: ['$issues.severity', 'medium'] }, 1, 0] } },
                    highCount: { $sum: { $cond: [{ $eq: ['$issues.severity', 'high'] }, 1, 0] } },
                    criticalCount: { $sum: { $cond: [{ $eq: ['$issues.severity', 'critical'] }, 1, 0] } },
                    fields: { $addToSet: '$issues.field' }
                }
            },
            { $sort: { count: -1 } }
        ])
    ]);
    return issueStats.map(i => ({
        issueType: i._id,
        count: i.count,
        percentage: totalCount > 0 ? (i.count / totalCount) * 100 : 0,
        severityBreakdown: {
            low: i.lowCount,
            medium: i.mediumCount,
            high: i.highCount,
            critical: i.criticalCount,
        },
        affectedFields: (i.fields || []).filter(Boolean),
        trend: 'stable', // Would need historical comparison
    }));
}
/**
 * Get time series data for charts
 */
async function getTimeSeries(dateRange, interval = 'day') {
    let dateFormat;
    switch (interval) {
        case 'hour':
            dateFormat = '%Y-%m-%d %H:00';
            break;
        case 'week':
            dateFormat = '%Y-W%V';
            break;
        default:
            dateFormat = '%Y-%m-%d';
    }
    const stats = await api_tracker_model_1.APITracker.aggregate([
        {
            $match: {
                requestTimestamp: { $gte: dateRange.start, $lte: dateRange.end }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: dateFormat, date: '$requestTimestamp' } },
                calls: { $sum: 1 },
                successCount: { $sum: { $cond: [{ $eq: ['$overallStatus', 'success'] }, 1, 0] } },
                avgProcessingTime: { $avg: '$totalProcessingTimeMs' },
                avgScore: { $avg: '$verificationScore' }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    return stats.map(s => ({
        timestamp: new Date(s._id),
        calls: s.calls,
        successRate: s.calls > 0 ? (s.successCount / s.calls) * 100 : 0,
        avgProcessingTime: Math.round(s.avgProcessingTime || 0),
        avgScore: Math.round((s.avgScore || 0) * 100) / 100,
    }));
}
/**
 * Get recent failures for review
 */
async function getRecentFailures(limit = 50) {
    return api_tracker_model_1.APITracker.find({ overallStatus: 'failed' })
        .sort({ requestTimestamp: -1 })
        .limit(limit)
        .lean();
}
/**
 * Get low confidence verifications
 */
async function getLowConfidenceVerifications(threshold = 0.7, limit = 50) {
    return api_tracker_model_1.APITracker.find({
        overallStatus: 'success',
        verificationScore: { $lt: threshold * 100 }
    })
        .sort({ verificationScore: 1 })
        .limit(limit)
        .lean();
}
/**
 * Get disagreement analysis
 */
async function getDisagreementAnalysis(dateRange) {
    const query = { 'consensus.agreed': false };
    if (dateRange) {
        query.requestTimestamp = { $gte: dateRange.start, $lte: dateRange.end };
    }
    const [totalDisagreements, fieldAnalysis, categoryMismatch] = await Promise.all([
        api_tracker_model_1.APITracker.countDocuments(query),
        api_tracker_model_1.APITracker.aggregate([
            { $match: query },
            { $unwind: '$consensus.disagreementFields' },
            { $group: { _id: '$consensus.disagreementFields', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ]),
        api_tracker_model_1.APITracker.countDocuments({ ...query, 'consensus.categoryAgreed': false })
    ]);
    return {
        totalDisagreements,
        commonDisagreementFields: fieldAnalysis.map(f => ({ field: f._id, count: f.count })),
        categoryMismatchCount: categoryMismatch,
        resolvedByOpenAI: 0, // Would need additional tracking
        resolvedByXAI: 0,
        unresolvedCount: await api_tracker_model_1.APITracker.countDocuments({ ...query, 'consensus.unresolvedFields.0': { $exists: true } })
    };
}
/**
 * Get full dashboard data
 */
async function getDashboardData(dateRange) {
    const [performance, aiStats, consensus, categories, brands, issues] = await Promise.all([
        getPerformanceSummary(dateRange),
        getAIProviderStats(dateRange),
        getConsensusStats(dateRange),
        getCategoryStats(dateRange, 10),
        getBrandStats(dateRange, 10),
        getIssueTrends(dateRange)
    ]);
    return {
        performance,
        aiStats,
        consensus,
        topCategories: categories,
        topBrands: brands,
        issues,
        generatedAt: new Date()
    };
}
/**
 * Search and filter API calls
 */
async function searchAPICalls(filters) {
    const query = {};
    if (filters.status)
        query.overallStatus = filters.status;
    if (filters.category)
        query['consensus.finalCategory'] = filters.category;
    if (filters.brand)
        query['request.Brand_Web_Retailer'] = new RegExp(filters.brand, 'i');
    if (filters.catalogId)
        query['request.SF_Catalog_Id'] = filters.catalogId;
    if (filters.minScore !== undefined)
        query.verificationScore = { ...query.verificationScore, $gte: filters.minScore };
    if (filters.maxScore !== undefined)
        query.verificationScore = { ...query.verificationScore, $lte: filters.maxScore };
    if (filters.issueType)
        query['issues.type'] = filters.issueType;
    if (filters.dateRange) {
        query.requestTimestamp = { $gte: filters.dateRange.start, $lte: filters.dateRange.end };
    }
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;
    const [results, total] = await Promise.all([
        api_tracker_model_1.APITracker.find(query).sort({ requestTimestamp: -1 }).skip(skip).limit(limit).lean(),
        api_tracker_model_1.APITracker.countDocuments(query)
    ]);
    return {
        results,
        total,
        page,
        pages: Math.ceil(total / limit)
    };
}
exports.default = {
    getPerformanceSummary,
    getAIProviderStats,
    getConsensusStats,
    getCategoryStats,
    getBrandStats,
    getIssueTrends,
    getTimeSeries,
    getRecentFailures,
    getLowConfidenceVerifications,
    getDisagreementAnalysis,
    getDashboardData,
    searchAPICalls,
};
//# sourceMappingURL=analytics.service.js.map