/**
 * Show Failed Verification Jobs
 * Display details of jobs that had Salesforce field rejection errors
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

// Define VerificationJob schema inline
const verificationJobSchema = new mongoose.Schema({
  jobId: String,
  sfCatalogId: String,
  sfCatalogName: String,
  createdAt: Date,
  webhookSuccess: Boolean,
  salesforceProcessed: Boolean,
  salesforceError: String,
  result: mongoose.Schema.Types.Mixed
}, { collection: 'verification_jobs' });

const VerificationJob = mongoose.model('VerificationJob', verificationJobSchema);

async function showFailedJobs() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Known catalog IDs that had field rejection errors
    const failedCatalogIds = [
      'a03Hu00001N1x7sIAB',
      'a03Hu00001N23kdIAB',
      'a03Hu00001N2972IAB',
      'a03Hu00001N2CT6IAN',
      'a03Hu00001N2JJAIA3',
      'a03Hu00001SXwhnIAD',
      'a03aZ000009XMXjQAO',
      'a03aZ00000FBy5qQAD',
      'a03aZ00000IPnkmQAD'
    ];
    
    const jobs = await VerificationJob.find({
      sfCatalogId: { $in: failedCatalogIds }
    })
    .sort({ createdAt: -1 })
    .select('jobId sfCatalogId sfCatalogName createdAt result salesforceError salesforceProcessed');

    console.log(`📋 Jobs with Salesforce Field Rejection (${jobs.length} total)\n`);
    console.log('='.repeat(90));

    jobs.forEach((job, idx) => {
      const attrs = job.result?.Primary_Attributes || {};
      const applFeatures = job.result?.Appliance_Features || {};
      
      console.log(`\n${idx + 1}. SF Catalog ID: ${job.sfCatalogId}`);
      console.log(`   Model Number: ${attrs.AI_Model_Number || job.sfCatalogName || 'N/A'}`);
      console.log(`   Brand: ${attrs.AI_Brand || 'N/A'}`);
      console.log(`   Category: ${attrs.AI_Product_Category || 'N/A'}`);
      console.log(`   Type: ${attrs.AI_Type || 'N/A'}`);
      console.log(`   Created: ${new Date(job.createdAt).toLocaleString('en-US', { timeZone: 'America/New_York' })} EST`);
      console.log(`   SF Processed: ${job.salesforceProcessed ? '✅ YES' : '❌ NO (rejected)'}`);
      console.log(`   Job ID: ${job.jobId}`);
      
      // Show appliance features that would have been sent
      if (Object.keys(applFeatures).length > 0) {
        console.log(`   Appliance Features:`);
        console.log(`     - counter_depth: ${applFeatures.counter_depth}`);
        console.log(`     - standard_depth: ${applFeatures.standard_depth}`);
        console.log(`     - voltage_120v: ${applFeatures.voltage_120v}`);
        console.log(`     - fuel_electric: ${applFeatures.fuel_electric}`);
      }
      
      // Show error snippet
      const errorSnippet = job.salesforceError?.substring(0, 120) || 'N/A';
      console.log(`   Error: ${errorSnippet}...`);
    });

    console.log('\n' + '='.repeat(90));
    console.log(`\n💡 These jobs completed successfully but Salesforce rejected the update`);
    console.log(`   due to field structure mismatch (nested vs. flattened).\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run
showFailedJobs().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
