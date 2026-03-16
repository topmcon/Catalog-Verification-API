#!/usr/bin/env node
/**
 * RUNTIME TITLE GENERATION VALIDATOR
 * Tests title generation with sample data for ALL categories with schemas
 * Catches runtime errors that static analysis misses
 */

const { CATEGORY_TITLE_SCHEMAS, getCategoryTitleSchema } = require('../dist/config/title-schema-by-category.js');
const { generateSEOTitle } = require('../dist/services/seo-title-generator.service.js');

// Sample test data covering all common fields
const sampleData = {
  brand: 'TEST_BRAND',
  modelNumber: 'TEST-MODEL-123',
  width: '24',
  height: '30',
  depth: '24',
  length: '60',
  totalCapacity: '28',
  btu: '50000',
  cfm: '600',
  gpm: '2.5',
  placeSettings: '16',
  numberOfBurners: '5',
  installationType: 'Built-In',
  style: 'Contemporary',
  finish: 'Stainless Steel',
  color: 'White',
  configuration: 'French Door',
  type: 'Top Control',
  mountType: 'Undermount'
};

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║       RUNTIME TITLE GENERATION VALIDATION TEST                 ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;
const failures = [];

// Get all category names from schemas
const categoryNames = Object.values(CATEGORY_TITLE_SCHEMAS).map(s => s.categoryName);

console.log(`Testing ${categoryNames.length} categories...\n`);

categoryNames.forEach(categoryName => {
  const testInput = {
    ...sampleData,
    category: categoryName
  };
  
  try {
    // Test 1: Schema lookup
    const schema = getCategoryTitleSchema(categoryName);
    if (!schema) {
      throw new Error('Schema not found - check getCategoryTitleSchema() normalization logic');
    }
    
    // Test 2: Title generation
    const title = generateSEOTitle(testInput);
    if (!title || title.length < 10) {
      throw new Error(`Generated title too short: "${title}"`);
    }
    
    // Test 3: Required fields present (case-insensitive — generator applies toTitleCase)
    if (!title.toLowerCase().includes(testInput.brand.toLowerCase())) {
      throw new Error(`Brand missing from title: "${title}"`);
    }
    if (!title.toLowerCase().includes(categoryName.toLowerCase())) {
      throw new Error(`Category missing from title: "${title}"`);
    }
    
    // Test 4: Check format templates applied (if applicable)
    const slotsWithFormats = schema.slots.filter(s => s.format);
    slotsWithFormats.forEach(slot => {
      const suffix = (slot.format || '').replace('{value}', '').trim();
      // Only check if we have test data for this attribute
      const hasTestData = testInput[slot.attribute.toLowerCase().replace(/[^a-z]/g, '')];
      if (suffix && hasTestData && suffix.length > 2) {
        // GPM, CFM, Place Setting, -Burner, etc.
        if (!title.includes(suffix) && slot.attribute !== 'Width (Inches)') {
          // Width handled by ATTRIBUTE_FORMATTERS, skip
          console.warn(`   ⚠️  ${categoryName}: Format "${suffix}" not in title (${slot.attribute})`);
        }
      }
    });
    
    passed++;
  } catch (error) {
    failed++;
    failures.push({
      category: categoryName,
      error: error.message
    });
  }
});

console.log(`\n${'─'.repeat(66)}\n`);
console.log('📊 RESULTS:\n');
console.log(`   ✅ Passed: ${passed}/${categoryNames.length}`);
console.log(`   ❌ Failed: ${failed}/${categoryNames.length}`);

if (failed > 0) {
  console.log(`\n🚨 FAILURES:\n`);
  failures.forEach(({ category, error }) => {
    console.log(`   ❌ ${category}`);
    console.log(`      ${error}\n`);
  });
  console.log('══════════════════════════════════════════════════════════════════\n');
  console.log('🚫 TITLE GENERATION TEST FAILED - DO NOT DEPLOY!\n');
  process.exit(1);
} else {
  console.log('\n══════════════════════════════════════════════════════════════════\n');
  console.log('✅ ALL TITLE GENERATION TESTS PASSED - Safe to deploy!\n');
  process.exit(0);
}
