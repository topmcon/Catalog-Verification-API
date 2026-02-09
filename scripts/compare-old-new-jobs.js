#!/usr/bin/env node
/**
 * Compare old working job vs new failing jobs
 */

const mongoose = require('mongoose');
require('dotenv').config();

const VerificationJob = require('../dist/models/verification-job.model').VerificationJob;

async function compareJobs() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification';
  
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    // Get an old job (before today)
    const oldJob = await VerificationJob.findOne({
      createdAt: { $lt: new Date('2026-02-09') },
      status: 'completed'
    }).sort({ createdAt: -1 }).lean();
    
    // Get a recent job (from today)
    const newJob = await VerificationJob.findOne({
      createdAt: { $gte: new Date('2026-02-09') }
    }).sort({ createdAt: -1 }).lean();
    
    console.log('OLD JOB (Working):');
    console.log('='.repeat(70));
    if (oldJob) {
      console.log(`Created: ${new Date(oldJob.createdAt).toLocaleString()}`);
      console.log(`Has Response: ${!!oldJob.response}`);
      console.log(`Has Primary Attributes: ${!!oldJob.response?.Primary_Attributes}`);
      
      if (oldJob.response?.Primary_Attributes) {
        const attrs = oldJob.response.Primary_Attributes;
        console.log(`\nFields in old response:`);
        console.log(`  Brand_Verified: ${!!attrs.Brand_Verified}`);
        console.log(`  Category_Verified: ${!!attrs.Category_Verified}`);
        console.log(`  Product_Style_Verified: ${!!attrs.Product_Style_Verified}`);
        console.log(`  Type_Verified: ${!!attrs.Type_Verified} ${attrs.Type_Verified ? `(value: "${attrs.Type_Verified}")` : ''}`);
        console.log(`  Type_Id: ${!!attrs.Type_Id} ${attrs.Type_Id !== undefined ? `(value: ${attrs.Type_Id})` : ''}`);
      }
    } else {
      console.log('No old jobs found');
    }
    
    console.log('\n\nNEW JOB (From today):');
    console.log('='.repeat(70));
    if (newJob) {
      console.log(`Created: ${new Date(newJob.createdAt).toLocaleString()}`);
      console.log(`Status: ${newJob.status}`);
      console.log(`Has Response: ${!!newJob.response}`);
      console.log(`Has Error: ${!!newJob.errorMessage}`);
      
      if (newJob.errorMessage) {
        console.log(`\nError: ${newJob.errorMessage}`);
      }
      
      if (newJob.response?.Primary_Attributes) {
        const attrs = newJob.response.Primary_Attributes;
        console.log(`\nFields in new response:`);
        console.log(`  Brand_Verified: ${!!attrs.Brand_Verified}`);
        console.log(`  Category_Verified: ${!!attrs.Category_Verified}`);
        console.log(`  Product_Style_Verified: ${!!attrs.Product_Style_Verified}`);
        console.log(`  Type_Verified: ${!!attrs.Type_Verified} ${attrs.Type_Verified ? `(value: "${attrs.Type_Verified}")` : ''}`);
        console.log(`  Type_Id: ${!!attrs.Type_Id} ${attrs.Type_Id !== undefined ? `(value: ${attrs.Type_Id})` : ''}`);
      } else {
        console.log('\n❌ No Primary_Attributes in response!');
      }
    } else {
      console.log('No new jobs found');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

compareJobs();
