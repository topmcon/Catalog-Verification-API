/**
 * Production Job Analysis Script
 * Analyzes completed verification jobs for data quality issues
 * 
 * Run via SSH:
 * ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node scripts/analyze-production-jobs.js"
 */

const { MongoClient } = require('mongodb');

async function analyzeJobs() {
  const client = new MongoClient('mongodb://127.0.0.1:27017/catalog-verification');
  await client.connect();
  
  const db = client.db('catalog-verification');
  const collection = db.collection('verification_jobs');
  
  console.log('='.repeat(80));
  console.log('PRODUCTION JOB ANALYSIS');
  console.log('='.repeat(80));
  
  // Get recent completed jobs with results
  const jobs = await collection.find({
    status: 'completed',
    result: { $exists: true }
  }).sort({ completedAt: -1 }).limit(50).toArray();
  
  console.log(`\nAnalyzing ${jobs.length} recent jobs...\n`);
  
  const issues = {
    brandMismatch: [],
    categoryMismatch: [],
    urlDomainMismatch: [],
    emptyResults: [],
    missingStyleId: [],
    inconsistentRuns: []
  };
  
  // Track jobs by model for consistency check
  const jobsByModel = new Map();
  
  for (const job of jobs) {
    const raw = job.rawPayload || {};
    const result = job.result || {};
    const primary = result.Primary_Attributes || {};
    
    const model = job.sfCatalogName || raw.SF_Catalog_Name || raw.Ferguson_Model_Number;
    
    // Group by model for consistency analysis
    if (model) {
      if (!jobsByModel.has(model)) {
        jobsByModel.set(model, []);
      }
      jobsByModel.get(model).push({
        jobId: job.jobId,
        inputBrand: raw.Ferguson_Brand || raw.Brand_Name_Web_Retailer,
        outputBrand: primary.Brand_Verified,
        inputCategory: raw.Ferguson_Base_Category || raw.Category_Web_Retailer,
        outputCategory: primary.Category_Verified,
        referenceUrl: raw.Reference_URL
      });
    }
    
    // Check 1: Empty results
    if (!primary.Brand_Verified && !primary.Category_Verified) {
      issues.emptyResults.push({
        jobId: job.jobId.substring(0, 8),
        model,
        inputBrand: raw.Ferguson_Brand
      });
      continue;
    }
    
    // Check 2: Brand mismatch
    const inputBrand = (raw.Ferguson_Brand || raw.Brand_Name_Web_Retailer || '').toLowerCase().trim();
    const outputBrand = (primary.Brand_Verified || '').toLowerCase().trim();
    
    if (inputBrand && outputBrand && !outputBrand.includes(inputBrand.split(' ')[0]) && !inputBrand.includes(outputBrand.split(' ')[0])) {
      issues.brandMismatch.push({
        jobId: job.jobId.substring(0, 8),
        model,
        inputBrand: raw.Ferguson_Brand,
        outputBrand: primary.Brand_Verified,
        referenceUrl: raw.Reference_URL
      });
    }
    
    // Check 3: Reference URL domain mismatch
    const refUrl = (raw.Reference_URL || '').toLowerCase();
    if (refUrl && inputBrand) {
      // Extract domain from URL
      let urlDomain = '';
      try {
        const url = new URL(refUrl);
        urlDomain = url.hostname.replace('www.', '').split('.')[0];
      } catch (e) {
        urlDomain = refUrl.split('/')[2]?.replace('www.', '').split('.')[0] || '';
      }
      
      // Check if URL domain matches brand
      const brandNorm = inputBrand.replace(/[^a-z0-9]/gi, '').toLowerCase();
      const urlNorm = urlDomain.replace(/[^a-z0-9]/gi, '').toLowerCase();
      
      if (urlNorm && brandNorm && !urlNorm.includes(brandNorm.substring(0, 4)) && !brandNorm.includes(urlNorm.substring(0, 4))) {
        issues.urlDomainMismatch.push({
          jobId: job.jobId.substring(0, 8),
          model,
          inputBrand,
          urlDomain,
          fullUrl: refUrl.substring(0, 60)
        });
      }
    }
    
    // Check 4: Missing style ID when style is populated
    if (primary.Product_Style_Verified && !primary.Style_Id) {
      issues.missingStyleId.push({
        jobId: job.jobId.substring(0, 8),
        model,
        style: primary.Product_Style_Verified
      });
    }
  }
  
  // Check 5: Inconsistent results for same model
  for (const [model, runs] of jobsByModel) {
    if (runs.length > 1) {
      const uniqueBrands = new Set(runs.map(r => r.outputBrand).filter(Boolean));
      const uniqueCategories = new Set(runs.map(r => r.outputCategory).filter(Boolean));
      
      if (uniqueBrands.size > 1 || uniqueCategories.size > 1) {
        issues.inconsistentRuns.push({
          model,
          runCount: runs.length,
          brands: Array.from(uniqueBrands),
          categories: Array.from(uniqueCategories),
          inputBrand: runs[0].inputBrand
        });
      }
    }
  }
  
  // Print results
  console.log('\n' + '='.repeat(40));
  console.log('🚨 CRITICAL: Brand Mismatches');
  console.log('='.repeat(40));
  if (issues.brandMismatch.length === 0) {
    console.log('✅ None found');
  } else {
    for (const issue of issues.brandMismatch) {
      console.log(`\nJob ${issue.jobId} (${issue.model}):`);
      console.log(`  Input Brand:  ${issue.inputBrand}`);
      console.log(`  Output Brand: ${issue.outputBrand}`);
      if (issue.referenceUrl) console.log(`  Ref URL: ${issue.referenceUrl.substring(0, 50)}`);
    }
  }
  
  console.log('\n' + '='.repeat(40));
  console.log('🚨 CRITICAL: URL Domain Mismatches');
  console.log('='.repeat(40));
  if (issues.urlDomainMismatch.length === 0) {
    console.log('✅ None found');
  } else {
    for (const issue of issues.urlDomainMismatch) {
      console.log(`\nJob ${issue.jobId} (${issue.model}):`);
      console.log(`  Brand:  ${issue.inputBrand}`);
      console.log(`  URL Domain: ${issue.urlDomain}`);
      console.log(`  Full URL: ${issue.fullUrl}`);
    }
  }
  
  console.log('\n' + '='.repeat(40));
  console.log('⚠️ WARNING: Inconsistent Results for Same Model');
  console.log('='.repeat(40));
  if (issues.inconsistentRuns.length === 0) {
    console.log('✅ None found');
  } else {
    for (const issue of issues.inconsistentRuns) {
      console.log(`\nModel ${issue.model} (${issue.runCount} runs):`);
      console.log(`  Input Brand: ${issue.inputBrand}`);
      console.log(`  Output Brands: ${issue.brands.join(', ')}`);
      console.log(`  Output Categories: ${issue.categories.join(', ')}`);
    }
  }
  
  console.log('\n' + '='.repeat(40));
  console.log('📊 SUMMARY');
  console.log('='.repeat(40));
  console.log(`Total jobs analyzed: ${jobs.length}`);
  console.log(`Empty results: ${issues.emptyResults.length}`);
  console.log(`Brand mismatches: ${issues.brandMismatch.length}`);
  console.log(`URL domain mismatches: ${issues.urlDomainMismatch.length}`);
  console.log(`Inconsistent model runs: ${issues.inconsistentRuns.length}`);
  console.log(`Styles without IDs: ${issues.missingStyleId.length}`);
  
  await client.close();
}

analyzeJobs().catch(console.error);
