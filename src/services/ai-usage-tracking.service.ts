/**
 * AI Usage Tracking Service
 * -------------------------
 * Comprehensive tracking of all AI API calls for:
 * - Cost monitoring and optimization
 * - Model performance comparison
 * - Success/failure analysis
 * - Latency tracking
 * - Dashboard analytics
 */

import { v4 as uuidv4 } from 'uuid';
import {
  AIUsage,
  IAIUsage,
  AIProvider,
  TaskType,
  TaskOutcome,
  calculateCost,
} from '../models/ai-usage.model';
import logger from '../utils/logger';

/**
 * Parameters for starting a tracked AI call
 */
export interface AICallStartParams {
  sessionId: string;
  trackingId?: string;
  productId?: string;
  provider: AIProvider;
  model: string;
  taskType: TaskType;
  prompt: string;
  retryAttempt?: number;
  imageUrls?: string[];
  searchQuery?: string;
  urlsResearched?: string[];
  tags?: string[];
}

/**
 * Parameters for completing a tracked AI call
 */
export interface AICallCompleteParams {
  response: string;
  promptTokens: number;
  completionTokens: number;
  outcome: TaskOutcome;
  httpStatus?: number;
  errorCode?: string;
  errorMessage?: string;
  confidenceScore?: number;
  jsonValid?: boolean;
  fieldsCaptured?: number;
  fieldsExpected?: number;
  categoryDetermined?: string;
  categoryConfidence?: number;
  agreedWithOtherAI?: boolean;
  disagreementFields?: string[];
  wasOverruled?: boolean;
}

/**
 * In-memory store for in-flight AI calls
 */
const inFlightCalls = new Map<string, {
  usageId: string;
  startTime: number;
  params: AICallStartParams;
}>();

/**
 * Start tracking an AI API call
 */
export function startAICall(params: AICallStartParams): string {
  const usageId = uuidv4();
  const startTime = Date.now();
  
  inFlightCalls.set(usageId, {
    usageId,
    startTime,
    params,
  });
  
  logger.debug('Started AI call tracking', {
    usageId,
    provider: params.provider,
    model: params.model,
    taskType: params.taskType,
    sessionId: params.sessionId,
  });
  
  return usageId;
}

/**
 * Complete tracking for an AI API call and save to database
 */
export async function completeAICall(
  usageId: string,
  completeParams: AICallCompleteParams
): Promise<void> {
  const inFlight = inFlightCalls.get(usageId);
  if (!inFlight) {
    logger.warn('AI call not found for completion', { usageId });
    return;
  }
  
  const { startTime, params } = inFlight;
  const endTime = Date.now();
  const latencyMs = endTime - startTime;
  
  // Calculate cost
  const { inputCost, outputCost, totalCost } = calculateCost(
    params.model,
    completeParams.promptTokens,
    completeParams.completionTokens
  );
  
  // Determine response quality based on outcome and fields
  let responseQuality = 0;
  if (completeParams.outcome === 'success') {
    responseQuality = 100;
    if (completeParams.fieldsExpected && completeParams.fieldsCaptured) {
      responseQuality = Math.min(100, Math.round((completeParams.fieldsCaptured / completeParams.fieldsExpected) * 100));
    }
    if (!completeParams.jsonValid) {
      responseQuality = Math.max(0, responseQuality - 30); // Penalize invalid JSON
    }
  } else if (completeParams.outcome === 'partial') {
    responseQuality = 50;
    if (completeParams.fieldsExpected && completeParams.fieldsCaptured) {
      responseQuality = Math.min(100, Math.round((completeParams.fieldsCaptured / completeParams.fieldsExpected) * 50));
    }
  }
  
  // Build tags based on call characteristics
  const tags = [...(params.tags || [])];
  if (completeParams.outcome === 'success') tags.push('success');
  if (completeParams.outcome === 'failed') tags.push('failed');
  if (latencyMs > 5000) tags.push('slow');
  if (latencyMs < 1000) tags.push('fast');
  if (totalCost > 0.01) tags.push('expensive');
  if (completeParams.agreedWithOtherAI === false) tags.push('disagreed');
  if (completeParams.wasOverruled) tags.push('overruled');
  if (params.retryAttempt && params.retryAttempt > 0) tags.push('retry');
  if (params.imageUrls?.length) tags.push('vision');
  if (params.searchQuery) tags.push('search');
  
  try {
    const usageDoc: Partial<IAIUsage> = {
      usageId,
      trackingId: params.trackingId,
      sessionId: params.sessionId,
      productId: params.productId,
      
      provider: params.provider,
      aiModel: params.model,
      taskType: params.taskType,
      
      requestTimestamp: new Date(startTime),
      responseTimestamp: new Date(endTime),
      latencyMs,
      
      promptTokens: completeParams.promptTokens,
      completionTokens: completeParams.completionTokens,
      totalTokens: completeParams.promptTokens + completeParams.completionTokens,
      
      inputCost,
      outputCost,
      totalCost,
      
      outcome: completeParams.outcome,
      httpStatus: completeParams.httpStatus,
      errorCode: completeParams.errorCode,
      errorMessage: completeParams.errorMessage,
      
      confidenceScore: completeParams.confidenceScore,
      responseQuality,
      jsonValid: completeParams.jsonValid ?? false,
      fieldsCaptured: completeParams.fieldsCaptured || 0,
      fieldsExpected: completeParams.fieldsExpected || 0,
      
      agreedWithOtherAI: completeParams.agreedWithOtherAI,
      disagreementFields: completeParams.disagreementFields,
      wasOverruled: completeParams.wasOverruled,
      
      categoryDetermined: completeParams.categoryDetermined,
      categoryConfidence: completeParams.categoryConfidence,
      imageUrls: params.imageUrls,
      searchQuery: params.searchQuery,
      urlsResearched: params.urlsResearched,
      
      promptLength: params.prompt.length,
      responseLength: completeParams.response.length,
      retryAttempt: params.retryAttempt || 0,
      
      tags,
    };
    
    await AIUsage.create(usageDoc);
    
    logger.debug('AI usage recorded', {
      usageId,
      provider: params.provider,
      model: params.model,
      taskType: params.taskType,
      outcome: completeParams.outcome,
      latencyMs,
      totalCost,
      tokens: completeParams.promptTokens + completeParams.completionTokens,
    });
  } catch (error) {
    logger.error('Failed to save AI usage', { usageId, error });
  } finally {
    inFlightCalls.delete(usageId);
  }
}

/**
 * Record an AI call failure (for when the call didn't complete normally)
 */
export async function failAICall(
  usageId: string,
  error: Error | string,
  httpStatus?: number
): Promise<void> {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  await completeAICall(usageId, {
    response: '',
    promptTokens: 0,
    completionTokens: 0,
    outcome: 'api-error',
    httpStatus,
    errorMessage,
    jsonValid: false,
  });
}

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

export interface AIUsageSummary {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number;
  totalTokens: number;
  totalCost: number;
  avgLatencyMs: number;
  avgConfidence: number;
}

export interface ModelPerformance {
  model: string;
  provider: AIProvider;
  totalCalls: number;
  successRate: number;
  avgLatencyMs: number;
  avgConfidence: number;
  totalTokens: number;
  totalCost: number;
  avgCostPerCall: number;
}

export interface TaskTypeAnalytics {
  taskType: TaskType;
  totalCalls: number;
  successRate: number;
  avgLatencyMs: number;
  avgConfidence: number;
  topModel: string;
  problemAreas: string[];
}

export interface ProviderComparison {
  openai: AIUsageSummary;
  xai: AIUsageSummary;
  agreementRate: number;
  openaiWinRate: number;
  xaiWinRate: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Get overall AI usage summary
 */
export async function getUsageSummary(dateRange?: DateRange): Promise<AIUsageSummary> {
  const match: any = {};
  if (dateRange) {
    match.requestTimestamp = { $gte: dateRange.start, $lte: dateRange.end };
  }
  
  const result = await AIUsage.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        successfulCalls: {
          $sum: { $cond: [{ $eq: ['$outcome', 'success'] }, 1, 0] },
        },
        failedCalls: {
          $sum: { $cond: [{ $in: ['$outcome', ['failed', 'api-error', 'timeout']] }, 1, 0] },
        },
        totalTokens: { $sum: '$totalTokens' },
        totalCost: { $sum: '$totalCost' },
        totalLatency: { $sum: '$latencyMs' },
        totalConfidence: {
          $sum: { $cond: [{ $gt: ['$confidenceScore', null] }, '$confidenceScore', 0] },
        },
        confidenceCount: {
          $sum: { $cond: [{ $gt: ['$confidenceScore', null] }, 1, 0] },
        },
      },
    },
  ]).exec();
  
  if (!result.length) {
    return {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      successRate: 0,
      totalTokens: 0,
      totalCost: 0,
      avgLatencyMs: 0,
      avgConfidence: 0,
    };
  }
  
  const data = result[0];
  return {
    totalCalls: data.totalCalls,
    successfulCalls: data.successfulCalls,
    failedCalls: data.failedCalls,
    successRate: data.totalCalls ? (data.successfulCalls / data.totalCalls) * 100 : 0,
    totalTokens: data.totalTokens,
    totalCost: Math.round(data.totalCost * 1000000) / 1000000,
    avgLatencyMs: data.totalCalls ? Math.round(data.totalLatency / data.totalCalls) : 0,
    avgConfidence: data.confidenceCount ? Math.round(data.totalConfidence / data.confidenceCount) : 0,
  };
}

/**
 * Get performance breakdown by model
 */
export async function getModelPerformance(dateRange?: DateRange): Promise<ModelPerformance[]> {
  const match: any = {};
  if (dateRange) {
    match.requestTimestamp = { $gte: dateRange.start, $lte: dateRange.end };
  }
  
  const result = await AIUsage.aggregate([
    { $match: match },
    {
      $group: {
        _id: { aiModel: '$aiModel', provider: '$provider' },
        totalCalls: { $sum: 1 },
        successfulCalls: {
          $sum: { $cond: [{ $eq: ['$outcome', 'success'] }, 1, 0] },
        },
        totalLatency: { $sum: '$latencyMs' },
        totalConfidence: {
          $sum: { $cond: [{ $gt: ['$confidenceScore', null] }, '$confidenceScore', 0] },
        },
        confidenceCount: {
          $sum: { $cond: [{ $gt: ['$confidenceScore', null] }, 1, 0] },
        },
        totalTokens: { $sum: '$totalTokens' },
        totalCost: { $sum: '$totalCost' },
      },
    },
    {
      $project: {
        model: '$_id.aiModel',
        provider: '$_id.provider',
        totalCalls: 1,
        successRate: {
          $multiply: [{ $divide: ['$successfulCalls', '$totalCalls'] }, 100],
        },
        avgLatencyMs: { $divide: ['$totalLatency', '$totalCalls'] },
        avgConfidence: {
          $cond: [
            { $gt: ['$confidenceCount', 0] },
            { $divide: ['$totalConfidence', '$confidenceCount'] },
            0,
          ],
        },
        totalTokens: 1,
        totalCost: 1,
        avgCostPerCall: { $divide: ['$totalCost', '$totalCalls'] },
      },
    },
    { $sort: { totalCalls: -1 } },
  ]).exec();
  
  return result.map((r: any) => ({
    model: r.model,
    provider: r.provider,
    totalCalls: r.totalCalls,
    successRate: Math.round(r.successRate * 100) / 100,
    avgLatencyMs: Math.round(r.avgLatencyMs),
    avgConfidence: Math.round(r.avgConfidence * 100) / 100,
    totalTokens: r.totalTokens,
    totalCost: Math.round(r.totalCost * 1000000) / 1000000,
    avgCostPerCall: Math.round(r.avgCostPerCall * 1000000) / 1000000,
  }));
}

/**
 * Get analytics by task type
 */
export async function getTaskTypeAnalytics(dateRange?: DateRange): Promise<TaskTypeAnalytics[]> {
  const match: any = {};
  if (dateRange) {
    match.requestTimestamp = { $gte: dateRange.start, $lte: dateRange.end };
  }
  
  const result = await AIUsage.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$taskType',
        totalCalls: { $sum: 1 },
        successfulCalls: {
          $sum: { $cond: [{ $eq: ['$outcome', 'success'] }, 1, 0] },
        },
        totalLatency: { $sum: '$latencyMs' },
        totalConfidence: {
          $sum: { $cond: [{ $gt: ['$confidenceScore', null] }, '$confidenceScore', 0] },
        },
        confidenceCount: {
          $sum: { $cond: [{ $gt: ['$confidenceScore', null] }, 1, 0] },
        },
        models: { $push: { model: '$aiModel', outcome: '$outcome' } },
      },
    },
    { $sort: { totalCalls: -1 } },
  ]).exec();
  
  return result.map((r: any) => {
    // Find top model for this task type
    const modelCounts: Record<string, { success: number; total: number }> = {};
    for (const m of r.models) {
      if (!modelCounts[m.model]) {
        modelCounts[m.model] = { success: 0, total: 0 };
      }
      modelCounts[m.model].total++;
      if (m.outcome === 'success') {
        modelCounts[m.model].success++;
      }
    }
    
    const topModel = Object.entries(modelCounts)
      .sort((a, b) => b[1].success - a[1].success)[0]?.[0] || 'unknown';
    
    // Identify problem areas (models with low success rate for this task)
    const problemAreas = Object.entries(modelCounts)
      .filter(([_, stats]) => stats.total >= 5 && (stats.success / stats.total) < 0.7)
      .map(([model]) => model);
    
    return {
      taskType: r._id,
      totalCalls: r.totalCalls,
      successRate: Math.round((r.successfulCalls / r.totalCalls) * 10000) / 100,
      avgLatencyMs: Math.round(r.totalLatency / r.totalCalls),
      avgConfidence: r.confidenceCount ? Math.round(r.totalConfidence / r.confidenceCount) : 0,
      topModel,
      problemAreas,
    };
  });
}

/**
 * Get provider comparison (OpenAI vs xAI)
 */
export async function getProviderComparison(dateRange?: DateRange): Promise<ProviderComparison> {
  const match: any = {};
  if (dateRange) {
    match.requestTimestamp = { $gte: dateRange.start, $lte: dateRange.end };
  }
  
  // Get summaries for each provider
  const providerData = await AIUsage.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$provider',
        totalCalls: { $sum: 1 },
        successfulCalls: {
          $sum: { $cond: [{ $eq: ['$outcome', 'success'] }, 1, 0] },
        },
        failedCalls: {
          $sum: { $cond: [{ $in: ['$outcome', ['failed', 'api-error', 'timeout']] }, 1, 0] },
        },
        totalTokens: { $sum: '$totalTokens' },
        totalCost: { $sum: '$totalCost' },
        totalLatency: { $sum: '$latencyMs' },
        totalConfidence: {
          $sum: { $cond: [{ $gt: ['$confidenceScore', null] }, '$confidenceScore', 0] },
        },
        confidenceCount: {
          $sum: { $cond: [{ $gt: ['$confidenceScore', null] }, 1, 0] },
        },
        overruledCount: {
          $sum: { $cond: [{ $eq: ['$wasOverruled', true] }, 1, 0] },
        },
      },
    },
  ]).exec();
  
  const formatSummary = (data: any): AIUsageSummary => ({
    totalCalls: data?.totalCalls || 0,
    successfulCalls: data?.successfulCalls || 0,
    failedCalls: data?.failedCalls || 0,
    successRate: data?.totalCalls ? (data.successfulCalls / data.totalCalls) * 100 : 0,
    totalTokens: data?.totalTokens || 0,
    totalCost: Math.round((data?.totalCost || 0) * 1000000) / 1000000,
    avgLatencyMs: data?.totalCalls ? Math.round(data.totalLatency / data.totalCalls) : 0,
    avgConfidence: data?.confidenceCount ? Math.round(data.totalConfidence / data.confidenceCount) : 0,
  });
  
  const openaiData = providerData.find((p: any) => p._id === 'openai');
  const xaiData = providerData.find((p: any) => p._id === 'xai');
  
  // Calculate agreement rate from dual verification tasks
  const agreementData = await AIUsage.aggregate([
    { 
      $match: { 
        ...match, 
        taskType: 'verification',
        agreedWithOtherAI: { $exists: true },
      },
    },
    {
      $group: {
        _id: null,
        totalPairs: { $sum: 1 },
        agreedPairs: {
          $sum: { $cond: [{ $eq: ['$agreedWithOtherAI', true] }, 1, 0] },
        },
      },
    },
  ]).exec();
  
  const agreementRate = agreementData[0]?.totalPairs
    ? (agreementData[0].agreedPairs / agreementData[0].totalPairs) * 100
    : 0;
  
  // Calculate win rates (who was overruled less)
  const openaiWins = openaiData?.totalCalls 
    ? ((openaiData.totalCalls - (openaiData.overruledCount || 0)) / openaiData.totalCalls) * 100
    : 0;
  const xaiWins = xaiData?.totalCalls
    ? ((xaiData.totalCalls - (xaiData.overruledCount || 0)) / xaiData.totalCalls) * 100
    : 0;
  
  return {
    openai: formatSummary(openaiData),
    xai: formatSummary(xaiData),
    agreementRate: Math.round(agreementRate * 100) / 100,
    openaiWinRate: Math.round(openaiWins * 100) / 100,
    xaiWinRate: Math.round(xaiWins * 100) / 100,
  };
}

/**
 * Get cost breakdown over time
 */
export async function getCostOverTime(
  dateRange: DateRange,
  granularity: 'hour' | 'day' | 'week' = 'day'
): Promise<Array<{ date: string; cost: number; calls: number; provider: string }>> {
  const dateFormat: Record<string, string> = {
    hour: '%Y-%m-%d %H:00',
    day: '%Y-%m-%d',
    week: '%Y-W%V',
  };
  
  const result = await AIUsage.aggregate([
    {
      $match: {
        requestTimestamp: { $gte: dateRange.start, $lte: dateRange.end },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: dateFormat[granularity], date: '$requestTimestamp' } },
          provider: '$provider',
        },
        cost: { $sum: '$totalCost' },
        calls: { $sum: 1 },
      },
    },
    { $sort: { '_id.date': 1 } },
  ]).exec();
  
  return result.map((r: any) => ({
    date: r._id.date,
    provider: r._id.provider,
    cost: Math.round(r.cost * 1000000) / 1000000,
    calls: r.calls,
  }));
}

/**
 * Get recent failures for debugging
 */
export async function getRecentFailures(limit: number = 20): Promise<Array<{
  usageId: string;
  provider: AIProvider;
  model: string;
  taskType: TaskType;
  outcome: TaskOutcome;
  errorMessage?: string;
  timestamp: Date;
  productId?: string;
}>> {
  const results = await AIUsage.find({
    outcome: { $in: ['failed', 'api-error', 'timeout', 'invalid-response'] },
  })
    .sort({ requestTimestamp: -1 })
    .limit(limit)
    .select('usageId provider aiModel taskType outcome errorMessage requestTimestamp productId')
    .lean()
    .exec();
  
  return results.map((r) => ({
    usageId: r.usageId,
    provider: r.provider,
    model: r.aiModel,
    taskType: r.taskType,
    outcome: r.outcome,
    errorMessage: r.errorMessage,
    timestamp: r.requestTimestamp,
    productId: r.productId,
  }));
}

/**
 * Get category performance (which categories have low confidence/high failure)
 */
export async function getCategoryPerformance(dateRange?: DateRange): Promise<Array<{
  category: string;
  totalCalls: number;
  successRate: number;
  avgConfidence: number;
  needsAttention: boolean;
}>> {
  const match: any = { categoryDetermined: { $exists: true, $ne: null } };
  if (dateRange) {
    match.requestTimestamp = { $gte: dateRange.start, $lte: dateRange.end };
  }
  
  const result = await AIUsage.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$categoryDetermined',
        totalCalls: { $sum: 1 },
        successfulCalls: {
          $sum: { $cond: [{ $eq: ['$outcome', 'success'] }, 1, 0] },
        },
        totalConfidence: {
          $sum: { $cond: [{ $gt: ['$confidenceScore', null] }, '$confidenceScore', 0] },
        },
        confidenceCount: {
          $sum: { $cond: [{ $gt: ['$confidenceScore', null] }, 1, 0] },
        },
      },
    },
    { $match: { totalCalls: { $gte: 3 } } }, // At least 3 calls
    { $sort: { totalCalls: -1 } },
  ]).exec();
  
  return result.map((r: any) => {
    const successRate = (r.successfulCalls / r.totalCalls) * 100;
    const avgConfidence = r.confidenceCount ? r.totalConfidence / r.confidenceCount : 0;
    
    return {
      category: r._id,
      totalCalls: r.totalCalls,
      successRate: Math.round(successRate * 100) / 100,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      needsAttention: successRate < 80 || avgConfidence < 70,
    };
  });
}

/**
 * Get full AI analytics dashboard data
 */
export async function getAIDashboard(dateRange?: DateRange) {
  const [
    summary,
    modelPerformance,
    taskAnalytics,
    providerComparison,
    recentFailures,
    categoryPerformance,
  ] = await Promise.all([
    getUsageSummary(dateRange),
    getModelPerformance(dateRange),
    getTaskTypeAnalytics(dateRange),
    getProviderComparison(dateRange),
    getRecentFailures(10),
    getCategoryPerformance(dateRange),
  ]);
  
  // Identify strong points
  const strongPoints: string[] = [];
  const weakPoints: string[] = [];
  
  // Analyze model performance
  for (const model of modelPerformance) {
    if (model.successRate >= 95 && model.totalCalls >= 10) {
      strongPoints.push(`${model.model}: ${model.successRate.toFixed(1)}% success rate`);
    }
    if (model.successRate < 80 && model.totalCalls >= 5) {
      weakPoints.push(`${model.model}: Only ${model.successRate.toFixed(1)}% success rate`);
    }
  }
  
  // Analyze task types
  for (const task of taskAnalytics) {
    if (task.successRate < 80 && task.totalCalls >= 5) {
      weakPoints.push(`${task.taskType} tasks: ${task.successRate.toFixed(1)}% success`);
    }
    if (task.problemAreas.length > 0) {
      weakPoints.push(`${task.taskType}: Problems with ${task.problemAreas.join(', ')}`);
    }
  }
  
  // Analyze categories
  const problemCategories = categoryPerformance.filter(c => c.needsAttention);
  if (problemCategories.length > 0) {
    weakPoints.push(
      `Categories needing attention: ${problemCategories.map(c => c.category).join(', ')}`
    );
  }
  
  // Provider insights
  if (providerComparison.openaiWinRate > providerComparison.xaiWinRate + 10) {
    strongPoints.push(`OpenAI more reliable (${providerComparison.openaiWinRate.toFixed(1)}% win rate)`);
  } else if (providerComparison.xaiWinRate > providerComparison.openaiWinRate + 10) {
    strongPoints.push(`xAI more reliable (${providerComparison.xaiWinRate.toFixed(1)}% win rate)`);
  }
  
  if (providerComparison.agreementRate >= 90) {
    strongPoints.push(`High AI consensus: ${providerComparison.agreementRate.toFixed(1)}% agreement`);
  } else if (providerComparison.agreementRate < 70) {
    weakPoints.push(`Low AI consensus: ${providerComparison.agreementRate.toFixed(1)}% agreement`);
  }
  
  return {
    summary,
    modelPerformance,
    taskAnalytics,
    providerComparison,
    recentFailures,
    categoryPerformance,
    insights: {
      strongPoints,
      weakPoints,
    },
  };
}

export default {
  startAICall,
  completeAICall,
  failAICall,
  getUsageSummary,
  getModelPerformance,
  getTaskTypeAnalytics,
  getProviderComparison,
  getCostOverTime,
  getRecentFailures,
  getCategoryPerformance,
  getAIDashboard,
};
