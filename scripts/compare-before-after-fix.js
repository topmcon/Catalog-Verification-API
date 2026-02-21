#!/usr/bin/env node
/**
 * Before/After Comparison - Compare jobs before and after Phase 1 fix
 * Shows the improvement from removing 8 type-level categories
 */

const { MongoClient } = require('mongodb');

const mongoUri = 'mongodb://127.0.0.1:27017';
const dbName = 'catalog-verification';

// Load picklists
const categories = require('../src/config/salesforce-picklists/categories.json');
const categoryNames = categories.map(c => c.category_name);

// Phase 1 deployment time (adjust as needed)
const PHASE1_DEPLOYMENT = new Date('2026-02-21T01:12:00Z');

async function compareBeforeAfter() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(dbName);
    const jobs = db.collection('verification_jobs');
    
    // Get jobs 3 hours before deployment
    const beforeStart = new Date(PHASE1_DEPLOYMENT.getTime() - 3 * 60 * 60 * 1000);
    
    const beforeJobs = await jobs.find({
      createdAt: { $gte: beforeStart, $lt: PHASE1_DEPLOYMENT },
      status: 'completed'
    }).sort({ createdAt: -1 }).limit(50).toArray();
    
    // Get jobs after deployment
    const afterJobs = await jobs.find({
      createdAt: { $gte: PHASE1_DEPLOYMENT },
      status: 'completed'
    }).sort({ createdAt: -1 }).limit(50).toArray();
    
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║       BEFORE/AFTER COMPARISON - PHASE 1 FIX                  ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 DEPLOYMENT INFO:');
    console.log('  Phase 1 deployment:', PHASE1_DEPLOYMENT.toISOString());
    console.log('  Before period:', beforeStart.toISOString(), 'to', PHASE1_DEPLOYMENT.toISOString());
    console.log('  After period:', PHASE1_DEPLOYMENT.toISOString(), 'to now');
    console.log('');
    
    console.log('📊 SAMPLE SIZES:');
    console.log('  BEFORE fix:', beforeJobs.length, 'jobs');
    console.log('  AFTER fix:', afterJobs.length, 'jobs');
    console.log('');
    
    if (afterJobs.length === 0) {
      console.log('⏳ No jobs completed AFTER fix yet');
      console.log('   Can only analyze BEFORE period\n');
    }
    
    // Analyze BEFORE
    const beforeStats = analyzeJobs(beforeJobs, 'BEFORE');
    
    // Analyze AFTER
    const afterStats = afterJobs.length > 0 ? analyzeJobs(afterJobs, 'AFTER') : null;
    
    // Comparison
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 COMPARISON:\n');
    
    console.log('                          BEFORE    →    AFTER     Δ Change');
    console.log('─────────────────────────────────────────────────────────────');
    
    const beforeNonExist = beforeStats.nonExistentRate;
    const afterNonExist = afterStats ? afterStats.nonExistentRate : 'N/A';
    const change = afterStats ? (afterStats.nonExistentRate - beforeStats.nonExistentRate).toFixed(1) : 'N/A';
    
    console.log(`Non-existent categories:  ${beforeNonExist}%    →    ${afterNonExist}%     ${change !== 'N/A' ? (change > 0 ? '📈+' : '📉') + change + '%' : 'N/A'}`);
    
    if (afterStats) {
      console.log(`Unique categories used:   ${beforeStats.uniqueCategories}      →    ${afterStats.uniqueCategories}       ${afterStats.uniqueCategories - beforeStats.uniqueCategories > 0 ? '+' : ''}${afterStats.uniqueCategories - beforeStats.uniqueCategories}`);
    }
    
    console.log('');
    
    // The 8 removed entries
    const removedEntries = [
      'Wine Cooler', 'Beverage Center', 'Outdoor Lighting',
      'Cabinet Hardware', 'Laundry Sink', 'Utility Sink', 
      'Carpet', 'Home Accents'
    ];
    
    console.log('🗑️  REMOVED CATEGORIES USAGE:\n');
    
    removedEntries.forEach(entry => {
      const beforeCount = beforeJobs.filter(j => j.result?.Field_AI_Reviews?.category_verified === entry).length;
      const afterCount = afterJobs.filter(j => j.result?.Field_AI_Reviews?.category_verified === entry).length;
      
      if (beforeCount > 0 || afterCount > 0) {
        console.log(`  ${entry}:`);
        console.log(`    BEFORE: ${beforeCount} jobs`);
        console.log(`    AFTER: ${afterCount} jobs ${afterCount === 0 ? '✅' : '⚠️'}`);
      }
    });
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    
    if (afterJobs.length === 0) {
      console.log('⏳ WAITING FOR POST-FIX DATA');
      console.log('   Run this script again after Salesforce sends more requests');
    } else if (afterStats.nonExistentRate < beforeStats.nonExistentRate) {
      console.log('✅ IMPROVEMENT DETECTED!');
      console.log(`   Non-existent categories reduced by ${(beforeStats.nonExistentRate - afterStats.nonExistentRate).toFixed(1)}%`);
    } else if (afterStats.nonExistentRate === beforeStats.nonExistentRate) {
      console.log('➡️  NO CHANGE YET');
      console.log('   May need more data or Phase 2 validation');
    } else {
      console.log('⚠️  ISSUE - Non-existent categories INCREASED');
      console.log('   Need to investigate Phase 2 validation');
    }
    
    console.log('═══════════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

function analyzeJobs(jobs, label) {
  console.log(`\n🔍 ${label} FIX ANALYSIS:\n`);
  
  const categoriesUsed = new Set();
  const nonExistentCategories = new Set();
  
  jobs.forEach(job => {
    const category = job.result?.Field_AI_Reviews?.category_verified;
    if (category) {
      categoriesUsed.add(category);
      if (!categoryNames.includes(category)) {
        nonExistentCategories.add(category);
      }
    }
  });
  
  const nonExistentRate = (nonExistentCategories.size / categoriesUsed.size * 100).toFixed(1);
  
  console.log(`  Jobs analyzed: ${jobs.length}`);
  console.log(`  Unique categories: ${categoriesUsed.size}`);
  console.log(`  Non-existent categories: ${nonExistentCategories.size} (${nonExistentRate}%)`);
  
  if (nonExistentCategories.size > 0) {
    console.log(`\n  Non-existent categories:`);
    [...nonExistentCategories].forEach(cat => {
      const count = jobs.filter(j => j.result?.Field_AI_Reviews?.category_verified === cat).length;
      console.log(`    - ${cat} (${count} jobs)`);
    });
  }
  
  return {
    jobs: jobs.length,
    uniqueCategories: categoriesUsed.size,
    nonExistent: nonExistentCategories.size,
    nonExistentRate: parseFloat(nonExistentRate),
    nonExistentList: [...nonExistentCategories]
  };
}

compareBeforeAfter();
