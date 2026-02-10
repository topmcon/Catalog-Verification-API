/**
 * FIX ALL TYPE MAPPINGS
 * 
 * Automatically corrects ALL type IDs and statuses in category-type-mapping.json
 * by matching against actual types.json picklist from Salesforce
 */

const fs = require('fs');
const path = require('path');

const mappingPath = path.join(__dirname, '../src/config/salesforce-picklists/category-type-mapping.json');
const typesPath = path.join(__dirname, '../src/config/salesforce-picklists/types.json');

// Load both files
const categoryTypeMappings = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
const typesPicklist = JSON.parse(fs.readFileSync(typesPath, 'utf8'));

// Build lookup map from types picklist
const typesByName = {};
typesPicklist.forEach(type => {
  typesByName[type.type_name.toLowerCase()] = type;
});

console.log('='.repeat(80));
console.log('FIXING ALL TYPE MAPPINGS');
console.log('='.repeat(80));
console.log('');

let totalFixed = 0;
let totalAlreadyCorrect = 0;
let totalMissing = 0;

categoryTypeMappings.mappings.forEach(category => {
  let categoryChanges = 0;
  
  category.types.forEach(typeMapping => {
    const typeName = typeMapping.type_name;
    const picklistType = typesByName[typeName.toLowerCase()];
    
    if (!picklistType) {
      // Type doesn't exist in Salesforce - mark as new_needed
      if (typeMapping.status !== 'new_needed' || typeMapping.type_id !== null) {
        console.log(`⚠️  ${category.category_name} → ${typeName}: NOT IN SALESFORCE, marking new_needed`);
        typeMapping.status = 'new_needed';
        typeMapping.type_id = null;
        categoryChanges++;
        totalMissing++;
      }
    } else {
      // Type exists in Salesforce - update ID and status
      let changed = false;
      
      if (typeMapping.type_id !== picklistType.type_id) {
        console.log(`✏️  ${category.category_name} → ${typeName}:`);
        console.log(`   ID: ${typeMapping.type_id || 'null'} → ${picklistType.type_id}`);
        typeMapping.type_id = picklistType.type_id;
        changed = true;
      }
      
      if (typeMapping.status !== 'existing') {
        if (!changed) {
          console.log(`✏️  ${category.category_name} → ${typeName}:`);
        }
        console.log(`   Status: ${typeMapping.status} → existing`);
        typeMapping.status = 'existing';
        changed = true;
      }
      
      if (changed) {
        categoryChanges++;
        totalFixed++;
      } else {
        totalAlreadyCorrect++;
      }
    }
  });
  
  if (categoryChanges > 0) {
    console.log(`   ✅ ${category.category_name}: ${categoryChanges} types fixed\n`);
  }
});

// Create backup
const backupPath = mappingPath + `.backup.${Date.now()}`;
fs.copyFileSync(mappingPath, backupPath);
console.log(`\n📦 Backup created: ${backupPath}`);

// Write fixed file
fs.writeFileSync(mappingPath, JSON.stringify(categoryTypeMappings, null, 2));
console.log(`✅ Fixed file written: ${mappingPath}`);

console.log('\n' + '='.repeat(80));
console.log('SUMMARY:');
console.log(`✅ Already correct: ${totalAlreadyCorrect}`);
console.log(`✏️  Fixed: ${totalFixed}`);
console.log(`⚠️  Marked as new_needed (not in SF): ${totalMissing}`);
console.log(`📊 Total processed: ${totalAlreadyCorrect + totalFixed + totalMissing}`);
console.log('='.repeat(80));
console.log('\n🎉 All type mappings have been corrected!');
console.log('   Next step: git commit and deploy to production\n');
