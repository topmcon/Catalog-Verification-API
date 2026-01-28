/**
 * COMPARISON LOGGER
 * Captures raw incoming requests and final responses for before/after comparison
 * 
 * Usage: This is automatically enabled when COMPARISON_MODE=true
 * Files saved to: logs/comparison/
 */

import fs from 'fs';
import path from 'path';

const COMPARISON_DIR = path.join(process.cwd(), 'logs', 'comparison');

// Ensure directory exists
if (!fs.existsSync(COMPARISON_DIR)) {
  fs.mkdirSync(COMPARISON_DIR, { recursive: true });
}

export interface ComparisonEntry {
  timestamp: string;
  sessionId: string;
  sfCatalogId: string;
  modelNumber: string;
  
  // Raw input from Salesforce
  rawInput: any;
  
  // Final response sent back
  finalResponse: any;
  
  // Key fields for quick comparison
  keyFields: {
    Product_Title_Verified: string;
    Brand_Verified: string;
    Category_Verified: string;
    Model_Number_Verified: string;
    UPC_GTIN_Verified: string;
    Finish_Verified: string;
    Color_Verified: string;
    Width_Verified: string;
    Height_Verified: string;
    MSRP_Verified: string;
  };
  
  // Processing metadata
  processingTimeMs: number;
  aiModelsUsed: string[];
  webSearchPerformed: boolean;
}

const comparisonLog: ComparisonEntry[] = [];

/**
 * Log a comparison entry
 */
export function logComparison(entry: ComparisonEntry): void {
  comparisonLog.push(entry);
  
  // Save individual entry to file
  const filename = `${entry.timestamp.replace(/[:.]/g, '-')}_${entry.sfCatalogId || entry.modelNumber}.json`;
  const filepath = path.join(COMPARISON_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(entry, null, 2));
  
  console.log(`📝 Comparison logged: ${filepath}`);
}

/**
 * Get all comparison entries
 */
export function getComparisonLog(): ComparisonEntry[] {
  return comparisonLog;
}

/**
 * Save summary of all comparisons
 */
export function saveComparisonSummary(): void {
  const summaryPath = path.join(COMPARISON_DIR, `summary_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  
  const summary = {
    generatedAt: new Date().toISOString(),
    totalProducts: comparisonLog.length,
    products: comparisonLog.map(e => ({
      sfCatalogId: e.sfCatalogId,
      modelNumber: e.modelNumber,
      title: e.keyFields.Product_Title_Verified,
      brand: e.keyFields.Brand_Verified,
      category: e.keyFields.Category_Verified,
      processingTimeMs: e.processingTimeMs
    }))
  };
  
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📊 Summary saved: ${summaryPath}`);
}

/**
 * Clear comparison log
 */
export function clearComparisonLog(): void {
  comparisonLog.length = 0;
}

export default {
  logComparison,
  getComparisonLog,
  saveComparisonSummary,
  clearComparisonLog
};
