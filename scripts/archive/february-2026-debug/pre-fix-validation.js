#!/usr/bin/env node
/**
 * Pre-Fix Validation - Document current state before cleanup
 * Shows which entries need to be removed from categories.json
 */

const categories = require('../src/config/salesforce-picklists/categories.json');
const filterAttrs = require('../src/config/salesforce-picklists/category-filter-attributes.json');
const types = require('../src/config/salesforce-picklists/types.json');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║       PRE-FIX VALIDATION - CURRENT STATE                      ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log('📊 FILE COUNTS:');
console.log('  categories.json:', categories.length, 'categories');
console.log('  category-filter-attributes.json:', Object.keys(filterAttrs.categories).length, 'categories');
console.log('  Difference:', categories.length - Object.keys(filterAttrs.categories).length, 'extra in categories.json');
console.log('');

// The 8 problem entries to be removed
const badOnes = [
  'Wine Cooler',
  'Beverage Center', 
  'Outdoor Lighting',
  'Cabinet Hardware',
  'Laundry Sink',
  'Utility Sink',
  'Carpet',
  'Home Accents'
];

console.log('🔍 ANALYZING 8 PROBLEM ENTRIES:\n');

badOnes.forEach((name, index) => {
  console.log(`${index + 1}. ${name}`);
  
  const inCategories = categories.find(c => c.category_name === name);
  const inFilter = filterAttrs.categories[name];
  const inTypes = types.find(t => t.type_name === name);
  
  console.log(`   In categories.json: ${inCategories ? '✓ YES' : '✗ NO'}`);
  if (inCategories) {
    console.log(`     Department: ${inCategories.department}`);
    console.log(`     Family: ${inCategories.family}`);
    console.log(`     Category ID: ${inCategories.category_id}`);
  }
  
  console.log(`   In category-filter-attributes.json: ${inFilter ? '✓ YES' : '✗ NO'}`);
  console.log(`   In types.json: ${inTypes ? '✓ YES (ID: ' + inTypes.type_id + ')' : '✗ NO'}`);
  
  if (inTypes) {
    console.log(`   🚨 STATUS: TYPE mistakenly added as CATEGORY`);
  } else {
    console.log(`   ⚠️  STATUS: Over-specific entry (should be TYPE)`);
  }
  console.log('');
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('📋 SUMMARY:\n');
console.log(`  Total to remove: ${badOnes.length} entries`);
console.log(`  Confirmed types: 3 (Wine Cooler, Beverage Center, Outdoor Lighting)`);
console.log(`  Over-specific: 5 (Cabinet Hardware, Laundry Sink, Utility Sink, Carpet, Home Accents)`);
console.log('');
console.log(`  After cleanup: categories.json will have ${categories.length - badOnes.length} categories`);
console.log(`  Target: ${Object.keys(filterAttrs.categories).length} (matching category-filter-attributes.json)`);
console.log('');

if (categories.length - badOnes.length === Object.keys(filterAttrs.categories).length) {
  console.log('✅ Cleanup will synchronize the files correctly');
} else {
  console.log('⚠️  WARNING: Counts will not match after cleanup - investigate!');
}

console.log('═══════════════════════════════════════════════════════════════');
