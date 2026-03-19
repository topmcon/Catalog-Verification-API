/**
 * STYLE VALIDATOR SERVICE
 * ========================
 * Validates and corrects product styles based on category-specific rules.
 * Extracted from dual-ai-verification.service.ts for maintainability.
 * 
 * Functions:
 * - isAestheticStyle: Check if style is decorative vs functional
 * - isLightingCategory: Check if category is lighting-related
 * - isShowerCategory: Check if category is shower/plumbing
 * - isValidShowerStyle: Check if style is valid for shower products
 * - validateStyleForCategory: Universal style validation
 * - validateAndCorrectLightingStyle: Lighting-specific corrections
 * - validateAndCorrectShowerStyle: Shower-specific corrections
 */

import {
  getValidStylesForCategory,
  UNIVERSAL_DESIGN_STYLES,
  isLightingCategoryFromMaster,
  isShowerCategoryFromMaster,
  isValidShowerStyleFromMaster,
} from '../config/master-picklist-helpers';

// ============================================
// STYLE VALIDATION HELPERS
// ============================================

/**
 * Aesthetic styles that should be avoided in favor of product types
 * These are design/decorative styles rather than functional product types
 * Synced from UNIVERSAL_DESIGN_STYLES in category-style-mapping.ts
 */
const AESTHETIC_STYLES = UNIVERSAL_DESIGN_STYLES;

/**
 * Check if a style is aesthetic (design-based) rather than product type
 */
export function isAestheticStyle(style: string): boolean {
  if (!style) return false;
  return AESTHETIC_STYLES.some(aesthetic => 
    style.toLowerCase().includes(aesthetic.toLowerCase())
  );
}

/**
 * Check if a category is lighting-related
 * Uses dynamic lookup from category-type-style-mapping.json
 */
export function isLightingCategory(category: string): boolean {
  if (!category) return false;
  return isLightingCategoryFromMaster(category);
}

/**
 * Validate and correct product style for lighting categories
 * Returns corrected style or null if validation passes
 */
export function validateAndCorrectLightingStyle(
  style: string,
  category: string,
  categoryMapping: string[]
): { needsCorrection: boolean; correctedStyle: string | null; reason: string } {
  // Only validate lighting categories
  if (!isLightingCategory(category)) {
    return { needsCorrection: false, correctedStyle: null, reason: 'Not a lighting category' };
  }
  
  // Check if current style is aesthetic
  if (!isAestheticStyle(style)) {
    return { needsCorrection: false, correctedStyle: null, reason: 'Style is product type, not aesthetic' };
  }
  
  // Style is aesthetic in lighting category - needs correction
  // Use first product type from category mapping as fallback
  const firstProductType = categoryMapping && categoryMapping.length > 0 
    ? categoryMapping[0] 
    : null;
  
  const reason = `Lighting category "${category}" should use product type, not aesthetic style "${style}"`;
  
  return {
    needsCorrection: true,
    correctedStyle: firstProductType,
    reason
  };
}

/**
 * Check if a category is a shower/plumbing category
 * Uses dynamic lookup from category-type-style-mapping.json
 */
export function isShowerCategory(category: string): boolean {
  if (!category) return false;
  return isShowerCategoryFromMaster(category);
}

/**
 * Check if a style is a valid shower style in the Salesforce picklist
 * Uses dynamic lookup from category-type-style-mapping.json
 */
export function isValidShowerStyle(style: string): boolean {
  if (!style) return false;
  return isValidShowerStyleFromMaster(style);
}

/**
 * UNIVERSAL validation: Check if style is valid for ANY category
 * Returns the corrected style from category-type-style list if aesthetic style was used
 */
export function validateStyleForCategory(
  style: string,
  category: string
): { 
  needsCorrection: boolean; 
  correctedStyle: string | null; 
  reason: string;
  isAesthetic: boolean;
} {
  if (!style || !category) {
    return { needsCorrection: false, correctedStyle: null, reason: 'Missing style or category', isAesthetic: false };
  }
  
  // Get valid styles for this category from category-type-style-mapping
  const validStyles = getValidStylesForCategory(category);
  
  // If no mapping exists for this category, allow any style
  if (validStyles.length === 0) {
    return { needsCorrection: false, correctedStyle: null, reason: `No style mapping for category "${category}"`, isAesthetic: false };
  }
  
  // Check if current style matches any valid style (case-insensitive, contextual)
  const normalizedStyle = style.toLowerCase().trim().replace(/[\s\-_]/g, '');
  const styleMatch = validStyles.find(vs => {
    const normalizedValid = vs.toLowerCase().trim().replace(/[\s\-_]/g, '');
    return normalizedValid === normalizedStyle || 
           normalizedValid.includes(normalizedStyle) || 
           normalizedStyle.includes(normalizedValid);
  });
  
  if (styleMatch) {
    // Style is valid (possibly with different casing) - use the canonical form
    return { needsCorrection: false, correctedStyle: styleMatch, reason: 'Style matches valid option', isAesthetic: false };
  }
  
  // Style is NOT in the valid list for this category
  const aesthetic = isAestheticStyle(style);
  
  // Return "Not Applicable" when no valid style matches - never use random fallback
  return {
    needsCorrection: true,
    correctedStyle: 'Not Applicable',
    reason: `Style "${style}" is NOT valid for category "${category}". Setting to "Not Applicable".`,
    isAesthetic: aesthetic
  };
}

/**
 * Validate and correct product style for shower/plumbing categories
 * Corrects invalid styles like "Showerheads & Accessories" to valid picklist values like "Rain Head"
 */
export function validateAndCorrectShowerStyle(
  style: string,
  category: string,
  productDescription?: string
): { 
  needsCorrection: boolean; 
  correctedStyle: string | null;
  idealStyle: string | null;
  reason: string 
} {
  // Only validate shower categories
  if (!isShowerCategory(category)) {
    return { needsCorrection: false, correctedStyle: null, idealStyle: null, reason: 'Not a shower category' };
  }
  
  // Check if current style is already valid
  if (isValidShowerStyle(style)) {
    return { needsCorrection: false, correctedStyle: null, idealStyle: null, reason: 'Style is valid for shower category' };
  }
  
  // Style needs correction - determine best replacement
  const descLower = (productDescription || '').toLowerCase();
  
  // Determine the IDEAL style based on product characteristics
  let idealStyle = 'Showerhead';
  let correctedStyle = 'Rain Head';
  
  if (descLower.includes('handheld') || descLower.includes('hand held') || descLower.includes('hand shower')) {
    idealStyle = 'Handheld';
    correctedStyle = 'Handheld';
  } else if (descLower.includes('body spray') || descLower.includes('bodyspray')) {
    idealStyle = 'Body Spray';
    correctedStyle = 'Body Spray';
  } else if (descLower.includes('shower system') || descLower.includes('complete system')) {
    idealStyle = 'Shower System';
    correctedStyle = 'Shower System';
  } else if (descLower.includes('shower panel')) {
    idealStyle = 'Shower Panel';
    correctedStyle = 'Shower Panel';
  } else if (descLower.includes('rain') || descLower.includes('rainfall')) {
    idealStyle = 'Rain Head';
    correctedStyle = 'Rain Head';
  } else if (descLower.includes('dual')) {
    idealStyle = 'Dual';
    correctedStyle = 'Dual';
  } else {
    idealStyle = 'Showerhead';
    correctedStyle = 'Rain Head';
  }
  
  const reason = `Shower category "${category}" received invalid style "${style}" - ideal: "${idealStyle}", fallback: "${correctedStyle}"`;
  
  return {
    needsCorrection: true,
    correctedStyle,
    idealStyle,
    reason
  };
}

// Export type definitions
export interface StyleValidationResult {
  needsCorrection: boolean;
  correctedStyle: string | null;
  reason: string;
}

export interface ShowerStyleValidationResult extends StyleValidationResult {
  idealStyle: string | null;
}

export interface UniversalStyleValidationResult extends StyleValidationResult {
  isAesthetic: boolean;
}
