/**
 * Analyze styles.json - Compare original vs new appended data
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/config/salesforce-picklists/styles.json');
const content = fs.readFileSync(filePath, 'utf-8');

// Split at the duplicate array boundary (line 1122-1123)
const lines = content.split('\n');
const splitPoint = lines.findIndex((line, idx) => idx > 1000 && line === ']');

console.log(`📁 File: styles.json`);
console.log(`📊 Total lines: ${lines.length}`);
console.log(`✂️  Split point: Line ${splitPoint + 1}\n`);

// Parse both sections
const originalText = lines.slice(0, splitPoint + 1).join('\n');
const newText = '[' + lines.slice(splitPoint + 2).join('\n'); // Skip "]" and blank line, add "["

let original, newData;
try {
  original = JSON.parse(originalText);
  newData = JSON.parse(newText);
} catch (e) {
  console.error('❌ Parse error:', e.message);
  process.exit(1);
}

console.log('='.repeat(80));
console.log('📋 DATA STRUCTURE COMPARISON');
console.log('='.repeat(80));

// Check field order
const origSample = original[0];
const newSample = newData[0];

console.log('\n🔍 Field Order:');
console.log(`   Original: ${Object.keys(origSample).join(', ')}`);
console.log(`   New:      ${Object.keys(newSample).join(', ')}`);
console.log(`   ⚠️  Field order is DIFFERENT!`);

console.log('\n📊 Counts:');
console.log(`   Original styles: ${original.length}`);
console.log(`   New styles:      ${newData.length}`);
console.log(`   Total duplicate: ${original.length + newData.length}`);

// Create maps by style_id for comparison
const originalMap = new Map();
original.forEach(style => {
  originalMap.set(style.style_id, style.style_name);
});

const newMap = new Map();
newData.forEach(style => {
  newMap.set(style.style_id, style.style_name);
});

console.log('\n' + '='.repeat(80));
console.log('🆕 STYLES ONLY IN NEW DATA (not in original)');
console.log('='.repeat(80));

const onlyInNew = [];
newData.forEach(style => {
  if (!originalMap.has(style.style_id)) {
    onlyInNew.push(style);
  }
});

if (onlyInNew.length === 0) {
  console.log('\n✅ No new styles - all new data already exists in original\n');
} else {
  console.log(`\n✅ Found ${onlyInNew.length} NEW styles:\n`);
  onlyInNew.forEach((style, idx) => {
    console.log(`   ${idx + 1}. "${style.style_name}" (${style.style_id})`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('🗑️  STYLES ONLY IN ORIGINAL (not in new data)');
console.log('='.repeat(80));

const onlyInOriginal = [];
original.forEach(style => {
  if (!newMap.has(style.style_id)) {
    onlyInOriginal.push(style);
  }
});

if (onlyInOriginal.length === 0) {
  console.log('\n✅ No missing styles - new data contains all original styles\n');
} else {
  console.log(`\n⚠️  Found ${onlyInOriginal.length} styles that would be LOST if we delete original:\n`);
  onlyInOriginal.forEach((style, idx) => {
    console.log(`   ${idx + 1}. "${style.style_name}" (${style.style_id})`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('🔄 STYLES IN BOTH (with same ID)');
console.log('='.repeat(80));

const inBoth = [];
const nameChanges = [];

original.forEach(origStyle => {
  const newName = newMap.get(origStyle.style_id);
  if (newName) {
    inBoth.push(origStyle);
    if (newName !== origStyle.style_name) {
      nameChanges.push({
        style_id: origStyle.style_id,
        old_name: origStyle.style_name,
        new_name: newName
      });
    }
  }
});

console.log(`\n📊 ${inBoth.length} styles appear in both datasets`);

if (nameChanges.length === 0) {
  console.log('✅ All shared styles have identical names\n');
} else {
  console.log(`\n⚠️  ${nameChanges.length} styles have NAME CHANGES:\n`);
  nameChanges.forEach((change, idx) => {
    console.log(`   ${idx + 1}. ${change.style_id}`);
    console.log(`      Old: "${change.old_name}"`);
    console.log(`      New: "${change.new_name}"`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('🎯 RECOMMENDATION');
console.log('='.repeat(80));

if (onlyInNew.length > 0) {
  console.log(`\n✅ KEEP NEW DATA - It has ${onlyInNew.length} additional styles`);
  console.log(`\n📋 Action Plan:`);
  console.log(`   1. Merge ${onlyInNew.length} new styles into original`);
  console.log(`   2. Fix field order to match original (style_name, style_id)`);
  console.log(`   3. Remove duplicate appended data`);
  console.log(`   4. Final count: ${Math.max(original.length, newData.length)} styles\n`);
} else if (onlyInOriginal.length > 0) {
  console.log(`\n⚠️  KEEP ORIGINAL - New data is missing ${onlyInOriginal.length} styles`);
  console.log(`   Simply delete the appended data (lines ${splitPoint + 2} onwards)\n`);
} else {
  console.log(`\n⚠️  DUPLICATE DATA - Both datasets are identical`);
  console.log(`   Simply delete the appended data (lines ${splitPoint + 2} onwards)\n`);
}

console.log('='.repeat(80));
