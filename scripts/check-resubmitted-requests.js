const { MongoClient } = require('mongodb');

// The 5 "not found" items that were manually resubmitted
const resubmittedIds = [
  'D35160980.150',
  '2500-5223/52',
  '3-2411/10',
  '17861888-00',
  'RP101561BNX'
];

// Plus items from the user's list showing 6:47-6:50 PM
const allRecentIds = [
  'D35160980.150',
  '2500-5223/52',
  '3-2411/10',
  '17861888-00',
  'RP101561BNX',
  'LS8779NYL',
  'G-6810-LM47B-PN',
  'KPF-1610MBSB',
  'G-8043-SH-BB-T',
  'G-6854-LM47N-PN-T',
  'G-6736-LM46W-PC-T',
  'G-6735-LM46W-PC-T',
  'G-6635-LM45W-T',
  'G-6610-LM45B',
  'WM-23-2.17-L9-PCO',
  '74516821',
  '8416',
  'P23148-LV-CP',
  'G-6305-LM42V-PN'
];

async function checkResubmitted() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('catalog-verification');
  const jobs = db.collection('verification_jobs');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('CHECKING FOR RESUBMITTED REQUESTS (6:47-6:50 PM EST)');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Check for jobs created between 6:47 PM and 6:51 PM EST (23:47-23:51 UTC)
  const startTime = new Date('2026-02-05T23:47:00.000Z');
  const endTime = new Date('2026-02-05T23:51:00.000Z');
  
  const recentJobs = await jobs.find({
    createdAt: { $gte: startTime, $lte: endTime }
  }).sort({ createdAt: 1 }).toArray();
  
  console.log(`Found ${recentJobs.length} jobs created between 6:47-6:51 PM EST\n`);
  
  if (recentJobs.length === 0) {
    console.log('❌ NO REQUESTS FOUND - Salesforce did not call our API');
    console.log('   OR the timestamps in Salesforce UI are different from actual request time\n');
  } else {
    console.log('Jobs received:\n');
    
    let sent = 0, failed = 0, processing = 0, notAttempted = 0;
    
    for (const job of recentJobs) {
      const time = new Date(job.createdAt).toLocaleTimeString('en-US', { 
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      let status = '';
      if (job.status === 'completed' && job.webhookSuccess === true) {
        status = '✅ Sent';
        sent++;
      } else if (job.status === 'completed' && job.result) {
        status = '⚠️  Has result, webhook failed';
        failed++;
      } else if (job.status === 'processing') {
        status = '⏳ Processing';
        processing++;
      } else if (job.status === 'completed' && !job.result) {
        status = '❌ No result';
        notAttempted++;
      } else {
        status = `❓ ${job.status}`;
      }
      
      console.log(`${time} EST | ${status} | ${job.sfCatalogName}`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Webhooks sent:', sent);
    console.log('⚠️  Webhook failed:', failed);
    console.log('⏳ Still processing:', processing);
    console.log('❌ No result:', notAttempted);
    console.log('📊 Total jobs:', recentJobs.length);
    console.log('');
  }
  
  // Now check specifically for the 5 "not found" items
  console.log('═══════════════════════════════════════════════════════');
  console.log('CHECKING 5 PREVIOUSLY "NOT FOUND" ITEMS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  for (const catalogId of resubmittedIds) {
    const job = await jobs.findOne(
      { sfCatalogName: catalogId },
      { sort: { _id: -1 } }
    );
    
    if (!job) {
      console.log(`❌ ${catalogId}: Still not found`);
    } else {
      const createdTime = new Date(job.createdAt).toLocaleString('en-US', { 
        timeZone: 'America/New_York' 
      });
      
      if (job.status === 'completed' && job.webhookSuccess === true) {
        console.log(`✅ ${catalogId}: Received & sent! (${createdTime} EST)`);
      } else if (job.status === 'completed' && job.result) {
        console.log(`⚠️  ${catalogId}: Received but webhook failed (${createdTime} EST)`);
      } else if (job.status === 'processing') {
        console.log(`⏳ ${catalogId}: Processing... (${createdTime} EST)`);
      } else {
        console.log(`❓ ${catalogId}: ${job.status} (${createdTime} EST)`);
      }
    }
  }
  
  await client.close();
  process.exit(0);
}

checkResubmitted().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
