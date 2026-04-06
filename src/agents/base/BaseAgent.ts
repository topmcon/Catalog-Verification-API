/**
 * BaseAgent - Abstract base class for all verification agents
 * 
 * Provides common functionality:
 * - AI API calling (OpenAI, xAI, Claude)
 * - Token usage tracking (ai_usage collection)
 * - Consensus building (module-level)
 * - Retry management
 * 
 * Subclasses implement:
 * - execute(input, provider) - Main agent logic
 * - buildConsensus(openaiResult, xaiResult) - Custom consensus rules
 */

import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { 
  AIProvider, 
  AgentOutput, 
  AgentConsensus,
  AgentTaskType,
  PipelineVersion,
  RetryContext,
  AgentUsageRecord,
  AgentDiscrepancy
} from './types';
import type { AgentDebugLogger } from '../debug/AgentDebugLogger';
import logger from '../../utils/logger';

export interface BaseAgentConfig {
  sessionId: string;
  taskType: AgentTaskType;
  pipelineVersion?: PipelineVersion;
}

export abstract class BaseAgent<TInput, TOutput extends AgentOutput> {
  /**
   * Subclasses must declare their input schema
   * Example: ['rawProduct.ferguson.category', 'rawProduct.webRetailer.title']
   */
  static inputSchema: string[] = [];
  
  /**
   * Task type (for ai_usage tracking)
   */
  protected taskType: AgentTaskType;
  
  /**
   * Pipeline version (for tracking)
   */
  protected pipelineVersion: PipelineVersion;
  
  /**
   * OpenAI client (for both OpenAI and xAI)
   */
  private openaiClient: OpenAI;
  private xaiClient: OpenAI;
  
  /**
   * Session ID for tracking
   */
  protected sessionId: string;

  /**
   * Debug logger — set by orchestrator before runWithConsensus().
   * When set, subclasses can emit debug events during execution.
   */
  protected debugLogger?: AgentDebugLogger;

  /**
   * Attach a debug logger to this agent instance.
   * Called by the orchestrator before runWithConsensus().
   */
  setDebugLogger(logger: AgentDebugLogger): void {
    this.debugLogger = logger;
  }
  
  constructor(config: BaseAgentConfig) {
    this.sessionId = config.sessionId;
    this.taskType = config.taskType;
    this.pipelineVersion = config.pipelineVersion ?? PipelineVersion.AGENT_V1;
    
    // OpenAI client
    this.openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // xAI client (OpenAI-compatible API)
    this.xaiClient = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });
  }
  
  /**
   * Main execution method - must be implemented by subclasses
   * 
   * @param input Agent-specific input (typed)
   * @param provider Which AI provider to use
   * @param retryContext Optional retry context if this is a retry
   * @returns Agent-specific output with confidence + reasoning
   */
  abstract execute(
    input: TInput, 
    provider: AIProvider,
    retryContext?: RetryContext
  ): Promise<TOutput>;
  
  /**
   * Run agent with dual-AI consensus and automatic retry
   * 
   * This is the orchestrator-facing method that handles:
   * - Parallel execution of both AIs
   * - Consensus building
   * - Retry with onRetry hook enrichment
   * 
   * @param input Agent input
   * @param maxRetries Maximum retry attempts (default: 2)
   * @returns Consensus result
   */
  async runWithConsensus(
    input: TInput,
    maxRetries: number = 2
  ): Promise<AgentConsensus<TOutput>> {
    let attempt = 0;
    let lastResults: [TOutput, TOutput] | undefined;
    
    while (attempt <= maxRetries) {
      // Execute both AIs in parallel
      const [openaiResult, xaiResult] = await Promise.all([
        this.execute(input, 'openai'),
        this.execute(input, 'xai'),
      ]);
      
      lastResults = [openaiResult, xaiResult];
      
      // Build consensus
      const consensus = await this.buildConsensus(openaiResult, xaiResult);
      
      // Update usage records with consensus info
      await this.updateUsageWithConsensus('openai', consensus.agreed, !consensus.agreed && consensus.value === xaiResult);
      await this.updateUsageWithConsensus('xai', consensus.agreed, !consensus.agreed && consensus.value === openaiResult);
      
      // If consensus reached or retries exhausted, return
      if (consensus.agreed || !consensus.retryAllowed || attempt >= maxRetries) {
        return consensus;
      }
      
      // Invoke onRetry hook if defined
      if (this.onRetry) {
        const retryEnrichment = this.onRetry(attempt + 1, consensus.discrepancies, lastResults);
        input = { ...input, ...retryEnrichment };
      }
      
      attempt++;
      
      // Log retry
      logger.info(`Agent retry attempt ${attempt} for task ${this.taskType}`);
    }
    
    // Should never reach here, but TypeScript needs it
    return {
      agreed: false,
      agreementScore: 0,
      discrepancies: [],
      retryAllowed: false,
      source: 'escalated',
    };
  }
  
  /**
   * Consensus builder - must be implemented by subclasses
   * 
   * @param openaiResult Result from OpenAI
   * @param xaiResult Result from xAI
   * @returns Consensus with agreement status, discrepancies, retry instructions
   */
  abstract buildConsensus(
    openaiResult: TOutput,
    xaiResult: TOutput
  ): Promise<AgentConsensus<TOutput>>;
  
  /**
   * Optional retry hook - subclasses can override to inject retry-specific context
   * 
   * Called automatically before retry execution. Returns additional context to merge.
   * 
   * @param attempt Retry attempt number (1-based)
   * @param discrepancies Array of discrepancies from consensus
   * @param previousResults Tuple of [openaiResult, xaiResult] from previous attempt
   * @returns Additional context to merge into input (optional)
   */
  protected onRetry?(
    attempt: number,
    discrepancies: AgentDiscrepancy[],
    previousResults: [TOutput, TOutput]
  ): Partial<TInput>;
  
  /**
   * Call AI provider with prompt and JSON mode
   * 
   * @param prompt System + user prompt text
   * @param provider Which AI to call
   * @param retryContext Optional retry context
   * @returns Parsed JSON response + token usage
   */
  protected async callAI(
    prompt: string,
    provider: AIProvider,
    retryContext?: RetryContext
  ): Promise<{ response: any; tokens: { prompt: number; completion: number; total: number; cost: number } }> {
    const startTime = Date.now();
    
    try {
      let client: OpenAI;
      let model: string;
      
      switch (provider) {
        case 'openai':
          client = this.openaiClient;
          model = process.env.OPENAI_MODEL || 'gpt-4o';
          break;
        case 'xai':
          client = this.xaiClient;
          model = process.env.XAI_MODEL || 'grok-1';
          break;
        case 'claude':
          // TODO: Implement Claude API (for tiebreaker)
          throw new Error('Claude tiebreaker not yet implemented');
        default:
          throw new Error(`Unknown AI provider: ${provider}`);
      }
      
      // Add retry context to prompt if present
      const finalPrompt = retryContext 
        ? `${prompt}\n\n**RETRY CONTEXT (Attempt ${retryContext.attempt}):**\n${retryContext.message}`
        : prompt;
      
      // Call AI with JSON mode
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a product classification expert. Always respond with valid JSON only. No markdown, no explanations outside the JSON.',
          },
          {
            role: 'user',
            content: finalPrompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more consistent classification
      });
      
      const processingTimeMs = Date.now() - startTime;
      
      // Parse response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in AI response');
      }
      
      const parsedResponse = JSON.parse(content);
      
      // Calculate token usage and cost
      const promptTokens = response.usage?.prompt_tokens || 0;
      const completionTokens = response.usage?.completion_tokens || 0;
      const totalTokens = promptTokens + completionTokens;
      
      // Cost calculation (approximate, based on gpt-4o pricing)
      const cost = this.calculateCost(provider, model, promptTokens, completionTokens);
      
      // Track usage in ai_usage collection
      await this.trackUsage({
        provider,
        model,
        promptTokens,
        completionTokens,
        totalTokens,
        cost,
        processingTimeMs,
        outcome: 'success',
      });
      
      return {
        response: parsedResponse,
        tokens: {
          prompt: promptTokens,
          completion: completionTokens,
          total: totalTokens,
          cost,
        },
      };
    } catch (error: any) {
      const processingTimeMs = Date.now() - startTime;
      
      // Track failure
      await this.trackUsage({
        provider,
        model: provider === 'openai' ? 'gpt-4o' : 'grok-1',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost: 0,
        processingTimeMs,
        outcome: error.code === 'rate_limit_exceeded' ? 'rate-limited' : 'api-error',
      });
      
      logger.error(`AI call failed (${provider}):`, error.message);
      throw error;
    }
  }
  
  /**
   * Calculate cost based on provider and model
   * 
   * Pricing (as of 2024):
   * - GPT-4o: $2.50/1M input, $10/1M output
   * - Grok-1: TBD (using OpenAI-equivalent pricing for now)
   */
  private calculateCost(
    _provider: AIProvider, // Reserved for future provider-specific pricing
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    // Prices per 1M tokens
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 2.5, output: 10 },
      'gpt-4o-mini': { input: 0.15, output: 0.6 },
      'grok-1': { input: 2.5, output: 10 }, // Estimated
      'grok-2': { input: 5, output: 15 }, // Estimated
    };
    
    const rates = pricing[model] || pricing['gpt-4o'];
    
    const inputCost = (promptTokens / 1_000_000) * rates.input;
    const outputCost = (completionTokens / 1_000_000) * rates.output;
    
    return inputCost + outputCost;
  }
  
  /**
   * Track AI usage in MongoDB ai_usage collection
   */
  private async trackUsage(params: {
    provider: AIProvider;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    processingTimeMs: number;
    outcome: 'success' | 'partial' | 'failed' | 'timeout' | 'rate-limited' | 'api-error';
    confidenceScore?: number;
    agreedWithOtherAI?: boolean;
    wasOverruled?: boolean;
  }): Promise<void> {
    try {
      const { AIUsage } = await import('../../models/ai-usage.model');
      
      const usageRecord: AgentUsageRecord = {
        usageId: uuidv4(),
        sessionId: this.sessionId,
        provider: params.provider,
        aiModel: params.model,
        taskType: this.taskType,
        pipelineVersion: this.pipelineVersion,
        outcome: params.outcome,
        promptTokens: params.promptTokens,
        completionTokens: params.completionTokens,
        totalTokens: params.totalTokens,
        totalCost: params.cost,
        confidenceScore: params.confidenceScore || 0,
        agreedWithOtherAI: params.agreedWithOtherAI || false,
        wasOverruled: params.wasOverruled || false,
        processingTimeMs: params.processingTimeMs,
        timestamp: new Date(),
      };
      
      await AIUsage.create(usageRecord);
    } catch (error) {
      // Don't fail agent execution if tracking fails
      logger.error('Failed to track AI usage:', error);
    }
  }
  
  /**
   * Update usage record with consensus results
   */
  protected async updateUsageWithConsensus(
    provider: AIProvider,
    agreedWithOtherAI: boolean,
    wasOverruled: boolean
  ): Promise<void> {
    try {
      const { AIUsage } = await import('../../models/ai-usage.model');
      
      // Find the most recent usage record for this session + provider
      await AIUsage.findOneAndUpdate(
        { 
          sessionId: this.sessionId, 
          provider, 
          taskType: this.taskType,
          timestamp: { $gte: new Date(Date.now() - 60000) } // Within last minute
        },
        { 
          $set: { 
            agreedWithOtherAI,
            wasOverruled 
          } 
        },
        { sort: { timestamp: -1 } }
      );
    } catch (error) {
      logger.error('Failed to update AI usage with consensus:', error);
    }
  }
}
