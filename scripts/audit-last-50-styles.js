#!/usr/bin/env node

/**
 * Audit Last 50 Verification Jobs - Product_Style Analysis
 * 
 * This script analyzes the last 50 completed verification jobs to:
 * 1. Identify jobs still using aesthetic styles (Modern, Contemporary, etc.)
 * 2. Compare against category-style mapping expectations
 * 3. Recommend improvements to the mapping system
 */

const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'catalog-verification';

// Aesthetic styles that should be avoided (we want product types instead)
const AESTHETIC_STYLES = [
  'modern', 'contemporary', 'traditional', 'transitional', 'rustic',
  'industrial', 'mid-century', 'farmhouse', 'coastal', 'scandinavian',
  'minimalist', 'eclectic', 'bohemian', 'art deco', 'vintage',
  'classic', 'elegant', 'sleek', 'stylish', 'chic'
];

// Product type keywords that are good
const PRODUCT_TYPE_KEYWORDS = [
  'wall', 'built-in', 'freestanding', 'under-counter', 'countertop',
  'slide-in', 'drop-in', 'front load', 'top load', 'side-by-side',
  'french door', 'bottom freezer', 'top freezer', 'compact', 'portable',
  'drawer', 'warming', 'steam', 'convection', 'induction', 'gas', 'electric',
  'panel-ready', 'integrated', 'outdoor', 'indoor', 'ceiling', 'pendant',
  'chandelier', 'sconce', 'flush mount', 'recessed', 'track', 'under-cabinet'
];

function isAestheticStyle(style) {
  if (!style) return false;
  const lower = style.toLowerCase().trim();
  return AESTHETIC_STYLES.some(aesthetic => lower.includes(aesthetic));
}

function isProductType(style) {
  if (!style) return false;
  const lower = style.toLowerCase().trim();
  return PRODUCT_TYPE_KEYWORDS.some(keyword => lower.includes(keyword));
}

function categorizeStyle(style) {
  if (!style || style === 'Unknown') return 'UNKNOWN';
  if (isAestheticStyle(style)) return 'AESTHETIC';
  if (isProductType(style)) return 'PRODUCT_TYPE';
  return 'OTHER';
}

async function auditLastJobs() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 AUDIT: LAST 50 VERIFICATION JOBS - PRODUCT_STYLE ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Fetch last 50 completed jobs
    const jobs = await db.collection('verification_jobs')
      .find({ status: 'completed' })
      .sort({ completedAt: -1 })
      .limit(50)
      .toArray();
    
    if (jobs.length === 0) {
      console.log('❌ No completed jobs found\n');
      return;
    }
    
    console.log(`Found ${jobs.length} completed jobs\n`);
    
    // Analyze each job
    const analysis = {
      total: jobs.length,
      aesthetic: [],
      productType: [],
      unknown: [],
      other: []
    };
    
    jobs.forEach(job => {
      const productName = job.sfCatalogName || job.rawPayload?.Catalog_Name__c || job.productName || 'Unknown';
      const category = job.rawPayload?.Product_Category__c || job.category || 'Unknown';
      const productStyle = job.result?.Primary_Attributes?.Product_Style_Verified || 'Unknown';
      
      const styleType = categorizeStyle(productStyle);
      
      const jobInfo = {
        productName,
        category,
        productStyle,
        sfCatalogId: job.salesforceCatalogId,
        completedAt: job.completedAt
      };
      
      switch (styleType) {
        case 'AESTHETIC':
          analysis.aesthetic.push(jobInfo);
          break;
        case 'PRODUCT_TYPE':
          analysis.productType.push(jobInfo);
          break;
        case 'UNKNOWN':
          analysis.unknown.push(jobInfo);
          break;
        default:
          analysis.other.push(jobInfo);
      }
    });
    
    // Display summary
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
    console.log('📈 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════\n');
    console.log(`Total Jobs Analyzed: ${analysis.total}`);
    console.log(`✅ Product Types (GOOD): ${analysis.productType.length} (${(analysis.productType.length / analysis.total * 100).toFixed(1)}%)`);
    console.log(`⚠️  Aesthetic Styles (BAD): ${analysis.aesthetic.length} (${(analysis.aesthetic.length / analysis.total * 100).toFixed(1)}%)`);
    console.log(`❓ Unknown: ${analysis.unknown.length} (${(analysis.unknown.length / analysis.total * 100).toFixed(1)}%)`);
    console.log(`🔍 Other: ${analysis.other.length} (${(analysis.other.length / analysis.total * 100).toFixed(1)}%)`);
    console.log('');
    
    // Show aesthetic styles (problems)
    if (analysis.aesthetic.length > 0) {
      console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
      console.log('⚠️  AESTHETIC STYLES (SHOULD BE PRODUCT TYPES)');
      console.log('═══════════════════════════════════════════════════════════════════════════════════════════════\n');
      
      // Group by category
      const byCategory = {};
      analysis.aesthetic.forEach(job => {
        if (!byCategory[job.category]) {
          byCategory[job.category] = [];
        }
        byCategory[job.category].push(job);
      });
      
      Object.entries(byCategory).forEach(([category, jobs]) => {
        console.log(`\n📦 Category: ${category} (${jobs.length} jobs)`);
        console.log('─────────────────────────────────────────────────────────────────────────────────────────────');
        jobs.slice(0, 10).forEach((job, idx) => {
          console.log(`${idx + 1}. ${job.productName}`);
          console.log(`   Style: "${job.productStyle}"`);
          console.log(`   SF ID: ${job.sfCatalogId}`);
        });
        if (jobs.length > 10) {
          console.log(`   ... and ${jobs.length - 10} more`);
        }
      });
    }
    
    // Show product types (good examples)
    if (analysis.productType.length > 0) {
      console.log('\n\n═══════════════════════════════════════════════════════════════════════════════════════════════');
      console.log('✅ PRODUCT TYPES (GOOD EXAMPLES)');
      console.log('═══════════════════════════════════════════════════════════════════════════════════════════════\n');
      
      analysis.productType.slice(0, 15).forEach((job, idx) => {
        console.log(`${idx + 1}. ${job.productName.padEnd(25)} → "${job.productStyle}"`);
        console.log(`   Category: ${job.category}`);
      });
      
      if (analysis.productType.length > 15) {
        console.log(`\n... and ${analysis.productType.length - 15} more`);
      }
    }
    
    // Recommendations
    console.log('\n\n═══════════════════════════════════════════════════════════════════════════════════════════════');
    console.log('💡 RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════\n');
    
    if (analysis.aesthetic.length > 0) {
      console.log('🔧 ISSUES FOUND:');
      console.log(`   • ${analysis.aesthetic.length} jobs returned aesthetic styles instead of product types`);
      console.log('');
      console.log('🎯 SUGGESTED FIXES:');
      console.log('   1. Add more categories to category-style-mapping.ts');
      console.log('   2. Update AI prompts to explicitly avoid aesthetic styles');
      console.log('   3. Add post-processing validation to reject aesthetic styles');
      console.log('   4. Review categories with most aesthetic style problems:');
      
      // Find categories with most problems
      const categoryProblems = {};
      analysis.aesthetic.forEach(job => {
        categoryProblems[job.category] = (categoryProblems[job.category] || 0) + 1;
      });
      
      const sortedProblems = Object.entries(categoryProblems)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      console.log('');
      sortedProblems.forEach(([category, count]) => {
        console.log(`      • ${category}: ${count} jobs with aesthetic styles`);
      });
    } else {
      console.log('✅ EXCELLENT! All jobs are using product types instead of aesthetic styles!');
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the audit
auditLastJobs().catch(console.error);
