#!/usr/bin/env node
/**
 * Audit category-type-mapping.json against actual types.json from Salesforce
 * Identifies mismatches, missing IDs, and wrong type names
 */

const fs = require('fs');
const path = require('path');

const typesPath = path.join(__dirname, '../src/config/salesforce-picklists/types.json');
const mappingPath = path.join(__dirname, '../src/config/salesforce-picklists/category-type-mapping.json');

const types = JSON.parse(fs.readFileSync(typesPath, 'utf8'));
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

// Build lookup maps
const typesByName = new Map();
const typesById = new Map();

types.forEach(type => {
  typesByName.set(type.type_name.toLowerCase(), type);
  if (type.type_id) {
    typesById.set(type.type_id, type);
  }
});

let totalTypes = 0;
let correctMatches = 0;
let wrongId = 0;
let wrongName = 0;
let missingInSalesforce = 0;
let nullIdButExists = 0;

const issues = [];

mapping.mappings.forEach(categoryMapping => {
  categoryMapping.types.forEach(mappedType => {
    totalTypes++;
    
    const sfType = typesByName.get(mappedType.type_name.toLowerCase());
    
    if (!sfType) {
      // Type doesn't exist in Salesforce at all
      missingInSalesforce++;
      issues.push({
        category: categoryMapping.category_name,
        type_name: mappedType.type_name,
        issue: 'MISSING_FROM_SALESFORCE',
        mapped_id: mappedType.type_id,
        mapped_status: mappedType.status
      });
    } else {
      // Type exists in Salesforce
      if (mappedType.type_id === null) {
        nullIdButExists++;
        issues.push({
          category: categoryMapping.category_name,
          type_name: mappedType.type_name,
          issue: 'NULL_ID_BUT_EXISTS',
          should_be_id: sfType.type_id,
          should_be_status: 'existing'
        });
      } else if (mappedType.type_id !== sfType.type_id) {
        wrongId++;
        issues.push({
          category: categoryMapping.category_name,
          type_name: mappedType.type_name,
          issue: 'WRONG_ID',
          mapped_id: mappedType.type_id,
          correct_id: sfType.type_id
        });
      } else {
        // ID matches!
        correctMatches++;
      }
    }
  });
});

console.log('\n=== TYPE MAPPING AUDIT RESULTS ===\n');
console.log(`Total types in category-type-mapping.json: ${totalTypes}`);
console.log(`Total types in Salesforce types.json: ${types.length}`);
console.log('');
console.log(`✅ Correct matches: ${correctMatches} (${((correctMatches/totalTypes)*100).toFixed(1)}%)`);
console.log(`❌ Wrong ID: ${wrongId}`);
console.log(`❌ Wrong name: ${wrongName}`);
console.log(`⚠️  Null ID but exists in SF: ${nullIdButExists}`);
console.log(`🔴 Missing from Salesforce: ${missingInSalesforce}`);
console.log('');

if (issues.length > 0) {
  console.log('=== ISSUES BREAKDOWN ===\n');
  
  const byIssueType = {};
  issues.forEach(issue => {
    if (!byIssueType[issue.issue]) {
      byIssueType[issue.issue] = [];
    }
    byIssueType[issue.issue].push(issue);
  });
  
  Object.keys(byIssueType).sort().forEach(issueType => {
    console.log(`\n${issueType}: ${byIssueType[issueType].length} issues`);
    byIssueType[issueType].slice(0, 5).forEach(issue => {
      console.log(`  - ${issue.category} → ${issue.type_name}`);
      if (issue.should_be_id) {
        console.log(`    Fix: Set type_id="${issue.should_be_id}", status="existing"`);
      } else if (issue.correct_id) {
        console.log(`    Fix: Change ID from "${issue.mapped_id}" to "${issue.correct_id}"`);
      }
    });
    if (byIssueType[issueType].length > 5) {
      console.log(`  ... and ${byIssueType[issueType].length - 5} more`);
    }
  });
}

console.log('\n');
process.exit(issues.length > 0 ? 1 : 0);
