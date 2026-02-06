/**
 * CATEGORY CONFIGURATION
 * =======================
 * Single source of truth for all category and attribute definitions.
 * Loads directly from Salesforce picklist data.
 */

import categoryFilterAttributesData from './salesforce-picklists/category-filter-attributes.json';

// Type-safe interface for category filter attributes
interface CategoryFilterConfig {
  department?: string;  // Optional - not present in all category versions
  category_id?: string; // Optional - not present in all category versions
  attributes: Array<{
    rank: number;
    name: string;
    sf_id: string | null;
    type: string;
  }>;
}

interface CategoryFilterAttributes {
  version: string;
  date?: string;
  total_categories?: number;
  categories: Record<string, CategoryFilterConfig>;
}

const categoryFilterAttributes = categoryFilterAttributesData as unknown as CategoryFilterAttributes;

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
  // 'market_value', // Removed - no longer sent to Salesforce
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
 * Build a schema from config
 */
function buildSchemaFromConfig(key: string, config: any): CategorySchema {
  return {
    categoryId: config.category_id || '',
    categoryName: key,
    department: config.department || 'OTHER',
    top15FilterAttributes: config.attributes.map((attr: any) => ({
      ...attr,
      fieldKey: nameToFieldKey(attr.name)
    }))
  };
}

/**
 * Calculate word-based similarity between two category names
 * Returns a score from 0 to 1
 */
function calculateCategorySimilarity(name1: string, name2: string): number {
  // Normalize both names: lowercase, remove #, split into words
  const normalize = (s: string) => s.toLowerCase()
    .replace(/ #$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 1); // Ignore single-char words
  
  const words1 = new Set(normalize(name1));
  const words2 = new Set(normalize(name2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  // Count matching words
  let matches = 0;
  let partialMatches = 0;
  
  for (const word of words1) {
    if (words2.has(word)) {
      matches++;
    } else {
      // Check for partial word matches (e.g., "light" matches "lighting", "lighted", "lights")
      for (const word2 of words2) {
        // Get the root of common words (light, lighting, lighted -> light)
        const root1 = word.replace(/(ing|ed|s|er|est)$/, '');
        const root2 = word2.replace(/(ing|ed|s|er|est)$/, '');
        
        if (root1 === root2 || word.includes(word2) || word2.includes(word)) {
          partialMatches += 0.8; // Partial/root match worth 80%
          break;
        }
      }
    }
  }
  
  const totalMatches = matches + partialMatches;
  
  // For single-word categories, partial matches are important
  // e.g., "Decorative Lighting" should match something with "Lighting"
  if (words1.size <= 2 && partialMatches > 0) {
    // Boost score for partial matches on short names
    return (totalMatches / words1.size) * 0.7; // Scale to max 0.7 for single-keyword matches
  }
  
  // Jaccard-like similarity with bonus for exact word matches
  const unionSize = words1.size + words2.size - matches;
  return totalMatches / Math.max(unionSize, 1);
}

/**
 * Check if two category names share a relevant keyword
 * Prevents matching "Chairs" to "Air Conditioners" just because they share pattern
 */
function shareRelevantKeyword(name1: string, name2: string): boolean {
  const normalize = (s: string) => s.toLowerCase()
    .replace(/ #$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 2); // Only meaningful words
  
  const words1 = normalize(name1);
  const words2 = new Set(normalize(name2));
  
  // Check for any exact word match or root match
  for (const word of words1) {
    if (words2.has(word)) return true;
    
    // Check root matches
    const root1 = word.replace(/(ing|ed|s|er|est)$/, '');
    for (const word2 of words2) {
      const root2 = word2.replace(/(ing|ed|s|er|est)$/, '');
      if (root1 === root2 && root1.length > 3) return true; // Root must be substantial
    }
  }
  
  return false;
}

/**
 * Find the best matching category from available schemas
 * Uses contextual word matching instead of hardcoded mappings
 */
function findBestMatchingCategory(categoryName: string): { key: string; config: any; score: number } | null {
  const categories = Object.entries(categoryFilterAttributes.categories);
  
  let bestMatch: { key: string; config: any; score: number } | null = null;
  
  for (const [key, config] of categories) {
    // Must share at least one relevant keyword to be considered
    if (!shareRelevantKeyword(categoryName, key)) {
      continue;
    }
    
    const score = calculateCategorySimilarity(categoryName, key);
    
    // Require higher threshold (0.5) for fuzzy matching
    if (score >= 0.5 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { key, config, score };
    }
  }
  
  return bestMatch;
}

/**
 * Get category schema by category name
 * Handles variations: with/without # suffix, case-insensitive, contextual word matching
 */
export function getCategorySchema(categoryName: string): CategorySchema | null {
  const normalizedName = categoryName.trim();
  
  // Try exact match first
  if (categoryFilterAttributes.categories[normalizedName]) {
    return buildSchemaFromConfig(normalizedName, categoryFilterAttributes.categories[normalizedName]);
  }
  
  // Build a list of variations to try
  const variations: string[] = [];
  
  // Remove or add # suffix
  if (normalizedName.endsWith(' #')) {
    variations.push(normalizedName.slice(0, -2)); // Remove " #"
  } else {
    variations.push(normalizedName + ' #'); // Add " #"
  }
  
  // Try each variation with exact match
  for (const variation of variations) {
    if (categoryFilterAttributes.categories[variation]) {
      return buildSchemaFromConfig(variation, categoryFilterAttributes.categories[variation]);
    }
  }
  
  // Try case-insensitive match (both with and without #)
  const lowerName = normalizedName.toLowerCase().replace(/ #$/, ''); // Normalize without #
  for (const [key, config] of Object.entries(categoryFilterAttributes.categories)) {
    const keyLower = key.toLowerCase().replace(/ #$/, ''); // Normalize key without #
    if (keyLower === lowerName) {
      return buildSchemaFromConfig(key, config);
    }
  }
  
  // Try contextual word-based matching for related categories
  // e.g., "Lighted Ceiling Fans #" -> "Ceiling Fans with Light #" (shares "ceiling", "fans", "light")
  const bestMatch = findBestMatchingCategory(normalizedName);
  if (bestMatch && bestMatch.score >= 0.5) {
    // Log the fuzzy match for debugging
    console.log(`[CategorySchema] Fuzzy matched "${categoryName}" -> "${bestMatch.key}" (score: ${bestMatch.score.toFixed(2)})`);
    return buildSchemaFromConfig(bestMatch.key, bestMatch.config);
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
 * Keywords that indicate specific lighting fixture types
 * Used to narrow down generic categories like "Decorative Lighting #"
 */
const LIGHTING_TYPE_KEYWORDS: Record<string, string[]> = {
  'Chandeliers #': ['chandelier', 'candelabra', 'crystal light', 'crystal chandelier'],
  'Pendants #': ['pendant', 'island light', 'mini pendant', 'linear pendant', 'cluster pendant', 'drum pendant'],
  'Wall Sconces #': ['sconce', 'wall light', 'wall lamp', 'wall fixture', 'wall mount light'],
  'Flush and Semi-Flush #': ['flush mount', 'semi-flush', 'ceiling mount', 'close to ceiling', 'flush ceiling'],
  'Ceiling Lights #': ['ceiling light', 'ceiling fixture', 'surface mount'],
  'Vanity Lighting #': ['vanity light', 'bath bar', 'bathroom vanity', 'bath light'],
  'Outdoor Lighting #': ['outdoor light', 'exterior light', 'landscape light', 'porch light', 'wall lantern', 'post light'],
  'Recessed Lighting #': ['recessed', 'can light', 'downlight', 'trim'],
  'Track and Rail Lighting #': ['track light', 'rail light', 'track head', 'monorail'],
};

/**
 * Keywords for other product types
 */
const PRODUCT_TYPE_KEYWORDS: Record<string, string[]> = {
  'Ceiling Fans #': ['ceiling fan', 'fan with light', 'fan blade', 'blade span', 'cfm'],
  'Ceiling Fans with Light #': ['fan with light', 'lighted fan', 'fan light kit'],
  'Barbeque': ['grill', 'barbeque', 'bbq', 'burner', 'btus', 'grilling'],
  'Toilets #': ['toilet', 'commode', 'gpf', 'elongated bowl', 'round bowl'],
  'Bathtubs #': ['bathtub', 'tub', 'soaking tub', 'freestanding tub', 'whirlpool'],
  'Kitchen Faucets #': ['kitchen faucet', 'pull-down', 'pull-out faucet'],
  'Bathroom Faucets #': ['bathroom faucet', 'lavatory faucet', 'widespread', 'centerset'],
};

/**
 * Refine a generic category to a more specific one using product context
 * This is called when the original category has no Top 15 schema defined
 * 
 * @param genericCategory - The original category (e.g., "Decorative Lighting #")
 * @param productContext - Product data to help narrow down the category
 * @returns A more specific category name, or the original if none found
 */
export function refineCategoryFromContext(
  genericCategory: string,
  productContext: {
    title?: string;
    description?: string;
    attributes?: Array<{ name: string; value: string }>;
    productType?: string;
  }
): string {
  // Combine all text for keyword matching
  const searchText = [
    productContext.title || '',
    productContext.description || '',
    productContext.productType || '',
    ...(productContext.attributes || []).map(a => `${a.name} ${a.value}`)
  ].join(' ').toLowerCase();
  
  // Determine which keyword set to use based on category
  const categoryLower = genericCategory.toLowerCase();
  let keywordSets: Record<string, string[]>;
  
  if (categoryLower.includes('light') || categoryLower.includes('lamp')) {
    keywordSets = LIGHTING_TYPE_KEYWORDS;
  } else {
    keywordSets = PRODUCT_TYPE_KEYWORDS;
  }
  
  // Find the best matching specific category
  let bestMatch: { category: string; score: number } | null = null;
  
  for (const [specificCategory, keywords] of Object.entries(keywordSets)) {
    let matchScore = 0;
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        matchScore++;
      }
    }
    
    if (matchScore > 0 && (!bestMatch || matchScore > bestMatch.score)) {
      // Only accept if the specific category has a schema
      if (categoryFilterAttributes.categories[specificCategory]) {
        bestMatch = { category: specificCategory, score: matchScore };
      }
    }
  }
  
  if (bestMatch) {
    console.log(`[CategoryRefinement] Refined "${genericCategory}" -> "${bestMatch.category}" (matched ${bestMatch.score} keywords)`);
    return bestMatch.category;
  }
  
  return genericCategory;
}

/**
 * Get category schema, with optional product context for refinement
 * If the category has no schema, attempts to find a more specific category using product data
 */
export function getCategorySchemaWithContext(
  categoryName: string,
  productContext?: {
    title?: string;
    description?: string;
    attributes?: Array<{ name: string; value: string }>;
    productType?: string;
  }
): CategorySchema | null {
  // First try direct lookup
  let schema = getCategorySchema(categoryName);
  
  if (schema) {
    return schema;
  }
  
  // If no schema and we have context, try to refine the category
  if (productContext) {
    const refinedCategory = refineCategoryFromContext(categoryName, productContext);
    if (refinedCategory !== categoryName) {
      schema = getCategorySchema(refinedCategory);
      if (schema) {
        return schema;
      }
    }
  }
  
  return null;
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
