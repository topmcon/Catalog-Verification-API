/**
 * Comprehensive Audit Script
 * Validates all verification results against Salesforce picklists
 * 
 * Run: node scripts/audit-all-results.js
 */

const fs = require('fs');
const path = require('path');

// Load picklists
const brandsPath = path.join(__dirname, '../src/config/salesforce-picklists/brands.json');
const categoriesPath = path.join(__dirname, '../src/config/salesforce-picklists/categories.json');
const stylesPath = path.join(__dirname, '../src/config/salesforce-picklists/styles.json');
const auditDataPath = path.join(__dirname, '../audit-results/audit-jobs-since-2-5-2026.json');

console.log('Loading picklists...');
const brands = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
const styles = JSON.parse(fs.readFileSync(stylesPath, 'utf8'));
const auditJobs = JSON.parse(fs.readFileSync(auditDataPath, 'utf8'));

// Create lookup maps
const brandNames = new Set(brands.map(b => b.brand_name?.toLowerCase()));
const brandIds = new Map(brands.map(b => [b.brand_name?.toLowerCase(), b.brand_id]));
const categoryNames = new Set(categories.map(c => c.category_name?.toLowerCase()));
const categoryIds = new Map(categories.map(c => [c.category_name?.toLowerCase(), c.category_id]));
const stylesByCategory = new Map();

// Build styles by category lookup
styles.forEach(s => {
  const catId = s.category_id;
  if (!stylesByCategory.has(catId)) {
    stylesByCategory.set(catId, new Set());
  }
  stylesByCategory.get(catId).add(s.style_name?.toLowerCase());
});

// All style names for general lookup
const allStyleNames = new Set(styles.map(s => s.style_name?.toLowerCase()));

console.log(`Loaded: ${brands.length} brands, ${categories.length} categories, ${styles.length} styles`);
console.log(`Auditing ${auditJobs.length} jobs...\n`);

// Audit results
const issues = {
  missingResult: [],
  invalidBrand: [],
  invalidBrandId: [],
  invalidCategory: [],
  invalidCategoryId: [],
  invalidStyle: [],
  styleNotForCategory: [],
  titleTooLong: [],
  titleHasFeatures: [],
  titleHasNotApplicable: [],
  missingFields: [],
  nonNumericDimensions: [],
  nonNumericMsrp: []
};

let totalAudited = 0;
let totalPassed = 0;

auditJobs.forEach((job, idx) => {
  const jobInfo = { jobId: job.jobId, sku: job.sfCatalogName, createdAt: job.createdAt };
  let hasIssue = false;
  
  if (!job.result || !job.result.Primary_Attributes) {
    issues.missingResult.push(jobInfo);
    return;
  }
  
  totalAudited++;
  const result = job.result.Primary_Attributes;
  
  // 1. Validate Brand
  if (result.Brand_Verified) {
    const brandLower = result.Brand_Verified.toLowerCase();
    if (!brandNames.has(brandLower)) {
      issues.invalidBrand.push({ ...jobInfo, value: result.Brand_Verified });
      hasIssue = true;
    } else {
      // Check Brand_Id matches
      const expectedId = brandIds.get(brandLower);
      if (result.Brand_Id && result.Brand_Id !== expectedId) {
        issues.invalidBrandId.push({ ...jobInfo, value: result.Brand_Verified, gotId: result.Brand_Id, expectedId });
        hasIssue = true;
      }
    }
  }
  
  // 2. Validate Category
  if (result.Category_Verified) {
    const catLower = result.Category_Verified.toLowerCase();
    if (!categoryNames.has(catLower)) {
      issues.invalidCategory.push({ ...jobInfo, value: result.Category_Verified });
      hasIssue = true;
    } else {
      // Check Category_Id matches
      const expectedId = categoryIds.get(catLower);
      if (result.Category_Id && result.Category_Id !== expectedId) {
        issues.invalidCategoryId.push({ ...jobInfo, value: result.Category_Verified, gotId: result.Category_Id, expectedId });
        hasIssue = true;
      }
    }
  }
  
  // 3. Validate Style exists
  if (result.Product_Style_Verified) {
    const styleLower = result.Product_Style_Verified.toLowerCase();
    if (!allStyleNames.has(styleLower)) {
      issues.invalidStyle.push({ ...jobInfo, value: result.Product_Style_Verified });
      hasIssue = true;
    } else {
      // Check if style is valid for this category
      const catId = result.Category_Id;
      if (catId && stylesByCategory.has(catId)) {
        const validStyles = stylesByCategory.get(catId);
        if (!validStyles.has(styleLower)) {
          issues.styleNotForCategory.push({ 
            ...jobInfo, 
            style: result.Product_Style_Verified, 
            category: result.Category_Verified 
          });
          hasIssue = true;
        }
      }
    }
  }
  
  // 4. Validate Title
  if (result.Product_Title_Verified) {
    const title = result.Product_Title_Verified;
    
    // Check length
    if (title.length > 80) {
      issues.titleTooLong.push({ ...jobInfo, length: title.length, title: title.substring(0, 100) });
      hasIssue = true;
    }
    
    // Check for features text
    const featurePatterns = [
      /easy to install/i, /energy efficient/i, /durable/i, /resistant/i,
      /limited warranty/i, /warranty/i, /easy clean/i, /low maintenance/i
    ];
    for (const pattern of featurePatterns) {
      if (pattern.test(title)) {
        issues.titleHasFeatures.push({ ...jobInfo, title, matchedPattern: pattern.toString() });
        hasIssue = true;
        break;
      }
    }
    
    // Check for Not Applicable
    if (/not applicable/i.test(title)) {
      issues.titleHasNotApplicable.push({ ...jobInfo, title });
      hasIssue = true;
    }
  }
  
  // 5. Check numeric fields
  const numericFields = ['Depth_Verified', 'Width_Verified', 'Height_Verified', 'Weight_Verified'];
  numericFields.forEach(field => {
    const val = result[field];
    if (val && val !== '' && isNaN(parseFloat(val))) {
      issues.nonNumericDimensions.push({ ...jobInfo, field, value: val });
      hasIssue = true;
    }
  });
  
  if (result.MSRP_Verified && result.MSRP_Verified !== '' && isNaN(parseFloat(result.MSRP_Verified))) {
    issues.nonNumericMsrp.push({ ...jobInfo, value: result.MSRP_Verified });
    hasIssue = true;
  }
  
  if (!hasIssue) {
    totalPassed++;
  }
});

// Print summary
console.log('═══════════════════════════════════════════════════════════════════');
console.log('                    AUDIT RESULTS SUMMARY');
console.log('═══════════════════════════════════════════════════════════════════\n');

console.log(`Total Jobs Analyzed: ${auditJobs.length}`);
console.log(`Jobs with Results: ${totalAudited}`);
console.log(`Jobs Passed All Checks: ${totalPassed}`);
console.log(`Jobs with Issues: ${totalAudited - totalPassed}`);
console.log(`Pass Rate: ${((totalPassed / totalAudited) * 100).toFixed(2)}%\n`);

console.log('─────────────────────────────────────────────────────────────────────');
console.log('ISSUE BREAKDOWN');
console.log('─────────────────────────────────────────────────────────────────────\n');

const issueTypes = [
  ['Missing Result', 'missingResult'],
  ['Invalid Brand (not in picklist)', 'invalidBrand'],
  ['Brand ID Mismatch', 'invalidBrandId'],
  ['Invalid Category (not in picklist)', 'invalidCategory'],
  ['Category ID Mismatch', 'invalidCategoryId'],
  ['Invalid Style (not in picklist)', 'invalidStyle'],
  ['Style Not Valid for Category', 'styleNotForCategory'],
  ['Title Too Long (>80 chars)', 'titleTooLong'],
  ['Title Has Features Text', 'titleHasFeatures'],
  ['Title Has "Not Applicable"', 'titleHasNotApplicable'],
  ['Non-Numeric Dimensions', 'nonNumericDimensions'],
  ['Non-Numeric MSRP', 'nonNumericMsrp']
];

issueTypes.forEach(([label, key]) => {
  const count = issues[key].length;
  const status = count === 0 ? '✅' : '❌';
  console.log(`${status} ${label}: ${count}`);
});

// Show sample issues for each type with issues
console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('                    DETAILED ISSUES');
console.log('═══════════════════════════════════════════════════════════════════\n');

issueTypes.forEach(([label, key]) => {
  if (issues[key].length > 0) {
    console.log(`\n── ${label} (${issues[key].length} total) ──`);
    console.log('Sample (first 5):');
    issues[key].slice(0, 5).forEach((issue, i) => {
      console.log(`  ${i+1}. SKU: ${issue.sku}`);
      if (issue.value) console.log(`     Value: "${issue.value}"`);
      if (issue.title) console.log(`     Title: "${issue.title}"`);
      if (issue.style) console.log(`     Style: "${issue.style}" | Category: "${issue.category}"`);
      if (issue.length) console.log(`     Length: ${issue.length} chars`);
      if (issue.field) console.log(`     Field: ${issue.field} = "${issue.value}"`);
    });
  }
});

// Save full report
const reportPath = path.join(__dirname, '../audit-results/AUDIT-REPORT-2026-02-08.json');
fs.writeFileSync(reportPath, JSON.stringify({
  summary: {
    totalJobs: auditJobs.length,
    totalAudited,
    totalPassed,
    passRate: ((totalPassed / totalAudited) * 100).toFixed(2) + '%',
    generatedAt: new Date().toISOString()
  },
  issueCounts: Object.fromEntries(issueTypes.map(([label, key]) => [key, issues[key].length])),
  issues
}, null, 2));

console.log(`\n\n📄 Full report saved to: audit-results/AUDIT-REPORT-2026-02-08.json`);
