/**
 * Compare Before/After Analysis Script
 * 
 * Pulls the last 10 API calls from production, re-runs them with new code,
 * and generates a comprehensive comparison report.
 */

import mongoose from 'mongoose';
import { VerificationJob } from '../src/models/verification-job.model';
import { dualAIVerificationService } from '../src/services/dual-ai-verification.service';
import fs from 'fs';
import path from 'path';

interface ComparisonResult {
  jobId: string;
  sfCatalogId: string;
  sfCatalogName: string;
  timestamp: Date;
  oldResult: {
    status: string;
    verificationScore: number;
    processingTimeMs: number;
    categoryVerified: string;
    brandVerified: string;
    topFilterAttributeCount: number;
    aiReview: any;
    error?: string;
  };
  newResult: {
    status: string;
    verificationScore: number;
    processingTimeMs: number;
    categoryVerified: string;
    brandVerified: string;
    topFilterAttributeCount: number;
    aiReview: any;
    error?: string;
  };
  changes: {
    statusChanged: boolean;
    scoreChange: number;
    processingTimeChange: number;
    categoryChanged: boolean;
    brandChanged: boolean;
    attributeCountChange: number;
    improvements: string[];
    regressions: string[];
  };
  rawPayload: any;
}

async function main() {
  console.log('🔍 Starting Before/After Comparison Analysis...\n');
  
  // Connect to production database
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB\n');

  // Fetch last 10 completed verification jobs
  console.log('📥 Fetching last 10 verification jobs...');
  const jobs = await VerificationJob.find({ 
    status: 'completed',
    result: { $exists: true, $ne: null }
  })
    .sort({ completedAt: -1 })
    .limit(10)
    .lean();

  console.log(`✅ Found ${jobs.length} jobs to analyze\n`);

  const results: ComparisonResult[] = [];
  
  // Process each job
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    console.log(`\n[${ i + 1}/${jobs.length}] Processing Job: ${job.jobId}`);
    console.log(`   SF Catalog: ${job.sfCatalogName} (${job.sfCatalogId})`);
    console.log(`   Original Completed: ${job.completedAt}`);

    try {
      // Extract old result details
      const oldResult = {
        status: job.result?.Status || 'unknown',
        verificationScore: job.result?.Verification?.verification_score || 0,
        processingTimeMs: job.processingTimeMs || 0,
        categoryVerified: job.result?.Primary_Attributes?.Category_Verified || 'N/A',
        brandVerified: job.result?.Primary_Attributes?.Brand_Verified || 'N/A',
        topFilterAttributeCount: Object.keys(job.result?.Top_Filter_Attributes || {}).length,
        aiReview: job.result?.AI_Review || {},
        error: job.error
      };

      console.log(`   Old Status: ${oldResult.status}, Score: ${oldResult.verificationScore}, Time: ${oldResult.processingTimeMs}ms`);

      // Re-run verification with new code
      console.log(`   🔄 Re-running verification with new code...`);
      const startTime = Date.now();
      
      let newResultData;
      let newError;
      try {
        newResultData = await dualAIVerificationService.verifyProductWithDualAI(job.rawPayload);
      } catch (error: any) {
        newError = error.message;
        console.log(`   ❌ New verification failed: ${newError}`);
      }

      const newProcessingTime = Date.now() - startTime;

      const newResult = {
        status: newResultData?.Status || 'error',
        verificationScore: newResultData?.Verification?.verification_score || 0,
        processingTimeMs: newProcessingTime,
        categoryVerified: newResultData?.Primary_Attributes?.Category_Verified || 'N/A',
        brandVerified: newResultData?.Primary_Attributes?.Brand_Verified || 'N/A',
        topFilterAttributeCount: Object.keys(newResultData?.Top_Filter_Attributes || {}).length,
        aiReview: newResultData?.AI_Review || {},
        error: newError
      };

      console.log(`   New Status: ${newResult.status}, Score: ${newResult.verificationScore}, Time: ${newResult.processingTimeMs}ms`);

      // Calculate changes
      const improvements: string[] = [];
      const regressions: string[] = [];

      const scoreChange = newResult.verificationScore - oldResult.verificationScore;
      const timeChange = newResult.processingTimeMs - oldResult.processingTimeMs;
      const attrChange = newResult.topFilterAttributeCount - oldResult.topFilterAttributeCount;

      if (scoreChange > 0) improvements.push(`Verification score improved by ${scoreChange} points`);
      if (scoreChange < 0) regressions.push(`Verification score decreased by ${Math.abs(scoreChange)} points`);

      if (timeChange < 0) improvements.push(`Processing time improved by ${Math.abs(timeChange)}ms (${((Math.abs(timeChange) / oldResult.processingTimeMs) * 100).toFixed(1)}% faster)`);
      if (timeChange > 0) regressions.push(`Processing time increased by ${timeChange}ms (${((timeChange / oldResult.processingTimeMs) * 100).toFixed(1)}% slower)`);

      if (attrChange > 0) improvements.push(`${attrChange} more top filter attributes extracted`);
      if (attrChange < 0) regressions.push(`${Math.abs(attrChange)} fewer top filter attributes extracted`);

      if (oldResult.error && !newResult.error) improvements.push('Previous error resolved');
      if (!oldResult.error && newResult.error) regressions.push(`New error introduced: ${newResult.error}`);

      if (oldResult.categoryVerified !== newResult.categoryVerified) {
        if (newResult.categoryVerified !== 'N/A') {
          improvements.push(`Category changed: ${oldResult.categoryVerified} → ${newResult.categoryVerified}`);
        } else {
          regressions.push(`Category changed: ${oldResult.categoryVerified} → ${newResult.categoryVerified}`);
        }
      }

      results.push({
        jobId: job.jobId,
        sfCatalogId: job.sfCatalogId,
        sfCatalogName: job.sfCatalogName,
        timestamp: job.completedAt as Date,
        oldResult,
        newResult,
        changes: {
          statusChanged: oldResult.status !== newResult.status,
          scoreChange,
          processingTimeChange: timeChange,
          categoryChanged: oldResult.categoryVerified !== newResult.categoryVerified,
          brandChanged: oldResult.brandVerified !== newResult.brandVerified,
          attributeCountChange: attrChange,
          improvements,
          regressions
        },
        rawPayload: job.rawPayload
      });

      console.log(`   ✅ Analysis complete`);
      
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      console.error(`   ❌ Error processing job: ${error.message}`);
    }
  }

  // Generate comprehensive report
  console.log('\n\n📊 Generating Comparison Report...\n');
  
  const report = generateReport(results);
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const detailedJsonPath = path.join(resultsDir, `before-after-detailed-${timestamp}.json`);
  const reportPath = path.join(resultsDir, `before-after-report-${timestamp}.md`);

  fs.writeFileSync(detailedJsonPath, JSON.stringify(results, null, 2));
  fs.writeFileSync(reportPath, report);

  console.log(`\n✅ Detailed results saved to: ${detailedJsonPath}`);
  console.log(`✅ Report saved to: ${reportPath}\n`);

  // Print summary to console
  console.log(report);

  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}

function generateReport(results: ComparisonResult[]): string {
  const totalJobs = results.length;
  const successfulOld = results.filter(r => r.oldResult.status === 'success').length;
  const successfulNew = results.filter(r => r.newResult.status === 'success').length;
  
  const avgScoreOld = results.reduce((sum, r) => sum + r.oldResult.verificationScore, 0) / totalJobs;
  const avgScoreNew = results.reduce((sum, r) => sum + r.newResult.verificationScore, 0) / totalJobs;
  
  const avgTimeOld = results.reduce((sum, r) => sum + r.oldResult.processingTimeMs, 0) / totalJobs;
  const avgTimeNew = results.reduce((sum, r) => sum + r.newResult.processingTimeMs, 0) / totalJobs;
  
  const totalImprovements = results.reduce((sum, r) => sum + r.changes.improvements.length, 0);
  const totalRegressions = results.reduce((sum, r) => sum + r.changes.regressions.length, 0);

  let report = `# Before/After Comparison Report
Generated: ${new Date().toISOString()}
Total Jobs Analyzed: ${totalJobs}

---

## Executive Summary

### Success Rate
- **Old Code**: ${successfulOld}/${totalJobs} (${((successfulOld/totalJobs)*100).toFixed(1)}%)
- **New Code**: ${successfulNew}/${totalJobs} (${((successfulNew/totalJobs)*100).toFixed(1)}%)
- **Change**: ${successfulNew - successfulOld > 0 ? '+' : ''}${successfulNew - successfulOld} jobs ${successfulNew > successfulOld ? '✅' : successfulNew < successfulOld ? '⚠️' : '→'}

### Verification Score
- **Old Average**: ${avgScoreOld.toFixed(1)}
- **New Average**: ${avgScoreNew.toFixed(1)}
- **Change**: ${avgScoreNew - avgScoreOld > 0 ? '+' : ''}${(avgScoreNew - avgScoreOld).toFixed(1)} points ${avgScoreNew > avgScoreOld ? '✅' : avgScoreNew < avgScoreOld ? '⚠️' : '→'}

### Processing Time
- **Old Average**: ${avgTimeOld.toFixed(0)}ms (${(avgTimeOld/1000).toFixed(1)}s)
- **New Average**: ${avgTimeNew.toFixed(0)}ms (${(avgTimeNew/1000).toFixed(1)}s)
- **Change**: ${avgTimeNew - avgTimeOld > 0 ? '+' : ''}${(avgTimeNew - avgTimeOld).toFixed(0)}ms (${((avgTimeNew - avgTimeOld) / avgTimeOld * 100).toFixed(1)}%) ${avgTimeNew < avgTimeOld ? '✅ Faster' : avgTimeNew > avgTimeOld ? '⚠️ Slower' : '→'}

### Quality Changes
- **Total Improvements**: ${totalImprovements} ✅
- **Total Regressions**: ${totalRegressions} ${totalRegressions > 0 ? '⚠️' : '✅'}
- **Net Change**: ${totalImprovements - totalRegressions > 0 ? '+' : ''}${totalImprovements - totalRegressions}

---

## Detailed Job-by-Job Analysis

`;

  results.forEach((result, index) => {
    report += `### Job ${index + 1}: ${result.sfCatalogName}
**Catalog ID**: ${result.sfCatalogId}
**Job ID**: ${result.jobId}
**Original Timestamp**: ${result.timestamp}

#### Metrics Comparison

| Metric | Old | New | Change |
|--------|-----|-----|--------|
| Status | ${result.oldResult.status} | ${result.newResult.status} | ${result.changes.statusChanged ? '⚠️ Changed' : '✅ Same'} |
| Verification Score | ${result.oldResult.verificationScore} | ${result.newResult.verificationScore} | ${result.changes.scoreChange > 0 ? '✅ +' : result.changes.scoreChange < 0 ? '⚠️ ' : ''}${result.changes.scoreChange} |
| Processing Time | ${result.oldResult.processingTimeMs}ms | ${result.newResult.processingTimeMs}ms | ${result.changes.processingTimeChange < 0 ? '✅ ' : result.changes.processingTimeChange > 0 ? '⚠️ +' : ''}${result.changes.processingTimeChange}ms |
| Category | ${result.oldResult.categoryVerified} | ${result.newResult.categoryVerified} | ${result.changes.categoryChanged ? '⚠️ Changed' : '✅ Same'} |
| Brand | ${result.oldResult.brandVerified} | ${result.newResult.brandVerified} | ${result.changes.brandChanged ? '⚠️ Changed' : '✅ Same'} |
| Top Filter Attributes | ${result.oldResult.topFilterAttributeCount} | ${result.newResult.topFilterAttributeCount} | ${result.changes.attributeCountChange > 0 ? '✅ +' : result.changes.attributeCountChange < 0 ? '⚠️ ' : ''}${result.changes.attributeCountChange} |

`;

    if (result.changes.improvements.length > 0) {
      report += `#### ✅ Improvements\n`;
      result.changes.improvements.forEach(imp => {
        report += `- ${imp}\n`;
      });
      report += '\n';
    }

    if (result.changes.regressions.length > 0) {
      report += `#### ⚠️ Regressions\n`;
      result.changes.regressions.forEach(reg => {
        report += `- ${reg}\n`;
      });
      report += '\n';
    }

    report += `---\n\n`;
  });

  report += `## Recommendations

`;

  if (avgScoreNew > avgScoreOld) {
    report += `✅ **Verification Quality Improved**: Average score increased by ${(avgScoreNew - avgScoreOld).toFixed(1)} points. The new code produces higher quality verifications.\n\n`;
  } else if (avgScoreNew < avgScoreOld) {
    report += `⚠️ **Verification Quality Decreased**: Average score decreased by ${(avgScoreOld - avgScoreNew).toFixed(1)} points. Review changes that may have impacted accuracy.\n\n`;
  }

  if (avgTimeNew < avgTimeOld) {
    report += `✅ **Performance Improved**: Average processing time reduced by ${((avgTimeOld - avgTimeNew)/1000).toFixed(1)}s (${(((avgTimeOld - avgTimeNew) / avgTimeOld) * 100).toFixed(1)}% faster). Optimizations are working.\n\n`;
  } else if (avgTimeNew > avgTimeOld) {
    report += `⚠️ **Performance Degraded**: Average processing time increased by ${((avgTimeNew - avgTimeOld)/1000).toFixed(1)}s (${(((avgTimeNew - avgTimeOld) / avgTimeOld) * 100).toFixed(1)}% slower). Consider reviewing recent changes.\n\n`;
  }

  if (totalImprovements > totalRegressions * 2) {
    report += `✅ **Overall Assessment**: **POSITIVE** - Improvements significantly outweigh regressions. New code is better.\n\n`;
  } else if (totalRegressions > totalImprovements * 2) {
    report += `⚠️ **Overall Assessment**: **NEGATIVE** - Regressions significantly outweigh improvements. Consider reverting or fixing issues.\n\n`;
  } else {
    report += `→ **Overall Assessment**: **MIXED** - Changes have both positive and negative impacts. Monitor closely.\n\n`;
  }

  return report;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
