import logger from '../utils/logger';

/**
 * CATEGORY NAME ALIASES — SINGLE SOURCE OF TRUTH
 * ================================================
 * Maps canonical category names → arrays of alternative names/aliases.
 * Used by normalizeCategoryName() to resolve AI output variations.
 * 
 * RULES:
 * 1. Keys MUST be exact category names from categories.json where possible
 * 2. If no exact match in categories.json, key serves as a normalization target
 * 3. All other files (constants.ts, category-schema.ts) re-export from here
 * 4. When adding new aliases, add them HERE — never create a separate copy
 * 
 * SYNCED WITH: src/config/salesforce-picklists/categories.json
 * IMPORTED BY: constants.ts (re-exports as CATEGORY_NAME_ALIASES)
 *              category-schema.ts (re-exports)
 *              dual-ai-verification.service.ts (direct import)
 *              lookups.ts (via constants.ts re-export)
 */

export const CATEGORY_ALIASES: Record<string, string[]> = {
  // ============================================
  // APPLIANCES (all keys match categories.json)
  // ============================================
  'Refrigerator': ['Fridge', 'Refrigerators', 'Frig', 'Fridges', 'Refrigeration'],
  'Dishwasher': ['Dishwashers', 'Dish Washer', 'Dish Washers'],
  'Range': ['Stove', 'Ranges', 'Cooking Range', 'Gas Range', 'Electric Range', 'Cooking Ranges', 'Stoves', 'Ovens & Ranges'],
  'Cooktop': ['Cooktops', 'Cook Top', 'Stovetop', 'Cook Tops', 'Stovetops'],
  'Oven': ['Ovens', 'Wall Oven', 'Wall Ovens', 'Built-in Ovens', 'Wall Mounted Ovens'],
  'Microwave': ['Microwaves', 'Microwave Oven', 'Microwave Ovens'],
  'Range Hood': ['Hood', 'Vent Hood', 'Ventilation', 'Range Hoods', 'Vent Hoods', 'Kitchen Hoods', 'Exhaust Hoods'],
  'Washer': ['Washing Machine', 'Washers'],
  'Dryer': ['Dryers', 'Clothes Dryer'],
  'Freezer': ['Freezers', 'Chest Freezer', 'Upright Freezer'],
  'Icemaker': ['Ice Maker', 'Ice Machine'],
  'All in One Washer / Dryer': ['Washer Dryer Combo', 'Combo Washer Dryer', 'Laundry Center'],

  // ============================================
  // LIGHTING & ELECTRICAL (keys match categories.json)
  // ============================================
  'Wall Sconce': ['Wall Sconces', 'Sconce', 'Wall Sconces (Lighting)', 'Sconces', 'Wall Lights', 'Wall Mounted Lighting'],
  'Ceiling Light': ['Ceiling Mounted Lights', 'Ceiling Fixtures', 'Overhead Lighting'],
  'Chandelier': ['Chandeliers', 'Crystal Chandelier', 'Chandelier Lighting', 'Suspended Chandeliers'],
  'Pendant': ['Pendants', 'Pendant Light', 'Pendant Lights', 'Hanging Light', 'Pendant Lighting', 'Hanging Pendants', 'Suspended Pendants'],
  'Lamp': ['Lamps', 'Table Lamps', 'Desk Lamps', 'Floor Lamps'],
  'Lighting Accessory': ['Lighting Accessories', 'Lighting Accessories and Parts', 'Lighting Accessory and Parts'],
  'Recessed Lighting': ['Recessed Lights', 'Can Lights', 'Downlights'],
  'Under Cabinet Light': [
    'Under Cabinet Lights',
    'Under Cabinet Lighting',
    'Undercabinet Light',
    'Undercabinet Lighting',
    'Cabinet Lighting',
    'Task Light',
    'Task Lighting',
    'Picture Light',
    'Picture Lights',
    'Picture Lighting',
    'Art Light',
    'Art Lighting',
    'Display Lighting'
  ],
  'Ceiling Fan': ['Ceiling Fans', 'Fan', 'Fans', 'Ventilation Fans'],
  // NOTE: 'Outdoor Lighting' removed - not a valid SF category (use specific types)

  // ============================================
  // PLUMBING & BATH (keys match categories.json)
  // ============================================
  'Kitchen Faucet': ['Faucets - Kitchen', 'Kitchen Sink Faucets'],
  'Bathroom Faucet': ['Faucets - Bathroom', 'Bath Faucets', 'Lavatory Faucets'],
  'Kitchen Sink': ['Kitchen Sinks', 'Sinks - Kitchen', 'Kitchen Basin', 'Undermount Sink'],
  'Kitchen Storage & Organization': ['Kitchen Accessory', 'Kitchen Accessories', 'Kitchen Accessories (Plumbing & Bath)', 'KITCHEN ACCESSORIES', 'KITCHEN ACCESSORY'],
  'Bathroom Sink': ['Bathroom Sinks', 'Bath Sink', 'Lavatory', 'Lav Sink', 'Sinks - Bathroom', 'Bath Sinks', 'Lavatory Sinks'],
  'Bathroom Cabinet Hardware': ['Bathroom Hardware and Accessories', 'Bathroom Accessories', 'Bath Hardware', 'Bath Accessories', 'BATHROOM HARDWARE', 'BATHROOM ACCESSORIES', 'Towel Warmer', 'Towel Warmers', 'Bathroom Towel Warmer'],
  'Bathtub': ['Bathtubs', 'Tub', 'Tubs', 'Soaking Tub', 'Bath Tubs', 'Soaking Tubs'],
  'Shower': ['Showers', 'Shower Systems', 'Shower Units', 'Shower Accessory', 'Showerheads', 'Shower Fixtures', 'Shower Heads'],
  'Shower Faucet': ['Shower Faucets', 'Shower Accessories', 'Shower Components'],
  'Tub Faucet': ['Tub Faucets', 'Bathtub Faucet', 'Bathtub Faucets', 'Bath Tub Faucet', 'Roman Tub Faucet'],
  'Toilet': ['Toilets', 'Commode', 'Commodes', 'Water Closet', 'Water Closets'],
  'Medicine Cabinet': [
    'Bathroom Medicine Cabinets', 
    'Bathroom Medicine Cabinet', 
    'Medicine Cabinets',
    'LED Medicine Cabinet',
    'Lighted Medicine Cabinet',
    'Mirrored Medicine Cabinet',
    'Cabinet with Mirror',
    'Bathroom Cabinet with Lighting',
    'Bathroom Storage Cabinet'
  ],

  // ============================================
  // HARDWARE (keys approximate — many subcategories in categories.json)
  // ============================================
  'Door Hardware: Knob and Lever': ['Door Hardware', 'Door Handles', 'Door Knobs & Handles'],
  'Door Hardware Part': ['Door Hardware Parts', 'Door Hardware Components', 'Door Parts'],
  'Door Hinge': ['Door Hinges', 'Hinges - Door', 'Door Hinge Hardware'],
  'Door Entry Set': ['Door Locks', 'Door Lock Sets', 'Entry Locks'],

  // ============================================
  // HOME DECOR & FURNITURE
  // ============================================
  // Note: 'Furniture' is a family/department grouping, not a category.
  // Specific furniture categories like 'Outdoor Furniture' should be used instead.
  'Mirror': ['Mirrors', 'Wall Mirrors', 'Decorative Mirrors'],
  'Wall Decor': ['Home Decor', 'Home Decor & Fixtures', 'Decorative Fixtures', 'Home Accessories'],
  'Thermostat': ['Thermostats', 'Smart Thermostats', 'Temperature Controls'],

  // ============================================
  // OUTDOOR
  // ============================================
  'Barbeque': ['Grills', 'BBQ Grills', 'Outdoor Grills', 'Barbecue Grills', 'BBQ', 'Barbecues', 'Gas Grills', 'Charcoal Grills', 'Electric Grills', 'Pellet Grills', 'Smokers', 'Grill Carts'],
  'Outdoor Kitchen': ['Outdoor Kitchen Islands', 'Outdoor Cabinets', 'Outdoor Kitchen Components'],

  // ============================================
  // FLOORING & SURFACES
  // ============================================
  'Tile': ['Tiles', 'Ceramic Tile', 'Porcelain Tile'],
  'Backsplash Kitchen Tile': ['Backsplashes', 'Back Splashes', 'Kitchen Backsplashes', 'Countertops', 'Counter Tops', 'Kitchen Countertops'],

  // ============================================
  // CABINETS
  // ============================================
  // NOTE: 'Cabinet Hardware' removed - not a valid SF category
  // Use specific types: Cabinet Knob, Cabinet Pull, Cabinet Hinge, etc.
  'Designer Cabinet Hardware': ['Cabinet Hardware'],

  // ============================================
  // HEATING & COOLING
  // ============================================
  'HVAC Accessory': ['Sheet Metal Tools'],

  // Add more as discovered from confusion matrix
};

/**
 * Normalize category name to primary canonical name
 */
export function normalizeCategoryName(category: string): string {
  if (!category || typeof category !== 'string') {
    return '';
  }

  const trimmed = category.trim();

  // Check if it's already a primary category
  if (CATEGORY_ALIASES[trimmed]) {
    return trimmed;
  }

  // Search for matching alias
  for (const [primary] of Object.entries(CATEGORY_ALIASES)) {
    // Case-insensitive match
    const aliases = CATEGORY_ALIASES[primary];
    if (aliases.some(alias => alias.toLowerCase() === trimmed.toLowerCase())) {
      logger.debug(`Category normalized: "${trimmed}" → "${primary}"`);
      return primary;
    }
  }

  // PRIORITY MATCHING: Check for high-confidence functional categories FIRST
  // Prevents "Wall Decor" from matching functional storage/lighting
  const priorityCategories = [
    'Medicine Cabinet',
    'Under Cabinet Light',
    'Bathroom Cabinet Hardware',
    'Kitchen Storage & Organization',
    'Lighting Accessory'
  ];

  const lowerTrimmed = trimmed.toLowerCase();
  for (const priorityCat of priorityCategories) {
    // If input contains category name or any of its aliases, match it
    if (lowerTrimmed.includes(priorityCat.toLowerCase())) {
      logger.debug(`Category normalized (priority): "${trimmed}" → "${priorityCat}"`);
      return priorityCat;
    }
    const aliases = CATEGORY_ALIASES[priorityCat] || [];
    for (const alias of aliases) {
      if (lowerTrimmed.includes(alias.toLowerCase())) {
        logger.debug(`Category normalized (priority alias): "${trimmed}" → "${priorityCat}"`);
        return priorityCat;
      }
    }
  }

  // EXCLUSION LOGIC: Prevent "Wall Decor" from matching functional items
  // Keywords that indicate functional lighting, storage, or fixtures
  const functionalKeywords = [
    'cabinet', 'light', 'lighting', 'led', 'vanity', 'mirror',
    'storage', 'fixture', 'lamp', 'sconce', 'task', 'picture light',
    'under cabinet', 'medicine', 'bathroom storage', 'lighted'
  ];

  const isFunctional = functionalKeywords.some(keyword => 
    lowerTrimmed.includes(keyword)
  );

  // Check for partial matches (e.g., "Wall Sconces (Lighting)" contains "Wall Sconce")
  // But skip "Wall Decor" if item is functional
  for (const [primary] of Object.entries(CATEGORY_ALIASES)) {
    if (trimmed.toLowerCase().includes(primary.toLowerCase())) {
      // Skip "Wall Decor" for functional items
      if (primary === 'Wall Decor' && isFunctional) {
        logger.debug(`Category "Wall Decor" skipped for functional item: "${trimmed}"`);
        continue;
      }
      
      logger.debug(`Category normalized (partial): "${trimmed}" → "${primary}"`);
      return primary;
    }
  }

  // Return as-is if no match found
  return trimmed;
}

/**
 * Check if two categories are equivalent (considering aliases)
 */
export function areCategoriesEquivalent(cat1: string, cat2: string): boolean {
  if (!cat1 || !cat2) return false;
  
  const normalized1 = normalizeCategoryName(cat1);
  const normalized2 = normalizeCategoryName(cat2);
  
  return normalized1.toLowerCase() === normalized2.toLowerCase();
}

/**
 * Get all known variations of a category
 */
export function getCategoryVariations(category: string): string[] {
  const normalized = normalizeCategoryName(category);
  return [normalized, ...(CATEGORY_ALIASES[normalized] || [])];
}

/**
 * Calculate similarity score between two category names (0-1)
 * Used for fuzzy matching when no exact match found
 */
export function calculateCategorySimilarity(cat1: string, cat2: string): number {
  if (!cat1 || !cat2) return 0;
  
  const s1 = cat1.toLowerCase().trim();
  const s2 = cat2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // Levenshtein distance
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = 1 - (distance / maxLength);
  
  return Math.max(0, similarity);
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Find best matching category from a list
 */
export function findBestCategoryMatch(
  targetCategory: string,
  availableCategories: string[],
  threshold = 0.8
): { match: string | null; confidence: number } {
  if (!targetCategory || !availableCategories || availableCategories.length === 0) {
    return { match: null, confidence: 0 };
  }

  // First try normalization
  const normalized = normalizeCategoryName(targetCategory);
  if (availableCategories.includes(normalized)) {
    return { match: normalized, confidence: 1.0 };
  }

  // Try fuzzy matching
  const matches = availableCategories.map(cat => ({
    category: cat,
    similarity: calculateCategorySimilarity(targetCategory, cat)
  }));

  matches.sort((a, b) => b.similarity - a.similarity);

  const bestMatch = matches[0];
  if (bestMatch && bestMatch.similarity >= threshold) {
    return { match: bestMatch.category, confidence: bestMatch.similarity };
  }

  return { match: null, confidence: bestMatch?.similarity || 0 };
}
