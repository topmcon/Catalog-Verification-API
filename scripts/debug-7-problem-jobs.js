#!/usr/bin/env node
const mongoose = require('mongoose');

const PROBLEM_JOB_IDS = [
  'eb5f626c-534d-40cd-874c-3de4e0fbad9a',  // WFGS7530RZ
  '186014f5-7eb5-46d7-be09-22e81b3cc764',  // DOB30M977SM
  '311fa34b-02e1-4ea4-9b3e-04f17dcfb41b',  // WOES5030LZ
  '76f58459-f5aa-4e9c-a412-1fdd0ce76050',  // KOES530PSS00
  '0665d62c-f975-4621-9d14-1695b59e3b8d',  // KRMF706ESS00  (corrected)
  '2749af92-65e4-4eef-af96-9e3ee0f3f51e',  // WRS588FIHZ    (corrected)
  '4642b212-1fa1-4cb0-8310-e28ef94d9e2e'   // GSS25IYNFS    (corrected)
];

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
    
    const Job = mongoose.model('Job', new mongoose.Schema({}, { strict: false, collection: 'verification_jobs' }));
    
    console.log('\n' + '='.repeat(100));
    console.log('🔍 DETAILED DEBUG REPORT - 7 PROBLEM JOBS');
    console.log('='.repeat(100));
    
    for (let i = 0; i < PROBLEM_JOB_IDS.length; i++) {
      const jobId = PROBLEM_JOB_IDS[i];
      const job = await Job.findOne({ jobId });
      
      if (!job) {
        console.log(`\n[${i+1}] ❌ Job ${jobId} NOT FOUND`);
        continue;
      }
      
      const primary = job.result?.Primary_Attributes;
      const aiReview = job.result?.AI_Review;
      const media = job.result?.Media;
      const rawImages = job.rawPayload?.Stock_Images || [];
      const rawDocs = job.rawPayload?.Documents || [];
      
      console.log(`\n${'━'.repeat(100)}`);
      console.log(`[${i+1}] ${job.sfCatalogName}`);
      console.log('━'.repeat(100));
      
      console.log(`\n📋 JOB METADATA:`);
      console.log(`   Job ID: ${job.jobId}`);
      console.log(`   SF Catalog ID: ${job.sfCatalogId}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Created: ${job.createdAt}`);
      console.log(`   Completed: ${job.completedAt}`);
      console.log(`   Processing Time: ${job.processingTimeMs}ms`);
      console.log(`   Webhook Success: ${job.webhookSuccess}`);
      console.log(`   SF Acknowledged: ${job.salesforceAcknowledged}`);
      
      console.log(`\n📷 MEDIA PROVIDED BY SALESFORCE:`);
      console.log(`   Stock Images: ${rawImages.length} files`);
      if (rawImages.length > 0) {
        rawImages.slice(0, 3).forEach((img, idx) => {
          console.log(`     ${idx+1}. ${img.url?.substring(0, 80) || 'No URL'}`);
        });
        if (rawImages.length > 3) console.log(`     ... and ${rawImages.length - 3} more`);
      } else {
        console.log(`     ❌ NO IMAGES PROVIDED - This is the root cause!`);
      }
      
      console.log(`\n   Documents: ${rawDocs.length} files`);
      if (rawDocs.length > 0) {
        rawDocs.slice(0, 3).forEach((doc, idx) => {
          console.log(`     ${idx+1}. ${doc.url?.substring(0, 80) || 'No URL'}`);
        });
        if (rawDocs.length > 3) console.log(`     ... and ${rawDocs.length - 3} more`);
      } else {
        console.log(`     ⚠️  No documents provided`);
      }
      
      console.log(`\n🤖 AI VERIFICATION RESULT:`);
      console.log(`   Has Primary_Attributes: ${!!primary}`);
      console.log(`   Image Count (processed): ${media?.Image_Count || 0}`);
      
      if (aiReview) {
        console.log(`\n   OpenAI:`);
        console.log(`     - Reviewed: ${aiReview.openai?.reviewed}`);
        console.log(`     - Result: ${aiReview.openai?.result}`);
        console.log(`     - Confidence: ${aiReview.openai?.confidence}%`);
        if (aiReview.openai?.error_message) {
          console.log(`     - ❌ ERROR: ${aiReview.openai.error_message}`);
        }
        
        console.log(`\n   XAI (Grok):`);
        console.log(`     - Reviewed: ${aiReview.xai?.reviewed}`);
        console.log(`     - Result: ${aiReview.xai?.result}`);
        console.log(`     - Confidence: ${aiReview.xai?.confidence}%`);
        if (aiReview.xai?.error_message) {
          console.log(`     - ❌ ERROR: ${aiReview.xai.error_message}`);
        }
        
        console.log(`\n   Consensus:`);
        console.log(`     - Both Reviewed: ${aiReview.consensus?.both_reviewed}`);
        console.log(`     - Result: ${aiReview.consensus?.result || 'N/A'}`);
      }
      
      console.log(`\n📊 DATA RETURNED TO SALESFORCE:`);
      if (primary) {
        console.log(`   ✅ Brand: ${primary.AI_Brand || 'NULL'}`);
        console.log(`   ✅ Category: ${primary.AI_Product_Category || 'NULL'}`);
        console.log(`   ✅ Type: ${primary.AI_Type || 'NULL'}`);
        console.log(`   ✅ Style: ${primary.AI_Style || 'NULL'}`);
        console.log(`   ✅ Title: ${primary.AI_Product_Title?.substring(0, 60) || 'NULL'}`);
        console.log(`   ✅ Weight: ${primary.AI_Weight || 'NULL'}`);
      } else {
        console.log(`   ❌ NO DATA - Primary_Attributes is missing!`);
        console.log(`   ❌ Salesforce received EMPTY result object`);
      }
      
      console.log(`\n🔍 ROOT CAUSE:`);
      if (rawImages.length === 0 && !primary) {
        console.log(`   ❌ MISSING IMAGES - Salesforce did not provide any product images`);
        console.log(`   ❌ AI verification cannot run without visual data`);
        console.log(`   ❌ Job completed with empty result - this should have been marked as FAILED`);
        console.log(`\n   🛠️  FIX: Upload product images in Salesforce, then re-run verification`);
      } else if (aiReview?.openai?.result === 'error' || aiReview?.xai?.result === 'error') {
        console.log(`   ⚠️  AI ANALYSIS FAILED`);
        if (rawImages.length > 0) {
          console.log(`   ✅ Images were provided (${rawImages.length} files)`);
          console.log(`   ❌ But AI could not analyze them successfully`);
          console.log(`\n   🛠️  FIX: Check image quality, retry verification, or investigate AI errors`);
        } else {
          console.log(`   ❌ No images provided - AI had nothing to analyze`);
          console.log(`\n   🛠️  FIX: Upload images then re-run`);
        }
      } else {
        console.log(`   ⚠️  Unknown issue - needs manual investigation`);
      }
    }
    
    console.log(`\n${'='.repeat(100)}\n`);
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
