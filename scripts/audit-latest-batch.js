#!/usr/bin/env node
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
    
    const Job = mongoose.model('Job', new mongoose.Schema({}, { strict: false, collection: 'verification_jobs' }));
    
    // Get last 99 jobs
    const last99 = await Job.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(99);
    
    console.log('\n' + '='.repeat(90));
    console.log('🔍 AUDIT OF LATEST BATCH (Last 99 Completed Jobs)');
    console.log('='.repeat(90));
    
    let clean = 0;
    let blankData = 0;
    let aiErrors = 0;
    let noImages = 0;
    const problemJobs = [];
    
    last99.forEach((job, idx) => {
      const primary = job.result?.Primary_Attributes;
      const aiReview = job.result?.AI_Review;
      const imageCount = job.result?.Media?.Image_Count || 0;
      
      let hasIssue = false;
      const issues = [];
      
      // Check if Primary_Attributes exists
      if (!primary) {
        blankData++;
        hasIssue = true;
        issues.push('NO PRIMARY_ATTRIBUTES');
      }
      
      // Check AI review errors
      if (aiReview?.openai?.result === 'error' || aiReview?.xai?.result === 'error') {
        aiErrors++;
        hasIssue = true;
        issues.push(`AI_ERROR: ${aiReview.openai?.error_message || aiReview.xai?.error_message || 'Unknown'}`);
      }
      
      // Check images
      if (imageCount === 0) {
        noImages++;
        hasIssue = true;
        issues.push('NO_IMAGES');
      }
      
      if (hasIssue) {
        problemJobs.push({
          num: idx + 1,
          jobId: job.jobId.substring(0, 12),
          model: job.sfCatalogName,
          issues: issues.join(', '),
          processingTime: job.processingTimeMs
        });
      } else {
        clean++;
      }
    });
    
    console.log('\n📊 SUMMARY:\n');
    console.log(`  Total Jobs Analyzed: ${last99.length}`);
    console.log(`  ✅ Clean/Valid Results: ${clean} (${((clean/99)*100).toFixed(1)}%)`);
    console.log(`  ❌ Jobs with Blank Data: ${blankData} (${((blankData/99)*100).toFixed(1)}%)`);
    console.log(`  ⚠️  Jobs with AI Errors: ${aiErrors} (${((aiErrors/99)*100).toFixed(1)}%)`);
    console.log(`  📷 Jobs with No Images: ${noImages} (${((noImages/99)*100).toFixed(1)}%)`);
    
    if (problemJobs.length > 0) {
      console.log(`\n${'─'.repeat(90)}`);
      console.log(`❌ PROBLEM JOBS (${problemJobs.length} items):`);
      console.log('─'.repeat(90));
      
      problemJobs.slice(0, 30).forEach(job => {
        console.log(`\n  [${job.num}] ${job.model} (Job: ${job.jobId})`);
        console.log(`      Issues: ${job.issues}`);
        console.log(`      Processing Time: ${job.processingTime}ms`);
      });
      
      if (problemJobs.length > 30) {
        console.log(`\n  ... and ${problemJobs.length - 30} more problem jobs`);
      }
    }
    
    console.log(`\n${'='.repeat(90)}\n`);
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
