/**
 * Retry webhook for a specific catalog ID
 * Updates job with default webhook URL and triggers webhook send
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb://127.0.0.1:27017/catalog-verification';

async function retryWebhook(catalogId) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const config = require('../dist/config').default;
    const VerificationJob = require('../dist/models/verification-job.model').VerificationJob;
    const webhookService = require('../dist/services/webhook.service').default;

    // Find the job
    const job = await VerificationJob.findOne({ sfCatalogId: catalogId }).sort({ createdAt: -1 });

    if (!job) {
      console.error(`❌ Job not found for catalog ID: ${catalogId}`);
      process.exit(1);
    }

    console.log(`📦 Found job:`, {
      jobId: job.jobId,
      sfCatalogId: job.sfCatalogId,
      status: job.status,
      oldWebhookUrl: job.webhookUrl || 'none',
      webhookAttempts: job.webhookAttempts
    });

    // Update with default webhook URL if not present
    if (!job.webhookUrl) {
      job.webhookUrl = config.salesforce.webhookUrl;
      job.webhookAttempts = 0;
      job.webhookSuccess = false;
      await job.save();
      console.log(`✅ Updated job with default webhook URL: ${job.webhookUrl}`);
    }

    // Retry webhook
    console.log(`📤 Sending webhook to Salesforce...`);
    const success = await webhookService.sendResults(job.jobId);

    if (success) {
      console.log(`✅ Webhook delivered successfully!`);
    } else {
      console.log(`❌ Webhook delivery failed`);
    }

    await mongoose.disconnect();
    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Get catalog ID from command line
const catalogId = process.argv[2];

if (!catalogId) {
  console.error('Usage: node retry-webhook.js <SF_Catalog_Id>');
  process.exit(1);
}

retryWebhook(catalogId);
