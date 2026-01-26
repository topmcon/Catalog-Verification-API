/**
 * Verification Analytics Service
 * Stores verification data and computes analytics for trends and ML training
 */

import { 
  VerificationResult, 
  IVerificationResult,
  FieldMetrics,
  CategoryMetrics,
  AIProviderMetrics,
  TrainingExample
} from '../models/verification-analytics.model';
import { SalesforceVerificationResponse, FieldAIReviews } from '../types/salesforce.types';
import logger from '../utils/logger';

export class VerificationAnalyticsService {
  
  /**
   * Store a complete verification result for analysis
   */
  async storeVerificationResult(
    sessionId: string,
    inputPayload: any,
    response: SalesforceVerificationResponse,
    processingTimeMs: number,
    aiTimings: { openai: number; xai: number }
  ): Promise<void> {
    try {
      const fieldResults = this.extractFieldResults(response.Field_AI_Reviews || {});
      const consensusSummary = this.calculateConsensusSummary(fieldResults);
      
      const result: Partial<IVerificationResult> = {
        session_id: sessionId,
        sf_catalog_id: response.SF_Catalog_Id,
        sf_catalog_name: response.SF_Catalog_Name,
        timestamp: new Date(),
        processing_time_ms: processingTimeMs,
        
        input_payload: {
          brand: inputPayload.Brand_Web_Retailer || inputPayload.Ferguson_Brand || '',
          category: inputPayload.Web_Retailer_Category || '',
          subcategory: inputPayload.Web_Retailer_SubCategory || '',
          model_number: inputPayload.Model_Number_Web_Retailer || '',
          title: inputPayload.Product_Title_Web_Retailer || '',
          description: (inputPayload.Product_Description_Web_Retailer || '').substring(0, 500),
          msrp_web_retailer: this.parsePrice(inputPayload.MSRP_Web_Retailer),
          msrp_ferguson: this.parsePrice(inputPayload.Ferguson_Price),
          image_count: inputPayload.Stock_Images?.length || 0,
          document_count: inputPayload.Documents?.length || 0,
          has_ferguson_url: !!inputPayload.Ferguson_URL,
          has_reference_url: !!inputPayload.Reference_URL
        },
        
        ai_results: {
          openai: {
            responded: response.AI_Review?.openai?.reviewed || false,
            response_time_ms: aiTimings.openai,
            confidence: response.AI_Review?.openai?.confidence || 0,
            fields_returned: response.AI_Review?.openai?.fields_verified || 0,
            error: response.AI_Review?.openai?.error_message
          },
          xai: {
            responded: response.AI_Review?.xai?.reviewed || false,
            response_time_ms: aiTimings.xai,
            confidence: response.AI_Review?.xai?.confidence || 0,
            fields_returned: response.AI_Review?.xai?.fields_verified || 0,
            error: response.AI_Review?.xai?.error_message
          }
        },
        
        consensus: consensusSummary,
        field_results: fieldResults,
        
        documents_analyzed: this.parseDocumentsAnalyzed(response),
        
        verification_score: response.Verification?.verification_score || 0,
        verification_status: response.Verification?.verification_status || 'failed',
        status: (response.Status === 'success' ? 'success' : response.Status === 'partial' ? 'partial' : 'error') as 'success' | 'partial' | 'error',
        
        product_category: response.Primary_Attributes?.Category_Verified || inputPayload.Web_Retailer_Category || 'Unknown',
        product_subcategory: response.Primary_Attributes?.SubCategory_Verified || inputPayload.Web_Retailer_SubCategory || '',
        brand: response.Primary_Attributes?.Brand_Verified || inputPayload.Brand_Web_Retailer || 'Unknown'
      };
      
      // Create with explicit error handling and validation
      try {
        await VerificationResult.create(result);
      } catch (createError: any) {
        // If there's a validation error, log details and try to save without problematic fields
        if (createError.name === 'ValidationError') {
          logger.error('Validation error saving verification result', {
            error: createError.message,
            errors: createError.errors,
            session_id: sessionId
          });
          
          // Try saving without documents_analyzed if that's the problem
          const fallbackResult = { ...result };
          delete fallbackResult.documents_analyzed;
          await VerificationResult.create(fallbackResult);
          logger.warn('Saved verification result without documents_analyzed field', { session_id: sessionId });
        } else {
          throw createError;
        }
      }
      
      // Update aggregated metrics asynchronously
      this.updateAggregatedMetrics(result as IVerificationResult).catch(err => {
        logger.error('Failed to update aggregated metrics', { error: err.message });
      });
      
      logger.info('Stored verification result for analytics', { 
        session_id: sessionId,
        consensus_agreement: consensusSummary.agreement_percentage
      });
      
    } catch (error: any) {
      logger.error('Failed to store verification result', { error: error.message });
    }
  }
  
  /**
   * Extract field-level results from Field_AI_Reviews
   */
  private extractFieldResults(fieldReviews: FieldAIReviews): IVerificationResult['field_results'] {
    const results: IVerificationResult['field_results'] = [];
    
    for (const [fieldName, review] of Object.entries(fieldReviews)) {
      if (!review) continue;
      
      results.push({
        field_name: fieldName,
        field_category: this.categorizeField(fieldName),
        openai_value: review.openai?.value,
        openai_confidence: review.openai?.confidence || 0,
        xai_value: review.xai?.value,
        xai_confidence: review.xai?.confidence || 0,
        consensus_status: review.consensus,
        final_value: review.final_value,
        source_selected: review.source,
        values_identical: this.valuesMatch(review.openai?.value, review.xai?.value)
      });
    }
    
    return results;
  }
  
  /**
   * Categorize field as primary, filter, or additional
   */
  private categorizeField(fieldName: string): 'primary' | 'filter' | 'additional' {
    const primaryFields = ['Brand_Verified', 'Category_Verified', 'SubCategory_Verified', 'Product_Title_Verified', 'Description_Verified'];
    const filterFields = ['Material', 'Color', 'Finish', 'Style', 'Installation_Type', 'Drain_Location'];
    
    if (primaryFields.includes(fieldName)) return 'primary';
    if (filterFields.some(f => fieldName.includes(f))) return 'filter';
    return 'additional';
  }
  
  /**
   * Check if two values match (handling different types)
   */
  private valuesMatch(val1: any, val2: any): boolean {
    if (val1 === val2) return true;
    if (val1 == null || val2 == null) return false;
    
    const str1 = String(val1).toLowerCase().trim();
    const str2 = String(val2).toLowerCase().trim();
    return str1 === str2;
  }
  
  /**
   * Calculate consensus summary from field results
   */
  private calculateConsensusSummary(fieldResults: IVerificationResult['field_results']): IVerificationResult['consensus'] {
    const total = fieldResults.length;
    const agreed = fieldResults.filter(f => f.consensus_status === 'agreed').length;
    const partial = fieldResults.filter(f => f.consensus_status === 'partial').length;
    const disagreed = fieldResults.filter(f => f.consensus_status === 'disagreed').length;
    const singleSource = fieldResults.filter(f => f.consensus_status === 'single_source').length;
    
    return {
      total_fields: total,
      agreed_count: agreed,
      partial_count: partial,
      disagreed_count: disagreed,
      single_source_count: singleSource,
      agreement_percentage: total > 0 ? Math.round((agreed / total) * 100) : 0
    };
  }
  
  /**
   * Parse price string to number
   */
  private parsePrice(price: any): number {
    if (typeof price === 'number') return price;
    if (!price) return 0;
    return parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0;
  }
  
  /**
   * Update aggregated metrics (field, category, AI provider)
   */
  private async updateAggregatedMetrics(result: IVerificationResult): Promise<void> {
    // Update field metrics
    for (const field of result.field_results) {
      await this.updateFieldMetrics(field, result.product_category);
    }
    
    // Update category metrics
    await this.updateCategoryMetrics(result);
    
    // Update AI provider metrics
    await this.updateAIProviderMetrics(result);
    
    // Generate training examples from high-confidence results
    await this.generateTrainingExamples(result);
  }
  
  /**
   * Update per-field aggregated metrics
   */
  private async updateFieldMetrics(
    field: IVerificationResult['field_results'][0],
    _category: string
  ): Promise<void> {
    try {
      const update: any = {
        $inc: {
          total_occurrences: 1,
          [`${field.consensus_status}_count`]: 1
        },
        $set: {
          field_category: field.field_category,
          last_updated: new Date()
        }
      };
      
      if (field.source_selected === 'openai_selected' || field.source_selected === 'both_agreed') {
        update.$inc.openai_selected_count = (field.source_selected === 'openai_selected') ? 1 : 0;
      }
      if (field.source_selected === 'xai_selected') {
        update.$inc.xai_selected_count = 1;
      }
      
      await FieldMetrics.findOneAndUpdate(
        { field_name: field.field_name },
        update,
        { upsert: true }
      );
    } catch (error: any) {
      logger.error('Failed to update field metrics', { field: field.field_name, error: error.message });
    }
  }
  
  /**
   * Update category-level metrics
   */
  private async updateCategoryMetrics(result: IVerificationResult): Promise<void> {
    try {
      await CategoryMetrics.findOneAndUpdate(
        { category: result.product_category, subcategory: result.product_subcategory || null },
        {
          $inc: {
            total_verifications: 1,
            [`${result.verification_status}_count`]: 1
          },
          $set: {
            last_updated: new Date()
          }
        },
        { upsert: true }
      );
    } catch (error: any) {
      logger.error('Failed to update category metrics', { error: error.message });
    }
  }
  
  /**
   * Update AI provider comparison metrics
   */
  private async updateAIProviderMetrics(result: IVerificationResult): Promise<void> {
    try {
      // Update OpenAI metrics
      await AIProviderMetrics.findOneAndUpdate(
        { provider: 'openai' },
        {
          $inc: {
            total_calls: 1,
            successful_calls: result.ai_results.openai.responded ? 1 : 0,
            failed_calls: result.ai_results.openai.responded ? 0 : 1
          },
          $set: { last_updated: new Date() }
        },
        { upsert: true }
      );
      
      // Update xAI metrics
      await AIProviderMetrics.findOneAndUpdate(
        { provider: 'xai' },
        {
          $inc: {
            total_calls: 1,
            successful_calls: result.ai_results.xai.responded ? 1 : 0,
            failed_calls: result.ai_results.xai.responded ? 0 : 1
          },
          $set: { last_updated: new Date() }
        },
        { upsert: true }
      );
    } catch (error: any) {
      logger.error('Failed to update AI provider metrics', { error: error.message });
    }
  }
  
  /**
   * Generate training examples from high-confidence consensus results
   */
  private async generateTrainingExamples(result: IVerificationResult): Promise<void> {
    try {
      // Only create training examples from high-agreement results
      if (result.consensus.agreement_percentage < 80) return;
      
      for (const field of result.field_results) {
        // Only use agreed fields with high confidence
        if (field.consensus_status !== 'agreed') continue;
        if (field.openai_confidence < 85 || field.xai_confidence < 85) continue;
        
        await TrainingExample.create({
          input: {
            product_text: `${result.input_payload.title} ${result.input_payload.description}`,
            brand: result.input_payload.brand,
            category: result.input_payload.category,
            model_number: result.input_payload.model_number,
            price: result.input_payload.msrp_web_retailer
          },
          output: {
            field_name: field.field_name,
            correct_value: field.final_value,
            source: 'consensus',
            confidence: (field.openai_confidence + field.xai_confidence) / 2
          },
          created_from_session: result.session_id,
          high_confidence: true,
          manually_verified: false,
          use_for_training: true
        });
      }
    } catch (error: any) {
      logger.error('Failed to generate training examples', { error: error.message });
    }
  }
  
  // ============================================================
  // ANALYTICS QUERIES
  // ============================================================
  
  /**
   * Get overall system health metrics
   */
  async getSystemHealth(days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const results = await VerificationResult.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          total_calls: { $sum: 1 },
          avg_verification_score: { $avg: '$verification_score' },
          avg_agreement_percentage: { $avg: '$consensus.agreement_percentage' },
          avg_processing_time: { $avg: '$processing_time_ms' },
          verified_count: { $sum: { $cond: [{ $eq: ['$verification_status', 'verified'] }, 1, 0] } },
          enriched_count: { $sum: { $cond: [{ $eq: ['$verification_status', 'enriched'] }, 1, 0] } },
          needs_review_count: { $sum: { $cond: [{ $eq: ['$verification_status', 'needs_review'] }, 1, 0] } },
          failed_count: { $sum: { $cond: [{ $eq: ['$verification_status', 'failed'] }, 1, 0] } }
        }
      }
    ]);
    
    return results[0] || {};
  }
  
  /**
   * Get field agreement trends
   */
  async getFieldAgreementTrends(): Promise<any[]> {
    return FieldMetrics.find()
      .sort({ agreement_rate: 1 })  // Worst performing first
      .limit(20)
      .lean();
  }
  
  /**
   * Get problematic fields (low agreement rate)
   */
  async getProblematicFields(threshold: number = 70): Promise<any[]> {
    return VerificationResult.aggregate([
      { $unwind: '$field_results' },
      {
        $group: {
          _id: '$field_results.field_name',
          total: { $sum: 1 },
          agreed: { $sum: { $cond: [{ $eq: ['$field_results.consensus_status', 'agreed'] }, 1, 0] } },
          partial: { $sum: { $cond: [{ $eq: ['$field_results.consensus_status', 'partial'] }, 1, 0] } },
          disagreed: { $sum: { $cond: [{ $eq: ['$field_results.consensus_status', 'disagreed'] }, 1, 0] } }
        }
      },
      {
        $addFields: {
          agreement_rate: { $multiply: [{ $divide: ['$agreed', '$total'] }, 100] }
        }
      },
      { $match: { agreement_rate: { $lt: threshold }, total: { $gte: 5 } } },
      { $sort: { agreement_rate: 1 } }
    ]);
  }
  
  /**
   * Get AI provider comparison
   */
  async getAIProviderComparison(): Promise<any> {
    const [openai, xai] = await Promise.all([
      AIProviderMetrics.findOne({ provider: 'openai' }).lean(),
      AIProviderMetrics.findOne({ provider: 'xai' }).lean()
    ]);
    
    return { openai, xai };
  }
  
  /**
   * Get category performance breakdown
   */
  async getCategoryPerformance(): Promise<any[]> {
    return VerificationResult.aggregate([
      {
        $group: {
          _id: '$product_category',
          total: { $sum: 1 },
          avg_score: { $avg: '$verification_score' },
          avg_agreement: { $avg: '$consensus.agreement_percentage' },
          verified_rate: {
            $avg: { $cond: [{ $eq: ['$verification_status', 'verified'] }, 1, 0] }
          }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 20 }
    ]);
  }
  
  /**
   * Get daily trend data for charts
   */
  async getDailyTrends(days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return VerificationResult.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          calls: { $sum: 1 },
          avg_score: { $avg: '$verification_score' },
          avg_agreement: { $avg: '$consensus.agreement_percentage' },
          agreed_fields: { $sum: '$consensus.agreed_count' },
          partial_fields: { $sum: '$consensus.partial_count' },
          disagreed_fields: { $sum: '$consensus.disagreed_count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }
  
  /**
   * Export training data for ML
   */
  async exportTrainingData(options: {
    fieldName?: string;
    minConfidence?: number;
    limit?: number;
  } = {}): Promise<any[]> {
    const query: any = { use_for_training: true };
    
    if (options.fieldName) {
      query['output.field_name'] = options.fieldName;
    }
    if (options.minConfidence) {
      query['output.confidence'] = { $gte: options.minConfidence };
    }
    
    return TrainingExample.find(query)
      .limit(options.limit || 10000)
      .lean();
  }
  
  /**
   * Get consensus disagreement examples (for manual review/correction)
   */
  async getDisagreementExamples(limit: number = 50): Promise<any[]> {
    return VerificationResult.aggregate([
      { $unwind: '$field_results' },
      { $match: { 'field_results.consensus_status': { $in: ['partial', 'disagreed'] } } },
      {
        $project: {
          session_id: 1,
          sf_catalog_id: 1,
          product_category: 1,
          field_name: '$field_results.field_name',
          openai_value: '$field_results.openai_value',
          openai_confidence: '$field_results.openai_confidence',
          xai_value: '$field_results.xai_value',
          xai_confidence: '$field_results.xai_confidence',
          final_value: '$field_results.final_value',
          source_selected: '$field_results.source_selected'
        }
      },
      { $sort: { timestamp: -1 } },
      { $limit: limit }
    ]);
  }

  /**
   * Safely parse documents_analyzed field to prevent cast errors
   * Handles multiple formats: array of objects, JSON string, util.inspect output
   */
  private parseDocumentsAnalyzed(response: SalesforceVerificationResponse): Array<{
    url: string;
    type: string;
    ai_recommendation: 'skip' | 'use' | 'review';
    relevance_score: number;
    contributed_to_verification: boolean;
  }> {
    try {
      // Handle multiple possible formats
      let docs: any = response.Documents?.documents;
      
      // If docs is undefined/null, return empty array
      if (!docs) {
        return [];
      }
      
      // If it's already a proper array of objects with url property, process it directly
      if (Array.isArray(docs) && docs.length > 0 && typeof docs[0] === 'object' && docs[0] !== null && !Array.isArray(docs[0])) {
        return this.mapDocumentsToSchema(docs);
      }
      
      // If it's an empty array, return it
      if (Array.isArray(docs) && docs.length === 0) {
        return [];
      }
      
      // If it's a string, try to parse it
      if (typeof docs === 'string') {
        const cleanedString = docs.trim();
        
        // Skip if it looks like a util.inspect or malformed string representation
        // These contain patterns like "'[\\n' +" or "url:" instead of "\"url\":"
        if (cleanedString.includes("'[\\n'") || 
            cleanedString.includes("' +\\n") ||
            cleanedString.includes('\\n  ') ||
            (cleanedString.includes("url:") && !cleanedString.includes('"url"') && !cleanedString.includes("'url'"))) {
          logger.warn('Documents field appears to be malformed util.inspect output, returning empty array', {
            stringPreview: cleanedString.substring(0, 100)
          });
          return [];
        }
        
        try {
          // Try parsing as JSON first
          docs = JSON.parse(cleanedString);
        } catch (e) {
          // If that fails, try to extract array from string like "[{...}, {...}]"
          const arrayMatch = cleanedString.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            try {
              docs = JSON.parse(arrayMatch[0]);
            } catch (e2) {
              logger.warn('Failed to parse documents string even after cleanup, returning empty array', { 
                stringPreview: cleanedString.substring(0, 100) 
              });
              return [];
            }
          } else {
            logger.warn('Documents field is a string but not parseable, returning empty array', { 
              stringPreview: cleanedString.substring(0, 100)
            });
            return [];
          }
        }
      }
      
      // If not an array after parsing attempts, return empty
      if (!Array.isArray(docs)) {
        logger.warn('Documents field is not an array after parsing attempts, returning empty array', { 
          type: typeof docs,
          value: typeof docs === 'object' ? JSON.stringify(docs).substring(0, 100) : String(docs).substring(0, 100)
        });
        return [];
      }
      
      return this.mapDocumentsToSchema(docs);
      
    } catch (error) {
      logger.error('Error parsing documents_analyzed, returning empty array', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return [];
    }
  }

  /**
   * Map document array to schema format with validation
   */
  private mapDocumentsToSchema(docs: any[]): Array<{
    url: string;
    type: string;
    ai_recommendation: 'skip' | 'use' | 'review';
    relevance_score: number;
    contributed_to_verification: boolean;
  }> {
    return docs.map(doc => {
      // Handle case where doc might be a string or object
      if (typeof doc === 'string') {
        try {
          doc = JSON.parse(doc);
        } catch (e) {
          return null; // Will be filtered out
        }
      }
      
      if (!doc || typeof doc !== 'object') {
        return null;
      }
      
      const recommendation = String(doc.ai_recommendation || 'review');
      return {
        url: String(doc.url || ''),
        type: String(doc.type || 'unknown'),
        ai_recommendation: (['skip', 'use', 'review'].includes(recommendation) ? recommendation : 'review') as 'skip' | 'use' | 'review',
        relevance_score: Number(doc.relevance_score || 0),
        contributed_to_verification: doc.ai_recommendation === 'use'
      };
    })
    .filter((doc): doc is NonNullable<typeof doc> => doc !== null && !!doc.url);
  }
}

export const verificationAnalyticsService = new VerificationAnalyticsService();
