import logger from '../utils/logger';
import { FieldAnalytics } from '../models/field-analytics.model';

/**
 * Field Analytics Tracking Service
 * Tracks which fields are populated, missing, or require research
 */

interface FieldPopulationData {
  sessionId: string;
  productId: string;
  category: string;
  
  // Field population tracking
  primaryFieldsPopulated: string[];
  primaryFieldsMissing: string[];
  filterFieldsPopulated: string[];
  filterFieldsMissing: string[];
  additionalFieldsPopulated: string[];
  
  // Research tracking
  researchTriggered: boolean;
  fieldsResearched: string[];
  fieldsPopulatedByResearch: string[];
  
  // AI tracking
  openaiConfidence: number;
  xaiConfidence: number;
  consensusReached: boolean;
}

class FieldAnalyticsService {
  /**
   * Track field population for a verification session
   */
  async trackFieldPopulation(data: FieldPopulationData): Promise<void> {
    try {
      const totalPrimaryFields = data.primaryFieldsPopulated.length + data.primaryFieldsMissing.length;
      const totalFilterFields = data.filterFieldsPopulated.length + data.filterFieldsMissing.length;
      
      const populationRate = {
        primary: totalPrimaryFields > 0 
          ? (data.primaryFieldsPopulated.length / totalPrimaryFields) * 100 
          : 0,
        filter: totalFilterFields > 0 
          ? (data.filterFieldsPopulated.length / totalFilterFields) * 100 
          : 0,
        overall: (data.primaryFieldsPopulated.length + data.filterFieldsPopulated.length) / 
                 (totalPrimaryFields + totalFilterFields) * 100
      };

      await FieldAnalytics.create({
        sessionId: data.sessionId,
        productId: data.productId,
        category: data.category,
        
        // Primary attributes
        primaryFieldsTotal: totalPrimaryFields,
        primaryFieldsPopulated: data.primaryFieldsPopulated.length,
        primaryFieldsMissing: data.primaryFieldsMissing,
        primaryPopulationRate: populationRate.primary,
        
        // Filter attributes
        filterFieldsTotal: totalFilterFields,
        filterFieldsPopulated: data.filterFieldsPopulated.length,
        filterFieldsMissing: data.filterFieldsMissing,
        filterPopulationRate: populationRate.filter,
        
        // Additional attributes
        additionalFieldsPopulated: data.additionalFieldsPopulated.length,
        additionalFieldsList: data.additionalFieldsPopulated,
        
        // Overall
        overallPopulationRate: populationRate.overall,
        
        // Research tracking
        researchTriggered: data.researchTriggered,
        fieldsResearched: data.fieldsResearched,
        fieldsPopulatedByResearch: data.fieldsPopulatedByResearch,
        researchEffectivenessRate: data.fieldsResearched.length > 0
          ? (data.fieldsPopulatedByResearch.length / data.fieldsResearched.length) * 100
          : 0,
        
        // AI metrics
        openaiConfidence: data.openaiConfidence,
        xaiConfidence: data.xaiConfidence,
        consensusReached: data.consensusReached,
        
        timestamp: new Date()
      });

      logger.debug('[FieldAnalytics] Tracked field population', {
        sessionId: data.sessionId,
        category: data.category,
        populationRate: populationRate.overall.toFixed(1) + '%'
      });
    } catch (error) {
      logger.error('[FieldAnalytics] Failed to track field population:', error);
    }
  }

  /**
   * Get most commonly missing fields for a category
   */
  async getMostCommonlyMissingFields(category: string, limit: number = 10): Promise<any[]> {
    try {
      const result = await FieldAnalytics.aggregate([
        { $match: { category } },
        { $unwind: '$primaryFieldsMissing' },
        { $group: {
          _id: '$primaryFieldsMissing',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$overallPopulationRate' }
        }},
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      return result;
    } catch (error) {
      logger.error('[FieldAnalytics] Failed to get missing fields:', error);
      return [];
    }
  }

  /**
   * Get field population statistics for a category
   */
  async getCategoryStatistics(category: string): Promise<any> {
    try {
      const stats = await FieldAnalytics.aggregate([
        { $match: { category } },
        { $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          avgPrimaryPopulation: { $avg: '$primaryPopulationRate' },
          avgFilterPopulation: { $avg: '$filterPopulationRate' },
          avgOverallPopulation: { $avg: '$overallPopulationRate' },
          researchTriggeredCount: { 
            $sum: { $cond: ['$researchTriggered', 1, 0] }
          },
          avgResearchEffectiveness: { $avg: '$researchEffectivenessRate' }
        }}
      ]);

      return stats[0] || null;
    } catch (error) {
      logger.error('[FieldAnalytics] Failed to get category stats:', error);
      return null;
    }
  }

  /**
   * Get research effectiveness report
   */
  async getResearchEffectiveness(days: number = 7): Promise<any> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      const stats = await FieldAnalytics.aggregate([
        { $match: { 
          timestamp: { $gte: cutoffDate },
          researchTriggered: true
        }},
        { $group: {
          _id: null,
          totalResearchSessions: { $sum: 1 },
          avgFieldsResearched: { $avg: { $size: '$fieldsResearched' } },
          avgFieldsPopulated: { $avg: { $size: '$fieldsPopulatedByResearch' } },
          avgEffectiveness: { $avg: '$researchEffectivenessRate' }
        }}
      ]);

      return stats[0] || null;
    } catch (error) {
      logger.error('[FieldAnalytics] Failed to get research effectiveness:', error);
      return null;
    }
  }

  /**
   * Get overall dashboard metrics
   */
  async getDashboardMetrics(days: number = 7): Promise<any> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      const metrics = await FieldAnalytics.aggregate([
        { $match: { timestamp: { $gte: cutoffDate } } },
        { $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          avgPopulationRate: { $avg: '$overallPopulationRate' },
          avgPrimaryRate: { $avg: '$primaryPopulationRate' },
          avgFilterRate: { $avg: '$filterPopulationRate' },
          researchTriggerRate: {
            $avg: { $cond: ['$researchTriggered', 100, 0] }
          },
          avgConsensusRate: {
            $avg: { $cond: ['$consensusReached', 100, 0] }
          }
        }}
      ]);

      return metrics[0] || {
        totalProducts: 0,
        avgPopulationRate: 0,
        avgPrimaryRate: 0,
        avgFilterRate: 0,
        researchTriggerRate: 0,
        avgConsensusRate: 0
      };
    } catch (error) {
      logger.error('[FieldAnalytics] Failed to get dashboard metrics:', error);
      return null;
    }
  }
}

export default new FieldAnalyticsService();
