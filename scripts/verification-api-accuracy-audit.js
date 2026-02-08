#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VERIFICATION API ACCURACY AUDIT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * Comprehensive audit of the last 300 unique verification API calls from Salesforce
 * to ensure all results sent back follow procedures and use correct picklist values.
 * 
 * WHAT IT CHECKS:
 * 1. Brand_Verified - Must exist in brands.json picklist
 * 2. Category_Verified - Must exist in categories.json picklist (singular form)
 * 3. SubCategory_Verified - Must match Category_Verified (singular form)
 * 4. Product_Style_Verified - Must exist in styles.json picklist
 * 5. Weight_Verified - Must be numeric only (no unit suffixes like "lbs")
 * 6. Numeric fields - Must be valid numbers (Depth, Width, Height, Capacity, MSRP)
 * 7. Product_Title_Verified - Must be 60-80 chars, no special chars at start
 * 8. Category_Id - Must match the category_id for the matched category
 * 9. Brand_Id - Must match the brand_id for the matched brand
 * 10. Style_Id - Must match the style_id for the matched style
 * 
 * USAGE:
 *   # Run on production server via SSH:
 *   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
 *     "cd /opt/catalog-verification-api && node scripts/verification-api-accuracy-audit.js"
 * 
 *   # Or run locally with production data:
 *   node scripts/verification-api-accuracy-audit.js
 * 
 * OUTPUT:
 * - Console summary with pass/fail rates
 * - Detailed breakdown by issue type
 * - Specific examples of each issue
 * - Recommendations for fixes
 * - JSON report saved to audit-results/
 * 
 * CREATED: 2026-02-08
 * BASED ON: Audit of 997 jobs from 2/5/2026-2/8/2026
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'catalog-verification';
const JOBS_COLLECTION = 'verification_jobs';
const UNIQUE_JOB_LIMIT = 300;

// Load Salesforce Picklists
const PICKLISTS_DIR = path.join(__dirname, '../src/config/salesforce-picklists');
let brands, categories, styles;

try {
  brands = JSON.parse(fs.readFileSync(path.join(PICKLISTS_DIR, 'brands.json'), 'utf8'));
  categories = JSON.parse(fs.readFileSync(path.join(PICKLISTS_DIR, 'categories.json'), 'utf8'));
  styles = JSON.parse(fs.readFileSync(path.join(PICKLISTS_DIR, 'styles.json'), 'utf8'));
} catch (e) {
  console.error('ERROR: Could not load picklist files from', PICKLISTS_DIR);
  console.error('Make sure you are running this from the project root directory.');
  process.exit(1);
}

// Build lookup sets for fast validation
const brandNames = new Set(brands.map(b => b.brand_name?.toLowerCase()));
const brandIdMap = new Map(brands.map(b => [b.brand_name?.toLowerCase(), b.brand_id]));
const categoryNames = new Set(categories.map(c => c.category_name?.toLowerCase()));
const categoryIdMap = new Map(categories.map(c => [c.category_name?.toLowerCase(), c.category_id]));
const styleNames = new Set(styles.map(s => s.style_name?.toLowerCase()));
const styleIdMap = new Map(styles.map(s => [s.style_name?.toLowerCase(), s.style_id]));

// Common plural patterns that indicate issues
const PLURAL_PATTERNS = [
  { plural: 'faucets', singular: 'faucet' },
  { plural: 'sinks', singular: 'sink' },
  { plural: 'toilets', singular: 'toilet' },
  { plural: 'showers', singular: 'shower' },
  { plural: 'tubs', singular: 'tub' },
  { plural: 'ranges', singular: 'range' },
  { plural: 'ovens', singular: 'oven' },
  { plural: 'refrigerators', singular: 'refrigerator' },
  { plural: 'dishwashers', singular: 'dishwasher' },
  { plural: 'washers', singular: 'washer' },
  { plural: 'dryers', singular: 'dryer' },
  { plural: 'lights', singular: 'light' },
  { plural: 'fans', singular: 'fan' },
  { plural: 'doors', singular: 'door' },
  { plural: 'windows', singular: 'window' },
  { plural: 'cabinets', singular: 'cabinet' },
  { plural: 'vanities', singular: 'vanity' },
  { plural: 'mirrors', singular: 'mirror' },
  { plural: 'accessories', singular: 'accessory' },
];

// Issue tracking structure
class AuditResult {
  constructor() {
    this.totalJobs = 0;
    this.uniqueProducts = new Set();
    this.passedJobs = 0;
    this.failedJobs = 0;
    this.issues = {
      brand: { count: 0, examples: [] },
      category: { count: 0, examples: [] },
      categoryPlural: { count: 0, examples: [] },
      subcategory: { count: 0, examples: [] },
      subcategoryPlural: { count: 0, examples: [] },
      subcategoryMismatch: { count: 0, examples: [] },
      style: { count: 0, examples: [] },
      weight: { count: 0, examples: [] },
      numericFields: { count: 0, examples: [] },
      title: { count: 0, examples: [] },
      categoryIdMismatch: { count: 0, examples: [] },
      brandIdMismatch: { count: 0, examples: [] },
      styleIdMismatch: { count: 0, examples: [] },
      duplicateCategoryWarning: { count: 0, examples: [] },
    };
    this.jobDetails = [];
    this.dateRange = { oldest: null, newest: null };
  }
}

/**
 * Check if a value looks like a plural form
 */
function isPluralForm(value) {
  if (!value) return false;
  const lower = value.toLowerCase();
  return PLURAL_PATTERNS.some(p => lower.endsWith(p.plural));
}

/**
 * Check if weight has unit suffix
 */
function hasWeightUnit(value) {
  if (!value) return false;
  const str = String(value);
  return /\s*(lbs?\.?|pounds?|kg|oz|ounces?)\s*$/i.test(str);
}

/**
 * Check if value is a valid number
 */
function isValidNumber(value) {
  if (!value || value === '') return true; // Empty is OK
  const num = parseFloat(String(value).replace(/[,$]/g, ''));
  return !isNaN(num);
}

/**
 * Validate a single job result
 */
function validateJob(job) {
  const result = job.result?.Primary_Attributes;
  if (!result) {
    return { valid: false, issues: ['No Primary_Attributes in result'] };
  }

  const issues = [];
  const warnings = [];

  // 1. BRAND VALIDATION
  const brandVerified = result.Brand_Verified;
  if (brandVerified) {
    const brandLower = brandVerified.toLowerCase();
    if (!brandNames.has(brandLower)) {
      issues.push({
        type: 'brand',
        field: 'Brand_Verified',
        value: brandVerified,
        message: `Brand "${brandVerified}" not found in picklist`
      });
    } else {
      // Check Brand_Id matches
      const expectedId = brandIdMap.get(brandLower);
      if (result.Brand_Id && result.Brand_Id !== expectedId) {
        issues.push({
          type: 'brandIdMismatch',
          field: 'Brand_Id',
          value: result.Brand_Id,
          expected: expectedId,
          message: `Brand_Id mismatch: got "${result.Brand_Id}", expected "${expectedId}"`
        });
      }
    }
  }

  // 2. CATEGORY VALIDATION
  const categoryVerified = result.Category_Verified;
  if (categoryVerified) {
    const categoryLower = categoryVerified.toLowerCase();
    
    // Check plural form
    if (isPluralForm(categoryVerified)) {
      issues.push({
        type: 'categoryPlural',
        field: 'Category_Verified',
        value: categoryVerified,
        message: `Category uses plural form: "${categoryVerified}"`
      });
    }
    
    // Check if in picklist
    if (!categoryNames.has(categoryLower)) {
      issues.push({
        type: 'category',
        field: 'Category_Verified',
        value: categoryVerified,
        message: `Category "${categoryVerified}" not found in picklist`
      });
    } else {
      // Check for duplicates in picklist
      const matchingCategories = categories.filter(c => 
        c.category_name?.toLowerCase() === categoryLower
      );
      if (matchingCategories.length > 1) {
        warnings.push({
          type: 'duplicateCategoryWarning',
          field: 'Category_Verified',
          value: categoryVerified,
          duplicates: matchingCategories.map(c => ({ 
            id: c.category_id, 
            department: c.department 
          })),
          message: `DUPLICATE CATEGORY: "${categoryVerified}" exists ${matchingCategories.length} times with different IDs`
        });
      }
      
      // Check Category_Id matches
      const expectedId = categoryIdMap.get(categoryLower);
      if (result.Category_Id && result.Category_Id !== expectedId) {
        // This might be due to duplicates - check if it matches ANY valid ID
        const validIds = matchingCategories.map(c => c.category_id);
        if (!validIds.includes(result.Category_Id)) {
          issues.push({
            type: 'categoryIdMismatch',
            field: 'Category_Id',
            value: result.Category_Id,
            expected: expectedId,
            message: `Category_Id mismatch: got "${result.Category_Id}", expected "${expectedId}"`
          });
        }
      }
    }
  }

  // 3. SUBCATEGORY VALIDATION
  const subcategoryVerified = result.SubCategory_Verified;
  if (subcategoryVerified) {
    // Check plural form
    if (isPluralForm(subcategoryVerified)) {
      issues.push({
        type: 'subcategoryPlural',
        field: 'SubCategory_Verified',
        value: subcategoryVerified,
        message: `SubCategory uses plural form: "${subcategoryVerified}"`
      });
    }
    
    // Check if matches Category (should be same after our fix)
    if (categoryVerified && subcategoryVerified.toLowerCase() !== categoryVerified.toLowerCase()) {
      issues.push({
        type: 'subcategoryMismatch',
        field: 'SubCategory_Verified',
        value: subcategoryVerified,
        expected: categoryVerified,
        message: `SubCategory "${subcategoryVerified}" doesn't match Category "${categoryVerified}"`
      });
    }
  }

  // 4. STYLE VALIDATION
  const styleVerified = result.Product_Style_Verified;
  if (styleVerified) {
    const styleLower = styleVerified.toLowerCase();
    if (!styleNames.has(styleLower)) {
      // Not critical - styles can be new/pending
      warnings.push({
        type: 'style',
        field: 'Product_Style_Verified',
        value: styleVerified,
        message: `Style "${styleVerified}" not in picklist (may be pending approval)`
      });
    } else {
      // Check Style_Id matches
      const expectedId = styleIdMap.get(styleLower);
      if (result.Style_Id && result.Style_Id !== expectedId) {
        issues.push({
          type: 'styleIdMismatch',
          field: 'Style_Id',
          value: result.Style_Id,
          expected: expectedId,
          message: `Style_Id mismatch: got "${result.Style_Id}", expected "${expectedId}"`
        });
      }
    }
  }

  // 5. WEIGHT VALIDATION
  const weightVerified = result.Weight_Verified;
  if (weightVerified && hasWeightUnit(weightVerified)) {
    issues.push({
      type: 'weight',
      field: 'Weight_Verified',
      value: weightVerified,
      message: `Weight has unit suffix: "${weightVerified}" (should be number only)`
    });
  }

  // 6. NUMERIC FIELD VALIDATION
  const numericFields = ['Depth_Verified', 'Width_Verified', 'Height_Verified', 'Capacity_Verified', 'MSRP_Verified'];
  for (const field of numericFields) {
    const value = result[field];
    if (value && !isValidNumber(value)) {
      issues.push({
        type: 'numericFields',
        field: field,
        value: value,
        message: `${field} is not a valid number: "${value}"`
      });
    }
  }

  // 7. TITLE VALIDATION
  const titleVerified = result.Product_Title_Verified;
  if (titleVerified) {
    const titleLength = titleVerified.length;
    if (titleLength < 60) {
      warnings.push({
        type: 'title',
        field: 'Product_Title_Verified',
        value: titleVerified,
        message: `Title too short (${titleLength} chars, should be 60-80): "${titleVerified.substring(0, 50)}..."`
      });
    } else if (titleLength > 85) {
      warnings.push({
        type: 'title',
        field: 'Product_Title_Verified',
        value: titleVerified,
        message: `Title too long (${titleLength} chars, should be 60-80)`
      });
    }
    
    // Check for encoding issues
    if (/^[^\w\s]/.test(titleVerified)) {
      issues.push({
        type: 'title',
        field: 'Product_Title_Verified',
        value: titleVerified.substring(0, 30),
        message: `Title starts with special character`
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings
  };
}

/**
 * Main audit function
 */
async function runAudit() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('                    VERIFICATION API ACCURACY AUDIT                            ');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Auditing: Last ${UNIQUE_JOB_LIMIT} unique API calls from Salesforce`);
  console.log('');

  const client = new MongoClient(MONGODB_URI);
  const audit = new AuditResult();

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(JOBS_COLLECTION);

    // Get completed jobs with results, sorted by most recent first
    const jobs = await collection.find({
      status: 'completed',
      'result.Primary_Attributes': { $exists: true }
    })
    .sort({ createdAt: -1 })
    .toArray();

    console.log(`✓ Found ${jobs.length} total completed jobs with results`);

    // Get unique products (by SF_Catalog_Name), taking the most recent for each
    const uniqueJobsMap = new Map();
    for (const job of jobs) {
      const productId = job.sfCatalogName || job.rawProductData?.SF_Catalog_Name;
      if (productId && !uniqueJobsMap.has(productId)) {
        uniqueJobsMap.set(productId, job);
        if (uniqueJobsMap.size >= UNIQUE_JOB_LIMIT) break;
      }
    }

    const uniqueJobs = Array.from(uniqueJobsMap.values());
    audit.totalJobs = uniqueJobs.length;

    console.log(`✓ Analyzing ${audit.totalJobs} unique products (most recent job per product)`);
    console.log('');

    // Track date range
    const dates = uniqueJobs.map(j => new Date(j.createdAt)).filter(d => !isNaN(d));
    if (dates.length > 0) {
      audit.dateRange.oldest = new Date(Math.min(...dates)).toISOString();
      audit.dateRange.newest = new Date(Math.max(...dates)).toISOString();
    }

    // Validate each job
    for (const job of uniqueJobs) {
      const productId = job.sfCatalogName || job.rawProductData?.SF_Catalog_Name;
      audit.uniqueProducts.add(productId);

      const validation = validateJob(job);
      
      const jobDetail = {
        jobId: job.jobId || job._id?.toString(),
        productId,
        createdAt: job.createdAt,
        passed: validation.valid,
        issueCount: validation.issues.length,
        warningCount: validation.warnings.length,
        issues: validation.issues,
        warnings: validation.warnings
      };
      
      audit.jobDetails.push(jobDetail);

      if (validation.valid) {
        audit.passedJobs++;
      } else {
        audit.failedJobs++;
        
        // Aggregate issues by type
        for (const issue of validation.issues) {
          const issueType = issue.type;
          if (audit.issues[issueType]) {
            audit.issues[issueType].count++;
            if (audit.issues[issueType].examples.length < 5) {
              audit.issues[issueType].examples.push({
                productId,
                jobId: jobDetail.jobId,
                ...issue
              });
            }
          }
        }
      }

      // Track warnings separately
      for (const warning of validation.warnings) {
        const warnType = warning.type;
        if (audit.issues[warnType]) {
          audit.issues[warnType].count++;
          if (audit.issues[warnType].examples.length < 5) {
            audit.issues[warnType].examples.push({
              productId,
              jobId: jobDetail.jobId,
              ...warning
            });
          }
        }
      }
    }

    // Calculate metrics
    const passRate = ((audit.passedJobs / audit.totalJobs) * 100).toFixed(1);
    const failRate = ((audit.failedJobs / audit.totalJobs) * 100).toFixed(1);

    // Generate Report
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                              AUDIT SUMMARY                                    ');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('');
    console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
    console.log(`│  Date Range:     ${audit.dateRange.oldest?.split('T')[0] || 'N/A'} to ${audit.dateRange.newest?.split('T')[0] || 'N/A'}                         │`);
    console.log(`│  Total Jobs:     ${String(audit.totalJobs).padEnd(10)} unique products                              │`);
    console.log(`│  Passed:         ${String(audit.passedJobs).padEnd(10)} (${passRate}%)                                     │`);
    console.log(`│  Failed:         ${String(audit.failedJobs).padEnd(10)} (${failRate}%)                                     │`);
    console.log('└─────────────────────────────────────────────────────────────────────────────┘');
    console.log('');

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                         ISSUES BY CATEGORY                                   ');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('');

    const issueCategories = [
      { key: 'brand', label: 'Brand Not in Picklist', severity: 'HIGH' },
      { key: 'category', label: 'Category Not in Picklist', severity: 'HIGH' },
      { key: 'categoryPlural', label: 'Category Uses Plural Form', severity: 'HIGH' },
      { key: 'subcategory', label: 'SubCategory Not in Picklist', severity: 'MEDIUM' },
      { key: 'subcategoryPlural', label: 'SubCategory Uses Plural Form', severity: 'HIGH' },
      { key: 'subcategoryMismatch', label: 'SubCategory ≠ Category', severity: 'MEDIUM' },
      { key: 'style', label: 'Style Not in Picklist', severity: 'LOW' },
      { key: 'weight', label: 'Weight Has Unit Suffix', severity: 'HIGH' },
      { key: 'numericFields', label: 'Invalid Numeric Values', severity: 'HIGH' },
      { key: 'title', label: 'Title Issues', severity: 'LOW' },
      { key: 'categoryIdMismatch', label: 'Category ID Mismatch', severity: 'HIGH' },
      { key: 'brandIdMismatch', label: 'Brand ID Mismatch', severity: 'HIGH' },
      { key: 'styleIdMismatch', label: 'Style ID Mismatch', severity: 'MEDIUM' },
      { key: 'duplicateCategoryWarning', label: 'Duplicate Category in Picklist', severity: 'WARNING' },
    ];

    let hasIssues = false;
    for (const cat of issueCategories) {
      const issue = audit.issues[cat.key];
      if (issue && issue.count > 0) {
        hasIssues = true;
        const severityIcon = cat.severity === 'HIGH' ? '🔴' : 
                            cat.severity === 'MEDIUM' ? '🟡' : 
                            cat.severity === 'WARNING' ? '⚠️' : '🟢';
        console.log(`${severityIcon} ${cat.label}: ${issue.count} occurrences`);
        
        if (issue.examples.length > 0) {
          console.log('   Examples:');
          for (const ex of issue.examples.slice(0, 3)) {
            console.log(`   - ${ex.productId}: ${ex.message}`);
          }
        }
        console.log('');
      }
    }

    if (!hasIssues) {
      console.log('✅ No issues found! All jobs passed validation.');
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                           RECOMMENDATIONS                                    ');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('');

    // Generate recommendations based on issues found
    if (audit.issues.categoryPlural.count > 0 || audit.issues.subcategoryPlural.count > 0) {
      console.log('📋 PLURAL FORMS DETECTED:');
      console.log('   - Check dual-ai-verification.service.ts lines ~5053-5058');
      console.log('   - SubCategory should use categoryMatch.matchedValue.category_name');
      console.log('   - Not AI consensus which may return plural forms');
      console.log('');
    }

    if (audit.issues.weight.count > 0) {
      console.log('📋 WEIGHT UNIT SUFFIXES:');
      console.log('   - Check dual-ai-verification.service.ts lines ~5206-5217');
      console.log('   - Weight should strip lbs/kg/oz suffixes before returning');
      console.log('   - Use regex: .replace(/\\s*(lbs?\\.?|pounds?|kg|oz)\\s*$/i, "")');
      console.log('');
    }

    if (audit.issues.duplicateCategoryWarning.count > 0) {
      console.log('📋 DUPLICATE CATEGORIES IN PICKLIST:');
      console.log('   - Check src/config/salesforce-picklists/categories.json');
      console.log('   - Some categories appear multiple times with different IDs');
      console.log('   - This causes inconsistent Category_Id assignment');
      console.log('   - Examples: "Outdoor Lighting" appears in multiple departments');
      console.log('');
    }

    if (audit.issues.categoryIdMismatch.count > 0) {
      console.log('📋 CATEGORY ID MISMATCHES:');
      console.log('   - Check picklist-matcher.service.ts line ~419');
      console.log('   - .find() returns FIRST match, which may be wrong for duplicates');
      console.log('   - Consider matching by department context as well');
      console.log('');
    }

    if (audit.issues.brand.count > 0) {
      console.log('📋 UNKNOWN BRANDS:');
      console.log('   - Some brands are not in the Salesforce picklist');
      console.log('   - May need to add new brands to brands.json');
      console.log('   - Or fix brand name normalization in picklist-matcher.service.ts');
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                            PICKLIST STATS                                    ');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('');
    console.log(`   Brands:     ${brands.length} entries`);
    console.log(`   Categories: ${categories.length} entries`);
    console.log(`   Styles:     ${styles.length} entries`);
    console.log('');

    // Check for duplicate categories
    const categoryDupes = {};
    for (const cat of categories) {
      const name = cat.category_name?.toLowerCase();
      if (name) {
        categoryDupes[name] = (categoryDupes[name] || 0) + 1;
      }
    }
    const duplicates = Object.entries(categoryDupes).filter(([k, v]) => v > 1);
    if (duplicates.length > 0) {
      console.log('   ⚠️  DUPLICATE CATEGORIES DETECTED:');
      for (const [name, count] of duplicates) {
        const entries = categories.filter(c => c.category_name?.toLowerCase() === name);
        console.log(`      "${name}" appears ${count} times:`);
        for (const e of entries) {
          console.log(`         - ID: ${e.category_id}, Dept: ${e.department}`);
        }
      }
      console.log('');
    }

    // Save report to file
    const reportPath = path.join(__dirname, '../audit-results', `ACCURACY-AUDIT-${new Date().toISOString().split('T')[0]}.json`);
    const report = {
      metadata: {
        reportName: 'Verification API Accuracy Audit',
        generatedAt: new Date().toISOString(),
        dateRange: audit.dateRange,
        totalJobsAudited: audit.totalJobs,
        uniqueProductsCount: audit.uniqueProducts.size,
      },
      summary: {
        passedJobs: audit.passedJobs,
        failedJobs: audit.failedJobs,
        passRate: parseFloat(passRate),
        failRate: parseFloat(failRate),
      },
      issueBreakdown: Object.fromEntries(
        issueCategories.map(cat => [cat.key, {
          label: cat.label,
          severity: cat.severity,
          count: audit.issues[cat.key]?.count || 0,
          examples: audit.issues[cat.key]?.examples || []
        }])
      ),
      picklists: {
        brands: brands.length,
        categories: categories.length,
        styles: styles.length,
        duplicateCategories: duplicates.map(([name, count]) => ({ name, count }))
      },
      jobDetails: audit.jobDetails.filter(j => !j.passed).slice(0, 50) // Only failed jobs, limit 50
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Full report saved to: ${reportPath}`);
    console.log('');

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                              AUDIT COMPLETE                                  ');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('');
    console.log(`   Pass Rate: ${passRate}%  |  Fail Rate: ${failRate}%`);
    console.log('');

    return audit;

  } catch (error) {
    console.error('ERROR during audit:', error.message);
    throw error;
  } finally {
    await client.close();
    console.log('✓ Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  runAudit()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runAudit, validateJob };
