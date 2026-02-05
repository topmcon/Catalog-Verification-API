import { Request, Response } from 'express';
import responseQualityService from '../services/response-quality-analytics.service';
import logger from '../utils/logger';

/**
 * Controller for Response Quality Analytics endpoints
 * Helps identify inconclusive/vague AI responses
 */

class ResponseQualityController {
  
  /**
   * GET /api/response-quality/trends/by-field
   * Get inconclusive response trends grouped by field
   */
  async getTrendsByField(req: Request, res: Response): Promise<void> {
    try {
      const { category, fieldType } = req.query;
      
      const trends = await responseQualityService.getTrendsByField(
        category as string | undefined,
        fieldType as string | undefined
      );
      
      res.json({
        success: true,
        count: trends.length,
        trends
      });
      
    } catch (error) {
      logger.error('[ResponseQualityController] Failed to get trends by field:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve field trends'
      });
    }
  }
  
  /**
   * GET /api/response-quality/trends/by-category
   * Get inconclusive response trends grouped by category
   */
  async getTrendsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const trends = await responseQualityService.getTrendsByCategory(start, end);
      
      res.json({
        success: true,
        count: trends.length,
        trends
      });
      
    } catch (error) {
      logger.error('[ResponseQualityController] Failed to get trends by category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve category trends'
      });
    }
  }
  
  /**
   * GET /api/response-quality/summary
   * Get overall summary statistics
   */
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const summary = await responseQualityService.getSummaryStats(start, end);
      
      res.json({
        success: true,
        summary
      });
      
    } catch (error) {
      logger.error('[ResponseQualityController] Failed to get summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve summary statistics'
      });
    }
  }
  
  /**
   * GET /api/response-quality/recommendations
   * Get actionable recommendations based on trends
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.query;
      
      // Get trends for all fields
      const trends = await responseQualityService.getTrendsByField(category as string | undefined);
      
      // Filter to high-impact issues (>50% inconclusive rate or >10 occurrences)
      const highImpact = trends.filter(t => 
        t.inconclusive_rate > 0.5 || t.total_occurrences > 10
      );
      
      // Categorize recommendations
      const recommendations = {
        fields_to_remove: highImpact
          .filter(t => t.breakdown_by_type['not_applicable'] > (t.total_occurrences * 0.7))
          .map(t => ({
            field: t.field_name,
            categories: t.affects_categories,
            reason: 'Field consistently returns "Not Applicable" - likely not relevant for these categories',
            occurrences: t.total_occurrences
          })),
        
        fields_needing_better_data: highImpact
          .filter(t => 
            (t.breakdown_by_type['not_found'] || 0) > (t.total_occurrences * 0.5) ||
            (t.breakdown_by_type['unknown'] || 0) > (t.total_occurrences * 0.5)
          )
          .map(t => ({
            field: t.field_name,
            categories: t.affects_categories,
            reason: 'AI cannot find this information - improve data sources or research',
            occurrences: t.total_occurrences
          })),
        
        fields_needing_prompt_refinement: highImpact
          .filter(t => (t.breakdown_by_type['vague'] || 0) > (t.total_occurrences * 0.3))
          .map(t => ({
            field: t.field_name,
            categories: t.affects_categories,
            reason: 'AI returning vague responses - refine prompts to force specificity',
            occurrences: t.total_occurrences,
            common_vague_values: t.common_values.slice(0, 3)
          })),
        
        summary: {
          total_problematic_fields: highImpact.length,
          total_inconclusive_responses: highImpact.reduce((sum, t) => sum + t.total_occurrences, 0),
          categories_affected: [...new Set(highImpact.flatMap(t => t.affects_categories))]
        }
      };
      
      res.json({
        success: true,
        recommendations
      });
      
    } catch (error) {
      logger.error('[ResponseQualityController] Failed to get recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate recommendations'
      });
    }
  }
}

export default new ResponseQualityController();
