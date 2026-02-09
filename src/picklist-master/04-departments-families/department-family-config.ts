/**
 * DEPARTMENT & FAMILY CONFIGURATION
 * ===================================
 * Top-level organizational hierarchy for products.
 * 
 * Department (10) → Family (8) → Category  
 * 
 * **PICKLIST SYNC**: When Salesforce updates departments.json or families.json, data auto-updates.
 * Last review: 2026-02-09
 */

import departmentsPicklist from '../../config/salesforce-picklists/departments.json';
import familiesPicklist from '../../config/salesforce-picklists/families.json';

// ============================================
// INTERFACES
// ============================================

export interface DepartmentPicklistItem {
  department_name: string;
}

export interface FamilyPicklistItem {
  family_name: string;
  department_name: string;
}

// ============================================
// PICKLIST DATA
// ============================================

/**
 * All departments from Salesforce departments.json
 */
export const DEPARTMENTS: DepartmentPicklistItem[] = departmentsPicklist as DepartmentPicklistItem[];

/**
 * All families from Salesforce families.json
 */
export const FAMILIES: FamilyPicklistItem[] = familiesPicklist as FamilyPicklistItem[];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all department names
 */
export function getAllDepartmentNames(): string[] {
  return DEPARTMENTS.map(dept => dept.department_name);
}

/**
 * Get all family names
 */
export function getAllFamilyNames(): string[] {
  return FAMILIES.map(fam => fam.family_name);
}

/**
 * Get families for a specific department
 */
export function getFamiliesForDepartment(departmentName: string): FamilyPicklistItem[] {
  return FAMILIES.filter(fam => 
    fam.department_name.toLowerCase() === departmentName.toLowerCase()
  );
}

/**
 * Get department for a family
 */
export function getDepartmentForFamily(familyName: string): string | undefined {
  const family = FAMILIES.find(fam => 
    fam.family_name.toLowerCase() === familyName.toLowerCase()
  );
  return family?.department_name;
}

/**
 * Check if department exists
 */
export function isDepartment(name: string): boolean {
  return DEPARTMENTS.some(dept => 
    dept.department_name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Check if family exists
 */
export function isFamily(name: string): boolean {
  return FAMILIES.some(fam => 
    fam.family_name.toLowerCase() === name.toLowerCase()
  );
}
