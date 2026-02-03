#!/usr/bin/env node
/**
 * SESSION ANALYTICS DASHBOARD
 * ============================
 * Shows comprehensive analytics since the last "Establish Connection"
 * Used by "Establish Connection" procedure to monitor system activity.
 * 
 * Displays:
 * - API call statistics from Salesforce
 * - Webhook delivery success rates
 * - Job processing metrics
 * - Self-healing activity and outcomes
 * - Error patterns and trends
 * - System performance metrics
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';
const LAST_CONNECTION_FILE = '/tmp/last_establish_connection.timestamp';

// How far back to look if no previous connection timestamp (default: 24 hours)
const DEFAULT_LOOKBACK_HOURS = 24;

async function getSessionAnalytics() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Determine time window
    let sinceTime;
    let timeWindowLabel;
    
    if (fs.existsSync(LAST_CONNECTION_FILE)) {
      const lastTimestamp = fs.readFileSync(LAST_CONNECTION_FILE, 'utf8').trim();
      sinceTime = new Date(lastTimestamp);
      const now = new Date();
      const diffMs = now - sinceTime;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        timeWindowLabel = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        timeWindowLabel = `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
      } else {
        timeWindowLabel = `${diffMins} minute${diffMins > 1 ? 's' : ''}`;
      }
    } else {
      sinceTime = new Date(Date.now() - DEFAULT_LOOKBACK_HOURS * 60 * 60 * 1000);
      timeWindowLabel = `${DEFAULT_LOOKBACK_HOURS} hours (no previous connection found)`;
    }
    
    const estSinceTime = sinceTime.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'medium',
      timeStyle: 'long'
    });
    
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║              📊 SESSION ANALYTICS DASHBOARD                  ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📅 Reporting Period: Last ${timeWindowLabel}`);
    console.log(`🕐 Since: ${estSinceTime}`);
    console.log('');
    
    // Define models
    const VerificationJob = mongoose.model(
      'VerificationJob',
      new mongoose.Schema({}, { strict: false, collection: 'verification_jobs' })
    );
    
    const SelfHealingLog = mongoose.model(
      'SelfHealingLog',
      new mongoose.Schema({}, { strict: false, collection: 'selfhealinglogs' })
    );
    
    const APITracker = mongoose.model(
      'APITracker',
      new mongoose.Schema({}, { strict: false, collection: 'api_trackers' })
    );
    
    // ========================================
    // 1. VERIFICATION JOB STATISTICS
    // ========================================
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('              🔄 VERIFICATION JOB STATISTICS');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const totalJobs = await VerificationJob.countDocuments({ createdAt: { $gte: sinceTime } });
    const pendingJobs = await VerificationJob.countDocuments({ status: 'pending', createdAt: { $gte: sinceTime } });
    const processingJobs = await VerificationJob.countDocuments({ status: 'processing', createdAt: { $gte: sinceTime } });
    const completedJobs = await VerificationJob.countDocuments({ status: 'completed', createdAt: { $gte: sinceTime } });
    const failedJobs = await VerificationJob.countDocuments({ status: 'failed', createdAt: { $gte: sinceTime } });
    
    console.log('');
    console.log(`📥 Total API Calls from Salesforce: ${totalJobs}`);
    console.log('');
    console.log('   Status Breakdown:');
    console.log(`   ⏳ Pending:     ${pendingJobs} (${totalJobs > 0 ? ((pendingJobs/totalJobs)*100).toFixed(1) : 0}%)`);
    console.log(`   ⚙️  Processing:  ${processingJobs} (${totalJobs > 0 ? ((processingJobs/totalJobs)*100).toFixed(1) : 0}%)`);
    console.log(`   ✅ Completed:   ${completedJobs} (${totalJobs > 0 ? ((completedJobs/totalJobs)*100).toFixed(1) : 0}%)`);
    console.log(`   ❌ Failed:      ${failedJobs} (${totalJobs > 0 ? ((failedJobs/totalJobs)*100).toFixed(1) : 0}%)`);
    
    // Average processing time
    const processingTimes = await VerificationJob.find({
      createdAt: { $gte: sinceTime },
      processingTimeMs: { $exists: true, $ne: null }
    }).select('processingTimeMs').lean();
    
    if (processingTimes.length > 0) {
      const avgTime = processingTimes.reduce((sum, job) => sum + (job.processingTimeMs || 0), 0) / processingTimes.length;
      const maxTime = Math.max(...processingTimes.map(j => j.processingTimeMs || 0));
      const minTime = Math.min(...processingTimes.map(j => j.processingTimeMs || 0));
      
      console.log('');
      console.log('   ⏱️  Processing Times:');
      console.log(`   Average: ${(avgTime / 1000).toFixed(2)}s`);
      console.log(`   Fastest: ${(minTime / 1000).toFixed(2)}s`);
      console.log(`   Slowest: ${(maxTime / 1000).toFixed(2)}s`);
    }
    
    // ========================================
    // 2. WEBHOOK DELIVERY STATISTICS
    // ========================================
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('              📤 WEBHOOK DELIVERY TO SALESFORCE');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const webhookAttempted = await VerificationJob.countDocuments({
      createdAt: { $gte: sinceTime },
      webhookAttempts: { $gt: 0 }
    });
    
    const webhookSucceeded = await VerificationJob.countDocuments({
      createdAt: { $gte: sinceTime },
      webhookSuccess: true
    });
    
    const webhookFailed = await VerificationJob.countDocuments({
      createdAt: { $gte: sinceTime },
      webhookSuccess: false,
      webhookAttempts: { $gt: 0 }
    });
    
    const sfAcknowledged = await VerificationJob.countDocuments({
      createdAt: { $gte: sinceTime },
      salesforceAcknowledged: true
    });
    
    const sfProcessed = await VerificationJob.countDocuments({
      createdAt: { $gte: sinceTime },
      salesforceProcessed: true
    });
    
    console.log('');
    console.log(`📡 Webhooks Sent: ${webhookAttempted}`);
    console.log(`   ✅ Delivered Successfully: ${webhookSucceeded} (${webhookAttempted > 0 ? ((webhookSucceeded/webhookAttempted)*100).toFixed(1) : 0}%)`);
    console.log(`   ❌ Failed: ${webhookFailed} (${webhookAttempted > 0 ? ((webhookFailed/webhookAttempted)*100).toFixed(1) : 0}%)`);
    console.log('');
    console.log(`🔔 Salesforce Acknowledgments:`);
    console.log(`   ✅ Acknowledged by SF: ${sfAcknowledged}`);
    console.log(`   ✅ Processed by SF: ${sfProcessed}`);
    
    // Check for webhook errors
    const jobsWithWebhookErrors = await VerificationJob.find({
      createdAt: { $gte: sinceTime },
      webhookSuccess: false,
      error: { $exists: true }
    }).select('error').limit(5).lean();
    
    if (jobsWithWebhookErrors.length > 0) {
      console.log('');
      console.log('   ⚠️  Recent Webhook Errors:');
      jobsWithWebhookErrors.forEach((job, idx) => {
        const errorMsg = job.error ? job.error.substring(0, 80) : 'Unknown error';
        console.log(`   ${idx + 1}. ${errorMsg}${job.error && job.error.length > 80 ? '...' : ''}`);
      });
    }
    
    // ========================================
    // 3. SELF-HEALING SYSTEM ACTIVITY
    // ========================================
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('              🔧 SELF-HEALING SYSTEM ACTIVITY');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const totalSelfHealing = await SelfHealingLog.countDocuments({ createdAt: { $gte: sinceTime } });
    const healingSuccess = await SelfHealingLog.countDocuments({
      createdAt: { $gte: sinceTime },
      finalOutcome: 'success'
    });
    const healingFailed = await SelfHealingLog.countDocuments({
      createdAt: { $gte: sinceTime },
      finalOutcome: 'failed'
    });
    const healingEscalated = await SelfHealingLog.countDocuments({
      createdAt: { $gte: sinceTime },
      finalOutcome: 'escalated'
    });
    
    console.log('');
    console.log(`🔧 Total Self-Healing Attempts: ${totalSelfHealing}`);
    
    if (totalSelfHealing > 0) {
      console.log('');
      console.log('   Outcomes:');
      console.log(`   ✅ Successful:  ${healingSuccess} (${((healingSuccess/totalSelfHealing)*100).toFixed(1)}%)`);
      console.log(`   ❌ Failed:      ${healingFailed} (${((healingFailed/totalSelfHealing)*100).toFixed(1)}%)`);
      console.log(`   ⬆️  Escalated:  ${healingEscalated} (${((healingEscalated/totalSelfHealing)*100).toFixed(1)}%)`);
      
      // Issue type breakdown
      const selfHealingLogs = await SelfHealingLog.find({
        createdAt: { $gte: sinceTime }
      }).select('issueType').lean();
      
      if (selfHealingLogs.length > 0) {
        const issueTypes = {};
        selfHealingLogs.forEach(log => {
          const type = log.issueType || 'unknown';
          issueTypes[type] = (issueTypes[type] || 0) + 1;
        });
        
        console.log('');
        console.log('   Issues Detected:');
        Object.entries(issueTypes)
          .sort((a, b) => b[1] - a[1])
          .forEach(([type, count]) => {
            console.log(`   • ${type}: ${count}`);
          });
      }
      
      // Consensus achievement
      const consensusAchieved = await SelfHealingLog.countDocuments({
        createdAt: { $gte: sinceTime },
        consensusAchieved: true
      });
      console.log('');
      console.log(`   🤝 AI Consensus Achieved: ${consensusAchieved}/${totalSelfHealing} (${totalSelfHealing > 0 ? ((consensusAchieved/totalSelfHealing)*100).toFixed(1) : 0}%)`);
      
      // Corrections sent to SF
      const correctionsSent = await SelfHealingLog.countDocuments({
        createdAt: { $gte: sinceTime },
        sfCorrectionSent: true
      });
      console.log(`   📤 Corrections Sent to SF: ${correctionsSent}`);
    } else {
      console.log('   ℹ️  No self-healing activity in this period');
    }
    
    // ========================================
    // 4. ERROR PATTERNS & TRENDS
    // ========================================
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('              ⚠️  ERROR PATTERNS & TRENDS');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const errorJobs = await VerificationJob.find({
      createdAt: { $gte: sinceTime },
      error: { $exists: true, $ne: null }
    }).select('error').lean();
    
    if (errorJobs.length > 0) {
      console.log('');
      console.log(`❌ Jobs with Errors: ${errorJobs.length}`);
      
      // Categorize errors
      const errorCategories = {};
      errorJobs.forEach(job => {
        const errorMsg = job.error || '';
        let category = 'Other';
        
        if (errorMsg.includes('timeout')) category = 'Timeout';
        else if (errorMsg.includes('network') || errorMsg.includes('ECONNREFUSED')) category = 'Network';
        else if (errorMsg.includes('webhook')) category = 'Webhook';
        else if (errorMsg.includes('AI') || errorMsg.includes('OpenAI') || errorMsg.includes('xAI')) category = 'AI Service';
        else if (errorMsg.includes('database') || errorMsg.includes('MongoDB')) category = 'Database';
        else if (errorMsg.includes('validation')) category = 'Validation';
        
        errorCategories[category] = (errorCategories[category] || 0) + 1;
      });
      
      console.log('');
      console.log('   Error Categories:');
      Object.entries(errorCategories)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          console.log(`   • ${category}: ${count}`);
        });
      
      // Show recent errors
      console.log('');
      console.log('   Recent Error Messages (last 3):');
      errorJobs.slice(0, 3).forEach((job, idx) => {
        const errorMsg = job.error ? job.error.substring(0, 100) : 'Unknown error';
        console.log(`   ${idx + 1}. ${errorMsg}${job.error && job.error.length > 100 ? '...' : ''}`);
      });
    } else {
      console.log('');
      console.log('   ✅ No errors detected in this period!');
    }
    
    // ========================================
    // 5. SYSTEM PERFORMANCE METRICS
    // ========================================
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('              ⚡ SYSTEM PERFORMANCE METRICS');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const successRate = totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : 0;
    const webhookSuccessRate = webhookAttempted > 0 ? ((webhookSucceeded / webhookAttempted) * 100).toFixed(1) : 0;
    const healingSuccessRate = totalSelfHealing > 0 ? ((healingSuccess / totalSelfHealing) * 100).toFixed(1) : 0;
    
    console.log('');
    console.log(`   📊 Overall Success Rate: ${successRate}%`);
    console.log(`   📤 Webhook Delivery Rate: ${webhookSuccessRate}%`);
    console.log(`   🔧 Self-Healing Success Rate: ${healingSuccessRate}%`);
    
    // Calculate throughput
    const timeWindowMs = Date.now() - sinceTime.getTime();
    const timeWindowHours = timeWindowMs / (1000 * 60 * 60);
    const throughputPerHour = timeWindowHours > 0 ? (totalJobs / timeWindowHours).toFixed(1) : 0;
    
    console.log(`   🚀 Throughput: ${throughputPerHour} jobs/hour`);
    
    // ========================================
    // 6. RECOMMENDATIONS
    // ========================================
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('              💡 RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    const recommendations = [];
    
    if (failedJobs > 0 && failedJobs / totalJobs > 0.05) {
      recommendations.push(`⚠️  High failure rate (${((failedJobs/totalJobs)*100).toFixed(1)}%) - investigate recent errors`);
    }
    
    if (webhookFailed > 0 && webhookFailed / webhookAttempted > 0.1) {
      recommendations.push(`⚠️  Webhook delivery issues (${((webhookFailed/webhookAttempted)*100).toFixed(1)}% failure) - check Salesforce endpoint`);
    }
    
    if (pendingJobs > 10) {
      recommendations.push(`⚠️  ${pendingJobs} pending jobs - consider checking queue processor`);
    }
    
    if (totalSelfHealing > 0 && healingEscalated / totalSelfHealing > 0.2) {
      recommendations.push(`⚠️  High escalation rate (${((healingEscalated/totalSelfHealing)*100).toFixed(1)}%) - review self-healing logic`);
    }
    
    if (processingTimes.length > 0 && processingTimes.some(j => j.processingTimeMs > 120000)) {
      recommendations.push(`⚠️  Some jobs took >2 minutes - consider performance optimization`);
    }
    
    if (recommendations.length === 0) {
      console.log('   ✅ System operating optimally - no issues detected!');
    } else {
      recommendations.forEach(rec => console.log(`   ${rec}`));
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    
    // Update last connection timestamp
    fs.writeFileSync(LAST_CONNECTION_FILE, new Date().toISOString(), 'utf8');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error generating analytics:', error.message);
    process.exit(1);
  }
}

getSessionAnalytics();
