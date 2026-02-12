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
  // ===== CRITICAL NOTE =====
  // ONLY include categories that are TRULY removed/deprecated from Salesforce.
  // NEVER remap valid Salesforce categories - check categories.json first!
  // Recent bugs: "Drawer", "Cooking", "Refrigeration", "Tub Faucet", etc. were valid but remapped.

  // ===== KITCHEN APPLIANCES =====
  // ⚠️ "Drawer" is VALID (ID: a01Hu000011kpC2IAI) - DO NOT REMAP
  // ⚠️ "Cooking" is VALID (ID: a01aZ00000Hm4voQAB) - DO NOT REMAP  
  // ⚠️ "Refrigeration" is VALID (ID: a01aZ00000MlHtiQAF) - DO NOT REMAP

  // ===== BATH & PLUMBING - FAUCETS =====
  // ⚠️ "Bidet Faucet" is VALID (ID: a01aZ00000dC5DmQAK) - DO NOT REMAP
  // ⚠️ "Shower Faucet" is VALID (ID: a01aZ00000dC5DtQAK) - DO NOT REMAP
  // ⚠️ "Tub Faucet" is VALID (ID: a01aZ00000dC5DzQAK) - DO NOT REMAP
  'Bathtub Faucets': {
    removedCategory: 'Bathtub Faucets',
    parentCategory: 'Tub Faucet',  // Use the valid "Tub Faucet" category
    reason: 'Typo/alternate name - correct name is Tub Faucet',
    suggestedType: undefined
  },
  'Tub Spouts': {
    removedCategory: 'Tub Spouts',
    parentCategory: 'Bathroom Cabinet Hardware',
    reason: 'Faucet component, not separate category',
    suggestedType: 'Tub Spout'
  },

  // ===== BATH & PLUMBING - ACCESSORIES =====
  'Shower Accessory': {
    removedCategory: 'Shower Accessory',
    parentCategory: 'Bathroom Cabinet Hardware',
    reason: 'Redundant subcategory',
    suggestedType: 'Shower'
  },
  'Tub and Shower Accessory': {
    removedCategory: 'Tub and Shower Accessory',
    parentCategory: 'Bathroom Cabinet Hardware',
    reason: 'Redundant subcategory',
    suggestedType: 'Tub/Shower'
  },
  // ===== BATH & PLUMBING - TYPOS/DUPLICATES =====
  'conbaucets': {
    removedCategory: 'conbaucets',
    parentCategory: 'Bathroom Faucet',
    reason: 'Typo/data error',
    suggestedType: undefined
  },
  // ===== KITCHEN PLUMBING - FAUCETS =====
  // ⚠️ "Bar Faucet" is VALID (ID: a01aZ00000dC5E3QAK) - DO NOT REMAP
  // ⚠️ "Pot Filler Faucet" is VALID (ID: a01aZ00000dC5EHQA0) - DO NOT REMAP
  // ===== KITCHEN PLUMBING - OTHER =====  // ⚠️ "Tankless Water Heater" is VALID (ID: a01aZ00000dC5DwQAK) - DO NOT REMAP

  // ===== LIGHTING - TYPES =====
  // ===== CEILING FANS (17 removed) =====
  'Ceiling Fans with Light': {
    removedCategory: 'Ceiling Fans with Light',
    parentCategory: 'Ceiling Fan',
    reason: 'Feature filter',
    suggestedType: 'With Light'
  },
  'Ceiling Fans with Remotes': {
    removedCategory: 'Ceiling Fans with Remotes', 
    parentCategory: 'Ceiling Fan',
    reason: 'Feature filter',
    suggestedType: 'With Remote'
  },
  'Ceiling Fans without Light': {
    removedCategory: 'Ceiling Fans without Light',
    parentCategory: 'Ceiling Fan',
    reason: 'Feature filter',
    suggestedType: 'Without Light'
  },
  'DC Motor Ceiling Fans': {
    removedCategory: 'DC Motor Ceiling Fans',
    parentCategory: 'Ceiling Fan',
    reason: 'Specification filter',
    suggestedType: 'DC Motor'
  },
  'Designer Ceiling Fans': {
    removedCategory: 'Designer Ceiling Fans',
    parentCategory: 'Ceiling Fan',
    reason: 'Style filter',
    suggestedType: 'Designer'
  },
  'Dual Ceiling Fans': {
    removedCategory: 'Dual Ceiling Fans',
    parentCategory: 'Ceiling Fan',
    reason: 'Type filter',
    suggestedType: 'Dual'
  },
  'Fandelier Ceiling Fans': {
    removedCategory: 'Fandelier Ceiling Fans',
    parentCategory: 'Ceiling Fan',
    reason: 'Style filter',
    suggestedType: 'Fandelier'
  },
  'Hugger Fans': {
    removedCategory: 'Hugger Fans',
    parentCategory: 'Ceiling Fan',
    reason: 'Mount type filter',
    suggestedType: 'Hugger/Low Profile'
  },
  'Indoor Ceiling Fans': {
    removedCategory: 'Indoor Ceiling Fans',
    parentCategory: 'Ceiling Fan',
    reason: 'Location filter',
    suggestedType: 'Indoor'
  },
  'Large Ceiling Fans': {
    removedCategory: 'Large Ceiling Fans',
    parentCategory: 'Ceiling Fan',
    reason: 'Size filter',
    suggestedType: 'Large'
  },
  'LED Ceiling Fans': {
    removedCategory: 'LED Ceiling Fans',
    parentCategory: 'Ceiling Fan',
    reason: 'Feature filter',
    suggestedType: 'LED'
  },
  // ⚠️ "Outdoor Ceiling Fan" is VALID (ID: a01aZ00000dC5EvQAK) - DO NOT REMAP
  
  'Small Ceiling Fans': {
    removedCategory: 'Small Ceiling Fans',
    parentCategory: 'Ceiling Fan',
    reason: 'Size filter',
    suggestedType: 'Small'
  },
  'Smart Home Fans': {
    removedCategory: 'Smart Home Fans',
    parentCategory: 'Ceiling Fan',
    reason: 'Feature filter',
    suggestedType: 'Smart/WiFi'
  },
  'Trending Ceiling Fans': {
    removedCategory: 'Trending Ceiling Fans',
    parentCategory: 'Ceiling Fan',
    reason: 'Marketing tag, not product category',
    suggestedType: undefined
  },
  'Utility Fans': {
    removedCategory: 'Utility Fans',
    parentCategory: 'Ceiling Fan',
    reason: 'Style filter',
    suggestedType: 'Industrial/Utility'
  },

  // ===== DOOR HARDWARE (4 removed) =====
  'Door Entry Sets': {
    removedCategory: 'Door Entry Sets',
    parentCategory: 'Handleset',
    reason: 'Type under handlesets/door hardware',
    suggestedType: 'Entry Set'
  },
  'Door Hardware: Knobs and Levers': {
    removedCategory: 'Door Hardware: Knobs and Levers',
    parentCategory: 'Handleset',
    reason: 'Redundant parent name',
    suggestedType: undefined
  },

  // ===== CABINET HARDWARE (18 removed) =====
  'Cabinet Hardware Bulk Packs': {
    removedCategory: 'Cabinet Hardware Bulk Packs',
    parentCategory: 'Designer Cabinet Hardware',
    reason: 'Packaging option, not category',
    suggestedType: undefined
  },
  'Cabinet Hardware Mounting Templates': {
    removedCategory: 'Cabinet Hardware Mounting Templates',
    parentCategory: 'Designer Cabinet Hardware',
    reason: 'Accessory/tool',
    suggestedType: 'Mounting Template'
  },

  // ⚠️ "Drawer Slide and Accessory" is VALID (ID: a01aZ00000dCejeQAC) - DO NOT REMAP

  // ===== OUTDOOR DUPLICATES =====
  // ⚠️ "Outdoor Lighting" is VALID (ID: a01aZ00000dC5EWQA0) - DO NOT REMAP
  // Note: If there are true duplicates, they need different IDs to be removed

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
    parentCategory: 'Bathroom Cabinet Hardware',
    reason: 'AI variation with department suffix',
    suggestedType: 'Shower'
  },
  'Pendants (Lighting)': {
    removedCategory: 'Pendants (Lighting)',
    parentCategory: 'Pendant',
    reason: 'AI variation with department suffix',
    suggestedType: undefined
  },
  'Pendant Lights': {
    removedCategory: 'Pendant Lights',
    parentCategory: 'Pendant',
    reason: 'AI variation - correct name is Pendants',
    suggestedType: undefined
  },
  'Ventilation': {
    removedCategory: 'Ventilation',
    parentCategory: 'Exhaust Fan',
    reason: 'Generic term - maps to Exhaust Fans',
    suggestedType: undefined
  },
  'Kitchen Accessories (Plumbing & Bath)': {
    removedCategory: 'Kitchen Accessories (Plumbing & Bath)',
    parentCategory: 'Kitchen Storage & Organization',
    reason: 'AI variation with department suffix - mapped to valid SF category',
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
    parentCategory: 'Washer',
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
