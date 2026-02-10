/**
 * COMPREHENSIVE TYPE MAPPING AUDIT
 * 
 * Compares category-type-mapping.json against types.json picklist
 * Identifies mismatched IDs, incorrect statuses, and missing types
 */

const categoryTypeMappings = require('../src/config/salesforce-picklists/category-type-mapping.json');
const typesPicklist = require('../src/config/salesforce-picklists/types.json');

// Build lookup map from types picklist
const typesByName = {};
const typesById = {};
typesPicklist.forEach(type => {
  typesByName[type.type_name.toLowerCase()] = type;
  typesById[type.type_id] = type;
});

console.log('='.repeat(80));
console.log('TYPE MAPPING AUDIT - Checking category-type-mapping.json against types.json');
console.log('='.repeat(80));
console.log('');

let totalMismatches = 0;
let totalMissing = 0;
let totalCorrect = 0;
const fixes = [];

categoryTypeMappings.mappings.forEach(category => {
  const categoryIssues = [];
  
  category.types.forEach(typeMapping => {
    const typeName = typeMapping.type_name;
    const mappedId = typeMapping.type_id;
    const mappedStatus = typeMapping.status;
    
    // Check if type exists in picklist
    const picklistType = typesByName[typeName.toLowerCase()];
    
    if (!picklistType) {
      // Type doesn't exist in picklist
      if (mappedStatus === 'existing') {
        categoryIssues.push({
          type: 'MISMATCH',
          typeName,
          issue: 'Status "existing" but type not found in picklist',
          mapped_id: mappedId,
          should_be: 'status: new_needed'
        });
        totalMismatches++;
        
        fixes.push({
          category: category.category_name,
          type_name: typeName,
          field: 'status',
          current: mappedStatus,
          correct: 'new_needed'
        });
      } else if (mappedId !== null) {
        categoryIssues.push({
          type: 'MISMATCH',
          typeName,
          issue: 'Has type_id but type not found in picklist',
          mapped_id: mappedId,
          should_be: 'type_id: null'
        });
        totalMismatches++;
        
        fixes.push({
          category: category.category_name,
          type_name: typeName,
          field: 'type_id',
          current: mappedId,
          correct: null
        });
      } else {
        totalMissing++;
      }
    } else {
      // Type exists in picklist
      if (mappedId !== picklistType.type_id) {
        categoryIssues.push({
          type: 'WRONG_ID',
          typeName,
          issue: 'Type ID mismatch',
          mapped_id: mappedId,
          correct_id: picklistType.type_id,
          should_be: `type_id: "${picklistType.type_id}"`
        });
        totalMismatches++;
        
        fixes.push({
          category: category.category_name,
          type_name: typeName,
          field: 'type_id',
          current: mappedId,
          correct: picklistType.type_id
        });
      }
      
      if (mappedStatus !== 'existing') {
        categoryIssues.push({
          type: 'WRONG_STATUS',
          typeName,
          issue: 'Status should be "existing"',
          mapped_status: mappedStatus,
          should_be: 'status: existing'
        });
        totalMismatches++;
        
        fixes.push({
          category: category.category_name,
          type_name: typeName,
          field: 'status',
          current: mappedStatus,
          correct: 'existing'
        });
      }
      
      if (mappedId === picklistType.type_id && mappedStatus === 'existing') {
        totalCorrect++;
      }
    }
  });
  
  if (categoryIssues.length > 0) {
    console.log(`\n❌ ${category.category_name} (${category.department_name})`);
    categoryIssues.forEach(issue => {
      console.log(`   🔴 ${issue.typeName}:`);
      console.log(`      Issue: ${issue.issue}`);
      if (issue.mapped_id !== undefined) {
        console.log(`      Mapped ID: ${issue.mapped_id || 'null'}`);
      }
      if (issue.correct_id) {
        console.log(`      Correct ID: ${issue.correct_id}`);
      }
      console.log(`      Fix: ${issue.should_be}`);
    });
  }
});

console.log('\n' + '='.repeat(80));
console.log('SUMMARY:');
console.log(`✅ Correct mappings: ${totalCorrect}`);
console.log(`❌ Mismatched IDs/Status: ${totalMismatches}`);
console.log(`⚠️  Missing from picklist (marked new_needed): ${totalMissing}`);
console.log('='.repeat(80));

if (fixes.length > 0) {
  console.log('\nFIXES NEEDED:');
  console.log(JSON.stringify(fixes, null, 2));
}

process.exit(totalMismatches > 0 ? 1 : 0);
