import express from 'express';
import selfHealingOrchestrator from '../services/self-healing/orchestrator.service';
import { SelfHealingLog } from '../models/self-healing-log.model';
import logger from '../utils/logger';

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

    logger.info(`Manual self-healing trigger requested for job ${jobId}`);

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
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/self-healing/status/:jobId
 * Check self-healing status for a job
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const log = await SelfHealingLog.findOne({ jobId }).sort({ createdAt: -1 });

    if (!log) {
      return res.json({
        jobId,
        status: 'not_found',
        message: 'No self-healing activity found for this job'
      });
    }

    return res.json({
      jobId,
      status: log.finalOutcome,
      issueType: log.issueType,
      consensusAchieved: log.consensusAchieved,
      attemptsTaken: log.attemptsTaken,
      sfCorrectionSent: log.sfCorrectionSent,
      detectedAt: log.detectedAt,
      completedAt: log.completedAt
    });

  } catch (error) {
    logger.error('Error fetching self-healing status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/self-healing/history
 * Get recent self-healing activity
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const outcome = req.query.outcome as string;

    const query: any = {};
    if (outcome) {
      query.finalOutcome = outcome;
    }

    const logs = await SelfHealingLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({
      total: logs.length,
      logs: logs.map(log => ({
        jobId: log.jobId,
        issueType: log.issueType,
        outcome: log.finalOutcome,
        consensusAchieved: log.consensusAchieved,
        attemptsTaken: log.attemptsTaken,
        sfCorrectionSent: log.sfCorrectionSent,
        detectedAt: log.detectedAt,
        completedAt: log.completedAt
      }))
    });

  } catch (error) {
    logger.error('Error fetching self-healing history:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/self-healing/metrics
 * Get self-healing performance metrics
 */
router.get('/metrics', async (_req, res) => {
  try {
    const totalIssues = await SelfHealingLog.countDocuments();
    const successCount = await SelfHealingLog.countDocuments({ finalOutcome: 'success' });
    const escalatedCount = await SelfHealingLog.countDocuments({ finalOutcome: 'escalated' });
    const consensusCount = await SelfHealingLog.countDocuments({ consensusAchieved: true });

    // Calculate average attempts for successful fixes
    const successfulLogs = await SelfHealingLog.find({ finalOutcome: 'success' });
    const avgAttempts = successfulLogs.length > 0
      ? successfulLogs.reduce((sum, log) => sum + log.attemptsTaken, 0) / successfulLogs.length
      : 0;

    return res.json({
      totalIssuesDetected: totalIssues,
      successCount,
      escalatedCount,
      consensusRate: totalIssues > 0 ? (consensusCount / totalIssues).toFixed(2) : 0,
      successRate: totalIssues > 0 ? (successCount / totalIssues).toFixed(2) : 0,
      escalationRate: totalIssues > 0 ? (escalatedCount / totalIssues).toFixed(2) : 0,
      averageAttempts: avgAttempts.toFixed(1)
    });

  } catch (error) {
    logger.error('Error fetching self-healing metrics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
