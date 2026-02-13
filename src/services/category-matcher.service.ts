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

function buildDepartmentCategories(): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const category of CATEGORIES) {
    if (!result[category.department]) {
      result[category.department] = [];
    }

    result[category.department].push(category.category_name);
  }

  return result;
}

function buildCategoryDepartmentLookup(): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const category of CATEGORIES) {
    lookup.set(category.category_name.toLowerCase(), category.department);
  }

  return lookup;
}

// Department to categories mapping (comprehensive)
// AUTO-GENERATED FROM: src/config/salesforce-picklists/categories.json
const DEPARTMENT_CATEGORIES = buildDepartmentCategories();
const CATEGORY_DEPARTMENT_LOOKUP = buildCategoryDepartmentLookup();

// Keyword mappings for better matching
// SYNCED FROM: src/config/salesforce-picklists/categories.json
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Refrigerator': ['refrigerator', 'fridge', 'french door', 'side by side', 'bottom freezer', 'top freezer'],
  'Dishwasher': ['dishwasher', 'dish washer'],
  'Range': ['range', 'stove', 'gas range', 'electric range', 'dual fuel range'],
  'Oven': ['oven', 'wall oven', 'double oven', 'single oven', 'convection oven'],
  'Cooktop': ['cooktop', 'cook top', 'stovetop', 'burner', 'induction cooktop'],
  'Microwave': ['microwave', 'over the range microwave', 'otr', 'microwave drawer'],
  'Range Hood': ['range hood', 'hood', 'ventilation', 'exhaust hood', 'vent hood'],
  'Washer': ['washer', 'washing machine', 'front load washer', 'top load washer'],
  'Dryer': ['dryer', 'clothes dryer', 'gas dryer', 'electric dryer'],
  'Freezer': ['freezer', 'upright freezer', 'chest freezer'],
  'Beverage Center': ['beverage center', 'beverage cooler', 'drink fridge', 'beverage refrigerator'],
  'Wine Cooler': ['wine cooler', 'wine refrigerator', 'wine cellar', 'wine storage'],
  'Icemaker': ['ice maker', 'icemaker', 'ice machine'],
  'Kitchen Sink': ['kitchen sink', 'farmhouse sink', 'apron sink', 'undermount sink'],
  'Kitchen Faucet': ['kitchen faucet', 'pull down faucet', 'pull out faucet'],
  'Bathroom Faucet': ['bathroom faucet', 'lavatory faucet', 'vessel faucet'],
  'Toilet': ['toilet', 'commode', 'water closet'],
  'Bathtub': ['bathtub', 'tub', 'soaking tub', 'freestanding tub', 'alcove tub'],
  'Chandelier': ['chandelier', 'crystal chandelier'],
  'Pendant': ['pendant', 'pendant light', 'hanging light'],
  'Ceiling Fan': ['ceiling fan', 'fan'],
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

function getDepartmentForCategory(categoryName: string): string | null {
  const department = CATEGORY_DEPARTMENT_LOOKUP.get(categoryName.toLowerCase());
  return department || null;
}

/**
 * Find category by keyword in text
 */
function findKeywordMatch(text: string): { categoryName: string; department: string } | null {
  const normalized = normalizeText(text);
  
  for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const department = getDepartmentForCategory(categoryName);
    if (!department) {
      continue;
    }

    for (const keyword of keywords) {
      if (normalized.includes(normalizeText(keyword))) {
        return { categoryName, department };
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
