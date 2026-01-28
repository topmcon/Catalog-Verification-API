/**
 * CATEGORY CONFIGURATION
 * =======================
 * Single source of truth for all category and attribute definitions.
 * Loads directly from Salesforce picklist data.
 */

import categoryFilterAttributesData from './salesforce-picklists/category-filter-attributes.json';

// Type-safe interface for category filter attributes
interface CategoryFilterConfig {
  department: string;
  category_id: string;
  attributes: Array<{
    rank: number;
    name: string;
    sf_id: string | null;
    type: string;
  }>;
}

interface CategoryFilterAttributes {
  version: string;
  date: string;
  total_categories: number;
  categories: Record<string, CategoryFilterConfig>;
}

const categoryFilterAttributes = categoryFilterAttributesData as CategoryFilterAttributes;

/**
 * PRIMARY ATTRIBUTES (UNIVERSAL - ALL PRODUCTS)
 * These 20 fields apply to EVERY product regardless of category
 */
export const PRIMARY_ATTRIBUTES = [
  'Brand (Verified)',
  'Category / Subcategory (Verified)',
  'Product Family (Verified)',
  'Product Style (Verified) (Category Specific)',
  'Depth / Length (Verified)',
  'Width (Verified)',
  'Height (Verified)',
  'Weight (Verified)',
  'MSRP (Verified)',
  'Market Value',
  'Description',
  'Product Title (Verified)',
  'Details',
  'Features List',
  'UPC / GTIN (Verified)',
  'Model Number (Verified)',
  'Model Number Alias (Symbols Removed)',
  'Model Parent',
  'Model Variant Number',
  'Total Model Variants (List all variant models)'
] as const;

export type PrimaryAttributeName = typeof PRIMARY_ATTRIBUTES[number];

/**
 * PRIMARY ATTRIBUTE FIELD KEYS
 * These field keys should NEVER appear in Top_Filter_Attributes
 */
export const PRIMARY_ATTRIBUTE_FIELD_KEYS = [
  'brand',
  'category_subcategory',
  'product_family',
  'product_style',
  'depth_length',
  'width',
  'height',
  'weight',
  'msrp',
  'market_value',
  'description',
  'product_title',
  'details',
  'features_list',
  'upc_gtin',
  'model_number',
  'model_number_alias',
  'model_parent',
  'model_variant_number',
  'total_model_variants'
] as const;

export type PrimaryAttributeFieldKey = typeof PRIMARY_ATTRIBUTE_FIELD_KEYS[number];

/**
 * Category Schema Interface
 */
export interface CategorySchema {
  categoryId: string;
  categoryName: string;
  department: string;
  top15FilterAttributes: Array<{
    rank: number;
    name: string;
    fieldKey: string; // Generated from name
    sf_id: string | null;
    type: string;
    allowedValues?: string[]; // Optional - not present in category-filter-attributes.json
  }>;
}

/**
 * Convert attribute name to field key
 * Example: "Horsepower" -> "horsepower", "Feed Type" -> "feed_type"
 */
function nameToFieldKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
    .replace(/^_+|_+$/g, '');    // Remove leading/trailing underscores
}

/**
 * Get category schema by category name
 */
export function getCategorySchema(categoryName: string): CategorySchema | null {
  const normalizedName = categoryName.trim();
  
  // Try exact match first
  if (categoryFilterAttributes.categories[normalizedName]) {
    const config = categoryFilterAttributes.categories[normalizedName];
    return {
      categoryId: config.category_id || '',
      categoryName: normalizedName,
      department: config.department || 'OTHER',
      top15FilterAttributes: config.attributes.map(attr => ({
        ...attr,
        fieldKey: nameToFieldKey(attr.name)
      }))
    };
  }
  
  // Try case-insensitive match
  const lowerName = normalizedName.toLowerCase();
  for (const [key, config] of Object.entries(categoryFilterAttributes.categories)) {
    if (key.toLowerCase() === lowerName) {
      return {
        categoryId: config.category_id || '',
        categoryName: key,
        department: config.department || 'OTHER',
        top15FilterAttributes: config.attributes.map(attr => ({
          ...attr,
          fieldKey: nameToFieldKey(attr.name)
        }))
      };
    }
  }
  
  return null;
}

/**
 * Get all categories as a formatted list for AI prompts
 */
export function getCategoryListForPrompt(): string {
  const categories = Object.keys(categoryFilterAttributes.categories).sort();
  return categories.map((cat, idx) => `${idx + 1}. ${cat}`).join('\n');
}

/**
 * Get primary attributes formatted for AI prompts
 */
export function getPrimaryAttributesForPrompt(): string {
  return PRIMARY_ATTRIBUTES.map((attr, idx) => `${idx + 1}. ${attr}`).join('\n');
}

/**
 * Get all categories with their Top 15 filter attributes for AI prompts
 * Only includes attributes that have valid Salesforce IDs
 */
export function getAllCategoriesWithTop15ForPrompt(): string {
  return Object.entries(categoryFilterAttributes.categories)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([categoryName, config]) => {
      const attrs = config.attributes
        .filter(attr => attr.sf_id !== null) // Only include attributes with valid Salesforce IDs
        .map((attr) => {
          const fieldKey = nameToFieldKey(attr.name);
          return `   ${attr.rank}. "${attr.name}" (use key: "${fieldKey}")`;
        })
        .join('\n');
      return `\n${categoryName}:\n${attrs}`;
    })
    .join('\n');
}

/**
 * Get all available categories
 */
export function getAllCategories(): string[] {
  return Object.keys(categoryFilterAttributes.categories).sort();
}

/**
 * Get category by ID
 */
export function getCategoryById(categoryId: string): CategorySchema | null {
  for (const [name, config] of Object.entries(categoryFilterAttributes.categories)) {
    if (config.category_id === categoryId) {
      return {
        categoryId: config.category_id || '',
        categoryName: name,
        department: config.department || 'OTHER',
        top15FilterAttributes: config.attributes.map(attr => ({
          ...attr,
          fieldKey: nameToFieldKey(attr.name)
        }))
      };
    }
  }
  return null;
}

/**
 * Get department for a category
 */
export function getDepartmentForCategory(categoryName: string): string {
  const config = categoryFilterAttributes.categories[categoryName];
  return config?.department || 'OTHER';
}

/**
 * Check if a category exists
 */
export function categoryExists(categoryName: string): boolean {
  return categoryName in categoryFilterAttributes.categories;
}

/**
 * Get total number of configured categories
 */
export function getTotalCategories(): number {
  return Object.keys(categoryFilterAttributes.categories).length;
}

/**
 * Get category configuration metadata
 */
export function getCategoryConfigMetadata() {
  return {
    version: categoryFilterAttributes.version,
    date: categoryFilterAttributes.date,
    total_categories: categoryFilterAttributes.total_categories,
    source: 'category-filter-attributes.json (Salesforce Picklist)'
  };
}
