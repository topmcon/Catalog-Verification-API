const mongoose = require('mongoose');

async function fixBrokenJob() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
    
    const db = mongoose.connection.db;
    const jobs = db.collection('verification_jobs');
    
    // Mark the stuck job as failed
    const result = await jobs.updateOne(
      { jobId: '663d0163-c318-4e26-8cf8-c8718d8d395c' },
      { 
        $set: { 
          status: 'failed',
          error: 'Invalid job - missing rawPayload (fixed in code)',
          completedAt: new Date()
        }
      }
    );
    
    console.log('Updated job:', result.modifiedCount);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixBrokenJob();
