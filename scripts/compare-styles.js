const fs = require('fs');

// Read original (lines 1-1122)
const allLines = fs.readFileSync('/workspaces/Catalog-Verification-API/src/config/salesforce-picklists/styles.json', 'utf-8').split('\n');
const orig = JSON.parse(allLines.slice(0, 1122).join('\n'));

// Read new (lines 1123-1817)
const newData = JSON.parse(fs.readFileSync('/tmp/new-styles.json', 'utf-8'));

console.log('='.repeat(70));
console.log('📋 STYLES.JSON COMPARISON ANALYSIS');
console.log('='.repeat(70));
console.log();
console.log('📊 COUNTS:');
console.log('   Original (lines 1-1122):    ', orig.length, 'styles');
console.log('   New appended (1123-1817):   ', newData.length, 'styles');
console.log('   Current total (duplicate):  ', orig.length + newData.length, 'styles');
console.log();

console.log('🔍 STRUCTURE DIFFERENCES:');
console.log('   Original field order: "style_name", "style_id"');
console.log('   New field order:      "style_id", "style_name"  ⚠️ REVERSED!');
console.log();

// Compare by ID
const origMap = new Map();
orig.forEach(s => origMap.set(s.style_id, s.style_name));

const newMap = new Map();
newData.forEach(s => newMap.set(s.style_id, s.style_name));

const onlyInNew = [];
newData.forEach(s => {
  if (!origMap.has(s.style_id)) {
    onlyInNew.push(s);
  }
});

const onlyInOrig = [];
orig.forEach(s => {
  if (!newMap.has(s.style_id)) {
    onlyInOrig.push(s);
  }
});

console.log('='.repeat(70));
console.log('🆕 NEW STYLES (in appended data, NOT in original):');
console.log('='.repeat(70));
console.log();
if (onlyInNew.length === 0) {
  console.log('   ✅ NONE - All appended styles already exist in original');
} else {
  console.log(`   Found ${onlyInNew.length} new styles:\n`);
  onlyInNew.forEach((s, i) => {
    console.log(`   ${i+1}. "${s.style_name}" (${s.style_id})`);
  });
}
console.log();

console.log('='.repeat(70));
console.log('🗑️  STYLES IN ORIGINAL (NOT in new appended data):');
console.log('='.repeat(70));
console.log();
if (onlyInOrig.length === 0) {
  console.log('   ✅ NONE - All original styles present in new data');
} else {
  console.log(`   ⚠️  ${onlyInOrig.length} styles would be LOST if we delete original!\n`);
  const displayCount = Math.min(onlyInOrig.length, 20);
  onlyInOrig.slice(0, displayCount).forEach((s, i) => {
    console.log(`   ${i+1}. "${s.style_name}" (${s.style_id})`);
  });
  if (onlyInOrig.length > 20) {
    console.log(`   ... and ${onlyInOrig.length - 20} more`);
  }
}
console.log();

console.log('='.repeat(70));
console.log('🎯 RECOMMENDATION:');
console.log('='.repeat(70));
console.log();

if (onlyInOrig.length > 100) {
  console.log('   ❌ DELETE APPENDED DATA');
  console.log();
  console.log(`   The new data is OLDER/INCOMPLETE - missing ${onlyInOrig.length} styles!`);
  console.log();
  console.log('   ACTION: Remove lines 1123-1817 (keep original data only)');
  console.log(`   Result: ${orig.length} styles (original unchanged)`);
} else if (onlyInNew.length > 0) {
  console.log('   ✅ MERGE NEW STYLES INTO ORIGINAL');
  console.log();
  console.log(`   The new data has ${onlyInNew.length} additional styles.`);
  console.log();
  console.log('   ACTION:');
  console.log(`   1. Extract ${onlyInNew.length} new styles from appended data`);
  console.log('   2. Fix field order to match original (style_name first)');
  console.log('   3. Add to original array');
  console.log('   4. Remove duplicate appended section');
  console.log(`   Result: ${orig.length + onlyInNew.length} total styles`);
} else {
  console.log('   ⚠️  EXACT DUPLICATE');
  console.log();
  console.log('   Both datasets contain identical styles.');
  console.log();
  console.log('   ACTION: Remove lines 1123-1817 (delete duplicate data)');
  console.log(`   Result: ${orig.length} styles (no data loss)`);
}
console.log();
console.log('='.repeat(70));
