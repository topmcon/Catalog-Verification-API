#!/usr/bin/env node
/**
 * Live Comprehensive Logger for Salesforce Verification Calls
 * 
 * Purpose: Monitor and capture ALL incoming verification requests and responses
 * in real-time for comprehensive audit and analysis.
 * 
 * Usage: node scripts/live-comprehensive-logger.js [--count=50] [--output=filename]
 */

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

const MONGO_URL = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'catalog-verification';
const OUTPUT_DIR = path.join(__dirname, '..', 'audit-results');

// Parse command line arguments
const args = process.argv.slice(2);
const targetCount = parseInt(args.find(a => a.startsWith('--count='))?.split('=')[1] || '50');
const customOutput = args.find(a => a.startsWith('--output='))?.split('=')[1];

let capturedJobs = [];
let startTime = new Date();
let lastCheckTime = new Date();

async function saveProgress() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = customOutput || `live-capture-${timestamp}.json`;
  const outputFile = path.join(OUTPUT_DIR, filename);
  
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  const exportData = {
    metadata: {
      start_time: startTime.toISOString(),
      end_time: new Date().toISOString(),
      duration_seconds: Math.floor((Date.now() - startTime.getTime()) / 1000),
      target_count: targetCount,
      captured_count: capturedJobs.length,
      capture_complete: capturedJobs.length >= targetCount
    },
    jobs: capturedJobs.map(job => ({
      job_id: job._id,
      salesforce_id: job.salesforce_record_id,
      status: job.status,
      created_at: job.created_at || job.createdAt,
      updated_at: job.updated_at || job.updatedAt,
      processing_time_ms: job.processing_time_ms,
      product_data: {
        manufacturer_name: job.product_data?.manufacturer_name,
        product_title: job.product_data?.product_title,
        manufacturer_category: job.product_data?.manufacturer_category,
        model_number: job.product_data?.model_number,
        short_description: job.product_data?.short_description?.substring(0, 200),
        long_description: job.product_data?.long_description?.substring(0, 500)
      },
      ai_consensus: job.ai_consensus ? {
        category: {
          final: job.ai_consensus.product_category?.final_value,
          source: job.ai_consensus.product_category?.source,
          openai: job.ai_consensus.product_category?.openai?.value,
          xai: job.ai_consensus.product_category?.xai?.value,
          confidence: job.ai_consensus.product_category?.openai?.confidence
        },
        type: {
          final: job.ai_consensus.product_type?.final_value,
          source: job.ai_consensus.product_type?.source,
          openai: job.ai_consensus.product_type?.openai?.value,
          xai: job.ai_consensus.product_type?.xai?.value,
          confidence: job.ai_consensus.product_type?.openai?.confidence
        },
        style: {
          final: job.ai_consensus.product_style?.final_value,
          source: job.ai_consensus.product_style?.source,
          openai: job.ai_consensus.product_style?.openai?.value,
          xai: job.ai_consensus.product_style?.xai?.value,
          confidence: job.ai_consensus.product_style?.openai?.confidence
        },
        brand: job.ai_consensus.brand?.final_value,
        department: job.ai_consensus.department?.final_value,
        family: job.ai_consensus.product_family?.final_value,
        color: job.ai_consensus.color?.final_value,
        finish: job.ai_consensus.finish?.final_value
      } : null,
      response_sent: job.response
    }))
  };
  
  await fs.writeFile(outputFile, JSON.stringify(exportData, null, 2));
  return outputFile;
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function displayJobSummary(job, index) {
  const consensus = job.ai_consensus;
  const product = job.product_data;
  
  console.log(`\n${'─'.repeat(65)}`);
  console.log(`📦 JOB ${index}/${targetCount} | ID: ${job._id}`);
  console.log(`${'─'.repeat(65)}`);
  console.log(`  Product:  ${product?.product_title?.substring(0, 50)}...`);
  console.log(`  Model:    ${product?.model_number || 'N/A'}`);
  console.log(`  Brand:    ${product?.manufacturer_name || 'N/A'}`);
  console.log(`  Mfg Cat:  ${product?.manufacturer_category || 'N/A'}`);
  console.log(`  Status:   ${job.status}`);
  console.log(`  Time:     ${job.processing_time_ms ? (job.processing_time_ms/1000).toFixed(1) + 's' : 'N/A'}`);
  
  if (consensus) {
    console.log(`\n  🤖 AI RESULTS:`);
    console.log(`    Category:    ${consensus.product_category?.final_value || 'N/A'} (${consensus.product_category?.source || 'N/A'})`);
    if (consensus.product_category?.openai?.value !== consensus.product_category?.xai?.value) {
      console.log(`                 └─ OpenAI: "${consensus.product_category?.openai?.value}" | xAI: "${consensus.product_category?.xai?.value}"`);
    }
    console.log(`    Type:        ${consensus.product_type?.final_value || 'N/A'} (${consensus.product_type?.source || 'N/A'})`);
    if (consensus.product_type?.openai?.value !== consensus.product_type?.xai?.value) {
      console.log(`                 └─ OpenAI: "${consensus.product_type?.openai?.value}" | xAI: "${consensus.product_type?.xai?.value}"`);
    }
    console.log(`    Style:       ${consensus.product_style?.final_value || 'N/A'} (${consensus.product_style?.source || 'N/A'})`);
    if (consensus.product_style?.openai?.value !== consensus.product_style?.xai?.value) {
      console.log(`                 └─ OpenAI: "${consensus.product_style?.openai?.value}" | xAI: "${consensus.product_style?.xai?.value}"`);
    }
    console.log(`    Department:  ${consensus.department?.final_value || 'N/A'}`);
  } else {
    console.log(`\n  ⚠️  No AI consensus data available`);
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       LIVE COMPREHENSIVE VERIFICATION LOGGER                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`📊 Configuration:`);
  console.log(`   Target Count: ${targetCount} jobs`);
  console.log(`   Output Dir:   ${OUTPUT_DIR}`);
  console.log(`   Start Time:   ${startTime.toISOString()}\n`);

  console.log(`🔌 Connecting to MongoDB...`);
  const client = await MongoClient.connect(MONGO_URL);
  const db = client.db(DB_NAME);
  console.log(`✅ Connected\n`);

  console.log(`🎯 Monitoring for new verification jobs...`);
  console.log(`   Waiting for ${targetCount} jobs to complete\n`);
  console.log(`${'═'.repeat(65)}`);

  try {
    // Get current latest timestamp to avoid capturing old jobs
    const latestExisting = await db.collection('verification_jobs').findOne(
      {},
      { sort: { _id: -1 }, projection: { _id: 1 } }
    );
    
    let lastSeenId = latestExisting?._id;
    let checkCount = 0;

    while (capturedJobs.length < targetCount) {
      checkCount++;
      
      // Query for new completed jobs since last check
      const query = {
        status: 'completed',
        ...(lastSeenId ? { _id: { $gt: lastSeenId } } : {})
      };

      const newJobs = await db.collection('verification_jobs')
        .find(query)
        .sort({ _id: 1 })
        .toArray();

      if (newJobs.length > 0) {
        for (const job of newJobs) {
          capturedJobs.push(job);
          displayJobSummary(job, capturedJobs.length);
          lastSeenId = job._id;
          
          // Auto-save every 10 jobs
          if (capturedJobs.length % 10 === 0) {
            const file = await saveProgress();
            console.log(`\n💾 Progress saved: ${capturedJobs.length}/${targetCount} jobs → ${path.basename(file)}`);
          }
          
          if (capturedJobs.length >= targetCount) break;
        }
      }

      // Show alive indicator every 10 checks
      if (checkCount % 10 === 0 && capturedJobs.length < targetCount) {
        const elapsed = Date.now() - startTime.getTime();
        const rate = capturedJobs.length > 0 ? (elapsed / capturedJobs.length / 1000).toFixed(1) : '∞';
        process.stdout.write(`\r⏳ ${formatDuration(elapsed)} elapsed | ${capturedJobs.length}/${targetCount} captured | Avg: ${rate}s/job   `);
      }

      if (capturedJobs.length < targetCount) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Check every 2 seconds
      }
    }

    console.log(`\n\n${'═'.repeat(65)}`);
    console.log(`✅ TARGET REACHED: ${capturedJobs.length}/${targetCount} jobs captured!`);
    console.log(`${'═'.repeat(65)}\n`);

    // Final save
    const finalFile = await saveProgress();
    
    // Generate quick stats
    const stats = {
      total: capturedJobs.length,
      categories: {},
      types: {},
      styles: {},
      consensus_breakdown: {
        category: {},
        type: {},
        style: {}
      },
      disagreements: {
        category: 0,
        type: 0,
        style: 0
      }
    };

    capturedJobs.forEach(job => {
      const c = job.ai_consensus;
      if (!c) return;

      // Count categories
      const cat = c.product_category?.final_value;
      if (cat) stats.categories[cat] = (stats.categories[cat] || 0) + 1;

      // Count types
      const type = c.product_type?.final_value;
      if (type) stats.types[type] = (stats.types[type] || 0) + 1;

      // Count styles
      const style = c.product_style?.final_value;
      if (style) stats.styles[style] = (stats.styles[style] || 0) + 1;

      // Count consensus sources
      ['category', 'type', 'style'].forEach(field => {
        const key = `product_${field === 'category' ? 'category' : field === 'type' ? 'type' : 'style'}`;
        const source = c[key]?.source;
        if (source) {
          stats.consensus_breakdown[field][source] = (stats.consensus_breakdown[field][source] || 0) + 1;
        }

        // Count disagreements
        const openai = c[key]?.openai?.value;
        const xai = c[key]?.xai?.value;
        if (openai && xai && openai !== xai) {
          stats.disagreements[field]++;
        }
      });
    });

    console.log(`📊 SUMMARY STATISTICS:\n`);
    console.log(`   Total Jobs:        ${stats.total}`);
    console.log(`   Duration:          ${formatDuration(Date.now() - startTime.getTime())}`);
    console.log(`   Avg per job:       ${((Date.now() - startTime.getTime()) / stats.total / 1000).toFixed(1)}s\n`);

    console.log(`   Unique Categories: ${Object.keys(stats.categories).length}`);
    console.log(`   Unique Types:      ${Object.keys(stats.types).length}`);
    console.log(`   Unique Styles:     ${Object.keys(stats.styles).length}\n`);

    console.log(`   Top 5 Categories:`);
    Object.entries(stats.categories).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([cat, count]) => {
      console.log(`     ${count.toString().padStart(3)}× ${cat}`);
    });

    console.log(`\n   Top 5 Types:`);
    Object.entries(stats.types).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([type, count]) => {
      console.log(`     ${count.toString().padStart(3)}× ${type}`);
    });

    console.log(`\n   Consensus Sources:`);
    console.log(`     Category: ${JSON.stringify(stats.consensus_breakdown.category)}`);
    console.log(`     Type:     ${JSON.stringify(stats.consensus_breakdown.type)}`);
    console.log(`     Style:    ${JSON.stringify(stats.consensus_breakdown.style)}`);

    console.log(`\n   AI Disagreements:`);
    console.log(`     Category: ${stats.disagreements.category} (${(stats.disagreements.category/stats.total*100).toFixed(1)}%)`);
    console.log(`     Type:     ${stats.disagreements.type} (${(stats.disagreements.type/stats.total*100).toFixed(1)}%)`);
    console.log(`     Style:    ${stats.disagreements.style} (${(stats.disagreements.style/stats.total*100).toFixed(1)}%)`);

    console.log(`\n${'═'.repeat(65)}`);
    console.log(`📁 FINAL OUTPUT:\n`);
    console.log(`   ${finalFile}\n`);
    console.log(`${'═'.repeat(65)}`);
    console.log(`\n✅ Capture complete! Ready for audit analysis.\n`);
    console.log(`⏭️  Next: Run audit script to analyze results:\n`);
    console.log(`   node scripts/analyze-live-capture.js ${path.basename(finalFile)}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    
    // Try to save what we have
    if (capturedJobs.length > 0) {
      console.log(`\n💾 Attempting to save ${capturedJobs.length} captured jobs...`);
      const file = await saveProgress();
      console.log(`✅ Saved to: ${file}\n`);
    }
    
    throw error;
  } finally {
    await client.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Interrupted! Saving captured jobs...');
  if (capturedJobs.length > 0) {
    const file = await saveProgress();
    console.log(`✅ Saved ${capturedJobs.length} jobs to: ${file}\n`);
  }
  process.exit(0);
});

main().catch(console.error);
