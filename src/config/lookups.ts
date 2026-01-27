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
// OPTIMIZED FILTER ATTRIBUTES (from JSON v2.0)
// ============================================

/**
 * Filter attribute from Salesforce - matches v2.0 JSON structure
 */
interface OptimizedFilterAttribute {
  rank: number;
  name: string;
  sf_id: string | null;      // Salesforce field ID
  type: string;              // enum, boolean, number, string
}

/**
 * Category config from v2.0 JSON structure
 */
interface OptimizedCategoryConfig {
  department: string;
  category_id: string;       // Salesforce category ID
  attributes: OptimizedFilterAttribute[];
}

/**
 * Full v2.0 JSON structure
 */
interface CategoryFilterAttributesV2 {
  version: string;
  date: string;
  total_categories: number;
  categories: Record<string, OptimizedCategoryConfig>;
}

// Cached data from JSON file
let CATEGORY_FILTER_DATA: CategoryFilterAttributesV2 | null = null;

/**
 * Load category filter attributes from JSON (v2.0 format)
 * Supports both nested v2.0 format and legacy flat format
 */
function loadOptimizedFilterAttributes(): Record<string, OptimizedCategoryConfig> {
  if (CATEGORY_FILTER_DATA) {
    return CATEGORY_FILTER_DATA.categories;
  }
  
  try {
    const jsonPath = path.join(__dirname, 'salesforce-picklists', 'category-filter-attributes.json');
    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const parsed = JSON.parse(rawData);
    
    // Check if this is v2.0 format (has "categories" nested object)
    if (parsed.version && parsed.categories) {
      CATEGORY_FILTER_DATA = parsed as CategoryFilterAttributesV2;
      console.log(`[lookups] Loaded category-filter-attributes.json v${parsed.version} with ${parsed.total_categories} categories`);
      return CATEGORY_FILTER_DATA.categories;
    }
    
    // Legacy format fallback - wrap in categories structure
    console.warn('[lookups] Loading legacy format category-filter-attributes.json');
    CATEGORY_FILTER_DATA = {
      version: '1.0',
      date: 'unknown',
      total_categories: Object.keys(parsed).length,
      categories: parsed
    };
    return CATEGORY_FILTER_DATA.categories;
  } catch (error) {
    console.warn('[lookups] Could not load category-filter-attributes.json:', error);
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
    .filter(a => a.sf_id !== null)
    .map(a => a.sf_id as string);
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

/**
 * Get Salesforce category ID for a category
 */
export function getSalesforceCategoryId(categoryName: string): string | null {
  const data = loadOptimizedFilterAttributes();
  
  // Try exact match
  if (data[categoryName]) {
    return data[categoryName].category_id;
  }
  
  // Try case-insensitive
  const lowerName = categoryName.toLowerCase();
  for (const [key, value] of Object.entries(data)) {
    if (key.toLowerCase() === lowerName) {
      return value.category_id;
    }
  }
  
  return null;
}

/**
 * Get attribute name to Salesforce ID mapping for a category
 * Returns a map of { attributeName: sf_id }
 */
export function getAttributeNameToSfIdMap(categoryName: string): Record<string, string | null> {
  const attrs = getOptimizedFilterAttributes(categoryName);
  const map: Record<string, string | null> = {};
  
  for (const attr of attrs) {
    map[attr.name] = attr.sf_id;
    // Also add lowercase version for easier matching
    map[attr.name.toLowerCase()] = attr.sf_id;
    // Add snake_case version
    map[attr.name.toLowerCase().replace(/\s+/g, '_')] = attr.sf_id;
  }
  
  return map;
}

/**
 * Get the top 15 filter attribute names for a category (in rank order)
 */
export function getTop15AttributeNames(categoryName: string): string[] {
  const attrs = getOptimizedFilterAttributes(categoryName);
  return attrs
    .sort((a, b) => a.rank - b.rank)
    .map(a => a.name);
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
