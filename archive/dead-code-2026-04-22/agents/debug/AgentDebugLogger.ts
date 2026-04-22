/**
 * AgentDebugLogger — Main interceptor for the agent verification pipeline.
 *
 * Activated via:
 *   - Environment variable: AGENT_DEBUG=true
 *   - Request header:       x-debug-session: true
 *
 * Collects debug information from each stage of the pipeline and emits
 * a structured report when finalize() is called. When disabled (the default),
 * all methods are no-ops with zero overhead.
 *
 * Usage:
 *   const debugLogger = AgentDebugLogger.create(sessionId, product, req);
 *   // ... pipeline runs, each step calls debugLogger.record*() ...
 *   debugLogger.finalize();
 */

import { SalesforceIncomingProduct } from '../../types/salesforce.types';
import { AgentConsensus } from '../base/types';
import { CategoryClassifierOutput } from '../CategoryClassifierAgent/schema';
import { CategoryClassifierInput } from '../CategoryClassifierAgent/schema';
import logger from '../../utils/logger';

import { DebugReport } from './DebugReport';
import { runPayloadHealthCheck, isMiscCategory, detectBrandCollision } from './checks/PayloadHealthCheck';
import { snapshotFergusonFields, runFergusonExtractCheck } from './checks/FergusonExtractCheck';
import { fastPathHit, fastPathMiss } from './checks/FastPathCheck';
import { buildChainStepEntry } from './checks/ChainStepCheck';
import { buildConsensusSection } from './checks/ConsensusCheck';
import { buildComparisonSection } from './checks/ComparisonCheck';
import { formatDebugReport } from './formatters/ConsoleFormatter';

export class AgentDebugLogger {
  private report: DebugReport;
  private fergusonSnapshotBefore: Record<string, string> = {};
  private enabled: boolean;

  private constructor(
    public readonly sessionId: string,
    private product: SalesforceIncomingProduct,
    enabled: boolean,
  ) {
    this.enabled = enabled;
    this.report = new DebugReport(product.SF_Catalog_Id, sessionId);
  }

  /**
   * Factory: Create a logger instance. Returns a no-op instance when debugging
   * is not active, so callers never need null-checks.
   *
   * Security: In production, only the AGENT_DEBUG env var can activate debugging.
   * Header-activated debug is restricted to non-production environments.
   */
  static create(
    sessionId: string,
    product: SalesforceIncomingProduct,
    requestHeaders?: Record<string, string | string[] | undefined>,
  ): AgentDebugLogger {
    const envEnabled = process.env.AGENT_DEBUG === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    const headerEnabled = !isProduction && requestHeaders?.['x-debug-session'] === 'true';
    return new AgentDebugLogger(sessionId, product, envEnabled || headerEnabled);
  }

  /** Whether this logger is actively collecting debug data. */
  get isActive(): boolean {
    return this.enabled;
  }

  // ═══════════════════════════════════════════════════════
  // Section recorders — called by pipeline stages
  // ═══════════════════════════════════════════════════════

  /**
   * [1] Run payload health check on the raw incoming product.
   * Call immediately after receiving the Salesforce payload.
   */
  recordPayloadHealth(): void {
    if (!this.enabled) return;
    this.report.payloadHealth = runPayloadHealthCheck(this.product);
  }

  /**
   * [2a] Snapshot Ferguson fields BEFORE Phase 0.1A extraction.
   * Call before the monolith's Phase 0.1A runs.
   */
  snapshotBeforeExtraction(): void {
    if (!this.enabled) return;
    this.fergusonSnapshotBefore = snapshotFergusonFields(this.product);
  }

  /**
   * [2b] Record Ferguson extraction results AFTER Phase 0.1A.
   * Call after Phase 0.1A has mutated the product.
   */
  recordFergusonExtraction(): void {
    if (!this.enabled) return;
    const after = snapshotFergusonFields(this.product);
    this.report.fergusonExtract = runFergusonExtractCheck(
      this.product,
      this.fergusonSnapshotBefore,
      after,
    );
  }

  /**
   * [3] Record the mapped input that CategoryClassifierAgent will receive.
   */
  recordCategoryInput(input: CategoryClassifierInput): void {
    if (!this.enabled) return;

    const warnings: string[] = [];
    const fields: Record<string, string | undefined> = {
      fergusonCategory: input.fergusonCategory || undefined,
      fergusonProductType: input.fergusonProductType || undefined,
      fergusonTitle: input.fergusonTitle || undefined,
      webRetailerCategory: input.webRetailerCategory || undefined,
      webRetailerSubCategory: input.webRetailerSubCategory || undefined,
      webRetailerTitle: input.webRetailerTitle || undefined,
      sfCatalogId: input.sfCatalogId,
    };

    if (!input.webRetailerCategory) {
      warnings.push('webRetailerCategory absent');
    }
    if (!input.fergusonCategory && !input.fergusonProductType) {
      warnings.push('No Ferguson category or product type available');
    }
    if (!input.webRetailerTitle && !input.fergusonTitle) {
      warnings.push('No product title from either source');
    }

    this.report.categoryInput = { fields, warnings };
  }

  /**
   * [4] Record fast-path decision.
   */
  recordFastPathHit(
    fergusonNormalized: string,
    fergusonPicklistMatch: string,
    webRetailerNormalized: string,
    webRetailerPicklistMatch: string,
  ): void {
    if (!this.enabled) return;
    this.report.fastPath = fastPathHit(
      fergusonNormalized,
      fergusonPicklistMatch,
      webRetailerNormalized,
      webRetailerPicklistMatch,
    );
  }

  recordFastPathMiss(reason: string, partial?: {
    fergusonNormalized?: string;
    fergusonPicklistMatch?: string;
    webRetailerNormalized?: string;
    webRetailerPicklistMatch?: string;
  }): void {
    if (!this.enabled) return;
    this.report.fastPath = fastPathMiss(reason, {
      fergusonNormalized: partial?.fergusonNormalized ?? null,
      fergusonPicklistMatch: partial?.fergusonPicklistMatch ?? null,
      webRetailerNormalized: partial?.webRetailerNormalized ?? null,
      webRetailerPicklistMatch: partial?.webRetailerPicklistMatch ?? null,
    });
  }

  /**
   * [5] Record a chain step (Department / Family / Category).
   */
  recordChainStep(
    step: number,
    label: string,
    isRetry: boolean,
    openaiResult: { value: string; confidence: number; reasoning: string; [k: string]: any },
    xaiResult: { value: string; confidence: number; reasoning: string; [k: string]: any },
    agreementScore: number,
    outcome: string,
  ): void {
    if (!this.enabled) return;
    this.report.chainSteps.push(
      buildChainStepEntry(step, label, isRetry, openaiResult, xaiResult, agreementScore, outcome),
    );
  }

  /**
   * [6] Record consensus result.
   */
  recordConsensus(consensus: AgentConsensus<CategoryClassifierOutput>): void {
    if (!this.enabled) return;
    this.report.consensus = buildConsensusSection(consensus);
  }

  /**
   * [7] Record orchestrator decision.
   */
  recordOrchestratorDecision(
    decision: string,
    escalationReason?: Record<string, any>,
    categoryHint?: { value: string; confidence: number; source: string },
  ): void {
    if (!this.enabled) return;
    this.report.orchestrator = { decision, escalationReason, categoryHint };
  }

  /**
   * [8] Record agent vs monolith comparison.
   */
  recordComparison(
    agentCategory: string,
    agentConfidence: number,
    monolithCategory: string,
    written: boolean,
  ): void {
    if (!this.enabled) return;
    this.report.comparison = buildComparisonSection(
      agentCategory,
      agentConfidence,
      monolithCategory,
      written,
    );
  }

  /**
   * Record aggregate totals.
   */
  recordTotals(agentTimeMs: number, totalTokens: number, estimatedCost: number): void {
    if (!this.enabled) return;
    this.report.totals = { agentTimeMs, totalTokens, estimatedCost };
  }

  /**
   * Emit the full debug report to the logger.
   * Call once at the very end of the pipeline.
   */
  finalize(): void {
    if (!this.enabled) return;

    const formatted = formatDebugReport(this.report);
    logger.info(formatted);
  }

  /**
   * Expose the brand collision flag for pipeline logic (e.g. fast-path suppression).
   */
  get hasBrandCollision(): boolean {
    return this.report.payloadHealth?.brandCollision ?? detectBrandCollision(this.product);
  }

  /**
   * Expose the MISC category flag.
   */
  get hasMiscCategory(): boolean {
    return this.report.payloadHealth?.miscCategory ?? isMiscCategory(this.product.Web_Retailer_Category);
  }

  /**
   * Expose the payload health result (used by orchestrator to set context flags).
   */
  getPayloadHealth() {
    return this.report.payloadHealth;
  }
}
