/**
 * Resend Failed Webhooks
 * Finds jobs that had webhook success but Salesforce rejected the update
 * (salesforceProcessed: false) and resends them with the fixed field mapping
 */

const mongoose = require('mongoose');
const axios = require('axios');
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
  webhookUrl: String,
  webhookAttempts: Number,
  webhookSuccess: Boolean,
  webhookLastAttempt: Date,
  salesforceAcknowledged: Boolean,
  salesforceProcessed: Boolean,
  salesforceError: String,
  status: String,
  result: mongoose.Schema.Types.Mixed,
  processingTimeMs: Number,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'verification_jobs' });

const VerificationJob = mongoose.model('VerificationJob', verificationJobSchema);

async function resendFailedWebhooks(jobIds = []) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find jobs that had SF rejection
    const query = jobIds.length > 0 
      ? { jobId: { $in: jobIds } }
      : {
          webhookSuccess: true,
          salesforceProcessed: false,
          salesforceError: { $regex: /AI_Full_Depth__c|AI Full Depth/i }
        };

    const jobs = await VerificationJob.find(query)
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`\n📋 Found ${jobs.length} jobs with Salesforce field rejection\n`);

    if (jobs.length === 0) {
      console.log('No jobs to resend.');
      return;
    }

    for (const job of jobs) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Job ID: ${job.jobId}`);
      console.log(`SF Catalog: ${job.sfCatalogId}`);
      console.log(`Original Error: ${job.salesforceError?.substring(0, 100)}...`);
      console.log(`Webhook URL: ${job.webhookUrl}`);

      // Build payload with field name transformation
      const rawPayload = {
        success: job.status === 'completed',
        data: {
          SF_Catalog_Id: job.sfCatalogId,
          SF_Catalog_Name: job.sfCatalogName,
          ...job.result
        },
        sessionId: job.jobId,
        processingTimeMs: job.processingTimeMs || 0
      };

      // Transform field names for Salesforce compatibility
      if (rawPayload.data.Appliance_Features) {
        const features = rawPayload.data.Appliance_Features;
        
        // Flatten to top-level SF custom fields
        console.log(`  🔄 Flattening Appliance_Features to SF custom field structure`);
        rawPayload.data.AI_Built_In__c = features.built_in;
        rawPayload.data.AI_Panel_Ready__c = features.panel_ready;
        rawPayload.data.AI_Full_Depth__c = features.counter_depth; // Map counter_depth → AI_Full_Depth__c
        rawPayload.data.AI_Standard_Depth__c = features.standard_depth;
        rawPayload.data.AI_Voltage_120V__c = features.voltage_120v;
        rawPayload.data.AI_Voltage_240V__c = features.voltage_240v;
        rawPayload.data.AI_Fuel_Gas__c = features.fuel_gas;
        rawPayload.data.AI_Fuel_Electric__c = features.fuel_electric;
        
        console.log(`     ✓ AI_Full_Depth__c: ${features.counter_depth}`);
        console.log(`     ✓ AI_Voltage_120V__c: ${features.voltage_120v}`);
        console.log(`     ✓ AI_Fuel_Electric__c: ${features.fuel_electric}`);
        
        // Remove nested object
        delete rawPayload.data.Appliance_Features;
      }

      // Sanitize nulls (convert to empty strings for Salesforce)
      const payload = JSON.parse(JSON.stringify(rawPayload, (key, value) => {
        return value === null ? '' : value;
      }));

      try {
        console.log(`  📤 Resending webhook...`);
        const response = await axios.post(job.webhookUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': '873648276-550e8400',
            'x-webhook-source': 'catalog-verification-api-resend',
            'x-job-id': payload.sessionId
          },
          timeout: 30000
        });

        const sfResponse = response.data;
        const sfSuccess = sfResponse?.success !== false;

        // Update job record
        job.salesforceProcessed = sfSuccess;
        job.salesforceError = sfSuccess ? null : sfResponse?.message;
        job.updatedAt = new Date();
        await job.save();

        if (sfSuccess) {
          console.log(`  ✅ SUCCESS - Salesforce accepted update`);
        } else {
          console.log(`  ⚠️  WARNING - Webhook delivered but SF still rejected:`);
          console.log(`     ${sfResponse?.message}`);
        }
      } catch (error) {
        console.log(`  ❌ FAILED - Error resending webhook:`);
        console.log(`     ${error.message}`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Resend operation complete`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const jobIds = args.length > 0 ? args : [];

// Run
resendFailedWebhooks(jobIds).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
