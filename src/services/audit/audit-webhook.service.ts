/**
 * AUDIT WEBHOOK SENDER
 * ====================
 * Delivers the audit report back to Salesforce with `audit_mode: true`. The SF audit branch
 * (CatalogVerificationRest.cls) detects that flag, stores the report into AI_Audit_Report__c,
 * and writes NOTHING else. There is no `corrections` key — by design.
 */

import axios from 'axios';
import logger from '../../utils/logger';
import { sanitizeNulls } from '../../utils/sanitization.utils';
import { IAuditJob } from '../../models/audit-job.model';
import { AuditWebhookPayload } from '../../types/audit.types';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send the audit report (or a not_found/error status) back to Salesforce.
 */
export async function sendAuditReport(job: IAuditJob): Promise<boolean> {
  if (!job.webhookUrl) {
    logger.warn('AUDIT webhook: no webhook URL configured', { auditId: job.auditId });
    return false;
  }

  const status: AuditWebhookPayload['status'] =
    job.status === 'completed' ? 'audit_complete' : job.status === 'not_found' ? 'audit_not_found' : 'audit_error';

  const payload: AuditWebhookPayload = sanitizeNulls({
    audit_mode: true,
    SF_Catalog_Id: job.sfCatalogId,
    SF_Catalog_Name: job.sfCatalogName,
    status,
    ...(job.report ? { audit_report: job.report } : {}),
    ...(job.error ? { message: job.error } : {}),
  }) as AuditWebhookPayload;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      job.webhookAttempts = attempt + 1;
      await job.save();

      const res = await axios.post(job.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '873648276-550e8400',
          'x-webhook-source': 'catalog-verification-api',
          'x-job-id': job.auditId,
          'x-audit-mode': 'true',
        },
        timeout: 30000,
      });

      if (res.status >= 200 && res.status < 300) {
        job.webhookSuccess = true;
        job.webhookLastAttempt = new Date();
        await job.save();
        logger.info('AUDIT webhook: delivered to Salesforce', {
          auditId: job.auditId,
          sfCatalogId: job.sfCatalogId,
          status,
          attempt: attempt + 1,
          salesforceResponse: res.data,
        });
        return true;
      }

      logger.warn('AUDIT webhook: non-success status', {
        auditId: job.auditId,
        attempt: attempt + 1,
        statusCode: res.status,
      });
    } catch (error) {
      logger.error('AUDIT webhook: delivery attempt failed', {
        auditId: job.auditId,
        attempt: attempt + 1,
        error: error instanceof Error ? error.message : String(error),
      });
      if (attempt < MAX_RETRIES - 1) await delay(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  job.webhookSuccess = false;
  job.webhookLastAttempt = new Date();
  await job.save();
  logger.error('AUDIT webhook: all delivery attempts failed', { auditId: job.auditId });
  return false;
}
