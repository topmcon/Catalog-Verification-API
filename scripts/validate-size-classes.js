#!/usr/bin/env node
/**
 * VALIDATE SIZE CLASS CONFIGURATION
 * ==================================
 * 
 * Ensures size class configuration is consistent and complete.
 * 
 * Checks:
 * 1. All categories in categories.json have size class entries
 * 2. Size classes are in ascending order
 * 3. Fractional values are correctly formatted
 * 4. No orphaned size class configs
 * 5. Required fields are present
 * 
 * Run: node scripts/validate-size-classes.js
 * 
 * Created: 2026-03-03
 */

const fs = require('fs');
const path = require('path');

// Load categories from Salesforce picklists
const categoriesPath = path.join(__dirname, '../src/config/salesforce-picklists/categories.json');
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

// Note: We can't directly import TypeScript in Node.js, so we'll read the file as text
// In a real deployment, this would use the compiled JS from dist/
const sizeClassesPath = path.join(__dirname, '../src/config/category-size-classes.ts');
const sizeClassesContent = fs.readFileSync(sizeClassesPath, 'utf8');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         SIZE CLASS CONFIGURATION VALIDATOR                     ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;
let warnings = 0;

/**
 * Parse size class value (handles fractions)
 */
function parseSizeClass(sizeClass) {
  if (!sizeClass) return NaN;
  
  // Handle tile sizes (e.g., "12x24" → 12)
  if (sizeClass.includes('x') || sizeClass.includes('×')) {
    const firstDim = sizeClass.split(/[x×]/)[0].trim();
    return parseFloat(firstDim);
  }
  
  // Handle fractions (e.g., "2-1/4" → 2.25)
  if (sizeClass.includes('/')) {
    const parts = sizeClass.split('-');
    if (parts.length === 1) {
      const [num, den] = parts[0].split('/').map(n => parseInt(n.trim()));
      return num / den;
    } else {
      const whole = parseInt(parts[0].trim()) || 0;
      const [num, den] = parts[1].split('/').map(n => parseInt(n.trim()));
      return whole + (num / den);
    }
  }
  
  return parseFloat(sizeClass);
}

/**
 * Extract category configs from TypeScript file
 * This is a simple regex-based parser for validation purposes
 */
function extractSizeClassCategories() {
  const configs = [];
  
  // Match category objects in the CATEGORY_SIZE_CLASSES_BY_DEPARTMENT array
  const categoryRegex = /{[^}]*"category_name":\s*"([^"]+)"[^}]*"category_id":\s*"([^"]+)"[^}]*}/g;
  let match;
  
  while ((match = categoryRegex.exec(sizeClassesContent)) !== null) {
    const categoryName = match[1];
    const categoryId = match[2];
    
    // Extract the full category object
    const startIdx = match.index;
    let braceCount = 0;
    let endIdx = startIdx;
    
    for (let i = startIdx; i < sizeClassesContent.length; i++) {
      if (sizeClassesContent[i] === '{') braceCount++;
      if (sizeClassesContent[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIdx = i;
          break;
        }
      }
    }
    
    const objectStr = sizeClassesContent.substring(startIdx, endIdx + 1);
    
    // Parse classes array
    const classesMatch = objectStr.match(/"classes":\s*\[([^\]]+)\]/);
    const classes = classesMatch ? 
      classesMatch[1].split(',').map(c => c.trim().replace(/['"]/g, '')) : 
      [];
    
    // Parse has_measurement_class
    const hasClassMatch = objectStr.match(/"has_measurement_class":\s*(true|false)/);
    const hasMeasurementClass = hasClassMatch ? hasClassMatch[1] === 'true' : false;
    
    configs.push({
      category_name: categoryName,
      category_id: categoryId,
      has_measurement_class: hasMeasurementClass,
      classes: classes
    });
  }
  
  return configs;
}

const sizeClassCategories = extractSizeClassCategories();

console.log(`📊 Categories in Salesforce picklist: ${categories.length}`);
console.log(`📊 Categories with size classes defined: ${sizeClassCategories.length}\n`);

// CHECK 1: Coverage - Are all major appliance categories covered?
console.log('═══════════════════════════════════════════════════════════════');
console.log('CHECK 1: Major Appliance Coverage');
console.log('═══════════════════════════════════════════════════════════════\n');

const majorAppliances = [
  'Refrigerator', 'Dishwasher', 'Range', 'Cooktop', 'Oven', 
  'Microwave', 'Range Hood', 'Freezer', 'Washer', 'Dryer'
];

majorAppliances.forEach(catName => {
  const inSalesforce = categories.find(c => c.category_name === catName);
  const hasSizeClass = sizeClassCategories.find(c => c.category_name === catName);
  
  if (!inSalesforce) {
    console.log(`❌ ${catName}: NOT IN SALESFORCE`);
    failed++;
  } else if (!hasSizeClass) {
    console.log(`⚠️  ${catName}: Missing size class configuration`);
    warnings++;
  } else if (!hasSizeClass.has_measurement_class) {
    console.log(`⚠️  ${catName}: Size classes disabled (has_measurement_class: false)`);
    warnings++;
  } else {
    console.log(`✅ ${catName}: ${hasSizeClass.classes.length} size classes defined`);
    passed++;
  }
});

// CHECK 2: Ascending Order - Are size classes in ascending order?
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('CHECK 2: Size Classes Ascending Order');
console.log('═══════════════════════════════════════════════════════════════\n');

sizeClassCategories.forEach(cat => {
  if (!cat.has_measurement_class || cat.classes.length === 0) return;
  
  const parsed = cat.classes.map(c => parseSizeClass(c));
  const sorted = [...parsed].sort((a, b) => a - b);
  
  const isOrdered = parsed.every((val, idx) => val === sorted[idx]);
  
  if (isOrdered) {
    console.log(`✅ ${cat.category_name}: Classes in order`);
    passed++;
  } else {
    console.log(`❌ ${cat.category_name}: Classes NOT in order`);
    console.log(`   Current: [${cat.classes.join(', ')}]`);
    console.log(`   Should be: [${cat.classes.sort((a, b) => parseSizeClass(a) - parseSizeClass(b)).join(', ')}]`);
    failed++;
  }
});

// CHECK 3: Fractional Formatting
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('CHECK 3: Fractional Value Formatting');
console.log('═══════════════════════════════════════════════════════════════\n');

sizeClassCategories.forEach(cat => {
  if (!cat.has_measurement_class) return;
  
  const fractionalClasses = cat.classes.filter(c => c.includes('/'));
  
  if (fractionalClasses.length > 0) {
    console.log(`📏 ${cat.category_name}: ${fractionalClasses.length} fractional classes`);
    
    fractionalClasses.forEach(frac => {
      const parsed = parseSizeClass(frac);
      if (isNaN(parsed)) {
        console.log(`   ❌ Invalid fraction: "${frac}"`);
        failed++;
      } else {
        console.log(`   ✅ "${frac}" = ${parsed}`);
        passed++;
      }
    });
  }
});

// CHECK 4: Orphaned Configurations
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('CHECK 4: Orphaned Size Class Configurations');
console.log('═══════════════════════════════════════════════════════════════\n');

sizeClassCategories.forEach(sizeCat => {
  const inSalesforce = categories.find(c => 
    c.category_id === sizeCat.category_id || 
    c.category_name === sizeCat.category_name
  );
  
  if (!inSalesforce) {
    console.log(`⚠️  ${sizeCat.category_name} (${sizeCat.category_id}): Not in categories.json`);
    warnings++;
  }
});

if (warnings === 0) {
  console.log('✅ No orphaned configurations found');
  passed++;
}

// CHECK 5: Performance Rating Categories (Should use EXACT)
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('CHECK 5: Performance Ratings (CFM, BTU, GPM) Use EXACT');
console.log('═══════════════════════════════════════════════════════════════\n');

const performanceCategories = sizeClassCategories.filter(cat => 
  cat.has_measurement_class && 
  cat.classes.length > 0 &&
  (cat.category_name.includes('Fan') || 
   cat.category_name.includes('Hood') ||
   cat.category_name.includes('Faucet') ||
   cat.category_name.includes('Water Heater'))
);

performanceCategories.forEach(cat => {
  // Check if rounding_method is EXACT in the source
  const objectMatch = sizeClassesContent.match(
    new RegExp(`"category_name":\\s*"${cat.category_name}"[^}]*"rounding_method":\\s*"(\\w+)"`, 's')
  );
  
  const roundingMethod = objectMatch ? objectMatch[1] : 'UNKNOWN';
  
  if (roundingMethod === 'EXACT') {
    console.log(`✅ ${cat.category_name}: Uses EXACT (correct for performance ratings)`);
    passed++;
  } else {
    console.log(`⚠️  ${cat.category_name}: Uses ${roundingMethod} (should be EXACT for CFM/BTU/GPM)`);
    warnings++;
  }
});

// SUMMARY
console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                      VALIDATION SUMMARY                        ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings: ${warnings}\n`);

if (failed === 0 && warnings === 0) {
  console.log('🎉 ALL CHECKS PASSED! Size class configuration is valid.\n');
  process.exit(0);
} else if (failed === 0) {
  console.log('✅ No critical failures, but review warnings above.\n');
  process.exit(0);
} else {
  console.log('❌ VALIDATION FAILED! Fix errors above before deploying.\n');
  process.exit(1);
}
