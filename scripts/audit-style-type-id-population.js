#!/usr/bin/env node
/**
 * Comprehensive Style_Id and Type_Id Population Audit
 * Checks if master picklist migration is working correctly
 */

const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification')
  .then(async () => {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('   STYLE_ID & TYPE_ID POPULATION AUDIT');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const db = mongoose.connection.db;
    
    // Get total completed jobs
    const totalJobs = await db.collection('verification_jobs').countDocuments({ status: 'completed' });
    console.log('Total Completed Jobs: ' + totalJobs);
    
    // ==========================================
    // STYLE_ID ANALYSIS
    // ==========================================
    
    // Jobs with Style_Id populated (not null, not empty string)
    const styleIdPopulated = await db.collection('verification_jobs').countDocuments({
      status: 'completed',
      'primaryAttributes.Style_Id': { $exists: true, $ne: null, $ne: '' }
    });
    
    // Jobs with Style_Id blank/null
    const styleIdBlank = await db.collection('verification_jobs').countDocuments({
      status: 'completed',
      $or: [
        { 'primaryAttributes.Style_Id': { $exists: false } },
        { 'primaryAttributes.Style_Id': null },
        { 'primaryAttributes.Style_Id': '' }
      ]
    });
    
    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('STYLE_ID (Product_Style_Verified):');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('  ✅ Populated: ' + styleIdPopulated + ' (' + (styleIdPopulated/totalJobs*100).toFixed(1) + '%)');
    console.log('  ❌ Blank:     ' + styleIdBlank + ' (' + (styleIdBlank/totalJobs*100).toFixed(1) + '%)');
    
    // Get sample of jobs WITH Style_Id
    const samplesWithStyle = await db.collection('verification_jobs')
      .find({
        status: 'completed',
        'primaryAttributes.Style_Id': { $exists: true, $ne: null, $ne: '' }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    if (samplesWithStyle.length > 0) {
      console.log('\n  Sample Jobs WITH Style_Id:');
      samplesWithStyle.forEach((job, idx) => {
        console.log(`    ${idx + 1}. ${job.rawProduct?.Product_Name?.substring(0, 40) || 'N/A'}`);
        console.log(`       Style: "${job.primaryAttributes.Product_Style_Verified}" → ID: ${job.primaryAttributes.Style_Id}`);
        console.log(`       Date: ${job.createdAt?.toISOString()?.substring(0, 19)}`);
      });
    }
    
    // Get sample of jobs WITHOUT Style_Id
    const samplesWithoutStyle = await db.collection('verification_jobs')
      .find({
        status: 'completed',
        $or: [
          { 'primaryAttributes.Style_Id': { $exists: false } },
          { 'primaryAttributes.Style_Id': null },
          { 'primaryAttributes.Style_Id': '' }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    if (samplesWithoutStyle.length > 0) {
      console.log('\n  Sample Jobs WITHOUT Style_Id:');
      samplesWithoutStyle.forEach((job, idx) => {
        console.log(`    ${idx + 1}. ${job.rawProduct?.Product_Name?.substring(0, 40) || 'N/A'}`);
        console.log(`       Style: "${job.primaryAttributes?.Product_Style_Verified || 'BLANK'}" → ID: ${job.primaryAttributes?.Style_Id || 'BLANK'}`);
        console.log(`       Category: ${job.primaryAttributes?.Category_Verified || 'N/A'}`);
        console.log(`       Date: ${job.createdAt?.toISOString()?.substring(0, 19)}`);
      });
    }
    
    // ==========================================
    // TYPE_ID ANALYSIS
    // ==========================================
    
    // Jobs with Type_Id populated (not null, not empty string)
    const typeIdPopulated = await db.collection('verification_jobs').countDocuments({
      status: 'completed',
      'primaryAttributes.Type_Id': { $exists: true, $ne: null, $ne: '' }
    });
    
    // Jobs with Type_Id blank/null
    const typeIdBlank = await db.collection('verification_jobs').countDocuments({
      status: 'completed',
      $or: [
        { 'primaryAttributes.Type_Id': { $exists: false } },
        { 'primaryAttributes.Type_Id': null },
        { 'primaryAttributes.Type_Id': '' }
      ]
    });
    
    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('TYPE_ID (Type_Verified):');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`  ✅ Populated: ${typeIdPopulated} (${(typeIdPopulated/totalJobs*100).toFixed(1)}%)`);
    console.log(`  ❌ Blank:     ${typeIdBlank} (${(typeIdBlank/totalJobs*100).toFixed(1)}%)`);
    
    // Get sample of jobs WITH Type_Id
    const samplesWithType = await db.collection('verification_jobs')
      .find({
        status: 'completed',
        'primaryAttributes.Type_Id': { $exists: true, $ne: null, $ne: '' }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    if (samplesWithType.length > 0) {
      console.log('\n  Sample Jobs WITH Type_Id:');
      samplesWithType.forEach((job, idx) => {
        console.log(`    ${idx + 1}. ${job.rawProduct?.Product_Name?.substring(0, 40) || 'N/A'}`);
        console.log(`       Type: "${job.primaryAttributes.Type_Verified}" → ID: ${job.primaryAttributes.Type_Id}`);
        console.log(`       Category: ${job.primaryAttributes?.Category_Verified || 'N/A'}`);
        console.log(`       Date: ${job.createdAt?.toISOString()?.substring(0, 19)}`);
      });
    }
    
    // ==========================================
    // AFTER DEPLOYMENT CHECK
    // ==========================================
    
    const deploymentTime = new Date('2026-02-10T14:41:00Z');
    const jobsAfterDeployment = await db.collection('verification_jobs')
      .find({
        status: 'completed',
        createdAt: { $gte: deploymentTime }
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('JOBS AFTER DEPLOYMENT (' + deploymentTime.toISOString() + '):');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('  Found: ' + jobsAfterDeployment.length + ' jobs');
    
    if (jobsAfterDeployment.length > 0) {
      console.log('\n  Recent Jobs:');
      jobsAfterDeployment.forEach((job, idx) => {
        const hasStyleId = job.primaryAttributes?.Style_Id && job.primaryAttributes.Style_Id !== '';
        const hasTypeId = job.primaryAttributes?.Type_Id && job.primaryAttributes.Type_Id !== '';
        
        console.log('    ' + (idx + 1) + '. ' + (job.rawProduct?.Product_Name?.substring(0, 40) || 'N/A'));
        console.log('       Type:  "' + (job.primaryAttributes?.Type_Verified || 'BLANK') + '" → ' + (hasTypeId ? '✅' : '❌') + ' ' + (job.primaryAttributes?.Type_Id || 'BLANK'));
        console.log('       Style: "' + (job.primaryAttributes?.Product_Style_Verified || 'BLANK') + '" → ' + (hasStyleId ? '✅' : '❌') + ' ' + (job.primaryAttributes?.Style_Id || 'BLANK'));
        console.log('       Date: ' + (job.createdAt?.toISOString() || 'N/A'));
      });
    } else {
      console.log('\n  ⚠️  NO JOBS FOUND AFTER DEPLOYMENT');
      console.log('  Waiting for Salesforce to send new API calls...');
    }
    
    // ==========================================
    // SUMMARY & RECOMMENDATIONS
    // ==========================================
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('SUMMARY & RECOMMENDATIONS:');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    if (styleIdPopulated === 0) {
      console.log('🔴 CRITICAL: Style_Id is NEVER populated (0%)');
      console.log('   → Master picklist migration may not be working');
      console.log('   → Check if master-picklist-helpers.ts is being loaded');
    } else if (styleIdPopulated < totalJobs * 0.5) {
      console.log(`⚠️  WARNING: Style_Id only populated ${(styleIdPopulated/totalJobs*100).toFixed(1)}% of the time`);
      console.log('   → Most products may not have matching design styles');
      console.log('   → This is EXPECTED if products are functional items');
    } else {
      console.log(`✅ Style_Id populated ${(styleIdPopulated/totalJobs*100).toFixed(1)}% of the time`);
    }
    
    if (typeIdPopulated < totalJobs * 0.8) {
      console.log(`\n⚠️  WARNING: Type_Id only populated ${(typeIdPopulated/totalJobs*100).toFixed(1)}% of the time`);
      console.log('   → Most categories should have types');
      console.log('   → Review type mappings in category-type-mapping.json');
    } else {
      console.log(`\n✅ Type_Id populated ${(typeIdPopulated/totalJobs*100).toFixed(1)}% of the time`);
    }
    
    if (jobsAfterDeployment.length === 0) {
      console.log('\n📊 NO NEW JOBS SINCE DEPLOYMENT');
      console.log('   → Waiting for Salesforce to send API calls');
      console.log('   → Cannot verify if master picklist migration is working');
      console.log('   → Request Salesforce to send a test product');
    } else {
      const postDeployWithStyle = jobsAfterDeployment.filter(j => j.primaryAttributes?.Style_Id && j.primaryAttributes.Style_Id !== '').length;
      const postDeployWithType = jobsAfterDeployment.filter(j => j.primaryAttributes?.Type_Id && j.primaryAttributes.Type_Id !== '').length;
      
      console.log('\n📊 POST-DEPLOYMENT STATS (' + jobsAfterDeployment.length + ' jobs):');
      console.log('   Style_Id: ' + postDeployWithStyle + '/' + jobsAfterDeployment.length + ' (' + (postDeployWithStyle/jobsAfterDeployment.length*100).toFixed(1) + '%)');
      console.log('   Type_Id:  ' + postDeployWithType + '/' + jobsAfterDeployment.length + ' (' + (postDeployWithType/jobsAfterDeployment.length*100).toFixed(1) + '%)');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err.message);
    mongoose.connection.close();
    process.exit(1);
  });
