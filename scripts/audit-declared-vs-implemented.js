#!/usr/bin/env node
/**
 * FEATURE COMPLETENESS VALIDATOR
 * Checks if declared features in config/schemas are actually implemented in code
 * Prevents situations where data structure exists but code doesn't use it
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║         FEATURE COMPLETENESS VALIDATION                        ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let errors = 0;
let warnings = 0;

// ============================================================================
// CHECK 1: Slot Format Templates Are Applied
// ============================================================================
console.log('🔍 CHECK 1: Slot format templates are actually applied in code\n');

const schemaFile = fs.readFileSync('src/config/title-schema-by-category.ts', 'utf8');
const generatorFile = fs.readFileSync('src/services/seo-title-generator.service.ts', 'utf8');

// Find all slot.format declarations
const formatDeclarations = schemaFile.match(/"format":\s*"[^"]+"/g) || [];
console.log(`   Found ${formatDeclarations.length} slot format template declarations`);

// Check if generateFromSchema() applies slot.format
if (generatorFile.includes('slot.format') && generatorFile.includes('.replace(\'{value}\'')) {
  console.log('   ✅ generateFromSchema() applies slot.format templates\n');
} else {
  console.log('   ❌ generateFromSchema() does NOT apply slot.format templates!\n');
  errors++;
}

// ============================================================================
// CHECK 2: ATTRIBUTE_FORMATTERS Are Used
// ============================================================================
console.log('🔍 CHECK 2: ATTRIBUTE_FORMATTERS are used in formatValue()\n');

const formatterCount = (schemaFile.match(/ATTRIBUTE_FORMATTERS\[/g) || []).length;
console.log(`   Found ${formatterCount} references to ATTRIBUTE_FORMATTERS`);

if (generatorFile.includes('ATTRIBUTE_FORMATTERS[attribute]') || 
    generatorFile.includes('const formatterKey = ATTRIBUTE_FORMATTERS')) {
  console.log('   ✅ formatValue() uses ATTRIBUTE_FORMATTERS\n');
} else {
  console.log('   ❌ formatValue() does NOT use ATTRIBUTE_FORMATTERS!\n');
  errors++;
}

// ============================================================================
// CHECK 3: Schema Lookup Uses Correct Regex
// ============================================================================
console.log('🔍 CHECK 3: Schema lookup uses correct whitespace regex\n');

// Check for common regex mistakes
const regexPatterns = schemaFile.match(/\.replace\(\/[^\/]+\/g/g) || [];
const suspiciousPatterns = [];

regexPatterns.forEach(pattern => {
  // Check for missing backslash in common patterns
  if (pattern.includes('/s+/') && !pattern.includes('\\s+')) {
    suspiciousPatterns.push({ pattern, issue: 'Missing backslash before s - should be \\s+ for whitespace' });
  }
  if (pattern.includes('/d+/') && !pattern.includes('\\d+')) {
    suspiciousPatterns.push({ pattern, issue: 'Missing backslash before d - should be \\d+ for digits' });
  }
  if (pattern.includes('/w+/') && !pattern.includes('\\w+')) {
    suspiciousPatterns.push({ pattern, issue: 'Missing backslash before w - should be \\w+ for word characters' });
  }
});

if (suspiciousPatterns.length > 0) {
  console.log('   ⚠️  SUSPICIOUS REGEX PATTERNS FOUND:\n');
  suspiciousPatterns.forEach(({ pattern, issue }) => {
    console.log(`      ${pattern} → ${issue}`);
  });
  console.log('');
  warnings++;
} else {
  console.log('   ✅ No suspicious regex patterns detected\n');
}

// ============================================================================
// CHECK 4: Interface Properties Are Actually Used
// ============================================================================
console.log('🔍 CHECK 4: SEOTitleInput interface properties are used\n');

// Extract SEOTitleInput properties
const interfaceMatch = generatorFile.match(/export interface SEOTitleInput \{([^}]+)\}/s);
if (interfaceMatch) {
  const properties = interfaceMatch[1].match(/^\s+(\w+)\??:/gm) || [];
  const propertyNames = properties.map(p => p.trim().replace(/\?:$/, '').replace(/:$/, ''));
  
  // Check how many are actually accessed in code
  let unusedCount = 0;
  const unused = [];
  
  propertyNames.forEach(prop => {
    const accessPatterns = [
      new RegExp(`input\\.${prop}\\b`),
      new RegExp(`'${prop}':`),
      new RegExp(`"${prop}":`),
    ];
    
    const isUsed = accessPatterns.some(pattern => generatorFile.match(pattern));
    if (!isUsed) {
      unused.push(prop);
      unusedCount++;
    }
  });
  
  console.log(`   Total properties: ${propertyNames.length}`);
  console.log(`   Used in code: ${propertyNames.length - unusedCount}`);
  
  if (unusedCount > 0) {
    console.log(`   ⚠️  Potentially unused: ${unusedCount}`);
    if (unusedCount > propertyNames.length * 0.3) {
      console.log(`\n   Unused properties: ${unused.slice(0, 10).join(', ')}${unused.length > 10 ? '...' : ''}\n`);
      warnings++;
    } else {
      console.log('');
    }
  } else {
    console.log('   ✅ All properties appear to be used\n');
  }
}

// ============================================================================
// CHECK 5: Hardcoded Lists Match JSON Picklists
// ============================================================================
console.log('🔍 CHECK 5: Hardcoded category lists match picklists\n');

const categoryMatcherFile = fs.readFileSync('src/services/category-matcher.service.ts', 'utf8');
const categoriesJson = fs.readFileSync('src/config/salesforce-picklists/categories.json', 'utf8');

// Check DEPARTMENT_CATEGORIES hardcoded list
if (categoryMatcherFile.includes('DEPARTMENT_CATEGORIES') || categoryMatcherFile.includes('LIGHTING_CATEGORIES')) {
  console.log('   ⚠️  Found hardcoded category lists in category-matcher.service.ts');
  console.log('      Run: node scripts/regenerate-hardcoded-lists.js --check');
  console.log('');
  warnings++;
} else {
  console.log('   ✅ No obvious hardcoded category lists found\n');
}

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('═'.repeat(66) + '\n');
console.log('📊 FEATURE COMPLETENESS SUMMARY:\n');
console.log(`   ❌ Errors:   ${errors}`);
console.log(`   ⚠️  Warnings: ${warnings}\n`);

if (errors > 0) {
  console.log('🚫 CRITICAL ISSUES FOUND - DO NOT DEPLOY!\n');
  console.log('   Fix the errors above before deployment.\n');
  process.exit(1);
} else if (warnings > 0) {
  console.log('⚠️  WARNINGS FOUND - Review before deployment\n');
  console.log('   Issues detected but not critical. Proceed with caution.\n');
  process.exit(0);
} else {
  console.log('✅ ALL FEATURE COMPLETENESS CHECKS PASSED!\n');
  process.exit(0);
}
