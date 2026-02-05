const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

async function analyze() {
  await mongoose.connect('mongodb://localhost:27017/catalog-verification');
  const db = mongoose.connection.db;
  
  // Jobs after 5:35pm EST
  const targetTime = new Date('2026-02-05T22:35:00.000Z');
  const targetObjectId = ObjectId.createFromTime(targetTime.getTime() / 1000);
  
  const jobs = db.collection('verification_jobs');
  
  // 1. COMPLETED JOBS ANALYSIS
  console.log('═══════════════════════════════════════════════════════');
  console.log('1. COMPLETED JOBS SELF-HEALING ANALYSIS (142 jobs)');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const completedJobs = await jobs.find({
    _id: {$gte: targetObjectId},
    status: 'completed'
  }).toArray();
  
  let successfulHealing = 0;
  let noIssuesFound = 0;
  let healingFailed = 0;
  let noHealingAttempted = 0;
  
  completedJobs.forEach(job => {
    const selfHeal = job.selfHealingResult;
    if (!selfHeal) {
      noHealingAttempted++;
    } else if (selfHeal.success === true && selfHeal.reason && selfHeal.reason.includes('No issues')) {
      noIssuesFound++;
    } else if (selfHeal.success === true) {
      successfulHealing++;
    } else {
      healingFailed++;
    }
  });
  
  console.log('Total completed:', completedJobs.length);
  console.log('');
  console.log('Self-Healing Results:');
  console.log('  ✅ Clean (no issues detected):', noIssuesFound, `(${(noIssuesFound/completedJobs.length*100).toFixed(1)}%)`);
  console.log('  ✅ Successfully healed:', successfulHealing, `(${(successfulHealing/completedJobs.length*100).toFixed(1)}%)`);
  console.log('  ❌ Healing FAILED:', healingFailed, `(${(healingFailed/completedJobs.length*100).toFixed(1)}%)`);
  console.log('  ⚪ No healing attempted:', noHealingAttempted);
  
  const failed = completedJobs.filter(j => j.selfHealingResult && j.selfHealingResult.success === false);
  
  if (failed.length > 0) {
    console.log('\n=== FAILED HEALING EXAMPLES ===');
    failed.slice(0, 5).forEach((job, i) => {
      console.log(`${i+1}. SF Catalog: ${job.sfCatalogName || 'N/A'}`);
      console.log(`   Reason: ${job.selfHealingResult.reason}`);
      console.log(`   Phase: ${job.selfHealingResult.phase}`);
      console.log(`   Attempts: ${job.selfHealingResult.attemptsTaken || 'N/A'}`);
      console.log('');
    });
  }
  
  // 2. STUCK JOBS ANALYSIS
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('2. STUCK PROCESSING JOBS (39 jobs)');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const processingJobs = await jobs.find({
    _id: {$gte: targetObjectId},
    status: 'processing'
  }).sort({_id: 1}).toArray();
  
  console.log('Total stuck:', processingJobs.length);
  console.log('\nSample of first 10:');
  
  processingJobs.slice(0, 10).forEach((job, i) => {
    const age = Math.round((Date.now() - job._id.getTimestamp().getTime()) / 60000);
    console.log(`${i+1}. SF Catalog: ${job.sfCatalogName || 'Unknown'}`);
    console.log(`   Job ID: ${job.jobId}`);
    console.log(`   Stuck for: ${age} minutes`);
    console.log('');
  });
  
  // 3. WHY CONSENSUS IS FAILING
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('3. CONSENSUS FAILURE ANALYSIS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const reasons = {};
  failed.forEach(job => {
    const reason = job.selfHealingResult.reason || 'Unknown';
    reasons[reason] = (reasons[reason] || 0) + 1;
  });
  
  console.log('Failure reasons:');
  Object.entries(reasons).sort((a,b) => b[1] - a[1]).forEach(([reason, count]) => {
    console.log(`  ${count}x: ${reason}`);
  });
  
  await mongoose.disconnect();
  process.exit(0);
}

analyze().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
