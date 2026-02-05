/**
 * CLEAR STUCK SELF-HEALING JOBS
 * 
 * Marks all jobs stuck in "processing" status as "completed"
 * since they were actually completed - just stuck in self-healing queue
 */

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

async function clearStuckJobs() {
  await mongoose.connect('mongodb://localhost:27017/catalog-verification');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('CLEARING STUCK SELF-HEALING JOBS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const db = mongoose.connection.db;
  const jobs = db.collection('verification_jobs');
  
  // Find all processing jobs from the recent batch (after 5:35pm EST)
  const targetTime = new Date('2026-02-05T22:35:00.000Z');
  const targetObjectId = ObjectId.createFromTime(targetTime.getTime() / 1000);
  
  const stuckJobs = await jobs.find({
    _id: {$gte: targetObjectId},
    status: 'processing'
  }).toArray();
  
  console.log(`Found ${stuckJobs.length} stuck jobs\n`);
  
  if (stuckJobs.length === 0) {
    console.log('No stuck jobs found. Exiting.');
    await mongoose.disconnect();
    process.exit(0);
  }
  
  // Show sample
  console.log('Sample of jobs to be updated:');
  stuckJobs.slice(0, 5).forEach((job, i) => {
    console.log(`${i+1}. ${job.sfCatalogName || 'Unknown'} (${job.jobId})`);
  });
  console.log('');
  
  // Update all to completed
  const result = await jobs.updateMany(
    {
      _id: {$gte: targetObjectId},
      status: 'processing'
    },
    {
      $set: {
        status: 'completed',
        selfHealingResult: {
          success: true,
          reason: 'Self-healing disabled - jobs marked as completed',
          skipped: true,
          timestamp: new Date()
        }
      }
    }
  );
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ CLEANUP COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Jobs updated: ${result.modifiedCount}`);
  console.log('All stuck jobs marked as completed');
  console.log('Self-healing queue cleared');
  console.log('');
  
  await mongoose.disconnect();
  process.exit(0);
}

clearStuckJobs().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
