/**
 * Analytics Service
 * Provides comprehensive analytics, trends, and insights from API tracking data
 */
/**
 * Date range type for queries
 */
export interface DateRange {
    start: Date;
    end: Date;
}
/**
 * Overall API Performance Summary
 */
export interface PerformanceSummary {
    totalCalls: number;
    successCount: number;
    partialCount: number;
    failedCount: number;
    successRate: number;
    avgProcessingTimeMs: number;
    avgVerificationScore: number;
    p95ProcessingTimeMs: number;
    p99ProcessingTimeMs: number;
}
/**
 * AI Provider Performance
 */
export interface AIProviderStats {
    provider: 'openai' | 'xai';
    totalCalls: number;
    successCount: number;
    failedCount: number;
    successRate: number;
    avgProcessingTimeMs: number;
    avgConfidence: number;
    avgFieldsPopulated: number;
    avgCorrections: number;
    researchTriggeredCount: number;
}
/**
 * Consensus Analytics
 */
export interface ConsensusStats {
    totalConsensusAttempts: number;
    agreedCount: number;
    disagreedCount: number;
    agreementRate: number;
    avgConsensusScore: number;
    avgFieldsAgreed: number;
    avgFieldsDisagreed: number;
    crossValidationCount: number;
    researchPhaseCount: number;
    avgRetryCount: number;
}
/**
 * Category Performance
 */
export interface CategoryStats {
    category: string;
    totalCalls: number;
    successCount: number;
    failedCount: number;
    successRate: number;
    avgVerificationScore: number;
    avgProcessingTimeMs: number;
    commonIssues: {
        type: string;
        count: number;
    }[];
}
/**
 * Brand Performance
 */
export interface BrandStats {
    brand: string;
    totalCalls: number;
    successRate: number;
    avgVerificationScore: number;
    topCategories: string[];
}
/**
 * Issue Trends
 */
export interface IssueTrend {
    issueType: string;
    count: number;
    percentage: number;
    severityBreakdown: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
    affectedFields: string[];
    trend: 'increasing' | 'decreasing' | 'stable';
}
/**
 * Time-based Metrics
 */
export interface TimeSeriesDataPoint {
    timestamp: Date;
    calls: number;
    successRate: number;
    avgProcessingTime: number;
    avgScore: number;
}
/**
 * Field-level Analytics
 */
export interface FieldAnalytics {
    field: string;
    populatedCount: number;
    missingCount: number;
    correctedCount: number;
    disagreementCount: number;
    populationRate: number;
}
/**
 * Get overall performance summary
 */
export declare function getPerformanceSummary(dateRange?: DateRange): Promise<PerformanceSummary>;
/**
 * Get AI provider performance statistics
 */
export declare function getAIProviderStats(dateRange?: DateRange): Promise<{
    openai: AIProviderStats;
    xai: AIProviderStats;
}>;
/**
 * Get consensus statistics
 */
export declare function getConsensusStats(dateRange?: DateRange): Promise<ConsensusStats>;
/**
 * Get category performance statistics
 */
export declare function getCategoryStats(dateRange?: DateRange, limit?: number): Promise<CategoryStats[]>;
/**
 * Get brand performance statistics
 */
export declare function getBrandStats(dateRange?: DateRange, limit?: number): Promise<BrandStats[]>;
/**
 * Get issue trends
 */
export declare function getIssueTrends(dateRange?: DateRange): Promise<IssueTrend[]>;
/**
 * Get time series data for charts
 */
export declare function getTimeSeries(dateRange: DateRange, interval?: 'hour' | 'day' | 'week'): Promise<TimeSeriesDataPoint[]>;
/**
 * Get recent failures for review
 */
export declare function getRecentFailures(limit?: number): Promise<(import("mongoose").FlattenMaps<import("../models/api-tracker.model").IAPITracker> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
/**
 * Get low confidence verifications
 */
export declare function getLowConfidenceVerifications(threshold?: number, limit?: number): Promise<(import("mongoose").FlattenMaps<import("../models/api-tracker.model").IAPITracker> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
/**
 * Get disagreement analysis
 */
export declare function getDisagreementAnalysis(dateRange?: DateRange): Promise<{
    totalDisagreements: number;
    commonDisagreementFields: {
        field: string;
        count: number;
    }[];
    categoryMismatchCount: number;
    resolvedByOpenAI: number;
    resolvedByXAI: number;
    unresolvedCount: number;
}>;
/**
 * Get full dashboard data
 */
export declare function getDashboardData(dateRange?: DateRange): Promise<{
    performance: PerformanceSummary;
    aiStats: {
        openai: AIProviderStats;
        xai: AIProviderStats;
    };
    consensus: ConsensusStats;
    topCategories: CategoryStats[];
    topBrands: BrandStats[];
    issues: IssueTrend[];
    generatedAt: Date;
}>;
/**
 * Search and filter API calls
 */
export declare function searchAPICalls(filters: {
    status?: 'success' | 'partial' | 'failed';
    category?: string;
    brand?: string;
    catalogId?: string;
    minScore?: number;
    maxScore?: number;
    issueType?: string;
    dateRange?: DateRange;
    page?: number;
    limit?: number;
}): Promise<{
    results: (import("mongoose").FlattenMaps<import("../models/api-tracker.model").IAPITracker> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[];
    total: number;
    page: number;
    pages: number;
}>;
declare const _default: {
    getPerformanceSummary: typeof getPerformanceSummary;
    getAIProviderStats: typeof getAIProviderStats;
    getConsensusStats: typeof getConsensusStats;
    getCategoryStats: typeof getCategoryStats;
    getBrandStats: typeof getBrandStats;
    getIssueTrends: typeof getIssueTrends;
    getTimeSeries: typeof getTimeSeries;
    getRecentFailures: typeof getRecentFailures;
    getLowConfidenceVerifications: typeof getLowConfidenceVerifications;
    getDisagreementAnalysis: typeof getDisagreementAnalysis;
    getDashboardData: typeof getDashboardData;
    searchAPICalls: typeof searchAPICalls;
};
export default _default;
//# sourceMappingURL=analytics.service.d.ts.map