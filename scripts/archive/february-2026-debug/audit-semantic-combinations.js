#!/usr/bin/env node
/**
 * SEMANTIC COMBINATION AUDIT
 * ==========================
 * Validates that category/type/style/department combinations make semantic sense
 * 
 * Checks:
 * 1. Lighting categories → Must be in Lighting department
 * 2. Hardware department → Should not contain lighting categories
 * 3. Type "Accessory" → Must be in appliance category
 * 4. Department alignment with category
 * 5. Type-Category coherence
 */

const fs = require('fs').promises;
const path = require('path');

// Load the 50-call data
const DATA_FILE = path.join(__dirname, '../audit-results/sf-50-calls-analysis-2026-02-20T23-57-30-085Z.json');

// Semantic Rules Engine
const LIGHTING_CATEGORIES = [
  'wall sconce', 'chandelier', 'pendant', 'ceiling light', 'ceiling fan',
  'track lighting', 'recessed lighting', 'under cabinet lighting', 'vanity light',
  'outdoor lighting', 'outdoor wall lights', 'bathroom lighting', 'range hood' // range hood is lighting-adjacent
];

const PLUMBING_CATEGORIES = [
  'faucet', 'shower', 'bathtub', 'toilet', 'sink', 'bathroom vanity',
  'bathroom mirror', 'bathroom hardware', 'drainage', 'water filter'
];

const APPLIANCE_CATEGORIES = [
  'refrigerator', 'range', 'oven', 'dishwasher', 'microwave', 'cooktop',
  'freezer', 'ice maker', 'garbage disposal', 'range hood', 'wine cooler',
  'ventilation', 'compactor'
];

const HARDWARE_CATEGORIES = [
  'door hardware', 'cabinet hardware', 'door', 'window', 'railing',
  'mailbox', 'house number', 'gate'
];

function checkLightingDepartmentRule(category, department) {
  const catLower = (category || '').toLowerCase();
  const isLighting = LIGHTING_CATEGORIES.some(lc => catLower.includes(lc));
  
  if (isLighting && department !== 'Lighting & Electrical') {
    return {
      violated: true,
      severity: 'high',
      rule: 'Lighting Category → Lighting Department',
      issue: `Category "${category}" appears to be lighting-related but Department is "${department}"`,
      suggestion: `Change Department to "Lighting & Electrical"`
    };
  }
  
  return { violated: false };
}

function checkHardwareConflictRule(category, department) {
  const catLower = (category || '').toLowerCase();
  const isLighting = LIGHTING_CATEGORIES.some(lc => catLower.includes(lc));
  const isHardwareDept = ['Hardware', 'Outdoor Hardware'].includes(department);
  
  if (isLighting && isHardwareDept) {
    return {
      violated: true,
      severity: 'critical',
      rule: 'Hardware Department should not contain lighting categories',
      issue: `Category "${category}" is lighting but Department is "${department}"`,
      suggestion: `This is likely a miscategorization - review product`
    };
  }
  
  return { violated: false };
}

function checkAccessoryTypeRule(type, category) {
  const isAccessory = (type || '').toLowerCase() === 'accessory';
  const catLower = (category || '').toLowerCase();
  const isApplianceCategory = APPLIANCE_CATEGORIES.some(ac => catLower.includes(ac));
  
  if (isAccessory && !isApplianceCategory) {
    return {
      violated: true,
      severity: 'high',
      rule: 'Type "Accessory" requires Appliance Category',
      issue: `Type "${type}" used for non-appliance category "${category}"`,
      suggestion: `Either change Category to the appliance this is foran, or change Type if not actually an accessory`
    };
  }
  
  return { violated: false };
}

function checkDepartmentCategoryAlignment(category, department) {
  const catLower = (category || '').toLowerCase();
  
  // Plumbing categories should be in Plumbing & Bath
  const isPlumbing = PLUMBING_CATEGORIES.some(pc => catLower.includes(pc));
  if (isPlumbing && department && department !== 'Plumbing & Bath') {
    return {
      violated: true,
      severity: 'medium',
      rule: 'Plumbing Category → Plumbing Department',
      issue: `Category "${category}" is plumbing but Department is "${department}"`,
      suggestion: `Change Department to "Plumbing & Bath"`
    };
  }
  
  // Appliance categories should be in Appliances
  const isAppliance = APPLIANCE_CATEGORIES.some(ac => catLower.includes(ac));
  if (isAppliance && department && department !== 'Appliances') {
    return {
      violated: true,
      severity: 'medium',
      rule: 'Appliance Category → Appliances Department',
      issue: `Category "${category}" is appliance but Department is "${department}"`,
      suggestion: `Change Department to "Appliances"`
    };
  }
  
  // Hardware categories should be in Hardware
  const isHardware = HARDWARE_CATEGORIES.some(hc => catLower.includes(hc));
  if (isHardware && department && !['Hardware', 'Plumbing & Bath'].includes(department)) {
    return {
      violated: true,
      severity: 'low',
      rule: 'Hardware Category → Hardware Department',
      issue: `Category "${category}" is hardware but Department is "${department}"`,
      suggestion: `Verify whether product is actually hardware or needs category correction`
    };
  }
  
  return { violated: false };
}

function checkCategoryTypeCoherence(category, type) {
  const catLower = (category || '').toLowerCase();
  const typeLower = (type || '').toLowerCase();
  
  // If category and type are exact duplicates, flag for review
  if (category === type) {
    return {
      violated: true,
      severity: 'low',
      rule: 'Category and Type should not be identical',
      issue: `Category "${category}" and Type "${type}" are the same value`,
      suggestion: `Verify if Type should be a more specific variation`
    };
  }
  
  // Lighting categories with plumbing-related types
  const isLighting = LIGHTING_CATEGORIES.some(lc => catLower.includes(lc));
const plumbingTypes = ['faucet', 'shower', 'bathtub', 'toilet'];
  if (isLighting && plumbingTypes.some(pt => typeLower.includes(pt))) {
    return {
      violated: true,
      severity: 'critical',
      rule: 'Category/Type must be from same product domain',
      issue: `Lighting category "${category}" has plumbing type "${type}"`,
      suggestion: `This is a data corruption - review product completely`
    };
  }
  
  return { violated: false };
}

function auditSemanticCombination(job) {
  const violations = [];
  
  const category = job.category.final;
  const type = job.type.final;
  const style = job.style.final;
  const department = job.department?.final;
  
  // Skip if essential fields are missing
  if (!category) return violations;
  
  // Apply all rules
  const rules = [
    checkLightingDepartmentRule(category, department),
    checkHardwareConflictRule(category, department),
    checkAccessoryTypeRule(type, category),
    checkDepartmentCategoryAlignment(category, department),
    checkCategoryTypeCoherence(category, type)
  ];
  
  rules.forEach(result => {
    if (result.violated) {
      violations.push({
        ...result,
        job_index: job.index,
        job_id: job.job_id,
        model: job.input.model_number,
        category,
        type,
        style,
        department
      });
    }
  });
  
  return violations;
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       SEMANTIC COMBINATION AUDIT                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Load data
  const dataRaw = await fs.readFile(DATA_FILE, 'utf8');
  const data = JSON.parse(dataRaw);
  const jobs = data.jobs;
  
  console.log(`Analyzing ${jobs.length} jobs for semantic combination issues...\n`);
  
  // Run audit
  const allViolations = [];
  jobs.forEach(job => {
    const violations = auditSemanticCombination(job);
    allViolations.push(...violations);
  });
  
  // Statistics
  const severityCounts = {
    critical: allViolations.filter(v => v.severity === 'critical').length,
    high: allViolations.filter(v => v.severity === 'high').length,
    medium: allViolations.filter(v => v.severity === 'medium').length,
    low: allViolations.filter(v => v.severity === 'low').length
  };
  
  const ruleViolations = {};
  allViolations.forEach(v => {
    ruleViolations[v.rule] = (ruleViolations[v.rule] || 0) + 1;
  });
  
  // Report
  console.log(`${'═'.repeat(65)}`);
  console.log(`📊 AUDIT SUMMARY\n`);
  console.log(`Total Jobs Analyzed:        ${jobs.length}`);
  console.log(`Jobs with Valid Combos:     ${jobs.length - new Set(allViolations.map(v => v.job_id)).size} (${((jobs.length - new Set(allViolations.map(v => v.job_id)).size)/jobs.length*100).toFixed(1)}%)`);
  console.log(`Jobs with Violations:       ${new Set(allViolations.map(v => v.job_id)).size} (${(new Set(allViolations.map(v => v.job_id)).size/jobs.length*100).toFixed(1)}%)`);
  console.log(`Total Violations:           ${allViolations.length}\n`);
  
  console.log(`${'═'.repeat(65)}`);
  console.log(`🚨 SEVERITY BREAKDOWN\n`);
  console.log(`🔴 Critical:  ${severityCounts.critical} (data corruption level)`);
  console.log(`🟠 High:      ${severityCounts.high} (incorrect categorization)`);
  console.log(`🟡 Medium:    ${severityCounts.medium} (alignment issues)`);
  console.log(`🟢 Low:       ${severityCounts.low} (minor inconsistencies)\n`);
  
  if (allViolations.length > 0) {
    console.log(`${'═'.repeat(65)}`);
    console.log(`📋 VIOLATIONS BY RULE\n`);
    Object.entries(ruleViolations)
      .sort((a, b) => b[1] - a[1])
      .forEach(([rule, count]) => {
        console.log(`${count.toString().padStart(3)}× ${rule}`);
      });
    
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`🔍 DETAILED VIOLATIONS\n`);
    
    // Group by severity
    ['critical', 'high', 'medium', 'low'].forEach(severity => {
      const violations = allViolations.filter(v => v.severity === severity);
      if (violations.length === 0) return;
      
      const icon = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[severity];
      console.log(`${icon} ${severity.toUpperCase()} SEVERITY (${violations.length} violations)\n`);
      
      violations.slice(0, 10).forEach(v => {
        console.log(`Job #${v.job_index}: ${v.model || 'N/A'}`);
        console.log(`  Rule:     ${v.rule}`);
        console.log(`  Issue:    ${v.issue}`);
        console.log(`  Current:  Category="${v.category}", Type="${v.type}", Dept="${v.department}"`);
        console.log(`  Fix:      ${v.suggestion}`);
        console.log();
      });
      
      if (violations.length > 10) {
        console.log(`  ... and ${violations.length - 10} more ${severity} violations\n`);
      }
    });
    
    console.log(`${'═'.repeat(65)}`);
    console.log(`💡 RECOMMENDATIONS\n`);
    
    if (severityCounts.critical > 0) {
      console.log(`🔴 IMMEDIATE ACTION REQUIRED:`);
      console.log(`   ${severityCounts.critical} critical violations indicate data corruption`);
      console.log(`   Review these products manually and re-verify\n`);
    }
    
    if (severityCounts.high > 0) {
      console.log(`🟠 HIGH PRIORITY:`);
      console.log(`   ${severityCounts.high} high-severity violations need correction`);
      console.log(`   Implement semantic validation rules to prevent future occurrences\n`);
    }
    
    if (severityCounts.medium > 0 || severityCounts.low > 0) {
      console.log(`🟡 LOWER PRIORITY:`);
      console.log(`   ${severityCounts.medium + severityCounts.low} alignment issues to address`);
      console.log(`   Consider adding warnings but may not require blocking\n`);
    }
    
    console.log(`📝 NEXT STEPS:`);
    console.log(`   1. Review all CRITICAL and HIGH violations`);
    console.log(`   2. Implement semantic validation in dual-ai-verification.service.ts`);
    console.log(`   3. Add combination checks after consensus building`);
    console.log(`   4. Re-run this audit after fixes deployed\n`);
    
  } else {
    console.log(`✅ No semantic combination violations detected!`);
    console.log(`   All category/type/style/department combinations appear coherent.\n`);
  }
  
  // Save report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  const reportFile = path.join(__dirname, '../audit-results', `semantic-combination-audit-${timestamp}.json`);
  
  await fs.writeFile(reportFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total_jobs: jobs.length,
      jobs_with_violations: new Set(allViolations.map(v => v.job_id)).size,
      total_violations: allViolations.length,
      severity_counts: severityCounts
    },
    rule_violations: ruleViolations,
    violations: allViolations
  }, null, 2));
  
  console.log(`${'═'.repeat(65)}`);
  console.log(`📁 Report saved: ${path.basename(reportFile)}\n`);
}

main().catch(console.error);
