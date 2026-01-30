const fs = require('fs');
const orig = JSON.parse(fs.readFileSync('/workspaces/Catalog-Verification-API/src/config/salesforce-picklists/styles.json', 'utf-8').split('\n').slice(0, 1122).join('\n'));
const newData = JSON.parse(fs.readFileSync('/tmp/new-styles.json', 'utf-8'));

const origMap = new Map();
orig.forEach(s => origMap.set(s.style_id, s.style_name));

const newMap = new Map();
newData.forEach(s => newMap.set(s.style_id, s.style_name));

const missing = [];
orig.forEach(s => {
  if (!newMap.has(s.style_id)) {
    missing.push(s);
  }
});

console.log('🔍 CHECKING: Are the 107 missing styles the ones you intentionally removed?\n');

const shouldBeRemoved = [
  'Gas', 'Electric', 'Induction',
  'Single Handle', 'Two Handle',
  'Single Bowl', 'Double Bowl', 'Single Sink', 'Double Sink',
  'Elongated', 'Round',
  'Soaking', 'Whirlpool', 'Air Bath',
  'Lever', 'Knob', 'Handle Set', 'Hinge', 'Strike Plate',
  'Accessory', 'Warming', 'Stainless Steel', 'Waterfall', 'Touchless', 'Doorless', 'ADA Compliant'
];

const matchesCleanup = [];
const doesNotMatch = [];

missing.forEach(s => {
  if (shouldBeRemoved.includes(s.style_name)) {
    matchesCleanup.push(s);
  } else {
    doesNotMatch.push(s);
  }
});

console.log('✅ Missing styles that MATCH your cleanup list (good to remove):');
console.log(`   Count: ${matchesCleanup.length}\n`);
matchesCleanup.forEach(s => console.log(`   ✓ ${s.style_name}`));

console.log('\n' + '='.repeat(70));
console.log('⚠️  Missing styles that DO NOT match cleanup (would be LOST!):');
console.log('='.repeat(70));
console.log(`\n   Count: ${doesNotMatch.length}\n`);

if (doesNotMatch.length > 0) {
  const display = Math.min(doesNotMatch.length, 40);
  doesNotMatch.slice(0, display).forEach(s => {
    console.log(`   ❌ "${s.style_name}" (${s.style_id})`);
  });
  if (doesNotMatch.length > 40) {
    console.log(`\n   ... and ${doesNotMatch.length - 40} more`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('📊 SUMMARY:');
console.log('='.repeat(70));
console.log(`\nOriginal file: ${orig.length} styles`);
console.log(`Appended (cleaned): ${newData.length} styles`);
console.log(`\nMissing total: ${missing.length}`);
console.log(`  - Matches cleanup intent: ${matchesCleanup.length} ✅`);
console.log(`  - Valid styles lost: ${doesNotMatch.length} ⚠️`);

if (doesNotMatch.length > 0) {
  console.log('\n⚠️  WARNING: Your cleaned version is missing valid styles!');
  console.log('   These are NOT attributes - they are legitimate installation types.\n');
}
