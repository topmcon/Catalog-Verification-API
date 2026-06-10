/**
 * GAP-02 — Config cross-coverage scan (runs LOCALLY, no DB needed).
 *
 * Tests the REAL runtime resolution paths (not raw key matching) for every category in
 * salesforce-picklists/categories.json:
 *   - prompt/category schema     → category-config.getCategorySchema (pipeline's primary resolver)
 *   - top-15 attribute schema    → master-category-schema-map.getSchemaForCategory
 *   - title schema               → title-schema-by-category.getCategoryTitleSchema
 *   - type mapping               → category-type-mapping.json (data check on category_name)
 *   - size classes               → category-size-classes.hasSizeClasses (informational)
 * Plus orphan detection: config entries that reference categories not in the picklist.
 *
 * Requires `npm run build` first (uses dist/). Suppress logger noise with LOG_LEVEL=error.
 */
const path = require('path');
const { saveReport, printSummary } = require('./lib/common');

const root = path.join(__dirname, '..', '..');
const categories = require(path.join(root, 'src/config/salesforce-picklists/categories.json'));
const typeMappingFile = require(path.join(root, 'src/config/salesforce-picklists/category-type-mapping.json'));
const categoryConfig = require(path.join(root, 'dist/config/category-config'));
const masterMap = require(path.join(root, 'dist/config/master-category-schema-map'));
const titleSchemas = require(path.join(root, 'dist/config/title-schema-by-category'));
const sizeClasses = require(path.join(root, 'dist/config/category-size-classes'));

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const typeMappedCats = new Set(Object.values(typeMappingFile.mappings || {}).map((m) => norm(m.category_name)));

const result = {
  totals: { categories_in_picklist: categories.length },
  missing_prompt_schema: [],     // pipeline's primary resolver fails → category can't be prompted properly
  missing_attribute_schema: [],  // no top-15 filter attribute schema resolves
  missing_title_schema: [],      // no title schema resolves
  missing_type_mapping: [],      // no entry in category-type-mapping.json
  missing_size_class: [],        // informational
  orphan_type_mappings: [],      // mapping references a category not in the picklist
};

const canonicalKeys = new Set(categories.map((c) => norm(c.category_name)));

for (const c of categories) {
  const label = `${c.category_name} (${c.department})`;
  let promptSchema = null, attrSchema = null, titleSchema = null;
  try { promptSchema = categoryConfig.getCategorySchema(c.category_name); } catch (_) { /* counts as missing */ }
  try { attrSchema = masterMap.getSchemaForCategory(c.category_name); } catch (_) { /* counts as missing */ }
  try { titleSchema = titleSchemas.getCategoryTitleSchema(c.category_name); } catch (_) { /* counts as missing */ }

  if (!promptSchema) result.missing_prompt_schema.push(label);
  if (!attrSchema) result.missing_attribute_schema.push(label);
  if (!titleSchema) result.missing_title_schema.push(label);
  if (!typeMappedCats.has(norm(c.category_name))) result.missing_type_mapping.push(label);
  if (!sizeClasses.hasSizeClasses(c.category_name)) result.missing_size_class.push(label);
}
for (const k of typeMappedCats) if (!canonicalKeys.has(k)) result.orphan_type_mappings.push(k);

const n = categories.length;
const mk = (desc, arr, rated = true) => ({
  description: desc, flagged: arr.length, scanned: n,
  rate: rated ? +(100 * arr.length / n).toFixed(1) : null, examples: arr.slice(0, 20),
});

const summary = {
  'GAP-02a': mk('categories where the pipeline prompt-schema resolver fails', result.missing_prompt_schema),
  'GAP-02b': mk('categories with no top-15 attribute schema (master map)', result.missing_attribute_schema),
  'GAP-02c': mk('categories with no title schema', result.missing_title_schema),
  'GAP-02d': mk('categories with no type mapping', result.missing_type_mapping),
  'GAP-02e': mk('type mappings referencing categories not in the picklist (orphans)', result.orphan_type_mappings, false),
  'GAP-02f': mk('categories without size classes (informational — most are non-dimensional)', result.missing_size_class, false),
};

printSummary('GAP-02 CONFIG CROSS-COVERAGE (runtime resolvers)', summary);
saveReport('scan-config-coverage', { generated: new Date().toISOString(), summary, detail: result });
