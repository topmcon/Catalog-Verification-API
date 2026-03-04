#!/usr/bin/env node
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
    
    const Job = mongoose.model('Job', new mongoose.Schema({}, { strict: false, collection: 'verification_jobs' }));
    
    // Find jobs with missing Primary_Attributes
    const blankJobs = await Job.find({
      status: 'completed',
      'result.Primary_Attributes': { $exists: false }
    }).sort({ createdAt: -1 }).limit(5);
    
    console.log('\n=== JOBS WITH MISSING PRIMARY_ATTRIBUTES ===\n');
    console.log(`Found: ${blankJobs.length} jobs\n`);
    
    for (const job of blankJobs) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Job ID: ${job.jobId}`);
      console.log(`Model: ${job.sfCatalogName}`);
      console.log(`Status: ${job.status}`);
      console.log(`Created: ${job.createdAt}`);
      console.log(`Completed: ${job.completedAt}`);
      console.log(`Processing Time: ${job.processingTimeMs}ms`);
      console.log(`\nResult structure:`);
      console.log(JSON.stringify(job.result, null, 2).substring(0, 1000));
      console.log('\n...');
    }
    
    // Count how many have this issue
    const totalBlank = await Job.countDocuments({
      status: 'completed',
      'result.Primary_Attributes': { $exists: false }
    });
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Total completed jobs with missing Primary_Attributes: ${totalBlank}`);
    console.log('='.repeat(80));
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
