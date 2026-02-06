const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const jobIds = [
  "d3c810f5-248a-4343-9a34-0c8dcb4fc03d",
  "c2677b47-6eed-4556-91e4-5e29d16c3f8e",
  "66710152-06ea-4124-bed7-c7c9568c0d8d",
  "30047839-0b6f-4603-824c-2689b200b47c",
  "95a9a2d5-dc1b-40db-aa62-9fc54802826c",
  "8d709ecf-1466-4eff-8333-e47e5766978a",
  "e345005f-3cf9-45ad-a105-02358c3eb568",
  "7e6b851d-d5a6-4622-86e2-1dc78f4f2e3d",
  "871caa2e-ea5c-4f97-8d8f-8a2db3ccc5cc",
  "3b051a5f-6ef9-489a-a149-d809d06865b1",
  "48406659-283f-4ef9-8da7-2ce1a5d159ef",
  "68b503ed-b4b7-4c9c-b704-2c9796348a90",
  "55212c6a-85c5-410c-bdfa-816985dabcc6",
  "4bfc0db5-1d08-43c5-af99-c432c920fcac",
  "c7357fcf-54f7-4a63-82b5-7e21e73901fb",
  "784aba2c-d3d9-46ba-98f1-7b09429793bc",
  "ac500f3b-21e3-4aaa-967c-0b0beaf8c8e2"
];

async function rerunVerifications() {
  await mongoose.connect('mongodb://localhost:27017/catalog-verification');
  const db = mongoose.connection.db;
  const jobs = db.collection('verification_jobs');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('RE-RUNNING VERIFICATION FOR 17 FAILED JOBS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  let successful = 0;
  let failed = 0;
  const results = [];
  
  for (let i = 0; i < jobIds.length; i++) {
    const jobId = jobIds[i];
    console.log(`[${i + 1}/${jobIds.length}] Processing job ${jobId}...`);
    
    let job = null;
    
    try {
      job = await jobs.findOne({ jobId });
      
      if (!job) {
        console.log('   ❌ Job not found\n');
        failed++;
        continue;
      }
      
      if (!job.rawPayload) {
        console.log('   ❌ No raw payload found\n');
        failed++;
        continue;
      }
      
      if (!job.webhookUrl) {
        console.log('   ❌ No webhook URL found\n');
        failed++;
        continue;
      }
      
      console.log('   📦 Catalog:', job.sfCatalogName);
      console.log('   🔄 Re-running verification via API...');
      
      // Build the payload - include webhook URL
      const payload = {
        ...job.rawPayload,
        webhookUrl: job.webhookUrl  // Include the webhook URL
      };
      
      // Call our own API to re-run the verification
      const response = await axios.post('http://localhost:3001/api/verify/salesforce', payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.WEBHOOK_SECRET || ''
        },
        timeout: 120000 // 2 minute timeout
      });
      
      if (response.data && response.data.jobId) {
        console.log('   ✅ Verification completed!');
        console.log('   📤 Results will be sent via webhook automatically');
        successful++;
        results.push({
          originalJobId: jobId,
          newJobId: response.data.jobId,
          catalogId: job.sfCatalogName,
          status: 'success'
        });
      } else {
        console.log('   ⚠️  Unexpected response:', response.data);
        failed++;
      }
      
    } catch (error) {
      console.log('   ❌ Error:', error.message);
      failed++;
      results.push({
        originalJobId: jobId,
        catalogId: job?.sfCatalogName || 'unknown',
        status: 'failed',
        error: error.message
      });
    }
    
    console.log('');
    
    // Add small delay to not overwhelm the API
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('✅ Successful:', successful);
  console.log('❌ Failed:', failed);
  console.log('📊 Total:', jobIds.length);
  
  if (successful > 0) {
    console.log('\n✨ All successful verifications will automatically send');
    console.log('   results to Salesforce via webhook!');
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

rerunVerifications().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
