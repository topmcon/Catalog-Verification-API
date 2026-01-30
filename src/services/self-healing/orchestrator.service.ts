/**
 * SELF-HEALING ORCHESTRATOR
 * 
 * Coordinates all phases of the self-healing system:
 * 1. Waits 60 seconds after SF webhook
 * 2. Detects issues
 * 3. Gets dual-AI consensus diagnosis
 * 4. Applies comprehensive fixes with multi-attempt retry
 * 5. Validates with both AIs
 * 6. Sends corrections to Salesforce
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

class SelfHealingOrchestrator {
  /**
   * Main entry point: Schedule self-healing 60 seconds after webhook sent
   */
  async scheduleAfterWebhook(jobId: string): Promise<void> {
    const delayMs = parseInt(process.env.SELF_HEALING_DELAY_AFTER_WEBHOOK || '60000');

    logger.info(`[Self-Healing] Scheduled for job ${jobId} in ${delayMs/1000} seconds`);

    setTimeout(async () => {
      await this.runCompleteSelfHealing(jobId);
    }, delayMs);
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
   * ENHANCED: Now analyzes EVERY completed job's verification results for missing/blank data
   * 
   * Checks (in priority order):
   * 1. Salesforce rejection errors (STRING_TOO_LONG, REQUIRED_FIELD_MISSING, etc.)
   * 2. Missing/blank PRIMARY fields in verification results
   * 3. Missing/blank TOP15 filter fields in verification results
   * 4. Tracker-logged issues (missing_top15_field)
   */
  private async detectIssue(job: any, tracker: any): Promise<any | null> {
    const missingFields: string[] = [];
    const blankFields: string[] = [];
    const analysisDetails: string[] = [];

    // Check for Salesforce-level errors first (highest priority)
    if (job.salesforceError) {
      logger.info('[Self-Healing] Detected Salesforce error', {
        jobId: job.jobId,
        salesforceError: job.salesforceError
      });
      
      // Parse the Salesforce error to determine issue type
      const errorMessage = job.salesforceError;
      let issueType = 'salesforce_rejection';
      let severity: 'low' | 'medium' | 'high' = 'high';
      const affectedFields: string[] = [];
      
      // Detect STRING_TOO_LONG errors
      if (errorMessage.includes('STRING_TOO_LONG')) {
        issueType = 'field_too_long';
        // Extract field name from error: "AI Total Model Variants: data value too large"
        const fieldMatch = errorMessage.match(/STRING_TOO_LONG,\s*([^:]+):/);
        if (fieldMatch) {
          affectedFields.push(fieldMatch[1].trim());
        }
      }
      // Detect REQUIRED_FIELD_MISSING errors
      else if (errorMessage.includes('REQUIRED_FIELD_MISSING')) {
        issueType = 'required_field_missing';
        // Extract field names: "Required fields are missing: [Name__c, Type__c]"
        const fieldsMatch = errorMessage.match(/missing:\s*\[([^\]]+)\]/);
        if (fieldsMatch) {
          affectedFields.push(...fieldsMatch[1].split(',').map((f: string) => f.trim()));
        }
      }
      // Detect other common Salesforce errors
      else if (errorMessage.includes('DUPLICATE_VALUE')) {
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
    
    // =====================================================
    // ENHANCED: Analyze verification results for blank data
    // =====================================================
    const result = job.result?.data || job.result;
    const primaryAttrs = result?.Primary_Display_Attributes || result?.Primary_Attributes || {};
    const topFilterAttrs = result?.Top_Filter_Attributes || {};
    const rawPayload = job.rawPayload || {};
    
    // Critical primary fields that should never be blank
    const criticalPrimaryFields = [
      'Brand_Verified',
      'Category_Verified', 
      'Product_Title_Verified',
      'Model_Number_Verified'
    ];
    
    // Important primary fields
    const importantPrimaryFields = [
      'MSRP_Verified',
      'UPC_GTIN_Verified',
      'Finish_Verified',
      'Color_Verified',
      'Width_Verified',
      'Height_Verified',
      'Depth_Verified'
    ];
    
    // Check critical primary fields for blanks
    for (const field of criticalPrimaryFields) {
      const value = primaryAttrs[field];
      if (this.isBlankValue(value)) {
        blankFields.push(field);
        analysisDetails.push(`CRITICAL: ${field} is blank`);
        
        // Check if raw payload might have data for this field
        const payloadHint = this.findPayloadHintForField(field, rawPayload);
        if (payloadHint) {
          analysisDetails.push(`  → Payload may have data: "${payloadHint.substring(0, 50)}..."`);
        }
      }
    }
    
    // Check important primary fields
    for (const field of importantPrimaryFields) {
      const value = primaryAttrs[field];
      if (this.isBlankValue(value)) {
        blankFields.push(field);
        analysisDetails.push(`IMPORTANT: ${field} is blank`);
      }
    }
    
    // Check TOP15 filter attributes
    const top15FieldNames = Object.keys(topFilterAttrs);
    for (const field of top15FieldNames) {
      const value = topFilterAttrs[field];
      if (this.isBlankValue(value)) {
        blankFields.push(`Top15.${field}`);
        analysisDetails.push(`TOP15: ${field} is blank`);
      }
    }
    
    // Also check tracker-logged issues
    const trackerMissingFields = tracker?.issues
      ?.filter((issue: any) => issue.type === 'missing_top15_field')
      ?.map((issue: any) => issue.field) || [];
    
    for (const field of trackerMissingFields) {
      if (!blankFields.includes(field) && !blankFields.includes(`Top15.${field}`)) {
        missingFields.push(field);
        analysisDetails.push(`TRACKER: ${field} was logged as missing`);
      }
    }
    
    // Combine all missing/blank fields
    const allIssueFields = [...blankFields, ...missingFields];
    
    if (allIssueFields.length === 0) {
      return null;
    }
    
    // Calculate severity based on what's missing
    const criticalBlanks = blankFields.filter(f => criticalPrimaryFields.includes(f));
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (criticalBlanks.length >= 2) {
      severity = 'high';
    } else if (criticalBlanks.length === 1 || blankFields.length > 5) {
      severity = 'medium';
    }
    
    logger.info('[Self-Healing] 📊 ANALYZED VERIFICATION RESULTS', {
      jobId: job.jobId,
      sfCatalogId: job.sfCatalogId,
      totalBlankFields: blankFields.length,
      criticalBlanks: criticalBlanks.length,
      severity,
      blankFields: blankFields.join(', '),
      analysisDetails
    });

    return {
      jobId: job.jobId,
      sfCatalogId: job.sfCatalogId,
      issueType: 'missing_data',
      severity,
      missingFields: allIssueFields,
      blankFields,
      wrongFields: [],
      affectedCount: 1,
      rawPayload: job.rawPayload,
      currentResponse: tracker?.response || job.result,
      errorLogs: job.error ? [job.error] : [],
      analysisDetails
    };
  }

  /**
   * Check if a value is blank/empty/unknown
   */
  private isBlankValue(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      if (trimmed === '' || trimmed === 'unknown' || trimmed === 'n/a' || trimmed === 'null') {
        return true;
      }
      // Check for "Procurement No Results" - this is intentionally blank
      if (trimmed.includes('procurement no results') || trimmed.includes('research incomplete')) {
        return false; // Don't flag as blank - it's a valid status
      }
    }
    return false;
  }

  /**
   * Look in raw payload for potential data that could fill a blank field
   */
  private findPayloadHintForField(field: string, rawPayload: any): string | null {
    // Map verified field names to common payload field names
    const fieldMappings: Record<string, string[]> = {
      'Brand_Verified': ['brand', 'Brand', 'manufacturer', 'Manufacturer', 'vendor', 'mfr'],
      'Category_Verified': ['category', 'Category', 'productCategory', 'type', 'classification'],
      'Product_Title_Verified': ['title', 'Title', 'name', 'Name', 'productName', 'description', 'productTitle'],
      'Model_Number_Verified': ['model', 'Model', 'modelNumber', 'Model_Number', 'sku', 'SKU', 'partNumber'],
      'MSRP_Verified': ['price', 'Price', 'msrp', 'MSRP', 'listPrice', 'retailPrice'],
      'UPC_GTIN_Verified': ['upc', 'UPC', 'gtin', 'GTIN', 'barcode', 'ean'],
      'Finish_Verified': ['finish', 'Finish', 'surface', 'coating'],
      'Color_Verified': ['color', 'Color', 'colour'],
      'Width_Verified': ['width', 'Width', 'w', 'W'],
      'Height_Verified': ['height', 'Height', 'h', 'H'],
      'Depth_Verified': ['depth', 'Depth', 'd', 'D', 'length', 'Length']
    };
    
    const searchKeys = fieldMappings[field] || [];
    const payloadStr = JSON.stringify(rawPayload);
    
    for (const key of searchKeys) {
      // Look for the key in the payload
      const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, 'i');
      const match = payloadStr.match(regex);
      if (match && match[1] && match[1].trim() !== '') {
        return match[1];
      }
    }
    
    return null;
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
