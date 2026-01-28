/**
 * Re-run verification jobs and compare results
 * Usage: node scripts/rerun-and-compare.js
 */

const fs = require('fs');
const https = require('https');
const http = require('http');

// Load payloads
const payloadsData = JSON.parse(fs.readFileSync('/tmp/all-payloads.json', 'utf8'));

// API endpoint
const API_URL = process.env.API_URL || 'https://verify.cxc-ai.com';
const API_KEY = process.env.API_KEY || 'test-key';

async function callVerificationAPI(payload) {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/verify/salesforce', API_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const data = JSON.stringify(payload);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'x-api-key': API_KEY
      },
      timeout: 120000 // 2 minute timeout for AI processing
    };
    
    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, parseError: true });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(data);
    req.end();
  });
}

async function runComparison() {
  console.log('='.repeat(80));
  console.log('RE-RUNNING VERIFICATION JOBS WITH NEW CODE');
  console.log('='.repeat(80));
  console.log(`\nTotal jobs to process: ${payloadsData.length}\n`);
  
  const results = [];
  
  for (let i = 0; i < payloadsData.length; i++) {
    const job = payloadsData[i];
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`[${i + 1}/${payloadsData.length}] Processing: ${job.sfCatalogName}`);
    console.log(`OLD Result: Brand="${job.oldBrand}", Category="${job.oldCategory}"`);
    
    if (!job.payload || Object.keys(job.payload).length === 0) {
      console.log('⚠️  SKIPPED - Empty payload');
      results.push({
        sfCatalogName: job.sfCatalogName,
        status: 'skipped',
        reason: 'Empty payload'
      });
      continue;
    }
    
    try {
      console.log('Calling API...');
      const startTime = Date.now();
      const response = await callVerificationAPI(job.payload);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      if (response.status === 200 && response.data?.Primary_Attributes) {
        const newBrand = response.data.Primary_Attributes.Brand_Verified || '';
        const newCategory = response.data.Primary_Attributes.Category_Verified || '';
        const newStyle = response.data.Primary_Attributes.Product_Style_Verified || '';
        
        const brandChanged = newBrand !== job.oldBrand;
        const categoryChanged = newCategory !== job.oldCategory;
        
        console.log(`NEW Result: Brand="${newBrand}", Category="${newCategory}", Style="${newStyle}"`);
        console.log(`Time: ${elapsed}s | Status: ${response.status}`);
        
        if (brandChanged || categoryChanged) {
          console.log(`\n🔄 CHANGES DETECTED:`);
          if (brandChanged) console.log(`   Brand: "${job.oldBrand}" → "${newBrand}"`);
          if (categoryChanged) console.log(`   Category: "${job.oldCategory}" → "${newCategory}"`);
        } else {
          console.log(`✅ No changes in Brand/Category`);
        }
        
        // Check for coherence warnings/errors in metadata
        const metadata = response.data.Verification_Metadata || {};
        if (metadata.data_coherence_warnings?.length > 0) {
          console.log(`\n⚠️  DATA COHERENCE WARNINGS:`);
          metadata.data_coherence_warnings.forEach(w => console.log(`   - ${w}`));
        }
        
        results.push({
          sfCatalogName: job.sfCatalogName,
          status: 'success',
          oldBrand: job.oldBrand,
          newBrand,
          oldCategory: job.oldCategory,
          newCategory,
          newStyle,
          brandChanged,
          categoryChanged,
          processingTime: elapsed,
          coherenceWarnings: metadata.data_coherence_warnings || []
        });
        
      } else if (response.status === 400) {
        // Could be a data coherence rejection
        console.log(`\n🚫 REQUEST REJECTED (400):`);
        const errMsg = response.data?.error || response.data?.message || JSON.stringify(response.data).substring(0, 200);
        console.log(`   ${errMsg}`);
        
        results.push({
          sfCatalogName: job.sfCatalogName,
          status: 'rejected',
          statusCode: 400,
          oldBrand: job.oldBrand,
          oldCategory: job.oldCategory,
          error: errMsg,
          processingTime: elapsed
        });
        
      } else {
        console.log(`❌ API Error: Status ${response.status}`);
        results.push({
          sfCatalogName: job.sfCatalogName,
          status: 'error',
          statusCode: response.status,
          error: response.data
        });
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
      results.push({
        sfCatalogName: job.sfCatalogName,
        status: 'error',
        error: error.message
      });
    }
    
    // Small delay between requests
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  const successful = results.filter(r => r.status === 'success');
  const rejected = results.filter(r => r.status === 'rejected');
  const errors = results.filter(r => r.status === 'error');
  const skipped = results.filter(r => r.status === 'skipped');
  const brandChanges = successful.filter(r => r.brandChanged);
  const categoryChanges = successful.filter(r => r.categoryChanged);
  
  console.log(`\nTotal processed: ${results.length}`);
  console.log(`  ✅ Successful: ${successful.length}`);
  console.log(`  🚫 Rejected (coherence): ${rejected.length}`);
  console.log(`  ❌ Errors: ${errors.length}`);
  console.log(`  ⚠️  Skipped: ${skipped.length}`);
  console.log(`\nChanges detected:`);
  console.log(`  Brand changes: ${brandChanges.length}`);
  console.log(`  Category changes: ${categoryChanges.length}`);
  
  if (brandChanges.length > 0) {
    console.log(`\n📋 Brand Changes:`);
    brandChanges.forEach(r => {
      console.log(`  ${r.sfCatalogName}: "${r.oldBrand}" → "${r.newBrand}"`);
    });
  }
  
  if (categoryChanges.length > 0) {
    console.log(`\n📋 Category Changes:`);
    categoryChanges.forEach(r => {
      console.log(`  ${r.sfCatalogName}: "${r.oldCategory}" → "${r.newCategory}"`);
    });
  }
  
  if (rejected.length > 0) {
    console.log(`\n🚫 Rejected Jobs (Data Coherence Issues):`);
    rejected.forEach(r => {
      console.log(`  ${r.sfCatalogName}: ${r.error?.substring(0, 100)}`);
    });
  }
  
  // Save detailed results
  fs.writeFileSync('/tmp/comparison-results.json', JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to /tmp/comparison-results.json`);
}

runComparison().catch(console.error);
