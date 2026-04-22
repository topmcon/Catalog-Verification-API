/**
 * DebugReport — Structured data types and report builder for AgentDebugLogger.
 *
 * All debug checks write their results into a DebugReport instance.
 * The ConsoleFormatter reads the report and renders it for the log output.
 */

// ────────────────────────────────────────────────────
// Severity
// ────────────────────────────────────────────────────

export enum PayloadSeverity {
  OK = '✅',
  WARNING = '⚠️',
  CRITICAL = '🚨',
}

// ────────────────────────────────────────────────────
// Section data types
// ────────────────────────────────────────────────────

export interface HealthEntry {
  severity: PayloadSeverity;
  message: string;
}

export interface PayloadHealthSection {
  entries: HealthEntry[];
  brandCollision: boolean;
  miscCategory: boolean;
  legacyOnly: boolean;
}

export interface FergusonExtractSection {
  source: 'Ferguson_Raw_Data' | 'flat-fields' | 'none';
  extracted: Record<string, string>;
  missingAfterExtraction: string[];
}

export interface CategoryInputSection {
  fields: Record<string, string | undefined>;
  warnings: string[];
}

export interface FastPathEntry {
  fergusonNormalized: string | null;
  fergusonPicklistMatch: string | null;
  webRetailerNormalized: string | null;
  webRetailerPicklistMatch: string | null;
  hit: boolean;
  reason: string;
}

export interface ChainStepEntry {
  step: number;
  label: string;
  isRetry: boolean;
  openai: {
    value: string;
    confidence: number;
    reasoning: string;
    extras: Record<string, any>;
  };
  xai: {
    value: string;
    confidence: number;
    reasoning: string;
    extras: Record<string, any>;
  };
  agreementScore: number;
  outcome: string;
}

export interface ConsensusSection {
  category: string;
  categoryId: string;
  department: string;
  family: string;
  confidence: number;
  locked: boolean;
  weakConsensus: boolean;
  agentSource: string;
}

export interface OrchestratorSection {
  decision: string;
  escalationReason?: Record<string, any>;
  categoryHint?: {
    value: string;
    confidence: number;
    source: string;
  };
}

export interface ComparisonSection {
  agentCategory: string;
  agentConfidence: number;
  monolithCategory: string;
  matched: boolean;
  written: boolean;
}

export interface DebugTotals {
  agentTimeMs: number;
  totalTokens: number;
  estimatedCost: number;
}

// ────────────────────────────────────────────────────
// Report container
// ────────────────────────────────────────────────────

export class DebugReport {
  readonly sfCatalogId: string;
  readonly sessionId: string;

  payloadHealth?: PayloadHealthSection;
  fergusonExtract?: FergusonExtractSection;
  categoryInput?: CategoryInputSection;
  fastPath?: FastPathEntry;
  chainSteps: ChainStepEntry[] = [];
  consensus?: ConsensusSection;
  orchestrator?: OrchestratorSection;
  comparison?: ComparisonSection;
  totals?: DebugTotals;

  constructor(sfCatalogId: string, sessionId: string) {
    this.sfCatalogId = sfCatalogId;
    this.sessionId = sessionId;
  }
}
