#!/usr/bin/env node
/**
 * Clean Categories File - Remove 8 type-level entries
 * Syncs categories.json with category-filter-attributes.json
 */

const fs = require('fs');
const path = require('path');

const categoriesPath = path.join(__dirname, '../src/config/salesforce-picklists/categories.json');
const categories = require(categoriesPath);

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║       CLEANING CATEGORIES.JSON                                ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Create backup
const backupPath = categoriesPath + '.backup-' + new Date().toISOString().split('T')[0];
fs.writeFileSync(backupPath, JSON.stringify(categories, null, 2));
console.log('✅ Backup created:', backupPath);
console.log('');

// Entries to remove
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

console.log('🗑️  REMOVING ENTRIES:\n');

badOnes.forEach((name, index) => {
  const found = categories.find(c => c.category_name === name);
  if (found) {
    console.log(`${index + 1}. ${name}`);
    console.log(`   Department: ${found.department}`);
    console.log(`   Category ID: ${found.category_id}`);
  } else {
    console.log(`${index + 1}. ${name} - NOT FOUND (already removed?)`);
  }
});

console.log('');

// Filter out bad entries
const cleaned = categories.filter(c => !badOnes.includes(c.category_name));

console.log('📊 RESULTS:');
console.log('  BEFORE:', categories.length, 'categories');
console.log('  AFTER:', cleaned.length, 'categories');
console.log('  REMOVED:', categories.length - cleaned.length, 'entries');
console.log('');

// Write cleaned file
fs.writeFileSync(categoriesPath, JSON.stringify(cleaned, null, 2));

console.log('✅ categories.json cleaned and saved');
console.log('✅ File location:', categoriesPath);
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('⚠️  IMPORTANT: Run post-fix-validation.js to verify sync');
console.log('═══════════════════════════════════════════════════════════════');
