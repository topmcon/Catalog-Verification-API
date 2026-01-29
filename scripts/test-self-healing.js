#!/usr/bin/env node
/**
 * Test Self-Healing System on Recent Jobs
 * 
 * This script will:
 * 1. Connect to production MongoDB
 * 2. Trigger self-healing on the 5 recent failed jobs
 * 3. Monitor progress and results
 */

const mongoose = require('mongoose');

// Connect to production MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

async function testSelfHealing() {
  try {
    console.log('🔧 SELF-HEALING SYSTEM TEST\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    // Import orchestrator
    const orchestrator = require('../dist/services/self-healing/orchestrator.service').default;

    // Test jobs (from our 5 recent jobs)
    const testJobs = [
      {
        id: '61585327-fd63-4dcc-a9a3-327f169a2803',
        name: 'Job 2 - Crashed Verification (response = null)'
      },
      {
        id: '42dcac6c-f161-4a21-8d78-4798d3091b1d',
        name: 'Job 3 - Crashed Verification'
      }
    ];

    console.log(`Testing self-healing on ${testJobs.length} jobs...\n`);

    for (const job of testJobs) {
      console.log('='.repeat(70));
      console.log(`🔧 TESTING: ${job.name}`);
      console.log(`   Job ID: ${job.id}`);
      console.log('='.repeat(70));

      const startTime = Date.now();

      try {
        const result = await orchestrator.runCompleteSelfHealing(job.id);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n✅ SELF-HEALING COMPLETED');
        console.log(`   Duration: ${duration}s`);
        console.log(`   Success: ${result.success}`);
        console.log(`   Phase: ${result.phase}`);
        console.log(`   Consensus Achieved: ${result.consensusAchieved || false}`);
        console.log(`   Attempts Taken: ${result.attemptsTaken || 'N/A'}`);
        console.log(`   SF Correction Sent: ${result.sfCorrectionSent || false}`);
        console.log(`   Escalated to Human: ${result.escalatedToHuman || false}`);

        if (result.reason) {
          console.log(`   Reason: ${result.reason}`);
        }

        console.log('\n📊 FULL RESULT:');
        console.log(JSON.stringify(result, null, 2));

      } catch (error) {
        console.error(`\n❌ ERROR during self-healing:`);
        console.error(error);
      }

      console.log('\n' + '='.repeat(70) + '\n');

      // Wait 5 seconds between jobs
      if (testJobs.indexOf(job) < testJobs.length - 1) {
        console.log('⏳ Waiting 5 seconds before next job...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log('\n✅ ALL TESTS COMPLETE\n');

    // Query self-healing logs
    console.log('📋 QUERYING SELF-HEALING LOGS...\n');
    
    const SelfHealingLog = mongoose.model('SelfHealingLog', new mongoose.Schema({}, { strict: false }), 'self_healing_logs');
    
    const logs = await SelfHealingLog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    if (logs.length > 0) {
      console.log(`Found ${logs.length} recent self-healing logs:\n`);
      
      logs.forEach((log, i) => {
        console.log(`${i + 1}. Job ${log.jobId}`);
        console.log(`   Created: ${log.createdAt}`);
        console.log(`   Consensus: ${log.consensusAchieved ? '✅' : '❌'}`);
        console.log(`   Outcome: ${log.finalOutcome}`);
        console.log(`   Attempts: ${log.attemptsTaken || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('No self-healing logs found yet.\n');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');

  } catch (error) {
    console.error('Fatal error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  testSelfHealing();
}

module.exports = { testSelfHealing };
