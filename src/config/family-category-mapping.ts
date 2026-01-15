/**
 * Family-Category Mapping Configuration
 * 
 * Defines the hierarchical relationship between Department → Family → Category
 * Used to validate that Category selections are appropriate for the Product Family
 * 
 * Hierarchy:
 * - Department: Top-level grouping (Kitchen, Laundry)
 * - Family: Mid-level grouping (Cooking, Kitchen Refrigeration, Laundry)
 * - Category: Specific product type (Oven, Refrigerator, Washer, etc.)
 */

export interface FamilyCategoryMapping {
  department: string;
  family: string;
  categories: string[];
}

/**
 * Master mapping of Product Families to their valid Categories
 * Based on Salesforce product hierarchy
 */
export const FAMILY_CATEGORY_MAPPINGS: FamilyCategoryMapping[] = [
  // Kitchen Department
  {
    department: 'Kitchen',
    family: 'Cooking',
    categories: [
      'Pizza Oven',
      'Barbeques',
      'Coffee Maker',
      'Cooktop',
      'Microwave',
      'Oven',
      'Range',
      'Range Hood'
    ]
  },
  {
    department: 'Kitchen',
    family: 'Kitchen Refrigeration',
    categories: [
      'Dishwasher',
      'Drawer',
      'Freezer',
      'Icemaker',
      'Refrigerator'
    ]
  },
  
  // Laundry Department
  {
    department: 'Laundry',
    family: 'Laundry',
    categories: [
      'All in One Washer / Dryer',
      'Dryer',
      'Standalone Pedestal',
      'Washer'
    ]
  }
];

/**
 * Get the Product Family for a given Category
 * @param category - Category name to look up
 * @returns Family name or empty string if not found
 */
export function getFamilyForCategory(category: string): string {
  if (!category) return '';
  
  const normalized = category.trim();
  
  for (const mapping of FAMILY_CATEGORY_MAPPINGS) {
    const matchedCategory = mapping.categories.find(
      cat => cat.toLowerCase() === normalized.toLowerCase()
    );
    
    if (matchedCategory) {
      return mapping.family;
    }
  }
  
  return '';
}

/**
 * Get the Department for a given Category
 * @param category - Category name to look up
 * @returns Department name or empty string if not found
 */
export function getDepartmentForCategory(category: string): string {
  if (!category) return '';
  
  const normalized = category.trim();
  
  for (const mapping of FAMILY_CATEGORY_MAPPINGS) {
    const matchedCategory = mapping.categories.find(
      cat => cat.toLowerCase() === normalized.toLowerCase()
    );
    
    if (matchedCategory) {
      return mapping.department;
    }
  }
  
  return '';
}

/**
 * Get all valid Categories for a given Family
 * @param family - Family name to look up
 * @returns Array of valid category names
 */
export function getValidCategoriesForFamily(family: string): string[] {
  if (!family) return [];
  
  const normalized = family.trim().toLowerCase();
  
  const mapping = FAMILY_CATEGORY_MAPPINGS.find(
    m => m.family.toLowerCase() === normalized
  );
  
  return mapping ? mapping.categories : [];
}

/**
 * Validate that a Category is valid for a given Family
 * @param family - Family name
 * @param category - Category name to validate
 * @returns true if category is valid for the family
 */
export function isValidCategoryForFamily(family: string, category: string): boolean {
  const validCategories = getValidCategoriesForFamily(family);
  const normalized = category.trim().toLowerCase();
  
  return validCategories.some(cat => cat.toLowerCase() === normalized);
}

/**
 * Get the complete hierarchy for a given Category
 * @param category - Category name
 * @returns Object with department, family, and category, or null if not found
 */
export function getHierarchyForCategory(category: string): { department: string; family: string; category: string } | null {
  if (!category) return null;
  
  const normalized = category.trim();
  
  for (const mapping of FAMILY_CATEGORY_MAPPINGS) {
    const matchedCategory = mapping.categories.find(
      cat => cat.toLowerCase() === normalized.toLowerCase()
    );
    
    if (matchedCategory) {
      return {
        department: mapping.department,
        family: mapping.family,
        category: matchedCategory
      };
    }
  }
  
  return null;
}

/**
 * Get all Families for a given Department
 * @param department - Department name
 * @returns Array of family names in that department
 */
export function getFamiliesForDepartment(department: string): string[] {
  if (!department) return [];
  
  const normalized = department.trim().toLowerCase();
  
  return FAMILY_CATEGORY_MAPPINGS
    .filter(m => m.department.toLowerCase() === normalized)
    .map(m => m.family);
}

/**
 * Get all Categories for a given Department
 * @param department - Department name
 * @returns Array of all category names in that department
 */
export function getAllCategoriesForDepartment(department: string): string[] {
  if (!department) return [];
  
  const normalized = department.trim().toLowerCase();
  
  return FAMILY_CATEGORY_MAPPINGS
    .filter(m => m.department.toLowerCase() === normalized)
    .flatMap(m => m.categories);
}
