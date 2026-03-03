/**
 * SIZE CLASS ROUNDING UTILITY
 * ============================
 * 
 * Smart rounding logic that rounds measurements to industry-standard size classes.
 * 
 * ROUNDING LOGIC:
 * - NEAREST: Round to closest standard size (47.1" → 48", 48.5" → 48")
 * - EXACT: Use manufacturer's value as-is (385 CFM → 385 CFM)
 * 
 * EXAMPLES:
 * - Refrigerator 47.25" → 48" (closest to 48 from [24, 28, 30, 33, 36, 42, 48])
 * - Dishwasher 23.8" → 24" (closest to 24 from [18, 24])
 * - Range Hood 385 CFM → 385 CFM (EXACT - no rounding)
 * - Hardwood 4.75" → 5" (4.75 is closer to 5 than to 4)
 * - Hardwood 2.5" → 2-1/4" (2.5 is closer to 2.25 than to 3.25)
 * 
 * Created: 2026-03-03
 */

import { CategorySizeClass } from '../config/category-size-classes';

/**
 * Parse a size class value (handles fractions like "2-1/4")
 * @param sizeClass - Size class string (e.g., "24", "2-1/4", "3x6")
 * @returns Numeric value or NaN
 * 
 * Examples:
 * - "24" → 24
 * - "2-1/4" → 2.25
 * - "3-3/4" → 3.75
 * - "3x6" → 3 (takes first dimension for tile sizes)
 */
export function parseSizeClass(sizeClass: string): number {
  if (!sizeClass) return NaN;
  
  // Handle tile sizes (e.g., "12x24" → 12)
  if (sizeClass.includes('x') || sizeClass.includes('×')) {
    const firstDimension = sizeClass.split(/[x×]/)[0].trim();
    return parseFloat(firstDimension);
  }
  
  // Handle fractions (e.g., "2-1/4" → 2.25)
  if (sizeClass.includes('/')) {
    const parts = sizeClass.split('-');
    
    if (parts.length === 1) {
      // Just a fraction: "1/4" → 0.25
      const [numerator, denominator] = parts[0].split('/').map(n => parseInt(n.trim()));
      if (isNaN(numerator) || isNaN(denominator) || denominator === 0) return NaN;
      return numerator / denominator;
    } else {
      // Whole + fraction: "2-1/4" → 2.25
      const whole = parseInt(parts[0].trim()) || 0;
      const [numerator, denominator] = parts[1].split('/').map(n => parseInt(n.trim()));
      if (isNaN(numerator) || isNaN(denominator) || denominator === 0) return NaN;
      return whole + (numerator / denominator);
    }
  }
  
  // Simple number: "24" → 24
  return parseFloat(sizeClass);
}

/**
 * Format a numeric value back to a display string
 * @param value - Numeric value
 * @param originalClasses - Original size class strings (to preserve formatting)
 * @returns Formatted string
 * 
 * Examples:
 * - 2.25 with classes ["2-1/4", "3-1/4"] → "2-1/4"
 * - 24 with classes ["18", "24"] → "24"
 * - 12 with classes ["12x24", "16x16"] → "12" (simplified for width)
 */
export function formatSizeClass(value: number, originalClasses: string[]): string {
  if (isNaN(value)) return value.toString();
  
  // Try to find exact match in original classes
  for (const sizeClass of originalClasses) {
    const parsed = parseSizeClass(sizeClass);
    if (Math.abs(parsed - value) < 0.01) {  // Close enough
      // For tile sizes, return just the number part
      if (sizeClass.includes('x') || sizeClass.includes('×')) {
        return value.toString();
      }
      return sizeClass;  // Return original format (preserves fractions)
    }
  }
  
  // No exact match - return as decimal
  // Check if it's a clean integer
  if (value % 1 === 0) {
    return value.toString();
  }
  
  // Check if it's a common fraction
  const fraction = value % 1;
  if (Math.abs(fraction - 0.25) < 0.01) {
    return `${Math.floor(value)}-1/4`;
  } else if (Math.abs(fraction - 0.5) < 0.01) {
    return `${Math.floor(value)}-1/2`;
  } else if (Math.abs(fraction - 0.75) < 0.01) {
    return `${Math.floor(value)}-3/4`;
  } else if (Math.abs(fraction - 0.33) < 0.02) {
    return `${Math.floor(value)}-1/3`;
  } else if (Math.abs(fraction - 0.67) < 0.02) {
    return `${Math.floor(value)}-2/3`;
  }
  
  // Return as decimal with 1-2 decimal places
  return value.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Round a measurement to the nearest standard size class
 * 
 * @param actualValue - The actual measurement value (e.g., 47.25)
 * @param sizeClassConfig - Size class configuration for the category
 * @param installationType - Optional installation type (e.g., "Built-In", "Freestanding") - Reserved for future use
 * @returns Rounded value according to size class standards
 * 
 * EXAMPLES:
 * 
 * Refrigerator (classes: [24, 28, 30, 33, 36, 42, 48]):
 * - 47.25 → 48 (closest)
 * - 47.1 → 48 (closest)
 * - 48.5 → 48 (closest - 48.5 is closer to 48 than to 42)
 * - 35.5 → 36 (closest)
 * 
 * Dishwasher (classes: [18, 24]):
 * - 23.8 → 24 (closest)
 * - 19.5 → 18 (closest - equidistant defaults to lower)
 * 
 * Range Hood CFM (classes: [300, 400, 600], method: EXACT):
 * - 385 → 385 (EXACT - no rounding)
 * 
 * Hardwood Flooring (classes: ["2-1/4", "3-1/4", "4", "5"]):
 * - 2.5 → 2.25 (closer to 2-1/4 than 3-1/4)
 * - 4.75 → 5 (closer to 5 than 4)
 * 
 * Note: installationType parameter is currently unused but reserved for future
 * enhancement where Built-In appliances might use different rounding rules.
 */
export function roundToStandardSize(
  actualValue: number,
  sizeClassConfig: CategorySizeClass | null,
  _installationType?: string  // Prefixed with _ to indicate unused but reserved
): number {
  // No size class config or disabled = use mathematical rounding
  if (!sizeClassConfig || !sizeClassConfig.has_measurement_class) {
    return Math.round(actualValue);
  }
  
  // EXACT method = return as-is (for performance ratings)
  if (sizeClassConfig.rounding_method === 'EXACT') {
    return actualValue;
  }
  
  // Parse all size classes to numeric values
  const parsedClasses = sizeClassConfig.classes
    .map(c => parseSizeClass(c))
    .filter(c => !isNaN(c))
    .sort((a, b) => a - b);  // Sort ascending
  
  if (parsedClasses.length === 0) {
    // No valid classes - fall back to mathematical rounding
    return Math.round(actualValue);
  }
  
  // NEAREST method: Find closest standard size
  let closestSize = parsedClasses[0];
  let minDifference = Math.abs(actualValue - closestSize);
  
  for (const size of parsedClasses) {
    const difference = Math.abs(actualValue - size);
    if (difference < minDifference) {
      minDifference = difference;
      closestSize = size;
    } else if (difference === minDifference) {
      // Equidistant - choose lower value (safer for fitment)
      closestSize = Math.min(closestSize, size);
    }
  }
  
  return closestSize;
}

/**
 * Round and format a size class value for display
 * @param actualValue - The actual measurement value
 * @param sizeClassConfig - Size class configuration
 * @param installationType - Optional installation type
 * @returns Formatted string (e.g., "48", "2-1/4", "385")
 * 
 * This combines rounding + formatting in one step for convenience.
 */
export function roundAndFormatSizeClass(
  actualValue: number,
  sizeClassConfig: CategorySizeClass | null,
  installationType?: string
): string {
  const rounded = roundToStandardSize(actualValue, sizeClassConfig, installationType);
  
  if (!sizeClassConfig) {
    return rounded.toString();
  }
  
  return formatSizeClass(rounded, sizeClassConfig.classes);
}

/**
 * Validate that a measurement matches a standard size class
 * @param value - The measurement value to validate
 * @param sizeClassConfig - Size class configuration
 * @param tolerance - Allowed deviation (default: 0.5 for inches, 0.1 for fractional)
 * @returns true if within tolerance of a standard size
 * 
 * Used for validation/warnings when products don't match standard sizes.
 */
export function isStandardSize(
  value: number,
  sizeClassConfig: CategorySizeClass | null,
  tolerance: number = 0.5
): boolean {
  if (!sizeClassConfig || !sizeClassConfig.has_measurement_class) {
    return true;  // No standards to validate against
  }
  
  const parsedClasses = sizeClassConfig.classes
    .map(c => parseSizeClass(c))
    .filter(c => !isNaN(c));
  
  // Check if value is within tolerance of any standard size
  return parsedClasses.some(standardSize => 
    Math.abs(value - standardSize) <= tolerance
  );
}
