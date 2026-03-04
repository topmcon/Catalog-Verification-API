#!/usr/bin/env node
/**
 * Live Batch Monitor - Real-time monitoring of Salesforce verification batch jobs
 * Captures errors, NOT APPLICABLE responses, blanks, and all issues
 */

const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/catalog-verification';
let lastCheckedTime = new Date();
let totalProcessed = 0;
let errorCount = 0;
let notApplicableCount = 0;
let blankCount = 0;
let successCount = 0;

// Connect to MongoDB
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('🔌 Connected to MongoDB');
    console.log('👀 Monitoring incoming verification requests...\n');
    console.log('=' .repeat(80));
    startMonitoring();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

const JobSchema = new mongoose.Schema({}, { strict: false, collection: 'verificationjobs' });
const Job = mongoose.model('Job', JobSchema);

function categorizeJob(job) {
  const verifiedData = job.verifiedData || {};
  const issues = [];
  let category = '✅ SUCCESS';

  // Check for errors
  if (job.error || job.status === 'failed') {
    errorCount++;
    category = '❌ ERROR';
    issues.push(`ERROR: ${job.error || 'Unknown error'}`);
  }

  // Check for NOT APPLICABLE
  if (verifiedData.brand_verified === 'NOT APPLICABLE') {
    notApplicableCount++;
    category = '⚠️  NOT APPLICABLE';
    issues.push('Brand: NOT APPLICABLE');
  }
  if (verifiedData.category_verified === 'NOT APPLICABLE') {
    notApplicableCount++;
    category = '⚠️  NOT APPLICABLE';
    issues.push('Category: NOT APPLICABLE');
  }

  // Check for blanks/nulls
  if (!verifiedData.brand_verified || verifiedData.brand_verified === '') {
    blankCount++;
    category = '⚠️  BLANK/NULL';
    issues.push('Brand: BLANK');
  }
  if (!verifiedData.category_verified || verifiedData.category_verified === '') {
    blankCount++;
    category = '⚠️  BLANK/NULL';
    issues.push('Category: BLANK');
  }

  if (issues.length === 0 && job.status === 'completed') {
    successCount++;
  }

  return { category, issues };
}

async function startMonitoring() {
  setInterval(async () => {
    try {
      // Get jobs since last check
      const newJobs = await Job.find({
        receivedAt: { $gt: lastCheckedTime }
      }).sort({ receivedAt: 1 });

      if (newJobs.length > 0) {
        for (const job of newJobs) {
          totalProcessed++;
          const { category, issues } = categorizeJob(job);
          const product = job.payload?.Product_Name || 'N/A';
          const time = new Date(job.receivedAt).toLocaleTimeString();
          const jobId = job.jobId || job._id.toString().substring(0, 8);

          console.log(`\n[${totalProcessed}] ${category} - ${time}`);
          console.log(`    ID: ${jobId}`);
          console.log(`    Product: ${product.substring(0, 70)}`);
          
          if (job.verifiedData) {
            console.log(`    Brand: ${job.verifiedData.brand_verified || 'N/A'}`);
            console.log(`    Category: ${job.verifiedData.category_verified || 'N/A'}`);
            console.log(`    Status: ${job.status || 'unknown'}`);
          }

          if (issues.length > 0) {
            console.log(`    ⚠️  Issues:`);
            issues.forEach(issue => console.log(`       - ${issue}`));
          }

          console.log('-'.repeat(80));
        }

        // Update last checked time
        lastCheckedTime = newJobs[newJobs.length - 1].receivedAt;

        // Print summary
        console.log(`\n📊 RUNNING TOTALS:`);
        console.log(`    Total: ${totalProcessed} | ✅ Success: ${successCount} | ❌ Errors: ${errorCount}`);
        console.log(`    ⚠️  NOT APPLICABLE: ${notApplicableCount} | ⚠️  BLANK/NULL: ${blankCount}`);
        console.log('=' .repeat(80));
      }
    } catch (err) {
      console.error('❌ Monitoring error:', err.message);
    }
  }, 2000); // Check every 2 seconds
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n📊 FINAL SUMMARY:');
  console.log(`Total Processed: ${totalProcessed}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`⚠️  NOT APPLICABLE: ${notApplicableCount}`);
  console.log(`⚠️  BLANK/NULL: ${blankCount}`);
  mongoose.connection.close();
  process.exit(0);
});
