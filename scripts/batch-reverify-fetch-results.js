#!/usr/bin/env node
/**
 * Batch Re-Verification Results Fetcher
 * 
 * Purpose: Monitors and fetches completed results from re-verification jobs
 * 
 * Usage: node scripts/batch-reverify-fetch-results.js <execution-results-file.json>
 */

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

const MONGO_URL = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'catalog-verification';
const OUTPUT_DIR = path.join(__dirname, '..', 'audit-results');

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         BATCH RE-VERIFICATION RESULTS FETCHER                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const executionFile = process.argv[2];
  if (!executionFile) {
    console.error('❌ Error: Execution results file required');
    console.log('\nUsage: node scripts/batch-reverify-fetch-results.js <execution-results-file.json>');
    process.exit(1);
  }

  const client = await MongoClient.connect(MONGO_URL);
  const db = client.db(DB_NAME);

  try {
    // Load execution results
    console.log(`📥 Loading execution results: ${executionFile}\n`);
    const executionResults = JSON.parse(await fs.readFile(executionFile, 'utf8'));
    
    const successfulJobs = executionResults.filter(r => r.success && r.new_job_id);
    console.log(`✅ Found ${successfulJobs.length} successful job submissions\n`);

    if (successfulJobs.length === 0) {
      console.log('⚠️  No successful jobs to fetch. Exiting.');
      await client.close();
      return;
    }

    // Extract job IDs
    const jobIds = successfulJobs.map(j => j.new_job_id);
    
    console.log('🔍 Checking job completion status...\n');

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts × 10 seconds = 10 minutes max wait
    let completedJobs = [];

    while (attempts < maxAttempts) {
      completedJobs = await db.collection('verification_jobs').find({
        _id: { $in: jobIds },
        status: 'completed'
      }).toArray();

      const pendingCount = jobIds.length - completedJobs.length;
      
      process.stdout.write(`\r  Completed: ${completedJobs.length}/${jobIds.length} | Pending: ${pendingCount} | Attempt: ${attempts + 1}/${maxAttempts}`);

      if (completedJobs.length === jobIds.length) {
        console.log('\n\n✅ All jobs completed!\n');
        break;
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }

    if (completedJobs.length < jobIds.length) {
      console.log(`\n\n⚠️  Only ${completedJobs.length}/${jobIds.length} jobs completed after ${maxAttempts * 10} seconds`);
      console.log('   Proceeding with available results...\n');
    }

    // Extract new responses
    console.log('📊 Extracting new responses...\n');

    const newResults = completedJobs.map(job => {
      const consensus = job.ai_consensus || {};
      
      return {
        job_id: job._id,
        original_job_id: successfulJobs.find(j => j.new_job_id === job._id)?.original_job_id,
        salesforce_id: job.salesforce_record_id,
        created_at: job.created_at,
        processing_time_ms: job.processing_time_ms,
        product_data: {
          manufacturer_name: job.product_data?.manufacturer_name || 'Unknown',
          product_title: job.product_data?.product_title || 'Unknown',
          manufacturer_category: job.product_data?.manufacturer_category || 'Unknown',
          model_number: job.product_data?.model_number
        },
        new_response: {
          category: consensus.product_category?.final_value,
          category_source: consensus.product_category?.source,
          category_openai: consensus.product_category?.openai?.value,
          category_xai: consensus.product_category?.xai?.value,
          category_confidence: consensus.product_category?.openai?.confidence || consensus.product_category?.xai?.confidence,
          type: consensus.product_type?.final_value,
          type_source: consensus.product_type?.source,
          type_openai: consensus.product_type?.openai?.value,
          type_xai: consensus.product_type?.xai?.value,
          type_confidence: consensus.product_type?.openai?.confidence || consensus.product_type?.xai?.confidence,
          style: consensus.product_style?.final_value,
          style_source: consensus.product_style?.source,
          style_openai: consensus.product_style?.openai?.value,
          style_xai: consensus.product_style?.xai?.value,
          style_confidence: consensus.product_style?.openai?.confidence || consensus.product_style?.xai?.confidence,
          brand: consensus.brand?.final_value,
          department: consensus.department?.final_value,
          family: consensus.product_family?.final_value,
          color: consensus.color?.final_value,
          finish: consensus.finish?.final_value,
          title: consensus.product_title?.final_value
        }
      };
    });

    // Save new results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(OUTPUT_DIR, `batch-reverify-fetched-${timestamp}.json`);
    
    await fs.writeFile(outputFile, JSON.stringify(newResults, null, 2));
    
    console.log(`✅ New responses saved to: ${outputFile}\n`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    FETCH SUMMARY                               ');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`Jobs Submitted: ${jobIds.length}`);
    console.log(`Jobs Completed: ${completedJobs.length}`);
    console.log(`Results Extracted: ${newResults.length}`);
    console.log(`\n📁 Results saved to: ${outputFile}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('⏭️  FINAL STEP: Run comparison audit:\n');
    console.log(`   node scripts/batch-reverify-audit.js <original-file> ${outputFile}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

main().catch(console.error);
