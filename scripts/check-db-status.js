#!/usr/bin/env node

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

async function checkDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    
    console.log('=== DATABASE STATUS ===\n');
    
    const jobCount = await db.collection('verificationjobs').countDocuments();
    const aiUsageCount = await db.collection('aiusages').countDocuments();
    const healingCount = await db.collection('selfhealingtrackers').countDocuments();
    
    console.log('Collection Counts:');
    console.log(`  VerificationJobs:    ${jobCount}`);
    console.log(`  AIUsage:             ${aiUsageCount}`);
    console.log(`  SelfHealingTracker:  ${healingCount}\n`);
    
    if (jobCount > 0) {
      console.log('Recent verification jobs:');
      const recentJobs = await db.collection('verificationjobs')
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .project({ jobId: 1, status: 1, createdAt: 1 })
        .toArray();
      
      recentJobs.forEach(job => {
        console.log(`  - ${job.jobId} [${job.status}] ${job.createdAt}`);
      });
      console.log('');
    }
    
    console.log('All collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach(c => console.log(`  - ${c.name}`));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
