/**
 * SELF-HEALING ERROR DETECTOR
 * Phase 1 Implementation - Detects failures and classifies issues
 * 
 * This service runs asynchronously after verification jobs complete,
 * scanning for issues that can be auto-corrected.
 * 
 * UPDATED: Now integrates with Research Attestation System
 * - Recognizes new status codes: "Procurement No Results", "Research Incomplete", "Research Error"
 * - Does NOT trigger self-healing for "Procurement No Results" (research was thorough)
 * - DOES trigger for "Research Incomplete" (can retry failed steps)
 * - ESCALATES "Research Error" (conflicts need human review)
 */

import { VerificationJob } from '../../models/verification-job.model';
import { APITracker } from '../../models/api-tracker.model';
import { FIELD_STATUS_CODES } from '../../types/research-attestation.types';
import logger from '../../utils/logger';

/**
 * Valid status codes that indicate research was completed
 * These are NOT errors - do not trigger self-healing for "Procurement No Results"
 */
const VALID_RESEARCH_COMPLETE_CODES = [
  FIELD_STATUS_CODES.PROCUREMENT_NO_RESULTS, // "Procurement No Results" - genuinely not found after thorough research
];

/**
 * Status codes that indicate research issues requiring self-healing
 */
const RESEARCH_ISSUE_CODES = [
  FIELD_STATUS_CODES.RESEARCH_INCOMPLETE, // "Research Incomplete - Pending" - can retry
  FIELD_STATUS_CODES.RESEARCH_ERROR,      // "Research Error - Manual Review Required" - escalate
];

export interface DetectedIssue {
  // Identity
  issueId: string;
  detectedAt: Date;
  
  // Affected jobs
  jobIds: string[];
  sfCatalogIds: string[];
  sampleJobId: string; // One example for analysis
  
  // Classification - UPDATED with new issue types
  issueType: 
    | 'missing_data'       // Field empty when data exists in payload
    | 'wrong_data'         // Incorrect value extracted
    | 'mapping_failure'    // Field name not recognized
    | 'logic_error'        // Category/processing logic bug
    | 'code_bug'           // Code-level error
    | 'picklist_mismatch'  // Value not in SF picklist
    | 'research_incomplete' // NEW: Research steps failed/skipped - can retry
    | 'research_conflict';  // NEW: AI disagreement requiring human review
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
  
  // NEW: Research Attestation fields
  failedResearchSteps?: string[];  // Which of the 8 steps failed
  researchCompletionRate?: number; // Percentage of steps completed (0-100)
  canRetryResearch?: boolean;      // Whether failed steps can be auto-retried
  requiresHumanReview?: boolean;   // Research conflicts need human attention
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

      // 1. Scan for missing data issues (excludes "Procurement No Results")
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

      // 5. NEW: Scan for incomplete research (can auto-retry)
      const researchIncompleteIssues = await this.detectResearchIncompleteIssues(cutoff);
      issues.push(...researchIncompleteIssues);

      // 6. NEW: Scan for research conflicts (need human review)
      const researchConflictIssues = await this.detectResearchConflictIssues(cutoff);
      issues.push(...researchConflictIssues);

      logger.info('[Self-Healing] Scan complete', {
        totalIssues: issues.length,
        missingData: missingDataIssues.length,
        mappingFailures: mappingIssues.length,
        categoryIssues: categoryIssues.length,
        picklistMismatches: picklistIssues.length,
        researchIncomplete: researchIncompleteIssues.length,
        researchConflicts: researchConflictIssues.length
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
   * 
   * IMPORTANT: Does NOT flag "Procurement No Results" as missing - that means
   * research was thorough and data genuinely doesn't exist.
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
        'AI_Brand',
        'AI_Product_Category',
        'AI_Model_Number',
        'AI_Product_Title',
        'AI_MSRP',
        'AI_Width',
        'AI_Height'
      ];

      for (const field of keyFields) {
        const fieldValue = attrs[field];
        
        // Skip if field has a valid research status code - these are NOT missing data issues
        if (VALID_RESEARCH_COMPLETE_CODES.includes(fieldValue)) {
          // "Procurement No Results" = research was thorough, data genuinely not found
          // This is NOT an error - do not trigger self-healing
          continue;
        }
        
        // Skip fields with research issue codes - handled by separate detection methods
        if (RESEARCH_ISSUE_CODES.includes(fieldValue)) {
          // "Research Incomplete" and "Research Error" handled separately
          continue;
        }
        
        // Check if field is truly missing (empty, null, Unknown)
        if (!fieldValue || fieldValue === '' || fieldValue === 'Unknown') {
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
        category: sampleJob.result?.data?.Primary_Display_Attributes?.AI_Product_Category || 'Unknown',
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
      'AI_Brand': ['Brand_Web_Retailer', 'Ferguson_Brand', 'Manufacturer', 'Brand'],
      'AI_Product_Category': ['Web_Retailer_Category', 'Ferguson_Base_Category', 'Category'],
      'AI_Model_Number': ['Model_Number_Web_Retailer', 'Ferguson_Model_Number', 'ModelNumber'],
      'AI_Product_Title': ['Product_Title_Web_Retailer', 'Ferguson_Title', 'Title'],
      'AI_MSRP': ['MSRP_Web_Retailer', 'Ferguson_Price', 'Price', 'MSRP'],
      'AI_Width': ['Width_Web_Retailer', 'Ferguson_Width', 'Width'],
      'AI_Height': ['Height_Web_Retailer', 'Ferguson_Height', 'Height']
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

  /**
   * NEW: Detect research incomplete issues
   * Pattern: Fields have "Research Incomplete - Pending" status
   * These can be auto-retried by re-running failed research steps
   */
  private async detectResearchIncompleteIssues(since: Date): Promise<DetectedIssue[]> {
    const issues: DetectedIssue[] = [];

    // Find completed jobs with incomplete research
    const jobs = await VerificationJob.find({
      status: 'completed',
      createdAt: { $gte: since }
    }).limit(500).lean();

    // Group by failed step patterns
    const incompletePatterns: Map<string, Array<{ jobId: string; failedSteps: string[]; completionRate: number }>> = new Map();

    for (const job of jobs) {
      const attestation = job.result?.data?.Research_Attestation;
      if (!attestation) continue;

      // Check if research was incomplete
      const steps = attestation.checklist_completion?.steps;
      if (!steps) continue;

      const failedSteps: string[] = [];
      for (const [stepName, completed] of Object.entries(steps)) {
        if (!completed) {
          failedSteps.push(stepName);
        }
      }

      // Also check for "Research Incomplete" status in field values
      const attrs = job.result?.data?.Primary_Display_Attributes || {};
      const topAttrs = job.result?.data?.Top_Filter_Attributes || {};
      const allAttrs = { ...attrs, ...topAttrs };
      
      const incompleteFields: string[] = [];
      for (const [fieldName, value] of Object.entries(allAttrs)) {
        if (value === FIELD_STATUS_CODES.RESEARCH_INCOMPLETE) {
          incompleteFields.push(fieldName);
        }
      }

      if (failedSteps.length > 0 || incompleteFields.length > 0) {
        const completionRate = attestation.checklist_completion?.completed_steps 
          ? Math.round((attestation.checklist_completion.completed_steps / 8) * 100) 
          : 0;
        
        const pattern = failedSteps.sort().join(',') || 'fields_incomplete';
        
        if (!incompletePatterns.has(pattern)) {
          incompletePatterns.set(pattern, []);
        }
        incompletePatterns.get(pattern)!.push({
          jobId: job.jobId,
          failedSteps,
          completionRate
        });
      }
    }

    // Convert patterns to issues
    for (const [pattern, jobData] of incompletePatterns) {
      if (jobData.length < 1) continue; // Include even single occurrences - research incomplete is important

      const sampleJob = jobs.find(j => j.jobId === jobData[0].jobId);
      if (!sampleJob) continue;

      const avgCompletionRate = Math.round(
        jobData.reduce((sum, j) => sum + j.completionRate, 0) / jobData.length
      );

      // Determine which steps can be retried
      const retryableSteps = ['url_scraping', 'image_analysis', 'openai_analysis', 'xai_analysis'];
      const failedSteps = jobData[0].failedSteps;
      const canRetry = failedSteps.some(step => retryableSteps.includes(step));

      issues.push({
        issueId: `research_incomplete_${pattern}_${Date.now()}`,
        detectedAt: new Date(),
        jobIds: jobData.map(j => j.jobId),
        sfCatalogIds: [sampleJob.sfCatalogId],
        sampleJobId: sampleJob.jobId,
        issueType: 'research_incomplete',
        severity: avgCompletionRate < 50 ? 'high' : 'medium',
        category: sampleJob.result?.data?.Primary_Display_Attributes?.AI_Product_Category || 'Unknown',
        description: `Research incomplete (${avgCompletionRate}% complete). Failed steps: ${pattern || 'unknown'}`,
        missingFields: [],
        wrongFields: [],
        rawPayload: sampleJob.rawPayload,
        currentResponse: sampleJob.result,
        errorLogs: [],
        affectedCount: jobData.length,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        frequency: jobData.length / 24,
        status: 'detected',
        priority: this.calculateResearchPriority(avgCompletionRate, jobData.length),
        // NEW: Research attestation fields
        failedResearchSteps: failedSteps,
        researchCompletionRate: avgCompletionRate,
        canRetryResearch: canRetry,
        requiresHumanReview: false
      });
    }

    return issues;
  }

  /**
   * NEW: Detect research conflict issues
   * Pattern: Fields have "Research Error - Manual Review Required" status
   * These MUST be escalated to human review - do not auto-fix
   */
  private async detectResearchConflictIssues(since: Date): Promise<DetectedIssue[]> {
    const issues: DetectedIssue[] = [];

    // Find completed jobs with research errors
    const jobs = await VerificationJob.find({
      status: 'completed',
      createdAt: { $gte: since }
    }).limit(500).lean();

    // Group by conflict patterns
    const conflictPatterns: Map<string, string[]> = new Map();

    for (const job of jobs) {
      const attrs = job.result?.data?.Primary_Display_Attributes || {};
      const topAttrs = job.result?.data?.Top_Filter_Attributes || {};
      const allAttrs = { ...attrs, ...topAttrs };
      
      const conflictFields: string[] = [];
      for (const [fieldName, value] of Object.entries(allAttrs)) {
        if (value === FIELD_STATUS_CODES.RESEARCH_ERROR) {
          conflictFields.push(fieldName);
        }
      }

      if (conflictFields.length > 0) {
        const pattern = conflictFields.sort().join(',');
        if (!conflictPatterns.has(pattern)) {
          conflictPatterns.set(pattern, []);
        }
        conflictPatterns.get(pattern)!.push(job.jobId);
      }
    }

    // Convert patterns to issues (always escalate these)
    for (const [pattern, jobIds] of conflictPatterns) {
      const sampleJob = jobs.find(j => j.jobId === jobIds[0]);
      if (!sampleJob) continue;

      issues.push({
        issueId: `research_conflict_${pattern}_${Date.now()}`,
        detectedAt: new Date(),
        jobIds,
        sfCatalogIds: [sampleJob.sfCatalogId],
        sampleJobId: sampleJob.jobId,
        issueType: 'research_conflict',
        severity: 'critical', // Always critical - needs human review
        category: sampleJob.result?.data?.Primary_Display_Attributes?.AI_Product_Category || 'Unknown',
        description: `Research conflicts requiring human review. Fields: ${pattern}`,
        missingFields: [],
        wrongFields: [],
        rawPayload: sampleJob.rawPayload,
        currentResponse: sampleJob.result,
        errorLogs: [],
        affectedCount: jobIds.length,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        frequency: jobIds.length / 24,
        status: 'detected',
        priority: 10, // Always highest priority - human review needed
        // NEW: Research attestation fields
        failedResearchSteps: pattern.split(','),
        researchCompletionRate: undefined,
        canRetryResearch: false, // Cannot auto-retry conflicts
        requiresHumanReview: true
      });
    }

    return issues;
  }

  /**
   * Calculate priority for research incomplete issues
   */
  private calculateResearchPriority(completionRate: number, affectedCount: number): number {
    let priority = 5; // Base priority
    
    // Lower completion = higher priority
    if (completionRate < 25) priority += 3;
    else if (completionRate < 50) priority += 2;
    else if (completionRate < 75) priority += 1;
    
    // More affected jobs = higher priority
    priority += Math.min(affectedCount / 3, 2);
    
    return Math.min(Math.round(priority), 10);
  }
}

export const selfHealingErrorDetector = new SelfHealingErrorDetector();
export default selfHealingErrorDetector;
