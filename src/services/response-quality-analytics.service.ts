import logger from '../utils/logger';
import { InconclusiveResponseLog } from '../models/inconclusive-response-log.model';

/**
 * Response Quality Analytics Service
 * Detects and tracks inconclusive/vague AI responses to identify problem areas
 */

export interface InconclusivePattern {
  value: string;
  type: 'not_applicable' | 'unknown' | 'not_found' | 'empty' | 'vague' | 'error';
  pattern: RegExp;
  potentialCause?: string;
}

export interface ResponseQualityData {
  sessionId: string;
  verificationJobId?: string;
  productId: string;
  sfCatalogId?: string;
  category: string;
  productStyle?: string;
  manufacturer?: string;
  modelNumber?: string;
  fieldName: string;
  fieldType: 'primary' | 'top_filter' | 'additional' | 'category';
  expectedSource: 'picklist' | 'free_text' | 'boolean' | 'number';
  openaiValue?: string;
  xaiValue?: string;
  consensusValue?: string;
  consensusReached: boolean;
  promptIncludedResearch: boolean;
  dataSourcesAvailable: string[];
}

export interface InconclusiveTrend {
  field_name: string;
  category?: string;
  total_occurrences: number;
  inconclusive_rate: number;
  breakdown_by_type: Record<string, number>;
  common_values: Array<{ value: string; count: number }>;
  affects_categories: string[];
  recommendation: string;
}

class ResponseQualityAnalyticsService {
  
  /**
   * Patterns that indicate inconclusive/vague responses
   */
  private readonly INCONCLUSIVE_PATTERNS: InconclusivePattern[] = [
    // Not Applicable variations
    { 
      value: 'Not Applicable', 
      type: 'not_applicable', 
      pattern: /^not applicable$/i,
      potentialCause: 'Field may not apply to this product type'
    },
    { 
      value: 'N/A', 
      type: 'not_applicable', 
      pattern: /^n\/?a$/i,
      potentialCause: 'Field may not apply to this product type'
    },
    { 
      value: 'Not Available', 
      type: 'not_applicable', 
      pattern: /^not available$/i,
      potentialCause: 'Data source lacks this information'
    },
    { 
      value: 'None', 
      type: 'not_applicable', 
      pattern: /^none$/i,
      potentialCause: 'Ambiguous - could mean N/A or zero quantity'
    },
    
    // Unknown variations
    { 
      value: 'Unknown', 
      type: 'unknown', 
      pattern: /^unknown$/i,
      potentialCause: 'AI could not determine value from available data'
    },
    { 
      value: 'Cannot Determine', 
      type: 'unknown', 
      pattern: /^cannot determine$/i,
      potentialCause: 'AI lacks confidence in available data'
    },
    { 
      value: 'Unable to Verify', 
      type: 'unknown', 
      pattern: /^unable to verify$/i,
      potentialCause: 'AI found conflicting information'
    },
    
    // Not Found variations
    { 
      value: 'Product Not Found', 
      type: 'not_found', 
      pattern: /product not found|not found/i,
      potentialCause: 'Data sources may not have this product'
    },
    { 
      value: 'Information Not Available', 
      type: 'not_found', 
      pattern: /information not available|info not available/i,
      potentialCause: 'Data sources incomplete for this field'
    },
    { 
      value: 'No Data', 
      type: 'not_found', 
      pattern: /^no data$/i,
      potentialCause: 'Field missing from all data sources'
    },
    
    // Empty/placeholder
    { 
      value: '-', 
      type: 'empty', 
      pattern: /^-+$/,
      potentialCause: 'Placeholder value instead of meaningful response'
    },
    { 
      value: '--', 
      type: 'empty', 
      pattern: /^--+$/,
      potentialCause: 'Placeholder value instead of meaningful response'
    },
    
    // Vague responses
    { 
      value: 'See Description', 
      type: 'vague', 
      pattern: /see description|refer to description/i,
      potentialCause: 'AI deflecting instead of extracting specific value'
    },
    { 
      value: 'Varies', 
      type: 'vague', 
      pattern: /^varies$/i,
      potentialCause: 'AI found multiple values but did not select one'
    },
    { 
      value: 'Multiple', 
      type: 'vague', 
      pattern: /^multiple$/i,
      potentialCause: 'AI found multiple values but did not select one'
    },
    { 
      value: 'Standard', 
      type: 'vague', 
      pattern: /^standard$/i,
      potentialCause: 'Generic response without specific value'
    },
    
    // Error indicators
    { 
      value: 'Error', 
      type: 'error', 
      pattern: /^error$/i,
      potentialCause: 'AI encountered processing error'
    },
    { 
      value: 'Invalid', 
      type: 'error', 
      pattern: /^invalid$/i,
      potentialCause: 'AI detected data quality issue'
    }
  ];
  
  /**
   * Check if a value is inconclusive/vague
   */
  private isInconclusiveValue(value: string | undefined | null): InconclusivePattern | null {
    if (!value || typeof value !== 'string') {
      return null;
    }
    
    const trimmedValue = value.trim();
    
    // Empty string
    if (trimmedValue === '') {
      return {
        value: '[empty]',
        type: 'empty',
        pattern: /^$/,
        potentialCause: 'AI returned empty value'
      };
    }
    
    // Check against known patterns
    for (const pattern of this.INCONCLUSIVE_PATTERNS) {
      if (pattern.pattern.test(trimmedValue)) {
        return pattern;
      }
    }
    
    return null;
  }
  
  /**
   * Track response quality for a specific field
   */
  async trackFieldResponse(data: ResponseQualityData): Promise<void> {
    try {
      // Check OpenAI response
      const openaiInconclusive = this.isInconclusiveValue(data.openaiValue);
      
      // Check xAI response
      const xaiInconclusive = this.isInconclusiveValue(data.xaiValue);
      
      // Determine which AI had inconclusive response
      let aiProvider: 'openai' | 'xai' | 'both' | null = null;
      let inconclusivePattern: InconclusivePattern | null = null;
      
      if (openaiInconclusive && xaiInconclusive) {
        aiProvider = 'both';
        inconclusivePattern = openaiInconclusive; // Use OpenAI's pattern
      } else if (openaiInconclusive && !xaiInconclusive) {
        aiProvider = 'openai';
        inconclusivePattern = openaiInconclusive;
      } else if (xaiInconclusive && !openaiInconclusive) {
        aiProvider = 'xai';
        inconclusivePattern = xaiInconclusive;
      }
      
      // Check if consensus value is also inconclusive (both AIs failed)
      const consensusInconclusive = this.isInconclusiveValue(data.consensusValue);
      
      // Log if we found inconclusive responses
      if (inconclusivePattern || consensusInconclusive) {
        const finalPattern = consensusInconclusive || inconclusivePattern!;
        
        await InconclusiveResponseLog.create({
          session_id: data.sessionId,
          verification_job_id: data.verificationJobId,
          timestamp: new Date(),
          
          product_id: data.productId,
          sf_catalog_id: data.sfCatalogId,
          category: data.category,
          product_style: data.productStyle,
          manufacturer: data.manufacturer,
          model_number: data.modelNumber,
          
          field_name: data.fieldName,
          field_type: data.fieldType,
          expected_source: data.expectedSource,
          
          inconclusive_value: data.consensusValue || finalPattern.value,
          inconclusive_type: finalPattern.type,
          ai_provider: aiProvider || 'both',
          openai_value: data.openaiValue,
          xai_value: data.xaiValue,
          consensus_reached: data.consensusReached && !consensusInconclusive,
          
          prompt_included_research: data.promptIncludedResearch,
          data_sources_available: data.dataSourcesAvailable,
          
          pattern_detected: finalPattern.value,
          potential_cause: finalPattern.potentialCause,
          
          created_at: new Date()
        });
        
        logger.debug('[ResponseQuality] Logged inconclusive response', {
          sessionId: data.sessionId,
          field: data.fieldName,
          type: finalPattern.type,
          value: finalPattern.value,
          aiProvider
        });
      }
      
    } catch (error) {
      logger.error('[ResponseQuality] Failed to track field response:', error);
    }
  }
  
  /**
   * Get inconclusive response trends by field
   */
  async getTrendsByField(category?: string, fieldType?: string): Promise<InconclusiveTrend[]> {
    try {
      const matchStage: any = {};
      if (category) matchStage.category = category;
      if (fieldType) matchStage.field_type = fieldType;
      
      const trends = await InconclusiveResponseLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              field_name: '$field_name',
              field_type: '$field_type',
              expected_source: '$expected_source'
            },
            total_occurrences: { $sum: 1 },
            categories: { $addToSet: '$category' },
            types: { $push: '$inconclusive_type' },
            values: { $push: '$inconclusive_value' },
            both_ai_failed: { 
              $sum: { $cond: [{ $eq: ['$ai_provider', 'both'] }, 1, 0] } 
            }
          }
        },
        { $sort: { total_occurrences: -1 } }
      ]);
      
      return trends.map(trend => {
        // Count occurrences of each inconclusive type
        const typeBreakdown: Record<string, number> = {};
        trend.types.forEach((type: string) => {
          typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
        });
        
        // Count occurrences of each value
        const valueCount: Record<string, number> = {};
        trend.values.forEach((val: string) => {
          valueCount[val] = (valueCount[val] || 0) + 1;
        });
        
        const commonValues = Object.entries(valueCount)
          .map(([value, count]) => ({ value, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        // Generate recommendation
        let recommendation = '';
        const mostCommonType = Object.entries(typeBreakdown)
          .sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];
        
        if (mostCommonType === 'not_applicable') {
          recommendation = `Consider removing "${trend._id.field_name}" from ${trend._id.field_type} list for these categories`;
        } else if (mostCommonType === 'unknown' || mostCommonType === 'not_found') {
          recommendation = `Improve data sources or research capabilities for "${trend._id.field_name}"`;
        } else if (mostCommonType === 'vague') {
          recommendation = `Refine prompts to force specific values for "${trend._id.field_name}"`;
        }
        
        return {
          field_name: trend._id.field_name,
          total_occurrences: trend.total_occurrences,
          inconclusive_rate: trend.both_ai_failed / trend.total_occurrences,
          breakdown_by_type: typeBreakdown,
          common_values: commonValues,
          affects_categories: trend.categories,
          recommendation
        };
      });
      
    } catch (error) {
      logger.error('[ResponseQuality] Failed to get trends by field:', error);
      throw error;
    }
  }
  
  /**
   * Get inconclusive response trends by category
   */
  async getTrendsByCategory(startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const matchStage: any = {};
      if (startDate || endDate) {
        matchStage.timestamp = {};
        if (startDate) matchStage.timestamp.$gte = startDate;
        if (endDate) matchStage.timestamp.$lte = endDate;
      }
      
      const trends = await InconclusiveResponseLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              category: '$category',
              field_type: '$field_type'
            },
            total_inconclusive: { $sum: 1 },
            fields_affected: { $addToSet: '$field_name' },
            both_ai_failed: { 
              $sum: { $cond: [{ $eq: ['$ai_provider', 'both'] }, 1, 0] } 
            }
          }
        },
        { $sort: { total_inconclusive: -1 } }
      ]);
      
      return trends;
      
    } catch (error) {
      logger.error('[ResponseQuality] Failed to get trends by category:', error);
      throw error;
    }
  }
  
  /**
   * Get summary statistics
   */
  async getSummaryStats(startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const matchStage: any = {};
      if (startDate || endDate) {
        matchStage.timestamp = {};
        if (startDate) matchStage.timestamp.$gte = startDate;
        if (endDate) matchStage.timestamp.$lte = endDate;
      }
      
      const stats = await InconclusiveResponseLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total_inconclusive: { $sum: 1 },
            unique_fields: { $addToSet: '$field_name' },
            unique_categories: { $addToSet: '$category' },
            both_ai_failed: { 
              $sum: { $cond: [{ $eq: ['$ai_provider', 'both'] }, 1, 0] } 
            },
            primary_field_issues: {
              $sum: { $cond: [{ $eq: ['$field_type', 'primary'] }, 1, 0] }
            },
            filter_field_issues: {
              $sum: { $cond: [{ $eq: ['$field_type', 'top_filter'] }, 1, 0] }
            }
          }
        }
      ]);
      
      if (stats.length === 0) {
        return {
          total_inconclusive: 0,
          unique_fields_affected: 0,
          unique_categories_affected: 0,
          both_ai_failed_count: 0,
          both_ai_failed_rate: 0,
          primary_field_issues: 0,
          filter_field_issues: 0
        };
      }
      
      const result = stats[0];
      return {
        total_inconclusive: result.total_inconclusive,
        unique_fields_affected: result.unique_fields.length,
        unique_categories_affected: result.unique_categories.length,
        both_ai_failed_count: result.both_ai_failed,
        both_ai_failed_rate: result.both_ai_failed / result.total_inconclusive,
        primary_field_issues: result.primary_field_issues,
        filter_field_issues: result.filter_field_issues
      };
      
    } catch (error) {
      logger.error('[ResponseQuality] Failed to get summary stats:', error);
      throw error;
    }
  }
}

export default new ResponseQualityAnalyticsService();
