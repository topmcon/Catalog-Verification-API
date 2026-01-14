/**
 * Verification Analytics Controller
 * API endpoints for analytics dashboard and data export
 */

import { Request, Response } from 'express';
import { verificationAnalyticsService } from '../services/verification-analytics.service';
import logger from '../utils/logger';

export class VerificationAnalyticsController {
  
  /**
   * GET /api/analytics/health
   * Overall system health metrics
   */
  async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const health = await verificationAnalyticsService.getSystemHealth(days);
      
      res.json({
        success: true,
        period_days: days,
        metrics: health
      });
    } catch (error: any) {
      logger.error('Failed to get system health', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  /**
   * GET /api/analytics/fields
   * Field-level agreement metrics
   */
  async getFieldMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const fields = await verificationAnalyticsService.getFieldAgreementTrends();
      
      res.json({
        success: true,
        total_fields: fields.length,
        fields
      });
    } catch (error: any) {
      logger.error('Failed to get field metrics', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  /**
   * GET /api/analytics/problems
   * Fields with low agreement rates (need attention)
   */
  async getProblematicFields(req: Request, res: Response): Promise<void> {
    try {
      const threshold = parseInt(req.query.threshold as string) || 70;
      const problems = await verificationAnalyticsService.getProblematicFields(threshold);
      
      res.json({
        success: true,
        threshold_percent: threshold,
        problem_count: problems.length,
        fields: problems
      });
    } catch (error: any) {
      logger.error('Failed to get problematic fields', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  /**
   * GET /api/analytics/ai-comparison
   * OpenAI vs xAI performance comparison
   */
  async getAIComparison(_req: Request, res: Response): Promise<void> {
    try {
      const comparison = await verificationAnalyticsService.getAIProviderComparison();
      
      res.json({
        success: true,
        providers: comparison
      });
    } catch (error: any) {
      logger.error('Failed to get AI comparison', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  /**
   * GET /api/analytics/categories
   * Performance breakdown by product category
   */
  async getCategoryPerformance(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await verificationAnalyticsService.getCategoryPerformance();
      
      res.json({
        success: true,
        total_categories: categories.length,
        categories
      });
    } catch (error: any) {
      logger.error('Failed to get category performance', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  /**
   * GET /api/analytics/trends
   * Daily trend data for charts
   */
  async getDailyTrends(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const trends = await verificationAnalyticsService.getDailyTrends(days);
      
      res.json({
        success: true,
        period_days: days,
        data_points: trends.length,
        trends
      });
    } catch (error: any) {
      logger.error('Failed to get daily trends', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  /**
   * GET /api/analytics/disagreements
   * Examples where AIs disagreed (for manual review)
   */
  async getDisagreements(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const examples = await verificationAnalyticsService.getDisagreementExamples(limit);
      
      res.json({
        success: true,
        count: examples.length,
        examples
      });
    } catch (error: any) {
      logger.error('Failed to get disagreements', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  /**
   * GET /api/analytics/export/training
   * Export training data for ML models
   */
  async exportTrainingData(req: Request, res: Response): Promise<void> {
    try {
      const options = {
        fieldName: req.query.field as string,
        minConfidence: parseInt(req.query.minConfidence as string) || undefined,
        limit: parseInt(req.query.limit as string) || 10000
      };
      
      const data = await verificationAnalyticsService.exportTrainingData(options);
      
      // Option to download as file
      if (req.query.format === 'jsonl') {
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('Content-Disposition', 'attachment; filename=training-data.jsonl');
        
        for (const item of data) {
          res.write(JSON.stringify(item) + '\n');
        }
        res.end();
      } else {
        res.json({
          success: true,
          count: data.length,
          data
        });
      }
    } catch (error: any) {
      logger.error('Failed to export training data', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  /**
   * GET /api/analytics/dashboard
   * Comprehensive dashboard data (all metrics in one call)
   */
  async getDashboard(_req: Request, res: Response): Promise<void> {
    try {
      const [health, problems, aiComparison, categories, trends] = await Promise.all([
        verificationAnalyticsService.getSystemHealth(7),
        verificationAnalyticsService.getProblematicFields(70),
        verificationAnalyticsService.getAIProviderComparison(),
        verificationAnalyticsService.getCategoryPerformance(),
        verificationAnalyticsService.getDailyTrends(14)
      ]);
      
      res.json({
        success: true,
        generated_at: new Date().toISOString(),
        dashboard: {
          system_health: health,
          problem_fields: {
            count: problems.length,
            fields: problems.slice(0, 10)  // Top 10 worst
          },
          ai_comparison: aiComparison,
          top_categories: categories.slice(0, 10),
          recent_trends: trends
        }
      });
    } catch (error: any) {
      logger.error('Failed to get dashboard', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const verificationAnalyticsController = new VerificationAnalyticsController();
