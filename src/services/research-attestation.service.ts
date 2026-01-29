/**
 * Research Attestation Service
 * 
 * Ensures "Procurement No Results" is only used after thorough research.
 * Implements the mandatory 8-step checklist for Claude mediator.
 */

import logger from '../utils/logger';
import {
  ResearchAttestation,
  ResearchChecklist,
  BatchResearchAttestation,
  AttestationSummary,
  ChecklistItem,
  RawDataReviewItem,
  UrlScrapingItem,
  AIAnalysisReviewItem,
  SmartInferenceItem,
  ImageAnalysisItem,
  CrossReferenceItem,
  FinalVerificationItem,
  FIELD_STATUS_CODES,
  CHECKLIST_STEPS,
  createEmptyChecklist,
} from '../types/research-attestation.types';

/**
 * Research Attestation Service
 * Manages the 8-step mandatory research checklist
 */
export class ResearchAttestationService {
  private static instance: ResearchAttestationService;

  private constructor() {}

  public static getInstance(): ResearchAttestationService {
    if (!ResearchAttestationService.instance) {
      ResearchAttestationService.instance = new ResearchAttestationService();
    }
    return ResearchAttestationService.instance;
  }

  /**
   * Create a new attestation for a field
   */
  public createAttestation(fieldName: string): ResearchAttestation {
    return {
      fieldName,
      fieldValue: null,
      status: 'INCOMPLETE',
      statusMessage: 'Research not started',
      checklist: createEmptyChecklist(),
      completedSteps: 0,
      totalSteps: 8,
      completionRate: 0,
      attestedBy: 'Claude Sonnet 4.5',
      attestedAt: new Date(),
      canAttest: false,
    };
  }

  /**
   * Step 1: Record raw SF data review
   */
  public recordRawDataReview(
    attestation: ResearchAttestation,
    options: {
      fieldsSearched?: string[];
      synonymsChecked?: string[];
      searchAttempts?: number;
      found?: boolean;
      valueFound?: string | number | boolean;
      notes?: string;
    }
  ): void {
    const item: RawDataReviewItem = {
      completed: true,
      attempted: true,
      timestamp: new Date(),
      result: options.found ? 'found' : 'not_found',
      fieldsSearched: options.fieldsSearched || [],
      synonymsChecked: options.synonymsChecked || [],
      searchAttempts: options.searchAttempts || 1,
      notes: options.notes,
      valueFound: options.valueFound,
      confidence: options.found ? 90 : 0,
    };

    attestation.checklist.rawDataReview = item;
    this.updateCompletionMetrics(attestation);

    if (options.found && options.valueFound !== undefined) {
      this.markAsFound(attestation, options.valueFound, 'Raw SF Data', 'Step 1 - Raw Data Review', 90);
    }

    logger.debug(`[${attestation.fieldName}] Raw data review completed`, { found: options.found });
  }

  /**
   * Step 2: Record URL scraping results
   */
  public recordUrlScraping(
    attestation: ResearchAttestation,
    options: {
      urlsChecked?: string[];
      failedUrls?: string[];
      contentTypesFound?: string[];
      found?: boolean;
      valueFound?: string | number | boolean;
      source?: string;
      notes?: string;
      error?: string;
    }
  ): void {
    const urlCount = options.urlsChecked?.length || 0;
    const failedCount = options.failedUrls?.length || 0;
    const hasError = !!options.error || (urlCount > 0 && failedCount === urlCount);

    const item: UrlScrapingItem = {
      completed: !hasError && urlCount > 0,
      attempted: urlCount > 0 || !!options.error,
      timestamp: new Date(),
      result: hasError ? 'error' : (options.found ? 'found' : 'not_found'),
      urlsChecked: options.urlsChecked || [],
      urlCount,
      failedUrls: options.failedUrls || [],
      contentTypesFound: options.contentTypesFound || [],
      notes: options.notes,
      valueFound: options.valueFound,
      source: options.source,
      confidence: options.found ? 95 : 0,
      errorMessage: options.error,
    };

    attestation.checklist.urlScraping = item;
    this.updateCompletionMetrics(attestation);

    if (options.found && options.valueFound !== undefined) {
      // URL data has highest priority
      this.markAsFound(attestation, options.valueFound, options.source || 'URL', 'Step 2 - URL Scraping', 95);
    }

    logger.debug(`[${attestation.fieldName}] URL scraping completed`, { 
      urlCount, 
      failedCount, 
      found: options.found 
    });
  }

  /**
   * Step 3: Record OpenAI analysis review
   */
  public recordOpenAIReview(
    attestation: ResearchAttestation,
    options: {
      aiConfidence?: number;
      reasoning?: string;
      suggestedValue?: string | number | boolean;
      found?: boolean;
      notes?: string;
      error?: string;
    }
  ): void {
    const item: AIAnalysisReviewItem = {
      completed: !options.error,
      attempted: true,
      timestamp: new Date(),
      result: options.error ? 'error' : (options.found ? 'found' : 'not_found'),
      provider: 'openai',
      aiConfidence: options.aiConfidence,
      reasoning: options.reasoning,
      suggestedValue: options.suggestedValue,
      notes: options.notes,
      confidence: options.aiConfidence || 0,
      errorMessage: options.error,
      valueFound: options.suggestedValue,
    };

    attestation.checklist.openAIReview = item;
    this.updateCompletionMetrics(attestation);

    logger.debug(`[${attestation.fieldName}] OpenAI review recorded`, { 
      confidence: options.aiConfidence, 
      found: options.found 
    });
  }

  /**
   * Step 4: Record xAI analysis review
   */
  public recordXAIReview(
    attestation: ResearchAttestation,
    options: {
      aiConfidence?: number;
      reasoning?: string;
      suggestedValue?: string | number | boolean;
      found?: boolean;
      notes?: string;
      error?: string;
    }
  ): void {
    const item: AIAnalysisReviewItem = {
      completed: !options.error,
      attempted: true,
      timestamp: new Date(),
      result: options.error ? 'error' : (options.found ? 'found' : 'not_found'),
      provider: 'xai',
      aiConfidence: options.aiConfidence,
      reasoning: options.reasoning,
      suggestedValue: options.suggestedValue,
      notes: options.notes,
      confidence: options.aiConfidence || 0,
      errorMessage: options.error,
      valueFound: options.suggestedValue,
    };

    attestation.checklist.xAIReview = item;
    this.updateCompletionMetrics(attestation);

    logger.debug(`[${attestation.fieldName}] xAI review recorded`, { 
      confidence: options.aiConfidence, 
      found: options.found 
    });
  }

  /**
   * Step 5: Record smart field inference results
   */
  public recordSmartInference(
    attestation: ResearchAttestation,
    options: {
      aliasesChecked?: string[];
      unitConversions?: string[];
      patternsMatched?: string[];
      found?: boolean;
      valueFound?: string | number | boolean;
      notes?: string;
      error?: string;
    }
  ): void {
    const aliasCount = options.aliasesChecked?.length || 0;

    const item: SmartInferenceItem = {
      completed: !options.error,
      attempted: aliasCount > 0 || !!options.error,
      timestamp: new Date(),
      result: options.error ? 'error' : (options.found ? 'found' : 'not_found'),
      aliasesChecked: options.aliasesChecked || [],
      aliasCount,
      unitConversions: options.unitConversions || [],
      patternsMatched: options.patternsMatched || [],
      notes: options.notes,
      confidence: options.found ? 85 : 0,
      errorMessage: options.error,
      valueFound: options.valueFound,
    };

    attestation.checklist.smartInference = item;
    this.updateCompletionMetrics(attestation);

    if (options.found && options.valueFound !== undefined && !attestation.foundSource) {
      this.markAsFound(attestation, options.valueFound, 'Smart Inference', 'Step 5 - Smart Inference', 85);
    }

    logger.debug(`[${attestation.fieldName}] Smart inference completed`, { 
      aliasCount, 
      found: options.found 
    });
  }

  /**
   * Step 6: Record image analysis results
   */
  public recordImageAnalysis(
    attestation: ResearchAttestation,
    options: {
      imagesProcessed?: number;
      imageUrls?: string[];
      ocrTextExtracted?: boolean;
      specSheetsAnalyzed?: number;
      labelsRead?: number;
      found?: boolean;
      valueFound?: string | number | boolean;
      notes?: string;
      error?: string;
    }
  ): void {
    const imageCount = options.imagesProcessed || options.imageUrls?.length || 0;
    // Mark as completed if attempted (even with 0 images - that's valid)
    const wasAttempted = imageCount > 0 || options.notes?.includes('No images') || !options.error;

    const item: ImageAnalysisItem = {
      completed: wasAttempted && !options.error,
      attempted: wasAttempted,
      timestamp: new Date(),
      result: options.error ? 'error' : (options.found ? 'found' : 'not_found'),
      imagesProcessed: imageCount,
      imageUrls: options.imageUrls || [],
      ocrTextExtracted: options.ocrTextExtracted || false,
      specSheetsAnalyzed: options.specSheetsAnalyzed || 0,
      labelsRead: options.labelsRead || 0,
      notes: options.notes,
      confidence: options.found ? 92 : 0,
      errorMessage: options.error,
      valueFound: options.valueFound,
    };

    attestation.checklist.imageAnalysis = item;
    this.updateCompletionMetrics(attestation);

    if (options.found && options.valueFound !== undefined && !attestation.foundSource) {
      this.markAsFound(attestation, options.valueFound, 'Image Analysis', 'Step 6 - Image Analysis', 92);
    }

    logger.debug(`[${attestation.fieldName}] Image analysis completed`, { 
      imageCount, 
      found: options.found 
    });
  }

  /**
   * Step 7: Record cross-reference validation
   */
  public recordCrossReference(
    attestation: ResearchAttestation,
    options: {
      sourcesCompared?: string[];
      conflictsFound?: boolean;
      conflictDetails?: string[];
      consistencyScore?: number;
      notes?: string;
      error?: string;
    }
  ): void {
    const sourceCount = options.sourcesCompared?.length || 0;

    const item: CrossReferenceItem = {
      completed: !options.error && sourceCount > 0,
      attempted: sourceCount > 0,
      timestamp: new Date(),
      result: options.error ? 'error' : (options.conflictsFound ? 'error' : 'not_found'),
      sourcesCompared: options.sourcesCompared || [],
      sourceCount,
      conflictsFound: options.conflictsFound || false,
      conflictDetails: options.conflictDetails || [],
      consistencyScore: options.consistencyScore,
      notes: options.notes,
      errorMessage: options.error,
    };

    attestation.checklist.crossReference = item;
    this.updateCompletionMetrics(attestation);

    // If conflicts found, may need to mark for human review
    if (options.conflictsFound && options.conflictDetails?.length) {
      if (!attestation.errorReasons) attestation.errorReasons = [];
      attestation.errorReasons.push(...options.conflictDetails);
    }

    logger.debug(`[${attestation.fieldName}] Cross-reference completed`, { 
      sourceCount, 
      conflictsFound: options.conflictsFound 
    });
  }

  /**
   * Step 8: Perform final verification and attestation
   */
  public performFinalVerification(attestation: ResearchAttestation): void {
    const checklist = attestation.checklist;
    const failedSteps: string[] = [];

    // Check each step
    CHECKLIST_STEPS.forEach(stepName => {
      const step = checklist[stepName] as ChecklistItem;
      if (!step.completed) {
        failedSteps.push(stepName);
      }
    });

    const allStepsVerified = failedSteps.length === 0;
    const canAttest = allStepsVerified && attestation.status !== 'FOUND';

    const item: FinalVerificationItem = {
      completed: true,
      attempted: true,
      timestamp: new Date(),
      result: allStepsVerified ? 'not_found' : 'error',
      allStepsVerified,
      failedSteps,
      attestationTimestamp: new Date(),
      canAttest,
    };

    attestation.checklist.finalVerification = item;
    attestation.canAttest = canAttest;
    this.updateCompletionMetrics(attestation);

    // Determine final status
    this.determineFinalStatus(attestation);

    logger.info(`[${attestation.fieldName}] Final verification complete`, {
      status: attestation.status,
      completionRate: attestation.completionRate,
      canAttest,
    });
  }

  /**
   * Mark a field as found with value
   */
  private markAsFound(
    attestation: ResearchAttestation,
    value: string | number | boolean,
    source: string,
    step: string,
    confidence: number
  ): void {
    attestation.status = 'FOUND';
    attestation.fieldValue = value;
    attestation.foundSource = source;
    attestation.foundAtStep = step;
    attestation.foundConfidence = confidence;
    attestation.statusMessage = `Found at ${step}`;
    attestation.canAttest = false; // Don't need to attest if found
  }

  /**
   * Determine the final status based on checklist completion
   */
  private determineFinalStatus(attestation: ResearchAttestation): void {
    // If already found, keep that status
    if (attestation.status === 'FOUND') {
      return;
    }

    const completionRate = attestation.completionRate;
    const hasConflicts = attestation.checklist.crossReference.conflictsFound;
    const hasErrors = attestation.errorReasons && attestation.errorReasons.length > 0;

    // Check for critical errors
    if (hasConflicts || hasErrors) {
      attestation.status = 'ERROR';
      attestation.fieldValue = FIELD_STATUS_CODES.RESEARCH_ERROR;
      attestation.statusMessage = 'Research encountered errors requiring human review';
      attestation.requiresHumanReview = true;
      return;
    }

    // Check for incomplete research
    if (completionRate < 100) {
      attestation.status = 'INCOMPLETE';
      attestation.fieldValue = FIELD_STATUS_CODES.RESEARCH_INCOMPLETE;
      attestation.statusMessage = `Research ${completionRate.toFixed(0)}% complete`;
      
      // Gather reasons for incompleteness
      const reasons: string[] = [];
      CHECKLIST_STEPS.forEach(stepName => {
        const step = attestation.checklist[stepName] as ChecklistItem;
        if (!step.completed) {
          if (step.errorMessage) {
            reasons.push(`${stepName}: ${step.errorMessage}`);
          } else if (!step.attempted) {
            reasons.push(`${stepName}: Not attempted`);
          } else {
            reasons.push(`${stepName}: Incomplete`);
          }
        }
      });
      attestation.incompleteReasons = reasons;
      return;
    }

    // All steps completed, data not found → Procurement No Results
    attestation.status = 'FULLY_RESEARCHED';
    attestation.fieldValue = FIELD_STATUS_CODES.PROCUREMENT_NO_RESULTS;
    attestation.statusMessage = 'After exhaustive research, data not found';
    attestation.canAttest = true;
  }

  /**
   * Update completion metrics
   */
  private updateCompletionMetrics(attestation: ResearchAttestation): void {
    let completedCount = 0;

    CHECKLIST_STEPS.forEach(stepName => {
      const step = attestation.checklist[stepName] as ChecklistItem;
      if (step.completed) {
        completedCount++;
      }
    });

    attestation.completedSteps = completedCount;
    attestation.completionRate = (completedCount / 8) * 100;
    attestation.attestedAt = new Date();
  }

  /**
   * Generate attestation checkpoint prompt for Claude
   */
  public generateAttestationCheckpoint(fieldName: string): string {
    return `
ATTESTATION CHECKPOINT FOR FIELD: ${fieldName}

Before I can mark this field as "Procurement No Results", I must confirm:

□ Step 1: I reviewed all raw Salesforce data thoroughly
□ Step 2: I scraped and analyzed all provided URLs  
□ Step 3: I examined all product images and spec sheets
□ Step 4: I reviewed OpenAI's complete analysis
□ Step 5: I reviewed xAI's complete analysis
□ Step 6: I attempted smart field inference with all aliases
□ Step 7: I cross-referenced all sources for consistency
□ Step 8: I verified no steps were skipped or failed

Can I honestly attest that ALL steps above were completed?

If ANY step is incomplete or failed:
→ Use "Research Incomplete - Pending" instead

If ALL steps completed but data not found:
→ Use "Procurement No Results" with full attestation

If conflicts or errors found:
→ Use "Research Error - Manual Review Required"
`;
  }

  /**
   * Create batch attestation for multiple fields
   */
  public createBatchAttestation(
    productId: string,
    sessionId: string,
    fieldAttestations: ResearchAttestation[]
  ): BatchResearchAttestation {
    const summary = this.calculateSummary(fieldAttestations);
    
    const humanReviewQueue = fieldAttestations
      .filter(a => a.requiresHumanReview || a.status === 'ERROR' || a.status === 'INCOMPLETE')
      .map(a => a.fieldName);

    return {
      productId,
      sessionId,
      totalFields: fieldAttestations.length,
      foundCount: summary.found,
      notFoundCount: summary.fullyResearched,
      incompleteCount: summary.incomplete,
      errorCount: summary.error,
      fieldAttestations,
      overallCompletionRate: summary.completionRate,
      timestamp: new Date(),
      humanReviewQueue,
    };
  }

  /**
   * Calculate summary statistics
   */
  public calculateSummary(attestations: ResearchAttestation[]): AttestationSummary {
    const summary: AttestationSummary = {
      found: 0,
      fullyResearched: 0,
      incomplete: 0,
      error: 0,
      total: attestations.length,
      completionRate: 0,
    };

    let totalCompletion = 0;

    attestations.forEach(a => {
      switch (a.status) {
        case 'FOUND':
          summary.found++;
          break;
        case 'FULLY_RESEARCHED':
          summary.fullyResearched++;
          break;
        case 'INCOMPLETE':
          summary.incomplete++;
          break;
        case 'ERROR':
          summary.error++;
          break;
      }
      totalCompletion += a.completionRate;
    });

    summary.completionRate = attestations.length > 0 
      ? totalCompletion / attestations.length 
      : 0;

    return summary;
  }

  /**
   * Validate that an attestation is complete
   */
  public validateAttestation(attestation: ResearchAttestation): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if using "Procurement No Results" without full completion
    if (
      attestation.fieldValue === FIELD_STATUS_CODES.PROCUREMENT_NO_RESULTS &&
      attestation.completionRate < 100
    ) {
      errors.push(
        `Cannot use "Procurement No Results" with only ${attestation.completionRate}% completion`
      );
    }

    // Check if canAttest is true without proper status
    if (attestation.canAttest && attestation.status !== 'FULLY_RESEARCHED') {
      errors.push('canAttest should only be true for FULLY_RESEARCHED status');
    }

    // Check for missing timestamps
    CHECKLIST_STEPS.forEach(stepName => {
      const step = attestation.checklist[stepName] as ChecklistItem;
      if (step.completed && !step.timestamp) {
        errors.push(`Missing timestamp for completed step: ${stepName}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format attestation for logging
   */
  public formatForLog(attestation: ResearchAttestation): string {
    const checkmarks = CHECKLIST_STEPS.map(stepName => {
      const step = attestation.checklist[stepName] as ChecklistItem;
      return step.completed ? '✓' : '✗';
    }).join('');

    return `[${attestation.fieldName}] ${attestation.status} (${attestation.completionRate.toFixed(0)}%) [${checkmarks}] → ${attestation.fieldValue}`;
  }

  /**
   * Format attestation for webhook response
   */
  public formatForWebhook(attestation: ResearchAttestation): Record<string, unknown> {
    return {
      fieldName: attestation.fieldName,
      fieldValue: attestation.fieldValue,
      researchAttestation: {
        status: attestation.status,
        completedSteps: attestation.completedSteps,
        totalSteps: attestation.totalSteps,
        completionRate: `${attestation.completionRate.toFixed(0)}%`,
        timestamp: attestation.attestedAt.toISOString(),
        attestedBy: attestation.attestedBy,
        canAttest: attestation.canAttest,
        ...(attestation.foundSource && {
          foundAt: attestation.foundAtStep,
          source: attestation.foundSource,
          confidence: attestation.foundConfidence,
          validatedBy: attestation.validatedBy,
        }),
        ...(attestation.incompleteReasons?.length && {
          incompleteReasons: attestation.incompleteReasons,
        }),
        ...(attestation.errorReasons?.length && {
          errorReasons: attestation.errorReasons,
          requiresHumanReview: attestation.requiresHumanReview,
        }),
        checklist: this.formatChecklistForWebhook(attestation.checklist),
      },
    };
  }

  /**
   * Format checklist for webhook (simplified view)
   */
  private formatChecklistForWebhook(checklist: ResearchChecklist): Record<string, unknown> {
    return {
      rawDataReview: {
        completed: checklist.rawDataReview.completed,
        found: checklist.rawDataReview.result === 'found',
      },
      urlScraping: {
        completed: checklist.urlScraping.completed,
        urlsChecked: checklist.urlScraping.urlCount || 0,
        found: checklist.urlScraping.result === 'found',
      },
      openAIReview: {
        completed: checklist.openAIReview.completed,
        confidence: checklist.openAIReview.aiConfidence || 0,
        found: checklist.openAIReview.result === 'found',
      },
      xAIReview: {
        completed: checklist.xAIReview.completed,
        confidence: checklist.xAIReview.aiConfidence || 0,
        found: checklist.xAIReview.result === 'found',
      },
      smartInference: {
        completed: checklist.smartInference.completed,
        aliasesChecked: checklist.smartInference.aliasCount || 0,
        found: checklist.smartInference.result === 'found',
      },
      imageAnalysis: {
        completed: checklist.imageAnalysis.completed,
        imagesProcessed: checklist.imageAnalysis.imagesProcessed || 0,
        found: checklist.imageAnalysis.result === 'found',
      },
      crossReference: {
        completed: checklist.crossReference.completed,
        sourcesCompared: checklist.crossReference.sourceCount || 0,
        conflictsFound: checklist.crossReference.conflictsFound || false,
      },
      finalVerification: {
        completed: checklist.finalVerification.completed,
        allStepsVerified: checklist.finalVerification.allStepsVerified || false,
      },
    };
  }
}

// Export singleton instance
export const researchAttestationService = ResearchAttestationService.getInstance();
