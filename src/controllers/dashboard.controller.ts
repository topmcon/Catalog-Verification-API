import { Request, Response } from 'express';
import logger from '../utils/logger';
import fieldAnalyticsService from '../services/field-analytics.service';
import { errorMonitor } from '../services/error-monitor.service';
import ErrorRecoveryService from '../services/error-recovery.service';
import { CategoryConfusion } from '../models/category-confusion.model';

/**
 * Enhanced Analytics Dashboard Controller
 * Provides comprehensive metrics for monitoring system health and performance
 */

/**
 * GET /api/analytics/dashboard
 * Get comprehensive dashboard metrics
 */
export async function getDashboardMetrics(req: Request, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 7;

    // Get field population metrics
    const fieldMetrics = await fieldAnalyticsService.getDashboardMetrics(days);

    // Get error monitoring metrics
    const errorStats = errorMonitor.getStats();
    const errorMetrics = {
      current: {
        totalCalls: errorStats.total_calls,
        errorCount: errorStats.total_errors
      },
      errorRates: {
        current: {
          errorRate: (errorStats.error_rate * 100).toFixed(1) + '%',
          windowMinutes: errorStats.window_size_minutes
        }
      },
      breakdown: {
        byType: errorStats.error_breakdown,
        bySeverity: errorStats.severity_breakdown
      }
    };

    // Get circuit breaker status
    const circuitBreakers = {
      openai: ErrorRecoveryService.getCircuitBreakerStatus('openai'),
      xai: ErrorRecoveryService.getCircuitBreakerStatus('xai')
    };

    // Get category confusion stats
    const categoryStats = await CategoryConfusion.aggregate([
      {
        $group: {
          _id: null,
          totalDisagreements: { $sum: 1 },
          avgConfusionScore: { $avg: '$confusionScore' },
          mostConfusedPairs: {
            $push: {
              openai: '$openaiCategory',
              xai: '$xaiCategory',
              count: '$occurrenceCount',
              score: '$confusionScore'
            }
          }
        }
      }
    ]);

    const response = {
      period: `Last ${days} days`,
      timestamp: new Date().toISOString(),
      
      // Field population metrics
      fieldPopulation: {
        totalProducts: fieldMetrics?.totalProducts || 0,
        avgPopulationRate: fieldMetrics?.avgPopulationRate?.toFixed(1) || '0',
        avgPrimaryRate: fieldMetrics?.avgPrimaryRate?.toFixed(1) || '0',
        avgFilterRate: fieldMetrics?.avgFilterRate?.toFixed(1) || '0',
        researchTriggerRate: fieldMetrics?.researchTriggerRate?.toFixed(1) || '0',
        consensusRate: fieldMetrics?.avgConsensusRate?.toFixed(1) || '0'
      },

      // Error monitoring
      errors: {
        current: errorMetrics.current,
        rates: errorMetrics.errorRates,
        breakdown: errorMetrics.breakdown
      },

      // System health
      systemHealth: {
        circuitBreakers,
        status: circuitBreakers.openai === 'CLOSED' && circuitBreakers.xai === 'CLOSED' 
          ? 'healthy' 
          : 'degraded'
      },

      // Category confusion
      categoryAnalysis: {
        totalDisagreements: categoryStats[0]?.totalDisagreements || 0,
        avgConfusionScore: categoryStats[0]?.avgConfusionScore?.toFixed(2) || '0',
        topConfusions: categoryStats[0]?.mostConfusedPairs?.slice(0, 10) || []
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('[Dashboard] Failed to get metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard metrics' });
  }
}

/**
 * GET /api/analytics/fields/missing
 * Get most commonly missing fields by category
 */
export async function getMissingFieldsAnalysis(req: Request, res: Response): Promise<any> {
  try {
    const category = req.query.category as string;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!category) {
      return res.status(400).json({ error: 'Category parameter required' });
    }

    const missingFields = await fieldAnalyticsService.getMostCommonlyMissingFields(category, limit);

    res.json({
      category,
      missingFields: missingFields.map(field => ({
        fieldName: field._id,
        missingCount: field.count,
        avgConfidence: field.avgConfidence?.toFixed(1)
      }))
    });
  } catch (error) {
    logger.error('[Dashboard] Failed to get missing fields:', error);
    res.status(500).json({ error: 'Failed to retrieve missing fields analysis' });
  }
}

/**
 * GET /api/analytics/fields/population
 * Get field population statistics by category
 */
export async function getFieldPopulationStats(req: Request, res: Response): Promise<any> {
  try {
    const category = req.query.category as string;

    if (!category) {
      return res.status(400).json({ error: 'Category parameter required' });
    }

    const stats = await fieldAnalyticsService.getCategoryStatistics(category);

    if (!stats) {
      return res.status(404).json({ error: 'No statistics found for category' });
    }

    res.json({
      category,
      statistics: {
        totalProducts: stats.totalProducts,
        avgPrimaryPopulation: stats.avgPrimaryPopulation?.toFixed(1) + '%',
        avgFilterPopulation: stats.avgFilterPopulation?.toFixed(1) + '%',
        avgOverallPopulation: stats.avgOverallPopulation?.toFixed(1) + '%',
        researchTriggeredRate: ((stats.researchTriggeredCount / stats.totalProducts) * 100).toFixed(1) + '%',
        avgResearchEffectiveness: stats.avgResearchEffectiveness?.toFixed(1) + '%'
      }
    });
  } catch (error) {
    logger.error('[Dashboard] Failed to get field population stats:', error);
    res.status(500).json({ error: 'Failed to retrieve field population statistics' });
  }
}

/**
 * GET /api/analytics/research/effectiveness
 * Get research effectiveness metrics
 */
export async function getResearchEffectiveness(req: Request, res: Response): Promise<any> {
  try {
    const days = parseInt(req.query.days as string) || 7;

    const effectiveness = await fieldAnalyticsService.getResearchEffectiveness(days);

    if (!effectiveness) {
      return res.json({
        period: `Last ${days} days`,
        noData: true,
        message: 'No research sessions found in this period'
      });
    }

    res.json({
      period: `Last ${days} days`,
      metrics: {
        totalResearchSessions: effectiveness.totalResearchSessions,
        avgFieldsResearched: effectiveness.avgFieldsResearched?.toFixed(1),
        avgFieldsPopulated: effectiveness.avgFieldsPopulated?.toFixed(1),
        effectiveness: effectiveness.avgEffectiveness?.toFixed(1) + '%'
      }
    });
  } catch (error) {
    logger.error('[Dashboard] Failed to get research effectiveness:', error);
    res.status(500).json({ error: 'Failed to retrieve research effectiveness' });
  }
}

/**
 * GET /api/analytics/errors/timeline
 * Get error timeline for visualization
 */
export async function getErrorTimeline(req: Request, res: Response) {
  try {
    const hours = parseInt(req.query.hours as string) || 24;

    // Return placeholder for now - implement proper timeline tracking
    res.json({
      period: `Last ${hours} hours`,
      message: 'Timeline tracking will be implemented with persistent storage',
      timeline: []
    });
  } catch (error) {
    logger.error('[Dashboard] Failed to get error timeline:', error);
    res.status(500).json({ error: 'Failed to retrieve error timeline' });
  }
}

/**
 * GET /api/analytics/category/confusion
 * Get category confusion matrix
 */
export async function getCategoryConfusionMatrix(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const confusions = await CategoryConfusion.find()
      .sort({ confusionScore: -1, occurrenceCount: -1 })
      .limit(limit)
      .select('openaiCategory xaiCategory occurrenceCount confusionScore lastOccurrence');

    res.json({
      total: confusions.length,
      confusions: confusions.map((c: any) => ({
        openai: c.openaiCategory,
        xai: c.xaiCategory,
        occurrences: c.occurrenceCount,
        confusionScore: c.confusionScore.toFixed(2),
        lastSeen: c.lastOccurrence
      }))
    });
  } catch (error) {
    logger.error('[Dashboard] Failed to get category confusion:', error);
    res.status(500).json({ error: 'Failed to retrieve category confusion matrix' });
  }
}

/**
 * POST /api/analytics/circuit-breaker/reset
 * Reset circuit breaker (for manual recovery)
 */
export async function resetCircuitBreaker(req: Request, res: Response): Promise<any> {
  try {
    const { provider } = req.body;

    if (!provider || !['openai', 'xai'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider. Must be "openai" or "xai"' });
    }

    ErrorRecoveryService.resetCircuitBreaker(provider as 'openai' | 'xai');

    logger.info(`[Dashboard] Circuit breaker manually reset for ${provider}`);

    res.json({
      success: true,
      message: `Circuit breaker for ${provider} has been reset`,
      newStatus: ErrorRecoveryService.getCircuitBreakerStatus(provider as 'openai' | 'xai')
    });
  } catch (error) {
    logger.error('[Dashboard] Failed to reset circuit breaker:', error);
    res.status(500).json({ error: 'Failed to reset circuit breaker' });
  }
}

/**
 * GET /api/analytics/health
 * Get system health status
 */
export async function getSystemHealth(_req: Request, res: Response) {
  try {
    const errorStats = errorMonitor.getStats();
    const errorRate = errorStats.error_rate * 100;
    
    const circuitBreakers = {
      openai: ErrorRecoveryService.getCircuitBreakerStatus('openai'),
      xai: ErrorRecoveryService.getCircuitBreakerStatus('xai')
    };

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        errorRate: {
          status: errorRate < 10 ? 'healthy' : errorRate < 25 ? 'degraded' : 'unhealthy',
          value: errorRate.toFixed(1) + '%',
          threshold: '10%'
        },
        circuitBreakers: {
          status: circuitBreakers.openai === 'CLOSED' && circuitBreakers.xai === 'CLOSED' 
            ? 'healthy' 
            : 'degraded',
          openai: circuitBreakers.openai,
          xai: circuitBreakers.xai
        }
      }
    };

    // Determine overall status
    const checks = Object.values(health.checks);
    if (checks.some((check: any) => check.status === 'unhealthy')) {
      health.status = 'unhealthy';
    } else if (checks.some((check: any) => check.status === 'degraded')) {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('[Dashboard] Failed to get system health:', error);
    res.status(503).json({ 
      status: 'unhealthy',
      error: 'Failed to retrieve system health'
    });
  }
}
