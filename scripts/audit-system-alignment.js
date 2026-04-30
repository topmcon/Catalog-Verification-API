#!/usr/bin/env node
/**
 * SYSTEM ALIGNMENT AUDIT
 * ============================================================================
 * Comprehensive cross-reference of every category / type / style / department
 * surface against the Salesforce picklists (single source of truth).
 *
 * Surfaces audited:
 *   1. categories.json (source) ↔ types.json (category_usage)
 *   2. categories.json (source) ↔ styles.json (via category-style-mapping.json)
 *   3. categories.json (source) ↔ category-type-mapping.json (every category has types)
 *   4. categories.json (source) ↔ title-schema-by-category.ts (every relevant cat has schema)
 *   5. categories.json (source) ↔ HARDCODED categoryKeywords map
 *   6. categories.json (source) ↔ HARDCODED categoryDepartmentMap (& correct dept)
 *   7. departments.json ↔ categories.json (every dept used is real)
 *   8. families.json ↔ categories.json (every family used is real)
 *   9. category-type-mapping types ↔ types.json (every mapped type exists)
 *  10. category-style-mapping styles ↔ styles.json (every mapped style exists)
 *  11. types.json category_usage ↔ categories.json (every referenced cat exists)
 *
 * Output: structured report with COUNT and SAMPLE for each misalignment.
 *         Exit code 0 = aligned, 1 = misalignments found.
 * ============================================================================
 */
const fs = require('fs');
const path = require('path');

const PICK = path.join(__dirname, '..', 'src', 'config', 'salesforce-picklists');
const SCHEMA_FILE = path.join(__dirname, '..', 'src', 'config', 'title-schema-by-category.ts');
const DUAL_AI_FILE = path.join(__dirname, '..', 'src', 'services', 'dual-ai-verification.service.ts');

const load = (f) => JSON.parse(fs.readFileSync(path.join(PICK, f), 'utf8'));

const categories = load('categories.json');               // [{category_name, department, family, ...}]
const types = load('types.json');                         // [{type_name, category_usage, ...}]
const styles = load('styles.json');                       // [{style_name, ...}]
const departments = load('departments.json');             // [{department_name}]
const families = load('families.json');                   // [{family_name, department_name}]
const _ctmRaw = load('category-type-mapping.json');
const _csmRaw = load('category-style-mapping.json');
// Normalize: both files are { metadata, mappings: array | category_specific_mappings: array }
// Convert to { CategoryName: { types|styles: [{name},...] } }
function toCategoryKeyed(arr, listField) {
  const out = {};
  if (!Array.isArray(arr)) return out;
  for (const entry of arr) {
    if (!entry || !entry.category_name) continue;
    out[entry.category_name] = { [listField]: entry[listField] || [] };
  }
  return out;
}
const categoryTypeMap = toCategoryKeyed(_ctmRaw.mappings, 'types');
const categoryStyleMap = toCategoryKeyed(_csmRaw.category_specific_mappings, 'styles');

// ── Index sets ──────────────────────────────────────────────────────────
const norm = (s) => String(s || '').trim().toLowerCase();
const categoryNames = new Set(categories.map(c => c.category_name));
const categoryNamesNorm = new Set(categories.map(c => norm(c.category_name)));
const typeNames = new Set(types.map(t => t.type_name));
const typeNamesNorm = new Set(types.map(t => norm(t.type_name)));
const styleNames = new Set(styles.map(s => s.style_name));
const styleNamesNorm = new Set(styles.map(s => norm(s.style_name)));
const deptNames = new Set(departments.map(d => d.department_name));
const familyNames = new Set(families.map(f => f.family_name));

// Build category → department lookup from source of truth
const catToDept = new Map();
for (const c of categories) catToDept.set(c.category_name, c.department);

// ── Source code parse: hardcoded maps ───────────────────────────────────
const dualAi = fs.readFileSync(DUAL_AI_FILE, 'utf8');

function extractRecordKeys(src, varName) {
  // Naive: find `const VAR ... = {` and pull keys until matching `};`
  const re = new RegExp(`const\\s+${varName}\\s*:\\s*Record<[^>]+>\\s*=\\s*\\{`);
  const m = src.match(re);
  if (!m) return null;
  const start = m.index + m[0].length;
  let depth = 1, i = start;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  const body = src.substring(start, i - 1);
  const keys = [];
  const keyRe = /['"]([^'"]+)['"]\s*:/g;
  let km;
  while ((km = keyRe.exec(body)) !== null) keys.push(km[1]);
  return keys;
}

function extractMapValues(src, varName) {
  // For categoryDepartmentMap: { 'Cat': 'Dept', ... }
  const re = new RegExp(`const\\s+${varName}\\s*:\\s*Record<[^>]+>\\s*=\\s*\\{`);
  const m = src.match(re);
  if (!m) return null;
  const start = m.index + m[0].length;
  let depth = 1, i = start;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  const body = src.substring(start, i - 1);
  const out = {};
  const re2 = /['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g;
  let mm;
  while ((mm = re2.exec(body)) !== null) out[mm[1]] = mm[2];
  return out;
}

const hardcodedKeywordsKeys = extractRecordKeys(dualAi, 'categoryKeywords') || [];
const hardcodedDeptMap = extractMapValues(dualAi, 'categoryDepartmentMap') || {};

// ── Title schemas: extract categoryName values ──────────────────────────
const schemaSrc = fs.readFileSync(SCHEMA_FILE, 'utf8');
const schemaCategoryNames = new Set();
const schemaRe = /"categoryName"\s*:\s*"([^"]+)"/g;
let sm;
while ((sm = schemaRe.exec(schemaSrc)) !== null) schemaCategoryNames.add(sm[1]);

// ════════════════════════════════════════════════════════════════════════
// AUDITS
// ════════════════════════════════════════════════════════════════════════
const findings = [];
const record = (id, severity, title, items) => {
  if (!items || items.length === 0) return;
  findings.push({ id, severity, title, count: items.length, sample: items.slice(0, 10), all: items });
};

// (1) Every category in categories.json should have a department that exists
record('A1', 'CRITICAL', 'Categories with unknown department',
  categories.filter(c => !deptNames.has(c.department)).map(c => `${c.category_name} → ${c.department}`));

// (2) Every category should have a family that exists
record('A2', 'CRITICAL', 'Categories with unknown family',
  categories.filter(c => c.family && !familyNames.has(c.family)).map(c => `${c.category_name} → ${c.family}`));

// (3) Family.department_name should reference a real department
record('A3', 'CRITICAL', 'Families pointing to unknown department',
  families.filter(f => !deptNames.has(f.department_name)).map(f => `${f.family_name} → ${f.department_name}`));

// (4) types.json category_usage values must reference real categories
const typesWithBadCategory = [];
for (const t of types) {
  const usage = Array.isArray(t.category_usage) ? t.category_usage : (t.category_usage ? [t.category_usage] : []);
  for (const u of usage) {
    if (!u || u === '*' || u === 'all') continue;
    if (!categoryNamesNorm.has(norm(u))) {
      typesWithBadCategory.push(`${t.type_name} → ${u}`);
    }
  }
}
record('B1', 'HIGH', 'Types referencing unknown categories (types.json category_usage)', typesWithBadCategory);

// (5) category-type-mapping: every key must be a real category
record('C1', 'HIGH', 'category-type-mapping keys not in categories.json',
  Object.keys(categoryTypeMap).filter(k => !categoryNamesNorm.has(norm(k))));

// (6) category-type-mapping: every type listed must exist in types.json
const ctmBadTypes = [];
for (const [cat, def] of Object.entries(categoryTypeMap)) {
  const list = Array.isArray(def?.types) ? def.types : (Array.isArray(def) ? def : []);
  for (const tEntry of list) {
    const tName = typeof tEntry === 'string' ? tEntry : tEntry?.type_name || tEntry?.name;
    if (tName && !typeNamesNorm.has(norm(tName))) {
      ctmBadTypes.push(`${cat} → ${tName}`);
    }
  }
}
record('C2', 'HIGH', 'category-type-mapping types not in types.json', ctmBadTypes);

// (7) category-style-mapping: every key must be a real category
record('D1', 'HIGH', 'category-style-mapping keys not in categories.json',
  Object.keys(categoryStyleMap).filter(k => !categoryNamesNorm.has(norm(k))));

// (8) category-style-mapping: every style must exist in styles.json
const csmBadStyles = [];
for (const [cat, def] of Object.entries(categoryStyleMap)) {
  const list = Array.isArray(def?.styles) ? def.styles : (Array.isArray(def) ? def : []);
  for (const sEntry of list) {
    const sName = typeof sEntry === 'string' ? sEntry : sEntry?.style_name || sEntry?.name;
    if (sName && !styleNamesNorm.has(norm(sName))) {
      csmBadStyles.push(`${cat} → ${sName}`);
    }
  }
}
record('D2', 'HIGH', 'category-style-mapping styles not in styles.json', csmBadStyles);

// (9) Title-schema categoryName values must exist in categories.json
record('E1', 'HIGH', 'title-schema-by-category categoryName not in categories.json',
  Array.from(schemaCategoryNames).filter(n => !categoryNamesNorm.has(norm(n))));

// (10) Hardcoded categoryKeywords map keys must be real categories
record('F1', 'MEDIUM', 'Hardcoded categoryKeywords keys not in categories.json (DUAL_AI)',
  hardcodedKeywordsKeys.filter(k => !categoryNamesNorm.has(norm(k))));

// (11) Hardcoded categoryDepartmentMap keys must be real categories
record('G1', 'MEDIUM', 'Hardcoded categoryDepartmentMap keys not in categories.json (DUAL_AI)',
  Object.keys(hardcodedDeptMap).filter(k => !categoryNamesNorm.has(norm(k))));

// (12) Hardcoded categoryDepartmentMap values must agree with picklist
const deptMismatches = [];
for (const [cat, dept] of Object.entries(hardcodedDeptMap)) {
  const realDept = catToDept.get(cat);
  if (realDept && realDept !== dept) deptMismatches.push(`${cat}: hardcoded="${dept}" actual="${realDept}"`);
}
record('G2', 'HIGH', 'Hardcoded categoryDepartmentMap disagrees with categories.json', deptMismatches);

// (13) Hardcoded categoryDepartmentMap values must reference real departments
record('G3', 'CRITICAL', 'Hardcoded categoryDepartmentMap values not in departments.json',
  Array.from(new Set(Object.values(hardcodedDeptMap))).filter(d => !deptNames.has(d)));

// (14) COVERAGE WARNINGS — categories with NO type mapping at all
const categoriesWithoutTypeMapping = categories.filter(c =>
  !Object.keys(categoryTypeMap).some(k => norm(k) === norm(c.category_name))
).map(c => c.category_name);
record('H1', 'INFO', 'Categories with no entry in category-type-mapping (may be intentional)', categoriesWithoutTypeMapping);

// (15) Distinct sub-products that should have their own title schema
const DISTINCT = ['Wine Cooler','Beverage Center','Ice Maker','Kegerator'];
const missingDistinctSchemas = DISTINCT.filter(name => {
  // Schema match only if categoryName equals exactly
  return !Array.from(schemaCategoryNames).some(s => norm(s) === norm(name));
}).filter(name => categoryNamesNorm.has(norm(name)));  // only flag if SF category exists
record('I1', 'MEDIUM', 'Distinct sub-product categories without dedicated title schema',
  missingDistinctSchemas);

// (16) categoryKeywords COVERAGE: critical bath/plumbing categories present?
// NOTE: Wine Cooler / Beverage Center / Kegerator are TYPES of Refrigerator
// (not standalone categories) — they are NOT expected here.
const CRITICAL_COVERAGE = ['Bidet','Urinal','Bathtub','Bathroom Sink','Kitchen Sink','Bathroom Faucet','Kitchen Faucet'];
const missingFromKeywords = CRITICAL_COVERAGE.filter(c =>
  categoryNamesNorm.has(norm(c)) && !hardcodedKeywordsKeys.some(k => norm(k) === norm(c))
);
record('F2', 'MEDIUM', 'Critical categories missing from hardcoded categoryKeywords (CHECK 1 coverage gap)', missingFromKeywords);

// ════════════════════════════════════════════════════════════════════════
// REPORT
// ════════════════════════════════════════════════════════════════════════
const sevRank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, INFO: 3 };
findings.sort((a, b) => sevRank[a.severity] - sevRank[b.severity] || a.id.localeCompare(b.id));

console.log('═'.repeat(80));
console.log('  SYSTEM ALIGNMENT AUDIT');
console.log('═'.repeat(80));
console.log(`  categories.json       : ${categories.length}`);
console.log(`  types.json            : ${types.length}`);
console.log(`  styles.json           : ${styles.length}`);
console.log(`  departments.json      : ${departments.length}`);
console.log(`  families.json         : ${families.length}`);
console.log(`  category-type-mapping : ${Object.keys(categoryTypeMap).length} categories`);
console.log(`  category-style-mapping: ${Object.keys(categoryStyleMap).length} categories`);
console.log(`  title-schemas         : ${schemaCategoryNames.size}`);
console.log(`  hardcoded keywords map: ${hardcodedKeywordsKeys.length} entries`);
console.log(`  hardcoded dept map    : ${Object.keys(hardcodedDeptMap).length} entries`);
console.log('═'.repeat(80));

const critical = findings.filter(f => f.severity === 'CRITICAL');
const high = findings.filter(f => f.severity === 'HIGH');
const medium = findings.filter(f => f.severity === 'MEDIUM');
const info = findings.filter(f => f.severity === 'INFO');

console.log(`\n  🔴 CRITICAL: ${critical.length}   🟠 HIGH: ${high.length}   🟡 MEDIUM: ${medium.length}   ⚪ INFO: ${info.length}\n`);

const SEV_ICON = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', INFO: '⚪' };
const showAllFor = process.argv.includes('--full');

for (const f of findings) {
  console.log('─'.repeat(80));
  console.log(`${SEV_ICON[f.severity]} [${f.id}] ${f.severity}: ${f.title}`);
  console.log(`   Count: ${f.count}`);
  const items = showAllFor ? f.all : f.sample;
  for (const it of items) console.log(`     • ${it}`);
  if (!showAllFor && f.count > f.sample.length) {
    console.log(`     ... +${f.count - f.sample.length} more (use --full)`);
  }
}

console.log('\n' + '═'.repeat(80));
const blocking = critical.length + high.length;
if (blocking === 0 && medium.length === 0) {
  console.log('  ✅ FULL ALIGNMENT — no misalignments detected');
  process.exit(0);
} else if (blocking === 0) {
  console.log('  🟡 Soft warnings only — system is functionally aligned');
  process.exit(0);
} else {
  console.log(`  ❌ ALIGNMENT FAILURES: ${critical.length} critical, ${high.length} high`);
  console.log('     Fix CRITICAL/HIGH issues before deploying picklist-dependent changes');
  process.exit(1);
}
