#!/usr/bin/env node
/**
 * Inspect completed jobs to see what's wrong
 */

const mongoose = require('mongoose');
require('dotenv').config();

const VerificationJob = require('../dist/models/verification-job.model').VerificationJob;

async function inspect() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification';
  
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    const jobs = await VerificationJob.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    
    for (const job of jobs) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`Job: ${job.sfCatalogName} (${job.jobId})`);
      console.log(`Status: ${job.status}`);
      console.log(`Created: ${job.createdAt}`);
      console.log(`Updated: ${job.updatedAt}`);
      console.log(`Error: ${job.errorMessage || '(none)'}`);
      console.log(`\nResponse Object:`);
      console.log(JSON.stringify(job.response, null, 2));
      console.log(`\nPrimary Attributes:`);
      console.log(JSON.stringify(job.response?.Primary_Attributes, null, 2));
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

inspect();
