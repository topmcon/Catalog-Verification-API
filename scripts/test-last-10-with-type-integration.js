#!/usr/bin/env node
/**
 * TEST LAST 10 API CALLS WITH TYPE INTEGRATION
 * ============================================
 * Simulates Salesforce calling our API for the last 10 verification jobs
 * Validates Type integration didn't break anything
 * Compares results to ensure correct responses
 */

const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Import models
const VerificationJob = require('../dist/models/verification-job.model').VerificationJob;

const API_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const WEBHOOK_URL = 'https://test-webhook.site/verify-integration-test'; // Test webhook

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');
}

async function getLastTenJobs() {
  console.log('\n📋 Fetching last 10 verification jobs from database...\n');
  
  const jobs = await VerificationJob.find({ status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  
  console.log(`Found ${jobs.length} completed jobs\n`);
  
  return jobs;
}

function prepareTestPayload(job) {
  // Extract the original payload from the job
  const originalPayload = job.rawPayload;
  
  // Ensure it has the required structure
  if (!originalPayload.SF_Catalog_Id || !originalPayload.SF_Catalog_Name) {
    console.warn(`⚠️  Job ${job.jobId} missing required fields`);
    return null;
  }
  
  return {
    ...originalPayload,
    // Override webhook URL for testing
    Webhook_URL__c: WEBHOOK_URL
  };
}

async function runVerification(payload, index) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST ${index + 1}/10: ${payload.SF_Catalog_Name}`);
  console.log(`SF_Catalog_Id: ${payload.SF_Catalog_Id}`);
  console.log(`Brand: ${payload.Brand_Web_Retailer || payload.Ferguson_Brand || 'Unknown'}`);
  console.log(`Category: ${payload.Web_Retailer_Category || payload.Ferguson_Base_Category || 'Unknown'}`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    const startTime = Date.now();
    
    // Call the API as if Salesforce is calling
    const response = await axios.post(
      `${API_URL}/api/verify/salesforce`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.WEBHOOK_SECRET || 'af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd'
        },
        timeout: 120000 // 2 minute timeout
      }
    );
    
    const processingTime = Date.now() - startTime;
    
    // Validate response structure
    const result = response.data;
    
    console.log(`✅ Verification completed in ${processingTime}ms\n`);
    
    // DEBUG: Show full response structure for first test
    if (index === 0) {
      console.log('🔍 FULL RESPONSE STRUCTURE (First Test):');
      console.log(JSON.stringify(result, null, 2));
      console.log();
    }
    
    // Check for Type_Verified field (NEW)
    if (result.Primary_Attributes) {
      const typeVerified = result.Primary_Attributes.Type_Verified;
      const typeId = result.Primary_Attributes.Type_Id;
      
      console.log('🔍 TYPE INTEGRATION CHECK:');
      console.log(`   Type_Verified: ${typeVerified || '(not set)'}`);
      console.log(`   Type_Id: ${typeId || 'null'}`);
      
      if (!typeVerified) {
        console.log('   ⚠️  WARNING: Type_Verified field missing!');
      } else if (typeVerified === 'Not Applicable') {
        console.log('   ℹ️  Type not yet matched (expected during integration)');
      } else {
        console.log('   ✅ Type field populated!');
      }
      console.log();
    }
    
    // Validate expected fields
    console.log('📊 RESPONSE VALIDATION:');
    const requiredFields = {
      'SF_Catalog_Id': result.SF_Catalog_Id,
      'SF_Catalog_Name': result.SF_Catalog_Name,
      'Brand_Verified': result.Primary_Attributes?.Brand_Verified,
      'Category_Verified': result.Primary_Attributes?.Category_Verified,
      'Type_Verified': result.Primary_Attributes?.Type_Verified,
      'Product_Style_Verified': result.Primary_Attributes?.Product_Style_Verified,
      'Product_Title_Verified': result.Primary_Attributes?.Product_Title_Verified,
      'Verification_Score': result.Verification_Metadata?.verification_score
    };
    
    let allFieldsPresent = true;
    for (const [field, value] of Object.entries(requiredFields)) {
      const status = value ? '✅' : '❌';
      const displayValue = typeof value === 'string' && value.length > 50 
        ? value.substring(0, 47) + '...' 
        : value;
      console.log(`   ${status} ${field}: ${displayValue || '(missing)'}`);
      if (!value && field !== 'Type_Id') { // Type_Id can be null initially
        allFieldsPresent = false;
      }
    }
    
    if (!allFieldsPresent) {
      console.log('\n   ⚠️  WARNING: Some required fields are missing!');
    }
    
    // Check verification score
    const score = result.Verification_Metadata?.verification_score;
    if (score !== undefined) {
      console.log(`\n   Verification Score: ${score}/100`);
      if (score < 50) {
        console.log('   ⚠️  LOW SCORE - May indicate issues');
      } else if (score >= 80) {
        console.log('   ✅ GOOD SCORE');
      } else {
        console.log('   ℹ️  MODERATE SCORE');
      }
    }
    
    return {
      success: true,
      sf_catalog_id: payload.SF_Catalog_Id,
      sf_catalog_name: payload.SF_Catalog_Name,
      brand_verified: result.Primary_Attributes?.Brand_Verified,
      category_verified: result.Primary_Attributes?.Category_Verified,
      type_verified: result.Primary_Attributes?.Type_Verified,
      style_verified: result.Primary_Attributes?.Product_Style_Verified,
      score: score,
      processing_time: processingTime,
      has_type_field: !!result.Primary_Attributes?.Type_Verified,
      all_fields_present: allFieldsPresent
    };
    
  } catch (error) {
    console.log(`❌ Verification FAILED\n`);
    
    if (error.response) {
      console.log(`   HTTP Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.message || error.message}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    
    return {
      success: false,
      sf_catalog_id: payload.SF_Catalog_Id,
      sf_catalog_name: payload.SF_Catalog_Name,
      error: error.message,
      processing_time: 0
    };
  }
}

async function runTests() {
  console.log('\n🧪 TESTING LAST 10 API CALLS WITH TYPE INTEGRATION');
  console.log('================================================\n');
  console.log('Purpose: Validate Type hierarchy integration didn\'t break existing functionality');
  console.log('Simulating: Salesforce calling our verification API');
  console.log(`API URL: ${API_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  try {
    await connectDB();
    
    const jobs = await getLastTenJobs();
    
    if (jobs.length === 0) {
      console.log('❌ No completed jobs found in database');
      return;
    }
    
    const results = [];
    
    // Run tests sequentially to avoid overloading the API
    for (let i = 0; i < jobs.length; i++) {
      const payload = prepareTestPayload(jobs[i]);
      
      if (!payload) {
        console.log(`⚠️  Skipping job ${i + 1} - Invalid payload`);
        continue;
      }
      
      const result = await runVerification(payload, i);
      results.push(result);
      
      // Add delay between requests
      if (i < jobs.length - 1) {
        console.log('\n⏳ Waiting 2 seconds before next test...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Print summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80) + '\n');
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const withTypeField = results.filter(r => r.has_type_field).length;
    const allFieldsPresent = results.filter(r => r.all_fields_present).length;
    
    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🔧 Type Field Present: ${withTypeField}/${results.length}`);
    console.log(`📋 All Fields Present: ${allFieldsPresent}/${results.length}`);
    
    if (successful > 0) {
      const avgScore = results
        .filter(r => r.success && r.score)
        .reduce((sum, r) => sum + r.score, 0) / successful;
      const avgTime = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.processing_time, 0) / successful;
      
      console.log(`\nAverage Score: ${avgScore.toFixed(1)}/100`);
      console.log(`Average Processing Time: ${avgTime.toFixed(0)}ms`);
    }
    
    // Detailed results table
    console.log('\n' + '='.repeat(80));
    console.log('DETAILED RESULTS');
    console.log('='.repeat(80) + '\n');
    
    console.log('Model'.padEnd(20) + 'Brand'.padEnd(20) + 'Category'.padEnd(20) + 'Type'.padEnd(20) + 'Score');
    console.log('-'.repeat(100));
    
    for (const result of results) {
      if (result.success) {
        const model = (result.sf_catalog_name || 'Unknown').substring(0, 18);
        const brand = (result.brand_verified || 'N/A').substring(0, 18);
        const category = (result.category_verified || 'N/A').substring(0, 18);
        const type = (result.type_verified || 'N/A').substring(0, 18);
        const score = result.score ? `${result.score}/100` : 'N/A';
        
        console.log(
          model.padEnd(20) +
          brand.padEnd(20) +
          category.padEnd(20) +
          type.padEnd(20) +
          score
        );
      } else {
        console.log(`${result.sf_catalog_name.substring(0, 18).padEnd(20)}ERROR: ${result.error}`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Final assessment
    console.log('\n🎯 INTEGRATION ASSESSMENT:\n');
    
    if (failed === 0 && withTypeField === results.length) {
      console.log('✅ ALL TESTS PASSED');
      console.log('✅ Type integration successful - no breaking changes detected');
      console.log('✅ Type_Verified field present in all responses');
    } else if (failed === 0 && withTypeField > 0) {
      console.log('✅ ALL TESTS PASSED');
      console.log('⚠️  Type field present in some responses - integration in progress');
    } else if (failed > 0) {
      console.log('⚠️  SOME TESTS FAILED');
      console.log(`   ${failed} verification(s) failed - review errors above`);
    }
    
    if (allFieldsPresent < results.length) {
      console.log(`\n⚠️  WARNING: ${results.length - allFieldsPresent} response(s) missing required fields`);
    }
    
    console.log('\n✅ Testing complete!\n');
    
  } catch (error) {
    console.error('\n❌ Test script error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
