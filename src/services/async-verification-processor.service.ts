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
import { compareResponses, ComparisonResult } from './response-comparison.service';

class AsyncVerificationProcessor {
  private activeJobs: Set<string> = new Set(); // Track active job IDs
  private maxConcurrentJobs: number = 5; // Process up to 5 jobs concurrently
  private processingInterval: NodeJS.Timeout | null = null;

  /**
   * Start the background job processor
   */
  start(intervalMs: number = 5000, maxConcurrent: number = 5): void {
    if (this.processingInterval) {
      logger.warn('Async processor already running');
      return;
    }

    this.maxConcurrentJobs = maxConcurrent;

    logger.info('Starting async verification processor', { 
      intervalMs, 
      maxConcurrentJobs: this.maxConcurrentJobs 
    });

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
    // Check if we've hit the concurrency limit
    if (this.activeJobs.size >= this.maxConcurrentJobs) {
      return; // Already at max concurrent jobs
    }

    try {
      // Calculate how many more jobs we can start
      const availableSlots = this.maxConcurrentJobs - this.activeJobs.size;
      
      // Find pending jobs (up to available slots)
      const jobs = await VerificationJob.find({ status: 'pending' })
        .sort({ createdAt: 1 })
        .limit(availableSlots)
        .exec();

      if (jobs.length === 0) {
        // No pending jobs
        return;
      }

      // Start processing each job concurrently
      jobs.forEach(job => {
        this.processJob(job).catch(error => {
          logger.error('Error in concurrent job processing', {
            jobId: job.jobId,
            error: error instanceof Error ? error.message : String(error)
          });
        });
      });

    } catch (error) {
      logger.error('Error fetching jobs from queue', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: any): Promise<void> {
    const jobId = job.jobId;
    
    try {
      // Add to active jobs
      this.activeJobs.add(jobId);

      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', { service: 'catalog-verification' });
      logger.info('STEP 3: Background processor picked up job from queue', {
        jobId: job.jobId,
        sfCatalogId: job.sfCatalogId,
        sfCatalogName: job.sfCatalogName,
        waitTime: Date.now() - job.createdAt.getTime() + 'ms',
        activeJobs: this.activeJobs.size,
        maxConcurrent: this.maxConcurrentJobs
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
          result.data?.Primary_Attributes?.AI_Model_Number || ''
        );

        if (!modelMatch) {
          logger.warn('Model number verification failed', {
            jobId: job.jobId,
            expected: job.sfCatalogName,
            received: result.data?.Primary_Attributes?.AI_Model_Number
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

        // STEP 6.5: Compare against prior response (if available)
        let comparisonResult: ComparisonResult | null = null;
        if (job.rawPayload?.Prior_Response_Data) {
          logger.info('STEP 6.5: Running post-verification comparison against prior response', {
            jobId: job.jobId,
            priorJobId: job.rawPayload.Prior_Response_Data.jobId,
            priorTimestamp: job.rawPayload.Prior_Response_Data.timestamp
          });

          comparisonResult = compareResponses(
            result,
            job.rawPayload.Prior_Response_Data,
            job.jobId
          );

          if (comparisonResult) {
            // Store comparison results in job for analysis
            job.comparisonAnalysis = comparisonResult;

            logger.info('Response comparison completed', {
              jobId: job.jobId,
              changedFields: comparisonResult.changedFields,
              improvements: comparisonResult.improvements,
              regressions: comparisonResult.regressions,
              criticalChanges: comparisonResult.criticalChanges,
              summary: comparisonResult.summary
            });

            // Log critical changes or regressions
            if (comparisonResult.criticalChanges > 0 || comparisonResult.regressions > 0) {
              logger.warn('⚠️ LOGIC FAILURE DETECTED - Review verification logic', {
                jobId: job.jobId,
                criticalChanges: comparisonResult.criticalChanges,
                regressions: comparisonResult.regressions,
                recommendations: comparisonResult.recommendations
              });
            }
          }

          await job.save();
        }

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
        jobId: jobId,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      // Remove from active jobs
      this.activeJobs.delete(jobId);
      logger.debug('Job removed from active set', {
        jobId,
        activeJobs: this.activeJobs.size
      });
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
