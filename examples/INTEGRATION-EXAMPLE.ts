/**
 * INTEGRATION EXAMPLE
 * 
 * How to integrate the enhanced self-healing system into your webhook flow
 */

import selfHealingOrchestrator from './services/self-healing/orchestrator.service';
import logger from './utils/logger';

// ============================================================================
// OPTION 1: Integrate into Webhook Service (Recommended)
// ============================================================================

// File: src/services/webhook.service.ts

export async function sendWebhookToSalesforce(job: any, responseData: any) {
  try {
    // 1. Send webhook to Salesforce
    const sfResponse = await axios.post(
      process.env.SF_WEBHOOK_URL!,
      {
        jobId: job.jobId,
        sfCatalogId: job.sfCatalogId,
        verificationData: responseData,
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.SF_API_KEY
        }
      }
    );

    logger.info(`Webhook sent to SF for job ${job.jobId}. Status: ${sfResponse.status}`);

    // 2. Schedule self-healing (60 seconds later)
    if (process.env.SELF_HEALING_ENABLED === 'true') {
      logger.info(`Scheduling self-healing scan for job ${job.jobId} in 60 seconds...`);
      
      await selfHealingOrchestrator.scheduleAfterWebhook(job.jobId);
      
      logger.info(`Self-healing scheduled for job ${job.jobId}`);
    }

    return { success: true, sfResponse };

  } catch (error) {
    logger.error('Error sending webhook to SF:', error);
    throw error;
  }
}

// ============================================================================
// OPTION 2: Integrate into Async Processor (Alternative)
// ============================================================================

// File: src/services/async-verification-processor.service.ts

async function processVerificationJob(job: any) {
  try {
    // ... existing verification logic ...
    
    const verificationResponse = await dualAIVerificationService.verifyProductWithDualAI(
      job.rawPayload
    );

    // Update job as completed
    job.status = 'completed';
    job.response = verificationResponse;
    await job.save();

    // Send webhook to SF
    await webhookService.sendWebhookToSalesforce(job, verificationResponse);

    // ✨ NEW: Schedule self-healing after webhook
    if (process.env.SELF_HEALING_ENABLED === 'true') {
      await selfHealingOrchestrator.scheduleAfterWebhook(job.jobId);
    }

  } catch (error) {
    // ... error handling ...
  }
}

// ============================================================================
// OPTION 3: Manual Trigger via API Endpoint
// ============================================================================

// File: src/routes/self-healing.routes.ts

import express from 'express';
import selfHealingOrchestrator from '../services/self-healing/orchestrator.service';

const router = express.Router();

/**
 * POST /api/self-healing/trigger
 * Manually trigger self-healing for a specific job
 */
router.post('/trigger', async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }

    logger.info(`Manual self-healing trigger for job ${jobId}`);

    // Run immediately (no 60-second delay for manual trigger)
    const result = await selfHealingOrchestrator.runCompleteSelfHealing(jobId);

    return res.json({
      success: result.success,
      jobId: result.jobId,
      phase: result.phase,
      reason: result.reason,
      consensusAchieved: result.consensusAchieved,
      attemptsTaken: result.attemptsTaken,
      finalAttempt: result.finalAttempt,
      sfCorrectionSent: result.sfCorrectionSent,
      escalatedToHuman: result.escalatedToHuman,
      completedAt: result.completedAt
    });

  } catch (error) {
    logger.error('Error in manual self-healing trigger:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/self-healing/status/:jobId
 * Check self-healing status for a job
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    // Query self_healing_logs collection (you need to create this model)
    // const log = await SelfHealingLog.findOne({ jobId }).sort({ createdAt: -1 });

    // For now, return placeholder
    return res.json({
      jobId,
      status: 'pending', // 'pending' | 'in_progress' | 'completed' | 'failed' | 'escalated'
      message: 'Self-healing log model not yet created'
    });

  } catch (error) {
    logger.error('Error fetching self-healing status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

// ============================================================================
// STEP-BY-STEP INTEGRATION
// ============================================================================

/**
 * 1. Add to src/app.ts:
 */
import selfHealingRoutes from './routes/self-healing.routes';
app.use('/api/self-healing', selfHealingRoutes);

/**
 * 2. Add to .env:
 */
/*
SELF_HEALING_ENABLED=true
SELF_HEALING_DELAY_AFTER_WEBHOOK=60000
SELF_HEALING_MAX_ATTEMPTS=3
DUAL_AI_CONSENSUS_REQUIRED=true
DUAL_AI_MIN_CONFIDENCE=70
SYSTEM_WIDE_FIX_ENABLED=true
REGRESSION_TEST_REQUIRED=true
OPENAI_API_KEY=sk-...
XAI_API_KEY=xai-...
*/

/**
 * 3. Start server:
 */
// npm run dev

/**
 * 4. Test manual trigger:
 */
/*
curl -X POST http://localhost:3001/api/self-healing/trigger \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"jobId": "abc123"}'
*/

/**
 * 5. Monitor logs:
 */
// tail -f logs/combined.log | grep "Self-Healing"

/**
 * Expected output:
 * 
 * [Self-Healing] Scheduled for job abc123 in 60 seconds
 * [Self-Healing] 🔧 STARTING SELF-HEALING FOR JOB: abc123
 * [Phase 1] Detecting issues...
 * [Phase 1] ✅ Detected issue: missing_data (medium severity)
 * [Phase 2] Starting dual-AI diagnosis...
 * [Phase 2] Dual analysis complete - OpenAI: 92% confidence, xAI: 89% confidence
 * [Phase 2] ✅ Consensus achieved!
 * [Phase 3-4] Starting multi-attempt verification (max 3 attempts)...
 * [Phase 3-4] Attempt 1/3: Applying fix...
 * [Phase 3-4] OpenAI approval: true (95%), xAI approval: true (93%)
 * [Phase 3-4] ✅ Fix validated after 1 attempt(s)!
 * [Phase 5] Sending comprehensive correction to Salesforce...
 * [Phase 5] Dual-AI final approval obtained
 * [Phase 5] ✅ Comprehensive correction sent to Salesforce successfully!
 * [Self-Healing] ✅ SELF-HEALING COMPLETE FOR JOB: abc123
 */
