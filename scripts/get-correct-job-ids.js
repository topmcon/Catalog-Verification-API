#!/usr/bin/env node
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
    
    const Job = mongoose.model('Job', new mongoose.Schema({}, { strict: false, collection: 'verification_jobs' }));
    
    // Get last 99 jobs and find the ones with issues
    const last99 = await Job.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(99);
    
    const problemJobs = [];
    
    last99.forEach((job, idx) => {
      const primary = job.result?.Primary_Attributes;
      const aiReview = job.result?.AI_Review;
      
      if (!primary || aiReview?.openai?.result === 'error' || aiReview?.xai?.result === 'error') {
        problemJobs.push({
          position: idx + 1,
          jobId: job.jobId,
          model: job.sfCatalogName,
          hasData: !!primary
        });
      }
    });
    
    console.log('\n=== PROBLEM JOBS WITH CORRECT JOB IDS ===\n');
    problemJobs.forEach(job => {
      console.log(`[${job.position}] ${job.model}`);
      console.log(`    Job ID: ${job.jobId}`);
      console.log(`    Has Data: ${job.hasData ? 'YES (partial)' : 'NO (empty)'}`);
      console.log('');
    });
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
