#!/usr/bin/env node

/**
 * Response Quality Analytics Viewer
 * View trends and recommendations for inconclusive AI responses
 */

import mongoose from 'mongoose';
import responseQualityService from '../src/services/response-quality-analytics.service';
import '../src/models/inconclusive-response-log.model';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification';

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const args = process.argv.slice(2);
    const command = args[0] || 'summary';
    
    switch (command) {
      case 'summary':
        await showSummary();
        break;
      
      case 'by-field':
        const category = args[1];
        await showFieldTrends(category);
        break;
      
      case 'by-category':
        await showCategoryTrends();
        break;
      
      case 'recommendations':
        const recCategory = args[1];
        await showRecommendations(recCategory);
        break;
      
      default:
        showHelp();
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

async function showSummary() {
  console.log('=== Response Quality Summary ===\n');
  
  const stats = await responseQualityService.getSummaryStats();
  
  console.log(`Total Inconclusive Responses: ${stats.total_inconclusive}`);
  console.log(`Unique Fields Affected: ${stats.unique_fields_affected}`);
  console.log(`Unique Categories Affected: ${stats.unique_categories_affected}`);
  console.log(`Both AIs Failed: ${stats.both_ai_failed_count} (${(stats.both_ai_failed_rate * 100).toFixed(1)}%)`);
  console.log(`Primary Field Issues: ${stats.primary_field_issues}`);
  console.log(`Filter Field Issues: ${stats.filter_field_issues}`);
  console.log();
}

async function showFieldTrends(category?: string) {
  console.log(`=== Field Trends${category ? ` for ${category}` : ''} ===\n`);
  
  const trends = await responseQualityService.getTrendsByField(category);
  
  // Show top 20 most problematic fields
  const topTrends = trends.slice(0, 20);
  
  console.log(`Field Name                              | Occurrences | Rate  | Top Type         | Categories`);
  console.log(`${''.padEnd(120, '-')}`);
  
  for (const trend of topTrends) {
    const fieldName = trend.field_name.padEnd(40);
    const occurrences = trend.total_occurrences.toString().padStart(11);
    const rate = `${(trend.inconclusive_rate * 100).toFixed(1)}%`.padStart(5);
    const topType = Object.entries(trend.breakdown_by_type)
      .sort((a, b) => (b[1] as number) - (a[1] as number))[0][0]
      .padEnd(17);
    const categories = trend.affects_categories.slice(0, 2).join(', ');
    
    console.log(`${fieldName} | ${occurrences} | ${rate} | ${topType} | ${categories}`);
  }
  
  console.log();
  console.log(`Showing ${topTrends.length} of ${trends.length} fields`);
  console.log();
}

async function show CategoryTrends() {
  console.log('=== Category Trends ===\n');
  
  const trends = await responseQualityService.getTrendsByCategory();
  
  console.log(`Category                                | Type        | Issues | Fields Affected`);
  console.log(`${''.padEnd(100, '-')}`);
  
  for (const trend of trends) {
    const category = trend._id.category.padEnd(40);
    const fieldType = trend._id.field_type.padEnd(12);
    const issues = trend.total_inconclusive.toString().padStart(6);
    const fieldsAffected = trend.fields_affected.length.toString().padStart(15);
    
    console.log(`${category} | ${fieldType} | ${issues} | ${fieldsAffected}`);
  }
  
  console.log();
}

async function showRecommendations(category?: string) {
  console.log(`=== Recommendations${category ? ` for ${category}` : ''} ===\n`);
  
  const trends = await responseQualityService.getTrendsByField(category);
  
  // Filter high-impact issues
  const highImpact = trends.filter(t => 
    t.inconclusive_rate > 0.5 || t.total_occurrences > 10
  );
  
  // Categorize by issue type
  const fieldsToRemove = highImpact.filter(t => 
    (t.breakdown_by_type['not_applicable'] || 0) > (t.total_occurrences * 0.7)
  );
  
  const fieldsNeedingBetterData = highImpact.filter(t => 
    ((t.breakdown_by_type['not_found'] || 0) + (t.breakdown_by_type['unknown'] || 0)) > (t.total_occurrences * 0.5)
  );
  
  const fieldsNeedingPromptRefinement = highImpact.filter(t => 
    (t.breakdown_by_type['vague'] || 0) > (t.total_occurrences * 0.3)
  );
  
  if (fieldsToRemove.length > 0) {
    console.log('🔴 FIELDS TO CONSIDER REMOVING:\n');
    for (const field of fieldsToRemove) {
      console.log(`  • ${field.field_name}`);
      console.log(`    Reason: ${field.total_occurrences} occurrences, mostly "Not Applicable"`);
      console.log(`    Categories: ${field.affects_categories.join(', ')}`);
      console.log();
    }
  }
  
  if (fieldsNeedingBetterData.length > 0) {
    console.log('🟡 FIELDS NEEDING BETTER DATA SOURCES:\n');
    for (const field of fieldsNeedingBetterData) {
      console.log(`  • ${field.field_name}`);
      console.log(`    Reason: ${field.total_occurrences} occurrences, mostly "Unknown"/"Not Found"`);
      console.log(`    Categories: ${field.affects_categories.join(', ')}`);
      console.log();
    }
  }
  
  if (fieldsNeedingPromptRefinement.length > 0) {
    console.log('🟠 FIELDS NEEDING PROMPT REFINEMENT:\n');
    for (const field of fieldsNeedingPromptRefinement) {
      console.log(`  • ${field.field_name}`);
      console.log(`    Reason: ${field.total_occurrences} occurrences, mostly vague responses`);
      console.log(`    Common values: ${field.common_values.slice(0, 3).map(v => v.value).join(', ')}`);
      console.log(`    Categories: ${field.affects_categories.join(', ')}`);
      console.log();
    }
  }
  
  console.log(`\nTotal Problematic Fields: ${highImpact.length}`);
  console.log(`Total Inconclusive Responses: ${highImpact.reduce((sum, t) => sum + t.total_occurrences, 0)}`);
  console.log();
}

function showHelp() {
  console.log(`
Response Quality Analytics Viewer
===================================

Usage:
  npm run view-response-quality [command] [options]

Commands:
  summary                        Show overall summary statistics
  by-field [category]           Show trends grouped by field name (optionally filter by category)
  by-category                   Show trends grouped by category
  recommendations [category]    Show actionable recommendations (optionally filter by category)

Examples:
  npm run view-response-quality summary
  npm run view-response-quality by-field Dryer
  npm run view-response-quality recommendations
  `);
}

main();
