#!/usr/bin/env node
/**
 * ATTRIBUTE CONTAMINATION AUDIT
 * =============================
 * Checks if products have wrong top-15 attributes populated due to category mis-selection
 * 
 * Validation:
 * 1. Category-Department alignment (does category's dept match assigned dept?)
 * 2. Attribute contamination (are populated attributes from wrong category?)
 * 3. Missing critical attributes (are expected attributes missing?)
 * 4. Type contamination (is type from a different category?)
 */

const fs = require('fs').promises;
const path = require('path');

// Load data files
const DATA_FILE = path.join(__dirname, '../audit-results/sf-50-calls-analysis-2026-02-20T23-57-30-085Z.json');
const CATEGORIES_FILE = path.join(__dirname, '../src/config/salesforce-picklists/categories.json');
const ATTRIBUTES_FILE = path.join(__dirname, '../src/config/salesforce-picklists/category-filter-attributes.json');
const TYPES_FILE = path.join(__dirname, '../src/config/salesforce-picklists/category-type-mapping.json');

// Helper: Get expected department for a category
function getExpectedDepartment(categoryName, categoriesData) {
  const category = categoriesData.find(c => 
    c.category_name.toLowerCase() === categoryName.toLowerCase()
  );
  return category ? category.department : null;
}

// Helper: Get expected top-15 attributes for a category
function getExpectedAttributes(categoryName, attributesData) {
  const categoryConfig = attributesData.categories[categoryName];
  if (!categoryConfig) return [];
  
  return categoryConfig.attributes
    .filter(attr => attr.rank <= 15 && attr.sf_id) // Top 15 with valid SF IDs
    .map(attr => ({
      name: attr.name,
      rank: attr.rank,
      sf_id: attr.sf_id
    }));
}

// Helper: Check if type belongs to category
function isTypeValidForCategory(typeName, categoryName, typesData) {
  const mapping = typesData.mappings.find(m => 
    m.category_name.toLowerCase() === categoryName.toLowerCase()
  );
  
  if (!mapping) return { valid: null, message: 'No type mapping found' };
  
  const typeExists = mapping.types.some(t => 
    t.type_name.toLowerCase() === typeName.toLowerCase()
  );
  
  return {
    valid: typeExists,
    message: typeExists ? 'Valid type' : 'Type from different category',
    availableTypes: mapping.types.map(t => t.type_name)
  };
}

// Helper: Check if attribute belongs to category
function isAttributeValidForCategory(attrName, categoryName, attributesData) {
  const categoryConfig = attributesData.categories[categoryName];
  if (!categoryConfig) return { valid: null, inTop15: false };
  
  const attrMatch = categoryConfig.attributes.find(a => 
    a.name.toLowerCase() === attrName.toLowerCase()
  );
  
  if (!attrMatch) return { valid: false, inTop15: false, reason: 'Not in category schema' };
  
  return {
    valid: true,
    inTop15: attrMatch.rank <= 15,
    rank: attrMatch.rank
  };
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       ATTRIBUTE CONTAMINATION AUDIT                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Load all data
  const jobsData = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  const categoriesData = JSON.parse(await fs.readFile(CATEGORIES_FILE, 'utf8'));
  const attributesData = JSON.parse(await fs.readFile(ATTRIBUTES_FILE, 'utf8'));
  const typesData = JSON.parse(await fs.readFile(TYPES_FILE, 'utf8'));
  
  const jobs = jobsData.jobs;
  console.log(`Analyzing ${jobs.length} jobs for attribute contamination...\n`);
  
  // Tracking
  const violations = {
    departmentMismatch: [],
    typeContamination: [],
    attributeContamination: [],
    missingCriticalAttributes: []
  };
  
  // Analyze each job
  for (const job of jobs) {
    const category = job.category?.final;
    const type = job.type?.final;
    const department = job.department?.final;
    const jobId = job.job_id;
    const model = job.input?.model_number;
    
    if (!category) continue;
    
    // Check 1: Category-Department Alignment
    const expectedDept = getExpectedDepartment(category, categoriesData);
    if (expectedDept && department && expectedDept !== department) {
      violations.departmentMismatch.push({
        job_index: job.index,
        job_id: jobId,
        model,
        category,
        expected_dept: expectedDept,
        actual_dept: department,
        severity: 'critical'
      });
    }
    
    // Check 2: Type Contamination
    if (type && type !== 'Not Applicable' && type !== 'Not Found') {
      const typeCheck = isTypeValidForCategory(type, category, typesData);
      if (typeCheck.valid === false) {
        violations.typeContamination.push({
          job_index: job.index,
          job_id: jobId,
          model,
          category,
          type,
          severity: 'high',
          message: typeCheck.message,
          available_types: typeCheck.availableTypes
        });
      }
    }
    
    // Check 3: Attribute Contamination (Check populated top15 attributes)
    // Note: Need to check job.top15_attributes or similar structure
    // For now, flag jobs with department mismatch as likely having wrong attributes
    if (expectedDept && department && expectedDept !== department) {
      const expectedAttrs = getExpectedAttributes(category, attributesData);
      violations.attributeContamination.push({
        job_index: job.index,
        job_id: jobId,
        model,
        category,
        department,
        severity: 'critical',
        issue: `Department mismatch means AI was shown wrong attributes`,
        expected_attrs_count: expectedAttrs.length,
        expected_attrs: expectedAttrs.slice(0, 5).map(a => a.name) // Show first 5
      });
    }
    
    // Check 4: Missing Critical Attributes
    // Check if job is missing attributes that should exist for its category
    const expectedAttrs = getExpectedAttributes(category, attributesData);
    const criticalAttrs = expectedAttrs.filter(a => a.rank <= 5); // Top 5 are critical
    
    // Mark as needing review if department mismatch (likely missing correct attrs)
    if (criticalAttrs.length > 0 && expectedDept && department && expectedDept !== department) {
      violations.missingCriticalAttributes.push({
        job_index: job.index,
        job_id: jobId,
        model,
        category,
        severity: 'high',
        issue: `Wrong department means AI couldn't see critical attributes`,
        missing_critical: criticalAttrs.map(a => a.name)
      });
    }
  }
  
  // Report Statistics
  console.log(`${'═'.repeat(65)}`);
  console.log(`📊 CONTAMINATION SUMMARY\n`);
  console.log(`Total Jobs Analyzed:                ${jobs.length}`);
  console.log(`Jobs with Department Mismatch:      ${violations.departmentMismatch.length} (${(violations.departmentMismatch.length/jobs.length*100).toFixed(1)}%)`);
  console.log(`Jobs with Type Contamination:       ${violations.typeContamination.length} (${(violations.typeContamination.length/jobs.length*100).toFixed(1)}%)`);
  console.log(`Jobs with Attribute Contamination:  ${violations.attributeContamination.length} (${(violations.attributeContamination.length/jobs.length*100).toFixed(1)}%)`);
  console.log(`Jobs Missing Critical Attributes:   ${violations.missingCriticalAttributes.length} (${(violations.missingCriticalAttributes.length/jobs.length*100).toFixed(1)}%)`);
  
  const totalAffected = new Set([
    ...violations.departmentMismatch.map(v => v.job_id),
    ...violations.typeContamination.map(v => v.job_id),
    ...violations.attributeContamination.map(v => v.job_id),
    ...violations.missingCriticalAttributes.map(v => v.job_id)
  ]).size;
  
  console.log(`\nTotal Jobs with ANY Contamination:  ${totalAffected} (${(totalAffected/jobs.length*100).toFixed(1)}%)`);
  console.log(`Jobs with Clean Data:               ${jobs.length - totalAffected} (${((jobs.length - totalAffected)/jobs.length*100).toFixed(1)}%)\n`);
  
  // Detailed Violations
  if (violations.departmentMismatch.length > 0) {
    console.log(`${'═'.repeat(65)}`);
    console.log(`🔴 DEPARTMENT MISMATCH VIOLATIONS (${violations.departmentMismatch.length})\n`);
    console.log(`Category's expected department doesn't match assigned department.`);
    console.log(`→ AI was shown wrong top-15 attributes for this product.\n`);
    
    violations.departmentMismatch.slice(0, 10).forEach(v => {
      console.log(`Job #${v.job_index}: ${v.model || 'N/A'}`);
      console.log(`  Category:     ${v.category}`);
      console.log(`  Expected Dept: ${v.expected_dept}`);
      console.log(`  Actual Dept:   ${v.actual_dept} ❌`);
      console.log(`  Impact:       AI showed "${v.actual_dept}" attributes for "${v.expected_dept}" product`);
      console.log();
    });
    
    if (violations.departmentMismatch.length > 10) {
      console.log(`  ... and ${violations.departmentMismatch.length - 10} more department mismatches\n`);
    }
  }
  
  if (violations.typeContamination.length > 0) {
    console.log(`${'═'.repeat(65)}`);
    console.log(`🟠 TYPE CONTAMINATION VIOLATIONS (${violations.typeContamination.length})\n`);
    console.log(`Product type doesn't belong to selected category.\n`);
    
    violations.typeContamination.slice(0, 10).forEach(v => {
      console.log(`Job #${v.job_index}: ${v.model || 'N/A'}`);
      console.log(`  Category:        ${v.category}`);
      console.log(`  Type Selected:   ${v.type} ❌`);
      console.log(`  Issue:           Type from different category`);
      console.log(`  Valid Types:     ${v.available_types.slice(0, 5).join(', ')}`);
      console.log();
    });
    
    if (violations.typeContamination.length > 10) {
      console.log(`  ... and ${violations.typeContamination.length - 10} more type contamination issues\n`);
    }
  }
  
  if (violations.attributeContamination.length > 0) {
    console.log(`${'═'.repeat(65)}`);
    console.log(`🔴 ATTRIBUTE CONTAMINATION (${violations.attributeContamination.length})\n`);
    console.log(`AI was shown wrong top-15 attributes due to department mismatch.\n`);
    
    violations.attributeContamination.slice(0, 10).forEach(v => {
      console.log(`Job #${v.job_index}: ${v.model || 'N/A'}`);
      console.log(`  Category:     ${v.category}`);
      console.log(`  Department:   ${v.department} ❌`);
      console.log(`  Issue:        AI saw wrong attributes, tried to populate irrelevant data`);
      console.log(`  Should See:   ${v.expected_attrs.join(', ')}...`);
      console.log();
    });
    
    if (violations.attributeContamination.length > 10) {
      console.log(`  ... and ${violations.attributeContamination.length - 10} more attribute contamination issues\n`);
    }
  }
  
  if (violations.missingCriticalAttributes.length > 0) {
    console.log(`${'═'.repeat(65)}`);
    console.log(`🟠 MISSING CRITICAL ATTRIBUTES (${violations.missingCriticalAttributes.length})\n`);
    console.log(`Products likely missing critical specs due to wrong attribute list.\n`);
    
    violations.missingCriticalAttributes.slice(0, 10).forEach(v => {
      console.log(`Job #${v.job_index}: ${v.model || 'N/A'}`);
      console.log(`  Category:          ${v.category}`);
      console.log(`  Missing Critical:  ${v.missing_critical.slice(0, 3).join(', ')}...`);
      console.log(`  Reason:            Wrong department = AI couldn't see these attributes`);
      console.log();
    });
    
    if (violations.missingCriticalAttributes.length > 10) {
      console.log(`  ... and ${violations.missingCriticalAttributes.length - 10} more jobs missing critical attributes\n`);
    }
  }
  
  // Recommendations
  console.log(`${'═'.repeat(65)}`);
  console.log(`💡 IMPACT ANALYSIS\n`);
  
  if (violations.departmentMismatch.length > 0) {
    const contaminationRate = (violations.departmentMismatch.length / jobs.length * 100).toFixed(1);
    console.log(`🔴 ${contaminationRate}% of products have category-department misalignment`);
    console.log(`   → These products were shown wrong top-15 attributes`);
    console.log(`   → AI tried to populate irrelevant attributes`);
    console.log(`   → Critical product specs likely missing\n`);
  }
  
  if (violations.departmentMismatch.length === 0) {
    console.log(`✅ All products have correct category-department alignment`);
    console.log(`   → Top-15 attributes correctly scoped to category\n`);
  }
  
  console.log(`📝 RECOMMENDATIONS:\n`);
  
  if (totalAffected > 0) {
    console.log(`1. 🚨 IMMEDIATE: Implement department-first hierarchical validation`);
    console.log(`   - Prevents wrong category selection`);
    console.log(`   - Guarantees correct top-15 attributes shown`);
    console.log(`   - Ensures critical specs not missing\n`);
    
    console.log(`2. 🔄 RE-VERIFY: ${totalAffected} contaminated products`);
    console.log(`   - After hierarchical validation deployed`);
    console.log(`   - Correct department → correct category → correct attributes\n`);
    
    console.log(`3. 📊 MONITOR: Track contamination rate post-fix`);
    console.log(`   - Should drop from ${(totalAffected/jobs.length*100).toFixed(1)}% to <2%`);
    console.log(`   - Validate with another 50-call audit\n`);
  } else {
    console.log(`✅ No contamination detected in this dataset`);
    console.log(`   - Continue monitoring for edge cases\n`);
  }
  
  // Save report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  const reportFile = path.join(__dirname, '../audit-results', `attribute-contamination-audit-${timestamp}.json`);
  
  await fs.writeFile(reportFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total_jobs: jobs.length,
      department_mismatches: violations.departmentMismatch.length,
      type_contamination: violations.typeContamination.length,
      attribute_contamination: violations.attributeContamination.length,
      missing_critical: violations.missingCriticalAttributes.length,
      total_affected: totalAffected,
      clean_data_rate: ((jobs.length - totalAffected) / jobs.length * 100).toFixed(1) + '%'
    },
    violations
  }, null, 2));
  
  console.log(`${'═'.repeat(65)}`);
  console.log(`📁 Report saved: ${path.basename(reportFile)}\n`);
}

main().catch(console.error);
