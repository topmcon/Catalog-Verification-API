const mongoose = require('mongoose');
const { VerificationJob } = require('../dist/models/verification-job.model');

async function checkJobFailure() {
  await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
  
  const jobId = 'a9328cd8-3055-40a4-ab73-d9d151f5c52b';
  const job = await VerificationJob.findOne({ jobId });
  
  console.log('\n=== JOB ANALYSIS ===');
  console.log('Job ID:', job.jobId);
  console.log('Status:', job.status);
  console.log('Created:', job.createdAt);
  console.log('\nHas Error:', !!job.error);
  if (job.error) {
    console.log('Error Message:');
    console.log(job.error.substring(0, 500));
    console.log('...\n');
  }
  
  console.log('Has Result:', !!job.result);
  if (job.result) {
    console.log('Result Keys:', Object.keys(job.result));
    console.log('\nAdditional HTML:', job.result.additional_attributes_html ? 
      `YES (${job.result.additional_attributes_html.length} chars)` : 'NO');
    console.log('Primary Attrs:', Object.keys(job.result.primary_display_attributes || {}).length);
    console.log('Top 15 Attrs:', Object.keys(job.result.top_filter_attributes || {}).length);
    console.log('Categorical Attrs:', Object.keys(job.result.categorical_attributes || {}).length);
  }
  
  console.log('\nrawPayload:');
  console.log('  Web_Retailer_Specs:', job.rawPayload?.Web_Retailer_Specs?.length || 0);
  console.log('  Ferguson_Attributes:', job.rawPayload?.Ferguson_Attributes?.length || 0);
  console.log('  Stock_Images:', job.rawPayload?.Stock_Images?.length || 0);
  console.log('  Documents:', job.rawPayload?.Documents?.length || 0);
  
  await mongoose.disconnect();
}

checkJobFailure().catch(err => {
  console.error(err);
  process.exit(1);
});
