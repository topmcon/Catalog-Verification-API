#!/usr/bin/env node
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
    
    const Job = mongoose.model('Job', new mongoose.Schema({}, { strict: false, collection: 'verification_jobs' }));
    
    // Get most recent job and print full structure
    const recentJob = await Job.findOne({}).sort({ createdAt: -1, _id: -1 });
    
    console.log('\n=== MOST RECENT JOB STRUCTURE ===\n');
    console.log(JSON.stringify(recentJob, null, 2));
    
    console.log('\n\n=== FIELD SUMMARY ===');
    if (recentJob) {
      Object.keys(recentJob.toObject()).forEach(key => {
        console.log(`  ${key}: ${typeof recentJob[key]}`);
      });
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
