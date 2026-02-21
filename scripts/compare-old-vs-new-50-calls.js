#!/usr/bin/env node
/**
 * Compare Old vs New 50-Call Audits
 * Shows improvement from Phase 1 category cleanup
 */

const { MongoClient } = require('mongodb');

const mongoUri = 'mongodb://127.0.0.1:27017';
const dbName = 'catalog-verification';

// Load picklists
const categories = require('../src/config/salesforce-picklists/categories.json');
const types = require('../src/config/salesforce-picklists/types.json');
const styles = require('../src/config/salesforce-picklists/styles.json');

const categoryNames = categories.map(c => c.category_name);
const typeNames = types.map(t => t.type_name);
const styleNames = styles.map(s => s.style_name);

// OLD data from Feb 20 audit (BEFORE Phase 1 fix)
const OLD_DATA_FILE = '../audit-results/sf-50-calls-2026-02-20.json';

// The 8 removed categories
const REMOVED_CATEGORIES = [
  'Wine Cooler', 'Beverage Center', 'Outdoor Lighting',
  'Cabinet Hardware', 'Laundry Sink', 'Utility Sink', 
  'Carpet', 'Home Accents'
];

async function compareOldVsNew() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(dbName);
    const jobs = db.collection('verification_jobs');
    
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║       OLD vs NEW 50-CALL COMPARISON                          ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    // Load OLD data
    const oldData = require(OLD_DATA_FILE);
    const oldJobIds = oldData.jobs.map(j => j.job_id);
    
    console.log('📊 OLD DATA (BEFORE Phase 1 Fix):');
    console.log('  Date:', oldData.metadata.timespan.first, 'to', oldData.metadata.timespan.last);
    console.log('  Jobs captured:', oldData.metadata.total_jobs);
    console.log('  Status: Analyzed before category cleanup');
    console.log('');
    
    // Fetch OLD jobs from MongoDB
    const oldJobs = await jobs.find({
      job_id: { $in: oldJobIds }
    }).toArray();
    
    console.log('  Jobs fetched from MongoDB:', oldJobs.length);
    console.log('');
    
    // Get NEW 50 jobs (most recent completed)
    const newJobs = await jobs.find({
      status: 'completed',
      createdAt: { $gt: new Date('2026-02-21T01:12:00Z') } // After Phase 1 deployment
    }).sort({ createdAt: -1 }).limit(50).toArray();
    
    console.log('📊 NEW DATA (AFTER Phase 1 Fix):');
    if (newJobs.length === 0) {
      console.log('  ❌ NO NEW JOBS FOUND');
      console.log('  ⏳ Please have Salesforce send 50 new verification requests');
      console.log('  Then run this script again');
      return;
    }
    
    console.log('  Date:', newJobs[newJobs.length - 1].createdAt, 'to', newJobs[0].createdAt);
    console.log('  Jobs captured:', newJobs.length);
    console.log('  Status: Post-cleanup (Phase 1 deployed)');
    console.log('');
    
    // Analyze OLD
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 ANALYZING OLD DATA (BEFORE FIX):\n');
    const oldStats = analyzeJobs(oldJobs, 'OLD');
    
    // Analyze NEW
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 ANALYZING NEW DATA (AFTER FIX):\n');
    const newStats = analyzeJobs(newJobs, 'NEW');
    
    // COMPARISON
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 SIDE-BY-SIDE COMPARISON:\n');
    
    console.log('                                OLD (Before)    NEW (After)     Δ Change');
    console.log('───────────────────────────────────────────────────────────────────────');
    console.log(`Jobs Analyzed:                  ${pad(oldStats.total, 15)} ${pad(newStats.total, 15)} ${pad(newStats.total - oldStats.total > 0 ? '+' + (newStats.total - oldStats.total) : (newStats.total - oldStats.total), 12)}`);
    console.log(`Unique Categories:              ${pad(oldStats.uniqueCategories, 15)} ${pad(newStats.uniqueCategories, 15)} ${pad(newStats.uniqueCategories - oldStats.uniqueCategories > 0 ? '+' + (newStats.uniqueCategories - oldStats.uniqueCategories) : (newStats.uniqueCategories - oldStats.uniqueCategories), 12)}`);
    console.log(`Non-Existent Categories:        ${pad(oldStats.nonExistentCount, 15)} ${pad(newStats.nonExistentCount, 15)} ${pad(newStats.nonExistentCount - oldStats.nonExistentCount > 0 ? '+' + (newStats.nonExistentCount - oldStats.nonExistentCount) : (newStats.nonExistentCount - oldStats.nonExistentCount), 12)}`);
    console.log(`Non-Existent Rate:              ${pad(oldStats.nonExistentRate + '%', 15)} ${pad(newStats.nonExistentRate + '%', 15)} ${pad((newStats.nonExistentRate - oldStats.nonExistentRate).toFixed(1) + '%', 12)}`);
    console.log('');
    
    // Removed categories usage
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🗑️  REMOVED CATEGORIES COMPARISON:\n');
    
    let removedStillUsed = 0;
    REMOVED_CATEGORIES.forEach(cat => {
      const oldCount = countCategory(oldJobs, cat);
      const newCount = countCategory(newJobs, cat);
      
      if (oldCount > 0 || newCount > 0) {
        console.log(`  ${cat}:`);
        console.log(`    OLD: ${oldCount} jobs`);
        console.log(`    NEW: ${newCount} jobs ${newCount === 0 ? '✅ FIXED' : '⚠️ STILL USED'}`);
        console.log('');
        if (newCount > 0) removedStillUsed++;
      }
    });
    
    // Specific problem categories
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 SPECIFIC PROBLEM CATEGORIES:\n');
    
    // Check "Outdoor Wall Lights" issue
    const oldOutdoorWall = countCategory(oldJobs, 'Outdoor Wall Lights');
    const newOutdoorWall = countCategory(newJobs, 'Outdoor Wall Lights');
    const oldOutdoorLighting = countCategory(oldJobs, 'Outdoor Lighting');
    const newOutdoorLighting = countCategory(newJobs, 'Outdoor Lighting');
    
    console.log('  "Outdoor Wall Lights" (AI-created alternative):');
    console.log(`    OLD: ${oldOutdoorWall} jobs`);
    console.log(`    NEW: ${newOutdoorWall} jobs ${newOutdoorWall < oldOutdoorWall ? '✅ REDUCED' : newOutdoorWall === oldOutdoorWall ? '➡️ SAME' : '⚠️ INCREASED'}`);
    console.log('');
    
    console.log('  "Outdoor Lighting" (was category, now TYPE):');
    console.log(`    OLD: ${oldOutdoorLighting} jobs (category usage)`);
    console.log(`    NEW: ${newOutdoorLighting} jobs (should be 0) ${newOutdoorLighting === 0 ? '✅ FIXED' : '⚠️ STILL USED AS CATEGORY'}`);
    console.log('');
    
    // List non-existent categories comparison
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 NON-EXISTENT CATEGORIES BREAKDOWN:\n');
    
    console.log('  OLD (Before Fix):');
    if (oldStats.nonExistentList.length === 0) {
      console.log('    None');
    } else {
      oldStats.nonExistentList.forEach(cat => {
        const count = countCategory(oldJobs, cat);
        console.log(`    - ${cat} (${count} jobs)`);
      });
    }
    console.log('');
    
    console.log('  NEW (After Fix):');
    if (newStats.nonExistentList.length === 0) {
      console.log('    ✅ None - All categories valid!');
    } else {
      newStats.nonExistentList.forEach(cat => {
        const count = countCategory(newJobs, cat);
        const wasInOld = oldStats.nonExistentList.includes(cat);
        console.log(`    - ${cat} (${count} jobs) ${wasInOld ? '⚠️ Still present' : '🆕 New'}`);
      });
    }
    console.log('');
    
    // VERDICT
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🏁 PHASE 1 FIX EFFECTIVENESS:\n');
    
    if (newStats.nonExistentRate < oldStats.nonExistentRate) {
      const improvement = (oldStats.nonExistentRate - newStats.nonExistentRate).toFixed(1);
      console.log(`✅ IMPROVEMENT DETECTED!`);
      console.log(`   Non-existent categories reduced by ${improvement}%`);
      console.log(`   ${oldStats.nonExistentRate}% → ${newStats.nonExistentRate}%`);
    } else if (newStats.nonExistentRate === oldStats.nonExistentRate) {
      console.log(`➡️  NO CHANGE`);
      console.log(`   Non-existent rate: ${newStats.nonExistentRate}% (same)`);
      console.log(`   Phase 1 may not have targeted the right categories`);
    } else {
      console.log(`⚠️  WORSENED`);
      console.log(`   Non-existent categories INCREASED by ${(newStats.nonExistentRate - oldStats.nonExistentRate).toFixed(1)}%`);
      console.log(`   Need to investigate`);
    }
    console.log('');
    
    if (newOutdoorLighting === 0 && oldOutdoorLighting > 0) {
      console.log(`✅ "Outdoor Lighting" FIXED`);
      console.log(`   Was used as category ${oldOutdoorLighting} times, now 0`);
      console.log(`   Successfully converted from category to type`);
      console.log('');
    }
    
    if (removedStillUsed === 0) {
      console.log(`✅ REMOVED CATEGORIES CLEANUP SUCCESSFUL`);
      console.log(`   None of the 8 removed entries are being used`);
      console.log('');
    } else {
      console.log(`⚠️  ${removedStillUsed} REMOVED CATEGORIES STILL IN USE`);
      console.log(`   AI may be cached or needs rebuild`);
      console.log('');
    }
    
    // Next steps
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🚀 NEXT STEPS:\n');
    
    if (newStats.nonExistentRate > 5) {
      console.log('  ⚠️  Non-existent rate still high (>5%)');
      console.log('  → Proceed with Phase 2: Strict Category Validation');
      console.log('  → Add validation, fuzzy matching, retry logic');
    } else {
      console.log('  ✅ Non-existent rate acceptable (<5%)');
      console.log('  → Monitor for stability');
      console.log('  → Consider Phase 3: Hierarchical validation for semantic coherence');
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
  const categoriesUsed = new Set();
  const typesUsed = new Set();
  const stylesUsed = new Set();
  const nonExistentCategories = new Set();
  const nonExistentTypes = new Set();
  const nonExistentStyles = new Set();
  
  jobs.forEach(job => {
    const reviews = job.result?.Field_AI_Reviews;
    if (!reviews) return;
    
    // Get values (try both field structures)
    const category = reviews.category_verified || reviews.category_subcategory?.final_value;
    const type = reviews.type_verified || reviews.product_type?.final_value;
    const style = reviews.style_verified || reviews.product_style?.final_value;
    
    if (category) {
      categoriesUsed.add(category);
      if (!categoryNames.includes(category)) {
        nonExistentCategories.add(category);
      }
    }
    
    if (type) {
      typesUsed.add(type);
      if (!typeNames.includes(type)) {
        nonExistentTypes.add(type);
      }
    }
    
    if (style) {
      stylesUsed.add(style);
      if (!styleNames.includes(style)) {
        nonExistentStyles.add(style);
      }
    }
  });
  
  const nonExistentRate = categoriesUsed.size > 0 
    ? (nonExistentCategories.size / categoriesUsed.size * 100).toFixed(1) 
    : 0;
  
  console.log(`  Total jobs: ${jobs.length}`);
  console.log(`  Unique categories: ${categoriesUsed.size}`);
  console.log(`  Non-existent categories: ${nonExistentCategories.size} (${nonExistentRate}%)`);
  console.log(`  Unique types: ${typesUsed.size}`);
  console.log(`  Non-existent types: ${nonExistentTypes.size}`);
  console.log(`  Unique styles: ${stylesUsed.size}`);
  console.log(`  Non-existent styles: ${nonExistentStyles.size}`);
  console.log('');
  
  return {
    total: jobs.length,
    uniqueCategories: categoriesUsed.size,
    uniqueTypes: typesUsed.size,
    uniqueStyles: stylesUsed.size,
    nonExistentCount: nonExistentCategories.size,
    nonExistentRate: parseFloat(nonExistentRate),
    nonExistentList: [...nonExistentCategories]
  };
}

function countCategory(jobs, categoryName) {
  return jobs.filter(j => {
    const cat = j.result?.Field_AI_Reviews?.category_verified || 
                j.result?.Field_AI_Reviews?.category_subcategory?.final_value;
    return cat === categoryName;
  }).length;
}

function pad(value, width) {
  const str = String(value);
  return str + ' '.repeat(Math.max(0, width - str.length));
}

compareOldVsNew();
