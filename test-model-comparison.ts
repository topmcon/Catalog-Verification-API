/**
 * Test Model Comparison
 * Re-tests 4 prior successful calls with new AI models (gpt-4o, grok-3)
 * and compares results
 */

import * as fs from 'fs';
import axios from 'axios';

interface OriginalResult {
  trackingId: string;
  request: {
    SF_Catalog_Id: string;
    rawPayload: any;
  };
  verificationScore: number;
  consensus: {
    finalCategory: string;
  };
  totalProcessingTimeMs: number;
  openaiResult?: {
    determinedCategory: string;
    categoryConfidence: number;
  };
  xaiResult?: {
    determinedCategory: string;
    categoryConfidence: number;
  };
}

interface ComparisonResult {
  catalogId: string;
  original: {
    category: string;
    score: number;
    processingTimeMs: number;
    openaiCategory?: string;
    xaiCategory?: string;
  };
  newResult: {
    category: string;
    score: number;
    processingTimeMs: number;
    openaiCategory?: string;
    xaiCategory?: string;
  };
  comparison: {
    categoryMatch: boolean;
    scoreDiff: number;
    timeDiff: number;
    improved: boolean;
  };
}

const API_URL = 'https://verify.cxc-ai.com/api/verify/salesforce';
const API_KEY = process.env.API_KEY || 'test-key';

async function testProduct(payload: any, originalResult: OriginalResult): Promise<ComparisonResult> {
  const startTime = Date.now();
  
  console.log(`\n📦 Testing: ${originalResult.request.SF_Catalog_Id}`);
  console.log(`   Original Category: ${originalResult.consensus?.finalCategory}`);
  console.log(`   Original Score: ${originalResult.verificationScore}`);
  
  try {
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      timeout: 120000, // 2 min timeout
    });
    
    const processingTime = Date.now() - startTime;
    const newData = response.data;
    
    const newCategory = newData.Primary_Attributes?.Category_Verified || 
                        newData.Verification?.category_determined || 'Unknown';
    const newScore = newData.Verification?.verification_score || 0;
    
    console.log(`   New Category: ${newCategory}`);
    console.log(`   New Score: ${newScore}`);
    console.log(`   Processing Time: ${processingTime}ms (was ${originalResult.totalProcessingTimeMs}ms)`);
    
    const categoryMatch = newCategory.toLowerCase() === 
                         (originalResult.consensus?.finalCategory || '').toLowerCase();
    const scoreDiff = newScore - originalResult.verificationScore;
    const timeDiff = processingTime - originalResult.totalProcessingTimeMs;
    
    return {
      catalogId: originalResult.request.SF_Catalog_Id,
      original: {
        category: originalResult.consensus?.finalCategory || 'Unknown',
        score: originalResult.verificationScore,
        processingTimeMs: originalResult.totalProcessingTimeMs,
        openaiCategory: originalResult.openaiResult?.determinedCategory,
        xaiCategory: originalResult.xaiResult?.determinedCategory,
      },
      newResult: {
        category: newCategory,
        score: newScore,
        processingTimeMs: processingTime,
        openaiCategory: newData.Verification?.ai_consensus?.openai_category,
        xaiCategory: newData.Verification?.ai_consensus?.xai_category,
      },
      comparison: {
        categoryMatch,
        scoreDiff,
        timeDiff,
        improved: scoreDiff > 0 || (scoreDiff >= 0 && timeDiff < 0),
      },
    };
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return {
      catalogId: originalResult.request.SF_Catalog_Id,
      original: {
        category: originalResult.consensus?.finalCategory || 'Unknown',
        score: originalResult.verificationScore,
        processingTimeMs: originalResult.totalProcessingTimeMs,
      },
      newResult: {
        category: 'ERROR',
        score: 0,
        processingTimeMs: Date.now() - startTime,
      },
      comparison: {
        categoryMatch: false,
        scoreDiff: -originalResult.verificationScore,
        timeDiff: 0,
        improved: false,
      },
    };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   AI MODEL COMPARISON TEST');
  console.log('   Old: gpt-4-turbo-preview + grok-beta');
  console.log('   New: gpt-4o + grok-3');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Load original test data
  const testData: OriginalResult[] = JSON.parse(
    fs.readFileSync('/tmp/test-payloads.json', 'utf-8')
  );
  
  console.log(`\nLoaded ${testData.length} test cases\n`);
  
  const results: ComparisonResult[] = [];
  
  // Run tests sequentially to avoid rate limits
  for (const original of testData) {
    const result = await testProduct(original.request.rawPayload, original);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   COMPARISON SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('┌────────────────────────┬───────────────────┬───────────────────┬────────────┐');
  console.log('│ Catalog ID             │ Original          │ New (gpt-4o)      │ Status     │');
  console.log('├────────────────────────┼───────────────────┼───────────────────┼────────────┤');
  
  for (const r of results) {
    const status = r.comparison.categoryMatch 
      ? (r.comparison.improved ? '✅ Better' : '✅ Same')
      : '⚠️ Different';
    
    console.log(`│ ${r.catalogId.padEnd(22)} │ ${r.original.category.slice(0,15).padEnd(17)} │ ${r.newResult.category.slice(0,15).padEnd(17)} │ ${status.padEnd(10)} │`);
  }
  
  console.log('└────────────────────────┴───────────────────┴───────────────────┴────────────┘');
  
  // Metrics
  const categoryMatches = results.filter(r => r.comparison.categoryMatch).length;
  const improved = results.filter(r => r.comparison.improved).length;
  const avgScoreDiff = results.reduce((acc, r) => acc + r.comparison.scoreDiff, 0) / results.length;
  const avgTimeDiff = results.reduce((acc, r) => acc + r.comparison.timeDiff, 0) / results.length;
  
  console.log('\n📊 METRICS:');
  console.log(`   Category Match Rate: ${categoryMatches}/${results.length} (${(categoryMatches/results.length*100).toFixed(0)}%)`);
  console.log(`   Improved Results: ${improved}/${results.length}`);
  console.log(`   Avg Score Change: ${avgScoreDiff > 0 ? '+' : ''}${avgScoreDiff.toFixed(1)} points`);
  console.log(`   Avg Time Change: ${avgTimeDiff > 0 ? '+' : ''}${(avgTimeDiff/1000).toFixed(1)}s`);
  
  // Detailed comparison for each
  console.log('\n📋 DETAILED RESULTS:');
  for (const r of results) {
    console.log(`\n   ${r.catalogId}:`);
    console.log(`   ├─ Category: ${r.original.category} → ${r.newResult.category} ${r.comparison.categoryMatch ? '✓' : '✗'}`);
    console.log(`   ├─ Score: ${r.original.score} → ${r.newResult.score} (${r.comparison.scoreDiff > 0 ? '+' : ''}${r.comparison.scoreDiff})`);
    console.log(`   └─ Time: ${(r.original.processingTimeMs/1000).toFixed(1)}s → ${(r.newResult.processingTimeMs/1000).toFixed(1)}s (${r.comparison.timeDiff > 0 ? '+' : ''}${(r.comparison.timeDiff/1000).toFixed(1)}s)`);
  }
  
  // Save results
  fs.writeFileSync('/tmp/comparison-results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Results saved to /tmp/comparison-results.json');
}

main().catch(console.error);
