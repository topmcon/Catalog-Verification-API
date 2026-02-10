#!/usr/bin/env node
/**
 * HARDCODED LIST SYNC VERIFICATION
 * =================================
 * Compares every hardcoded TypeScript constant/list against the
 * source-of-truth JSON picklists in salesforce-picklists/.
 *
 * Run:  node scripts/verify-hardcoded-sync.js
 *
 * Exit codes:
 *   0 = all in sync
 *   1 = out-of-sync items detected
 */

const fs   = require('fs');
const path = require('path');

const PICKLIST_DIR = path.join(__dirname, '../src/config/salesforce-picklists');
const SRC_DIR      = path.join(__dirname, '../src');

// ─── Load source JSONs ──────────────────────────────────────────────
function loadJSON(name) {
  return JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, name), 'utf-8'));
}

const categories           = loadJSON('categories.json');
const brands               = loadJSON('brands.json');
const departments          = loadJSON('departments.json');
const styles               = loadJSON('styles.json');
const types                = loadJSON('types.json');
const categoryTypeMappings = loadJSON('category-type-mapping.json');
const categoryStyleMapping = loadJSON('category-style-mapping.json');

// ─── Helpers ─────────────────────────────────────────────────────────
const results = [];
let passCount = 0;
let warnCount = 0;
let failCount = 0;

function pass(area, detail) {
  passCount++;
  results.push({ status: '✅', area, detail });
}
function warn(area, detail) {
  warnCount++;
  results.push({ status: '⚠️ ', area, detail });
}
function fail(area, detail) {
  failCount++;
  results.push({ status: '🔴', area, detail });
}

function readTS(relPath) {
  return fs.readFileSync(path.join(SRC_DIR, relPath), 'utf-8');
}

function extractArrayValues(content, varName) {
  // Try to capture an array const VARNAME = ['a','b'] or VARNAME = [\n 'a',\n 'b'\n]
  const regex = new RegExp(`(?:export )?(?:const|let|var) ${varName}[^=]*=\\s*\\[([\\s\\S]*?)\\]`, 'm');
  const m = content.match(regex);
  if (!m) return null;
  // pull out quoted strings
  const vals = [];
  const re = /['"]([^'"]+)['"]/g;
  let match;
  while ((match = re.exec(m[1])) !== null) vals.push(match[1]);
  return vals;
}

function extractObjectKeys(content, varName) {
  const regex = new RegExp(`(?:export )?(?:const|let|var) ${varName}[^=]*=\\s*\\{([\\s\\S]*?)\\};`, 'm');
  const m = content.match(regex);
  if (!m) return null;
  const keys = [];
  const re = /['"]([^'"]+)['"]\s*:/g;
  let match;
  while ((match = re.exec(m[1])) !== null) keys.push(match[1]);
  return keys;
}

// ─── Source of truth sets ────────────────────────────────────────────
const jsonDeptNames      = new Set(departments.map(d => d.department_name));
const jsonCategoryNames  = new Set(categories.map(c => c.category_name));
const jsonBrandNames     = new Set(brands.map(b => b.brand_name));
const jsonStyleNames     = new Set((categoryStyleMapping.universal_styles || styles).map(s => s.style_name));
const jsonTypeNames      = new Set(types.map(t => t.type_name));

// Build department→categories from categories.json
const jsonDeptCategories = {};
categories.forEach(c => {
  if (c.department) {
    if (!jsonDeptCategories[c.department]) jsonDeptCategories[c.department] = [];
    jsonDeptCategories[c.department].push(c.category_name);
  }
});

// =====================================================================
// CHECK 1: constants.ts — DEPARTMENTS
// =====================================================================
(function checkConstantsDepartments() {
  const content = readTS('config/constants.ts');
  const hardcoded = extractArrayValues(content, 'DEPARTMENTS');
  if (!hardcoded) return warn('constants.ts DEPARTMENTS', 'Could not parse array');

  const missing = [...jsonDeptNames].filter(d => !hardcoded.includes(d));
  const extra   = hardcoded.filter(d => !jsonDeptNames.has(d));
  const nameIssues = [];

  // Check for close-but-not-exact matches
  for (const hd of hardcoded) {
    if (!jsonDeptNames.has(hd)) {
      for (const jd of jsonDeptNames) {
        if (jd.toLowerCase().includes(hd.toLowerCase().replace(/ /g, '')) ||
            hd.toLowerCase().includes(jd.toLowerCase().replace(/ /g, ''))) {
          nameIssues.push(`"${hd}" should be "${jd}"`);
        }
      }
    }
  }

  if (missing.length === 0 && extra.length === 0) {
    pass('constants.ts DEPARTMENTS', `${hardcoded.length} departments match JSON (${jsonDeptNames.size})`);
  } else {
    fail('constants.ts DEPARTMENTS',
      `Hardcoded ${hardcoded.length} vs JSON ${jsonDeptNames.size}. ` +
      (missing.length ? `Missing: ${missing.join(', ')}. ` : '') +
      (extra.length ? `Extra/wrong: ${extra.join(', ')}. ` : '') +
      (nameIssues.length ? `Name fixes: ${nameIssues.join('; ')}` : '')
    );
  }
})();

// =====================================================================
// CHECK 2: category-matcher.service.ts — DEPARTMENT_CATEGORIES
// =====================================================================
(function checkDeptCategories() {
  const content = readTS('services/category-matcher.service.ts');

  // Extract department names used as keys
  const regex = /const DEPARTMENT_CATEGORIES[\s\S]*?=\s*\{([\s\S]*?)\};/;
  const m = content.match(regex);
  if (!m) return warn('category-matcher DEPARTMENT_CATEGORIES', 'Could not parse');

  // Count departments in hardcoded map
  const deptKeys = [];
  const keyRe = /'([^']+)'\s*:\s*\[/g;
  let km;
  while ((km = keyRe.exec(m[1])) !== null) deptKeys.push(km[1]);

  // Count categories
  const catRe = /'([^']+)'/g;
  const allCats = new Set();
  let cm;
  while ((cm = catRe.exec(m[1])) !== null) {
    if (!deptKeys.includes(cm[1])) allCats.add(cm[1]);
  }

  const missingDepts = [...jsonDeptNames].filter(d => !deptKeys.some(k =>
    k.toLowerCase().replace(/[^a-z]/g, '') === d.toLowerCase().replace(/[^a-z]/g, '')
  ));
  const missingCats = [...jsonCategoryNames].filter(c => !allCats.has(c));

  if (deptKeys.length >= jsonDeptNames.size && missingCats.length <= 5) {
    pass('DEPARTMENT_CATEGORIES', `${deptKeys.length} depts, ${allCats.size} cats`);
  } else {
    fail('DEPARTMENT_CATEGORIES',
      `Hardcoded ${deptKeys.length} depts / ${allCats.size} cats vs JSON ${jsonDeptNames.size} depts / ${jsonCategoryNames.size} cats. ` +
      `Missing ${missingDepts.length} departments, ${missingCats.length} categories`
    );
  }
})();

// =====================================================================
// CHECK 3: dual-ai-verification.service.ts — Dynamic vs Hardcoded
// =====================================================================
(function checkDualAI() {
  const content = readTS('services/dual-ai-verification.service.ts');

  // AESTHETIC_STYLES — should be = UNIVERSAL_DESIGN_STYLES (dynamic)
  if (content.includes('AESTHETIC_STYLES = UNIVERSAL_DESIGN_STYLES')) {
    pass('AESTHETIC_STYLES', 'Dynamic — assigned from UNIVERSAL_DESIGN_STYLES (master-picklist-helpers.ts → JSON)');
  } else {
    fail('AESTHETIC_STYLES', 'NOT dynamic — may be hardcoded');
  }

  // LIGHTING_CATEGORIES — should be removed (dynamic via isLightingCategoryFromMaster)
  if (content.includes('REMOVED HARDCODED ARRAY') && content.includes('getLightingCategories')) {
    pass('LIGHTING_CATEGORIES', 'Dynamic — uses getLightingCategories() from master JSON');
  } else if (content.match(/const LIGHTING_CATEGORIES\s*=\s*\[/)) {
    fail('LIGHTING_CATEGORIES', 'HARDCODED — should use dynamic getLightingCategories()');
  } else {
    pass('LIGHTING_CATEGORIES', 'Not found as hardcoded array');
  }

  // SHOWER_PLUMBING_CATEGORIES
  if (content.includes('REMOVED HARDCODED ARRAY') && content.includes('getShowerCategories')) {
    pass('SHOWER_CATEGORIES', 'Dynamic — uses getShowerCategories() from master JSON');
  } else if (content.match(/const SHOWER_PLUMBING_CATEGORIES\s*=\s*\[/)) {
    fail('SHOWER_CATEGORIES', 'HARDCODED — should use dynamic getShowerCategories()');
  } else {
    pass('SHOWER_CATEGORIES', 'Not found as hardcoded array');
  }

  // VALID_SHOWER_STYLES
  if (content.includes('getValidShowerStyles')) {
    pass('VALID_SHOWER_STYLES', 'Dynamic — uses getValidShowerStyles() from master JSON');
  } else if (content.match(/const VALID_SHOWER_STYLES\s*=\s*\[/)) {
    fail('VALID_SHOWER_STYLES', 'HARDCODED');
  } else {
    pass('VALID_SHOWER_STYLES', 'Not found as hardcoded array');
  }

  // CATEGORY_DOMAINS — check if hardcoded
  if (content.match(/const CATEGORY_DOMAINS[\s\S]*?=\s*\{/)) {
    warn('CATEGORY_DOMAINS', 'HARDCODED keyword map for data coherence. Not derived from JSON. Used for pre-AI validation only — low risk');
  }
})();

// =====================================================================
// CHECK 4: master-picklist-helpers.ts — Dynamic loading
// =====================================================================
(function checkMasterHelpers() {
  const content = readTS('config/master-picklist-helpers.ts');

  if (content.includes("import categoryStyleMapping from") ||
      content.includes("require('./salesforce-picklists")) {
    pass('master-picklist-helpers', 'Loads from salesforce-picklists JSON — dynamic');
  } else {
    fail('master-picklist-helpers', 'Does not appear to load from JSON');
  }

  // Check UNIVERSAL_DESIGN_STYLES is derived from JSON
  if (content.includes('.universal_styles') || content.includes('.map(')) {
    pass('UNIVERSAL_DESIGN_STYLES', 'Derived from category-style-mapping.json via .map()');
  } else {
    fail('UNIVERSAL_DESIGN_STYLES', 'May be hardcoded');
  }
})();

// =====================================================================
// CHECK 5: type-matcher.service.ts — TYPE_ALIASES
// =====================================================================
(function checkTypeAliases() {
  const content = readTS('services/type-matcher.service.ts');

  // TYPE_ALIASES is intentionally a supplementary map — check targets exist in types.json
  const aliasBlock = content.match(/const TYPE_ALIASES[\s\S]*?=\s*\{([\s\S]*?)\};/);
  if (!aliasBlock) return warn('TYPE_ALIASES', 'Could not parse');

  // Extract target values (the mapped-to type names)
  const targetRe = /:\s*['"]([^'"]+)['"]/g;
  const targets = new Set();
  let tm;
  while ((tm = targetRe.exec(aliasBlock[1])) !== null) {
    // Skip category names used as keys in inner objects
    if (!tm[1].includes(':')) targets.add(tm[1]);
  }

  // Check each target exists in types.json
  const invalid = [...targets].filter(t => !jsonTypeNames.has(t));
  if (invalid.length === 0) {
    pass('TYPE_ALIASES', `All ${targets.size} alias targets exist in types.json`);
  } else {
    fail('TYPE_ALIASES', `${invalid.length} alias targets NOT in types.json: ${invalid.join(', ')}`);
  }
})();

// =====================================================================
// CHECK 6: picklist-matcher.service.ts — loadPicklists() reads JSON
// =====================================================================
(function checkPicklistMatcher() {
  const content = readTS('services/picklist-matcher.service.ts');

  const jsonFiles = ['brands.json', 'categories.json', 'styles.json', 'types.json', 'attributes.json'];
  const missing = jsonFiles.filter(f => !content.includes(f));

  if (missing.length === 0) {
    pass('picklist-matcher loadPicklists', `Loads all ${jsonFiles.length} JSON files via fs.readFileSync`);
  } else {
    fail('picklist-matcher loadPicklists', `Missing JSON loads: ${missing.join(', ')}`);
  }

  // ATTRIBUTE_ALIASES — supplementary, check it exists
  if (content.match(/ATTRIBUTE_ALIASES/)) {
    warn('ATTRIBUTE_ALIASES', 'Hardcoded supplementary alias map (~50 entries). Cannot be auto-generated — maps natural language → SF field names. Must be manually maintained');
  }
})();

// =====================================================================
// CHECK 7: type-config.ts — imports from JSON
// =====================================================================
(function checkTypeConfig() {
  try {
    const content = readTS('picklist-master/03-types/type-config.ts');
    if (content.includes('category-type-mapping.json') && content.includes('types.json')) {
      pass('type-config.ts', 'Imports from both category-type-mapping.json and types.json');
    } else {
      fail('type-config.ts', 'Does not import from JSON source files');
    }
  } catch (e) {
    warn('type-config.ts', 'File not found — check picklist-master structure');
  }
})();

// =====================================================================
// CHECK 8: Category aliases — should be consolidated to ONE source
// =====================================================================
(function checkCategoryAliases() {
  // Check how many separate CATEGORY_ALIAS definitions exist (not re-exports)
  const files = [
    { path: 'config/constants.ts', name: 'CATEGORY_NAME_ALIASES' },
    { path: 'config/category-aliases.ts', name: 'CATEGORY_ALIASES' },
    { path: 'config/category-schema.ts', name: 'CATEGORY_ALIASES' },
  ];

  const found = [];
  const reexports = [];
  for (const f of files) {
    try {
      const content = readTS(f.path);
      if (content.includes(f.name)) {
        // Detect re-exports: if file imports from category-aliases and re-exports, it's not a separate copy
        const isReexport = content.includes("from './category-aliases'") || content.includes('from "./category-aliases"');
        if (isReexport && f.path !== 'config/category-aliases.ts') {
          reexports.push(f.path);
        } else {
          const keys = extractObjectKeys(content, f.name);
          found.push({ file: f.path, name: f.name, count: keys ? keys.length : '?' });
        }
      }
    } catch (e) { /* skip */ }
  }

  if (found.length > 1) {
    fail('CATEGORY_ALIASES', 
      `${found.length} SEPARATE copies exist: ${found.map(f => `${f.file} (${f.count} entries)`).join(', ')}. ` +
      'Should be consolidated into ONE authoritative source'
    );
  } else if (found.length === 1) {
    const reexportMsg = reexports.length > 0 ? ` (re-exported by: ${reexports.join(', ')})` : '';
    pass('CATEGORY_ALIASES', `Single source: ${found[0].file} (${found[0].count} entries)${reexportMsg}`);
  }

  // Verify alias targets are valid categories
  for (const f of found) {
    try {
      const content = readTS(f.path);
      const keys = extractObjectKeys(content, f.name);
      if (keys) {
        const invalidKeys = keys.filter(k => !jsonCategoryNames.has(k));
        if (invalidKeys.length > 0) {
          warn(`${f.file} ${f.name}`, `${invalidKeys.length} keys not in categories.json: ${invalidKeys.slice(0, 5).join(', ')}${invalidKeys.length > 5 ? '...' : ''}`);
        }
      }
    } catch (e) { /* skip */ }
  }
})();

// =====================================================================
// CHECK 9: PRIMARY_ATTRIBUTES — 3 copies
// =====================================================================
(function checkPrimaryAttributes() {
  const files = [
    'config/constants.ts',
    'config/category-config.ts',
    'config/category-schema.ts',
  ];

  const found = [];
  for (const f of files) {
    try {
      const content = readTS(f);
      const varNames = ['PRIMARY_ATTRIBUTES', 'GLOBAL_PRIMARY_ATTRIBUTES'];
      for (const vn of varNames) {
        const vals = extractArrayValues(content, vn);
        if (vals && vals.length > 0) {
          found.push({ file: f, name: vn, values: vals });
        }
      }
    } catch (e) { /* skip */ }
  }

  if (found.length > 1) {
    // Check if contents match
    const first = JSON.stringify(found[0].values.map(v => v.toLowerCase().trim()).sort());
    let allMatch = true;
    for (let i = 1; i < found.length; i++) {
      const other = JSON.stringify(found[i].values.map(v => v.toLowerCase().trim()).sort());
      if (first !== other) {
        allMatch = false;
        break;
      }
    }

    if (allMatch) {
      warn('PRIMARY_ATTRIBUTES', 
        `${found.length} copies exist but contents MATCH: ${found.map(f => f.file).join(', ')}. Should consolidate to one source`
      );
    } else {
      fail('PRIMARY_ATTRIBUTES',
        `${found.length} copies with DIFFERENT contents: ${found.map(f => `${f.file}/${f.name} (${f.values.length})`).join(', ')}. ` +
        'SPELLING DIFFERENCES detected — consolidate immediately'
      );
    }
  }
})();

// =====================================================================
// CHECK 10: AI_FALLBACK_ATTRIBUTES — validate attribute names
// =====================================================================
(function checkFallbackAttributes() {
  const content = readTS('config/constants.ts');
  
  if (content.includes('AI_FALLBACK_ATTRIBUTES')) {
    // This is a supplementary fallback — it should have valid attribute names
    // but can't be fully auto-generated since it's a curated subset
    warn('AI_FALLBACK_ATTRIBUTES', 
      'Hardcoded per-category fallback attributes. Used when JSON data incomplete. ' +
      'Should be validated against attributes.json. Cannot be auto-generated but targets should exist in SF'
    );
  }
})();

// =====================================================================
// CHECK 11: smart-field-inference FIELD_ALIASES
// =====================================================================
(function checkFieldAliases() {
  try {
    const content = readTS('services/smart-field-inference.service.ts');
    if (content.includes('FIELD_ALIASES')) {
      warn('FIELD_ALIASES (smart-field-inference)',
        'Large hardcoded alias map (~80+ entries). Maps natural language to SF field names. ' +
        'Cannot be auto-generated — supplementary intelligence. Must be manually maintained'
      );
    }
  } catch (e) { /* skip */ }
})();

// =====================================================================
// CHECK 12: family-category-mapping.ts
// =====================================================================
(function checkFamilyCategoryMapping() {
  try {
    const content = readTS('config/family-category-mapping.ts');
    const keys = extractObjectKeys(content, 'FAMILY_CATEGORY_MAPPINGS');
    if (keys) {
      // Count families in categories.json
      const jsonFamilies = new Set(categories.map(c => c.family).filter(Boolean));
      if (keys.length < jsonFamilies.size * 0.5) {
        warn('FAMILY_CATEGORY_MAPPINGS',
          `Only ${keys.length} families mapped vs ${jsonFamilies.size} in categories.json. ` +
          'Can be auto-generated from categories.json family field'
        );
      } else {
        pass('FAMILY_CATEGORY_MAPPINGS', `${keys.length} families mapped`);
      }
    }
  } catch (e) { /* skip */ }
})();

// =====================================================================
// CHECK 13: category-consolidation-mapping.ts
// =====================================================================
(function checkConsolidation() {
  try {
    const content = readTS('config/category-consolidation-mapping.ts');
    if (content.includes('CATEGORY_REMAPPING')) {
      const keys = extractObjectKeys(content, 'CATEGORY_REMAPPING');
      if (keys) {
        // Check that remap targets are valid categories
        const re = /=>\s*['"]([^'"]+)['"]/g;
        const targets = new Set();
        let m;
        while ((m = re.exec(content)) !== null) targets.add(m[1]);
        
        const invalidTargets = [...targets].filter(t => !jsonCategoryNames.has(t) && t !== 'REMOVE');
        if (invalidTargets.length === 0) {
          pass('CATEGORY_REMAPPING', `${keys.length} remappings, all targets valid in categories.json`);
        } else {
          fail('CATEGORY_REMAPPING',
            `${invalidTargets.length} remap targets NOT in categories.json: ${invalidTargets.slice(0, 5).join(', ')}`
          );
        }
      }
    }
  } catch (e) { /* skip */ }
})();

// =====================================================================
// CHECK 14: brand-config.ts — brand tiers duplicate
// =====================================================================
(function checkBrandTiers() {
  try {
    const content = readTS('picklist-master/01-brands/brand-config.ts');
    const premiumBC = extractArrayValues(content, 'PREMIUM_BRANDS');
    
    const constantsContent = readTS('config/constants.ts');
    const premiumC = extractArrayValues(constantsContent, 'PREMIUM_BRANDS');

    if (premiumBC && premiumC) {
      const match = JSON.stringify(premiumBC.sort()) === JSON.stringify(premiumC.sort());
      if (match) {
        warn('BRAND_TIERS (PREMIUM/MID/VALUE)',
          'Duplicated in both constants.ts AND brand-config.ts (identical). ' +
          'Not derived from brands.json — manually curated tier classification. ' +
          'Should exist in one place only'
        );
      } else {
        fail('BRAND_TIERS',
          'EXISTS in both constants.ts AND brand-config.ts with DIFFERENT content!'
        );
      }
    }
  } catch (e) { /* skip */ }
})();

// =====================================================================
// REPORT
// =====================================================================
console.log('\n' + '═'.repeat(70));
console.log('   HARDCODED LIST SYNC VERIFICATION REPORT');
console.log('═'.repeat(70) + '\n');

// Group by status
const passes = results.filter(r => r.status === '✅');
const warns  = results.filter(r => r.status === '⚠️ ');
const fails  = results.filter(r => r.status === '🔴');

if (fails.length > 0) {
  console.log('🔴 CRITICAL — OUT OF SYNC (' + fails.length + ')');
  console.log('─'.repeat(70));
  fails.forEach(r => console.log(`  ${r.status} ${r.area}`));
  fails.forEach(r => console.log(`\n  → ${r.area}: ${r.detail}`));
  console.log('');
}

if (warns.length > 0) {
  console.log('⚠️  WARNINGS — Manual Maintenance Required (' + warns.length + ')');
  console.log('─'.repeat(70));
  warns.forEach(r => console.log(`  ${r.status} ${r.area}`));
  warns.forEach(r => console.log(`\n  → ${r.area}: ${r.detail}`));
  console.log('');
}

if (passes.length > 0) {
  console.log('✅ IN SYNC (' + passes.length + ')');
  console.log('─'.repeat(70));
  passes.forEach(r => console.log(`  ${r.status} ${r.area}: ${r.detail}`));
  console.log('');
}

console.log('═'.repeat(70));
console.log(`SUMMARY: ${passCount} ✅ pass | ${warnCount} ⚠️  warn | ${failCount} 🔴 fail`);

if (failCount > 0) {
  console.log('\n🔴 ACTION REQUIRED: Run "node scripts/regenerate-hardcoded-lists.js" to fix auto-syncable items');
  console.log('   Manual items require code review and update');
}

console.log('═'.repeat(70) + '\n');

process.exit(failCount > 0 ? 1 : 0);
