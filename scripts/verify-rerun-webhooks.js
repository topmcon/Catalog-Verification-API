const mongoose = require('mongoose');

const catalogIds = [
  'G-5130-LM67K-PN', 'G-2356-LM40B-SN', '48441001', 'U.4279LS-SEG-2',
  'U.4776L-STN-2', 'G-6305-LM42V-PN', 'G-5330-LM57L-BNi', 'G-4881-LM52-PN',
  '65378LF-SLLHP-ECO', 'G-2301-LM31-MBK', 'KS8728DL', 'PFWSC9867MB',
  '30805875-46', '62558LF-PC', '73565-GL', 'G0042116', 'VG05001MG'
];

async function verifyWebhooks() {
  await mongoose.connect('mongodb://localhost:27017/catalog-verification');
  const db = mongoose.connection.db;
  const jobs = db.collection('verification_jobs');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('VERIFYING WEBHOOK STATUS FOR 17 RE-RUN JOBS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  let webhooksSent = 0;
  let webhooksFailed = 0;
  
  for (const catalogId of catalogIds) {
    // Get the MOST RECENT job for this catalog ID
    const job = await jobs.findOne(
      { sfCatalogName: catalogId },
      { sort: { _id: -1 } }
    );
    
    if (!job) {
      console.log(`❌ ${catalogId}: NOT FOUND`);
      continue;
    }
    
    const hasResult = !!job.result;
    const webhookSuccess = job.webhookSuccess === true;
    const webhookAttempts = job.webhookAttempts || 0;
    
    if (webhookSuccess && hasResult) {
      console.log(`✅ ${catalogId}: Webhook sent successfully (${webhookAttempts} attempts)`);
      webhooksSent++;
    } else if (hasResult && !webhookSuccess) {
      console.log(`⚠️  ${catalogId}: Has result but webhook failed (${webhookAttempts} attempts)`);
      webhooksFailed++;
    } else {
      console.log(`❌ ${catalogId}: No result yet (status: ${job.status})`);
      webhooksFailed++;
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ Webhooks sent:', webhooksSent);
  console.log('❌ Webhooks failed:', webhooksFailed);
  console.log('📊 Total:', catalogIds.length);
  console.log('');
  
  if (webhooksSent === catalogIds.length) {
    console.log('🎉 ALL WEBHOOKS SUCCESSFULLY SENT TO SALESFORCE!');
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

verifyWebhooks().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
