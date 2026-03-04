#!/usr/bin/env node

/**
 * AI Performance Dashboard
 * 
 * Real-time terminal dashboard showing AI performance metrics,
 * win rates, Claude correction patterns, and system health indicators.
 * 
 * Usage:
 *   node scripts/ai-performance-dashboard.js [--live]
 * 
 * Options:
 *   --live    Refresh dashboard every 10 seconds
 */

const mongoose = require('mongoose');
require('dotenv').config();

// ===================================================================
// CONFIGURATION
// ===================================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification';
const LIVE_MODE = process.argv.includes('--live');
const REFRESH_INTERVAL_MS = 10000; // 10 seconds

// ===================================================================
// MONGODB SCHEMA
// ===================================================================

const AIPerformanceMetricsSchema = new mongoose.Schema({
  jobId: String,
  sfCatalogId: String,
  timestamp: Date,
  category: String,
  openaiOutputs: Object,
  xaiOutputs: Object,
  disagreements: Array,
  claudeReview: Object,
  finalValues: Object,
  processingTimeMs: Number,
  dataSourceScenario: String,
  hasFergusonData: Boolean,
  hasWebRetailerData: Boolean,
  imageAnalysisPerformed: Boolean,
  webSearchPerformed: Boolean
});

const AIPerformanceMetrics = mongoose.model('AIPerformanceMetrics', AIPerformanceMetricsSchema, 'ai_performance_metrics');

// ===================================================================
// DASHBOARD COMPONENTS
// ===================================================================

/**
 * Clear screen and move cursor to top
 */
function clearScreen() {
  process.stdout.write('\x1Bc');
}

/**
 * Format percentage with color
 */
function colorPercent(value, threshold = 50) {
  const color = value > threshold ? '\x1b[32m' : value > threshold * 0.8 ? '\x1b[33m' : '\x1b[31m';
  const reset = '\x1b[0m';
  return `${color}${value.toFixed(1)}%${reset}`;
}

/**
 * Format number with color based on comparison
 */
function colorCompare(a, b) {
  const reset = '\x1b[0m';
  if (a > b) return `\x1b[32m${a}\x1b[0m`; // Green if winning
  if (a < b) return `\x1b[31m${a}\x1b[0m`; // Red if losing
  return `\x1b[33m${a}\x1b[0m`; // Yellow if tied
}

/**
 * Render dashboard header
 */
function renderHeader() {
  const now = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  console.log('═'.repeat(100));
  console.log('🤖 AI PERFORMANCE DASHBOARD                                    Last Updated: ' + now + ' EST');
  console.log('═'.repeat(100));
}

/**
 * Render overview statistics
 */
async function renderOverview() {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const [jobs24h, jobs7d, jobs30d, totalJobs] = await Promise.all([
    AIPerformanceMetrics.countDocuments({ timestamp: { $gte: last24h } }),
    AIPerformanceMetrics.countDocuments({ timestamp: { $gte: last7d } }),
    AIPerformanceMetrics.countDocuments({ timestamp: { $gte: last30d } }),
    AIPerformanceMetrics.countDocuments({})
  ]);
  
  console.log('\n📊 SYSTEM OVERVIEW');
  console.log('─'.repeat(100));
  console.log(`Total Jobs Tracked: ${totalJobs.toLocaleString()}   |   Last 24h: ${jobs24h}   |   Last 7d: ${jobs7d}   |   Last 30d: ${jobs30d}`);
}

/**
 * Render AI win rate comparison (last 24 hours)
 */
async function renderWinRates() {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const metrics = await AIPerformanceMetrics.find({ 
    timestamp: { $gte: last24h } 
  }).lean();
  
  let openaiWins = 0;
  let xaiWins = 0;
  let combined = 0;
  let totalDisagreements = 0;
  
  metrics.forEach(metric => {
    if (!metric.disagreements) return;
    
    metric.disagreements.forEach(d => {
      totalDisagreements++;
      if (d.smartResolutionWinner === 'openai') openaiWins++;
      else if (d.smartResolutionWinner === 'xai') xaiWins++;
      else if (d.smartResolutionWinner === 'combined') combined++;
    });
  });
  
  const openaiPct = totalDisagreements > 0 ? (openaiWins / totalDisagreements) * 100 : 0;
  const xaiPct = totalDisagreements > 0 ? (xaiWins / totalDisagreements) * 100 : 0;
  const combinedPct = totalDisagreements > 0 ? (combined / totalDisagreements) * 100 : 0;
  
  console.log('\n⚔️  AI WIN RATES (Last 24 Hours)');
  console.log('─'.repeat(100));
  console.log(`Total Disagreements: ${totalDisagreements}`);
  console.log(`OpenAI:   ${colorCompare(openaiWins, xaiWins)} wins (${colorPercent(openaiPct)})`);
  console.log(`xAI:      ${colorCompare(xaiWins, openaiWins)} wins (${colorPercent(xaiPct)})`);
  console.log(`Combined: ${combined} (${combinedPct.toFixed(1)}%)`);
  
  // Balance indicator
  const balance = Math.abs(openaiWins - xaiWins);
  const balanceStatus = balance < totalDisagreements * 0.1 ? '✅ BALANCED' : 
                        balance < totalDisagreements * 0.2 ? '⚠️  SLIGHT SKEW' : '🔴 IMBALANCED';
  console.log(`\nBalance Status: ${balanceStatus} (difference: ${balance})`);
}

/**
 * Render field-specific performance
 */
async function renderFieldPerformance() {
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const metrics = await AIPerformanceMetrics.find({ 
    timestamp: { $gte: last7d } 
  }).lean();
  
  const fieldStats = {};
  
  metrics.forEach(metric => {
    if (!metric.disagreements) return;
    
    metric.disagreements.forEach(d => {
      if (!fieldStats[d.field]) {
        fieldStats[d.field] = { openai: 0, xai: 0, total: 0 };
      }
      fieldStats[d.field].total++;
      if (d.smartResolutionWinner === 'openai') fieldStats[d.field].openai++;
      else if (d.smartResolutionWinner === 'xai') fieldStats[d.field].xai++;
    });
  });
  
  // Sort by total disagreements
  const topFields = Object.entries(fieldStats)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 10);
  
  console.log('\n🎯 TOP 10 FIELDS BY DISAGREEMENT (Last 7 Days)');
  console.log('─'.repeat(100));
  console.log('Field                      Total    OpenAI Wins    xAI Wins       Balance');
  console.log('─'.repeat(100));
  
  topFields.forEach(([field, stats]) => {
    const openaiPct = (stats.openai / stats.total) * 100;
    const xaiPct = (stats.xai / stats.total) * 100;
    const balance = Math.abs(stats.openai - stats.xai);
    const balanceIcon = balance < 3 ? '✓' : balance < 5 ? '~' : '✗';
    
    const fieldPadded = field.padEnd(25);
    const totalPadded = String(stats.total).padStart(5);
    const openaiPadded = `${stats.openai} (${openaiPct.toFixed(0)}%)`.padStart(13);
    const xaiPadded = `${stats.xai} (${xaiPct.toFixed(0)}%)`.padStart(13);
    
    console.log(`${fieldPadded} ${totalPadded}    ${openaiPadded}    ${xaiPadded}       ${balanceIcon}`);
  });
}

/**
 * Render Claude correction statistics
 */
async function renderClaudeCorrections() {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const [jobsWithCorrections, totalJobs] = await Promise.all([
    AIPerformanceMetrics.countDocuments({
      timestamp: { $gte: last24h },
      'claudeReview.proposedCorrections': { $exists: true, $ne: null }
    }),
    AIPerformanceMetrics.countDocuments({ timestamp: { $gte: last24h } })
  ]);
  
  const correctionRate = totalJobs > 0 ? (jobsWithCorrections / totalJobs) * 100 : 0;
  
  // Get specific correction details
  const metricsWithCorrections = await AIPerformanceMetrics.find({
    timestamp: { $gte: last24h },
    'claudeReview.proposedCorrections': { $exists: true, $ne: null }
  }).lean();
  
  let openaiCorrected = 0;
  let xaiCorrected = 0;
  
  metricsWithCorrections.forEach(metric => {
    const corrections = metric.claudeReview?.proposedCorrections || {};
    Object.keys(corrections).forEach(field => {
      const disagreement = metric.disagreements?.find(d => d.field === field);
      if (disagreement) {
        if (disagreement.smartResolutionWinner === 'openai') openaiCorrected++;
        else if (disagreement.smartResolutionWinner === 'xai') xaiCorrected++;
      }
    });
  });
  
  console.log('\n🔍 CLAUDE CORRECTIONS (Last 24 Hours)');
  console.log('─'.repeat(100));
  console.log(`Jobs with Corrections: ${jobsWithCorrections} / ${totalJobs} (${colorPercent(correctionRate, 10)})`);
  console.log(`OpenAI Selections Corrected: ${openaiCorrected}`);
  console.log(`xAI Selections Corrected: ${xaiCorrected}`);
  
  const correctionStatus = correctionRate < 5 ? '✅ EXCELLENT' :
                          correctionRate < 10 ? '✓ GOOD' :
                          correctionRate < 15 ? '⚠️  FAIR' : '🔴 NEEDS REVIEW';
  console.log(`Status: ${correctionStatus}`);
}

/**
 * Render category performance summary
 */
async function renderCategoryPerformance() {
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const metrics = await AIPerformanceMetrics.find({ 
    timestamp: { $gte: last7d } 
  }).lean();
  
  const categoryStats = {};
  
  metrics.forEach(metric => {
    const category = metric.category || 'Unknown';
    
    if (!categoryStats[category]) {
      categoryStats[category] = {
        jobs: 0,
        disagreements: 0,
        claudeCorrections: 0
      };
    }
    
    categoryStats[category].jobs++;
    
    if (metric.disagreements) {
      categoryStats[category].disagreements += metric.disagreements.length;
    }
    
    if (metric.claudeReview?.proposedCorrections && 
        Object.keys(metric.claudeReview.proposedCorrections).length > 0) {
      categoryStats[category].claudeCorrections++;
    }
  });
  
  // Sort by job count
  const topCategories = Object.entries(categoryStats)
    .sort(([, a], [, b]) => b.jobs - a.jobs)
    .slice(0, 8);
  
  console.log('\n📁 TOP CATEGORIES (Last 7 Days)');
  console.log('─'.repeat(100));
  console.log('Category                   Jobs    Avg Disagreements/Job    Claude Correction Rate');
  console.log('─'.repeat(100));
  
  topCategories.forEach(([category, stats]) => {
    const avgDisagreements = (stats.disagreements / stats.jobs).toFixed(1);
    const correctionRate = ((stats.claudeCorrections / stats.jobs) * 100).toFixed(1);
    
    const categoryPadded = category.padEnd(25);
    const jobsPadded = String(stats.jobs).padStart(5);
    const avgPadded = String(avgDisagreements).padStart(20);
    
    console.log(`${categoryPadded} ${jobsPadded}             ${avgPadded}              ${correctionRate}%`);
  });
}

/**
 * Render confidence trends
 */
async function renderConfidenceTrends() {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const metrics = await AIPerformanceMetrics.find({ 
    timestamp: { $gte: last24h } 
  }).lean();
  
  if (metrics.length === 0) {
    console.log('\n📈 CONFIDENCE TRENDS (Last 24 Hours)');
    console.log('─'.repeat(100));
    console.log('No data available');
    return;
  }
  
  let openaiConfidenceSum = 0;
  let xaiConfidenceSum = 0;
  let count = 0;
  
  metrics.forEach(metric => {
    const openaiConf = metric.openaiOutputs?.confidence;
    const xaiConf = metric.xaiOutputs?.confidence;
    
    if (typeof openaiConf === 'number' && typeof xaiConf === 'number') {
      openaiConfidenceSum += openaiConf;
      xaiConfidenceSum += xaiConf;
      count++;
    }
  });
  
  const avgOpenaiConfidence = count > 0 ? (openaiConfidenceSum / count) * 100 : 0;
  const avgXaiConfidence = count > 0 ? (xaiConfidenceSum / count) * 100 : 0;
  
  console.log('\n📈 CONFIDENCE TRENDS (Last 24 Hours)');
  console.log('─'.repeat(100));
  console.log(`OpenAI Avg Confidence: ${colorPercent(avgOpenaiConfidence, 70)}`);
  console.log(`xAI Avg Confidence:    ${colorPercent(avgXaiConfidence, 70)}`);
  
  const confidenceStatus = Math.min(avgOpenaiConfidence, avgXaiConfidence) > 70 ? '✅ HEALTHY' :
                          Math.min(avgOpenaiConfidence, avgXaiConfidence) > 60 ? '⚠️  FAIR' : '🔴 LOW';
  console.log(`Status: ${confidenceStatus}`);
}

/**
 * Render footer
 */
function renderFooter() {
  console.log('\n' + '═'.repeat(100));
  if (LIVE_MODE) {
    console.log('Refreshing every 10 seconds... Press Ctrl+C to exit');
  } else {
    console.log('Run with --live flag for auto-refresh');
  }
  console.log('═'.repeat(100));
}

/**
 * Render complete dashboard
 */
async function renderDashboard() {
  if (LIVE_MODE) clearScreen();
  
  renderHeader();
  await renderOverview();
  await renderWinRates();
  await renderFieldPerformance();
  await renderClaudeCorrections();
  await renderCategoryPerformance();
  await renderConfidenceTrends();
  renderFooter();
}

// ===================================================================
// MAIN EXECUTION
// ===================================================================

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    
    if (LIVE_MODE) {
      console.log('🤖 Starting AI Performance Dashboard in LIVE mode...');
      
      // Initial render
      await renderDashboard();
      
      // Set up refresh interval
      setInterval(async () => {
        try {
          await renderDashboard();
        } catch (error) {
          console.error('Dashboard refresh error:', error.message);
        }
      }, REFRESH_INTERVAL_MS);
      
    } else {
      // Single render
      await renderDashboard();
      await mongoose.connection.close();
    }
    
  } catch (error) {
    console.error('\n❌ Dashboard failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown in live mode
process.on('SIGINT', async () => {
  console.log('\n\n👋 Shutting down dashboard...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { renderDashboard };
