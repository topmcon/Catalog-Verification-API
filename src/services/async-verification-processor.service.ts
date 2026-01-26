/**
 * ASYNC VERIFICATION PROCESSOR
 * Processes verification jobs from the queue
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { VerificationJob } from '../models/verification-job.model';
import { verifyProductWithDualAI } from './dual-ai-verification.service';
import webhookService from './webhook.service';
import { SalesforceIncomingProduct } from '../types/salesforce.types';

class AsyncVerificationProcessor {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  /**
   * Start the background job processor
   */
  start(intervalMs: number = 5000): void {
    if (this.processingInterval) {
      logger.warn('Async processor already running');
      return;
    }

    logger.info('Starting async verification processor', { intervalMs });

    this.processingInterval = setInterval(async () => {
      await this.processNextJob();
    }, intervalMs);

    // Process immediately on start
    this.processNextJob();
  }

  /**
   * Stop the background processor
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      logger.info('Stopped async verification processor');
    }
  }

  /**
   * Process the next pending job (can be called manually to trigger immediate processing)
   */
  public async processNextJob(): Promise<void> {
    if (this.isProcessing) {
      return; // Already processing a job
    }

    try {
      this.isProcessing = true;

      // Find oldest pending job
      const job = await VerificationJob.findOne({ status: 'pending' })
        .sort({ createdAt: 1 })
        .exec();

      if (!job) {
        // No pending jobs
        return;
      }

      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', { service: 'catalog-verification' });
      logger.info('STEP 3: Background processor picked up job from queue', {
        jobId: job.jobId,
        sfCatalogId: job.sfCatalogId,
        sfCatalogName: job.sfCatalogName,
        waitTime: Date.now() - job.createdAt.getTime() + 'ms'
      });

      // Mark as processing
      job.status = 'processing';
      job.startedAt = new Date();
      await job.save();
      
      logger.info('STEP 4: Job status updated to PROCESSING', {
        jobId: job.jobId,
        status: 'processing'
      });

      // Execute verification
      const startTime = Date.now();
      try {
        const result = await this.executeVerification(job.rawPayload);
        
        // Check model number match
        const modelMatch = webhookService.verifyModelMatch(
          job.sfCatalogName,
          result.data?.Primary_Attributes?.Model_Number_Verified || ''
        );

        if (!modelMatch) {
          logger.warn('Model number verification failed', {
            jobId: job.jobId,
            expected: job.sfCatalogName,
            received: result.data?.Primary_Attributes?.Model_Number_Verified
          });
        }

        // Mark as completed
        job.status = 'completed';
        job.result = result;
        job.completedAt = new Date();
        job.processingTimeMs = Date.now() - startTime;
        await job.save();

        logger.info('STEP 6: AI verification completed successfully', {
          jobId: job.jobId,
          processingTimeMs: job.processingTimeMs + 'ms',
          status: 'completed',
          modelMatch: modelMatch ? 'VERIFIED ✓' : 'MISMATCH ⚠️'
        });

        // Send webhook callback
        await webhookService.sendResults(job.jobId);

      } catch (error) {
        logger.error('Verification job failed', {
          jobId: job.jobId,
          error: error instanceof Error ? error.message : String(error)
        });

        job.status = 'failed';
        job.error = error instanceof Error ? error.message : String(error);
        job.completedAt = new Date();
        job.processingTimeMs = Date.now() - startTime;
        await job.save();

        // Send error webhook
        await webhookService.sendResults(job.jobId);
      }

    } catch (error) {
      logger.error('Error processing verification job', {
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute the actual verification using existing consensus service
   */
  private async executeVerification(rawPayload: any): Promise<any> {
    const sessionId = uuidv4();
    
    // Convert raw payload to expected format
    const product: SalesforceIncomingProduct = rawPayload;

    logger.info('STEP 5: Starting AI verification engines (OpenAI + Anthropic)', {
      sessionId,
      modelNumber: product.Model_Number_Web_Retailer || product.SF_Catalog_Name
    });

    // Use existing dual-AI verification service
    const result = await verifyProductWithDualAI(product, sessionId);

    return result;
  }

  /**
   * Manually trigger processing (for testing)
   */
  async triggerProcessing(): Promise<void> {
    await this.processNextJob();
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const [pending, processing, completed, failed] = await Promise.all([
      VerificationJob.countDocuments({ status: 'pending' }),
      VerificationJob.countDocuments({ status: 'processing' }),
      VerificationJob.countDocuments({ status: 'completed' }),
      VerificationJob.countDocuments({ status: 'failed' })
    ]);

    return { pending, processing, completed, failed };
  }
}

export default new AsyncVerificationProcessor();
