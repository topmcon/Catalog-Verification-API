#!/usr/bin/env node
/**
 * Audit category-style-mapping.ts against actual styles.json from Salesforce
 * Identifies mismatches, missing IDs, and wrong style names
 */

const fs = require('fs');
const path = require('path');

const stylesPath = path.join(__dirname, '../src/config/salesforce-picklists/styles.json');
const mappingPath = path.join(__dirname, '../src/config/category-style-mapping.ts');

const styles = JSON.parse(fs.readFileSync(stylesPath, 'utf8'));

// Parse the TypeScript file to extract style mappings
const mappingContent = fs.readFileSync(mappingPath, 'utf8');

// Build lookup maps
const stylesByName = new Map();
const stylesById = new Map();

styles.forEach(style => {
  stylesByName.set(style.style_name.toLowerCase(), style);
  if (style.style_id) {
    stylesById.set(style.style_id, style);
  }
});

let totalStyles = 0;
let correctMatches = 0;
let wrongId = 0;
let nullIdButExists = 0;
let missingInSalesforce = 0;

const issues = [];

// Extract style mappings from TypeScript
const categoryMatches = mappingContent.matchAll(/'([^']+)':\s*{[^}]*values:\s*\[([\s\S]*?)\]/gm);

for (const match of categoryMatches) {
  const categoryName = match[1];
  const valuesBlock = match[2];
  
  // Extract individual style entries
  const styleMatches = valuesBlock.matchAll(/{\s*name:\s*'([^']+)',\s*style_id:\s*(?:'([^']+)'|null)/gm);
  
  for (const styleMatch of styleMatches) {
    const styleName = styleMatch[1];
    const mappedId = styleMatch[2] || null;
    totalStyles++;
    
    const sfStyle = stylesByName.get(styleName.toLowerCase());
    
    if (!sfStyle) {
      // Style doesn't exist in Salesforce at all
      missingInSalesforce++;
      issues.push({
        category: categoryName,
        style_name: styleName,
        issue: 'MISSING_FROM_SALESFORCE',
        mapped_id: mappedId
      });
    } else {
      // Style exists in Salesforce
      if (mappedId === null) {
        nullIdButExists++;
        issues.push({
          category: categoryName,
          style_name: styleName,
          issue: 'NULL_ID_BUT_EXISTS',
          should_be_id: sfStyle.style_id
        });
      } else if (mappedId !== sfStyle.style_id) {
        wrongId++;
        issues.push({
          category: categoryName,
          style_name: styleName,
          issue: 'WRONG_ID',
          mapped_id: mappedId,
          correct_id: sfStyle.style_id
        });
      } else {
        // ID matches!
        correctMatches++;
      }
    }
  }
}

console.log('\n=== STYLE MAPPING AUDIT RESULTS ===\n');
console.log(`Total styles in category-style-mapping.ts: ${totalStyles}`);
console.log(`Total styles in Salesforce styles.json: ${styles.length}`);
console.log('');
console.log(`✅ Correct matches: ${correctMatches} (${((correctMatches/totalStyles)*100).toFixed(1)}%)`);
console.log(`❌ Wrong ID: ${wrongId}`);
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
    byIssueType[issueType].slice(0, 10).forEach(issue => {
      console.log(`  - ${issue.category} → ${issue.style_name}`);
      if (issue.should_be_id) {
        console.log(`    Fix: Set style_id="${issue.should_be_id}", status="existing"`);
      } else if (issue.correct_id) {
        console.log(`    Fix: Change ID from "${issue.mapped_id}" to "${issue.correct_id}"`);
      }
    });
    if (byIssueType[issueType].length > 10) {
      console.log(`  ... and ${byIssueType[issueType].length - 10} more`);
    }
  });
}

console.log('\n');
process.exit(issues.length > 0 ? 1 : 0);
