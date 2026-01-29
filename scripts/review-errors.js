#!/usr/bin/env node
/**
 * ERROR REVIEW HELPER
 * Quick script to review and analyze API errors
 * 
 * Usage:
 *   node scripts/review-errors.js                    # Last 24 hours
 *   node scripts/review-errors.js --days 7           # Last 7 days
 *   node scripts/review-errors.js --failed-only      # Only failed jobs
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification';

async function main() {
  // Parse args
  const args = process.argv.slice(2);
  const days = args.includes('--days') 
    ? parseInt(args[args.indexOf('--days') + 1]) 
    : 1;
  const failedOnly = args.includes('--failed-only');

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║              ERROR REVIEW - CATALOG VERIFICATION              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Connect to MongoDB
  console.log(`📊 Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  console.log(`📅 Analyzing errors from: ${cutoffDate.toISOString()}`);
  console.log(`⏱️  Time range: Last ${days} day(s)\n`);

  // ==========================================
  // 1. VERIFICATION JOBS SUMMARY
  // ==========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 VERIFICATION JOBS SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const VerificationJob = mongoose.model('VerificationJob', new mongoose.Schema({}, { 
    collection: 'verification_jobs',
    strict: false 
  }));

  const jobStats = await VerificationJob.aggregate([
    { $match: { createdAt: { $gte: cutoffDate } } },
    { $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProcessingTime: { $avg: '$processingTimeMs' }
    }},
    { $sort: { count: -1 } }
  ]);

  const totalJobs = jobStats.reduce((sum, s) => sum + s.count, 0);
  const failedJobs = jobStats.find(s => s._id === 'failed')?.count || 0;
  const errorRate = totalJobs > 0 ? ((failedJobs / totalJobs) * 100).toFixed(2) : 0;

  console.log(`Total Jobs: ${totalJobs}`);
  jobStats.forEach(stat => {
    const icon = stat._id === 'completed' ? '✅' : stat._id === 'failed' ? '❌' : '⏳';
    const avgTime = stat.avgProcessingTime ? `(avg: ${Math.round(stat.avgProcessingTime)}ms)` : '';
    console.log(`  ${icon} ${stat._id}: ${stat.count} ${avgTime}`);
  });
  console.log(`\n🎯 Error Rate: ${errorRate}%\n`);

  // ==========================================
  // 2. FAILED JOBS DETAILS
  // ==========================================
  if (failedJobs > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ FAILED JOBS (Detailed)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const failedJobDetails = await VerificationJob.find({
      status: 'failed',
      createdAt: { $gte: cutoffDate }
    })
    .select('jobId sfCatalogId sfCatalogName error createdAt processingTimeMs')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

    failedJobDetails.forEach((job, i) => {
      console.log(`${i + 1}. Job: ${job.jobId}`);
      console.log(`   SF Catalog ID: ${job.sfCatalogId}`);
      console.log(`   Model Number: ${job.sfCatalogName || 'N/A'}`);
      console.log(`   Error: ${job.error || 'No error message'}`);
      console.log(`   Time: ${new Date(job.createdAt).toLocaleString()}`);
      console.log(`   Processing: ${job.processingTimeMs || 'N/A'}ms\n`);
    });

    if (failedJobDetails.length === 20) {
      console.log(`   ... (showing first 20 of ${failedJobs} failed jobs)\n`);
    }
  }

  // ==========================================
  // 3. API TRACKER ANALYTICS (if exists)
  // ==========================================
  const APITracker = mongoose.model('APITracker', new mongoose.Schema({}, { 
    collection: 'api_trackers',
    strict: false 
  }));

  const trackerCount = await APITracker.countDocuments();

  if (trackerCount > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 API TRACKER ANALYTICS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Error breakdown by type
    const errorTypes = await APITracker.aggregate([
      { $match: { 
          requestTimestamp: { $gte: cutoffDate },
          overallStatus: 'failed'
      }},
      { $unwind: { path: '$issues', preserveNullAndEmptyArrays: true } },
      { $group: {
          _id: '$issues.type',
          count: { $sum: 1 },
          examples: { $push: '$issues.description' }
      }},
      { $sort: { count: -1 } }
    ]);

    if (errorTypes.length > 0) {
      console.log('Error Types:');
      errorTypes.forEach(et => {
        console.log(`  • ${et._id || 'unknown'}: ${et.count}`);
        if (et.examples && et.examples.length > 0) {
          console.log(`    Example: "${et.examples[0].substring(0, 80)}..."`);
        }
      });
      console.log('');
    }

    // AI Provider Comparison
    const aiComparison = await APITracker.aggregate([
      { $match: { requestTimestamp: { $gte: cutoffDate } } },
      { $group: {
          _id: null,
          openaiSuccess: { $sum: { $cond: ['$openaiResult.success', 1, 0] } },
          openaiFailure: { $sum: { $cond: [{ $not: '$openaiResult.success' }, 1, 0] } },
          xaiSuccess: { $sum: { $cond: ['$xaiResult.success', 1, 0] } },
          xaiFailure: { $sum: { $cond: [{ $not: '$xaiResult.success' }, 1, 0] } }
      }}
    ]);

    if (aiComparison.length > 0) {
      const ai = aiComparison[0];
      console.log('AI Provider Performance:');
      console.log(`  OpenAI:  ✅ ${ai.openaiSuccess || 0} success | ❌ ${ai.openaiFailure || 0} failed`);
      console.log(`  xAI:     ✅ ${ai.xaiSuccess || 0} success | ❌ ${ai.xaiFailure || 0} failed\n`);
    }
  } else {
    console.log('\n⚠️  No API tracker data found (collection may be empty)\n');
  }

  // ==========================================
  // 4. ERROR PATTERNS
  // ==========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 ERROR PATTERNS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Group errors by message
  const errorPatterns = await VerificationJob.aggregate([
    { $match: { 
        status: 'failed',
        createdAt: { $gte: cutoffDate }
    }},
    { $group: {
        _id: '$error',
        count: { $sum: 1 },
        examples: { $push: { jobId: '$jobId', model: '$sfCatalogName' } }
    }},
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  if (errorPatterns.length > 0) {
    console.log('Most Common Errors:');
    errorPatterns.forEach((pattern, i) => {
      console.log(`\n${i + 1}. Count: ${pattern.count}`);
      console.log(`   Message: ${pattern._id || 'No error message'}`);
      console.log(`   Examples: ${pattern.examples.slice(0, 2).map(e => e.model).join(', ')}`);
    });
    console.log('');
  } else {
    console.log('✅ No error patterns found (no failures)\n');
  }

  // ==========================================
  // 5. RECOMMENDATIONS
  // ==========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 RECOMMENDATIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (errorRate > 5) {
    console.log('⚠️  Error rate is above 5% - investigate top error patterns');
  }
  
  if (failedJobs > 0) {
    console.log('📝 Review failed job details above for common issues');
    console.log('🔄 Consider replaying failed jobs after fixes');
    console.log('📊 Check logs/error.log for detailed stack traces');
  }

  if (errorRate < 2) {
    console.log('✅ Error rate is healthy (<2%)');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Cleanup
  await mongoose.disconnect();
  console.log('✅ Done!\n');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
