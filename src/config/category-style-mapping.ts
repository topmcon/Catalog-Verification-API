/**
 * CATEGORY-STYLE MAPPING
 * ======================
 * Defines valid Style values for each Category
 * Based on actual product data from Salesforce
 * 
 * Use this to validate that a Style is appropriate for a given Category
 */

export const CATEGORY_STYLE_MAPPING: Record<string, string[]> = {
  'All in One Washer / Dryer': [
    'Unitized',
    'Front Load'
  ],
  
  'Barbeques': [
    'Accessory',
    'Electric',
    'Gas'
  ],
  
  'Cooktop': [
    'Gas',
    'Induction',
    'Electric'
  ],
  
  'Dishwasher': [
    'Undercounter',
    'Accessory'
  ],
  
  'Drawer': [
    'Warming'
  ],
  
  'Dryer': [
    'Front Load'
  ],
  
  'Freezer': [
    'Undercounter',
    'Column',
    'Chest',
    'Upright',
    'Bottom-Freezer'
  ],
  
  'Icemaker': [
    'Undercounter'
  ],
  
  'Microwave': [
    'Over-the-Range',
    'Countertop',
    'Accessory',
    'Single'
  ],
  
  'Oven': [
    'Single',
    'Double Wall',
    'Accessory',
    'Microwave Combo'
  ],
  
  'Range': [
    'Electric',
    'Accessory',
    'Gas',
    'Induction'
  ],
  
  'Range Hood': [
    'Accessory',
    'Wall-Mounted',
    'Insert',
    'Under Cabinet',
    'Island Mount'
  ],
  
  'Refrigerator': [
    'Beverage Center',
    'Column',
    'Wine Cooler',
    'Drawer',
    'French Door',
    'Side-by-Side',
    'Bottom-Freezer',
    'Top-Freezer',
    'Accessory',
    'Kegerator',
    'Upright',
    'Undercounter'
  ],
  
  'Standalone Pedestal': [
    'Standalone'
  ],
  
  'Washer': [
    'Front Load',
    'Top Load'
  ],
  
  // Lighting categories
  'Bathroom Lighting': [
    'Modern',
    'Contemporary',
    'Traditional',
    'Transitional',
    'Industrial',
    'Farmhouse',
    'Art Deco',
    'Mid-Century Modern'
  ],
  
  'Kitchen Lighting': [
    'Modern',
    'Contemporary',
    'Traditional',
    'Transitional',
    'Industrial',
    'Farmhouse',
    'Art Deco',
    'Pendant',
    'Under Cabinet'
  ],
  
  'Outdoor Lighting': [
    'Modern',
    'Contemporary',
    'Traditional',
    'Transitional',
    'Coastal',
    'Rustic',
    'Farmhouse'
  ],
  
  'Ceiling Lights': [
    'Modern',
    'Contemporary',
    'Traditional',
    'Transitional',
    'Flush Mount',
    'Semi-Flush',
    'Industrial'
  ],
  
  'Chandeliers': [
    'Modern',
    'Contemporary',
    'Traditional',
    'Transitional',
    'Crystal',
    'Rustic',
    'Farmhouse',
    'Industrial'
  ]
};

/**
 * Get valid styles for a given category
 */
export function getValidStylesForCategory(category: string): string[] {
  // Try exact match
  if (CATEGORY_STYLE_MAPPING[category]) {
    return CATEGORY_STYLE_MAPPING[category];
  }
  
  // Try case-insensitive match
  const categoryLower = category.toLowerCase();
  for (const [key, styles] of Object.entries(CATEGORY_STYLE_MAPPING)) {
    if (key.toLowerCase() === categoryLower) {
      return styles;
    }
  }
  
  return [];
}

/**
 * Check if a style is valid for a given category
 */
export function isValidStyleForCategory(category: string, style: string): boolean {
  const validStyles = getValidStylesForCategory(category);
  return validStyles.some(s => s.toLowerCase() === style.toLowerCase());
}

/**
 * Find the best matching style for a category given a potential style value
 */
export function matchStyleToCategory(category: string, potentialStyle: string): string | null {
  const validStyles = getValidStylesForCategory(category);
  
  if (validStyles.length === 0) {
    return null;
  }
  
  const normalized = potentialStyle.toLowerCase().trim();
  
  // Exact match
  const exactMatch = validStyles.find(s => s.toLowerCase() === normalized);
  if (exactMatch) return exactMatch;
  
  // Partial match (contains)
  const partialMatch = validStyles.find(s => 
    s.toLowerCase().includes(normalized) || normalized.includes(s.toLowerCase())
  );
  if (partialMatch) return partialMatch;
  
  // Special case: extract style from subcategory
  // e.g., "ELECTRIC OVEN AND MICROWAVE COMBO" → "Microwave Combo" for Oven category
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

export default {
  CATEGORY_STYLE_MAPPING,
  getValidStylesForCategory,
  isValidStyleForCategory,
  matchStyleToCategory
};
