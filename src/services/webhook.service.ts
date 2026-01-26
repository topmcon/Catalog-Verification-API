/**
 * WEBHOOK SERVICE
 * Sends verification results back to Salesforce after async processing
 */

import axios from 'axios';
import logger from '../utils/logger';
import { VerificationJob } from '../models/verification-job.model';

interface WebhookPayload {
  jobId: string;
  SF_Catalog_Id: string;
  SF_Catalog_Name: string;
  status: 'success' | 'error';
  data?: any;
  error?: string;
  processingTimeMs?: number;
}

class WebhookService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 5000;

  /**
   * Send verification results back to Salesforce via webhook
   */
  async sendResults(jobId: string): Promise<boolean> {
    try {
      const job = await VerificationJob.findOne({ jobId });
      
      if (!job) {
        logger.error('Webhook: Job not found', { jobId });
        return false;
      }

      if (!job.webhookUrl) {
        logger.warn('Webhook: No webhook URL configured for job', { jobId });
        return false;
      }

      const payload: WebhookPayload = {
        jobId: job.jobId,
        SF_Catalog_Id: job.sfCatalogId,
        SF_Catalog_Name: job.sfCatalogName,
        status: job.status === 'completed' ? 'success' : 'error',
        data: job.result,
        error: job.error,
        processingTimeMs: job.processingTimeMs
      };

      logger.info('Webhook: Sending results to Salesforce', {
        jobId,
        sfCatalogId: job.sfCatalogId,
        webhookUrl: job.webhookUrl,
        attempt: job.webhookAttempts + 1
      });

      const success = await this.sendWithRetry(job.webhookUrl, payload, job);

      // Update job with webhook status
      job.webhookSuccess = success;
      job.webhookLastAttempt = new Date();
      await job.save();

      return success;
    } catch (error) {
      logger.error('Webhook: Error sending results', {
        jobId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Send webhook with retry logic
   */
  private async sendWithRetry(
    url: string,
    payload: WebhookPayload,
    job: IVerificationJob
  ): Promise<boolean> {
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        job.webhookAttempts = attempt + 1;
        await job.save();

        const response = await axios.post(url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-source': 'catalog-verification-api',
            'x-job-id': payload.jobId
          },
          timeout: 30000 // 30 second timeout
        });

        if (response.status >= 200 && response.status < 300) {
          logger.info('Webhook: Successfully delivered', {
            jobId: payload.jobId,
            attempt: attempt + 1,
            statusCode: response.status,
            salesforceResponse: response.data, // Log Salesforce's response
            responseTime: response.headers['x-response-time'] || 'N/A'
          });
          return true;
        }

        logger.warn('Webhook: Non-success status code', {
          jobId: payload.jobId,
          attempt: attempt + 1,
          statusCode: response.status,
          salesforceResponse: response.data // Log why it failed
        });
      } catch (error) {
        logger.error('Webhook: Delivery attempt failed', {
          jobId: payload.jobId,
          attempt: attempt + 1,
          error: error instanceof Error ? error.message : String(error)
        });

        if (attempt < this.MAX_RETRIES - 1) {
          await this.delay(this.RETRY_DELAY_MS * (attempt + 1)); // Exponential backoff
        }
      }
    }

    logger.error('Webhook: All delivery attempts failed', {
      jobId: payload.jobId,
      maxRetries: this.MAX_RETRIES
    });
    return false;
  }

  /**
   * Delay helper for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verify model number matches SF_Catalog_Name before sending
   */
  verifyModelMatch(sfCatalogName: string, modelNumber: string): boolean {
    if (!sfCatalogName || !modelNumber) {
      return false;
    }

    // Normalize both for comparison (remove spaces, dashes, convert to uppercase)
    const normalizeModel = (model: string): string => {
      return model.replace(/[\s-]/g, '').toUpperCase();
    };

    const normalizedSF = normalizeModel(sfCatalogName);
    const normalizedModel = normalizeModel(modelNumber);

    const isMatch = normalizedSF === normalizedModel;

    if (!isMatch) {
      logger.warn('Model number mismatch detected', {
        sfCatalogName,
        extractedModel: modelNumber,
        normalizedSF,
        normalizedModel
      });
    }

    return isMatch;
  }
}

// Add missing import
import { IVerificationJob } from '../models/verification-job.model';

export default new WebhookService();
