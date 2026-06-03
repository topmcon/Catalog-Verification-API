#!/usr/bin/env node
/**
 * AUDIT: Type-name validity
 * =========================
 * Asserts that every type name emitted by the type-matcher's hardcoded structures
 * (TYPE_ALIASES values, SEMANTIC_TYPE_PATTERNS typeName) is an actual valid type for its
 * stated category in category-type-mapping.json. Catches the class of bug where a semantic
 * pattern emits e.g. Refrigerator "Built-In" or Range Hood "Wall Mount" that no picklist type
 * matches (Audit type-Finding #A/#E). Read-only; exits non-zero if invalid names are found.
 *
 * Usage: node scripts/audit-type-name-validity.js
 *
 * NOTE: parses the TS source with regex (no ts compile needed) — best-effort, but sufficient
 * to surface the static name/category pairs.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const mapping = require(path.join(__dirname, '..', 'src', 'config', 'salesforce-picklists', 'category-type-mapping.json'));
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'services', 'type-matcher.service.ts'), 'utf8');

// Build category -> Set(valid type names, lowercased).
// category-type-mapping.json shape: { metadata, mappings: [ { category_name, types:[{type_name}] } ] }
const validByCategory = {};
const mappingsArr = Array.isArray(mapping.mappings) ? mapping.mappings : Object.values(mapping.mappings || {});
for (const def of mappingsArr) {
  if (!def || !def.category_name) continue;
  const types = (def.types || []).map(t => (t.type_name || t.name || t).toString().toLowerCase().trim());
  validByCategory[def.category_name.toLowerCase().trim()] = new Set(types);
}

function isValid(category, typeName) {
  const set = validByCategory[(category || '').toLowerCase().trim()];
  if (!set) return null; // unknown category — can't validate
  return set.has((typeName || '').toLowerCase().trim());
}

const problems = [];

// SEMANTIC_TYPE_PATTERNS entries look like: { pattern: /.../, category: 'X', typeName: 'Y' }
const semRe = /category:\s*'([^']+)'\s*,\s*typeName:\s*'([^']+)'/g;
let m;
while ((m = semRe.exec(src)) !== null) {
  const [, category, typeName] = m;
  const v = isValid(category, typeName);
  if (v === false) problems.push({ source: 'SEMANTIC_TYPE_PATTERNS', category, typeName });
}

// TYPE_ALIASES entries look like: 'alias': { 'Category': 'TypeName', ... }
const aliasBlock = src.match(/TYPE_ALIASES[^=]*=\s*\{([\s\S]*?)\n\};/);
if (aliasBlock) {
  const pairRe = /'([^']+)':\s*'([^']+)'/g;
  let a;
  while ((a = pairRe.exec(aliasBlock[1])) !== null) {
    const [, category, typeName] = a;
    // Only treat as category->type when category is a known category
    if (validByCategory[category.toLowerCase().trim()]) {
      const v = isValid(category, typeName);
      if (v === false) problems.push({ source: 'TYPE_ALIASES', category, typeName });
    }
  }
}

console.log(`Checked ${Object.keys(validByCategory).length} categories from category-type-mapping.json.`);
if (problems.length === 0) {
  console.log('✅ All static type names are valid for their categories.');
  process.exit(0);
}
console.log(`\n❌ ${problems.length} static type name(s) are NOT valid for their category:\n`);
for (const p of problems) {
  const valid = [...(validByCategory[p.category.toLowerCase().trim()] || [])].slice(0, 12);
  console.log(`  [${p.source}] "${p.typeName}" is not a valid type for "${p.category}".`);
  console.log(`        valid: ${valid.join(', ')}${valid.length === 12 ? ', …' : ''}`);
}
process.exit(1);
