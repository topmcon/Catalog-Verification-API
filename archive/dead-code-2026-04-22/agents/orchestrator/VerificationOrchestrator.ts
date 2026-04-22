/**
 * VerificationOrchestrator
 * 
 * Owns exactly one thing: sequencing.
 * No business logic, no AI calls, no picklist lookups.
 * 
 * Current pipeline (Phase 1):
 *   1. CategoryClassifierAgent → classifies department/family/category
 *   2. Handoff to monolith (dual-ai-verification.service.ts) with category hint
 * 
 * The monolith uses or ignores the hint independently. Both paths are tracked
 * in ai_usage for comparison analytics: how often the agent's classification
 * matches what the monolith would have independently chosen.
 */

import { BaseAgent } from '../base/BaseAgent';
import { AgentConsensus, AgentOutput, AgentTaskType, PipelineVersion } from '../base/types';
import { AgentContext } from '../base/AgentContext';
import { CategoryClassifierAgent } from '../CategoryClassifierAgent/CategoryClassifierAgent';
import {
  CategoryClassifierInput,
  CategoryClassifierOutput,
} from '../CategoryClassifierAgent/schema';
import { SalesforceIncomingProduct, SalesforceVerificationResponse } from '../../types/salesforce.types';
import { verifyProductWithDualAI } from '../../services/dual-ai-verification.service';
import { AgentDebugLogger } from '../debug/AgentDebugLogger';
import { isMiscCategory } from '../debug/checks/PayloadHealthCheck';
import logger from '../../utils/logger';
import {
  OrchestratorResult,
  OrchestratorDecision,
  AgentRunOptions,
  AgentStepResult,
  MonolithHints,
} from './types';

export interface VerifyOptions {
  debugLogger?: AgentDebugLogger;
}

export class VerificationOrchestrator {
  /**
   * Main entry point: Run the full verification pipeline.
   * 
   * Currently: CategoryClassifierAgent → monolith handoff
   * Future: CategoryClassifier → PrimaryAttributeExtractor → FilterAttributeExtractor → CorrectionProposer
   */
  async verify(
    product: SalesforceIncomingProduct,
    sessionId: string,
    options?: VerifyOptions,
  ): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const agentSteps: AgentStepResult[] = [];
    const hints: MonolithHints = {};
    const debug = options?.debugLogger;

    logger.info('Orchestrator: Starting verification pipeline', {
      sessionId,
      sfCatalogId: product.SF_Catalog_Id,
    });

    // Debug: record payload health
    debug?.recordPayloadHealth();

    // ═════════════════════════════════════════════════════════════
    // Step 1: Category Classification
    // ═════════════════════════════════════════════════════════════
    const context = this.buildContext(product);
    const categoryAgent = new CategoryClassifierAgent({
      sessionId,
      taskType: AgentTaskType.CATEGORY_CLASSIFICATION,
      pipelineVersion: PipelineVersion.AGENT_V1,
    });

    // Thread debug logger into context and agent
    if (debug) {
      context.setDebugLogger(debug);
      categoryAgent.setDebugLogger(debug);

      // Propagate brand collision flag so fast-path can check it
      if (debug.hasBrandCollision) {
        context.set('brandCollisionFlag', true);
      }
    }

    const categoryInput = this.extractCategoryInput(product);

    // Debug: record the mapped input
    debug?.recordCategoryInput(categoryInput);

    const categoryConsensus = await this.runAgent(
      categoryAgent,
      categoryInput,
      { maxRetries: 2, label: 'CategoryClassifier' }
    );

    // Debug: record consensus
    debug?.recordConsensus(categoryConsensus as AgentConsensus<CategoryClassifierOutput>);

    const categoryDecision = this.handleAgentFailure(
      'CategoryClassifier',
      categoryConsensus,
      context
    );

    agentSteps.push({
      agentName: 'CategoryClassifier',
      consensus: categoryConsensus,
      decision: categoryDecision,
      durationMs: Date.now() - startTime,
      timestamp: new Date(),
    });

    // Build hints from successful classification
    if (categoryConsensus.value) {
      const classificationPath = categoryConsensus.value.reasoning?.fastPathUsed ? 'fast-path' : 'chain';
      hints.categoryHint = {
        value: categoryConsensus.value.category,
        categoryId: categoryConsensus.value.categoryId,
        department: categoryConsensus.value.department,
        family: categoryConsensus.value.family,
        confidence: categoryConsensus.value.confidence,
        source: `CategoryClassifierAgent-v1/${classificationPath}`,
      };
    }

    // Debug: record orchestrator decision + hints
    debug?.recordOrchestratorDecision(
      categoryDecision,
      context.get(`CategoryClassifier.escalationReason`),
      hints.categoryHint ? {
        value: hints.categoryHint.value,
        confidence: hints.categoryHint.confidence,
        source: hints.categoryHint.source,
      } : undefined,
    );

    // Abort if category classification critically failed
    if (categoryDecision === 'abort') {
      logger.error('Orchestrator: Pipeline aborted at CategoryClassifier', {
        sessionId,
        sfCatalogId: product.SF_Catalog_Id,
      });

      return {
        sessionId,
        sfCatalogId: product.SF_Catalog_Id,
        success: false,
        agentSteps,
        hintsProvided: hints,
        totalDurationMs: Date.now() - startTime,
        abortReason: 'CategoryClassifier failed to reach consensus after retries',
      };
    }

    // ═════════════════════════════════════════════════════════════
    // Step 2: Monolith Handoff (dual-path validation seam)
    // ═════════════════════════════════════════════════════════════
    logger.info('Orchestrator: Handing off to monolith with category hint', {
      sessionId,
      sfCatalogId: product.SF_Catalog_Id,
      categoryHint: hints.categoryHint?.value,
      categoryConfidence: hints.categoryHint?.confidence,
    });

    // Debug: snapshot Ferguson fields BEFORE monolith extraction
    debug?.snapshotBeforeExtraction();

    let verificationResponse: SalesforceVerificationResponse;
    try {
      verificationResponse = await verifyProductWithDualAI(product, sessionId, undefined, hints);
    } catch (error: any) {
      logger.error('Orchestrator: Monolith handoff failed', {
        sessionId,
        sfCatalogId: product.SF_Catalog_Id,
        error: error.message,
      });

      return {
        sessionId,
        sfCatalogId: product.SF_Catalog_Id,
        success: false,
        agentSteps,
        hintsProvided: hints,
        totalDurationMs: Date.now() - startTime,
        abortReason: `Monolith verification failed: ${error.message}`,
      };
    }

    const totalDurationMs = Date.now() - startTime;

    // Debug: snapshot Ferguson fields AFTER monolith extraction (captures Phase 0.1A mutations)
    debug?.recordFergusonExtraction();

    // Debug: record agent vs monolith comparison
    if (debug && hints.categoryHint) {
      const monolithCategory = verificationResponse.Primary_Attributes?.AI_Product_Category || '';
      debug.recordComparison(
        hints.categoryHint.value,
        hints.categoryHint.confidence,
        monolithCategory,
        true,
      );
    }

    // Debug: record totals and finalize report
    debug?.recordTotals(totalDurationMs, 0, 0);
    debug?.finalize();

    logger.info('Orchestrator: Pipeline complete', {
      sessionId,
      sfCatalogId: product.SF_Catalog_Id,
      totalDurationMs,
      categoryDecision,
      categoryUsedHint: hints.categoryHint?.value,
    });

    return {
      sessionId,
      sfCatalogId: product.SF_Catalog_Id,
      success: true,
      verificationResponse,
      agentSteps,
      hintsProvided: hints,
      totalDurationMs,
    };
  }

  /**
   * Run any agent through the consensus pipeline.
   * 
   * This is the generic agent executor — it doesn't know what the agent does,
   * only that it needs to reach consensus. The orchestrator never inspects
   * agent-specific output fields.
   */
  private async runAgent<TInput, TOutput extends AgentOutput>(
    agent: BaseAgent<TInput, TOutput>,
    input: TInput,
    options?: AgentRunOptions
  ): Promise<AgentConsensus<TOutput>> {
    const label = options?.label || agent.constructor.name;
    const maxRetries = options?.maxRetries ?? 2;
    const startTime = Date.now();

    logger.info(`Orchestrator: Running agent ${label}`, { maxRetries });

    try {
      if (options?.timeoutMs) {
        const result = await Promise.race([
          agent.runWithConsensus(input, maxRetries),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Agent ${label} timed out after ${options.timeoutMs}ms`)), options.timeoutMs)
          ),
        ]);
        return result;
      }

      return await agent.runWithConsensus(input, maxRetries);
    } catch (error: any) {
      logger.error(`Orchestrator: Agent ${label} threw`, {
        error: error.message,
        durationMs: Date.now() - startTime,
      });

      // Return a failed consensus so handleAgentFailure can decide what to do
      return {
        agreed: false,
        agreementScore: 0,
        discrepancies: [],
        retryAllowed: false,
        source: 'escalated',
      };
    }
  }

  /**
   * Centralized failure handling.
   * 
   * Decides whether to continue, escalate, or abort based on consensus outcome.
   * This is where confidence decay logic lives — all threshold decisions
   * are here, not scattered across agents.
   */
  private handleAgentFailure(
    agentName: string,
    consensus: AgentConsensus<unknown>,
    context: AgentContext
  ): OrchestratorDecision {
    // Full consensus reached — proceed
    if (consensus.agreed && consensus.agreementScore >= 80) {
      return 'continue';
    }

    // Weak consensus — escalate but continue
    // The pipeline proceeds with degraded confidence; downstream agents
    // see this in the context and can compensate
    if (consensus.agreed && consensus.agreementScore < 80) {
      logger.warn(`Orchestrator: ${agentName} reached weak consensus (score: ${consensus.agreementScore})`, {
        discrepancies: consensus.discrepancies.map(d => d.field),
      });

      context.set(`${agentName}.weakConsensus`, true);
      context.set(`${agentName}.agreementScore`, consensus.agreementScore);
      context.set(`${agentName}.escalationReason`, {
        type: 'weak-consensus',
        agreementScore: consensus.agreementScore,
        discrepancies: consensus.discrepancies.map(d => d.field),
        timestamp: new Date().toISOString(),
      });
      return 'escalate';
    }

    // No consensus and no value — the agent failed entirely
    if (!consensus.value) {
      logger.error(`Orchestrator: ${agentName} failed — no value produced`, {
        agreementScore: consensus.agreementScore,
        discrepancies: consensus.discrepancies.map(d => ({
          field: d.field,
          severity: d.severity,
        })),
      });
      return 'abort';
    }

    // No consensus but a value exists (e.g., picked higher-confidence side)
    // This is a degraded result — escalate but don't abort
    logger.warn(`Orchestrator: ${agentName} did not reach consensus but produced a value`, {
      agreementScore: consensus.agreementScore,
      source: consensus.source,
    });

    context.set(`${agentName}.noConsensus`, true);
    context.set(`${agentName}.agreementScore`, consensus.agreementScore);
    context.set(`${agentName}.escalationReason`, {
      type: 'no-consensus-with-value',
      agreementScore: consensus.agreementScore,
      source: consensus.source,
      discrepancies: consensus.discrepancies.map(d => d.field),
      timestamp: new Date().toISOString(),
    });
    return 'escalate';
  }

  /**
   * Map raw Salesforce product to CategoryClassifierInput.
   * 
   * This mapping lives in the orchestrator (not the agent) because the agent
   * shouldn't know about the raw Salesforce field names — it only knows its
   * own input schema.
   */
  private extractCategoryInput(product: SalesforceIncomingProduct): CategoryClassifierInput {
    // Treat MISC/MISCELLANEOUS as absent — not a real category signal
    const webRetailerCategory = isMiscCategory(product.Web_Retailer_Category)
      ? ''
      : (product.Web_Retailer_Category || '');
    const webRetailerSubCategory = isMiscCategory(product.Web_Retailer_SubCategory)
      ? ''
      : (product.Web_Retailer_SubCategory || '');

    if (isMiscCategory(product.Web_Retailer_Category)) {
      logger.warn('Orchestrator: Web_Retailer_Category is MISC — treating as absent', {
        sfCatalogId: product.SF_Catalog_Id,
        originalValue: product.Web_Retailer_Category,
      });
    }

    const input: CategoryClassifierInput = {
      fergusonCategory: product.Ferguson_Base_Category || '',
      fergusonProductType: product.Ferguson_Product_Type || '',
      fergusonTitle: product.Ferguson_Title || '',
      fergusonBusinessCategory: product.Ferguson_Business_Category,
      fergusonURL: product.Ferguson_URL,
      webRetailerCategory,
      webRetailerSubCategory,
      webRetailerTitle: product.Product_Title_Web_Retailer || '',
      webRetailerURL: product.Reference_URL || '',
      webRetailerDescription: product.Product_Description_Web_Retailer,
      legacyCategory: product.Category_Legacy,
      sfCatalogId: product.SF_Catalog_Id,
      sfCatalogName: product.SF_Catalog_Name,
    };

    const requiredFields: Array<keyof CategoryClassifierInput> = [
      'fergusonCategory', 'webRetailerCategory', 'fergusonTitle', 'webRetailerTitle', 'sfCatalogId',
    ];
    const missingRequired = requiredFields.filter(field => !input[field]);

    if (missingRequired.length > 0) {
      logger.warn('Orchestrator: CategoryClassifierAgent missing required input fields', {
        missingRequired,
        sfCatalogId: product.SF_Catalog_Id,
      });
    }

    return input;
  }

  /**
   * Build initial AgentContext from raw product.
   * 
   * Seeds the context with the raw product under 'rawProduct' key.
   * Each agent's pick() extracts only what it needs.
   */
  private buildContext(product: SalesforceIncomingProduct): AgentContext {
    return new AgentContext({ rawProduct: product });
  }
}
