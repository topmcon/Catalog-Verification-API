#!/usr/bin/env node

/**
 * Attribute Catalog Analysis Script
 * 
 * Queries the attribute_catalog MongoDB collection and generates:
 * 1. Category/Type fill rate report for current Top 15 attributes
 * 2. Demotion candidates (low fill rate top 15 attributes)
 * 3. Promotion candidates (high fill rate non-top-15 attributes)
 * 4. Source availability breakdown
 * 5. Newly discovered attributes not yet categorized
 * 
 * Usage:
 *   node scripts/analyze-attribute-catalog.js [--category "Toilet"] [--type "Two-Piece"] [--threshold 0.2]
 */

const mongoose = require('mongoose');
const path = require('path');

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const filterCategory = getArg('--category');
const filterType = getArg('--type');
const demotionThreshold = parseFloat(getArg('--threshold') || '0.20'); // 20% fill rate = demotion candidate
const promotionThreshold = parseFloat(getArg('--promotion-threshold') || '0.70'); // 70% fill rate = promotion candidate
const minVerifications = parseInt(getArg('--min-verifications') || '10', 10);

async function main() {
  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';
  await mongoose.connect(mongoUri);
  console.log(`Connected to MongoDB: ${mongoUri}\n`);

  const db = mongoose.connection.db;
  const collection = db.collection('attributecatalogs');

  // Build query filter
  const filter = {};
  if (filterCategory) filter.category = filterCategory;
  if (filterType) filter.type = filterType;

  // Get all records
  const allRecords = await collection.find(filter).sort({ category: 1, type: 1, fillRate: -1 }).toArray();

  if (allRecords.length === 0) {
    console.log('No attribute catalog data found. Run some verifications first to populate the catalog.');
    await mongoose.disconnect();
    return;
  }

  // Group by category/type
  const groups = {};
  for (const rec of allRecords) {
    const key = `${rec.category}|${rec.type || '(no type)'}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(rec);
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   ATTRIBUTE CATALOG ANALYSIS REPORT');
  console.log(`   Generated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Summary stats
  const totalRecords = allRecords.length;
  const uniqueCategories = new Set(allRecords.map(r => r.category)).size;
  const uniqueCategoryTypes = Object.keys(groups).length;
  const maxVerifications = Math.max(...allRecords.map(r => r.totalVerifications));

  console.log(`📊 Summary: ${totalRecords} attributes tracked across ${uniqueCategories} categories, ${uniqueCategoryTypes} category/type combos`);
  console.log(`   Max verifications for any combo: ${maxVerifications}`);
  console.log(`   Demotion threshold: <${(demotionThreshold * 100).toFixed(0)}% fill rate | Promotion threshold: >${(promotionThreshold * 100).toFixed(0)}% fill rate`);
  console.log(`   Minimum verifications to analyze: ${minVerifications}\n`);

  let totalDemotionCandidates = 0;
  let totalPromotionCandidates = 0;

  for (const [groupKey, records] of Object.entries(groups)) {
    const [category, type] = groupKey.split('|');
    const top15Records = records.filter(r => r.currentLocation === 'top15');
    const htmlRecords = records.filter(r => r.currentLocation === 'html' || r.currentLocation === 'discovered');
    const sampleVerifications = top15Records.length > 0 ? top15Records[0].totalVerifications : 0;

    if (sampleVerifications < minVerifications) continue;

    console.log('\n───────────────────────────────────────────────────────────────');
    console.log(`📁 ${category} / ${type}  (${sampleVerifications} verifications)`);
    console.log('───────────────────────────────────────────────────────────────');

    // --- TOP 15 FILL RATE TABLE ---
    if (top15Records.length > 0) {
      console.log('\n  🔝 Current Top 15 Attributes (Fill Rate):');
      console.log('  ' + '-'.repeat(75));
      console.log(`  ${'Attribute'.padEnd(35)} ${'Fill Rate'.padEnd(12)} ${'Found'.padEnd(8)} ${'Total'.padEnd(8)} Status`);
      console.log('  ' + '-'.repeat(75));

      const sortedTop15 = [...top15Records].sort((a, b) => b.fillRate - a.fillRate);
      for (const rec of sortedTop15) {
        const pct = (rec.fillRate * 100).toFixed(1) + '%';
        const status = rec.fillRate < demotionThreshold ? '🔴 DEMOTE?' 
                     : rec.fillRate < 0.5 ? '🟡 LOW' 
                     : '🟢 OK';
        if (rec.fillRate < demotionThreshold) totalDemotionCandidates++;
        console.log(`  ${rec.attributeName.substring(0, 34).padEnd(35)} ${pct.padEnd(12)} ${String(rec.foundCount).padEnd(8)} ${String(rec.totalVerifications).padEnd(8)} ${status}`);
      }
    }

    // --- DEMOTION CANDIDATES ---
    const demotionCandidates = top15Records.filter(r => r.fillRate < demotionThreshold && !r.isMetadata);
    if (demotionCandidates.length > 0) {
      console.log(`\n  ⚠️  DEMOTION CANDIDATES (< ${(demotionThreshold * 100).toFixed(0)}% fill rate):`);
      for (const rec of demotionCandidates) {
        const bestSource = getBestSource(rec.sources);
        console.log(`     → "${rec.attributeName}" — ${(rec.fillRate * 100).toFixed(1)}% fill rate`);
        console.log(`       Best source: ${bestSource.name} (${bestSource.found}/${bestSource.available})`);
        console.log(`       Recommendation: Move to HTML additional attributes`);
      }
    }

    // --- PROMOTION CANDIDATES ---
    const promotionCandidates = htmlRecords.filter(r => 
      r.fillRate >= promotionThreshold && 
      r.foundCount >= minVerifications && 
      !r.isMetadata
    ).sort((a, b) => b.fillRate - a.fillRate).slice(0, 10);

    if (promotionCandidates.length > 0) {
      console.log(`\n  🌟 PROMOTION CANDIDATES (> ${(promotionThreshold * 100).toFixed(0)}% fill rate, not metadata):`);
      console.log(`  ${'Attribute'.padEnd(35)} ${'Fill Rate'.padEnd(12)} ${'Found'.padEnd(8)} ${'Metadata'.padEnd(10)}`);
      console.log('  ' + '-'.repeat(65));
      for (const rec of promotionCandidates) {
        totalPromotionCandidates++;
        const pct = (rec.fillRate * 100).toFixed(1) + '%';
        console.log(`  ${rec.attributeName.substring(0, 34).padEnd(35)} ${pct.padEnd(12)} ${String(rec.foundCount).padEnd(8)} ${rec.isMetadata ? '⛔ Yes' : '✅ No'}`);
      }
    }

    // --- SOURCE AVAILABILITY ---
    if (top15Records.length > 0) {
      console.log('\n  📡 Source Availability (for Top 15):');
      const sources = ['ferguson', 'webRetailer', 'ai', 'specTable', 'nestedFerguson'];
      const sourceLabels = { ferguson: 'Ferguson Flat', webRetailer: 'Web Retailer', ai: 'AI', specTable: 'Spec Table', nestedFerguson: 'Ferguson Nested' };
      
      for (const src of sources) {
        const totalAvail = top15Records.reduce((sum, r) => sum + (r.sources?.[src]?.available || 0), 0);
        const totalFound = top15Records.reduce((sum, r) => sum + (r.sources?.[src]?.found || 0), 0);
        if (totalAvail > 0) {
          const rate = ((totalFound / totalAvail) * 100).toFixed(1);
          console.log(`     ${sourceLabels[src].padEnd(18)} ${totalFound}/${totalAvail} hits (${rate}%)`);
        }
      }
    }

    // --- METADATA ATTRIBUTES IN TOP 15 (shouldn't be there) ---
    const metadataInTop15 = top15Records.filter(r => r.isMetadata);
    if (metadataInTop15.length > 0) {
      console.log(`\n  ⛔ METADATA ATTRIBUTES IN TOP 15 (should be HTML only):`);
      for (const rec of metadataInTop15) {
        console.log(`     → "${rec.attributeName}" — Move to HTML attributes`);
      }
    }
  }

  // --- GLOBAL SUMMARY ---
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('   RECOMMENDATIONS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`   🔴 Demotion candidates: ${totalDemotionCandidates} attributes with <${(demotionThreshold * 100).toFixed(0)}% fill rate`);
  console.log(`   🌟 Promotion candidates: ${totalPromotionCandidates} attributes with >${(promotionThreshold * 100).toFixed(0)}% fill rate`);
  
  if (totalDemotionCandidates > 0) {
    console.log('\n   ACTION NEEDED: Review demotion candidates above.');
    console.log('   Low fill rate means the data rarely exists for this category/type.');
    console.log('   Move these to HTML additional attributes to make room for better top 15 picks.');
  }
  
  if (totalPromotionCandidates > 0) {
    console.log('\n   OPPORTUNITY: Review promotion candidates above.');
    console.log('   High fill rate + non-metadata means these attributes are commonly available');
    console.log('   and could replace low-performing top 15 attributes.');
  }

  console.log('\n   To adjust thresholds:');
  console.log('     --threshold 0.15       (15% demotion threshold)');
  console.log('     --promotion-threshold 0.80  (80% promotion threshold)');
  console.log('     --min-verifications 25  (need 25+ verifications to analyze)');
  console.log('     --category "Toilet"     (filter to specific category)');
  console.log('     --type "Two-Piece"      (filter to specific type)\n');

  await mongoose.disconnect();
}

function getBestSource(sources) {
  if (!sources) return { name: 'unknown', found: 0, available: 0 };
  const sourceLabels = { ferguson: 'Ferguson', webRetailer: 'Web Retailer', ai: 'AI', specTable: 'Spec Table', nestedFerguson: 'Nested Ferguson' };
  let best = { name: 'none', found: 0, available: 0 };
  for (const [key, data] of Object.entries(sources)) {
    if (data && data.found > best.found) {
      best = { name: sourceLabels[key] || key, found: data.found, available: data.available };
    }
  }
  return best;
}

main().catch(err => {
  console.error('Analysis failed:', err);
  process.exit(1);
});
