/**
 * AUDIT PROCESSOR
 * ===============
 * Runs an AuditJob asynchronously. Audit Mode is controlled by the server-side AUDIT_MODE toggle
 * (off | detect | confirm). When the toggle is on, inbound /salesforce verification calls are
 * REROUTED here (job.routed === true) instead of running normal verification.
 *
 *  • detect  — IDENTIFICATION ONLY. Audit the product's PREVIOUSLY-VERIFIED fields (our stored
 *              output) against the FRESH evidence SF just sent. Store the report on our side.
 *              No verification, no push, no SF write. (not_found if the product was never verified.)
 *
 *  • confirm — RE-VERIFY + GATE. Re-run verification on the inbound payload WITHOUT pushing
 *              (calling verifyProductWithDualAI directly never fires the SF webhook), then run the
 *              independent audit on the fresh output. ONLY if the audit passes do we push the
 *              corrected output to SF — via the NORMAL verification webhook (which SF already
 *              handles). The audit is the gate; the pipeline cannot certify its own fix.
 *
 * audit_mode webhooks are NEVER sent to SF unless AUDIT_SEND_TO_SF=true, because SF has no audit
 * branch to receive them. Audit results are reviewed on our side (status endpoint + audit-report.js).
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import config from '../../config';
import { AuditJob } from '../../models/audit-job.model';
import { VerificationJob } from '../../models/verification-job.model';
import { verifyProductWithDualAI } from '../dual-ai-verification.service';
import webhookService from '../webhook.service';
import { SalesforceIncomingProduct } from '../../types/salesforce.types';
import { AuditInput, AuditRequest } from '../../types/audit.types';
import { lookupForAudit, runAudit, claimedFromResult, assembleEvidence } from './audit-review.service';
import { sendAuditReport } from './audit-webhook.service';

/** Only deliver an audit_mode webhook to SF if explicitly enabled (SF has no audit branch yet). */
async function maybeSendToSf(job: any): Promise<void> {
  if (config.audit.sendToSf) {
    await sendAuditReport(job);
  } else {
    logger.info('AUDIT: report stored on our side (AUDIT_SEND_TO_SF=false — not delivered to SF)', {
      auditId: job.auditId,
      sfCatalogId: job.sfCatalogId,
      status: job.status,
      overall_status: job.report?.overall_status,
    });
  }
}

/** Look up our latest stored verification output for a catalog. */
async function latestCompletedJob(sfCatalogId: string) {
  return VerificationJob.findOne({ sfCatalogId, status: 'completed', result: { $exists: true } })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTED paths (inbound /salesforce call rerouted by the AUDIT_MODE toggle)
// ─────────────────────────────────────────────────────────────────────────────

/** detect: audit our previously-verified output against the fresh inbound evidence. No SF write. */
async function processRoutedDetect(job: any): Promise<void> {
  const inbound = (job.rawRequest || {}) as Partial<SalesforceIncomingProduct>;

  const vjob = await latestCompletedJob(job.sfCatalogId);
  if (!vjob || !vjob.result) {
    job.status = 'not_found';
    job.evidenceSource = 'not_found';
    job.error = 'No previously-verified output on file for this catalog — nothing to audit (send through AUDIT_MODE=confirm to verify+audit a new product).';
    await job.save();
    await maybeSendToSf(job);
    return;
  }

  const input: AuditInput = {
    sfCatalogId: job.sfCatalogId,
    sfCatalogName: job.sfCatalogName,
    claimed: claimedFromResult(vjob.result),   // what we previously produced (= what's in SF)
    evidence: inbound,                          // fresh evidence SF just sent
    source: 'payload_carried',
  };

  const report = await runAudit(input);
  job.report = report;
  job.evidenceSource = 'payload_carried';
  job.status = 'completed';
  await job.save();
  await maybeSendToSf(job);
}

/** confirm: verify fresh (no push) → audit-gate → push corrected output ONLY if audit passes. */
async function processRoutedConfirm(job: any): Promise<void> {
  const inbound = (job.rawRequest || {}) as Partial<SalesforceIncomingProduct>;

  const sessionId = uuidv4();
  logger.info('AUDIT confirm (routed): re-running verification (no-push) on inbound payload', {
    auditId: job.auditId,
    sfCatalogId: job.sfCatalogId,
  });
  const freshResult = await verifyProductWithDualAI(inbound as SalesforceIncomingProduct, sessionId);

  const input: AuditInput = {
    sfCatalogId: job.sfCatalogId,
    sfCatalogName: job.sfCatalogName,
    claimed: claimedFromResult(freshResult),
    evidence: inbound,
    source: 'payload_carried',
  };
  const report = await runAudit(input);
  job.report = report;
  job.evidenceSource = 'payload_carried';

  // GATE: only a clean re-audit confirms the fix → push the corrected output.
  const confirmed = report.mismatches_found === 0 && report.overall_status === 'MATCH';

  if (confirmed) {
    const pushJobId = uuidv4();
    await VerificationJob.create({
      jobId: pushJobId,
      sfCatalogId: job.sfCatalogId,
      sfCatalogName: job.sfCatalogName,
      status: 'completed',
      rawPayload: inbound,
      result: freshResult,
      webhookUrl: job.webhookUrl,
      webhookAttempts: 0,
      completedAt: new Date(),
    });
    await webhookService.sendResults(pushJobId); // NORMAL verification webhook — SF applies via AI_Update_* gates
    job.confirmPushed = true;
    job.confirmPushJobId = pushJobId;
    logger.info('AUDIT confirm: re-audit PASSED — corrected output pushed to SF (Phase 4)', {
      auditId: job.auditId,
      sfCatalogId: job.sfCatalogId,
      pushJobId,
    });
  } else {
    job.confirmPushed = false;
    logger.warn('AUDIT confirm: re-audit did NOT pass — fix unconfirmed, nothing pushed to SF', {
      auditId: job.auditId,
      sfCatalogId: job.sfCatalogId,
      overall_status: report.overall_status,
      mismatches: report.mismatches_found,
    });
  }

  job.status = 'completed';
  await job.save();
  // The confirm verdict itself is reviewed on our side; only the corrected push (above) reaches SF.
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINT paths (explicit POST /audit by a script/tool — not via the global toggle)
// ─────────────────────────────────────────────────────────────────────────────

async function processDetect(job: any): Promise<void> {
  const req: AuditRequest = job.rawRequest || {
    SF_Catalog_Id: job.sfCatalogId,
    SF_Catalog_Name: job.sfCatalogName,
  };

  const resolved = await lookupForAudit(req);
  if ('source' in resolved && resolved.source === 'not_found') {
    job.status = 'not_found';
    job.evidenceSource = 'not_found';
    job.error = 'No prior verification found internally and no claimed values/evidence supplied — nothing to audit.';
    await job.save();
    await maybeSendToSf(job);
    return;
  }

  const input = resolved as AuditInput;
  const report = await runAudit(input);
  job.report = report;
  job.evidenceSource = input.source;
  job.status = 'completed';
  await job.save();
  await maybeSendToSf(job);
}

async function processConfirm(job: any): Promise<void> {
  const vjob = await VerificationJob.findOne({
    sfCatalogId: job.sfCatalogId,
    status: 'completed',
    result: { $exists: true },
  })
    .sort({ createdAt: -1 })
    .exec();

  if (!vjob || !vjob.rawPayload) {
    job.status = 'not_found';
    job.error = 'Confirm requires a prior stored verification payload to re-run; none found.';
    await job.save();
    await maybeSendToSf(job);
    return;
  }

  const payload = vjob.rawPayload as Partial<SalesforceIncomingProduct>;
  const sessionId = uuidv4();
  const freshResult = await verifyProductWithDualAI(payload as SalesforceIncomingProduct, sessionId);

  const input: AuditInput = {
    sfCatalogId: job.sfCatalogId,
    sfCatalogName: job.sfCatalogName,
    claimed: claimedFromResult(freshResult),
    evidence: payload,
    source: 'stored_job',
  };
  const report = await runAudit(input);
  job.report = report;
  job.evidenceSource = 'stored_job';

  const confirmed = report.mismatches_found === 0 && report.overall_status === 'MATCH';
  if (confirmed) {
    const pushJobId = uuidv4();
    await VerificationJob.create({
      jobId: pushJobId,
      sfCatalogId: job.sfCatalogId,
      sfCatalogName: job.sfCatalogName,
      status: 'completed',
      rawPayload: payload,
      result: freshResult,
      webhookUrl: job.webhookUrl,
      webhookAttempts: 0,
      completedAt: new Date(),
    });
    await webhookService.sendResults(pushJobId);
    job.confirmPushed = true;
    job.confirmPushJobId = pushJobId;
  } else {
    job.confirmPushed = false;
  }

  job.status = 'completed';
  await job.save();
  await maybeSendToSf(job);
}

/**
 * Process a single audit job by id. Fire-and-forget from the controller.
 */
export async function processAuditJob(auditId: string): Promise<void> {
  const job = await AuditJob.findOne({ auditId });
  if (!job) {
    logger.error('AUDIT processor: job not found', { auditId });
    return;
  }

  const startTime = Date.now();
  try {
    job.status = 'processing';
    await job.save();

    if (job.routed) {
      if (job.mode === 'confirm') await processRoutedConfirm(job);
      else await processRoutedDetect(job);
    } else if (job.mode === 'confirm') {
      await processConfirm(job);
    } else {
      await processDetect(job);
    }
  } catch (error) {
    logger.error('AUDIT processor: job failed', {
      auditId,
      error: error instanceof Error ? error.message : String(error),
    });
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : String(error);
    await job.save();
    try {
      await maybeSendToSf(job);
    } catch {
      /* webhook logs its own failures */
    }
  } finally {
    job.processingTimeMs = Date.now() - startTime;
    job.completedAt = new Date();
    await job.save();
  }
}

// re-exported for tests/diagnostics
export { assembleEvidence };
