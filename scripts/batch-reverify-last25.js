#!/usr/bin/env node
/**
 * Batch Re-Verification Script for Last 25 Products
 * 
 * Purpose: Pull last 25 completed jobs, re-run through current verification logic,
 * compare original vs new results, and generate comprehensive audit report.
 * 
 * Usage: node scripts/batch-reverify-last25.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

const MONGO_URL = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'catalog-verification';
const OUTPUT_DIR = path.join(__dirname, '..', 'audit-results');

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         BATCH RE-VERIFICATION & AUDIT SYSTEM                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const client = await MongoClient.connect(MONGO_URL);
  const db = client.db(DB_NAME);

  try {
    // Step 1: Pull last 25 completed jobs
    console.log('📥 Step 1: Pulling last 25 completed verification jobs...\n');
    
    const jobs = await db.collection('verification_jobs').find({
      status: 'completed',
      'ai_consensus': { $exists: true }
    })
    .sort({ updated_at: -1 })
    .limit(25)
    .toArray();

    console.log(`✅ Found ${jobs.length} completed jobs\n`);

    if (jobs.length === 0) {
      console.log('⚠️  No completed jobs found. Exiting.');
      await client.close();
      return;
    }

    // Step 2: Extract key data for comparison
    console.log('📊 Step 2: Extracting original responses...\n');
    
    const originalResults = jobs.map(job => {
      const consensus = job.ai_consensus || {};
      
      return {
        job_id: job._id,
        salesforce_id: job.salesforce_record_id,
        created_at: job.created_at,
        processing_time_ms: job.processing_time_ms,
        product_data: {
          manufacturer_name: job.product_data?.manufacturer_name || 'Unknown',
          product_title: job.product_data?.product_title || 'Unknown',
          manufacturer_category: job.product_data?.manufacturer_category || 'Unknown',
          model_number: job.product_data?.model_number,
          short_description: job.product_data?.short_description,
          long_description: job.product_data?.long_description
        },
        original_response: {
          category: consensus.product_category?.final_value,
          category_source: consensus.product_category?.source,
          category_confidence: consensus.product_category?.openai?.confidence || consensus.product_category?.xai?.confidence,
          type: consensus.product_type?.final_value,
          type_source: consensus.product_type?.source,
          type_confidence: consensus.product_type?.openai?.confidence || consensus.product_type?.xai?.confidence,
          style: consensus.product_style?.final_value,
          style_source: consensus.product_style?.source,
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

    // Save original results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const originalFile = path.join(OUTPUT_DIR, `batch-reverify-original-${timestamp}.json`);
    
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(originalFile, JSON.stringify(originalResults, null, 2));
    
    console.log(`✅ Original responses saved to: ${originalFile}\n`);

    // Step 3: Prepare data for re-verification
    console.log('🔄 Step 3: Preparing products for re-verification...\n');
    
    const productsToVerify = jobs.map(job => ({
      salesforce_record_id: job.salesforce_record_id || `reverify_${job._id}`,
      manufacturer_name: job.product_data?.manufacturer_name,
      product_title: job.product_data?.product_title,
      manufacturer_category: job.product_data?.manufacturer_category,
      model_number: job.product_data?.model_number,
      short_description: job.product_data?.short_description,
      long_description: job.product_data?.long_description,
      specifications: job.product_data?.specifications,
      image_urls: job.product_data?.image_urls,
      original_job_id: job._id
    }));

    const inputFile = path.join(OUTPUT_DIR, `batch-reverify-input-${timestamp}.json`);
    await fs.writeFile(inputFile, JSON.stringify(productsToVerify, null, 2));
    
    console.log(`✅ Re-verification input saved to: ${inputFile}\n`);

    // Step 4: Generate summary statistics
    console.log('📈 Step 4: Generating summary statistics...\n');
    
    const stats = {
      total_jobs: jobs.length,
      timestamp: timestamp,
      original_file: originalFile,
      input_file: inputFile,
      category_breakdown: {},
      type_breakdown: {},
      style_breakdown: {},
      consensus_sources: {
        category: {},
        type: {},
        style: {}
      }
    };

    originalResults.forEach(result => {
      const { category, type, style, category_source, type_source, style_source } = result.original_response;
      
      // Count categories
      if (category) {
        stats.category_breakdown[category] = (stats.category_breakdown[category] || 0) + 1;
      }
      
      // Count types
      if (type) {
        stats.type_breakdown[type] = (stats.type_breakdown[type] || 0) + 1;
      }
      
      // Count styles
      if (style) {
        stats.style_breakdown[style] = (stats.style_breakdown[style] || 0) + 1;
      }
      
      // Count consensus sources
      if (category_source) {
        stats.consensus_sources.category[category_source] = (stats.consensus_sources.category[category_source] || 0) + 1;
      }
      if (type_source) {
        stats.consensus_sources.type[type_source] = (stats.consensus_sources.type[type_source] || 0) + 1;
      }
      if (style_source) {
        stats.consensus_sources.style[style_source] = (stats.consensus_sources.style[style_source] || 0) + 1;
      }
    });

    const statsFile = path.join(OUTPUT_DIR, `batch-reverify-stats-${timestamp}.json`);
    await fs.writeFile(statsFile, JSON.stringify(stats, null, 2));

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    ORIGINAL RESULTS SUMMARY                    ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log(`Total Jobs: ${stats.total_jobs}\n`);

    console.log('Top 10 Categories:');
    Object.entries(stats.category_breakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

    console.log('\nTop 10 Types:');
    Object.entries(stats.type_breakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([type, count]) => console.log(`  ${type}: ${count}`));

    console.log('\nTop 10 Styles:');
    Object.entries(stats.style_breakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([style, count]) => console.log(`  ${style}: ${count}`));

    console.log('\nConsensus Sources:');
    console.log('  Category:', JSON.stringify(stats.consensus_sources.category, null, 4));
    console.log('  Type:', JSON.stringify(stats.consensus_sources.type, null, 4));
    console.log('  Style:', JSON.stringify(stats.consensus_sources.style, null, 4));

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                    NEXT STEPS                                  ');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ Step 1 COMPLETE: Original data extracted and saved');
    console.log('');
    console.log('⏭️  Step 2: Run re-verification script:');
    console.log(`   node scripts/batch-reverify-execute.js ${inputFile}`);
    console.log('');
    console.log('⏭️  Step 3: After re-verification completes, run comparison audit:');
    console.log(`   node scripts/batch-reverify-audit.js ${originalFile} <new-results-file>`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

main().catch(console.error);
