/**
 * Analytics Controller
 * Handles API endpoints for viewing tracking data and analytics
 */
import { Request, Response } from 'express';
/**
 * GET /api/analytics/dashboard
 * Get full dashboard data with all key metrics
 */
export declare function getDashboard(req: Request, res: Response): Promise<void>;
/**
 * GET /api/analytics/performance
 * Get overall performance summary
 */
export declare function getPerformance(req: Request, res: Response): Promise<void>;
/**
 * GET /api/analytics/ai-providers
 * Get AI provider comparison stats
 */
export declare function getAIProviderStats(req: Request, res: Response): Promise<void>;
/**
 * GET /api/analytics/consensus
 * Get consensus analytics
 */
export declare function getConsensusStats(req: Request, res: Response): Promise<void>;
/**
 * GET /api/analytics/categories
 * Get category performance breakdown
 */
export declare function getCategoryStats(req: Request, res: Response): Promise<void>;
/**
 * GET /api/analytics/brands
 * Get brand performance breakdown
 */
export declare function getBrandStats(req: Request, res: Response): Promise<void>;
/**
 * GET /api/analytics/issues
 * Get issue trends and analysis
 */
export declare function getIssueTrends(req: Request, res: Response): Promise<void>;
/**
 * GET /api/analytics/disagreements
 * Get detailed disagreement analysis
 */
export declare function getDisagreementAnalysis(req: Request, res: Response): Promise<void>;
/**
 * GET /api/analytics/timeseries
 * Get time series data for charts
 */
export declare function getTimeSeries(req: Request, res: Response): Promise<void>;
/**
 * GET /api/analytics/failures
 * Get recent failures for review
 */
export declare function getRecentFailures(req: Request, res: Response): Promise<void>;
/**
 * GET /api/analytics/low-confidence
 * Get low confidence verifications for review
 */
export declare function getLowConfidence(req: Request, res: Response): Promise<void>;
/**
 * GET /api/analytics/search
 * Search and filter API calls
 */
export declare function searchCalls(req: Request, res: Response): Promise<void>;
/**
 * GET /api/analytics/tracking/:trackingId
 * Get specific tracking record by ID
 */
export declare function getTrackingById(req: Request, res: Response): Promise<void>;
/**
 * GET /api/analytics/session/:sessionId
 * Get all tracking records for a session
 */
export declare function getTrackingBySession(req: Request, res: Response): Promise<void>;
/**
 * GET /api/analytics/catalog/:catalogId
 * Get all tracking records for a catalog item
 */
export declare function getTrackingByCatalog(req: Request, res: Response): Promise<void>;
/**
 * GET /api/analytics/export
 * Export tracking data to CSV/JSON
 */
export declare function exportData(req: Request, res: Response): Promise<void>;
declare const _default: {
    getDashboard: typeof getDashboard;
    getPerformance: typeof getPerformance;
    getAIProviderStats: typeof getAIProviderStats;
    getConsensusStats: typeof getConsensusStats;
    getCategoryStats: typeof getCategoryStats;
    getBrandStats: typeof getBrandStats;
    getIssueTrends: typeof getIssueTrends;
    getDisagreementAnalysis: typeof getDisagreementAnalysis;
    getTimeSeries: typeof getTimeSeries;
    getRecentFailures: typeof getRecentFailures;
    getLowConfidence: typeof getLowConfidence;
    searchCalls: typeof searchCalls;
    getTrackingById: typeof getTrackingById;
    getTrackingBySession: typeof getTrackingBySession;
    getTrackingByCatalog: typeof getTrackingByCatalog;
    exportData: typeof exportData;
};
export default _default;
//# sourceMappingURL=analytics.controller.d.ts.map