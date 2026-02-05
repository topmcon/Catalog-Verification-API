#!/usr/bin/env node

/**
 * Deduplicate Attributes - Remove Fuzzy Duplicates
 * Strategy: Keep Title Case version, remove underscore versions
 */

const fs = require('fs');
const path = require('path');

const attributesPath = path.join(__dirname, '../src/config/salesforce-picklists/attributes.json');

// Load attributes
const attributes = JSON.parse(fs.readFileSync(attributesPath, 'utf8'));

console.log(`📊 Starting with: ${attributes.length} attributes\n`);

// Normalization function
function normalize(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[_\-\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

// Determine which format is "better" (prefer Title Case over underscores)
function preferredFormat(name1, name2) {
  const hasUnderscore1 = name1.includes('_');
  const hasUnderscore2 = name2.includes('_');
  
  // If one has underscore and other doesn't, prefer the one without
  if (hasUnderscore1 && !hasUnderscore2) return name2;
  if (!hasUnderscore1 && hasUnderscore2) return name1;
  
  // If both or neither have underscores, prefer Title Case (has uppercase letters)
  const hasUpperCase1 = /[A-Z]/.test(name1);
  const hasUpperCase2 = /[A-Z]/.test(name2);
  
  if (hasUpperCase1 && !hasUpperCase2) return name1;
  if (!hasUpperCase1 && hasUpperCase2) return name2;
  
  // If all else equal, prefer the one with a non-null ID
  return name1; // Default to first
}

// Group by normalized name
const groupedByNormalized = new Map();
const removedAttributes = [];

attributes.forEach((attr, index) => {
  const normalizedName = normalize(attr.attribute_name);
  
  if (!groupedByNormalized.has(normalizedName)) {
    groupedByNormalized.set(normalizedName, []);
  }
  
  groupedByNormalized.get(normalizedName).push({
    ...attr,
    originalIndex: index
  });
});

// Build deduplicated list
const deduplicatedList = [];
let duplicatesRemoved = 0;

for (const [normalizedName, items] of groupedByNormalized.entries()) {
  if (items.length === 1) {
    // No duplicate
    deduplicatedList.push(items[0]);
  } else {
    // Has duplicates - choose the best format
    console.log(`🔍 Found ${items.length} variations of "${normalizedName}":`);
    
    // Sort by preference
    items.sort((a, b) => {
      const preferred = preferredFormat(a.attribute_name, b.attribute_name);
      if (preferred === a.attribute_name) return -1;
      if (preferred === b.attribute_name) return 1;
      
      // Prefer non-null IDs
      if (a.attribute_id && !b.attribute_id) return -1;
      if (!a.attribute_id && b.attribute_id) return 1;
      
      return 0;
    });
    
    const kept = items[0];
    const removed = items.slice(1);
    
    console.log(`   ✅ KEEPING: "${kept.attribute_name}" (ID: ${kept.attribute_id || 'null'})`);
    removed.forEach(r => {
      console.log(`   ❌ REMOVING: "${r.attribute_name}" (ID: ${r.attribute_id || 'null'})`);
      removedAttributes.push({
        removed: r.attribute_name,
        removedId: r.attribute_id,
        keptVersion: kept.attribute_name,
        keptId: kept.attribute_id,
        normalizedName
      });
    });
    
    deduplicatedList.push(kept);  
    duplicatesRemoved += removed.length;
    console.log('');
  }
}

// Sort alphabetically by attribute_name
deduplicatedList.sort((a, b) => 
  a.attribute_name.localeCompare(b.attribute_name)
);

// Remove the originalIndex field before saving
const finalList = deduplicatedList.map(({ originalIndex, ...rest }) => rest);

console.log('═══════════════════════════════════════════════════════════════');
console.log('📈 DEDUPLICATION RESULTS');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log(`   Original count: ${attributes.length}`);
console.log(`   Duplicates removed: ${duplicatesRemoved}`);
console.log(`   Final count: ${finalList.length}`);
console.log(`   Unique groups: ${groupedByNormalized.size}\n`);

// Create backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupPath = attributesPath.replace('.json', `.backup-before-dedup-${timestamp}.json`);
fs.writeFileSync(backupPath, JSON.stringify(attributes, null, 2));
console.log(`💾 Backup created: ${path.basename(backupPath)}`);

// Write deduplicated list
fs.writeFileSync(attributesPath, JSON.stringify(finalList, null, 2));
console.log(`✅ Deduplicated list written to: attributes.json\n`);

// Save detailed report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    originalCount: attributes.length,
    duplicatesRemoved: duplicatesRemoved,
    finalCount: finalList.length,
    uniqueGroups: groupedByNormalized.size
  },
  removedAttributes,
  strategy: 'Prefer Title Case format over underscore format'
};

const reportPath = path.join(__dirname, '../audit-results/deduplication-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`📄 Detailed report saved to: audit-results/deduplication-report.json`);

console.log('\n🎯 NEXT STEPS:');
console.log('   1. Review the deduplicated list');
console.log('   2. Verify system-wide validation still passes');
console.log('   3. Reconcile again with SF clean list if needed');
console.log('');
