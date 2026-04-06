/**
 * Shared types for the agent system
 */

export type AIProvider = 'openai' | 'xai' | 'claude';

/**
 * Pipeline version enum for tracking in ai_usage collection
 * Ensures queryable, typo-free version tracking
 */
export enum PipelineVersion {
  MONOLITH_V1 = 'monolith-v1',
  AGENT_V1 = 'agent-v1', // CategoryClassifierAgent only
  AGENT_V2 = 'agent-v2', // + PrimaryAttributeExtractor
  AGENT_V3 = 'agent-v3', // + FilterAttributeExtractor
  AGENT_V4 = 'agent-v4', // + CorrectionProposer
  AGENT_FULL = 'agent-full', // Complete agent-based pipeline
}

/**
 * Task types for ai_usage tracking
 */
export enum AgentTaskType {
  CATEGORY_CLASSIFICATION = 'category-classification',
  PRIMARY_ATTRIBUTE_EXTRACTION = 'primary-attribute-extraction',
  FILTER_ATTRIBUTE_EXTRACTION = 'filter-attribute-extraction',
  CORRECTION_PROPOSAL = 'correction-proposal',
  DOCUMENT_EVALUATION = 'document-evaluation',
  CONFLICT_RESOLUTION = 'conflict-resolution',
  RESEARCH = 'research',
}

/**
 * Soft-lock status for agent outputs
 * Allows downstream agents to trigger re-evaluation
 */
export interface SoftLock {
  locked: boolean;
  confidence: number;
  lockReason?: string;
  canReEvaluate: boolean;
}

/**
 * Discrepancy between two AI results
 */
export interface AgentDiscrepancy {
  field: string;
  openaiValue: any;
  xaiValue: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution?: string;
  resolutionSource?: AIProvider | 'manual';
}

/**
 * Retry context passed when agent needs to reconsider
 */
export interface RetryContext {
  attempt: number;
  message: string;
  previousResults?: {
    openai: any;
    xai: any;
  };
}

/**
 * Module-level consensus result
 */
export interface AgentConsensus<T> {
  agreed: boolean;
  agreementScore: number; // 0-100
  value?: T;
  discrepancies: AgentDiscrepancy[];
  retryAllowed: boolean;
  retryContext?: RetryContext;
  source?: 'consensus' | 'partial-consensus' | 'mediated' | 'escalated';
}

/**
 * Base agent output (all agents return this structure)
 */
export interface AgentOutput {
  confidence: number; // 0-100
  locked: boolean; // Soft-lock status
  reasoning: string | Record<string, any>; // Allow any value type for flexible reasoning structures
  provider: AIProvider;
  processingTimeMs?: number;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
    cost: number;
  };
}

/**
 * AI usage tracking (for ai_usage collection)
 */
export interface AgentUsageRecord {
  usageId: string;
  sessionId: string;
  provider: AIProvider;
  aiModel: string;
  taskType: AgentTaskType;
  pipelineVersion: PipelineVersion;
  outcome: 'success' | 'partial' | 'failed' | 'timeout' | 'rate-limited' | 'api-error';
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalCost: number;
  confidenceScore: number;
  agreedWithOtherAI: boolean;
  wasOverruled: boolean;
  processingTimeMs: number;
  timestamp: Date;
}

/**
 * Comparison log for dual-path validation (Phase 1)
 */
export interface PipelineComparisonLog {
  sessionId: string;
  productId: string;
  pipelineVersion: 'agent-vs-monolith';
  timestamp: Date;
  comparison: {
    accuracy: {
      oldCategory: string;
      newCategory: string;
      match: boolean;
      confidenceDelta: number;
      stabilityHash: string; // Deterministic hash for category stability tracking
    };
    performance: {
      oldPathTime: number;
      newPathTime: number;
      speedupPercent: number;
      oldPathTokens: number;
      newPathTokens: number;
      tokenSavingsPercent: number;
    };
    edgeCases: {
      crossDepartmentConflict: boolean;
      howResolved?: string;
      fastPathUsed?: boolean;
    };
  };
}

/**
 * Classification hash for category stability tracking
 * Returns deterministic hash of { category, department, family }
 */
export function getClassificationHash(
  category: string,
  department: string,
  family: string
): string {
  const str = `${department}|${family}|${category}`.toLowerCase().trim();
  // Simple hash (production would use crypto.createHash)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
