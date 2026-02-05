#!/usr/bin/env node

/**
 * Analyze Fuzzy Duplicates in Attributes List
 * Finds variations like:
 * - "Ice maker" vs "Ice_maker"
 * - "Base Style" vs "base style"
 * - Punctuation differences
 * - Spacing differences
 */

const fs = require('fs');
const path = require('path');

const attributesPath = path.join(__dirname, '../src/config/salesforce-picklists/attributes.json');

// Read the file as text first to handle the broken JSON
const fileContent = fs.readFileSync(attributesPath, 'utf8');

let ourList = [];
let sfList = [];

// Find the split point where "][" occurs
const splitIndex = fileContent.indexOf('][');

if (splitIndex === -1) {
  // File is normal JSON, not split
  try {
    const data = JSON.parse(fileContent);
    ourList = data;
    console.log(`✅ Loaded single list: ${ourList.length} items`);
  } catch (e) {
    console.log('❌ Failed to parse file:', e.message);
    process.exit(1);
  }
} else {
  // File has two arrays concatenated with "][" 
  const firstPart = fileContent.substring(0, splitIndex + 1); // Include the ]
  const secondPart = fileContent.substring(splitIndex + 1);    // Include the [
  
  try {
    ourList = JSON.parse(firstPart);
    console.log(`✅ Loaded our list: ${ourList.length} items`);
  } catch (e) {
    console.log('❌ Failed to parse our list:', e.message);
    console.log('First 100 chars of first part:', firstPart.substring(0, 100));
    console.log('Last 100 chars of first part:', firstPart.substring(firstPart.length - 100));
  }
  
  try {
    sfList = JSON.parse(secondPart);
    console.log(`✅ Loaded SF list: ${sfList.length} items`);
  } catch (e) {
    console.log('❌ Failed to parse SF list:', e.message);
    console.log('First 100 chars of second part:', secondPart.substring(0, 100));
    console.log('Last 100 chars of second part:', secondPart.substring(secondPart.length - 100));
  }
}

// Combine both lists for analysis
const allAttributes = [...ourList, ...sfList];
console.log(`\n📊 Total attributes to analyze: ${allAttributes.length}\n`);

// Normalization functions for fuzzy matching
function normalize(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[_\-\/]/g, ' ')  // Replace underscores, hyphens, slashes with spaces
    .replace(/\s+/g, ' ')       // Collapse multiple spaces
    .replace(/[^\w\s]/g, '')    // Remove punctuation except word chars and spaces
    .trim();
}

function normalizeStrict(str) {
  return normalize(str).replace(/\s+/g, ''); // Also remove all spaces
}

// Group attributes by normalized name
const normalizedMap = new Map();
const strictMap = new Map();

allAttributes.forEach((attr, index) => {
  const name = attr.attribute_name;
  const id = attr.attribute_id;
  const source = index < ourList.length ? 'OUR' : 'SF';
  
  const normalized = normalize(name);
  const strict = normalizeStrict(name);
  
  // Normalized grouping (spaces matter)
  if (!normalizedMap.has(normalized)) {
    normalizedMap.set(normalized, []);
  }
  normalizedMap.get(normalized).push({ name, id, source, index });
  
  // Strict grouping (no spaces)
  if (!strictMap.has(strict)) {
    strictMap.set(strict, []);
  }
  strictMap.get(strict).push({ name, id, source, index });
});

// Find duplicates
const fuzzyDuplicates = [];
const exactDuplicates = [];

// Check normalized duplicates
for (const [normalized, items] of normalizedMap.entries()) {
  if (items.length > 1) {
    // Check if they're exact matches or fuzzy
    const uniqueNames = new Set(items.map(i => i.name));
    
    if (uniqueNames.size === 1) {
      // Exact duplicates (same name, possibly different IDs)
      exactDuplicates.push({ normalized, items });
    } else {
      // Fuzzy duplicates (different formatting of same attribute)
      fuzzyDuplicates.push({ normalized, items });
    }
  }
}

// Also check strict duplicates (ignoring all spaces)
const strictDuplicates = [];
for (const [strict, items] of strictMap.entries()) {
  if (items.length > 1) {
    const uniqueNames = new Set(items.map(i => i.name));
    if (uniqueNames.size > 1) {
      // Only if they have different names but same when spaces removed
      const alreadyCounted = fuzzyDuplicates.some(fd => 
        fd.items.some(item => items.some(i => i.name === item.name && i.id === item.id))
      );
      if (!alreadyCounted) {
        strictDuplicates.push({ strict, items });
      }
    }
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('🔍 FUZZY DUPLICATE ANALYSIS RESULTS');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`📊 SUMMARY:`);
console.log(`   Total attributes analyzed: ${allAttributes.length}`);
console.log(`   Exact duplicates found: ${exactDuplicates.length} groups`);
console.log(`   Fuzzy duplicates found: ${fuzzyDuplicates.length} groups`);
console.log(`   Strict duplicates found: ${strictDuplicates.length} groups\n`);

// Display exact duplicates
if (exactDuplicates.length > 0) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📌 EXACT DUPLICATES (Same name, different IDs or sources)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  exactDuplicates.forEach((group, idx) => {
    console.log(`${idx + 1}. "${group.items[0].name}" (${group.items.length} occurrences)`);
    group.items.forEach(item => {
      console.log(`   ${item.source === 'OUR' ? '🔵 OUR ' : '🟢 SF  '} ID: ${item.id || 'null'}`);
    });
    console.log('');
  });
}

// Display fuzzy duplicates
if (fuzzyDuplicates.length > 0) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎯 FUZZY DUPLICATES (Different formatting, same concept)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  fuzzyDuplicates.forEach((group, idx) => {
    console.log(`${idx + 1}. Normalized: "${group.normalized}" (${group.items.length} variations)`);
    group.items.forEach(item => {
      const diff = item.name !== group.normalized ? '⚠️ ' : '   ';
      console.log(`   ${diff}${item.source === 'OUR' ? '🔵 OUR' : '🟢 SF '} "${item.name}" (ID: ${item.id || 'null'})`);
    });
    console.log('');
  });
}

// Display strict duplicates
if (strictDuplicates.length > 0) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('⚡ STRICT DUPLICATES (Same when all spaces removed)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  strictDuplicates.forEach((group, idx) => {
    console.log(`${idx + 1}. Strict normalized: "${group.strict}" (${group.items.length} variations)`);
    group.items.forEach(item => {
      console.log(`   ${item.source === 'OUR' ? '🔵 OUR' : '🟢 SF '} "${item.name}" (ID: ${item.id || 'null'})`);
    });
    console.log('');
  });
}

// Create detailed report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalAttributes: allAttributes.length,
    ourListCount: ourList.length,
    sfListCount: sfList.length,
    exactDuplicateGroups: exactDuplicates.length,
    fuzzyDuplicateGroups: fuzzyDuplicates.length,
    strictDuplicateGroups: strictDuplicates.length,
    totalDuplicateItems: exactDuplicates.reduce((sum, g) => sum + g.items.length, 0) +
                         fuzzyDuplicates.reduce((sum, g) => sum + g.items.length, 0) +
                         strictDuplicates.reduce((sum, g) => sum + g.items.length, 0)
  },
  exactDuplicates: exactDuplicates.map(g => ({
    name: g.items[0].name,
    normalized: g.normalized,
    occurrences: g.items
  })),
  fuzzyDuplicates: fuzzyDuplicates.map(g => ({
    normalized: g.normalized,
    variations: g.items
  })),
  strictDuplicates: strictDuplicates.map(g => ({
    strictNormalized: g.strict,
    variations: g.items
  }))
};

const reportPath = path.join(__dirname, '../audit-results/fuzzy-duplicate-analysis.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log('═══════════════════════════════════════════════════════════════');
console.log(`📄 Detailed report saved to: audit-results/fuzzy-duplicate-analysis.json`);
console.log('═══════════════════════════════════════════════════════════════\n');

// Recommendations
console.log('💡 RECOMMENDATIONS:\n');
if (exactDuplicates.length > 0) {
  console.log(`   1. Exact duplicates: ${exactDuplicates.length} groups need ID reconciliation`);
}
if (fuzzyDuplicates.length > 0) {
  console.log(`   2. Fuzzy duplicates: ${fuzzyDuplicates.length} groups need name standardization`);
  console.log('      → Choose one canonical format (e.g., spaces vs underscores)');
}
if (strictDuplicates.length > 0) {
  console.log(`   3. Strict duplicates: ${strictDuplicates.length} groups need review`);
  console.log('      → May be legitimate variations or should be merged');
}
console.log('');
