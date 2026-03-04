#!/usr/bin/env node
/**
 * Batch Quality Audit - Check for NOT APPLICABLE, blanks, and data quality issues
 */

const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/catalog-verification';

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    console.log('🔌 Connected to MongoDB\n');
    
    const JobSchema = new mongoose.Schema({}, { strict: false, collection: 'verification_jobs' });
    const Job = mongoose.model('Job', JobSchema);
    
    // Get all completed jobs (limit to recent batch for performance)
    const jobs = await Job.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(500);
    
    console.log('═'.repeat(80));
    console.log('📊 BATCH QUALITY AUDIT - DATA VALIDATION REPORT');
    console.log('═'.repeat(80));
    console.log(`\nTotal Completed Jobs: ${jobs.length}\n`);
    
    const issues = {
      brandNotApplicable: [],
      categoryNotApplicable: [],
      styleNotApplicable: [],
      brandBlank: [],
      categoryBlank: [],
      titleBlank: [],
      weightBlank: [],
      allGood: []
    };
    
    jobs.forEach((job, idx) => {
      const primary = job.result?.Primary_Attributes || {};
      const model = job.sfCatalogName || job.rawPayload?.Model_Number || 'N/A';
      const jobId = job.jobId || job._id.toString().substring(0, 8);
      
      const jobInfo = {
        num: idx + 1,
        jobId,
        product: model.substring(0, 60),
        brand: primary.AI_Brand,
        category: primary.AI_Product_Category,
        style: primary.AI_Style,
        title: primary.AI_Product_Title,
        weight: primary.AI_Weight
      };
      
      let hasIssue = false;
      
      // Check for NOT APPLICABLE
      if (primary.AI_Brand === 'NOT APPLICABLE') {
        issues.brandNotApplicable.push(jobInfo);
        hasIssue = true;
      }
      if (primary.AI_Product_Category === 'NOT APPLICABLE') {
        issues.categoryNotApplicable.push(jobInfo);
        hasIssue = true;
      }
      if (primary.AI_Style === 'NOT APPLICABLE' || primary.AI_Style === 'Not Applicable') {
        issues.styleNotApplicable.push(jobInfo);
        hasIssue = true;
      }
      
      // Check for blanks/nulls
      if (!primary.AI_Brand || primary.AI_Brand === '') {
        issues.brandBlank.push(jobInfo);
        hasIssue = true;
      }
      if (!primary.AI_Product_Category || primary.AI_Product_Category === '') {
        issues.categoryBlank.push(jobInfo);
        hasIssue = true;
      }
      if (!primary.AI_Product_Title || primary.AI_Product_Title === '') {
        issues.titleBlank.push(jobInfo);
        hasIssue = true;
      }
      if (!primary.AI_Weight || primary.AI_Weight === '') {
        issues.weightBlank.push(jobInfo);
        hasIssue = true;
      }
      
      if (!hasIssue) {
        issues.allGood.push(jobInfo);
      }
    });
    
    // Print summary
    console.log('📈 SUMMARY:\n');
    console.log(`  ✅ Clean Results: ${issues.allGood.length} (${((issues.allGood.length/jobs.length)*100).toFixed(1)}%)`);
    console.log(`  ⚠️  Brand NOT APPLICABLE: ${issues.brandNotApplicable.length}`);
    console.log(`  ⚠️  Category NOT APPLICABLE: ${issues.categoryNotApplicable.length}`);
    console.log(`  ⚠️  Style NOT APPLICABLE: ${issues.styleNotApplicable.length}`);
    console.log(`  ⚠️  Brand BLANK: ${issues.brandBlank.length}`);
    console.log(`  ⚠️  Category BLANK: ${issues.categoryBlank.length}`);
    console.log(`  ⚠️  Title BLANK: ${issues.titleBlank.length}`);
    console.log(`  ⚠️  Weight BLANK: ${issues.weightBlank.length}`);
    
    // Print details of issues
    function printIssues(title, issueList, maxShow = 20) {
      if (issueList.length > 0) {
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`${title} (${issueList.length} items):`);
        console.log('─'.repeat(80));
        
        issueList.slice(0, maxShow).forEach((item) => {
          console.log(`\n  [${item.num}] Job: ${item.jobId}`);
          console.log(`      Product: ${item.product}`);
          console.log(`      Brand: ${item.brand || '❌ MISSING'}`);
          console.log(`      Category: ${item.category || '❌ MISSING'}`);
          console.log(`      Style: ${item.style || '❌ MISSING'}`);
        });
        
        if (issueList.length > maxShow) {
          console.log(`\n  ... and ${issueList.length - maxShow} more`);
        }
      }
    }
    
    printIssues('⚠️  BRAND NOT APPLICABLE', issues.brandNotApplicable);
    printIssues('⚠️  CATEGORY NOT APPLICABLE', issues.categoryNotApplicable);
    printIssues('⚠️  STYLE NOT APPLICABLE', issues.styleNotApplicable);
    printIssues('⚠️  BRAND BLANK/NULL', issues.brandBlank);
    printIssues('⚠️  CATEGORY BLANK/NULL', issues.categoryBlank);
    printIssues('⚠️  TITLE BLANK/NULL', issues.titleBlank);
    printIssues('⚠️  WEIGHT BLANK/NULL', issues.weightBlank);
    
    console.log(`\n${'═'.repeat(80)}\n`);
    
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
