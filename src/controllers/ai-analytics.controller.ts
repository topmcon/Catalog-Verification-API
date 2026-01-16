/**
 * AI Usage Analytics Controller
 * Endpoints for AI usage tracking, cost analysis, and model performance
 */

import { Request, Response } from 'express';
import aiUsageTracker, { DateRange } from '../services/ai-usage-tracking.service';
import { MODEL_PRICING } from '../models/ai-usage.model';
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
 * GET /api/ai-analytics/dashboard
 * Get full AI usage dashboard with all metrics
 */
export async function getAIDashboard(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const dashboard = await aiUsageTracker.getAIDashboard(dateRange);
    
    res.json({
      success: true,
      data: dashboard,
      dateRange: dateRange ? {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      } : 'all-time',
    });
  } catch (error) {
    logger.error('Failed to get AI dashboard data', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve AI dashboard data' },
    });
  }
}

/**
 * GET /api/ai-analytics/summary
 * Get overall AI usage summary
 */
export async function getUsageSummary(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const summary = await aiUsageTracker.getUsageSummary(dateRange);
    
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Failed to get AI usage summary', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve AI usage summary' },
    });
  }
}

/**
 * GET /api/ai-analytics/models
 * Get performance breakdown by model
 */
export async function getModelPerformance(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const models = await aiUsageTracker.getModelPerformance(dateRange);
    
    res.json({
      success: true,
      data: models,
    });
  } catch (error) {
    logger.error('Failed to get model performance', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve model performance data' },
    });
  }
}

/**
 * GET /api/ai-analytics/tasks
 * Get analytics by task type
 */
export async function getTaskAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const tasks = await aiUsageTracker.getTaskTypeAnalytics(dateRange);
    
    res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    logger.error('Failed to get task analytics', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve task analytics' },
    });
  }
}

/**
 * GET /api/ai-analytics/providers
 * Get provider comparison (OpenAI vs xAI)
 */
export async function getProviderComparison(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const comparison = await aiUsageTracker.getProviderComparison(dateRange);
    
    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    logger.error('Failed to get provider comparison', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve provider comparison' },
    });
  }
}

/**
 * GET /api/ai-analytics/costs
 * Get cost breakdown over time
 */
export async function getCostOverTime(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const granularity = (req.query.granularity as 'hour' | 'day' | 'week') || 'day';
    
    if (!dateRange) {
      // Default to last 30 days
      const defaultRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };
      const costs = await aiUsageTracker.getCostOverTime(defaultRange, granularity);
      
      res.json({
        success: true,
        data: costs,
        dateRange: {
          start: defaultRange.start.toISOString(),
          end: defaultRange.end.toISOString(),
        },
        granularity,
      });
    } else {
      const costs = await aiUsageTracker.getCostOverTime(dateRange, granularity);
      
      res.json({
        success: true,
        data: costs,
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
        granularity,
      });
    }
  } catch (error) {
    logger.error('Failed to get cost over time', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve cost data' },
    });
  }
}

/**
 * GET /api/ai-analytics/failures
 * Get recent AI call failures for debugging
 */
export async function getRecentFailures(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const failures = await aiUsageTracker.getRecentFailures(limit);
    
    res.json({
      success: true,
      data: failures,
      count: failures.length,
    });
  } catch (error) {
    logger.error('Failed to get recent failures', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve failure data' },
    });
  }
}

/**
 * GET /api/ai-analytics/categories
 * Get category performance analysis
 */
export async function getCategoryPerformance(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const categories = await aiUsageTracker.getCategoryPerformance(dateRange);
    
    res.json({
      success: true,
      data: categories,
      count: categories.length,
      needsAttention: categories.filter(c => c.needsAttention).length,
    });
  } catch (error) {
    logger.error('Failed to get category performance', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve category performance' },
    });
  }
}

/**
 * GET /api/ai-analytics/pricing
 * Get current model pricing information
 */
export async function getModelPricing(_req: Request, res: Response): Promise<void> {
  try {
    const pricing = Object.entries(MODEL_PRICING).map(([model, costs]) => ({
      model,
      inputPer1M: costs.input,
      outputPer1M: costs.output,
      provider: model.startsWith('grok') || model.startsWith('grok') ? 'xai' : 'openai',
    }));
    
    res.json({
      success: true,
      data: pricing,
      note: 'Prices are per 1 million tokens in USD',
    });
  } catch (error) {
    logger.error('Failed to get model pricing', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve pricing data' },
    });
  }
}

/**
 * GET /api/ai-analytics/insights
 * Get AI-generated insights about system performance
 */
export async function getInsights(req: Request, res: Response): Promise<void> {
  try {
    const dateRange = parseDateRange(req);
    const dashboard = await aiUsageTracker.getAIDashboard(dateRange);
    
    // Extract key insights
    const insights = {
      strongPoints: dashboard.insights.strongPoints,
      weakPoints: dashboard.insights.weakPoints,
      recommendations: [] as string[],
    };
    
    // Generate recommendations based on data
    if (dashboard.summary.successRate < 90) {
      insights.recommendations.push('Overall success rate is below 90%. Review recent failures for patterns.');
    }
    
    if (dashboard.summary.avgLatencyMs > 5000) {
      insights.recommendations.push('Average latency is high. Consider using faster models for time-sensitive tasks.');
    }
    
    if (dashboard.providerComparison.agreementRate < 80) {
      insights.recommendations.push('AI agreement rate is below 80%. This may indicate unclear product data or category definitions.');
    }
    
    const expensiveModels = dashboard.modelPerformance.filter(m => m.avgCostPerCall > 0.01);
    if (expensiveModels.length > 0) {
      insights.recommendations.push(`Consider using cheaper alternatives for: ${expensiveModels.map(m => m.model).join(', ')}`);
    }
    
    // Check for underperforming task types
    const lowPerformanceTasks = dashboard.taskAnalytics.filter(t => t.successRate < 85);
    if (lowPerformanceTasks.length > 0) {
      insights.recommendations.push(`Task types with low success: ${lowPerformanceTasks.map(t => t.taskType).join(', ')}`);
    }
    
    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    logger.error('Failed to get insights', { error });
    res.status(500).json({
      success: false,
      error: { message: 'Failed to generate insights' },
    });
  }
}

export default {
  getAIDashboard,
  getUsageSummary,
  getModelPerformance,
  getTaskAnalytics,
  getProviderComparison,
  getCostOverTime,
  getRecentFailures,
  getCategoryPerformance,
  getModelPricing,
  getInsights,
};
