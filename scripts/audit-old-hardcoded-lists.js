#!/usr/bin/env node
/**
 * Audit for OLD hardcoded lists that should be replaced with master JSONs
 * Master lists location: src/config/salesforce-picklists/*.json
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== AUDITING OLD HARDCODED LISTS ===\n');

// Load master JSONs
const picklistDir = path.join(__dirname, '../src/config/salesforce-picklists');
const brands = JSON.parse(fs.readFileSync(path.join(picklistDir, 'brands.json'), 'utf-8'));
const categories = JSON.parse(fs.readFileSync(path.join(picklistDir, 'categories.json'), 'utf-8'));
const styles = JSON.parse(fs.readFileSync(path.join(picklistDir, 'styles.json'), 'utf-8'));
const types = JSON.parse(fs.readFileSync(path.join(picklistDir, 'types.json'), 'utf-8'));
const attributes = JSON.parse(fs.readFileSync(path.join(picklistDir, 'attributes.json'), 'utf-8'));
const departments = JSON.parse(fs.readFileSync(path.join(picklistDir, 'departments.json'), 'utf-8'));
const families = JSON.parse(fs.readFileSync(path.join(picklistDir, 'families.json'), 'utf-8'));

const categoryStyleMapping = JSON.parse(fs.readFileSync(path.join(picklistDir, 'category-style-mapping.json'), 'utf-8'));
const categoryTypeMapping = JSON.parse(fs.readFileSync(path.join(picklistDir, 'category-type-mapping.json'), 'utf-8'));

console.log('📊 MASTER JSON COUNTS:');
console.log(`  - Brands: ${brands.length}`);
console.log(`  - Categories: ${categories.length}`);
console.log(`  - Styles: ${styles.length} (design aesthetics)`);
console.log(`  - Types: ${types.length} (product configurations)`);
console.log(`  - Attributes: ${attributes.length}`);
console.log(`  - Departments: ${departments.length}`);
console.log(`  - Families: ${families.length}`);
console.log(`  - Universal Styles: ${categoryStyleMapping.universal_styles.length}`);
console.log(`  - Category-Type Mappings: ${categoryTypeMapping.mappings.length} categories`);

console.log('\n🔍 CHECKING OLD FILES FOR HARDCODED LISTS:\n');

// Check category-style-mapping.ts (OLD file with 907 entries)
const oldStyleMappingPath = path.join(__dirname, '../src/config/category-style-mapping.ts');
if (fs.existsSync(oldStyleMappingPath)) {
  const content = fs.readFileSync(oldStyleMappingPath, 'utf-8');
  
  // Count how many "name:" entries (these are the 907 entries)
  const nameMatches = content.match(/name:\s*'/g);
  const entryCount = nameMatches ? nameMatches.length : 0;
  
  // Check if it's importing from JSON or has hardcoded data
  const hasHardcodedData = content.includes("name: '") && content.includes('values: [');
  const importsFromJSON = content.includes('category-style-mapping.json');
  
  console.log(`❌ category-style-mapping.ts (OLD FILE):`);
  console.log(`   - Contains: ${entryCount} hardcoded entries`);
  console.log(`   - These are TYPES not STYLES (French Door, Single Wall, etc.)`);
  console.log(`   - Imports from JSON: ${importsFromJSON ? 'YES ✅' : 'NO ❌'}`);
  console.log(`   - Has hardcoded data: ${hasHardcodedData ? 'YES ❌ (SHOULD BE DELETED)' : 'NO ✅'}`);
  console.log(`   - ACTION: Replace with category-style-mapping.json (16 design styles)`);
  console.log('');
}

// Check constants.ts for hardcoded lists
const constantsPath = path.join(__dirname, '../src/config/constants.ts');
if (fs.existsSync(constantsPath)) {
  const content = fs.readFileSync(constantsPath, 'utf-8');
  
  const hasHardcodedLists = content.match(/const\s+\w+\s*=\s*\[[\s\S]*?\]/g);
  const hardcodedArrayCount = hasHardcodedLists ? hasHardcodedLists.length : 0;
  
  console.log(`⚠️  constants.ts:`);
  console.log(`   - Hardcoded arrays found: ${hardcodedArrayCount}`);
  
  if (hardcodedArrayCount > 0) {
    console.log(`   - Sample arrays:`);
    hasHardcodedLists.slice(0, 5).forEach(arr => {
      const varName = arr.match(/const\s+(\w+)\s*=/)?.[1];
      const itemCount = (arr.match(/'/g) || []).length / 2;
      console.log(`     - ${varName}: ~${itemCount} items`);
    });
  }
  console.log('');
}

// Check lookups.ts for hardcoded lists
const lookupsPath = path.join(__dirname, '../src/config/lookups.ts');
if (fs.existsSync(lookupsPath)) {
  const content = fs.readFileSync(lookupsPath, 'utf-8');
  
  const hasHardcodedLists = content.match(/const\s+\w+\s*=\s*\[[\s\S]*?\]/g);
  const hardcodedArrayCount = hasHardcodedLists ? hasHardcodedLists.length : 0;
  
  console.log(`⚠️  lookups.ts:`);
  console.log(`   - Hardcoded arrays found: ${hardcodedArrayCount}`);
  
  if (hardcodedArrayCount > 0) {
    console.log(`   - Sample arrays:`);
    hasHardcodedLists.slice(0, 5).forEach(arr => {
      const varName = arr.match(/const\s+(\w+)\s*=/)?.[1];
      const itemCount = (arr.match(/'/g) || []).length / 2;
      console.log(`     - ${varName}: ~${itemCount} items`);
    });
  }
  console.log('');
}

// Check if picklist-matcher.service.ts loads all master JSONs
const picklistMatcherPath = path.join(__dirname, '../src/services/picklist-matcher.service.ts');
if (fs.existsSync(picklistMatcherPath)) {
  const content = fs.readFileSync(picklistMatcherPath, 'utf-8');
  
  const loadsFiles = {
    'brands.json': content.includes("'brands.json'"),
    'categories.json': content.includes("'categories.json'"),
    'styles.json': content.includes("'styles.json'"),
    'types.json': content.includes("'types.json'"),
    'attributes.json': content.includes("'attributes.json'"),
    'departments.json': content.includes("'departments.json'"),
    'families.json': content.includes("'families.json'")
  };
  
  console.log(`✅ picklist-matcher.service.ts MASTER JSON LOADING:`);
  Object.entries(loadsFiles).forEach(([file, loaded]) => {
    console.log(`   - ${file}: ${loaded ? '✅ LOADED' : '❌ MISSING'}`);
  });
  console.log('');
}

// Check dual-ai-verification.service.ts for imports from OLD files
const dualAIPath = path.join(__dirname, '../src/services/dual-ai-verification.service.ts');
if (fs.existsSync(dualAIPath)) {
  const content = fs.readFileSync(dualAIPath, 'utf-8');
  
  const imports = {
    'category-style-mapping.ts (OLD)': content.includes("from '../config/category-style-mapping'"),
    'category-style-mapping.json (NEW)': content.includes("category-style-mapping.json"),
    'category-type-mapping.json (NEW)': content.includes("category-type-mapping.json")
  };
  
  console.log(`⚠️  dual-ai-verification.service.ts IMPORTS:`);
  Object.entries(imports).forEach(([file, imported]) => {
    console.log(`   - ${file}: ${imported ? (file.includes('OLD') ? '❌ USING OLD' : '✅ USING NEW') : '❌ NOT IMPORTED'}`);
  });
  console.log('');
}

console.log('\n=== SUMMARY ===\n');

console.log('🎯 REQUIRED ACTIONS:\n');
console.log('1. ❌ DELETE or REPLACE category-style-mapping.ts (907 hardcoded TYPES, not styles)');
console.log('2. ✅ USE category-style-mapping.json (16 universal design STYLES)');
console.log('3. ✅ USE category-type-mapping.json (category-specific product TYPES)');
console.log('4. ✅ VERIFY picklist-matcher loads all 7 master JSONs');
console.log('5. ⚠️  AUDIT constants.ts and lookups.ts for hardcoded lists');
console.log('6. ⚠️  UPDATE dual-ai-verification.service.ts to use JSON, not OLD .ts file');
console.log('');
console.log('📝 MASTER LIST HIERARCHY:');
console.log('   Department → Family → Category → TYPE (functional)');
console.log('   Category → STYLE (aesthetic, universal)');
console.log('');
console.log('🔑 KEY DISTINCTION:');
console.log('   - STYLES (16): Design aesthetics (Contemporary, Farmhouse, Industrial)');
console.log('   - TYPES (648): Product configurations (French Door, Single Wall, Upright)');
console.log('');

process.exit(0);
