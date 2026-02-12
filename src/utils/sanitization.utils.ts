/**
 * SANITIZATION UTILITIES
 * =====================
 * Shared functions for sanitizing values before sending to Salesforce.
 * Eliminates duplicate implementations across services.
 * 
 * Created: 2026-02-12 (Phase 3 refactoring)
 * Consolidated from: dual-ai-verification.service.ts, response-builder.service.ts, webhook.service.ts
 */

/**
 * N/A patterns that should be replaced with empty string
 * "Not Applicable" is our standard marker and should be KEPT
 */
const NA_PATTERNS: RegExp[] = [
  /^N\/A$/i,
  /^N\/A\s*\(/i,  // "N/A (some reason)"
  /^NA$/i,
  /^Not Available$/i,
  /^None$/i,
  /^Unknown$/i,
  /^-$/,
  /^--$/
];

/**
 * Sanitize a single value for Salesforce JSON compatibility
 * Removes N/A shorthand values and cleans problematic strings
 * IMPORTANT: "Not Applicable" is our standard marker and should be KEPT
 */
export function sanitizeForSalesforce(value: any): string {
  if (value === null || value === undefined) return '';
  
  const strValue = String(value).trim();
  
  // KEEP "Not Applicable" - this is our standard marker
  if (strValue === 'Not Applicable') {
    return strValue;
  }
  
  // Replace N/A shorthand variants with empty string
  for (const pattern of NA_PATTERNS) {
    if (pattern.test(strValue)) {
      return '';
    }
  }
  
  // If the value starts with N/A, return empty
  if (/^N\/A/i.test(strValue)) {
    return '';
  }
  
  return strValue;
}

/**
 * Check if a value is an N/A variant that should be filtered out
 * Used for pre-filtering values before they enter data structures
 * Note: "Not Applicable" is a valid value we want to keep!
 */
export function isNAValue(value: any): boolean {
  if (value === null || value === undefined) return true;
  
  const strValue = String(value).trim();
  if (strValue === '') return true;
  
  // IMPORTANT: "Not Applicable" is a valid value we want to keep!
  // Only filter out shorthand/legacy variants
  return NA_PATTERNS.some(pattern => pattern.test(strValue)) || /^N\/A/i.test(strValue);
}

/**
 * Sanitize an entire object's values for Salesforce
 * Recursively processes nested objects, leaves arrays untouched
 */
export function sanitizeObjectForSalesforce<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObjectForSalesforce(value);
    } else if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeForSalesforce(value) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  return sanitized;
}

/**
 * Recursively convert all null values to empty strings
 * Salesforce Apex JSON parser cannot handle null values
 * Also handles arrays (unlike sanitizeObjectForSalesforce)
 */
export function sanitizeNulls(obj: any): any {
  if (obj === null || obj === undefined) {
    return '';
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeNulls(item));
  }
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeNulls(obj[key]);
    }
    return sanitized;
  }
  return obj;
}
