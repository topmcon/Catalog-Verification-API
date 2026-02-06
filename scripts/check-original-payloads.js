const mongoose = require('mongoose');

const jobIds = [
  "d3c810f5-248a-4343-9a34-0c8dcb4fc03d",
  "c2677b47-6eed-4556-91e4-5e29d16c3f8e",
  "66710152-06ea-4124-bed7-c7c9568c0d8d"
];

async function checkPayloads() {
  await mongoose.connect('mongodb://localhost:27017/catalog-verification');
  const db = mongoose.connection.db;
  const jobs = db.collection('verification_jobs');
  
  console.log('Checking if original request payloads exist...\n');
  
  for (const jobId of jobIds) {
    const job = await jobs.findOne({ jobId });
    
    console.log('─'.repeat(60));
    console.log('Job ID:', jobId);
    console.log('Catalog ID:', job.sfCatalogName);
    console.log('Has rawPayload:', !!job.rawPayload);
    console.log('Has requestPayload:', !!job.requestPayload);
    
    if (job.rawPayload) {
      console.log('✅ Raw payload exists! Can re-run verification');
      console.log('   Keys:', Object.keys(job.rawPayload).slice(0, 10).join(', '));
    } else if (job.requestPayload) {
      console.log('✅ Request payload exists! Can re-run verification');
      console.log('   Keys:', Object.keys(job.requestPayload).slice(0, 10).join(', '));
    } else {
      console.log('❌ No payload found - cannot re-run');
    }
    console.log('');
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

checkPayloads().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
