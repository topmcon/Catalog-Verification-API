/**
 * CATEGORY LOOKUP FUNCTIONS
 * ==========================
 * Centralized lookup functions for category schemas, attributes, and mappings.
 * Single source of truth for all category-related lookups.
 */

import * as fs from 'fs';
import * as path from 'path';
import { CategoryAttributeConfig } from './types';
import { getCategorySchema as getBaseCategorySchema, CATEGORY_SCHEMAS } from './category-attributes';
import { MASTER_CATEGORY_SCHEMA_MAP, getSchemaForCategory as getMasterSchema } from './master-category-schema-map';
import { getCategorySchema as getAICategorySchema, CategorySchema } from './master-category-attributes';
import { AI_CATEGORY_ALIASES, CATEGORY_NAME_ALIASES } from './constants';

// ============================================
// OPTIMIZED FILTER ATTRIBUTES (from JSON)
// ============================================

interface OptimizedFilterAttribute {
  rank: number;
  name: string;
  salesforce_id: string | null;
  filter_type: string;
  rationale: string;
}

interface OptimizedCategoryConfig {
  department: string;
  attributes: OptimizedFilterAttribute[];
}

// Load optimized filter attributes from JSON
let OPTIMIZED_FILTER_ATTRIBUTES: Record<string, OptimizedCategoryConfig> | null = null;

function loadOptimizedFilterAttributes(): Record<string, OptimizedCategoryConfig> {
  if (OPTIMIZED_FILTER_ATTRIBUTES) {
    return OPTIMIZED_FILTER_ATTRIBUTES;
  }
  
  try {
    const jsonPath = path.join(__dirname, 'salesforce-picklists', 'category-filter-attributes.json');
    const data = fs.readFileSync(jsonPath, 'utf-8');
    OPTIMIZED_FILTER_ATTRIBUTES = JSON.parse(data);
    return OPTIMIZED_FILTER_ATTRIBUTES!;
  } catch (error) {
    console.warn('Could not load optimized filter attributes:', error);
    return {};
  }
}

/**
 * Get optimized top 15 filter attributes for a category
 * Returns full attribute objects with SF IDs
 */
export function getOptimizedFilterAttributes(categoryName: string): OptimizedFilterAttribute[] {
  const data = loadOptimizedFilterAttributes();
  
  // Try exact match first
  if (data[categoryName]) {
    return data[categoryName].attributes;
  }
  
  // Try normalized name (remove emoji, extra spaces)
  const normalized = categoryName.trim();
  if (data[normalized]) {
    return data[normalized].attributes;
  }
  
  // Try case-insensitive match
  const lowerName = categoryName.toLowerCase();
  for (const [key, value] of Object.entries(data)) {
    if (key.toLowerCase() === lowerName) {
      return value.attributes;
    }
  }
  
  return [];
}

/**
 * Get optimized filter attribute Salesforce IDs for a category
 * Useful for API filtering - returns only valid SF IDs
 */
export function getOptimizedFilterAttributeIds(categoryName: string): string[] {
  const attrs = getOptimizedFilterAttributes(categoryName);
  return attrs
    .filter(a => a.salesforce_id !== null)
    .map(a => a.salesforce_id as string);
}

/**
 * Get department for a category from optimized config
 */
export function getCategoryDepartment(categoryName: string): string | null {
  const data = loadOptimizedFilterAttributes();
  
  // Try exact match
  if (data[categoryName]) {
    return data[categoryName].department;
  }
  
  // Try case-insensitive
  const lowerName = categoryName.toLowerCase();
  for (const [key, value] of Object.entries(data)) {
    if (key.toLowerCase() === lowerName) {
      return value.department;
    }
  }
  
  return null;
}

// ============================================
// RESPONSE BUILDER LOOKUPS
// ============================================

/**
 * Get schema for Response Builder system
 * Uses master-category-schema-map with 338+ aliases
 */
export function getResponseBuilderSchema(categoryName: string): CategoryAttributeConfig | null {
  return getMasterSchema(categoryName);
}

/**
 * Get full category config (with taxonomy, html attributes, etc.)
 */
export function getCategoryConfig(categoryName: string): CategoryAttributeConfig | null {
  return getBaseCategorySchema(categoryName);
}

/**
 * Get all category names from Response Builder system
 */
export function getAllResponseBuilderCategories(): string[] {
  return Object.keys(MASTER_CATEGORY_SCHEMA_MAP);
}

/**
 * Get unique schema count from Response Builder
 */
export function getUniqueSchemaCount(): number {
  const schemas = Object.values(MASTER_CATEGORY_SCHEMA_MAP);
  const uniqueSchemas = new Set(schemas.map(s => JSON.stringify(s)));
  return uniqueSchemas.size;
}

// ============================================
// AI SYSTEM LOOKUPS
// ============================================

/**
 * Get schema for AI Verification system
 * Uses master-category-attributes with fallbacks and aliases
 */
export function getAISchema(categoryName: string): CategorySchema | null {
  return getAICategorySchema(categoryName);
}

/**
 * Resolve category alias to canonical name for AI system
 */
export function resolveAICategoryAlias(categoryName: string): string {
  const normalized = categoryName.toLowerCase().trim();
  return AI_CATEGORY_ALIASES[normalized] || normalized;
}

/**
 * Get category name variations/aliases
 */
export function getCategoryAliases(categoryName: string): string[] {
  return CATEGORY_NAME_ALIASES[categoryName] || [];
}

// ============================================
// UNIFIED LOOKUPS
// ============================================

/**
 * Get top 15 filter attributes for a category
 * Priority: 1) Optimized JSON, 2) Response Builder, 3) Category Config, 4) AI System
 */
export function getTop15Attributes(categoryName: string): string[] {
  // Priority 1: Try optimized filter attributes (new JSON file)
  const optimized = getOptimizedFilterAttributes(categoryName);
  if (optimized.length > 0) {
    return optimized.map(a => a.name);
  }
  
  // Priority 2: Try Response Builder (returns CategoryAttributeConfig)
  const rbSchema = getResponseBuilderSchema(categoryName);
  if (rbSchema && rbSchema.top15FilterAttributes) {
    return rbSchema.top15FilterAttributes.slice(0, 15);
  }
  
  // Priority 3: Try category config
  const config = getCategoryConfig(categoryName);
  if (config && config.top15FilterAttributes) {
    return config.top15FilterAttributes.slice(0, 15);
  }
  
  // Priority 4: Try AI system
  const aiSchema = getAISchema(categoryName);
  if (aiSchema && aiSchema.top15FilterAttributes) {
    return aiSchema.top15FilterAttributes.slice(0, 15).map(a => a.name);
  }
  
  return [];
}

/**
 * Check if a category exists in any system
 */
export function categoryExists(categoryName: string): boolean {
  return !!(
    getResponseBuilderSchema(categoryName) ||
    getCategoryConfig(categoryName) ||
    getAISchema(categoryName)
  );
}

/**
 * Normalize category name for lookups
 * Handles # suffix, case variations, common aliases
 */
export function normalizeCategoryName(categoryName: string): string {
  if (!categoryName) return '';
  
  let normalized = categoryName.trim();
  
  // Remove # suffix for comparison
  normalized = normalized.replace(/ #$/, '');
  
  // Convert to title case for consistency
  normalized = normalized
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return normalized;
}

/**
 * Find best matching category name
 */
export function findBestCategoryMatch(input: string): string | null {
  const normalized = normalizeCategoryName(input);
  
  // Direct match
  if (categoryExists(normalized)) {
    return normalized;
  }
  
  // Try with # suffix
  if (categoryExists(normalized + ' #')) {
    return normalized + ' #';
  }
  
  // Try alias lookup
  const lowerInput = input.toLowerCase().trim();
  if (AI_CATEGORY_ALIASES[lowerInput]) {
    const canonical = AI_CATEGORY_ALIASES[lowerInput];
    // Convert to title case
    return canonical.charAt(0).toUpperCase() + canonical.slice(1);
  }
  
  // Fuzzy search through all categories
  const allCategories = getAllResponseBuilderCategories();
  const lowerNormalized = normalized.toLowerCase();
  
  for (const cat of allCategories) {
    const lowerCat = cat.toLowerCase().replace(/ #$/, '');
    if (lowerCat === lowerNormalized) {
      return cat;
    }
    // Partial match
    if (lowerCat.includes(lowerNormalized) || lowerNormalized.includes(lowerCat)) {
      return cat;
    }
  }
  
  return null;
}

// ============================================
// DIAGNOSTIC FUNCTIONS
// ============================================

/**
 * Get system coverage stats
 */
export function getSystemCoverage(): {
  responseBuilder: number;
  aiSystem: number;
  categoryConfig: number;
} {
  return {
    responseBuilder: Object.keys(MASTER_CATEGORY_SCHEMA_MAP).length,
    aiSystem: 62, // From master-category-attributes
    categoryConfig: Object.keys(CATEGORY_SCHEMAS).length,
  };
}

/**
 * Check if category has coverage in all systems
 */
export function getCategoryCoverage(categoryName: string): {
  responseBuilder: boolean;
  aiSystem: boolean;
  categoryConfig: boolean;
} {
  return {
    responseBuilder: !!getResponseBuilderSchema(categoryName),
    aiSystem: !!getAISchema(categoryName),
    categoryConfig: !!getCategoryConfig(categoryName),
  };
}
