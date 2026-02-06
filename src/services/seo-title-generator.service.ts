/**
 * SEO TITLE GENERATOR SERVICE (v2)
 * =================================
 * Generates SEO-optimized product titles using category-specific schemas.
 * 
 * FORMULA: BRAND + PRIMARY_SPEC + CONFIG/TYPE + INSTALL + CATEGORY + FINISH + (FEATURES)
 * 
 * Key changes from v1:
 * - Brand is ALWAYS first (highest SEO value)
 * - Model number REMOVED from title
 * - Features in parentheses at END (max 2-3)
 * - Category-specific slot ordering from schema
 * - Proper formatting (30-Inch, 28 Cu. Ft., 50,000 BTU)
 * 
 * Example outputs:
 * - "Samsung 28 Cu. Ft. French Door Counter-Depth Refrigerator Stainless Steel (Smart, Ice Maker)"
 * - "Wolf 48-Inch Dual Fuel Slide-In Range Stainless Steel (6 Burners, Griddle)"
 * - "Kohler 60-Inch Freestanding Bathtub White (Soaking, Center Drain)"
 * - "Moen Arbor Pull-Down Kitchen Faucet Spot Resist Stainless (MotionSense)"
 */

import logger from '../utils/logger';
import {
  getCategoryTitleSchema,
  FORMATTING_RULES,
  ATTRIBUTE_FORMATTERS,
  CategoryTitleSchema,
  TitleSlot
} from '../config/title-schema-by-category';

// Re-export types for backward compatibility
export { CategoryTitleSchema, TitleSlot };

/**
 * Input interface for SEO title generation
 */
export interface SEOTitleInput {
  brand?: string;
  modelNumber?: string; // Note: NOT used in title (kept for logging only)
  category: string;
  subCategory?: string;
  
  // Collection/Style
  collection?: string;
  style?: string;
  
  // Dimensions
  width?: string | number;
  height?: string | number;
  depth?: string | number;
  length?: string | number;
  diameter?: string | number;
  
  // Specs
  totalCapacity?: string | number;
  btu?: string | number;
  cfm?: string | number;
  gpm?: string | number;
  wattage?: string | number;
  powerKw?: string | number;
  horsepower?: string | number;
  production?: string | number; // lbs/day for icemakers
  dbaLevel?: string | number;
  mervRating?: string | number;
  bladeSpan?: string | number;
  aperture?: string | number;
  lightCount?: string | number;
  numberOfLights?: string | number; // Alias for lightCount
  numberOfBurners?: string | number; // For ranges/cooktops
  
  // Type/Configuration
  type?: string;
  configuration?: string;
  installationType?: string;
  mountType?: string;
  holeConfig?: string;
  bowlConfig?: string;
  bowlShape?: string;
  flushType?: string;
  feedType?: string;
  fuelType?: string;
  connectionSize?: string;
  filtrationLevel?: string;
  
  // Appearance
  finish?: string;
  color?: string;
  colorPattern?: string;
  material?: string;
  topMaterial?: string;
  
  // Additional
  colorTemp?: string;
  bulbType?: string;
  wattageEquivalent?: string | number;
  compatibility?: string;
  tileSize?: string;
  
  // Features (array of feature strings)
  features?: string[];
  
  // Raw title for fallback
  rawTitle?: string;
}

/**
 * Attribute name to input field mapping
 * Maps schema attribute names to SEOTitleInput field names
 */
const ATTRIBUTE_TO_FIELD: Record<string, keyof SEOTitleInput | string> = {
  'Brand': 'brand',
  'Category': 'category',
  'Collection': 'collection',
  'Collection/Style': 'collection',
  'Style': 'style',
  
  // Dimensions
  'Width (Inches)': 'width',
  'Width (Inches)*': 'width',
  'Height (Inches)': 'height',
  'Length (Inches)': 'length',
  'Diameter (Inches)': 'diameter',
  'Aperture (Inches)': 'aperture',
  'Size (Inches)': 'width', // Default to width
  'Blade Span (Inches)': 'bladeSpan',
  'Width/Length': 'width',
  'Length (Feet)': 'length',
  'Track Length (Feet)': 'length',
  'Dimensions (W×H)': 'dimensionsWxH', // Special handling
  
  // Specs
  'Capacity (Cu. Ft.)': 'totalCapacity',
  'BTU': 'btu',
  'BTU/Watts': 'btu',
  'Tonnage/BTU': 'btu',
  'CFM': 'cfm',
  'GPM/BTU': 'gpm',
  'dBA Level': 'dbaLevel',
  'Wattage': 'wattage',
  'Power (kW)': 'powerKw',
  'MERV Rating': 'mervRating',
  'Light Count': 'lightCount',
  'Horsepower': 'horsepower',
  'Production (lbs/day)': 'production',
  'Wattage Equivalent': 'wattageEquivalent',
  
  // Type/Configuration
  'Type': 'type',
  'Type/Size': 'type',
  'Configuration': 'configuration',
  'Installation Type': 'installationType',
  'Mount': 'mountType',
  'Mount Type': 'mountType',
  'Hole Config': 'holeConfig',
  'Bowl Config': 'bowlConfig',
  'Bowl Shape': 'bowlShape',
  'Flush Type': 'flushType',
  'Feed Type': 'feedType',
  'Fuel Type': 'fuelType',
  'Connection Size': 'connectionSize',
  'Filtration Level': 'filtrationLevel',
  'Shape': 'bowlShape',
  
  // Appearance
  'Finish': 'finish',
  'Finish/Color': 'finish',
  'Color': 'color',
  'Color/Finish': 'color',
  'Color/Pattern': 'colorPattern',
  'Material': 'material',
  'Top Material': 'topMaterial',
  'Color Temp': 'colorTemp',
  'Bulb Type': 'bulbType',
  
  // Other
  'Compatibility': 'compatibility',
  'Tile Size': 'tileSize',
  'Features': 'features',
  'Size': 'width',
  'Capacity/Size': 'totalCapacity',
  'Size/Volume': 'totalCapacity',
  'Diameter/Width': 'diameter',
};

/**
 * Get the raw value from input for a given attribute
 */
function getInputValue(input: SEOTitleInput, attribute: string): string | number | string[] | undefined {
  const fieldName = ATTRIBUTE_TO_FIELD[attribute];
  if (!fieldName) return undefined;
  
  // Special case for Category - use the category name, not category_id
  if (attribute === 'Category') {
    return input.category;
  }
  
  // Special case for Collection/Style - try collection first, then style
  if (attribute === 'Collection/Style') {
    return input.collection || input.style;
  }
  
  return (input as unknown as Record<string, unknown>)[fieldName] as string | number | string[] | undefined;
}

/**
 * Format a value according to its attribute type
 */
function formatValue(attribute: string, value: string | number | string[] | undefined, input?: SEOTitleInput): string {
  if (value === undefined || value === null) return '';
  
  // Handle features array specially
  if (attribute === 'Features' && Array.isArray(value)) {
    // Take max 3 features
    const filtered = value
      .filter(f => f && typeof f === 'string' && f.toLowerCase() !== 'not found')
      .slice(0, 3);
    return filtered.length > 0 ? `(${filtered.join(', ')})` : '';
  }
  
  // Handle Dimensions (W×H) specially
  if (attribute === 'Dimensions (W×H)' && input) {
    const width = input.width;
    const height = input.height;
    if (width && height) {
      return FORMATTING_RULES.dimensionsWxH(width, height);
    }
    return '';
  }
  
  // Handle Tile Size specially
  if (attribute === 'Tile Size' && typeof value === 'string') {
    return FORMATTING_RULES.tileSize(value);
  }
  
  // Check for formatter
  const formatterKey = ATTRIBUTE_FORMATTERS[attribute];
  if (formatterKey && FORMATTING_RULES[formatterKey]) {
    const formatter = FORMATTING_RULES[formatterKey] as (v: number | string) => string;
    return formatter(value as number | string);
  }
  
  // For string values, just convert and clean
  const strValue = String(value).trim();
  
  // Skip invalid values
  if (strValue.toLowerCase() === 'not found' || 
      strValue.toLowerCase() === 'n/a' ||
      strValue === '' ||
      strValue === 'undefined') {
    return '';
  }
  
  return strValue;
}

/**
 * MAIN FUNCTION: Generate SEO-optimized product title
 * 
 * Uses category-specific schema to determine slot order and formatting.
 * Falls back to generic formula if no schema exists.
 */
export function generateSEOTitle(input: SEOTitleInput): string {
  const categoryName = input.category || '';
  const schema = getCategoryTitleSchema(categoryName);
  
  let title: string;
  
  if (schema) {
    title = generateFromSchema(input, schema);
  } else {
    title = generateFallbackTitle(input);
  }
  
  // Clean up: normalize spaces, remove trailing punctuation
  title = title
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*$/, '')
    .replace(/\s*\(\s*\)\s*$/, '') // Remove empty parentheses
    .trim();
  
  // Enforce max length (150 chars absolute max)
  if (title.length > 150) {
    // Try to cut at a sensible point (before features)
    const parenIndex = title.lastIndexOf('(');
    if (parenIndex > 50) {
      title = title.substring(0, parenIndex).trim();
    } else {
      title = title.substring(0, 147) + '...';
    }
  }
  
  logger.debug('Generated SEO title (v2)', {
    category: categoryName,
    hasSchema: !!schema,
    brand: input.brand,
    generatedTitle: title,
    titleLength: title.length
  });
  
  return title;
}

/**
 * Generate title using category-specific schema
 */
function generateFromSchema(input: SEOTitleInput, schema: CategoryTitleSchema): string {
  const parts: string[] = [];
  
  // Sort slots by position
  const sortedSlots = [...schema.slots].sort((a, b) => a.position - b.position);
  
  for (const slot of sortedSlots) {
    const rawValue = getInputValue(input, slot.attribute);
    const formattedValue = formatValue(slot.attribute, rawValue, input);
    
    if (formattedValue) {
      parts.push(formattedValue);
    }
  }
  
  return parts.join(' ');
}

/**
 * Fallback title generation when no schema exists
 * Uses generic formula: Brand + Type + Category + Finish
 */
function generateFallbackTitle(input: SEOTitleInput): string {
  const parts: string[] = [];
  
  // 1. Brand (always first)
  if (input.brand) parts.push(input.brand);
  
  // 2. Type or Style
  const typeValue = input.type || input.style || input.configuration;
  if (typeValue && isValidValue(typeValue)) {
    parts.push(String(typeValue));
  }
  
  // 3. Category
  if (input.category) parts.push(input.category);
  
  // 4. Finish or Color
  const appearance = input.finish || input.color;
  if (appearance && isValidValue(appearance)) {
    parts.push(String(appearance));
  }
  
  // 5. Features (if any)
  if (input.features && input.features.length > 0) {
    const validFeatures = input.features
      .filter(f => f && typeof f === 'string' && isValidValue(f))
      .slice(0, 2);
    if (validFeatures.length > 0) {
      parts.push(`(${validFeatures.join(', ')})`);
    }
  }
  
  return parts.join(' ');
}

/**
 * Check if a value is valid (not empty, not "not found", not "n/a")
 */
function isValidValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  const str = String(value).toLowerCase().trim();
  return str !== '' && str !== 'not found' && str !== 'n/a' && str !== 'undefined';
}

/**
 * Detect if a field value contains variant information
 * Example: "Gallon (#10208), Quart (#10210), Pint (#10212)" -> should be variants
 */
export function detectVariantData(fieldName: string, value: string): {
  isVariantData: boolean;
  variants?: Array<{ name: string; modelNumber: string }>;
} {
  if (!value || typeof value !== 'string') {
    return { isVariantData: false };
  }
  
  // Pattern: "Name (#ModelNumber)" repeated with commas
  const variantPattern = /([^,()]+)\s*\(#?([A-Z0-9-]+)\)/gi;
  const matches = [...value.matchAll(variantPattern)];
  
  if (matches.length >= 2) {
    const variants = matches.map(m => ({
      name: m[1].trim(),
      modelNumber: m[2].trim()
    }));
    
    logger.warn('Detected variant data in non-variant field', {
      fieldName,
      value,
      detectedVariants: variants.length
    });
    
    return {
      isVariantData: true,
      variants
    };
  }
  
  return { isVariantData: false };
}

/**
 * Get SEO keywords for a category (for AI prompt enhancement)
 */
export function getSEOKeywordsForCategory(category: string): string[] {
  const CATEGORY_SEO_KEYWORDS: Record<string, string[]> = {
    // Appliances
    'refrigerator': ['Energy Star', 'Smart', 'Counter Depth', 'French Door', 'Stainless Steel'],
    'range': ['Gas', 'Electric', 'Dual Fuel', 'Convection', 'Self-Cleaning'],
    'oven': ['Wall Oven', 'Convection', 'Smart', 'Double', 'Steam'],
    'dishwasher': ['Quiet', 'Energy Star', 'Third Rack', 'Built-In', 'Smart'],
    'microwave': ['Over-the-Range', 'Countertop', 'Built-In', 'Convection', 'Smart'],
    'washer': ['Front Load', 'Top Load', 'Steam', 'Smart', 'Large Capacity'],
    'dryer': ['Gas', 'Electric', 'Steam', 'Smart', 'Large Capacity'],
    'freezer': ['Upright', 'Chest', 'Frost Free', 'Energy Star'],
    
    // Lighting
    'chandelier': ['Crystal', 'Modern', 'Traditional', 'LED', 'Dimmable'],
    'pendant': ['Island', 'Mini', 'LED', 'Industrial', 'Modern'],
    'sconce': ['Wall Sconce', 'LED', 'Indoor', 'Outdoor', 'Dimmable'],
    'flush mount': ['LED', 'Low Profile', 'Modern', 'Dimmable'],
    'ceiling fan': ['Remote Control', 'LED', 'Outdoor', 'Quiet', 'Smart'],
    'vanity light': ['LED', 'Bathroom', 'Modern', 'Dimmable'],
    
    // Plumbing
    'faucet': ['Touchless', 'Pull-Down', 'Single Handle', 'High Arc', 'Commercial'],
    'toilet': ['Dual Flush', 'One Piece', 'Elongated', 'Comfort Height', 'Water Saving'],
    'sink': ['Undermount', 'Farmhouse', 'Double Bowl', 'Stainless Steel', 'Granite'],
    'shower': ['Rain', 'Handheld', 'Dual', 'Thermostatic', 'Body Spray'],
    'bathtub': ['Freestanding', 'Soaking', 'Whirlpool', 'Alcove', 'Drop-In'],
    
    // HVAC
    'air conditioner': ['Portable', 'Window', 'Mini Split', 'Smart', 'Energy Star'],
    'heater': ['Tankless', 'Electric', 'Gas', 'Radiant', 'Smart'],
    'fan': ['Ceiling', 'Exhaust', 'Bathroom', 'Quiet', 'Energy Star'],
  };
  
  const lower = category.toLowerCase();
  return CATEGORY_SEO_KEYWORDS[lower] || [];
}

/**
 * Get the primary category group for title generation
 */
function getCategoryGroup(category: string): string {
  const lower = category.toLowerCase();
  
  if (['refrigerator', 'range', 'oven', 'dishwasher', 'microwave', 'washer', 'dryer', 'freezer', 'cooktop', 'hood'].some(c => lower.includes(c))) {
    return 'appliance';
  }
  
  if (['chandelier', 'pendant', 'sconce', 'flush mount', 'ceiling fan', 'vanity light', 'lantern', 'lamp', 'track', 'recessed'].some(c => lower.includes(c))) {
    return 'lighting';
  }
  
  if (['faucet', 'toilet', 'sink', 'shower', 'bathtub', 'tub', 'valve', 'drain'].some(c => lower.includes(c))) {
    return 'plumbing';
  }
  
  if (['air conditioner', 'heater', 'furnace', 'thermostat', 'ventilation', 'exhaust'].some(c => lower.includes(c))) {
    return 'hvac';
  }
  
  if (['mirror', 'cabinet', 'vanity', 'shelf', 'storage'].some(c => lower.includes(c))) {
    return 'furniture';
  }
  
  return 'general';
}

export default {
  generateSEOTitle,
  detectVariantData,
  getSEOKeywordsForCategory,
  getCategoryGroup
};
