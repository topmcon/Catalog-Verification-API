#!/usr/bin/env node
/**
 * Validate Hardcoded Lists Against Source Picklists
 * 
 * This script validates that all hardcoded category/brand/style lists
 * are in sync with the authoritative source picklists from Salesforce.
 * 
 * Run before deployments to catch drift:
 *   node scripts/validate-picklist-sync.js
 * 
 * Exit codes:
 *   0 = All lists in sync
 *   1 = Discrepancies found (will block deploy)
 */

const fs = require('fs');
const path = require('path');

const PICKLIST_DIR = path.join(__dirname, '../src/config/salesforce-picklists');
const SERVICES_DIR = path.join(__dirname, '../src/services');

// ANSI colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

// Load source picklists
function loadPicklists() {
  return {
    categories: JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'categories.json'), 'utf-8')),
    brands: JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'brands.json'), 'utf-8')),
    styles: JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'styles.json'), 'utf-8')),
  };
}

// Build lookup sets from picklists
function buildLookups(picklists) {
  return {
    categoryNames: new Set(picklists.categories.map(c => c.category_name.toLowerCase())),
    brandNames: new Set(picklists.brands.map(b => b.brand_name.toLowerCase())),
    styleNames: new Set(picklists.styles.map(s => s.style_name.toLowerCase())),
  };
}

// Check if value exists in source (various forms)
function existsInSource(value, sourceSet) {
  const normalized = value.toLowerCase().trim();
  if (sourceSet.has(normalized)) return true;
  // Try without trailing #
  if (sourceSet.has(normalized.replace(/\s*#$/, ''))) return true;
  // Try singular form
  if (sourceSet.has(normalized.replace(/s$/, ''))) return true;
  // Try with 's' suffix
  if (sourceSet.has(normalized + 's')) return true;
  return false;
}

// Extract hardcoded values from a file using regex
function extractHardcodedValues(filePath, patterns) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const results = [];
  
  for (const pattern of patterns) {
    const match = content.match(pattern.regex);
    if (match) {
      const values = match[1].match(/'([^']+)'/g) || [];
      for (const v of values) {
        const cleanValue = v.replace(/'/g, '');
        results.push({
          list: pattern.name,
          value: cleanValue,
          file: path.basename(filePath)
        });
      }
    }
  }
  
  return results;
}

// Validate all hardcoded lists
function validateAllLists() {
  console.log('='.repeat(60));
  console.log('PICKLIST SYNC VALIDATION');
  console.log('='.repeat(60));
  console.log('');
  
  const picklists = loadPicklists();
  const lookups = buildLookups(picklists);
  
  console.log(`Source picklists loaded:`);
  console.log(`  - ${picklists.categories.length} categories`);
  console.log(`  - ${picklists.brands.length} brands`);
  console.log(`  - ${picklists.styles.length} styles`);
  console.log('');
  
  const errors = [];
  const warnings = [];
  
  // Skip these values - they're department names or special values
  const skipValues = new Set([
    'appliances', 'plumbing & bath', 'lighting', 'home decor & fixtures', 
    'hvac', 'home decor', 'major appliances', 'specialty appliances',
    'kitchen', 'bathroom', 'from categories.json', 'from categories.json (singular forms)'
  ]);
  
  // Files and patterns to validate
  const validations = [
    {
      file: path.join(SERVICES_DIR, 'category-matcher.service.ts'),
      patterns: [
        { name: 'DEPARTMENT_CATEGORIES', regex: /const DEPARTMENT_CATEGORIES[\s\S]*?=\s*\{([\s\S]*?)\};/ },
      ],
      lookup: 'categoryNames',
      type: 'category'
    },
    {
      file: path.join(SERVICES_DIR, 'dual-ai-verification.service.ts'),
      patterns: [
        { name: 'LIGHTING_CATEGORIES', regex: /const LIGHTING_CATEGORIES = \[([\s\S]*?)\];/ },
        { name: 'SHOWER_PLUMBING_CATEGORIES', regex: /const SHOWER_PLUMBING_CATEGORIES = \[([\s\S]*?)\];/ },
      ],
      lookup: 'categoryNames',
      type: 'category'
    },
  ];
  
  for (const validation of validations) {
    if (!fs.existsSync(validation.file)) {
      warnings.push(`File not found: ${validation.file}`);
      continue;
    }
    
    const extracted = extractHardcodedValues(validation.file, validation.patterns);
    const lookup = lookups[validation.lookup];
    
    for (const item of extracted) {
      if (skipValues.has(item.value.toLowerCase())) continue;
      
      if (!existsInSource(item.value, lookup)) {
        errors.push({
          file: item.file,
          list: item.list,
          value: item.value,
          type: validation.type
        });
      }
    }
  }
  
  // Report results
  console.log('='.repeat(60));
  console.log('VALIDATION RESULTS');
  console.log('='.repeat(60));
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`${GREEN}✅ All hardcoded lists are in sync with source picklists!${RESET}`);
    console.log('');
    return 0;
  }
  
  if (warnings.length > 0) {
    console.log(`${YELLOW}Warnings:${RESET}`);
    for (const w of warnings) {
      console.log(`  ⚠️  ${w}`);
    }
    console.log('');
  }
  
  if (errors.length > 0) {
    console.log(`${RED}Errors (${errors.length} values not found in source picklists):${RESET}`);
    console.log('');
    
    // Group by file/list
    const grouped = {};
    for (const e of errors) {
      const key = `${e.file} → ${e.list}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e.value);
    }
    
    for (const [key, values] of Object.entries(grouped)) {
      console.log(`  ${RED}❌ ${key}${RESET}`);
      for (const v of values) {
        console.log(`     - "${v}"`);
      }
      console.log('');
    }
    
    console.log(`${RED}Fix these discrepancies before deploying.${RESET}`);
    console.log('Run: node scripts/sync-hardcoded-from-picklists.js');
    console.log('');
    return 1;
  }
  
  return 0;
}

// Run validation
const exitCode = validateAllLists();
process.exit(exitCode);
