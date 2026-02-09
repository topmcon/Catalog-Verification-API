#!/usr/bin/env node
/**
 * Regenerate Hardcoded TypeScript Lists from Source Picklists
 * 
 * This script reads the authoritative JSON picklists and regenerates
 * the hardcoded TypeScript constants to stay in sync.
 * 
 * Called automatically when Salesforce syncs picklists.
 * 
 * Usage: node scripts/regenerate-hardcoded-lists.js
 */

const fs = require('fs');
const path = require('path');

const PICKLIST_DIR = path.join(__dirname, '../src/config/salesforce-picklists');
const SERVICES_DIR = path.join(__dirname, '../src/services');
const CONFIG_DIR = path.join(__dirname, '../src/config');

// Load source picklists
function loadPicklists() {
  return {
    categories: JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'categories.json'), 'utf-8')),
    brands: JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'brands.json'), 'utf-8')),
    styles: JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'styles.json'), 'utf-8')),
  };
}

// Get categories by family
function getCategoriesByFamily(categories, families) {
  return categories
    .filter(c => families.some(f => (c.family || '').toLowerCase().includes(f.toLowerCase())))
    .map(c => c.category_name);
}

// Get categories matching keywords
function getCategoriesByKeywords(categories, keywords) {
  return categories
    .filter(c => keywords.some(k => c.category_name.toLowerCase().includes(k.toLowerCase())))
    .map(c => c.category_name);
}

// Generate LIGHTING_CATEGORIES array
function generateLightingCategories(categories) {
  const lightingKeywords = ['lighting', 'chandelier', 'pendant', 'sconce', 'light', 'lamp', 'flush', 'vanity'];
  const ceilingFanKeywords = ['ceiling fan', 'fan'];
  
  const lighting = getCategoriesByKeywords(categories, lightingKeywords);
  const fans = getCategoriesByKeywords(categories, ceilingFanKeywords);
  
  // Dedupe and filter relevant ones for aesthetic style blocking
  const relevant = [...new Set([...lighting, ...fans])].filter(c => {
    const lower = c.toLowerCase();
    // Exclude utility categories
    return !lower.includes('accessory') && 
           !lower.includes('bulb') && 
           !lower.includes('switch') &&
           !lower.includes('dimmer') &&
           !lower.includes('bath fan') &&
           !lower.includes('exhaust');
  });
  
  return relevant.slice(0, 20); // Top 20 most relevant
}

// Generate SHOWER_PLUMBING_CATEGORIES array
function generateShowerCategories(categories) {
  const showerKeywords = ['shower', 'tub and shower'];
  return getCategoriesByKeywords(categories, showerKeywords);
}

// Generate Appliances categories
function generateApplianceCategories(categories) {
  const majorAppliances = [
    'Refrigerator', 'Dishwasher', 'Range', 'Oven', 'Cooktop',
    'Microwave', 'Range Hood', 'Washer', 'Dryer', 'Freezer',
    'All in One Washer / Dryer'
  ];
  
  // Filter to only include categories that exist in source
  const categoryNames = new Set(categories.map(c => c.category_name));
  const valid = majorAppliances.filter(a => categoryNames.has(a));
  
  // Add specialty appliances from source
  const specialtyKeywords = ['icemaker', 'coffee', 'barbeque', 'disposal', 'refrigeration'];
  const specialty = getCategoriesByKeywords(categories, specialtyKeywords);
  
  return [...valid, ...specialty];
}

// Generate Plumbing categories
function generatePlumbingCategories(categories) {
  const plumbingKeywords = ['sink', 'faucet', 'toilet', 'bathtub', 'shower', 'bidet', 'bathroom'];
  return getCategoriesByKeywords(categories, plumbingKeywords)
    .filter(c => !c.toLowerCase().includes('lighting')); // Exclude bathroom lighting
}

// Update category-matcher.service.ts
function updateCategoryMatcher(categories) {
  const filePath = path.join(SERVICES_DIR, 'category-matcher.service.ts');
  let content = fs.readFileSync(filePath, 'utf-8');
  
  const appliances = generateApplianceCategories(categories);
  const plumbing = generatePlumbingCategories(categories);
  const lighting = generateLightingCategories(categories);
  
  // Build new DEPARTMENT_CATEGORIES
  const newDeptCategories = `// Department to categories mapping (comprehensive)
// AUTO-GENERATED FROM: src/config/salesforce-picklists/categories.json
// Last sync: ${new Date().toISOString().split('T')[0]}
const DEPARTMENT_CATEGORIES: Record<string, string[]> = {
  'Appliances': [
    ${appliances.map(c => `'${c}'`).join(',\n    ')}
  ],
  'Plumbing & Bath': [
    ${plumbing.slice(0, 15).map(c => `'${c}'`).join(',\n    ')}
  ],
  'Lighting': [
    ${lighting.map(c => `'${c}'`).join(',\n    ')}
  ],
  'Home Decor & Fixtures': [
    'Drawer', 'Cabinet Organization and Storage', 'Cabinet Hardware'
  ],
  'HVAC': [
    'Air Conditioner', 'Dehumidifier', 'Exhaust Fan', 'Attic Fan'
  ]
};`;

  // Replace existing DEPARTMENT_CATEGORIES block
  const deptRegex = /\/\/ Department to categories mapping[\s\S]*?const DEPARTMENT_CATEGORIES[\s\S]*?\};/;
  if (deptRegex.test(content)) {
    content = content.replace(deptRegex, newDeptCategories);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('✅ Updated category-matcher.service.ts DEPARTMENT_CATEGORIES');
    return true;
  } else {
    console.log('⚠️  Could not find DEPARTMENT_CATEGORIES in category-matcher.service.ts');
    return false;
  }
}

// Update dual-ai-verification.service.ts LIGHTING_CATEGORIES and SHOWER_PLUMBING_CATEGORIES
function updateDualAIVerification(categories) {
  const filePath = path.join(SERVICES_DIR, 'dual-ai-verification.service.ts');
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Check if these were already refactored to dynamic loading
  if (content.includes('REMOVED HARDCODED ARRAY - Now using getLightingCategories()') ||
      content.includes('isLightingCategoryFromMaster')) {
    console.log('✅ LIGHTING_CATEGORIES already uses dynamic loading from master JSON');
    console.log('✅ SHOWER_PLUMBING_CATEGORIES already uses dynamic loading from master JSON');
    console.log('   (No hardcoded arrays to update - categories loaded from category-type-style-mapping.json)');
    return true;
  }

  let updated = false;
  
  // Update LIGHTING_CATEGORIES (legacy hardcoded pattern)
  const lightingCats = generateLightingCategories(categories);
  const newLighting = `/**
 * Lighting categories where aesthetic styles should be avoided
 * AUTO-GENERATED FROM: src/config/salesforce-picklists/categories.json
 * Last sync: ${new Date().toISOString().split('T')[0]}
 */
const LIGHTING_CATEGORIES = [
  ${lightingCats.map(c => `'${c}'`).join(',\n  ')}
];`;

  const lightingRegex = /\/\*\*\s*\n\s*\* Lighting categories where aesthetic[\s\S]*?const LIGHTING_CATEGORIES = \[[\s\S]*?\];/;
  if (lightingRegex.test(content)) {
    content = content.replace(lightingRegex, newLighting);
    updated = true;
    console.log('✅ Updated LIGHTING_CATEGORIES');
  }
  
  // Update SHOWER_PLUMBING_CATEGORIES (legacy hardcoded pattern)
  const showerCats = generateShowerCategories(categories);
  const newShower = `/**
 * Shower/Plumbing categories where product types should be prioritized
 * AUTO-GENERATED FROM: src/config/salesforce-picklists/categories.json
 * Last sync: ${new Date().toISOString().split('T')[0]}
 */
const SHOWER_PLUMBING_CATEGORIES = [
  ${showerCats.map(c => `'${c}'`).join(',\n  ')}
];`;

  const showerRegex = /\/\*\*\s*\n\s*\* Shower\/Plumbing categories where[\s\S]*?const SHOWER_PLUMBING_CATEGORIES = \[[\s\S]*?\];/;
  if (showerRegex.test(content)) {
    content = content.replace(showerRegex, newShower);
    updated = true;
    console.log('✅ Updated SHOWER_PLUMBING_CATEGORIES');
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  
  return updated;
}

// Main regeneration function
function regenerateAll() {
  console.log('='.repeat(60));
  console.log('REGENERATING HARDCODED LISTS FROM SOURCE PICKLISTS');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    const picklists = loadPicklists();
    console.log(`Loaded: ${picklists.categories.length} categories, ${picklists.brands.length} brands`);
    console.log('');
    
    let success = true;
    
    // Update each file
    if (!updateCategoryMatcher(picklists.categories)) success = false;
    if (!updateDualAIVerification(picklists.categories)) success = false;
    
    console.log('');
    if (success) {
      console.log('✅ All hardcoded lists regenerated successfully');
      console.log('   Changes will be committed by auto-sync cron job');
    } else {
      console.log('⚠️  Some updates failed - manual intervention may be needed');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error regenerating lists:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  const success = regenerateAll();
  process.exit(success ? 0 : 1);
}

module.exports = { regenerateAll };
