const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const sfStyles = require(path.join(rootDir, 'src/config/salesforce-picklists/styles.json'));

const sfNameSet = new Set(sfStyles.map(s => s.style_name));

// Read ALL styles from internal mapping
const mapping = fs.readFileSync(path.join(rootDir, 'src/config/category-style-mapping.ts'), 'utf8');

// Get all quoted strings that look like styles
const allStrings = [...mapping.matchAll(/'([A-Za-z][^']{1,35})'/g)].map(m => m[1]);
const nonStyles = ['Lighting', 'Appliances', 'Plumbing', 'Hardware', 'Outdoor', 'HVAC', 'Kitchen', 'Bathroom', 'category', 'styles'];

const uniqueInternalStyles = [...new Set(allStrings)].filter(s => {
  return !nonStyles.some(x => s.includes(x));
});

const trulyMissing = uniqueInternalStyles.filter(s => !sfNameSet.has(s));
const inBoth = uniqueInternalStyles.filter(s => sfNameSet.has(s));

console.log('=== CORRECTED STYLE ANALYSIS ===');
console.log('');
console.log('SF Picklist: 201 entries (' + sfNameSet.size + ' unique)');
console.log('Internal Mapping: ' + uniqueInternalStyles.length + ' unique styles');
console.log('');
console.log('✅ In BOTH (no action needed): ' + inBoth.length);
console.log('❌ TRULY MISSING from SF: ' + trulyMissing.length);
console.log('');
console.log('Styles that need to be requested from SF:');
trulyMissing.sort().forEach(s => console.log('  - ' + s));

// Generate corrected JSON
const correctedMissing = {
  generated_at: new Date().toISOString().split('T')[0],
  total_missing: trulyMissing.length,
  note: "CORRECTED - Original script had bug using wrong field name (.Name vs .style_name)",
  style_requests: trulyMissing.sort().map(s => ({
    style_name: s,
    source: "internal_mapping_cleanup",
    in_salesforce: false
  }))
};

fs.writeFileSync(path.join(rootDir, 'missing-styles-for-sf-CORRECTED.json'), JSON.stringify(correctedMissing, null, 2));
console.log('\nSaved corrected file: missing-styles-for-sf-CORRECTED.json');
