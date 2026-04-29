#!/usr/bin/env node
/**
 * Generate two markdown files for human curation of (category, type) → style mappings.
 *
 * OUTPUT:
 *   docs/STYLES-MASTER-LIST.md          - All styles with SF IDs (reference)
 *   docs/CATEGORY-TYPE-STYLE-CURATION.md - Fillable template per category/type
 *
 * USAGE:
 *   node scripts/generate-style-curation-templates.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PICKLISTS = path.join(ROOT, 'src/config/salesforce-picklists');
const OUT_DIR = path.join(ROOT, 'docs');

const categories  = require(path.join(PICKLISTS, 'categories.json'));
const typeMapping = require(path.join(PICKLISTS, 'category-type-mapping.json'));
const styles      = require(path.join(PICKLISTS, 'styles.json'));
const styleMap    = require(path.join(PICKLISTS, 'category-style-mapping.json'));

// ─────────────────────────────────────────────────────────────
// FILE 1: STYLES MASTER LIST
// ─────────────────────────────────────────────────────────────

function buildStylesMasterList() {
  const sorted = [...styles].sort((a, b) => a.style_name.localeCompare(b.style_name));

  const lines = [];
  lines.push('# Styles Master List');
  lines.push('');
  lines.push(`Total styles: **${sorted.length}**`);
  lines.push('');
  lines.push(`Source: \`src/config/salesforce-picklists/styles.json\``);
  lines.push('');
  lines.push('Use the `style_name` column when filling in the curation template.');
  lines.push('The `style_id` is the Salesforce ID — included for reference / future automation.');
  lines.push('');
  lines.push('| # | Style Name | Salesforce ID | Description |');
  lines.push('|---|------------|---------------|-------------|');
  sorted.forEach((s, i) => {
    const desc = (s.description || '').replace(/\|/g, '\\|');
    lines.push(`| ${i + 1} | ${s.style_name} | \`${s.style_id}\` | ${desc} |`);
  });
  lines.push('');

  // Quick-copy block
  lines.push('## Quick-copy list (style names only)');
  lines.push('');
  lines.push('```');
  sorted.forEach(s => lines.push(s.style_name));
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────
// FILE 2: CATEGORY × TYPE × STYLE CURATION TEMPLATE
// ─────────────────────────────────────────────────────────────

function getCurrentStylesForCategory(categoryName) {
  const mapping = styleMap.category_specific_mappings.find(
    m => m.category_name.toLowerCase() === categoryName.toLowerCase()
  );
  if (mapping && Array.isArray(mapping.styles)) {
    return {
      style_type: mapping.style_type || 'aesthetic',
      styles: mapping.styles.map(s => s.style_name),
      source: 'category_specific_mappings'
    };
  }
  // Fallback to universal
  return {
    style_type: 'aesthetic',
    styles: styleMap.universal_styles.map(s => s.style_name),
    source: 'universal_styles (fallback)'
  };
}

function getTypesForCategory(categoryName) {
  const mapping = typeMapping.mappings.find(
    m => m.category_name.toLowerCase() === categoryName.toLowerCase()
  );
  if (!mapping || !Array.isArray(mapping.types)) return [];
  return mapping.types.map(t => t.type_name);
}

function buildCurationTemplate() {
  const sortedCategories = [...categories].sort((a, b) => {
    const dep = a.department.localeCompare(b.department);
    if (dep !== 0) return dep;
    return a.category_name.localeCompare(b.category_name);
  });

  const lines = [];
  lines.push('# Category × Type × Style Curation Template');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString().split('T')[0]}`);
  lines.push('');
  lines.push('## Purpose');
  lines.push('');
  lines.push('For each `(category, type)` combination, fill in the **applicable styles** by copying');
  lines.push('style names from `STYLES-MASTER-LIST.md`.');
  lines.push('');
  lines.push('When you give this back, the system will use it to build a `(category, type) → styles`');
  lines.push('mapping that narrows the AI prompt to only show styles valid for the chosen type.');
  lines.push('');
  lines.push('## How to fill it in');
  lines.push('');
  lines.push('- Replace the `_TODO_` placeholder under each Type with a comma-separated list of style names.');
  lines.push('- Style names must match exactly what is in `STYLES-MASTER-LIST.md` (case-sensitive).');
  lines.push('- If a category has **no types**, fill in styles under the single "(no types)" row.');
  lines.push('- If `styles_apply: false` for a category, you can leave it as `_N/A_` or skip it.');
  lines.push('- The "Current styles" line shows what the system uses today (for reference only).');
  lines.push('');
  lines.push('## Legend');
  lines.push('');
  lines.push('- **`styles_apply`**: whether style is a meaningful field for this category (per `categories.json`)');
  lines.push('- **Current style_type**: `aesthetic` (Modern/Traditional/etc) vs `configuration` (Single Hole/Wall Mount/etc)');
  lines.push('- **Current styles**: what the AI sees today as the valid style list for this category');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Group by department
  const byDept = {};
  for (const cat of sortedCategories) {
    if (!byDept[cat.department]) byDept[cat.department] = [];
    byDept[cat.department].push(cat);
  }

  // TOC
  lines.push('## Table of Contents');
  lines.push('');
  for (const dept of Object.keys(byDept).sort()) {
    const anchor = dept.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    lines.push(`- [${dept}](#${anchor}) (${byDept[dept].length} categories)`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Per-department sections
  for (const dept of Object.keys(byDept).sort()) {
    lines.push(`## ${dept}`);
    lines.push('');

    for (const cat of byDept[dept]) {
      const types = getTypesForCategory(cat.category_name);
      const current = getCurrentStylesForCategory(cat.category_name);

      lines.push(`### ${cat.category_name}`);
      lines.push('');
      lines.push(`- **Department**: ${cat.department}`);
      lines.push(`- **Family**: ${cat.family || '_unknown_'}`);
      lines.push(`- **styles_apply**: \`${cat.styles_apply}\``);
      lines.push(`- **Category SF ID**: \`${cat.category_id}\``);
      lines.push(`- **Current style_type**: \`${current.style_type}\` (source: ${current.source})`);
      lines.push(`- **Current styles** (${current.styles.length}): ${current.styles.join(', ') || '_none_'}`);
      lines.push('');

      if (cat.styles_apply === false) {
        lines.push('> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.');
        lines.push('');
      }

      if (types.length === 0) {
        lines.push('**Types**: _none defined_');
        lines.push('');
        lines.push('| Type | Applicable Styles |');
        lines.push('|------|-------------------|');
        lines.push('| _(no types)_ | `_TODO_` |');
        lines.push('');
      } else {
        lines.push(`**Types** (${types.length}):`);
        lines.push('');
        lines.push('| Type | Applicable Styles |');
        lines.push('|------|-------------------|');
        for (const t of types) {
          lines.push(`| ${t} | \`_TODO_\` |`);
        }
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────
// WRITE FILES
// ─────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const masterPath = path.join(OUT_DIR, 'STYLES-MASTER-LIST.md');
  const curationPath = path.join(OUT_DIR, 'CATEGORY-TYPE-STYLE-CURATION.md');

  const masterContent = buildStylesMasterList();
  const curationContent = buildCurationTemplate();

  fs.writeFileSync(masterPath, masterContent, 'utf8');
  fs.writeFileSync(curationPath, curationContent, 'utf8');

  // Summary stats
  const totalCategories = categories.length;
  const categoriesWithTypes = categories.filter(c => getTypesForCategory(c.category_name).length > 0).length;
  const categoriesStylesApply = categories.filter(c => c.styles_apply !== false).length;
  let totalRows = 0;
  for (const cat of categories) {
    const types = getTypesForCategory(cat.category_name);
    totalRows += types.length === 0 ? 1 : types.length;
  }

  console.log('✅ Generated curation templates:');
  console.log('');
  console.log(`   📄 ${path.relative(ROOT, masterPath)}`);
  console.log(`      • ${styles.length} styles in master list`);
  console.log('');
  console.log(`   📄 ${path.relative(ROOT, curationPath)}`);
  console.log(`      • ${totalCategories} total categories`);
  console.log(`      • ${categoriesStylesApply} have styles_apply = true`);
  console.log(`      • ${categoriesWithTypes} have types defined`);
  console.log(`      • ${totalRows} (category, type) rows to fill in`);
  console.log('');
  console.log('Next: open CATEGORY-TYPE-STYLE-CURATION.md and fill in the _TODO_ cells.');
}

main();
