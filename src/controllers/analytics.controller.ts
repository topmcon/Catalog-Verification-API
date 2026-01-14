/**
 * Analytics Controller
 * Handles API endpoints for viewing tracking data and analytics
 */

import { Request, Response } from 'express';
import analyticsService, { DateRange } from '../services/analytics.service';
import trackingService from '../services/tracking.service';
import { APITracker } from '../models/api-tracker.model';
import logger from '../utils/logger';

/**
 * Parse date range from query parameters
 */
function parseDateRange(req: Request): DateRange | undefined {
  const { startDate, endDate, period } = req.query;

  // Handle preset periods
  if (period) {
    const now = new Date();
    let start: Date;
    
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
      start: new Date(startDate as string),
      end: new Date(endDate as string),
    };
  }

  return undefined;
}

/**
 * GET /api/analytics/dashboard
 * Get full dashboard data with all key metrics
 */
export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const dashboard = await analyticsService.getDashboardData(dateRange);
    
    res.json({
      success: true,
      data: dashboard,
      dateRange: dateRange ? {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      } : 'all-time',
    });
  } catch (error) {
    logger.error('Failed to get dashboard data', { error });
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
export async function getPerformance(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const performance = await analyticsService.getPerformanceSummary(dateRange);
    
    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    logger.error('Failed to get performance data', { error });
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
export async function getAIProviderStats(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const aiStats = await analyticsService.getAIProviderStats(dateRange);
    
    res.json({
      success: true,
      data: aiStats,
    });
  } catch (error) {
    logger.error('Failed to get AI provider stats', { error });
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
export async function getConsensusStats(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const consensus = await analyticsService.getConsensusStats(dateRange);
    
    res.json({
      success: true,
      data: consensus,
    });
  } catch (error) {
    logger.error('Failed to get consensus stats', { error });
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
export async function getCategoryStats(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const limit = parseInt(req.query.limit as string) || 20;
    const categories = await analyticsService.getCategoryStats(dateRange, limit);
    
    res.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    logger.error('Failed to get category stats', { error });
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
export async function getBrandStats(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const limit = parseInt(req.query.limit as string) || 20;
    const brands = await analyticsService.getBrandStats(dateRange, limit);
    
    res.json({
      success: true,
      data: brands,
      count: brands.length,
    });
  } catch (error) {
    logger.error('Failed to get brand stats', { error });
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
export async function getIssueTrends(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const issues = await analyticsService.getIssueTrends(dateRange);
    
    res.json({
      success: true,
      data: issues,
      totalIssueTypes: issues.length,
    });
  } catch (error) {
    logger.error('Failed to get issue trends', { error });
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
export async function getDisagreementAnalysis(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const disagreements = await analyticsService.getDisagreementAnalysis(dateRange);
    
    res.json({
      success: true,
      data: disagreements,
    });
  } catch (error) {
    logger.error('Failed to get disagreement analysis', { error });
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
export async function getTimeSeries(req: Request, res: Response): Promise<void> {
  try {
    let dateRange = parseDateRange(req);
    if (!dateRange) {
      // Default to last 7 days
      dateRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      };
    }
    
    const interval = (req.query.interval as 'hour' | 'day' | 'week') || 'day';
    const timeSeries = await analyticsService.getTimeSeries(dateRange, interval);
    
    res.json({
      success: true,
      data: timeSeries,
      interval,
      count: timeSeries.length,
    });
  } catch (error) {
    logger.error('Failed to get time series data', { error });
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
export async function getRecentFailures(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const failures = await analyticsService.getRecentFailures(limit);
    
    res.json({
      success: true,
      data: failures,
      count: failures.length,
    });
  } catch (error) {
    logger.error('Failed to get recent failures', { error });
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
export async function getLowConfidence(req: Request, res: Response): Promise<void> {
  try {
    const threshold = parseFloat(req.query.threshold as string) || 0.7;
    const limit = parseInt(req.query.limit as string) || 50;
    const lowConfidence = await analyticsService.getLowConfidenceVerifications(threshold, limit);
    
    res.json({
      success: true,
      data: lowConfidence,
      threshold,
      count: lowConfidence.length,
    });
  } catch (error) {
    logger.error('Failed to get low confidence verifications', { error });
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
export async function searchCalls(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const filters = {
      status: req.query.status as 'success' | 'partial' | 'failed',
      category: req.query.category as string,
      brand: req.query.brand as string,
      catalogId: req.query.catalogId as string,
      minScore: req.query.minScore ? parseFloat(req.query.minScore as string) : undefined,
      maxScore: req.query.maxScore ? parseFloat(req.query.maxScore as string) : undefined,
      issueType: req.query.issueType as string,
      dateRange,
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 50, 100),
    };

    const results = await analyticsService.searchAPICalls(filters);
    
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
  } catch (error) {
    logger.error('Failed to search API calls', { error });
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
export async function getTrackingById(req: Request, res: Response): Promise<void> {
  try {
    const { trackingId } = req.params;
    const tracking = await trackingService.getTracking(trackingId);
    
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
  } catch (error) {
    logger.error('Failed to get tracking record', { error });
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
export async function getTrackingBySession(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;
    const trackings = await trackingService.getTrackingBySession(sessionId);
    
    res.json({
      success: true,
      data: trackings,
      count: trackings.length,
    });
  } catch (error) {
    logger.error('Failed to get session tracking records', { error });
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
export async function getTrackingByCatalog(req: Request, res: Response): Promise<void> {
  try {
    const { catalogId } = req.params;
    const trackings = await trackingService.getTrackingByCatalogId(catalogId);
    
    res.json({
      success: true,
      data: trackings,
      count: trackings.length,
    });
  } catch (error) {
    logger.error('Failed to get catalog tracking records', { error });
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
export async function exportData(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const format = req.query.format as string || 'json';
    const limit = Math.min(parseInt(req.query.limit as string) || 1000, 10000);

    const query: any = {};
    if (dateRange) {
      query.requestTimestamp = { $gte: dateRange.start, $lte: dateRange.end };
    }

    const data = await APITracker.find(query)
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
    } else {
      res.json({
        success: true,
        data,
        count: data.length,
        exportedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Failed to export tracking data', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to export tracking data' },
    });
  }
}

/**
 * GET /api/analytics/alerts
 * Get recent alerts from the alerting service
 */
export async function getAlerts(req: Request, res: Response): Promise<void> {
  try {
    const alertingServiceModule = await import('../services/alerting.service');
    const { type, severity, limit, since } = req.query;
    
    const alerts = alertingServiceModule.getRecentAlerts({
      type: type as any,
      severity: severity as any,
      limit: limit ? parseInt(limit as string) : 100,
      since: since ? new Date(since as string) : undefined
    });
    
    const stats = alertingServiceModule.getAlertStats(
      since ? new Date(since as string) : new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    res.json({
      success: true,
      data: {
        alerts,
        stats
      }
    });
  } catch (error) {
    logger.error('Failed to get alerts', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve alerts' },
    });
  }
}

export default {
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
  getAlerts,
};
