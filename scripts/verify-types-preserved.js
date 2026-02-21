#!/usr/bin/env node
/**
 * Verify Types Preserved - Ensure types.json still has required entries
 * Confirms we didn't accidentally delete type-level data
 */

const types = require('../src/config/salesforce-picklists/types.json');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║       VERIFY TYPES PRESERVED                                  ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const expectedTypes = [
  { name: 'Wine Cooler', id: 'a1jaZ000001lFDJQA2' },
  { name: 'Beverage Center', id: 'a1jaZ000001lF3gQAE' },
  { name: 'Outdoor Lighting', id: 'a1jaZ000001lF8uQAE' }
];

console.log('🔍 CHECKING CRITICAL TYPES:\n');

let allFound = true;

expectedTypes.forEach((expected, index) => {
  const found = types.find(t => t.type_name === expected.name);
  
  console.log(`${index + 1}. ${expected.name}`);
  
  if (found) {
    if (found.type_id === expected.id) {
      console.log(`   ✅ EXISTS with correct ID: ${expected.id}`);
    } else {
      console.log(`   ⚠️  EXISTS but ID mismatch!`);
      console.log(`   Expected: ${expected.id}`);
      console.log(`   Found: ${found.type_id}`);
      allFound = false;
    }
  } else {
    console.log(`   ❌ MISSING from types.json!`);
    allFound = false;
  }
  console.log('');
});

console.log('═══════════════════════════════════════════════════════════════');

if (allFound) {
  console.log('✅ SUCCESS: All 3 types preserved correctly');
  console.log('   These are now TYPES (not categories) as they should be');
  console.log('═══════════════════════════════════════════════════════════════');
  process.exit(0);
} else {
  console.log('❌ FAILURE: Some types missing or incorrect');
  console.log('   Manual investigation required');
  console.log('═══════════════════════════════════════════════════════════════');
  process.exit(1);
}
