#!/usr/bin/env node
/**
 * TEST SIZE CLASS ROUNDING
 * =========================
 * 
 * Test the size class rounding logic with real examples.
 * This verifies the fix for the 47.25" → 48" refrigerator issue.
 * 
 * Run: node scripts/test-size-class-rounding.js
 * 
 * Created: 2026-03-03
 */

const path = require('path');

// Import compiled TypeScript (assuming npm run build was run)
const distPath = path.join(__dirname, '../dist');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║           SIZE CLASS ROUNDING - TEST SUITE                     ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('⚠️  NOTE: This test requires compiled TypeScript.');
console.log('   Run: npm run build');
console.log('   Before running this test.\n');

// Check if dist folder exists
const fs = require('fs');
if (!fs.existsSync(distPath)) {
  console.error('❌ dist/ folder not found. Please run: npm run build\n');
  process.exit(1);
}

try {
  // Load compiled modules
  const { getSizeClassConfig } = require(path.join(distPath, 'config/category-size-classes.js'));
  const { roundToStandardSize, parseSizeClass, formatSizeClass } = require(path.join(distPath, 'utils/size-class-rounder.js'));
  
  console.log('✅ Modules loaded successfully\n');
  
  // TEST SUITE
  const tests = [
    // REFRIGERATOR - The Original Issue
    {
      category: 'Refrigerator',
      actualWidth: 47.25,
      expectedRounded: 48,
      expectedDisplay: '48',
      description: 'KitchenAid KBSD708MSS (the reported issue)',
      installationType: 'Built-In'
    },
    {
      category: 'Refrigerator',
      actualWidth: 47.1,
      expectedRounded: 48,
      expectedDisplay: '48',
      description: 'Refrigerator slightly under 48"',
      installationType: 'Built-In'
    },
    {
      category: 'Refrigerator',
      actualWidth: 48.5,
      expectedRounded: 48,
      expectedDisplay: '48',
      description: 'Refrigerator slightly over 48" (should round down)',
      installationType: 'Built-In'
    },
    {
      category: 'Refrigerator',
      actualWidth: 35.5,
      expectedRounded: 36,
      expectedDisplay: '36',
      description: 'Refrigerator at 35.5" (equidistant)',
      installationType: 'Built-In'
    },
    {
      category: 'Refrigerator',
      actualWidth: 29.75,
      expectedRounded: 30,
      expectedDisplay: '30',
      description: 'Refrigerator close to 30"',
      installationType: 'Freestanding'
    },
    
    // DISHWASHER
    {
      category: 'Dishwasher',
      actualWidth: 23.8,
      expectedRounded: 24,
      expectedDisplay: '24',
      description: 'Standard dishwasher',
      installationType: 'Built-In'
    },
    {
      category: 'Dishwasher',
      actualWidth: 18.2,
      expectedRounded: 18,
      expectedDisplay: '18',
      description: 'Compact dishwasher',
      installationType: 'Built-In'
    },
    
    // RANGE
    {
      category: 'Range',
      actualWidth: 29.9,
      expectedRounded: 30,
      expectedDisplay: '30',
      description: 'Standard range',
      installationType: 'Freestanding'
    },
    {
      category: 'Range',
      actualWidth: 35.8,
      expectedRounded: 36,
      expectedDisplay: '36',
      description: 'Wide range',
      installationType: 'Slide-In'
    },
    
    // COOKTOP
    {
      category: 'Cooktop',
      actualWidth: 29.75,
      expectedRounded: 30,
      expectedDisplay: '30',
      description: 'Standard cooktop',
      installationType: 'Built-In'
    },
    {
      category: 'Cooktop',
      actualWidth: 36.25,
      expectedRounded: 36,
      expectedDisplay: '36',
      description: 'Wide cooktop',
      installationType: 'Built-In'
    },
    
    // OVEN
    {
      category: 'Oven',
      actualWidth: 26.8,
      expectedRounded: 27,
      expectedDisplay: '27',
      description: 'Wall oven',
      installationType: 'Built-In'
    },
    {
      category: 'Oven',
      actualWidth: 30.1,
      expectedRounded: 30,
      expectedDisplay: '30',
      description: 'Double wall oven',
      installationType: 'Built-In'
    }
  ];
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('RUNNING TESTS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach((test, idx) => {
    const config = getSizeClassConfig(test.category);
    
    if (!config) {
      console.log(`❌ TEST ${idx + 1}: ${test.description}`);
      console.log(`   Category "${test.category}" not found in configuration`);
      failed++;
      return;
    }
    
    const rounded = roundToStandardSize(test.actualWidth, config, test.installationType);
    const display = formatSizeClass(rounded, config.classes);
    
    const roundedMatch = rounded === test.expectedRounded;
    const displayMatch = display === test.expectedDisplay;
    
    if (roundedMatch && displayMatch) {
      console.log(`✅ TEST ${idx + 1}: ${test.description}`);
      console.log(`   ${test.actualWidth}" → ${rounded}" → "${display}-Inch"`);
      passed++;
    } else {
      console.log(`❌ TEST ${idx + 1}: ${test.description}`);
      console.log(`   Input: ${test.actualWidth}"`);
      console.log(`   Expected: ${test.expectedRounded}" → "${test.expectedDisplay}-Inch"`);
      console.log(`   Got: ${rounded}" → "${display}-Inch"`);
      console.log(`   Size classes: [${config.classes.join(', ')}]`);
      failed++;
    }
    console.log('');
  });
  
  // TEST FRACTIONAL PARSING (Hardwood Flooring)
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('FRACTIONAL VALUE TESTS (Hardwood Flooring)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const fractionTests = [
    { input: '2-1/4', expected: 2.25 },
    { input: '3-1/4', expected: 3.25 },
    { input: '4', expected: 4 },
    { input: '5', expected: 5 },
    { input: '6', expected: 6 }
  ];
  
  fractionTests.forEach(test => {
    const parsed = parseSizeClass(test.input);
    if (Math.abs(parsed - test.expected) < 0.01) {
      console.log(`✅ "${test.input}" → ${parsed}`);
      passed++;
    } else {
      console.log(`❌ "${test.input}" → ${parsed} (expected ${test.expected})`);
      failed++;
    }
  });
  
  // TEST EXACT METHOD (Performance Ratings)
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('EXACT METHOD TESTS (Performance Ratings - No Rounding)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const exactTests = [
    { category: 'Bath Fan', value: 385, expected: 385, description: 'Bath Fan CFM (should NOT round to 400)' },
    { category: 'Kitchen Faucet', value: 1.75, expected: 1.75, description: 'Faucet GPM (should NOT round to 1.8)' }
  ];
  
  exactTests.forEach(test => {
    const config = getSizeClassConfig(test.category);
    if (config) {
      const rounded = roundToStandardSize(test.value, config);
      if (rounded === test.expected) {
        console.log(`✅ ${test.description}`);
        console.log(`   ${test.value} → ${rounded} (EXACT - no rounding)`);
        passed++;
      } else {
        console.log(`❌ ${test.description}`);
        console.log(`   Expected: ${test.expected} (EXACT)`);
        console.log(`   Got: ${rounded}`);
        failed++;
      }
    } else {
      console.log(`⚠️  ${test.category} not yet in configuration`);
    }
    console.log('');
  });
  
  // SUMMARY
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                        TEST SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}\n`);
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Size class rounding is working correctly.\n');
    console.log('The 47.25" refrigerator issue is FIXED! ✅\n');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED! Review failures above.\n');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error loading modules:', error.message);
  console.error('\nMake sure you\'ve run: npm run build\n');
  process.exit(1);
}
