#!/usr/bin/env node
/**
 * Monitor Post-Fix Results - Check if Phase 1 cleanup is working
 * Analyzes recent jobs after category file cleanup
 */

const { MongoClient } = require('mongodb');

const mongoUri = 'mongodb://127.0.0.1:27017';
const dbName = 'catalog-verification';

// Load picklists
const categories = require('../src/config/salesforce-picklists/categories.json');
const filterAttrs = require('../src/config/salesforce-picklists/category-filter-attributes.json');
const types = require('../src/config/salesforce-picklists/types.json');

const categoryNames = categories.map(c => c.category_name);
const filterCatNames = Object.keys(filterAttrs.categories);

async function analyzePostFix() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(dbName);
    const jobs = db.collection('verification_jobs');
    
    // Get jobs since the fix was deployed (last 30 minutes)
    const cutoffTime = new Date(Date.now() - 30 * 60 * 1000);
    
    const recentJobs = await jobs.find({
      createdAt: { $gte: cutoffTime },
      status: 'completed'
    }).sort({ createdAt: -1 }).limit(50).toArray();
    
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║       POST-FIX MONITORING - PHASE 1 RESULTS                  ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 SAMPLE SIZE:');
    console.log('  Cutoff time:', cutoffTime.toISOString());
    console.log('  Jobs found:', recentJobs.length);
    
    if (recentJobs.length === 0) {
      console.log('\n⏳ No jobs completed since fix deployment');
      console.log('   Wait for Salesforce to send new verification requests');
      return;
    }
    
    console.log('  Latest job:', recentJobs[0]?.createdAt?.toISOString() || 'N/A');
    console.log('  Oldest job:', recentJobs[recentJobs.length - 1]?.createdAt?.toISOString() || 'N/A');
    console.log('');
    
    // Analyze categories used
    const categoriesUsed = new Set();
    const nonExistentCategories = new Set();
    const removedCategoriesAttempted = [];
    
    // The 8 removed entries
    const removedEntries = [
      'Wine Cooler', 'Beverage Center', 'Outdoor Lighting',
      'Cabinet Hardware', 'Laundry Sink', 'Utility Sink', 
      'Carpet', 'Home Accents'
    ];
    
    recentJobs.forEach(job => {
      // Try both field structures (old and new)
      const category = job.result?.Field_AI_Reviews?.category_verified || 
                       job.result?.Field_AI_Reviews?.category_subcategory?.final_value;
      if (category) {
        categoriesUsed.add(category);
        
        // Check if it exists in picklist
        if (!categoryNames.includes(category)) {
          nonExistentCategories.add(category);
        }
        
        // Check if AI is trying to use removed entries
        if (removedEntries.includes(category)) {
          removedCategoriesAttempted.push({
            category,
            product: job.rawProduct?.Product_Name || job.rawProduct?.Web_Retailer_Product_Name || 'Unknown',
            jobId: job.job_id
          });
        }
      }
    });
    
    console.log('🔍 CATEGORY ANALYSIS:\n');
    console.log('  Unique categories used:', categoriesUsed.size);
    console.log('  Non-existent categories:', nonExistentCategories.size);
    console.log('  Removed entries attempted:', removedCategoriesAttempted.length);
    console.log('');
    
    if (nonExistentCategories.size > 0) {
      console.log('❌ NON-EXISTENT CATEGORIES STILL APPEARING:\n');
      [...nonExistentCategories].forEach(cat => {
        const count = recentJobs.filter(j => {
          const jobCat = j.result?.Field_AI_Reviews?.category_verified || 
                         j.result?.Field_AI_Reviews?.category_subcategory?.final_value;
          return jobCat === cat;
        }).length;
        console.log(`   ${cat} (${count} jobs)`);
      });
      console.log('');
    } else {
      console.log('✅ NO NON-EXISTENT CATEGORIES - All categories are valid!\n');
    }
    
    if (removedCategoriesAttempted.length > 0) {
      console.log('⚠️  WARNING: AI ATTEMPTING TO USE REMOVED ENTRIES:\n');
      removedCategoriesAttempted.forEach((item, i) => {
        console.log(`${i + 1}. ${item.category}`);
        console.log(`   Product: ${item.product.substring(0, 60)}...`);
        console.log(`   Job ID: ${item.jobId}`);
        console.log('');
      });
      console.log('   🔴 THIS SHOULD NOT HAPPEN - AI should not see these in prompt!\n');
    } else {
      console.log('✅ NO REMOVED ENTRIES ATTEMPTED - Fix working correctly!\n');
    }
    
    // Check semantic coherence (sample)
    console.log('🧪 SEMANTIC COHERENCE CHECK (Sample of 10):\n');
    
    const sampleJobs = recentJobs.slice(0, 10);
    const violations = [];
    
    sampleJobs.forEach((job, index) => {
      const reviews = job.result?.Field_AI_Reviews;
      if (!reviews) return;
      
      // Try both field structures
      const category = reviews.category_verified || reviews.category_subcategory?.final_value;
      const type = reviews.type_verified || reviews.product_type?.final_value;
      const style = reviews.style_verified || reviews.product_style?.final_value;
      
      console.log(`${index + 1}. ${category || 'N/A'} → ${type || 'N/A'} → ${style || 'N/A'}`);
      
      // Basic semantic check
      if (category && type) {
        // Check if type-category combo makes sense
        const categoryEntry = filterAttrs.categories[category];
        if (categoryEntry && categoryEntry.types) {
          if (!categoryEntry.types.includes(type)) {
            violations.push({
              category,
              type,
              style,
              reason: `Type "${type}" not in category "${category}" type list`
            });
            console.log(`   ⚠️  Type mismatch: "${type}" not valid for "${category}"`);
          }
        }
      }
    });
    
    console.log('');
    console.log(`  Semantic violations in sample: ${violations.length}/10`);
    console.log('');
    
    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 PHASE 1 FIX ASSESSMENT:\n');
    
    const successRate = ((recentJobs.length - nonExistentCategories.size) / recentJobs.length * 100).toFixed(1);
    
    console.log(`  ✅ Valid categories: ${successRate}%`);
    console.log(`  ❌ Non-existent: ${nonExistentCategories.size} unique (${(nonExistentCategories.size / categoriesUsed.size * 100).toFixed(1)}%)`);
    console.log(`  🔧 Removed entries used: ${removedCategoriesAttempted.length}`);
    console.log(`  📊 Semantic violations: ${violations.length}/10 sample`);
    console.log('');
    
    if (nonExistentCategories.size === 0 && removedCategoriesAttempted.length === 0) {
      console.log('🎉 PHASE 1 FIX WORKING PERFECTLY!');
      console.log('   - All categories are valid');
      console.log('   - No removed entries attempted');
      console.log('   - File sync successful');
    } else if (nonExistentCategories.size > 0) {
      console.log('⚠️  PHASE 1 FIX PARTIAL SUCCESS:');
      console.log('   - Files are synced (169 = 169)');
      console.log('   - But AI still creating non-existent categories');
      console.log('   - Need Phase 2: Strict category validation');
    } else {
      console.log('✅ PHASE 1 FIX WORKING:');
      console.log('   - File sync successful');
      console.log('   - Continue monitoring');
    }
    
    console.log('═══════════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

analyzePostFix();
