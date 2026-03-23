#!/usr/bin/env node
/**
 * Style Cross-Reference Validator
 * Verifies that ALL styles referenced in category-style-mapping.json
 * exist in the global styles.json picklist (which the picklist matcher uses).
 * 
 * This prevents the bug where category-specific styles are defined but
 * the picklist matcher can't find them because they're missing from styles.json.
 */

const fs = require('fs');
const path = require('path');

const picklistDir = path.join(__dirname, '..', 'src', 'config', 'salesforce-picklists');
const stylesPath = path.join(picklistDir, 'styles.json');
const mappingPath = path.join(picklistDir, 'category-style-mapping.json');

let hasErrors = false;

// Load files
const styles = JSON.parse(fs.readFileSync(stylesPath, 'utf-8'));
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

const globalStyleNames = new Set(styles.map(s => s.style_name.toLowerCase()));
const globalStyleIds = new Set(styles.filter(s => s.style_id && !s.style_id.startsWith('NEEDS_') && !s.style_id.startsWith('pending_')).map(s => s.style_id));

console.log(`\n📋 Style Cross-Reference Validation`);
console.log(`${'='.repeat(50)}`);
console.log(`Global styles.json: ${styles.length} styles`);
console.log(`Category mappings: ${mapping.category_specific_mappings.length} categories\n`);

// Check universal styles
const universalMissing = [];
for (const style of mapping.universal_styles) {
  if (!globalStyleNames.has(style.style_name.toLowerCase())) {
    universalMissing.push(style.style_name);
  }
}

if (universalMissing.length > 0) {
  console.log(`❌ Universal styles MISSING from styles.json:`);
  universalMissing.forEach(s => console.log(`   - "${s}"`));
  hasErrors = true;
} else {
  console.log(`✅ All ${mapping.universal_styles.length} universal styles exist in styles.json`);
}

// Check category-specific styles
const categoryMissing = [];
for (const cat of mapping.category_specific_mappings) {
  for (const style of cat.styles) {
    if (!globalStyleNames.has(style.style_name.toLowerCase())) {
      categoryMissing.push({
        category: cat.category_name,
        style: style.style_name,
        styleId: style.style_id,
        styleType: cat.style_type
      });
    }
  }
}

if (categoryMissing.length > 0) {
  console.log(`\n❌ Category-specific styles MISSING from styles.json:`);
  const byCategory = {};
  categoryMissing.forEach(m => {
    if (!byCategory[m.category]) byCategory[m.category] = [];
    byCategory[m.category].push(m);
  });
  for (const [cat, missing] of Object.entries(byCategory)) {
    console.log(`\n   ${cat} (${missing[0].styleType} styles):`);
    missing.forEach(m => console.log(`     - "${m.style}" (ID: ${m.styleId})`));
  }
  console.log(`\n   ⚠️  The picklist matcher reads from styles.json.`);
  console.log(`   These styles will NEVER match even if set correctly.`);
  console.log(`   Add them to styles.json to fix.`);
  hasErrors = true;
} else {
  console.log(`✅ All category-specific styles exist in styles.json`);
}

// Check for ID mismatches
let idMismatches = 0;
for (const cat of mapping.category_specific_mappings) {
  for (const style of cat.styles) {
    const globalEntry = styles.find(s => s.style_name.toLowerCase() === style.style_name.toLowerCase());
    if (globalEntry && globalEntry.style_id !== style.style_id &&
        !globalEntry.style_id.startsWith('NEEDS_') && !globalEntry.style_id.startsWith('pending_')) {
      if (idMismatches === 0) console.log(`\n⚠️  Style ID mismatches between mapping and styles.json:`);
      console.log(`   "${style.style_name}": mapping=${style.style_id} vs styles.json=${globalEntry.style_id}`);
      idMismatches++;
    }
  }
}

if (idMismatches === 0) {
  console.log(`✅ All style IDs are consistent`);
}

console.log('');
if (hasErrors) {
  console.log(`❌ STYLE CROSS-REFERENCE FAILED — Fix missing styles before deploying`);
  process.exit(1);
} else {
  console.log(`✅ STYLE CROSS-REFERENCE PASSED — All styles are consistent`);
  process.exit(0);
}
