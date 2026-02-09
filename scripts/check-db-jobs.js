#!/usr/bin/env node
/**
 * Quick check: How many verification jobs are in the database?
 */

const mongoose = require('mongoose');
require('dotenv').config();

const VerificationJob = require('../dist/models/verification-job.model').VerificationJob;

async function checkJobs() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification';
  
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    const total = await VerificationJob.countDocuments();
    const completed = await VerificationJob.countDocuments({ status: 'completed' });
    const failed = await VerificationJob.countDocuments({ status: 'failed' });
    const pending = await VerificationJob.countDocuments({ status: 'pending' });
    
    console.log(`Total verification jobs: ${total}`);
    console.log(`  Completed: ${completed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Pending: ${pending}`);
    
    if (completed > 0) {
      console.log('\n📋 Last 10 completed jobs:');
      const recent = await VerificationJob.find({ status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('jobId sfCatalogId sfCatalogName createdAt')
        .lean();
      
      recent.forEach((job, i) => {
        const name = job.sfCatalogName?.substring(0, 40) || 'Unknown';
        const date = new Date(job.createdAt).toLocaleString();
        console.log(`  ${i + 1}. ${job.sfCatalogId} | ${name} | ${date}`);
      });
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkJobs();
