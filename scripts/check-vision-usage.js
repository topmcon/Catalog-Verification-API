const mongoose = require('mongoose');
const { AIUsage } = require('../dist/models/ai-usage.model');

async function checkVisionUsage() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification', {
      serverSelectionTimeoutMS: 5000
    });

    const cutoffDate = new Date('2026-02-04T19:38:00Z');

    // Check for gpt-4o usage (OpenAI vision model)
    const gpt4oUsage = await AIUsage.aggregate([
      {
        $match: {
          requestTimestamp: { $gte: cutoffDate },
          aiModel: 'gpt-4o'
        }
      },
      {
        $group: {
          _id: '$aiModel',
          count: { $sum: 1 },
          totalPromptTokens: { $sum: '$promptTokens' },
          totalCompletionTokens: { $sum: '$completionTokens' },
          totalCost: { $sum: '$totalCost' }
        }
      }
    ]);

    console.log('\n=== OpenAI Vision Model (gpt-4o) Usage (Feb 4-9) ===');
    if (gpt4oUsage.length > 0) {
      const data = gpt4oUsage[0];
      console.log(`Calls: ${data.count.toLocaleString()}`);
      console.log(`Prompt Tokens: ${(data.totalPromptTokens / 1000000).toFixed(2)}M`);
      console.log(`Completion Tokens: ${(data.totalCompletionTokens / 1000000).toFixed(2)}M`);
      console.log(`Total Tokens: ${((data.totalPromptTokens + data.totalCompletionTokens) / 1000000).toFixed(2)}M`);
      console.log(`Cost: $${data.totalCost.toFixed(2)}`);
    } else {
      console.log('❌ NO gpt-4o calls found!');
      console.log('\nThis means vision tasks are NOT using OpenAI.');
    }

    // Check for xAI vision usage
    const xaiVision = await AIUsage.aggregate([
      {
        $match: {
          requestTimestamp: { $gte: cutoffDate },
          aiModel: 'grok-2-vision-1212'
        }
      },
      {
        $group: {
          _id: '$aiModel',
          count: { $sum: 1 },
          totalPromptTokens: { $sum: '$promptTokens' },
          totalCompletionTokens: { $sum: '$completionTokens' },
          totalCost: { $sum: '$totalCost' }
        }
      }
    ]);

    console.log('\n=== xAI Vision Model (grok-2-vision-1212) Usage ===');
    if (xaiVision.length > 0) {
      const data = xaiVision[0];
      console.log(`Calls: ${data.count.toLocaleString()}`);
      console.log(`Prompt Tokens: ${(data.totalPromptTokens / 1000000).toFixed(2)}M`);
      console.log(`Completion Tokens: ${(data.totalCompletionTokens / 1000000).toFixed(2)}M`);
      console.log(`Total Tokens: ${((data.totalPromptTokens + data.totalCompletionTokens) / 1000000).toFixed(2)}M`);
      console.log(`Cost: $${data.totalCost.toFixed(2)}`);
    } else {
      console.log('No xAI vision calls found.');
    }

    console.log('\n=== Comparison ===');
    if (gpt4oUsage.length === 0 && xaiVision.length > 0) {
      console.log('⚠️  Vision tasks are ONLY handled by xAI (grok-2-vision-1212)');
      console.log('💡 Opportunity: Switch to OpenAI gpt-4o for vision to compare costs/quality');
    } else if (gpt4oUsage.length > 0 && xaiVision.length > 0) {
      console.log('✅ Dual vision verification active (both providers)');
      const gpt4oCost = gpt4oUsage[0].totalCost;
      const xaiCost = xaiVision[0].totalCost;
      console.log(`\nCost comparison: OpenAI $${gpt4oCost.toFixed(2)} vs xAI $${xaiCost.toFixed(2)}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkVisionUsage();
