#!/usr/bin/env node
/**
 * PICKLIST FIELD NAME AUDIT
 * =========================
 * Verifies that all code using Salesforce picklist files uses the correct field names.
 * 
 * Usage: node scripts/audit-picklist-fields.js
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const picklistDir = path.join(rootDir, 'src/config/salesforce-picklists');

// Define expected field names for each picklist
const EXPECTED_FIELDS = {
  'brands.json': {
    idField: 'brand_id',
    nameField: 'brand_name'
  },
  'categories.json': {
    idField: 'category_id', 
    nameField: 'category_name',
    otherFields: ['department', 'family']
  },
  'styles.json': {
    idField: 'style_id',
    nameField: 'style_name'
  },
  'attributes.json': {
    idField: 'attribute_id',
    nameField: 'attribute_name'
  },
  'category-filter-attributes.json': {
    // Different structure - nested
    structure: 'nested',
    expectedKeys: ['version', 'date', 'total_categories', 'categories']
  }
};

// Check each picklist file
console.log('='.repeat(60));
console.log('SALESFORCE PICKLIST FIELD AUDIT');
console.log('='.repeat(60));
console.log('');

const results = {
  passed: [],
  failed: [],
  warnings: []
};

for (const [filename, expected] of Object.entries(EXPECTED_FIELDS)) {
  const filePath = path.join(picklistDir, filename);
  
  console.log(`Checking: ${filename}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ❌ FILE NOT FOUND: ${filePath}`);
    results.failed.push({ file: filename, issue: 'File not found' });
    continue;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    if (expected.structure === 'nested') {
      // Check nested structure
      const missingKeys = expected.expectedKeys.filter(k => !(k in data));
      if (missingKeys.length > 0) {
        console.log(`  ❌ Missing keys: ${missingKeys.join(', ')}`);
        results.failed.push({ file: filename, issue: `Missing keys: ${missingKeys.join(', ')}` });
      } else {
        console.log(`  ✅ Structure valid (version: ${data.version})`);
        results.passed.push({ file: filename, note: `version ${data.version}` });
      }
    } else {
      // Check array structure
      if (!Array.isArray(data)) {
        console.log(`  ❌ Expected array, got ${typeof data}`);
        results.failed.push({ file: filename, issue: 'Not an array' });
        continue;
      }
      
      if (data.length === 0) {
        console.log(`  ⚠️ Empty array`);
        results.warnings.push({ file: filename, issue: 'Empty array' });
        continue;
      }
      
      const firstItem = data[0];
      const actualFields = Object.keys(firstItem);
      
      // Check ID field
      if (expected.idField && !actualFields.includes(expected.idField)) {
        console.log(`  ❌ Missing ID field: expected '${expected.idField}', found: ${actualFields.join(', ')}`);
        results.failed.push({ file: filename, issue: `Missing '${expected.idField}'` });
      }
      
      // Check name field
      if (expected.nameField && !actualFields.includes(expected.nameField)) {
        console.log(`  ❌ Missing name field: expected '${expected.nameField}', found: ${actualFields.join(', ')}`);
        results.failed.push({ file: filename, issue: `Missing '${expected.nameField}'` });
      }
      
      // Check for WRONG common field names (the bug pattern)
      const wrongFields = ['Name', 'Id', 'ID', 'name', 'id'];
      const foundWrong = wrongFields.filter(f => actualFields.includes(f));
      if (foundWrong.length > 0) {
        console.log(`  ⚠️ Found generic field names that might cause confusion: ${foundWrong.join(', ')}`);
        results.warnings.push({ file: filename, issue: `Generic fields: ${foundWrong.join(', ')}` });
      }
      
      if (!results.failed.some(f => f.file === filename)) {
        console.log(`  ✅ Fields: ${actualFields.join(', ')} (${data.length} entries)`);
        results.passed.push({ file: filename, fields: actualFields, count: data.length });
      }
    }
  } catch (error) {
    console.log(`  ❌ Parse error: ${error.message}`);
    results.failed.push({ file: filename, issue: error.message });
  }
  
  console.log('');
}

// Check TypeScript code for potential field name mismatches
console.log('='.repeat(60));
console.log('TYPESCRIPT CODE AUDIT');
console.log('='.repeat(60));
console.log('');

const tsFiles = [
  'src/services/picklist-matcher.service.ts',
  'src/services/dual-ai-verification.service.ts',
  'src/config/lookups.ts',
  'src/config/category-style-mapping.ts'
];

// Wrong patterns to look for
const wrongPatterns = [
  { pattern: /\.Name\b/, desc: 'Using .Name (should be ._name)' },
  { pattern: /\.Id\b/, desc: 'Using .Id (should be ._id)' },
  { pattern: /\['Name'\]/, desc: "Using ['Name'] (should be ['_name'])" },
  { pattern: /\['Id'\]/, desc: "Using ['Id'] (should be ['_id'])" }
];

for (const tsFile of tsFiles) {
  const filePath = path.join(rootDir, tsFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ ${tsFile}: File not found`);
    continue;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  let hasIssues = false;
  
  for (const { pattern, desc } of wrongPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      console.log(`❌ ${tsFile}: ${desc}`);
      hasIssues = true;
      results.failed.push({ file: tsFile, issue: desc });
    }
  }
  
  if (!hasIssues) {
    console.log(`✅ ${tsFile}: No wrong field patterns found`);
    results.passed.push({ file: tsFile, note: 'Clean' });
  }
}

// Summary
console.log('');
console.log('='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`⚠️ Warnings: ${results.warnings.length}`);
console.log(`❌ Failed: ${results.failed.length}`);

if (results.failed.length > 0) {
  console.log('');
  console.log('FAILURES:');
  results.failed.forEach(f => console.log(`  - ${f.file}: ${f.issue}`));
}

if (results.warnings.length > 0) {
  console.log('');
  console.log('WARNINGS:');
  results.warnings.forEach(w => console.log(`  - ${w.file}: ${w.issue}`));
}

// Output JSON for programmatic use
fs.writeFileSync(
  path.join(rootDir, 'picklist-audit-results.json'),
  JSON.stringify(results, null, 2)
);
console.log('');
console.log('Full results saved to: picklist-audit-results.json');
