#!/usr/bin/env node
/**
 * Quick check of verification job status counts
 */
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/catalog-verification';

async function checkJobStatus() {
  try {
    await mongoose.connect(MONGO_URI);
    
    const VerificationJob = mongoose.model('VerificationJob', new mongoose.Schema({}, {
      strict: false,
      collection: 'verification_jobs'
    }));
    
    const counts = await VerificationJob.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n📊 Verification Job Status Counts:');
    counts.forEach(c => console.log(`   ${c._id || 'null'}: ${c.count}`));
    console.log('');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkJobStatus();
