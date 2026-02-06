const mongoose = require('mongoose');

// Catalog IDs from user's list
const catalogIds = [
  'G-5130-LM67K-PN',
  'G-2356-LM40B-SN',
  '48441001',
  'U.4279LS-SEG-2',
  'U.4776L-STN-2',
  'G-6305-LM42V-PN',
  'G-5330-LM57L-BNi',
  'G-4881-LM52-PN',
  '65378LF-SLLHP-ECO',
  'G-2301-LM31-MBK',
  'KS8728DL',
  'PFWSC9867MB',
  '30805875-46',
  '62558LF-PC',
  '73565-GL',
  'G0042116',
  'VG05001MG',
  'P23148-LV-CP',
  '8416',
  '74516821',
  'WM-23-2.17-L9-PCO',
  'G-6610-LM45B',
  'G-6635-LM45W-T',
  'G-6735-LM46W-PC-T',
  'G-6736-LM46W-PC-T',
  'G-6854-LM47N-PN-T',
  'G-8043-SH-BB-T',
  'KPF-1610MBSB',
  'G-6810-LM47B-PN',
  'LS8779NYL',
  'RP101561BNX',
  '17861888-00',
  '3-2411/10',
  '2500-5223/52',
  'D35160980.150'
];

async function checkMissingResponses() {
  await mongoose.connect('mongodb://localhost:27017/catalog-verification');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('CHECKING MISSING VERIFICATION RESPONSES');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`Checking ${catalogIds.length} catalog IDs...\n`);
  
  const db = mongoose.connection.db;
  const jobs = db.collection('verification_jobs');
  
  const results = {
    completed: [],
    completedNoWebhook: [],
    completedWebhookFailed: [],
    notFound: [],
    processing: [],
    failed: []
  };
  
  for (const catalogId of catalogIds) {
    // Find most recent job for this catalog ID
    const job = await jobs.findOne(
      { sfCatalogName: catalogId },
      { sort: { _id: -1 } }
    );
    
    if (!job) {
      results.notFound.push(catalogId);
      continue;
    }
    
    const info = {
      catalogId,
      jobId: job.jobId,
      status: job.status,
      webhookUrl: job.webhookUrl,
      webhookSuccess: job.webhookSuccess,
      webhookAttempts: job.webhookAttempts,
      hasResult: !!job.result
    };
    
    if (job.status === 'completed') {
      if (job.webhookSuccess === true) {
        results.completed.push(info);
      } else if (!job.webhookUrl) {
        results.completedNoWebhook.push(info);
      } else {
        results.completedWebhookFailed.push(info);
      }
    } else if (job.status === 'processing') {
      results.processing.push(info);
    } else if (job.status === 'failed') {
      results.failed.push(info);
    }
  }
  
  // Report results
  console.log('═══════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log(`✅ Completed with webhook sent: ${results.completed.length}`);
  console.log(`⚠️  Completed but webhook FAILED: ${results.completedWebhookFailed.length}`);
  console.log(`⚠️  Completed but NO webhook URL: ${results.completedNoWebhook.length}`);
  console.log(`⏳ Still processing: ${results.processing.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`❓ Not found in database: ${results.notFound.length}`);
  
  // Show details for items needing attention
  if (results.completedWebhookFailed.length > 0) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('COMPLETED BUT WEBHOOK FAILED (Need to resend)');
    console.log('═══════════════════════════════════════════════════════\n');
    results.completedWebhookFailed.forEach((item, i) => {
      console.log(`${i+1}. ${item.catalogId}`);
      console.log(`   Job ID: ${item.jobId}`);
      console.log(`   Webhook attempts: ${item.webhookAttempts || 0}`);
      console.log(`   Has result: ${item.hasResult}`);
      console.log('');
    });
  }
  
  if (results.completedNoWebhook.length > 0) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('COMPLETED BUT NO WEBHOOK URL');
    console.log('═══════════════════════════════════════════════════════\n');
    results.completedNoWebhook.forEach((item, i) => {
      console.log(`${i+1}. ${item.catalogId}`);
      console.log(`   Job ID: ${item.jobId}`);
      console.log('');
    });
  }
  
  if (results.notFound.length > 0) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('NOT FOUND IN DATABASE');
    console.log('═══════════════════════════════════════════════════════\n');
    results.notFound.forEach((catalogId, i) => {
      console.log(`${i+1}. ${catalogId}`);
    });
  }
  
  // Save job IDs for webhook retry
  if (results.completedWebhookFailed.length > 0) {
    const jobIds = results.completedWebhookFailed.map(item => item.jobId);
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('JOB IDs TO RETRY');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(JSON.stringify(jobIds, null, 2));
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

checkMissingResponses().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
