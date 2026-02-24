/**
 * Category Matcher Service
 * Matches incoming product data to the correct category schema
 */

import { CATEGORY_ALIASES } from '../config/category-schema';
import categoriesPicklist from '../config/salesforce-picklists/categories.json';

interface CategoryPicklistItem {
  category_name: string;
  department: string;
}

const CATEGORIES: CategoryPicklistItem[] = categoriesPicklist as CategoryPicklistItem[];

// Build runtime lookups from categories
const CATEGORY_DEPARTMENT_LOOKUP = new Map<string, string>();
for (const category of CATEGORIES) {
  CATEGORY_DEPARTMENT_LOOKUP.set(category.category_name.toLowerCase(), category.department);
}

// Department to categories mapping (comprehensive)
// AUTO-GENERATED FROM: src/config/salesforce-picklists/categories.json
// Last sync: 2026-02-24
const DEPARTMENT_CATEGORIES: Record<string, string[]> = {
  'Appliances': [
    'Refrigerator',
    'Dishwasher',
    'Range',
    'Oven',
    'Cooktop',
    'Microwave',
    'Range Hood',
    'Washer',
    'Dryer',
    'Freezer',
    'All in One Washer / Dryer',
    'Barbeque',
    'Coffee Maker',
    'Icemaker',
    'Garbage Disposal'
  ],
  'Plumbing & Bath': [
    'Bathroom Cabinet Hardware',
    'Outdoor Shower Faucet',
    'Bathroom Faucet',
    'Bathroom Hardware and Accessories',
    'Bathroom Mirror',
    'Bathroom Sink',
    'Bathroom Vanity',
    'Bathtub',
    'Bathtub Waste & Overflow',
    'Bidet',
    'Bidet Faucet',
    'Bidet Seat',
    'Shower',
    'Shower Faucet',
    'Steam Shower'
  ],
  'Lighting': [
    'Vanity Cabinet Hardware',
    'Skylight',
    'Bathroom Lighting',
    'Vanity Lighting',
    'Chandelier',
    'Commercial Lighting',
    'LED Lighting',
    'Post Light',
    'Recessed Lighting',
    'Step Lighting',
    'Track and Rail Lighting',
    'Under Cabinet Light',
    'Wall Sconce',
    'Lamp',
    'Ceiling Light',
    'Flush and Semi-Flush',
    'Island Lighting',
    'Pendant',
    'Kitchen Lighting',
    'Landscape Lighting'
  ],
  'Home Decor & Fixtures': [
    'Drawer', 'Cabinet Organization and Storage', 'Cabinet Hardware'
  ],
  'HVAC': [
    'Air Conditioner', 'Dehumidifier', 'Exhaust Fan', 'Attic Fan'
  ]
};

export interface CategoryMatch {
  categoryName: string;
  department: string;
  confidence: number;
  matchedOn: string;
}

/**
 * Normalize text for matching
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Match product data to a category
 */
export function matchCategory(productData: {
  category?: string;
  subcategory?: string;
  productType?: string;
  title?: string;
  description?: string;
}): CategoryMatch | null {
  const { category, subcategory, productType, title, description } = productData;
  
  // Priority 1: Direct category match
  if (category) {
    const directMatch = findDirectMatch(category);
    if (directMatch) return { ...directMatch, confidence: 1.0, matchedOn: 'category' };
  }
  
  // Priority 2: Subcategory match
  if (subcategory) {
    const subMatch = findDirectMatch(subcategory);
    if (subMatch) return { ...subMatch, confidence: 0.95, matchedOn: 'subcategory' };
  }
  
  // Priority 3: Product type match
  if (productType) {
    const typeMatch = findDirectMatch(productType);
    if (typeMatch) return { ...typeMatch, confidence: 0.9, matchedOn: 'productType' };
  }
  
  // Priority 4: Title keyword match
  if (title) {
    const titleMatch = findKeywordMatch(title);
    if (titleMatch) return { ...titleMatch, confidence: 0.8, matchedOn: 'title' };
  }
  
  // Priority 5: Description keyword match
  if (description) {
    const descMatch = findKeywordMatch(description);
    if (descMatch) return { ...descMatch, confidence: 0.6, matchedOn: 'description' };
  }
  
  return null;
}

/**
 * Find direct category match
 */
function findDirectMatch(input: string): { categoryName: string; department: string } | null {
  const normalized = normalizeText(input);
  
  // Check each department
  for (const [dept, categories] of Object.entries(DEPARTMENT_CATEGORIES)) {
    for (const cat of categories) {
      const cleanCat = cat.replace(/ #$/, ''); // Remove trailing #
      if (normalizeText(cleanCat) === normalized) {
        return { categoryName: cat, department: dept };
      }
      
      // Check aliases
      const aliases = CATEGORY_ALIASES[cleanCat] || [];
      for (const alias of aliases) {
        if (normalizeText(alias) === normalized) {
          return { categoryName: cat, department: dept };
        }
      }
    }
  }
  return null;
}

/**
 * Find category by keyword in text
 * Uses category names and aliases as keywords
 */
function findKeywordMatch(text: string): { categoryName: string; department: string } | null {
  const normalized = normalizeText(text);
  
  // Check each department's categories
  for (const [dept, categories] of Object.entries(DEPARTMENT_CATEGORIES)) {
    for (const cat of categories) {
      const cleanCat = cat.replace(/ #$/, ''); // Remove trailing #
      
      // Check if category name appears in text
      if (normalized.includes(normalizeText(cleanCat))) {
        return { categoryName: cat, department: dept };
      }
      
      // Check aliases
      const aliases = CATEGORY_ALIASES[cleanCat] || [];
      for (const alias of aliases) {
        if (normalized.includes(normalizeText(alias))) {
          return { categoryName: cat, department: dept };
        }
      }
    }
  }
  
  return null;
}

/**
 * Get all available categories
 */
export function getAllCategories(): Array<{ name: string; department: string }> {
  const result: Array<{ name: string; department: string }> = [];
  for (const [dept, categories] of Object.entries(DEPARTMENT_CATEGORIES)) {
    for (const cat of categories) {
      result.push({ name: cat, department: dept });
    }
  }
  return result;
}

export default { matchCategory, getAllCategories };
