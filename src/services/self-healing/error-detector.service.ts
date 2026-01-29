/**
 * SELF-HEALING ERROR DETECTOR
 * Phase 1 Implementation - Detects failures and classifies issues
 * 
 * This service runs asynchronously after verification jobs complete,
 * scanning for issues that can be auto-corrected.
 */

import { VerificationJob } from '../../models/verification-job.model';
import { APITracker } from '../../models/api-tracker.model';
import logger from '../../utils/logger';

export interface DetectedIssue {
  // Identity
  issueId: string;
  detectedAt: Date;
  
  // Affected jobs
  jobIds: string[];
  sfCatalogIds: string[];
  sampleJobId: string; // One example for analysis
  
  // Classification
  issueType: 'missing_data' | 'wrong_data' | 'mapping_failure' | 'logic_error' | 'code_bug' | 'picklist_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string; // Product category affected
  
  // Details
  description: string;
  missingFields: string[];
  wrongFields: Array<{
    field: string;
    expected: any;
    received: any;
  }>;
  
  // Context
  rawPayload: any; // Sample request
  currentResponse: any; // Sample response
  errorLogs: string[];
  
  // Metrics
  affectedCount: number; // How many jobs have this issue
  firstSeenAt: Date;
  lastSeenAt: Date;
  frequency: number; // Occurrences per hour
  
  // Status
  status: 'detected' | 'diagnosing' | 'fixing' | 'testing' | 'resolved' | 'failed';
  priority: number; // 1-10, higher = more urgent
}

class SelfHealingErrorDetector {
  private scanInterval: NodeJS.Timeout | null = null;
  private isScanning = false;

  /**
   * Start the error detection service
   */
  start(intervalMs: number = 5 * 60 * 1000): void {
    if (this.scanInterval) {
      logger.warn('[Self-Healing] Error detector already running');
      return;
    }

    logger.info('[Self-Healing] Starting error detection service', { intervalMs });

    this.scanInterval = setInterval(async () => {
      await this.scanForIssues();
    }, intervalMs);

    // Run immediately on start
    this.scanForIssues();
  }

  /**
   * Stop the error detection service
   */
  stop(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
      logger.info('[Self-Healing] Stopped error detection service');
    }
  }

  /**
   * Main scanning function
   */
  async scanForIssues(): Promise<DetectedIssue[]> {
    if (this.isScanning) {
      logger.debug('[Self-Healing] Scan already in progress, skipping');
      return [];
    }

    try {
      this.isScanning = true;
      logger.info('[Self-Healing] Starting issue scan...');

      const issues: DetectedIssue[] = [];

      // Look back 24 hours for patterns
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // 1. Scan for missing data issues
      const missingDataIssues = await this.detectMissingDataIssues(cutoff);
      issues.push(...missingDataIssues);

      // 2. Scan for mapping failures
      const mappingIssues = await this.detectMappingFailures(cutoff);
      issues.push(...mappingIssues);

      // 3. Scan for category determination issues
      const categoryIssues = await this.detectCategoryIssues(cutoff);
      issues.push(...categoryIssues);

      // 4. Scan for picklist mismatches
      const picklistIssues = await this.detectPicklistMismatches(cutoff);
      issues.push(...picklistIssues);

      logger.info('[Self-Healing] Scan complete', {
        totalIssues: issues.length,
        missingData: missingDataIssues.length,
        mappingFailures: mappingIssues.length,
        categoryIssues: categoryIssues.length,
        picklistMismatches: picklistIssues.length
      });

      // Prioritize issues
      const prioritized = this.prioritizeIssues(issues);

      // Log high-priority issues
      prioritized.filter(i => i.priority >= 7).forEach(issue => {
        logger.warn('[Self-Healing] High-priority issue detected', {
          issueType: issue.issueType,
          description: issue.description,
          affectedJobs: issue.affectedCount,
          priority: issue.priority
        });
      });

      return prioritized;

    } catch (error) {
      logger.error('[Self-Healing] Error during scan', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Detect missing data issues
   * Pattern: Field exists in request but null/empty in response
   */
  private async detectMissingDataIssues(since: Date): Promise<DetectedIssue[]> {
    const issues: DetectedIssue[] = [];

    // Find completed jobs where key fields are missing
    const jobs = await VerificationJob.find({
      status: 'completed',
      createdAt: { $gte: since }
    }).limit(500).lean();

    // Group by missing field patterns
    const missingPatterns: Map<string, string[]> = new Map();

    for (const job of jobs) {
      if (!job.result?.data?.Primary_Display_Attributes) continue;

      const attrs = job.result.data.Primary_Display_Attributes;
      const missing: string[] = [];

      // Check key fields
      const keyFields = [
        'Brand_Verified',
        'Category_Verified',
        'Model_Number_Verified',
        'Product_Title_Verified',
        'MSRP_Verified',
        'Width_Verified',
        'Height_Verified'
      ];

      for (const field of keyFields) {
        if (!attrs[field] || attrs[field] === '' || attrs[field] === 'Unknown') {
          // Check if data exists in raw payload
          const hasDataInPayload = this.checkFieldExistsInPayload(field, job.rawPayload);
          if (hasDataInPayload) {
            missing.push(field);
          }
        }
      }

      if (missing.length > 0) {
        const pattern = missing.sort().join(',');
        if (!missingPatterns.has(pattern)) {
          missingPatterns.set(pattern, []);
        }
        missingPatterns.get(pattern)!.push(job.jobId);
      }
    }

    // Convert patterns to issues
    for (const [pattern, jobIds] of missingPatterns) {
      if (jobIds.length < 2) continue; // Only care about recurring issues

      const sampleJob = jobs.find(j => j.jobId === jobIds[0]);
      if (!sampleJob) continue;

      issues.push({
        issueId: `missing_${pattern}_${Date.now()}`,
        detectedAt: new Date(),
        jobIds,
        sfCatalogIds: [sampleJob.sfCatalogId],
        sampleJobId: sampleJob.jobId,
        issueType: 'missing_data',
        severity: this.calculateSeverity(jobIds.length, pattern.split(',').length),
        category: sampleJob.result?.data?.Primary_Display_Attributes?.Category_Verified || 'Unknown',
        description: `Fields missing despite data in payload: ${pattern}`,
        missingFields: pattern.split(','),
        wrongFields: [],
        rawPayload: sampleJob.rawPayload,
        currentResponse: sampleJob.result,
        errorLogs: [],
        affectedCount: jobIds.length,
        firstSeenAt: new Date(Math.min(...jobs.filter(j => jobIds.includes(j.jobId)).map(j => j.createdAt.getTime()))),
        lastSeenAt: new Date(Math.max(...jobs.filter(j => jobIds.includes(j.jobId)).map(j => j.createdAt.getTime()))),
        frequency: jobIds.length / 24, // Per hour
        status: 'detected',
        priority: this.calculatePriority(jobIds.length, pattern.split(',').length)
      });
    }

    return issues;
  }

  /**
   * Detect mapping failures
   * Pattern: Same field name variations not being recognized
   */
  private async detectMappingFailures(_since: Date): Promise<DetectedIssue[]> {
    // TODO: Analyze api_trackers for patterns in unrecognized field names
    // Look for fields in rawPayload that don't map to any verified field
    return [];
  }

  /**
   * Detect category determination issues
   * Pattern: Wrong category assigned or low confidence
   */
  private async detectCategoryIssues(since: Date): Promise<DetectedIssue[]> {
    const issues: DetectedIssue[] = [];

    // Find jobs with category disagreement or low confidence
    const trackers = await APITracker.find({
      requestTimestamp: { $gte: since },
      $or: [
        { 'consensus.categoryAgreed': false },
        { 'openaiResult.categoryConfidence': { $lt: 0.7 } },
        { 'xaiResult.categoryConfidence': { $lt: 0.7 } }
      ]
    }).limit(100).lean();

    // Group by category mismatch patterns
    const categoryPatterns: Map<string, any[]> = new Map();

    for (const tracker of trackers) {
      const openaiCat = tracker.openaiResult?.determinedCategory;
      const xaiCat = tracker.xaiResult?.determinedCategory;
      
      if (openaiCat && xaiCat && openaiCat !== xaiCat) {
        const pattern = `${openaiCat}_vs_${xaiCat}`;
        if (!categoryPatterns.has(pattern)) {
          categoryPatterns.set(pattern, []);
        }
        categoryPatterns.get(pattern)!.push(tracker);
      }
    }

    // Create issues for recurring patterns
    for (const [pattern, trackers] of categoryPatterns) {
      if (trackers.length < 3) continue;

      const sample = trackers[0];
      issues.push({
        issueId: `category_${pattern}_${Date.now()}`,
        detectedAt: new Date(),
        jobIds: [],
        sfCatalogIds: [sample.request?.SF_Catalog_Id],
        sampleJobId: sample.sessionId,
        issueType: 'logic_error',
        severity: 'medium',
        category: pattern.split('_vs_')[0],
        description: `Category disagreement pattern: ${pattern}`,
        missingFields: [],
        wrongFields: [],
        rawPayload: sample.request?.rawPayload,
        currentResponse: sample.response,
        errorLogs: [],
        affectedCount: trackers.length,
        firstSeenAt: trackers[0].requestTimestamp,
        lastSeenAt: trackers[trackers.length - 1].requestTimestamp,
        frequency: trackers.length / 24,
        status: 'detected',
        priority: 5
      });
    }

    return issues;
  }

  /**
   * Detect picklist mismatches
   * Pattern: Valid values not in Salesforce picklists
   */
  private async detectPicklistMismatches(_since: Date): Promise<DetectedIssue[]> {
    // TODO: Query FailedMatchLog model for recurring mismatches
    return [];
  }

  /**
   * Check if field data exists in raw payload
   */
  private checkFieldExistsInPayload(field: string, payload: any): boolean {
    if (!payload) return false;

    // Map verified field names to possible payload field names
    const fieldMappings: Record<string, string[]> = {
      'Brand_Verified': ['Brand_Web_Retailer', 'Ferguson_Brand', 'Manufacturer', 'Brand'],
      'Category_Verified': ['Web_Retailer_Category', 'Ferguson_Base_Category', 'Category'],
      'Model_Number_Verified': ['Model_Number_Web_Retailer', 'Ferguson_Model_Number', 'ModelNumber'],
      'Product_Title_Verified': ['Product_Title_Web_Retailer', 'Ferguson_Title', 'Title'],
      'MSRP_Verified': ['MSRP_Web_Retailer', 'Ferguson_Price', 'Price', 'MSRP'],
      'Width_Verified': ['Width_Web_Retailer', 'Ferguson_Width', 'Width'],
      'Height_Verified': ['Height_Web_Retailer', 'Ferguson_Height', 'Height']
    };

    const possibleFields = fieldMappings[field] || [];
    
    for (const payloadField of possibleFields) {
      if (payload[payloadField] && String(payload[payloadField]).trim() !== '') {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate issue severity
   */
  private calculateSeverity(affectedCount: number, fieldCount: number): 'low' | 'medium' | 'high' | 'critical' {
    if (affectedCount >= 20 || fieldCount >= 5) return 'critical';
    if (affectedCount >= 10 || fieldCount >= 3) return 'high';
    if (affectedCount >= 5 || fieldCount >= 2) return 'medium';
    return 'low';
  }

  /**
   * Calculate issue priority (1-10)
   */
  private calculatePriority(affectedCount: number, fieldCount: number): number {
    let priority = 0;
    
    // More affected jobs = higher priority
    priority += Math.min(affectedCount / 5, 5);
    
    // More missing fields = higher priority
    priority += Math.min(fieldCount, 3);
    
    // Critical fields get extra priority
    // (Brand, Category, Model Number)
    priority += 2;
    
    return Math.min(Math.round(priority), 10);
  }

  /**
   * Prioritize issues by urgency
   */
  private prioritizeIssues(issues: DetectedIssue[]): DetectedIssue[] {
    return issues.sort((a, b) => {
      // Sort by priority (descending)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      
      // Then by affected count
      if (b.affectedCount !== a.affectedCount) {
        return b.affectedCount - a.affectedCount;
      }
      
      // Then by severity
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Manual trigger for immediate scan
   */
  async triggerScan(): Promise<DetectedIssue[]> {
    return this.scanForIssues();
  }
}

export const selfHealingErrorDetector = new SelfHealingErrorDetector();
export default selfHealingErrorDetector;
