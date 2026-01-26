/**
 * Compare Before/After using Production Snapshot
 * Analyzes the snapshot from production and re-runs with current code
 */

import fs from 'fs';
import path from 'path';
import { dualAIVerificationService } from '../src/services/dual-ai-verification.service';

interface OldJob {
  jobId: string;
  sfCatalogId: string;
  sfCatalogName: string;
  rawPayload: any;
  result: any;
  processingTimeMs: number;
  completedAt: string;
  status: string;
}

interface ComparisonResult {
  jobId: string;
  sfCatalogId: string;
  sfCatalogName: string;
  timestamp: string;
  oldResult: any;
  newResult: any;
  changes: {
    scoreChange: number;
    processingTimeChange: number;
    improvements: string[];
    regressions: string[];
  };
}

async function main() {
  console.log('🔍 Loading Production Jobs Snapshot...\n');
  
  const snapshotPath = path.join(process.cwd(), 'test-data/production-jobs-snapshot.json');
  const jobs: OldJob[] = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
  
  console.log(`✅ Loaded ${jobs.length} jobs from snapshot\n`);

  const results: ComparisonResult[] = [];
  
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    console.log(`\n[${i + 1}/${jobs.length}] Processing: ${job.sfCatalogName}`);
    console.log(`   Job ID: ${job.jobId}`);
    console.log(`   Original Time: ${job.completedAt}`);
    console.log(`   Old Score: ${job.result?.Verification?.verification_score || 0}`);
    console.log(`   Old Processing Time: ${job.processingTimeMs}ms`);

    try {
      // Re-run with new code
      console.log(`   🔄 Re-running verification...`);
      const startTime = Date.now();
      const newResult = await dualAIVerificationService.verifyProductWithDualAI(job.rawPayload);
      const newProcessingTime = Date.now() - startTime;

      const oldScore = job.result?.Verification?.verification_score || 0;
      const newScore = newResult?.Verification?.verification_score || 0;
      const scoreChange = newScore - oldScore;
      const timeChange = newProcessingTime - job.processingTimeMs;

      console.log(`   ✅ New Score: ${newScore} (${scoreChange > 0 ? '+' : ''}${scoreChange})`);
      console.log(`   ✅ New Time: ${newProcessingTime}ms (${timeChange > 0 ? '+' : ''}${timeChange}ms, ${((timeChange / job.processingTimeMs) * 100).toFixed(1)}%)`);

      const improvements: string[] = [];
      const regressions: string[] = [];

      if (scoreChange > 0) improvements.push(`Score improved by ${scoreChange} points`);
      if (scoreChange < 0) regressions.push(`Score decreased by ${Math.abs(scoreChange)} points`);
      if (timeChange < 0) improvements.push(`${((Math.abs(timeChange) / job.processingTimeMs) * 100).toFixed(1)}% faster`);
      if (timeChange > 0) regressions.push(`${((timeChange / job.processingTimeMs) * 100).toFixed(1)}% slower`);

      // Compare top filter attributes
      const oldAttrCount = Object.keys(job.result?.Top_Filter_Attributes || {}).length;
      const newAttrCount = Object.keys(newResult?.Top_Filter_Attributes || {}).length;
      if (newAttrCount > oldAttrCount) improvements.push(`${newAttrCount - oldAttrCount} more attributes`);
      if (newAttrCount < oldAttrCount) regressions.push(`${oldAttrCount - newAttrCount} fewer attributes`);

      results.push({
        jobId: job.jobId,
        sfCatalogId: job.sfCatalogId,
        sfCatalogName: job.sfCatalogName,
        timestamp: job.completedAt,
        oldResult: job.result,
        newResult,
        changes: {
          scoreChange,
          processingTimeChange: timeChange,
          improvements,
          regressions
        }
      });

    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
    }

    // Delay between jobs
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Generate report
  console.log('\n\n📊 COMPARISON REPORT\n');
  console.log('='.repeat(80));
  
  const avgOldScore = jobs.reduce((sum, j) => sum + (j.result?.Verification?.verification_score || 0), 0) / jobs.length;
  const avgNewScore = results.reduce((sum, r) => sum + (r.newResult?.Verification?.verification_score || 0), 0) / results.length;
  const avgOldTime = jobs.reduce((sum, j) => sum + j.processingTimeMs, 0) / jobs.length;
  const avgNewTime = results.reduce((sum, r) => sum + (r.newResult ? (Date.now() - new Date(r.timestamp).getTime()) : 0), 0) / results.length;

  console.log(`\n📈 AVERAGES:`);
  console.log(`   Score:  ${avgOldScore.toFixed(1)} → ${avgNewScore.toFixed(1)} (${(avgNewScore - avgOldScore > 0 ? '+' : '')}${(avgNewScore - avgOldScore).toFixed(1)})`);
  console.log(`   Time:   ${(avgOldTime/1000).toFixed(1)}s → ${(avgNewTime/1000).toFixed(1)}s`);

  console.log(`\n📋 JOB-BY-JOB RESULTS:\n`);
  
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.sfCatalogName}`);
    console.log(`   Score Change: ${r.changes.scoreChange > 0 ? '+' : ''}${r.changes.scoreChange}`);
    console.log(`   Time Change: ${r.changes.processingTimeChange > 0 ? '+' : ''}${r.changes.processingTimeChange}ms`);
    if (r.changes.improvements.length > 0) {
      console.log(`   ✅ Improvements: ${r.changes.improvements.join(', ')}`);
    }
    if (r.changes.regressions.length > 0) {
      console.log(`   ⚠️  Regressions: ${r.changes.regressions.join(', ')}`);
    }
    console.log('');
  });

  // Save detailed results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsPath = path.join(process.cwd(), 'test-results', `comparison-${timestamp}.json`);
  fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  console.log(`\n✅ Detailed results saved to: ${resultsPath}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
