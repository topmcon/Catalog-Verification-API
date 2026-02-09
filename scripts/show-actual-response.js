const mongoose = require('mongoose');
const { VerificationJob } = require('../dist/models/verification-job.model');

async function showActualResponse() {
  await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
  
  const jobId = 'a9328cd8-3055-40a4-ab73-d9d151f5c52b';
  const job = await VerificationJob.findOne({ jobId });
  
  console.log('\n=== ACTUAL RESPONSE SENT TO SALESFORCE ===\n');
  console.log(JSON.stringify(job.result, null, 2));
  
  await mongoose.disconnect();
}

showActualResponse().catch(err => {
  console.error(err);
  process.exit(1);
});
