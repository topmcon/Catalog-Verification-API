/**
 * Category Consolidation Mapping
 * 
 * Maps removed/deprecated category names to their parent categories.
 * When AI suggests a removed category, it will be automatically remapped to the correct parent.
 * 
 * Generated: February 6, 2026
 * Removed: 57 categories → Mapped to 155 remaining categories
 */

export interface CategoryRemapping {
  removedCategory: string;
  parentCategory: string;
  reason: string;
  suggestedType?: string; // For filter/attribute suggestions
}

/**
 * Complete mapping of removed categories to their parent categories
 */
export const CATEGORY_REMAPPING: Record<string, CategoryRemapping> = {
  // ===== KITCHEN APPLIANCES =====
  'Drawer': {
    removedCategory: 'Drawer',
    parentCategory: 'Refrigerator', // or Microwave depending on context
    reason: 'Style/configuration attribute, not a category',
    suggestedType: 'Drawer'
  },
  'Cooking': {
    removedCategory: 'Cooking',
    parentCategory: 'Range', // Could also be Cooktop or Oven
    reason: 'Generic parent duplicating specific categories',
    suggestedType: undefined
  },
  'Refrigeration': {
    removedCategory: 'Refrigeration',
    parentCategory: 'Refrigerator',
    reason: 'Generic parent duplicating specific categories',
    suggestedType: undefined
  },

  // ===== BATH & PLUMBING - FAUCETS =====
  'Bidet Faucets': {
    removedCategory: 'Bidet Faucets',
    parentCategory: 'Bathroom Faucets',
    reason: 'Faucet type, not separate category',
    suggestedType: 'Bidet Faucet'
  },
  'Shower Faucets': {
    removedCategory: 'Shower Faucets',
    parentCategory: 'Bathroom Faucets',
    reason: 'Faucet type, not separate category',
    suggestedType: 'Shower Faucet'
  },
  'Tub Faucets': {
    removedCategory: 'Tub Faucets',
    parentCategory: 'Bathroom Faucets',
    reason: 'Faucet type, not separate category',
    suggestedType: 'Tub Faucet'
  },
  'Bathtub Faucets': {
    removedCategory: 'Bathtub Faucets',
    parentCategory: 'Bathroom Faucets',
    reason: 'Faucet type, not separate category',
    suggestedType: 'Tub Faucet'
  },
  'Tub Spouts': {
    removedCategory: 'Tub Spouts',
    parentCategory: 'Bathroom Faucets',
    reason: 'Faucet component, not separate category',
    suggestedType: 'Tub Spout'
  },

  // ===== BATH & PLUMBING - ACCESSORIES =====
  'Shower Accessories': {
    removedCategory: 'Shower Accessories',
    parentCategory: 'Bathroom Hardware and Accessories',
    reason: 'Redundant subcategory',
    suggestedType: 'Shower'
  },
  'Tub and Shower Accessories': {
    removedCategory: 'Tub and Shower Accessories',
    parentCategory: 'Bathroom Hardware and Accessories',
    reason: 'Redundant subcategory',
    suggestedType: 'Tub/Shower'
  },
  'Bathtub Waste & Overflow': {
    removedCategory: 'Bathtub Waste & Overflow',
    parentCategory: 'Bathroom Hardware and Accessories',
    reason: 'Component/accessory, too specific',
    suggestedType: 'Waste & Overflow'
  },

  // ===== BATH & PLUMBING - TYPOS/DUPLICATES =====
  'conbaucets': {
    removedCategory: 'conbaucets',
    parentCategory: 'Bathroom Faucets',
    reason: 'Typo/data error',
    suggestedType: undefined
  },
  'Bathroom Lighting (Bathroom)': {
    removedCategory: 'Bathroom Lighting (Bathroom)',
    parentCategory: 'Bathroom Lighting',
    reason: 'Duplicate with different ID',
    suggestedType: undefined
  },

  // ===== KITCHEN PLUMBING - FAUCETS =====
  'Bar Faucets': {
    removedCategory: 'Bar Faucets',
    parentCategory: 'Kitchen Faucets',
    reason: 'Faucet type, not separate category',
    suggestedType: 'Bar Faucet'
  },
  'Pot Filler Faucets': {
    removedCategory: 'Pot Filler Faucets',
    parentCategory: 'Kitchen Faucets',
    reason: 'Faucet type, not separate category',
    suggestedType: 'Pot Filler'
  },
  'Food Service Faucets': {
    removedCategory: 'Food Service Faucets',
    parentCategory: 'Kitchen Faucets',
    reason: 'Commercial faucet style, not separate category',
    suggestedType: 'Commercial/Food Service'
  },

  // ===== KITCHEN PLUMBING - OTHER =====
  'Kitchen Sink Combos': {
    removedCategory: 'Kitchen Sink Combos',
    parentCategory: 'Kitchen Sinks',
    reason: 'Product bundle, not category',
    suggestedType: 'Combo'
  },
  'Tankless Water Heaters': { // Kitchen duplicate
    removedCategory: 'Tankless Water Heaters',
    parentCategory: 'Tankless Water Heaters', // Bath version kept
    reason: 'Duplicate - Bath version kept',
    suggestedType: undefined
  },

  // ===== LIGHTING - TYPES =====
  'Flush and Semi-Flush': {
    removedCategory: 'Flush and Semi-Flush',
    parentCategory: 'Ceiling Lights',
    reason: 'Ceiling light style/type',
    suggestedType: 'Flush Mount'
  },
  'Lighted Ceiling Fans': {
    removedCategory: 'Lighted Ceiling Fans',
    parentCategory: 'Ceiling Fans',
    reason: 'Feature filter (Has Light)',
    suggestedType: 'With Light'
  },

  // ===== CEILING FANS (17 removed) =====
  'Ceiling Fans with Light': {
    removedCategory: 'Ceiling Fans with Light',
    parentCategory: 'Ceiling Fans',
    reason: 'Feature filter',
    suggestedType: 'With Light'
  },
  'Ceiling Fans with Remotes': {
    removedCategory: 'Ceiling Fans with Remotes', 
    parentCategory: 'Ceiling Fans',
    reason: 'Feature filter',
    suggestedType: 'With Remote'
  },
  'Ceiling Fans without Light': {
    removedCategory: 'Ceiling Fans without Light',
    parentCategory: 'Ceiling Fans',
    reason: 'Feature filter',
    suggestedType: 'Without Light'
  },
  'DC Motor Ceiling Fans': {
    removedCategory: 'DC Motor Ceiling Fans',
    parentCategory: 'Ceiling Fans',
    reason: 'Specification filter',
    suggestedType: 'DC Motor'
  },
  'Designer Ceiling Fans': {
    removedCategory: 'Designer Ceiling Fans',
    parentCategory: 'Ceiling Fans',
    reason: 'Style filter',
    suggestedType: 'Designer'
  },
  'Dual Ceiling Fans': {
    removedCategory: 'Dual Ceiling Fans',
    parentCategory: 'Ceiling Fans',
    reason: 'Type filter',
    suggestedType: 'Dual'
  },
  'Fandelier Ceiling Fans': {
    removedCategory: 'Fandelier Ceiling Fans',
    parentCategory: 'Ceiling Fans',
    reason: 'Style filter',
    suggestedType: 'Fandelier'
  },
  'Hugger Fans': {
    removedCategory: 'Hugger Fans',
    parentCategory: 'Ceiling Fans',
    reason: 'Mount type filter',
    suggestedType: 'Hugger/Low Profile'
  },
  'Indoor Ceiling Fans': {
    removedCategory: 'Indoor Ceiling Fans',
    parentCategory: 'Ceiling Fans',
    reason: 'Location filter',
    suggestedType: 'Indoor'
  },
  'Large Ceiling Fans': {
    removedCategory: 'Large Ceiling Fans',
    parentCategory: 'Ceiling Fans',
    reason: 'Size filter',
    suggestedType: 'Large'
  },
  'LED Ceiling Fans': {
    removedCategory: 'LED Ceiling Fans',
    parentCategory: 'Ceiling Fans',
    reason: 'Feature filter',
    suggestedType: 'LED'
  },
  'Outdoor Ceiling Fans': {
    removedCategory: 'Outdoor Ceiling Fans',
    parentCategory: 'Ceiling Fans',
    reason: 'Location filter',
    suggestedType: 'Outdoor'
  },
  'Small Ceiling Fans': {
    removedCategory: 'Small Ceiling Fans',
    parentCategory: 'Ceiling Fans',
    reason: 'Size filter',
    suggestedType: 'Small'
  },
  'Smart Home Fans': {
    removedCategory: 'Smart Home Fans',
    parentCategory: 'Ceiling Fans',
    reason: 'Feature filter',
    suggestedType: 'Smart/WiFi'
  },
  'Trending Ceiling Fans': {
    removedCategory: 'Trending Ceiling Fans',
    parentCategory: 'Ceiling Fans',
    reason: 'Marketing tag, not product category',
    suggestedType: undefined
  },
  'Utility Fans': {
    removedCategory: 'Utility Fans',
    parentCategory: 'Ceiling Fans',
    reason: 'Style filter',
    suggestedType: 'Industrial/Utility'
  },

  // ===== DOOR HARDWARE (4 removed) =====
  'Door Entry Sets': {
    removedCategory: 'Door Entry Sets',
    parentCategory: 'Handlesets',
    reason: 'Type under handlesets/door hardware',
    suggestedType: 'Entry Set'
  },
  'Door Hardware: Knobs and Levers': {
    removedCategory: 'Door Hardware: Knobs and Levers',
    parentCategory: 'Handlesets',
    reason: 'Redundant parent name',
    suggestedType: undefined
  },
  'Door Knobs': {
    removedCategory: 'Door Knobs',
    parentCategory: 'Handlesets',
    reason: 'Style filter',
    suggestedType: 'Knob'
  },
  'Door Levers': {
    removedCategory: 'Door Levers',
    parentCategory: 'Handlesets',
    reason: 'Style filter',
    suggestedType: 'Lever'
  },

  // ===== CABINET HARDWARE (18 removed) =====
  'Affordable Cabinet Knobs': {
    removedCategory: 'Affordable Cabinet Knobs',
    parentCategory: 'Cabinet Hardware',
    reason: 'Price tier + type filter',
    suggestedType: 'Knob'
  },
  'Affordable Cabinet Pulls': {
    removedCategory: 'Affordable Cabinet Pulls',
    parentCategory: 'Cabinet Hardware',
    reason: 'Price tier + type filter',
    suggestedType: 'Pull'
  },
  'Luxury Cabinet Knobs': {
    removedCategory: 'Luxury Cabinet Knobs',
    parentCategory: 'Cabinet Hardware',
    reason: 'Price tier + type filter',
    suggestedType: 'Knob'
  },
  'Luxury Cabinet Pulls': {
    removedCategory: 'Luxury Cabinet Pulls',
    parentCategory: 'Cabinet Hardware',
    reason: 'Price tier + type filter',
    suggestedType: 'Pull'
  },
  'Cabinet Knobs': {
    removedCategory: 'Cabinet Knobs',
    parentCategory: 'Cabinet Hardware',
    reason: 'Type filter',
    suggestedType: 'Knob'
  },
  'Cabinet Pulls': {
    removedCategory: 'Cabinet Pulls',
    parentCategory: 'Cabinet Hardware',
    reason: 'Type filter',
    suggestedType: 'Pull'
  },
  'Appliance Pulls': {
    removedCategory: 'Appliance Pulls',
    parentCategory: 'Cabinet Hardware',
    reason: 'Type/size filter',
    suggestedType: 'Appliance Pull'
  },
  'Backplates': {
    removedCategory: 'Backplates',
    parentCategory: 'Cabinet Hardware',
    reason: 'Type filter',
    suggestedType: 'Backplate'
  },
  'Designer Cabinet Hardware': {
    removedCategory: 'Designer Cabinet Hardware',
    parentCategory: 'Cabinet Hardware',
    reason: 'Style filter',
    suggestedType: 'Designer'
  },
  'Vanity Cabinet Hardware': {
    removedCategory: 'Vanity Cabinet Hardware',
    parentCategory: 'Cabinet Hardware',
    reason: 'Application filter',
    suggestedType: 'Vanity'
  },
  'Cabinet Catches and Latches': {
    removedCategory: 'Cabinet Catches and Latches',
    parentCategory: 'Cabinet Hardware',
    reason: 'Type filter',
    suggestedType: 'Catch/Latch'
  },
  'Cabinet Finishing': {
    removedCategory: 'Cabinet Finishing',
    parentCategory: 'Cabinet Hardware',
    reason: 'Type filter',
    suggestedType: 'Finishing'
  },
  'Cabinet Hardware Bulk Packs': {
    removedCategory: 'Cabinet Hardware Bulk Packs',
    parentCategory: 'Cabinet Hardware',
    reason: 'Packaging option, not category',
    suggestedType: undefined
  },
  'Cabinet Hardware Mounting Templates': {
    removedCategory: 'Cabinet Hardware Mounting Templates',
    parentCategory: 'Cabinet Hardware',
    reason: 'Accessory/tool',
    suggestedType: 'Mounting Template'
  },
  'Cabinet Hinges': {
    removedCategory: 'Cabinet Hinges',
    parentCategory: 'Cabinet Hardware',
    reason: 'Type filter',
    suggestedType: 'Hinge'
  },
  'Cabinet Locks': {
    removedCategory: 'Cabinet Locks',
    parentCategory: 'Cabinet Hardware',
    reason: 'Type filter',
    suggestedType: 'Lock'
  },
  'Cabinet Organization and Storage': {
    removedCategory: 'Cabinet Organization and Storage',
    parentCategory: 'Kitchen Storage & Organization',
    reason: 'Overlaps with kitchen storage',
    suggestedType: undefined
  },
  'Drawer Slides and Accessories': {
    removedCategory: 'Drawer Slides and Accessories',
    parentCategory: 'Cabinet Hardware',
    reason: 'Type filter',
    suggestedType: 'Drawer Slide'
  },

  // ===== OUTDOOR DUPLICATES (2 removed) =====
  'Outdoor Lighting': { // Outdoor dept duplicate
    removedCategory: 'Outdoor Lighting',
    parentCategory: 'Outdoor Lighting', // Lighting dept version kept
    reason: 'Duplicate - Lighting dept version kept',
    suggestedType: undefined
  },

  // ===== AI VARIATION CORRECTIONS =====
  // These are common variations AI suggests that need normalization
  'Bathroom Vanity Lighting': {
    removedCategory: 'Bathroom Vanity Lighting',
    parentCategory: 'Vanity Lighting',
    reason: 'AI variation - correct name is Vanity Lighting',
    suggestedType: undefined
  },
  'Shower Accessories (Plumbing & Bath)': {
    removedCategory: 'Shower Accessories (Plumbing & Bath)',
    parentCategory: 'Bathroom Hardware and Accessories',
    reason: 'AI variation with department suffix',
    suggestedType: 'Shower'
  },
  'Pendants (Lighting)': {
    removedCategory: 'Pendants (Lighting)',
    parentCategory: 'Pendants',
    reason: 'AI variation with department suffix',
    suggestedType: undefined
  },
  'Pendant Lights': {
    removedCategory: 'Pendant Lights',
    parentCategory: 'Pendants',
    reason: 'AI variation - correct name is Pendants',
    suggestedType: undefined
  },
  'Ventilation': {
    removedCategory: 'Ventilation',
    parentCategory: 'Exhaust Fans',
    reason: 'Generic term - maps to Exhaust Fans',
    suggestedType: undefined
  },
  'Kitchen Accessories (Plumbing & Bath)': {
    removedCategory: 'Kitchen Accessories (Plumbing & Bath)',
    parentCategory: 'Kitchen Accessories',
    reason: 'AI variation with department suffix',
    suggestedType: undefined
  },
  'Drains': {
    removedCategory: 'Drains',
    parentCategory: 'Drainage & Waste',
    reason: 'Specific term - maps to broader category',
    suggestedType: 'Drain'
  },
  'Laundry Appliance Accessories and Parts': {
    removedCategory: 'Laundry Appliance Accessories and Parts',
    parentCategory: 'Laundry Appliances',
    reason: 'AI variation - accessories belong in main category',
    suggestedType: 'Accessory'
  },
  'Home Decor & Fixtures': {
    removedCategory: 'Home Decor & Fixtures',
    parentCategory: 'Home Accents',
    reason: 'AI variation - maps to Home Accents',
    suggestedType: undefined
  }
};

/**
 * Get the parent category for a removed/deprecated category
 * Returns the original category if not in remapping
 */
export function getParentCategory(category: string): string {
  const remapping = CATEGORY_REMAPPING[category];
  return remapping ? remapping.parentCategory : category;
}

/**
 * Check if a category has been removed/deprecated
 */
export function isCategoryRemoved(category: string): boolean {
  return category in CATEGORY_REMAPPING;
}

/**
 * Get the suggested type/filter for a removed category
 */
export function getSuggestedType(category: string): string | undefined {
  const remapping = CATEGORY_REMAPPING[category];
  return remapping?.suggestedType;
}

/**
 * Get all removed category names
 */
export function getRemovedCategoryNames(): string[] {
  return Object.keys(CATEGORY_REMAPPING);
}

/**
 * Get the remapping info for a category
 */
export function getCategoryRemapping(category: string): CategoryRemapping | undefined {
  return CATEGORY_REMAPPING[category];
}

/**
 * Normalize a category name - remaps deprecated categories to their parents
 * Use this when processing AI responses or incoming data
 */
export function normalizeCategory(category: string): {
  category: string;
  wasRemapped: boolean;
  originalCategory?: string;
  suggestedType?: string;
} {
  const remapping = CATEGORY_REMAPPING[category];
  if (remapping) {
    return {
      category: remapping.parentCategory,
      wasRemapped: true,
      originalCategory: category,
      suggestedType: remapping.suggestedType
    };
  }
  return {
    category,
    wasRemapped: false
  };
}
