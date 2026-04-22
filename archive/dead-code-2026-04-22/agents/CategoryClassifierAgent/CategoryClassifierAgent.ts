/**
 * CategoryClassifierAgent - Hierarchical product category classification
 * 
 * Strategy:
 * 1. Fast-path: If both sources agree on exact picklist match, skip chain (60-70% of products)
 * 2. 3-step chain: Department → Family → Category (for ambiguous cases)
 * 3. Dual-AI consensus with cross-context retry
 * 
 * Handles edge case: Cross-department conflicts (Ferguson=Lighting, WebRetailer=Plumbing)
 */

import { BaseAgent, BaseAgentConfig } from '../base/BaseAgent';
import { 
  AgentTaskType, 
  AgentConsensus, 
  AgentDiscrepancy,
  RetryContext,
  getClassificationHash
} from '../base/types';
import {
  CategoryClassifierInput,
  CategoryClassifierOutput,
  FastPathResult,
  Step1Response,
  Step2Response,
  Step3Response,
} from './schema';
import { buildDepartmentPrompt } from './prompts/step1-department.prompt';
import { buildFamilyPrompt } from './prompts/step2-family.prompt';
import { buildCategoryPrompt } from './prompts/step3-category.prompt';
import logger from '../../utils/logger';

export class CategoryClassifierAgent extends BaseAgent<
  CategoryClassifierInput,
  CategoryClassifierOutput
> {
  /**
   * Declare input dependencies (explicit schema)
   */
  static inputSchema = [
    'rawProduct.ferguson.category',
    'rawProduct.ferguson.productType',
    'rawProduct.ferguson.title',
    'rawProduct.ferguson.businessCategory',
    'rawProduct.ferguson.url',
    'rawProduct.webRetailer.category',
    'rawProduct.webRetailer.subCategory',
    'rawProduct.webRetailer.title',
    'rawProduct.webRetailer.url',
    'rawProduct.webRetailer.description',
    'rawProduct.sfCatalogId',
    'rawProduct.sfCatalogName',
  ];
  
  constructor(config: BaseAgentConfig) {
    super({
      ...config,
      taskType: config.taskType ?? AgentTaskType.CATEGORY_CLASSIFICATION,
    });
  }
  
  /**
   * Main execution: Fast-path check → 3-step chain
   */
  async execute(
    input: CategoryClassifierInput,
    provider: 'openai' | 'xai',
    retryContext?: RetryContext
  ): Promise<CategoryClassifierOutput> {
    const startTime = Date.now();
    
    // Fast-path: If both sources agree on exact picklist match, skip chain
    if (!retryContext) { // Only attempt fast-path on initial execution, not retry
      const fastPath = await this.attemptFastPath(input);
      if (fastPath.success && fastPath.output) {
        logger.info(`Fast-path used for ${input.sfCatalogId} (${provider})`);
        return {
          ...fastPath.output,
          provider,
          processingTimeMs: Date.now() - startTime,
          reasoning: {
            ...fastPath.output.reasoning,
            fastPathUsed: true,
          },
        };
      }
    }
    
    // Fall through to 3-step chain
    return this.executeChain(input, provider, retryContext);
  }
  
  /**
   * Fast-path: Check if both sources agree on exact picklist match
   * 
   * Uses existing normalization from picklist-matcher.service.ts
   * Only succeeds if BOTH sources normalize to SAME canonical picklist entry
   */
  private async attemptFastPath(
    input: CategoryClassifierInput
  ): Promise<FastPathResult> {
    try {
      // Brand collision suppresses fast-path entirely — ambiguous signal
      if (this.debugLogger?.hasBrandCollision) {
        const reason = 'Brand collision detected — fast-path suppressed';
        this.debugLogger?.recordFastPathMiss(reason);
        logger.info(`Fast-path suppressed for ${input.sfCatalogId}: brand collision`);
        return { success: false, reason };
      }

      // Normalize both sources using production picklist matching
      const fergusonNormalized = this.normalizeCategoryString(input.fergusonCategory);
      const webRetailerNormalized = this.normalizeCategoryString(input.webRetailerCategory);
      
      // Find picklist matches
      const fergusonMatch = await this.findPicklistMatch(fergusonNormalized);
      const webRetailerMatch = await this.findPicklistMatch(webRetailerNormalized);
      
      // Fast-path only if BOTH match AND they're the SAME category
      if (
        fergusonMatch &&
        webRetailerMatch &&
        fergusonMatch.categoryId === webRetailerMatch.categoryId
      ) {
        // Both sources agree on exact picklist entry
        this.debugLogger?.recordFastPathHit(
          fergusonNormalized,
          fergusonMatch.category,
          webRetailerNormalized,
          webRetailerMatch.category,
        );

        return {
          success: true,
          output: {
            department: fergusonMatch.department,
            family: fergusonMatch.family,
            category: fergusonMatch.category,
            categoryId: fergusonMatch.categoryId,
            confidence: 92, // High confidence for exact agreement
            locked: false, // Soft lock (can be re-evaluated)
            reasoning: {
              step1Department: `Both sources agree: ${fergusonMatch.department}`,
              step2Family: `Both sources agree: ${fergusonMatch.family}`,
              step3Category: `Both sources agree: ${fergusonMatch.category}`,
              departmentMismatch: false,
              fastPathUsed: true,
            },
            provider: 'openai', // Will be overridden by caller
            classificationHash: getClassificationHash(
              fergusonMatch.category,
              fergusonMatch.department,
              fergusonMatch.family
            ),
          },
        };
      }
      
      // No fast-path: ambiguity or mismatch
      const reason = 'Sources do not agree on exact picklist match';
      this.debugLogger?.recordFastPathMiss(reason, {
        fergusonNormalized,
        fergusonPicklistMatch: fergusonMatch?.category,
        webRetailerNormalized,
        webRetailerPicklistMatch: webRetailerMatch?.category,
      });

      return { success: false, reason };
    } catch (error) {
      logger.error('Fast-path check failed:', error);
      const reason = 'Fast-path check error';
      this.debugLogger?.recordFastPathMiss(reason);
      return { success: false, reason };
    }
  }
  
  /**
   * 3-step hierarchical chain: Department → Family → Category
   */
  private async executeChain(
    input: CategoryClassifierInput,
    provider: 'openai' | 'xai',
    retryContext?: RetryContext
  ): Promise<CategoryClassifierOutput> {
    const startTime = Date.now();
    
    try {
      // Step 1: Department Classification
      const step1Prompt = buildDepartmentPrompt(input);
      const step1Result = await this.callAI(step1Prompt, provider, retryContext);
      const step1: Step1Response = step1Result.response;

      this.debugLogger?.recordChainStep(
        1, 'Department', !!retryContext,
        { value: step1.department, confidence: step1.confidence, reasoning: step1.reasoning, departmentMismatch: step1.departmentMismatch },
        { value: step1.department, confidence: step1.confidence, reasoning: step1.reasoning },
        step1.confidence, step1.department,
      );
      
      // Step 2: Family Classification
      const step2Prompt = buildFamilyPrompt(input, step1.department);
      const step2Result = await this.callAI(step2Prompt, provider);
      const step2: Step2Response = step2Result.response;

      this.debugLogger?.recordChainStep(
        2, 'Family', false,
        { value: step2.family, confidence: step2.confidence, reasoning: step2.reasoning },
        { value: step2.family, confidence: step2.confidence, reasoning: step2.reasoning },
        step2.confidence, step2.family,
      );
      
      // Step 3: Category Classification
      const step3Prompt = await buildCategoryPrompt(input, step1.department, step2.family);
      const step3Result = await this.callAI(step3Prompt, provider);
      const step3: Step3Response = step3Result.response;

      this.debugLogger?.recordChainStep(
        3, 'Category', false,
        { value: step3.category, confidence: step3.confidence, reasoning: step3.reasoning },
        { value: step3.category, confidence: step3.confidence, reasoning: step3.reasoning },
        step3.confidence, step3.category,
      );
      
      // Calculate overall confidence (weighted average)
      const overallConfidence = this.calculateWeightedConfidence(
        step1.confidence,
        step2.confidence,
        step3.confidence
      );
      
      // Calculate total tokens
      const totalTokens = {
        prompt: step1Result.tokens.prompt + step2Result.tokens.prompt + step3Result.tokens.prompt,
        completion: step1Result.tokens.completion + step2Result.tokens.completion + step3Result.tokens.completion,
        total: step1Result.tokens.total + step2Result.tokens.total + step3Result.tokens.total,
        cost: step1Result.tokens.cost + step2Result.tokens.cost + step3Result.tokens.cost,
      };
      
      // Get department and family from category for deterministic hash
      const categoryData = await this.getCategoryData(step3.category);
      
      return {
        department: step1.department,
        family: step2.family,
        category: step3.category,
        categoryId: step3.categoryId,
        confidence: overallConfidence,
        locked: false, // Soft lock (can be re-evaluated if downstream agents struggle)
        reasoning: {
          step1Department: step1.reasoning,
          step2Family: step2.reasoning,
          step3Category: step3.reasoning,
          departmentMismatch: step1.departmentMismatch,
          conflictResolution: step1.conflictResolution,
          fastPathUsed: false,
        },
        provider,
        processingTimeMs: Date.now() - startTime,
        tokensUsed: totalTokens,
        classificationHash: getClassificationHash(
          step3.category,
          categoryData?.department || step1.department,
          categoryData?.family || step2.family
        ),
      };
    } catch (error: any) {
      logger.error(`Category classification chain failed (${provider}):`, error);
      throw error;
    }
  }
  
  /**
   * Calculate weighted confidence from 3 steps
   * Step 3 (category) matters most, Step 1 (department) matters least
   */
  private calculateWeightedConfidence(
    step1Confidence: number,
    step2Confidence: number,
    step3Confidence: number
  ): number {
    const weighted = (step1Confidence * 0.2) + (step2Confidence * 0.3) + (step3Confidence * 0.5);
    return Math.round(weighted);
  }
  
  /**
   * Normalize category string using production logic
   * (Same normalization as picklist-matcher.service.ts)
   */
  private normalizeCategoryString(category: string): string {
    return category
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s-]/g, '') // Remove special chars except hyphen
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
  }
  
  /**
   * Find picklist match for normalized category
   */
  private async findPicklistMatch(
    normalizedCategory: string
  ): Promise<{
    category: string;
    categoryId: string;
    department: string;
    family: string;
  } | null> {
    try {
      const categoriesModule: any = await import('../../config/salesforce-picklists/categories.json');
      const categories = Array.isArray(categoriesModule) ? categoriesModule : categoriesModule.default;
      
      for (const cat of categories) {
        const normalizedPicklist = this.normalizeCategoryString(cat.category_name);
        if (normalizedPicklist === normalizedCategory) {
          return {
            category: cat.category_name,
            categoryId: cat.category_id,
            department: cat.department,
            family: cat.family,
          };
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Error finding picklist match:', error);
      return null;
    }
  }
  
  /**
   * Get category data from picklist
   */
  private async getCategoryData(categoryName: string): Promise<{
    department: string;
    family: string;
  } | null> {
    try {
      const categoriesModule: any = await import('../../config/salesforce-picklists/categories.json');
      const categories = Array.isArray(categoriesModule) ? categoriesModule : categoriesModule.default;
      const cat = categories.find((c: any) => c.category_name === categoryName);
      return cat ? { department: cat.department, family: cat.family } : null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Retry hook: Inject cross-context when AIs disagree
   */
  protected onRetry(
    attempt: number,
    discrepancies: AgentDiscrepancy[],
    _previousResults: [CategoryClassifierOutput, CategoryClassifierOutput]
  ): Partial<CategoryClassifierInput> {
    // Build cross-context message
    const criticalDiscrepancy = discrepancies.find(d => d.severity === 'critical');
    
    if (criticalDiscrepancy) {
      logger.info(`Retry attempt ${attempt}: ${criticalDiscrepancy.field} mismatch - OpenAI: ${criticalDiscrepancy.openaiValue}, xAI: ${criticalDiscrepancy.xaiValue}`);
    }
    
    // Return enrichment (will be merged into input and passed to RetryContext)
    // The BaseAgent will automatically create RetryContext with this info
    return {}; // No additional input enrichment needed - RetryContext message is sufficient
  }
  
  /**
   * Build module-level consensus
   */
  async buildConsensus(
    openaiResult: CategoryClassifierOutput,
    xaiResult: CategoryClassifierOutput
  ): Promise<AgentConsensus<CategoryClassifierOutput>> {
    // Import consensus builder
    const { buildCategoryConsensus } = await import('./consensus');
    return buildCategoryConsensus(openaiResult, xaiResult);
  }
}
