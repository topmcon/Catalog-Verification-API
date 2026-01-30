/**
 * Clean styles.json - Remove 28 attribute-styles, keep 252 valid styles
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/config/salesforce-picklists/styles.json');
const backupPath = path.join(__dirname, '../src/config/salesforce-picklists/backups/styles.backup.' + Date.now());

// Read original (lines 1-1122)
const allContent = fs.readFileSync(filePath, 'utf-8');
const original = JSON.parse(allContent.split('\n').slice(0, 1122).join('\n'));

console.log('🧹 CLEANING STYLES.JSON\n');
console.log(`📊 Original: ${original.length} styles\n`);

// Create backup
fs.mkdirSync(path.dirname(backupPath), { recursive: true });
fs.writeFileSync(backupPath, allContent);
console.log(`✅ Backup created: ${path.basename(backupPath)}\n`);

// Styles to remove (attributes masquerading as styles)
const stylesToRemove = [
  'Gas', 'Electric', 'Induction',
  'Single Handle', 'Two Handle',
  'Single Bowl', 'Double Bowl', 'Single Sink', 'Double Sink',
  'Elongated', 'Round',
  'Soaking', 'Whirlpool', 'Air Bath',
  'Lever', 'Knob', 'Handle Set', 'Hinge', 'Strike Plate',
  'Accessory', 'Warming', 'Stainless Steel', 'Waterfall', 'Touchless', 'Doorless', 'ADA Compliant'
];

// Filter out the bad styles
const cleaned = original.filter(style => !stylesToRemove.includes(style.style_name));

console.log('❌ REMOVED STYLES (now attributes):');
const removed = original.filter(style => stylesToRemove.includes(style.style_name));
removed.forEach(s => {
  console.log(`   - ${s.style_name} (${s.style_id})`);
});

console.log(`\n📊 Removed: ${removed.length} styles`);
console.log(`✅ Remaining: ${cleaned.length} valid styles\n`);

// Write cleaned file
const cleanedJson = JSON.stringify(cleaned, null, 2);
fs.writeFileSync(filePath, cleanedJson + '\n');

console.log('✅ STYLES.JSON CLEANED!\n');
console.log('📋 Summary:');
console.log(`   Original:  ${original.length} styles`);
console.log(`   Removed:   ${removed.length} styles (attributes)`);
console.log(`   Final:     ${cleaned.length} styles`);
console.log(`   Reduction: ${((removed.length / original.length) * 100).toFixed(1)}%\n`);

console.log('🎯 Next Steps:');
console.log('   1. Commit changes to git');
console.log('   2. Deploy to production');
console.log('   3. Update Salesforce to deactivate removed styles');
console.log('   4. Remap products using removed styles to proper combinations\n');
