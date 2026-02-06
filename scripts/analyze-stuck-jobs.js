const { MongoClient } = require('mongodb');

const stuckJobIds = [
  '25be071e-f4ca-4cca-93cd-36c52cf53948',  // G-5130-LM67K-PN
  '5064be86-8f28-4dcb-b4ab-8e0fdad78566'   // G-6305-LM42V-PN
];

async function analyzeStuckJobs() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('catalog-verification');
  const jobs = db.collection('verification_jobs');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('ANALYZING 2 STUCK JOBS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  for (const jobId of stuckJobIds) {
    const job = await jobs.findOne({ jobId });
    
    console.log('─'.repeat(60));
    console.log('Job ID:', jobId);
    console.log('Catalog ID:', job.sfCatalogName);
    console.log('Status:', job.status);
    console.log('Created:', new Date(job.createdAt).toLocaleString('en-US', { timeZone: 'America/New_York' }), 'EST');
    console.log('Started:', job.startedAt ? new Date(job.startedAt).toLocaleString('en-US', { timeZone: 'America/New_York'}) + ' EST' : 'Not started');
    console.log('Updated:', new Date(job.updatedAt).toLocaleString('en-US', { timeZone: 'America/New_York' }), 'EST');
    
    const minutesProcessing = job.startedAt ? 
      ((new Date() - new Date(job.startedAt)) / 1000 / 60).toFixed(1) : 0;
    
    console.log('Processing time:', minutesProcessing, 'minutes');
    console.log('');
    
    if (job.rawPayload) {
      const payload = job.rawPayload;
      console.log('Raw payload info:');
      console.log('  SF_Catalog_Name:', payload.SF_Catalog_Name || 'N/A');
      console.log('  Product_Description:', payload.Product_Description ? payload.Product_Description.substring(0, 100) + '...' : 'N/A');
      console.log('  Category_Legacy:', payload.Category_Legacy || 'N/A');
      console.log('  Has Stock_Images:', !!payload.Stock_Images);
      console.log('  Has Documents:', !!payload.Documents);
      console.log('  Has Specification_Table:', !!payload.Specification_Table);
      console.log('');
    }
    
    // Mark as failed so we can re-run
    console.log('Marking job as FAILED to allow retry...');
    await jobs.updateOne(
      { jobId },
      { 
        $set: { 
          status: 'failed',
          error: 'Stuck in processing for over 5 minutes - marked as failed by admin script',
          updatedAt: new Date()
        } 
      }
    );
    console.log('✅ Marked as failed\n');
  }
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('Both jobs marked as FAILED - ready to retry manually');
  console.log('═══════════════════════════════════════════════════════');
  
  await client.close();
  process.exit(0);
}

analyzeStuckJobs().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
