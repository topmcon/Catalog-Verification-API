/**
 * Test Script: Run Verification with Failed Match Logging
 * 
 * This script:
 * 1. Runs a verification on a test payload
 * 2. Shows what failed matches the new logger captures
 * 
 * Run: npx ts-node src/scripts/test-verification-with-logging.ts
 */

import mongoose from 'mongoose';
import config from '../config';
import { FailedMatchLog } from '../models/failed-match-log.model';
import { failedMatchLogger } from '../services/failed-match-logger.service';
import picklistMatcher from '../services/picklist-matcher.service';

// Sample test data simulating what would come from Salesforce
const testProduct = {
  SF_Catalog_Id: 'TEST-001',
  SF_Catalog_Name: '1201D32-RC',
  Brand_Web_Retailer: 'Elegant Lighting',
  Model_Number_Web_Retailer: '1201D32-RC',
  Web_Retailer_Category: 'Lighting',
  Web_Retailer_SubCategory: 'Chandeliers',
  Ferguson_Brand: 'Elegant',  // Slightly different brand name
  // Test attributes that might not match
};

async function runTest() {
  console.log('='.repeat(80));
  console.log('FAILED MATCH LOGGING TEST');
  console.log('='.repeat(80));
  console.log();

  // Connect to MongoDB
  const mongoUri = config.mongodb?.uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/catalog-verification';
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(mongoUri);
  console.log('✓ Connected\n');

  try {
    // Picklist matcher initializes automatically
    console.log('Picklist matcher ready\n');

    // Test 1: Brand matching
    console.log('-'.repeat(80));
    console.log('TEST 1: BRAND MATCHING');
    console.log('-'.repeat(80));
    
    const testBrands = ['Elegant Lighting', 'ELEGANT LIGHTING', 'Elegant', 'Unknown Brand XYZ', 'Delta Faucet', 'Kohler'];
    
    for (const brand of testBrands) {
      const result = picklistMatcher.matchBrand(brand);
      if (result.matched) {
        console.log(`  ✓ "${brand}" → MATCHED to "${result.matchedValue?.brand_name}" (${(result.similarity * 100).toFixed(0)}%)`);
      } else {
        console.log(`  ✗ "${brand}" → NOT MATCHED (best: ${result.suggestions?.[0]?.brand_name || 'none'}, ${(result.similarity * 100).toFixed(0)}%)`);
        
        // Log the failed match
        await failedMatchLogger.logFailedMatch({
          matchType: 'brand',
          attemptedValue: brand,
          similarity: result.similarity,
          closestMatches: result.suggestions?.slice(0, 3).map(s => ({
            value: s.brand_name,
            id: s.brand_id,
            similarity: result.similarity
          })) || [],
          source: 'ai_analysis',
          productContext: {
            sf_catalog_id: testProduct.SF_Catalog_Id,
            sf_catalog_name: testProduct.SF_Catalog_Name,
            model_number: testProduct.Model_Number_Web_Retailer,
            brand: brand,
            category: 'Lighting',
            session_id: 'test-session-' + Date.now(),
          },
          aiContext: {
            openai_value: brand,
            xai_value: brand,
            consensus_value: brand,
          },
          requestGenerated: true,
        });
      }
    }
    console.log();

    // Test 2: Category matching
    console.log('-'.repeat(80));
    console.log('TEST 2: CATEGORY MATCHING');
    console.log('-'.repeat(80));
    
    const testCategories = ['Chandeliers', 'Pendants', 'Light Fixtures', 'Random Category', 'Dishwashers', 'Faucets'];
    
    for (const category of testCategories) {
      const result = picklistMatcher.matchCategory(category);
      if (result.matched) {
        console.log(`  ✓ "${category}" → MATCHED to "${result.matchedValue?.category_name}" (${(result.similarity * 100).toFixed(0)}%)`);
      } else {
        console.log(`  ✗ "${category}" → NOT MATCHED (best: ${result.suggestions?.[0]?.category_name || 'none'}, ${(result.similarity * 100).toFixed(0)}%)`);
        
        await failedMatchLogger.logFailedMatch({
          matchType: 'category',
          attemptedValue: category,
          similarity: result.similarity,
          closestMatches: result.suggestions?.slice(0, 3).map(s => ({
            value: s.category_name,
            id: s.category_id,
            similarity: result.similarity
          })) || [],
          source: 'ai_analysis',
          productContext: {
            sf_catalog_id: testProduct.SF_Catalog_Id,
            sf_catalog_name: testProduct.SF_Catalog_Name,
            model_number: testProduct.Model_Number_Web_Retailer,
            category: category,
            session_id: 'test-session-' + Date.now(),
          },
          requestGenerated: true,
        });
      }
    }
    console.log();

    // Test 3: Attribute matching
    console.log('-'.repeat(80));
    console.log('TEST 3: ATTRIBUTE MATCHING');
    console.log('-'.repeat(80));
    
    const testAttributes = ['Height', 'Width', 'Color', 'Royal Cut Crystal', 'Custom Finish Option', 'Random Attribute XYZ'];
    
    for (const attr of testAttributes) {
      const result = picklistMatcher.matchAttribute(attr);
      if (result.matched && result.matchedValue) {
        console.log(`  ✓ "${attr}" → MATCHED to "${result.matchedValue.attribute_name}" (${(result.similarity * 100).toFixed(0)}%)`);
      } else {
        console.log(`  ✗ "${attr}" → NOT MATCHED (best: ${result.suggestions?.[0]?.attribute_name || 'none'}, ${(result.similarity * 100).toFixed(0)}%)`);
        
        await failedMatchLogger.logFailedMatch({
          matchType: 'attribute',
          attemptedValue: attr,
          similarity: result.similarity,
          closestMatches: result.suggestions?.slice(0, 3).map(s => ({
            value: s.attribute_name,
            id: s.attribute_id,
            similarity: result.similarity
          })) || [],
          source: 'ai_analysis',
          productContext: {
            sf_catalog_id: testProduct.SF_Catalog_Id,
            sf_catalog_name: testProduct.SF_Catalog_Name,
            model_number: testProduct.Model_Number_Web_Retailer,
            category: 'Lighting',
            session_id: 'test-session-' + Date.now(),
          },
          requestGenerated: true,
        });
      }
    }
    console.log();

    // Flush the buffer to persist all logged failures
    console.log('Flushing failed match buffer to MongoDB...');
    await failedMatchLogger.flushBuffer();
    console.log('✓ Buffer flushed\n');

    // Show what we logged
    console.log('='.repeat(80));
    console.log('LOGGED FAILED MATCHES');
    console.log('='.repeat(80));
    
    const stats = await failedMatchLogger.getStats();
    console.log(`Total Failed Matches: ${stats.total}`);
    console.log(`Unresolved: ${stats.unresolved}`);
    console.log();
    
    console.log('By Type:');
    for (const [type, count] of Object.entries(stats.byType)) {
      if (count > 0) {
        console.log(`  ${type}: ${count}`);
      }
    }
    console.log();

    console.log('By Source:');
    for (const [source, count] of Object.entries(stats.bySource)) {
      if (count > 0) {
        console.log(`  ${source}: ${count}`);
      }
    }
    console.log();

    if (stats.topUnresolvedByOccurrence.length > 0) {
      console.log('Top Unresolved by Occurrence:');
      for (const item of stats.topUnresolvedByOccurrence.slice(0, 5)) {
        console.log(`  [${item.matchType}] "${item.attemptedValue}" - ${item.occurrenceCount} times, ${(item.similarity * 100).toFixed(0)}% similarity`);
        if (item.closestMatch) {
          console.log(`    → Closest: "${item.closestMatch}"`);
        }
      }
      console.log();
    }

    if (stats.nearMisses.length > 0) {
      console.log('Near Misses (good candidates for aliases):');
      for (const item of stats.nearMisses.slice(0, 5)) {
        console.log(`  [${item.matchType}] "${item.attemptedValue}" → "${item.closestMatch}" (${(item.similarity * 100).toFixed(0)}%)`);
      }
      console.log();
    }

    // Show detailed logs
    console.log('-'.repeat(80));
    console.log('DETAILED FAILED MATCH LOGS');
    console.log('-'.repeat(80));
    
    const allLogs = await FailedMatchLog.find({}).sort({ lastSeen: -1 }).limit(10).lean();
    
    for (const log of allLogs) {
      console.log(`\n[${log.matchType.toUpperCase()}] "${log.attemptedValue}"`);
      console.log(`  Similarity: ${(log.similarity * 100).toFixed(0)}%`);
      console.log(`  Source: ${log.source}`);
      console.log(`  Occurrences: ${log.occurrenceCount}`);
      console.log(`  Product: ${log.productContext.sf_catalog_id}`);
      if (log.closestMatches.length > 0) {
        console.log(`  Closest Matches: ${log.closestMatches.map(m => `"${m.value}"`).join(', ')}`);
      }
      if (log.aiContext) {
        console.log(`  AI Context: OpenAI="${log.aiContext.openai_value}", xAI="${log.aiContext.xai_value}"`);
      }
    }

  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run the test
runTest().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
