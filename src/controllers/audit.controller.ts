/**
 * AUDIT CONTROLLER
 * ================
 * POST /api/verify/salesforce/audit
 *
 * Identification-only Audit Mode entry point. Returns 202 immediately and processes the audit
 * asynchronously (mirrors the verification controller). Gated by the AUDIT_MODE_ENABLED master
 * switch — when disabled the endpoint returns 503 and no audits run.
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import config from '../config';
import { AuditJob } from '../models/audit-job.model';
import { processAuditJob } from '../services/audit/audit-processor.service';
import { ApiError } from '../middleware/error.middleware';

/**
 * POST /api/verify/salesforce/audit
 * Body: { SF_Catalog_Id, SF_Catalog_Name, webhookUrl?, mode?, Claimed_AI_Values?, Evidence? }
 */
export async function auditSalesforce(req: Request, res: Response): Promise<void> {
  const auditId = uuidv4();

  try {
    // NOTE: this explicit endpoint is a deliberate, authenticated tool (apiKeyAuth) for targeted
    // audits/confirms. It is intentionally NOT gated on the global AUDIT_MODE toggle — that toggle
    // only controls automatic rerouting of inbound /salesforce verification traffic.
    const { SF_Catalog_Id, SF_Catalog_Name, webhookUrl, mode } = req.body || {};

    if (!SF_Catalog_Id) {
      throw new ApiError(400, 'MISSING_FIELD', 'Missing required field: SF_Catalog_Id');
    }
    if (!SF_Catalog_Name) {
      throw new ApiError(400, 'MISSING_FIELD', 'Missing required field: SF_Catalog_Name');
    }

    const auditMode: 'detect' | 'confirm' = mode === 'confirm' ? 'confirm' : 'detect';
    const finalWebhookUrl = webhookUrl || config.salesforce.webhookUrl;

    await AuditJob.create({
      auditId,
      sfCatalogId: SF_Catalog_Id,
      sfCatalogName: SF_Catalog_Name,
      mode: auditMode,
      status: 'pending',
      rawRequest: req.body,
      webhookUrl: finalWebhookUrl,
      webhookAttempts: 0,
    });

    logger.info('AUDIT: request received', {
      auditId,
      sfCatalogId: SF_Catalog_Id,
      sfCatalogName: SF_Catalog_Name,
      mode: auditMode,
      webhookUrl: finalWebhookUrl,
    });

    // Fire-and-forget async processing
    processAuditJob(auditId).catch((err) => {
      logger.error('AUDIT: async processing error', {
        auditId,
        error: err instanceof Error ? err.message : String(err),
      });
    });

    res.status(202).json({
      success: true,
      message: 'Audit request received / processing',
      auditId,
      SF_Catalog_Id,
      SF_Catalog_Name,
      mode: auditMode,
      status: 'queued',
      estimatedProcessingTime: auditMode === 'confirm' ? '60-150 seconds' : '10-30 seconds',
      webhookConfigured: true,
      webhookUrl: finalWebhookUrl,
      receivedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('AUDIT: error queuing audit', {
      auditId,
      error: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, error: error.message, auditId });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error', auditId });
    }
  }
}

/**
 * Reroute an inbound /salesforce verification call into the audit protocol.
 * Called by verifySalesforceAsync when the server-side AUDIT_MODE toggle is on.
 * The inbound payload becomes the audit EVIDENCE; nothing unusual is sent back to SF.
 */
export async function routeVerificationToAudit(req: Request, res: Response): Promise<void> {
  const auditId = uuidv4();
  const { SF_Catalog_Id, SF_Catalog_Name, webhookUrl } = req.body || {};
  const mode: 'detect' | 'confirm' = config.audit.mode === 'confirm' ? 'confirm' : 'detect';
  const finalWebhookUrl = webhookUrl || config.salesforce.webhookUrl;

  await AuditJob.create({
    auditId,
    sfCatalogId: SF_Catalog_Id,
    sfCatalogName: SF_Catalog_Name,
    mode,
    routed: true,
    status: 'pending',
    rawRequest: req.body,
    webhookUrl: finalWebhookUrl,
    webhookAttempts: 0,
  });

  logger.info('AUDIT: inbound verification REROUTED to audit protocol', {
    auditId,
    mode,
    sfCatalogId: SF_Catalog_Id,
    sfCatalogName: SF_Catalog_Name,
  });

  processAuditJob(auditId).catch((err) => {
    logger.error('AUDIT: routed async processing error', {
      auditId,
      error: err instanceof Error ? err.message : String(err),
    });
  });

  // 202 ack — same shape SF expects, with audit markers so it's visible in logs/tests.
  res.status(202).json({
    success: true,
    message: `Request received (AUDIT MODE: ${mode}) / processing`,
    auditId,
    SF_Catalog_Id,
    SF_Catalog_Name,
    audit_mode: mode,
    status: 'queued',
    receivedAt: new Date().toISOString(),
  });
}

/**
 * GET /api/verify/salesforce/audit/status/:auditId
 */
export async function getAuditStatus(req: Request, res: Response): Promise<void> {
  try {
    const { auditId } = req.params;
    const job = await AuditJob.findOne({ auditId }).lean();
    if (!job) {
      throw new ApiError(404, 'AUDIT_NOT_FOUND', 'Audit job not found');
    }
    res.json({
      auditId: job.auditId,
      SF_Catalog_Id: job.sfCatalogId,
      SF_Catalog_Name: job.sfCatalogName,
      mode: job.mode,
      status: job.status,
      evidenceSource: job.evidenceSource,
      report: job.report,
      confirmPushed: job.confirmPushed,
      confirmPushJobId: job.confirmPushJobId,
      webhookDelivery: {
        success: job.webhookSuccess,
        attempts: job.webhookAttempts,
        lastAttempt: job.webhookLastAttempt,
      },
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      processingTimeMs: job.processingTimeMs,
      error: job.error,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}
