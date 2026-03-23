/**
 * Helper functions to work with Salesforce master picklist JSONs
 * Replaces old category-style-mapping.ts hardcoded data
 */

import categoryStyleMapping from './salesforce-picklists/category-style-mapping.json';
import categories from './salesforce-picklists/categories.json';
import { CATEGORY_TYPE_MAPPINGS } from '../picklist-master/03-types/type-config';

// ============================================
// DESIGN STYLES (Aesthetic/Visual)
// ============================================

/**
 * Universal design styles that apply to most categories
 * Source: category-style-mapping.json (16 design aesthetics)
 */
export const UNIVERSAL_DESIGN_STYLES = categoryStyleMapping.universal_styles.map(s => s.style_name);

/**
 * Get all valid styles for a category
 * Most categories use universal design styles. Tub Filler uses configuration styles.
 * @param categoryName - The category to get styles for
 * @returns Array of valid style names
 */
export function getValidStylesForCategory(categoryName?: string): string[] {
  // Tub Filler uses configuration styles instead of design aesthetics
  if (categoryName && (categoryName.toLowerCase() === 'tub filler' || categoryName.toLowerCase() === 'tub faucet')) {
    const mapping = (categoryStyleMapping.category_specific_mappings as any[]).find(
      (c: any) => c.category_name === 'Tub Filler'
    );
    if (mapping) {
      return mapping.styles.map((s: any) => s.style_name);
    }
  }
  // All other categories use universal design styles
  return UNIVERSAL_DESIGN_STYLES;
}

/**
 * Generate AI prompt text showing all categories with their design styles
 * @returns Formatted string for AI prompt
 */
export function getAllCategoriesWithStylesForPrompt(): string {
  return `
UNIVERSAL DESIGN STYLES (apply to all categories):
${UNIVERSAL_DESIGN_STYLES.map((s, idx) => `  ${idx + 1}. "${s}"`).join('\n')}

NOTE: These are AESTHETIC/VISUAL styles, not product types.
For product configurations (e.g., French Door, Single Wall), use the TYPE field.
`;
}

// ============================================
// PRODUCT TYPES (Functional/Configuration)
// ============================================

/**
 * Get valid product types for a specific category
 * Source: category-type-mapping.json via type-config.ts
 * @param categoryName - The category to get types for
 * @returns Array of valid type names
 */
export function getValidTypesForCategory(categoryName: string): string[] {
  const mapping = CATEGORY_TYPE_MAPPINGS.mappings.find(
    m => m.category_name.toLowerCase() === categoryName.toLowerCase()
  );
  
  if (!mapping || !mapping.types) {
    return [];
  }
  
  let types = mapping.types.map(t => t.type_name);
  
  // CHANGE 3: Block "Freestanding" as a Type for Refrigerators
  // (Freestanding is an installation method, not a product type for refrigerators)
  if (categoryName.toLowerCase() === 'refrigerator') {
    types = types.filter(t => t.toLowerCase() !== 'freestanding');
  }
  
  return types;
}

/**
 * Generate AI prompt text showing all categories with their product types
 * Source: category-type-mapping.json via type-config.ts
 * @returns Formatted string for AI prompt
 */
export function getAllCategoriesWithTypesForPrompt(): string {
  const lines: string[] = [];
  
  lines.push('PRODUCT TYPES BY CATEGORY:');
  lines.push('(Type describes functional variations within a category)');
  lines.push('');
  
  // Sort categories alphabetically
  const sortedMappings = [...CATEGORY_TYPE_MAPPINGS.mappings].sort((a, b) => 
    a.category_name.localeCompare(b.category_name)
  );
  
  for (const mapping of sortedMappings) {
    lines.push(`${mapping.category_name}:`);
    
    // Show primary types first
    const primaryTypes = mapping.types.filter(t => t.primary_filter);
    const otherTypes = mapping.types.filter(t => !t.primary_filter);
    
    for (const type of primaryTypes) {
      lines.push(`  - ${type.type_name} [PRIMARY]`);
    }
    
    for (const type of otherTypes) {
      lines.push(`  - ${type.type_name}`);
    }
    
    lines.push('');
  }
  
  return lines.join('\n');
}

// ============================================
// CATEGORY HELPERS
// ============================================

/**
 * Get all categories in a department
 * Source: categories.json
 * @param departmentName - Department to filter by
 * @returns Array of category names
 */
export function getCategoriesInDepartment(departmentName: string): string[] {
  return categories
    .filter(c => c.department.toLowerCase() === departmentName.toLowerCase())
    .map(c => c.category_name);
}

/**
 * Check if a category is in the Lighting department
 * @param categoryName - Category to check
 * @returns True if category is in Lighting department
 */
export function isLightingCategoryFromMaster(categoryName: string): boolean {
  const lightingCategories = getCategoriesInDepartment('Lighting');
  return lightingCategories.some(c => c.toLowerCase() === categoryName.toLowerCase());
}

/**
 * Check if a category is shower-related (Plumbing & Bath)
 * @param categoryName - Category to check
 * @returns True if category name contains "shower"
 */
export function isShowerCategoryFromMaster(categoryName: string): boolean {
  return categoryName.toLowerCase().includes('shower');
}

/**
 * Get valid types for shower categories
 * @param categoryName - Shower category name
 * @returns Array of valid type names for this shower category
 */
export function getValidShowerTypes(categoryName: string): string[] {
  return getValidTypesForCategory(categoryName);
}

/**
 * Check if a style is valid for shower products
 * Since styles are universal design aesthetics, all styles are valid for showers
 * @param styleName - Style to validate
 * @returns True if valid
 */
export function isValidShowerStyleFromMaster(styleName: string): boolean {
  return UNIVERSAL_DESIGN_STYLES.some(s => s.toLowerCase() === styleName.toLowerCase());
}

// ============================================
// MATCHING/VALIDATION
// ============================================

/**
 * Match a style to a category
 * Uses category-specific styles for Tub Filler, universal styles for all others
 * @param styleName - Style to match
 * @param categoryName - Category to match against
 * @returns The style name if valid, or null
 */
export function matchStyleToCategory(styleName: string, categoryName?: string): string | null {
  const validStyles = getValidStylesForCategory(categoryName);
  const matched = validStyles.find(
    s => s.toLowerCase() === styleName.toLowerCase()
  );
  
  return matched || null;
}

/**
 * Match a type to a category
 * @param typeName - Type to match
 * @param categoryName - Category to match against
 * @returns The type name if valid, or null
 */
export function matchTypeToCategory(typeName: string, categoryName: string): string | null {
  const validTypes = getValidTypesForCategory(categoryName);
  const matchedType = validTypes.find(t => t.toLowerCase() === typeName.toLowerCase());
  
  return matchedType || null;
}
