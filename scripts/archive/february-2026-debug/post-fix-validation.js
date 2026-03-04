#!/usr/bin/env node
/**
 * Post-Fix Validation - Verify files are synchronized
 * Confirms cleanup was successful
 */

const categories = require('../src/config/salesforce-picklists/categories.json');
const filterAttrs = require('../src/config/salesforce-picklists/category-filter-attributes.json');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║       POST-FIX VALIDATION - VERIFY SYNC                       ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const categoryNames = categories.map(c => c.category_name).sort();
const filterCats = Object.keys(filterAttrs.categories).sort();

console.log('📊 FILE COUNTS:');
console.log('  categories.json:', categoryNames.length, 'categories');
console.log('  category-filter-attributes.json:', filterCats.length, 'categories');
console.log('  Difference:', Math.abs(categoryNames.length - filterCats.length));
console.log('');

// Check if counts match
if (categoryNames.length === filterCats.length) {
  console.log('✅ COUNTS MATCH:', categoryNames.length, 'categories in both files');
  console.log('');
} else {
  console.log('❌ COUNTS DO NOT MATCH!');
  console.log('   Expected:', filterCats.length);
  console.log('   Actual:', categoryNames.length);
  console.log('');
}

// Check if all categories match
const inCategoriesNotFilter = categoryNames.filter(c => !filterCats.includes(c));
const inFilterNotCategories = filterCats.filter(f => !categoryNames.includes(f));

console.log('🔍 CATEGORY MATCHING:\n');

if (inCategoriesNotFilter.length === 0 && inFilterNotCategories.length === 0) {
  console.log('✅ ALL CATEGORIES MATCH - FILES ARE SYNCHRONIZED!');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎉 SUCCESS: Both files have', categoryNames.length, 'categories');
  console.log('═══════════════════════════════════════════════════════════════');
  process.exit(0);
} else {
  console.log('❌ FILES STILL OUT OF SYNC!\n');
  
  if (inCategoriesNotFilter.length > 0) {
    console.log('⚠️  In categories.json but NOT in category-filter-attributes.json:', inCategoriesNotFilter.length);
    inCategoriesNotFilter.forEach(c => console.log('   -', c));
    console.log('');
  }
  
  if (inFilterNotCategories.length > 0) {
    console.log('⚠️  In category-filter-attributes.json but NOT in categories.json:', inFilterNotCategories.length);
    inFilterNotCategories.forEach(c => console.log('   -', c));
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('❌ SYNC FAILED - Manual investigation required');
  console.log('═══════════════════════════════════════════════════════════════');
  process.exit(1);
}
