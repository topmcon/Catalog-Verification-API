#!/usr/bin/env ts-node
/**
 * TEST SCRIPT: Replay 3 production API calls with new optimized flow
 * 
 * Purpose:
 * 1. Test the new conditional research flow (research AFTER consensus, only for failed fields)
 * 2. Compare performance: Old (~80s) vs New (expected ~40-45s)
 * 3. Validate V3 styles, categories, and all new logic
 * 4. Generate comparison report
 */

import fs from 'fs';
import path from 'path';
import { verifyProductWithDualAI } from './src/services/dual-ai-verification.service';

interface TestResult {
  testNumber: number;
  catalogId: string;
  productName: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  durationSeconds: number;
  status: string;
  score: number;
  category: string;
  style: string;
  researchTriggered: boolean;
  error?: string;
}

async function runTest(testNumber: number, payloadFile: string): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Load test payload
    const payload = JSON.parse(fs.readFileSync(payloadFile, 'utf-8'));
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST #${testNumber}: ${payload.SF_Catalog_Id}`);
    console.log(`Brand: ${payload.Brand_Web_Retailer}`);
    console.log(`Model: ${payload.Model_Number_Web_Retailer || 'N/A'}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`⏱️  Starting verification...`);
    
    // Run verification with new optimized flow
    const result = await verifyProductWithDualAI(payload);
    
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const durationSeconds = (durationMs / 1000).toFixed(2);
    
    // Debug: Log actual result structure
    console.log(`\n[DEBUG] Result keys:`, Object.keys(result));
    console.log(`[DEBUG] Consensus Score:`, result.consensus_score);
    console.log(`[DEBUG] Primary Attributes:`, result.Primary_Attributes ? Object.keys(result.Primary_Attributes) : 'missing');
    console.log(`[DEBUG] Metadata:`, result.Metadata ? Object.keys(result.Metadata) : 'missing');
    
    const testResult: TestResult = {
      testNumber,
      catalogId: payload.SF_Catalog_Id,
      productName: `${payload.Brand_Web_Retailer} ${payload.Model_Number_Web_Retailer || ''}`.trim(),
      startTime,
      endTime,
      durationMs,
      durationSeconds: parseFloat(durationSeconds),
      status: result.verification_status || result.Verification_Status || 'unknown',
      score: result.consensus_score || result.Consensus_Score || 0,
      category: result.primary_attributes?.verified_category || result.Primary_Attributes?.Verified_Category || 'unknown',
      style: result.primary_attributes?.verified_style || result.Primary_Attributes?.Verified_Style || 'N/A',
      researchTriggered: result.metadata?.research_performed || result.Metadata?.Research_Performed || false,
    };
    
    console.log(`✅ COMPLETE in ${durationSeconds}s`);
    console.log(`   Score: ${testResult.score}/100`);
    console.log(`   Category: ${testResult.category}`);
    console.log(`   Style: ${testResult.style}`);
    console.log(`   Research triggered: ${testResult.researchTriggered ? 'YES' : 'NO'}`);
    
    return testResult;
    
  } catch (error) {
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    
    console.log(`❌ FAILED after ${(durationMs / 1000).toFixed(2)}s`);
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      testNumber,
      catalogId: 'ERROR',
      productName: 'ERROR',
      startTime,
      endTime,
      durationMs,
      durationSeconds: parseFloat((durationMs / 1000).toFixed(2)),
      status: 'failed',
      score: 0,
      category: 'ERROR',
      style: 'ERROR',
      researchTriggered: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('  CATALOG VERIFICATION API - OPTIMIZED FLOW TEST');
  console.log('  Testing: Conditional Research (AFTER consensus, failed fields only)');
  console.log('='.repeat(80));
  
  const testPayloads = [
    { file: 'test-data/test-payload-1-chandelier.json', name: 'Chandelier' },
    { file: 'test-data/test-payload-2-refrigerator.json', name: 'Refrigerator' },
    { file: 'test-data/test-payload-3-dishwasher.json', name: 'Dishwasher' },
  ];
  
  const results: TestResult[] = [];
  
  // Run all tests
  for (let i = 0; i < testPayloads.length; i++) {
    const { file, name } = testPayloads[i];
    const result = await runTest(i + 1, file);
    results.push(result);
    
    // Brief pause between tests
    if (i < testPayloads.length - 1) {
      console.log('\n⏸️  Pausing 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Generate summary report
  console.log('\n' + '='.repeat(80));
  console.log('  PERFORMANCE SUMMARY');
  console.log('='.repeat(80));
  
  const successful = results.filter(r => r.status !== 'failed');
  const avgDuration = successful.reduce((sum, r) => sum + r.durationSeconds, 0) / successful.length;
  const researchTriggered = results.filter(r => r.researchTriggered).length;
  
  console.log(`\nTests Run: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${results.length - successful.length}`);
  console.log(`\nPerformance:`);
  console.log(`  Average Duration: ${avgDuration.toFixed(2)}s`);
  console.log(`  Expected (old flow): ~80s`);
  console.log(`  Speedup: ${((80 - avgDuration) / 80 * 100).toFixed(1)}% faster`);
  console.log(`\nResearch Phase:`);
  console.log(`  Triggered: ${researchTriggered}/${results.length} calls (${(researchTriggered / results.length * 100).toFixed(0)}%)`);
  console.log(`  Skipped: ${results.length - researchTriggered}/${results.length} calls`);
  
  console.log(`\n${'─'.repeat(80)}`);
  console.log('INDIVIDUAL RESULTS:');
  console.log(`${'─'.repeat(80)}`);
  
  results.forEach(r => {
    const status = r.error ? '❌' : '✅';
    console.log(`${status} Test #${r.testNumber}: ${r.catalogId}`);
    console.log(`   Product: ${r.productName}`);
    console.log(`   Duration: ${r.durationSeconds}s`);
    console.log(`   Score: ${r.score}/100`);
    console.log(`   Category: ${r.category}`);
    console.log(`   Style: ${r.style}`);
    console.log(`   Research: ${r.researchTriggered ? 'YES' : 'NO'}`);
    if (r.error) {
      console.log(`   Error: ${r.error}`);
    }
    console.log('');
  });
  
  // Save detailed results
  const reportPath = 'test-results/performance-comparison.json';
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results');
  }
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: results.length,
      successful: successful.length,
      failed: results.length - successful.length,
      avgDurationSeconds: avgDuration,
      oldFlowAvgSeconds: 80,
      speedupPercentage: ((80 - avgDuration) / 80 * 100),
      researchTriggeredCount: researchTriggered,
      researchTrigger: `${(researchTriggered / results.length * 100).toFixed(0)}%`,
    },
    results,
  }, null, 2));
  
  console.log(`\n📊 Detailed results saved to: ${reportPath}`);
  console.log('\n' + '='.repeat(80));
}

main().catch((error) => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
