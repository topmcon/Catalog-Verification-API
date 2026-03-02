/**
 * Debug test to verify accessory subtype extraction patterns
 * Testing with actual failing titles from March 1, 2026
 */

const testTitles = [
  { model: 'RAC36AHLHSR', title: "36'' Column Panel Kit, Professional, Silver, Left", expected: "Panel Kit" },
  { model: 'TFL30IR800', title: "Door Panel", expected: "Door Panel" },
  { model: 'RAC18AMLHMS', title: "18IN. COLUMN MODERNIST GRAPHITE STAINL", expected: "Panel Kit" },
  { model: 'TFL18IR800', title: "Door panel, 202.9 x 45.1 cm, Stainless steel", expected: "Door Panel" },
  { model: 'JBBFR36NHL', title: "36\" BUILT-IN BOTTOM FREEZER PANEL KIT - RIGHT-SWING", expected: "Panel Kit" },
  { model: 'RA-F36DB333', title: "36\" Bespoke 3-Door French Door Refrigerator Panel - Bottom Panel", expected: "Panel" }
];

// Simplified version of extractAccessorySubtype patterns
const patterns = [
  { pattern: /panel\s+kit/i, displayName: 'Panel Kit' },
  { pattern: /door\s+panel/i, displayName: 'Door Panel' },
  { pattern: /refrigerator\s+panel/i, displayName: 'Refrigerator Panel' },
  { pattern: /panel/i, displayName: 'Panel' },
];

console.log('═══════════════════════════════════════════════════════════════');
console.log('         ACCESSORY SUBTYPE EXTRACTION DEBUG TEST              ');
console.log('═══════════════════════════════════════════════════════════════\n');

testTitles.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.model}`);
  console.log(`  Raw Title: "${test.title}"`);
  console.log(`  Expected: "${test.expected}"`);
  
  let matched = false;
  for (const { pattern, displayName } of patterns) {
    if (pattern.test(test.title)) {
      console.log(`  ✅ MATCHED: Pattern ${pattern} → "${displayName}"`);
      matched = true;
      if (displayName === test.expected) {
        console.log(`  ✅ CORRECT SUBTYPE EXTRACTED!\n`);
      } else {
        console.log(`  ⚠️  Extracted "${displayName}" but expected "${test.expected}"\n`);
      }
      break;
    }
  }
  
  if (!matched) {
    console.log(`  ❌ NO MATCH FOUND!`);
    console.log(`  🔍 Debugging: Manual pattern checks...`);
    console.log(`      - Contains "panel kit": ${test.title.toLowerCase().includes('panel kit')}`);
    console.log(`      - Contains "door panel": ${test.title.toLowerCase().includes('door panel')}`);
    console.log(`      - Contains "panel": ${test.title.toLowerCase().includes('panel')}\n`);
  }
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('                        DIAGNOSIS                              ');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('If patterns match here but NOT in production logs:');
console.log('  1. rawTitle field might be EMPTY or UNDEFINED in SEOTitleInput');
console.log('  2. extractAccessorySubtype() might not be called');
console.log('  3. TypeScript might not be compiled correctly\n');
console.log('Check production logs for:');
console.log('  - "Extracted accessory subtype" → Function worked');
console.log('  - "Could not extract accessory subtype" → Function tried but failed');
console.log('  - Neither message → Function not called (rawTitle empty?)\n');
