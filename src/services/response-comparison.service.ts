/**
 * RESPONSE COMPARISON SERVICE
 * ============================
 * Analyzes differences between current verification results and prior responses
 * to identify logic failures, improvements, and data inconsistencies.
 * 
 * This runs AFTER verification is completed and does NOT influence verification logic.
 */

import logger from '../utils/logger';

export interface FieldComparison {
  field: string;
  oldValue: any;
  newValue: any;
  changed: boolean;
  changeType: 'improvement' | 'regression' | 'different' | 'unchanged';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  reason?: string;
}

export interface ComparisonResult {
  analysisTimestamp: string;
  priorResponseTimestamp?: string;
  priorJobId?: string;
  totalFieldsCompared: number;
  changedFields: number;
  unchangedFields: number;
  improvements: number;
  regressions: number;
  criticalChanges: number;
  fieldComparisons: FieldComparison[];
  summary: string;
  recommendations: string[];
}

/**
 * Compare new verification results against prior response
 */
export function compareResponses(
  currentResponse: any,
  priorResponseData: any | undefined,
  sessionId: string
): ComparisonResult | null {
  
  // If no prior response data, skip comparison
  if (!priorResponseData) {
    logger.info('No prior response data available for comparison', { sessionId });
    return null;
  }

  const startTime = Date.now();
  const fieldComparisons: FieldComparison[] = [];
  
  logger.info('Starting post-verification response comparison', {
    sessionId,
    priorJobId: priorResponseData.jobId,
    priorTimestamp: priorResponseData.timestamp
  });

  // Extract current and prior attributes
  const currentPrimary = currentResponse.data?.Primary_Attributes || {};
  const priorPrimary = priorResponseData.Primary_Attributes || {};
  
  const currentTop15 = currentResponse.data?.Top_15_Filter_Attributes || {};
  const priorTop15 = priorResponseData.Top_15_Filter_Attributes || {};
  
  const currentAdditional = currentResponse.data?.Additional_Attributes || {};
  const priorAdditional = priorResponseData.Additional_Attributes || {};

  // Compare Primary Attributes
  const primaryFields = new Set([
    ...Object.keys(currentPrimary),
    ...Object.keys(priorPrimary)
  ]);

  for (const field of primaryFields) {
    const comparison = compareField(
      field,
      priorPrimary[field],
      currentPrimary[field],
      'Primary'
    );
    fieldComparisons.push(comparison);
  }

  // Compare Top 15 Filter Attributes
  const top15Fields = new Set([
    ...Object.keys(currentTop15),
    ...Object.keys(priorTop15)
  ]);

  for (const field of top15Fields) {
    const comparison = compareField(
      field,
      priorTop15[field],
      currentTop15[field],
      'Top15'
    );
    fieldComparisons.push(comparison);
  }

  // Compare Additional Attributes (sample - only if significant)
  const additionalFields = new Set([
    ...Object.keys(currentAdditional),
    ...Object.keys(priorAdditional)
  ]);

  for (const field of additionalFields) {
    const comparison = compareField(
      field,
      priorAdditional[field],
      currentAdditional[field],
      'Additional'
    );
    if (comparison.changed) {
      fieldComparisons.push(comparison);
    }
  }

  // Calculate statistics
  const changedFields = fieldComparisons.filter(f => f.changed).length;
  const unchangedFields = fieldComparisons.filter(f => !f.changed).length;
  const improvements = fieldComparisons.filter(f => f.changeType === 'improvement').length;
  const regressions = fieldComparisons.filter(f => f.changeType === 'regression').length;
  const criticalChanges = fieldComparisons.filter(f => f.severity === 'critical').length;

  // Generate summary
  const summary = generateSummary(fieldComparisons, changedFields, improvements, regressions);
  const recommendations = generateRecommendations(fieldComparisons);

  const result: ComparisonResult = {
    analysisTimestamp: new Date().toISOString(),
    priorResponseTimestamp: priorResponseData.timestamp,
    priorJobId: priorResponseData.jobId,
    totalFieldsCompared: fieldComparisons.length,
    changedFields,
    unchangedFields,
    improvements,
    regressions,
    criticalChanges,
    fieldComparisons: fieldComparisons.filter(f => f.changed), // Only include changed fields
    summary,
    recommendations
  };

  logger.info('Response comparison completed', {
    sessionId,
    processingTime: Date.now() - startTime + 'ms',
    changedFields,
    improvements,
    regressions,
    criticalChanges
  });

  return result;
}

/**
 * Compare individual field values
 */
function compareField(
  field: string,
  oldValue: any,
  newValue: any,
  attributeType: 'Primary' | 'Top15' | 'Additional'
): FieldComparison {
  
  // Normalize values for comparison
  const normalizedOld = normalizeValue(oldValue);
  const normalizedNew = normalizeValue(newValue);
  
  const changed = normalizedOld !== normalizedNew;
  
  if (!changed) {
    return {
      field: `${attributeType}.${field}`,
      oldValue,
      newValue,
      changed: false,
      changeType: 'unchanged',
      severity: 'none'
    };
  }

  // Analyze change type and severity
  const { changeType, severity, reason } = analyzeChange(field, oldValue, newValue);

  return {
    field: `${attributeType}.${field}`,
    oldValue,
    newValue,
    changed: true,
    changeType,
    severity,
    reason
  };
}

/**
 * Normalize value for comparison (handles null, undefined, empty strings, etc.)
 */
function normalizeValue(value: any): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value).trim().toLowerCase();
}

/**
 * Analyze the type of change and its severity
 */
function analyzeChange(
  field: string,
  oldValue: any,
  newValue: any
): { changeType: 'improvement' | 'regression' | 'different'; severity: 'critical' | 'high' | 'medium' | 'low'; reason: string } {
  
  const oldNorm = normalizeValue(oldValue);
  const newNorm = normalizeValue(newValue);

  // Critical ID fields should be stable
  if (field.endsWith('_Id') || field.endsWith('_ID')) {
    return {
      changeType: 'regression',
      severity: 'critical',
      reason: `ID field changed from "${oldValue}" to "${newValue}" - may indicate picklist mismatch or logic failure`
    };
  }

  // Brand, Category, Type changes are critical
  if (field.includes('Brand_Verified') || field.includes('Category_Verified') || field.includes('Type_Verified')) {
    // Check if change is from empty/N/A to a real value (improvement)
    if ((oldNorm === '' || oldNorm === 'not applicable' || oldNorm === 'not found') && 
        (newNorm !== '' && newNorm !== 'not applicable' && newNorm !== 'not found')) {
      return {
        changeType: 'improvement',
        severity: 'high',
        reason: `Previously empty/N/A, now has value: "${newValue}"`
      };
    }
    
    // Check if change is from real value to empty/N/A (regression)
    if ((oldNorm !== '' && oldNorm !== 'not applicable' && oldNorm !== 'not found') && 
        (newNorm === '' || newNorm === 'not applicable' || newNorm === 'not found')) {
      return {
        changeType: 'regression',
        severity: 'critical',
        reason: `Previously had value "${oldValue}", now empty/N/A - LOGIC FAILURE`
      };
    }

    return {
      changeType: 'different',
      severity: 'critical',
      reason: `Core classification changed from "${oldValue}" to "${newValue}" - review AI logic`
    };
  }

  // "Not Found" → actual value = improvement
  if ((oldNorm === 'not found' || oldNorm === 'not applicable') && 
      (newNorm !== 'not found' && newNorm !== 'not applicable' && newNorm !== '')) {
    return {
      changeType: 'improvement',
      severity: 'medium',
      reason: `Previously "Not Found", now found: "${newValue}"`
    };
  }

  // Actual value → "Not Found" = regression
  if ((oldNorm !== 'not found' && oldNorm !== 'not applicable' && oldNorm !== '') && 
      (newNorm === 'not found' || newNorm === 'not applicable')) {
    return {
      changeType: 'regression',
      severity: 'high',
      reason: `Lost data: previously "${oldValue}", now "Not Found"`
    };
  }

  // Numeric field changes
  if (field.includes('MSRP') || field.includes('Weight') || field.includes('Height') || 
      field.includes('Width') || field.includes('Depth')) {
    const oldNum = parseFloat(oldNorm);
    const newNum = parseFloat(newNorm);
    
    if (!isNaN(oldNum) && !isNaN(newNum)) {
      const percentChange = Math.abs((newNum - oldNum) / oldNum) * 100;
      if (percentChange > 20) {
        return {
          changeType: 'different',
          severity: 'high',
          reason: `Numeric value changed by ${percentChange.toFixed(1)}%: "${oldValue}" → "${newValue}"`
        };
      } else {
        return {
          changeType: 'different',
          severity: 'low',
          reason: `Minor numeric adjustment: "${oldValue}" → "${newValue}"`
        };
      }
    }
  }

  // Default: different but not categorized
  return {
    changeType: 'different',
    severity: 'medium',
    reason: `Value changed from "${oldValue}" to "${newValue}"`
  };
}

/**
 * Generate human-readable summary
 */
function generateSummary(
  comparisons: FieldComparison[],
  changedFields: number,
  improvements: number,
  regressions: number
): string {
  
  if (changedFields === 0) {
    return '✅ No changes detected - verification results are identical to prior response.';
  }

  const criticalChanges = comparisons.filter(f => f.severity === 'critical').length;

  if (regressions > 0 || criticalChanges > 0) {
    return `⚠️ ATTENTION REQUIRED: ${changedFields} field(s) changed (${regressions} regressions, ${improvements} improvements, ${criticalChanges} critical). Review logic failures.`;
  }

  if (improvements > regressions) {
    return `✅ IMPROVED: ${changedFields} field(s) changed (${improvements} improvements, ${regressions} regressions). Verification quality increased.`;
  }

  return `ℹ️ ${changedFields} field(s) changed (${improvements} improvements, ${regressions} different). Review for consistency.`;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(comparisons: FieldComparison[]): string[] {
  const recommendations: string[] = [];

  const criticalChanges = comparisons.filter(f => f.severity === 'critical' && f.changed);
  const regressions = comparisons.filter(f => f.changeType === 'regression' && f.changed);
  const idChanges = comparisons.filter(f => f.field.includes('_Id') && f.changed);

  if (criticalChanges.length > 0) {
    recommendations.push(`🔴 CRITICAL: ${criticalChanges.length} critical field(s) changed. Review AI verification logic immediately.`);
    criticalChanges.slice(0, 3).forEach(c => {
      recommendations.push(`   - ${c.field}: ${c.reason}`);
    });
  }

  if (idChanges.length > 0) {
    recommendations.push(`⚠️ Salesforce ID fields changed (${idChanges.length}). Verify picklist matching logic.`);
  }

  if (regressions.length > 0) {
    recommendations.push(`📉 ${regressions.length} regression(s) detected. Previously found data is now missing.`);
  }

  const improvements = comparisons.filter(f => f.changeType === 'improvement' && f.changed);
  if (improvements.length > 0) {
    recommendations.push(`✅ ${improvements.length} improvement(s): Previously missing data now found.`);
  }

  if (recommendations.length === 0) {
    recommendations.push('ℹ️ Changes appear to be normal data variations. No immediate action required.');
  }

  return recommendations;
}
