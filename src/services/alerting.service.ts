/**
 * Alerting Service
 * Monitors verification results and triggers alerts for critical issues
 */

import logger from '../utils/logger';

export interface AlertConfig {
  // Thresholds
  lowConfidenceThreshold: number;      // Default: 0.5
  slowResponseThreshold: number;        // Default: 60000ms (1 minute)
  consensusFailureThreshold: number;    // Default: 0.6
  errorRateThreshold: number;           // Default: 0.2 (20%)
  
  // Alert channels (can be extended to support webhooks, email, etc.)
  logAlerts: boolean;
  webhookUrl?: string;
}

export interface Alert {
  type: 'low_confidence' | 'slow_response' | 'consensus_failure' | 'ai_error' | 'high_error_rate' | 'category_mismatch';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  context: Record<string, any>;
  timestamp: Date;
}

// In-memory alert history (last 1000 alerts)
const alertHistory: Alert[] = [];
const MAX_ALERT_HISTORY = 1000;

// Rolling window for error rate calculation
const recentResults: { success: boolean; timestamp: Date }[] = [];
const ERROR_RATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Default configuration
let config: AlertConfig = {
  lowConfidenceThreshold: 0.5,
  slowResponseThreshold: 60000,
  consensusFailureThreshold: 0.6,
  errorRateThreshold: 0.2,
  logAlerts: true,
};

/**
 * Update alerting configuration
 */
export function configureAlerting(newConfig: Partial<AlertConfig>): void {
  config = { ...config, ...newConfig };
  logger.info('Alerting configuration updated', config);
}

/**
 * Record a verification result for error rate tracking
 */
export function recordResult(success: boolean): void {
  const now = new Date();
  recentResults.push({ success, timestamp: now });
  
  // Clean old entries
  const cutoff = new Date(now.getTime() - ERROR_RATE_WINDOW_MS);
  while (recentResults.length > 0 && recentResults[0].timestamp < cutoff) {
    recentResults.shift();
  }
  
  // Check error rate
  if (recentResults.length >= 10) { // Only check if we have enough data
    const errorCount = recentResults.filter(r => !r.success).length;
    const errorRate = errorCount / recentResults.length;
    
    if (errorRate >= config.errorRateThreshold) {
      triggerAlert({
        type: 'high_error_rate',
        severity: 'critical',
        message: `High error rate detected: ${(errorRate * 100).toFixed(1)}% failures in last 5 minutes`,
        context: {
          errorRate,
          errorCount,
          totalCount: recentResults.length,
          threshold: config.errorRateThreshold
        },
        timestamp: now
      });
    }
  }
}

/**
 * Check for low confidence and trigger alert if needed
 */
export function checkConfidence(
  sessionId: string,
  catalogId: string,
  openaiConfidence: number,
  xaiConfidence: number,
  consensusConfidence: number
): void {
  const avgConfidence = (openaiConfidence + xaiConfidence) / 2;
  
  if (avgConfidence < config.lowConfidenceThreshold) {
    triggerAlert({
      type: 'low_confidence',
      severity: avgConfidence < 0.3 ? 'critical' : 'warning',
      message: `Low AI confidence detected: ${(avgConfidence * 100).toFixed(1)}%`,
      context: {
        sessionId,
        catalogId,
        openaiConfidence,
        xaiConfidence,
        consensusConfidence,
        threshold: config.lowConfidenceThreshold
      },
      timestamp: new Date()
    });
  }
}

/**
 * Check for slow response and trigger alert if needed
 */
export function checkResponseTime(
  sessionId: string,
  catalogId: string,
  processingTimeMs: number
): void {
  if (processingTimeMs > config.slowResponseThreshold) {
    triggerAlert({
      type: 'slow_response',
      severity: processingTimeMs > config.slowResponseThreshold * 2 ? 'critical' : 'warning',
      message: `Slow response detected: ${(processingTimeMs / 1000).toFixed(1)}s`,
      context: {
        sessionId,
        catalogId,
        processingTimeMs,
        threshold: config.slowResponseThreshold
      },
      timestamp: new Date()
    });
  }
}

/**
 * Check for consensus failure and trigger alert if needed
 */
export function checkConsensus(
  sessionId: string,
  catalogId: string,
  consensusScore: number,
  fieldsAgreed: number,
  fieldsDisagreed: number,
  categoryAgreed: boolean
): void {
  if (consensusScore < config.consensusFailureThreshold) {
    triggerAlert({
      type: 'consensus_failure',
      severity: consensusScore < 0.4 ? 'critical' : 'warning',
      message: `Low consensus score: ${(consensusScore * 100).toFixed(1)}%`,
      context: {
        sessionId,
        catalogId,
        consensusScore,
        fieldsAgreed,
        fieldsDisagreed,
        categoryAgreed,
        threshold: config.consensusFailureThreshold
      },
      timestamp: new Date()
    });
  }
  
  if (!categoryAgreed) {
    triggerAlert({
      type: 'category_mismatch',
      severity: 'warning',
      message: 'AI providers disagreed on product category',
      context: {
        sessionId,
        catalogId,
        consensusScore
      },
      timestamp: new Date()
    });
  }
}

/**
 * Alert on AI provider error
 */
export function alertAIError(
  sessionId: string,
  catalogId: string,
  provider: 'openai' | 'xai',
  errorMessage: string
): void {
  triggerAlert({
    type: 'ai_error',
    severity: 'critical',
    message: `${provider.toUpperCase()} error: ${errorMessage}`,
    context: {
      sessionId,
      catalogId,
      provider,
      errorMessage
    },
    timestamp: new Date()
  });
}

/**
 * Trigger an alert
 */
function triggerAlert(alert: Alert): void {
  // Add to history
  alertHistory.push(alert);
  if (alertHistory.length > MAX_ALERT_HISTORY) {
    alertHistory.shift();
  }
  
  // Log the alert
  if (config.logAlerts) {
    const logMethod = alert.severity === 'critical' ? 'error' : 
                      alert.severity === 'warning' ? 'warn' : 'info';
    logger[logMethod](`ALERT [${alert.type}]: ${alert.message}`, alert.context);
  }
  
  // Send to webhook if configured
  if (config.webhookUrl) {
    sendWebhookAlert(alert).catch(err => {
      logger.error('Failed to send webhook alert', { error: err.message });
    });
  }
}

/**
 * Send alert to webhook
 */
async function sendWebhookAlert(alert: Alert): Promise<void> {
  if (!config.webhookUrl) return;
  
  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...alert,
        source: 'catalog-verification-api',
        environment: process.env.NODE_ENV || 'development'
      })
    });
    
    if (!response.ok) {
      logger.warn('Webhook alert failed', { status: response.status });
    }
  } catch (error) {
    logger.error('Webhook alert error', { error });
  }
}

/**
 * Get recent alerts
 */
export function getRecentAlerts(options?: {
  type?: Alert['type'];
  severity?: Alert['severity'];
  limit?: number;
  since?: Date;
}): Alert[] {
  let filtered = [...alertHistory];
  
  if (options?.type) {
    filtered = filtered.filter(a => a.type === options.type);
  }
  if (options?.severity) {
    filtered = filtered.filter(a => a.severity === options.severity);
  }
  if (options?.since) {
    const sinceDate = options.since;
    filtered = filtered.filter(a => a.timestamp >= sinceDate);
  }
  
  // Sort by most recent first
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  return filtered.slice(0, options?.limit || 100);
}

/**
 * Get alert statistics
 */
export function getAlertStats(since?: Date): {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  criticalCount: number;
} {
  const cutoff = since || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24h
  const recent = alertHistory.filter(a => a.timestamp >= cutoff);
  
  const bySeverity: Record<string, number> = {};
  const byType: Record<string, number> = {};
  
  for (const alert of recent) {
    bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    byType[alert.type] = (byType[alert.type] || 0) + 1;
  }
  
  return {
    total: recent.length,
    bySeverity,
    byType,
    criticalCount: bySeverity['critical'] || 0
  };
}

/**
 * Clear alert history (for testing)
 */
export function clearAlertHistory(): void {
  alertHistory.length = 0;
  recentResults.length = 0;
}

export default {
  configureAlerting,
  recordResult,
  checkConfidence,
  checkResponseTime,
  checkConsensus,
  alertAIError,
  getRecentAlerts,
  getAlertStats,
  clearAlertHistory
};
