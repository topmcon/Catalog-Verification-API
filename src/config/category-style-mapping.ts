/**
 * CATEGORY-STYLE MAPPING
 * ======================
 * Defines valid Style values for each Category
 * 
 * STYLE TYPES:
 * 1. DESIGN STYLES - Aesthetic/visual style (Modern, Contemporary, Traditional, Transitional, etc.)
 * 2. FUNCTIONAL STYLES - How the product is installed/used (Alcove, Freestanding, Wall-Mounted, etc.)
 * 
 * HOW IT WORKS:
 * - When AI returns a style, we check if it's valid for the category
 * - If valid AND in SF picklist → use it
 * - If valid but NOT in SF picklist → add to Style_Requests (SF creates it)
 * - If not valid for category → log warning, don't use
 * 
 * TO ADD NEW STYLES:
 * 1. Add the style to the appropriate category array below
 * 2. Deploy to production
 * 3. Next API call with that style will include it in Style_Requests
 * 4. SF adds it to their picklist and syncs back
 * 
 * Updated: 2026-01-16
 */

// ============================================
// UNIVERSAL DESIGN STYLES
// These aesthetic styles apply to most non-appliance categories
// ============================================
const UNIVERSAL_DESIGN_STYLES = [
  'Modern',
  'Contemporary', 
  'Traditional',
  'Transitional',
  'Industrial',
  'Farmhouse',
  'Rustic',
  'Coastal',
  'Mid-Century Modern',
  'Art Deco',
  'Minimalist',
  'Vintage',
  'Classic'
];

// ============================================
// CATEGORY-SPECIFIC STYLE MAPPINGS
// ============================================

export const CATEGORY_STYLE_MAPPING: Record<string, string[]> = {
  
  // ==========================================
  // APPLIANCES (Functional Styles)
  // ==========================================
  'All in One Washer / Dryer': [
    'Unitized',
    'Front Load'
  ],
  
  'Barbeques': [
    'Accessory',
    'Electric',
    'Gas',
    'Charcoal',
    'Pellet',
    'Built-In',
    'Freestanding',
    'Portable'
  ],
  
  'Cooktop': [
    'Gas',
    'Induction',
    'Electric',
    'Downdraft'
  ],
  
  'Dishwasher': [
    'Undercounter',
    'Accessory',
    'Built-In',
    'Drawer',
    'Portable',
    'Top Control',
    'Front Control',
    'Built-In Top Control'
  ],
  
  'Drawer': [
    'Warming'
  ],
  
  'Dryer': [
    'Front Load',
    'Gas',
    'Electric'
  ],
  
  'Freezer': [
    'Undercounter',
    'Column',
    'Chest',
    'Upright',
    'Bottom-Freezer',
    'Built-In'
  ],
  
  'Icemaker': [
    'Undercounter',
    'Built-In',
    'Freestanding',
    'Portable'
  ],
  
  'Microwave': [
    'Over-the-Range',
    'Countertop',
    'Accessory',
    'Single',
    'Built-In',
    'Drawer'
  ],
  
  'Oven': [
    'Single',
    'Double Wall',
    'Accessory',
    'Microwave Combo',
    'Convection',
    'Steam',
    'Speed'
  ],
  
  'Range': [
    'Electric',
    'Accessory',
    'Gas',
    'Induction',
    'Dual Fuel',
    'Slide-In',
    'Freestanding'
  ],
  
  'Range Hood': [
    'Accessory',
    'Wall-Mounted',
    'Insert',
    'Under Cabinet',
    'Island Mount',
    'Downdraft',
    'Chimney'
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
    'Undercounter',
    'Built-In',
    'Counter-Depth'
  ],
  
  'Standalone Pedestal': [
    'Standalone'
  ],
  
  'Washer': [
    'Front Load',
    'Top Load'
  ],
  
  // ==========================================
  // LIGHTING (Design + Functional Styles)
  // ==========================================
  'Bathroom Lighting': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Vanity',
    'Bath Bar',
    'Sconce',
    'Flush Mount',
    'Semi-Flush'
  ],
  
  'Kitchen Lighting': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Pendant',
    'Under Cabinet',
    'Island',
    'Track',
    'Recessed',
    'Flush Mount',
    'Linear'
  ],
  
  'Outdoor Lighting': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Wall Lantern',
    'Post Light',
    'Path Light',
    'Flood Light',
    'Landscape',
    'Security',
    'Deck'
  ],
  
  'Ceiling Lights': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Flush Mount',
    'Semi-Flush',
    'Recessed',
    'Track',
    'Linear'
  ],
  
  'Wall Sconces': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Up Light',
    'Down Light',
    'Swing Arm',
    'Picture Light',
    'Torch'
  ],
  
  'Chandeliers': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Crystal',
    'Candle',
    'Drum',
    'Globe',
    'Sputnik',
    'Tiered',
    'Linear'
  ],
  
  'Pendants': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Mini',
    'Multi-Light',
    'Drum',
    'Globe',
    'Cone',
    'Linear',
    'Cluster'
  ],
  
  // ==========================================
  // BATHROOM FIXTURES (Functional + Design)
  // ==========================================
  'Bathroom Faucets': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Single Hole',
    'Widespread',
    'Centerset',
    'Wall Mounted',
    'Vessel',
    'Waterfall'
  ],
  
  'Kitchen Faucets': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Single Handle',
    'Two Handle',
    'Pull-Down',
    'Pull-Out',
    'Bridge',
    'Pot Filler',
    'Commercial',
    'Touchless'
  ],
  
  'Tub Faucets': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Wall Mounted',
    'Deck Mounted',
    'Freestanding',
    'Roman Tub',
    'Waterfall'
  ],
  
  'Shower Faucets': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Rain',
    'Handheld',
    'Dual',
    'Thermostatic',
    'Pressure Balance'
  ],
  
  'Bathtubs': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Alcove',
    'Freestanding',
    'Drop-In',
    'Undermount',
    'Corner',
    'Walk-In',
    'Clawfoot',
    'Soaking',
    'Whirlpool',
    'Air Bath'
  ],
  
  'Showers': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Alcove',
    'Corner',
    'Walk-In',
    'Steam',
    'Neo-Angle',
    'Doorless',
    'Barrier-Free'
  ],
  
  'Shower Accessories': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Rain Head',
    'Handheld',
    'Body Spray',
    'Shower System',
    'Shelf',
    'Seat'
  ],
  
  'Bathroom Sinks': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Undermount',
    'Drop-In',
    'Vessel',
    'Pedestal',
    'Wall Mounted',
    'Console',
    'Semi-Recessed'
  ],
  
  'Bathroom Vanities': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Single Sink',
    'Double Sink',
    'Floating',
    'Freestanding',
    'Wall Mounted',
    'Corner'
  ],
  
  'Bathroom Mirrors': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Framed',
    'Frameless',
    'Lighted',
    'Medicine Cabinet',
    'Pivot',
    'Magnifying'
  ],
  
  'Bathroom Hardware and Accessories': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Towel Bar',
    'Towel Ring',
    'Robe Hook',
    'Toilet Paper Holder',
    'Shelf',
    'Set'
  ],
  
  // ==========================================
  // PLUMBING (Functional Styles)
  // ==========================================
  'Rough-In Valves': [
    'Thermostatic',
    'Pressure Balance',
    'Diverter',
    'Volume Control',
    'Transfer'
  ],
  
  'Toilets': [
    ...UNIVERSAL_DESIGN_STYLES,
    'One-Piece',
    'Two-Piece',
    'Wall Mounted',
    'Smart',
    'Bidet',
    'Elongated',
    'Round',
    'ADA Compliant'
  ],
  
  'Bidets': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Standalone',
    'Bidet Seat',
    'Integrated'
  ],
  
  // ==========================================
  // KITCHEN (Functional + Design)
  // ==========================================
  'Kitchen Sinks': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Undermount',
    'Drop-In',
    'Farmhouse',
    'Apron Front',
    'Bar/Prep',
    'Single Bowl',
    'Double Bowl',
    'Workstation'
  ],
  
  // ==========================================
  // OUTDOOR / BBQ (Functional Styles)
  // ==========================================
  'Storage Drawers/Doors': [
    'Outdoor Kitchen Components',
    'Outdoor Kitchen Storage',
    'BBQ Accessories',
    'Built-In',
    'Stainless Steel'
  ],
  
  'Outdoor Kitchen': [
    'Built-In',
    'Modular',
    'Island',
    'Cart'
  ],
  
  // ==========================================
  // DOOR HARDWARE (Design + Functional)
  // ==========================================
  'Door Hardware': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Keyed Entry',
    'Privacy',
    'Passage',
    'Dummy',
    'Deadbolt'
  ],
  
  'Door Hardware Parts': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Lever',
    'Knob',
    'Handle Set',
    'Hinge',
    'Strike Plate'
  ],
  
  // ==========================================
  // FURNITURE (Design Styles)
  // ==========================================
  'Furniture': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Accent',
    'Storage',
    'Seating',
    'Table',
    'Decorative'
  ],
  
  'Bath Furniture': [
    ...UNIVERSAL_DESIGN_STYLES,
    'Linen Cabinet',
    'Storage Tower',
    'Bench',
    'Hamper'
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
  
  // For unknown categories, return universal design styles as fallback
  // This ensures we can still suggest common styles
  return UNIVERSAL_DESIGN_STYLES;
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
  UNIVERSAL_DESIGN_STYLES,
  getValidStylesForCategory,
  isValidStyleForCategory,
  matchStyleToCategory
};
