const mongoose = require('mongoose');
const { VerificationJob } = require('../dist/models/verification-job.model');

/**
 * Daily job statistics - track job success rates, processing times, errors
 * Run via cron daily at 8am EST
 */
async function dailyJobStats() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification', {
      serverSelectionTimeoutMS: 5000
    });

    const now = new Date();
    const yesterday = new Date(now - 24 * 60 * 60 * 1000);

    console.log('\n' + '='.repeat(80));
    console.log(`DAILY JOB STATISTICS - ${now.toISOString().split('T')[0]}`);
    console.log('='.repeat(80) + '\n');

    // Get all jobs from last 24 hours
    const jobs = await VerificationJob.find({
      createdAt: { $gte: yesterday }
    }).sort({ createdAt: 1 });

    if (jobs.length === 0) {
      console.log('⚠️  NO JOBS RECEIVED IN LAST 24 HOURS\n');
      console.log('   This may indicate:');
      console.log('   - Salesforce integration is down');
      console.log('   - API endpoint is unreachable');
      console.log('   - No products being processed\n');
      await mongoose.disconnect();
      return;
    }

    // Calculate statistics
    const stats = {
      total: jobs.length,
      completed: 0,
      failed: 0,
      pending: 0,
      processing: 0,
      withSourceData: 0,
      withoutSourceData: 0,
      withImages: 0,
      withDocuments: 0,
      withUrls: 0,
      researchExecuted: 0,
      attributesCaptured: 0,
      attributesLost: 0,
      totalProcessingTime: 0,
      errorTypes: {}
    };

    let minTime = Infinity;
    let maxTime = 0;

    for (const job of jobs) {
      // Status counts
      if (job.status === 'completed') stats.completed++;
      if (job.status === 'failed') stats.failed++;
      if (job.status === 'pending') stats.pending++;
      if (job.status === 'processing') stats.processing++;

      // Source data availability
      const webRetailerSpecs = job.rawPayload?.Web_Retailer_Specs?.length || 0;
      const fergusonAttrs = job.rawPayload?.Ferguson_Attributes?.length || 0;
      const hasSourceData = webRetailerSpecs + fergusonAttrs > 0;
      
      if (hasSourceData) {
        stats.withSourceData++;
      } else {
        stats.withoutSourceData++;
      }

      // Research data availability
      const images = job.rawPayload?.Stock_Images?.length || 0;
      const docs = job.rawPayload?.Documents?.length || 0;
      const hasUrl = job.rawPayload?.Ferguson_URL || job.rawPayload?.Reference_URL;
      
      if (images > 0) stats.withImages++;
      if (docs > 0) stats.withDocuments++;
      if (hasUrl) stats.withUrls++;

      // Research execution
      const researchExecuted = 
        (job.research?.images?.length > 0) ||
        (job.research?.webPages?.length > 0) ||
        (job.research?.documents?.length > 0);
      
      if (researchExecuted) stats.researchExecuted++;

      // Attribute coverage
      const totalSourceAttrs = webRetailerSpecs + fergusonAttrs;
      const additionalHtml = job.result?.additional_attributes_html || job.result?.Additional_Attributes_HTML || '';
      const hasHtmlTable = additionalHtml && additionalHtml.length > 50;
      
      if (totalSourceAttrs > 0) {
        if (hasHtmlTable || (job.result?.primary_display_attributes && Object.keys(job.result.primary_display_attributes).length > 0)) {
          stats.attributesCaptured++;
        } else {
          stats.attributesLost++;
        }
      }

      // Processing time
      if (job.completedAt && job.createdAt) {
        const processingTime = (job.completedAt - job.createdAt) / 1000; // seconds
        stats.totalProcessingTime += processingTime;
        minTime = Math.min(minTime, processingTime);
        maxTime = Math.max(maxTime, processingTime);
      }

      // Error tracking
      if (job.error) {
        const errorType = job.error.substring(0, 50);
        stats.errorTypes[errorType] = (stats.errorTypes[errorType] || 0) + 1;
      }
    }

    const avgTime = stats.totalProcessingTime / stats.completed || 0;

    // Display statistics
    console.log('📊 JOB VOLUME:\n');
    console.log(`   Total Jobs: ${stats.total}`);
    console.log(`   Completed: ${stats.completed} (${(stats.completed / stats.total * 100).toFixed(1)}%)`);
    console.log(`   Failed: ${stats.failed} (${(stats.failed / stats.total * 100).toFixed(1)}%)`);
    console.log(`   Pending: ${stats.pending}`);
    console.log(`   Processing: ${stats.processing}\n`);

    console.log('📦 DATA SOURCES:\n');
    console.log(`   Jobs with Source Attributes: ${stats.withSourceData} (${(stats.withSourceData / stats.total * 100).toFixed(1)}%)`);
    console.log(`   Jobs with Images: ${stats.withImages} (${(stats.withImages / stats.total * 100).toFixed(1)}%)`);
    console.log(`   Jobs with Documents: ${stats.withDocuments} (${(stats.withDocuments / stats.total * 100).toFixed(1)}%)`);
    console.log(`   Jobs with URLs: ${stats.withUrls} (${(stats.withUrls / stats.total * 100).toFixed(1)}%)\n`);

    console.log('🔬 RESEARCH PIPELINE:\n');
    console.log(`   Research Executed: ${stats.researchExecuted} / ${stats.withImages + stats.withDocuments + stats.withUrls} available`);
    const researchRate = stats.researchExecuted / Math.max(1, stats.withImages + stats.withDocuments + stats.withUrls) * 100;
    console.log(`   Execution Rate: ${researchRate.toFixed(1)}%`);
    
    if (researchRate < 50) {
      console.log(`   🚨 CRITICAL: Research pipeline only running ${researchRate.toFixed(1)}% of the time!`);
    } else if (researchRate < 90) {
      console.log(`   ⚠️  WARNING: Research execution below target (${researchRate.toFixed(1)}% vs 95% target)`);
    } else {
      console.log(`   ✅ HEALTHY: Research pipeline operating normally`);
    }
    console.log('');

    console.log('📋 ATTRIBUTE COVERAGE:\n');
    console.log(`   Attributes Captured: ${stats.attributesCaptured} / ${stats.withSourceData}`);
    console.log(`   Attributes Lost: ${stats.attributesLost}`);
    const coverageRate = stats.attributesCaptured / Math.max(1, stats.withSourceData) * 100;
    console.log(`   Coverage Rate: ${coverageRate.toFixed(1)}%`);
    
    if (coverageRate < 50) {
      console.log(`   🚨 CRITICAL: Only ${coverageRate.toFixed(1)}% of source attributes being returned!`);
    } else if (coverageRate < 90) {
      console.log(`   ⚠️  WARNING: Attribute coverage below target (${coverageRate.toFixed(1)}% vs 95% target)`);
    } else {
      console.log(`   ✅ HEALTHY: Attribute coverage within normal range`);
    }
    console.log('');

    console.log('⏱️  PERFORMANCE:\n');
    console.log(`   Average Time: ${avgTime.toFixed(2)} seconds`);
    console.log(`   Min Time: ${minTime === Infinity ? 'N/A' : minTime.toFixed(2)} seconds`);
    console.log(`   Max Time: ${maxTime === 0 ? 'N/A' : maxTime.toFixed(2)} seconds`);
    
    if (avgTime > 30) {
      console.log(`   ⚠️  WARNING: Average processing time exceeds 30 second target`);
    } else {
      console.log(`   ✅ Performance within acceptable range`);
    }
    console.log('');

    // Error summary
    if (Object.keys(stats.errorTypes).length > 0) {
      console.log('❌ ERROR SUMMARY:\n');
      const sortedErrors = Object.entries(stats.errorTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      sortedErrors.forEach(([error, count], idx) => {
        console.log(`   ${idx + 1}. ${error}... (${count} occurrences)`);
      });
      console.log('');
    }

    // Overall health score
    const successRate = stats.completed / stats.total * 100;
    const failureRate = stats.failed / stats.total * 100;
    
    console.log('🏥 OVERALL HEALTH:\n');
    
    let healthStatus = 'HEALTHY';
    let healthIcon = '✅';
    
    if (failureRate > 10 || coverageRate < 50 || researchRate < 50) {
      healthStatus = 'CRITICAL';
      healthIcon = '🚨';
    } else if (failureRate > 5 || coverageRate < 90 || researchRate < 90) {
      healthStatus = 'WARNING';
      healthIcon = '⚠️';
    }
    
    console.log(`   Status: ${healthIcon} ${healthStatus}`);
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`   Failure Rate: ${failureRate.toFixed(1)}%`);
    console.log(`   Research Execution: ${researchRate.toFixed(1)}%`);
    console.log(`   Attribute Coverage: ${coverageRate.toFixed(1)}%\n`);

    if (healthStatus === 'CRITICAL') {
      console.log('🚨 ACTION REQUIRED:\n');
      console.log('   System health is CRITICAL - immediate investigation needed!');
      console.log('   Check logs for error patterns and take corrective action.\n');
    } else if (healthStatus === 'WARNING') {
      console.log('⚠️  ATTENTION NEEDED:\n');
      console.log('   System health degraded - monitor closely and investigate issues.\n');
    }

    await mongoose.disconnect();
    
    // Exit with error code if critical
    if (healthStatus === 'CRITICAL') {
      process.exit(1);
    }

  } catch (error) {
    console.error('Error generating daily stats:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

dailyJobStats();
