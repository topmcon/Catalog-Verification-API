import logger from '../utils/logger';

/**
 * Category name normalization and alias mapping
 * Reduces category disagreements between AIs
 */

export const CATEGORY_ALIASES: Record<string, string[]> = {
  // Lighting
  "Wall Sconces": ["Wall Sconces (Lighting)", "Sconces", "Wall Lights", "Wall Mounted Lighting"],
  "Ceiling Lights": ["Ceiling Mounted Lights", "Ceiling Fixtures", "Overhead Lighting"],
  "Chandeliers": ["Chandelier Lighting", "Suspended Chandeliers"],
  "Pendant Lights": ["Pendant Lighting", "Hanging Pendants", "Suspended Pendants"],
  "Lamps": ["Table Lamps", "Desk Lamps", "Floor Lamps"],
  "Recessed Lighting": ["Recessed Lights", "Can Lights", "Downlights"],
  
  // Kitchen & Bath
  "Kitchen Faucets": ["Faucets - Kitchen", "Kitchen Sink Faucets"],
  "Bathroom Faucets": ["Faucets - Bathroom", "Bath Faucets", "Lavatory Faucets"],
  "Kitchen Sinks": ["Sinks - Kitchen", "Kitchen Basin"],
  "Bathroom Sinks": ["Sinks - Bathroom", "Bath Sinks", "Lavatory Sinks"],
  "Ranges": ["Cooking Ranges", "Stoves", "Ovens & Ranges"],
  "Refrigerators": ["Fridges", "Refrigeration"],
  "Dishwashers": ["Dish Washers"],
  
  // Appliances
  "Cooktops": ["Cook Tops", "Stovetops"],
  "Wall Ovens": ["Built-in Ovens", "Wall Mounted Ovens"],
  "Microwaves": ["Microwave Ovens"],
  "Range Hoods": ["Vent Hoods", "Kitchen Hoods", "Exhaust Hoods"],
  "Wine Coolers": ["Wine Refrigerators", "Wine Chillers"],
  
  // Doors & Hardware
  "Door Hardware": ["Door Handles", "Door Knobs & Handles"],
  "Door Hardware Parts": ["Door Hardware Components", "Door Parts"],
  "Door Hinges": ["Hinges - Door", "Door Hinge Hardware"],
  "Door Locks": ["Door Lock Sets", "Entry Locks"],
  
  // Plumbing
  "Bathtubs": ["Tubs", "Bath Tubs", "Soaking Tubs"],
  "Showers": ["Shower Systems", "Shower Units"],
  "Toilets": ["Commodes", "Water Closets"],
  "Shower Heads": ["Showerheads", "Shower Fixtures"],
  
  // Home Decor
  "Home Decor & Fixtures": ["Home Decor", "Decorative Fixtures", "Home Accessories"],
  "Furniture": ["Home Furniture"],
  "Mirrors": ["Wall Mirrors", "Decorative Mirrors"],
  
  // HVAC
  "Thermostats": ["Smart Thermostats", "Temperature Controls"],
  "Fans": ["Ceiling Fans", "Ventilation Fans"],
  
  // Outdoor
  "Outdoor Lighting": ["Exterior Lighting", "Landscape Lighting"],
  "Outdoor Furniture": ["Patio Furniture", "Garden Furniture"],
  "Grills": ["BBQ Grills", "Outdoor Grills", "Barbecue Grills"],
  
  // Cabinets & Storage
  "Kitchen Cabinets": ["Cabinets - Kitchen"],
  "Bathroom Cabinets": ["Cabinets - Bathroom", "Vanity Cabinets"],
  "Medicine Cabinets": ["Bathroom Medicine Cabinets"],
  
  // Flooring & Surfaces
  "Countertops": ["Counter Tops", "Kitchen Countertops"],
  "Backsplashes": ["Back Splashes", "Kitchen Backsplashes"],
  "Tile": ["Tiles", "Ceramic Tile", "Porcelain Tile"],
  
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

  // Check for partial matches (e.g., "Wall Sconces (Lighting)" contains "Wall Sconces")
  for (const [primary] of Object.entries(CATEGORY_ALIASES)) {
    if (trimmed.toLowerCase().includes(primary.toLowerCase())) {
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
