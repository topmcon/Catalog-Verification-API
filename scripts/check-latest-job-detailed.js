#!/usr/bin/env node
/**
 * Check the most recent verification job in detail
 */

const mongoose = require('mongoose');
require('dotenv').config();

const VerificationJob = require('../dist/models/verification-job.model').VerificationJob;

async function checkLatestJob() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification';
  
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    const latestJob = await VerificationJob.findOne()
      .sort({ createdAt: -1 })
      .lean();
    
    if (!latestJob) {
      console.log('❌ No jobs found');
      return;
    }
    
    console.log('📋 LATEST VERIFICATION JOB');
    console.log('='.repeat(70));
    console.log(`Job ID: ${latestJob.jobId}`);
    console.log(`SF Catalog ID: ${latestJob.sfCatalogId}`);
    console.log(`Model: ${latestJob.sfCatalogName}`);
    console.log(`Status: ${latestJob.status}`);
    console.log(`Created: ${new Date(latestJob.createdAt).toLocaleString()}`);
    console.log(`Processing Time: ${latestJob.processingTime || 'N/A'}ms`);
    
    console.log('\n🔍 ERROR DETAILS:');
    if (latestJob.errorMessage) {
      console.log(`Error Message: ${latestJob.errorMessage}`);
    } else {
      console.log('No error message');
    }
    
    if (latestJob.errorDetails) {
      console.log('Error Details:', JSON.stringify(latestJob.errorDetails, null, 2));
    } else {
      console.log('No error details');
    }
    
    console.log('\n📊 RESPONSE DATA:');
    if (latestJob.response) {
      console.log('Response exists: YES');
      console.log('Response keys:', Object.keys(latestJob.response));
      
      if (latestJob.response.Primary_Attributes) {
        console.log('\nPrimary Attributes:');
        console.log(JSON.stringify(latestJob.response.Primary_Attributes, null, 2));
      } else {
        console.log('\nPrimary Attributes: MISSING');
      }
      
      if (latestJob.response.Verification_Metadata) {
        console.log('\nVerification Metadata:');
        console.log(JSON.stringify(latestJob.response.Verification_Metadata, null, 2));
      } else {
        console.log('\nVerification Metadata: MISSING');
      }
    } else {
      console.log('Response: MISSING');
    }
    
    console.log('\n🤖 AI RESULTS:');
    if (latestJob.openaiResult || latestJob.xaiResult) {
      console.log('OpenAI Result exists:', !!latestJob.openaiResult);
      console.log('xAI Result exists:', !!latestJob.xaiResult);
      
      if (latestJob.openaiResult) {
        console.log('\nOpenAI Result keys:', Object.keys(latestJob.openaiResult));
      }
      if (latestJob.xaiResult) {
        console.log('xAI Result keys:', Object.keys(latestJob.xaiResult));
      }
    } else {
      console.log('No AI results stored');
    }
    
    console.log('\n' + '='.repeat(70));
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkLatestJob();
