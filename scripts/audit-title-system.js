#!/usr/bin/env node
/**
 * COMPREHENSIVE TITLE SYSTEM AUDIT
 * Tests schema lookup, format templates, and title generation for ALL categories
 */

const { CATEGORY_TITLE_SCHEMAS, getCategoryTitleSchema } = require('../dist/config/title-schema-by-category.js');
const { generateSEOTitle } = require('../dist/services/seo-title-generator.service.js');

console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
console.log('║           COMPREHENSIVE TITLE SYSTEM AUDIT                         ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

// Test data for each category
const testValues = {
  brand: 'TEST_BRAND',
  modelNumber: 'TEST123',
  width: '24',
  height: '30',
  depth: '24',
  totalCapacity: '28',
  btu: '50000',
  cfm: '600',
  placeSettings: '16',
  numberOfBurners: '5',
  installationType: 'Built-In',
  style: 'Contemporary',
  finish: 'Stainless Steel',
  color: 'White',
  configuration: 'French Door'
};

let totalCategories = 0;
let schemaLookupFailed = 0;
let schemaLookupSuccess = 0;
let categoriesWithFormats = 0;
let formatTemplatesTotal = 0;
let titleGenerationFailed = 0;
let suspiciousNormalizations = [];

console.log('📊 PART 1: SCHEMA LOOKUP TEST (Testing Regex Bug)\n');
console.log('   Testing if all 177 category names can find their schemas...\n');

const categoryNames = Object.keys(CATEGORY_TITLE_SCHEMAS).map(key => {
  return CATEGORY_TITLE_SCHEMAS[key].categoryName;
});

categoryNames.forEach(categoryName => {
  totalCategories++;
  
  // Test normalization
  const normalized = categoryName.toLowerCase().replace(/\s+/g, '_').replace(/[/&]/g, '_').replace(/__+/g, '_');
  const schema = getCategoryTitleSchema(categoryName);
  
  if (!schema) {
    schemaLookupFailed++;
    console.log(`   ❌ LOOKUP FAILED: "${categoryName}" → normalized: "${normalized}"`);
  } else {
    schemaLookupSuccess++;
    
    // Check if normalization looks suspicious (contains underscores in unexpected places)
    if (normalized.includes('__') || (normalized.match(/_/g) || []).length > 3) {
      suspiciousNormalizations.push({ categoryName, normalized });
    }
  }
});

console.log(`\n   Results: ${schemaLookupSuccess}/${totalCategories} schemas found ✅`);
if (schemaLookupFailed > 0) {
  console.log(`   ❌ ${schemaLookupFailed} categories CANNOT find their schemas!`);
}

if (suspiciousNormalizations.length > 0) {
  console.log(`\n   ⚠️  ${suspiciousNormalizations.length} categories have suspicious normalizations:`);
  suspiciousNormalizations.forEach(({ categoryName, normalized }) => {
    console.log(`      - "${categoryName}" → "${normalized}"`);
  });
}

console.log('\n' + '─'.repeat(70) + '\n');

console.log('📊 PART 2: SLOT FORMAT TEMPLATE AUDIT\n');
console.log('   Checking which categories use slot format templates...\n');

let categoriesWithFormatsList = [];

Object.keys(CATEGORY_TITLE_SCHEMAS).forEach(key => {
  const schema = CATEGORY_TITLE_SCHEMAS[key];
  const slotsWithFormats = schema.slots.filter(slot => slot.format);
  
  if (slotsWithFormats.length > 0) {
    categoriesWithFormats++;
    formatTemplatesTotal += slotsWithFormats.length;
    categoriesWithFormatsList.push({
      category: schema.categoryName,
      formatCount: slotsWithFormats.length,
      formats: slotsWithFormats.map(s => `${s.attribute}: "${s.format}"`)
    });
  }
});

console.log(`   📋 ${categoriesWithFormats} categories use slot format templates`);
console.log(`   📋 ${formatTemplatesTotal} total format templates found\n`);

// Show top 10 categories with most formats
console.log('   Top categories using format templates:\n');
categoriesWithFormatsList
  .sort((a, b) => b.formatCount - a.formatCount)
  .slice(0, 10)
  .forEach(({ category, formatCount, formats }) => {
    console.log(`   • ${category} (${formatCount} formats):`);
    formats.forEach(f => console.log(`     ${f}`));
  });

console.log('\n' + '─'.repeat(70) + '\n');

console.log('📊 PART 3: TITLE GENERATION TEST\n');
console.log('   Testing title generation for categories with format templates...\n');

let formatNotApplied = [];

categoriesWithFormatsList.forEach(({ category, formats }) => {
  const testInput = {
    ...testValues,
    category: category
  };
  
  try {
    const title = generateSEOTitle(testInput);
    
    // Check if format templates were applied
    formats.forEach(formatStr => {
      const [attribute, template] = formatStr.split(': ');
      const templateValue = template.replace(/"/g, '');
      
      // Extract the suffix from template (e.g., " Place Setting", "-Inch", " CFM")
      const suffix = templateValue.replace('{value}', '').trim();
      
      if (suffix && !title.includes(suffix)) {
        formatNotApplied.push({
          category,
          attribute: attribute.trim(),
          template: templateValue,
          suffix,
          title: title.substring(0, 80)
        });
      }
    });
  } catch (error) {
    titleGenerationFailed++;
    console.log(`   ❌ Title generation failed for ${category}: ${error.message}`);
  }
});

if (formatNotApplied.length > 0) {
  console.log(`   ⚠️  ${formatNotApplied.length} format templates NOT applied in titles:\n`);
  
  // Group by category
  const byCategory = {};
  formatNotApplied.forEach(item => {
    if (!byCategory[item.category]) {
      byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
  });
  
  Object.keys(byCategory).forEach(category => {
    console.log(`   • ${category}:`);
    byCategory[category].forEach(({ attribute, template, suffix, title }) => {
      console.log(`     ❌ ${attribute}: "${template}" (expected "${suffix}" in title)`);
      console.log(`        Generated: "${title}..."`);
    });
  });
} else {
  console.log('   ✅ All format templates appear to be applied correctly');
}

console.log('\n' + '─'.repeat(70) + '\n');

console.log('📊 FINAL SUMMARY\n');
console.log(`   Total Categories:           ${totalCategories}`);
console.log(`   Schema Lookup Success:      ${schemaLookupSuccess} ✅`);
console.log(`   Schema Lookup Failed:       ${schemaLookupFailed} ${schemaLookupFailed > 0 ? '❌' : '✅'}`);
console.log(`   Categories with Formats:    ${categoriesWithFormats}`);
console.log(`   Total Format Templates:     ${formatTemplatesTotal}`);
console.log(`   Formats Not Applied:        ${formatNotApplied.length} ${formatNotApplied.length > 0 ? '⚠️' : '✅'}`);
console.log(`   Title Generation Failures:  ${titleGenerationFailed} ${titleGenerationFailed > 0 ? '❌' : '✅'}`);
console.log(`   Suspicious Normalizations:  ${suspiciousNormalizations.length} ${suspiciousNormalizations.length > 0 ? '⚠️' : '✅'}`);

const criticalIssues = schemaLookupFailed + titleGenerationFailed;
const warnings = formatNotApplied.length + suspiciousNormalizations.length;

console.log('\n' + '═'.repeat(70) + '\n');

if (criticalIssues > 0) {
  console.log(`🚨 CRITICAL: ${criticalIssues} issue(s) found that BLOCK title generation!\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`⚠️  WARNING: ${warnings} issue(s) found that may affect title quality.\n`);
  process.exit(0);
} else {
  console.log('✅ ALL CHECKS PASSED - Title system is working correctly!\n');
  process.exit(0);
}
