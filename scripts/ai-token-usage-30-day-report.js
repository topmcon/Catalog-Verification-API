#!/usr/bin/env node

/**
 * 30-Day AI Token Usage Report
 * ============================
 * Comprehensive report of token usage and costs across:
 * - OpenAI (GPT-4o-mini, GPT-4o)
 * - xAI (Grok-2, Grok-3)
 * - Anthropic Claude (used in self-healing)
 * 
 * Compare these figures to your provider dashboards:
 * - OpenAI: https://platform.openai.com/usage
 * - xAI: https://console.x.ai/usage
 * - Anthropic: https://console.anthropic.com/settings/usage
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

// Define AIUsage schema
const AIUsageSchema = new mongoose.Schema({
  usageId: String,
  trackingId: String,
  sessionId: String,
  productId: String,
  provider: String,
  aiModel: String,
  taskType: String,
  requestTimestamp: Date,
  responseTimestamp: Date,
  latencyMs: Number,
  promptTokens: Number,
  completionTokens: Number,
  totalTokens: Number,
  inputCost: Number,
  outputCost: Number,
  totalCost: Number,
  outcome: String,
  confidenceScore: Number,
  jsonValid: Boolean,
  fieldsCaptured: Number,
  fieldsExpected: Number,
  categoryDetermined: String,
  tags: [String],
  retryAttempt: Number,
  createdAt: Date,
});

// Define SelfHealingTracker schema (for Claude usage)
const SelfHealingTrackerSchema = new mongoose.Schema({
  healingId: String,
  trackingId: String,
  sessionId: String,
  productId: String,
  triggeredAt: Date,
  attempts: [{
    attemptNumber: Number,
    strategy: String,
    startedAt: Date,
    completedAt: Date,
    aiDiagnosis: {
      openaiAnalysis: {
        tokensUsed: Number,
      },
      xaiAnalysis: {
        tokensUsed: Number,
      },
      claudeFinalReview: {
        tokensUsed: Number,
        model: String,
      },
    },
  }],
});

const AIUsage = mongoose.model('AIUsage', AIUsageSchema);
const SelfHealingTracker = mongoose.model('SelfHealingTracker', SelfHealingTrackerSchema);

async function generate30DayReport() {
  try {
    console.log(`${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}║       30-DAY AI TOKEN USAGE & COST REPORT                 ║${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    // Connect to MongoDB
    console.log(`${colors.dim}Connecting to MongoDB...${colors.reset}`);
    await mongoose.connect(MONGO_URI);
    console.log(`${colors.green}✅ Connected to database${colors.reset}\n`);

    // Calculate date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    console.log(`${colors.bright}📅 REPORTING PERIOD${colors.reset}`);
    console.log(`   From: ${startDate.toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    })}`);
    console.log(`   To:   ${endDate.toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    })}`);
    console.log(`   Days: 30\n`);

    // ========================================
    // PART 1: Main Verification (OpenAI + xAI)
    // ========================================
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  MAIN VERIFICATION ENGINES (OpenAI + xAI)${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    const mainUsage = await AIUsage.aggregate([
      {
        $match: {
          requestTimestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            provider: '$provider',
            model: '$aiModel',
          },
          totalCalls: { $sum: 1 },
          successfulCalls: {
            $sum: { $cond: [{ $eq: ['$outcome', 'success'] }, 1, 0] },
          },
          totalPromptTokens: { $sum: '$promptTokens' },
          totalCompletionTokens: { $sum: '$completionTokens' },
          totalTokens: { $sum: '$totalTokens' },
          totalCost: { $sum: '$totalCost' },
          avgLatencyMs: { $avg: '$latencyMs' },
          avgConfidence: {
            $avg: {
              $cond: [{ $gt: ['$confidenceScore', 0] }, '$confidenceScore', null],
            },
          },
        },
      },
      {
        $sort: { '_id.provider': 1, '_id.model': 1 },
      },
    ]);

    // Group by provider
    const providerSummary = {};
    mainUsage.forEach((record) => {
      const provider = record._id.provider;
      if (!providerSummary[provider]) {
        providerSummary[provider] = {
          totalCalls: 0,
          totalTokens: 0,
          totalCost: 0,
          models: [],
        };
      }
      providerSummary[provider].totalCalls += record.totalCalls;
      providerSummary[provider].totalTokens += record.totalTokens;
      providerSummary[provider].totalCost += record.totalCost;
      providerSummary[provider].models.push(record);
    });

    // Display OpenAI usage
    if (providerSummary.openai) {
      console.log(`${colors.bright}${colors.blue}🤖 OpenAI${colors.reset}`);
      console.log(`${colors.blue}${'─'.repeat(60)}${colors.reset}`);
      console.log(`   Total API Calls:      ${providerSummary.openai.totalCalls.toLocaleString()}`);
      console.log(`   Total Tokens:         ${providerSummary.openai.totalTokens.toLocaleString()}`);
      console.log(`   ${colors.bright}Total Cost:           $${providerSummary.openai.totalCost.toFixed(4)}${colors.reset}`);
      console.log(`\n   ${colors.dim}BY MODEL:${colors.reset}`);
      
      providerSummary.openai.models.forEach((model) => {
        const successRate = ((model.successfulCalls / model.totalCalls) * 100).toFixed(1);
        console.log(`\n   ${colors.blue}├─ ${model._id.model}${colors.reset}`);
        console.log(`   │  Calls:         ${model.totalCalls.toLocaleString()}`);
        console.log(`   │  Success Rate:  ${successRate}%`);
        console.log(`   │  Input Tokens:  ${model.totalPromptTokens.toLocaleString()}`);
        console.log(`   │  Output Tokens: ${model.totalCompletionTokens.toLocaleString()}`);
        console.log(`   │  Total Tokens:  ${model.totalTokens.toLocaleString()}`);
        console.log(`   │  Cost:          $${model.totalCost.toFixed(4)}`);
        console.log(`   │  Avg Latency:   ${(model.avgLatencyMs / 1000).toFixed(2)}s`);
        if (model.avgConfidence) {
          console.log(`   │  Avg Confidence: ${(model.avgConfidence * 100).toFixed(1)}%`);
        }
      });
      console.log('');
    } else {
      console.log(`${colors.yellow}⚠️  No OpenAI usage found in this period${colors.reset}\n`);
    }

    // Display xAI usage
    if (providerSummary.xai) {
      console.log(`${colors.bright}${colors.magenta}🤖 xAI (Grok)${colors.reset}`);
      console.log(`${colors.magenta}${'─'.repeat(60)}${colors.reset}`);
      console.log(`   Total API Calls:      ${providerSummary.xai.totalCalls.toLocaleString()}`);
      console.log(`   Total Tokens:         ${providerSummary.xai.totalTokens.toLocaleString()}`);
      console.log(`   ${colors.bright}Total Cost:           $${providerSummary.xai.totalCost.toFixed(4)}${colors.reset}`);
      console.log(`\n   ${colors.dim}BY MODEL:${colors.reset}`);
      
      providerSummary.xai.models.forEach((model) => {
        const successRate = ((model.successfulCalls / model.totalCalls) * 100).toFixed(1);
        console.log(`\n   ${colors.magenta}├─ ${model._id.model}${colors.reset}`);
        console.log(`   │  Calls:         ${model.totalCalls.toLocaleString()}`);
        console.log(`   │  Success Rate:  ${successRate}%`);
        console.log(`   │  Input Tokens:  ${model.totalPromptTokens.toLocaleString()}`);
        console.log(`   │  Output Tokens: ${model.totalCompletionTokens.toLocaleString()}`);
        console.log(`   │  Total Tokens:  ${model.totalTokens.toLocaleString()}`);
        console.log(`   │  Cost:          $${model.totalCost.toFixed(4)}`);
        console.log(`   │  Avg Latency:   ${(model.avgLatencyMs / 1000).toFixed(2)}s`);
        if (model.avgConfidence) {
          console.log(`   │  Avg Confidence: ${(model.avgConfidence * 100).toFixed(1)}%`);
        }
      });
      console.log('');
    } else {
      console.log(`${colors.yellow}⚠️  No xAI usage found in this period${colors.reset}\n`);
    }

    // ========================================
    // PART 2: Self-Healing (Claude)
    // ========================================
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  SELF-HEALING SYSTEM (Claude)${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    const selfHealingRecords = await SelfHealingTracker.find({
      triggeredAt: { $gte: startDate, $lte: endDate },
    });

    let claudeTotalCalls = 0;
    let claudeTotalTokens = 0;
    const claudeModels = {};

    selfHealingRecords.forEach((record) => {
      record.attempts?.forEach((attempt) => {
        const claudeReview = attempt.aiDiagnosis?.claudeFinalReview;
        if (claudeReview && claudeReview.tokensUsed) {
          claudeTotalCalls++;
          claudeTotalTokens += claudeReview.tokensUsed;
          
          const model = claudeReview.model || 'claude-3-5-sonnet-20241022';
          if (!claudeModels[model]) {
            claudeModels[model] = { calls: 0, tokens: 0 };
          }
          claudeModels[model].calls++;
          claudeModels[model].tokens += claudeReview.tokensUsed;
        }
      });
    });

    if (claudeTotalCalls > 0) {
      // Estimated cost (Claude Sonnet 3.5: $3 input / $15 output per 1M tokens)
      // Assuming 50/50 split (conservative estimate)
      const estimatedCost = (claudeTotalTokens / 1000000) * ((3 + 15) / 2);
      
      console.log(`${colors.bright}${colors.cyan}🤖 Anthropic Claude${colors.reset}`);
      console.log(`${colors.cyan}${'─'.repeat(60)}${colors.reset}`);
      console.log(`   Total API Calls:      ${claudeTotalCalls.toLocaleString()}`);
      console.log(`   Total Tokens:         ${claudeTotalTokens.toLocaleString()}`);
      console.log(`   ${colors.bright}Estimated Cost:       $${estimatedCost.toFixed(4)}${colors.reset}`);
      console.log(`   ${colors.dim}(Note: Token counts from self-healing may not include exact input/output split)${colors.reset}`);
      
      if (Object.keys(claudeModels).length > 0) {
        console.log(`\n   ${colors.dim}BY MODEL:${colors.reset}`);
        Object.entries(claudeModels).forEach(([model, data]) => {
          console.log(`\n   ${colors.cyan}├─ ${model}${colors.reset}`);
          console.log(`   │  Calls:         ${data.calls.toLocaleString()}`);
          console.log(`   │  Total Tokens:  ${data.tokens.toLocaleString()}`);
        });
      }
      console.log('');
    } else {
      console.log(`${colors.yellow}ℹ️  No Claude usage found (no self-healing triggered in this period)${colors.reset}\n`);
    }

    // ========================================
    // PART 3: Overall Summary
    // ========================================
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  OVERALL SUMMARY (30 DAYS)${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    const openaiTotal = providerSummary.openai || { totalCalls: 0, totalTokens: 0, totalCost: 0 };
    const xaiTotal = providerSummary.xai || { totalCalls: 0, totalTokens: 0, totalCost: 0 };
    const claudeEstimatedCost = claudeTotalCalls > 0 ? (claudeTotalTokens / 1000000) * 9 : 0;

    const grandTotalCalls = openaiTotal.totalCalls + xaiTotal.totalCalls + claudeTotalCalls;
    const grandTotalTokens = openaiTotal.totalTokens + xaiTotal.totalTokens + claudeTotalTokens;
    const grandTotalCost = openaiTotal.totalCost + xaiTotal.totalCost + claudeEstimatedCost;

    console.log(`${colors.bright}Provider Breakdown:${colors.reset}`);
    console.log(`┌───────────────┬──────────────┬──────────────┬──────────────┐`);
    console.log(`│ Provider      │ Calls        │ Tokens       │ Cost ($)     │`);
    console.log(`├───────────────┼──────────────┼──────────────┼──────────────┤`);
    console.log(`│ ${colors.blue}OpenAI${colors.reset}        │ ${openaiTotal.totalCalls.toString().padEnd(12)} │ ${openaiTotal.totalTokens.toLocaleString().padEnd(12)} │ $${openaiTotal.totalCost.toFixed(4).padEnd(11)} │`);
    console.log(`│ ${colors.magenta}xAI (Grok)${colors.reset}    │ ${xaiTotal.totalCalls.toString().padEnd(12)} │ ${xaiTotal.totalTokens.toLocaleString().padEnd(12)} │ $${xaiTotal.totalCost.toFixed(4).padEnd(11)} │`);
    console.log(`│ ${colors.cyan}Claude${colors.reset}        │ ${claudeTotalCalls.toString().padEnd(12)} │ ${claudeTotalTokens.toLocaleString().padEnd(12)} │ $${claudeEstimatedCost.toFixed(4).padEnd(11)} │`);
    console.log(`├───────────────┼──────────────┼──────────────┼──────────────┤`);
    console.log(`│ ${colors.bright}TOTAL${colors.reset}         │ ${colors.bright}${grandTotalCalls.toString().padEnd(12)}${colors.reset} │ ${colors.bright}${grandTotalTokens.toLocaleString().padEnd(12)}${colors.reset} │ ${colors.bright}$${grandTotalCost.toFixed(4).padEnd(11)}${colors.reset} │`);
    console.log(`└───────────────┴──────────────┴──────────────┴──────────────┘\n`);

    // Cost breakdown
    if (grandTotalCost > 0) {
      console.log(`${colors.bright}Cost Distribution:${colors.reset}`);
      const openaiPct = ((openaiTotal.totalCost / grandTotalCost) * 100).toFixed(1);
      const xaiPct = ((xaiTotal.totalCost / grandTotalCost) * 100).toFixed(1);
      const claudePct = ((claudeEstimatedCost / grandTotalCost) * 100).toFixed(1);
      
      console.log(`   ${colors.blue}OpenAI:${colors.reset}  ${openaiPct}%`);
      console.log(`   ${colors.magenta}xAI:${colors.reset}     ${xaiPct}%`);
      console.log(`   ${colors.cyan}Claude:${colors.reset}  ${claudePct}%\n`);
    }

    // Daily average
    console.log(`${colors.bright}Daily Averages (30 days):${colors.reset}`);
    console.log(`   API Calls: ${(grandTotalCalls / 30).toFixed(0)} calls/day`);
    console.log(`   Tokens:    ${(grandTotalTokens / 30).toLocaleString(undefined, { maximumFractionDigits: 0 })} tokens/day`);
    console.log(`   Cost:      $${(grandTotalCost / 30).toFixed(4)}/day\n`);

    // Monthly projection
    console.log(`${colors.bright}Monthly Projection (based on 30-day data):${colors.reset}`);
    console.log(`   API Calls: ${grandTotalCalls.toLocaleString()} calls/month`);
    console.log(`   Tokens:    ${grandTotalTokens.toLocaleString()} tokens/month`);
    console.log(`   ${colors.bright}Cost:      $${grandTotalCost.toFixed(2)}/month${colors.reset}\n`);

    // ========================================
    // PART 4: Comparison Instructions
    // ========================================
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  COMPARE TO PROVIDER DASHBOARDS${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    console.log(`${colors.bright}${colors.blue}OpenAI Dashboard:${colors.reset}`);
    console.log(`   URL: ${colors.dim}https://platform.openai.com/usage${colors.reset}`);
    console.log(`   Expected tokens: ${colors.bright}~${openaiTotal.totalTokens.toLocaleString()}${colors.reset}`);
    console.log(`   Expected cost:   ${colors.bright}~$${openaiTotal.totalCost.toFixed(2)}${colors.reset}\n`);

    console.log(`${colors.bright}${colors.magenta}xAI Dashboard:${colors.reset}`);
    console.log(`   URL: ${colors.dim}https://console.x.ai/usage${colors.reset}`);
    console.log(`   Expected tokens: ${colors.bright}~${xaiTotal.totalTokens.toLocaleString()}${colors.reset}`);
    console.log(`   Expected cost:   ${colors.bright}~$${xaiTotal.totalCost.toFixed(2)}${colors.reset}\n`);

    console.log(`${colors.bright}${colors.cyan}Anthropic Dashboard:${colors.reset}`);
    console.log(`   URL: ${colors.dim}https://console.anthropic.com/settings/usage${colors.reset}`);
    console.log(`   Expected tokens: ${colors.bright}~${claudeTotalTokens.toLocaleString()}${colors.reset}`);
    console.log(`   Expected cost:   ${colors.bright}~$${claudeEstimatedCost.toFixed(2)}${colors.reset}`);
    console.log(`   ${colors.yellow}⚠️  Claude cost is ESTIMATED (token split not tracked)${colors.reset}\n`);

    console.log(`${colors.dim}Note: Small discrepancies may occur due to:${colors.reset}`);
    console.log(`${colors.dim}- Provider dashboard delays (data may lag by hours)${colors.reset}`);
    console.log(`${colors.dim}- Rounding differences in token counting${colors.reset}`);
    console.log(`${colors.dim}- Claude tracking limitations (self-healing only)${colors.reset}\n`);

    await mongoose.disconnect();
    console.log(`${colors.green}✅ Report complete${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}❌ Error generating report:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the report
if (require.main === module) {
  generate30DayReport()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { generate30DayReport };
