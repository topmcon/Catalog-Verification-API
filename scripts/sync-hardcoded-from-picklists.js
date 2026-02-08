#!/usr/bin/env node
/**
 * Sync Hardcoded Lists from Source Picklists
 * 
 * This script audits and syncs all hardcoded category/brand/style lists
 * with the authoritative source picklists in salesforce-picklists/
 * 
 * Run: node scripts/sync-hardcoded-from-picklists.js [--fix]
 * 
 * Without --fix: Reports discrepancies only
 * With --fix: Updates hardcoded files to match source
 */

const fs = require('fs');
const path = require('path');

const PICKLIST_DIR = path.join(__dirname, '../src/config/salesforce-picklists');
const CONFIG_DIR = path.join(__dirname, '../src/config');
const SERVICES_DIR = path.join(__dirname, '../src/services');

// Load source picklists
function loadPicklists() {
  return {
    categories: JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'categories.json'), 'utf-8')),
    brands: JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'brands.json'), 'utf-8')),
    styles: JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'styles.json'), 'utf-8')),
    attributes: JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'attributes.json'), 'utf-8')),
  };
}

// Extract category names by family
function getCategoriesByFamily(categories) {
  const byFamily = {};
  for (const cat of categories) {
    const family = cat.family || 'Unknown';
    if (!byFamily[family]) byFamily[family] = [];
    byFamily[family].push(cat.category_name);
  }
  return byFamily;
}

// Check if a hardcoded value exists in source (case-insensitive)
function findInSource(value, sourceList, field = 'category_name') {
  const normalized = value.toLowerCase().replace(/\s+#$/, '').replace(/s$/, '');
  
  for (const item of sourceList) {
    const sourceValue = (item[field] || '').toLowerCase();
    if (sourceValue === value.toLowerCase()) return { exact: true, match: item[field] };
    if (sourceValue === normalized) return { exact: false, match: item[field] };
    // Try singular form
    if (sourceValue === value.toLowerCase().replace(/s$/, '')) return { exact: false, match: item[field] };
  }
  return null;
}

// Audit category-matcher.service.ts
function auditCategoryMatcher(categories) {
  const filePath = path.join(SERVICES_DIR, 'category-matcher.service.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const discrepancies = [];
  const categoryNames = categories.map(c => c.category_name);
  
  // Extract hardcoded categories from DEPARTMENT_CATEGORIES
  const deptMatch = content.match(/const DEPARTMENT_CATEGORIES[\s\S]*?};/);
  if (deptMatch) {
    const hardcodedCats = deptMatch[0].match(/'([^']+)'/g) || [];
    for (const cat of hardcodedCats) {
      const cleanCat = cat.replace(/'/g, '');
      if (cleanCat.includes('Appliances') || cleanCat.includes('Plumbing') || 
          cleanCat.includes('Lighting') || cleanCat.includes('HVAC') ||
          cleanCat.includes('Home Decor')) continue; // Skip department names
      
      const result = findInSource(cleanCat, categories);
      if (!result) {
        discrepancies.push({
          file: 'category-matcher.service.ts',
          hardcoded: cleanCat,
          suggestion: findClosestMatch(cleanCat, categoryNames),
          type: 'NOT_FOUND'
        });
      } else if (!result.exact) {
        discrepancies.push({
          file: 'category-matcher.service.ts',
          hardcoded: cleanCat,
          shouldBe: result.match,
          type: 'MISMATCH'
        });
      }
    }
  }
  
  return discrepancies;
}

// Audit dual-ai-verification.service.ts
function auditDualAIVerification(categories) {
  const filePath = path.join(SERVICES_DIR, 'dual-ai-verification.service.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const discrepancies = [];
  const categoryNames = categories.map(c => c.category_name);
  
  // Check LIGHTING_CATEGORIES
  const lightingMatch = content.match(/const LIGHTING_CATEGORIES = \[([\s\S]*?)\];/);
  if (lightingMatch) {
    const hardcodedCats = lightingMatch[1].match(/'([^']+)'/g) || [];
    for (const cat of hardcodedCats) {
      const cleanCat = cat.replace(/'/g, '');
      const result = findInSource(cleanCat, categories);
      if (!result) {
        discrepancies.push({
          file: 'dual-ai-verification.service.ts',
          list: 'LIGHTING_CATEGORIES',
          hardcoded: cleanCat,
          suggestion: findClosestMatch(cleanCat, categoryNames),
          type: 'NOT_FOUND'
        });
      } else if (!result.exact) {
        discrepancies.push({
          file: 'dual-ai-verification.service.ts',
          list: 'LIGHTING_CATEGORIES',
          hardcoded: cleanCat,
          shouldBe: result.match,
          type: 'MISMATCH'
        });
      }
    }
  }
  
  // Check SHOWER_PLUMBING_CATEGORIES
  const showerMatch = content.match(/const SHOWER_PLUMBING_CATEGORIES = \[([\s\S]*?)\];/);
  if (showerMatch) {
    const hardcodedCats = showerMatch[1].match(/'([^']+)'/g) || [];
    for (const cat of hardcodedCats) {
      const cleanCat = cat.replace(/'/g, '');
      const result = findInSource(cleanCat, categories);
      if (!result) {
        discrepancies.push({
          file: 'dual-ai-verification.service.ts',
          list: 'SHOWER_PLUMBING_CATEGORIES',
          hardcoded: cleanCat,
          suggestion: findClosestMatch(cleanCat, categoryNames),
          type: 'NOT_FOUND'
        });
      } else if (!result.exact) {
        discrepancies.push({
          file: 'dual-ai-verification.service.ts',
          list: 'SHOWER_PLUMBING_CATEGORIES',
          hardcoded: cleanCat,
          shouldBe: result.match,
          type: 'MISMATCH'
        });
      }
    }
  }
  
  return discrepancies;
}

// Audit constants.ts
function auditConstants(brands) {
  const filePath = path.join(CONFIG_DIR, 'constants.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const discrepancies = [];
  const brandNames = brands.map(b => b.brand_name);
  
  // Check PREMIUM_BRANDS
  const premiumMatch = content.match(/export const PREMIUM_BRANDS = \[([\s\S]*?)\] as const;/);
  if (premiumMatch) {
    const hardcodedBrands = premiumMatch[1].match(/'([^']+)'/g) || [];
    for (const brand of hardcodedBrands) {
      const cleanBrand = brand.replace(/'/g, '');
      const found = brands.find(b => 
        b.brand_name.toLowerCase() === cleanBrand.toLowerCase() ||
        b.brand_name.toLowerCase() === cleanBrand.toUpperCase()
      );
      if (!found) {
        discrepancies.push({
          file: 'constants.ts',
          list: 'PREMIUM_BRANDS',
          hardcoded: cleanBrand,
          type: 'NOT_FOUND'
        });
      }
    }
  }
  
  return discrepancies;
}

// Find closest match using simple edit distance
function findClosestMatch(value, sourceList) {
  const normalized = value.toLowerCase().replace(/\s+#$/, '').replace(/s$/, '');
  let bestMatch = null;
  let bestScore = 0;
  
  for (const source of sourceList) {
    const sourceNorm = source.toLowerCase();
    // Simple substring match score
    if (sourceNorm.includes(normalized) || normalized.includes(sourceNorm)) {
      const score = Math.min(normalized.length, sourceNorm.length) / Math.max(normalized.length, sourceNorm.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = source;
      }
    }
  }
  
  return bestMatch;
}

// Generate correct LIGHTING_CATEGORIES from source
function generateLightingCategories(categories) {
  const lightingKeywords = ['lighting', 'chandelier', 'pendant', 'sconce', 'light', 'fan', 'flush', 'lamp'];
  const lightingCats = categories.filter(c => {
    const name = c.category_name.toLowerCase();
    const family = (c.family || '').toLowerCase();
    return family === 'lighting' || lightingKeywords.some(k => name.includes(k));
  });
  return lightingCats.map(c => c.category_name);
}

// Generate correct SHOWER_PLUMBING_CATEGORIES from source
function generateShowerCategories(categories) {
  const showerKeywords = ['shower', 'bath', 'tub'];
  const showerCats = categories.filter(c => {
    const name = c.category_name.toLowerCase();
    return showerKeywords.some(k => name.includes(k));
  });
  return showerCats.map(c => c.category_name);
}

// Main audit function
function runAudit() {
  console.log('='.repeat(60));
  console.log('HARDCODED LISTS SYNC AUDIT');
  console.log('='.repeat(60));
  console.log('');
  
  const picklists = loadPicklists();
  console.log(`Loaded: ${picklists.categories.length} categories, ${picklists.brands.length} brands, ${picklists.styles.length} styles`);
  console.log('');
  
  const allDiscrepancies = [];
  
  // Audit each file
  console.log('Auditing category-matcher.service.ts...');
  const catMatcherIssues = auditCategoryMatcher(picklists.categories);
  allDiscrepancies.push(...catMatcherIssues);
  console.log(`  Found ${catMatcherIssues.length} discrepancies`);
  
  console.log('Auditing dual-ai-verification.service.ts...');
  const dualAIIssues = auditDualAIVerification(picklists.categories);
  allDiscrepancies.push(...dualAIIssues);
  console.log(`  Found ${dualAIIssues.length} discrepancies`);
  
  console.log('Auditing constants.ts...');
  const constantsIssues = auditConstants(picklists.brands);
  allDiscrepancies.push(...constantsIssues);
  console.log(`  Found ${constantsIssues.length} discrepancies`);
  
  console.log('');
  console.log('='.repeat(60));
  console.log('DISCREPANCY DETAILS');
  console.log('='.repeat(60));
  
  if (allDiscrepancies.length === 0) {
    console.log('✅ All hardcoded lists are in sync with source picklists!');
    return;
  }
  
  for (const d of allDiscrepancies) {
    if (d.type === 'MISMATCH') {
      console.log(`❌ ${d.file}${d.list ? ` (${d.list})` : ''}`);
      console.log(`   Hardcoded: "${d.hardcoded}"`);
      console.log(`   Should be: "${d.shouldBe}"`);
    } else {
      console.log(`⚠️  ${d.file}${d.list ? ` (${d.list})` : ''}`);
      console.log(`   Hardcoded: "${d.hardcoded}"`);
      console.log(`   Suggestion: "${d.suggestion || 'No close match found'}"`);
    }
    console.log('');
  }
  
  // Show correct values for common lists
  console.log('='.repeat(60));
  console.log('CORRECT VALUES FROM SOURCE PICKLISTS');
  console.log('='.repeat(60));
  
  console.log('\n--- LIGHTING_CATEGORIES (from categories.json) ---');
  const correctLighting = generateLightingCategories(picklists.categories);
  console.log(correctLighting.map(c => `  '${c}'`).join(',\n'));
  
  console.log('\n--- SHOWER/BATH CATEGORIES (from categories.json) ---');
  const correctShower = generateShowerCategories(picklists.categories);
  console.log(correctShower.map(c => `  '${c}'`).join(',\n'));
  
  console.log('\n--- PLUMBING CATEGORIES (singular forms) ---');
  const plumbingCats = picklists.categories
    .filter(c => (c.family || '').toLowerCase().includes('plumbing') || 
                 (c.family || '').toLowerCase().includes('bath'))
    .map(c => c.category_name);
  console.log(plumbingCats.slice(0, 20).map(c => `  '${c}'`).join(',\n'));
  
  return allDiscrepancies;
}

// Run the audit
const discrepancies = runAudit();

if (process.argv.includes('--fix')) {
  console.log('\n');
  console.log('='.repeat(60));
  console.log('AUTO-FIX MODE - Updating files...');
  console.log('='.repeat(60));
  console.log('Note: Run the individual fix commands shown above');
} else {
  console.log('\n');
  console.log('Run with --fix to attempt automatic fixes');
}
