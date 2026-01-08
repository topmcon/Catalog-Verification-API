/**
 * Category Matcher Service
 * Matches incoming product data to the correct category schema
 */

import { CATEGORY_ALIASES } from '../config/category-schema';

// Department to categories mapping (comprehensive)
const DEPARTMENT_CATEGORIES: Record<string, string[]> = {
  'Appliances': [
    // Major Appliances
    'Refrigerator', 'Dishwasher', 'Range', 'Oven', 'Cooktop', 
    'Microwave', 'Range Hood', 'Washer', 'Dryer', 'Freezer',
    'All in One Washer / Dryer',
    // Specialty Appliances
    'Wine Cooler', 'Icemaker', 'Ice Maker', 'Beverage Center',
    'Pizza Oven', 'Coffee Maker', 'Warming Drawer', 'Barbeques', 'BBQ', 'Grill',
    'Drawer', 'Standalone Pedestal', 'Range Hood Insert/Liner'
  ],
  'Plumbing & Bath': [
    // Kitchen
    'Kitchen Sinks #', 'Kitchen Faucets #', 'Bar & Prep Sinks #', 'Bar Faucets #',
    // Bathroom
    'Bathroom Faucets #', 'Bathroom Sinks #', 'Bathroom Vanities #',
    'Bathtubs #', 'Showers #', 'Toilets #', 'Tub Faucets #',
    'Bathroom Hardware and Accessories #'
  ],
  'Lighting': [
    'Chandeliers #', 'Pendants #', 'Ceiling Lights #', 'Ceiling Fans #',
    'Ceiling Fans with Light #', 'Wall Sconces #', 'Outdoor Lighting #',
    'Recessed Lighting #'
  ],
  'Home Decor & Fixtures': [
    'Storage Drawers/Doors #', 'Cabinet Organization and Storage #'
  ],
  'HVAC': [
    'Air Conditioners #'
  ]
};

// Keyword mappings for better matching
const CATEGORY_KEYWORDS: Record<string, string[]> = {
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
  'Wine Cooler': ['wine cooler', 'wine refrigerator', 'wine cellar', 'wine storage'],
  'Icemaker': ['ice maker', 'icemaker', 'ice machine'],
  'Beverage Center': ['beverage center', 'beverage cooler', 'drink fridge'],
  'Kitchen Sinks #': ['kitchen sink', 'farmhouse sink', 'apron sink', 'undermount sink'],
  'Kitchen Faucets #': ['kitchen faucet', 'pull down faucet', 'pull out faucet'],
  'Bathroom Faucets #': ['bathroom faucet', 'lavatory faucet', 'vessel faucet'],
  'Toilets #': ['toilet', 'commode', 'water closet'],
  'Bathtubs #': ['bathtub', 'tub', 'soaking tub', 'freestanding tub', 'alcove tub'],
  'Chandeliers #': ['chandelier', 'crystal chandelier'],
  'Pendants #': ['pendant', 'pendant light', 'hanging light'],
  'Ceiling Fans #': ['ceiling fan', 'fan'],
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
 */
function findKeywordMatch(text: string): { categoryName: string; department: string } | null {
  const normalized = normalizeText(text);
  
  // Keywords to category mapping
  const keywords: Record<string, { cat: string; dept: string }> = {
    'refrigerator': { cat: 'Refrigerator', dept: 'Appliances' },
    'fridge': { cat: 'Refrigerator', dept: 'Appliances' },
    'dishwasher': { cat: 'Dishwasher', dept: 'Appliances' },
    'range': { cat: 'Range', dept: 'Appliances' },
    'stove': { cat: 'Range', dept: 'Appliances' },
    'oven': { cat: 'Oven', dept: 'Appliances' },
    'microwave': { cat: 'Microwave', dept: 'Appliances' },
    'cooktop': { cat: 'Cooktop', dept: 'Appliances' },
    'rangehood': { cat: 'Range Hood', dept: 'Appliances' },
    'venthood': { cat: 'Range Hood', dept: 'Appliances' },
    'washer': { cat: 'Washer', dept: 'Appliances' },
    'dryer': { cat: 'Dryer', dept: 'Appliances' },
    'freezer': { cat: 'Freezer', dept: 'Appliances' },
    'icemaker': { cat: 'Icemaker', dept: 'Other / Needs Review' },
    'faucet': { cat: 'Kitchen Faucets #', dept: 'Plumbing & Bath' },
    'sink': { cat: 'Kitchen Sinks #', dept: 'Plumbing & Bath' },
    'toilet': { cat: 'Toilets #', dept: 'Plumbing & Bath' },
    'bathtub': { cat: 'Bathtubs #', dept: 'Plumbing & Bath' },
    'shower': { cat: 'Showers #', dept: 'Plumbing & Bath' },
    'chandelier': { cat: 'Chandeliers #', dept: 'Lighting' },
    'pendant': { cat: 'Pendants #', dept: 'Lighting' },
    'sconce': { cat: 'Wall Sconces #', dept: 'Lighting' },
    'ceilingfan': { cat: 'Ceiling Fans #', dept: 'Lighting' }
  };
  
  for (const [kw, result] of Object.entries(keywords)) {
    if (normalized.includes(kw)) {
      return { categoryName: result.cat, department: result.dept };
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
