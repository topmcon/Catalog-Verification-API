/**
 * SELF-HEALING ORCHESTRATOR
 * 
 * Queue-based self-healing system that processes jobs one at a time.
 * 
 * Flow:
 * 1. Job completes verification → added to self-heal queue
 * 2. If queue processor is idle, it starts processing
 * 3. Processor works through queue one job at a time
 * 4. When queue is empty, processor goes to standby
 * 
 * Phases per job:
 * 1. Detect issues (AI extraction audit)
 * 2. Gets dual-AI consensus diagnosis
 * 3. Applies comprehensive fixes with multi-attempt retry
 * 4. Validates with both AIs
 * 5. Sends corrections to Salesforce
 */

import dualAIDiagnostician from './dual-ai-diagnostician.service';
import multiAttemptVerifier from './multi-attempt-verifier.service';
import comprehensiveSFCorrectionSender from './comprehensive-sf-correction-sender.service';
import { VerificationJob } from '../../models/verification-job.model';
import { APITracker } from '../../models/api-tracker.model';
import logger from '../../utils/logger';

interface SelfHealingResult {
  success: boolean;
  jobId: string;
  phase: string;
  reason?: string;
  diagnosisTimestamp?: Date;
  consensusAchieved?: boolean;
  attemptsTaken?: number;
  finalAttempt?: number;
  sfCorrectionSent?: boolean;
  completedAt?: Date;
  escalatedToHuman?: boolean;
}

interface QueuedJob {
  jobId: string;
  queuedAt: Date;
  scheduledFor: Date;  // When it should be processed (after delay)
}

class SelfHealingOrchestrator {
  // Queue state
  private queue: QueuedJob[] = [];
  private isProcessing: boolean = false;
  private currentJobId: string | null = null;
  private processedCount: number = 0;
  private failedCount: number = 0;

  /**
   * Main entry point: Add job to self-healing queue
   * Job will be processed after the configured delay (default 60s)
   */
  async scheduleAfterWebhook(jobId: string): Promise<void> {
    const delayMs = parseInt(process.env.SELF_HEALING_DELAY_AFTER_WEBHOOK || '60000');
    const scheduledFor = new Date(Date.now() + delayMs);

    const queuedJob: QueuedJob = {
      jobId,
      queuedAt: new Date(),
      scheduledFor
    };

    this.queue.push(queuedJob);

    logger.info(`[Self-Healing Queue] ➕ Added job ${jobId} to queue`, {
      queuePosition: this.queue.length,
      scheduledFor: scheduledFor.toISOString(),
      delaySeconds: delayMs / 1000,
      isProcessing: this.isProcessing,
      currentJob: this.currentJobId
    });

    // Start processor if not running
    if (!this.isProcessing) {
      this.startQueueProcessor();
    }
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): object {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      currentJobId: this.currentJobId,
      processedCount: this.processedCount,
      failedCount: this.failedCount,
      queuedJobs: this.queue.map(j => ({
        jobId: j.jobId,
        queuedAt: j.queuedAt,
        scheduledFor: j.scheduledFor,
        readyIn: Math.max(0, j.scheduledFor.getTime() - Date.now()) / 1000 + 's'
      }))
    };
  }

  /**
   * Start the queue processor
   */
  private async startQueueProcessor(): Promise<void> {
    if (this.isProcessing) {
      logger.debug('[Self-Healing Queue] Processor already running');
      return;
    }

    this.isProcessing = true;
    logger.info('[Self-Healing Queue] 🚀 Queue processor STARTED');

    try {
      while (this.queue.length > 0) {
        // Get next job
        const nextJob = this.queue[0];
        
        // Wait until job is ready (past its scheduled time)
        const waitTime = nextJob.scheduledFor.getTime() - Date.now();
        if (waitTime > 0) {
          logger.info(`[Self-Healing Queue] ⏳ Waiting ${Math.ceil(waitTime/1000)}s for job ${nextJob.jobId}`);
          await this.sleep(waitTime);
        }

        // Remove from queue and process
        this.queue.shift();
        this.currentJobId = nextJob.jobId;

        logger.info(`[Self-Healing Queue] 📋 Processing job ${nextJob.jobId}`, {
          remainingInQueue: this.queue.length
        });

        try {
          const result = await this.runCompleteSelfHealing(nextJob.jobId);
          
          if (result.success) {
            this.processedCount++;
          } else {
            this.failedCount++;
          }

          logger.info(`[Self-Healing Queue] ✅ Completed job ${nextJob.jobId}`, {
            success: result.success,
            reason: result.reason,
            remainingInQueue: this.queue.length
          });

        } catch (error) {
          this.failedCount++;
          logger.error(`[Self-Healing Queue] ❌ Failed job ${nextJob.jobId}`, {
            error: error instanceof Error ? error.message : String(error),
            remainingInQueue: this.queue.length
          });
        }

        this.currentJobId = null;
      }

    } finally {
      this.isProcessing = false;
      logger.info('[Self-Healing Queue] 💤 Queue processor IDLE - waiting for new jobs', {
        totalProcessed: this.processedCount,
        totalFailed: this.failedCount
      });
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Run complete self-healing workflow
   */
  async runCompleteSelfHealing(jobId: string): Promise<SelfHealingResult> {
    const result: SelfHealingResult = {
      success: false,
      jobId,
      phase: 'initialization'
    };

    try {
      logger.info(`\n${'='.repeat(70)}`);
      logger.info(`🔧 STARTING SELF-HEALING FOR JOB: ${jobId}`);
      logger.info(`${'='.repeat(70)}\n`);

      // PHASE 0: Load original job data
      result.phase = 'loading_data';
      const originalJob = await VerificationJob.findOne({ jobId });
      const apiTracker = await APITracker.findOne({ jobId });

      if (!originalJob) {
        return { ...result, reason: 'Job not found in database' };
      }

      // PHASE 1: Detect issues
      result.phase = 'error_detection';
      logger.info(`[Phase 1] Detecting issues...`);
      
      const issue = await this.detectIssue(originalJob, apiTracker);
      
      if (!issue) {
        logger.info(`[Phase 1] No issues detected for job ${jobId}. Skipping self-healing.`);
        return { ...result, success: true, reason: 'No issues found' };
      }

      logger.info(`[Phase 1] ✅ Detected issue: ${issue.issueType} (${issue.severity} severity)`);
      logger.info(`[Phase 1] Missing fields: ${issue.missingFields.join(', ')}`);

      // PHASE 2: Dual-AI Diagnosis
      result.phase = 'dual_ai_diagnosis';
      result.diagnosisTimestamp = new Date();
      
      logger.info(`\n[Phase 2] Starting dual-AI diagnosis...`);
      
      const consensus = await dualAIDiagnostician.diagnoseWithConsensus(issue);

      if (!consensus || !consensus.agreed) {
        logger.warn(`[Phase 2] ❌ No consensus reached between AIs`);
        result.consensusAchieved = false;
        result.escalatedToHuman = true;
        await this.escalateToHuman(jobId, 'No AI consensus', { consensus });
        return { ...result, reason: 'No AI consensus' };
      }

      result.consensusAchieved = true;
      logger.info(`[Phase 2] ✅ Consensus achieved!`);
      logger.info(`[Phase 2] Root cause: ${consensus.consensusRootCause}`);
      logger.info(`[Phase 2] Combined confidence: ${consensus.combinedConfidence}%`);
      logger.info(`[Phase 2] System-wide fixes planned: ${consensus.selectedFix.systemWide.length}`);

      // PHASE 3-4: Multi-Attempt Verification with Comprehensive Fixes
      result.phase = 'multi_attempt_verification';
      
      logger.info(`\n[Phase 3-4] Starting multi-attempt verification (max ${process.env.SELF_HEALING_MAX_ATTEMPTS || 3} attempts)...`);

      const verificationResult = await multiAttemptVerifier.verifyWithRetry(
        consensus.selectedFix,
        originalJob,
        issue.rawPayload,
        issue.currentResponse
      );

      result.attemptsTaken = verificationResult.totalAttempts;
      result.finalAttempt = verificationResult.finalAttempt;

      if (!verificationResult.success) {
        logger.error(`[Phase 3-4] ❌ All ${verificationResult.totalAttempts} attempts failed`);
        result.escalatedToHuman = true;
        await this.escalateToHuman(jobId, verificationResult.reason, {
          consensus,
          attempts: verificationResult.attempts
        });
        return { ...result, reason: verificationResult.reason };
      }

      logger.info(`[Phase 3-4] ✅ Fix validated after ${verificationResult.finalAttempt} attempt(s)!`);

      // PHASE 5: Comprehensive SF Correction
      result.phase = 'sf_correction';
      
      logger.info(`\n[Phase 5] Sending comprehensive correction to Salesforce...`);

      const sfResult = await comprehensiveSFCorrectionSender.sendComprehensiveCorrection(
        originalJob,
        issue.currentResponse,
        verificationResult.finalResponse,
        verificationResult,
        consensus.selectedFix,
        consensus.selectedFix.systemWide
      );

      if (!sfResult.success) {
        logger.error(`[Phase 5] ❌ SF correction failed: ${sfResult.reason}`);
        result.sfCorrectionSent = false;
        result.escalatedToHuman = true;
        await this.escalateToHuman(jobId, `SF correction failed: ${sfResult.reason}`, {
          consensus,
          verificationResult
        });
        return { ...result, reason: sfResult.reason };
      }

      result.sfCorrectionSent = true;
      result.completedAt = new Date();
      result.success = true;

      logger.info(`[Phase 5] ✅ Comprehensive correction sent to Salesforce successfully!`);
      
      // Log success summary
      await this.logSuccessfulHealing(jobId, {
        consensus,
        verificationResult,
        sfResult
      });

      logger.info(`\n${'='.repeat(70)}`);
      logger.info(`✅ SELF-HEALING COMPLETE FOR JOB: ${jobId}`);
      logger.info(`   Attempts: ${result.finalAttempt}/${result.attemptsTaken}`);
      logger.info(`   Duration: ${this.calculateDuration(result.diagnosisTimestamp, result.completedAt)}`);
      logger.info(`${'='.repeat(70)}\n`);

      return result;

    } catch (error: any) {
      logger.error(`[Self-Healing] Fatal error in job ${jobId}:`, error);
      result.phase = 'error';
      result.reason = `Exception: ${error.message}`;
      result.escalatedToHuman = true;
      
      await this.escalateToHuman(jobId, error.message, { stack: error.stack });
      
      return result;
    }
  }

  /**
   * Detect issue from job and tracker data
   * COMPREHENSIVE AI EXTRACTION AUDIT
   * 
   * For EVERY completed job, audits the AI's decision-making process:
   * 1. Extracts ALL available data from the raw payload (Ferguson, manufacturer specs, etc.)
   * 2. Compares against what the AI actually returned
   * 3. Flags discrepancies where data WAS available but AI failed to extract it
   * 4. Distinguishes between "no data available" vs "AI extraction failure"
   * 
   * This catches logic bugs, AI failures, and mapping issues - not just blank fields.
   */
  private async detectIssue(job: any, tracker: any): Promise<any | null> {
    const extractionFailures: Array<{field: string; availableInPayload: string; aiReturned: string; reason: string}> = [];
    const auditFindings: string[] = [];
    
    // Check for Salesforce-level errors first (highest priority)
    if (job.salesforceError) {
      logger.info('[Self-Healing] Detected Salesforce error', {
        jobId: job.jobId,
        salesforceError: job.salesforceError
      });
      
      const errorMessage = job.salesforceError;
      let issueType = 'salesforce_rejection';
      const severity: 'low' | 'medium' | 'high' = 'high';
      const affectedFields: string[] = [];
      
      if (errorMessage.includes('STRING_TOO_LONG')) {
        issueType = 'field_too_long';
        const fieldMatch = errorMessage.match(/STRING_TOO_LONG,\s*([^:]+):/);
        if (fieldMatch) affectedFields.push(fieldMatch[1].trim());
      } else if (errorMessage.includes('REQUIRED_FIELD_MISSING')) {
        issueType = 'required_field_missing';
        const fieldsMatch = errorMessage.match(/missing:\s*\[([^\]]+)\]/);
        if (fieldsMatch) affectedFields.push(...fieldsMatch[1].split(',').map((f: string) => f.trim()));
      } else if (errorMessage.includes('DUPLICATE_VALUE')) {
        issueType = 'duplicate_record';
      } else if (errorMessage.includes('FIELD_CUSTOM_VALIDATION_EXCEPTION')) {
        issueType = 'validation_failed';
      }
      
      return {
        jobId: job.jobId,
        sfCatalogId: job.sfCatalogId,
        issueType,
        severity,
        missingFields: [],
        wrongFields: affectedFields,
        affectedCount: 1,
        rawPayload: job.rawPayload,
        currentResponse: tracker?.response || job.result,
        errorLogs: [errorMessage],
        salesforceError: errorMessage
      };
    }
    
    // ================================================================
    // COMPREHENSIVE AI EXTRACTION AUDIT
    // Compare raw payload data against AI verification results
    // ================================================================
    const result = job.result?.data || job.result;
    const primaryAttrs = result?.Primary_Display_Attributes || result?.Primary_Attributes || {};
    const topFilterAttrs = result?.Top_Filter_Attributes || {};
    const rawPayload = job.rawPayload || {};
    
    // Extract ALL available data from the raw payload
    const payloadData = this.extractAllPayloadData(rawPayload);
    
    logger.info('[Self-Healing] 🔍 STARTING AI EXTRACTION AUDIT', {
      jobId: job.jobId,
      product: job.sfCatalogName,
      payloadDataFound: Object.keys(payloadData).length,
      payloadFields: Object.keys(payloadData).join(', '),
      hasResult: !!result,
      hasPrimaryAttrs: Object.keys(primaryAttrs).length > 0
    });
    
    // Log what we found in the payload
    if (Object.keys(payloadData).length > 0) {
      logger.debug('[Self-Healing] Payload data extracted', {
        jobId: job.jobId,
        brand: payloadData.brand,
        modelNumber: payloadData.modelNumber,
        category: payloadData.category,
        title: payloadData.title?.substring(0, 50),
        price: payloadData.price
      });
    }
    
    // ===== AUDIT CRITICAL FIELDS =====
    
    // 1. BRAND AUDIT
    if (payloadData.brand) {
      const aiReturned = primaryAttrs.Brand_Verified || '';
      if (this.isBlankOrUnknown(aiReturned)) {
        extractionFailures.push({
          field: 'Brand_Verified',
          availableInPayload: payloadData.brand,
          aiReturned: aiReturned || '(empty)',
          reason: 'AI failed to extract brand that exists in payload'
        });
        auditFindings.push(`❌ BRAND: Payload has "${payloadData.brand}" but AI returned "${aiReturned || 'empty'}"`);
      } else {
        auditFindings.push(`✓ BRAND: AI extracted "${aiReturned}" (payload: "${payloadData.brand}")`);
      }
    } else {
      auditFindings.push(`○ BRAND: No data in payload - AI correctly has no source`);
    }
    
    // 2. MODEL NUMBER AUDIT
    if (payloadData.modelNumber) {
      const aiReturned = primaryAttrs.Model_Number_Verified || '';
      if (this.isBlankOrUnknown(aiReturned)) {
        extractionFailures.push({
          field: 'Model_Number_Verified',
          availableInPayload: payloadData.modelNumber,
          aiReturned: aiReturned || '(empty)',
          reason: 'AI failed to extract model number that exists in payload'
        });
        auditFindings.push(`❌ MODEL: Payload has "${payloadData.modelNumber}" but AI returned "${aiReturned || 'empty'}"`);
      } else {
        auditFindings.push(`✓ MODEL: AI extracted "${aiReturned}" (payload: "${payloadData.modelNumber}")`);
      }
    }
    
    // 3. CATEGORY AUDIT
    if (payloadData.category) {
      const aiReturned = primaryAttrs.Category_Verified || '';
      if (this.isBlankOrUnknown(aiReturned)) {
        extractionFailures.push({
          field: 'Category_Verified',
          availableInPayload: payloadData.category,
          aiReturned: aiReturned || '(empty)',
          reason: 'AI failed to determine category despite payload data'
        });
        auditFindings.push(`❌ CATEGORY: Payload suggests "${payloadData.category}" but AI returned "${aiReturned || 'empty'}"`);
      } else {
        auditFindings.push(`✓ CATEGORY: AI determined "${aiReturned}" (payload hint: "${payloadData.category}")`);
      }
    }
    
    // 4. TITLE AUDIT
    if (payloadData.title) {
      const aiReturned = primaryAttrs.Product_Title_Verified || '';
      if (this.isBlankOrUnknown(aiReturned)) {
        extractionFailures.push({
          field: 'Product_Title_Verified',
          availableInPayload: payloadData.title.substring(0, 100),
          aiReturned: aiReturned || '(empty)',
          reason: 'AI failed to extract title that exists in payload'
        });
        auditFindings.push(`❌ TITLE: Payload has title but AI returned empty`);
      } else {
        auditFindings.push(`✓ TITLE: AI extracted title (${aiReturned.length} chars)`);
      }
    }
    
    // 5. PRICE/MSRP AUDIT
    if (payloadData.price) {
      const aiReturned = primaryAttrs.MSRP_Verified || '';
      if (this.isBlankOrUnknown(aiReturned)) {
        extractionFailures.push({
          field: 'MSRP_Verified',
          availableInPayload: payloadData.price,
          aiReturned: aiReturned || '(empty)',
          reason: 'AI failed to extract price that exists in payload'
        });
        auditFindings.push(`❌ PRICE: Payload has "${payloadData.price}" but AI returned "${aiReturned || 'empty'}"`);
      } else {
        auditFindings.push(`✓ PRICE: AI extracted "${aiReturned}" (payload: "${payloadData.price}")`);
      }
    }
    
    // 6. DIMENSIONS AUDIT
    if (payloadData.width) {
      const aiReturned = primaryAttrs.Width_Verified || topFilterAttrs.Width_Verified || '';
      if (this.isBlankOrUnknown(aiReturned)) {
        extractionFailures.push({
          field: 'Width_Verified',
          availableInPayload: payloadData.width,
          aiReturned: aiReturned || '(empty)',
          reason: 'AI failed to extract width from payload'
        });
        auditFindings.push(`❌ WIDTH: Payload has "${payloadData.width}" but AI missed it`);
      }
    }
    
    if (payloadData.height) {
      const aiReturned = primaryAttrs.Height_Verified || topFilterAttrs.Height_Verified || '';
      if (this.isBlankOrUnknown(aiReturned)) {
        extractionFailures.push({
          field: 'Height_Verified',
          availableInPayload: payloadData.height,
          aiReturned: aiReturned || '(empty)',
          reason: 'AI failed to extract height from payload'
        });
        auditFindings.push(`❌ HEIGHT: Payload has "${payloadData.height}" but AI missed it`);
      }
    }
    
    // 7. UPC/GTIN AUDIT
    if (payloadData.upc) {
      const aiReturned = primaryAttrs.UPC_GTIN_Verified || '';
      if (this.isBlankOrUnknown(aiReturned)) {
        extractionFailures.push({
          field: 'UPC_GTIN_Verified',
          availableInPayload: payloadData.upc,
          aiReturned: aiReturned || '(empty)',
          reason: 'AI failed to extract UPC/GTIN from payload'
        });
        auditFindings.push(`❌ UPC: Payload has "${payloadData.upc}" but AI missed it`);
      }
    }
    
    // 8. COLOR/FINISH AUDIT
    if (payloadData.color) {
      const aiReturned = primaryAttrs.Color_Verified || '';
      if (this.isBlankOrUnknown(aiReturned)) {
        extractionFailures.push({
          field: 'Color_Verified',
          availableInPayload: payloadData.color,
          aiReturned: aiReturned || '(empty)',
          reason: 'AI failed to extract color from payload'
        });
        auditFindings.push(`❌ COLOR: Payload has "${payloadData.color}" but AI missed it`);
      }
    }
    
    if (payloadData.finish) {
      const aiReturned = primaryAttrs.Finish_Verified || '';
      if (this.isBlankOrUnknown(aiReturned)) {
        extractionFailures.push({
          field: 'Finish_Verified',
          availableInPayload: payloadData.finish,
          aiReturned: aiReturned || '(empty)',
          reason: 'AI failed to extract finish from payload'
        });
        auditFindings.push(`❌ FINISH: Payload has "${payloadData.finish}" but AI missed it`);
      }
    }
    
    // ===== LOG COMPREHENSIVE AUDIT RESULTS =====
    const failureCount = extractionFailures.length;
    
    logger.info('[Self-Healing] 📊 AI EXTRACTION AUDIT COMPLETE', {
      jobId: job.jobId,
      product: job.sfCatalogName,
      extractionFailures: failureCount,
      payloadFieldsFound: Object.keys(payloadData).filter(k => payloadData[k]).length,
      auditSummary: failureCount === 0 ? 'ALL_EXTRACTIONS_VALID' : 'EXTRACTION_FAILURES_DETECTED'
    });
    
    // Log detailed findings
    auditFindings.forEach(finding => {
      if (finding.startsWith('❌')) {
        logger.warn(`[Self-Healing] ${finding}`, { jobId: job.jobId });
      } else {
        logger.debug(`[Self-Healing] ${finding}`, { jobId: job.jobId });
      }
    });
    
    // ================================================================
    // NEW: Check ALL response fields for blanks - trigger review if ANY missing
    // Even if payload doesn't have the data, we want to audit WHY it's missing
    // ================================================================
    const blankResponseFields: string[] = [];
    const allResponseFields = [
      { name: 'Brand_Verified', value: primaryAttrs.Brand_Verified },
      { name: 'Category_Verified', value: primaryAttrs.Category_Verified },
      { name: 'Product_Title_Verified', value: primaryAttrs.Product_Title_Verified },
      { name: 'Model_Number_Verified', value: primaryAttrs.Model_Number_Verified },
      { name: 'MSRP_Verified', value: primaryAttrs.MSRP_Verified },
      { name: 'UPC_GTIN_Verified', value: primaryAttrs.UPC_GTIN_Verified },
      { name: 'Color_Verified', value: primaryAttrs.Color_Verified },
      { name: 'Finish_Verified', value: primaryAttrs.Finish_Verified },
      { name: 'Width_Verified', value: primaryAttrs.Width_Verified || topFilterAttrs.width_verified },
      { name: 'Height_Verified', value: primaryAttrs.Height_Verified || topFilterAttrs.height_verified },
      { name: 'Depth_Verified', value: primaryAttrs.Depth_Verified || topFilterAttrs.depth_verified },
      { name: 'Description', value: primaryAttrs.Description || result?.Description },
      { name: 'Features_List', value: primaryAttrs.Features_List || result?.Features_List }
    ];
    
    // Check every response field
    for (const field of allResponseFields) {
      if (this.isBlankOrUnknown(field.value)) {
        blankResponseFields.push(field.name);
      }
    }
    
    // Also check Top_Filter_Attributes
    const top15Blanks: string[] = [];
    if (topFilterAttrs && typeof topFilterAttrs === 'object') {
      for (const [key, value] of Object.entries(topFilterAttrs)) {
        if (this.isBlankOrUnknown(value)) {
          top15Blanks.push(key);
        }
      }
    }
    
    const totalBlankFields = blankResponseFields.length + top15Blanks.length;
    
    // Log blank fields audit
    logger.info('[Self-Healing] 📋 BLANK FIELDS AUDIT', {
      jobId: job.jobId,
      product: job.sfCatalogName,
      totalBlankFields,
      blankPrimaryFields: blankResponseFields.length,
      blankTop15Fields: top15Blanks.length,
      blankPrimary: blankResponseFields.join(', ') || 'none',
      blankTop15: top15Blanks.slice(0, 5).join(', ') + (top15Blanks.length > 5 ? '...' : '') || 'none'
    });
    
    // TRIGGER SELF-HEALING if ANY extraction failures OR any critical blank fields
    // Critical fields that should always have a value: Brand, Category, Title, Model
    const criticalBlankFields = blankResponseFields.filter(f => 
      ['Brand_Verified', 'Category_Verified', 'Product_Title_Verified', 'Model_Number_Verified'].includes(f)
    );
    
    const shouldTriggerHealing = failureCount > 0 || criticalBlankFields.length > 0;
    
    if (!shouldTriggerHealing) {
      logger.info('[Self-Healing] ✅ AI extraction audit passed - all critical fields populated', {
        jobId: job.jobId,
        product: job.sfCatalogName,
        blankNonCriticalFields: blankResponseFields.length,
        blankTop15: top15Blanks.length
      });
      return null;
    }
    
    // Calculate severity based on what failed
    const criticalFailures = extractionFailures.filter(f => 
      ['Brand_Verified', 'Category_Verified', 'Product_Title_Verified', 'Model_Number_Verified'].includes(f.field)
    );
    
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (criticalFailures.length >= 2 || criticalBlankFields.length >= 2) {
      severity = 'high';
    } else if (criticalFailures.length >= 1 || criticalBlankFields.length >= 1 || failureCount > 3) {
      severity = 'medium';
    }
    
    // Determine issue type based on what was found
    const issueType = failureCount > 0 
      ? 'ai_extraction_failure'  // Data was available but AI didn't extract it
      : 'critical_fields_blank'; // Critical fields blank - needs investigation
    
    logger.warn('[Self-Healing] 🚨 ISSUES DETECTED - TRIGGERING HEALING', {
      jobId: job.jobId,
      product: job.sfCatalogName,
      issueType,
      severity,
      extractionFailures: failureCount,
      criticalBlankFields: criticalBlankFields.length,
      blankCritical: criticalBlankFields.join(', '),
      totalBlankPrimary: blankResponseFields.length,
      totalBlankTop15: top15Blanks.length
    });

    return {
      jobId: job.jobId,
      sfCatalogId: job.sfCatalogId,
      issueType,
      severity,
      missingFields: [...new Set([...extractionFailures.map(f => f.field), ...criticalBlankFields])],
      blankResponseFields,
      blankTop15Fields: top15Blanks,
      extractionFailures,
      auditFindings,
      wrongFields: [],
      affectedCount: 1,
      rawPayload: job.rawPayload,
      currentResponse: tracker?.response || job.result,
      errorLogs: job.error ? [job.error] : []
    };
  }

  /**
   * Extract ALL available data from the raw payload
   * Scans Ferguson data, manufacturer specs, and any other sources
   */
  private extractAllPayloadData(rawPayload: any): Record<string, string> {
    const data: Record<string, string> = {};
    
    if (!rawPayload) return data;
    
    // === FLAT PAYLOAD FIELDS (primary source) ===
    // These are the actual field names in the Salesforce payload
    data.brand = rawPayload.Ferguson_Brand || rawPayload.Brand_Web_Retailer;
    data.modelNumber = rawPayload.Ferguson_Model_Number || rawPayload.Model_Number_Web_Retailer;
    data.title = rawPayload.Ferguson_Title || rawPayload.Product_Title_Web_Retailer;
    data.category = rawPayload.Ferguson_Business_Category || rawPayload.Ferguson_Base_Category || 
                    rawPayload.Web_Retailer_Category;
    data.price = rawPayload.Ferguson_Price || rawPayload.MSRP_Web_Retailer;
    data.color = rawPayload.Ferguson_Color || rawPayload.Color_Finish_Web_Retailer;
    data.finish = rawPayload.Ferguson_Finish;
    data.width = rawPayload.Ferguson_Width || rawPayload.Width_Web_Retailer;
    data.height = rawPayload.Ferguson_Height || rawPayload.Height_Web_Retailer;
    data.depth = rawPayload.Ferguson_Depth || rawPayload.Depth_Web_Retailer;
    
    // === FERGUSON_RAW_DATA (nested structure) ===
    const ferguson = rawPayload.Ferguson_Raw_Data || {};
    const product = ferguson.product || {};
    
    // Fill in from nested data if flat fields are missing
    if (!data.brand) {
      data.brand = product.brand?.name || product.brand || product.manufacturer?.name;
    }
    if (!data.modelNumber) {
      data.modelNumber = product.model_number || product.mpn || product.mfr_number;
    }
    if (!data.category) {
      data.category = product.business_category || product.base_category ||
                      ferguson.search_meta_data?.business_category;
    }
    if (!data.title) {
      data.title = product.title || product.name || product.product_name;
    }
    if (!data.price) {
      const priceObj = product.price || {};
      data.price = priceObj.current || priceObj.list || priceObj.msrp || product.currentPrice;
    }
    
    // Dimensions from nested specs - handle both array and object formats
    const specsRaw = product.specifications;
    const specs = Array.isArray(specsRaw) ? specsRaw : [];
    for (const spec of specs) {
      if (!spec) continue;
      const specName = (spec.name || spec.label || '').toLowerCase();
      const specValue = spec.value || spec.values?.[0] || '';
      
      if (specName.includes('width') && !data.width) data.width = specValue;
      if (specName.includes('height') && !data.height) data.height = specValue;
      if (specName.includes('depth') && !data.depth) data.depth = specValue;
      if (specName.includes('upc') || specName.includes('gtin')) data.upc = specValue;
      if (specName.includes('color') && !data.color) data.color = specValue;
      if (specName.includes('finish') && !data.finish) data.finish = specValue;
    }
    
    // === WEB_RETAILER_SPECS (additional data source) ===
    if (rawPayload.Web_Retailer_Specs && typeof rawPayload.Web_Retailer_Specs === 'object') {
      const webSpecs = rawPayload.Web_Retailer_Specs;
      if (!data.upc) data.upc = webSpecs.UPC || webSpecs.GTIN || webSpecs.EAN;
      if (!data.color) data.color = webSpecs.Color || webSpecs.Colour;
      if (!data.finish) data.finish = webSpecs.Finish || webSpecs.Surface;
    }
    
    // === SPECIFICATION_TABLE (additional fallback) ===
    if (rawPayload.Specification_Table && typeof rawPayload.Specification_Table === 'object') {
      const specTable = rawPayload.Specification_Table;
      if (!data.upc) data.upc = specTable.UPC || specTable.GTIN;
      if (!data.width) data.width = specTable.Width;
      if (!data.height) data.height = specTable.Height;
      if (!data.depth) data.depth = specTable.Depth;
    }
    
    // Convert any numeric values to strings
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (typeof val === 'number') {
        data[key] = String(val);
      }
    }
    
    // Clean up - remove empty/undefined values
    for (const key of Object.keys(data)) {
      if (!data[key] || data[key] === 'undefined' || data[key] === 'null' || data[key] === '') {
        delete data[key];
      }
    }
    
    return data;
  }

  /**
   * Check if a value is blank, empty, unknown, or indicates no data
   */
  private isBlankOrUnknown(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      if (trimmed === '' || trimmed === 'unknown' || trimmed === 'n/a' || trimmed === 'null' || trimmed === 'undefined') {
        return true;
      }
      // These are VALID status codes - not failures
      if (trimmed.includes('procurement no results')) {
        return false; // Research was done, data doesn't exist
      }
    }
    return false;
  }

  /**
   * Escalate to human review
   */
  private async escalateToHuman(jobId: string, reason: string, context: any): Promise<void> {
    logger.warn(`🚨 ESCALATING JOB ${jobId} TO HUMAN REVIEW`);
    logger.warn(`   Reason: ${reason}`);

    // TODO: Send to Slack, email, dashboard, etc.
    // For now, just log extensively

    logger.warn(`   Context:`, JSON.stringify(context, null, 2));

    // Save escalation to database
    try {
      // You would create an Escalation model for this
      logger.info(`Escalation logged for job ${jobId}`);
    } catch (error) {
      logger.error('Error logging escalation:', error);
    }
  }

  /**
   * Log successful self-healing
   */
  private async logSuccessfulHealing(jobId: string, _data: any): Promise<void> {
    try {
      // Save to self_healing_logs collection
      logger.info(`Self-healing success logged for job ${jobId}`);
      
      // TODO: Create SelfHealingLog model and save:
      // - jobId
      // - diagnosisTimestamp
      // - consensusAchieved: true
      // - openaiDiagnosis: data.consensus.openaiDiagnosis
      // - xaiDiagnosis: data.consensus.xaiDiagnosis
      // - selectedFix: data.consensus.selectedFix
      // - systemWideFixes: data.consensus.selectedFix.systemWide
      // - attemptsTaken: data.verificationResult.finalAttempt
      // - attempts: data.verificationResult.attempts
      // - finalOutcome: 'success'
      // - sfCorrectionSent: true
      // - completedAt: new Date()

    } catch (error) {
      logger.error('Error logging successful healing:', error);
    }
  }

  /**
   * Calculate duration between two timestamps
   */
  private calculateDuration(start?: Date, end?: Date): string {
    if (!start || !end) return 'unknown';
    
    const durationMs = end.getTime() - start.getTime();
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
}

export default new SelfHealingOrchestrator();
