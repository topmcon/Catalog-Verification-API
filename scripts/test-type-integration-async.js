#!/usr/bin/env node
/**
 * PROPER TYPE INTEGRATION TEST
 * =============================
 * 1. Submit verification requests (async, they queue and process in background)
 * 2. Wait for jobs to complete
 * 3. Check database for results
 * 4. Validate Type_Verified field is present in all responses
 */

const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const VerificationJob = require('../dist/models/verification-job.model').VerificationJob;

const API_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_WEBHOOK_URL = 'https://test-webhook.site/type-integration-test'; 

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB\n');
}

async function submitVerificationRequest(payload, index) {
  console.log(`\n${'-'.repeat(70)}`);
  console.log(`SUBMITTING TEST ${index + 1}: ${payload.SF_Catalog_Name}`);
  console.log(`Brand: ${payload.Ferguson_Brand || payload.Brand_Web_Retailer || 'Unknown'}`);
  console.log(`Category: ${payload.Ferguson_Base_Category || payload.Web_Retailer_Category || 'Unknown'}`);
  console.log(`${'-'.repeat(70)}\n`);
  
  try {
    const response = await axios.post(
      `${API_URL}/api/verify/salesforce`,
      {
        ...payload,
        Webhook_URL__c: TEST_WEBHOOK_URL // Override webhook for testing
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.WEBHOOK_SECRET || 'af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd'
        },
        timeout: 30000
      }
    );
    
    const result = response.data;
    console.log(`✅ Request Submitted`);
    console.log(`   Job ID: ${result.jobId}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Estimated Time: ${result.estimatedProcessingTime}`);
    
    return {
      success: true,
      jobId: result.jobId,
      sfCatalogId: payload.SF_Catalog_Id,
      sfCatalogName: payload.SF_Catalog_Name
    };
    
  } catch (error) {
    console.log(`❌ Submission FAILED: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function waitForJobCompletion(jobId, timeout = 180000) {
  const startTime = Date.now();
  const checkInterval = 2000; // Check every 2 seconds
  
  while (Date.now() - startTime < timeout) {
    const job = await VerificationJob.findOne({ jobId }).lean();
    
    if (!job) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      continue;
    }
    
    if (job.status === 'completed' || job.status === 'failed') {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      return {
        completed: true,
        duration,
        job
      };
    }
    
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  return {
    completed: false,
    error: 'Timeout waiting for job completion'
  };
}

function validateTypeIntegration(job) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`VALIDATION RESULTS: ${job.sfCatalogName}`);
  console.log(`${'='.repeat(70)}\n`);
  
  const response = job.response || {};
  const primaryAttrs = response.Primary_Attributes || {};
  
  console.log('📊 RESPONSE STRUCTURE:');
  console.log(`   Job Status: ${job.status}`);
  console.log(`   Processing Time: ${job.processingTime || 'N/A'}ms`);
  console.log(`   Verification Score: ${response.Verification_Metadata?.verification_score || 'N/A'}/100`);
  
  console.log('\n🔍 PRIMARY ATTRIBUTES:');
  const fields = {
    'Brand_Verified': primaryAttrs.Brand_Verified,
    'Category_Verified': primaryAttrs.Category_Verified,
    'Type_Verified': primaryAttrs.Type_Verified,
    'Type_Id': primaryAttrs.Type_Id,
    'Product_Style_Verified': primaryAttrs.Product_Style_Verified,
    'Product_Title_Verified': primaryAttrs.Product_Title_Verified
  };
  
  let hasTypeField = false;
  let hasTypeId = false;
  let allRequiredFieldsPresent = true;
  
  for (const [field, value] of Object.entries(fields)) {
    const status = value !== undefined && value !== null ? '✅' : '❌';
    const displayValue = typeof value === 'string' && value.length > 50 
      ? value.substring(0, 47) + '...' 
      : (value || 'null');
    
    console.log(`   ${status} ${field}: ${displayValue}`);
    
    if (field === 'Type_Verified' && value) {
      hasTypeField = true;
    }
    if (field === 'Type_Id' && value !== undefined) {
      hasTypeId = true; // Type_Id can be null, but should exist
    }
    if (!value && field !== 'Type_Id') {
      allRequiredFieldsPresent = false;
    }
  }
  
  console.log('\n🎯 TYPE INTEGRATION CHECK:');
  
  if (hasTypeField) {
    const typeValue = primaryAttrs.Type_Verified;
    console.log(`   ✅ Type_Verified field is PRESENT`);
    console.log(`   Value: "${typeValue}"`);
    
    if (typeValue === 'Not Applicable') {
      console.log(`   ℹ️  Status: Type matching not yet active (expected)`);
    } else {
      console.log(`   ✅ Type value populated from AI analysis`);
    }
  } else {
    console.log(`   ❌ Type_Verified field is MISSING - REGRESSION DETECTED!`);
  }
  
  if ('Type_Id' in primaryAttrs) {
    console.log(`   ✅ Type_Id field is PRESENT (value: ${primaryAttrs.Type_Id || 'null'})`);
  } else {
    console.log(`   ❌ Type_Id field is MISSING - REGRESSION DETECTED!`);
  }
  
  return {
    sfCatalogName: job.sfCatalogName,
    status: job.status,
    hasTypeField,
    hasTypeId,
    typeVerified: primaryAttrs.Type_Verified,
    typeId: primaryAttrs.Type_Id,
    brandVerified: primaryAttrs.Brand_Verified,
    categoryVerified: primaryAttrs.Category_Verified,
    styleVerified: primaryAttrs.Product_Style_Verified,
    score: response.Verification_Metadata?.verification_score || 0,
    allRequiredFieldsPresent
  };
}

async function runTest() {
  console.log('\n🧪 TYPE INTEGRATION TEST - ASYNC VERIFICATION');
  console.log('='.repeat(70));
  console.log('Purpose: Validate Type hierarchy integration with async verification');
  console.log(`API URL: ${API_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  try {
    await connectDB();
    
    // Get last completed jobs as reference data
    const referenceJobs = await VerificationJob.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    
    if (referenceJobs.length === 0) {
      console.log('❌ No completed jobs found to use as test data');
      console.log('   Run some verifications first, then re-run this test');
      return;
    }
    
    console.log(`📋 Found ${referenceJobs.length} completed jobs to use as test data\n`);
    
    // Submit new verification requests using the payloads from completed jobs
    const submissions = [];
    
    for (let i = 0; i < referenceJobs.length; i++) {
      const refJob = referenceJobs[i];
      const payload = {
        ...refJob.rawPayload,
        SF_Catalog_Id: refJob.rawPayload.SF_Catalog_Id + '-type-test-' + Date.now() + '-' + i
      };
      
      const result = await submitVerificationRequest(payload, i);
      submissions.push(result);
      
      // Small delay between submissions
      if (i < referenceJobs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const successfulSubmissions = submissions.filter(s => s.success);
    
    if (successfulSubmissions.length === 0) {
      console.log('\n❌ All submissions failed');
      return;
    }
    
    console.log(`\n📊 ${successfulSubmissions.length}/${submissions.length} requests submitted successfully`);
    console.log(`\n⏳ Waiting for jobs to complete (max 3 minutes per job)...\n`);
    
    // Wait for all jobs to complete
    const results = [];
    
    for (const submission of successfulSubmissions) {
      console.log(`\n⏳ Waiting for job ${submission.jobId}...`);
      const completion = await waitForJobCompletion(submission.jobId);
      
      if (completion.completed) {
        console.log(`   ✅ Completed in ${completion.duration}s`);
        const validation = validateTypeIntegration(completion.job);
        results.push(validation);
      } else {
        console.log(`   ❌ Timeout or error: ${completion.error}`);
        results.push({
          sfCatalogName: submission.sfCatalogName,
          status: 'timeout',
          hasTypeField: false,
          hasTypeId: false,
          error: completion.error
        });
      }
    }
    
    // Print summary
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 FINAL TEST SUMMARY');
    console.log('='.repeat(70) + '\n');
    
    const completed = results.filter(r => r.status === 'completed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const timedOut = results.filter(r => r.status === 'timeout').length;
    const withTypeField = results.filter(r => r.hasTypeField).length;
    const withTypeId = results.filter(r => r.hasTypeId).length;
    
    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Completed: ${completed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱  Timed Out: ${timedOut}`);
    console.log(`\nType Integration:`);
    console.log(`🔧 Type_Verified Present: ${withTypeField}/${results.length}`);
    console.log(`🔧 Type_Id Present: ${withTypeId}/${results.length}`);
    
    if (completed > 0) {
      const avgScore = results
        .filter(r => r.status === 'completed' && r.score)
        .reduce((sum, r) => sum + r.score, 0) / completed;
      console.log(`\nAverage Score: ${avgScore.toFixed(1)}/100`);
    }
    
    // Detailed table
    console.log('\n' + '='.repeat(70));
    console.log('DETAILED RESULTS');
    console.log('='.repeat(70) + '\n');
    
    console.log('Model'.padEnd(25) + 'Type Field'.padEnd(15) + 'Brand'.padEnd(20) + 'Score');
    console.log('-'.repeat(70));
    
    for (const result of results) {
      const model = (result.sfCatalogName || 'Unknown').substring(0, 23);
      const typeField = result.hasTypeField ? `✅ ${result.typeVerified?.substring(0, 10) || 'N/A'}` : '❌ Missing';
      const brand = (result.brandVerified || 'N/A').substring(0, 18);
      const score = result.score ? `${result.score}/100` : 'N/A';
      
      console.log(
        model.padEnd(25) +
        typeField.padEnd(15) +
        brand.padEnd(20) +
        score
      );
    }
    
    console.log('\n' + '='.repeat(70));
    
    // Final assessment
    console.log('\n🎯 INTEGRATION ASSESSMENT:\n');
    
    if (withTypeField === results.length && completed > 0) {
      console.log('✅ ALL TESTS PASSED');
      console.log('✅ Type integration successful - Type_Verified field present in all responses');
      console.log('✅ No breaking changes detected');
    } else if (withTypeField > 0) {
      console.log('⚠️  PARTIAL SUCCESS');
      console.log(`   ${withTypeField}/${results.length} responses have Type_Verified field`);
      console.log('   Some responses may be missing Type integration');
    } else {
      console.log('❌ TYPE INTEGRATION FAILED');
      console.log('   Type_Verified field not found in any responses');
      console.log('   REGRESSION DETECTED - Integration may have broken something');
    }
    
    if (withTypeId !== results.length && completed > 0) {
      console.log(`\n⚠️  WARNING: ${results.length - withTypeId} response(s) missing Type_Id field`);
    }
    
    console.log('\n✅ Testing complete!\n');
    
  } catch (error) {
    console.error('\n❌ Test error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

// Run test
runTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
