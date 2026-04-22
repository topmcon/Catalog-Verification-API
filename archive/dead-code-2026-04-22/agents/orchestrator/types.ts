/**
 * VerificationOrchestrator Types
 * 
 * The orchestrator owns sequencing only — no business logic, no AI calls,
 * no picklist lookups. These types define the orchestrator's decision surface.
 */

import { SalesforceVerificationResponse } from '../../types/salesforce.types';
import { AgentConsensus, AgentOutput } from '../base/types';

/**
 * What the orchestrator decides after an agent completes
 * 
 * - continue: Agent succeeded (possibly with reduced confidence), proceed to next step
 * - escalate: Agent failed consensus but the pipeline can continue with degraded confidence
 * - abort: Unrecoverable failure, stop pipeline
 */
export type OrchestratorDecision = 'continue' | 'escalate' | 'abort';

/**
 * Options for running an agent through the orchestrator
 */
export interface AgentRunOptions {
  /** Maximum consensus retries (overrides agent default) */
  maxRetries?: number;
  /** Timeout in milliseconds for the entire agent run */
  timeoutMs?: number;
  /** Label for logging and tracking */
  label?: string;
}

/**
 * Tracks each agent's execution in the pipeline
 */
export interface AgentStepResult<T extends AgentOutput = AgentOutput> {
  agentName: string;
  consensus: AgentConsensus<T>;
  decision: OrchestratorDecision;
  durationMs: number;
  timestamp: Date;
}

/**
 * Category hint passed to the monolith for dual-path comparison
 * 
 * This is NOT an override — the monolith uses it when confident
 * and ignores it when uncertain. Tracked in ai_usage for comparison analytics.
 */
export interface CategoryHint {
  value: string;
  categoryId: string;
  department: string;
  family: string;
  confidence: number;
  source: string;
}

/**
 * Hints passed from the orchestrator to the monolith.
 * Separate parameter so the monolith can use or ignore them independently.
 */
export interface MonolithHints {
  categoryHint?: CategoryHint;
}

/**
 * Final result from the orchestrator pipeline
 */
export interface OrchestratorResult {
  /** Session identifier for end-to-end tracking */
  sessionId: string;
  /** Salesforce catalog ID */
  sfCatalogId: string;
  /** Whether the pipeline completed successfully */
  success: boolean;
  /** Final verification response (from monolith handoff) */
  verificationResponse?: SalesforceVerificationResponse;
  /** Ordered log of each agent step */
  agentSteps: AgentStepResult[];
  /** Hints that were passed to the monolith */
  hintsProvided: MonolithHints;
  /** Total pipeline duration in milliseconds */
  totalDurationMs: number;
  /** If pipeline was aborted, the reason */
  abortReason?: string;
}
