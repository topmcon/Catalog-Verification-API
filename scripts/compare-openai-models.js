#!/usr/bin/env node
/**
 * Compare OpenAI Models (gpt-4-turbo-preview vs gpt-4o)
 * 
 * Tests the same verification requests with both models to compare:
 * - Quality of results (categories, attributes, confidence)
 * - Response times
 * - Token usage
 * - Any differences in output
 * 
 * Usage:
 *   node scripts/compare-openai-models.js [--count=3]
 */

const mongoose = require('mongoose');
const { OpenAI } = require('openai');

// Configuration
const MODELS_TO_TEST = ['gpt-4-turbo-preview', 'gpt-4o', 'gpt-4o-mini'];
const TEST_COUNT = parseInt(process.argv.find(a => a.startsWith('--count='))?.split('=')[1] || '3');

// Model pricing per 1M tokens
const MODEL_PRICING = {
  'gpt-4-turbo-preview': { input: 10.00, output: 30.00 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 }
};

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('        OPENAI MODEL COMPARISON: gpt-4-turbo-preview vs gpt-4o');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`Testing ${TEST_COUNT} products with both models\n`);

  // Connect to MongoDB
  await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
  console.log('✅ Connected to MongoDB\n');

  // Get recent jobs to re-test
  const jobs = await mongoose.connection.db.collection('verification_jobs')
    .find({ status: 'completed' })
    .sort({ createdAt: -1 })
    .limit(TEST_COUNT)
    .toArray();

  console.log(`Found ${jobs.length} recent jobs to test\n`);

  // Initialize OpenAI
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Store results
  const results = [];

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const payload = job.rawPayload || {};
    
    console.log('───────────────────────────────────────────────────────────────────');
    console.log(`Product ${i + 1}/${jobs.length}: ${payload.SF_Catalog_Name || 'Unknown'}`);
    console.log(`Brand: ${payload.Brand_Legacy || payload.Brand_Web_Retailer || 'Unknown'}`);
    console.log(`Job ID: ${job.jobId}`);
    console.log('───────────────────────────────────────────────────────────────────\n');

    // Build the verification prompt (simplified version)
    const prompt = buildVerificationPrompt(payload);
    
    const productResult = {
      product: payload.SF_Catalog_Name,
      brand: payload.Brand_Legacy || payload.Brand_Web_Retailer,
      jobId: job.jobId,
      originalResult: job.result?.data?.Primary_Attributes || {},
      models: {}
    };

    // Test each model
    for (const model of MODELS_TO_TEST) {
      console.log(`  Testing with ${model}...`);
      const startTime = Date.now();

      try {
        const response = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a product catalog verification expert. Analyze the product data and return a JSON response with verified attributes.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        });

        const endTime = Date.now();
        const duration = endTime - startTime;
        const usage = response.usage || {};
        const content = response.choices[0]?.message?.content || '{}';
        
        // Parse response
        let parsed = {};
        try {
          parsed = JSON.parse(content);
        } catch (e) {
          parsed = { error: 'Failed to parse response' };
        }

        // Calculate cost
        const pricing = MODEL_PRICING[model] || { input: 0, output: 0 };
        const inputCost = (usage.prompt_tokens || 0) / 1000000 * pricing.input;
        const outputCost = (usage.completion_tokens || 0) / 1000000 * pricing.output;
        const totalCost = inputCost + outputCost;

        productResult.models[model] = {
          duration: duration,
          tokens: {
            input: usage.prompt_tokens || 0,
            output: usage.completion_tokens || 0,
            total: usage.total_tokens || 0
          },
          cost: totalCost,
          result: {
            category: parsed.Category || parsed.category || parsed.Primary_Attributes?.Category_Verified || 'N/A',
            brand: parsed.Brand || parsed.brand || parsed.Primary_Attributes?.Brand_Verified || 'N/A',
            style: parsed.Style || parsed.style || parsed.Primary_Attributes?.Style_Verified || 'N/A',
            confidence: parsed.confidence || parsed.Confidence || 'N/A'
          },
          rawResponse: parsed
        };

        console.log(`    ✅ ${model}: ${duration}ms, ${usage.total_tokens} tokens, $${totalCost.toFixed(4)}`);
        console.log(`       Category: ${productResult.models[model].result.category}`);

      } catch (error) {
        console.log(`    ❌ ${model}: Error - ${error.message}`);
        productResult.models[model] = {
          error: error.message,
          duration: Date.now() - startTime
        };
      }

      // Small delay between models
      await sleep(500);
    }

    results.push(productResult);
    console.log('');
  }

  // Print comparison summary
  printSummary(results);

  await mongoose.disconnect();
}

function buildVerificationPrompt(payload) {
  return `Verify this product and return a JSON response with:
{
  "Category": "verified category name",
  "Brand": "verified brand name",
  "Style": "verified style",
  "confidence": "high/medium/low"
}

Product Data:
- Model: ${payload.SF_Catalog_Name || 'Unknown'}
- Brand (Legacy): ${payload.Brand_Legacy || 'N/A'}
- Brand (Web): ${payload.Brand_Web_Retailer || 'N/A'}
- Category (Legacy): ${payload.Category_Legacy || 'N/A'}
- Category (Web): ${payload.Web_Retailer_Category || 'N/A'}
- SubCategory (Web): ${payload.Web_Retailer_SubCategory || 'N/A'}
- Title (Legacy): ${payload.Product_Title_Legacy || 'N/A'}
- Title (Web): ${payload.Product_Title_Web_Retailer || 'N/A'}
- Description: ${(payload.Product_Description_Legacy || payload.Product_Description_Web_Retailer || 'N/A').slice(0, 500)}

Return only valid JSON.`;
}

function printSummary(results) {
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('                       COMPARISON SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Calculate aggregates
  const aggregates = {};
  for (const model of MODELS_TO_TEST) {
    aggregates[model] = {
      totalDuration: 0,
      totalTokens: 0,
      totalCost: 0,
      successCount: 0,
      categories: []
    };
  }

  for (const result of results) {
    for (const model of MODELS_TO_TEST) {
      const modelResult = result.models[model];
      if (modelResult && !modelResult.error) {
        aggregates[model].totalDuration += modelResult.duration;
        aggregates[model].totalTokens += modelResult.tokens.total;
        aggregates[model].totalCost += modelResult.cost;
        aggregates[model].successCount++;
        aggregates[model].categories.push(modelResult.result.category);
      }
    }
  }

  // Print per-model stats
  console.log('MODEL PERFORMANCE:');
  console.log('─────────────────────────────────────────────────────────────────\n');
  
  for (const model of MODELS_TO_TEST) {
    const agg = aggregates[model];
    const avgDuration = agg.successCount > 0 ? (agg.totalDuration / agg.successCount).toFixed(0) : 'N/A';
    const avgTokens = agg.successCount > 0 ? (agg.totalTokens / agg.successCount).toFixed(0) : 'N/A';
    
    console.log(`📊 ${model}`);
    console.log(`   Success Rate: ${agg.successCount}/${results.length} (${(agg.successCount/results.length*100).toFixed(0)}%)`);
    console.log(`   Avg Duration: ${avgDuration} ms`);
    console.log(`   Avg Tokens: ${avgTokens}`);
    console.log(`   Total Cost: $${agg.totalCost.toFixed(4)}`);
    console.log('');
  }

  // Compare results
  console.log('\nRESULT COMPARISON:');
  console.log('─────────────────────────────────────────────────────────────────\n');

  let matches = 0;
  let differences = 0;

  for (const result of results) {
    const gpt4Turbo = result.models['gpt-4-turbo-preview'];
    const gpt4o = result.models['gpt-4o'];

    if (gpt4Turbo && gpt4o && !gpt4Turbo.error && !gpt4o.error) {
      const cat4Turbo = gpt4Turbo.result.category?.toLowerCase();
      const cat4o = gpt4o.result.category?.toLowerCase();
      
      const match = cat4Turbo === cat4o;
      if (match) {
        matches++;
        console.log(`✅ ${result.product}: MATCH - "${gpt4o.result.category}"`);
      } else {
        differences++;
        console.log(`⚠️  ${result.product}: DIFFERENT`);
        console.log(`    gpt-4-turbo-preview: "${gpt4Turbo.result.category}"`);
        console.log(`    gpt-4o:              "${gpt4o.result.category}"`);
      }
    }
  }

  console.log('\n─────────────────────────────────────────────────────────────────');
  console.log(`AGREEMENT: ${matches}/${matches + differences} (${((matches/(matches+differences))*100).toFixed(0)}%)`);

  // Cost comparison
  const turboTotal = aggregates['gpt-4-turbo-preview'].totalCost;
  const gpt4oTotal = aggregates['gpt-4o'].totalCost;
  const savings = turboTotal - gpt4oTotal;
  const savingsPercent = turboTotal > 0 ? (savings / turboTotal * 100).toFixed(0) : 0;

  console.log('\n─────────────────────────────────────────────────────────────────');
  console.log('COST ANALYSIS (this test):');
  console.log(`   gpt-4-turbo-preview: $${turboTotal.toFixed(4)}`);
  console.log(`   gpt-4o:              $${gpt4oTotal.toFixed(4)}`);
  console.log(`   Savings:             $${savings.toFixed(4)} (${savingsPercent}%)`);

  // Extrapolate to 1000 jobs
  const perJobTurbo = turboTotal / results.length;
  const perJobGpt4o = gpt4oTotal / results.length;
  console.log('\nPROJECTED SAVINGS (per 1,000 jobs):');
  console.log(`   gpt-4-turbo-preview: $${(perJobTurbo * 1000).toFixed(2)}`);
  console.log(`   gpt-4o:              $${(perJobGpt4o * 1000).toFixed(2)}`);
  console.log(`   Savings:             $${((perJobTurbo - perJobGpt4o) * 1000).toFixed(2)}`);

  console.log('\n═══════════════════════════════════════════════════════════════════');
  
  if (differences === 0) {
    console.log('✅ RECOMMENDATION: gpt-4o produces IDENTICAL results at lower cost.');
    console.log('   Safe to switch for significant cost savings.');
  } else if (differences <= matches * 0.1) {
    console.log('✅ RECOMMENDATION: gpt-4o produces nearly identical results.');
    console.log('   Minor differences may be acceptable for cost savings.');
  } else {
    console.log('⚠️  RECOMMENDATION: Models show significant differences.');
    console.log('   Review the specific differences before switching.');
  }
  console.log('═══════════════════════════════════════════════════════════════════\n');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
