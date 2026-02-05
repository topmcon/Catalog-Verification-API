#!/usr/bin/env node
/**
 * Regenerate TypeScript category-style-mapping from JSON source
 * 
 * Usage: node scripts/regenerate-category-style-mapping.js
 * 
 * This script reads category-type-style-mapping.json and generates
 * src/config/category-style-mapping.ts
 */

const fs = require('fs');
const path = require('path');

const JSON_FILE = path.join(__dirname, '..', 'category-type-style-mapping.json');
const TS_FILE = path.join(__dirname, '..', 'src', 'config', 'category-style-mapping.ts');

console.log('🔄 Regenerating category-style-mapping.ts from JSON...\n');

// Read JSON
const json = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
const metadata = json.metadata;
const categories = json.categories;

console.log(`📊 Source: ${metadata.total_categories} categories`);
console.log(`   Existing styles: ${metadata.existing_styles_count}`);
console.log(`   New styles needed: ${metadata.new_styles_needed_count}`);

// Helper to escape single quotes
const escapeQuotes = (str) => (str || '').replace(/'/g, "\\'");

// Build category entries (deduplicate by category_name)
const catEntries = [];
const seenCategories = new Set();
const duplicates = [];

for (const [idx, cat] of Object.entries(categories)) {
  const catName = cat.category_name;
  
  // Skip duplicates
  if (seenCategories.has(catName)) {
    duplicates.push(catName);
    continue;
  }
  seenCategories.add(catName);
  
  const values = cat.category_type_style?.values || [];
  
  const valuesStr = values.map(v => 
    `      { name: '${escapeQuotes(v.name)}', style_id: ${v.style_id ? "'" + v.style_id + "'" : 'null'}, status: '${v.status}' }`
  ).join(',\n');
  
  catEntries.push(`  '${escapeQuotes(catName)}': {
    department: '${escapeQuotes(cat.department)}',
    category_name: '${escapeQuotes(catName)}',
    label: '${escapeQuotes(cat.category_type_style?.label || '')}',
    logic: '${escapeQuotes(cat.logic || '')}',
    values: [
${valuesStr}
    ]
  }`);
}

// Generate TypeScript file
const ts = `/**
 * Category-Type-Style Mapping
 * 
 * AUTO-GENERATED from category-type-style-mapping.json
 * Generated: ${new Date().toISOString().split('T')[0]}
 * Total Categories: ${metadata.total_categories}
 * Existing Styles: ${metadata.existing_styles_count}
 * New Styles Needed: ${metadata.new_styles_needed_count}
 * 
 * Purpose: Maps each product category to its valid style/type values
 * Approach: One filter per category based on how customers search
 * 
 * ⚠️ DO NOT EDIT DIRECTLY - Edit the JSON file and run:
 *    node scripts/regenerate-category-style-mapping.js
 */

export interface StyleValue {
  name: string;
  style_id: string | null;
  status: 'existing' | 'new_needed';
}

export interface CategoryStyleMapping {
  department: string;
  category_name: string;
  label: string;
  logic: string;
  values: StyleValue[];
}

/**
 * Universal design/aesthetic styles - used as fallback when no category-specific styles apply
 */
export const UNIVERSAL_DESIGN_STYLES = [
  'Modern',
  'Contemporary', 
  'Traditional',
  'Transitional',
  'Industrial',
  'Farmhouse',
  'Rustic',
  'Coastal',
  'Minimalist',
  'Mid-Century Modern',
  'Bohemian',
  'Scandinavian',
  'Art Deco',
  'Victorian',
  'Mediterranean'
];

/**
 * Complete category-to-style mapping with Salesforce style_ids
 */
export const CATEGORY_STYLE_MAP: Record<string, CategoryStyleMapping> = {
${catEntries.join(',\n')}
};

/**
 * Get valid styles for a category
 */
export function getValidStylesForCategory(category: string): string[] {
  const mapping = CATEGORY_STYLE_MAP[category];
  if (!mapping) return [];
  return mapping.values.map(v => v.name);
}

/**
 * Get valid styles with IDs for a category
 */
export function getValidStylesWithIdsForCategory(category: string): StyleValue[] {
  const mapping = CATEGORY_STYLE_MAP[category];
  if (!mapping) return [];
  return mapping.values;
}

/**
 * Get style ID for a category and style name
 */
export function getStyleIdForCategory(category: string, styleName: string): string | null {
  const mapping = CATEGORY_STYLE_MAP[category];
  if (!mapping) return null;
  
  // Normalize for comparison
  const normalizeForComparison = (str: string): string => 
    str.toLowerCase().trim().replace(/[\\s\\-_]/g, '');
  
  const normalizedInput = normalizeForComparison(styleName);
  
  // PASS 1: Exact match
  const exactMatch = mapping.values.find(v => v.name.toLowerCase() === styleName.toLowerCase());
  if (exactMatch) return exactMatch.style_id;
  
  // PASS 2: Normalized match
  const normalizedMatch = mapping.values.find(v => 
    normalizeForComparison(v.name) === normalizedInput
  );
  if (normalizedMatch) return normalizedMatch.style_id;
  
  return null;
}

/**
 * Check if a style is valid for a category
 */
export function isValidStyleForCategory(category: string, styleName: string): boolean {
  const validStyles = getValidStylesForCategory(category);
  if (validStyles.length === 0) return false;
  
  const normalizeForComparison = (str: string): string => 
    str.toLowerCase().trim().replace(/[\\s\\-_]/g, '');
  
  const normalizedInput = normalizeForComparison(styleName);
  
  return validStyles.some(vs => {
    // Exact match
    if (vs.toLowerCase() === styleName.toLowerCase()) return true;
    // Normalized match
    if (normalizeForComparison(vs) === normalizedInput) return true;
    return false;
  });
}

/**
 * Normalize string for contextual comparison
 * Removes spaces, hyphens, underscores and converts to lowercase
 * Examples: "Shower Head" -> "showerhead", "Rain-Head" -> "rainhead"
 */
function normalizeForComparison(str: string): string {
  return str.toLowerCase().trim().replace(/[\\s\\-_]/g, '');
}

/**
 * Match a potential style to a valid style for a category
 * Uses two-pass matching: exact first, then normalized/contextual
 * @param category - The category name
 * @param potentialStyle - The style to match
 * @returns The matched style name if found, null otherwise
 */
export function matchStyleToCategory(category: string, potentialStyle: string): string | null {
  const validStyles = getValidStylesForCategory(category);
  
  if (validStyles.length === 0) {
    return null;
  }
  
  const normalized = potentialStyle.toLowerCase().trim();
  const contextual = normalizeForComparison(potentialStyle);
  
  // PASS 1: Exact match
  const exactMatch = validStyles.find(s => s.toLowerCase() === normalized);
  if (exactMatch) return exactMatch;
  
  // PASS 2: Contextual/normalized match (handles "shower head" vs "showerhead")
  const contextualMatch = validStyles.find(s => normalizeForComparison(s) === contextual);
  if (contextualMatch) return contextualMatch;
  
  // PASS 3: Partial match (contains) - both exact and normalized
  const partialMatch = validStyles.find(s => 
    s.toLowerCase().includes(normalized) || normalized.includes(s.toLowerCase())
  );
  if (partialMatch) return partialMatch;
  
  const contextualPartialMatch = validStyles.find(s => {
    const normS = normalizeForComparison(s);
    return normS.includes(contextual) || contextual.includes(normS);
  });
  if (contextualPartialMatch) return contextualPartialMatch;
  
  // Special case: extract style from subcategory
  if (category.toLowerCase() === 'oven' && normalized.includes('microwave')) {
    return 'Microwave Combo';
  }
  
  if (category.toLowerCase() === 'oven' && (normalized.includes('double') || normalized.includes('dual'))) {
    return 'Double Wall';
  }
  
  if (category.toLowerCase() === 'oven' && normalized.includes('single')) {
    return 'Single';
  }
  
  return null;
}

/**
 * Get all categories in a department
 */
export function getCategoriesInDepartment(department: string): string[] {
  return Object.keys(CATEGORY_STYLE_MAP).filter(cat => 
    CATEGORY_STYLE_MAP[cat].department.toLowerCase() === department.toLowerCase()
  );
}

/**
 * Get all departments
 */
export function getAllDepartments(): string[] {
  const depts = new Set<string>();
  Object.values(CATEGORY_STYLE_MAP).forEach(cat => {
    depts.add(cat.department);
  });
  return Array.from(depts).sort();
}

export default {
  CATEGORY_STYLE_MAP,
  UNIVERSAL_DESIGN_STYLES,
  getValidStylesForCategory,
  getValidStylesWithIdsForCategory,
  getStyleIdForCategory,
  isValidStyleForCategory,
  matchStyleToCategory,
  getCategoriesInDepartment,
  getAllDepartments
};
`;

// Write TS file
fs.writeFileSync(TS_FILE, ts, 'utf8');

console.log(`\n✅ Generated: ${TS_FILE}`);
console.log(`   Categories: ${catEntries.length}`);

if (duplicates.length > 0) {
  console.log(`\n⚠️  WARNING: ${duplicates.length} duplicate category names were skipped:`);
  duplicates.forEach(d => console.log(`   - ${d}`));
}
console.log('\n📋 Sample categories:');
Object.entries(categories).slice(0, 5).forEach(([idx, cat]) => {
  const styleCount = cat.category_type_style?.values?.length || 0;
  console.log(`   - ${cat.category_name}: ${styleCount} styles`);
});

// Show shower categories specifically
console.log('\n🚿 Shower-related categories:');
Object.entries(categories).forEach(([idx, cat]) => {
  if (cat.category_name.toLowerCase().includes('shower')) {
    const styles = cat.category_type_style?.values?.map(v => v.name) || [];
    console.log(`   - ${cat.category_name}: ${styles.join(', ')}`);
  }
});
