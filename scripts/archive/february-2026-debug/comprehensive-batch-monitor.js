#!/usr/bin/env node
/**
 * Comprehensive Batch Monitor - Real-time auditing of Salesforce verification batch
 * Tracks ALL issues: errors, NOT APPLICABLE, blanks, nulls, and data quality
 */

const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/catalog-verification';
let lastCheckedTime = new Date();
let totalProcessed = 0;

const stats = {
  errors: 0,
  brandNotApplicable: 0,
  categoryNotApplicable: 0,
  styleNotApplicable: 0,
  brandBlank: 0,
  categoryBlank: 0,
  styleBlank: 0,
  weightBlank: 0,
  titleBlank: 0,
  success: 0,
  processing: 0
};

const issueLog = [];

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('🔌 Connected to MongoDB - catalog-verification');
    console.log('👀 Monitoring real-time verification batch from Salesforce...\n');
    console.log('=' .repeat(90));
    console.log('⚠️  CAPTURING: Errors, NOT APPLICABLE, Blanks/Nulls, and all data quality issues');
    console.log('=' .repeat(90));
    startMonitoring();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

const JobSchema = new mongoose.Schema({}, { strict: false, collection: 'verification_jobs' });
const Job = mongoose.model('Job', JobSchema);

function analyzeJob(job) {
  const issues = [];
  let category = '✅ SUCCESS';
  const primary = job.result?.Primary_Attributes || {};

  // Check for processing
  if (job.status === 'processing') {
    stats.processing++;
    return { category: '⚙️  PROCESSING', issues: ['Still being verified'] };
  }

  // Check for errors/failures
  if (job.status === 'failed' || job.error) {
    stats.errors++;
    category = '❌ ERROR';
    issues.push(`ERROR: ${job.error || 'Unknown failure'}`);
  }

  // Check Brand
  if (primary.AI_Brand === 'NOT APPLICABLE') {
    stats.brandNotApplicable++;
    category = '⚠️  NOT APPLICABLE';
    issues.push('Brand: NOT APPLICABLE');
  } else if (!primary.AI_Brand || primary.AI_Brand === '') {
    stats.brandBlank++;
    category = '⚠️  BLANK';
    issues.push('Brand: BLANK/NULL');
  }

  // Check Category
  if (primary.AI_Product_Category === 'NOT APPLICABLE') {
    stats.categoryNotApplicable++;
    category = '⚠️  NOT APPLICABLE';
    issues.push('Category: NOT APPLICABLE');
  } else if (!primary.AI_Product_Category || primary.AI_Product_Category === '') {
    stats.categoryBlank++;
    category = '⚠️  BLANK';
    issues.push('Category: BLANK/NULL');
  }

  // Check Style
  if (primary.AI_Style === 'NOT APPLICABLE' || primary.AI_Style === 'Not Applicable') {
    stats.styleNotApplicable++;
    // Don't flag as issue - this can be valid
  } else if (!primary.AI_Style || primary.AI_Style === '') {
    stats.styleBlank++;
    category = '⚠️  BLANK';
    issues.push('Style: BLANK/NULL');
  }

  // Check Weight
  if (!primary.AI_Weight || primary.AI_Weight === '') {
    stats.weightBlank++;
    if (category === '✅ SUCCESS') category = '⚠️  BLANK';
    issues.push('Weight: BLANK/NULL');
  }

  // Check Title
  if (!primary.AI_Product_Title || primary.AI_Product_Title === '') {
    stats.titleBlank++;
    if (category === '✅ SUCCESS') category = '⚠️  BLANK';
    issues.push('Title: BLANK/NULL');
  }

  if (issues.length === 0 && job.status === 'completed') {
    stats.success++;
  }

  return { category, issues };
}

async function startMonitoring() {
  setInterval(async () => {
    try {
      const newJobs = await Job.find({
        createdAt: { $gt: lastCheckedTime }
      }).sort({ createdAt: 1 });

      if (newJobs.length > 0) {
        for (const job of newJobs) {
          totalProcessed++;
          const { category, issues } = analyzeJob(job);
          const model = job.sfCatalogName || job.rawPayload?.Model_Number || 'N/A';
          const time = new Date(job.createdAt).toLocaleTimeString();
          const jobId = job.jobId?.substring(0, 12) || job._id.toString().substring(0, 8);
          const primary = job.result?.Primary_Attributes || {};

          console.log(`\n┌${'─'.repeat(88)}┐`);
          console.log(`│ [${totalProcessed}] ${category} - ${time}`.padEnd(89) + '│');
          console.log(`├${'─'.repeat(88)}┤`);
          console.log(`│ Job ID: ${jobId}`.padEnd(89) + '│');
          console.log(`│ Model: ${model.substring(0, 70)}`.padEnd(89) + '│');
          console.log(`│ Status: ${job.status || 'unknown'}`.padEnd(89) + '│');

          if (job.status === 'completed' && primary) {
            console.log(`├${'─'.repeat(88)}┤`);
            console.log(`│ VERIFIED DATA:`.padEnd(89) + '│');
            console.log(`│   Brand: ${(primary.AI_Brand || '❌ MISSING').substring(0, 70)}`.padEnd(89) + '│');
            console.log(`│   Category: ${(primary.AI_Product_Category || '❌ MISSING').substring(0, 67)}`.padEnd(89) + '│');
            console.log(`│   Style: ${(primary.AI_Style || '❌ MISSING').substring(0, 69)}`.padEnd(89) + '│');
            console.log(`│   Type: ${(primary.AI_Type || '❌ MISSING').substring(0, 70)}`.padEnd(89) + '│');
            console.log(`│   Weight: ${(primary.AI_Weight || '❌ MISSING').substring(0, 68)}`.padEnd(89) + '│');
            console.log(`│   Title: ${(primary.AI_Product_Title || '❌ MISSING').substring(0, 69)}`.padEnd(89) + '│');
          }

          if (issues.length > 0) {
            console.log(`├${'─'.repeat(88)}┤`);
            console.log(`│ ⚠️  ISSUES DETECTED:`.padEnd(89) + '│');
            issues.forEach(issue => {
              console.log(`│   • ${issue}`.padEnd(89) + '│');
            });

            // Log to issue array
            issueLog.push({
              jobId,
              model,
              time,
              category,
              issues: issues.join('; ')
            });
          }

          console.log(`└${'─'.repeat(88)}┘`);
        }

        lastCheckedTime = newJobs[newJobs.length - 1].createdAt;

        // Print running totals
        printStats();
      }
    } catch (err) {
      console.error('\n❌ Monitoring error:', err.message);
    }
  }, 2000); // Check every 2 seconds
}

function printStats() {
  console.log(`\n${'='.repeat(90)}`);
  console.log('📊 RUNNING STATISTICS');
  console.log('='.repeat(90));
  console.log(`Total Processed: ${totalProcessed}`);
  console.log(`  ✅ Success: ${stats.success}`);
  console.log(`  ⚙️  Processing: ${stats.processing}`);
  console.log(`  ❌ Errors: ${stats.errors}`);
  console.log(`  ⚠️  Brand NOT APPLICABLE: ${stats.brandNotApplicable}`);
  console.log(`  ⚠️  Category NOT APPLICABLE: ${stats.categoryNotApplicable}`);
  console.log(`  ⚠️  Style NOT APPLICABLE: ${stats.styleNotApplicable} (may be valid)`);
  console.log(`  ⚠️  Brand BLANK: ${stats.brandBlank}`);
  console.log(`  ⚠️  Category BLANK: ${stats.categoryBlank}`);
  console.log(`  ⚠️  Style BLANK: ${stats.styleBlank}`);
  console.log(`  ⚠️  Weight BLANK: ${stats.weightBlank}`);
  console.log(`  ⚠️  Title BLANK: ${stats.titleBlank}`);
  console.log(`\nIssues Logged: ${issueLog.length}`);
  console.log('='.repeat(90));
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n' + '='.repeat(90));
  console.log('📊 FINAL BATCH AUDIT SUMMARY');
  console.log('='.repeat(90));
  printStats();

  if (issueLog.length > 0) {
    console.log(`\n${'='.repeat(90)}`);
    console.log('🔍 ISSUES LOG (For troubleshooting)');
    console.log('='.repeat(90));
    issueLog.slice(0, 50).forEach((item, i) => {
      console.log(`\n[${i + 1}] ${item.model} - ${item.time}`);
      console.log(`    Job: ${item.jobId} | Status: ${item.category}`);
      console.log(`    Issues: ${item.issues}`);
    });
    if (issueLog.length > 50) {
      console.log(`\n... and ${issueLog.length - 50} more issues`);
    }
  }

  console.log('\n' + '='.repeat(90));
  mongoose.connection.close();
  process.exit(0);
});
