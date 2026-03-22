/**
 * TYPE PROMPT GENERATION
 * ======================
 * Generate formatted prompts for AI to understand Type hierarchy
 *  
 * Type sits between Category and Style:
 * Department → Family → Category → **Type** → Style
 */

import { 
  CATEGORY_TYPE_MAPPINGS,
  getCategoryTypeMapping,
  getTypeClarification
} from '../picklist-master/03-types/type-config';

/**
 * Generate formatted type options for all categories for AI prompt
 * Groups types by category with primary types highlighted
 * 
 * @example
 * ```
 * Refrigerator:
 *   - 4-Door Flex [PRIMARY]
 *   - French Door [PRIMARY]
 *   - Side-by-Side
 *   - Top Freezer
 * ```
 */
export function getAllCategoriesWithTypesForPrompt(): string {
  const lines: string[] = [];
  
  lines.push('PRODUCT TYPES BY CATEGORY:');
  lines.push('(Type describes functional variations within a category)');
  lines.push('');
  
  // Group by category
  const categorized = new Map<string, typeof CATEGORY_TYPE_MAPPINGS.mappings[0]>();
  
  for (const mapping of CATEGORY_TYPE_MAPPINGS.mappings) {
    if (!categorized.has(mapping.category_name)) {
      categorized.set(mapping.category_name, mapping);
    }
  }
  
  // Sort categories alphabetically
  const sortedCategories = Array.from(categorized.entries()).sort((a, b) => 
    a[0].localeCompare(b[0])
  );
  
  for (const [categoryName, mapping] of sortedCategories) {
    lines.push(`${categoryName}:`);
    
    // Get primary types for marking
    const primaryTypes = new Set(
      mapping.types
        .filter(t => t.primary_filter)
        .map(t => t.type_name)
    );
    
    // List all types, mark primary ones, add clarifications
    for (const type of mapping.types) {
      const isPrimary = primaryTypes.has(type.type_name);
      const marker = isPrimary ? ' [PRIMARY]' : '';
      const clarification = getTypeClarification(type.type_name);
      const clarificationText = clarification ? ` ${clarification}` : '';
      lines.push(`  - ${type.type_name}${marker}${clarificationText}`);
    }
    
    lines.push(''); // Blank line between categories
  }
  
  return lines.join('\n');
}

/**
 * Generate Type list for a specific category
 * Used when AI has already determined the category
 * 
 * @param categoryName - The category to get types for
 * @returns Formatted type list with primary types highlighted
 */
export function getTypesForCategoryPrompt(categoryName: string): string {
  const mapping = getCategoryTypeMapping(categoryName);
  
  if (!mapping) {
    return `No types defined for category: ${categoryName}`;
  }
  
  const lines: string[] = [];
  lines.push(`Available types for ${categoryName}:`);
  
  const primaryTypes = new Set(
    mapping.types
      .filter(t => t.primary_filter)
      .map(t => t.type_name)
  );
  
  for (const type of mapping.types) {
    const isPrimary = primaryTypes.has(type.type_name);
    const marker = isPrimary ? ' [PRIMARY - Most common]' : '';
    const clarification = getTypeClarification(type.type_name);
    const clarificationText = clarification ? ` ${clarification}` : '';
    lines.push(`  - ${type.type_name}${marker}${clarificationText}`);
  }
  
  lines.push('');
  lines.push(`Filter logic: ${mapping.filter_label}`);
  lines.push(`Description: ${mapping.logic}`);
  
  return lines.join('\n');
}

/**
 * Generate concise Type guidance for AI prompts
 * Explains what Type represents in the hierarchy
 */
export function getTypeHierarchyExplanation(): string {
  return `
== PRODUCT TYPE HIERARCHY ==

The product hierarchy is: Department → Family → Category → **TYPE** → Style

**TYPE** represents the primary functional variation or mechanism within a category.
- Example: Refrigerator → "4-Door Flex" (Type) → "French Door" (Style)
- Example: Kitchen Faucet → "Pull-Down" (Type) → "Contemporary" (Style)
- Example: Bathtub → "Freestanding" (Type) → "Clawfoot" (Style)

TYPE focuses on the product's PRIMARY FUNCTION or mechanism (e.g., Pull-Down, Bridge, Pre-Rinse).
STYLE focuses on the aesthetic design language (e.g., Contemporary, Traditional, Farmhouse).

⚠️ IMPORTANT for Faucets:
- "Deck Mount" and "Single Handle" describe INSTALLATION/CONFIGURATION, not the faucet's primary function.
- PREFER functional types: Pull-Down, Pull-Out, Bridge, Pre-Rinse, Touchless, Commercial.
- Only use "Deck Mount", "Single Handle", or "Two Handle" when no functional type applies.

For product_type in your response:
1. Determine the category first
2. Analyze the product's functional variation
3. Select the BEST matching type from the list for that category
4. Use EXACT type name from the list (this ensures proper categorization)
5. Mark as PRIMARY type if it's the most common variation
`.trim();
}
