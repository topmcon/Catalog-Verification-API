/**
 * Backfill API Trackers from Existing Failed Jobs
 * Then trigger self-healing to test the system
 */

const mongoose = require('mongoose');

async function backfillAndTest() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
    console.log('✅ Connected to MongoDB\n');

    // Get verification jobs collection
    const VerificationJob = mongoose.model('VerificationJob', new mongoose.Schema({}, { strict: false }), 'verification_jobs');
    
    // Get API Tracker model
    const APITracker = mongoose.model('APITracker', new mongoose.Schema({}, { strict: false }), 'api_trackers');

    // Find failed jobs (response = null or empty)
    const failedJobs = await VerificationJob.find({
      $or: [
        { response: null },
        { response: { $exists: false } }
      ]
    }).sort({ createdAt: -1 }).limit(10); // Get last 10 failed jobs

    console.log(`📊 Found ${failedJobs.length} failed jobs\n`);

    if (failedJobs.length === 0) {
      console.log('❌ No failed jobs found to backfill');
      await mongoose.disconnect();
      return;
    }

    let trackersCreated = 0;

    // Create API tracker for each failed job with issues
    for (const job of failedJobs) {
      console.log(`\n📝 Processing job: ${job.jobId}`);
      console.log(`   SF Catalog: ${job.sfCatalogId}`);
      console.log(`   Created: ${job.createdAt}`);

      // Check if tracker already exists
      const existing = await APITracker.findOne({ 
        'request.SF_Catalog_Id': job.sfCatalogId,
        sessionId: job.jobId 
      });

      if (existing) {
        console.log(`   ⏭️  Tracker already exists, skipping`);
        continue;
      }

      // Create comprehensive issue list for a null response
      const issues = [];
      
      // Core missing fields
      const criticalFields = [
        'Brand_Verified',
        'Model_Number_Verified', 
        'Category_Verified',
        'Product_Title_Verified',
        'SubCategory_Verified'
      ];

      criticalFields.forEach(field => {
        issues.push({
          type: 'missing_top15_field',
          severity: 'high',
          field,
          description: `Missing critical field: ${field}`,
          suggestedAction: `AI must determine: (1) CODE BUG in extraction logic? OR (2) Legitimately not found after exhaustive resource search?`,
          metadata: {
            field,
            section: 'Primary',
            currentValue: null,
            jobId: job.jobId,
            sfCatalogId: job.sfCatalogId,
            availableRawData: {
              hasRawPayload: !!job.rawPayload,
              payloadSize: job.rawPayload ? JSON.stringify(job.rawPayload).length : 0
            }
          }
        });
      });

      // Create tracker with issues
      const tracker = {
        trackingId: `backfill-${job.jobId}`,
        sessionId: job.jobId,
        requestTimestamp: job.createdAt,
        responseTimestamp: job.updatedAt || job.createdAt,
        totalProcessingTimeMs: job.processingTimeMs || 0,
        overallStatus: 'failed',
        verificationScore: 0,
        request: {
          endpoint: '/api/verify/salesforce',
          method: 'POST',
          ipAddress: 'backfill',
          userAgent: 'backfill-script',
          SF_Catalog_Id: job.sfCatalogId,
          SF_Catalog_Name: job.sfCatalogName,
          payloadSizeBytes: job.rawPayload ? JSON.stringify(job.rawPayload).length : 0,
          webRetailerFieldCount: 0,
          fergusonFieldCount: 0,
          webRetailerSpecCount: 0,
          fergusonAttributeCount: 0,
          rawPayload: job.rawPayload
        },
        response: {
          success: false,
          statusCode: 200,
          verifiedFieldCount: 0,
          primaryAttributesPopulated: 0,
          topFilterAttributesPopulated: 0,
          additionalAttributesIncluded: false,
          htmlTableGenerated: false,
          responseSizeBytes: 0
        },
        issues,
        tags: ['backfilled', 'failed', 'has-issues', 'null-response'],
        createdAt: job.createdAt
      };

      await APITracker.create(tracker);
      trackersCreated++;
      console.log(`   ✅ Created tracker with ${issues.length} issues`);
    }

    console.log(`\n✅ Backfill complete: ${trackersCreated} trackers created with issues\n`);

    // Now trigger self-healing on first job
    if (trackersCreated > 0) {
      console.log('🔧 TRIGGERING SELF-HEALING ON FIRST JOB...\n');
      
      const orchestrator = require('../dist/services/self-healing/orchestrator.service').default;
      
      const firstJob = failedJobs[0];
      console.log(`Job ID: ${firstJob.jobId}`);
      console.log(`SF Catalog: ${firstJob.sfCatalogId}\n`);
      
      const result = await orchestrator.runCompleteSelfHealing(firstJob.jobId);
      
      console.log('\n📊 SELF-HEALING RESULT:');
      console.log(JSON.stringify(result, null, 2));
    }

    await mongoose.disconnect();
    console.log('\n✅ Test complete');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

backfillAndTest();
