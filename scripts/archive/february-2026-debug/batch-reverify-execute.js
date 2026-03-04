#!/usr/bin/env node
/**
 * Batch Re-Verification Executor
 * 
 * Purpose: Takes input file from batch-reverify-last25.js and re-runs
 * all products through the current verification logic via API calls.
 * 
 * Usage: node scripts/batch-reverify-execute.js <input-file.json>
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const API_URL = process.env.API_URL || 'https://verify.cxc-ai.com';
const API_KEY = process.env.SALESFORCE_API_KEY || 'your-api-key-here';
const OUTPUT_DIR = path.join(__dirname, '..', 'audit-results');

async function makeVerificationRequest(productData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      salesforce_record_id: productData.salesforce_record_id,
      manufacturer_name: productData.manufacturer_name,
      product_title: productData.product_title,
      manufacturer_category: productData.manufacturer_category,
      model_number: productData.model_number,
      short_description: productData.short_description,
      long_description: productData.long_description,
      specifications: productData.specifications,
      image_urls: productData.image_urls
    });

    const url = new URL('/api/verify/salesforce', API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-API-Key': API_KEY
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            success: res.statusCode === 200 || res.statusCode === 202,
            statusCode: res.statusCode,
            data: response
          });
        } catch (error) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            error: 'Failed to parse response',
            body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║            BATCH RE-VERIFICATION EXECUTOR                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('❌ Error: Input file required');
    console.log('\nUsage: node scripts/batch-reverify-execute.js <input-file.json>');
    process.exit(1);
  }

  try {
    // Load input file
    console.log(`📥 Loading input file: ${inputFile}\n`);
    const inputData = JSON.parse(await fs.readFile(inputFile, 'utf8'));
    
    console.log(`✅ Loaded ${inputData.length} products to verify\n`);
    console.log('🚀 Starting re-verification process...\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Process each product
    for (let i = 0; i < inputData.length; i++) {
      const product = inputData[i];
      const num = i + 1;

      console.log(`[${num}/${inputData.length}] Processing: ${product.product_title?.substring(0, 60)}...`);
      console.log(`  SKU/Model: ${product.model_number || 'N/A'}`);
      console.log(`  Original Job ID: ${product.original_job_id}`);

      try {
        const response = await makeVerificationRequest(product);
        
        if (response.success) {
          successCount++;
          console.log(`  ✅ Success (Status: ${response.statusCode})`);
          console.log(`  Job ID: ${response.data.job_id || 'N/A'}`);
          
          results.push({
            original_job_id: product.original_job_id,
            salesforce_id: product.salesforce_record_id,
            success: true,
            new_job_id: response.data.job_id,
            status: response.data.status,
            response: response.data,
            timestamp: new Date().toISOString()
          });
        } else {
          failureCount++;
          console.log(`  ❌ Failed (Status: ${response.statusCode})`);
          console.log(`  Error: ${response.error || JSON.stringify(response.data).substring(0, 100)}`);
          
          results.push({
            original_job_id: product.original_job_id,
            salesforce_id: product.salesforce_record_id,
            success: false,
            error: response.error || response.data,
            statusCode: response.statusCode,
            timestamp: new Date().toISOString()
          });
        }

        // Add delay to avoid overwhelming the API
        if (i < inputData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }

      } catch (error) {
        failureCount++;
        console.log(`  ❌ Exception: ${error.message}`);
        
        results.push({
          original_job_id: product.original_job_id,
          salesforce_id: product.salesforce_record_id,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      console.log('');
    }

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(OUTPUT_DIR, `batch-reverify-new-results-${timestamp}.json`);
    
    await fs.writeFile(outputFile, JSON.stringify(results, null, 2));

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    EXECUTION SUMMARY                           ');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`Total Products: ${inputData.length}`);
    console.log(`✅ Successful: ${successCount} (${((successCount/inputData.length)*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failureCount} (${((failureCount/inputData.length)*100).toFixed(1)}%)`);
    console.log(`\n📁 Results saved to: ${outputFile}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('⏭️  NEXT STEP: Wait for all jobs to complete processing (~2-3 minutes per job)');
    console.log('   Then extract final results and run comparison audit:\n');
    console.log(`   node scripts/batch-reverify-fetch-results.js ${outputFile}`);
    console.log('');

  } catch (error) {
    console.error('❌ Fatal Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
