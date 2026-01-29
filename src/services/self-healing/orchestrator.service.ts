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
      let apiTracker = await APITracker.findOne({ sessionId: jobId });
      
      // Fallback: Try raw query if model query fails
      if (!apiTracker) {
        const db = (APITracker as any).db || (APITracker as any).collection?.conn?.db;
        if (db) {
          const rawTracker = await db.collection('api_trackers').findOne({ sessionId: jobId });
          if (rawTracker) {
            apiTracker = rawTracker as any;
            logger.info('[Phase 0] Used raw query to find tracker');
          }
        }
      }

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
   */
  private async detectIssue(job: any, tracker: any): Promise<any | null> {
    if (!tracker) {
      logger.info('[detectIssue] No tracker provided');
      return null;
    }

    logger.info(`[detectIssue] Tracker found, has issues: ${!!tracker.issues}, count: ${tracker.issues?.length || 0}`);
    
    if (tracker.issues && tracker.issues.length > 0) {
      logger.info(`[detectIssue] First issue type: ${tracker.issues[0].type}`);
    }

    const missingFields = tracker.issues
      ?.filter((issue: any) => issue.type === 'missing_top15_field')
      ?.map((issue: any) => issue.field) || [];

    logger.info(`[detectIssue] Filtered missing fields: ${missingFields.length}`);

    if (missingFields.length === 0) {
      return null;
    }

    return {
      jobId: job.jobId,
      sfCatalogId: tracker.request?.SF_Catalog_Id || tracker.sfCatalogId,
      issueType: 'missing_data',
      severity: missingFields.length > 5 ? 'high' : 'medium',
      missingFields,
      wrongFields: [],
      affectedCount: 1,
      rawPayload: job.rawPayload,
      currentResponse: tracker.response,
      errorLogs: job.error ? [job.error] : []
    };
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
