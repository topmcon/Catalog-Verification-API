/**
 * TYPE MATCHER SERVICE
 * ====================
 * Matches AI-derived product types to Salesforce Type picklist
 * Similar to style-matcher and brand-matcher
 */

import {
  getTypeByName,
  isValidTypeForCategory,
  getCategoryTypeMapping,
  TypePicklistItem
} from '../picklist-master/03-types/type-config';
import logger from '../utils/logger';

export interface TypeMatchResult {
  matched: boolean;
  matchedValue: TypePicklistItem | null;
  confidence: number;
  matchMethod: 'exact' | 'normalized' | 'fuzzy' | 'none';
  originalInput: string;
}

/**
 * Normalize type name for matching
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes extra spaces
 */
function normalizeTypeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Match AI-derived type to Salesforce Type picklist
 * 
 * @param aiType - Type name from AI analysis
 * @param category - Product category (types are category-specific)
 * @returns Match result with confidence score
 */
export function matchTypeToPicklist(
  aiType: string | null | undefined,
  category: string
): TypeMatchResult {
  const originalInput = aiType || '';
  
  // If no type provided, return no match
  if (!aiType || !aiType.trim()) {
    return {
      matched: false,
      matchedValue: null,
      confidence: 0,
      matchMethod: 'none',
      originalInput
    };
  }

  // Get valid types for this category
  const categoryMapping = getCategoryTypeMapping(category);
  if (!categoryMapping) {
    logger.warn('No type mapping found for category', { category, aiType });
    return {
      matched: false,
      matchedValue: null,
      confidence: 0,
      matchMethod: 'none',
      originalInput
    };
  }

  const validTypes = categoryMapping.types;
  const normalizedInput = normalizeTypeName(aiType);

  // TRY 1: Exact match (case-insensitive)
  for (const type of validTypes) {
    if (normalizeTypeName(type.type_name) === normalizedInput) {
      const typePicklistItem = getTypeByName(type.type_name);
      if (typePicklistItem) {
        logger.info('Type matched (exact)', {
          input: aiType,
          matched: type.type_name,
          category,
          confidence: 1.0
        });
        return {
          matched: true,
          matchedValue: typePicklistItem,
          confidence: 1.0,
          matchMethod: 'exact',
          originalInput
        };
      }
    }
  }

  // TRY 2: Partial match - check if input contains type or vice versa
  for (const type of validTypes) {
    const normalizedType = normalizeTypeName(type.type_name);
    
    // Input contains the full type name
    if (normalizedInput.includes(normalizedType)) {
      const typePicklistItem = getTypeByName(type.type_name);
      if (typePicklistItem) {
        logger.info('Type matched (partial - input contains type)', {
          input: aiType,
          matched: type.type_name,
          category,
          confidence: 0.9
        });
        return {
          matched: true,
          matchedValue: typePicklistItem,
          confidence: 0.9,
          matchMethod: 'fuzzy',
          originalInput
        };
      }
    }
    
    // Type name contains the input
    if (normalizedType.includes(normalizedInput)) {
      const typePicklistItem = getTypeByName(type.type_name);
      if (typePicklistItem) {
        logger.info('Type matched (partial - type contains input)', {
          input: aiType,
          matched: type.type_name,
          category,
          confidence: 0.85
        });
        return {
          matched: true,
          matchedValue: typePicklistItem,
          confidence: 0.85,
          matchMethod: 'fuzzy',
          originalInput
        };
      }
    }
  }

  // TRY 3: Token matching - check if key words overlap
  const inputTokens = normalizedInput.split(' ').filter(t => t.length > 2);
  if (inputTokens.length > 0) {
    for (const type of validTypes) {
      const typeTokens = normalizeTypeName(type.type_name).split(' ').filter(t => t.length > 2);
      const matchingTokens = inputTokens.filter(token => typeTokens.includes(token));
      
      // If more than 50% of tokens match, consider it a match
      const matchRatio = matchingTokens.length / Math.max(inputTokens.length, typeTokens.length);
      if (matchRatio >= 0.5) {
        const typePicklistItem = getTypeByName(type.type_name);
        if (typePicklistItem) {
          logger.info('Type matched (token overlap)', {
            input: aiType,
            matched: type.type_name,
            category,
            matchRatio,
            confidence: 0.7 + (matchRatio * 0.2)
          });
          return {
            matched: true,
            matchedValue: typePicklistItem,
            confidence: 0.7 + (matchRatio * 0.2),
            matchMethod: 'fuzzy',
            originalInput
          };
        }
      }
    }
  }

  // NO MATCH FOUND
  logger.warn('Type not matched to picklist', {
    input: aiType,
    category,
    validTypesCount: validTypes.length
  });

  return {
    matched: false,
    matchedValue: null,
    confidence: 0,
    matchMethod: 'none',
    originalInput
  };
}

/**
 * Validate that a type is valid for a given category
 * Returns validation result with reason if invalid
 */
export function validateTypeForCategory(
  typeName: string,
  categoryName: string
): { valid: boolean; reason?: string } {
  if (!typeName || !categoryName) {
    return {
      valid: false,
      reason: 'Missing type or category name'
    };
  }

  const isValid = isValidTypeForCategory(typeName, categoryName);
  
  if (!isValid) {
    const categoryMapping = getCategoryTypeMapping(categoryName);
    const validTypes = categoryMapping
      ? categoryMapping.types.map(t => t.type_name).slice(0, 5)
      : [];
    
    return {
      valid: false,
      reason: `Type "${typeName}" is not valid for category "${categoryName}". Valid options include: ${validTypes.join(', ')}${categoryMapping && categoryMapping.types.length > 5 ? '...' : ''}`
    };
  }

  return { valid: true };
}
