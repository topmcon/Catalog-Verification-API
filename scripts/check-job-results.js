const mongoose = require('mongoose');

const jobId = 'd3c810f5-248a-4343-9a34-0c8dcb4fc03d';

async function checkJob() {
  await mongoose.connect('mongodb://localhost:27017/catalog-verification');
  const db = mongoose.connection.db;
  const jobs = db.collection('verification_jobs');
  
  const job = await jobs.findOne({ jobId });
  
  console.log('Job ID:', job.jobId);
  console.log('Catalog ID:', job.sfCatalogName);
  console.log('Status:', job.status);
  console.log('Has result:', !!job.result);
  console.log('Webhook URL:', job.webhookUrl ? 'Present' : 'MISSING');
  console.log('Webhook success:', job.webhookSuccess);
  console.log('Webhook attempts:', job.webhookAttempts || 0);
  console.log('Self-healing:', job.selfHealingResult ? `Yes (skipped: ${job.selfHealingResult.skipped})` : 'No');
  console.log('');
  
  if (job.result) {
    console.log('✅ RESULT EXISTS!');
    console.log('Result keys:', Object.keys(job.result).join(', '));
    console.log('');
    console.log('Sample data:');
    console.log('  sfCatalogName:', job.result.sfCatalogName || 'N/A');
    console.log('  brand_id:', job.result.brand_id || 'N/A');
    console.log('  category_id:', job.result.category_id || 'N/A');
    console.log('  verified:', job.result.verified);
  } else {
    console.log('❌ NO RESULT - This job was cleared before verification completed');
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

checkJob().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
