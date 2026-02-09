#!/usr/bin/env node

/**
 * AI Token Usage Report - POST MODEL SWITCH
 * Shows usage and costs AFTER switching to gpt-4o-mini on Feb 4, 2026
 */

const mongoose = require('mongoose');

const MODEL_PRICING = {
  'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
  'gpt-4o': { input: 2.5 / 1_000_000, output: 10 / 1_000_000 },
  'gpt-4-turbo-preview': { input: 10 / 1_000_000, output: 30 / 1_000_000 },
  'grok-2-vision-1212': { input: 2.0 / 1_000_000, output: 10 / 1_000_000 },
  'grok-3': { input: 5.0 / 1_000_000, output: 15 / 1_000_000 },
  'grok-3-mini': { input: 0.3 / 1_000_000, output: 0.9 / 1_000_000 }
};

async function run() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
    
    const AIUsage = mongoose.model('ai_usage', new mongoose.Schema({}, { 
      strict: false, 
      collection: 'ai_usage' 
    }));
    
    const startDate = new Date('2026-02-04T00:00:00Z');
    const endDate = new Date();
    
    console.log('\n🔍 AI Token Usage Report - POST MODEL SWITCH');
    console.log('📅 Period: Feb 4, 2026 - Present (After gpt-4o-mini switch)');
    console.log('━'.repeat(80));
    
    const records = await AIUsage.aggregate([
      { $match: { requestTimestamp: { $gte: startDate, $lte: endDate } } },
      { $group: {
          _id: { provider: '$provider', model: '$aiModel' },
          totalCalls: { $sum: 1 },
          totalInputTokens: { $sum: '$promptTokens' },
          totalOutputTokens: { $sum: '$completionTokens' },
          totalTokens: { $sum: { $add: ['$promptTokens', '$completionTokens'] } }
        }
      },
      { $sort: { '_id.provider': 1, '_id.model': 1 } }
    ]);
    
    let grandTotal = { calls: 0, tokens: 0, cost: 0 };
    const byProvider = {};
    
    records.forEach(r => {
      const pricing = MODEL_PRICING[r._id.model] || { input: 0, output: 0 };
      const cost = (r.totalInputTokens * pricing.input) + (r.totalOutputTokens * pricing.output);
      
      const provider = r._id.provider;
      if (!byProvider[provider]) byProvider[provider] = { calls: 0, tokens: 0, cost: 0 };
      
      byProvider[provider].calls += r.totalCalls;
      byProvider[provider].tokens += r.totalTokens;
      byProvider[provider].cost += cost;
      
      grandTotal.calls += r.totalCalls;
      grandTotal.tokens += r.totalTokens;
      grandTotal.cost += cost;
      
      console.log(`\n📊 ${provider.toUpperCase()} - ${r._id.model}`);
      console.log(`   Calls: ${r.totalCalls.toLocaleString()}`);
      console.log(`   Input: ${r.totalInputTokens.toLocaleString()} tokens`);
      console.log(`   Output: ${r.totalOutputTokens.toLocaleString()} tokens`);
      console.log(`   Total: ${r.totalTokens.toLocaleString()} tokens`);
      console.log(`   Cost: $${cost.toFixed(2)}`);
    });
    
    console.log('\n' + '━'.repeat(80));
    console.log('💰 COST BREAKDOWN BY PROVIDER (Post-Switch)\n');
    
    Object.entries(byProvider).forEach(([provider, data]) => {
      const pct = (data.cost / grandTotal.cost * 100).toFixed(1);
      console.log(`${provider.toUpperCase().padEnd(12)} ${data.calls.toLocaleString().padStart(8)} calls  ${data.tokens.toLocaleString().padStart(15)} tokens  $${data.cost.toFixed(2).padStart(8)}  (${pct}%)`);
    });
    
    console.log('─'.repeat(80));
    console.log(`TOTAL         ${grandTotal.calls.toLocaleString().padStart(8)} calls  ${grandTotal.tokens.toLocaleString().padStart(15)} tokens  $${grandTotal.cost.toFixed(2).padStart(8)}`);
    
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const dailyAvg = grandTotal.cost / days;
    const monthlyProjection = dailyAvg * 30;
    
    console.log('\n📈 PROJECTIONS (Based on Post-Switch Usage)');
    console.log(`   Days in Period: ${days}`);
    console.log(`   Daily Average: $${dailyAvg.toFixed(2)}`);
    console.log(`   30-Day Projection: $${monthlyProjection.toFixed(2)}`);
    
    console.log('\n✅ COST SAVINGS VS OLD MODEL');
    console.log('   Old gpt-4-turbo-preview cost: ~$360/month');
    console.log(`   New gpt-4o-mini projected: $${monthlyProjection.toFixed(2)}/month`);
    console.log(`   Monthly Savings: $${(360 - monthlyProjection).toFixed(2)} (${((1 - monthlyProjection/360) * 100).toFixed(1)}% reduction)`);
    console.log('\n');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
