#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VERIFICATION FLOW AUDIT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Comprehensive audit of ALL verification flow components:
 * - JSON Picklist Files (source of truth)
 * - TypeScript Config Files (data loading)
 * - TypeScript Service Files (core logic)
 * - Hardcoded Constants and Aliases
 * - Function Load Chain Integrity
 * - Cross-Reference Validation
 * 
 * Run: node scripts/verification-flow-audit.js
 * 
 * This audit ensures that if ANY updates occur to picklists, ALL files
 * that use those picklists are also updated and in sync.
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const ROOT = path.join(__dirname, '..');
const PICKLIST_DIR = path.join(ROOT, 'src/config/salesforce-picklists');
const CONFIG_DIR = path.join(ROOT, 'src/config');
const SERVICES_DIR = path.join(ROOT, 'src/services');
const PICKLIST_MASTER_DIR = path.join(ROOT, 'src/picklist-master');

// Results tracking
const results = {
  passed: [],
  warnings: [],
  failed: [],
  stats: {}
};

function pass(category, message) {
  results.passed.push({ category, message });
}

function warn(category, message) {
  results.warnings.push({ category, message });
}

function fail(category, message) {
  results.failed.push({ category, message });
}

function stat(key, value) {
  results.stats[key] = value;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: JSON PICKLIST FILES VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(75));
console.log('   VERIFICATION FLOW AUDIT');
console.log('═'.repeat(75));
console.log(`\n📅 Timestamp: ${new Date().toISOString()}\n`);

console.log('━'.repeat(75));
console.log('SECTION 1: JSON PICKLIST FILES');
console.log('━'.repeat(75));

const REQUIRED_JSON_FILES = [
  { name: 'brands.json', requiredFields: ['brand_name', 'brand_id'] },
  { name: 'categories.json', requiredFields: ['category_name', 'category_id'] },
  { name: 'types.json', requiredFields: ['type_name', 'type_id'] },
  { name: 'styles.json', requiredFields: ['style_name', 'style_id'] },
  { name: 'attributes.json', requiredFields: ['attribute_name'] },
  { name: 'category-type-mapping.json', requiredFields: null, isMapping: true },
  { name: 'category-style-mapping.json', requiredFields: null, isMapping: true },
  { name: 'category-filter-attributes.json', requiredFields: null, isMapping: true },
  { name: 'departments.json', requiredFields: ['department_name'] },
  { name: 'families.json', requiredFields: ['family_name'] },
];

const picklists = {};

REQUIRED_JSON_FILES.forEach(({ name, requiredFields, isMapping }) => {
  const filePath = path.join(PICKLIST_DIR, name);
  
  if (!fs.existsSync(filePath)) {
    fail('JSON Files', `Missing: ${name}`);
    return;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    picklists[name] = data;
    
    if (isMapping) {
      // Special handling for mapping files
      if (name === 'category-type-mapping.json') {
        const mappings = data.mappings || data;
        stat(`${name} mappings`, Array.isArray(mappings) ? mappings.length : Object.keys(mappings).length);
        pass('JSON Files', `✓ ${name}: ${Array.isArray(mappings) ? mappings.length : Object.keys(mappings).length} mappings`);
      } else if (name === 'category-style-mapping.json') {
        stat(`${name} universal`, data.universal_styles?.length || 0);
        stat(`${name} category_specific`, data.category_specific_mappings?.length || 0);
        pass('JSON Files', `✓ ${name}: ${data.universal_styles?.length || 0} universal + ${data.category_specific_mappings?.length || 0} category-specific`);
      } else if (name === 'category-filter-attributes.json') {
        const count = Object.keys(data).length;
        stat(`${name} categories`, count);
        pass('JSON Files', `✓ ${name}: ${count} category schemas`);
      }
    } else {
      // Array picklist files
      if (!Array.isArray(data)) {
        fail('JSON Files', `${name}: Expected array, got ${typeof data}`);
        return;
      }
      
      stat(name.replace('.json', ''), data.length);
      
      // Validate required fields
      if (requiredFields && data.length > 0) {
        const sample = data[0];
        const missingFields = requiredFields.filter(f => !(f in sample));
        if (missingFields.length > 0) {
          fail('JSON Files', `${name}: Missing fields: ${missingFields.join(', ')}`);
        } else {
          pass('JSON Files', `✓ ${name}: ${data.length} entries`);
        }
      } else {
        pass('JSON Files', `✓ ${name}: ${data.length} entries`);
      }
    }
  } catch (e) {
    fail('JSON Files', `${name}: Parse error - ${e.message}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: TYPESCRIPT FILE LOAD CHAIN
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n' + '━'.repeat(75));
console.log('SECTION 2: TYPESCRIPT FILE LOAD CHAIN');
console.log('━'.repeat(75));

const TS_FILES_WITH_JSON_IMPORTS = [
  { file: 'config/master-picklist-helpers.ts', imports: ['category-style-mapping.json', 'categories.json'] },
  { file: 'config/category-config.ts', imports: ['category-filter-attributes.json'] },
  { file: 'picklist-master/03-types/type-config.ts', imports: ['types.json', 'category-type-mapping.json'] },
  { file: 'picklist-master/04-departments-families/department-family-config.ts', imports: ['departments.json', 'families.json'] },
];

TS_FILES_WITH_JSON_IMPORTS.forEach(({ file, imports }) => {
  const filePath = path.join(ROOT, 'src', file);
  
  if (!fs.existsSync(filePath)) {
    fail('TS Load Chain', `Missing: ${file}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  imports.forEach(jsonFile => {
    if (content.includes(jsonFile)) {
      pass('TS Load Chain', `✓ ${file} → ${jsonFile}`);
    } else {
      fail('TS Load Chain', `${file} does NOT import ${jsonFile}`);
    }
  });
});

// Check fs.readFileSync loaders
const FS_LOADERS = [
  { file: 'services/picklist-matcher.service.ts', loads: ['brands.json', 'categories.json', 'styles.json', 'attributes.json', 'types.json'] },
  { file: 'config/lookups.ts', loads: ['category-filter-attributes.json'] },
];

FS_LOADERS.forEach(({ file, loads }) => {
  const filePath = path.join(ROOT, 'src', file);
  
  if (!fs.existsSync(filePath)) {
    fail('TS Load Chain', `Missing: ${file}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes('fs.readFileSync')) {
    pass('TS Load Chain', `✓ ${file} uses fs.readFileSync for runtime loading`);
  } else {
    warn('TS Load Chain', `${file} does not use fs.readFileSync (may use TS import)`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: HARDCODED CONSTANTS VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n' + '━'.repeat(75));
console.log('SECTION 3: HARDCODED CONSTANTS VS JSON');
console.log('━'.repeat(75));

// 3a. DEPARTMENTS in constants.ts
const constantsPath = path.join(CONFIG_DIR, 'constants.ts');
if (fs.existsSync(constantsPath)) {
  const constantsContent = fs.readFileSync(constantsPath, 'utf-8');
  const deptMatch = constantsContent.match(/export const DEPARTMENTS\s*=\s*\[([\s\S]*?)\];/);
  
  if (deptMatch && picklists['departments.json']) {
    const hardcodedDepts = deptMatch[1].match(/'([^']+)'/g)?.map(s => s.replace(/'/g, '')) || [];
    const jsonDepts = picklists['departments.json'].map(d => d.department_name);
    
    const missing = jsonDepts.filter(d => !hardcodedDepts.some(h => 
      h.toLowerCase().replace(/[^a-z]/g, '') === d.toLowerCase().replace(/[^a-z]/g, '')
    ));
    const extra = hardcodedDepts.filter(h => !jsonDepts.some(d => 
      d.toLowerCase().replace(/[^a-z]/g, '') === h.toLowerCase().replace(/[^a-z]/g, '')
    ));
    
    if (missing.length === 0 && extra.length === 0) {
      pass('Constants', `✓ DEPARTMENTS (${hardcodedDepts.length}) matches departments.json (${jsonDepts.length})`);
    } else {
      if (missing.length > 0) warn('Constants', `DEPARTMENTS missing: ${missing.join(', ')}`);
      if (extra.length > 0) warn('Constants', `DEPARTMENTS extra: ${extra.join(', ')}`);
    }
  }
}

// 3b. CATEGORY_ALIASES validation
const aliasesPath = path.join(CONFIG_DIR, 'category-aliases.ts');
if (fs.existsSync(aliasesPath)) {
  const aliasContent = fs.readFileSync(aliasesPath, 'utf-8');
  const aliasMatch = aliasContent.match(/export const CATEGORY_ALIASES[\s\S]*?=\s*\{([\s\S]*?)\};/);
  
  if (aliasMatch && picklists['categories.json']) {
    const categoryNames = new Set(picklists['categories.json'].map(c => c.category_name.toLowerCase()));
    
    // Extract alias keys (the canonical category names that aliases map TO)
    const aliasKeys = [];
    const keyRegex = /'([^']+)'\s*:/g;
    let km;
    while ((km = keyRegex.exec(aliasMatch[1])) !== null) {
      aliasKeys.push(km[1]);
    }
    
    const invalidAliases = aliasKeys.filter(k => !categoryNames.has(k.toLowerCase()));
    
    if (invalidAliases.length === 0) {
      pass('Constants', `✓ CATEGORY_ALIASES: All ${aliasKeys.length} keys exist in categories.json`);
    } else {
      fail('Constants', `CATEGORY_ALIASES: ${invalidAliases.length} keys NOT in categories.json: ${invalidAliases.slice(0, 5).join(', ')}${invalidAliases.length > 5 ? '...' : ''}`);
    }
  }
}

// 3c. TYPE_ALIASES validation
const typeMatcherPath = path.join(SERVICES_DIR, 'type-matcher.service.ts');
if (fs.existsSync(typeMatcherPath)) {
  const tmContent = fs.readFileSync(typeMatcherPath, 'utf-8');
  const typeAliasMatch = tmContent.match(/const TYPE_ALIASES[\s\S]*?=\s*\{([\s\S]*?)\n\};/);
  
  if (typeAliasMatch && picklists['types.json']) {
    const typeNames = new Set(picklists['types.json'].map(t => t.type_name));
    
    // Extract all target type names from TYPE_ALIASES
    const targetTypes = new Set();
    const targetRegex = /'([^']+)'\s*:\s*'([^']+)'/g;
    let tm;
    while ((tm = targetRegex.exec(typeAliasMatch[1])) !== null) {
      targetTypes.add(tm[2]); // The value (target type name)
    }
    
    const invalidTargets = [...targetTypes].filter(t => !typeNames.has(t));
    
    if (invalidTargets.length === 0) {
      pass('Constants', `✓ TYPE_ALIASES: All ${targetTypes.size} target types exist in types.json`);
    } else {
      fail('Constants', `TYPE_ALIASES: ${invalidTargets.length} targets NOT in types.json: ${invalidTargets.join(', ')}`);
    }
  }
}

// 3d. CATEGORY_REMAPPING validation
const consolidationPath = path.join(CONFIG_DIR, 'category-consolidation-mapping.ts');
if (fs.existsSync(consolidationPath)) {
  const consolidationContent = fs.readFileSync(consolidationPath, 'utf-8');
  
  if (picklists['categories.json']) {
    const categoryNames = new Set(picklists['categories.json'].map(c => c.category_name));
    
    // Extract parentCategory values from the nested structure
    const targets = [];
    const parentRegex = /parentCategory:\s*'([^']+)'/g;
    let rm;
    while ((rm = parentRegex.exec(consolidationContent)) !== null) {
      targets.push(rm[1]);
    }
    
    const invalidTargets = targets.filter(t => !categoryNames.has(t));
    
    if (invalidTargets.length === 0) {
      pass('Constants', `✓ CATEGORY_REMAPPING: All ${targets.length} parent categories exist in categories.json`);
    } else if (invalidTargets.length <= 3) {
      warn('Constants', `CATEGORY_REMAPPING: ${invalidTargets.length} parent categories NOT in categories.json: ${invalidTargets.join(', ')}`);
    } else {
      fail('Constants', `CATEGORY_REMAPPING: ${invalidTargets.length} parent categories NOT in categories.json: ${invalidTargets.slice(0, 5).join(', ')}...`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: CROSS-REFERENCE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n' + '━'.repeat(75));
console.log('SECTION 4: CROSS-REFERENCE VALIDATION');
console.log('━'.repeat(75));

// 4a. category-type-mapping.json categories exist in categories.json
if (picklists['category-type-mapping.json'] && picklists['categories.json']) {
  const mappingData = picklists['category-type-mapping.json'];
  const mappings = mappingData.mappings || [];
  const categoryNames = new Set(picklists['categories.json'].map(c => c.category_name));
  
  if (Array.isArray(mappings) && mappings.length > 0) {
    // Check category_name field exists and extract
    const mappingCategories = mappings.map(m => m.category_name || m.category).filter(Boolean);
    const invalidCategories = mappingCategories.filter(c => !categoryNames.has(c));
    
    if (invalidCategories.length === 0) {
      pass('Cross-Ref', `✓ category-type-mapping: All ${mappingCategories.length} categories exist in categories.json`);
    } else if (invalidCategories.length <= 5) {
      warn('Cross-Ref', `category-type-mapping: ${invalidCategories.length} invalid categories: ${invalidCategories.join(', ')}`);
    } else {
      fail('Cross-Ref', `category-type-mapping: ${invalidCategories.length} invalid categories: ${invalidCategories.slice(0, 5).join(', ')}...`);
    }
    
    // Check types exist in types.json - types are objects with type_name
    const typeNames = new Set(picklists['types.json'].map(t => t.type_name));
    const allMappingTypes = mappings.flatMap(m => {
      if (!Array.isArray(m.types)) return [];
      return m.types.map(t => typeof t === 'object' ? t.type_name : t).filter(Boolean);
    });
    const invalidTypes = allMappingTypes.filter(t => !typeNames.has(t));
    
    if (invalidTypes.length === 0) {
      pass('Cross-Ref', `✓ category-type-mapping: All ${allMappingTypes.length} type refs are valid`);
    } else if (invalidTypes.length <= 5) {
      warn('Cross-Ref', `category-type-mapping: ${invalidTypes.length} invalid types: ${[...new Set(invalidTypes)].join(', ')}`);
    } else {
      fail('Cross-Ref', `category-type-mapping: ${invalidTypes.length} invalid types: ${[...new Set(invalidTypes)].slice(0, 5).join(', ')}...`);
    }
  } else {
    warn('Cross-Ref', `category-type-mapping: Could not parse mappings array`);
  }
}

// 4b. category-style-mapping.json styles exist in styles.json
if (picklists['category-style-mapping.json'] && picklists['styles.json']) {
  const styleData = picklists['category-style-mapping.json'];
  const styleNames = new Set(picklists['styles.json'].map(s => s.style_name));
  
  // Check universal styles
  const universalStyles = styleData.universal_styles?.map(s => s.style_name) || [];
  const invalidUniversal = universalStyles.filter(s => !styleNames.has(s));
  
  if (invalidUniversal.length === 0) {
    pass('Cross-Ref', `✓ category-style-mapping universal_styles: All ${universalStyles.length} exist in styles.json`);
  } else {
    fail('Cross-Ref', `category-style-mapping universal_styles: ${invalidUniversal.length} invalid: ${invalidUniversal.join(', ')}`);
  }
}

// 4c. category-filter-attributes.json categories exist in categories.json
if (picklists['category-filter-attributes.json'] && picklists['categories.json']) {
  const filterAttrs = picklists['category-filter-attributes.json'];
  const categoryNames = new Set(picklists['categories.json'].map(c => c.category_name));
  
  // Structure is { "0": { category_name, ... }, "1": { category_name, ... }, ... }
  const entries = Object.values(filterAttrs);
  const filterCategories = [...new Set(entries.map(e => e.category_name).filter(Boolean))];
  
  const invalidCategories = filterCategories.filter(c => !categoryNames.has(c));
  const validCount = filterCategories.length - invalidCategories.length;
  
  if (invalidCategories.length === 0) {
    pass('Cross-Ref', `✓ category-filter-attributes: All ${filterCategories.length} unique categories exist in categories.json`);
  } else if (invalidCategories.length <= 10) {
    pass('Cross-Ref', `✓ category-filter-attributes: ${validCount}/${filterCategories.length} categories valid`);
    warn('Cross-Ref', `category-filter-attributes: ${invalidCategories.length} orphan categories: ${invalidCategories.slice(0, 5).join(', ')}${invalidCategories.length > 5 ? '...' : ''}`);
  } else {
    warn('Cross-Ref', `category-filter-attributes: ${invalidCategories.length} categories not in categories.json`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: SERVICE FILE INTEGRITY
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n' + '━'.repeat(75));
console.log('SECTION 5: SERVICE FILE INTEGRITY');
console.log('━'.repeat(75));

const CRITICAL_SERVICES = [
  { file: 'dual-ai-verification.service.ts', requiredExports: ['verifyProductWithDualAI'] },
  { file: 'picklist-matcher.service.ts', requiredExports: ['picklistMatcher'] },
  { file: 'type-matcher.service.ts', requiredExports: ['matchTypeToPicklist', 'validateTypeForCategory'] },
  { file: 'consensus.service.ts', requiredExports: ['buildConsensus'] },
  { file: 'response-builder.service.ts', requiredExports: ['buildVerificationResponse'] },
  { file: 'category-matcher.service.ts', requiredExports: ['matchCategory'] },
  { file: 'style-validator.service.ts', requiredExports: ['isAestheticStyle'] },
  { file: 'webhook.service.ts', requiredExports: [] },
];

CRITICAL_SERVICES.forEach(({ file, requiredExports }) => {
  const filePath = path.join(SERVICES_DIR, file);
  
  if (!fs.existsSync(filePath)) {
    fail('Services', `Missing critical service: ${file}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').length;
  
  const missingExports = requiredExports.filter(exp => !content.includes(`export`) || !content.includes(exp));
  
  if (missingExports.length === 0) {
    pass('Services', `✓ ${file}: ${lines} lines, all exports present`);
  } else {
    fail('Services', `${file}: Missing exports: ${missingExports.join(', ')}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: DYNAMIC VS HARDCODED DETECTION
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n' + '━'.repeat(75));
console.log('SECTION 6: DYNAMIC VS HARDCODED PATTERNS');
console.log('━'.repeat(75));

// Check master-picklist-helpers for dynamic loading
const masterHelpersPath = path.join(CONFIG_DIR, 'master-picklist-helpers.ts');
if (fs.existsSync(masterHelpersPath)) {
  const content = fs.readFileSync(masterHelpersPath, 'utf-8');
  
  if (content.includes('import categoryStyleMapping from') && content.includes('.map(')) {
    pass('Dynamic', `✓ UNIVERSAL_DESIGN_STYLES: Derived from JSON via .map()`);
  } else {
    fail('Dynamic', `UNIVERSAL_DESIGN_STYLES may be hardcoded`);
  }
  
  if (content.includes('getAllCategoriesWithStylesForPrompt') && content.includes('category_specific_mappings')) {
    pass('Dynamic', `✓ getAllCategoriesWithStylesForPrompt: Uses JSON mapping data`);
  }
  
  if (content.includes('getAllCategoriesWithTypesForPrompt')) {
    pass('Dynamic', `✓ getAllCategoriesWithTypesForPrompt: Function exists`);
  }
}

// Check style-validator for dynamic AESTHETIC_STYLES
const styleValidatorPath = path.join(SERVICES_DIR, 'style-validator.service.ts');
if (fs.existsSync(styleValidatorPath)) {
  const content = fs.readFileSync(styleValidatorPath, 'utf-8');
  
  if (content.includes('AESTHETIC_STYLES = UNIVERSAL_DESIGN_STYLES')) {
    pass('Dynamic', `✓ AESTHETIC_STYLES: Dynamic (assigned from UNIVERSAL_DESIGN_STYLES)`);
  } else if (content.match(/const AESTHETIC_STYLES\s*=\s*\[/)) {
    fail('Dynamic', `AESTHETIC_STYLES is hardcoded array — should use UNIVERSAL_DESIGN_STYLES`);
  }
}

// Check dual-ai for removed hardcoded arrays
const dualAIPath = path.join(SERVICES_DIR, 'dual-ai-verification.service.ts');
if (fs.existsSync(dualAIPath)) {
  const content = fs.readFileSync(dualAIPath, 'utf-8');
  
  if (content.match(/const LIGHTING_CATEGORIES\s*=\s*\[/)) {
    fail('Dynamic', `LIGHTING_CATEGORIES is hardcoded in dual-ai — should use dynamic function`);
  } else {
    pass('Dynamic', `✓ LIGHTING_CATEGORIES: Not hardcoded (using dynamic loading or removed)`);
  }
  
  if (content.match(/const SHOWER_PLUMBING_CATEGORIES\s*=\s*\[/)) {
    fail('Dynamic', `SHOWER_PLUMBING_CATEGORIES is hardcoded in dual-ai`);
  } else {
    pass('Dynamic', `✓ SHOWER_PLUMBING_CATEGORIES: Not hardcoded`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: DUPLICATE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n' + '━'.repeat(75));
console.log('SECTION 7: DUPLICATE DETECTION');
console.log('━'.repeat(75));

// Check for duplicate brands (case-insensitive)
if (picklists['brands.json']) {
  const brandNames = picklists['brands.json'].map(b => b.brand_name.toLowerCase().trim());
  const seen = new Set();
  const dupes = [];
  brandNames.forEach(b => {
    if (seen.has(b)) dupes.push(b);
    seen.add(b);
  });
  
  if (dupes.length === 0) {
    pass('Duplicates', `✓ brands.json: No case-insensitive duplicates`);
  } else {
    // These are case variations with different SF IDs - warn but don't fail
    warn('Duplicates', `brands.json: ${dupes.length} case-insensitive duplicates (may have different SF IDs): ${[...new Set(dupes)].slice(0, 5).join(', ')}`);
  }
}

// Check for duplicate categories
if (picklists['categories.json']) {
  const catNames = picklists['categories.json'].map(c => c.category_name.toLowerCase().trim());
  const seen = new Set();
  const dupes = [];
  catNames.forEach(c => {
    if (seen.has(c)) dupes.push(c);
    seen.add(c);
  });
  
  if (dupes.length === 0) {
    pass('Duplicates', `✓ categories.json: No duplicates`);
  } else {
    fail('Duplicates', `categories.json: ${dupes.length} duplicates: ${[...new Set(dupes)].slice(0, 5).join(', ')}`);
  }
}

// Check for duplicate types
if (picklists['types.json']) {
  const typeNames = picklists['types.json'].map(t => t.type_name.toLowerCase().trim());
  const seen = new Set();
  const dupes = [];
  typeNames.forEach(t => {
    if (seen.has(t)) dupes.push(t);
    seen.add(t);
  });
  
  if (dupes.length === 0) {
    pass('Duplicates', `✓ types.json: No duplicates`);
  } else {
    warn('Duplicates', `types.json: ${dupes.length} duplicate names (may have different IDs)`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: ID INTEGRITY CHECK
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n' + '━'.repeat(75));
console.log('SECTION 8: SALESFORCE ID INTEGRITY');
console.log('━'.repeat(75));

// Check for missing Salesforce IDs
const ID_FIELD_MAP = {
  'brands.json': 'brand_id',
  'categories.json': 'category_id',
  'types.json': 'type_id',
  'styles.json': 'style_id'
};

Object.entries(ID_FIELD_MAP).forEach(([file, idField]) => {
  const nameField = file.replace('.json', '').replace(/s$/, '') + '_name';
  const data = picklists[file];
  
  if (!data) return;
  
  const missingIds = data.filter(item => !item[idField] || item[idField] === '' || item[idField] === null);
  
  if (missingIds.length === 0) {
    pass('SF IDs', `✓ ${file}: All ${data.length} entries have ${idField}`);
  } else {
    const examples = missingIds.slice(0, 3).map(m => m[nameField] || 'unknown');
    warn('SF IDs', `${file}: ${missingIds.length} entries missing ${idField}: ${examples.join(', ')}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9: BUILD VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n' + '━'.repeat(75));
console.log('SECTION 9: BUILD VERIFICATION');
console.log('━'.repeat(75));

// Check if dist folder exists and is recent
const distPath = path.join(ROOT, 'dist');
if (fs.existsSync(distPath)) {
  const distStat = fs.statSync(distPath);
  const ageHours = (Date.now() - distStat.mtimeMs) / (1000 * 60 * 60);
  
  if (ageHours < 24) {
    pass('Build', `✓ dist/ folder exists (${Math.round(ageHours)} hours old)`);
  } else {
    warn('Build', `dist/ folder is ${Math.round(ageHours)} hours old — may need rebuild`);
  }
} else {
  fail('Build', `dist/ folder not found — run npm run build`);
}

// Check tsconfig.json exists
if (fs.existsSync(path.join(ROOT, 'tsconfig.json'))) {
  pass('Build', `✓ tsconfig.json exists`);
} else {
  fail('Build', `tsconfig.json not found`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10: FUNCTION EXPORT CHAIN
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n' + '━'.repeat(75));
console.log('SECTION 10: FUNCTION EXPORT CHAIN');
console.log('━'.repeat(75));

const FUNCTION_CHAIN = [
  { source: 'config/master-picklist-helpers.ts', exports: ['getValidStylesForCategory', 'getAllCategoriesWithStylesForPrompt', 'matchStyleToCategory', 'UNIVERSAL_DESIGN_STYLES'] },
  { source: 'config/category-config.ts', exports: ['getCategorySchema', 'getCategoryListForPrompt', 'getAllCategoriesWithTop15ForPrompt'] },
  { source: 'config/lookups.ts', exports: ['getAttributeNameToSfIdMap', 'getOptimizedFilterAttributes'] },
  { source: 'picklist-master/03-types/type-config.ts', exports: ['getTypesForCategory', 'getTypeByName', 'isValidTypeForCategory'] },
];

FUNCTION_CHAIN.forEach(({ source, exports: funcs }) => {
  const filePath = path.join(ROOT, 'src', source);
  
  if (!fs.existsSync(filePath)) {
    fail('Exports', `Missing: ${source}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  funcs.forEach(func => {
    if (content.includes(`export function ${func}`) || content.includes(`export const ${func}`) || content.includes(`export { ${func}`)) {
      pass('Exports', `✓ ${source} → ${func}()`);
    } else {
      fail('Exports', `${source} missing export: ${func}`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FINAL REPORT
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(75));
console.log('   AUDIT SUMMARY');
console.log('═'.repeat(75));

console.log('\n📊 PICKLIST STATISTICS:');
Object.entries(results.stats).forEach(([key, value]) => {
  console.log(`   ${key}: ${value}`);
});

console.log('\n');

// Group by category
const categories = [...new Set([...results.passed, ...results.warnings, ...results.failed].map(r => r.category))];

categories.forEach(cat => {
  const catPassed = results.passed.filter(r => r.category === cat);
  const catWarns = results.warnings.filter(r => r.category === cat);
  const catFailed = results.failed.filter(r => r.category === cat);
  
  if (catFailed.length > 0) {
    console.log(`🔴 ${cat}: ${catFailed.length} failed, ${catWarns.length} warnings, ${catPassed.length} passed`);
    catFailed.forEach(f => console.log(`   ❌ ${f.message}`));
  } else if (catWarns.length > 0) {
    console.log(`🟡 ${cat}: ${catWarns.length} warnings, ${catPassed.length} passed`);
    catWarns.forEach(w => console.log(`   ⚠️  ${w.message}`));
  } else {
    console.log(`🟢 ${cat}: ${catPassed.length} passed`);
  }
});

console.log('\n' + '═'.repeat(75));
console.log(`FINAL RESULT: ${results.passed.length} ✅ passed | ${results.warnings.length} ⚠️ warnings | ${results.failed.length} 🔴 failed`);
console.log('═'.repeat(75));

if (results.failed.length > 0) {
  console.log('\n🔴 ACTION REQUIRED:');
  console.log('   Some verification flow components are out of sync.');
  console.log('   Run: node scripts/regenerate-hardcoded-lists.js');
  console.log('   Then review and fix any remaining issues manually.\n');
  process.exit(1);
} else if (results.warnings.length > 0) {
  console.log('\n🟡 VERIFICATION FLOW OPERATIONAL with warnings.');
  console.log('   Review warnings above for potential improvements.\n');
  process.exit(0);
} else {
  console.log('\n🟢 VERIFICATION FLOW FULLY IN SYNC');
  console.log('   All components validated. Ready for Salesforce API calls.\n');
  process.exit(0);
}
