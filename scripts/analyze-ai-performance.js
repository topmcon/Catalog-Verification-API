#!/usr/bin/env node

/**
 * AI Performance Analysis Script
 * 
 * Analyzes disaggregated AI performance data from AIPerformanceMetrics collection
 * to identify patterns, strengths, weaknesses, and opportunities for system improvement.
 * 
 * Usage:
 *   node scripts/analyze-ai-performance.js [--days=30] [--category="Faucets"] [--field="color"]
 * 
 * Options:
 *   --days=N          Analyze last N days (default: 30)
 *   --category=NAME   Filter by specific category
 *   --field=NAME      Deep dive into specific field
 *   --min-jobs=N      Minimum jobs required for statistical relevance (default: 10)
 */

const mongoose = require('mongoose');
require('dotenv').config();

// ===================================================================
// CONFIGURATION
// ===================================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification';
const DAYS_TO_ANALYZE = parseInt(process.argv.find(arg => arg.startsWith('--days='))?.split('=')[1] || '30');
const FILTER_CATEGORY = process.argv.find(arg => arg.startsWith('--category='))?.split('=')[1];
const FILTER_FIELD = process.argv.find(arg => arg.startsWith('--field='))?.split('=')[1];
const MIN_JOBS = parseInt(process.argv.find(arg => arg.startsWith('--min-jobs='))?.split('=')[1] || '10');

// ===================================================================
// MONGODB SCHEMA
// ===================================================================

const AIPerformanceMetricsSchema = new mongoose.Schema({
  jobId: String,
  sfCatalogId: String,
  sfCatalogName: String,
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
// ANALYSIS FUNCTIONS
// ===================================================================

/**
 * Analyze which AI wins more often for each field
 */
async function analyzeFieldPerformance(startDate) {
  const query = { timestamp: { $gte: startDate } };
  if (FILTER_CATEGORY) query.category = FILTER_CATEGORY;
  
  const metrics = await AIPerformanceMetrics.find(query).lean();
  
  if (metrics.length < MIN_JOBS) {
    console.log(`\n⚠️  Insufficient data: Only ${metrics.length} jobs found (minimum ${MIN_JOBS} required)`);
    return;
  }
  
  // Aggregate disagreement resolutions by field
  const fieldStats = {};
  
  metrics.forEach(metric => {
    if (!metric.disagreements) return;
    
    metric.disagreements.forEach(disagreement => {
      const field = disagreement.field;
      if (!fieldStats[field]) {
        fieldStats[field] = {
          total: 0,
          openaiWins: 0,
          xaiWins: 0,
          combined: 0,
          notFound: 0,
          reasons: {}
        };
      }
      
      fieldStats[field].total++;
      
      if (disagreement.smartResolutionWinner === 'openai') {
        fieldStats[field].openaiWins++;
      } else if (disagreement.smartResolutionWinner === 'xai') {
        fieldStats[field].xaiWins++;
      } else if (disagreement.smartResolutionWinner === 'combined') {
        fieldStats[field].combined++;
      } else if (disagreement.smartResolutionWinner === 'not_found') {
        fieldStats[field].notFound++;
      }
      
      // Track resolution reasons
      const reason = disagreement.smartResolutionReason || 'Unknown';
      fieldStats[field].reasons[reason] = (fieldStats[field].reasons[reason] || 0) + 1;
    });
  });
  
  // Sort fields by disagreement frequency
  const sortedFields = Object.entries(fieldStats)
    .sort(([, a], [, b]) => b.total - a.total);
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 FIELD-LEVEL AI PERFORMANCE ANALYSIS');
  console.log('='.repeat(80));
  console.log(`Analysis Period: Last ${DAYS_TO_ANALYZE} days`);
  console.log(`Total Jobs Analyzed: ${metrics.length}`);
  if (FILTER_CATEGORY) console.log(`Category Filter: ${FILTER_CATEGORY}`);
  console.log('='.repeat(80));
  
  sortedFields.forEach(([field, stats]) => {
    const openaiPct = ((stats.openaiWins / stats.total) * 100).toFixed(1);
    const xaiPct = ((stats.xaiWins / stats.total) * 100).toFixed(1);
    const combinedPct = ((stats.combined / stats.total) * 100).toFixed(1);
    const notFoundPct = ((stats.notFound / stats.total) * 100).toFixed(1);
    
    console.log(`\n🔹 ${field.toUpperCase()}`);
    console.log(`   Total Disagreements: ${stats.total}`);
    console.log(`   OpenAI Wins: ${stats.openaiWins} (${openaiPct}%)`);
    console.log(`   xAI Wins: ${stats.xaiWins} (${xaiPct}%)`);
    console.log(`   Combined: ${stats.combined} (${combinedPct}%)`);
    console.log(`   Not Found: ${stats.notFound} (${notFoundPct}%)`);
    
    // Show top 3 resolution reasons
    const topReasons = Object.entries(stats.reasons)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    
    if (topReasons.length > 0) {
      console.log(`   Top Resolution Reasons:`);
      topReasons.forEach(([reason, count]) => {
        const reasonPct = ((count / stats.total) * 100).toFixed(1);
        console.log(`      - ${reason} (${count}, ${reasonPct}%)`);
      });
    }
  });
  
  return { fieldStats, totalJobs: metrics.length };
}

/**
 * Analyze Claude's correction patterns - which AI's outputs does Claude correct more often?
 */
async function analyzeClaudeCorrections(startDate) {
  const query = { 
    timestamp: { $gte: startDate },
    'claudeReview.proposedCorrections': { $exists: true, $ne: null }
  };
  if (FILTER_CATEGORY) query.category = FILTER_CATEGORY;
  
  const metricsWithCorrections = await AIPerformanceMetrics.find(query).lean();
  
  if (metricsWithCorrections.length === 0) {
    console.log('\n⚠️  No Claude corrections found in analysis period');
    return;
  }
  
  const correctionStats = {
    totalJobs: metricsWithCorrections.length,
    openaiCorrected: 0,
    xaiCorrected: 0,
    bothCorrected: 0,
    fieldCorrections: {}
  };
  
  metricsWithCorrections.forEach(metric => {
    const corrections = metric.claudeReview?.proposedCorrections;
    if (!corrections || Object.keys(corrections).length === 0) return;
    
    let correctedOpenai = false;
    let correctedXai = false;
    
    Object.keys(corrections).forEach(field => {
      // Track field-specific corrections
      if (!correctionStats.fieldCorrections[field]) {
        correctionStats.fieldCorrections[field] = 0;
      }
      correctionStats.fieldCorrections[field]++;
      
      // Try to match which AI originally provided the incorrect value
      const disagreement = metric.disagreements?.find(d => d.field === field);
      if (disagreement) {
        if (disagreement.smartResolutionWinner === 'openai') {
          correctedOpenai = true;
        } else if (disagreement.smartResolutionWinner === 'xai') {
          correctedXai = true;
        }
      }
    });
    
    if (correctedOpenai && correctedXai) {
      correctionStats.bothCorrected++;
    } else if (correctedOpenai) {
      correctionStats.openaiCorrected++;
    } else if (correctedXai) {
      correctionStats.xaiCorrected++;
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('🔍 CLAUDE CORRECTION ANALYSIS');
  console.log('='.repeat(80));
  console.log(`Jobs with Claude Corrections: ${correctionStats.totalJobs}`);
  console.log(`OpenAI Selections Corrected: ${correctionStats.openaiCorrected}`);
  console.log(`xAI Selections Corrected: ${correctionStats.xaiCorrected}`);
  console.log(`Both AIs Corrected: ${correctionStats.bothCorrected}`);
  
  // Show most frequently corrected fields
  const topCorrectedFields = Object.entries(correctionStats.fieldCorrections)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  
  if (topCorrectedFields.length > 0) {
    console.log(`\nMost Frequently Corrected Fields:`);
    topCorrectedFields.forEach(([field, count]) => {
      console.log(`   ${field}: ${count} corrections`);
    });
  }
  
  return correctionStats;
}

/**
 * Category-specific performance breakdown
 */
async function analyzeCategoryPerformance(startDate) {
  const query = { timestamp: { $gte: startDate } };
  
  const metrics = await AIPerformanceMetrics.find(query).lean();
  
  if (metrics.length < MIN_JOBS) {
    console.log(`\n⚠️  Insufficient data for category analysis`);
    return;
  }
  
  const categoryStats = {};
  
  metrics.forEach(metric => {
    const category = metric.category || 'Unknown';
    
    if (!categoryStats[category]) {
      categoryStats[category] = {
        totalJobs: 0,
        totalDisagreements: 0,
        openaiWins: 0,
        xaiWins: 0,
        claudeCorrections: 0,
        avgProcessingTime: 0,
        processingTimes: []
      };
    }
    
    categoryStats[category].totalJobs++;
    categoryStats[category].processingTimes.push(metric.processingTimeMs || 0);
    
    if (metric.disagreements) {
      categoryStats[category].totalDisagreements += metric.disagreements.length;
      
      metric.disagreements.forEach(d => {
        if (d.smartResolutionWinner === 'openai') {
          categoryStats[category].openaiWins++;
        } else if (d.smartResolutionWinner === 'xai') {
          categoryStats[category].xaiWins++;
        }
      });
    }
    
    if (metric.claudeReview?.proposedCorrections && 
        Object.keys(metric.claudeReview.proposedCorrections).length > 0) {
      categoryStats[category].claudeCorrections++;
    }
  });
  
  // Calculate averages
  Object.values(categoryStats).forEach(stats => {
    stats.avgProcessingTime = Math.round(
      stats.processingTimes.reduce((a, b) => a + b, 0) / stats.processingTimes.length
    );
    delete stats.processingTimes;
  });
  
  // Sort by job count
  const sortedCategories = Object.entries(categoryStats)
    .sort(([, a], [, b]) => b.totalJobs - a.totalJobs);
  
  console.log('\n' + '='.repeat(80));
  console.log('📁 CATEGORY-SPECIFIC PERFORMANCE');
  console.log('='.repeat(80));
  
  sortedCategories.forEach(([category, stats]) => {
    const openaiPct = stats.totalDisagreements > 0 
      ? ((stats.openaiWins / stats.totalDisagreements) * 100).toFixed(1)
      : '0.0';
    const xaiPct = stats.totalDisagreements > 0
      ? ((stats.xaiWins / stats.totalDisagreements) * 100).toFixed(1)
      : '0.0';
    const correctionRate = ((stats.claudeCorrections / stats.totalJobs) * 100).toFixed(1);
    
    console.log(`\n📂 ${category}`);
    console.log(`   Jobs: ${stats.totalJobs}`);
    console.log(`   Avg Processing Time: ${stats.avgProcessingTime}ms`);
    console.log(`   Total Disagreements: ${stats.totalDisagreements}`);
    console.log(`   OpenAI Win Rate: ${openaiPct}%`);
    console.log(`   xAI Win Rate: ${xaiPct}%`);
    console.log(`   Claude Correction Rate: ${correctionRate}%`);
  });
  
  return categoryStats;
}

/**
 * Deep dive into specific field performance (if --field specified)
 */
async function analyzeSpecificField(startDate, fieldName) {
  const query = { 
    timestamp: { $gte: startDate },
    'disagreements.field': fieldName
  };
  if (FILTER_CATEGORY) query.category = FILTER_CATEGORY;
  
  const metrics = await AIPerformanceMetrics.find(query).lean();
  
  if (metrics.length === 0) {
    console.log(`\n⚠️  No disagreements found for field: ${fieldName}`);
    return;
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`🔬 DEEP DIVE: ${fieldName.toUpperCase()}`);
  console.log('='.repeat(80));
  console.log(`Jobs with Disagreements: ${metrics.length}`);
  
  const examples = [];
  
  metrics.forEach(metric => {
    const disagreement = metric.disagreements?.find(d => d.field === fieldName);
    if (!disagreement) return;
    
    examples.push({
      jobId: metric.jobId,
      sfCatalogId: metric.sfCatalogId,
      category: metric.category,
      openaiValue: disagreement.openaiValue,
      xaiValue: disagreement.xaiValue,
      winner: disagreement.smartResolutionWinner,
      reason: disagreement.smartResolutionReason,
      claudeCorrected: metric.claudeReview?.proposedCorrections?.[fieldName] !== undefined,
      finalValue: metric.finalValues?.[fieldName]
    });
  });
  
  // Show sample disagreements
  console.log(`\nSample Disagreements (showing up to 15):`);
  examples.slice(0, 15).forEach((ex, idx) => {
    console.log(`\n${idx + 1}. Job: ${ex.jobId} (${ex.category})`);
    console.log(`   SF Catalog: ${ex.sfCatalogId}`);
    console.log(`   OpenAI: "${ex.openaiValue}"`);
    console.log(`   xAI: "${ex.xaiValue}"`);
    console.log(`   Winner: ${ex.winner} - ${ex.reason}`);
    if (ex.claudeCorrected) {
      console.log(`   ⚠️  Claude Corrected to: "${ex.finalValue}"`);
    } else {
      console.log(`   Final: "${ex.finalValue}"`);
    }
  });
  
  return examples;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(fieldStats, claudeStats, categoryStats) {
  console.log('\n' + '='.repeat(80));
  console.log('💡 RECOMMENDATIONS');
  console.log('='.repeat(80));
  
  const recommendations = [];
  
  // Check for fields with high disagreement rates
  if (fieldStats) {
    Object.entries(fieldStats).forEach(([field, stats]) => {
      const disagreementRate = (stats.total / fieldStats.totalJobs) * 100;
      
      if (disagreementRate > 30) {
        recommendations.push({
          priority: 'HIGH',
          field,
          issue: `High disagreement rate (${disagreementRate.toFixed(1)}%)`,
          action: `Review smart resolution logic for "${field}" field. Consider field-specific routing.`
        });
      }
      
      // Check for fields where one AI consistently wins
      if (stats.openaiWins > stats.xaiWins * 3) {
        recommendations.push({
          priority: 'MEDIUM',
          field,
          issue: `OpenAI wins ${((stats.openaiWins / stats.total) * 100).toFixed(1)}% of disagreements`,
          action: `Investigate if xAI prompts need improvement for "${field}" field.`
        });
      } else if (stats.xaiWins > stats.openaiWins * 3) {
        recommendations.push({
          priority: 'MEDIUM',
          field,
          issue: `xAI wins ${((stats.xaiWins / stats.total) * 100).toFixed(1)}% of disagreements`,
          action: `Investigate if OpenAI prompts need improvement for "${field}" field.`
        });
      }
    });
  }
  
  // Check Claude correction patterns
  if (claudeStats) {
    if (claudeStats.openaiCorrected > claudeStats.xaiCorrected * 2) {
      recommendations.push({
        priority: 'HIGH',
        field: 'SYSTEM',
        issue: `Claude corrects OpenAI selections 2x more than xAI`,
        action: `Review OpenAI prompts for accuracy. Consider increasing evidence validation threshold.`
      });
    } else if (claudeStats.xaiCorrected > claudeStats.openaiCorrected * 2) {
      recommendations.push({
        priority: 'HIGH',
        field: 'SYSTEM',
        issue: `Claude corrects xAI selections 2x more than OpenAI`,
        action: `Review xAI prompts for accuracy. Consider increasing evidence validation threshold.`
      });
    }
    
    // Check most corrected fields
    const topCorrectedFields = Object.entries(claudeStats.fieldCorrections || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    
    topCorrectedFields.forEach(([field, count]) => {
      recommendations.push({
        priority: 'HIGH',
        field,
        issue: `Claude corrects this field ${count} times`,
        action: `Review smart resolution logic for "${field}". May need additional validation rules.`
      });
    });
  }
  
  // Sort by priority
  recommendations.sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  // Display
  if (recommendations.length === 0) {
    console.log('\n✅ No critical issues detected. System performance appears balanced.');
  } else {
    recommendations.forEach((rec, idx) => {
      const icon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`\n${icon} ${idx + 1}. [${rec.priority}] ${rec.field}`);
      console.log(`   Issue: ${rec.issue}`);
      console.log(`   Action: ${rec.action}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
}

// ===================================================================
// MAIN EXECUTION
// ===================================================================

async function main() {
  console.log('\n🤖 AI Performance Analysis Script');
  console.log('Analyzing disaggregated AI performance data...\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - DAYS_TO_ANALYZE);
    
    // Run analyses
    let fieldStatsResult, claudeStatsResult, categoryStatsResult;
    
    if (FILTER_FIELD) {
      // Deep dive into specific field
      await analyzeSpecificField(startDate, FILTER_FIELD);
    } else {
      // Run full analysis suite
      const fieldAnalysis = await analyzeFieldPerformance(startDate);
      fieldStatsResult = fieldAnalysis?.fieldStats;
      
      claudeStatsResult = await analyzeClaudeCorrections(startDate);
      categoryStatsResult = await analyzeCategoryPerformance(startDate);
      
      // Generate recommendations
      generateRecommendations(fieldStatsResult, claudeStatsResult, categoryStatsResult);
    }
    
    console.log('\n✅ Analysis complete!');
    
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { analyzeFieldPerformance, analyzeClaudeCorrections, analyzeCategoryPerformance };
