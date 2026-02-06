const { MongoClient } = require('mongodb');

const failedCatalogIds = [
  'G-5130-LM67K-PN',
  'G-6305-LM42V-PN',
  'G-4881-LM52-PN',
  '62558LF-PC',
  '73565-GL',
  'G0042116',
  'VG05001MG',
  'KS8728DL',
  'PFWSC9867MB'
];

async function checkFailed() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('catalog-verification');
  const jobs = db.collection('verification_jobs');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('INVESTIGATING 9 FAILED/NO-RESULT JOBS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  for (const catalogId of failedCatalogIds) {
    const job = await jobs.findOne(
      { sfCatalogName: catalogId },
      { sort: { _id: -1 } }
    );
    
    if (!job) {
      console.log(`❌ ${catalogId}: NOT FOUND IN DATABASE\n`);
      continue;
    }
    
    console.log('─'.repeat(60));
    console.log('Catalog ID:', catalogId);
    console.log('Job ID:', job.jobId);
    console.log('Status:', job.status);
    console.log('Has result:', !!job.result ? 'Yes' : 'No');
    console.log('Webhook success:', job.webhookSuccess === true ? 'Yes' : 'No');
    console.log('Webhook attempts:', job.webhookAttempts || 0);
    console.log('Webhook URL:', job.webhookUrl ? 'Present' : 'MISSING');
    
    if (job.error) {
      console.log('Error:', job.error);
    }
    
    if (job.status === 'processing') {
      console.log('⚠️  Still processing - may need more time');
    } else if (job.status === 'failed') {
      console.log('❌ Verification FAILED');
    } else if (job.status === 'completed' && !job.result) {
      console.log('⚠️  Marked completed but NO RESULT - was cleared by cleanup script');
    } else if (job.status === 'completed' && job.result && !job.webhookSuccess) {
      console.log('⚠️  Has result but webhook FAILED to send');
    }
    
    console.log('Created:', new Date(job.createdAt).toLocaleString('en-US', { timeZone: 'America/New_York' }), 'EST');
    console.log('');
  }
  
  await client.close();
  process.exit(0);
}

checkFailed().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
