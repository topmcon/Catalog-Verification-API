/**
 * TYPE CONFIGURATION
 * ==================
 * Type is the NEW middle layer between Category and Style.
 * Types represent functional variations or configurations within a category.
 * 
 * Example: Refrigerator → 4-Door Flex (Type) → French Door (Style)
 * 
 * **PICKLIST SYNC**: When Salesforce updates types.json, validate mappings here.
 * Last review: 2026-02-09
 */

import typesPicklist from '../../config/salesforce-picklists/types.json';
import categoryTypeMappingPicklist from '../../config/salesforce-picklists/category-type-mapping.json';

// ============================================
// TYPE INTERFACES
// ============================================

export interface TypePicklistItem {
  type_name: string;
  type_id: string;
  status: 'existing' | 'new_needed';
  applicable_categories?: Array<{
    department: string;
    category_name: string;
  }>;
}

export interface CategoryTypeMapping {
  department_name: string;
  family_name: string;
  category_name: string;
  category_id: string;
  filter_label: string;
  logic: string;
  types: Array<{
    type_name: string;
    type_id: string | null;
    status: 'existing' | 'new_needed';
    primary_filter: boolean;
  }>;
}

export interface CategoryTypeMappingData {
  metadata: {
    version: string;
    created: string;
    purpose: string;
    hierarchy: string;
    note: string;
  };
  mappings: CategoryTypeMapping[];
}

// ============================================
// PICKLIST DATA
// ============================================

/**
 * All types from Salesforce types.json
 */
export const TYPES: TypePicklistItem[] = typesPicklist as TypePicklistItem[];

/**
 * Category to Type mappings from Salesforce category-type-mapping.json
 */
export const CATEGORY_TYPE_MAPPINGS: CategoryTypeMappingData = categoryTypeMappingPicklist as CategoryTypeMappingData;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all types for a specific category
 */
export function getTypesForCategory(categoryName: string): TypePicklistItem[] {
  return TYPES.filter(type => 
    type.applicable_categories?.some(cat => 
      cat.category_name.toLowerCase() === categoryName.toLowerCase()
    )
  );
}

/**
 * Get type by ID
 */
export function getTypeById(typeId: string): TypePicklistItem | undefined {
  return TYPES.find(type => type.type_id === typeId);
}

/**
 * Get type by name
 */
export function getTypeByName(typeName: string): TypePicklistItem | undefined {
  return TYPES.find(type => 
    type.type_name.toLowerCase() === typeName.toLowerCase()
  );
}

/**
 * Get category-type mapping for a specific category
 */
export function getCategoryTypeMapping(categoryName: string): CategoryTypeMapping | undefined {
  return CATEGORY_TYPE_MAPPINGS.mappings.find(mapping => 
    mapping.category_name.toLowerCase() === categoryName.toLowerCase()
  );
}

/**
 * Check if a type is valid for a category
 */
export function isValidTypeForCategory(typeName: string, categoryName: string): boolean {
  const mapping = getCategoryTypeMapping(categoryName);
  if (!mapping) return false;
  
  return mapping.types.some(type => 
    type.type_name.toLowerCase() === typeName.toLowerCase()
  );
}

/**
 * Get all type names
 */
export function getAllTypeNames(): string[] {
  return TYPES.map(type => type.type_name);
}

/**
 * Get primary filter types for a category
 */
export function getPrimaryTypesForCategory(categoryName: string): string[] {
  const mapping = getCategoryTypeMapping(categoryName);
  if (!mapping) return [];
  
  return mapping.types
    .filter(type => type.primary_filter)
    .map(type => type.type_name);
}

/**
 * Get department and family for a type
 */
export function getTypeContext(typeName: string): { department: string; family: string; category: string } | undefined {
  const mapping = CATEGORY_TYPE_MAPPINGS.mappings.find(m =>
    m.types.some(t => t.type_name.toLowerCase() === typeName.toLowerCase())
  );
  
  if (!mapping) return undefined;
  
  return {
    department: mapping.department_name,
    family: mapping.family_name,
    category: mapping.category_name
  };
}
