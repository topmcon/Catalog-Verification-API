import logger from '../utils/logger';

interface ErrorEvent {
  timestamp: Date;
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  metadata?: any;
}

/**
 * Real-time error monitoring and alerting service
 * Tracks error rates and sends alerts when thresholds exceeded
 */
export class ErrorMonitorService {
  private errorWindow: ErrorEvent[] = [];
  private readonly WINDOW_SIZE = 5 * 60 * 1000; // 5 minutes
  private readonly ERROR_THRESHOLDS = {
    low: 0.10,    // 10% error rate
    medium: 0.20, // 20% error rate
    high: 0.30    // 30% error rate
  };
  private totalCallsWindow: number = 0;
  private lastAlertTime: Date | null = null;
  private readonly ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes between alerts

  constructor() {
    // Clean up old errors every minute
    setInterval(() => this.cleanupOldErrors(), 60 * 1000);
  }

  /**
   * Record an error event
   */
  async recordError(
    type: string,
    severity: 'low' | 'medium' | 'high',
    message: string,
    metadata?: any
  ): Promise<void> {
    const event: ErrorEvent = {
      timestamp: new Date(),
      type,
      severity,
      message,
      metadata
    };

    this.errorWindow.push(event);
    logger.debug(`Error recorded: ${type} (${severity}) - ${message}`);

    // Check if we should alert
    await this.checkErrorRate();
  }

  /**
   * Record a successful call
   */
  recordSuccess(): void {
    this.totalCallsWindow++;
  }

  /**
   * Get current error rate
   */
  getCurrentErrorRate(): number {
    if (this.totalCallsWindow === 0) return 0;
    return this.errorWindow.length / this.totalCallsWindow;
  }

  /**
   * Get error breakdown by type
   */
  getErrorBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const error of this.errorWindow) {
      breakdown[error.type] = (breakdown[error.type] || 0) + 1;
    }
    
    return breakdown;
  }

  /**
   * Get error breakdown by severity
   */
  getErrorBySeverity(): Record<string, number> {
    const breakdown: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0
    };
    
    for (const error of this.errorWindow) {
      breakdown[error.severity]++;
    }
    
    return breakdown;
  }

  /**
   * Check error rate and send alerts if thresholds exceeded
   */
  private async checkErrorRate(): Promise<void> {
    const errorRate = this.getCurrentErrorRate();
    
    // Don't alert if in cooldown period
    if (this.lastAlertTime) {
      const timeSinceLastAlert = Date.now() - this.lastAlertTime.getTime();
      if (timeSinceLastAlert < this.ALERT_COOLDOWN) {
        return;
      }
    }

    let alertSeverity: 'HIGH' | 'MEDIUM' | 'LOW' | null = null;

    if (errorRate >= this.ERROR_THRESHOLDS.high) {
      alertSeverity = 'HIGH';
    } else if (errorRate >= this.ERROR_THRESHOLDS.medium) {
      alertSeverity = 'MEDIUM';
    } else if (errorRate >= this.ERROR_THRESHOLDS.low) {
      alertSeverity = 'LOW';
    }

    if (alertSeverity) {
      const breakdown = this.getErrorBreakdown();
      const severityBreakdown = this.getErrorBySeverity();
      
      // Log the high error rate (alerting service will handle its own alerts)
      logger.warn(`Error rate alert: ${alertSeverity} - ${(errorRate * 100).toFixed(1)}%`, {
        severity: alertSeverity,
        error_rate: errorRate,
        total_errors: this.errorWindow.length,
        total_calls: this.totalCallsWindow,
        window_size_minutes: this.WINDOW_SIZE / 60000,
        error_breakdown: breakdown,
        severity_breakdown: severityBreakdown,
        recent_errors: this.errorWindow.slice(-10).map(e => ({
          type: e.type,
          message: e.message,
          time: e.timestamp.toISOString()
        }))
      });

      this.lastAlertTime = new Date();
    }
  }

  /**
   * Clean up errors outside the time window
   */
  private cleanupOldErrors(): void {
    const cutoffTime = Date.now() - this.WINDOW_SIZE;
    const beforeCount = this.errorWindow.length;
    
    this.errorWindow = this.errorWindow.filter(
      error => error.timestamp.getTime() >= cutoffTime
    );

    const removed = beforeCount - this.errorWindow.length;
    if (removed > 0) {
      logger.debug(`Cleaned up ${removed} old errors from monitoring window`);
    }

    // Reset total calls counter periodically
    if (this.errorWindow.length === 0) {
      this.totalCallsWindow = 0;
    }
  }

  /**
   * Get current monitoring stats
   */
  getStats(): {
    error_rate: number;
    total_errors: number;
    total_calls: number;
    window_size_minutes: number;
    error_breakdown: Record<string, number>;
    severity_breakdown: Record<string, number>;
  } {
    return {
      error_rate: this.getCurrentErrorRate(),
      total_errors: this.errorWindow.length,
      total_calls: this.totalCallsWindow,
      window_size_minutes: this.WINDOW_SIZE / 60000,
      error_breakdown: this.getErrorBreakdown(),
      severity_breakdown: this.getErrorBySeverity()
    };
  }

  /**
   * Reset monitoring window (for testing)
   */
  reset(): void {
    this.errorWindow = [];
    this.totalCallsWindow = 0;
    this.lastAlertTime = null;
    logger.info('Error monitoring window reset');
  }
}

// Singleton instance
export const errorMonitor = new ErrorMonitorService();
