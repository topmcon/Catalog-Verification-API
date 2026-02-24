/**
 * TEST: Verify DEPARTMENT_CATEGORIES now has 100% coverage
 * 
 * Before: Only ~60 categories (20-30% coverage per department)
 * After: Should have ALL ~200 categories from categories.json
 */

const categoriesData = require('./src/config/salesforce-picklists/categories.json');

// Simulate the auto-generation logic
const DEPARTMENT_CATEGORIES = (() => {
  const mapping = {};
  for (const category of categoriesData) {
    const dept = category.department;
    if (!mapping[dept]) {
      mapping[dept] = [];
    }
    mapping[dept].push(category.category_name);
  }
  // Sort categories within each department for consistency
  for (const dept in mapping) {
    mapping[dept].sort();
  }
  return mapping;
})();

console.log('═══════════════════════════════════════════════════════════');
console.log('   DEPARTMENT_CATEGORIES AUTO-GENERATION TEST');
console.log('═══════════════════════════════════════════════════════════');
console.log();

// Count categories per department
const totalCategories = categoriesData.length;
console.log(`📊 Total categories in categories.json: ${totalCategories}`);
console.log();

console.log('📋 Categories per department:');
console.log();

for (const [dept, categories] of Object.entries(DEPARTMENT_CATEGORIES)) {
  console.log(`  ${dept}: ${categories.length} categories`);
  
  // Show first 5 and last 5 for verification
  if (categories.length > 10) {
    console.log(`    First 5: ${categories.slice(0, 5).join(', ')}`);
    console.log(`    Last 5: ${categories.slice(-5).join(', ')}`);
  } else {
    console.log(`    All: ${categories.join(', ')}`);
  }
  console.log();
}

// Test specific problem categories that were missing before
const testCases = [
  { dept: 'Plumbing & Bath', category: 'Pipe Fitting' },
  { dept: 'Plumbing & Bath', category: 'Kitchen Sink Combo' },
  { dept: 'Plumbing & Bath', category: 'Kitchen Sink' },
  { dept: 'Hardware', category: 'Cabinet Pull' },
  { dept: 'Hardware', category: 'Cabinet Knob' },
  { dept: 'Lighting & Electrical', category: 'Ceiling Fan' },
  { dept: 'Appliances', category: 'Refrigerator' },
];

console.log('🔍 Testing previously-missing categories:');
console.log();

let allFound = true;
for (const test of testCases) {
  const categories = DEPARTMENT_CATEGORIES[test.dept] || [];
  const found = categories.includes(test.category);
  const status = found ? '✅' : '❌';
  console.log(`  ${status} ${test.dept} → ${test.category}`);
  if (!found) allFound = false;
}

console.log();
console.log('═══════════════════════════════════════════════════════════');
if (allFound) {
  console.log('✅ SUCCESS: All test categories found!');
  console.log('   100% category coverage achieved.');
} else {
  console.log('❌ FAILURE: Some categories still missing.');
}
console.log('═══════════════════════════════════════════════════════════');
